import mongoose from 'mongoose';

export const CANONICAL_RELATIONSHIPS = [
  'family',
  'spouse',
  'parent',
  'sibling',
  'friend',
  'colleague',
  'other',
];

export const RELATIONSHIP_MAPPING = {
  // Machine values
  family: 'family',
  spouse: 'spouse',
  parent: 'parent',
  sibling: 'sibling',
  friend: 'friend',
  colleague: 'colleague',
  other: 'other',

  // Capitalized variants
  Family: 'family',
  Spouse: 'spouse',
  Parent: 'parent',
  Sibling: 'sibling',
  Friend: 'friend',
  Colleague: 'colleague',
  Other: 'other',

  // UI labels & common aliases
  'Spouse / Partner': 'spouse',
  'spouse / partner': 'spouse',
  'Spouse/Partner': 'spouse',
  'spouse/partner': 'spouse',
  Partner: 'spouse',
  partner: 'spouse',
  'Trusted Friend': 'friend',
  'trusted friend': 'friend',

  // Legacy granular family members
  Mother: 'parent',
  mother: 'parent',
  Father: 'parent',
  father: 'parent',
  Sister: 'sibling',
  sister: 'sibling',
  Brother: 'sibling',
  brother: 'sibling',
};

export const normalizeRelationship = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return RELATIONSHIP_MAPPING[trimmed] || RELATIONSHIP_MAPPING[trimmed.toLowerCase()] || null;
};

const contactSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      trim: true,
      lowercase: true,
      set: (val) => {
        const normalized = normalizeRelationship(val);
        return normalized || (typeof val === 'string' ? val.trim().toLowerCase() : val);
      },
      enum: {
        values: [
          'family',
          'spouse',
          'parent',
          'sibling',
          'friend',
          'colleague',
          'other',
          // Legacy values allowed in enum for safe backwards-compatibility
          'mother',
          'father',
          'sister',
          'brother',
        ],
        message: '`{VALUE}` is not a supported relationship value.',
      },
      default: 'other',
    },
  },
  { timestamps: true }
);

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
