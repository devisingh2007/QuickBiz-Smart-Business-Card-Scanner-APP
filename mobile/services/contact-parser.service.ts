import { ContactData } from './contact.store';

export interface OcrInput {
  rawText: string;
  blocks?: { text: string; confidence?: number }[];
  lines: { text: string; confidence?: number }[];
  confidence?: number;
}

const DESIGNATION_KEYWORDS = [
  'engineer', 'developer', 'manager', 'designer', 'director', 'president',
  'founder', 'ceo', 'cfo', 'cto', 'coo', 'vp', 'architect', 'specialist',
  'consultant', 'analyst', 'lead', 'partner', 'executive', 'associate',
  'officer', 'representative', 'owner', 'proprietor', 'head', 'vice president',
  'programmer', 'chief', 'principal', 'administrator', 'strategist',
  'adviser', 'advisor', 'coordinator', 'leader', 'expert',
];

const COMPANY_KEYWORDS = [
  'ltd', 'inc', 'corp', 'co.', 'corporation', 'solutions', 'technologies',
  'systems', 'startup', 'group', 'enterprises', 'industries', 'services',
  'labs', 'agency', 'tech', 'software', 'digital', 'global', 'llc', 'pvt',
  'incorporated', 'ventures',
];

const ADDRESS_KEYWORDS = [
  'street', 'road', 'st.', 'rd.', 'ave', 'avenue', 'highway', 'hwy',
  'building', 'bldg', 'floor', 'fl', 'suite', 'ste', 'city', 'state',
  'zip', 'pincode', 'post', 'box', 'phase', 'sector', 'zone', 'nagar',
  'chowk', 'vihar', 'enclave', 'complex', 'tower', 'india', 'usa',
  'landmark', 'opp', 'near', 'beside', 'behind', 'block', 'plot',
  'district', 'cantt', 'industrial area', 'park', 'plaza', 'house',
  'lane', 'villa', 'apartment',
];

const COMMON_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'yahoo.co.in', 'icloud.com', 'mail.com',
];

/**
 * Extracts structured contact details (name, email, phone, company, etc.) from OCR text lines.
 */
