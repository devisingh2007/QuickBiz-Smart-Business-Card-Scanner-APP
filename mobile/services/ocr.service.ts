import { parseContactText } from '../utils/parser';
import { ContactData } from '@/components/ui/ContactCard';

class OcrService {
  // Process a card image URI and return parsed fields
  public async processImage(imageUri: string, base64?: string): Promise<{ rawText: string; parsedData: Partial<ContactData> }> {
    // 1. If it's a real scan with base64 data, call ocr.space API
    if (base64) {
      try {
        const formData = new FormData();
        formData.append('apikey', 'helloworld'); // Demo API key, public and free for developer integration
        
        // Ensure base64 string has correct data URI header
        const formattedBase64 = base64.startsWith('data:') 
          ? base64 
          : `data:image/jpeg;base64,${base64}`;
          
        formData.append('base64Image', formattedBase64);
        formData.append('language', 'eng');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');

        const response = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = await response.json();
        
        if (!response.ok || data.IsErroredOnProcessing || !data.ParsedResults || data.ParsedResults.length === 0) {
          const errMsg = data.ErrorMessage ? data.ErrorMessage.join(', ') : 'OCR processing failed';
          throw new Error(errMsg);
        }

        const rawText = data.ParsedResults[0].ParsedText || '';
        
        if (!rawText.trim()) {
          throw new Error('No text detected on the business card.');
        }

        // Parse text into structured fields using our regex logic
        const parsedData = parseContactText(rawText);

        return {
          rawText,
          parsedData,
        };
      } catch (err: any) {
        console.warn('Real OCR Space API call failed:', err.message || err);
        throw new Error(err.message || 'Failed to read contact card.');
      }
    }

    // 2. If in simulated mode (no camera or web preview)
    // Return empty fields to force the user to type manually, without pre-populating fake contact data.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      rawText: 'Simulated Card Capture\nNo text detected.',
      parsedData: {},
    };
  }
}

export const ocrService = new OcrService();
export default ocrService;
