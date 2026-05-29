import {
  contentPackToRegistryData,
  createRegistryFromContentPack,
  summarizeContentPack,
  validateContentPack,
} from "./content-pack-schema.js";
import { CORE_CRUOR_CONTENT_PACK } from "./content-packs/core-cruor-pack.js";

export const STATIC_CONTENT_PACK = CORE_CRUOR_CONTENT_PACK;
export const STATIC_CONTENT_PACK_SUMMARY = summarizeContentPack(STATIC_CONTENT_PACK);
export const STATIC_CONTENT_PACK_ISSUES = validateContentPack(STATIC_CONTENT_PACK);

export const STATIC_CONTENT_REGISTRY_DATA = contentPackToRegistryData(STATIC_CONTENT_PACK);
export const STATIC_CONTENT_REGISTRY = createRegistryFromContentPack(STATIC_CONTENT_PACK);
