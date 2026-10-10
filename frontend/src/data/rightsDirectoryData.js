/**
 * Rights & Support Directory Data
 * Verified official helplines, schemes, statutory provisions, and rights FAQ entries.
 */

// ── VERIFIED HELPLINES ────────────────────────────────────────────────────────
export const verifiedHelplines = [
  {
    id: 'hl-1',
    name: 'Women Helpline (Domestic Abuse & Crisis)',
    number: '181',
    area: 'All India',
    hours: '24/7 Toll-Free',
    purpose: 'Emergency distress response, rescue, counseling, referral to shelters and one-stop centers.',
    type: 'emergency',
    source: 'Ministry of Women and Child Development (MWCD)',
    verified: true,
  },
  {
    id: 'hl-2',
    name: 'National Emergency Response Support System (ERSS)',
    number: '112',
    area: 'All India',
    hours: '24/7 Toll-Free',
    purpose: 'Immediate police, fire, and medical emergency dispatch.',
    type: 'emergency',
    source: 'Ministry of Home Affairs (MHA)',
    verified: true,
  },
  {
    id: 'hl-3',
    name: 'National Cyber Crime Reporting Helpline',
    number: '1930',
    area: 'All India',
    hours: '24/7 Toll-Free',
    purpose: 'Report financial cyber fraud, online stalking, morphing, unauthorized media leakage, and blackmail.',
    type: 'cyber',
    source: 'Indian Cyber Crime Coordination Centre (I4C)',
    verified: true,
  },
  {
    id: 'hl-4',
    name: 'NALSA Free Legal Aid Helpline',
    number: '15100',
    area: 'All India',
    hours: 'Working Days (10 AM - 5 PM)',
    purpose: 'Free legal counseling, representation, and assistance for women under Section 12 of Legal Services Authorities Act.',
    type: 'legal',
    source: 'National Legal Services Authority (NALSA)',
    verified: true,
  },
  {
    id: 'hl-5',
    name: 'National Commission for Women (NCW) Helpline',
    number: '7827170170',
    area: 'All India',
    hours: '24/7 Dedicated Cell',
    purpose: 'Support for women facing violence, dowry harassment, desertion, or institutional apathy.',
    type: 'statutory',
    source: 'NCW India',
    verified: true,
  },
  {
    id: 'hl-6',
    name: 'Childline / Protection of Minor Girls',
    number: '1098',
    area: 'All India',
    hours: '24/7 Toll-Free',
    purpose: 'Child care and protection for girls under 18 years in distress.',
    type: 'emergency',
    source: 'MWCD / Childline India',
    verified: true,
  },
];

