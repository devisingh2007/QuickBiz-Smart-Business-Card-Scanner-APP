import { ContactData } from '@/components/ui/ContactCard';

interface OcrResult {
  rawText: string;
  blocks: {
    text: string;
    boundingBox?: any;
    confidence: number;
  }[];
  lines: {
    text: string;
    boundingBox?: any;
    confidence: number;
  }[];
  confidence: number;
}

class ContactParserService {
  // Parse normalized OCR results into a structured contact card
  public parseOcrResult(ocr: OcrResult): Partial<ContactData> {
    // Correct common spacing typos in email addresses or websites in raw lines
    const rawLines = ocr.lines
      .map((l) => {
        let text = l.text.trim();
        // Correct spaced '@' (e.g., "user @ domain.com" -> "user@domain.com")
        text = text.replace(/\s*@\s*/g, '@');
        // Correct spaced dots in domains (e.g., "domain .com" -> "domain.com")
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

    // Keywords for designation detection
    const designKeywords = [
      'engineer', 'developer', 'manager', 'designer', 'director', 'president', 
      'founder', 'ceo', 'cfo', 'cto', 'coo', 'vp', 'architect', 'specialist', 
      'consultant', 'analyst', 'lead', 'partner', 'executive', 'associate', 
      'officer', 'representative', 'owner', 'proprietor', 'head', 'vice president',
      'programmer', 'lead', 'chief', 'principal', 'administrator', 'strategist',
      'adviser', 'advisor', 'coordinator', 'leader', 'expert'
    ];

    // Company indicators
    const companyKeywords = [
      'ltd', 'inc', 'corp', 'co.', 'corporation', 'solutions', 'technologies', 
      'systems', 'startup', 'group', 'enterprises', 'industries', 'services', 
      'labs', 'agency', 'tech', 'software', 'digital', 'global', 'llc', 'pvt',
      'incorporated', 'ventures'
    ];

    // Address keywords
    const addressKeywords = [
      'street', 'road', 'st.', 'rd.', 'ave', 'avenue', 'highway', 'hwy', 
      'building', 'bldg', 'floor', 'fl', 'suite', 'ste', 'city', 'state', 
      'zip', 'pincode', 'post', 'box', 'phase', 'sector', 'zone', 'nagar',
      'chowk', 'vihar', 'enclave', 'complex', 'tower', 'india', 'usa',
      'landmark', 'opp', 'near', 'beside', 'behind', 'block', 'plot',
      'district', 'cantt', 'industrial area', 'park', 'plaza', 'house',
      'lane', 'villa', 'apartment'
    ];

    // 1. Extract Emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;
    for (const line of rawLines) {
      const matches = line.match(emailRegex);
      if (matches) {
        for (const m of matches) {
          const cleanedVal = m.replace(/\s+/g, '').toLowerCase();
          if (!emails.some((e) => e.value === cleanedVal)) {
            emails.push({ value: cleanedVal, type: 'work' });
          }
        }
      }
    }

    const emailList = emails.map((e) => e.value);
    const emailDomains = emails.map((e) => e.value.split('@')[1]);

    // 2. Extract Websites
    const webRegex = /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+)\b/gi;
    const commonEmailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'yahoo.co.in', 'icloud.com', 'mail.com'];
    
    for (const line of rawLines) {
      if (line.includes('@')) {
        // If it's a line with an email, make sure we only grab the website if it's explicitly separate
        let cleanLine = line;
        for (const email of emailList) {
          cleanLine = cleanLine.replace(email, '');
        }
        const matches = cleanLine.match(webRegex);
        if (matches) {
          for (const m of matches) {
            let cleanedVal = m.replace(/\s+/g, '').toLowerCase();
            cleanedVal = cleanedVal.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');
            const isEmailDomain = emailDomains.includes(cleanedVal);
            const isCommonProvider = commonEmailProviders.includes(cleanedVal);
            const isExplicitWeb = m.toLowerCase().startsWith('www.') || m.toLowerCase().startsWith('http');
            
            if (cleanedVal.includes('.') && !cleanedVal.startsWith('tel') && !cleanedVal.startsWith('fax')) {
              if (isEmailDomain && !isExplicitWeb) {
                continue;
              }
              if (isCommonProvider) {
                continue;
              }
              if (!websites.some((w) => w.value === cleanedVal)) {
                websites.push({ value: cleanedVal, type: 'work' });
              }
            }
          }
        }
        continue;
      }
      const matches = line.match(webRegex);
      if (matches) {
        for (const m of matches) {
          let cleanedVal = m.replace(/\s+/g, '').toLowerCase();
          cleanedVal = cleanedVal.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');
          const isEmailDomain = emailDomains.includes(cleanedVal);
          const isCommonProvider = commonEmailProviders.includes(cleanedVal);
          const isExplicitWeb = m.toLowerCase().startsWith('www.') || m.toLowerCase().startsWith('http');
          
          if (cleanedVal.includes('.') && !cleanedVal.startsWith('tel') && !cleanedVal.startsWith('fax')) {
            if (isEmailDomain && !isExplicitWeb) {
              continue;
            }
            if (isCommonProvider) {
              continue;
            }
            if (!websites.some((w) => w.value === cleanedVal)) {
              websites.push({ value: cleanedVal, type: 'work' });
            }
          }
        }
      }
    }

    const webList = websites.map((w) => w.value);

    // 3. Extract Phone Numbers (robust matches including country codes and extensions)
    const phoneRegex = /\+?\d[\d-\s\(\)\.]{5,}\d/g;
    for (const line of rawLines) {
      const cleanedLine = line.replace(/^(?:phone|ph|tel|mob|cell|m|p|t):/i, '').trim();
      const matches = cleanedLine.match(phoneRegex);
      if (matches) {
        for (const m of matches) {
          const digitsOnly = m.replace(/[^\d]/g, '');
          if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
            const hasPlus = m.startsWith('+');
            const phoneVal = (hasPlus ? '+' : '') + digitsOnly;

            let type = 'mobile';
            let label = 'Mobile';
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes('fax') || lowerLine.includes('f:')) {
              type = 'fax';
              label = 'Fax';
            } else if (
              lowerLine.includes('office') || 
              lowerLine.includes('work') || 
              lowerLine.includes('off') || 
              lowerLine.includes('tel') || 
              lowerLine.includes('ph') ||
              lowerLine.includes('land') ||
              lowerLine.includes('landline')
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

    // 4. Extract Address lines
    const nonAddressLines: string[] = [];

    for (const line of rawLines) {
      // Skip if line is primarily phone/email/website
      const hasEmail = emailList.some((e) => line.toLowerCase().includes(e));
      const hasWeb = webList.some((w) => line.toLowerCase().includes(w));
      const hasPhone = phoneList.some((p) => {
        const digits = line.replace(/[^\d]/g, '');
        return digits.includes(p.replace(/[^\d]/g, ''));
      });

      if (hasEmail || hasWeb || hasPhone || line.includes('@')) {
        continue;
      }

      // Match address keywords with word boundaries to avoid false substring matches (e.g. 'st.' matching 'systems')
      const hasAddressKeyword = addressKeywords.some((kw) => {
        const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
        return regex.test(line);
      });
      
      // Pin/Zip code matching (5 or 6 digits)
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
      const isDesignation = designKeywords.some((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(lower);
      });
      if (isDesignation && line.length < 50 && !/\d/.test(line)) {
        designation = line;
        designIdx = i;
        break;
      }
    }

    // 6. Extract Name
    let nameIdx = -1;
    const nameCandidates = nonAddressLines.map((line, idx) => ({ line, idx })).filter(({ line, idx }) => {
      if (idx === designIdx) return false;
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (/\d/.test(trimmed)) return false;
      
      const words = trimmed.split(/\s+/);
      if (words.length < 2 || words.length > 4) return false;

      const lower = trimmed.toLowerCase();
      const hasCompanyKeyword = companyKeywords.some((kw) => lower.includes(kw));
      const isPureText = /^[a-zA-Z\s\.\-\']+$/.test(trimmed);

      return !hasCompanyKeyword && isPureText;
    });

    if (nameCandidates.length > 0) {
      name = nameCandidates[0].line;
      nameIdx = nameCandidates[0].idx;
    }

    // 7. Designation fallback (layout context: if the line directly below the name has no digits, no company, we assume it is the title)
    if (!designation && name && nameIdx !== -1 && nameIdx + 1 < nonAddressLines.length) {
      const nextLine = nonAddressLines[nameIdx + 1].trim();
      const nextLineLower = nextLine.toLowerCase();
      // Suffixes that strongly indicate a company name (ruling out general words like "global" / "tech")
      const strongCompanyKeywords = ['ltd', 'inc', 'corp', 'corporation', 'llc', 'pvt', 'incorporated', 'co.'];
      const isStrongCompany = strongCompanyKeywords.some((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(nextLineLower);
      });
      const hasDigits = /\d/.test(nextLine);
      if (!isStrongCompany && !hasDigits && nextLine.length > 3 && nextLine.length < 45) {
        designation = nextLine;
        designIdx = nameIdx + 1;
      }
    }

    // Remove name and designation from candidates for company detection
    const remainingLines = nonAddressLines.filter((line, idx) => idx !== nameIdx && idx !== designIdx);

    // 8. Extract Company
    const companyCandidates = remainingLines.filter((line) => {
      const lower = line.toLowerCase();
      return companyKeywords.some((kw) => {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        return regex.test(lower);
      });
    });

    if (companyCandidates.length > 0) {
      company = companyCandidates[0];
    } else if (remainingLines.length > 0) {
      company = remainingLines[0];
    }

    // 9. Calculate QuickBiz Extraction Quality Score (out of 50)
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
}

export const contactParserService = new ContactParserService();
export default contactParserService;
