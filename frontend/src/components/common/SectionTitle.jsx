function SectionTitle({ title, themeColor = "text-[#1E1B18]", subtitle, subtitleClassName = "text-[#4F4A45]" }) {
  return (
    <div className="mb-8">
      <h1 className={`mb-2 font-serif text-2xl font-bold tracking-tight sm:text-3xl ${themeColor}`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`max-w-2xl text-xs sm:text-sm leading-relaxed ${subtitleClassName}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default SectionTitle;
