import { createContentRegistry, defineContentRegistryData } from "./registry.js";
import { SHARED_INSPIRATIONS } from "./inspirations.js";
import { SHARED_MONSTER_COMPONENTS } from "./monster-components.js";
import { SHARED_SOURCE_ANCHORS } from "./source-anchors.js";
import { SHARED_TAXONOMIES } from "./taxonomies.js";
import { SHARED_MONSTER_SLOTS, SHARED_WORKFLOWS } from "./workflows.js";

export const STATIC_CONTENT_REGISTRY_DATA = defineContentRegistryData({
  workflows: SHARED_WORKFLOWS,
  slots: SHARED_MONSTER_SLOTS,
  components: SHARED_MONSTER_COMPONENTS,
  sourceAnchors: SHARED_SOURCE_ANCHORS,
  inspirations: SHARED_INSPIRATIONS,
  taxonomies: SHARED_TAXONOMIES,
});

export const STATIC_CONTENT_REGISTRY = createContentRegistry(STATIC_CONTENT_REGISTRY_DATA);
