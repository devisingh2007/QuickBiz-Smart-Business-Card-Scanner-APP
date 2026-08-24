export const CATEGORIES = [
  'Client',
  'Recruiter',
  'Investor',
  'Developer',
  'Business Partner',
  'Customer',
  'Friend',
  'Other',
] as const;

export type ContactCategory = typeof CATEGORIES[number];
