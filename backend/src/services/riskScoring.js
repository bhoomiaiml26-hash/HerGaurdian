/**
 * HerGuardian AI - Explainable Multi-Factor Risk Scoring Service
 * 
 * TRANSPARENT 4-PART RISK MODEL:
 * Total Risk (0-100) = Historical Incident Risk (0-35)
 *                    + Time-of-Day Risk (0-30)
 *                    + Segment / Route Analysis (0-20)
 *                    + Area Activity Risk (0-15)
 * 
 * PROPERTIES:
 * - 100% Deterministic: Same (route, time, safety data) -> Identical score
 * - Location-Sensitive: Routes evaluated along their exact geographic path
 * - Time-Sensitive: Time of travel adjusts time risk & incident relevance
 * - Explainable: Factors sum exactly to the displayed total score
 * - Risk Levels: 0-30 LOW, 31-60 MODERATE, 61-100 HIGH
 */

const EARTH_RADIUS_KM = 6371;
const INCIDENT_INFLUENCE_RADIUS_KM = 0.8; // 800m corridor
const SAMPLING_INTERVAL_METERS = 200;      // Sample point every 200m
const INCIDENT_DECAY_DAYS = 90;

/**
 * 24-Hour Time-of-Day Risk Lookup (0-30 scale)
 * Models daylight, pedestrian traffic, business open hours, and natural surveillance.
 */
export const HOURLY_TIME_RISK = {
  0: 26,  1: 28,  2: 29,  3: 28,  4: 26,  5: 22,
  6: 16,  7: 11,  8: 8,   9: 6,  10: 5,  11: 5,
  12: 5, 13: 6,  14: 6,  15: 7,  16: 8,  17: 11,
  18: 14, 19: 17, 20: 20, 21: 22, 22: 24, 23: 26,
};

/**
 * Haversine distance between two points in kilometers
 */
