import { describe, expect, it } from 'vitest';
import {
  IMAGE_SOURCE_MAX_LONG_EDGE,
  IMAGE_SOURCE_MAX_PIXELS,
  inspectImageSource,
} from '../../src/image/source-inspection';

function pngFile(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return new File([bytes], 'fixture.png', { type: 'image/png' });
}

describe('Public Pilot image source inspection', () => {
  it('accepts a normal phone-class PNG source', async () => {
    const result = await inspectImageSource(pngFile(4032, 3024), 'image/png');
    expect(result).toEqual({ ok: true, width: 4032, height: 3024, mimeType: 'image/png' });
  });
  it('rejects a tiny compressed-image header that declares 6000x6000 before decode', async () => {
    const result = await inspectImageSource(pngFile(6000, 6000), 'image/png');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('ขอบเขตความปลอดภัย');
  });

  it('enforces both long-edge and total-pixel limits', async () => {
    const longEdge = await inspectImageSource(pngFile(IMAGE_SOURCE_MAX_LONG_EDGE + 1, 100), 'image/png');
    expect(longEdge.ok).toBe(false);

    const overPixels = await inspectImageSource(pngFile(4096, 4097), 'image/png');
    expect(4096 * 4097).toBeGreaterThan(IMAGE_SOURCE_MAX_PIXELS);
    expect(overPixels.ok).toBe(false);
  });

  it('rejects MIME/header mismatch instead of trusting the File.type label', async () => {
    const fakeJpeg = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'fake.jpg', { type: 'image/jpeg' });
    const result = await inspectImageSource(fakeJpeg, 'image/jpeg');
    expect(result.ok).toBe(false);
  });
});
