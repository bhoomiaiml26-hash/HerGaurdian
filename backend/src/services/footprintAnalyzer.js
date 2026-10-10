/**
 * footprintAnalyzer.js
 * Context-Aware Privacy Risk Scoring Engine for HerGuardian AI Footprint Scanner.
 *
 * Evaluates submitted digital footprints (bios, posts, messages, or self-assessment questionnaires):
 * - Profile visibility: Private vs Public
 * - Contact information: Email and phone number exposure vs hidden/masked status
 * - Location exposure: No location vs city/recurring check-ins vs home address vs live location
 * - Post content: Benign artwork/hobbies vs routine schedules vs sensitive "home alone" disclosures
 * - Critical combinations: Public profile + Home address + Live location + Home alone status
 *
 * Scoring Scale: 0 - 100
 * - Low Risk:    0 - 29 (Minimal or no sensitive exposure; private profile or benign hobby content)
 * - Medium Risk: 30 - 69 (Moderate exposure; public email, routine city check-ins, or predictable schedule)
 * - High Risk:   70 - 100 (Severe exposure; public home address, live location sharing, home alone status)
 *
 * PRIVACY GUARANTEE:
 * All input content is analyzed purely in-memory and is never persisted to databases or external logs.
 */

// ── PATTERN RECOGNIZERS ────────────────────────────────────────────────────────