// ── VERIFIED STATUTORY SCHEMES & PROGRAMS ─────────────────────────────────────
export const statutorySchemes = [
  {
    id: 'scheme-1',
    name: 'One Stop Centre (Sakhi) Scheme',
    category: 'Crisis & Shelter',
    jurisdiction: 'India (National)',
    description: 'Integrated support under one roof: medical aid, police facilitation, legal counseling, psychological support, and temporary shelter for women affected by violence.',
    eligibility: 'Any woman or girl facing physical, sexual, emotional, psychological, or economic abuse.',
    documentsRequired: ['Identity proof (if available; not mandatory for emergency rescue)', 'Medical records (if any)'],
    applicationSteps: [
      'Locate the nearest One Stop Centre (usually situated near District Hospitals).',
      'Walk in directly or call the 181 Women Helpline to request Sakhi rescue.',
      'Access immediate medical care, lodging, and a designated Case Worker.',
    ],
    officialUrl: 'https://wcd.nic.in/schemes/one-stop-centre-scheme-1',
    contact: '181',
    verified: true,
  },
  {
    id: 'scheme-2',
    name: 'Free Legal Aid for Women (NALSA / DLSA)',
    category: 'Legal Aid & Justice',
    jurisdiction: 'India (National)',
    description: 'Under Section 12(c) of the Legal Services Authorities Act, 1987, all women, irrespective of financial status or income, are entitled to free legal aid from court-appointed advocates.',
    eligibility: 'All women without any income ceiling.',
    documentsRequired: ['Self-declaration letter describing the issue', 'Proof of identity (Aadhaar / Voter ID / Passport)'],
    applicationSteps: [
      'Submit an application online at nalsa.gov.in or in person at the District Legal Services Authority (DLSA) office located in any district court.',
      'A Front Office advocate assesses the case within 72 hours.',
      'A panel lawyer is assigned at zero cost to represent you in court or conciliation.',
    ],
    officialUrl: 'https://nalsa.gov.in',
    contact: '15100',
    verified: true,
  },
  {
    id: 'scheme-3',
    name: 'SHe-Box (Sexual Harassment electronic Box)',
    category: 'Workplace Rights',
    jurisdiction: 'India (Central Portal)',
    description: 'Centralized government monitoring portal for registering complaints related to sexual harassment at the workplace under the POSH Act, 2013, covering both government and private sector employees.',
    eligibility: 'Any woman employee (regular, temporary, ad-hoc, intern, or daily wage worker).',
    documentsRequired: ['Brief written complaint', 'Employer/Company details', 'ICC details if already reported'],
    applicationSteps: [
      'Visit shebox.wcd.gov.in and register with email / mobile OTP.',
      'Enter details of the employer, the accused, and a summary of the incident.',
      'The portal forwards the complaint directly to your employer\'s ICC and district officer with status tracking.',
    ],
    officialUrl: 'https://shebox.wcd.gov.in',
    contact: '011-23386408',
    verified: true,
  },
  {
    id: 'scheme-4',
    name: 'Working Women Hostel Scheme (Sakhi Niwas)',
    category: 'Housing & Safety',
    jurisdiction: 'India (Urban Centres)',
    description: 'Safe and conveniently located accommodation with daycare facilities for children of working women in urban, semi-urban, and rural areas.',
    eligibility: 'Working women earning up to specified state thresholds, single, married, separated, or widowed, and women undergoing vocational training.',
    documentsRequired: ['Employment letter / Salary certificate', 'Identity and address proof', 'Passport-size photographs'],
    applicationSteps: [
      'Locate recognized Sakhi Niwas / Working Women Hostels via state WCD department.',
      'Submit application form along with employer verification certificate.',
      'Pay subsidized monthly maintenance fee upon room allocation.',
    ],
    officialUrl: 'https://wcd.nic.in/schemes/working-women-hostel',
    contact: '181',
    verified: true,
  },
  {
    id: 'scheme-5',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    category: 'Maternity Benefit',
    jurisdiction: 'India (National)',
    description: 'Direct Benefit Transfer (DBT) financial assistance of ₹5,000 for pregnant women and lactating mothers to compensate for wage loss during childbirth.',
    eligibility: 'Pregnant women and lactating mothers for the first living child (and additional support for second child if girl child). Excludes government employees with paid maternity leave.',
    documentsRequired: ['Mother-Child Protection (MCP) card', 'Aadhaar of mother and father', 'Bank account linked with Aadhaar'],
    applicationSteps: [
      'Register at the nearest Anganwadi Centre (AWC) or authorized health facility within 150 days of Last Menstrual Period (LMP).',
      'Submit Form 1A along with MCP card and Aadhaar.',
      'Incentives are credited directly into bank account in tranches.',
    ],
    officialUrl: 'https://pmmvy.wcd.gov.in',
    contact: '011-23382393',
    verified: true,
  },
  {
    id: 'scheme-6',
    name: 'National Cyber Crime Reporting Portal',
    category: 'Digital Safety',
    jurisdiction: 'India (National)',
    description: 'Official portal to report cybercrimes, with a dedicated priority section for crimes against women and children (non-consensual image sharing, stalking, impersonation).',
    eligibility: 'Any individual or representative of a victim of cybercrime.',
    documentsRequired: ['Screenshots with URLs/Timestamps', 'Suspect profile links / phone numbers', 'Email headers or chat logs'],
    applicationSteps: [
      'Visit cybercrime.gov.in.',
      'Click "Report Crime Related to Women / Child" (options for anonymous or identified reporting).',
      'Upload screenshots and provide incident timeline.',
      'Receive an Acknowledgement Number to track police action.',
    ],
    officialUrl: 'https://cybercrime.gov.in',
    contact: '1930',
    verified: true,
  },
];

