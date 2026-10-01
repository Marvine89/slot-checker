import assert from "node:assert/strict";
import test from "node:test";
import { extractDates, isBeforeCutoff } from "./date-utils.js";

const cutoff = new Date(2026, 9, 5);

test("accepts a numeric date before the cutoff", () => {
  const [date] = extractDates("4.10.2026");
  assert.equal(isBeforeCutoff(date, cutoff), true);
});

test("does not accept the cutoff date", () => {
  const [date] = extractDates("5. oktober 2026");
  assert.equal(isBeforeCutoff(date, cutoff), false);
});

test("rejects an invalid calendar date", () => {
  assert.deepEqual(extractDates("31.02.2026"), []);
});