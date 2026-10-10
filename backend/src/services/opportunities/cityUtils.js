const normalizeKey = (value) => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const CITY_ALIASES = {
  bangalore: 'Bengaluru',
  bangaluru: 'Bengaluru',
  bengaluru: 'Bengaluru',
  bombay: 'Mumbai',
  mumbai: 'Mumbai',
  poona: 'Pune',
  pune: 'Pune',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  calcutta: 'Kolkata',
  kolkata: 'Kolkata',
  madras: 'Chennai',
  chennai: 'Chennai',
  'new delhi': 'Delhi NCR',
  delhi: 'Delhi NCR',
  'delhi ncr': 'Delhi NCR',
  'national capital region': 'Delhi NCR',
  'pimpri chinchwad': 'Pimpri-Chinchwad',
  'pimpri chichwad': 'Pimpri-Chinchwad',
  'navi mumbai': 'Navi Mumbai',
  thane: 'Thane',
  noida: 'Noida',
  ghaziabad: 'Ghaziabad',
  jaipur: 'Jaipur',
  nashik: 'Nashik',
  ahmedabad: 'Ahmedabad',
  hyderabad: 'Hyderabad',
  lucknow: 'Lucknow',
  indore: 'Indore',
  nagpur: 'Nagpur',
  kochi: 'Kochi',
  cochin: 'Kochi',
  chandigarh: 'Chandigarh',
  surat: 'Surat',
  vadodara: 'Vadodara',
  bhopal: 'Bhopal',
  patna: 'Patna',
  visakhapatnam: 'Visakhapatnam',
  vizag: 'Visakhapatnam',
  coimbatore: 'Coimbatore',
  mysore: 'Mysuru',
  mysuru: 'Mysuru',
  remote: 'Remote',
  london: 'London',
  singapore: 'Singapore',
  manchester: 'Manchester',
  edinburgh: 'Edinburgh',
  toronto: 'Toronto',
  vancouver: 'Vancouver',
  'new york': 'New York',
  'san francisco': 'San Francisco',
  sydney: 'Sydney',
  melbourne: 'Melbourne',
  berlin: 'Berlin',
  munich: 'Munich',
  amsterdam: 'Amsterdam',
  dublin: 'Dublin',
  paris: 'Paris',
  tokyo: 'Tokyo',
};

const INDIA_CITIES = new Set([
  'Ahmedabad', 'Bengaluru', 'Bhopal', 'Bhubaneswar', 'Chandigarh', 'Chennai',
  'Coimbatore', 'Delhi NCR', 'Faridabad', 'Ghaziabad', 'Gurugram', 'Guwahati',
  'Hyderabad', 'Indore', 'Jaipur', 'Kanpur', 'Kochi', 'Kolkata', 'Lucknow',
  'Ludhiana', 'Madurai', 'Mangaluru', 'Mumbai', 'Mysuru', 'Nagpur', 'Nashik',
  'Navi Mumbai', 'Noida', 'Patna', 'Pimpri-Chinchwad', 'Pune', 'Raipur',
  'Rajkot', 'Ranchi', 'Surat', 'Thane', 'Thiruvananthapuram', 'Vadodara',
  'Varanasi', 'Visakhapatnam',
]);

const COUNTRY_ALIASES = {
  in: 'India', india: 'India', us: 'United States', usa: 'United States',
  'united states': 'United States', uk: 'United Kingdom', gb: 'United Kingdom',
  'great britain': 'United Kingdom', 'united kingdom': 'United Kingdom',
  ca: 'Canada', canada: 'Canada', au: 'Australia', australia: 'Australia',
  sg: 'Singapore', singapore: 'Singapore', de: 'Germany', germany: 'Germany',
  fr: 'France', france: 'France', nl: 'Netherlands', netherlands: 'Netherlands',
  ie: 'Ireland', ireland: 'Ireland', nz: 'New Zealand', 'new zealand': 'New Zealand',
  jp: 'Japan', japan: 'Japan', es: 'Spain', spain: 'Spain', it: 'Italy', italy: 'Italy',
  ae: 'United Arab Emirates', 'united arab emirates': 'United Arab Emirates',
  br: 'Brazil', brazil: 'Brazil', mx: 'Mexico', mexico: 'Mexico',
  za: 'South Africa', 'south africa': 'South Africa',
};