// ── STATUTORY LEGAL PROVISIONS REFERENCE ─────────────────────────────────────
export const statutoryProvisions = {
  posh: {
    title: 'POSH Act, 2013 (Sexual Harassment of Women at Workplace)',
    keyRules: [
      'Mandatory Internal Complaints Committee (ICC) in every organization with 10+ employees.',
      'ICC must be headed by a senior woman employee and include at least 50% women members + 1 independent external member.',
      'Complaint must be filed within 3 months of the incident (extendable by 3 months with valid reason).',
      'Inquiry must be completed within 90 days of receiving the complaint.',
      'Strict confidentiality: Names and addresses of victim and witnesses cannot be publicized.',
      'Protection against retaliation and interim relief (transfer, paid leave up to 3 months) available.',
    ],
    officialAuthority: 'Local Complaints Committee (District Officer) / ICC',
  },
  unpaid_wages: {
    title: 'Payment of Wages Act & Industrial Disputes Act',
    keyRules: [
      'Employers must disburse earned wages before the 7th or 10th day of the succeeding month.',
      'Unauthorized deductions are strictly illegal.',
      'Upon resignation or termination, full and final settlement (F&F) must be cleared within statutory timeline.',
      'Labor Commissioner / Labor Court has jurisdiction to hear recovery claims with up to 10x penalty.',
    ],
    officialAuthority: 'Office of the Labor Commissioner / Labor Tribunal',
  },
  cyber_abuse: {
    title: 'Information Technology Act, 2000 & Bharatiya Nyaya Sanhita (BNS)',
    keyRules: [
      'Section 66E IT Act: Violation of privacy (capturing/publishing private area images without consent).',
      'Section 67 & 67A IT Act: Publishing or transmitting sexually explicit content in electronic form.',
      'Section 354D IPC / BNS equivalent: Cyber stalking (monitoring internet or email use against express objection).',
      'Platforms are required under IT Rules 2021 to take down non-consensual intimate imagery within 24 hours of reporting.',
    ],
    officialAuthority: 'Cyber Crime Police Station / 1930 Helpline',
  },
  legal_aid: {
    title: 'Legal Services Authorities Act, 1987 (Section 12)',
    keyRules: [
      'Section 12(c): Every woman has an absolute statutory right to free legal aid in civil, criminal, and family court matters.',
      'No income certificate or financial means test is required for women applicants.',
      'Covers lawyer fee, drafting charges, court fees, and certified copy expenses.',
    ],
    officialAuthority: 'DLSA (District Court) / SLSA (High Court) / NALSA (Supreme Court)',
  },
  zero_fir: {
    title: 'Right to Zero FIR & Women Arrest Safeguards',
    keyRules: [
      'Zero FIR: A woman can lodge a police complaint at ANY police station regardless of jurisdiction where the incident occurred.',
      'Police station cannot turn away a complainant; they must register Zero FIR and transfer it to the jurisdictional station.',
      'A woman cannot be arrested after sunset and before sunrise, except in extraordinary circumstances with prior Magistrate order.',
      'A woman complainant has the right to be questioned only at her residence in the presence of female police officers or family.',
    ],
    officialAuthority: 'Police Station / Judicial Magistrate',
  },
};

// ── DOCUMENT DECODER GLOSSARY ─────────────────────────────────────────────────
export const legalGlossary = [
  {
    term: 'ICC (Internal Complaints Committee)',
    explanation: 'A mandatory internal committee in companies with 10+ employees to investigate complaints of sexual harassment under the POSH Act.',
  },
  {
    term: 'Show Cause Notice',
    explanation: 'A formal letter asking you to explain why disciplinary or administrative action should not be taken against you within a specified timeframe.',
  },
  {
    term: 'Zero FIR',
    explanation: 'An FIR that can be registered at any police station without territorial limitation. It is given the number "0" and later transferred to the actual station.',
  },
  {
    term: 'Severance Pay',
    explanation: 'Compensation an employer is legally or contractually required to pay when terminating employment without employee fault.',
  },
  {
    term: 'Arbitration Clause',
    explanation: 'A contract provision stating that disputes must be resolved outside courts by a private arbitrator rather than a public judge.',
  },
  {
    term: 'Indemnity Clause',
    explanation: 'A contractual term where one party agrees to compensate the other for specified damages, liabilities, or losses incurred.',
  },
  {
    term: 'Cognizable Offence',
    explanation: 'A serious crime where the police officer has authority to arrest without a magistrate warrant and start an investigation immediately.',
  },
  {
    term: 'Ex-Parte Order',
    explanation: 'A legal decision or injunction granted by a judge or committee without hearing the other party, usually because they failed to appear or in emergency circumstances.',
  },
  {
    term: 'Non-Disparagement Clause',
    explanation: 'A clause preventing you from making negative statements about the company or institution after signing an agreement.',
  },
  {
    term: 'Full & Final (F&F) Settlement',
    explanation: 'The comprehensive accounting of pending wages, bonus, gratuity, leave encashment, and deductions upon conclusion of employment.',
  },
];
