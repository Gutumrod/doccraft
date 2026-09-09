import { afterEach, describe, expect, it, vi } from 'vitest';
import { processItemImageFile } from '../../src/image/item-image';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Phase 4 remediation — corrupted image input', () => {
  it('rejects a corrupt supported-MIME file at header inspection before browser decode', async () => {
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
      code: 'SOURCE_FORMAT_INVALID',
    });
    expect(decode).not.toHaveBeenCalled();
  });
});
