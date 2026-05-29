import { createContentRegistry, defineContentRegistryData } from "./registry.js";

export const STATIC_CONTENT_REGISTRY_DATA = defineContentRegistryData({
  workflows: [],
  slots: [],
  components: [],
  sourceAnchors: [],
  inspirations: [],
  taxonomies: [],
});

export const STATIC_CONTENT_REGISTRY = createContentRegistry(STATIC_CONTENT_REGISTRY_DATA);
