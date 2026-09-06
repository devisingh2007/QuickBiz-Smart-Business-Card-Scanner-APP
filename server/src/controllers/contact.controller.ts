import { Request, Response } from 'express';
import { ContactService } from '../services/contact.service';

// Create a new contact
export const createContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const contact = await ContactService.createContact(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      contact,
    });
  } catch (error: any) {
    if (error.duplicate) {
      res.status(409).json({
        success: false,
        duplicate: true,
        message: error.message,
        existingContact: error.existingContact,
      });
      return;
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Get all contacts with category filter, search query, and pagination
export const getContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { category, q, page, limit } = req.query;
    const result = await ContactService.getContacts(userId, {
      category: category as string,
      q: q as string,
      page: page as string,
      limit: limit as string,
    });

    res.status(200).json({
      success: true,
      count: result.contacts.length,
      pagination: result.pagination,
      contacts: result.contacts,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Get a single contact by ID
export const getContactById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const contact = await ContactService.getContactById(userId, id as string);

    res.status(200).json({
      success: true,
      contact,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Update a contact
export const updateContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const contact = await ContactService.updateContact(userId, id as string, req.body);

    res.status(200).json({
      success: true,
      message: 'Contact updated successfully',
      contact,
    });
  } catch (error: any) {
    if (error.duplicate) {
      res.status(409).json({
        success: false,
        duplicate: true,
        message: error.message,
        existingContact: error.existingContact,
      });
      return;
    }
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

// Delete a contact
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    await ContactService.deleteContact(userId, id as string);

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};
