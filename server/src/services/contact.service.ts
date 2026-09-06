import mongoose from 'mongoose';
import { Contact } from '../models/contact.model';
import { normalizeEmail, normalizePhone, normalizeWebsite } from '../utils/normalize';

const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const checkValidObjectId = (id: string): void => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    const err: any = new Error('Invalid contact ID format.');
    err.statusCode = 400;
    throw err;
  }
};

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
        value: typeof p?.value === 'string' ? normalizePhone(p.value) : p?.value,
      }));
    }

    // Normalize all email values in array
    if (Array.isArray(normalized.emails)) {
      normalized.emails = normalized.emails.map((e: any) => ({
        ...e,
        value: typeof e?.value === 'string' ? normalizeEmail(e.value) : e?.value,
      }));
    }

    // Normalize all website values in array
    if (Array.isArray(normalized.websites)) {
      normalized.websites = normalized.websites.map((w: any) => ({
        ...w,
        value: typeof w?.value === 'string' ? normalizeWebsite(w.value) : w?.value,
      }));
    }

    return normalized;
  }

  public static async createContact(userId: string, body: any) {
    const normalizedBody = this.normalizeInputFields(body);
    const {
      name,
      phones,
      emails,
      company,
      designation,
      officeAddress,
      websites,
      category,
      nativeContactId,
      forceSave,
      extractionQualityScore,
      source,
    } = normalizedBody;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const err: any = new Error('Contact name is required.');
      err.statusCode = 400;
      throw err;
    }

    // Duplicate detection if forceSave is not enabled
    if (!forceSave) {
      const emailValues = (emails || []).map((e: any) => e?.value).filter(Boolean);
      const phoneValues = (phones || []).map((p: any) => p?.value).filter(Boolean);

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
      name: name.trim(),
      phones: Array.isArray(phones) ? phones : [],
      emails: Array.isArray(emails) ? emails : [],
      company: typeof company === 'string' ? company.trim() : undefined,
      designation: typeof designation === 'string' ? designation.trim() : undefined,
      officeAddress: typeof officeAddress === 'string' ? officeAddress.trim() : undefined,
      websites: Array.isArray(websites) ? websites : [],
      category: category || 'Other',
      nativeContactId: typeof nativeContactId === 'string' ? nativeContactId.trim() : undefined,
      syncStatus: 'synced',
      source: typeof source === 'string' ? source : 'business_card',
      extractionQualityScore: typeof extractionQualityScore === 'number' ? extractionQualityScore : undefined,
    });

    return contact;
  }

  public static async getContacts(
    userId: string,
    query: { category?: string; q?: string; page?: string; limit?: string }
  ) {
    const { category, q, page, limit } = query;
    const filterQuery: any = { userId };

    if (category && category !== 'All') {
      filterQuery.category = category;
    }

    if (q && typeof q === 'string' && q.trim().length > 0) {
      const escapedQuery = escapeRegex(q.trim());
      const searchRegex = new RegExp(escapedQuery, 'i');
      filterQuery.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { designation: searchRegex },
        { 'emails.value': searchRegex },
        { 'phones.value': searchRegex },
      ];
    }

    const rawPage = parseInt(page || '1', 10);
    const parsedPage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    const rawLimit = parseInt(limit || '20', 10);
    const defaultLimit = 20;
    const maxLimit = 100;
    const parsedLimit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : Math.min(maxLimit, rawLimit);

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
        pages: Math.ceil(total / parsedLimit) || 1,
      },
    };
  }

  public static async getContactById(userId: string, id: string) {
    checkValidObjectId(id);

    const contact = await Contact.findOne({ _id: id, userId });
    if (!contact) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      throw err;
    }
    return contact;
  }

  public static async updateContact(userId: string, id: string, body: any) {
    checkValidObjectId(id);

    const normalizedBody = this.normalizeInputFields(body);

    // Whitelist only allowed update fields to prevent unauthorized modifications
    const allowedFields = [
      'name',
      'phones',
      'emails',
      'company',
      'designation',
      'officeAddress',
      'websites',
      'category',
      'nativeContactId',
      'extractionQualityScore',
      'source',
    ];

    const updatePayload: Record<string, any> = { syncStatus: 'synced' };

    for (const field of allowedFields) {
      if (normalizedBody[field] !== undefined) {
        updatePayload[field] = normalizedBody[field];
      }
    }

    // Check duplicate phone or email if updated and forceSave is not true
    if (!body.forceSave && (updatePayload.emails || updatePayload.phones)) {
      const emailValues = (updatePayload.emails || []).map((e: any) => e?.value).filter(Boolean);
      const phoneValues = (updatePayload.phones || []).map((p: any) => p?.value).filter(Boolean);

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
          _id: { $ne: id },
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

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId },
      updatePayload,
      { returnDocument: 'after', runValidators: true }
    );

    if (!contact) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      throw err;
    }

    return contact;
  }

  public static async deleteContact(userId: string, id: string) {
    checkValidObjectId(id);

    const contact = await Contact.findOneAndDelete({ _id: id, userId });
    if (!contact) {
      const err: any = new Error('Contact not found');
      err.statusCode = 404;
      throw err;
    }
    return contact;
  }
}
