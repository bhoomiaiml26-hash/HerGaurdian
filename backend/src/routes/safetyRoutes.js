import express from 'express';
import rateLimit from 'express-rate-limit';
import IncidentReport from '../models/IncidentReport.js';
import {
  evaluateSingleRoute,
  getTimeOfDayFromHour,
  calculateRouteSelectionScore,
  formatManeuverInstruction,
} from '../services/riskScoring.js';

const router = express.Router();

// Rate limiter for incident reports
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many reports submitted. Please try again later.'
});

// Valid categories matching schema
const VALID_CATEGORIES = [
  'harassment',
  'poor_lighting',
  'isolated_area',
  'stalking',
  'verbal_abuse',
  'theft',
  'unsafe_area',
  'street_incident',
  'other',
];

/**
 * Helper: Signature for deduplicating routes
 */
function getRouteSignature(r) {
  const distKey = Math.round(r.distance / 150);
  const durKey = Math.round(r.duration / 45);
  const coords = r.geometry?.coordinates || [];
  let sampleMid = '0,0';
  if (coords.length > 2) {
    const midIdx = Math.floor(coords.length / 2);
    sampleMid = `${coords[midIdx][0].toFixed(3)},${coords[midIdx][1].toFixed(3)}`;
  }
  return `${distKey}_${durKey}_${sampleMid}`;
}

/**
 * Fetch genuine routes from OSRM with alternative corridor exploration
 */
