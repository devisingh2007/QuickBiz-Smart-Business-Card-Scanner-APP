import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Contact } from '../models/contact.model';

// Helper to normalize legacy input parameters into arrays of subdocuments
const normalizeInputFields = (body: any) => {
  const normalized = { ...body };

  // Convert single string "phone" to array
  if (normalized.phone && typeof normalized.phone === 'string') {
    normalized.phones = [{ value: normalized.phone, type: 'mobile', label: 'Mobile' }];
    delete normalized.phone;
  }

  // Convert single string "email" to array
  if (normalized.email && typeof normalized.email === 'string') {
    normalized.emails = [{ value: normalized.email, type: 'work' }];
    delete normalized.email;
  }

  // Convert single string "website" to array
  if (normalized.website && typeof normalized.website === 'string') {
    normalized.websites = [{ value: normalized.website, type: 'work' }];
    delete normalized.website;
  }

  return normalized;
};

// Create a new contact
export const createContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const normalizedBody = normalizeInputFields(req.body);
    const { name, phones, emails, company, designation, officeAddress, websites, category, nativeContactId, forceSave } = normalizedBody;

    if (!name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    // Duplicate detection if forceSave is not enabled
    if (!forceSave) {
      const emailValues = (emails || []).map((e: any) => e.value).filter(Boolean);
      const phoneValues = (phones || []).map((p: any) => p.value).filter(Boolean);

      const duplicateQuery: any[] = [];
      if (emailValues.length > 0) {
        duplicateQuery.push({ 'emails.value': { $in: emailValues } });
      }
      if (phoneValues.length > 0) {
        duplicateQuery.push({ 'phones.value': { $in: phoneValues } });
      }

      if (duplicateQuery.length > 0) {
        const existing = await Contact.findOne({
          userId,
          $or: duplicateQuery,
        });

        if (existing) {
          res.status(409).json({
            success: false,
            duplicate: true,
            message: 'A contact with one of these emails or phone numbers already exists.',
            existingContact: {
              id: existing._id,
              name: existing.name,
              company: existing.company,
              emails: existing.emails,
              phones: existing.phones,
            },
          });
          return;
        }
      }
    }

    const contact = await Contact.create({
      userId,
      name,
      phones: phones || [],
      emails: emails || [],
      company,
      designation,
      officeAddress,
      websites: websites || [],
      category,
      nativeContactId,
      syncStatus: 'synced',
    });

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Get all contacts with category filter and search queries
export const getContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { category, q } = req.query;

    const filterQuery: any = { userId };

    if (category && category !== 'All') {
      filterQuery.category = category;
    }

    if (q) {
      const searchRegex = new RegExp(q as string, 'i');
      filterQuery.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { designation: searchRegex },
        { 'emails.value': searchRegex },
        { 'phones.value': searchRegex },
      ];
    }

    const contacts = await Contact.find(filterQuery).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Get a single contact
export const getContactById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const contact = await Contact.findOne({ _id: id, userId });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact not found' });
      return;
    }

    res.status(200).json({
      success: true,
      contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Update a contact
export const updateContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const normalizedUpdateFields = normalizeInputFields(req.body);

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      { ...normalizedUpdateFields, syncStatus: 'synced' },
      { new: true, runValidators: true }
    );

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      contact,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Delete a contact
export const deleteContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const contact = await Contact.findOneAndDelete({ _id: id, userId });

    if (!contact) {
      res.status(404).json({ success: false, message: 'Contact not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};
