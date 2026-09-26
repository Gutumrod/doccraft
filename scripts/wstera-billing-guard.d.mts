/// <reference types="node" />

export type BillingGuardOptions = {
  env?: Record<string, string | undefined>;
  platform?: NodeJS.Platform;
  home?: string;
  exists?: (path: string) => boolean;
  spawn?: (
    command: string,
    args: string[],
    options: { encoding: "utf8"; env: Record<string, string | undefined> },
  ) => { status: number | null; stdout: string | null; error?: Error };
};

export function resolveBillingGuardPath(options?: Pick<BillingGuardOptions, "env" | "platform" | "home">): string;
export function runBillingGuard(
  options?: BillingGuardOptions,
): { pass: boolean; path: string | null; reason?: string };
