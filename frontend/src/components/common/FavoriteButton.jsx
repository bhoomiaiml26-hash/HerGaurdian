import { Heart } from "lucide-react";

function FavoriteButton({ isFavorite, onToggle, className = "" }) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-lg border border-[#EDE6E2] p-2 transition hover:bg-[#F6EFEA] ${className}`}
      aria-label="Toggle favorite"
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-[#8C3737] text-[#8C3737]" : "text-[#78726B]"}`} />
    </button>
  );
}

export default FavoriteButton;
