import { LoaderCircle } from "lucide-react";

function LoadingSpinner({ label = "Loading...", className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 py-6 text-sm font-medium text-[#4F4A45] ${className}`} role="status" aria-live="polite">
      <LoaderCircle className="h-4 w-4 animate-spin text-[#8C3737]" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingSpinner;
