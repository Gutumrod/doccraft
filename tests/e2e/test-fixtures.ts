import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, applyFixture) => {
    const pageErrors: string[] = [];
    const capturePageError = (error: Error) => pageErrors.push(String(error));

    page.on('pageerror', capturePageError);
    await applyFixture(page);
    page.off('pageerror', capturePageError);

    expect(
      pageErrors,
      `Unexpected browser page errors:\n${pageErrors.join('\n')}`,
    ).toEqual([]);
  },
});

export { expect };
export type { Download, Page } from '@playwright/test';