export function calculateDistance(p1, p2) {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Convert hour (0-23) to time-of-day category
 */
export function getTimeOfDayFromHour(hour) {
  const h = Math.floor(hour);
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  if (h >= 21 && h < 24) return 'night';
  return 'late-night'; // 0-5
}

export function getCurrentTimeOfDay() {
  return getTimeOfDayFromHour(new Date().getHours());
}

/**
 * Sample coordinates along a route at regular intervals (meters)
 */
export function sampleRoutePoints(coords, intervalMeters = SAMPLING_INTERVAL_METERS) {
  if (!coords || coords.length < 2) return coords || [];

  const sampled = [coords[0]];
  let accum = 0;

  for (let i = 1; i < coords.length; i++) {
    const distMeters = calculateDistance(coords[i - 1], coords[i]) * 1000;
    accum += distMeters;
    if (accum >= intervalMeters) {
      sampled.push(coords[i]);
      accum = 0;
    }
  }

  const last = coords[coords.length - 1];
  if (sampled[sampled.length - 1] !== last) {
    sampled.push(last);
  }

  return sampled;
}

/**
 * Factor 1: Historical Incident Risk (0 - 35)
 * Measures cumulative and peak exposure to reported safety incidents along the route corridor,
 * with strong emphasis on the intermediate traversal path where different routes diverge.
 */
function calculateHistoricalIncidentRisk(sampledPoints, incidents, travelTimeOfDay) {
  if (!sampledPoints || sampledPoints.length === 0 || !incidents || incidents.length === 0) {
    return {
      score: 0,
      nearbyCount: 0,
      hotspotIntensity: 'none',
      description: 'No reported safety incidents along this corridor.',
    };
  }

  const encounteredIncidentIds = new Set();
  let totalExposure = 0;
  let transitExposure = 0;
  let peakHotspot = 0;

  // Split into start, intermediate transit (middle 80%), and end
  const n = sampledPoints.length;
  const startEndWindow = Math.max(1, Math.floor(n * 0.1));

  for (let idx = 0; idx < n; idx++) {
    const pt = sampledPoints[idx];
    const isTransit = idx >= startEndWindow && idx <= (n - startEndWindow);
    let localPointImpact = 0;

    for (const inc of incidents) {
      if (!inc.location?.lat || !inc.location?.lng) continue;

      const distKm = calculateDistance(pt, { lat: inc.location.lat, lng: inc.location.lng });
      if (distKm <= INCIDENT_INFLUENCE_RADIUS_KM) {
        encounteredIncidentIds.add(inc._id ? inc._id.toString() : `${inc.location.lat}_${inc.location.lng}`);

        // Distance decay: closer = higher risk
        const distFactor = 1 - distKm / INCIDENT_INFLUENCE_RADIUS_KM;

        // Severity: low=1.0, medium=1.8, high=3.0
        const sevWeight = inc.severity === 3 ? 3.0 : inc.severity === 2 ? 1.8 : 1.0;

        // Time-of-day relevance
        let timeFactor = 0.9;
        if (inc.timeOfDay === travelTimeOfDay) {
          timeFactor = 1.4; // Same time period is more predictive
        } else if (
          (travelTimeOfDay === 'night' && inc.timeOfDay === 'late-night') ||
          (travelTimeOfDay === 'late-night' && inc.timeOfDay === 'night')
        ) {
          timeFactor = 1.25;
        }

        // Recency decay
        let recencyFactor = 1.0;
        if (inc.createdAt) {
          const ageDays = (Date.now() - new Date(inc.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays > 30) {
            recencyFactor = Math.max(0.2, Math.exp(-(ageDays - 30) / INCIDENT_DECAY_DAYS));
          }
        }

        localPointImpact += distFactor * sevWeight * timeFactor * recencyFactor;
      }
    }

    totalExposure += localPointImpact;
    if (isTransit) {
      transitExposure += localPointImpact;
    }
    if (localPointImpact > peakHotspot) {
      peakHotspot = localPointImpact;
    }
  }

  const nearbyCount = encounteredIncidentIds.size;
  const transitLength = Math.max(1, n - 2 * startEndWindow);
  const transitDensity = (transitExposure / transitLength) * 10;
  const overallDensity = (totalExposure / n) * 10;

  // Composite incident risk: strong weight on transit path exposure where routes diverge
  let score = 0;
  if (nearbyCount > 0) {
    score = Math.round(transitDensity * 3.2 + overallDensity * 0.8 + peakHotspot * 1.8);
    score = Math.max(2, Math.min(35, score));
  }

  let description = 'Low historical incident exposure along this route';
  if (score >= 24) {
    description = `Route traverses ${nearbyCount} reported incident hotspot${nearbyCount !== 1 ? 's' : ''}`;
  } else if (score >= 12) {
    description = `Moderate exposure (${nearbyCount} nearby incident report${nearbyCount !== 1 ? 's' : ''})`;
  } else if (nearbyCount > 0) {
    description = `Minor incident exposure (${nearbyCount} report${nearbyCount !== 1 ? 's' : ''} nearby)`;
  }

  return {
    score,
    nearbyCount,
    description,
  };
}

/**
 * Factor 2: Time-of-Day Risk (0 - 30)
 * Evaluates visibility, daylight, open business hours, and late-night vulnerability.
 */
function calculateTimeOfDayRisk(hour) {
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const score = HOURLY_TIME_RISK[h] ?? 12;

  let description = 'Daytime hours — optimal daylight, active foot traffic';
  if (h >= 23 || h < 5) {
    description = 'Late night — dark hours, closed amenities, low street activity';
  } else if (h >= 20 || h === 5) {
    description = 'Night / dawn — reduced visibility and declining bystander presence';
  } else if (h >= 17 && h < 20) {
    description = 'Evening transition — fading daylight, shifting pedestrian flow';
  } else if (h >= 6 && h < 9) {
    description = 'Morning hours — good visibility with increasing traffic';
  }

  return {
    score,
    description,
  };
}

/**
 * Factor 3: Segment / Road Infrastructure Risk (0 - 20)
 * Evaluates physical road characteristics: highways/boulevards vs minor streets, turns, and continuity.
 */
function calculateSegmentRisk(routeCoords, steps, distMeters) {
  const distKm = distMeters / 1000;
  const numSteps = steps?.length || 0;

  let majorRoadCount = 0;
  let minorRoadCount = 0;

  for (const s of steps || []) {
    const name = (s.name || '').toLowerCase();
    const ref = (s.ref || '').toLowerCase();

    // Check for major thoroughfares across US, Europe, UK, India, and Australia
    const isMajor =
      name.includes('expressway') ||
      name.includes('motorway') ||
      name.includes('highway') ||
      name.includes('freeway') ||
      name.includes('bypass') ||
      name.includes('boulevard') ||
      name.includes('avenue') ||
      name.includes('quai') ||
      name.includes('parkway') ||
      name.includes('ring road') ||
      ref.startsWith('nh') ||
      ref.startsWith('sh') ||
      ref.startsWith('m') ||
      ref.startsWith('i-') ||
      ref.startsWith('a') ||
      ref.startsWith('us-');

    const isMinor =
      name.includes('lane') ||
      name.includes('gali') ||
      name.includes('alley') ||
      name.includes('passage') ||
      name.includes('impasse') ||
      name.includes('path') ||
      name.includes('trail') ||
      name === '' ||
      name === 'unnamed road';

    if (isMajor) majorRoadCount++;
    if (isMinor) minorRoadCount++;
  }

  // Baseline segment risk
  let score = 9.0;

  if (numSteps > 0) {
    const majorRatio = majorRoadCount / numSteps;
    const minorRatio = minorRoadCount / numSteps;

    // Major roads provide better lighting, wider shoulders, and continuous visibility
    score -= majorRatio * 5.0;

    // Minor roads have narrower passageways and lower visibility
    score += minorRatio * 5.0;
  }

  // Turn complexity: high frequency of turns increases vulnerability
  const turnsPerKm = distKm > 0 ? numSteps / distKm : 1;
  if (turnsPerKm > 2.5) {
    score += 3.5;
  } else if (turnsPerKm > 1.5) {
    score += 1.5;
  } else if (turnsPerKm < 0.6 && distKm > 2) {
    score -= 2.0;
  }

  score = Math.max(3.0, Math.min(19.0, Math.round(score * 10) / 10));

  let description = 'Standard urban and connecting road segments';
  if (score <= 6) {
    description = 'Well-lit major highways / boulevards with continuous flow';
  } else if (score >= 13) {
    description = 'Contains winding, narrow, or lower-connectivity segments';
  } else if (score >= 9) {
    description = 'Mixed street segments with moderate turn frequency';
  }

  return {
    score,
    description,
  };
}

/**
 * Factor 4: Area Activity / Surroundings Risk (0 - 15)
 * Evaluates the natural surveillance and surroundings of the corridor.
 */
function calculateAreaActivityRisk(timeOfDayScore, incidentCount, distKm) {
  // Baseline activity risk
  let score = 5;

  // Nighttime effect: commercial establishments close, bystander count drops
  if (timeOfDayScore >= 24) {
    score += 5; // Late night: quiet, low surveillance
  } else if (timeOfDayScore >= 18) {
    score += 3; // Night: reduced activity
  } else if (timeOfDayScore <= 8) {
    score -= 2; // Daytime: high natural surveillance
  }

  // Incident presence indicates localized disturbance/unmonitored zones
  if (incidentCount >= 4) {
    score += 2;
  } else if (incidentCount === 0 && distKm < 10) {
    score -= 1;
  }

  score = Math.max(2, Math.min(15, Math.round(score)));

  let description = 'Moderate urban activity and surrounding commercial presence';
  if (score <= 4) {
    description = 'Active commercial corridor with high bystander visibility';
  } else if (score >= 11) {
    description = 'Low surrounding activity with sparse pedestrian presence';
  }

  return {
    score,
    description,
  };
}

/**
 * Multi-Factor Route Risk Evaluation
 * Calculates transparent, explainable 4-part risk for an individual route.
 */
export function calculateRouteRisk(routeCoords, allIncidents, travelHour) {
  const sampledPoints = sampleRoutePoints(routeCoords, SAMPLING_INTERVAL_METERS);
  const travelTimeOfDay = getTimeOfDayFromHour(travelHour);

  // 1. Historical Incidents (0-35)
  const incidentAnalysis = calculateHistoricalIncidentRisk(sampledPoints, allIncidents, travelTimeOfDay);

  // 2. Time-of-Day Risk (0-30)
  const timeAnalysis = calculateTimeOfDayRisk(travelHour);

  // 3. Segment Analysis (0-20)
  const distMeters = routeCoords.length > 1
    ? calculateDistance(routeCoords[0], routeCoords[routeCoords.length - 1]) * 1000
    : 1000;
  const segmentAnalysis = calculateSegmentRisk(routeCoords, [], distMeters);

  // 4. Area Activity (0-15)
  const areaAnalysis = calculateAreaActivityRisk(
    timeAnalysis.score,
    incidentAnalysis.nearbyCount,
    distMeters / 1000
  );

  // Total risk is exactly the sum of the 4 components
  const totalScore = Math.max(
    0,
    Math.min(100, incidentAnalysis.score + timeAnalysis.score + segmentAnalysis.score + areaAnalysis.score)
  );

  const riskLevel = getRiskLevel(totalScore);

  const factors = [
    {
      name: 'Historical incidents',
      value: incidentAnalysis.score,
      max: 35,
      description: incidentAnalysis.description,
    },
    {
      name: 'Time of day',
      value: timeAnalysis.score,
      max: 30,
      description: timeAnalysis.description,
    },
    {
      name: 'Segment analysis',
      value: segmentAnalysis.score,
      max: 20,
      description: segmentAnalysis.description,
    },
    {
      name: 'Area activity',
      value: areaAnalysis.score,
      max: 15,
      description: areaAnalysis.description,
    },
  ];

  return {
    totalScore,
    riskLevel,
    breakdown: {
      historicalIncidents: incidentAnalysis.score,
      timeOfDay: timeAnalysis.score,
      segmentAnalysis: segmentAnalysis.score,
      areaActivity: areaAnalysis.score,
    },
    factors,
  };
}

/**
 * Route-specific risk evaluation that includes turn-by-turn steps
 */
export function evaluateSingleRoute(route, allIncidents, travelHour) {
  const coords = (route.geometry?.coordinates || []).map(c => ({ lat: c[1], lng: c[0] }));
  const sampledPoints = sampleRoutePoints(coords, SAMPLING_INTERVAL_METERS);
  const travelTimeOfDay = getTimeOfDayFromHour(travelHour);

  // Extract all steps from all legs
  const steps = [];
  if (route.legs && route.legs.length > 0) {
    for (const leg of route.legs) {
      if (leg.steps && leg.steps.length > 0) {
        steps.push(...leg.steps);
      }
    }
  }

  // 1. Historical Incidents (0-35)
  const incidentAnalysis = calculateHistoricalIncidentRisk(sampledPoints, allIncidents, travelTimeOfDay);

  // 2. Time of Day (0-30)
  const timeAnalysis = calculateTimeOfDayRisk(travelHour);

  // 3. Segment / Road Infrastructure (0-20)
  const segmentAnalysis = calculateSegmentRisk(coords, steps, route.distance);

  // 4. Area Activity (0-15)
  const areaAnalysis = calculateAreaActivityRisk(
    timeAnalysis.score,
    incidentAnalysis.nearbyCount,
    route.distance / 1000
  );

  // Total Score: exact sum of the 4 components
  const totalScore = Math.max(
    0,
    Math.min(100, incidentAnalysis.score + timeAnalysis.score + segmentAnalysis.score + areaAnalysis.score)
  );

  const riskLevel = getRiskLevel(totalScore);

  const factors = [
    {
      name: 'Historical incidents',
      value: incidentAnalysis.score,
      max: 35,
      description: incidentAnalysis.description,
    },
    {
      name: 'Time of day',
      value: timeAnalysis.score,
      max: 30,
      description: timeAnalysis.description,
    },
    {
      name: 'Segment analysis',
      value: segmentAnalysis.score,
      max: 20,
      description: segmentAnalysis.description,
    },
    {
      name: 'Area activity',
      value: areaAnalysis.score,
      max: 15,
      description: areaAnalysis.description,
    },
  ];

  return {
    totalScore,
    riskLevel,
    breakdown: {
      historicalIncidents: incidentAnalysis.score,
      timeOfDay: timeAnalysis.score,
      segmentAnalysis: segmentAnalysis.score,
      areaActivity: areaAnalysis.score,
    },
    factors,
  };
}

/**
 * Map risk score to level:
 * 0 - 30:  LOW
 * 31 - 60: MODERATE
 * 61 - 100: HIGH
 */
export function getRiskLevel(score) {
  if (score <= 30) return 'low';
  if (score <= 60) return 'moderate';
  return 'high';
}

/**
 * Route Selection Scoring for Recommendation
 * Weights:
 * 60% Safety (lower risk is better)
 * 25% Travel Time efficiency
 * 15% Distance efficiency
 */
export function calculateRouteSelectionScore(riskScore, duration, distance, minDuration, minDistance) {
  // Safety utility: 0 to 1 (0 risk = 1.0, 100 risk = 0.0)
  const safetyUtility = Math.max(0, (100 - riskScore) / 100);

  // Time efficiency: penalize routes that take significantly longer than the fastest
  const timeRatio = minDuration > 0 ? (duration - minDuration) / (minDuration * 0.6) : 0;
  const timeUtility = Math.max(0, 1 - Math.min(1, timeRatio));

  // Distance efficiency
  const distRatio = minDistance > 0 ? (distance - minDistance) / (minDistance * 0.6) : 0;
  const distUtility = Math.max(0, 1 - Math.min(1, distRatio));

  const totalUtility = 0.60 * safetyUtility + 0.25 * timeUtility + 0.15 * distUtility;
  return Math.round(totalUtility * 1000) / 1000;
}

/**
 * Map OSRM maneuver types to icon names for frontend
 */
export function getManeuverIcon(type, modifier) {
  if (type === 'depart') return 'MoveUpRight';
  if (type === 'arrive') return 'MapPin';

  if (type === 'turn') {
    if (modifier === 'left' || modifier === 'slight left' || modifier === 'sharp left') {
      return 'ArrowLeft';
    }
    if (modifier === 'right' || modifier === 'slight right' || modifier === 'sharp right') {
      return 'ArrowRight';
    }
    if (modifier === 'straight') return 'ArrowUp';
    if (modifier === 'uturn') return 'Undo2';
  }

  if (type === 'roundabout' || type === 'rotary') return 'CircleDot';
  if (type === 'merge') return 'Merge';
  if (type === 'fork') return 'GitBranch';
  if (type === 'on ramp' || type === 'off ramp') return 'TrendingUp';
  if (type === 'new name' || type === 'continue') return 'ArrowUp';

  return 'Navigation';
}

/**
 * Build clear instruction text from OSRM step
 */
export function formatManeuverInstruction(step) {
  const type = step.maneuver?.type || 'continue';
  const modifier = (step.maneuver?.modifier || '').trim();
  const rawName = (step.name || '').trim();
  const named = rawName && rawName.toLowerCase() !== 'unnamed road';
  const onto = named ? ` onto ${rawName}` : '';
  const on = named ? ` on ${rawName}` : '';
  const exit = step.maneuver?.exit;

  const turnWord = (mod) => {
    if (mod === 'uturn') return 'Make a U-turn';
    if (mod === 'straight') return `Continue straight${on}`;
    if (mod.startsWith('slight ')) return `Turn slightly ${mod.replace('slight ', '')}${onto}`;
    if (mod.startsWith('sharp ')) return `Turn sharp ${mod.replace('sharp ', '')}${onto}`;
    if (mod) return `Turn ${mod}${onto}`;
    return named ? `Turn${onto}` : 'Continue';
  };

  switch (type) {
    case 'depart':
      return named ? `Head ${modifier || 'out'}${on}` : 'Head toward your destination';
    case 'arrive':
      return 'You have arrived at your destination';
    case 'turn':
      return turnWord(modifier);
    case 'roundabout':
    case 'rotary': {
      const nth = exit
        ? `take the ${exit === 1 ? '1st' : exit === 2 ? '2nd' : exit === 3 ? '3rd' : `${exit}th`} exit`
        : 'take the exit';
      return `At the roundabout, ${nth}${onto}`;
    }
    case 'merge':
      return `Merge${onto || (modifier ? ` ${modifier}` : '')}`;
    case 'fork':
      return `Keep ${modifier || 'left'}${onto}`;
    case 'on ramp':
      return `Take the ramp${onto}`;
    case 'off ramp':
      return `Take the exit${onto}`;
    case 'end of road':
      return turnWord(modifier || 'left');
    case 'new name':
    case 'continue':
      return named ? `Continue onto ${rawName}` : 'Continue straight';
    default:
      return named ? `Continue on ${rawName}` : 'Continue';
  }
}

export default {
  calculateDistance,
  sampleRoutePoints,
  calculateRouteRisk,
  evaluateSingleRoute,
  getTimeOfDayFromHour,
  getCurrentTimeOfDay,
  getRiskLevel,
  calculateRouteSelectionScore,
  getManeuverIcon,
  formatManeuverInstruction,
};
