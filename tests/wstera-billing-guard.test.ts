import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { resolveBillingGuardPath, runBillingGuard } from "../scripts/wstera-billing-guard.mjs";

const passJson = JSON.stringify({ verdict: "WSTERA_BILLING_BOUNDARY_PASS" });

describe("WSTERA billing deploy guard", () => {
  it("uses the explicit vault path and resolves the canonical guard", () => {
    const path = resolveBillingGuardPath({
      env: { WSTERA_VAULT: "C:/vault" },
      platform: "win32",
    });
    expect(path).toBe("C:\\vault\\06-Agent-Logs\\WSTERA-House\\tools\\verify_wstera_billing_boundary.py");
  });

  it("uses the documented Windows vault default", () => {
    expect(resolveBillingGuardPath({ env: {}, platform: "win32" })).toBe(
      path.win32.join("D:\\AI-Workspace\\vault", "06-Agent-Logs", "WSTERA-House", "tools", "verify_wstera_billing_boundary.py"),
    );
  });

  it("uses the documented macOS vault default", () => {
    expect(resolveBillingGuardPath({ env: {}, platform: "darwin", home: "/Users/test" })).toBe(
      path.posix.join("/Users/test", "AI-Workspace", "vault", "06-Agent-Logs", "WSTERA-House", "tools", "verify_wstera_billing_boundary.py"),
    );
  });

  it("passes only when the guard prints the canonical PASS verdict and exits zero", () => {
    const spawn = vi.fn(() => ({ status: 0, stdout: passJson }));
    expect(runBillingGuard({
      env: { WSTERA_VAULT: "C:/vault" },
      exists: () => true,
      spawn,
    })).toMatchObject({ pass: true, path: expect.stringContaining("verify_wstera_billing_boundary.py") });
    expect(spawn).toHaveBeenCalledOnce();
  });

  it("fails closed when the guard path is missing without invoking Python", () => {
    const spawn = vi.fn();
    expect(runBillingGuard({
      env: { WSTERA_VAULT: "C:/missing-vault" },
      exists: () => false,
      spawn,
    })).toMatchObject({ pass: false });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("fails on a guard FAIL verdict even if the process exits zero", () => {
    const spawn = vi.fn(() => ({ status: 0, stdout: JSON.stringify({ verdict: "WSTERA_BILLING_BOUNDARY_FAIL" }) }));
    expect(runBillingGuard({ env: { WSTERA_VAULT: "C:/vault" }, exists: () => true, spawn })).toMatchObject({ pass: false });
  });

  it("reports a clear failure when Python cannot start", () => {
    const spawn = vi.fn(() => ({ status: null, stdout: null, error: new Error("python missing") }));
    expect(runBillingGuard({ env: { WSTERA_VAULT: "C:/vault" }, exists: () => true, spawn })).toMatchObject({
      pass: false,
      reason: "Could not start Python billing guard",
    });
  });

  it("runs the guard before every Wrangler deploy script", () => {
    const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts;
    for (const name of ["deploy:http-redirect", "deploy:main", "deploy"]) {
      expect(scripts[name], name).toMatch(/^node scripts\/wstera-billing-guard\.mjs && /);
    }
  });
});
