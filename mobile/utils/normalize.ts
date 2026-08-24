export const normalizePhone = (phone: string): string => {
  // Trim and remove spaces, parentheses, hyphens, and dots. Preserve leading +
  return phone.trim().replace(/[\s\-\(\)\.]/g, '');
};

export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const normalizeWebsite = (website: string): string => {
  let cleaned = website.trim().toLowerCase();
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
};
