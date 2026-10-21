import { test } from "node:test";
import assert from "node:assert/strict";
// Node loads the storage helpers without Vite. The API fallback remains local.
const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
const { saveTimerState, getTimerState, getTimerStorageKey } = await import(
  "../../src/services/progressService.js"
);
const token = (id) =>
  `header.${Buffer.from(JSON.stringify({ uid: id })).toString("base64url")}.signature`;
test("timer state is separated across accounts and invalid saved JSON recovers", () => {
  values.clear();
  localStorage.setItem("accessToken", token("first"));
  saveTimerState({ remainingTime: 60 });
  localStorage.setItem("accessToken", token("second"));
  assert.equal(getTimerState(), null);
  saveTimerState({ remainingTime: 120 });
  localStorage.setItem("accessToken", token("first"));
  assert.equal(getTimerState().remainingTime, 60);
  localStorage.setItem(getTimerStorageKey(), "{broken");
  assert.equal(getTimerState(), null);
});