export const ADZUNA_COUNTRY_CODES = {
  India: 'in', 'United States': 'us', 'United Kingdom': 'gb', Canada: 'ca',
  Australia: 'au', Singapore: 'sg', Germany: 'de', France: 'fr',
  Netherlands: 'nl', Ireland: 'ie', 'New Zealand': 'nz', Japan: 'jp',
  Spain: 'es', Italy: 'it', 'United Arab Emirates': 'ae', Brazil: 'br',
  Mexico: 'mx', 'South Africa': 'za',
};

export const canonicalizeCity = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return CITY_ALIASES[normalizeKey(raw)] || raw.replace(/\s+/g, ' ');
};

export const canonicalizeCountry = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return COUNTRY_ALIASES[normalizeKey(raw)] || raw.replace(/\s+/g, ' ');
};

export const inferCountry = (city, explicitCountry = '') => {
  const country = canonicalizeCountry(explicitCountry);
  if (country) return country;
  const canonicalCity = canonicalizeCity(city);
  return INDIA_CITIES.has(canonicalCity) ? 'India' : '';
};

export const isKnownCity = (value) => {
  const city = canonicalizeCity(value);
  return INDIA_CITIES.has(city) || Object.values(CITY_ALIASES).includes(city);
};

export const parseLocation = (location, explicitCountry = '') => {
  const raw = String(location || '').trim();
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const inputCountry = explicitCountry || (parts.length > 1 ? parts.at(-1) : '');
  const cityText = parts.length > 1 ? parts.slice(0, -1).join(', ') : raw;
  const city = canonicalizeCity(cityText);
  const country = inferCountry(city, inputCountry);
  const isRemote = normalizeKey(city) === 'remote';
  return {
    raw,
    city: isRemote ? '' : city,
    country,
    isRemote,
    cacheCity: isRemote ? 'Remote' : city,
  };
};

export const canonicalizeLocationText = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    const country = canonicalizeCountry(parts.at(-1));
    return `${canonicalizeCity(parts.slice(0, -1).join(', '))}, ${country}`;
  }
  return canonicalizeCity(raw);
};

export const NEARBY_CITIES = {
  Pune: ['Pimpri-Chinchwad'],
  'Pimpri-Chinchwad': ['Pune'],
  Mumbai: ['Navi Mumbai', 'Thane'],
  'Navi Mumbai': ['Mumbai', 'Thane'],
  Thane: ['Mumbai', 'Navi Mumbai'],
  'Delhi NCR': ['Noida', 'Gurugram', 'Ghaziabad'],
  Noida: ['Delhi NCR', 'Ghaziabad', 'Gurugram'],
  Gurugram: ['Delhi NCR', 'Noida', 'Ghaziabad'],
  Ghaziabad: ['Delhi NCR', 'Noida', 'Gurugram'],
};

export const citiesForSearch = (city) => {
  const canonical = canonicalizeCity(city);
  return [canonical, ...(NEARBY_CITIES[canonical] || [])].filter(Boolean);
};

export const cityTextMatches = (text, city) => {
  const target = normalizeKey(city);
  const content = normalizeKey(text);
  if (!target || !content) return false;
  const paddedContent = ` ${content} `;
  if (paddedContent.includes(` ${target} `)) return true;
  const aliases = Object.entries(CITY_ALIASES).filter(([, canonical]) => canonical === city).map(([alias]) => alias);
  return aliases.some((alias) => paddedContent.includes(` ${normalizeKey(alias)} `));
};

export const normalizeCountryKey = normalizeKey;