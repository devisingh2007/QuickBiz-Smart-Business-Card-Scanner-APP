import { Platform, } from 'react-native';
import { parseOcrResult, } from './contact-parser.service';
let mlKitModule = null;
try {
  mlKitModule = require('expo-mlkit-ocr');
} catch { }
export const isOcrAvailable = () => {
  return Platform.OS !== 'web' && mlKitModule != null && typeof mlKitModule.recognizeText === 'function';
};
export const processCardImage = async imageUri => {
  if (!imageUri) {
    throw new Error('Image URI is required.');
  }
  if (Platform.OS === 'web') {
    throw new Error('OCR_NOT_SUPPORTED_ON_WEB');
  }
  if (!isOcrAvailable()) {
    throw new Error('OCR_NATIVE_UNAVAILABLE');
  }
  let recognition;
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
  const lines = [];
  for (const block of recognition.blocks ?? []) {
    for (const line of block.lines ?? []) {
      if (line.text?.trim()) {
        lines.push({
          text: line.text.trim(),
          confidence: 1
        });
      }
    }
  }
  const parsedData = parseOcrResult({
    rawText,
    lines,
    blocks: (recognition.blocks ?? []).map(b => ({
      text: b.text,
      confidence: 1
    })),
    confidence: 1
  });
  return {
    rawText,
    parsedData
  };
};
export const ocrService = {
  isAvailable: isOcrAvailable,
  processImage: processCardImage
};
export default ocrService;