import { afterEach, describe, expect, it, vi } from 'vitest';
import { processItemImageFile } from '../../src/image/item-image';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Phase 4 remediation — corrupted image input', () => {
  it('rejects an undecodable file with a supported MIME type before any state update can occur', async () => {
    const decode = vi.fn(async () => {
      throw new Error('corrupt image data');
    });

    vi.stubGlobal('createImageBitmap', decode);
    vi.stubGlobal('document', undefined);
    vi.stubGlobal('Image', undefined);

    const corruptJpeg = new File([Uint8Array.of(0x00, 0x01, 0x02, 0x03)], 'corrupt.jpg', {
      type: 'image/jpeg',
    });

    await expect(processItemImageFile(corruptJpeg)).rejects.toMatchObject({
      code: 'DECODE_FAILED',
    });
    expect(decode).toHaveBeenCalledTimes(1);
  });
});
