import { CONTENT_PACK_COLLECTIONS } from "./content-pack-schema.js";

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function normalizeId(value) {
  return String(value || "").trim();
}

export function getContentEntryId(entryOrId) {
  if (typeof entryOrId === "string") return normalizeId(entryOrId);
  return normalizeId(entryOrId?.id || entryOrId?.slug || entryOrId?.legacyId);
}

function createEmptyCollectionIndex() {
  return Object.fromEntries(CONTENT_PACK_COLLECTIONS.map((collectionName) => [collectionName, new Map()]));
}

function buildCollectionIndex(contentPacks = []) {
  const index = createEmptyCollectionIndex();

  asArray(contentPacks).forEach((pack) => {
    const packId = normalizeId(pack?.id);
    if (!packId) return;

    CONTENT_PACK_COLLECTIONS.forEach((collectionName) => {
      asArray(pack?.collections?.[collectionName]).forEach((entry) => {
        const entryId = getContentEntryId(entry);
        if (!entryId) return;

        const existingPackIds = index[collectionName].get(entryId) || [];
        if (!existingPackIds.includes(packId)) {
          index[collectionName].set(entryId, [...existingPackIds, packId]);
        }
      });
    });
  });

  return index;
}

function summarizeProvenance(contentPacks, entryPackIdsByCollection) {
  return {
    packs: contentPacks.length,
    collections: Object.fromEntries(
      CONTENT_PACK_COLLECTIONS.map((collectionName) => [
        collectionName,
        entryPackIdsByCollection[collectionName]?.size || 0,
      ])
    ),
  };
}

export function buildContentPackProvenance(contentPacks = []) {
  const packs = asArray(contentPacks);
  const packById = new Map(packs.map((pack) => [pack.id, pack]).filter(([id]) => Boolean(id)));
  const entryPackIdsByCollection = buildCollectionIndex(packs);

  function getPack(packId) {
    return packById.get(packId) || null;
  }

  function getPackIdsForEntry(collectionName, entryOrId) {
    const entryId = getContentEntryId(entryOrId);
    if (!entryId) return [];
    return [...(entryPackIdsByCollection[collectionName]?.get(entryId) || [])];
  }

  function getPacksForEntry(collectionName, entryOrId) {
    return getPackIdsForEntry(collectionName, entryOrId)
      .map((packId) => packById.get(packId))
      .filter(Boolean);
  }

  function getPrimaryPackForEntry(collectionName, entryOrId) {
    const entryPacks = getPacksForEntry(collectionName, entryOrId);
    return entryPacks[entryPacks.length - 1] || null;
  }

  function getPackLabelForEntry(collectionName, entryOrId, fallback = "Static Registry") {
    return getPrimaryPackForEntry(collectionName, entryOrId)?.title || fallback;
  }

  return Object.freeze({
    packs,
    packById,
    entryPackIdsByCollection,
    getPack,
    getPackIdsForEntry,
    getPacksForEntry,
    getPrimaryPackForEntry,
    getPackLabelForEntry,
    summarize: () => summarizeProvenance(packs, entryPackIdsByCollection),
  });
}
