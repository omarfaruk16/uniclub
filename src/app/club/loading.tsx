export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-xl bg-brand-100" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
      </div>
      <div className="card h-72 animate-pulse" />
    </div>
  );
}
