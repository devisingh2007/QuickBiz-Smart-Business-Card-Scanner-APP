export const normalizePhone = phone => {
  // Trim and remove spaces, parentheses, hyphens, and dots. Preserve leading +
  return phone.trim().replace(/[\s\-\(\)\.]/g, '');
};
export const normalizeEmail = email => {
  return email.trim().toLowerCase();
};
export const normalizeWebsite = website => {
  let cleaned = website.trim().toLowerCase();
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '');
  cleaned = cleaned.replace(/\/+$/, '');
  return cleaned;
};