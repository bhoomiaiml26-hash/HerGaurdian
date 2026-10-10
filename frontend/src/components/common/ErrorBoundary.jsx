import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught render error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-white rounded-xl border border-[#EDE6E2] shadow-xs my-6">
          <div className="w-12 h-12 rounded-full bg-[#FDF2F2] flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[#BA2626]" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#1E1B18] mb-2">
            Something went wrong while rendering this section
          </h2>
          <p className="text-sm text-[#4F4A45] max-w-md mb-4 leading-relaxed">
            {this.state.error?.message || "An unexpected error occurred. You can retry loading this component or return to the overview."}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-[#8C3737] hover:opacity-90 transition shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={() => {
                this.handleReset();
                window.location.href = "/dashboard";
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-[#1E1B18] bg-[#F6EFEA] hover:bg-[#EDE6E2] transition"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Go to Overview</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
