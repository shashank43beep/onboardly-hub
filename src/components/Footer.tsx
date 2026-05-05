import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Onboardly. Crafted for modern agencies.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/about" className="hover:text-foreground">About</Link>
        </div>
      </div>
    </footer>
  );
}
