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
    const rawLines = ocr.lines.map((l) => l.text.trim());
    
    let email = '';
    let phone = '';
    let website = '';
    let name = '';
    let designation = '';
    let company = '';
    const addressLines: string[] = [];

    // Job title keywords for designation detection
    const designKeywords = [
      'engineer', 'developer', 'manager', 'designer', 'director', 'president', 
      'founder', 'ceo', 'cfo', 'cto', 'coo', 'vp', 'architect', 'specialist', 
      'consultant', 'analyst', 'lead', 'partner', 'executive', 'associate', 
      'officer', 'representative', 'owner', 'proprietor', 'head'
    ];

    // Company keywords
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

    // 1. Extract Email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
    for (const line of rawLines) {
      const match = line.match(emailRegex);
      if (match) {
        email = match[0].toLowerCase();
        break;
      }
    }

    // 2. Extract Website
    const webRegex = /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)\b/i;
    for (const line of rawLines) {
      if (line.includes('@')) continue; // Ignore email lines
      
      const match = line.match(webRegex);
      if (match) {
        const domain = match[0].toLowerCase();
        // Ignore generic words that match domain structures (e.g. e.g.com)
        if (domain.includes('.') && !domain.startsWith('email') && !domain.startsWith('tel')) {
          website = domain;
          break;
        }
      }
    }

    // 3. Extract Phone Number
    const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const phoneLines: string[] = [];
    
    for (const line of rawLines) {
      // Clean up common prefixes
      const cleaned = line.replace(/^(?:phone|ph|tel|mob|cell|m|p):/i, '').trim();
      const match = cleaned.match(phoneRegex);
      if (match) {
        phoneLines.push(match[0]);
      }
    }
    
    if (phoneLines.length > 0) {
      // Pick the first phone number and normalize it (strip hyphens/parentheses)
      phone = phoneLines[0].replace(/[^\d+]/g, '');
    }

    // 4. Extract Address
    // Gather lines that look like addresses
    const remainingLines: string[] = [];
    for (const line of rawLines) {
      // Skip email, phone, and website lines
      if (line === email || line === phone || line === website || line.includes('@') || line.match(phoneRegex)) {
        continue;
      }

      const hasAddressKeyword = addressKeywords.some((kw) => line.toLowerCase().includes(kw));
      const hasNumbers = /\d{4,6}/.test(line); // PIN codes or Zip codes
      
      if (hasAddressKeyword || hasNumbers) {
        addressLines.push(line);
      } else {
        remainingLines.push(line);
      }
    }

    const officeAddress = addressLines.join(', ');

    // 5. Extract Designation (Job Title)
    let foundDesignationIdx = -1;
    for (let i = 0; i < remainingLines.length; i++) {
      const line = remainingLines[i].toLowerCase();
      const isDesignation = designKeywords.some((kw) => line.includes(kw));
      if (isDesignation) {
        designation = remainingLines[i];
        foundDesignationIdx = i;
        break;
      }
    }

    // Remove designation line from remaining candidate lines
    if (foundDesignationIdx !== -1) {
      remainingLines.splice(foundDesignationIdx, 1);
    }

    // 6. Extract Name
    // Usually Name is one of the top remaining lines (usually index 0)
    // Filter out very short/long lines and lines containing digits or common company/designation indicators
    const nameCandidates = remainingLines.filter((line) => {
      const words = line.split(/\s+/);
      const isShort = words.length < 2 || words.length > 4;
      const hasDigits = /\d/.test(line);
      const isCompany = companyKeywords.some((kw) => line.toLowerCase().includes(kw));
      return !isShort && !hasDigits && !isCompany;
    });

    if (nameCandidates.length > 0) {
      name = nameCandidates[0];
      // Remove name from remaining candidate lines
      const nameIdx = remainingLines.indexOf(name);
      if (nameIdx !== -1) {
        remainingLines.splice(nameIdx, 1);
      }
    } else if (remainingLines.length > 0) {
      // Fallback: pick first non-empty line
      name = remainingLines[0];
      remainingLines.shift();
    }

    // 7. Extract Company Name
    // Search remaining lines for company indicators, otherwise fallback to first remaining line
    const companyCandidates = remainingLines.filter((line) => {
      return companyKeywords.some((kw) => line.toLowerCase().includes(kw));
    });

    if (companyCandidates.length > 0) {
      company = companyCandidates[0];
    } else if (remainingLines.length > 0) {
      company = remainingLines[0];
    }

    return {
      name: name || undefined,
      phone: phone || undefined,
      email: email || undefined,
      company: company || undefined,
      designation: designation || undefined,
      officeAddress: officeAddress || undefined,
      website: website || undefined,
    };
  }
}

export const contactParserService = new ContactParserService();
export default contactParserService;
