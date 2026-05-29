import {
  CONTENT_PACK_STATUS,
  contentPackToRegistryData,
  createRegistryFromContentPack,
  mergeContentPacks,
  summarizeContentPack,
  validateContentPack,
} from "./content-pack-schema.js";
import { CORE_CRUOR_CONTENT_PACK } from "./content-packs/core-cruor-pack.js";
import { EXISTING_INSPIRATIONS_CONTENT_PACK } from "./content-packs/existing-inspirations-pack.js";

export const STATIC_CONTENT_PACKS = Object.freeze([
  CORE_CRUOR_CONTENT_PACK,
  EXISTING_INSPIRATIONS_CONTENT_PACK,
]);

export const STATIC_CONTENT_PACK = mergeContentPacks(STATIC_CONTENT_PACKS, {
  id: "static-cruor-registry",
  title: "Static Cruor Registry",
  summary: "Merged static Cruor registry assembled from bundled content packs.",
  version: "0.1.0",
  status: CONTENT_PACK_STATUS.PUBLISHED,
  locale: "en",
  author: "Cruor Games",
  license: "internal-prototype",
  tags: ["static", "registry", "merged"],
  metadata: {
    bundled: true,
    registryRole: "static-registry",
  },
});

export const STATIC_CONTENT_PACK_SUMMARY = summarizeContentPack(STATIC_CONTENT_PACK);
export const STATIC_CONTENT_PACK_ISSUES = [
  ...STATIC_CONTENT_PACKS.flatMap((pack) =>
    validateContentPack(pack).map((issue) => ({ ...issue, packId: pack.id }))
  ),
  ...validateContentPack(STATIC_CONTENT_PACK).map((issue) => ({
    ...issue,
    packId: STATIC_CONTENT_PACK.id,
  })),
];

export const STATIC_CONTENT_REGISTRY_DATA = contentPackToRegistryData(STATIC_CONTENT_PACK);
export const STATIC_CONTENT_REGISTRY = createRegistryFromContentPack(STATIC_CONTENT_PACK);
