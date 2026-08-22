import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Contact } from '../models/contact.model';

// Create a new contact
export const createContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, email, company, designation, officeAddress, category, nativeContactId, forceSave } = req.body;
    const userId = req.userId;

    if (!name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }

    // Duplicate detection if forceSave is not enabled
    if (!forceSave) {
      let duplicateQuery: any[] = [];
      if (email) duplicateQuery.push({ email });
      if (phone) duplicateQuery.push({ phone });

      if (duplicateQuery.length > 0) {
        const existing = await Contact.findOne({
          userId,
          $or: duplicateQuery,
        });

        if (existing) {
          res.status(409).json({
            success: false,
            duplicate: true,
            message: 'A contact with this email or phone number already exists.',
            existingContact: {
              id: existing._id,
              name: existing.name,
              company: existing.company,
              email: existing.email,
              phone: existing.phone,
            },
          });
          return;
        }
      }
    }

    const contact = await Contact.create({
      userId,
      name,
      phone,
      email,
      company,
      designation,
      officeAddress,
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

// Get all contacts with category filter, search query, and pagination
export const getContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { category, q } = req.query;

    const filterQuery: any = { userId };

    if (category && category !== 'All') {
      filterQuery.category = category;
    }

    if (q) {
      // If search query is provided, check if it matches name, company, or designation
      const searchRegex = new RegExp(q as string, 'i');
      filterQuery.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { designation: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
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
    const updateFields = req.body;

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      { ...updateFields, syncStatus: 'synced' },
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