async function fetchGenuineRoutes(origin, destination) {
  const routes = [];
  const signatures = new Set();

  function addRouteIfUnique(candidate) {
    if (!candidate || !candidate.geometry || !candidate.geometry.coordinates || candidate.geometry.coordinates.length < 2) {
      return false;
    }

    const sig = getRouteSignature(candidate);
    if (signatures.has(sig)) return false;

    // Check similarity with existing routes
    for (const ex of routes) {
      const distDiff = Math.abs(candidate.distance - ex.distance) / Math.max(1, ex.distance);
      const durDiff = Math.abs(candidate.duration - ex.duration) / Math.max(1, ex.duration);
      if (distDiff < 0.025 && durDiff < 0.025) {
        return false; // Redundant route
      }
    }

    signatures.add(sig);
    routes.push(candidate);
    return true;
  }

  // 1. Direct OSRM query
  try {
    const directUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?alternatives=3&steps=true&overview=full&geometries=geojson&annotations=true`;
    const res = await fetch(directUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        for (const r of data.routes) {
          addRouteIfUnique(r);
        }
      }
    }
  } catch (err) {
    console.error('[SafetyRoutes] OSRM direct query error:', err.message);
  }

  // 2. Multi-corridor exploration if fewer than 4 routes and journey is significant
  if (routes.length > 0 && routes.length < 4) {
    const primary = routes[0];
    const coords = primary.geometry.coordinates;
    const totalDistKm = primary.distance / 1000;

    if (totalDistKm > 1.2 && coords.length >= 8) {
      const dLng = destination.lng - origin.lng;
      const dLat = destination.lat - origin.lat;
      const len = Math.hypot(dLng, dLat);

      if (len > 0.001) {
        const perpLng = -dLat / len;
        const perpLat = dLng / len;

        const offsetFactors = [0.08, -0.08, 0.16, -0.16];
        const midPoints = [
          coords[Math.floor(coords.length * 0.5)],
          coords[Math.floor(coords.length * 0.35)],
          coords[Math.floor(coords.length * 0.65)],
        ];

        for (const frac of offsetFactors) {
          if (routes.length >= 5) break;

          for (const mid of midPoints) {
            if (routes.length >= 5) break;

            const testLng = mid[0] + perpLng * (frac * len);
            const testLat = mid[1] + perpLat * (frac * len);

            try {
              // Snap to nearest road using OSRM nearest API
              const snapUrl = `https://router.project-osrm.org/nearest/v1/driving/${testLng},${testLat}`;
              const snapRes = await fetch(snapUrl);
              if (!snapRes.ok) continue;

              const snapData = await snapRes.json();
              if (!snapData.waypoints || snapData.waypoints.length === 0) continue;

              const snapped = snapData.waypoints[0].location;
              const distFromOrigin = Math.hypot(snapped[0] - origin.lng, snapped[1] - origin.lat);
              const distFromDest = Math.hypot(snapped[0] - destination.lng, snapped[1] - destination.lat);
              if (distFromOrigin < 0.005 || distFromDest < 0.005) continue;

              // Query OSRM via snapped road waypoint
              const viaUrl = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${snapped[0]},${snapped[1]};${destination.lng},${destination.lat}?steps=true&overview=full&geometries=geojson&annotations=true`;
              const viaRes = await fetch(viaUrl);
              if (!viaRes.ok) continue;

              const viaData = await viaRes.json();
              if (viaData.routes && viaData.routes.length > 0) {
                const viaRoute = viaData.routes[0];
                // Keep if practical (not a senseless detour)
                if (viaRoute.distance <= primary.distance * 1.55 && viaRoute.duration <= primary.duration * 1.65) {
                  addRouteIfUnique(viaRoute);
                }
              }
            } catch (e) {
              // Ignore single waypoint failure
            }
          }
        }
      }
    }
  }

  return routes.slice(0, 5);
}

/**
 * POST /api/safety/report
 * Submit an anonymous safety incident report
 */
router.post('/report', reportLimiter, async (req, res) => {
  try {
    const { lat, lng, category, severity, description } = req.body;

    if (!lat || !lng || !category || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: lat, lng, category, severity',
      });
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
      });
    }

    const sevNum = Number(severity);
    if (![1, 2, 3].includes(sevNum)) {
      return res.status(400).json({
        success: false,
        message: 'Severity must be 1 (low), 2 (medium), or 3 (high)',
      });
    }

    const currentHour = new Date().getHours();
    const timeOfDay = getTimeOfDayFromHour(currentHour);

    const incident = new IncidentReport({
      location: { lat, lng },
      category,
      severity: sevNum,
      timeOfDay,
    });

    await incident.save();

    res.status(201).json({
      success: true,
      message: 'Incident reported successfully and anonymously',
      data: {
        id: incident._id,
        timeOfDay,
      },
    });
  } catch (error) {
    console.error('Error reporting incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report incident',
    });
  }
});

/**
 * GET /api/safety/heatmap
 * Get incident reports for heatmap visualization
 */
router.get('/heatmap', async (req, res) => {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const incidents = await IncidentReport.find({
      createdAt: { $gte: ninetyDaysAgo },
    }).select('location category severity timeOfDay createdAt -_id');

    const now = Date.now();
    const heatmapData = incidents.map(inc => ({
      lat: inc.location.lat,
      lng: inc.location.lng,
      category: inc.category,
      severity: inc.severity,
      timeOfDay: inc.timeOfDay,
      age: Math.max(0, Math.floor((now - new Date(inc.createdAt).getTime()) / (1000 * 60 * 60 * 24))),
    }));

    res.json({
      success: true,
      data: heatmapData,
      count: heatmapData.length,
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch heatmap data',
    });
  }
});

/**
 * POST /api/safety/safe-route
 * Calculate real-road routes with transparent multi-factor safety evaluation
 */
router.post('/safe-route', async (req, res) => {
  try {
    const { origin, destination, travelTime } = req.body;

    if (!origin || !destination || origin.lat == null || origin.lng == null || destination.lat == null || destination.lng == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required coordinates: origin and destination lat/lng',
      });
    }

    // Determine travel hour
    let travelHour = new Date().getHours();
    if (typeof travelTime === 'number' && travelTime >= 0 && travelTime < 24) {
      travelHour = Math.floor(travelTime);
    }
    const travelTimeOfDay = getTimeOfDayFromHour(travelHour);

    // Fetch recent incidents
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const incidents = await IncidentReport.find({
      createdAt: { $gte: ninetyDaysAgo },
    }).select('location category severity timeOfDay createdAt');

    // Fetch genuine real-road routes from OSRM
    const rawRoutes = await fetchGenuineRoutes(origin, destination);

    if (!rawRoutes || rawRoutes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No drivable road routes found between the specified locations. Please select accessible road points.',
      });
    }

    // Evaluate each route individually
    const evaluatedRoutes = rawRoutes.map((route, index) => {
      const evaluation = evaluateSingleRoute(route, incidents, travelHour);

      // Extract coordinates array for Leaflet
      const coordinates = (route.geometry?.coordinates || []).map(c => ({
        lat: c[1],
        lng: c[0],
      }));

      // Extract and format turn-by-turn steps
      const steps = [];
      if (route.legs && route.legs.length > 0) {
        for (const leg of route.legs) {
          if (leg.steps && leg.steps.length > 0) {
            for (const step of leg.steps) {
              const parsed = {
                maneuver: {
                  type: step.maneuver?.type || 'turn',
                  modifier: step.maneuver?.modifier || 'straight',
                  location: step.maneuver?.location ? [step.maneuver.location[1], step.maneuver.location[0]] : null,
                  exit: step.maneuver?.exit,
                },
                name: step.name || 'Unnamed road',
                distance: step.distance || 0,
                duration: step.duration || 0,
              };
              parsed.instruction = step.maneuver?.instruction || formatManeuverInstruction(parsed);
              steps.push(parsed);
            }
          }
        }
      }

      return {
        index,
        coordinates,
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        riskScore: evaluation.totalScore,
        riskLevel: evaluation.riskLevel,
        riskBreakdown: evaluation.breakdown,
        riskFactors: evaluation.factors,
        geometry: route.geometry,
        steps,
      };
    });

    // Calculate recommendation based on safety, time, and distance
    const minDuration = Math.min(...evaluatedRoutes.map(r => r.duration));
    const minDistance = Math.min(...evaluatedRoutes.map(r => r.distance));

    evaluatedRoutes.forEach(r => {
      r.selectionScore = calculateRouteSelectionScore(
        r.riskScore,
        r.duration,
        r.distance,
        minDuration,
        minDistance
      );
    });

    // Sort by selection score descending (best first)
    evaluatedRoutes.sort((a, b) => b.selectionScore - a.selectionScore);

    // Mark the top candidate as recommended
    evaluatedRoutes.forEach((r, idx) => {
      r.recommended = idx === 0;
    });

    res.json({
      success: true,
      data: {
        origin,
        destination,
        travelHour,
        travelTimeOfDay,
        routes: evaluatedRoutes,
        routeCount: evaluatedRoutes.length,
        incidentCount: incidents.length,
        dataSource: 'prototype',
      },
    });
  } catch (error) {
    console.error('Error calculating safe route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate safe route',
      error: error.message,
    });
  }
});

export default router;
