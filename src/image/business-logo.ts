import type { BusinessLogo } from '../domain/document/types';

/**
 * Business logo (Phase 4.1) client-side image pipeline.
 *
 * Limits are intentionally separate from the item-image pipeline: business logos
 * are small identity marks, so we allow a smaller decoded long edge and a smaller
 * encoded-size guard while preserving aspect ratio. WebP is prioritised because it
 * supports alpha (transparent PNG/WebP logos remain visually acceptable on white
 * paper), with a white-background JPEG fallback when WebP is unavailable.
 */

export const BUSINESS_LOGO_MAX_DATA_URL_BYTES = 131_072;
export const BUSINESS_LOGO_MAX_LONG_EDGE = 512;
export const BUSINESS_LOGO_INITIAL_QUALITY = 0.85;
export const BUSINESS_LOGO_MAX_ATTEMPTS = 4;
export const BUSINESS_LOGO_RETRY_SCALE = 0.85;
export const BUSINESS_LOGO_QUALITY_STEP = 0.12;

export const BUSINESS_LOGO_SOURCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const BUSINESS_LOGO_PERSISTED_TYPES = ['image/jpeg', 'image/webp'] as const;

export type BusinessLogoProcessingErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'DECODE_FAILED'
  | 'ENCODE_FAILED'
  | 'TOO_LARGE';

export class BusinessLogoProcessingError extends Error {
  constructor(
    public readonly code: BusinessLogoProcessingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BusinessLogoProcessingError';
  }
}

export function getBusinessLogoUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isStrictBase64(value: string): boolean {
  if (!value || value.length % 4 !== 0) return false;
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type BusinessLogoValidationResult =
  | { ok: true; value: BusinessLogo }
  | { ok: false; message: string };

export function validateBusinessLogoStructure(raw: unknown): BusinessLogoValidationResult {
  if (!isObject(raw)) return { ok: false, message: 'logo must be an object' };

  const keys = Object.keys(raw).sort();
  const expectedKeys = ['dataUrl', 'height', 'mimeType', 'width'];
  if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) {
    return { ok: false, message: 'logo contains unsupported or missing fields' };
  }

  if ((raw.mimeType as string) !== 'image/jpeg' && (raw.mimeType as string) !== 'image/webp') {
    return { ok: false, message: 'logo.mimeType must be image/jpeg or image/webp' };
  }
  if (typeof raw.dataUrl !== 'string') {
    return { ok: false, message: 'logo.dataUrl must be a string' };
  }

  const prefix = `data:${raw.mimeType};base64,`;
  if (!raw.dataUrl.startsWith(prefix)) {
    return { ok: false, message: 'logo.dataUrl MIME type does not match logo.mimeType' };
  }

  const encodedPayload = raw.dataUrl.slice(prefix.length);
  if (!isStrictBase64(encodedPayload)) {
    return { ok: false, message: 'logo.dataUrl must contain valid base64 image data' };
  }

  if (getBusinessLogoUtf8ByteLength(raw.dataUrl) > BUSINESS_LOGO_MAX_DATA_URL_BYTES) {
    return { ok: false, message: `logo.dataUrl exceeds ${BUSINESS_LOGO_MAX_DATA_URL_BYTES} UTF-8 bytes` };
  }

  if (!Number.isInteger(raw.width) || (raw.width as number) <= 0 || (raw.width as number) > BUSINESS_LOGO_MAX_LONG_EDGE) {
    return {
      ok: false,
      message: `logo.width must be a positive integer up to ${BUSINESS_LOGO_MAX_LONG_EDGE}`,
    };
  }
  if (!Number.isInteger(raw.height) || (raw.height as number) <= 0 || (raw.height as number) > BUSINESS_LOGO_MAX_LONG_EDGE) {
    return {
      ok: false,
      message: `logo.height must be a positive integer up to ${BUSINESS_LOGO_MAX_LONG_EDGE}`,
    };
  }

  return {
    ok: true,
    value: {
      dataUrl: raw.dataUrl,
      mimeType: raw.mimeType as BusinessLogo['mimeType'],
      width: raw.width as number,
      height: raw.height as number,
    },
  };
}

interface DecodedLogo {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function decodeLogoSource(file: File): Promise<DecodedLogo> {
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
    throw new BusinessLogoProcessingError('DECODE_FAILED', 'เบราว์เซอร์นี้ไม่รองรับการประมวลผลรูปภาพ');
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
    throw new BusinessLogoProcessingError(
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

function drawLogoSource(
  source: CanvasImageSource,
  width: number,
  height: number,
  whiteBackground: boolean,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) {
    throw new BusinessLogoProcessingError('ENCODE_FAILED', 'เบราว์เซอร์ไม่สามารถสร้างพื้นที่ประมวลผลรูปภาพได้');
  }

  if (whiteBackground) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

function encodeLogoAttempt(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number,
): BusinessLogo {
  const webpCanvas = drawLogoSource(source, width, height, false);
  const webpDataUrl = webpCanvas.toDataURL('image/webp', quality);
  if (webpDataUrl.startsWith('data:image/webp;base64,')) {
    return { dataUrl: webpDataUrl, mimeType: 'image/webp', width, height };
  }
  const jpegCanvas = drawLogoSource(source, width, height, true);
  const jpegDataUrl = jpegCanvas.toDataURL('image/jpeg', quality);
  if (!jpegDataUrl.startsWith('data:image/jpeg;base64,')) {
    throw new BusinessLogoProcessingError('ENCODE_FAILED', 'เบราว์เซอร์ไม่สามารถเข้ารหัสรูปเป็น WebP หรือ JPEG ได้');
  }

  return { dataUrl: jpegDataUrl, mimeType: 'image/jpeg', width, height };
}

function fitLogoWithinLongEdge(width: number, height: number): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= BUSINESS_LOGO_MAX_LONG_EDGE) {
    return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
  }

  const scale = BUSINESS_LOGO_MAX_LONG_EDGE / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function processBusinessLogoFile(file: File): Promise<BusinessLogo> {
  if (!BUSINESS_LOGO_SOURCE_TYPES.includes(file.type as (typeof BUSINESS_LOGO_SOURCE_TYPES)[number])) {
    throw new BusinessLogoProcessingError('UNSUPPORTED_TYPE', 'รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP');
  }

  const decoded = await decodeLogoSource(file);
  try {
    const fitted = fitLogoWithinLongEdge(decoded.width, decoded.height);
    for (let attempt = 0; attempt < BUSINESS_LOGO_MAX_ATTEMPTS; attempt += 1) {
      const scale = Math.pow(BUSINESS_LOGO_RETRY_SCALE, attempt);
      const width = Math.max(1, Math.round(fitted.width * scale));
      const height = Math.max(1, Math.round(fitted.height * scale));
      const quality = Math.max(0.1, BUSINESS_LOGO_INITIAL_QUALITY - BUSINESS_LOGO_QUALITY_STEP * attempt);
      const logo = encodeLogoAttempt(decoded.source, width, height, quality);
      const validation = validateBusinessLogoStructure(logo);

      if (validation.ok) return validation.value;
      if (!validation.message.includes('exceeds')) {
        throw new BusinessLogoProcessingError('ENCODE_FAILED', `รูปภาพที่ประมวลผลไม่ถูกต้อง: ${validation.message}`);
      }
    }

    throw new BusinessLogoProcessingError(
      'TOO_LARGE',
      'โลโก้ยังมีขนาดใหญ่เกิน 128 KiB หลังลดขนาดแล้ว กรุณาเลือกรูปที่เล็กหรือเรียบง่ายกว่า',
    );
  } finally {
    decoded.cleanup();
  }
}
