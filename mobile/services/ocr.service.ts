import { parseContactText } from '../utils/parser';
import { ContactData } from '@/components/ui/ContactCard';

// Sample business cards for simulated OCR extraction
const MOCK_BUSINESS_CARDS = [
  `Rahul Sharma
Software Engineer
ABC Technologies
Phone: +91 9876543210
Email: rahul@abc.com
Address: ABC Campus, S.G. Highway, Ahmedabad, Gujarat`,
  
  `Priya Patel
Product Manager
XYZ Solutions
Cell: +91 9988776655
Email: priya@xyz.com
Office: Block C, Alpha Plaza, Mumbai, Maharashtra`,
  
  `Amit Shah
Founder & CEO
Startup Hub
+91 8877665544
amit@startuphub.io
www.startuphub.io
Vastrapur, Ahmedabad, Gujarat`,

  `Neha Gupta
Lead Talent Partner
Tech Recruiting Corp
Mob: +91 7766554433
neha@techrecruiting.com
New Delhi, Delhi`,

  `John Doe
Principal Cloud Architect
Cloud Systems Inc.
+1 (555) 019-2834
john.doe@cloudsystems.com
100 Pine Street, San Francisco, CA 94111`
];

class OcrService {
  private mockIndex = 0;

  // Process a card image URI and return parsed fields
  public async processImage(imageUri: string): Promise<{ rawText: string; parsedData: Partial<ContactData> }> {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For local MVP/demonstration, we alternate between mock business cards
    const rawText = MOCK_BUSINESS_CARDS[this.mockIndex];
    
    // Increment mock index for the next scan
    this.mockIndex = (this.mockIndex + 1) % MOCK_BUSINESS_CARDS.length;

    // Parse text into structured fields
    const parsedData = parseContactText(rawText);

    return {
      rawText,
      parsedData,
    };
  }
}

export const ocrService = new OcrService();
