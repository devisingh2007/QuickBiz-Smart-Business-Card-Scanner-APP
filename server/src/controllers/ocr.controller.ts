import { Request, Response } from 'express';
import vision from '@google-cloud/vision';

// Helper to determine if Google Cloud credentials are set up
export const isOcrConfigured = (): boolean => {
  const hasInline = !!(process.env.GOOGLE_CLOUD_CLIENT_EMAIL && process.env.GOOGLE_CLOUD_PRIVATE_KEY && process.env.GOOGLE_CLOUD_PROJECT_ID);
  const hasFile = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
  return hasInline || hasFile;
};

// Configure Google Cloud Vision client credentials
const options: any = {};
if (process.env.GOOGLE_CLOUD_CLIENT_EMAIL && process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
  options.credentials = {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
  options.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Library automatically resolves credentials using GOOGLE_APPLICATION_CREDENTIALS path
}

// Instantiate Google Vision client (if credentials are set, otherwise initialized lazily)
const getVisionClient = (() => {
  let client: any = null;
  return () => {
    if (!client && isOcrConfigured()) {
      client = new vision.ImageAnnotatorClient(options);
    }
    return client;
  };
})();

export const processBusinessCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { image } = req.body;

    if (!image) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: 'Image base64 data is required.',
        },
      });
      return;
    }

    // Check if Google Vision credentials are fully configured on the server
    if (!isOcrConfigured()) {
      console.warn('[OCR] Request rejected: Google Cloud Vision credentials are missing.');
      res.status(503).json({
        success: false,
        error: {
          code: 'OCR_NOT_CONFIGURED',
          message: 'Google Cloud Vision OCR is not configured on the backend server. Please enter card details manually.',
        },
      });
      return;
    }

    // Clean up base64 prefix if present (e.g. "data:image/jpeg;base64,")
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageSizeBytes = Buffer.from(base64Data, 'base64').length;

    console.log(`[OCR] Request started. Image Size: ${(imageSizeBytes / 1024).toFixed(1)} KB`);
    const startTimeMs = Date.now();

    const request = {
      image: {
        content: base64Data,
      },
      features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
    };

    const clientInstance = getVisionClient();
    if (!clientInstance) {
      throw new Error('Failed to initialize ImageAnnotatorClient.');
    }

    const [result] = await clientInstance.annotateImage(request);
    const fullTextAnnotation = result.fullTextAnnotation;

    const processingTimeMs = Date.now() - startTimeMs;

    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      console.log(`[OCR] Processing completed in ${processingTimeMs}ms but detected no text.`);
      res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_OCR_RESULT',
          message: 'No text could be detected on the business card. Please ensure the card text is clear and readable.',
        },
      });
      return;
    }

    // Reconstruct blocks and lines with layout boxes and confidence scores
    const blocks: any[] = [];
    const lines: any[] = [];

    if (fullTextAnnotation.pages && fullTextAnnotation.pages.length > 0) {
      const page = fullTextAnnotation.pages[0];

      for (const block of page.blocks || []) {
        let blockText = '';
        let totalConfidence = 0;
        let symbolCount = 0;

        for (const paragraph of block.paragraphs || []) {
          let lineText = '';
          for (const word of paragraph.words || []) {
            const wordText = (word.symbols || []).map((s: any) => s.text).join('');
            lineText += (lineText ? ' ' : '') + wordText;
            blockText += (blockText ? ' ' : '') + wordText;

            if (word.confidence) {
              totalConfidence += word.confidence;
              symbolCount++;
            }
          }

          if (lineText.trim()) {
            lines.push({
              text: lineText,
              boundingBox: paragraph.boundingBox,
              confidence: paragraph.confidence || 0,
            });
          }
        }

        blocks.push({
          text: blockText,
          boundingBox: block.boundingBox,
          confidence: symbolCount > 0 ? totalConfidence / symbolCount : block.confidence || 0,
        });
      }
    }

    // Compute average confidence score across all lines
    let netConfidence = 0;
    if (lines.length > 0) {
      netConfidence = lines.reduce((acc, line) => acc + line.confidence, 0) / lines.length;
    }

    console.log(`[OCR] Completed successfully in ${processingTimeMs}ms. Characters: ${fullTextAnnotation.text.length}, Lines: ${lines.length}, Blocks: ${blocks.length}`);

    res.json({
      success: true,
      ocr: {
        rawText: fullTextAnnotation.text,
        blocks,
        lines,
        confidence: netConfidence,
        processingTimeMs,
      },
    });
  } catch (err: any) {
    console.error('[OCR] Google Cloud Vision API Call failed:', err.message || err);
    res.status(500).json({
      success: false,
      error: {
        code: 'OCR_FAILED',
        message: 'Unable to extract text from the business card. Please check server connection.',
      },
    });
  }
};
