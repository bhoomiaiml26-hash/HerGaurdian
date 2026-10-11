/**
 * messageClassifier.js
 * Advanced Context-Aware NLP, Dynamic Scoring & Gemini AI Safety Analyzer for HerGuardian AI.
 *
 * Architecture:
 * 1. Context & Negation Analysis (Distinguishes "don't share OTP" vs "send me your OTP")
 * 2. Granular Evidence-Based Safety Indicator Engine (Financial, Phishing, Job Scam, Threats, Blackmail)
 * 3. Dynamic Additive Risk Scoring (Calculates individual score based on actual evidence, 0-100)
 * 4. Dual-Engine Synthesis:
 *    - Primary: Google Gemini 2.5 Flash for deeply contextual, input-specific reasoning and advice
 *    - Fallback: Evidence-grounded dynamic synthesizer quoting exact details if Gemini is rate-limited/offline
 *
 * PRIVACY GUARANTEE:
 * Operates strictly in-memory. User messages are never stored in databases or permanent logs.
 */

import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1 // Low temperature for consistent, factual safety evaluations
      }
    });
  } catch (err) {
    console.warn('[SafetyAnalyzer] Gemini initialization notice:', err.message);
  }
}

// ==========================================
// 1. NEGATION & PROTECTIVE ADVICE DETECTOR
// ==========================================

