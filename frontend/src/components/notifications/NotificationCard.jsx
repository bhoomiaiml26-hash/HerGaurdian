import { Trash2, CheckCircle2 } from "lucide-react";

function NotificationCard({ n, onMarkRead, onDelete }) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        n.read
          ? "border-[#EDE6E2] bg-white text-[#4F4A45]"
          : "border-[#8C3737]/25 bg-[#F6EFEA]/40 text-[#1E1B18] shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {!n.read && (
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#8C3737]" aria-label="Unread" />
          )}
          <div>
            <div className="font-serif text-sm font-bold text-[#1E1B18] leading-tight">
              {n.title}
            </div>
            <div className="mt-1 text-[11px] text-[#78726B]">
              {new Date(n.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!n.read && (
            <button
              onClick={() => onMarkRead(n._id)}
              title="Mark as read"
              className="rounded-md p-1.5 text-[#78726B] transition hover:bg-white hover:text-[#286646]"
              aria-label="Mark as read"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(n._id)}
            title="Delete notification"
            className="rounded-md p-1.5 text-[#78726B] transition hover:bg-[#FDF2F2] hover:text-[#BA2626]"
            aria-label="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2.5 text-xs leading-relaxed text-[#4F4A45] pl-4.5">
        {n.message}
      </div>
    </div>
  );
}

export default NotificationCard;
