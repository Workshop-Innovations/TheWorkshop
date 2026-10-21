import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const script = new URL("../../scripts/check-deploy-env.mjs", import.meta.url);
test("deployment builds reject missing, local and malformed API origins", () => {
  for (const value of [
    "",
    "http://localhost:8000",
    "https://localhost",
    "https://api.example.com/api",
    "https://user:secret@api.example.com",
  ]) {
    const result = spawnSync(process.execPath, [fileURLToPath(script)], {
      env: { ...process.env, VITE_API_URL: value },
    });
    assert.notEqual(result.status, 0, value);
  }
  assert.equal(
    spawnSync(process.execPath, [fileURLToPath(script)], {
      env: { ...process.env, VITE_API_URL: "https://api.example.com" },
    }).status,
    0,
  );
});
