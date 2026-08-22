import { ContactData } from '@/components/ui/ContactCard';

// Regex patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
const PHONE_REGEX = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\+?\d{1,3}[-.\s]?\d{5}[-.\s]?\d{5}\b|\b\+?\d{2}[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/;
const WEBSITE_REGEX = /\b(https?:\/\/)?(www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;

// Keywords to help classify lines
const DESIGNATION_KEYWORDS = [
  'engineer', 'developer', 'manager', 'director', 'lead', 'founder', 'ceo', 'cto', 'co-founder',
  'partner', 'specialist', 'consultant', 'executive', 'architect', 'analyst', 'designer',
  'president', 'vp', 'vice president', 'representative', 'coordinator', 'officer', 'head'
];

const COMPANY_KEYWORDS = [
  'technologies', 'solutions', 'services', 'systems', 'corporation', 'corp', 'limited', 'ltd',
  'pvt', 'inc', 'co', 'company', 'group', 'hub', 'industries', 'ventures', 'labs', 'consulting'
];

const ADDRESS_KEYWORDS = [
  'street', 'st', 'road', 'rd', 'avenue', 'ave', 'floor', 'building', 'bldg', 'city', 'state',
  'country', 'phase', 'sector', 'block', 'highway', 'hwy', 'lane', 'ln', 'plaza', 'park',
  'indiana', 'gujarat', 'ahmedabad', 'mumbai', 'delhi', 'bangalore', 'pune', 'california', 'york'
];

export const parseContactText = (rawText: string): Partial<ContactData> => {
  const result: Partial<ContactData> = {
    name: '',
    phone: '',
    email: '',
    company: '',
    designation: '',
    officeAddress: '',
  };

  if (!rawText) return result;

  // Split text into lines, trim and filter empty lines
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return result;

  // 1. Extract Email (first match)
  const emailLineIndex = lines.findIndex(line => EMAIL_REGEX.test(line));
  if (emailLineIndex !== -1) {
    const emailMatch = lines[emailLineIndex].match(EMAIL_REGEX);
    if (emailMatch) {
      result.email = emailMatch[0].toLowerCase();
      // Remove email from the line, or remove the line if it is just the email
      lines[emailLineIndex] = lines[emailLineIndex].replace(emailMatch[0], '').trim();
    }
  }

  // 2. Extract Phone Number (first match)
  const phoneLineIndex = lines.findIndex(line => PHONE_REGEX.test(line));
  if (phoneLineIndex !== -1) {
    const phoneMatch = lines[phoneLineIndex].match(PHONE_REGEX);
    if (phoneMatch) {
      result.phone = phoneMatch[0];
      lines[phoneLineIndex] = lines[phoneLineIndex].replace(phoneMatch[0], '').trim();
    }
  }

  // 3. Extract Website (first match)
  let website = '';
  const websiteLineIndex = lines.findIndex(line => WEBSITE_REGEX.test(line) && !line.includes('@'));
  if (websiteLineIndex !== -1) {
    const websiteMatch = lines[websiteLineIndex].match(WEBSITE_REGEX);
    if (websiteMatch) {
      website = websiteMatch[0];
      lines[websiteLineIndex] = lines[websiteLineIndex].replace(websiteMatch[0], '').trim();
    }
  }

  // Filter out lines that became empty after removing email/phone/website
  const cleanLines = lines.filter(line => line.length > 0);

  if (cleanLines.length === 0) return result;

  // 4. Classify designation, company, name, and address from clean lines
  const remainingLines: string[] = [];

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const lowerLine = line.toLowerCase();

    // Check for designation (job title)
    const isDesignation = DESIGNATION_KEYWORDS.some(keyword => lowerLine.includes(keyword));
    if (isDesignation && !result.designation) {
      result.designation = line;
      continue;
    }

    // Check for company
    const isCompany = COMPANY_KEYWORDS.some(keyword => lowerLine.includes(keyword));
    if (isCompany && !result.company) {
      result.company = line;
      continue;
    }

    // Check for office address
    const isAddress = ADDRESS_KEYWORDS.some(keyword => lowerLine.includes(keyword));
    if (isAddress) {
      if (result.officeAddress) {
        result.officeAddress += `, ${line}`;
      } else {
        result.officeAddress = line;
      }
      continue;
    }

    remainingLines.push(line);
  }

  // 5. Assign Name & Company if still missing
  // Usually the Name is the very first line of a business card.
  if (remainingLines.length > 0) {
    // If we haven't found a name yet, the first remaining line is most likely the name
    result.name = remainingLines[0];
    
    // If we have a second remaining line and still don't have a company, it's likely the company
    if (remainingLines.length > 1 && !result.company) {
      result.company = remainingLines[1];
    } else if (remainingLines.length > 1 && !result.officeAddress) {
      // Otherwise, it might be part of the address or other info
      result.officeAddress = remainingLines.slice(1).join(', ');
    }
  } else {
    // Fallback if all lines were classified but name is still empty
    if (result.company) {
      result.name = cleanLines[0];
    } else if (result.designation) {
      result.name = cleanLines[0];
    }
  }

  // Final validation and cleanups
  if (result.name === result.company && cleanLines.length > 1) {
    // Make sure name and company aren't identical if we have other lines
    result.company = cleanLines[1];
  }

  return result;
};

// Normalize phone numbers to clean digits or standard format
export const normalizePhone = (phone: string): string => {
  return phone.replace(/[^\d+]/g, '');
};
