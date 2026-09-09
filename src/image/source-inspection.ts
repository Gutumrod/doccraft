export const IMAGE_SOURCE_HEADER_SCAN_BYTES = 256 * 1024;
export const IMAGE_SOURCE_MAX_LONG_EDGE = 4096;
export const IMAGE_SOURCE_MAX_PIXELS = 16_777_216;

export type SupportedSourceMime = 'image/jpeg' | 'image/png' | 'image/webp';

export type ImageSourceInspectionResult =
  | { ok: true; width: number; height: number; mimeType: SupportedSourceMime }
  | { ok: false; message: string };

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function validateDimensions(width: number, height: number, mimeType: SupportedSourceMime): ImageSourceInspectionResult {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return { ok: false, message: 'รูปภาพมีขนาดพิกเซลไม่ถูกต้อง' };
  }
  if (Math.max(width, height) > IMAGE_SOURCE_MAX_LONG_EDGE || width * height > IMAGE_SOURCE_MAX_PIXELS) {
    return {
      ok: false,
      message: `รูปภาพต้นฉบับใหญ่เกินขอบเขตความปลอดภัย (${IMAGE_SOURCE_MAX_LONG_EDGE}px / ${IMAGE_SOURCE_MAX_PIXELS.toLocaleString()} pixels)`,
    };
  }
  return { ok: true, width, height, mimeType };
}
function inspectPng(bytes: Uint8Array): ImageSourceInspectionResult {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 24 || signature.some((value, index) => bytes[index] !== value)) {
    return { ok: false, message: 'ไฟล์ PNG มี header ไม่ถูกต้อง' };
  }
  if (String.fromCharCode(...bytes.slice(12, 16)) !== 'IHDR') {
    return { ok: false, message: 'ไฟล์ PNG ไม่มี IHDR ที่ถูกต้อง' };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return validateDimensions(view.getUint32(16), view.getUint32(20), 'image/png');
}

const JPEG_SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

function inspectJpeg(bytes: Uint8Array): ImageSourceInspectionResult {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return { ok: false, message: 'ไฟล์ JPEG มี header ไม่ถูกต้อง' };
  }
  let offset = 2;
  while (offset + 3 < bytes.length) {
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) break;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
    if (JPEG_SOF_MARKERS.has(marker) && segmentLength >= 7) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      return validateDimensions(width, height, 'image/jpeg');
    }
    offset += segmentLength;
  }
  return { ok: false, message: 'ไม่พบขนาดรูป JPEG ภายใน header scan limit' };
}
function inspectWebp(bytes: Uint8Array): ImageSourceInspectionResult {
  if (bytes.length < 30 || String.fromCharCode(...bytes.slice(0, 4)) !== 'RIFF' || String.fromCharCode(...bytes.slice(8, 12)) !== 'WEBP') {
    return { ok: false, message: 'ไฟล์ WebP มี header ไม่ถูกต้อง' };
  }
  const fourcc = String.fromCharCode(...bytes.slice(12, 16));
  if (fourcc === 'VP8X') {
    const width = readUint24LE(bytes, 24) + 1;
    const height = readUint24LE(bytes, 27) + 1;
    return validateDimensions(width, height, 'image/webp');
  }
  if (fourcc === 'VP8L') {
    if (bytes[20] !== 0x2f || bytes.length < 25) return { ok: false, message: 'ไฟล์ WebP lossless มี header ไม่ถูกต้อง' };
    const width = 1 + (bytes[21] | ((bytes[22] & 0x3f) << 8));
    const height = 1 + (((bytes[22] & 0xc0) >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10));
    return validateDimensions(width, height, 'image/webp');
  }
  if (fourcc === 'VP8 ') {
    if (bytes.length < 30 || bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return { ok: false, message: 'ไฟล์ WebP lossy มี frame header ไม่ถูกต้อง' };
    }
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
    return validateDimensions(width, height, 'image/webp');
  }
  return { ok: false, message: `ไม่รองรับ WebP chunk ${fourcc || '(unknown)'}` };
}

export async function inspectImageSource(file: File, mimeType: SupportedSourceMime): Promise<ImageSourceInspectionResult> {
  const slice = file.slice(0, Math.min(file.size, IMAGE_SOURCE_HEADER_SCAN_BYTES));
  const bytes = new Uint8Array(await slice.arrayBuffer());
  if (mimeType === 'image/png') return inspectPng(bytes);
  if (mimeType === 'image/jpeg') return inspectJpeg(bytes);
  return inspectWebp(bytes);
}
