import { Platform } from 'react-native';
import { parseOcrResult } from './contact-parser.service';
import { ContactData } from './contact.store';

// expo-mlkit-ocr is a native Expo Module compiled into the Android/iOS binary.
// In Expo Go or web, require will fail because native modules aren't linked.
let mlKitModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mlKitModule = require('expo-mlkit-ocr');
} catch {
  // Native module only available in development build or standalone app
}

export const isOcrAvailable = (): boolean => {
  return Platform.OS !== 'web' && mlKitModule != null && typeof mlKitModule.recognizeText === 'function';
};

export const processCardImage = async (
  imageUri: string
): Promise<{ rawText: string; parsedData: Partial<ContactData> }> => {
  if (!imageUri) {
    throw new Error('Image URI is required.');
  }

  if (Platform.OS === 'web') {
    throw new Error('OCR_NOT_SUPPORTED_ON_WEB');
  }

  if (!isOcrAvailable()) {
    throw new Error('OCR_NATIVE_UNAVAILABLE');
  }

  let recognition: any;
  try {
    recognition = await mlKitModule.recognizeText(imageUri);
  } catch {
    throw new Error('OCR_ENGINE_ERROR');
  }

  const rawText = recognition?.text ?? '';
  if (!rawText.trim()) {
    throw new Error('OCR_NO_TEXT');
  }

  // Extract text lines from recognition blocks
  const lines: { text: string; confidence: number }[] = [];
  for (const block of recognition.blocks ?? []) {
    for (const line of block.lines ?? []) {
      if (line.text?.trim()) {
        lines.push({ text: line.text.trim(), confidence: 1 });
      }
    }
  }

  const parsedData = parseOcrResult({
    rawText,
    lines,
    blocks: (recognition.blocks ?? []).map((b: any) => ({ text: b.text, confidence: 1 })),
    confidence: 1,
  });

  return { rawText, parsedData };
};

export const ocrService = {
  isAvailable: isOcrAvailable,
  processImage: processCardImage,
};

export default ocrService;
