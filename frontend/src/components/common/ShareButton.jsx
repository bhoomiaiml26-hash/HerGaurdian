import toast from 'react-hot-toast';
import { Share2 } from 'lucide-react';

function ShareButton({ title, text, url, className = '' }) {
  const handleShare = async () => {
    const shareData = { title, text, url };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully');
        return;
      } catch (error) {
        if (error.name !== 'AbortError') {
          toast.error('Unable to share right now');
        }
      }
    }

    try {
      const shareText = `${title ? `${title}\n` : ''}${text}${url ? `\n${url}` : ''}`;
      await navigator.clipboard.writeText(shareText);
      toast.success('Resource link copied to clipboard');
    } catch (err) {
      toast.error('Share action failed. Please try again.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3.5 py-2 text-xs font-semibold text-[#4F4A45] transition hover:bg-[#F6EFEA] hover:text-[#1E1B18] ${className}`}
    >
      <Share2 className="h-3.5 w-3.5 text-[#78726B]" />
      <span>Share Resource</span>
    </button>
  );
}

export default ShareButton;
