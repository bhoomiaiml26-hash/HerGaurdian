import Contact, { normalizeRelationship } from '../models/Contact.js';

export const getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ user: req.user._id }).sort({ createdAt: -1 });
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
        `[ContactController] Invalid relationship received: "${rawRelationship}" for user: ${req.user._id}`
      );
      return res.status(400).json({
        success: false,
        message:
          'Invalid relationship value. Allowed options: Family, Spouse / Partner, Parent, Sibling, Trusted Friend, Colleague, Other.',
      });
    }

    const contact = await Contact.create({
      user: req.user._id,
      name: trimmedName,
      phone: trimmedPhone,
      relationship: normalizedRel,
    });

    console.log(
      `[ContactController] Created contact ${contact._id} with relationship "${contact.relationship}" for user ${req.user._id}`
    );

    res.status(201).json({ success: true, contact });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({ _id: req.params.id, user: req.user._id });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (req.body.name !== undefined) {
      const trimmedName = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'Contact name cannot be empty.' });
      }
      contact.name = trimmedName;
    }

    if (req.body.phone !== undefined) {
      const trimmedPhone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
      if (!trimmedPhone) {
        return res.status(400).json({ success: false, message: 'Contact phone number cannot be empty.' });
      }
      contact.phone = trimmedPhone;
    }

    if (req.body.relationship !== undefined) {
      const normalizedRel = normalizeRelationship(req.body.relationship);
      if (!normalizedRel) {
        console.warn(
          `[ContactController] Invalid relationship received for update on contact ${contact._id} (user: ${req.user._id}): "${req.body.relationship}"`
        );
        return res.status(400).json({
          success: false,
          message:
            'Invalid relationship value. Allowed options: Family, Spouse / Partner, Parent, Sibling, Trusted Friend, Colleague, Other.',
        });
      }
      contact.relationship = normalizedRel;
    } else if (contact.relationship) {
      // Ensure any existing legacy value is normalized on update
      const normalizedExisting = normalizeRelationship(contact.relationship);
      if (normalizedExisting) {
        contact.relationship = normalizedExisting;
      }
    }

    await contact.save();

    console.log(
      `[ContactController] Updated contact ${contact._id} with relationship "${contact.relationship}" for user ${req.user._id}`
    );

    res.status(200).json({ success: true, contact });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.status(200).json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
};
