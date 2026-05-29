import { BASE_SILHOUETTE_ANCHORS, MONSTER_SILHOUETTES } from "../data/monster-silhouettes.js";

export function getSilhouetteId(typeId, category, activePreset = null) {
  if (activePreset?.silhouetteId) return activePreset.silhouetteId;

  const normalizedCategory = String(category || "").toLowerCase();
  if (normalizedCategory.includes("spider")) return "spider";
  if (normalizedCategory.includes("skeleton") || normalizedCategory.includes("bone")) return "skeleton";

  return typeId;
}

export function getSilhouetteProfile(typeId, category, activePreset = null) {
  const silhouetteId = getSilhouetteId(typeId, category, activePreset);
  return MONSTER_SILHOUETTES[silhouetteId] || MONSTER_SILHOUETTES[typeId] || MONSTER_SILHOUETTES.undead;
}

export function getSilhouetteAnchor(profile, slotId) {
  return profile?.anchors?.[slotId] || BASE_SILHOUETTE_ANCHORS[slotId] || { x: 0.5, y: 0.5 };
}
