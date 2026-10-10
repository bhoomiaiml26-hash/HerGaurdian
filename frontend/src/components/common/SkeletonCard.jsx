function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xs">
      <div className="h-4 w-24 rounded bg-[#EDE6E2]" />
      <div className="mt-4 h-5 w-3/4 rounded bg-[#EDE6E2]" />
      <div className="mt-3 h-3.5 w-full rounded bg-[#F6EFEA]" />
      <div className="mt-2 h-3.5 w-5/6 rounded bg-[#F6EFEA]" />
      <div className="mt-6 flex justify-between">
        <div className="h-8 w-24 rounded-lg bg-[#EDE6E2]" />
        <div className="h-8 w-8 rounded-lg bg-[#EDE6E2]" />
      </div>
    </div>
  );
}

export default SkeletonCard;
