function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  activeClassName = "bg-[#8C3737] text-white shadow-xs font-semibold",
  inactiveClassName = "bg-white text-[#4F4A45] border border-[#EDE6E2] hover:bg-[#F6EFEA]"
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2" aria-label="Category filters">
      {categories.map((item) => (
        <button
          key={item}
          onClick={() => onCategoryChange(item)}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition duration-150 ${
            selectedCategory === item ? activeClassName : inactiveClassName
          }`}
          aria-pressed={selectedCategory === item}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
