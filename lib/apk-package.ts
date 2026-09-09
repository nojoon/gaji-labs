export const EXPECTED_APK_PACKAGE = 'io.gajida.labs';

function indexOf(haystack: Uint8Array, needle: number[], start = 0) {
  outer: for (let i = start; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function readU16(buf: Uint8Array, offset: number) {
  return buf[offset] | (buf[offset + 1] << 8);
}

function readU32(buf: Uint8Array, offset: number) {
  return (buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24)) >>> 0;
}

async function inflateRaw(data: Uint8Array) {
  if (typeof DecompressionStream === 'undefined') return null;
  const body = new Response(data as unknown as BodyInit).body;
  if (!body) return null;
  const stream = body.pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflateZipEntry(apk: Uint8Array, fileName: string) {
  const sig = [0x50, 0x4b, 0x03, 0x04];
  let offset = 0;
  while (offset < apk.length - 30) {
    const at = indexOf(apk, sig, offset);
    if (at < 0) return null;
    const method = readU16(apk, at + 8);
    const compSize = readU32(apk, at + 18);
    const nameLen = readU16(apk, at + 26);
    const extraLen = readU16(apk, at + 28);
    const nameStart = at + 30;
    const name = new TextDecoder().decode(apk.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    if (name === fileName) {
      const compressed = apk.subarray(dataStart, dataStart + compSize);
      if (method === 0) return compressed;
      if (method === 8) return inflateRaw(compressed);
      return null;
    }
    offset = dataStart + Math.max(compSize, 1);
  }
  return null;
}

function collectPackageLikeStrings(manifest: Uint8Array) {
  const found = new Set<string>();
  const text = new TextDecoder('utf-8', { fatal: false }).decode(manifest);
  for (const item of text.match(/[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)+/g) || []) {
    found.add(item);
  }

  for (let i = 0; i < manifest.length - 3; i++) {
    if (manifest[i] === 0 || manifest[i + 1] !== 0) continue;
    let chars = '';
    let j = i;
    while (j + 1 < manifest.length && manifest[j] >= 32 && manifest[j] < 127 && manifest[j + 1] === 0) {
      chars += String.fromCharCode(manifest[j]);
      j += 2;
    }
    if (/^[a-zA-Z][\w]*(\.[a-zA-Z][\w]*)+$/.test(chars)) found.add(chars);
    if (j > i) i = j - 1;
  }

  return [...found].filter((item) => {
    if (item.startsWith('android.') || item.startsWith('com.android.')) return false;
    if (item.includes('permission') || item.includes('hardware') || item.includes('intent')) return false;
    return item.split('.').length >= 3;
  });
}

export async function extractApkPackageName(file: File): Promise<string | null> {
  try {
    const slice = file.slice(0, Math.min(file.size, 16 * 1024 * 1024));
    const apk = new Uint8Array(await slice.arrayBuffer());
    if (apk[0] !== 0x50 || apk[1] !== 0x4b) return null;
    const manifest = await inflateZipEntry(apk, 'AndroidManifest.xml');
    if (!manifest) return null;
    const packages = collectPackageLikeStrings(manifest);
    if (packages.includes(EXPECTED_APK_PACKAGE)) return EXPECTED_APK_PACKAGE;
    return packages[0] || null;
  } catch {
    return null;
  }
}

export function apkPackageError(packageName: string | null) {
  if (!packageName) return null;
  if (packageName === EXPECTED_APK_PACKAGE) return null;
  return `잘못된 APK입니다. 패키지 이름이 ${EXPECTED_APK_PACKAGE} 여야 합니다.`;
}
