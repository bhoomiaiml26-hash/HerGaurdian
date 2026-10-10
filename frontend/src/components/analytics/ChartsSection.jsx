import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#8C3737", "#A8483B", "#66222F", "#A85C12", "#286646"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-[#EDE6E2] bg-white px-3 py-2 shadow-xs text-xs">
        {label && <p className="font-semibold text-[#1E1B18] mb-1">{label}</p>}
        <p className="text-[#8C3737] font-medium">
          {payload[0].name ? `${payload[0].name}: ` : ""}
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const ChartsSection = ({
  favoritesByModule = [],
  remindersByCategory = [],
  activity7Days = [],
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Module Distribution */}
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 sm:p-6 shadow-xs">
        <h3 className="mb-4 font-serif text-base font-bold text-[#1E1B18]">
          Saved Protocols by Domain
        </h3>
        {favoritesByModule.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={favoritesByModule}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                paddingAngle={4}
              >
                {favoritesByModule.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-56 items-center justify-center text-xs text-[#78726B]">
            No categorized records
          </div>
        )}
      </div>

      {/* Reminders by Category */}
      <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 sm:p-6 shadow-xs">
        <h3 className="mb-4 font-serif text-base font-bold text-[#1E1B18]">
          Alert Schedule Distribution
        </h3>
        {remindersByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={remindersByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE6E2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78726B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78726B" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8C3737" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-56 items-center justify-center text-xs text-[#78726B]">
            No active schedules
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="lg:col-span-2 rounded-xl border border-[#EDE6E2] bg-white p-5 sm:p-6 shadow-xs">
        <h3 className="mb-4 font-serif text-base font-bold text-[#1E1B18]">
          Platform Interaction Cadence (Last 7 Days)
        </h3>
        {activity7Days.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activity7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE6E2" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#78726B" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78726B" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8C3737"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#8C3737" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-44 items-center justify-center text-xs text-[#78726B]">
            No activity telemetry recorded
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartsSection;
