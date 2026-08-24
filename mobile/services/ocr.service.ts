import { Platform } from 'react-native';
import { contactParserService } from './contact-parser.service';
import { ContactData } from '@/components/ui/ContactCard';

let recognizeText: any = null;
try {
  recognizeText = require('expo-mlkit-ocr').recognizeText;
} catch (e: any) {
  console.warn('[OCR] expo-mlkit-ocr native module not available in this client environment:', e.message);
}
console.log(`[OCR] ML Kit native module available: ${recognizeText !== null}`);

// ─── Types (matches expo-mlkit-ocr RecognitionResult) ──────────────────────────
export interface MlKitOcrResult {
  rawText: string;
  blocks: { text: string; confidence: number }[];
  lines: { text: string; confidence: number }[];
  confidence: number;
}

// ─── OcrService ────────────────────────────────────────────────────────────────
// Adapter between the UI and the on-device ML Kit engine.
// The UI ONLY calls:  ocrService.processImage(imageUri)
// The UI never imports expo-mlkit-ocr directly.
class OcrService {
  /**
   * Run on-device OCR on a local image URI.
   * Returns normalized parsedData for the Review screen.
   *
   * @param imageUri  Local file URI from expo-camera (file://...)
   */
  public async processImage(
    imageUri: string,
  ): Promise<{ rawText: string; parsedData: Partial<ContactData> }> {
    if (!imageUri) {
      throw new Error('Image URI is required.');
    }

    // expo-mlkit-ocr is native-only — gracefully reject on web
    if (Platform.OS === 'web') {
      throw new Error('OCR_NOT_SUPPORTED_ON_WEB');
    }

    console.log('[OCR] ML Kit OCR started (on-device)');

    if (!recognizeText) {
      console.error('[OCR] recognizeText is not loaded. Safe mode fallback.');
      throw new Error('OCR_ENGINE_ERROR');
    }

    let recognition;
    try {
      recognition = await recognizeText(imageUri);
    } catch (err: any) {
      console.error('[OCR] ML Kit recognizeText failed:', err?.message || err);
      throw new Error('OCR_ENGINE_ERROR');
    }

    const rawText = recognition.text ?? '';

    if (!rawText.trim()) {
      console.log('[OCR] ML Kit returned no text.');
      throw new Error('OCR_NO_TEXT');
    }

    console.log(`[OCR] ML Kit OCR completed — ${rawText.length} chars`);

    // Normalise the ML Kit block/line structure into the shape
    // contact-parser.service.ts expects.
    const normalised = normaliseMlKitResult(recognition);

    // Parse into ContactData fields
    const parsedData = contactParserService.parseOcrResult(normalised);

    return { rawText, parsedData };
  }
}

// ─── Normaliser ────────────────────────────────────────────────────────────────
// expo-mlkit-ocr returns: { text, blocks: [ { text, lines: [...] } ] }
// contact-parser expects:  { rawText, blocks: [{ text, confidence }], lines: [{ text, confidence }] }
function normaliseMlKitResult(recognition: {
  text: string;
  blocks: {
    text: string;
    lines?: { text: string; elements?: { text: string }[] }[];
  }[];
}): MlKitOcrResult {
  const blocks: { text: string; confidence: number }[] = [];
  const lines: { text: string; confidence: number }[] = [];

  for (const block of recognition.blocks ?? []) {
    blocks.push({ text: block.text, confidence: 1 });

    for (const line of block.lines ?? []) {
      if (line.text?.trim()) {
        lines.push({ text: line.text.trim(), confidence: 1 });
      }
    }
  }

  return {
    rawText: recognition.text,
    blocks,
    lines,
    confidence: 1,
  };
}

export const ocrService = new OcrService();
export default ocrService;
