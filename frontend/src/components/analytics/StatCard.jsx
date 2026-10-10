const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#78726B]">{title}</p>
          <p className="mt-2 font-serif text-2xl font-bold text-[#1E1B18] tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#F6EFEA] text-[#8C3737]">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
