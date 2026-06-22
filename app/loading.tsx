export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div
          aria-hidden="true"
          className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
        <p className="font-label-caps text-label-caps text-on-surface-variant">
          Cargando…
        </p>
      </div>
    </main>
  );
}
