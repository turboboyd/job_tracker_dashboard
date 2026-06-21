import assert from "node:assert/strict";

import {
  buildCreateContactInput,
  buildUpdateContactInput,
  type ContactFormPayloadValues,
} from "../ContactFormModal";

function test(_name: string, run: () => void) {
  run();
}

function form(
  overrides: Partial<ContactFormPayloadValues> = {},
): ContactFormPayloadValues {
  return {
    firstName: " Anna ",
    lastName: " Müller ",
    role: "HR",
    phones: [
      { number: " +49 123 ", label: "mobile" },
      { number: " ", label: "work" },
    ],
    emails: [
      { address: " anna@example.test ", label: "work" },
      { address: "", label: "personal" },
    ],
    companyName: " Acme GmbH ",
    linkedInUrl: " https://linkedin.example/anna ",
    notes: " Responsive ",
    tagsInput: " recruiter, responsive, ",
    ...overrides,
  };
}

test("buildUpdateContactInput preserves existing trimming and omission behavior", () => {
  assert.deepEqual(buildUpdateContactInput(form()), {
    firstName: "Anna",
    lastName: "Müller",
    role: "HR",
    phones: [{ number: " +49 123 ", label: "mobile" }],
    emails: [{ address: " anna@example.test ", label: "work" }],
    tags: ["recruiter", "responsive"],
    companyName: "Acme GmbH",
    linkedInUrl: "https://linkedin.example/anna",
    notes: "Responsive",
  });
});

test("buildUpdateContactInput omits blank optional text fields", () => {
  const input = buildUpdateContactInput(
    form({ companyName: " ", linkedInUrl: "", notes: " " }),
  );

  assert.equal("companyName" in input, false);
  assert.equal("linkedInUrl" in input, false);
  assert.equal("notes" in input, false);
});

test("buildCreateContactInput adds the application link only when provided", () => {
  assert.deepEqual(
    buildCreateContactInput(form(), "app-1").applicationIds,
    ["app-1"],
  );
  assert.equal(
    "applicationIds" in buildCreateContactInput(form(), undefined),
    false,
  );
});
