export function PageBanner({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-brand-800">
      <div className="pattern-dots absolute inset-0 opacity-50" />
      <div className="absolute -top-24 right-0 size-80 rounded-full bg-gold-400/15 blur-3xl" />
      <div className="container-page relative py-12 sm:py-14">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-brand-100">{text}</p>
        {children}
      </div>
    </section>
  );
}
