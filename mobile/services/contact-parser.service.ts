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
    const rawLines = ocr.lines.map((l) => l.text.trim()).filter(Boolean);
    
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
      'officer', 'representative', 'owner', 'proprietor', 'head', 'vice president'
    ];

    // Company indicators
    const companyKeywords = [
      'ltd', 'inc', 'corp', 'co.', 'corporation', 'solutions', 'technologies', 
      'systems', 'startup', 'group', 'enterprises', 'industries', 'services', 
      'labs', 'agency', 'tech', 'software', 'digital', 'global'
    ];

    // Address keywords
    const addressKeywords = [
      'street', 'road', 'st.', 'rd.', 'ave', 'avenue', 'highway', 'hwy', 
      'building', 'bldg', 'floor', 'fl', 'suite', 'ste', 'city', 'state', 
      'zip', 'pincode', 'post', 'box', 'phase', 'sector', 'zone', 'nagar',
      'chowk', 'vihar', 'enclave', 'complex', 'tower', 'india', 'usa', 'sector'
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

    // 2. Extract Websites
    const webRegex = /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)\b/gi;
    for (const line of rawLines) {
      if (line.includes('@')) continue; // Skip email lines
      const matches = line.match(webRegex);
      if (matches) {
        for (const m of matches) {
          const cleanedVal = m.replace(/\s+/g, '').toLowerCase();
          // Exclude typical labels that confuse parser
          if (cleanedVal.includes('.') && !cleanedVal.startsWith('tel') && !cleanedVal.startsWith('fax')) {
            if (!websites.some((w) => w.value === cleanedVal)) {
              websites.push({ value: cleanedVal, type: 'work' });
            }
          }
        }
      }
    }

    // 3. Extract Phone Numbers
    const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    for (const line of rawLines) {
      const cleanedLine = line.replace(/^(?:phone|ph|tel|mob|cell|m|p):/i, '').trim();
      const matches = cleanedLine.match(phoneRegex);
      if (matches) {
        for (const m of matches) {
          const normalized = m.replace(/[^\d+]/g, '');
          if (normalized.length >= 7) { // Ignore short code noise
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
              lowerLine.includes('ph')
            ) {
              type = 'office';
              label = 'Office';
            }
            if (!phones.some((p) => p.value === normalized)) {
              phones.push({ value: normalized, type, label });
            }
          }
        }
      }
    }

    // 4. Extract Address lines
    const emailList = emails.map((e) => e.value);
    const webList = websites.map((w) => w.value);
    const phoneList = phones.map((p) => p.value);

    const nonAddressLines: string[] = [];

    for (const line of rawLines) {
      // Check if line contains email, website or phone
      const hasEmail = emailList.some((e) => line.toLowerCase().includes(e));
      const hasWeb = webList.some((w) => line.toLowerCase().includes(w));
      const hasPhone = phoneList.some((p) => line.replace(/[^\d]/g, '').includes(p));

      if (hasEmail || hasWeb || hasPhone || line.includes('@') || line.match(phoneRegex)) {
        continue;
      }

      const hasAddressKeyword = addressKeywords.some((kw) => line.toLowerCase().includes(kw));
      const hasZip = /\d{4,6}/.test(line);

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
      const line = nonAddressLines[i].toLowerCase();
      const isDesignation = designKeywords.some((kw) => line.includes(kw));
      if (isDesignation) {
        designation = nonAddressLines[i];
        designIdx = i;
        break;
      }
    }

    if (designIdx !== -1) {
      nonAddressLines.splice(designIdx, 1);
    }

    // 6. Extract Name
    // Reject lines containing digits, company suffixes, or job keywords
    const nameCandidates = nonAddressLines.filter((line) => {
      const words = line.split(/\s+/);
      const isWordCountInvalid = words.length < 2 || words.length > 4;
      const hasDigits = /\d/.test(line);
      const isCompany = companyKeywords.some((kw) => line.toLowerCase().includes(kw));
      return !isWordCountInvalid && !hasDigits && !isCompany;
    });

    if (nameCandidates.length > 0) {
      name = nameCandidates[0];
      const nameIdx = nonAddressLines.indexOf(name);
      if (nameIdx !== -1) {
        nonAddressLines.splice(nameIdx, 1);
      }
    } else if (nonAddressLines.length > 0) {
      name = nonAddressLines[0];
      nonAddressLines.shift();
    }

    // 7. Extract Company
    const companyCandidates = nonAddressLines.filter((line) => {
      return companyKeywords.some((kw) => line.toLowerCase().includes(kw));
    });

    if (companyCandidates.length > 0) {
      company = companyCandidates[0];
    } else if (nonAddressLines.length > 0) {
      company = nonAddressLines[0];
    }

    // 8. Calculate QuickBiz Extraction Quality Score (out of 50)
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
