import { describe, it, expect } from "vitest";
import {
  getAccessLevel,
  canView,
  canEdit,
  canDelete,
  canManageSharing,
} from "@/lib/access";

// The sharing/access-control logic is the heart of the app's correctness, so
// it gets the most thorough test coverage.

const owner = "user-alice";
const sharedUser = "user-bob";
const stranger = "user-carol";

const doc = {
  ownerId: owner,
  sharedUserIds: [sharedUser],
};

describe("getAccessLevel", () => {
  it("returns 'owner' for the document owner", () => {
    expect(getAccessLevel(doc, owner)).toBe("owner");
  });

  it("returns 'shared' for a user the doc is shared with", () => {
    expect(getAccessLevel(doc, sharedUser)).toBe("shared");
  });

  it("returns 'none' for a user with no relationship to the doc", () => {
    expect(getAccessLevel(doc, stranger)).toBe("none");
  });

  it("returns 'none' when there is no current user", () => {
    expect(getAccessLevel(doc, null)).toBe("none");
    expect(getAccessLevel(doc, undefined)).toBe("none");
  });

  it("returns 'none' for a null/undefined document", () => {
    expect(getAccessLevel(null, owner)).toBe("none");
    expect(getAccessLevel(undefined, owner)).toBe("none");
  });

  it("handles a document with no shares array", () => {
    expect(getAccessLevel({ ownerId: owner }, owner)).toBe("owner");
    expect(getAccessLevel({ ownerId: owner }, sharedUser)).toBe("none");
  });
});

describe("canView / canEdit", () => {
  it("lets the owner view and edit", () => {
    expect(canView(doc, owner)).toBe(true);
    expect(canEdit(doc, owner)).toBe(true);
  });

  it("lets a shared user view and edit", () => {
    expect(canView(doc, sharedUser)).toBe(true);
    expect(canEdit(doc, sharedUser)).toBe(true);
  });

  it("denies a stranger", () => {
    expect(canView(doc, stranger)).toBe(false);
    expect(canEdit(doc, stranger)).toBe(false);
  });
});

describe("canDelete / canManageSharing (owner-only)", () => {
  it("allows the owner", () => {
    expect(canDelete(doc, owner)).toBe(true);
    expect(canManageSharing(doc, owner)).toBe(true);
  });

  it("forbids a shared collaborator", () => {
    expect(canDelete(doc, sharedUser)).toBe(false);
    expect(canManageSharing(doc, sharedUser)).toBe(false);
  });

  it("forbids a stranger", () => {
    expect(canDelete(doc, stranger)).toBe(false);
    expect(canManageSharing(doc, stranger)).toBe(false);
  });
});
