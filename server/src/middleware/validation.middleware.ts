
import { Request, Response, NextFunction } from 'express';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Allows standard phone numbers with optional + prefix, digits, spaces, hyphens, parentheses, dots
const PHONE_REGEX = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

const VALID_CATEGORIES = ['Client', 'Recruiter', 'Investor', 'Developer', 'Business Partner', 'Customer', 'Friend', 'Other'];

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 50) {
    res.status(400).json({ success: false, message: 'Name is required and must be between 2 and 50 characters.' });
    return;
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ success: false, message: 'A valid email address is required.' });
    return;
  }

  if (!password || typeof password !== 'string') {
    res.status(400).json({ success: false, message: 'Password is required.' });
    return;
  }

  // Password requirements: min length 8, contains at least one letter and one number
  if (password.length < 8) {
    res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    return;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    res.status(400).json({ success: false, message: 'Password must contain at least one letter and one number.' });
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    res.status(400).json({ success: false, message: 'A valid email address is required.' });
    return;
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    res.status(400).json({ success: false, message: 'Password is required.' });
    return;
  }

  next();
};

export const validateContactPayload = (req: Request, res: Response, next: NextFunction): void => {
  const isUpdate = req.method === 'PATCH' || req.method === 'PUT';
  const { name, phones, emails, company, designation, officeAddress, websites, category } = req.body;

  // Name check
  if (!isUpdate || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      res.status(400).json({ success: false, message: 'Name is required and must be under 100 characters.' });
      return;
    }
  }

  // Phones array validation
  if (phones !== undefined) {
    if (!Array.isArray(phones)) {
      res.status(400).json({ success: false, message: 'Phones must be an array.' });
      return;
    }
    if (phones.length > 20) {
      res.status(400).json({ success: false, message: 'A contact cannot have more than 20 phone numbers.' });
      return;
    }
    for (let i = 0; i < phones.length; i++) {
      const p = phones[i];
      if (!p || typeof p !== 'object' || !p.value || typeof p.value !== 'string') {
        res.status(400).json({ success: false, message: `Phone at index ${i} must have a valid value.` });
        return;
      }
      if (p.value.trim().length < 7 || p.value.length > 30 || !PHONE_REGEX.test(p.value)) {
        res.status(400).json({ success: false, message: `Phone at index ${i} has an invalid number format.` });
        return;
      }
    }
  }

  // Emails array validation
  if (emails !== undefined) {
    if (!Array.isArray(emails)) {
      res.status(400).json({ success: false, message: 'Emails must be an array.' });
      return;
    }
    if (emails.length > 20) {
      res.status(400).json({ success: false, message: 'A contact cannot have more than 20 emails.' });
      return;
    }
    for (let i = 0; i < emails.length; i++) {
      const e = emails[i];
      if (!e || typeof e !== 'object' || !e.value || typeof e.value !== 'string' || !EMAIL_REGEX.test(e.value)) {
        res.status(400).json({ success: false, message: `Email at index ${i} must be a valid email address.` });
        return;
      }
    }
  }

  // Websites array validation
  if (websites !== undefined) {
    if (!Array.isArray(websites)) {
      res.status(400).json({ success: false, message: 'Websites must be an array.' });
      return;
    }
    if (websites.length > 20) {
      res.status(400).json({ success: false, message: 'A contact cannot have more than 20 websites.' });
      return;
    }
    for (let i = 0; i < websites.length; i++) {
      const w = websites[i];
      if (!w || typeof w !== 'object' || !w.value || typeof w.value !== 'string' || !URL_REGEX.test(w.value)) {
        res.status(400).json({ success: false, message: `Website at index ${i} must be a valid URL.` });
        return;
      }
    }
  }

  // Company, designation, officeAddress checks
  const checkStringOpt = (val: any, label: string): boolean => {
    if (val !== undefined && val !== null) {
      if (typeof val !== 'string' || val.length > 200) {
        res.status(400).json({ success: false, message: `${label} must be a string under 200 characters.` });
        return false;
      }
    }
    return true;
  };

  if (!checkStringOpt(company, 'Company')) return;
  if (!checkStringOpt(designation, 'Designation')) return;
  if (!checkStringOpt(officeAddress, 'Office Address')) return;

  // Category check
  if (category !== undefined) {
    if (typeof category !== 'string' || !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` });
      return;
    }
  }

  // extractionQualityScore check
  const { extractionQualityScore } = req.body;
  if (extractionQualityScore !== undefined && extractionQualityScore !== null) {
    if (typeof extractionQualityScore !== 'number' || extractionQualityScore < 0 || extractionQualityScore > 100) {
      res.status(400).json({ success: false, message: 'Extraction quality score must be a number between 0 and 100.' });
      return;
    }
  }

  next();
};

export const validateSearchParams = (req: Request, res: Response, next: NextFunction): void => {
  const { q, category } = req.query;

  if (q !== undefined) {
    if (typeof q !== 'string' || q.length > 100) {
      res.status(400).json({ success: false, message: 'Search query must be a string under 100 characters.' });
      return;
    }
  }

  if (category !== undefined && category !== '') {
    if (typeof category !== 'string' || !VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, message: 'Category parameter is invalid.' });
      return;
    }
  }

  next();
};