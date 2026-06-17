export interface ActivityItem {
  _id: string;
  message: string;
  createdAt: string;
  read?: boolean;
  type?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
  title?: string;
  emptyMessage?: string;
  onMarkRead?: (id: string) => void;
}

export default function ActivityFeed({
  items,
  loading = false,
  title = 'Recent Activity',
  emptyMessage = 'No recent activity',
  onMarkRead,
}: ActivityFeedProps) {
  return (
    <section className="bg-[#131b2e] border border-slate-800/60 rounded-[16px] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-tight">{title}</h3>
        {!loading && (
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            {items.filter((i) => !i.read).length} unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-900/50 rounded-[12px] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs font-semibold text-slate-500 text-center py-8 uppercase tracking-wider">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {items.slice(0, 8).map((item) => (
            <li
              key={item._id}
              className={`flex items-start gap-3 p-3 rounded-[12px] border transition-colors ${
                item.read
                  ? 'bg-slate-900/20 border-slate-800/40'
                  : 'bg-blue-950/20 border-blue-900/30'
              }`}
            >
              <span
                className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.read ? 'bg-slate-600' : 'bg-blue-400'}`}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 leading-relaxed">{item.message}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
              {!item.read && onMarkRead && (
                <button
                  type="button"
                  onClick={() => onMarkRead(item._id)}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase shrink-0"
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
