import type { ItemImage } from '../domain/document/types';

export const ITEM_IMAGE_MAX_DATA_URL_BYTES = 262_144;
export const ITEM_IMAGE_MAX_LONG_EDGE = 960;
export const ITEM_IMAGE_INITIAL_QUALITY = 0.82;
export const ITEM_IMAGE_MAX_ATTEMPTS = 4;
export const ITEM_IMAGE_RETRY_SCALE = 0.85;
export const ITEM_IMAGE_QUALITY_STEP = 0.12;

export const ITEM_IMAGE_SOURCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ITEM_IMAGE_PERSISTED_TYPES = ['image/jpeg', 'image/webp'] as const;

export type ItemImageProcessingErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'DECODE_FAILED'
  | 'ENCODE_FAILED'
  | 'TOO_LARGE';

export class ItemImageProcessingError extends Error {
  constructor(
    public readonly code: ItemImageProcessingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ItemImageProcessingError';
  }
}
export type ItemImageValidationResult =
  | { ok: true; value: ItemImage }
  | { ok: false; message: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isStrictBase64(value: string): boolean {
  if (!value || value.length % 4 !== 0) return false;
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

export function validateItemImageStructure(raw: unknown): ItemImageValidationResult {
  if (!isObject(raw)) return { ok: false, message: 'image must be an object' };

  const keys = Object.keys(raw).sort();
  const expectedKeys = ['dataUrl', 'height', 'mimeType', 'width'];
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    return { ok: false, message: 'image contains unsupported or missing fields' };
  }

  if (raw.mimeType !== 'image/jpeg' && raw.mimeType !== 'image/webp') {
    return { ok: false, message: 'image.mimeType must be image/jpeg or image/webp' };
  }
  if (typeof raw.dataUrl !== 'string') {
    return { ok: false, message: 'image.dataUrl must be a string' };
  }

  const prefix = `data:${raw.mimeType};base64,`;
  if (!raw.dataUrl.startsWith(prefix)) {
    return { ok: false, message: 'image.dataUrl MIME type does not match image.mimeType' };
  }

  const encodedPayload = raw.dataUrl.slice(prefix.length);
  if (!isStrictBase64(encodedPayload)) {
    return { ok: false, message: 'image.dataUrl must contain valid base64 image data' };
  }

  if (getUtf8ByteLength(raw.dataUrl) > ITEM_IMAGE_MAX_DATA_URL_BYTES) {
    return { ok: false, message: `image.dataUrl exceeds ${ITEM_IMAGE_MAX_DATA_URL_BYTES} UTF-8 bytes` };
  }

  if (!Number.isInteger(raw.width) || (raw.width as number) <= 0 || (raw.width as number) > ITEM_IMAGE_MAX_LONG_EDGE) {
    return { ok: false, message: `image.width must be a positive integer up to ${ITEM_IMAGE_MAX_LONG_EDGE}` };
  }
  if (!Number.isInteger(raw.height) || (raw.height as number) <= 0 || (raw.height as number) > ITEM_IMAGE_MAX_LONG_EDGE) {
    return { ok: false, message: `image.height must be a positive integer up to ${ITEM_IMAGE_MAX_LONG_EDGE}` };
  }

  return {
    ok: true,
    value: {
      dataUrl: raw.dataUrl,
      mimeType: raw.mimeType,
      width: raw.width as number,
      height: raw.height as number,
    },
  };
}
interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap.close(),
        };
      }
      bitmap.close();
    } catch {
      // Fall through to HTMLImageElement decoding for browser compatibility.
    }
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined' || typeof URL === 'undefined') {
    throw new ItemImageProcessingError('DECODE_FAILED', 'เบราว์เซอร์นี้ไม่รองรับการประมวลผลรูปภาพ');
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image decode failed'));
      image.src = objectUrl;
    });

    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error('Image has invalid dimensions');
    }

    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw new ItemImageProcessingError(
      'DECODE_FAILED',
      error instanceof Error ? `อ่านไฟล์รูปภาพไม่สำเร็จ: ${error.message}` : 'อ่านไฟล์รูปภาพไม่สำเร็จ',
    );
  }
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
function drawSource(
  source: CanvasImageSource,
  width: number,
  height: number,
  whiteBackground: boolean,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new ItemImageProcessingError('ENCODE_FAILED', 'เบราว์เซอร์ไม่สามารถสร้างพื้นที่ประมวลผลรูปภาพได้');
  }

  if (whiteBackground) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

function encodeAttempt(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number,
): ItemImage {
  const webpCanvas = drawSource(source, width, height, false);
  const webpDataUrl = webpCanvas.toDataURL('image/webp', quality);
  if (webpDataUrl.startsWith('data:image/webp;base64,')) {
    return { dataUrl: webpDataUrl, mimeType: 'image/webp', width, height };
  }
  const jpegCanvas = drawSource(source, width, height, true);
  const jpegDataUrl = jpegCanvas.toDataURL('image/jpeg', quality);
  if (!jpegDataUrl.startsWith('data:image/jpeg;base64,')) {
    throw new ItemImageProcessingError('ENCODE_FAILED', 'เบราว์เซอร์ไม่สามารถเข้ารหัสรูปเป็น WebP หรือ JPEG ได้');
  }

  return { dataUrl: jpegDataUrl, mimeType: 'image/jpeg', width, height };
}

function fitWithinLongEdge(width: number, height: number): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= ITEM_IMAGE_MAX_LONG_EDGE) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }

  const scale = ITEM_IMAGE_MAX_LONG_EDGE / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function processItemImageFile(file: File): Promise<ItemImage> {
  if (!ITEM_IMAGE_SOURCE_TYPES.includes(file.type as (typeof ITEM_IMAGE_SOURCE_TYPES)[number])) {
    throw new ItemImageProcessingError('UNSUPPORTED_TYPE', 'รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP');
  }

  const decoded = await decodeImage(file);
  try {
    const fitted = fitWithinLongEdge(decoded.width, decoded.height);
    for (let attempt = 0; attempt < ITEM_IMAGE_MAX_ATTEMPTS; attempt += 1) {
      const scale = Math.pow(ITEM_IMAGE_RETRY_SCALE, attempt);
      const width = Math.max(1, Math.round(fitted.width * scale));
      const height = Math.max(1, Math.round(fitted.height * scale));
      const quality = Math.max(0.1, ITEM_IMAGE_INITIAL_QUALITY - ITEM_IMAGE_QUALITY_STEP * attempt);
      const image = encodeAttempt(decoded.source, width, height, quality);
      const validation = validateItemImageStructure(image);

      if (validation.ok) return validation.value;
      if (!validation.message.includes('exceeds')) {
        throw new ItemImageProcessingError('ENCODE_FAILED', `รูปภาพที่ประมวลผลไม่ถูกต้อง: ${validation.message}`);
      }
    }

    throw new ItemImageProcessingError(
      'TOO_LARGE',
      'รูปภาพยังมีขนาดใหญ่เกิน 256 KiB หลังลดขนาดแล้ว กรุณาเลือกรูปที่เล็กหรือเรียบง่ายกว่า',
    );
  } finally {
    decoded.cleanup();
  }
}
