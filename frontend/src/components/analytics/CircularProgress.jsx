const CircularProgress = ({ score = 75, size = 140 }) => {
  const radius = 54;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg height={size} width={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#8C3737" />
            <stop offset="100%" stopColor="#A8483B" />
          </linearGradient>
        </defs>
        <circle
          stroke="#EDE6E2"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="url(#scoreGrad)"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="font-serif text-2xl font-bold fill-current text-[#1E1B18]"
          style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%" }}
        >
          <tspan>{score}</tspan>
          <tspan fontSize="13" className="font-sans font-medium text-[#78726B]">%</tspan>
        </text>
      </svg>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#78726B]">
        Weekly Health Index
      </p>
    </div>
  );
};

export default CircularProgress;
