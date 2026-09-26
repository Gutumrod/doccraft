import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const GUARD_PATH_PARTS = ["06-Agent-Logs", "WSTERA-House", "tools", "verify_wstera_billing_boundary.py"];
const PASS_VERDICT = "WSTERA_BILLING_BOUNDARY_PASS";

export function resolveBillingGuardPath({ env = process.env, platform = process.platform, home = os.homedir() } = {}) {
  let vault;
  if (Object.hasOwn(env, "WSTERA_VAULT")) {
    vault = env.WSTERA_VAULT?.trim();
    if (!vault) throw new Error("WSTERA_VAULT is set but empty");
  } else if (platform === "win32") {
    vault = "D:\\AI-Workspace\\vault";
  } else if (platform === "darwin") {
    vault = path.posix.join(home, "AI-Workspace", "vault");
  } else {
    throw new Error("Set WSTERA_VAULT to the vault root on this platform");
  }

  const join = platform === "win32" ? path.win32.join : path.posix.join;
  return join(vault, ...GUARD_PATH_PARTS);
}

export function runBillingGuard({
  env = process.env,
  platform = process.platform,
  home = os.homedir(),
  exists = existsSync,
  spawn = spawnSync,
} = {}) {
  let guardPath;
  try {
    guardPath = resolveBillingGuardPath({ env, platform, home });
  } catch (error) {
    return { pass: false, path: null, reason: error.message };
  }

  if (!exists(guardPath)) {
    return {
      pass: false,
      path: guardPath,
      reason: "Billing guard not found; set WSTERA_VAULT to the vault root",
    };
  }

  let result;
  try {
    result = spawn("python", [guardPath], { encoding: "utf8", env });
  } catch {
    return { pass: false, path: guardPath, reason: "Could not start Python billing guard" };
  }
  if (result.error) {
    return { pass: false, path: guardPath, reason: "Could not start Python billing guard" };
  }

  let verdict;
  try {
    verdict = JSON.parse(result.stdout ?? "").verdict;
  } catch {
    verdict = undefined;
  }
  return { pass: result.status === 0 && verdict === PASS_VERDICT, path: guardPath };
}

function main() {
  const result = runBillingGuard();
  if (result.pass) {
    console.log(`PASS ${result.path}`);
    return;
  }

  console.error(`FAIL ${result.path ?? "WSTERA_VAULT"}${result.reason ? ` — ${result.reason}` : ""}`);
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