export function parseOcrResult(ocr: OcrInput): Partial<ContactData> {
  // Fix minor OCR scanning spacing errors (e.g. "user @ domain.com")
  const rawLines = (ocr.lines || [])
    .map((l) => {
      let text = (l.text || '').trim();
      text = text.replace(/\s*@\s*/g, '@');
      text = text.replace(/\s*\.\s*(com|org|net|co|in|edu|gov|io|biz|dev)\b/gi, '.$1');
      return text;
    })
    .filter(Boolean);

  const emails: { value: string; type: string }[] = [];
  const phones: { value: string; type: string; label: string }[] = [];
  const websites: { value: string; type: string }[] = [];
  let name = '';
  let designation = '';
  let company = '';
  const addressLines: string[] = [];

  // 1. Extract Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
  for (const line of rawLines) {
    const matches = line.match(emailRegex);
    if (matches) {
      for (const m of matches) {
        const cleaned = m.replace(/\s+/g, '').toLowerCase();
        if (!emails.some((e) => e.value === cleaned)) {
          emails.push({ value: cleaned, type: 'work' });
        }
      }
    }
  }

  const emailList = emails.map((e) => e.value);
  const emailDomains = emails.map((e) => e.value.split('@')[1]);

  // 2. Extract Websites
  const webRegex = /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+)\b/gi;
  for (const line of rawLines) {
    let cleanLine = line;
    if (line.includes('@')) {
      for (const email of emailList) {
        cleanLine = cleanLine.replace(email, '');
      }
    }

    const matches = cleanLine.match(webRegex);
    if (matches) {
      for (const m of matches) {
        let cleaned = m.replace(/\s+/g, '').toLowerCase();
        cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');

        const isEmailDomain = emailDomains.includes(cleaned);
        const isCommonProvider = COMMON_EMAIL_PROVIDERS.includes(cleaned);
        const isExplicitWeb = m.toLowerCase().startsWith('www.') || m.toLowerCase().startsWith('http');

        if (cleaned.includes('.') && !cleaned.startsWith('tel') && !cleaned.startsWith('fax')) {
          if (isEmailDomain && !isExplicitWeb) continue;
          if (isCommonProvider) continue;
          if (!websites.some((w) => w.value === cleaned)) {
            websites.push({ value: cleaned, type: 'work' });
          }
        }
      }
    }
  }

  const webList = websites.map((w) => w.value);

  // 3. Extract Phone Numbers
  const phoneRegex = /\+?\d[\d-\s\(\)\.]{5,}\d/g;
  for (const line of rawLines) {
    const cleanedLine = line.replace(/^(?:phone|ph|tel|mob|cell|m|p|t):/i, '').trim();
    const matches = cleanedLine.match(phoneRegex);
    if (matches) {
      for (const m of matches) {
        const digitsOnly = m.replace(/[^\d]/g, '');
        if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
          const phoneVal = (m.startsWith('+') ? '+' : '') + digitsOnly;

          let type = 'mobile';
          let label = 'Mobile';
          const lower = line.toLowerCase();
          if (lower.includes('fax') || lower.includes('f:')) {
            type = 'fax';
            label = 'Fax';
          } else if (
            lower.includes('office') || lower.includes('work') || lower.includes('off') ||
            lower.includes('tel') || lower.includes('ph') || lower.includes('land') || lower.includes('landline')
          ) {
            type = 'office';
            label = 'Office';
          }

          if (!phones.some((p) => p.value === phoneVal)) {
            phones.push({ value: phoneVal, type, label });
          }
        }
      }
    }
  }

  const phoneList = phones.map((p) => p.value);

  // 4. Separate Address lines from potential Name/Title/Company lines
  const nonAddressLines: string[] = [];
  for (const line of rawLines) {
    const hasEmail = emailList.some((e) => line.toLowerCase().includes(e));
    const hasWeb = webList.some((w) => line.toLowerCase().includes(w));
    const hasPhone = phoneList.some((p) => {
      const digits = line.replace(/[^\d]/g, '');
      return digits.includes(p.replace(/[^\d]/g, ''));
    });

    if (hasEmail || hasWeb || hasPhone || line.includes('@')) {
      continue;
    }

    const hasAddressKeyword = ADDRESS_KEYWORDS.some((kw) => {
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(line);
    });
    const hasZip = /\b\d{5,6}\b/.test(line);

    if (hasAddressKeyword || hasZip) {
      addressLines.push(line);
    } else {
      nonAddressLines.push(line);
    }
  }

  const officeAddress = addressLines.join(', ');

  // 5. Extract Designation
  let designIdx = -1;
  for (let i = 0; i < nonAddressLines.length; i++) {
    const line = nonAddressLines[i].trim();
    const lower = line.toLowerCase();
    const isDesignation = DESIGNATION_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower));
    if (isDesignation && line.length < 50 && !/\d/.test(line)) {
      designation = line;
      designIdx = i;
      break;
    }
  }

  // 6. Extract Name
  let nameIdx = -1;
  const nameCandidates = nonAddressLines
    .map((line, idx) => ({ line, idx }))
    .filter(({ line, idx }) => {
      if (idx === designIdx) return false;
      const trimmed = line.trim();
      if (!trimmed || /\d/.test(trimmed)) return false;

      const words = trimmed.split(/\s+/);
      if (words.length < 2 || words.length > 4) return false;

      const lower = trimmed.toLowerCase();
      const hasCompanyKeyword = COMPANY_KEYWORDS.some((kw) => lower.includes(kw));
      const isPureText = /^[a-zA-Z\s\.\-\']+$/.test(trimmed);

      return !hasCompanyKeyword && isPureText;
    });

  if (nameCandidates.length > 0) {
    name = nameCandidates[0].line;
    nameIdx = nameCandidates[0].idx;
  }

  // Fallback: If no designation was found, check the line right below the name
  if (!designation && name && nameIdx !== -1 && nameIdx + 1 < nonAddressLines.length) {
    const nextLine = nonAddressLines[nameIdx + 1].trim();
    const nextLineLower = nextLine.toLowerCase();
    const strongCompanySuffixes = ['ltd', 'inc', 'corp', 'corporation', 'llc', 'pvt', 'co.'];
    const isCompany = strongCompanySuffixes.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(nextLineLower));
    if (!isCompany && !/\d/.test(nextLine) && nextLine.length > 3 && nextLine.length < 45) {
      designation = nextLine;
      designIdx = nameIdx + 1;
    }
  }

  // 7. Extract Company from remaining lines
  const remainingLines = nonAddressLines.filter((_, idx) => idx !== nameIdx && idx !== designIdx);
  const companyMatch = remainingLines.find((line) => {
    const lower = line.toLowerCase();
    return COMPANY_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(lower));
  });

  if (companyMatch) {
    company = companyMatch;
  } else if (remainingLines.length > 0) {
    company = remainingLines[0];
  }

  // 8. Calculate Extraction Quality Score (out of 100)
  let score = 0;
  if (name) score += 10;
  if (phones.length > 0) score += 10;
  if (emails.length > 0) score += 10;
  if (company) score += 5;
  if (designation) score += 5;
  if (officeAddress) score += 5;
  if (websites.length > 0) score += 5;

  const extractionQualityScore = Math.round((score / 50) * 100);

  return {
    name: name || undefined,
    phones,
    emails,
    company: company || undefined,
    designation: designation || undefined,
    officeAddress: officeAddress || undefined,
    websites,
    extractionQualityScore,
  };
}

export const contactParserService = {
  parseOcrResult,
};

export default contactParserService;
