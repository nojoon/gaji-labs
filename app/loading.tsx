export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span>화면을 불러오는 중...</span>
      </div>
    </div>
  );
}
