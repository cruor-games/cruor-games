import { createContentRegistry, defineContentRegistryData } from "./registry.js";

export const CONTENT_PACK_SCHEMA_VERSION = "cruor-content-pack-v0.1";
export const CONTENT_PACK_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
});

export const CONTENT_PACK_COLLECTIONS = Object.freeze([
  "workflows",
  "slots",
  "components",
  "sourceAnchors",
  "inspirations",
  "taxonomies",
]);

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function normalizeId(value) {
  return String(value || "").trim();
}

function normalizeStringArray(value) {
  return asArray(value)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function normalizeCollectionData(collections = {}) {
  return Object.fromEntries(
    CONTENT_PACK_COLLECTIONS.map((collectionName) => [
      collectionName,
      asArray(collections[collectionName]),
    ])
  );
}

function collectDuplicateIds(items = []) {
  const seen = new Set();
  const duplicates = new Set();

  items.forEach((item) => {
    const id = normalizeId(item?.id || item?.slug);
    if (!id) return;
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });

  return [...duplicates];
}

function pushIssue(issues, { severity = "error", path = "pack", message, id = "" }) {
  issues.push({ severity, path, id, message });
}

export function normalizeContentPack(pack = {}) {
  const collections = normalizeCollectionData(pack.collections || pack.data || pack);
  const id = normalizeId(pack.id || pack.slug);

  return Object.freeze({
    schemaVersion: pack.schemaVersion || CONTENT_PACK_SCHEMA_VERSION,
    id,
    title: pack.title || pack.label || id,
    summary: pack.summary || "",
    version: pack.version || "0.1.0",
    status: pack.status || CONTENT_PACK_STATUS.DRAFT,
    locale: pack.locale || "en",
    author: pack.author || "Cruor Games",
    license: pack.license || "internal-prototype",
    tags: normalizeStringArray(pack.tags),
    createdAt: pack.createdAt || "",
    updatedAt: pack.updatedAt || "",
    metadata: Object.freeze({ ...(pack.metadata || {}) }),
    collections: Object.freeze(collections),
  });
}

export function createContentPack(pack = {}) {
  return normalizeContentPack(pack);
}

export function contentPackToRegistryData(pack = {}) {
  const normalized = normalizeContentPack(pack);
  return defineContentRegistryData(normalized.collections);
}

export function createRegistryFromContentPack(pack = {}) {
  return createContentRegistry(contentPackToRegistryData(pack));
}

export function summarizeContentPack(pack = {}) {
  const normalized = normalizeContentPack(pack);
  return {
    schemaVersion: normalized.schemaVersion,
    id: normalized.id,
    title: normalized.title,
    version: normalized.version,
    status: normalized.status,
    locale: normalized.locale,
    collections: Object.fromEntries(
      CONTENT_PACK_COLLECTIONS.map((collectionName) => [
        collectionName,
        normalized.collections[collectionName]?.length || 0,
      ])
    ),
  };
}

export function validateContentPack(pack = {}, options = {}) {
  const normalized = normalizeContentPack(pack);
  const issues = [];
  const knownSourceAnchors = new Set(
    normalized.collections.sourceAnchors.map((entry) => normalizeId(entry?.id || entry?.slug))
  );
  const knownWorkflows = new Set(
    normalized.collections.workflows.map((entry) => normalizeId(entry?.id || entry?.slug))
  );
  const knownSlots = new Set(
    normalized.collections.slots.map((entry) => normalizeId(entry?.id || entry?.slug))
  );

  if (!normalized.id) {
    pushIssue(issues, { path: "id", message: "Content pack is missing an id." });
  }

  if (!normalized.title) {
    pushIssue(issues, { path: "title", message: "Content pack is missing a title." });
  }

  if (normalized.schemaVersion !== CONTENT_PACK_SCHEMA_VERSION) {
    pushIssue(issues, {
      severity: "warning",
      path: "schemaVersion",
      message: `Expected ${CONTENT_PACK_SCHEMA_VERSION}, received ${normalized.schemaVersion}.`,
    });
  }

  CONTENT_PACK_COLLECTIONS.forEach((collectionName) => {
    collectDuplicateIds(normalized.collections[collectionName]).forEach((id) => {
      pushIssue(issues, {
        path: `collections.${collectionName}`,
        id,
        message: `Duplicate id in ${collectionName}: ${id}`,
      });
    });
  });

  normalized.collections.components.forEach((component) => {
    const id = normalizeId(component?.id || component?.slug);
    normalizeStringArray(component?.sourceAnchors).forEach((sourceAnchorId) => {
      if (!knownSourceAnchors.has(sourceAnchorId)) {
        pushIssue(issues, {
          severity: options.strict ? "error" : "warning",
          path: "collections.components.sourceAnchors",
          id,
          message: `Component references unknown Source Anchor: ${sourceAnchorId}`,
        });
      }
    });
    normalizeStringArray(component?.workflows).forEach((workflowId) => {
      if (!knownWorkflows.has(workflowId)) {
        pushIssue(issues, {
          severity: options.strict ? "error" : "warning",
          path: "collections.components.workflows",
          id,
          message: `Component references unknown workflow: ${workflowId}`,
        });
      }
    });
    normalizeStringArray(component?.slots).forEach((slotId) => {
      if (!knownSlots.has(slotId)) {
        pushIssue(issues, {
          severity: options.strict ? "error" : "warning",
          path: "collections.components.slots",
          id,
          message: `Component references unknown slot: ${slotId}`,
        });
      }
    });
  });

  normalized.collections.inspirations.forEach((inspiration) => {
    const id = normalizeId(inspiration?.id || inspiration?.slug);
    normalizeStringArray(inspiration?.sourceAnchors).forEach((sourceAnchorId) => {
      if (!knownSourceAnchors.has(sourceAnchorId)) {
        pushIssue(issues, {
          severity: options.strict ? "error" : "warning",
          path: "collections.inspirations.sourceAnchors",
          id,
          message: `Inspiration references unknown Source Anchor: ${sourceAnchorId}`,
        });
      }
    });
  });

  return issues;
}

export function mergeContentPacks(packs = [], metadata = {}) {
  const normalizedPacks = asArray(packs).map(normalizeContentPack);
  const mergedCollections = Object.fromEntries(
    CONTENT_PACK_COLLECTIONS.map((collectionName) => [collectionName, []])
  );
  const seen = Object.fromEntries(
    CONTENT_PACK_COLLECTIONS.map((collectionName) => [collectionName, new Set()])
  );

  normalizedPacks.forEach((pack) => {
    CONTENT_PACK_COLLECTIONS.forEach((collectionName) => {
      pack.collections[collectionName].forEach((entry) => {
        const id = normalizeId(entry?.id || entry?.slug);
        if (id && seen[collectionName].has(id)) return;
        if (id) seen[collectionName].add(id);
        mergedCollections[collectionName].push(entry);
      });
    });
  });

  return createContentPack({
    id: metadata.id || "merged-content-pack",
    title: metadata.title || "Merged Content Pack",
    summary: metadata.summary || "Merged Cruor content pack.",
    version: metadata.version || "0.1.0",
    status: metadata.status || CONTENT_PACK_STATUS.DRAFT,
    locale: metadata.locale || "en",
    author: metadata.author || "Cruor Games",
    license: metadata.license || "internal-prototype",
    tags: metadata.tags || [],
    metadata: {
      ...(metadata.metadata || {}),
      sourcePackIds: normalizedPacks.map((pack) => pack.id).filter(Boolean),
    },
    collections: mergedCollections,
  });
}