const PROTECTIVE_NEGATIONS = [
  /\b(do not|don'?t|never|must not|should not|shouldn'?t)\s+(share|send|give|disclose|provide|tell)\s+(your\s+)?(otp|pin|password|cvv|bank\s+details|card\s+number)/i,
  /\b(never\s+share\s+your\s+otp)\b/i,
  /\b(please\s+don'?t\s+share\s+your\s+otp\s+with\s+anyone)\b/i,
  /\b(bank\s+never\s+asks\s+for\s+(otp|password|pin))/i,
  /\b(no\s+(registration|entry|training|joining|onboarding)\s+fee\s+(is\s+)?(required|needed|taken|charged))\b/i,
  /\b(zero\s+fee|without\s+any\s+(fee|payment|charge)|free\s+of\s+cost)\b/i,
  /\b(stop\s+messaging\s+me|leave\s+me\s+alone|don'?t\s+(message|text|call)\s+me)\b/i,
];

function isProtectiveOrDefensiveAdvice(text) {
  return PROTECTIVE_NEGATIONS.some(pattern => pattern.test(text));
}

// ==========================================
// 2. CONTEXTUAL INDICATOR EXTRACTION
//    (MASSIVELY EXPANDED COVERAGE)
// ==========================================

export function detectSafetyEvidence(text) {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const indicators = [];
  let addedPoints = 0;

  // Check for defensive/protective advice first
  const isProtective = isProtectiveOrDefensiveAdvice(clean);

  // ────────────────────────────────────────
  // 1. ACTIVE OTP / CREDENTIAL HARVESTING
  // ────────────────────────────────────────
  const isOtpRequest = /\b(send|give|enter|share|provide|verify|type|submit|tell\s+me)\s+(me\s+)?(your\s+)?(bank\s+)?(otp|one[\s-]time\s+password|upi\s+pin|atm\s+pin|password|login\s+credentials|cvv|card\s+number|account\s+number|ifsc|bank\s+details)\b/i.test(clean) &&
    !isProtective;

  if (isOtpRequest) {
    indicators.push({
      type: 'OTP_REQUEST',
      label: 'Requests sensitive OTP, PIN, or login credentials',
      points: 25,
      severity: 'high'
    });
    addedPoints += 25;
  }

  // ────────────────────────────────────────
  // 2. SUSPICIOUS LINK / CREDENTIAL HARVEST URL
  // ────────────────────────────────────────
  const hasLink = /(https?:\/\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+|\.xyz\b|\.top\b|\.online\b|\.live\b|(click|open|tap|visit|using|use|via|through|follow|on)\s+(this\s+|the\s+)?(url|link|website)|link\s+(below|here))/i.test(clean);
  if (hasLink) {
    indicators.push({
      type: 'SUSPICIOUS_LINK',
      label: 'Directs user to an external or unverified link',
      points: 20,
      severity: 'medium'
    });
    addedPoints += 20;
  }

  // ────────────────────────────────────────
  // 3. FAKE ACCOUNT WARNING / PANIC URGENCY
  // ────────────────────────────────────────
  const hasUrgentAccountWarning = /\b(account\s+(will\s+be|has\s+been|is)\s+(blocked|suspended|closed|deactivated|frozen|locked|terminated)|pan\s+card\s+not\s+linked|kyc\s+expired|sim\s+card\s+(will\s+be\s+)?blocked|power\s+will\s+be\s+disconnected|within\s+\d+\s+(hours?|minutes?)|immediately|today\s+itself|last\s+(chance|warning|notice)|final\s+warning|urgent\s+action\s+required|act\s+now|respond\s+immediately)\b/i.test(clean);
  if (hasUrgentAccountWarning) {
    indicators.push({
      type: 'URGENT_WARNING',
      label: 'Creates high urgency or threatens immediate account/service blocking',
      points: 15,
      severity: 'medium'
    });
    addedPoints += 15;
  }

  // ────────────────────────────────────────
  // 4. REQUEST FOR ADVANCE PAYMENT / REGISTRATION FEE
  // ────────────────────────────────────────
  const hasAdvanceFee = /\b(pay\s+(₹|rs\.?|inr)?\s*\d+|deposit\s+(₹|rs\.?|inr)?\s*\d+|registration\s+fee|processing\s+fee|joining\s+fee|entry\s+fee|upfront\s+fee|clearance\s+charge|security\s+deposit|customs\s+(penalty|duty|charge)|transfer\s+(₹|rs\.?|inr)?\s*\d+|send\s+(₹|rs\.?|inr)?\s*\d+)\b/i.test(clean) &&
    !/\b(no\s+registration\s+fee|free\s+of\s+cost|without\s+fee)\b/i.test(clean);

  if (hasAdvanceFee) {
    indicators.push({
      type: 'ADVANCE_PAYMENT_REQUEST',
      label: 'Requests upfront money, registration fee, or processing deposit',
      points: 20,
      severity: 'high'
    });
    addedPoints += 20;
  }

  // ────────────────────────────────────────
  // 5. UNREALISTIC REWARD / LOTTERY / EARNINGS PROMISE
  // ────────────────────────────────────────
  const hasUnrealisticReward = /\b(won\s+(₹|rs\.?|inr)?\s*[\d,]+|lottery\s+prize|cash\s+prize|kbc\s+lottery|lucky\s+draw|earn\s+(₹|rs\.?|inr)?\s*[\d,]+\s*(daily|every\s+week|per\s+day|monthly|weekly)|double\s+your\s+money|guaranteed\s+(returns?|profit)|congratulations.*you\s+(have\s+)?(won|been\s+selected)|selected\s+as\s+(a\s+)?winner|claim\s+your\s+(prize|reward|money))\b/i.test(clean);
  if (hasUnrealisticReward) {
    indicators.push({
      type: 'UNREALISTIC_REWARD',
      label: 'Promises unrealistic lottery prizes, instant cash, or excessive earnings',
      points: 15,
      severity: 'medium'
    });
    addedPoints += 15;
  }

  // ────────────────────────────────────────
  // 6. WORK FROM HOME OR TASK-BASED JOB SCAM SIGNALS
  // ────────────────────────────────────────
  const hasJobLanguage = /\b(work\s+from\s+home\s+job|part[\s-]time\s+job\s+opportunity|liking\s+(youtube\s+)?videos|rating\s+products|typing\s+jobs?|selected\s+for\s+(a\s+)?(job|position|role)|joining\s+letter|appointment\s+letter|data\s+entry\s+job|online\s+earning|work\s+from\s+home\s+opportunity|freelance\s+job\s+offer)\b/i.test(clean);

  const hasClassicJobScam = hasJobLanguage && hasAdvanceFee;
  const hasEarnAndPayScam = hasUnrealisticReward && hasAdvanceFee &&
    /\b(earn|income|salary|payment|make\s+money)\b/i.test(clean);
  const hasJobScamOffer = hasClassicJobScam || hasEarnAndPayScam;

  // Compound scam: lottery/reward + registration/advance fee (e.g., KBC scam)
  if (hasUnrealisticReward && hasAdvanceFee && !hasJobScamOffer) {
    indicators.push({
      type: 'COMPOUND_SCAM',
      label: 'Combines prize/lottery claims with advance fee demand — classic advance-fee fraud',
      points: 25,
      severity: 'high'
    });
    addedPoints += 25;
  }

  if (hasJobScamOffer) {
    indicators.push({
      type: 'JOB_SCAM_FLAGS',
      label: 'Combines unrealistic earnings promise with demands for upfront fee payment',
      points: 20,
      severity: 'high'
    });
    addedPoints += 20;
  }

  // ────────────────────────────────────────
  // 7. BLACKMAIL / PRIVATE DATA EXTORTION
  // ────────────────────────────────────────
  const hasBlackmail = /\b(knows?\s+your\s+private\s+(information|photos?|videos?|secrets?)|private\s+photos?|video\s+recordings?|leak\s+your|upload\s+them\s+to|goes?\s+viral|intimate\s+(photos?|videos?|images?|pictures?)|tell\s+everyone|ruin\s+your\s+reputation|make\s+(it|this|them|your\s+\w+)\s+(public|viral|go\s+viral)|expose\s+(you|your)|everyone\s+will\s+(see|know)|share\s+(your|these|this|those)\s+(photos?|pictures?|videos?|images?|secrets?)\s+(with|on|to)|spread\s+(your|these|this|those)\s+(photos?|pictures?|videos?|images?)|send\s+(your|these|this|those)\s+(photos?|pictures?|videos?|images?)\s+to\s+(your|everyone|all|family|friends|contacts)|screen\s*shots?\s+(of|from)\s+our\s+chat|forward\s+(your|these|this|those)\s+(chat|messages?|conversation))/i.test(clean);

  if (hasBlackmail) {
    indicators.push({
      type: 'BLACKMAIL_EXTORTION',
      label: 'Threatens exposure of private information, photos, or confidential data',
      points: 35,
      severity: 'critical'
    });
    addedPoints += 35;
  }

  // ────────────────────────────────────────
  // 8. DIRECT PHYSICAL THREAT / COERCION
  //    (SIGNIFICANTLY EXPANDED)
  // ────────────────────────────────────────
  const physicalThreatPatterns = [
    // "I will hurt/kill/harm you" variations
    /\b(i('?ll|\s+will|\s+am\s+going\s+to|\s+gonna)\s+(hurt|kill|harm|destroy|beat|attack|murder|slap|punch|stab|shoot|strangle|choke|burn|assault|rape|abuse|finish|end)\s+(you|her|him|them|ur))/i,
    // Acid/violence
    /\b(throw\s+acid|acid\s+attack|break\s+your\s+(legs?|arms?|bones?|face|head|teeth))/i,
    // "Come to your house/location" threats
    /\b(come\s+to\s+your\s+(house|home|office|hostel|pg|flat|college|school|workplace|door)|come\s+find\s+you|coming\s+(for|after)\s+you|hunt\s+you\s+down|track\s+you\s+down)/i,
    // "If you don't..." coercive threats
    /\b(if\s+you\s+don'?t\s+(meet|come|listen|obey|do\s+as|comply|pay|send|agree|respond))/i,
    // Consequence threats
    /\b(you\s+will\s+regret|face\s+the\s+consequences|you('?ll|\s+will)\s+pay\s+for\s+this|teach\s+you\s+a\s+lesson|show\s+you\s+what\s+happens|won'?t\s+let\s+you\s+(live|survive|escape|get\s+away))/i,
    // Location knowledge threats
    /\b(i\s+know\s+where\s+you\s+(live|stay|work|study)|know\s+your\s+(address|location|house|home|school|college|workplace|office))/i,
    // Death/life threats
    /\b(will\s+(not\s+)?let\s+you\s+live|won'?t\s+spare\s+you|destroy\s+your\s+life|end\s+your\s+life|make\s+you\s+disappear|bury\s+you|you('?re|\s+are)\s+(dead|finished|done\s+for)|your\s+days\s+are\s+numbered|blood\s+on\s+your\s+hands|dig\s+your\s+grave)/i,
    // Waiting/watching threats
    /\b(waiting\s+(for|outside)\s+(you|your)|watching\s+(you|your\s+every)|following\s+you|stalking\s+you|outside\s+your\s+(house|home|door|office|college|workplace))/i,
    // General "or else" threats
    /\b(or\s+else\b|or\s+(i('?ll|\s+will)|else|otherwise)\s+(kill|beat|hurt|harm|hunt|attack|destroy|find|shoot|stab|finish|bury)|better\s+(watch\s+out|be\s+careful|be\s+afraid|be\s+scared|run)|you\s+should\s+be\s+(afraid|scared|worried))\b/i,
    // Family threats
    /\b(harm\s+your\s+(family|parents?|mother|father|sister|brother|daughter|son|kids?|children|loved\s+ones?)|something\s+(bad|terrible|horrible)\s+(will\s+)?happen\s+to\s+(you|your))/i,
    // Kidnap/abduct
    /\b(kidnap|abduct|take\s+you\s+away|drag\s+you|grab\s+you|snatch\s+you)/i,
  ];

  const hasPhysicalThreat = physicalThreatPatterns.some(p => p.test(clean));

  if (hasPhysicalThreat) {
    indicators.push({
      type: 'PHYSICAL_THREAT',
      label: 'Contains explicit threats of bodily harm, stalking, or direct intimidation',
      points: 40,
      severity: 'critical'
    });
    addedPoints += 40;
  }

  // ────────────────────────────────────────
  // 9. SEXUAL HARASSMENT / SEXTORTION
  // ────────────────────────────────────────
  const sexualHarassmentPatterns = [
    /\b(send\s+(me\s+)?(your\s+)?(nudes?|naked\s+photos?|naked\s+pics?|body\s+pics?|sexy\s+photos?|sexy\s+pics?|intimate\s+photos?|private\s+photos?))/i,
    /\b(show\s+(me\s+)?(your\s+)?(body|boobs?|breasts?|ass|butt|private\s+parts?))/i,
    /\b(i\s+(want|wanna)\s+(to\s+)?(fuck|screw|bang|rape|have\s+sex\s+with|sleep\s+with)\s+(you|u|her))/i,
    /\b(sex\s+with\s+(me|you)|sexual\s+favou?rs?|sleep\s+with\s+me)/i,
    /\b(strip\s+for\s+me|take\s+off\s+your\s+(clothes|dress|top|shirt|bra)|undress\s+for\s+me|video\s+call\s+(me\s+)?naked|naked\s+video\s+call)/i,
    /\b(you('?re|\s+are)\s+(so\s+)?(hot|sexy|fuckable|bangable)|what('?s|\s+is)\s+your\s+(bra|body)\s+size|what\s+are\s+you\s+wearing)/i,
    /\b(sext(ing)?|cyber\s*sex|phone\s+sex|dirty\s+talk|send\s+naughty)/i,
    /\b(touch(ed|ing)?\s+(your|my|her)\s+(body|boobs?|breasts?|ass|butt|thighs?|private\s+parts?))/i,
    /\b(rape\s+(you|her|u)|molest|grope|fondle)/i,
  ];

  const hasSexualHarassment = sexualHarassmentPatterns.some(p => p.test(clean));

  if (hasSexualHarassment && !hasPhysicalThreat) {
    indicators.push({
      type: 'SEXUAL_HARASSMENT',
      label: 'Contains sexually explicit, coercive, or predatory language',
      points: 35,
      severity: 'critical'
    });
    addedPoints += 35;
  }

  // ────────────────────────────────────────
  // 10. STALKING / SURVEILLANCE LANGUAGE
  // ────────────────────────────────────────
  const stalkingPatterns = [
    /\b(i('?m|\s+am)\s+(watching|following|tracking|monitoring)\s+(you|your|u))/i,
    /\b(saw\s+you\s+(at|in|near|today|yesterday|walking|leaving|entering|with))/i,
    /\b(i\s+know\s+(what\s+you\s+(did|do|are\s+doing|were\s+doing)|who\s+you\s+(met|meet|were\s+with|talked\s+to|are\s+with)|everything\s+about\s+you|your\s+every\s+move))/i,
    /\b(everywhere\s+you\s+go|can'?t\s+(hide|escape|run)\s+from\s+me|no\s+matter\s+where\s+you\s+go|always\s+find\s+you|eyes\s+on\s+you|keeping\s+(tabs?|track|watch)\s+on\s+you)/i,
    /\b(installed\s+(a\s+)?(tracker|spyware|gps|app)\s+(on|in)\s+your|checking\s+your\s+(phone|messages?|social\s+media|location|whatsapp|instagram))/i,
    /\b(followed\s+you\s+(home|to\s+your|from|today|yesterday))/i,
  ];

  const hasStalking = stalkingPatterns.some(p => p.test(clean));

  if (hasStalking && !hasPhysicalThreat) {
    indicators.push({
      type: 'STALKING_SURVEILLANCE',
      label: 'Exhibits stalking, surveillance, or obsessive monitoring behavior',
      points: 30,
      severity: 'critical'
    });
    addedPoints += 30;
  }

  // ────────────────────────────────────────
  // 11. EMOTIONAL MANIPULATION / COERCIVE CONTROL
  // ────────────────────────────────────────
  const manipulationPatterns = [
    /\b(if\s+you\s+(leave|go|don'?t|refuse|say\s+no|reject|ignore|block)\s+.{0,40}(kill\s+myself|suicide|hurt\s+myself|end\s+my\s+life|die|cut\s+myself))/i,
    /\b(i('?ll|\s+will)\s+(kill|hurt|harm|cut|end)\s+(myself|my\s+life)\s+(if|because|because\s+of)\s+you)/i,
    /\b(no\s+one\s+(will\s+)?(love|want|marry|accept|trust)\s+(you|u)|you('?re|\s+are)\s+(nothing|worthless|useless|ugly|fat|disgusting|trash)\s+without\s+me)/i,
    /\b(you\s+can'?t\s+(live|survive|do\s+anything|manage|function)\s+without\s+me)/i,
    /\b(you\s+(owe|belong\s+to)\s+me|you('?re|\s+are)\s+(mine|my\s+property)|i\s+own\s+you)/i,
    /\b(don'?t\s+(talk|speak|go\s+out|meet|see|hang\s+out)\s+(to|with)\s+(anyone|anybody|other\s+(guys?|boys?|men|people|friends?)))/i,
    /\b(you('?re|\s+are)\s+not\s+allowed\s+to|i\s+forbid\s+you|you\s+need\s+my\s+permission)/i,
  ];

  const hasManipulation = manipulationPatterns.some(p => p.test(clean));

  if (hasManipulation && !hasPhysicalThreat && !hasBlackmail) {
    indicators.push({
      type: 'EMOTIONAL_MANIPULATION',
      label: 'Uses emotional manipulation, coercive control, or self-harm threats to control behavior',
      points: 30,
      severity: 'high'
    });
    addedPoints += 30;
  }

  // ────────────────────────────────────────
  // 12. HARASSMENT / HOSTILE INSULTS (EXPANDED)
  // ────────────────────────────────────────
  const harassmentPatterns = [
    /\b(you\s+(are|r)\s+(a\s+)?(useless|pathetic|ugly|worthless|disgusting|horrible|terrible|stupid|idiot|loser|pig|scum|shameless|bitch|slut|whore|prostitute|cunt|randi|kutiya|chutiya|madarchod|behenchod|kamini|haramkhor|characterless))/i,
    /\b(answer\s+me(\s+right\s+now)?|why\s+aren'?t\s+you\s+replying|why\s+are\s+you\s+ignoring\s+me|stop\s+ignoring\s+me|keep\s+(calling|messaging|texting|spamming)\s+you|pick\s+up\s+(my\s+)?(the\s+)?(call|phone)|reply\s+(now|immediately|right\s+now)|until\s+you\s+(reply|answer|respond))/i,
    /\b(die|go\s+die|go\s+to\s+hell|drop\s+dead|kill\s+yourself|kys)\b/i,
    /\b(you\s+deserve\s+(to\s+)?(die|suffer|be\s+raped|be\s+beaten|pain|punishment))/i,
    /\b(shut\s+(the\s+fuck\s+)?up|stfu|get\s+lost|fuck\s+(off|you|u)|f\s+u\b|go\s+fuck\s+yourself|piece\s+of\s+shit|son\s+of\s+a\s+bitch)/i,
    /\b(i('?ll|\s+will)\s+(ruin|destroy|end)\s+(your\s+)?(life|career|reputation|family|marriage|relationship))/i,
    /\b(you('?ll|\s+will)\s+(never\s+)?(find|get)\s+(a\s+)?(job|husband|man|life|happiness|peace))/i,
    /\b(no\s+one\s+(likes?|cares?\s+about|wants?)\s+you)/i,
    /\b(you\s+should\s+(be\s+)?asham(ed|e))/i,
    /\b(slap\s+you|beat\s+you|hit\s+you|punch\s+you)\b/i,
  ];

  const hasHarassment = harassmentPatterns.some(p => p.test(clean)) &&
    !hasPhysicalThreat && !hasBlackmail && !hasSexualHarassment;

  if (hasHarassment) {
    indicators.push({
      type: 'HARASSMENT_LANGUAGE',
      label: 'Contains demeaning, abusive, or persistently harassing language',
      points: 25,
      severity: 'medium'
    });
    addedPoints += 25;
  }

  // Persistent Unwanted Messaging / Contact
  const hasPersistentContact = /\b(why\s+are\s+you\s+ignoring\s+me|why\s+(aren'?t|don'?t|won'?t)\s+you\s+(reply|replying|answer|answering)|stop\s+ignoring\s+me|keep\s+(calling|messaging|texting|spamming)\s+you|until\s+you\s+(reply|answer|respond)|won'?t\s+stop\s+(messaging|calling|texting))\b/i.test(clean);
  if (hasPersistentContact) {
    indicators.push({
      type: 'PERSISTENT_UNWANTED_CONTACT',
      label: 'Repeated, unwanted, and persistent messaging or communication attempts',
      points: 20,
      severity: 'medium'
    });
    addedPoints += 20;
  }

  // ────────────────────────────────────────
  // 13. GENERAL MONEY DEMAND WITH THREAT/COERCION
  //     (Catches "Send me ₹5000 or I will..." patterns)
  // ────────────────────────────────────────
  const hasMoneyDemandWithThreat = /\b(send|give|transfer|pay)\s+(me\s+)?(₹|rs\.?|inr)?\s*\d+.{0,60}(or\s+(i('?ll|\s+will)|else|otherwise)|if\s+you\s+don'?t)/i.test(clean) ||
    /\b(if\s+you\s+don'?t\s+(send|give|transfer|pay)\s+(me\s+)?(₹|rs\.?|inr)?\s*\d+)/i.test(clean);

  if (hasMoneyDemandWithThreat && !hasAdvanceFee) {
    indicators.push({
      type: 'EXTORTION_DEMAND',
      label: 'Demands money coupled with threats or coercion',
      points: 35,
      severity: 'critical'
    });
    addedPoints += 35;
  }

  // ────────────────────────────────────────
  // 14. IMPERSONATION / AUTHORITY FRAUD
  // ────────────────────────────────────────
  const hasImpersonation = /\b(this\s+is\s+(from\s+)?(police|cyber\s*cell|cyber\s*crime|cbi|income\s+tax|it\s+department|rbi|customs|narcotics|court|judge|magistrate|advocate|lawyer)|calling\s+from\s+(police|bank|rbi|telecom|airtel|jio|vi\s+|vodafone)|arrest\s+warrant|fir\s+has\s+been\s+(filed|registered|lodged)|case\s+(has\s+been\s+)?(filed|registered)\s+against\s+you|legal\s+(action|proceedings?|notice)\s+(will\s+be\s+)?(taken|initiated|filed)\s+against\s+you|you\s+(will\s+be|are\s+being)\s+(arrested|prosecuted|summoned))\b/i.test(clean);

  if (hasImpersonation) {
    indicators.push({
      type: 'IMPERSONATION_FRAUD',
      label: 'Impersonates law enforcement, government authority, or legal bodies to intimidate',
      points: 25,
      severity: 'high'
    });
    addedPoints += 25;
  }

  // ────────────────────────────────────────
  // 15. MATRIMONIAL / ROMANCE SCAM SIGNALS
  // ────────────────────────────────────────
  const hasMatrimonialScam = /\b(i\s+(am|m)\s+(a\s+)?(nri|us\s+citizen|uk\s+citizen|abroad|settled\s+in\s+(usa|uk|canada|australia|dubai))\s+.{0,80}(marry|marriage|wedding|settle\s+down|life\s+partner))/i.test(clean) ||
    (/\b(marry|marriage|life\s+partner|settle\s+down|wedding)\b/i.test(clean) && hasAdvanceFee) ||
    /\b(love\s+jihad|honey\s*trap|catfish)/i.test(clean);

  if (hasMatrimonialScam) {
    indicators.push({
      type: 'MATRIMONIAL_SCAM',
      label: 'Exhibits patterns consistent with romance or matrimonial fraud',
      points: 20,
      severity: 'high'
    });
    addedPoints += 20;
  }

  // ────────────────────────────────────────
  // 16. GENTLE / ROUTINE PAYMENT INQUIRY
  // ────────────────────────────────────────
  const isGentlePaymentInquiry = /\b(can\s+you\s+(please\s+)?send\s+the\s+payment\s+when\s+you\s+get\s+time|reminder\s+for\s+(the\s+)?invoice|please\s+clear\s+the\s+bill)\b/i.test(clean) &&
    !hasUrgentAccountWarning && !hasUnrealisticReward && !hasLink && !isOtpRequest &&
    !hasPhysicalThreat && !hasBlackmail && !hasSexualHarassment;

  if (isGentlePaymentInquiry) {
    indicators.push({
      type: 'ROUTINE_FINANCIAL_INQUIRY',
      label: 'Financial transaction mention without scam or pressure indicators',
      points: 10,
      severity: 'low'
    });
    addedPoints += 10;
  }

  // ────────────────────────────────────────
  // 17. PRIVACY / PERSONAL DATA SOLICITATION
  //     (Home address, live location, identity docs)
  // ────────────────────────────────────────
  const privacyPatterns = [
    /\b(send|give|share|provide|tell)\s+(me\s+)?(your\s+)?(home\s+address|house\s+address|residential\s+address|current\s+address|where\s+you\s+live|full\s+address)\b/i,
    /\b(send|give|share|provide|turn\s+on)\s+(me\s+)?(your\s+)?(live\s+location|current\s+location|gps\s+location|pin\s+location|whatsapp\s+location)\b/i,
    /\b(send|give|share|upload|submit)\s+(me\s+)?(your\s+)?(aadhaar(\s+card)?|pan\s+card|passport(\s+copy)?|voter\s+id|driving\s+licen[sc]e|identity\s+proof|id\s+card(\s+copy)?|photo\s+id)\b/i,
    /\b(send|give|share)\s+(me\s+)?(your\s+)?(private|personal)\s+(photos?|pictures?|selfies?|pics?)\b/i,
  ];

  const hasPrivacyRequest = privacyPatterns.some(p => p.test(clean)) && !isProtective;

  if (hasPrivacyRequest) {
    indicators.push({
      type: 'PRIVACY_DATA_REQUEST',
      label: 'Requests sensitive personal details (home address, live location, or identity documents)',
      points: 25,
      severity: 'medium'
    });
    addedPoints += 25;
  }

  return {
    clean,
    isProtective,
    indicators,
    addedPoints
  };
}

// ==========================================
// 3. DETERMINISTIC DYNAMIC RISK CALCULATOR
// ==========================================

export function calculateEvidenceBasedRisk(evidence) {
  const { clean, isProtective, indicators, addedPoints } = evidence;

  const defaultBreakdown = [
    { category: "Threats & Intimidation", score: 0, max: 30 },
    { category: "Scam & Financial Fraud", score: 0, max: 30 },
    { category: "Harassment & Abuse", score: 0, max: 20 },
    { category: "Phishing & Credential Risks", score: 0, max: 20 },
    { category: "Privacy & Location Solicitation", score: 0, max: 15 }
  ];

  const defaultSignals = {
    scam: false,
    phishing: false,
    harassment: false,
    threat: false,
    blackmail: false,
    privacyRisk: false,
    sexualCoercion: false
  };

  // Case 1: Protective advice (e.g. "don't share your OTP")
  if (isProtective && indicators.length === 0) {
    return {
      category: 'NORMAL',
      riskScore: 5,
      riskLevel: 'Low',
      confidence: 0.98,
      isProtective: true,
      detectedSignals: defaultSignals,
      scoreBreakdown: defaultBreakdown
    };
  }

  // Case 2: Zero threat/scam indicators
  if (indicators.length === 0) {
    return {
      category: 'NORMAL',
      riskScore: 5,
      riskLevel: 'Low',
      confidence: 0.95,
      isProtective: false,
      detectedSignals: defaultSignals,
      scoreBreakdown: defaultBreakdown
    };
  }

  // Compound score: Base score + added evidence points
  let score = 10 + addedPoints;

  // Add bonus weighting for multiple co-occurring indicators
  if (indicators.length >= 4) {
    score += 20;
  } else if (indicators.length >= 3) {
    score += 15;
  } else if (indicators.length === 2) {
    score += 8;
  }

  // Ensure critical-severity indicators push score to at least HIGH range
  const hasCriticalIndicator = indicators.some(i => i.severity === 'critical');
  if (hasCriticalIndicator && score < 65) {
    score = 65; // Minimum HIGH for critical indicators
  }

  // Clamp strictly between 0 and 100
  score = Math.min(100, Math.max(0, Math.round(score)));

  // Resolve Category (priority order: most dangerous first)
  let category = 'SUSPICIOUS';
  const types = indicators.map(i => i.type);

  if (types.includes('BLACKMAIL_EXTORTION') || types.includes('EXTORTION_DEMAND')) {
    category = 'BLACKMAIL';
  } else if (types.includes('PHYSICAL_THREAT')) {
    category = 'THREAT';
  } else if (types.includes('SEXUAL_HARASSMENT')) {
    category = 'HARASSMENT';
  } else if (types.includes('STALKING_SURVEILLANCE')) {
    category = 'THREAT';
  } else if (types.includes('EMOTIONAL_MANIPULATION')) {
    category = 'HARASSMENT';
  } else if (types.includes('IMPERSONATION_FRAUD')) {
    category = 'PHISHING';
  } else if (types.includes('JOB_SCAM_FLAGS')) {
    category = 'JOB_SCAM';
  } else if (types.includes('MATRIMONIAL_SCAM')) {
    category = 'MATRIMONIAL_SCAM';
  } else if (types.includes('OTP_REQUEST') || (types.includes('SUSPICIOUS_LINK') && types.includes('URGENT_WARNING'))) {
    category = 'PHISHING';
  } else if (types.includes('ADVANCE_PAYMENT_REQUEST') || types.includes('UNREALISTIC_REWARD') || types.includes('COMPOUND_SCAM')) {
    category = 'FINANCIAL_SCAM';
  } else if (types.includes('PRIVACY_DATA_REQUEST')) {
    category = 'PRIVACY_RISK';
  } else if (types.includes('HARASSMENT_LANGUAGE') || types.includes('PERSISTENT_UNWANTED_CONTACT')) {
    category = 'HARASSMENT';
  } else if (types.includes('ROUTINE_FINANCIAL_INQUIRY')) {
    category = 'NORMAL';
    score = 25; // Keep low
  }

  // Resolve Risk Level according to specification:
  // 0-19: Low, 20-39: Caution, 40-59: Moderate, 60-79: High, 80-100: Critical
  let riskLevel = 'Low';
  if (score >= 80) riskLevel = 'Critical';
  else if (score >= 60) riskLevel = 'High';
  else if (score >= 40) riskLevel = 'Moderate';
  else if (score >= 20) riskLevel = 'Caution';
  else riskLevel = 'Low';

  // Compute detectedSignals object
  const detectedSignals = {
    scam: types.includes('ADVANCE_PAYMENT_REQUEST') || types.includes('UNREALISTIC_REWARD') || types.includes('COMPOUND_SCAM') || types.includes('JOB_SCAM_FLAGS') || types.includes('MATRIMONIAL_SCAM'),
    phishing: types.includes('OTP_REQUEST') || types.includes('SUSPICIOUS_LINK') || types.includes('URGENT_WARNING') || types.includes('IMPERSONATION_FRAUD'),
    harassment: types.includes('HARASSMENT_LANGUAGE') || types.includes('PERSISTENT_UNWANTED_CONTACT') || types.includes('EMOTIONAL_MANIPULATION') || types.includes('SEXUAL_HARASSMENT'),
    threat: types.includes('PHYSICAL_THREAT') || types.includes('STALKING_SURVEILLANCE') || types.includes('EXTORTION_DEMAND'),
    blackmail: types.includes('BLACKMAIL_EXTORTION') || types.includes('EXTORTION_DEMAND'),
    privacyRisk: types.includes('PRIVACY_DATA_REQUEST') || types.includes('STALKING_SURVEILLANCE'),
    sexualCoercion: types.includes('SEXUAL_HARASSMENT') || (types.includes('BLACKMAIL_EXTORTION') && /photos?|pictures?|videos?|nudes?/i.test(clean))
  };

  // Compute scoreBreakdown
  const scoreBreakdown = [
    {
      category: "Threats & Intimidation",
      score: Math.min(30, (types.includes('PHYSICAL_THREAT') ? 30 : 0) + (types.includes('EXTORTION_DEMAND') ? 15 : 0) + (types.includes('STALKING_SURVEILLANCE') ? 15 : 0)),
      max: 30
    },
    {
      category: "Scam & Financial Fraud",
      score: Math.min(30, (types.includes('COMPOUND_SCAM') ? 25 : 0) + (types.includes('ADVANCE_PAYMENT_REQUEST') ? 20 : 0) + (types.includes('JOB_SCAM_FLAGS') ? 20 : 0) + (types.includes('UNREALISTIC_REWARD') ? 15 : 0) + (types.includes('MATRIMONIAL_SCAM') ? 15 : 0)),
      max: 30
    },
    {
      category: "Harassment & Abuse",
      score: Math.min(20, (types.includes('HARASSMENT_LANGUAGE') ? 20 : 0) + (types.includes('PERSISTENT_UNWANTED_CONTACT') ? 15 : 0) + (types.includes('EMOTIONAL_MANIPULATION') ? 15 : 0) + (types.includes('SEXUAL_HARASSMENT') ? 20 : 0)),
      max: 20
    },
    {
      category: "Phishing & Credential Risks",
      score: Math.min(20, (types.includes('OTP_REQUEST') ? 20 : 0) + (types.includes('SUSPICIOUS_LINK') ? 15 : 0) + (types.includes('URGENT_WARNING') ? 10 : 0) + (types.includes('IMPERSONATION_FRAUD') ? 15 : 0)),
      max: 20
    },
    {
      category: "Privacy & Location Solicitation",
      score: Math.min(15, (types.includes('PRIVACY_DATA_REQUEST') ? 15 : 0) + (types.includes('STALKING_SURVEILLANCE') ? 10 : 0)),
      max: 15
    }
  ];

  // Confidence calculation
  let confidence = 0.85;
  if (category === 'THREAT' || category === 'BLACKMAIL' || (types.includes('OTP_REQUEST') && types.includes('SUSPICIOUS_LINK'))) {
    confidence = 0.96;
  } else if (types.includes('SEXUAL_HARASSMENT') || types.includes('STALKING_SURVEILLANCE')) {
    confidence = 0.94;
  } else if (types.includes('PRIVACY_DATA_REQUEST')) {
    confidence = 0.91;
  } else if (types.includes('ROUTINE_FINANCIAL_INQUIRY')) {
    confidence = 0.65;
  } else if (indicators.length >= 2) {
    confidence = 0.90;
  }

  return {
    category,
    riskScore: score,
    riskLevel,
    confidence,
    isProtective: false,
    detectedSignals,
    scoreBreakdown
  };
}

// ==========================================
// 4. EVIDENCE-SPECIFIC EXPLANATION GENERATOR (FALLBACK & SEED)
// ==========================================

function generateEvidenceSpecificExplanation(cleanText, evidence, riskData) {
  const { category, riskScore, riskLevel } = riskData;
  const { indicators, isProtective } = evidence;

  // Extract any specific amounts or names from the message to reference
  const amountMatch = cleanText.match(/(₹|rs\.?|inr)\s*[\d,]+/i);
  const detectedAmount = amountMatch ? amountMatch[0] : null;

  // Extract quoted threatening phrases for specificity
  const shortExcerpt = cleanText.length > 80 ? cleanText.substring(0, 77) + '...' : cleanText;

  let headline = "No Major Risk Indicators Detected";
  let explanation = "The message contains ordinary conversational language and does not exhibit known scam, phishing, harassment, or threat patterns.";
  let suggestedActions = [
    "No immediate safety flags detected.",
    "Maintain general caution when interacting with unknown senders.",
    "Never share OTPs, passwords, or personal banking credentials."
  ];

  if (isProtective) {
    headline = "Protective Digital Safety Advice";
    explanation = `HerGuardian identified this message as protective safety advice reminding the recipient to safeguard sensitive credentials. It does not solicit information and represents safe communication.`;
    suggestedActions = [
      "Follow this advice: never share your OTP, PIN, or password with anyone.",
      "Legitimate banks and services will never call or message to ask for your OTP.",
      "Keep digital security practices active on your devices."
    ];
    return { headline, explanation, suggestedActions };
  }

  const indicatorLabels = indicators.map(i => i.label);

  if (category === 'THREAT') {
    headline = "⚠ Serious Threat / Intimidation Detected";
    explanation = `HerGuardian flagged this message because it contains direct threats of harm, violence, stalking, or intimidation. Detected signals: ${indicatorLabels.join('; ')}. The message "${shortExcerpt}" exhibits language patterns associated with coercion and physical danger.`;
    suggestedActions = [
      "Do not engage, negotiate, or respond to the sender.",
      "Take uncropped screenshots of this message including timestamps and sender details as evidence.",
      "Block the sender across all communication platforms.",
      "If you feel immediately unsafe, contact emergency services (112) or the Women Helpline (1091) immediately.",
      "File an online complaint at cybercrime.gov.in or visit your nearest police station."
    ];
  } else if (category === 'BLACKMAIL') {
    headline = "⚠ Extortion / Blackmail Detected";
    explanation = `HerGuardian detected extortion or blackmail signals in this message. Detected signals: ${indicatorLabels.join('; ')}. ${detectedAmount ? `A monetary demand of ${detectedAmount} was detected.` : 'The message contains coercive demands linked to threats of exposure or harm.'}`;
    suggestedActions = [
      "Do NOT pay any money — paying encourages further demands.",
      "Do not engage, negotiate, or plead with the sender.",
      "Take uncropped screenshots of this message including timestamps and sender details.",
      "Block the sender across all communication platforms.",
      "Report immediately at cybercrime.gov.in or call the cyber helpline 1930.",
      "If you feel immediate danger, contact emergency services (112) or Women Helpline (1091)."
    ];
  } else if (category === 'JOB_SCAM') {
    headline = "Potential Job Scam Detected";
    explanation = `This message claims to offer employment or work-from-home tasks while demanding an advance payment${detectedAmount ? ` of ${detectedAmount}` : ''} for registration or onboarding. Legitimate employers never charge candidates money to start work. Detected signals: ${indicatorLabels.join('; ')}.`;
    suggestedActions = [
      `Do not pay any advance fee${detectedAmount ? ` (${detectedAmount})` : ''} or deposit for this job.`,
      "Independently verify the organization on LinkedIn or their official corporate website careers page.",
      "Never share bank details, UPI PINs, or ID documents before authenticating the employer.",
      "Report the recruitment message to cybercrime authorities or the platform support team."
    ];
  } else if (category === 'FINANCIAL_SCAM') {
    headline = "Potential Financial Scam Detected";
    explanation = `HerGuardian detected financial solicitation combining promises of rewards or claims${detectedAmount ? ` involving ${detectedAmount}` : ''} with demands for upfront payment. These patterns are characteristic of advance-fee financial fraud. Detected signals: ${indicatorLabels.join('; ')}.`;
    suggestedActions = [
      "Do not send money or enter your UPI PIN to claim any reward or prize.",
      "Remember that receiving money via UPI never requires entering your UPI PIN.",
      "Verify any lottery or bill payment claims directly through the official provider's customer care.",
      "Block the sender and report the fraudulent contact."
    ];
  } else if (category === 'PHISHING') {
    headline = "Possible Phishing Attempt Detected";
    explanation = `This message uses urgent language regarding account status and prompts the recipient to click an external link or share credentials. These are classic tactics used to steal banking or account credentials. Detected signals: ${indicatorLabels.join('; ')}.`;
    suggestedActions = [
      "Do NOT click on any links provided in this message.",
      "Never disclose your OTP, password, or account numbers.",
      "Check your account status directly via your bank's official mobile application or official website.",
      "Forward the suspicious message to your bank's fraud reporting email or call 1930."
    ];
  } else if (category === 'MATRIMONIAL_SCAM') {
    headline = "Potential Matrimonial / Romance Scam Detected";
    explanation = `HerGuardian detected patterns consistent with romance or matrimonial fraud. The message combines relationship/marriage language with suspicious elements. Detected signals: ${indicatorLabels.join('; ')}.`;
    suggestedActions = [
      "Do not send money to someone you haven't met in person or verified independently.",
      "Verify the person's identity through video calls and independent background checks.",
      "Be cautious of individuals who quickly profess love or propose marriage online.",
      "Report suspicious profiles on the matrimonial platform or dating app."
    ];
  } else if (category === 'HARASSMENT') {
    const hasSexual = indicators.some(i => i.type === 'SEXUAL_HARASSMENT');
    const hasStalking = indicators.some(i => i.type === 'STALKING_SURVEILLANCE');
    const hasEmotional = indicators.some(i => i.type === 'EMOTIONAL_MANIPULATION');

    if (hasSexual) {
      headline = "⚠ Sexual Harassment Detected";
      explanation = `This message contains sexually explicit, coercive, or predatory language. Detected signals: ${indicatorLabels.join('; ')}. This constitutes sexual harassment and is a punishable offense under Indian law.`;
      suggestedActions = [
        "Do not respond to sexually harassing messages.",
        "Take uncropped screenshots including timestamps and sender identity as evidence.",
        "Block the sender immediately across all platforms.",
        "Report to cybercrime.gov.in — sexual harassment online is punishable under IT Act sections 354A, 354D, and 509 IPC.",
        "Reach out to the National Commission for Women (NCW) helpline: 7827-170-170."
      ];
    } else if (hasStalking) {
      headline = "⚠ Stalking / Surveillance Behavior Detected";
      explanation = `This message exhibits stalking, surveillance, or obsessive monitoring behavior. Detected signals: ${indicatorLabels.join('; ')}. Stalking is a criminal offense under Section 354D IPC.`;
      suggestedActions = [
        "Do not share your real-time location with the sender.",
        "Document all evidence of surveillance and stalking behavior with screenshots.",
        "Block the sender across all communication channels.",
        "File a complaint at your nearest police station or at cybercrime.gov.in.",
        "If you feel immediately unsafe, contact emergency services (112) or Women Helpline (1091)."
      ];
    } else if (hasEmotional) {
      headline = "Emotional Manipulation / Coercive Control Detected";
      explanation = `This message uses emotional manipulation or coercive control tactics. Detected signals: ${indicatorLabels.join('; ')}. This type of behavior is characteristic of abusive relationships and psychological control.`;
      suggestedActions = [
        "Recognize this as manipulative behavior — you are not responsible for someone else's threats of self-harm.",
        "Do not comply with demands made under emotional pressure.",
        "Confide in a trusted friend, family member, or counselor.",
        "Contact the Women Helpline (1091) or iCall (9152987821) for professional support.",
        "If someone threatens self-harm, inform their family or local authorities."
      ];
    } else {
      headline = "Hostile / Harassing Language Detected";
      explanation = `This message contains demeaning, abusive, or persistently hostile language. While not indicating an immediate physical threat, it violates respectful communication boundaries. Detected signals: ${indicatorLabels.join('; ')}.`;
      suggestedActions = [
        "Do not respond to abusive or demeaning language.",
        "Document the communication with screenshots in case repeated behavior occurs.",
        "Block the sender across your messaging channels.",
        "Confide in a trusted friend or reach out to community support if the behavior continues."
      ];
    }
  } else if (category === 'PRIVACY_RISK') {
    headline = "⚠ Sensitive Privacy & Location Request Detected";
    explanation = `HerGuardian flagged this message because it requests sensitive personal details such as your live location, physical residence address, or identity documents without verified necessity. Sharing these can compromise your physical safety or lead to identity misuse. Detected signals: ${indicatorLabels.join('; ')}.`;
    suggestedActions = [
      "Do NOT share your live GPS location or physical address with unverified contacts.",
      "Never transmit photos or copies of identity documents (Aadhaar, PAN, passport, voter ID) via chat.",
      "Clarify why the information is requested and verify the sender's identity through an official external channel.",
      "If the sender insists aggressively, intimidates you, or makes you feel unsafe, block them immediately."
    ];
  } else if (category === 'SUSPICIOUS') {
    headline = "Suspicious Indicators Found";
    explanation = `HerGuardian detected potentially concerning signals, but the available context is inconclusive. Detected signals: ${indicatorLabels.join('; ')}. Exercise caution before proceeding.`;
    suggestedActions = [
      "Verify the sender's identity through a separate trusted channel before replying.",
      "Do not click unverified links or share personal details.",
      "Maintain heightened digital awareness."
    ];
  }

  return { headline, explanation, suggestedActions };
}

// ==========================================
// 5. GEMINI AI STRUCTURED SYNTHESIS
// ==========================================

async function analyzeWithGemini(cleanText, evidence, ruleRisk) {
  if (!geminiModel) return null;

  try {
    const prompt = `You are HerGuardian AI's Digital Safety Analyzer for women.
Analyze this user-submitted message for safety risks:
"${cleanText}"

Context from baseline engine:
- Detected indicators: ${evidence.indicators.map(i => i.label).join('; ') || 'None'}
- Baseline score: ${ruleRisk.riskScore}/100 (${ruleRisk.riskLevel})
- Baseline category: ${ruleRisk.category}
- Protective context: ${evidence.isProtective ? 'True (Defensive advice / Negation detected)' : 'False'}

Rules:
1. Contextual discernment:
   - If the message advises NOT sharing credentials (e.g. "don't share your OTP") or states "no registration fee", classify as NORMAL with riskScore <= 10.
   - If the message is routine conversation (e.g. "lunch tomorrow", "coming to college"), classify as NORMAL with riskScore <= 10.
   - If the message requests home address, live location, or ID documents, classify as PRIVACY_RISK with Caution/Moderate risk (score 25-45).
   - If the message is mildly rude/venting ("You are useless. Stop messaging me."), classify as HARASSMENT or NORMAL with Caution/Moderate risk, NOT a physical threat!
   - If the message asks for an advance fee to get a job/prize, classify as JOB_SCAM or FINANCIAL_SCAM with High/Critical risk.
   - If the message threatens physical harm or blackmail ("I know where you live", "hurt you", "leak photos"), classify as THREAT or BLACKMAIL with High/Critical risk.
   - If the message contains sexual harassment, stalking, or predatory language, classify as HARASSMENT or THREAT with High/Critical risk.
   - If the message uses emotional blackmail or coercive control ("I'll kill myself if you leave"), classify as HARASSMENT with Moderate/High risk.
2. The riskScore MUST align with baseline score. If the baseline engine detected critical indicators, your riskScore should NOT be lower than the baseline score (${ruleRisk.riskScore}).
3. The explanation MUST quote or cite specific details from THIS exact message (e.g., specific rupee amounts, specific phrases, specific URLs).
4. Do not use generic filler text.
5. Use non-definitive wording: "Potential...", "Possible...", "No major risk indicators detected".

Return a valid JSON object matching this structure exactly:
{
  "category": "NORMAL" | "FINANCIAL_SCAM" | "JOB_SCAM" | "PHISHING" | "MATRIMONIAL_SCAM" | "HARASSMENT" | "THREAT" | "BLACKMAIL" | "PRIVACY_RISK" | "SUSPICIOUS",
  "riskScore": number (integer between 0 and 100),
  "riskLevel": "Low" | "Caution" | "Moderate" | "High" | "Critical",
  "confidence": number (between 0.50 and 0.99),
  "headline": string,
  "warningIndicators": string[],
  "explanation": string,
  "safetyActions": string[],
  "detectedSignals": {
    "scam": boolean,
    "phishing": boolean,
    "harassment": boolean,
    "threat": boolean,
    "blackmail": boolean,
    "privacyRisk": boolean,
    "sexualCoercion": boolean
  },
  "showEmergencySection": boolean
}`;

    // 8-second timeout guard to prevent UI stalling
    const geminiPromise = geminiModel.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Gemini timeout')), 8000)
    );

    const result = await Promise.race([geminiPromise, timeoutPromise]);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    // Validate structured fields
    if (
      parsed &&
      typeof parsed.riskScore === 'number' &&
      parsed.category &&
      (parsed.explanation || parsed.whyExplanation)
    ) {
      // Enforce minimum score from rule engine for critical indicators
      let finalScore = Math.min(100, Math.max(0, Math.round(parsed.riskScore)));
      const hasCritical = evidence.indicators.some(i => i.severity === 'critical');
      if (hasCritical && finalScore < ruleRisk.riskScore) {
        finalScore = ruleRisk.riskScore;
      }

      const finalRiskLevel = finalScore >= 80 ? 'Critical' : finalScore >= 60 ? 'High' : finalScore >= 40 ? 'Moderate' : finalScore >= 20 ? 'Caution' : 'Low';
      const indicatorsList = Array.isArray(parsed.warningIndicators) ? parsed.warningIndicators : Array.isArray(parsed.detectedWarningSigns) ? parsed.detectedWarningSigns : evidence.indicators.map(i => i.label);
      const explanationText = parsed.explanation || parsed.whyExplanation;
      const actionsList = Array.isArray(parsed.safetyActions) ? parsed.safetyActions : Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [];

      const signals = parsed.detectedSignals && typeof parsed.detectedSignals === 'object'
        ? {
            scam: Boolean(parsed.detectedSignals.scam ?? ruleRisk.detectedSignals.scam),
            phishing: Boolean(parsed.detectedSignals.phishing ?? ruleRisk.detectedSignals.phishing),
            harassment: Boolean(parsed.detectedSignals.harassment ?? ruleRisk.detectedSignals.harassment),
            threat: Boolean(parsed.detectedSignals.threat ?? ruleRisk.detectedSignals.threat),
            blackmail: Boolean(parsed.detectedSignals.blackmail ?? ruleRisk.detectedSignals.blackmail),
            privacyRisk: Boolean(parsed.detectedSignals.privacyRisk ?? ruleRisk.detectedSignals.privacyRisk),
            sexualCoercion: Boolean(parsed.detectedSignals.sexualCoercion ?? ruleRisk.detectedSignals.sexualCoercion)
          }
        : ruleRisk.detectedSignals;

      return {
        category: parsed.category,
        riskScore: finalScore,
        riskLevel: finalRiskLevel,
        confidence: Math.round((parsed.confidence || 0.88) * 100),
        headline: parsed.headline || 'Safety Analysis Result',
        warningIndicators: indicatorsList,
        detectedWarningSigns: indicatorsList,
        explanation: explanationText,
        whyExplanation: explanationText,
        safetyActions: actionsList,
        suggestedActions: actionsList,
        detectedSignals: signals,
        scoreBreakdown: ruleRisk.scoreBreakdown,
        showEmergencySection: parsed.showEmergencySection ?? (finalScore >= 60 || parsed.category === 'THREAT' || parsed.category === 'BLACKMAIL'),
        engine: 'Gemini-2.5-Flash'
      };
    }
  } catch (err) {
    // If Gemini hits rate limit (429) or timeout, silently log and fallback to evidence engine
    console.log(`[SafetyAnalyzer] Gemini synthesis fallback (${err.message}). Using local evidence engine.`);
  }

  return null;
}

// ==========================================
// 6. MAIN ANALYSIS ENTRY POINT
// ==========================================

export async function analyzeSafetyMessage(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Message text cannot be empty');
  }

  const cleanText = text.trim();
  if (cleanText.length === 0) {
    throw new Error('Message text cannot be empty');
  }

  // Handle very short messages
  if (cleanText.length < 5) {
    const briefSignals = {
      scam: false,
      phishing: false,
      harassment: false,
      threat: false,
      blackmail: false,
      privacyRisk: false,
      sexualCoercion: false
    };
    const briefBreakdown = [
      { category: "Threats & Intimidation", score: 0, max: 30 },
      { category: "Scam & Financial Fraud", score: 0, max: 30 },
      { category: "Harassment & Abuse", score: 0, max: 20 },
      { category: "Phishing & Credential Risks", score: 0, max: 20 },
      { category: "Privacy & Location Solicitation", score: 0, max: 15 }
    ];
    return {
      category: 'NORMAL',
      displayCategory: 'Brief Message',
      riskScore: 5,
      riskLevel: 'Low',
      confidence: 50,
      headline: 'Message Too Short for Definitive Analysis',
      warningIndicators: [],
      detectedWarningSigns: [],
      explanation: 'The submitted message was too short to contain identifiable scam, phishing, harassment, or threat patterns.',
      whyExplanation: 'The submitted message was too short to contain identifiable scam, phishing, harassment, or threat patterns.',
      safetyActions: [
        'If this is part of a longer conversation, paste the full message for an accurate assessment.',
        'Maintain normal digital caution with unfamiliar senders.'
      ],
      suggestedActions: [
        'If this is part of a longer conversation, paste the full message for an accurate assessment.',
        'Maintain normal digital caution with unfamiliar senders.'
      ],
      detectedSignals: briefSignals,
      scoreBreakdown: briefBreakdown,
      showEmergencySection: false,
      analyzedAt: new Date().toISOString(),
      engine: 'Context-NLP'
    };
  }

  // 1. Detect concrete evidence & context
  const evidence = detectSafetyEvidence(cleanText);

  // 2. Compute dynamic risk score and categories
  const ruleRisk = calculateEvidenceBasedRisk(evidence);

  // 3. Attempt Gemini LLM structured analysis for deeply specific reasoning
  const geminiResult = await analyzeWithGemini(cleanText, evidence, ruleRisk);

  if (geminiResult) {
    return {
      ...geminiResult,
      displayCategory: formatDisplayCategory(geminiResult.category),
      analyzedAt: new Date().toISOString()
    };
  }

  // 4. Fallback to evidence-grounded dynamic explanation generator
  const explanationData = generateEvidenceSpecificExplanation(cleanText, evidence, ruleRisk);
  const warningSigns = evidence.indicators.map(i => i.label);

  return {
    category: ruleRisk.category,
    displayCategory: formatDisplayCategory(ruleRisk.category),
    riskScore: ruleRisk.riskScore,
    riskLevel: ruleRisk.riskLevel,
    confidence: Math.round(ruleRisk.confidence * 100),
    headline: explanationData.headline,
    warningIndicators: warningSigns,
    detectedWarningSigns: warningSigns,
    explanation: explanationData.explanation,
    whyExplanation: explanationData.explanation,
    safetyActions: explanationData.suggestedActions,
    suggestedActions: explanationData.suggestedActions,
    detectedSignals: ruleRisk.detectedSignals,
    scoreBreakdown: ruleRisk.scoreBreakdown,
    showEmergencySection: ruleRisk.riskScore >= 60 || ruleRisk.category === 'THREAT' || ruleRisk.category === 'BLACKMAIL',
    analyzedAt: new Date().toISOString(),
    engine: 'Evidence-Engine'
  };
}

function formatDisplayCategory(cat) {
  const map = {
    NORMAL: 'Normal Communication',
    FINANCIAL_SCAM: 'Financial Fraud',
    JOB_SCAM: 'Recruitment / Job Scam',
    PHISHING: 'Phishing & Credential Theft',
    MATRIMONIAL_SCAM: 'Matrimonial / Relationship Fraud',
    HARASSMENT: 'Harassment & Unwanted Contact',
    THREAT: 'Threat & Intimidation',
    BLACKMAIL: 'Blackmail & Extortion',
    PRIVACY_RISK: 'Privacy & Personal Data Risk',
    SUSPICIOUS: 'Suspicious Language'
  };
  return map[cat] || cat;
}

export default {
  analyzeSafetyMessage
};

