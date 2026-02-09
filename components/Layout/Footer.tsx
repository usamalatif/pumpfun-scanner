export function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>PumpFun Token Analytics Dashboard</p>
        <p>
          Data sourced from{' '}
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline-offset-4 hover:underline"
          >
            pump.fun
          </a>
        </p>
      </div>
    </footer>
  );
}
