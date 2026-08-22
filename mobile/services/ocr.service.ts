import { apiService } from './api.service';
import { contactParserService } from './contact-parser.service';
import { ContactData } from '@/components/ui/ContactCard';

class OcrService {
  // Process a card image URI and return parsed fields
  public async processImage(imageUri: string, base64?: string): Promise<{ rawText: string; parsedData: Partial<ContactData> }> {
    if (!base64) {
      throw new Error('Image data is missing or invalid.');
    }

    // 1. Send image securely to backend OCR API
    const ocrResult = await apiService.performOcr(base64);
    
    // 2. Parse normalized OCR results locally
    const parsedData = contactParserService.parseOcrResult(ocrResult);

    return {
      rawText: ocrResult.rawText,
      parsedData,
    };
  }
}

export const ocrService = new OcrService();
export default ocrService;
