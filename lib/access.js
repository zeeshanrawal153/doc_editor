// Pure sharing/access-control logic — no DB, no I/O — so it is easy to unit
// test. A "doc" here is a plain object: { ownerId, sharedUserIds: string[] }.
//
// Access model:
//   - owner  : the user who created the document
//   - shared : a user the document has been explicitly shared with
//   - none   : everyone else
//
// Capability rules:
//   - view / edit content + title : owner OR shared
//   - delete / manage sharing     : owner ONLY

export function getAccessLevel(doc, userId) {
  if (!doc || !userId) return "none";
  if (doc.ownerId === userId) return "owner";
  if (Array.isArray(doc.sharedUserIds) && doc.sharedUserIds.includes(userId)) {
    return "shared";
  }
  return "none";
}

export function canView(doc, userId) {
  return getAccessLevel(doc, userId) !== "none";
}

export function canEdit(doc, userId) {
  // Both owner and shared collaborators can edit the document body/title.
  return getAccessLevel(doc, userId) !== "none";
}

export function canDelete(doc, userId) {
  return getAccessLevel(doc, userId) === "owner";
}

export function canManageSharing(doc, userId) {
  return getAccessLevel(doc, userId) === "owner";
}
