import prisma from '../lib/prisma.js';

const CANONICAL_RELATIONSHIPS = [
  'family',
  'spouse',
  'parent',
  'sibling',
  'friend',
  'colleague',
  'other',
];

const RELATIONSHIP_MAPPING = {
  family: 'family',
  spouse: 'spouse',
  parent: 'parent',
  sibling: 'sibling',
  friend: 'friend',
  colleague: 'colleague',
  other: 'other',

  Family: 'family',
  Spouse: 'spouse',
  Parent: 'parent',
  Sibling: 'sibling',
  Friend: 'friend',
  Colleague: 'colleague',
  Other: 'other',

  'Spouse / Partner': 'spouse',
  'spouse / partner': 'spouse',
  'Spouse/Partner': 'spouse',
  'spouse/partner': 'spouse',
  Partner: 'spouse',
  partner: 'spouse',
  'Trusted Friend': 'friend',
  'trusted friend': 'friend',

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

export const getContacts = async (req, res, next) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const { name, phone, relationship } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!trimmedName || !trimmedPhone) {
      return res.status(400).json({
        success: false,
        message: 'Contact name and valid phone number are required.',
      });
    }

    const rawRelationship = relationship || 'other';
    const normalizedRel = normalizeRelationship(rawRelationship);

    if (!normalizedRel) {
      console.warn(
        `[ContactController] Invalid relationship received: "${rawRelationship}" for user: ${req.user.id}`
      );
      return res.status(400).json({
        success: false,
        message:
          'Invalid relationship value. Allowed options: Family, Spouse / Partner, Parent, Sibling, Trusted Friend, Colleague, Other.',
      });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: req.user.id,
        name: trimmedName,
        phone: trimmedPhone,
        relationship: normalizedRel,
      },
    });

    console.log(
      `[ContactController] Created contact ${contact.id} with relationship "${contact.relationship}" for user ${req.user.id}`
    );

    res.status(201).json({ success: true, contact });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    const updateData = {};

    if (req.body.name !== undefined) {
      const trimmedName = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Contact name cannot be empty.' });
      }
      updateData.name = trimmedName;
    }

    if (req.body.phone !== undefined) {
      const trimmedPhone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
      if (!trimmedPhone) {
        return res.status(400).json({ success: false, message: 'Contact phone number cannot be empty.' });
      }
      updateData.phone = trimmedPhone;
    }

    if (req.body.relationship !== undefined) {
      const normalizedRel = normalizeRelationship(req.body.relationship);
      if (!normalizedRel) {
        console.warn(
          `[ContactController] Invalid relationship received for update on contact ${contact.id} (user: ${req.user.id}): "${req.body.relationship}"`
        );
        return res.status(400).json({
          success: false,
          message:
            'Invalid relationship value. Allowed options: Family, Spouse / Partner, Parent, Sibling, Trusted Friend, Colleague, Other.',
        });
      }
      updateData.relationship = normalizedRel;
    } else if (contact.relationship) {
      const normalizedExisting = normalizeRelationship(contact.relationship);
      if (normalizedExisting) {
        updateData.relationship = normalizedExisting;
      }
    }

    const updated = await prisma.contact.update({
      where: { id: contact.id },
      data: updateData,
    });

    console.log(
      `[ContactController] Updated contact ${updated.id} with relationship "${updated.relationship}" for user ${req.user.id}`
    );

    res.status(200).json({ success: true, contact: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    await prisma.contact.delete({ where: { id: contact.id } });

    res.status(200).json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
};
