import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleDisconnect = () => {
    try {
      localStorage.removeItem("axiodb_session");
      if (window.electronAPI?.clearCookies) {
        window.electronAPI.clearCookies();
      }
    } catch {
      // ignore
    }
    window.location.hash = "#/";
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || "An unexpected rendering error occurred.";
      const errorStack = this.state.error?.stack || this.state.errorInfo?.componentStack || "";

      return (
        <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800 font-sans select-none">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center">
            {/* Warning Icon */}
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-1">Application Error</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              AxioDB Control encountered a problem while rendering this view. Your databases and server data remain safe.
            </p>

            {/* Error message card */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left mb-4">
              <p className="text-xs font-mono text-red-800 font-semibold break-words">{errorMsg}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-2.5 mb-4">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs"
              >
                Reload View
              </button>
              <button
                type="button"
                onClick={this.handleDisconnect}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all"
              >
                Return to Connection Hub
              </button>
            </div>

            {/* Collapsible Details */}
            {errorStack && (
              <details className="text-left group">
                <summary className="text-[11px] font-mono text-slate-400 hover:text-slate-600 cursor-pointer select-none">
                  Show stack trace
                </summary>
                <pre className="mt-2 p-2.5 rounded bg-slate-900 text-slate-200 text-[10px] font-mono overflow-auto max-h-40 leading-tight">
                  {errorStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
