
import { Contact } from '../models/contact.model';
import { normalizeEmail, normalizePhone, normalizeWebsite } from '../utils/normalize';

export class ContactService {
  // Normalize legacy inputs (e.g. phone, email, website as strings) into structured arrays
  public static normalizeInputFields(body: any) {
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

    // Normalize all phone values in array
    if (Array.isArray(normalized.phones)) {
      normalized.phones = normalized.phones.map((p: any) => ({
        ...p,
        value: normalizePhone(p.value),
      }));
    }

    // Normalize all email values in array
    if (Array.isArray(normalized.emails)) {
      normalized.emails = normalized.emails.map((e: any) => ({
        ...e,
        value: normalizeEmail(e.value),
      }));
    }

    // Normalize all website values in array
    if (Array.isArray(normalized.websites)) {
      normalized.websites = normalized.websites.map((w: any) => ({
        ...w,
        value: normalizeWebsite(w.value),
      }));
    }

    return normalized;
  }

  public static async createContact(userId: string, body: any) {
    const normalizedBody = this.normalizeInputFields(body);
    const { name, phones, emails, company, designation, officeAddress, websites, category, nativeContactId, forceSave, extractionQualityScore } = normalizedBody;

    if (!name) {
      const err: any = new Error('Name is required');
      err.statusCode = 400;
      throw err;
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
          const err: any = new Error('A contact with one of these emails or phone numbers already exists.');
          err.statusCode = 409;
          err.duplicate = true;
          err.existingContact = {
            id: existing._id,
            name: existing.name,
            company: existing.company,
            emails: existing.emails,
            phones: existing.phones,
          };
          throw err;
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
      extractionQualityScore,
    });

    return contact;
  }

  public static async getContacts(userId: string, query: { category?: string; q?: string; page?: string; limit?: string }) {
    const { category, q, page, limit } = query;
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

    const parsedPage = Math.max(1, parseInt(page || '1', 10));
    const defaultLimit = 20;
    const maxLimit = 100;
    const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit || String(defaultLimit), 10)));
    const skip = (parsedPage - 1) * parsedLimit;

    const total = await Contact.countDocuments(filterQuery);
    const contacts = await Contact.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    return {
      contacts,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    };
  }

  public static async getContactById(userId: string, id: string) {
    const contact = await Contact.findOne({ _id: id, userId });
    if (!contact) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      throw err;
    }
    return contact;
  }

  public static async updateContact(userId: string, id: string, body: any) {
    const normalizedUpdateFields = this.normalizeInputFields(body);

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      { ...normalizedUpdateFields, syncStatus: 'synced' },
      { new: true, runValidators: true }
    );

    if (!contact) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      throw err;
    }

    return contact;
  }

  public static async deleteContact(userId: string, id: string) {
    const contact = await Contact.findOneAndDelete({ _id: id, userId });
    if (!contact) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      throw err;
    }
    return contact;
  }
}