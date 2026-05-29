import { CONTENT_PACK_STATUS, createContentPack } from "../content-pack-schema.js";
import { SHARED_MONSTER_SLOTS, SHARED_WORKFLOWS } from "../workflows.js";

export const EXAMPLE_CONTENT_PACK_ID = "example-content-pack";

const PACK_WORKFLOWS = SHARED_WORKFLOWS.filter((workflow) =>
  ["inspiration-archive", "monster-composer"].includes(workflow.id)
);

const PACK_SLOTS = SHARED_MONSTER_SLOTS;

export const EXAMPLE_SOURCE_ANCHORS = [
  {
    id: "example-source-anchor",
    label: "Example Source Anchor",
    type: "Design Source",
    status: "draft",
    workflows: ["monster-composer", "inspiration-archive"],
    sourceTypes: ["Example Source Type"],
    themes: ["example theme"],
    motifs: ["example motif"],
    horror: ["Example Horror"],
    summary:
      "Describe the repeatable horror logic this source provides. This should be useful even before a component is selected.",
  },
];

export const EXAMPLE_INSPIRATIONS = [
  {
    id: "inspiration-example-source-anchor",
    title: "Example Inspiration",
    label: "Example Inspiration",
    type: "Source Inspiration",
    contentType: "source-inspiration-card",
    status: "draft",
    workflows: ["inspiration-archive"],
    sourceAnchors: ["example-source-anchor"],
    sourceTypes: ["Example Source Type"],
    themes: ["example theme"],
    motifs: ["example motif"],
    horror: ["Example Horror"],
    summary: "Short archive summary for the card grid.",
    narrative: "Explain how a GM should think about this source at the table.",
    caption: "Short visual/card caption.",
    media: {
      icon: "fa-book-open",
      imageKey: "",
      imageNote: "Example inspiration fallback icon.",
      imageProvider: "icon",
      imageUrl: "",
    },
    inspiration: {
      anchor: "Example Source Anchor",
      sourceType: "Design Source",
      logic:
        "Explain how this source becomes playable Cruor content: pressure, scene logic, monster behavior, or counterplay.",
      imageNote: "Example inspiration fallback icon.",
    },
    tags: ["pack:example-content-pack", "source:example-source-anchor"],
  },
];

export const EXAMPLE_MONSTER_COMPONENTS = [
  {
    id: "example-monster-component",
    title: "Example Monster Component",
    label: "Example Monster Component",
    type: "Monster Component",
    contentType: "monster-graft",
    status: "draft",
    workflows: ["monster-composer"],
    slots: ["weakness"],
    sourceAnchors: ["example-source-anchor"],
    sourceTypes: ["Example Source Type"],
    themes: ["example theme"],
    motifs: ["example motif"],
    horror: ["Example Horror"],
    summary: "Short component summary shown in cards.",
    tableText:
      "Write concise rules text. Use this when adapting the component into a stat block or run sheet.",
    mechanics:
      "Write actionable mechanics. Avoid pure flavor here unless the component is intentionally narrative-only.",
    counterplay: "Explain how players can identify, reduce, resist, interrupt, or exploit this component.",
    monster: {
      graftId: "example-monster-component",
      slot: "weakness",
      section: "trait",
      typeBias: ["undead", "fiend", "aberration"],
      roleBias: ["standard", "boss"],
      cost: -2,
      complexity: 1,
      stats: { fairness: 2 },
    },
    tags: ["pack:example-content-pack", "slot:weakness", "source:example-source-anchor"],
  },
];

export const EXAMPLE_CONTENT_PACK = createContentPack({
  id: EXAMPLE_CONTENT_PACK_ID,
  title: "Example Content Pack",
  summary:
    "Replace this with a concise explanation of what this pack adds to Inspirations and Monster Composer.",
  version: "0.1.0",
  status: CONTENT_PACK_STATUS.DRAFT,
  locale: "en",
  author: "Cruor Games",
  license: "internal-prototype",
  tags: ["example", "content-pack"],
  updatedAt: "YYYY-MM-DD",
  metadata: {
    bundled: true,
    registryRole: "thematic-content-pack",
    source: "replace-with-source-description",
    safetyNote: "Add a safety note when the pack touches sensitive material.",
  },
  collections: {
    workflows: PACK_WORKFLOWS,
    slots: PACK_SLOTS,
    components: EXAMPLE_MONSTER_COMPONENTS,
    sourceAnchors: EXAMPLE_SOURCE_ANCHORS,
    inspirations: EXAMPLE_INSPIRATIONS,
    taxonomies: [],
  },
});