const PATTERNS = {
  // Profile Visibility
  privateProfile: /\b(private\s*(profile|account|visibility)?|account\s*is\s*private|profile\s*is\s*private|only\s*approved\s*followers)\b/i,
  publicProfile: /\b(public\s*(profile|account|visibility)?|account\s*is\s*public|profile\s*is\s*public|open\s*profile)\b/i,

  // Contact: Email
  emailHidden: /\b(email(\s*address)?(\s*and\s*phone(\s*number)?)?\s*(is|are)?\s*(hidden|not\s*visible|masked|private|undisclosed)|no\s*email\s*(shared|visible|posted)|email:\s*hidden)\b/i,
  emailVisible: /\b(email(\s*address)?(\s*and\s*phone(\s*number)?)?\s*(is|are)?\s*(visible|public|exposed|shared|listed)|public\s*email|contact(\s*me)?\s*(at|via)\s*email|email:\s*visible)\b/i,
  emailLiteral: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,

  // Contact: Phone
  phoneHidden: /\b((email(\s*address)?\s*and\s*)?phone(\s*number)?\s*(is|are)?\s*(hidden|not\s*visible|masked|private|undisclosed)|no\s*phone\s*(shared|visible|posted)|phone:\s*hidden)\b/i,
  phoneVisible: /\b((email(\s*address)?\s*and\s*)?phone(\s*number)?\s*(is|are)?\s*(visible|public|exposed|shared|listed)|call|whatsapp|mobile(\s*number)?\s*(is\s*)?(visible|public)|phone:\s*visible)\b/i,
  phoneLiteral: /(?:\+?91[\s\-]?)?[6-9]\d{9}|\+?[1-9]\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{1,4}[\s\-.]?\d{1,9}/g,

  // Location: None / Protected
  noLocation: /\b(no\s*location(\s*is)?\s*(shared|visible|posted|tagged)|location\s*(is\s*)?(hidden|turned\s*off|disabled|private|not\s*shared)|location:\s*none)\b/i,

  // Location: Home Address / Precise Residence
  homeAddressHidden: /\b(home\s*address\s*(is\s*)?(hidden|not\s*shared|private)|no\s*(home\s*)?address\s*(shared|visible))\b/i,
  homeAddressExposed: /\b(home\s*address\s*(and\s*live\s*location\s*)?(is\s*|are\s*)?(publicly\s*)?(shared|visible|exposed|posted)|home\s*address\s*public|residential\s*address\s*(shared|exposed)|live\s*at\s+[\w\s,]+)\b/i,
  physicalAddressPattern: [
    /\b\d+[A-Za-z]?\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Block|Sector|Nagar|Colony|Layout|Apartment|Flat|Floor)\b/i,
    /\bFlat\s+No\.?\s*\d+/i,
    /\bPlot\s+No\.?\s*\d+/i,
    /\bH\.?No\.?\s*\d+/i,
  ],

  // Location: Live Location / Real-Time Whereabouts
  liveLocationHidden: /\b(no\s*live\s*location|live\s*location\s*(is\s*)?(hidden|off|disabled|not\s*shared))\b/i,
  liveLocationExposed: /\b(live\s*location\s*(is\s*|are\s*)?(publicly\s*)?(shared|visible|broadcast|enabled|on)|(real-?time\s*whereabouts|current\s*live\s*location)\s*(are\s*|is\s*)?(disclosed|shared|posted|visible)|sharing\s*(my\s*)?live\s*location)\b/i,

  // Location: City & Routine Check-ins
  cityCheckInsExposed: /\b(city\s*and\s*recurring\s*check-in|recurring\s*check-in\s*locations|check-in\s*locations\s*(are\s*)?shared|frequent\s*check-?ins?|city\s*check-?ins?)\b/i,
  routinePlacesExposed: /\b(routine\s*(places|locations)\s*and\s*activities|predictable\s*routine|regular\s*(schedule|places)|commute\s*to\s+[\w\s]+every|every\s*(morning|evening|day)\s*at)\b/i,

  // Posts: Vulnerable Situations (Home Alone)
  homeAloneExposed: /\b(home\s*alone|alone\s*at\s*home|living\s*alone|when\s*(the\s*person\s*is|i\s*am)\s*home\s*alone|parents\s*(are\s*)?out\s*of\s*town|house\s*to\s*myself|traveling\s*alone\s*tonight)\b/i,

  // Posts: Benign Artwork & General Hobbies (Explicitly Safe)
  benignHobbies: /\b(general\s*artwork\s*and\s*hobbies|artwork|paintings|art\s*portfolio|drawings|illustrations|hobbies|crafts|cooking\s*recipes|sunset\s*photos|nature\s*photography|landscape\s*art|sketching)\b/i,

  // Sensitive Financial / Government IDs
  financialIdOvershare: [
    { pattern: /\b(?:salary|income|i earn|i make)\s*(?:rs\.?|₹|inr)?\s*[\d,]+/i, label: 'Income Details', severity: 'medium' },
    { pattern: /\bbank account\s*(?:number|no|#)\b/i, label: 'Bank Account Number', severity: 'critical' },
    { pattern: /\bpassport\s*(?:number|no)\b/i, label: 'Passport Reference', severity: 'critical' },
    { pattern: /\b(aadhar|aadhaar|pan card|voter id)\b/i, label: 'Government Identity Document', severity: 'critical' },
  ],
};

/**
 * Analyzes submitted footprint text or structured fields.
 * Returns { riskScore, overallRiskLevel, findings, reasoning, limitations, findingCount }
 */
export function analyzeFootprint(input) {
  if (!input || (typeof input === 'string' && !input.trim())) {
    throw new Error('Analysis input is required and cannot be empty.');
  }

  // Support both raw string or structured object
  let text = '';
  let meta = {};
  if (typeof input === 'string') {
    text = input.trim();
  } else if (typeof input === 'object') {
    meta = input;
    text = [
      input.text || '',
      input.bio || '',
      input.profileVisibility ? `Profile visibility: ${input.profileVisibility}` : '',
      input.emailExposure ? `Email: ${input.emailExposure}` : '',
      input.phoneExposure ? `Phone: ${input.phoneExposure}` : '',
      input.locationExposure ? `Location: ${input.locationExposure}` : '',
      input.postsContent ? `Posts: ${input.postsContent}` : '',
    ].filter(Boolean).join('. ');
  }

  if (!text || text.length === 0) {
    throw new Error('Input text cannot be empty.');
  }

  if (text.length > 10000) {
    throw new Error('Input exceeds the maximum allowed length of 10,000 characters.');
  }

  const findings = [];
  let calculatedScore = 5; // Minimal baseline for having any digital footprint

  // 1. Profile Visibility
  const isExplicitPrivate = meta.profileVisibility === 'private' || PATTERNS.privateProfile.test(text);
  const isExplicitPublic = meta.profileVisibility === 'public' || PATTERNS.publicProfile.test(text);

  if (isExplicitPrivate) {
    findings.push({
      type: 'profile_visibility_private',
      severity: 'low',
      title: 'Private Profile Configuration',
      evidence: 'Profile visibility is restricted to approved connections.',
      reasoning: 'Keeping your profile private prevents search engines and unverified strangers from discovering your personal activities.',
      recommendation: 'Maintain your private account status and periodically review pending follower requests.',
      status: 'resolved',
    });
  } else if (isExplicitPublic) {
    calculatedScore += 10;
    findings.push({
      type: 'profile_visibility_public',
      severity: 'medium',
      title: 'Public Profile Visibility',
      evidence: 'Profile is open and viewable by anyone on the internet.',
      reasoning: 'A public profile allows any third party, scraper, or unknown individual to view your updates without your explicit approval.',
      recommendation: 'Ensure that sensitive details such as contact info and physical whereabouts are never posted on a public profile.',
      status: 'to_review',
    });
  }

  // 2. Email Exposure
  const isEmailHidden = PATTERNS.emailHidden.test(text);
  const hasLiteralEmail = !isEmailHidden && text.match(PATTERNS.emailLiteral);
  const isEmailVisible = !isEmailHidden && (PATTERNS.emailVisible.test(text) || (hasLiteralEmail && hasLiteralEmail.length > 0));

  if (isEmailHidden) {
    findings.push({
      type: 'email_hidden',
      severity: 'low',
      title: 'Email Address Protected',
      evidence: 'Email address is kept hidden from public view.',
      reasoning: 'Hiding your personal email protects you from spear-phishing campaigns and automated spam harvesting.',
      recommendation: 'Continue keeping your primary personal email hidden from public bios.',
      status: 'resolved',
    });
  } else if (isEmailVisible) {
    const points = isExplicitPrivate ? 5 : 15;
    calculatedScore += points;
    findings.push({
      type: 'email_exposed',
      severity: isExplicitPrivate ? 'low' : 'medium',
      title: 'Public Email Address Exposure',
      evidence: hasLiteralEmail ? `Email address found: ${hasLiteralEmail[0].replace(/(?<=.{2}).(?=[^@]*?@)/g, '*')}` : 'Email address is visible on your profile.',
      reasoning: 'Publicly exposing your email makes you a target for phishing scams, impersonation attempts, and credential stuffing.',
      recommendation: 'Remove your direct email from your bio. Use in-app messaging or a secondary disposable contact form instead.',
      status: 'to_review',
    });
  }

  // 3. Phone Number Exposure
  const isPhoneHidden = PATTERNS.phoneHidden.test(text);
  const hasLiteralPhone = !isPhoneHidden && text.match(PATTERNS.phoneLiteral);
  const isPhoneVisible = !isPhoneHidden && (PATTERNS.phoneVisible.test(text) || (hasLiteralPhone && hasLiteralPhone.length > 0));

  if (isPhoneHidden) {
    findings.push({
      type: 'phone_hidden',
      severity: 'low',
      title: 'Phone Number Protected',
      evidence: 'Phone number is hidden from the profile.',
      reasoning: 'Keeping your phone number private guards against unsolicited calls, SIM swapping, and identity lookup via messaging apps.',
      recommendation: 'Never post your personal phone number on online profiles.',
      status: 'resolved',
    });
  } else if (isPhoneVisible) {
    const points = isExplicitPrivate ? 10 : 25;
    calculatedScore += points;
    findings.push({
      type: 'phone_exposed',
      severity: isExplicitPrivate ? 'medium' : 'high',
      title: 'Phone Number Exposure',
      evidence: hasLiteralPhone ? 'Direct phone number was detected in profile content.' : 'Phone number is publicly visible.',
      reasoning: 'Phone numbers can be linked to your WhatsApp, UPI IDs, or personal accounts, creating high risks of stalking and unsolicited contact.',
      recommendation: 'Immediately remove your phone number. Rely strictly on in-app platform communications.',
      status: 'to_review',
    });
  }

  // 4. Location Exposures
  const isNoLocation = PATTERNS.noLocation.test(text);

  // 4a. Home Address
  const isHomeAddressHidden = PATTERNS.homeAddressHidden.test(text);
  const hasPhysicalPattern = !isHomeAddressHidden && PATTERNS.physicalAddressPattern.some((p) => p.test(text));
  const isHomeAddressExposed = !isHomeAddressHidden && (PATTERNS.homeAddressExposed.test(text) || hasPhysicalPattern);

  if (isHomeAddressExposed) {
    const points = isExplicitPrivate ? 20 : 35;
    calculatedScore += points;
    findings.push({
      type: 'home_address_exposed',
      severity: isExplicitPrivate ? 'high' : 'critical',
      title: 'Physical Home Address Exposure',
      evidence: 'Home address or specific residential location was detected.',
      reasoning: 'Revealing your home address presents an immediate safety risk of physical stalking, unwanted in-person visits, and burglary.',
      recommendation: 'Remove your residential address immediately from all public and semi-public platforms.',
      status: 'to_review',
    });
  }

  // 4b. Live Location & Real-Time Whereabouts
  const isLiveLocationHidden = PATTERNS.liveLocationHidden.test(text);
  const isLiveLocationExposed = !isLiveLocationHidden && PATTERNS.liveLocationExposed.test(text);

  if (isLiveLocationExposed) {
    const points = isExplicitPrivate ? 15 : 30;
    calculatedScore += points;
    findings.push({
      type: 'live_location_exposed',
      severity: isExplicitPrivate ? 'high' : 'critical',
      title: 'Real-Time Live Location Disclosed',
      evidence: 'Live location sharing or real-time whereabouts are broadcast.',
      reasoning: 'Broadcasting your real-time coordinates enables anyone to know your exact current location, leaving you vulnerable to immediate stalking.',
      recommendation: 'Disable real-time location sharing and avoid tagging current locations until you have left the venue.',
      status: 'to_review',
    });
  }

  // 4c. City & Routine Check-in Locations
  const isCityCheckIns = !isNoLocation && PATTERNS.cityCheckInsExposed.test(text);
  const isRoutinePlaces = PATTERNS.routinePlacesExposed.test(text);

  if (isCityCheckIns || isRoutinePlaces) {
    const points = isExplicitPrivate ? 10 : 20;
    calculatedScore += points;
    findings.push({
      type: 'routine_location_exposed',
      severity: 'medium',
      title: 'Routine Check-In & Location Patterns',
      evidence: isCityCheckIns
        ? 'City and recurring check-in locations are shared.'
        : 'Routine places and travel patterns are disclosed.',
      reasoning: 'Frequent check-ins and routine disclosures make your movements and daily schedule predictable to observers.',
      recommendation: 'Avoid sharing regular schedules or predictable routes. Delay check-in posts until you have moved to another location.',
      status: 'to_review',
    });
  } else if (isNoLocation && !isHomeAddressExposed && !isLiveLocationExposed) {
    findings.push({
      type: 'location_protected',
      severity: 'low',
      title: 'Location Information Protected',
      evidence: 'No physical location or check-in data is shared.',
      reasoning: 'Keeping location tags disabled prevents observers from mapping your habits or identifying your home base.',
      recommendation: 'Continue keeping location services disabled for public posts.',
      status: 'resolved',
    });
  }

  // 5. Post Content & Vulnerable Situations
  const isHomeAlone = PATTERNS.homeAloneExposed.test(text);
  if (isHomeAlone) {
    const points = 20;
    calculatedScore += points;
    findings.push({
      type: 'home_alone_disclosure',
      severity: 'high',
      title: 'Vulnerable Situation / Home Alone Disclosure',
      evidence: 'Posts indicate when you are home alone or disclose real-time solitary whereabouts.',
      reasoning: 'Advertising that you are home alone or isolated communicates acute physical vulnerability and substantially elevates risk.',
      recommendation: 'Never post about being home alone, traveling alone late, or when your family is away.',
      status: 'to_review',
    });
  }

  // 6. Benign Artwork & Hobbies
  const isBenignHobbies = PATTERNS.benignHobbies.test(text);
  if (isBenignHobbies && !isHomeAddressExposed && !isLiveLocationExposed && !isHomeAlone) {
    findings.push({
      type: 'benign_hobby_content',
      severity: 'low',
      title: 'Safe Creative / Hobby Content',
      evidence: 'Posts contain general artwork, creative projects, or general hobbies.',
      reasoning: 'Sharing artistic work or general interests without personal identifiers does not increase safety risk.',
      recommendation: 'Sharing hobbies and art is safe provided personal contact and location details remain protected.',
      status: 'resolved',
    });
  }

  // 7. Oversharing: Financial & Government IDs
  for (const { pattern, label, severity } of PATTERNS.financialIdOvershare) {
    if (pattern.test(text)) {
      calculatedScore += severity === 'critical' ? 35 : 15;
      findings.push({
        type: 'sensitive_identifier_exposed',
        severity,
        title: `${label} Detected`,
        evidence: `Content appears to reference sensitive personal data (${label.toLowerCase()}).`,
        reasoning: 'Sharing government identifiers or financial information opens you up to identity theft, financial fraud, and unauthorized loans.',
        recommendation: 'Never share official government identity cards, bank account details, or income figures publicly.',
        status: 'to_review',
      });
    }
  }

  // 8. Cross-platform Usernames
  const usernameMatches = text.match(/@[\w._]{3,}/g);
  if (usernameMatches && usernameMatches.length > 2) {
    calculatedScore += 5;
    findings.push({
      type: 'cross_platform_usernames',
      severity: 'low',
      title: 'Multiple Account Usernames Linked',
      evidence: `Detected ${usernameMatches.length} username tags.`,
      reasoning: 'Reusing or linking handles across accounts allows trackers to connect your different digital footprints.',
      recommendation: 'Consider separating your personal, creative, and professional handles.',
      status: 'to_review',
    });
  }

  // ── COMBINATION SYNERGIES & CONTEXT MULTIPLIERS ──────────────────────────────
  // If home address + live location + home alone are exposed on a public profile:
  // Extreme compounding physical threat
  if ((isHomeAddressExposed || isLiveLocationExposed) && isHomeAlone && !isExplicitPrivate) {
    calculatedScore += 15;
  }

  // If public profile + email + phone + location check-ins:
  if (isExplicitPublic && isEmailVisible && isPhoneVisible && isCityCheckIns) {
    calculatedScore += 10;
  }

  // Dampen score if explicitly private profile and no critical address/live location exposed:
  if (isExplicitPrivate && !isHomeAddressExposed && !isLiveLocationExposed) {
    calculatedScore = Math.min(calculatedScore, 25);
  }

  // If public profile contains ONLY artwork/hobbies with NO contact/location exposures:
  if (isExplicitPublic && isBenignHobbies && !isEmailVisible && !isPhoneVisible && !isHomeAddressExposed && !isLiveLocationExposed && !isCityCheckIns && !isHomeAlone) {
    calculatedScore = Math.min(calculatedScore, 20);
  }

  // Final score clamping (0 to 100)
  const finalScore = Math.min(100, Math.max(5, Math.round(calculatedScore)));

  // Determine overall risk level using explicit documented thresholds
  let overallRiskLevel = 'low';
  if (finalScore >= 70) {
    overallRiskLevel = 'high';
  } else if (finalScore >= 30) {
    overallRiskLevel = 'medium';
  } else {
    overallRiskLevel = 'low';
  }

  // Generate overarching summary reasoning
  let reasoning = '';
  if (overallRiskLevel === 'high') {
    reasoning = 'High risk detected due to critical exposure of physical residence, real-time live location, or solitary personal vulnerability. These disclosures significantly heighten the danger of in-person stalking, physical compromise, or targeted harassment.';
  } else if (overallRiskLevel === 'medium') {
    reasoning = 'Medium risk detected due to exposed contact details (such as public email) and predictable location check-in patterns. While exact home coordinates remain private, these clues enable routine tracking and targeted digital outreach.';
  } else {
    reasoning = 'Low risk detected. Your digital footprint is well-protected with minimal or no sensitive exposure. Contacts and locations are properly shielded, or posts are limited to non-sensitive creative hobbies.';
  }

  const limitations = 'This assessment is based exclusively on the information you provided in this self-assessment. The scanner did not search external social media platforms or index your profiles online.';

  return {
    riskScore: finalScore,
    overallRiskLevel,
    findings,
    reasoning,
    limitations,
    findingCount: findings.length,
  };
}

export default { analyzeFootprint };
