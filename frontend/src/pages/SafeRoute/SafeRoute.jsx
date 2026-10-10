import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Route, ShieldAlert, Navigation, X, AlertTriangle, Plus, Layers, Loader2,
  LocateFixed, Clock, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, ArrowUp,
  Undo2, CircleDot, Merge, GitBranch, TrendingUp, MoveUpRight, Info,
} from "lucide-react";
import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, CircleMarker, useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";
import api from "../../services/api";

// ─── Leaflet icon fix ────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const createPinIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="white"/>
    </svg>`,
    iconSize:   [28, 36],
    iconAnchor: [14, 36],
    popupAnchor:[0, -36],
  });

const ORIGIN_ICON = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#1A73E8;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -10],
});

const DESTINATION_ICON = createPinIcon("#EA4335");

const HEATMAP_COLORS = {
  low:       "#4CAF50",
  medium:    "#FFC107",
  high:      "#FF9800",
  "very-high": "#F44336",
};

const ROUTE_COLORS = {
  recommended: "#22c55e",
  alternate0:  "#f59e0b",
  alternate1:  "#3b82f6",
  alternate2:  "#8b5cf6",
  alternate3:  "#ec4899",
  alternate4:  "#06b6d4",
};

// Maneuver icon mapper (matches backend getManeuverIcon)
const MANEUVER_ICONS = {
  MoveUpRight: MoveUpRight,
  MapPin: MapPin,
  ArrowLeft: ArrowLeft,
  ArrowRight: ArrowRight,
  ArrowUp: ArrowUp,
  Undo2: Undo2,
  CircleDot: CircleDot,
  Merge: Merge,
  GitBranch: GitBranch,
  TrendingUp: TrendingUp,
  Navigation: Navigation,
};

function getManeuverIcon(type, modifier) {
  if (type === 'depart') return MANEUVER_ICONS.MoveUpRight;
  if (type === 'arrive') return MANEUVER_ICONS.MapPin;
  if (type === 'turn') {
    if (modifier?.includes('left')) return MANEUVER_ICONS.ArrowLeft;
    if (modifier?.includes('right')) return MANEUVER_ICONS.ArrowRight;
    if (modifier === 'straight') return MANEUVER_ICONS.ArrowUp;
    if (modifier === 'uturn') return MANEUVER_ICONS.Undo2;
  }
  if (type === 'roundabout' || type === 'rotary') return MANEUVER_ICONS.CircleDot;
  if (type === 'merge') return MANEUVER_ICONS.Merge;
  if (type === 'fork') return MANEUVER_ICONS.GitBranch;
  if (type === 'on ramp' || type === 'off ramp') return MANEUVER_ICONS.TrendingUp;
  if (type === 'new name' || type === 'continue') return MANEUVER_ICONS.ArrowUp;
  return MANEUVER_ICONS.Navigation;
}

// ─── Map helpers ─────────────────────────────────────────────────────────────

function MapClickHandler({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    map.on("click", (e) => onMapClick(e.latlng));
    return () => { map.off("click"); };
  }, [map, onMapClick]);
  return null;
}

function MapFitBounds({ bounds, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled || !bounds || bounds.length < 2) return;
    try {
      map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 16 });
    } catch {/* ignore degenerate bounds */}
  }, [map, bounds, enabled]);
  return null;
}

// ─── LocationInput ────────────────────────────────────────────────────────────
function LocationInput({ label, value, onSelect, onClear, icon: Icon, showLocateMe, isActive, onActivate }) {
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState([]);
  const [status, setStatus]       = useState("idle");
  const debounceRef               = useRef(null);
  const wrapperRef                = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setResults([]);
        setStatus("idle");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // query is cleared imperatively inside handleSelect and handleChange —
  // no effect needed here.

  const runSearch = useCallback(async (q) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    try {
      const resp = await api.get("/geocode/search", { params: { q: q.trim() } });
      if (resp.data.success) {
        if (resp.data.data.length === 0) {
          setStatus("no-results");
          setResults([]);
        } else {
          setStatus("idle");
          setResults(resp.data.data);
        }
      }
    } catch (err) {
      const code = err.response?.status;
      if (code === 429) {
        setStatus("rate-limited");
      } else {
        setStatus("error");
      }
      setResults([]);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onActivate();

    if (value) onClear();

    clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setStatus("idle");
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(val), 420);
  };

  const handleSelect = (result) => {
    onSelect(result);
    setQuery("");
    setResults([]);
    setStatus("idle");
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    toast.loading("Getting your location…", { id: "locate" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss("locate");
        onSelect({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: "My Location",
          displayName: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        });
        setQuery("");
      },
      () => {
        toast.dismiss("locate");
        toast.error("Couldn't get your location. Check browser permissions.");
      },
      { timeout: 10000 }
    );
  };

  const displayValue = value ? value.name : query;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-1.5 block text-xs font-semibold text-[#4F4A45]">{label}</label>
      <div className={`flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 transition-shadow ${
        isActive ? "border-[#8C3737] ring-2 ring-[#8C3737]/20" : "border-[#EDE6E2]"
      }`}>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${value ? "text-[#8C3737]" : "text-[#B0A8A2]"}`} />
        <input
          type="text"
          placeholder={`Search ${label.toLowerCase()}…`}
          value={displayValue}
          onChange={handleChange}
          onFocus={onActivate}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#1E1B18] placeholder:text-[#B0A8A2] focus:outline-none"
        />
        {status === "loading" && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#8C3737]" />
        )}
        {value && (
          <button onClick={onClear} className="rounded p-0.5 text-[#B0A8A2] hover:text-[#8C3737]">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {showLocateMe && !value && (
          <button
            onClick={handleLocateMe}
            title="Use my current location"
            className="rounded p-0.5 text-[#B0A8A2] hover:text-[#8C3737]"
          >
            <LocateFixed className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {(results.length > 0 || (isActive && status !== "idle" && status !== "loading")) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full z-[9999] mt-1 max-h-56 overflow-y-auto rounded-lg border border-[#EDE6E2] bg-white shadow-lg"
          >
            {results.map((r, i) => (
              <button
                key={i}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
                className="flex w-full flex-col gap-0.5 border-b border-[#F3EDE8] px-3 py-2.5 text-left last:border-0 hover:bg-[#F6EFEA]"
              >
                <span className="text-sm font-medium text-[#1E1B18] leading-tight">{r.name}</span>
                <span className="truncate text-[11px] text-[#78726B] leading-tight">{r.displayName}</span>
              </button>
            ))}

            {status === "no-results" && (
              <div className="px-3 py-3 text-center text-xs text-[#78726B]">
                No places found. Try a different spelling or nearby landmark.
              </div>
            )}
            {status === "rate-limited" && (
              <div className="px-3 py-3 text-center text-xs text-[#FF9800]">
                Search is temporarily rate-limited. Wait a moment and try again.
              </div>
            )}
            {status === "error" && (
              <div className="px-3 py-3 text-center text-xs text-[#BA2626]">
                Search unavailable right now. You can still click the map to set a location.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function SafeRoute() {
  const [origin,      setOrigin]      = useState(null);
  const [destination, setDestination] = useState(null);
  const [activeInput, setActiveInput] = useState(null);
  const [travelTime,  setTravelTime]  = useState(new Date().getHours()); // hour 0-23

  const [routes,        setRoutes]        = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [routeBounds,   setRouteBounds]   = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [expandedRoute, setExpandedRoute] = useState(null); // NEW: for risk breakdown

  const [showHeatmap,  setShowHeatmap]  = useState(false);
  const [heatmapData,  setHeatmapData]  = useState([]);

  const [isCalculating, setIsCalculating] = useState(false);

  const [isReporting,        setIsReporting]        = useState(false);
  const [reportForm,         setReportForm]          = useState({ lat: null, lng: null, category: "", severity: 1 });
  const [isSubmittingReport, setIsSubmittingReport]  = useState(false);

  const [routeCount, setRouteCount] = useState(0); // NEW: track number of routes

  // ── heatmap ──────────────────────────────────────────────────────────────
  const fetchHeatmapData = async () => {
    try {
      const res = await api.get("/safety/heatmap");
      if (res.data.success) setHeatmapData(res.data.data);
    } catch { /* non-critical */ }
  };

  useEffect(() => {
    let live = true;
    api.get("/safety/heatmap")
      .then((res) => { if (live && res.data.success) setHeatmapData(res.data.data); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  // ── map click ─────────────────────────────────────────────────────────────
  const handleMapClick = useCallback((latlng) => {
    const loc = {
      lat: latlng.lat,
      lng: latlng.lng,
      name: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
      displayName: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`,
    };
    if (activeInput === "origin") {
      setOrigin(loc);
      toast.success("Origin pinned on map");
      setActiveInput(null);
    } else if (activeInput === "destination") {
      setDestination(loc);
      toast.success("Destination pinned on map");
      setActiveInput(null);
    }
  }, [activeInput]);

  // ── route calculation ─────────────────────────────────────────────────────
  const handleFindSafeRoute = async (targetHour = travelTime) => {
    if (!origin || !destination) {
      toast.error("Please set both origin and destination");
      return;
    }
    setIsCalculating(true);
    setRouteBounds(null);
    setShowDirections(false);
    try {
      const chosenHour = typeof targetHour === "number" ? targetHour : travelTime;
      const res = await api.post("/safety/safe-route", {
        origin,
        destination,
        travelTime: chosenHour,
      });
      if (res.data.success) {
        const fetched = res.data.data.routes;
        setRoutes(fetched);
        setSelectedRoute(0);
        setRouteCount(res.data.data.routeCount || fetched.length);

        if (fetched.length > 0 && fetched[0].coordinates?.length > 0) {
          setRouteBounds(fetched[0].coordinates.map((c) => [c.lat, c.lng]));
        }

        toast.success(`Evaluated ${fetched.length} real-road route option${fetched.length !== 1 ? "s" : ""}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to calculate route. Please try again.";
      toast.error(msg);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleTimeChange = (newHour) => {
    setTravelTime(newHour);
    if (origin && destination && routes.length > 0) {
      handleFindSafeRoute(newHour);
    }
  };

  // ── route card click ──────────────────────────────────────────────────────
  const handleSelectRoute = (idx) => {
    setSelectedRoute(idx);
    if (routes[idx]?.coordinates?.length > 0) {
      setRouteBounds(routes[idx].coordinates.map((c) => [c.lat, c.lng]));
    }
  };

  // ── polyline style ────────────────────────────────────────────────────────
  const getPolylineStyle = (route, idx) => {
    const isSelected = idx === selectedRoute;
    let color;
    if (route.recommended) color = ROUTE_COLORS.recommended;
    else if (idx === 1)    color = ROUTE_COLORS.alternate0;
    else if (idx === 2)    color = ROUTE_COLORS.alternate1;
    else if (idx === 3)    color = ROUTE_COLORS.alternate2;
    else if (idx === 4)    color = ROUTE_COLORS.alternate3;
    else                   color = ROUTE_COLORS.alternate4;

    return {
      color,
      weight:  isSelected ? 6 : 4,
      opacity: isSelected ? 1 : 0.6,
      dashArray: route.recommended ? undefined : "6 4",
    };
  };

  // ── incident report ───────────────────────────────────────────────────────
  const handleReportIncident = async () => {
    if (!reportForm.lat || !reportForm.lng || !reportForm.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmittingReport(true);
    try {
      const res = await api.post("/safety/report", reportForm);
      if (res.data.success) {
        toast.success("Incident reported anonymously. Thank you for making our community safer.");
        setIsReporting(false);
        setReportForm({ lat: null, lng: null, category: "", severity: 1 });
        fetchHeatmapData();
      }
    } catch {
      toast.error("Failed to report incident. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // ── formatters ────────────────────────────────────────────────────────────
  const formatDistance = (m) =>
    m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;

  const formatDuration = (s) => {
    if (s < 60)   return `${Math.round(s)}s`;
    if (s < 3600) return `${Math.round(s / 60)} min`;
    return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}min`;
  };

  const getTimeLabel = (hour) => {
    if (hour >= 6 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    if (hour >= 21 && hour < 24) return 'Night';
    return 'Late Night'; // 0-5
  };

  const mapHint = activeInput
    ? `Click anywhere on the map to set your ${activeInput}`
    : null;

  return (
    <div className="min-h-screen bg-[#FBF9F7] text-[#1E1B18]">
      <div className="mx-auto max-w-6xl space-y-5 p-5 sm:p-6">

        {/* ── Header ── */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-5 sm:p-7 shadow-xs">
          <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#F6EFEA] px-2.5 py-1 text-xs font-semibold text-[#8C3737]">
            <ShieldAlert className="h-3.5 w-3.5" />
            Safety &amp; Navigation
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1E1B18] sm:text-3xl">
            Safe Route Planner
          </h1>
          <p className="mt-1 text-xs text-[#4F4A45] sm:text-sm">
            Plan safer routes using crowd-sourced safety data. Report incidents anonymously to help others.
          </p>
        </div>

        {/* ── Search + Controls ── */}
        <div className="rounded-xl border border-[#EDE6E2] bg-white p-4 shadow-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]">

            <LocationInput
              label="Origin"
              value={origin}
              onSelect={setOrigin}
              onClear={() => setOrigin(null)}
              icon={MapPin}
              showLocateMe
              isActive={activeInput === "origin"}
              onActivate={() => setActiveInput("origin")}
            />

            <LocationInput
              label="Destination"
              value={destination}
              onSelect={setDestination}
              onClear={() => setDestination(null)}
              icon={Navigation}
              showLocateMe={false}
              isActive={activeInput === "destination"}
              onActivate={() => setActiveInput("destination")}
            />

            {/* Time picker */}
            <div className="flex items-end">
              <div className="w-full">
                <label className="mb-1.5 block text-xs font-semibold text-[#4F4A45]">Travel Time</label>
                <div className="flex items-center gap-1.5 rounded-lg border border-[#EDE6E2] bg-white px-3 py-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#B0A8A2]" />
                  <select
                    value={travelTime}
                    onChange={(e) => handleTimeChange(parseInt(e.target.value, 10))}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#1E1B18] focus:outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00 ({getTimeLabel(i)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Find Safe Route */}
            <div className="flex items-end">
              <button
                onClick={() => handleFindSafeRoute(travelTime)}
                disabled={!origin || !destination || isCalculating}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8C3737] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#752B2B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCalculating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Calculating…</>
                ) : (
                  <><Route className="h-4 w-4" /> Find Route</>
                )}
              </button>
            </div>

            {/* Heatmap toggle */}
            <div className="flex items-end">
              <button
                onClick={() => setShowHeatmap((v) => !v)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                  showHeatmap
                    ? "border-[#8C3737] bg-[#F6EFEA] text-[#8C3737]"
                    : "border-[#EDE6E2] bg-white text-[#4F4A45] hover:bg-[#F6EFEA]"
                }`}
              >
                <Layers className="h-4 w-4" />
                Heatmap
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mapHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-2 rounded-md bg-[#FFF8E7] border border-[#FFD54F]/60 px-3 py-2 text-xs text-[#7A5800]"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
                {mapHint} — or press <kbd className="mx-1 rounded border border-[#EDE6E2] bg-white px-1 py-0.5 font-mono text-[10px]">Esc</kbd> to cancel
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Map ── */}
        <div className="overflow-hidden rounded-xl border border-[#EDE6E2] bg-white shadow-xs">
          <div className="relative h-[480px] sm:h-[540px] w-full">
            <MapContainer
              center={[20, 0]} // World center
              zoom={2} // World view
              style={{ height: "100%", width: "100%" }}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapClickHandler onMapClick={handleMapClick} />
              {routeBounds && <MapFitBounds bounds={routeBounds} />}

              {routes.map((route, idx) =>
                idx !== selectedRoute ? (
                  <Polyline
                    key={`route-bg-${idx}`}
                    positions={route.coordinates.map((c) => [c.lat, c.lng])}
                    {...getPolylineStyle(route, idx)}
                    eventHandlers={{ click: () => handleSelectRoute(idx) }}
                  />
                ) : null
              )}
              {routes[selectedRoute] && (
                <Polyline
                  key={`route-fg-${selectedRoute}`}
                  positions={routes[selectedRoute].coordinates.map((c) => [c.lat, c.lng])}
                  {...getPolylineStyle(routes[selectedRoute], selectedRoute)}
                  eventHandlers={{ click: () => handleSelectRoute(selectedRoute) }}
                />
              )}

              {origin && (
                <Marker position={[origin.lat, origin.lng]} icon={ORIGIN_ICON}>
                  <Popup>
                    <span className="text-xs font-semibold">Origin</span>
                    <br />
                    <span className="text-xs text-[#4F4A45]">{origin.name}</span>
                  </Popup>
                </Marker>
              )}
              {destination && (
                <Marker position={[destination.lat, destination.lng]} icon={DESTINATION_ICON}>
                  <Popup>
                    <span className="text-xs font-semibold">Destination</span>
                    <br />
                    <span className="text-xs text-[#4F4A45]">{destination.name}</span>
                  </Popup>
                </Marker>
              )}

              {showHeatmap &&
                heatmapData.map((inc, idx) => {
                  const severityColor =
                    inc.severity === 3 ? HEATMAP_COLORS.high :
                    inc.severity === 2 ? HEATMAP_COLORS.medium :
                    HEATMAP_COLORS.low;
                  return (
                    <CircleMarker
                      key={`heat-${idx}`}
                      center={[inc.lat, inc.lng]}
                      radius={inc.severity * 5 + 6}
                      fillColor={severityColor}
                      fillOpacity={0.55}
                      color={severityColor}
                      weight={1}
                      opacity={0.7}
                    >
                      <Popup>
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold capitalize">{inc.category?.replace(/_/g, " ")}</p>
                          <p>Severity: {inc.severity === 1 ? "Low" : inc.severity === 2 ? "Medium" : "High"}</p>
                          <p>Time: {inc.timeOfDay}</p>
                          <p className="text-[#78726B]">{inc.age} day{inc.age !== 1 ? "s" : ""} ago</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>

            {activeInput && (
              <div className="pointer-events-none absolute inset-0 z-[1000] cursor-crosshair rounded-xl ring-2 ring-[#8C3737]/40" />
            )}
          </div>
        </div>

        {/* ── Route Results ── */}
        <AnimatePresence>
          {routes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="rounded-xl border border-[#EDE6E2] bg-white p-5 shadow-xs"
            >
              <h2 className="mb-3 font-serif text-lg font-bold text-[#1E1B18]">Route Options</h2>

              {/* NEW: Safety disclaimer */}
              <div className="mb-4 rounded-lg border border-[#EDE6E2] bg-[#FAF7F5] px-3 py-2">
                <div className="flex items-start gap-2 text-[11px] text-[#4F4A45]">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#8C3737]" />
                  <span className="leading-tight">
                    Safety scores are estimates based on available historical/prototype data and time-based factors. They do not guarantee current conditions or personal safety. Stay aware of your surroundings and use emergency services when necessary.
                  </span>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[#4F4A45]">
                <span className="font-medium">{routeCount} route option{routeCount !== 1 ? "s" : ""} found</span>
                {routes.map((route, idx) => {
                  const style = getPolylineStyle(route, idx);
                  return (
                    <span key={idx} className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-6 rounded-full"
                        style={{ background: style.color, opacity: style.opacity }}
                      />
                      Route {idx + 1}{route.recommended ? " (recommended)" : ""}
                    </span>
                  );
                })}
              </div>

              <div className="space-y-2.5">
                {routes.map((route, idx) => {
                  const isSelected = idx === selectedRoute;
                  const style = getPolylineStyle(route, idx);
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleSelectRoute(idx)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className={`w-full rounded-lg border p-4 text-left transition-all ${
                        isSelected
                          ? "border-[#8C3737] shadow-md ring-2 ring-[#8C3737]/20"
                          : "border-[#EDE6E2] hover:border-[#D6C8C0] hover:bg-[#FAF7F5]"
                      }`}
                      style={isSelected ? { borderColor: style.color, "--tw-ring-color": `${style.color}33` } : {}}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white"
                              style={{ background: style.color }}
                            />
                            {route.recommended && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#4CAF50] px-2 py-0.5 text-[11px] font-semibold text-white">
                                <ShieldAlert className="h-3 w-3" /> Recommended
                              </span>
                            )}
                            <span className="text-xs font-semibold text-[#1E1B18]">Route {idx + 1}</span>
                            {isSelected && (
                              <span className="text-[11px] font-medium text-[#8C3737]">● Highlighted on map</span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            <div>
                              <span className="text-[#78726B]">Distance: </span>
                              <span className="font-medium text-[#1E1B18]">{formatDistance(route.distance)}</span>
                            </div>
                            <div>
                              <span className="text-[#78726B]">Duration: </span>
                              <span className="font-medium text-[#1E1B18]">{formatDuration(route.duration)}</span>
                            </div>
                          </div>

                          {/* NEW: Risk factors summary */}
                          {route.riskFactors && route.riskFactors.length > 0 && (
                            <div className="mt-2.5 space-y-1">
                              {route.riskFactors.slice(0, 3).map((factor, fIdx) => (
                                <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-[#4F4A45]">
                                  <span className={factor.value < factor.max * 0.5 ? "text-[#4CAF50]" : factor.value < factor.max * 0.75 ? "text-[#FFC107]" : "text-[#F44336]"}>
                                    {factor.value < factor.max * 0.5 ? "✓" : factor.value < factor.max * 0.75 ? "⚠" : "⚠"}
                                  </span>
                                  <span className="leading-tight">{factor.description}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-lg font-bold text-[#1E1B18]">{route.riskScore?.toFixed(1) || '0.0'}</div>
                          <div className="text-[10px] text-[#78726B] leading-tight">risk score</div>
                          <div
                            className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-semibold text-white ${
                              route.riskLevel === "low"       ? "bg-[#4CAF50]" :
                              route.riskLevel === "moderate"  ? "bg-[#FFC107]" :
                              route.riskLevel === "high"      ? "bg-[#FF9800]" :
                                                                "bg-[#F44336]"
                            }`}
                          >
                            {route.riskLevel?.toUpperCase() || 'UNKNOWN'}
                          </div>
                        </div>
                      </div>

                      {/* NEW: "Why this score?" expandable section */}
                      {route.riskFactors && route.riskFactors.length > 0 && (
                        <AnimatePresence>
                          {expandedRoute === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 overflow-hidden border-t border-[#EDE6E2] pt-3"
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-[#1E1B18] mb-2.5">
                                <span>Why this score?</span>
                                <span className="text-[11px] font-normal text-[#78726B]">Multi-factor breakdown</span>
                              </div>
                              <div className="space-y-2.5">
                                {route.riskFactors.map((factor, fIdx) => {
                                  const percentage = Math.min(100, (factor.value / factor.max) * 100);
                                  return (
                                    <div key={fIdx} className="space-y-1">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-[#4F4A45] font-medium">{factor.name}</span>
                                        <span className="font-semibold text-[#1E1B18]">{factor.value} / {factor.max}</span>
                                      </div>
                                      <div className="h-1.5 w-full rounded-full bg-[#EDE6E2] overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-300"
                                          style={{
                                            width: `${percentage}%`,
                                            backgroundColor: percentage < 45 ? "#4CAF50" : percentage < 75 ? "#FFC107" : "#F44336"
                                          }}
                                        />
                                      </div>
                                      {factor.description && (
                                        <p className="text-[10px] text-[#78726B] leading-tight">{factor.description}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-3 pt-2.5 border-t border-[#EDE6E2] flex items-center justify-between text-xs font-bold text-[#1E1B18]">
                                <span>Total Calculated Risk:</span>
                                <span className="rounded bg-[#F6EFEA] px-2.5 py-0.5 text-[#8C3737]">
                                  {route.riskScore} / 100
                                </span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-[#EDE6E2]">
                                <div className="flex items-start gap-1.5 text-[10px] text-[#78726B]">
                                  <Info className="h-3 w-3 shrink-0 mt-0.5 text-[#8C3737]" />
                                  <span className="leading-tight">Risk estimates are based on available historical/prototype data and time-based factors. They are not a guarantee of current safety.</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}

                      {/* NEW: "Why this score?" button */}
                      {route.riskFactors && route.riskFactors.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRoute(expandedRoute === idx ? null : idx);
                          }}
                          className="mt-2 w-full text-left text-[11px] font-medium text-[#8C3737] hover:text-[#752B2B] transition"
                        >
                          {expandedRoute === idx ? "Hide breakdown" : "Why this score?"}
                        </button>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* ── Turn-by-Turn Directions ── */}
              {routes[selectedRoute]?.steps?.length > 0 && (
                <div className="mt-4 rounded-lg border border-[#EDE6E2] bg-[#FAF7F5]">
                  <button
                    onClick={() => setShowDirections((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#1E1B18] hover:bg-[#F6EFEA] transition"
                  >
                    <span className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-[#8C3737]" />
                      Turn-by-Turn Directions ({routes[selectedRoute].steps.length} steps)
                    </span>
                    {showDirections ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <AnimatePresence>
                    {showDirections && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="max-h-80 overflow-y-auto border-t border-[#EDE6E2] p-3">
                          <ol className="space-y-2.5">
                            {routes[selectedRoute].steps.map((step, stepIdx) => {
                              const IconComponent = getManeuverIcon(step.maneuver.type, step.maneuver.modifier);
                              return (
                                <li key={stepIdx} className="flex items-start gap-3">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8C3737] text-white">
                                    <IconComponent className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-[#1E1B18] leading-snug">
                                      {step.instruction || `Continue on ${step.name}`}
                                    </p>
                                    <p className="mt-0.5 text-xs text-[#78726B]">
                                      {step.name !== 'Unnamed road' && step.name} 
                                      {step.distance > 0 && ` — ${formatDistance(step.distance)}`}
                                    </p>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Report Incident FAB ── */}
        <button
          onClick={() => setIsReporting(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#8C3737] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#752B2B]"
          title="Report an incident"
        >
          <Plus className="h-4 w-4" />
          Report
        </button>

        {/* ── Report Modal ── */}
        <AnimatePresence>
          {isReporting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1B18]/60 px-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-xl border border-[#EDE6E2] bg-white p-6 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-lg font-bold text-[#1E1B18]">Report Incident</h2>
                  <button onClick={() => setIsReporting(false)} className="rounded-lg p-1.5 text-[#78726B] hover:bg-[#F6EFEA]">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#4F4A45]">Location</label>
                    <button
                      onClick={() => {
                        if (!navigator.geolocation) return toast.error("Geolocation not supported");
                        navigator.geolocation.getCurrentPosition(
                          (p) => {
                            setReportForm((f) => ({ ...f, lat: p.coords.latitude, lng: p.coords.longitude }));
                            toast.success("Location set");
                          },
                          () => toast.error("Failed to get location")
                        );
                      }}
                      className="w-full rounded-md border border-[#EDE6E2] bg-[#F6EFEA] px-3 py-2 text-xs font-medium text-[#8C3737] hover:bg-[#ECE0D8]"
                    >
                      <LocateFixed className="mr-1.5 inline h-3.5 w-3.5" />
                      Use Current Location
                    </button>
                    {reportForm.lat && (
                      <p className="mt-1.5 text-xs text-[#4F4A45]">
                        {reportForm.lat.toFixed(5)}, {reportForm.lng.toFixed(5)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#4F4A45]">Category</label>
                    <select
                      value={reportForm.category}
                      onChange={(e) => setReportForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-md border border-[#EDE6E2] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C3737]"
                    >
                      <option value="">Select category</option>
                      <option value="harassment">Harassment</option>
                      <option value="poor_lighting">Poor Lighting</option>
                      <option value="isolated_area">Isolated Area</option>
                      <option value="stalking">Stalking</option>
                      <option value="theft">Theft</option>
                      <option value="unsafe_area">Unsafe Area Report</option>
                      <option value="street_incident">Street Incident</option>
                      <option value="verbal_abuse">Verbal Abuse</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold text-[#4F4A45]">Severity</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setReportForm((f) => ({ ...f, severity: lvl }))}
                          className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition ${
                            reportForm.severity === lvl
                              ? "border-[#8C3737] bg-[#8C3737] text-white"
                              : "border-[#EDE6E2] text-[#4F4A45] hover:bg-[#F6EFEA]"
                          }`}
                        >
                          {lvl === 1 ? "Low" : lvl === 2 ? "Medium" : "High"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#BA2626]/20 bg-[#FDF2F2] p-3">
                    <p className="text-[11px] text-[#BA2626]">
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                      This report is completely anonymous. No personal information is stored.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsReporting(false)}
                      className="flex-1 rounded-lg border border-[#EDE6E2] px-4 py-2 text-sm font-medium text-[#4F4A45] hover:bg-[#F6EFEA]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReportIncident}
                      disabled={isSubmittingReport || !reportForm.lat || !reportForm.category}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8C3737] px-4 py-2 text-sm font-semibold text-white hover:bg-[#752B2B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmittingReport ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Report"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default SafeRoute;
