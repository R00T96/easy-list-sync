// components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) { console.error("UI error:", err); }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="container px-4 py-8">
          <div className="rounded-lg border p-6 bg-muted/30">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">Try refreshing the page.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
