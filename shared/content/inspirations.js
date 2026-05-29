import {
  INSPIRATION_CARDS,
  SOURCE_DETAILS,
} from "../../features/crucible/crucible.sources-data.js";
import {
  SHARED_SOURCE_ANCHORS,
  getSourceAnchorId,
  normalizeSourceAnchorIds,
} from "./source-anchors.js";

const INSPIRATION_ARCHIVE_WORKFLOW_ID = "inspiration-archive";
const INSPIRATION_CONTENT_TYPE = "source-inspiration-card";
const INSPIRATION_TYPE = "Source Inspiration";

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function normalizeStringArray(value) {
  return asArray(value)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSharedSourceAnchor(sourceAnchorId) {
  return SHARED_SOURCE_ANCHORS.find((sourceAnchor) => sourceAnchor.id === sourceAnchorId) || null;
}

function getSourceDetails(anchorLabel) {
  return SOURCE_DETAILS[anchorLabel] || {};
}

export function inspirationCardToSharedInspiration(card) {
  const sourceAnchors = normalizeSourceAnchorIds(card.anchor);
  const sourceAnchorId = sourceAnchors[0] || slugify(card.anchor);
  const sharedSourceAnchor = getSharedSourceAnchor(sourceAnchorId);
  const details = getSourceDetails(card.anchor);
  const sourceTypes = normalizeStringArray(details.sourceType || sharedSourceAnchor?.sourceTypes);
  const themes = normalizeStringArray(details.themes || sharedSourceAnchor?.themes);
  const motifs = normalizeStringArray(details.motifs || sharedSourceAnchor?.motifs);
  const horror = normalizeStringArray(sharedSourceAnchor?.horror);
  const summary = card.caption || details.logic || sharedSourceAnchor?.summary || "";

  return {
    id: `inspiration-${sourceAnchorId}`,
    legacyId: card.anchor,
    title: card.anchor,
    label: card.anchor,
    type: INSPIRATION_TYPE,
    contentType: INSPIRATION_CONTENT_TYPE,
    status: sharedSourceAnchor?.status || "draft",
    workflows: [INSPIRATION_ARCHIVE_WORKFLOW_ID],
    sourceAnchors,
    sourceTypes,
    themes,
    motifs,
    contexts: normalizeStringArray(card.contexts),
    horror,
    summary,
    narrative: details.logic || summary,
    caption: card.caption || "",
    media: {
      icon: card.icon || "",
      imageKey: card.imageKey || "",
      imageNote: card.imageNote || "",
      imageProvider: card.imageProvider || "",
      imageUrl: card.imageUrl || "",
    },
    inspiration: {
      anchor: card.anchor,
      sourceType: details.sourceType || sharedSourceAnchor?.type || "",
      logic: details.logic || "",
      imageNote: card.imageNote || "",
    },
    tags: [
      ...sourceAnchors.map((id) => `source:${id}`),
      ...sourceTypes.map((sourceType) => `source-type:${slugify(sourceType)}`),
      ...themes.map((theme) => `theme:${slugify(theme)}`),
      ...motifs.map((motif) => `motif:${slugify(motif)}`),
    ],
  };
}

export function buildSharedInspirations(cards = INSPIRATION_CARDS) {
  return cards.map(inspirationCardToSharedInspiration);
}

export const SHARED_INSPIRATIONS = buildSharedInspirations();
