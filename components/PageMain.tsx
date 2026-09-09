export function PageMain({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-4xl px-4 py-5 pb-28 md:py-10 md:pb-10">{children}</main>;
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{children}</h1>;
}

export function PageLead({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-sm leading-6 text-slate-500 md:text-base">{children}</p>;
}
