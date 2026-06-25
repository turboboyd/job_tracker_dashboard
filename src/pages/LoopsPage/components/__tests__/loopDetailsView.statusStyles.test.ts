import assert from "node:assert/strict";

import { getStatusBadgeClass, MATCH_STATUS_STYLES } from "../loopDetailsView.helpers";

// getStatusBadgeClass — every loop status maps to a distinct, stable badge style
// so active / paused / archived loops stay visually distinguishable.
const activeClass = getStatusBadgeClass("active");
const pausedClass = getStatusBadgeClass("paused");
const archivedClass = getStatusBadgeClass("archived");

assert.equal(activeClass.startsWith("bg-emerald-100"), true);
assert.equal(pausedClass.startsWith("bg-amber-100"), true);
assert.equal(archivedClass, "bg-muted text-muted-foreground");
// All three are different classes (no two statuses collapse to the same badge).
assert.equal(new Set([activeClass, pausedClass, archivedClass]).size, 3);

// MATCH_STATUS_STYLES — every vacancy-match status carries an i18n key + a class.
assert.deepEqual(Object.keys(MATCH_STATUS_STYLES).sort(), ["converted", "new", "saved"]);
assert.equal(MATCH_STATUS_STYLES.new.key, "loops.statusNew");
assert.equal(MATCH_STATUS_STYLES.saved.key, "loops.statusSaved");
assert.equal(MATCH_STATUS_STYLES.converted.key, "loops.statusConverted");
for (const style of Object.values(MATCH_STATUS_STYLES)) {
  assert.equal(typeof style.cls, "string");
  assert.equal(style.cls.length > 0, true);
}

console.log("loopDetailsView statusStyles tests passed.");
