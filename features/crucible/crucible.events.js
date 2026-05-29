import {
  WORKFLOWS,
  SLOT_DESCRIPTIONS,
  SENSORY_KINDS,
} from "./crucible.workflows.js";
import {
  HORROR_TYPES,
  INTRUSION_LEVELS,
  INTRUSION_LABELS,
  HORROR_DESCRIPTIONS,
  CONTEXT_DESCRIPTIONS,
} from "./crucible.brief-options.js";
import {
  SOURCE_ANCHORS,
  SOURCE_TYPES,
  THEMES,
  SOURCE_DETAILS,
  INSPIRATION_CARDS,
} from "./crucible.sources-data.js";
import { COMPONENTS } from "./crucible.components-data.js";
import { LOCATION_REGION_TEMPLATES } from "./crucible.location-regions.js";
import { createInitialCrucibleState } from "./crucible.state.js";
import {
  CRUOR_COMPOSER_NAVIGATOR_WIDTH_KEY,
  CRUOR_COMPOSER_SAVES_KEY,
} from "./crucible.storage.js";

export function startCrucibleDomApp(rootElement = document, options = {}) {
  const onOpenMapGenerator =
    typeof options.onOpenMapGenerator === "function"
      ? options.onOpenMapGenerator
      : null;
  const onSnapshotProviderReady =
    typeof options.onSnapshotProviderReady === "function"
      ? options.onSnapshotProviderReady
      : null;
  const trackedGlobalListeners = [];
  const originalDocumentAddEventListener = document.addEventListener;
  const originalWindowAddEventListener = window.addEventListener;

  document.addEventListener = function crucibleTrackedDocumentListener(
    type,
    listener,
    options,
  ) {
    trackedGlobalListeners.push([document, type, listener, options]);
    return originalDocumentAddEventListener.call(this, type, listener, options);
  };
  window.addEventListener = function crucibleTrackedWindowListener(
    type,
    listener,
    options,
  ) {
    trackedGlobalListeners.push([window, type, listener, options]);
    return originalWindowAddEventListener.call(this, type, listener, options);
  };

  const state = createInitialCrucibleState();

  const els = {
    needValue: document.getElementById("needValue"),
    workflowButtons: document.getElementById("workflowButtons"),
    briefSummaryText: document.getElementById("briefSummaryText"),
    editBriefBtn: document.getElementById("editBriefBtn"),
    clearBriefBtn: document.getElementById("clearBriefBtn"),
    briefWizardModal: document.getElementById("briefWizardModal"),
    briefWizardClose: document.getElementById("briefWizardClose"),
    briefWizardProgress: document.getElementById("briefWizardProgress"),
    briefWizardBody: document.getElementById("briefWizardBody"),
    briefWizardTitle: document.getElementById("briefWizardTitle"),
    briefWizardSubtitle: document.getElementById("briefWizardSubtitle"),
    briefWizardBack: document.getElementById("briefWizardBack"),
    briefWizardNext: document.getElementById("briefWizardNext"),
    briefWizardFill: document.getElementById("briefWizardFill"),
    briefWizardApply: document.getElementById("briefWizardApply"),
    contextComboBtn: document.getElementById("contextComboBtn"),
    contextComboValue: document.getElementById("contextComboValue"),
    contextComboPanel: document.getElementById("contextComboPanel"),
    contextComboSearch: document.getElementById("contextComboSearch"),
    contextComboList: document.getElementById("contextComboList"),
    horrorComboBtn: document.getElementById("horrorComboBtn"),
    horrorComboValue: document.getElementById("horrorComboValue"),
    horrorComboPanel: document.getElementById("horrorComboPanel"),
    horrorComboSearch: document.getElementById("horrorComboSearch"),
    horrorComboList: document.getElementById("horrorComboList"),
    sourcePickerBtn: document.getElementById("sourcePickerBtn"),
    sourcePickerSummary: document.getElementById("sourcePickerSummary"),
    sourcePickerModal: document.getElementById("sourcePickerModal"),
    sourcePickerClose: document.getElementById("sourcePickerClose"),
    sourcePickerDone: document.getElementById("sourcePickerDone"),
    sourcePickerClear: document.getElementById("sourcePickerClear"),
    sourcePickerSearchInput: document.getElementById("sourcePickerSearch"),
    sourceTypeFilterBtn: document.getElementById("sourceTypeFilterBtn"),
    sourceTypeFilterValue: document.getElementById("sourceTypeFilterValue"),
    sourceTypeFilterPanel: document.getElementById("sourceTypeFilterPanel"),
    sourceTypeFilterSearch: document.getElementById("sourceTypeFilterSearch"),
    sourceTypeFilterList: document.getElementById("sourceTypeFilterList"),
    sourceThemeFilterBtn: document.getElementById("sourceThemeFilterBtn"),
    sourceThemeFilterValue: document.getElementById("sourceThemeFilterValue"),
    sourceThemeFilterPanel: document.getElementById("sourceThemeFilterPanel"),
    sourceThemeFilterSearch: document.getElementById("sourceThemeFilterSearch"),
    sourceThemeFilterList: document.getElementById("sourceThemeFilterList"),
    sourceSelectedChips: document.getElementById("sourceSelectedChips"),
    sourcePickerGrid: document.getElementById("sourcePickerGrid"),
    intrusionSegments: document.getElementById("intrusionSegments"),
    readModeToggle: document.getElementById("readModeToggle"),
    readModeSwitch: document.getElementById("readModeSwitch"),
    quickBuildBtn: document.getElementById("quickBuildBtn"),
    randomBuildBtn: document.getElementById("randomBuildBtn"),
    savedBuildsBtn: document.getElementById("savedBuildsBtn"),
    savedBuildsModal: document.getElementById("savedBuildsModal"),
    savedBuildsClose: document.getElementById("savedBuildsClose"),
    clearBuildBtn: document.getElementById("clearBuildBtn"),
    buildTitleInput: document.getElementById("buildTitleInput"),
    buildCanvas: document.querySelector(".panel.build-canvas"),
    buildSlots: document.getElementById("buildSlots"),
    regionsPanel: document.getElementById("regionsPanel"),
    workbench: document.querySelector(".workbench"),
    workbenchResizer: document.getElementById("workbenchResizer"),
    navigatorTitle: document.getElementById("navigatorTitle"),
    navigatorMeta: document.getElementById("navigatorMeta"),
    navigatorCount: document.getElementById("navigatorCount"),
    tagFilterRow: document.getElementById("tagFilterRow"),
    tagFilterBtn: document.getElementById("tagFilterBtn"),
    searchInput: document.getElementById("searchInput"),
    componentGrid: document.getElementById("componentGrid"),
    composeView: document.getElementById("composeView"),
    compiledView: document.getElementById("compiledView"),
    exportView: document.getElementById("exportView"),
    compiledOutput: document.getElementById("compiledOutput"),
    compileBtn: document.getElementById("compileBtn"),
    exportBtn: document.getElementById("exportBtn"),
    copyBtn: document.getElementById("copyBtn"),
    saveBtn: document.getElementById("saveBtn"),
    copyTopBtn: document.getElementById("copyTopBtn"),
    saveTopBtn: document.getElementById("saveTopBtn"),
    openMapGeneratorBtn: document.getElementById("openMapGeneratorBtn"),
    status: document.getElementById("status"),
    savedList: document.getElementById("savedList"),
    inspirationsGrid: document.getElementById("inspirationsGrid"),
    inspirationDetailModal: document.getElementById("inspirationDetailModal"),
    inspirationDetailClose: document.getElementById("inspirationDetailClose"),
    inspirationDetailTitle: document.getElementById("inspirationDetailTitle"),
    inspirationDetailType: document.getElementById("inspirationDetailType"),
    inspirationDetailBody: document.getElementById("inspirationDetailBody"),
    contextMenu: document.getElementById("contextMenu"),
    tabs: Array.from(document.querySelectorAll("[data-view]")),
  };

  function init() {
    if (window.__CRUCIBLE_RUN_RUNTIME_TESTS__) runRuntimeTests();
    populateSelects();
    resetBuildForWorkflow();
    setDefaultTitle();
    attachEvents();
    renderAll();
  }

  function runRuntimeTests() {
    const publicAnchors = SOURCE_ANCHORS.filter(
      (anchor) => anchor !== "Any Source",
    );
    console.assert(
      publicAnchors.every((anchor) => SOURCE_DETAILS[anchor]),
      "Every Source Anchor must define SOURCE_DETAILS.",
    );
    console.assert(
      publicAnchors.every((anchor) =>
        INSPIRATION_CARDS.some((card) => card.anchor === anchor),
      ),
      "Every Source Anchor must have an Inspiration card.",
    );
    console.assert(
      SOURCE_DETAILS.Jikininki,
      "SOURCE_DETAILS must define Jikininki.",
    );
    console.assert(
      SOURCE_DETAILS.Gashadokuro,
      "SOURCE_DETAILS must define Gashadokuro.",
    );
    console.assert(
      SOURCE_DETAILS["Sedlec Ossuary"],
      "SOURCE_DETAILS must define Sedlec Ossuary.",
    );
    console.assert(
      SOURCE_DETAILS["Towers of Silence"],
      "SOURCE_DETAILS must define Towers of Silence.",
    );
    console.assert(
      SOURCE_DETAILS["Anthropodermic Bibliopegy"],
      "SOURCE_DETAILS must define Anthropodermic Bibliopegy.",
    );
    console.assert(
      SOURCE_DETAILS.Decomposition,
      "SOURCE_DETAILS must define Decomposition.",
    );
    console.assert(
      !String(document.documentElement.innerHTML).includes("{$1}"),
      "Template placeholder {$1} must not exist in the document.",
    );
    console.assert(
      !String(document.documentElement.innerHTML).includes("$1backdrop-filter"),
      "CSS regex backreference fragments must never be written into the stylesheet.",
    );
    console.assert(
      COMPONENTS.every((component) => Array.isArray(component.sourceAnchors)),
      "Every component must have sourceAnchors array.",
    );
    console.assert(
      COMPONENTS.every((component) => Array.isArray(component.sourceTypes)),
      "Every component must have sourceTypes array.",
    );
    console.assert(
      COMPONENTS.every((component) => Array.isArray(component.themes)),
      "Every component must have themes array.",
    );
    console.assert(
      COMPONENTS.every((component) =>
        component.sourceAnchors.every((anchor) => SOURCE_DETAILS[anchor]),
      ),
      "Every component Source Anchor must exist in SOURCE_DETAILS.",
    );
    console.assert(
      publicAnchors.every((anchor) =>
        COMPONENTS.some((component) =>
          component.sourceAnchors.includes(anchor),
        ),
      ),
      "Every public Source Anchor should have at least one linked component in the MVP seed data.",
    );
    console.assert(
      Object.values(WORKFLOWS).every((workflow) => workflow.description),
      "Every workflow must provide a short description.",
    );
    console.assert(
      els.workflowButtons && !document.querySelector("#needSelect"),
      "Workflow selection must use icon toggle buttons, not a select dropdown.",
    );
    console.assert(
      !document.querySelector('[data-view="compose"]') &&
        !document.querySelector('[data-view="table"]'),
      "Compose and Table View buttons must not be rendered.",
    );
    console.assert(
      els.exportBtn,
      "Export action must live with Compile, Copy, and Save.",
    );
    console.assert(
      els.compiledView,
      "Compile must render a formatted preview section.",
    );
    console.assert(
      !document.getElementById("workflowDescription"),
      "Workflow description must not be rendered.",
    );
    console.assert(
      !document.querySelector(".brief-head .eyebrow"),
      "Build Brief eyebrow must not be rendered.",
    );
    console.assert(
      !document.documentElement.innerHTML.includes(".brief-panel") &&
        !document.documentElement.innerHTML.includes(".pipeline-field") &&
        !document.documentElement.innerHTML.includes(".brief-combobox"),
      "Legacy Brief Panel, pipeline, and combobox CSS must be removed after the Wizard migration.",
    );
    console.assert(
      els.tagFilterBtn && els.tagFilterRow,
      "Tag filters must be controlled by a compact contextual menu.",
    );
    console.assert(
      !renderEmptySlot({ id: "test", label: "Test Slot" }).includes("<button"),
      "Empty slots must not render a redundant add button.",
    );
    console.assert(
      typeof renderCompiledPreview === "function",
      "Compiled preview must use the custom editorial renderer.",
    );
    console.assert(
      state.tags instanceof Set,
      "Tag filters must support multi-select state.",
    );
    console.assert(
      state.sourceAnchors instanceof Set,
      "Source Anchor filters must support multi-select state.",
    );
    console.assert(
      els.briefWizardModal && els.sourcePickerModal,
      "Draw from must use the Brief Wizard / Inspiration Picker flow, not a static select.",
    );
    console.assert(
      !document.querySelector("#sourceSelect"),
      "Legacy Draw from select must not be rendered.",
    );
    console.assert(
      !document.querySelector("#sourceTypeFilter") &&
        !document.querySelector("#sourceThemeFilter"),
      "Source Type and Theme filters must use searchable combobox controls, not native selects.",
    );
    console.assert(
      SOURCE_TYPES.slice(1).every(
        (value, index, array) =>
          index === 0 || array[index - 1].localeCompare(value) <= 0,
      ),
      "Source Types must be sorted alphabetically after Any Type.",
    );
    console.assert(
      THEMES.every(
        (value, index, array) =>
          index === 0 || array[index - 1].localeCompare(value) <= 0,
      ),
      "Themes must be sorted alphabetically.",
    );
    console.assert(
      displayTitle("The Cave Has Been Breathing") ===
        "The cave has been breathing",
      "displayTitle must produce readable sentence-style UI titles.",
    );
    console.assert(
      typeof refreshNavigatorSelectionState === "function",
      "Navigator card selection must update without rerendering the whole list.",
    );
    console.assert(
      state.activeSlot === "horrorPremise",
      "Default active location slot must be Premise.",
    );
    console.assert(
      WORKFLOWS.location.slots.some((slot) => slot.label === "Outcome"),
      "Location workflow must use Outcome as the final slot label.",
    );
    console.assert(
      !WORKFLOWS.location.slots.some((slot) =>
        /Reward or Consequence|Disturbing Clue/.test(slot.label),
      ),
      "Location workflow must not expose outdated verbose slot labels.",
    );
    console.assert(
      renderEmptySlot({ id: "horrorPremise", label: "Premise" }).includes(
        "Choose the core horror idea",
      ),
      "Empty slot copy must explain the practical slot function.",
    );
    console.assert(
      typeof getMatchReasons === "function",
      "Navigator cards must explain why components match current filters.",
    );
    console.assert(
      typeof openInspirationDetail === "function",
      "Inspiration cards must support a public detail view.",
    );
    console.assert(
      COMPONENTS.filter(
        (component) =>
          component.sourceAnchors.includes("Decomposition") &&
          component.workflows.includes("location"),
      ).length >= 9,
      "Decomposition should have a complete Location source pack in the MVP seed data.",
    );
    [
      "Decomposition",
      "Sedlec Ossuary",
      "Towers of Silence",
      "The Mist",
      "Jikininki",
      "Gashadokuro",
    ].forEach((anchor) => {
      const pack = COMPONENTS.filter(
        (component) =>
          component.sourceAnchors.includes(anchor) &&
          component.workflows.includes("location"),
      );
      const hasSlot = (slotId) =>
        pack.some((component) => component.slots.includes(slotId));
      console.assert(
        pack.length >= 9,
        `${anchor} Location source pack should include at least 9 components.`,
      );
      console.assert(
        hasSlot("horrorPremise"),
        `${anchor} pack must include a Premise.`,
      );
      console.assert(
        hasSlot("sensoryLayer"),
        `${anchor} pack must include Sensory Layer components.`,
      );
      console.assert(
        ["Sound", "Smell", "Touch"].every((kind) =>
          pack.some(
            (component) =>
              component.slots.includes("sensoryLayer") &&
              component.sensoryKind === kind,
          ),
        ),
        `${anchor} pack must include Sound, Smell, and Touch.`,
      );
      console.assert(
        hasSlot("visibleAnomaly"),
        `${anchor} pack must include Visible Anomaly.`,
      );
      console.assert(hasSlot("hazard"), `${anchor} pack must include Hazard.`);
      console.assert(hasSlot("clue"), `${anchor} pack must include Clue.`);
      console.assert(
        hasSlot("encounterTwist"),
        `${anchor} pack must include Encounter Twist.`,
      );
      console.assert(hasSlot("reward"), `${anchor} pack must include Outcome.`);
    });
    console.assert(
      HORROR_TYPES.includes("War Horror"),
      "HORROR_TYPES must include War Horror because seed data uses it.",
    );
    console.assert(
      COMPONENTS.filter((component) =>
        component.slots.includes("sensoryLayer"),
      ).every((component) => SENSORY_KINDS.includes(component.sensoryKind)),
      "Every Sensory Layer component must define a valid sensoryKind.",
    );
    console.assert(
      typeof pickUniqueForSlot === "function",
      "Slot regeneration must avoid duplicate Sensory Layer kinds.",
    );
    console.assert(
      typeof showLinkedComponent === "function",
      "Inspiration linked components must navigate to a visible component state.",
    );
    console.assert(
      !document.querySelector("#contextSelect") &&
        !document.querySelector("#horrorSelect") &&
        !document.querySelector("#intrusionSelect"),
      "Brief controls must use custom controls, not native browser selects.",
    );
    console.assert(
      els.briefSummaryText && els.editBriefBtn && els.briefWizardModal,
      "Brief must render as a compact summary with a guided wizard.",
    );
    console.assert(
      !document.querySelector(".brief-panel"),
      "The persistent Brief Panel must not be rendered in the main layout.",
    );
    console.assert(
      !document.documentElement.innerHTML.includes(
        ".sensory-subslot:not(.filled)::before",
      ),
      "Empty border animation must not be applied to sensory subslots.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".build-slot.needs-attention:not(.active)::before",
      ),
      "Empty border animation must skip the active slot and target only attention-needed main slots.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("inset: 1px;"),
      "Empty border animation must expose only a 1px animated border.",
    );
    console.assert(
      typeof updateActiveSlotUi === "function",
      "Selecting a slot must update active classes without rerendering all slots, so empty-slot animations do not reset.",
    );
    console.assert(
      typeof clearActiveSlot === "function" &&
        typeof handleBuildCanvasEmptyClick === "function" &&
        document.documentElement.innerHTML.includes(
          "els.buildCanvas.addEventListener",
        ),
      "Clicking empty space inside the build canvas must deselect the active slot without reacting to clicks outside the canvas.",
    );
    console.assert(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--glass-satin-strong")
        .includes("29, 23, 25"),
      "Main containers must use a darker satin surface than v0.62 while still letting dark slots read as inset wells.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("has-items") &&
        document.documentElement.innerHTML.includes("complete"),
      "Slot rendering must distinguish has-items from complete so incomplete multi-slots keep the incomplete background.",
    );
    console.assert(
      !renderSlotItem(
        "sensoryLayer",
        {
          id: "test-sound",
          title: "Test Sound",
          summary: "Test summary.",
          sensoryKind: "Sound",
        },
        1,
        { hideSensoryKind: true },
      ).includes("slot-item-kind"),
      "Sensory subslots must not repeat the Sound/Smell/Touch pill inside the selected component title.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".build-slot.active .slot-icon",
      ) && document.documentElement.innerHTML.includes("color: #d0a2aa"),
      "Active slot icons must use the same bright color as active slot titles.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".sensory-subslot.active .sensory-subslot__label i",
      ),
      "Active sensory subslot labels and icons must use the brighter active color.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        "animation: emptySlotBorderOrbit 8.3s linear infinite",
      ),
      "Empty slot border animation must be slowed by 100%.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("opacity: .62"),
      "Empty slot border animation opacity must be reduced by about one quarter.",
    );
    console.assert(
      !document.documentElement.innerHTML.includes(".brief-wizard-guide") &&
        typeof applyBriefWizard === "function" &&
        typeof fillCrucibleFromWizard === "function",
      "Brief Wizard must rely on the subtitle for guidance and expose Apply Brief plus Fill the Crucible actions.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".brief-wizard__body.is-fading",
      ) && typeof transitionBriefWizardTo === "function",
      "Brief Wizard step changes must fade out and fade in instead of changing abruptly.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(".navigator-head h2") &&
        document.documentElement.innerHTML.includes(".search-wrap::before"),
      "Navigator title and search bar must keep styled custom UI after removing legacy Brief Panel CSS.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".brief-choice-card.selected",
      ) &&
        document.documentElement.innerHTML.includes(".brief-choice-icon i") &&
        document.documentElement.innerHTML.includes("font-size: 72px") &&
        document.documentElement.innerHTML.includes("right: 14px;") &&
        document.documentElement.innerHTML.includes("z-index: 0;"),
      "Wizard choice cards must use Crucible-style selected states and right-aligned background watermark icons that do not move the text.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".brief-wizard-source-card",
      ) &&
        document.documentElement.innerHTML.includes("opacity: .75") &&
        document.documentElement.innerHTML.includes("font-size: 12px") &&
        document.documentElement.innerHTML.includes("font-weight: 650") &&
        document.documentElement.innerHTML.includes("filter: none"),
      "Wizard inspiration cards must match the Component Navigator visual language, dim unselected cards, and restore selected images without filters.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".brief-wizard-source-card .source-card-visual",
      ) &&
        document.documentElement.innerHTML.includes(
          "backdrop-filter: blur(2px) saturate(118%)",
        ) &&
        document.documentElement.innerHTML.includes(
          "box-shadow: 0 -18px 38px rgba(0, 0, 0, .5)",
        ),
      "Wizard Draw From cards must use the same image-under-text overlay style as Inspiration cards.",
    );
    console.assert(
      document.documentElement.innerHTML.indexOf('id="briefWizardApply"') <
        document.documentElement.innerHTML.indexOf('id="briefWizardFill"') &&
        document.documentElement.innerHTML.includes(
          "Apply and fill the Crucible",
        ) &&
        document.documentElement.innerHTML.includes(
          "els.briefWizardFill.hidden = state.briefWizardStep !== 3",
        ),
      "Wizard final actions must show Apply first and Apply and fill the Crucible as the rightmost final button.",
    );
    console.assert(
      formatMetaValue("height", "title") === "Height" &&
        formatMetaValue("sun warmed bone", "title") === "Sun Warmed Bone" &&
        formatManualTitle("the corpse refused by the sky") ===
          "The Corpse Refused by the Sky",
      "Motif and slot title case must capitalize major words while preserving minor words inside titles.",
    );
    console.assert(
      renderSlotItem(
        "clue",
        {
          id: "test",
          title: "the corpse refused by the sky",
          summary: "One corpse remains untouched.",
        },
        1,
      ).includes(
        '<strong class="slot-item-title">The Corpse Refused by the Sky.</strong> One corpse remains untouched.',
      ),
      "Slot items must render as D&D-style inline title-plus-description prose.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(".sensory-subslot.filled") &&
        document.documentElement.innerHTML.includes(
          "background-blend-mode: screen, screen, normal",
        ),
      "Filled sensory subslots must use the same visual language as build slots.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(".slot-item {") &&
        document.documentElement.innerHTML.includes(
          "background: transparent;",
        ) &&
        document.documentElement.innerHTML.includes("box-shadow: none;"),
      "Slot items must not add nested card backgrounds inside build slots.",
    );
    console.assert(
      [
        "Crucifixion",
        "Decomposition",
        "Genetic Mutations",
        "Wax Death Masks",
        "The Mist",
        "Sedlec Ossuary",
        "Endocannibalism",
        "Jikininki",
        "Impalement",
        "Towers of Silence",
        "Wolf Spiders",
        "Mustard Gas",
        "Anthropodermic Bibliopegy",
      ].every(
        (anchor) =>
          INSPIRATION_CARDS.find((card) => card.anchor === anchor).imageUrl,
      ),
      "Provided inspiration images must be mapped to their cards.",
    );
    console.assert(
      typeof renderComponentMetaList === "function",
      "Component cards must render structured metadata instead of loose tag pills.",
    );
    console.assert(
      renderComponentMetaList(COMPONENTS[0]).includes("Inspiration") &&
        renderComponentMetaList(COMPONENTS[0]).includes("Themes") &&
        renderComponentMetaList(COMPONENTS[0]).includes("Motifs"),
      "Component metadata must be grouped by Inspiration, Theme(s), and Motif(s).",
    );
    console.assert(
      renderComponentMetaList({
        ...COMPONENTS.find(
          (component) => component.id === "tower-refuses-burial",
        ),
      }).includes("Height") &&
        renderComponentMetaList({
          ...COMPONENTS.find(
            (component) => component.id === "tower-refuses-burial",
          ),
        }).includes("Sun"),
      "Motif metadata must render in title case.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("component-toggle-btn") &&
        document.documentElement.innerHTML.includes("expandedComponentId"),
      "Component cards must use +/- controls and click-to-expand state.",
    );
    console.assert(
      typeof resolveComponentTargetSlot === "function" &&
        typeof findComponentAssignedSlot === "function",
      "Component +/- buttons must resolve their compatible target slot automatically instead of depending on the currently selected slot.",
    );
    console.assert(
      typeof startComponentDrag === "function" &&
        typeof handleSlotDrop === "function" &&
        typeof placeComponentInSlot === "function",
      "Component cards must support drag-and-drop from the gallery into compatible Crucible slots.",
    );
    console.assert(
      document.documentElement.innerHTML.includes('draggable="true"') &&
        document.documentElement.innerHTML.includes("is-dragging-component") &&
        document.documentElement.innerHTML.includes("drop-compatible") &&
        document.documentElement.innerHTML.includes("drop-incompatible"),
      "Dragging a component must highlight compatible slots and dim incompatible slots.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(".build-slot:hover") &&
        document.documentElement.innerHTML.includes(
          "transform: scale(1.003)",
        ) &&
        document.documentElement.innerHTML.includes(
          ".brief-choice-card:hover",
        ) &&
        document.documentElement.innerHTML.includes("transform: scale(1.006)"),
      "Hover motion should use subtle scale, not upward translation, for Crucible and Wizard cards.",
    );
    console.assert(
      typeof openComponentContextMenu === "function" &&
        typeof showContextMenu === "function",
      "Component cards must expose a right-click context menu for add/remove and expand/collapse actions.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        "height: calc(100dvh - 116px);",
      ) && document.documentElement.innerHTML.includes("align-items: stretch"),
      "Crucible and Navigator columns must use equal viewport height on desktop.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("container-name: crucible") &&
        document.documentElement.innerHTML.includes(
          "@container crucible (min-width: 720px)",
        ) &&
        typeof getSlotLayoutClass === "function",
      "Crucible slot layout must use container queries and per-slot layout classes.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        "background-blend-mode: overlay, overlay, normal",
      ) &&
        document.documentElement.innerHTML.includes(
          "border: 2px solid color-mix",
        ),
      "Main glass panels must use overlay blend mode and 2px borders.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        "linear-gradient(135deg, rgba(42, 39, 41, .14), transparent 70%)",
      ),
      "Empty build slots must use the darker, less milky background gradient.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".workbench-resizer::after",
      ) &&
        document.documentElement.innerHTML.includes(
          "repeating-linear-gradient",
        ),
      "Workbench resizer must read visually as a draggable handle, not just a divider line.",
    );
    console.assert(
      getSlotLayoutClass({ id: "horrorPremise" }) === "build-slot--wide" &&
        getSlotLayoutClass({ id: "sensoryLayer" }) === "build-slot--wide" &&
        getSlotLayoutClass({ id: "hazard" }) === "build-slot--half",
      "Premise and Sensory Layer must stay full-width while ordinary slots can pair in columns.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        'data-menu-action="component-toggle"',
      ) &&
        document.documentElement.innerHTML.includes(
          'data-menu-action="component-expand"',
        ),
      "Component context menu must provide component-toggle and component-expand actions.",
    );
    console.assert(
      typeof renderBriefWizard === "function" &&
        typeof renderNavigatorFilterChip === "function",
      "Brief Wizard and Component Navigator filters must be implemented as separate systems.",
    );
    console.assert(
      document.querySelector(".brief-wizard__foot #briefWizardProgress") &&
        document.documentElement.innerHTML.includes("--brief-progress"),
      "Brief Wizard stepper must live in the footer between navigation arrows and use a connected progress line.",
    );
    console.assert(
      typeof getSelectedHorrors === "function" && state.horrors instanceof Set,
      "Turn Toward must support multiple horror selections while Start From remains single-choice.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("isHorrorSelected(value)") &&
        document.documentElement.innerHTML.includes(
          "toggleHorrorSelection(value)",
        ),
      "Navigator Turn Toward chips and wizard cards must use multi-select horror state.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        "grid-template-columns: repeat(4, 92px)",
      ) &&
        document.documentElement.innerHTML.includes("left: 46px;") &&
        document.documentElement.innerHTML.includes("100% - 92px"),
      "Brief Wizard stepper line must align to the center of wider labeled step boxes.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("brief-step-number") &&
        document.documentElement.innerHTML.includes("brief-step-label"),
      "Brief Wizard stepper must show a square number box with the step title beneath it.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("html::-webkit-scrollbar") &&
        document.documentElement.innerHTML.includes("width: 15px;"),
      "Document scrollbar must remain visually heavier than internal scrollbars.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".build-canvas::-webkit-scrollbar",
      ) &&
        document.documentElement.innerHTML.includes("width: 6px;") &&
        document.documentElement.innerHTML.includes("background: transparent;"),
      "Internal scrollbars must be thin, squared, transparent-track custom scrollbars.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".brief-wizard__body::-webkit-scrollbar",
      ) &&
        document.documentElement.innerHTML.includes(
          ".brief-wizard__body::-webkit-scrollbar-thumb",
        ),
      "Brief Wizard body must use the same custom internal scrollbar styling as the rest of the site.",
    );
    const inspirationBodyStart = document.documentElement.innerHTML.indexOf(
      ".inspiration-body {",
    );
    const inspirationBodyEnd = document.documentElement.innerHTML.indexOf(
      ".inspiration-body h3",
      inspirationBodyStart,
    );
    const inspirationBodyCss =
      inspirationBodyStart >= 0 && inspirationBodyEnd > inspirationBodyStart
        ? document.documentElement.innerHTML.slice(
            inspirationBodyStart,
            inspirationBodyEnd,
          )
        : "";
    console.assert(
      inspirationBodyCss.includes("position: absolute") &&
        inspirationBodyCss.includes(
          "backdrop-filter: blur(2px) saturate(118%)",
        ) &&
        inspirationBodyCss.includes(
          "-webkit-backdrop-filter: blur(2px) saturate(118%)",
        ),
      "Inspiration card body must exist, stay positioned over the card, and keep subtle blur.",
    );
    console.assert(
      !document.documentElement.innerHTML.includes("scrollbar-width: thin;"),
      "Internal scrollbars must not use standard scrollbar-width because it can override WebKit scrollbar styling.",
    );
    console.assert(
      !document.documentElement.innerHTML.includes(
        "scrollbar-color: rgba(122, 26, 40, .82)",
      ),
      "Root scrollbar-color must not be set because it can inherit into internal scroll containers and suppress WebKit scrollbar rendering.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(
        ".panel.build-canvas::-webkit-scrollbar",
      ) &&
        document.documentElement.innerHTML.includes("scrollbar-color: auto;"),
      "Panel scroll containers must explicitly reset standard scrollbar properties and use WebKit pseudo-elements.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(".component-card.in-build") &&
        document.documentElement.innerHTML.includes(
          "0 0 46px rgba(51, 3, 12, .6)",
        ),
      "In-build component cards must use the same active visual language as active Crucible slots.",
    );
    console.assert(
      els.readModeSwitch &&
        state.readAloudMode === "compact" &&
        typeof toggleReadAloudMode === "function",
      "Compiled output must support Compact / Extended read-aloud mode through a single switch control.",
    );
    console.assert(
      document.querySelector(".build-canvas-shell > .panel.build-canvas") &&
        document.querySelector(".build-canvas-shell > .canvas-icon-actions") &&
        !document.querySelector(".canvas-actions .canvas-icon-actions"),
      "Canvas icon actions must be outside the scrollable build-canvas content and outside .canvas-actions.",
    );
    console.assert(
      document.getElementById("savedBuildsBtn") &&
        document.getElementById("savedBuildsModal") &&
        document.querySelector(".brief-actions #savedBuildsBtn") &&
        !document.querySelector(".build-canvas .saved-block") &&
        !document.querySelector(".build-canvas details .saved-list"),
      "Saved builds must open from a Crucible action button and render in a modal, not inside the build canvas.",
    );
    console.assert(
      document.getElementById("regionsPanel") &&
        typeof renderLocationRegions === "function" &&
        typeof generateLocationRegions === "function" &&
        typeof buildCompiledMarkdownRegionSections === "function",
      "Darken a Location must support MVP Location Regions with generated rooms/regions and compiled output.",
    );
    console.assert(
      typeof isRegionTemplateCompatibleWithContext === "function" &&
        typeof getContextCompatibleRegionTemplates === "function",
      "Location Region generation must use hard context compatibility, not only weighted scoring.",
    );
    console.assert(
      isRegionTemplateCompatibleWithContext(
        LOCATION_REGION_TEMPLATES.find(
          (region) => region.templateId === "wax-portrait-room",
        ),
        "Noble House",
      ) &&
        !isRegionTemplateCompatibleWithContext(
          LOCATION_REGION_TEMPLATES.find(
            (region) => region.templateId === "wax-portrait-room",
          ),
          "Forest",
        ) &&
        !isRegionTemplateCompatibleWithContext(
          LOCATION_REGION_TEMPLATES.find(
            (region) => region.templateId === "wax-portrait-room",
          ),
          "Cave",
        ),
      "Built-room regions such as Wax Portrait Room must not appear in natural-context random generation.",
    );
    console.assert(
      Array.isArray(LOCATION_REGION_TEMPLATES) &&
        LOCATION_REGION_TEMPLATES.length >= 8 &&
        LOCATION_REGION_TEMPLATES.every(
          (region) =>
            region.shape &&
            region.connectors &&
            region.readAloud &&
            region.feature &&
            region.interaction &&
            region.danger &&
            region.secret,
        ),
      "Location Region templates must include map-oriented metadata and table-ready exploration content.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("--canvas-action-overlap") &&
        document.documentElement.innerHTML.includes(
          "bottom: calc(-1 * var(--canvas-action-overlap))",
        ) &&
        document.documentElement.innerHTML.includes("flex-direction: row") &&
        document.documentElement.innerHTML.includes(
          ".canvas-icon-actions .icon-btn",
        ),
      "Canvas icon actions must sit horizontally against the lower build-canvas border with a half-in / half-out overlap.",
    );
    console.assert(
      document.documentElement.innerHTML.includes(".read-mode-switch__knob") &&
        document.documentElement.innerHTML.includes(
          ".read-mode-toggle.is-extended .read-mode-switch",
        ) &&
        !document.documentElement.innerHTML.includes("readModeCompactBtn"),
      "Read-aloud control must render as a central switch with non-interactive Compact / Extended labels, not two segmented buttons.",
    );
    console.assert(
      typeof normalizeTextBlocks === "function" &&
        typeof buildOpeningReadAloud === "function" &&
        typeof buildCompiledMarkdownTextSections === "function",
      "Read-aloud text must be organized by table-use role instead of blindly concatenating component tableText.",
    );
    console.assert(
      document.documentElement.innerHTML.includes("Opening Read-Aloud") &&
        document.documentElement.innerHTML.includes("Triggered Text") &&
        document.documentElement.innerHTML.includes("GM Notes"),
      "Compiled output must separate opening text, triggered text, investigation/reveal text, consequences, and GM notes.",
    );
  }

  function populateSelects() {
    renderWorkflowButtons();
    renderBriefControls();
    renderSourceFilterControls();
    populateContexts();
  }

  function populateContexts() {
    const workflow = WORKFLOWS[state.workflow];
    state.context = workflow.contexts.includes(state.context)
      ? state.context
      : "Any";
    renderBriefControls();
  }

  function attachEvents() {
    els.workflowButtons.addEventListener("click", (event) => {
      const button = event.target.closest("[data-workflow-mode]");
      if (!button || button.dataset.workflowMode === state.workflow) return;
      state.workflow = button.dataset.workflowMode;
      state.context = "Any";
      state.horror = "Any";
      state.horrors.clear();
      state.search = "";
      state.tags.clear();
      els.searchInput.value = "";
      populateContexts();
      resetBuildForWorkflow();
      setDefaultTitle();
      renderAll();
    });
    if (els.openMapGeneratorBtn) {
      els.openMapGeneratorBtn.addEventListener("click", () => {
        if (!onOpenMapGenerator) return;
        onOpenMapGenerator(createDarkenLocationSnapshot());
      });
    }

    els.editBriefBtn.addEventListener("click", openBriefWizard);
    els.clearBriefBtn.addEventListener("click", clearBriefFilters);
    els.briefWizardClose.addEventListener("click", closeBriefWizard);
    els.briefWizardApply.addEventListener("click", applyBriefWizard);
    els.briefWizardBack.addEventListener("click", () => moveBriefWizard(-1));
    els.briefWizardNext.addEventListener("click", () => moveBriefWizard(1));
    els.briefWizardFill.addEventListener("click", fillCrucibleFromWizard);
    els.briefWizardModal.addEventListener("click", (event) => {
      if (event.target === els.briefWizardModal) closeBriefWizard();
    });
    els.contextComboBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleBriefPanel("context");
    });
    els.horrorComboBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleBriefPanel("horror");
    });
    els.contextComboSearch.addEventListener("input", () => {
      state.contextSearch = els.contextComboSearch.value.trim().toLowerCase();
      renderBriefControls();
    });
    els.horrorComboSearch.addEventListener("input", () => {
      state.horrorSearch = els.horrorComboSearch.value.trim().toLowerCase();
      renderBriefControls();
    });
    els.sourcePickerBtn.addEventListener("click", openSourcePicker);
    els.sourcePickerClose.addEventListener("click", closeSourcePicker);
    els.sourcePickerDone.addEventListener("click", closeSourcePicker);
    els.sourcePickerClear.addEventListener("click", clearSourcePicker);
    els.sourcePickerSearchInput.addEventListener("input", () => {
      state.sourcePickerSearch = els.sourcePickerSearchInput.value
        .trim()
        .toLowerCase();
      renderSourcePicker();
    });
    els.sourceTypeFilterBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSourceFilterPanel("type");
    });
    els.sourceThemeFilterBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSourceFilterPanel("theme");
    });
    els.sourceTypeFilterSearch.addEventListener("input", () => {
      state.sourceTypeSearch = els.sourceTypeFilterSearch.value
        .trim()
        .toLowerCase();
      renderSourceFilterControls();
    });
    els.sourceThemeFilterSearch.addEventListener("input", () => {
      state.sourceThemeSearch = els.sourceThemeFilterSearch.value
        .trim()
        .toLowerCase();
      renderSourceFilterControls();
    });
    els.sourcePickerModal.addEventListener("click", (event) => {
      if (event.target === els.sourcePickerModal) closeSourcePicker();
      if (!event.target.closest(".filter-combobox")) closeSourceFilterPanels();
    });
    if (els.inspirationDetailClose) {
      els.inspirationDetailClose.addEventListener(
        "click",
        closeInspirationDetail,
      );
    }
    if (els.inspirationDetailModal) {
      els.inspirationDetailModal.addEventListener("click", (event) => {
        if (event.target === els.inspirationDetailModal)
          closeInspirationDetail();
      });
    }
    els.intrusionSegments.addEventListener("click", (event) => {
      const button = event.target.closest("[data-intrusion-value]");
      if (!button) return;
      state.intrusion = button.dataset.intrusionValue;
      renderBriefControls();
      renderBriefSummary();
      renderNavigator();
      refreshOutputIfOpen();
    });
    els.searchInput.addEventListener("input", () => {
      state.search = els.searchInput.value.trim().toLowerCase();
      renderNavigator();
    });
    els.buildCanvas.addEventListener("click", handleBuildCanvasEmptyClick);
    els.buildTitleInput.addEventListener("input", refreshOutputIfOpen);
    els.tagFilterBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      state.tagMenuOpen = !state.tagMenuOpen;
      renderTagFilters();
    });

    attachWorkbenchResize();
    els.readModeSwitch.addEventListener("click", toggleReadAloudMode);
    els.quickBuildBtn.addEventListener("click", () => quickBuild(false));
    els.randomBuildBtn.addEventListener("click", () => quickBuild(true));
    els.savedBuildsBtn.addEventListener("click", openSavedBuildsModal);
    els.savedBuildsClose.addEventListener("click", closeSavedBuildsModal);
    els.savedBuildsModal.addEventListener("click", (event) => {
      if (event.target === els.savedBuildsModal) closeSavedBuildsModal();
    });
    els.clearBuildBtn.addEventListener("click", clearBuild);
    els.compileBtn.addEventListener("click", showCompiledView);
    els.exportBtn.addEventListener("click", toggleExportView);
    els.copyBtn.addEventListener("click", copyCompiled);
    els.saveBtn.addEventListener("click", saveBuild);
    if (els.copyTopBtn) els.copyTopBtn.addEventListener("click", copyCompiled);
    if (els.saveTopBtn) els.saveTopBtn.addEventListener("click", saveBuild);
    els.tabs.forEach((button) =>
      button.addEventListener("click", () => showView(button.dataset.view)),
    );
    document.addEventListener("click", (event) => {
      if (!event.target.closest("#contextMenu")) hideContextMenu();
      if (!event.target.closest(".brief-combobox")) closeBriefPanels();
      if (!event.target.closest(".component-card"))
        clearExpandedComponentCard();
      if (!event.target.closest(".navigator-tools")) {
        state.tagMenuOpen = false;
        renderTagFilters();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      hideContextMenu();
      closeSourcePicker();
      closeBriefWizard();
      closeSavedBuildsModal();
      closeInspirationDetail();
      state.tagMenuOpen = false;
      closeSourceFilterPanels();
      closeBriefPanels();
      renderTagFilters();
    });
    window.addEventListener("scroll", hideContextMenu, true);
    window.addEventListener("resize", hideContextMenu);
  }

  function resetBuildForWorkflow() {
    state.build = {};
    state.lockedSlots = new Set();
    state.activeSensoryKind = "";
    const slots = WORKFLOWS[state.workflow].slots;
    slots.forEach((slot) => {
      state.build[slot.id] = [];
    });
    state.activeSlot = slots[0].id || null;
    state.locationRegions = [];
  }

  function setDefaultTitle() {
    els.buildTitleInput.value = WORKFLOWS[state.workflow].defaultTitle;
  }

  function renderAll() {
    renderWorkflowButtons();
    renderBriefControls();
    renderBriefSummary();
    renderSourceSummary();
    renderReadModeControls();
    renderSourcePicker();
    renderWorkflowCopy();
    renderBriefSummary();
    if (els.briefWizardModal && !els.briefWizardModal.hidden)
      renderBriefWizard();
    renderBuildSlots();
    renderLocationRegions();
    renderNavigator();
    renderSavedBuilds();
    renderInspirations();
    renderCurrentView();
    hydrateIconButtonTooltips();
  }

  function hydrateIconButtonTooltips(root = document) {
    root
      .querySelectorAll(
        ".icon-btn, .slot-menu-btn, .component-toggle-btn, .navigator-filter-btn, .mode-btn",
      )
      .forEach((button) => {
        const label =
          button.getAttribute("aria-label") || button.getAttribute("title");
        if (!label) return;
        button.setAttribute("data-key", "tooltip-generic");
        button.setAttribute("data-tooltip", label);
        button.removeAttribute("title");
      });
  }

  function renderBriefSummary() {
    if (!els.briefSummaryText) return;
    const selectedSources = getSelectedSources();
    const sourceLabel = selectedSources.length
      ? formatSelectedSourcesLabel(selectedSources)
      : "Any Source";
    const intensityLabel =
      state.intrusion === "Any" ? "Any intensity" : state.intrusion;
    els.briefSummaryText.innerHTML = `Brief: <strong>${escapeHtml(state.context)}</strong> · <strong>${escapeHtml(getHorrorSummaryLabel())}</strong> · <strong>${escapeHtml(sourceLabel)}</strong> · <strong>${escapeHtml(intensityLabel)}</strong>`;
  }

  function openBriefWizard() {
    state.briefWizardStep = 0;
    state.briefWizardMaxStep = Math.max(state.briefWizardMaxStep || 0, 0);
    if (els.briefWizardModal) els.briefWizardModal.hidden = false;
    renderBriefWizard();
  }

  function closeBriefWizard() {
    if (!els.briefWizardModal || els.briefWizardModal.hidden) return;
    els.briefWizardModal.hidden = true;
    renderBriefSummary();
  }

  function applyBriefWizard() {
    closeBriefWizard();
    setStatus(
      "Brief applied. Fill the Crucible or choose components manually.",
    );
  }

  function fillCrucibleFromWizard() {
    closeBriefWizard();
    quickBuild(false);
  }

  function moveBriefWizard(delta) {
    const next = Math.max(0, Math.min(3, state.briefWizardStep + delta));
    transitionBriefWizardTo(next);
  }

  function goToBriefWizardStep(step) {
    if (step > state.briefWizardMaxStep) return;
    transitionBriefWizardTo(step);
  }

  function transitionBriefWizardTo(step) {
    if (step === state.briefWizardStep) return;
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion || !els.briefWizardBody) {
      state.briefWizardStep = step;
      state.briefWizardMaxStep = Math.max(state.briefWizardMaxStep, step);
      renderBriefWizard();
      return;
    }
    clearTimeout(transitionBriefWizardTo._timer);
    els.briefWizardBody.classList.add("is-fading");
    transitionBriefWizardTo._timer = setTimeout(() => {
      state.briefWizardStep = step;
      state.briefWizardMaxStep = Math.max(state.briefWizardMaxStep, step);
      renderBriefWizard({ animateIn: true });
    }, 160);
  }

  function clearBriefFilters() {
    state.context = "Any";
    state.horror = "Any";
    state.horrors.clear();
    state.sourceAnchors.clear();
    state.intrusion = "Any";
    state.tags.clear();
    state.tagMenuOpen = false;
    renderBriefSummary();
    renderNavigator();
    renderInspirations();
    refreshOutputIfOpen();
    setStatus("Brief cleared.");
  }

  function renderBriefWizard(options = {}) {
    if (!els.briefWizardBody || !els.briefWizardProgress) return;
    const steps = [
      {
        title: "Start From",
        subtitle:
          "Choose the scene, place, creature, reward, or clue you already have.",
      },
      {
        title: "Turn Toward",
        subtitle: "Choose the horror language the Crucible should privilege.",
      },
      {
        title: "Draw From",
        subtitle: "Choose one or more inspirations behind the component pool.",
      },
      {
        title: "Hit With",
        subtitle: "Choose how strongly the horror should affect play.",
      },
    ];
    const step = steps[state.briefWizardStep] || steps[0];
    els.briefWizardTitle.textContent = step.title;
    els.briefWizardSubtitle.textContent = `Step ${state.briefWizardStep + 1} of 4 · ${step.subtitle}`;
    els.briefWizardProgress.style.setProperty(
      "--brief-progress",
      String(state.briefWizardStep / 3),
    );
    els.briefWizardProgress.innerHTML = steps
      .map(
        (item, index) =>
          `<button class="brief-step-btn ${index <= state.briefWizardStep ? "reached" : ""} ${index === state.briefWizardStep ? "active" : ""}" type="button" data-brief-step="${index}" ${index > state.briefWizardMaxStep ? "disabled" : ""} aria-current="${index === state.briefWizardStep ? "step" : "false"}"><span class="brief-step-number">${index + 1}</span><span class="brief-step-label">${escapeHtml(item.title)}</span></button>`,
      )
      .join("");
    els.briefWizardProgress
      .querySelectorAll("[data-brief-step]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          goToBriefWizardStep(Number(button.dataset.briefStep)),
        ),
      );
    els.briefWizardBody.innerHTML = renderBriefWizardStep();
    attachBriefWizardStepEvents();
    if (options.animateIn) {
      els.briefWizardBody.classList.add("is-fading");
      requestAnimationFrame(() =>
        els.briefWizardBody.classList.remove("is-fading"),
      );
    } else {
      els.briefWizardBody.classList.remove("is-fading");
    }
    els.briefWizardBack.disabled = state.briefWizardStep === 0;
    els.briefWizardNext.hidden = state.briefWizardStep === 3;
    els.briefWizardApply.hidden = state.briefWizardStep !== 3;
    els.briefWizardFill.hidden = state.briefWizardStep !== 3;
  }

  function renderBriefWizardStep() {
    if (state.briefWizardStep === 0) {
      return `<div class="brief-choice-grid">${WORKFLOWS[state.workflow].contexts.map((value) => renderBriefChoiceCard({ value, selected: state.context === value, icon: getContextIcon(value), description: CONTEXT_DESCRIPTIONS[value] || "Use this as the practical starting point for the component search.", action: "context" })).join("")}</div>`;
    }
    if (state.briefWizardStep === 1) {
      return `<div class="brief-choice-grid">${HORROR_TYPES.map((value) => renderBriefChoiceCard({ value, selected: isHorrorSelected(value), icon: getHorrorIcon(value), description: HORROR_DESCRIPTIONS[value] || "Use this horror direction to bias component selection.", action: "horror" })).join("")}</div>`;
    }
    if (state.briefWizardStep === 2) {
      return `<div class="brief-wizard-source-grid">${INSPIRATION_CARDS.map((card) => `<button class="brief-wizard-source-card ${state.sourceAnchors.has(card.anchor) ? "selected" : ""}" type="button" data-brief-source="${escapeHtml(card.anchor)}" aria-pressed="${state.sourceAnchors.has(card.anchor) ? "true" : "false"}"><span class="source-card-visual">${renderInspirationImage(card)}<i class="fa-solid ${escapeHtml(card.icon)}" aria-hidden="true" ${card.imageUrl ? "hidden" : ""}></i></span><strong>${escapeHtml(card.anchor)}</strong></button>`).join("")}</div>`;
    }
    return `<div class="brief-choice-grid">${INTRUSION_LEVELS.map((value) => renderBriefChoiceCard({ value, selected: state.intrusion === value, icon: getIntrusionIcon(value), description: INTRUSION_LABELS[value] || value, action: "intrusion" })).join("")}</div>`;
  }

  function renderBriefChoiceCard(config) {
    return `<button class="brief-choice-card ${config.selected ? "selected" : ""}" type="button" data-brief-${config.action}="${escapeHtml(config.value)}" aria-pressed="${config.selected ? "true" : "false"}"><span class="brief-choice-icon"><i class="fa-solid ${escapeHtml(config.icon)}" aria-hidden="true"></i></span><strong>${escapeHtml(config.value)}</strong><span>${escapeHtml(config.description)}</span></button>`;
  }

  function attachBriefWizardStepEvents() {
    els.briefWizardBody
      .querySelectorAll("[data-brief-context]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          state.context = button.dataset.briefContext;
          afterBriefWizardSelection();
        }),
      );
    els.briefWizardBody
      .querySelectorAll("[data-brief-horror]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          toggleHorrorSelection(button.dataset.briefHorror);
          state.tags.clear();
          afterBriefWizardSelection({ stay: true });
        }),
      );
    els.briefWizardBody
      .querySelectorAll("[data-brief-source]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          const anchor = button.dataset.briefSource;
          if (state.sourceAnchors.has(anchor))
            state.sourceAnchors.delete(anchor);
          else state.sourceAnchors.add(anchor);
          state.tags.clear();
          afterBriefWizardSelection({ stay: true });
        }),
      );
    els.briefWizardBody
      .querySelectorAll("[data-brief-intrusion]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          state.intrusion = button.dataset.briefIntrusion;
          afterBriefWizardSelection();
        }),
      );
  }

  function afterBriefWizardSelection(options = {}) {
    state.briefWizardMaxStep = Math.max(
      state.briefWizardMaxStep,
      state.briefWizardStep,
    );
    renderBriefSummary();
    renderNavigator();
    renderInspirations();
    refreshOutputIfOpen();
    if (!options.stay && state.briefWizardStep < 3) {
      transitionBriefWizardTo(state.briefWizardStep + 1);
      return;
    }
    renderBriefWizard();
  }

  function getSelectedHorrors() {
    if (state.horrors instanceof Set && state.horrors.size)
      return Array.from(state.horrors).filter(
        (value) => HORROR_TYPES.includes(value) && value !== "Any",
      );
    return state.horror && state.horror !== "Any" ? [state.horror] : [];
  }

  function getHorrorSummaryLabel() {
    const selected = getSelectedHorrors();
    if (!selected.length) return "Any horror";
    if (selected.length === 1) return selected[0];
    if (selected.length === 2) return `${selected[0]} + 1`;
    return `${selected[0]} + ${selected.length - 1}`;
  }

  function isHorrorSelected(value) {
    const selected = getSelectedHorrors();
    if (value === "Any") return selected.length === 0;
    return selected.includes(value);
  }

  function toggleHorrorSelection(value) {
    if (!state.horrors || !(state.horrors instanceof Set))
      state.horrors = new Set(getSelectedHorrors());
    if (value === "Any") {
      state.horrors.clear();
      state.horror = "Any";
      return;
    }
    if (state.horrors.has(value)) state.horrors.delete(value);
    else state.horrors.add(value);
    const selected = getSelectedHorrors();
    state.horror = selected.length ? selected[0] : "Any";
  }

  function setHorrorSelection(values) {
    const selected = (Array.isArray(values) ? values : [values]).filter(
      (value) => HORROR_TYPES.includes(value) && value !== "Any",
    );
    state.horrors = new Set(selected);
    state.horror = selected[0] || "Any";
  }

  function getContextIcon(value) {
    const icons = {
      Any: "fa-asterisk",
      Cave: "fa-mountain",
      Crypt: "fa-box-archive",
      Chapel: "fa-church",
      Forest: "fa-tree",
      Mine: "fa-helmet-safety",
      "Noble House": "fa-landmark",
      Village: "fa-house-chimney",
      Ruins: "fa-archway",
    };
    return icons[value] || "fa-cube";
  }

  function getHorrorIcon(value) {
    const icons = {
      Any: "fa-asterisk",
      Gothic: "fa-crow",
      "Body Horror": "fa-dna",
      "Religious Horror": "fa-church",
      "Folk Horror": "fa-wheat-awn",
      "War Horror": "fa-skull-crossbones",
      "Cosmic Horror": "fa-meteor",
      "Disease Horror": "fa-virus",
      "Occult Horror": "fa-eye",
      "Psychological Horror": "fa-brain",
    };
    return icons[value] || "fa-mask";
  }

  function getIntrusionIcon(value) {
    const icons = {
      Any: "fa-asterisk",
      Low: "fa-feather",
      Medium: "fa-bolt",
      High: "fa-fire",
    };
    return icons[value] || "fa-gauge-high";
  }

  function renderBriefControls() {
    renderBriefCombobox({
      kind: "context",
      values: WORKFLOWS[state.workflow].contexts,
      activeValue: state.context,
      searchValue: state.contextSearch,
      button: els.contextComboBtn,
      valueNode: els.contextComboValue,
      panel: els.contextComboPanel,
      searchInput: els.contextComboSearch,
      list: els.contextComboList,
      onSelect: (value) => {
        state.context = value;
        state.contextSearch = "";
        state.briefFilterOpen = "";
        renderBriefControls();
        renderNavigator();
        renderBuildSlots();
        refreshOutputIfOpen();
      },
    });
    renderBriefCombobox({
      kind: "horror",
      values: HORROR_TYPES,
      activeValue: getHorrorSummaryLabel(),
      searchValue: state.horrorSearch,
      button: els.horrorComboBtn,
      valueNode: els.horrorComboValue,
      panel: els.horrorComboPanel,
      searchInput: els.horrorComboSearch,
      list: els.horrorComboList,
      onSelect: (value) => {
        setHorrorSelection(value);
        state.horrorSearch = "";
        state.briefFilterOpen = "";
        state.tags.clear();
        renderBriefControls();
        renderNavigator();
        refreshOutputIfOpen();
      },
    });
    renderIntrusionSegments();
  }

  function renderBriefCombobox(config) {
    if (!config.button || !config.panel || !config.list) return;
    const isOpen = state.briefFilterOpen === config.kind;
    config.valueNode.textContent = config.activeValue;
    config.button.classList.toggle(
      "active",
      isOpen || config.activeValue !== "Any",
    );
    config.button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    config.panel.hidden = !isOpen;
    if (config.searchInput) config.searchInput.value = config.searchValue;
    const query = String(config.searchValue || "").toLowerCase();
    const values = config.values.filter(
      (value) => !query || value.toLowerCase().includes(query),
    );
    config.list.innerHTML = values.length
      ? values
          .map(
            (value) =>
              `<button class="brief-combobox__option ${value === config.activeValue ? "active" : ""}" type="button" role="option" aria-selected="${value === config.activeValue ? "true" : "false"}" data-brief-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`,
          )
          .join("")
      : '<div class="empty">No matches.</div>';
    config.list.querySelectorAll("[data-brief-value]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        config.onSelect(button.dataset.briefValue);
      }),
    );
  }

  function renderIntrusionSegments() {
    if (!els.intrusionSegments) return;
    els.intrusionSegments.innerHTML = INTRUSION_LEVELS.map(
      (value) =>
        `<button class="intrusion-segment ${state.intrusion === value ? "active" : ""}" type="button" role="radio" aria-checked="${state.intrusion === value ? "true" : "false"}" data-intrusion-value="${escapeHtml(value)}" title="${escapeHtml(INTRUSION_LABELS[value] || value)}">${escapeHtml(value)}</button>`,
    ).join("");
  }

  function toggleBriefPanel(kind) {
    state.briefFilterOpen = state.briefFilterOpen === kind ? "" : kind;
    renderBriefControls();
    const input =
      kind === "context" ? els.contextComboSearch : els.horrorComboSearch;
    if (state.briefFilterOpen === kind) setTimeout(() => input.focus(), 0);
  }

  function closeBriefPanels() {
    if (!state.briefFilterOpen) return;
    state.briefFilterOpen = "";
    renderBriefControls();
  }

  function toggleReadAloudMode() {
    setReadAloudMode(
      state.readAloudMode === "extended" ? "compact" : "extended",
    );
  }

  function setReadAloudMode(mode) {
    state.readAloudMode = mode === "extended" ? "extended" : "compact";
    renderReadModeControls();
    refreshOutputIfOpen();
    setStatus(`Read-aloud set to ${state.readAloudMode}.`);
  }

  function renderReadModeControls() {
    const isExtended = state.readAloudMode === "extended";
    els.readModeToggle.classList.toggle("is-extended", isExtended);
    els.readModeSwitch.setAttribute(
      "aria-pressed",
      isExtended ? "true" : "false",
    );
  }

  function renderWorkflowButtons() {
    if (!els.workflowButtons) return;
    els.workflowButtons.innerHTML = Object.entries(WORKFLOWS)
      .map(
        ([value, workflow]) => `
      <button class="mode-btn ${state.workflow === value ? "active" : ""}" type="button" data-workflow-mode="${value}" title="${escapeHtml(workflow.label)}" aria-label="${escapeHtml(workflow.label)}" aria-pressed="${state.workflow === value ? "true" : "false"}">
        <i class="fa-solid ${getWorkflowIcon(value)}" aria-hidden="true"></i>
        <span class="sr-only">${escapeHtml(workflow.label)}</span>
      </button>
    `,
      )
      .join("");
  }

  function renderWorkflowCopy() {
    const workflow = WORKFLOWS[state.workflow];
    if (els.needValue && workflow.label) {
      els.needValue.textContent = workflow.label;
    }
    if (els.openMapGeneratorBtn) {
      els.openMapGeneratorBtn.hidden =
        state.workflow !== "location" || !onOpenMapGenerator;
    }
  }

  function renderBuildSlots() {
    const slots = WORKFLOWS[state.workflow].slots;
    const hasItems = slots.some((slot) => (state.build[slot.id] || []).length);
    els.quickBuildBtn.classList.toggle("empty-cta", !hasItems);
    els.buildSlots.innerHTML = slots
      .map((slot) => {
        const items = state.build[slot.id] || [];
        const isFilled = items.length > 0;
        const isActive = state.activeSlot === slot.id;
        const isLocked = state.lockedSlots.has(slot.id);
        if (slot.id === "sensoryLayer")
          return renderSensoryLayerSlot(slot, items);
        return `
        <section class="build-slot ${getSlotLayoutClass(slot)} ${isFilled ? "has-items complete filled" : "needs-attention"} ${isActive ? "active" : ""}" data-select-slot="${slot.id}">
          <div class="slot-head">
            <span class="slot-name"><i class="fa-solid ${getSlotIcon(slot.id)} slot-icon" aria-hidden="true"></i><span>${escapeHtml(slot.label)}</span>${isLocked ? '<i class="fa-solid fa-lock slot-locked" aria-hidden="true" title="Locked"></i>' : ""}</span>
            <span class="slot-head-actions">${isFilled ? `<button class="slot-menu-btn" type="button" data-slot-menu="${slot.id}" title="Slot actions" aria-label="${escapeHtml(slot.label)} actions"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>` : ""}<span class="count">${items.length}/${slot.max}</span></span>
          </div>
          ${isFilled ? `<div class="slot-stack">${items.map((item) => renderSlotItem(slot.id, item, slot.max)).join("")}</div>` : renderEmptySlot(slot)}
        </section>
      `;
      })
      .join("");

    els.buildSlots.querySelectorAll("[data-select-slot]").forEach((node) => {
      node.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        const sensoryTarget = event.target.closest(
          "[data-select-sensory-kind]",
        );
        if (sensoryTarget) {
          event.stopPropagation();
          selectSensoryKind(sensoryTarget.dataset.selectSensoryKind);
          return;
        }
        selectSlot(node.dataset.selectSlot);
      });
      node.querySelectorAll("[data-select-sensory-kind]").forEach((subslot) =>
        subslot.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          selectSensoryKind(subslot.dataset.selectSensoryKind);
        }),
      );
      node.addEventListener("contextmenu", (event) => {
        if (event.target.closest("[data-context-item]")) return;
        const slotId = node.dataset.selectSlot;
        const items = state.build[slotId] || [];
        if (!items.length) return;
        event.preventDefault();
        event.stopPropagation();
        openContextMenu(event, slotId, items.length === 1 ? items[0].id : "");
      });
    });

    els.buildSlots.querySelectorAll("[data-slot-menu]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const slotId = button.dataset.slotMenu;
        const items = state.build[slotId] || [];
        if (!items.length) return;
        openContextMenu(event, slotId, items.length === 1 ? items[0].id : "");
      }),
    );
    els.buildSlots
      .querySelectorAll("[data-select-slot]")
      .forEach((node) => attachSlotDropTarget(node, node.dataset.selectSlot));
    els.buildSlots
      .querySelectorAll("[data-select-sensory-kind]")
      .forEach((subslot) =>
        attachSlotDropTarget(
          subslot,
          "sensoryLayer",
          subslot.dataset.selectSensoryKind,
        ),
      );
    els.buildSlots
      .querySelectorAll("[data-action]")
      .forEach((button) =>
        button.addEventListener("click", () => handleSlotAction(button)),
      );
    els.buildSlots.querySelectorAll("[data-context-item]").forEach((item) => {
      item.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openContextMenu(event, item.dataset.slot, item.dataset.id);
      });
    });
    hydrateIconButtonTooltips(els.buildSlots);
  }

  function getSlotLayoutClass(slot) {
    const wideSlots = new Set(["horrorPremise", "sensoryLayer"]);
    return wideSlots.has(slot.id) ? "build-slot--wide" : "build-slot--half";
  }

  function renderEmptySlot(slot) {
    return `<div class="slot-empty"><span>Empty. ${escapeHtml(getSlotDescription(slot.id))}</span></div>`;
  }

  function renderSlotItem(slotId, item, max, options = {}) {
    const sensoryLabel =
      slotId === "sensoryLayer" && item.sensoryKind && !options.hideSensoryKind
        ? `<span class="slot-item-kind">${escapeHtml(item.sensoryKind)}</span>`
        : "";
    const title = formatManualTitle(item.title);
    return `<div class="slot-item ${max > 1 ? "multi-select" : ""}" data-context-item="true" data-slot="${slotId}" data-id="${item.id}" title="Right-click for actions"><p class="slot-item-text">${sensoryLabel}<strong class="slot-item-title">${escapeHtml(title)}.</strong> ${escapeHtml(item.summary)}</p></div>`;
  }

  function renderSensoryLayerSlot(slot, items) {
    const isActive = state.activeSlot === slot.id;
    const isLocked = state.lockedSlots.has(slot.id);
    const needsAttention = items.length < slot.max;
    const isComplete = items.length >= slot.max;
    return `
      <section class="build-slot ${getSlotLayoutClass(slot)} ${items.length ? "has-items" : ""} ${isComplete ? "complete filled" : ""} ${needsAttention ? "needs-attention" : ""} ${isActive ? "active" : ""}" data-select-slot="${slot.id}">
        <div class="slot-head">
          <span class="slot-name"><i class="fa-solid ${getSlotIcon(slot.id)} slot-icon" aria-hidden="true"></i><span>${escapeHtml(slot.label)}</span>${isLocked ? '<i class="fa-solid fa-lock slot-locked" aria-hidden="true" title="Locked"></i>' : ""}</span>
          <span class="slot-head-actions">${items.length ? `<button class="slot-menu-btn" type="button" data-slot-menu="${slot.id}" title="Slot actions" aria-label="${escapeHtml(slot.label)} actions"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>` : ""}<span class="count">${items.length}/${slot.max}</span></span>
        </div>
        <div class="sensory-subslots">
          ${SENSORY_KINDS.map((kind) => {
            const item = items.find((entry) => entry.sensoryKind === kind);
            const isKindActive =
              state.activeSlot === slot.id && state.activeSensoryKind === kind;
            return `<div class="sensory-subslot ${item ? "filled" : ""} ${isKindActive ? "active" : ""}" data-select-sensory-kind="${escapeHtml(kind)}" role="button" tabindex="0" aria-pressed="${isKindActive ? "true" : "false"}"><span class="sensory-subslot__label"><i class="fa-solid ${getSensoryKindIcon(kind)}" aria-hidden="true"></i>${escapeHtml(kind)}</span>${item ? renderSlotItem(slot.id, item, 1, { hideSensoryKind: true }) : `<span class="sensory-subslot__empty">Empty. ${escapeHtml(getSensoryKindDescription(kind))}</span>`}</div>`;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderLocationRegions() {
    if (!els.regionsPanel) return;
    const isLocationWorkflow = state.workflow === "location";
    els.regionsPanel.hidden = !isLocationWorkflow;
    if (!isLocationWorkflow) {
      els.regionsPanel.innerHTML = "";
      return;
    }
    const regions = getActiveLocationRegions();
    els.regionsPanel.innerHTML = `
      <header class="regions-head">
        <div>
          <p class="eyebrow">Exploration Layer</p>
          <h2>Location Regions</h2>
          <p>Add concrete rooms, passages, thresholds, nests, and clue spaces that turn the darkened location into something players can explore.</p>
        </div>
        <div class="regions-actions" aria-label="Location region actions">
          <button class="icon-btn primary" type="button" data-region-action="add" title="Add Region" aria-label="Add Region"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>
          <button class="icon-btn" type="button" data-region-action="generate" title="Generate Context-Fit Location" aria-label="Generate Context-Fit Location"><i class="fa-solid fa-dungeon" aria-hidden="true"></i></button>
          <button class="icon-btn" type="button" data-region-action="clear" title="Clear Regions" aria-label="Clear Regions"><i class="fa-solid fa-broom" aria-hidden="true"></i></button>
        </div>
      </header>
      ${regions.length ? `<div class="region-grid">${regions.map(renderLocationRegionCard).join("")}</div>` : '<div class="region-empty">No regions yet. Add one context-fit region, or generate a context-fit location from the current brief.</div>'}
    `;
    els.regionsPanel
      .querySelector('[data-region-action="add"]')
      .addEventListener("click", () => addLocationRegion());
    els.regionsPanel
      .querySelector('[data-region-action="generate"]')
      .addEventListener("click", () => generateLocationRegions(5));
    els.regionsPanel
      .querySelector('[data-region-action="clear"]')
      .addEventListener("click", clearLocationRegions);
    els.regionsPanel
      .querySelectorAll("[data-region-remove]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          removeLocationRegion(button.dataset.regionRemove),
        ),
      );
    els.regionsPanel
      .querySelectorAll("[data-region-regenerate]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          regenerateLocationRegion(button.dataset.regionRegenerate),
        ),
      );
    hydrateIconButtonTooltips(els.regionsPanel);
  }

  function renderLocationRegionCard(region) {
    const readAloud = getTextValue(region.readAloud) || region.feature || "";
    return `<article class="region-card" data-location-region="${escapeHtml(region.id)}">
      <div class="region-card__top">
        <div class="region-card__title"><i class="fa-solid ${escapeHtml(getRegionIcon(region.role))}" aria-hidden="true"></i><div><h3>${escapeHtml(region.name)}</h3><div class="region-card__meta">${escapeHtml(region.role)} · ${escapeHtml(region.shape)} · ${escapeHtml(region.size)} · ${region.connectors} links</div></div></div>
        <div class="region-card__actions"><button class="icon-btn" type="button" data-region-regenerate="${escapeHtml(region.id)}" title="Regenerate Region" aria-label="Regenerate ${escapeHtml(region.name)}"><i class="fa-solid fa-rotate" aria-hidden="true"></i></button><button class="icon-btn" type="button" data-region-remove="${escapeHtml(region.id)}" title="Remove Region" aria-label="Remove ${escapeHtml(region.name)}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
      </div>
      <p class="region-card__read">${escapeHtml(readAloud)}</p>
      <dl class="region-fact-list">
        <div><dt>Feature</dt><dd>${escapeHtml(region.feature)}</dd></div>
        <div><dt>Interact</dt><dd>${escapeHtml(region.interaction)}</dd></div>
        <div><dt>Danger</dt><dd>${escapeHtml(region.danger)}</dd></div>
        <div><dt>Secret</dt><dd>${escapeHtml(region.secret)}</dd></div>
      </dl>
    </article>`;
  }

  function getActiveLocationRegions() {
    return state.workflow === "location" ? state.locationRegions || [] : [];
  }

  function getSelectedComponentsSnapshot() {
    return Object.entries(state.build || {}).flatMap(([slotId, items]) =>
      (Array.isArray(items) ? items : []).filter(Boolean).map((item) => ({
        id: item.id,
        title: item.title,
        slotId,
      })),
    );
  }

  function createDarkenLocationSnapshot() {
    return {
      workflow: state.workflow,
      title:
        els.buildTitleInput?.value?.trim() ||
        WORKFLOWS[state.workflow]?.defaultTitle ||
        "",
      context: state.context,
      horrors: getSelectedHorrors(),
      sourceAnchors: getSelectedSources(),
      intrusion: state.intrusion,
      locationRegions: getActiveLocationRegions().map((region) => ({
        ...region,
      })),
      selectedComponents: getSelectedComponentsSnapshot(),
    };
  }

  function createLocationRegion(template) {
    return {
      ...template,
      id: `region-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      templateId: template.templateId,
      links: Array.isArray(template.links) ? [...template.links] : [],
    };
  }

  function sanitizeLocationRegions(regions) {
    return (Array.isArray(regions) ? regions : [])
      .map((region) => {
        const template =
          LOCATION_REGION_TEMPLATES.find(
            (item) => item.templateId === region.templateId,
          ) ||
          LOCATION_REGION_TEMPLATES.find((item) => item.name === region.name);
        return template
          ? {
              ...createLocationRegion(template),
              ...region,
              links: Array.isArray(region.links)
                ? region.links
                : template.links,
            }
          : null;
      })
      .filter(Boolean);
  }

  function isRegionTemplateCompatibleWithContext(
    template,
    context = state.context,
  ) {
    if (!template || !Array.isArray(template.contexts)) return false;
    if (context === "Any") return true;
    return template.contexts.includes(context);
  }

  function getContextCompatibleRegionTemplates(
    excludedTemplateIds = new Set(),
  ) {
    return LOCATION_REGION_TEMPLATES.filter(
      (template) =>
        !excludedTemplateIds.has(template.templateId) &&
        isRegionTemplateCompatibleWithContext(template),
    );
  }

  function scoreRegionTemplate(template) {
    let score = 0;
    if (state.context !== "Any" && template.contexts.includes(state.context))
      score += 10;
    const selectedHorrors = getSelectedHorrors();
    const horrorMatches = selectedHorrors.filter((horror) =>
      template.horror.includes(horror),
    );
    if (horrorMatches.length) score += 4 + (horrorMatches.length - 1) * 2;
    const sourceMatches = getSelectedSources().filter((anchor) =>
      template.sourceAnchors.includes(anchor),
    );
    if (sourceMatches.length) score += 8 + (sourceMatches.length - 1) * 2;
    return score;
  }

  function pickLocationRegionTemplate(excludedTemplateIds = new Set()) {
    const available = getContextCompatibleRegionTemplates(excludedTemplateIds);
    if (!available.length) return null;
    const pool = available
      .sort((a, b) => scoreRegionTemplate(b) - scoreRegionTemplate(a))
      .slice(0, 6);
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  function addLocationRegion() {
    if (state.workflow !== "location") return;
    const used = new Set(
      getActiveLocationRegions().map((region) => region.templateId),
    );
    const template = pickLocationRegionTemplate(used);
    if (!template) {
      setStatus(
        `No context-fit region templates available for ${state.context}.`,
      );
      return;
    }
    state.locationRegions = [
      ...getActiveLocationRegions(),
      createLocationRegion(template),
    ];
    renderLocationRegions();
    refreshOutputIfOpen();
    setStatus(`Region added: ${template.name}.`);
  }

  function generateLocationRegions(count = 5) {
    if (state.workflow !== "location") return;
    const used = new Set();
    const regions = [];
    const compatibleCount = getContextCompatibleRegionTemplates().length;
    while (regions.length < count && used.size < compatibleCount) {
      const template = pickLocationRegionTemplate(used);
      if (!template) break;
      used.add(template.templateId);
      regions.push(createLocationRegion(template));
    }
    state.locationRegions = regions;
    renderLocationRegions();
    refreshOutputIfOpen();
    if (regions.length < count && state.context !== "Any")
      setStatus(
        `${regions.length} context-fit regions generated for ${state.context}. Add more templates for a full 5-room set.`,
      );
    else setStatus(`${regions.length}-region location generated.`);
  }

  function clearLocationRegions() {
    state.locationRegions = [];
    renderLocationRegions();
    refreshOutputIfOpen();
    setStatus("Location regions cleared.");
  }

  function removeLocationRegion(regionId) {
    state.locationRegions = getActiveLocationRegions().filter(
      (region) => region.id !== regionId,
    );
    renderLocationRegions();
    refreshOutputIfOpen();
    setStatus("Region removed.");
  }

  function regenerateLocationRegion(regionId) {
    const current = getActiveLocationRegions();
    const region = current.find((item) => item.id === regionId);
    if (!region) return;
    const used = new Set(
      current
        .filter((item) => item.id !== regionId)
        .map((item) => item.templateId),
    );
    const template = pickLocationRegionTemplate(used);
    if (!template) {
      setStatus(`No context-fit alternative available for ${state.context}.`);
      return;
    }
    state.locationRegions = current.map((item) =>
      item.id === regionId ? createLocationRegion(template) : item,
    );
    renderLocationRegions();
    refreshOutputIfOpen();
    setStatus(`Region regenerated: ${template.name}.`);
  }

  function getRegionIcon(role) {
    const text = String(role || "").toLowerCase();
    if (text.includes("entrance") || text.includes("threshold"))
      return "fa-door-open";
    if (text.includes("connector") || text.includes("loop")) return "fa-route";
    if (text.includes("hazard")) return "fa-triangle-exclamation";
    if (text.includes("clue") || text.includes("lore"))
      return "fa-magnifying-glass";
    if (text.includes("setpiece") || text.includes("main")) return "fa-dungeon";
    if (text.includes("ambush") || text.includes("nest")) return "fa-spider";
    if (text.includes("secret")) return "fa-key";
    return "fa-map-location-dot";
  }

  function handleSlotAction(button) {
    const action = button.dataset.action;
    const slotId = button.dataset.slot;
    if (!slotId) return;
    if (action === "select") selectSlot(slotId);
  }

  function startComponentDrag(event, componentId) {
    const component = COMPONENTS.find((item) => item.id === componentId);
    if (!component) return;
    state.dragComponentId = componentId;
    event.currentTarget.classList.add("dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copyMove";
      event.dataTransfer.setData("text/plain", componentId);
      event.dataTransfer.setData("application/x-cruor-component", componentId);
    }
    els.buildCanvas.classList.add("is-dragging-component");
    updateDropTargets(component);
    hideContextMenu();
  }

  function endComponentDrag(event) {
    event.currentTarget.classList.remove("dragging");
    clearComponentDragState();
  }

  function getDraggedComponent(event) {
    const id =
      state.dragComponentId ||
      event.dataTransfer.getData("application/x-cruor-component") ||
      event.dataTransfer.getData("text/plain") ||
      "";
    return COMPONENTS.find((item) => item.id === id) || null;
  }

  function attachSlotDropTarget(node, slotId, sensoryKind = "") {
    node.addEventListener("dragover", (event) =>
      handleSlotDragOver(event, slotId, sensoryKind),
    );
    node.addEventListener("dragenter", (event) =>
      handleSlotDragOver(event, slotId, sensoryKind),
    );
    node.addEventListener("dragleave", handleSlotDragLeave);
    node.addEventListener("drop", (event) =>
      handleSlotDrop(event, slotId, sensoryKind),
    );
  }

  function handleSlotDragOver(event, slotId, sensoryKind = "") {
    const component = getDraggedComponent(event);
    if (
      !component ||
      !isComponentCompatibleWithDropTarget(component, slotId, sensoryKind)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    event.currentTarget.classList.add("drop-target");
  }

  function handleSlotDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    event.currentTarget.classList.remove("drop-target");
  }

  function handleSlotDrop(event, slotId, sensoryKind = "") {
    const component = getDraggedComponent(event);
    if (
      !component ||
      !isComponentCompatibleWithDropTarget(component, slotId, sensoryKind)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const placed = placeComponentInSlot(component, slotId, sensoryKind);
    clearComponentDragState();
    if (!placed) {
      setStatus("This component cannot be placed in that slot.");
      return;
    }
    state.activeSlot = slotId;
    state.activeSensoryKind =
      slotId === "sensoryLayer"
        ? sensoryKind || component.sensoryKind || ""
        : "";
    state.expandedComponentId = "";
    setStatus(
      `Dropped “${component.title}” into ${getDropTargetLabel(slotId, sensoryKind)}.`,
    );
    renderBuildSlots();
    refreshNavigatorSelectionState();
    refreshOutputIfOpen();
  }

  function updateDropTargets(component) {
    els.buildSlots.querySelectorAll("[data-select-slot]").forEach((node) => {
      const compatible = isComponentCompatibleWithDropTarget(
        component,
        node.dataset.selectSlot,
      );
      node.classList.toggle("drop-compatible", compatible);
      node.classList.toggle("drop-incompatible", !compatible);
    });
    els.buildSlots
      .querySelectorAll("[data-select-sensory-kind]")
      .forEach((node) => {
        const compatible = isComponentCompatibleWithDropTarget(
          component,
          "sensoryLayer",
          node.dataset.selectSensoryKind,
        );
        node.classList.toggle("drop-compatible", compatible);
        node.classList.toggle("drop-incompatible", !compatible);
      });
  }

  function clearComponentDragState() {
    state.dragComponentId = "";
    els.buildCanvas.classList.remove("is-dragging-component");
    els.componentGrid
      .querySelectorAll(".component-card.dragging")
      .forEach((card) => card.classList.remove("dragging"));
    els.buildSlots
      .querySelectorAll(".drop-compatible, .drop-incompatible, .drop-target")
      .forEach((node) =>
        node.classList.remove(
          "drop-compatible",
          "drop-incompatible",
          "drop-target",
        ),
      );
  }

  function isComponentCompatibleWithDropTarget(
    component,
    slotId,
    sensoryKind = "",
  ) {
    if (!component || !slotId || !component.slots.includes(slotId))
      return false;
    if (slotId === "sensoryLayer" && sensoryKind)
      return Boolean(
        component.sensoryKind && component.sensoryKind === sensoryKind,
      );
    return true;
  }

  function getDropTargetLabel(slotId, sensoryKind = "") {
    if (slotId === "sensoryLayer" && sensoryKind)
      return `${sensoryKind} detail`;
    return (
      WORKFLOWS[state.workflow].slots.find((slot) => slot.id === slotId)
        .label || "slot"
    );
  }

  function placeComponentInSlot(component, slotId, sensoryKind = "") {
    const slot = WORKFLOWS[state.workflow].slots.find(
      (item) => item.id === slotId,
    );
    if (
      !slot ||
      !isComponentCompatibleWithDropTarget(component, slotId, sensoryKind)
    )
      return false;
    const assignedSlotId = findComponentAssignedSlot(component);
    if (assignedSlotId && assignedSlotId !== slotId) {
      state.build[assignedSlotId] = (state.build[assignedSlotId] || []).filter(
        (item) => item.id !== component.id,
      );
    }
    const current = (state.build[slotId] || []).filter(
      (item) => item.id !== component.id,
    );
    if (slotId === "sensoryLayer") {
      const kind = sensoryKind || component.sensoryKind || "";
      if (!kind || component.sensoryKind !== kind) return false;
      state.build[slotId] = [
        ...current.filter((item) => item.sensoryKind !== kind),
        component,
      ].slice(0, slot.max);
      return true;
    }
    if (slot.max === 1) {
      state.build[slotId] = [component];
      return true;
    }
    state.build[slotId] = [...current, component].slice(0, slot.max);
    return true;
  }

  function handleBuildCanvasEmptyClick(event) {
    if (!event.target.closest(".panel.build-canvas")) return;
    if (
      event.target.closest(
        ".build-slot, .sensory-subslot, .slot-item, button, input, textarea, select, details, summary, .canvas-actions, .build-head, .read-mode-toggle",
      )
    )
      return;
    clearActiveSlot();
  }

  function clearActiveSlot() {
    if (!state.activeSlot && !state.activeSensoryKind) return;
    state.activeSlot = "";
    state.activeSensoryKind = "";
    state.expandedComponentId = "";
    updateActiveSlotUi();
    renderNavigator();
  }

  function updateActiveSlotUi() {
    els.buildSlots.querySelectorAll(".build-slot").forEach((slotNode) => {
      const isActive = slotNode.dataset.selectSlot === state.activeSlot;
      slotNode.classList.toggle("active", isActive);
    });
    els.buildSlots
      .querySelectorAll(".sensory-subslot")
      .forEach((subslotNode) => {
        const isKindActive =
          state.activeSlot === "sensoryLayer" &&
          subslotNode.dataset.selectSensoryKind === state.activeSensoryKind;
        subslotNode.classList.toggle("active", isKindActive);
        subslotNode.setAttribute(
          "aria-pressed",
          isKindActive ? "true" : "false",
        );
      });
  }

  function selectSlot(slotId) {
    state.activeSlot = slotId;
    state.activeSensoryKind = "";
    state.expandedComponentId = "";
    updateActiveSlotUi();
    renderNavigator();
  }

  function selectSensoryKind(kind) {
    state.activeSlot = "sensoryLayer";
    state.activeSensoryKind = SENSORY_KINDS.includes(kind) ? kind : "";
    state.expandedComponentId = "";
    updateActiveSlotUi();
    renderNavigator();
  }

  function attachWorkbenchResize() {
    const resizer = els.workbenchResizer;
    const workbench = els.workbench;
    if (!resizer || !workbench) return;

    const applyNavigatorWidth = (width) => {
      const clamped = Math.max(300, Math.min(620, width));
      document.documentElement.style.setProperty(
        "--navigator-width",
        `${clamped}px`,
      );
      try {
        localStorage.setItem(
          CRUOR_COMPOSER_NAVIGATOR_WIDTH_KEY,
          String(clamped),
        );
      } catch (error) {}
    };

    let savedWidth = 0;
    try {
      savedWidth = Number(
        localStorage.getItem(CRUOR_COMPOSER_NAVIGATOR_WIDTH_KEY),
      );
    } catch (error) {}
    if (Number.isFinite(savedWidth) && savedWidth > 0)
      applyNavigatorWidth(savedWidth);

    const startResize = (event) => {
      event.preventDefault();
      resizer.classList.add("dragging");
      const bounds = workbench.getBoundingClientRect();
      const onMove = (moveEvent) => {
        const pointerX = moveEvent.clientX ?? moveEvent.touches?.[0]?.clientX;
        if (!Number.isFinite(pointerX)) return;
        applyNavigatorWidth(bounds.right - pointerX - 9);
      };
      const onUp = () => {
        resizer.classList.remove("dragging");
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    resizer.addEventListener("pointerdown", startResize);
    resizer.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const current =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--navigator-width",
          ),
        ) || 390;
      const delta = event.key === "ArrowLeft" ? 24 : -24;
      applyNavigatorWidth(current + delta);
    });
  }

  function filteredComponents(options = {}) {
    const slotId = options.slotId || state.activeSlot;
    const ignoreTag = options.ignoreTag || false;
    const ignoreSource = options.ignoreSource || false;
    return COMPONENTS.filter((component) => {
      if (!component.workflows.includes(state.workflow)) return false;
      if (slotId && !component.slots.includes(slotId)) return false;
      if (
        !options.ignoreSensoryKind &&
        slotId === "sensoryLayer" &&
        state.activeSensoryKind &&
        component.sensoryKind !== state.activeSensoryKind
      )
        return false;
      if (
        state.context !== "Any" &&
        !component.contexts.includes("Any") &&
        !component.contexts.includes(state.context)
      )
        return false;
      const selectedHorrors = getSelectedHorrors();
      if (
        selectedHorrors.length &&
        !component.horror.some((horror) => selectedHorrors.includes(horror))
      )
        return false;
      if (
        !ignoreSource &&
        state.sourceAnchors.size &&
        !component.sourceAnchors.some((anchor) =>
          state.sourceAnchors.has(anchor),
        )
      )
        return false;
      if (state.intrusion !== "Any" && component.intrusion !== state.intrusion)
        return false;
      if (
        !ignoreTag &&
        state.tags.size &&
        !component.horror.some((tag) => state.tags.has(tag))
      )
        return false;
      if (state.search) {
        const haystack = [
          component.title,
          component.type,
          component.summary,
          getComponentTableText(component, "compact"),
          getComponentTableText(component, "extended"),
          component.mechanics,
          component.narrative,
          ...component.contexts,
          ...component.horror,
          ...component.sourceAnchors,
          ...component.sourceTypes,
          ...component.themes,
          ...component.motifs,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(state.search)) return false;
      }
      return true;
    });
  }

  function renderInspirationImage(card) {
    if (!card.imageUrl) return "";
    return `<img src="${escapeHtml(card.imageUrl)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true; const icon=this.nextElementSibling; if(icon) icon.hidden=false;" />`;
  }

  function renderInspirations() {
    if (!els.inspirationsGrid) return;
    els.inspirationsGrid.innerHTML = INSPIRATION_CARDS.map((card) => {
      const details = SOURCE_DETAILS[card.anchor] || { motifs: [] };
      const count = COMPONENTS.filter((component) =>
        component.sourceAnchors.includes(card.anchor),
      ).length;
      const isActive = state.sourceAnchors.has(card.anchor);
      return `<article class="inspiration-card ${isActive ? "active" : ""}" data-inspiration-anchor="${escapeHtml(card.anchor)}" role="button" tabindex="0" aria-pressed="${isActive ? "true" : "false"}"><div class="inspiration-visual" role="img" aria-label="${escapeHtml(card.imageNote)}">${renderInspirationImage(card)}<i class="fa-solid ${escapeHtml(card.icon)}" aria-hidden="true" ${card.imageUrl ? "hidden" : ""}></i></div><div class="inspiration-body"><h3>${escapeHtml(card.anchor)}</h3><p>${escapeHtml(card.caption)}</p><div class="inspiration-meta">${details.motifs
        .slice(0, 5)
        .map((motif) => `<span>${escapeHtml(motif)}</span>`)
        .join(
          "",
        )}</div><div class="inspiration-count">${count} linked components</div></div></article>`;
    }).join("");
    els.inspirationsGrid
      .querySelectorAll("[data-inspiration-anchor]")
      .forEach((card) => {
        card.addEventListener("click", () =>
          openInspirationDetail(card.dataset.inspirationAnchor),
        );
        card.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          openInspirationDetail(card.dataset.inspirationAnchor);
        });
      });
  }

  function renderSourceSummary() {
    const selected = getSelectedSources();
    const label = formatSelectedSourcesLabel(selected);
    if (els.sourcePickerSummary) els.sourcePickerSummary.textContent = label;
    if (els.sourcePickerBtn) {
      els.sourcePickerBtn.classList.toggle("active", selected.length > 0);
      els.sourcePickerBtn.setAttribute(
        "aria-expanded",
        els.sourcePickerModal && !els.sourcePickerModal.hidden
          ? "true"
          : "false",
      );
      els.sourcePickerBtn.setAttribute(
        "aria-label",
        selected.length
          ? `Draw from: ${selected.join(", ")}`
          : "Draw from: Any Source",
      );
    }
  }

  function openSourcePicker() {
    els.sourcePickerModal.hidden = false;
    renderSourceSummary();
    renderSourcePicker();
    setTimeout(() => els.sourcePickerSearchInput.focus(), 0);
  }

  function closeSourcePicker() {
    if (!els.sourcePickerModal || els.sourcePickerModal.hidden) return;
    els.sourcePickerModal.hidden = true;
    renderSourceSummary();
  }

  function clearSourcePicker() {
    state.sourceAnchors.clear();
    state.sourcePickerSearch = "";
    state.sourceTypeFilter = "Any Type";
    state.sourceThemeFilter = "Any Theme";
    state.sourceTypeSearch = "";
    state.sourceThemeSearch = "";
    state.sourceFilterOpen = "";
    els.sourcePickerSearchInput.value = "";
    els.sourceTypeFilterSearch.value = "";
    els.sourceThemeFilterSearch.value = "";
    renderSourceFilterControls();
    state.tags.clear();
    renderSourceSummary();
    renderSourcePicker();
    renderNavigator();
    renderInspirations();
    refreshOutputIfOpen();
    setStatus("Inspirations cleared.");
  }

  function toggleSourceAnchor(anchor) {
    if (!SOURCE_DETAILS[anchor]) return;
    if (state.sourceAnchors.has(anchor)) state.sourceAnchors.delete(anchor);
    else state.sourceAnchors.add(anchor);
    state.tags.clear();
    renderSourceSummary();
    renderSourcePicker();
    renderNavigator();
    renderInspirations();
    refreshOutputIfOpen();
    const selected = getSelectedSources();
    setStatus(
      selected.length
        ? `Drawing from ${formatSourceList(selected)}.`
        : "Inspirations cleared.",
    );
  }

  function openInspirationDetail(anchor) {
    const details = SOURCE_DETAILS[anchor];
    const card = INSPIRATION_CARDS.find((item) => item.anchor === anchor);
    if (!details || !card) return;
    if (
      !els.inspirationDetailModal ||
      !els.inspirationDetailTitle ||
      !els.inspirationDetailType ||
      !els.inspirationDetailBody
    )
      return;
    const linked = COMPONENTS.filter((component) =>
      component.sourceAnchors.includes(anchor),
    );
    els.inspirationDetailTitle.textContent = anchor;
    els.inspirationDetailType.textContent = details.sourceType || "Inspiration";
    els.inspirationDetailBody.innerHTML = `
      <div class="inspiration-detail-visual" role="img" aria-label="${escapeHtml(card.imageNote)}">${renderInspirationImage(card)}<i class="fa-solid ${escapeHtml(card.icon)}" aria-hidden="true" ${card.imageUrl ? "hidden" : ""}></i></div>
      <div class="inspiration-detail-main">
        <section class="inspiration-detail-section"><h3>What It Is</h3><p>${escapeHtml(card.caption)}</p></section>
        <section class="inspiration-detail-section"><h3>Why It Disturbs</h3><p>${escapeHtml(details.logic || "This inspiration provides concrete images and pressures that can be transformed into playable horror components.")}</p></section>
        <section class="inspiration-detail-section"><h3>Cruor Themes</h3><div class="detail-chip-row">${(details.themes || []).map((theme) => `<span>${escapeHtml(theme)}</span>`).join("")}</div></section>
        <section class="inspiration-detail-section"><h3>Cruor Motifs</h3><div class="detail-chip-row">${(details.motifs || []).map((motif) => `<span>${escapeHtml(motif)}</span>`).join("")}</div></section>
        <section class="inspiration-detail-section"><h3>Linked Components</h3><div class="detail-component-list">${linked.map((component) => `<button type="button" data-detail-component="${escapeHtml(component.id)}"><span>${escapeHtml(displayTitle(component.title))}</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>`).join("")}</div></section>
        <section class="inspiration-detail-section"><h3>Use In Crucible</h3><button class="no-results-action" type="button" data-use-inspiration="${escapeHtml(anchor)}"><i class="fa-solid fa-fire-flame-curved" aria-hidden="true"></i>Use this inspiration</button></section>
      </div>
    `;
    els.inspirationDetailModal.hidden = false;
    els.inspirationDetailBody
      .querySelectorAll("[data-use-inspiration]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          if (!state.sourceAnchors.has(anchor)) state.sourceAnchors.add(anchor);
          closeInspirationDetail();
          renderSourceSummary();
          renderNavigator();
          renderInspirations();
          refreshOutputIfOpen();
          setStatus(`Drawing from ${anchor}.`);
        }),
      );
    els.inspirationDetailBody
      .querySelectorAll("[data-detail-component]")
      .forEach((button) =>
        button.addEventListener("click", () => {
          const component = COMPONENTS.find(
            (item) => item.id === button.dataset.detailComponent,
          );
          showLinkedComponent(component, anchor);
        }),
      );
  }

  function closeInspirationDetail() {
    if (!els.inspirationDetailModal || els.inspirationDetailModal.hidden)
      return;
    els.inspirationDetailModal.hidden = true;
  }

  function showLinkedComponent(component, anchor) {
    if (!component) return;
    state.workflow = component.workflows.includes(state.workflow)
      ? state.workflow
      : component.workflows[0];
    populateContexts();
    state.context = "Any";
    state.horror = "Any";
    state.intrusion = "Any";
    state.tags.clear();
    state.search = "";
    els.searchInput.value = "";
    if (SOURCE_DETAILS[anchor]) state.sourceAnchors.add(anchor);
    const workflow = WORKFLOWS[state.workflow];
    const firstCompatibleSlot = workflow.slots.find((slot) =>
      component.slots.includes(slot.id),
    );
    if (firstCompatibleSlot) state.activeSlot = firstCompatibleSlot.id;
    state.activeSensoryKind =
      state.activeSlot === "sensoryLayer" && component.sensoryKind
        ? component.sensoryKind
        : "";
    closeInspirationDetail();
    renderAll();
    const targetCard = Array.from(
      els.componentGrid.querySelectorAll("[data-component-card]"),
    ).find((card) => card.dataset.componentCard === component.id);
    if (targetCard) targetCard.focus();
    setStatus(`Showing “${component.title}”.`);
  }

  function renderSourcePicker() {
    if (!els.sourcePickerGrid) return;
    if (!els.sourcePickerGrid) return;
    if (els.sourcePickerSearchInput)
      els.sourcePickerSearchInput.value = state.sourcePickerSearch;
    renderSourceFilterControls();
    const selected = getSelectedSources();
    els.sourceSelectedChips.innerHTML = selected.length
      ? selected
          .map(
            (anchor) =>
              `<button class="source-chip-btn" type="button" data-remove-source="${escapeHtml(anchor)}">${escapeHtml(anchor)} <i class="fa-solid fa-xmark" aria-hidden="true"></i></button>`,
          )
          .join("")
      : '<span class="source-empty-chip">Any Source</span>';
    els.sourceSelectedChips
      .querySelectorAll("[data-remove-source]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          toggleSourceAnchor(button.dataset.removeSource),
        ),
      );

    const cards = INSPIRATION_CARDS.filter((card) => {
      const details = SOURCE_DETAILS[card.anchor] || {
        sourceType: "",
        themes: [],
        motifs: [],
      };
      if (
        state.sourceTypeFilter !== "Any Type" &&
        details.sourceType !== state.sourceTypeFilter
      )
        return false;
      if (
        state.sourceThemeFilter !== "Any Theme" &&
        !(details.themes || []).includes(state.sourceThemeFilter)
      )
        return false;
      if (state.sourcePickerSearch) {
        const haystack = [
          card.anchor,
          card.caption,
          details.sourceType,
          ...(details.themes || []),
          ...(details.motifs || []),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(state.sourcePickerSearch)) return false;
      }
      return true;
    });

    els.sourcePickerGrid.innerHTML = cards.length
      ? cards
          .map((card) => {
            const details = SOURCE_DETAILS[card.anchor] || { sourceType: "" };
            const isSelected = state.sourceAnchors.has(card.anchor);
            return `<button class="source-card ${isSelected ? "selected" : ""}" type="button" data-source-card="${escapeHtml(card.anchor)}" aria-pressed="${isSelected ? "true" : "false"}"><span class="source-card-visual">${renderInspirationImage(card)}<i class="fa-solid ${escapeHtml(card.icon)}" aria-hidden="true" ${card.imageUrl ? "hidden" : ""}></i></span><strong>${escapeHtml(card.anchor)}</strong><span>${escapeHtml(details.sourceType || "Source Anchor")}</span></button>`;
          })
          .join("")
      : '<div class="empty">No inspirations match these filters.</div>';
    els.sourcePickerGrid
      .querySelectorAll("[data-source-card]")
      .forEach((card) =>
        card.addEventListener("click", () =>
          toggleSourceAnchor(card.dataset.sourceCard),
        ),
      );
  }

  function renderSourceFilterControls() {
    renderSourceFilterControl({
      kind: "type",
      allValues: SOURCE_TYPES,
      activeValue: state.sourceTypeFilter,
      searchValue: state.sourceTypeSearch,
      button: els.sourceTypeFilterBtn,
      valueNode: els.sourceTypeFilterValue,
      panel: els.sourceTypeFilterPanel,
      searchInput: els.sourceTypeFilterSearch,
      list: els.sourceTypeFilterList,
      emptyLabel: "Any Type",
      onSelect: (value) => {
        state.sourceTypeFilter = value;
        state.sourceTypeSearch = "";
        state.sourceFilterOpen = "";
        renderSourceFilterControls();
        renderSourcePicker();
      },
    });
    renderSourceFilterControl({
      kind: "theme",
      allValues: ["Any Theme", ...THEMES],
      activeValue: state.sourceThemeFilter,
      searchValue: state.sourceThemeSearch,
      button: els.sourceThemeFilterBtn,
      valueNode: els.sourceThemeFilterValue,
      panel: els.sourceThemeFilterPanel,
      searchInput: els.sourceThemeFilterSearch,
      list: els.sourceThemeFilterList,
      emptyLabel: "Any Theme",
      onSelect: (value) => {
        state.sourceThemeFilter = value;
        state.sourceThemeSearch = "";
        state.sourceFilterOpen = "";
        renderSourceFilterControls();
        renderSourcePicker();
      },
    });
  }

  function renderSourceFilterControl(config) {
    if (!config.button || !config.panel || !config.list) return;
    const isOpen = state.sourceFilterOpen === config.kind;
    config.valueNode.textContent = config.activeValue;
    config.button.classList.toggle(
      "active",
      isOpen || config.activeValue !== config.emptyLabel,
    );
    config.button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    config.panel.hidden = !isOpen;
    if (config.searchInput) config.searchInput.value = config.searchValue;
    const query = String(config.searchValue || "").toLowerCase();
    const values = config.allValues.filter(
      (value) => !query || value.toLowerCase().includes(query),
    );
    config.list.innerHTML = values.length
      ? values
          .map(
            (value) =>
              `<button class="filter-combobox__option ${value === config.activeValue ? "active" : ""}" type="button" role="option" aria-selected="${value === config.activeValue ? "true" : "false"}" data-filter-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`,
          )
          .join("")
      : '<div class="empty">No matches.</div>';
    config.list.querySelectorAll("[data-filter-value]").forEach((button) =>
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        config.onSelect(button.dataset.filterValue);
      }),
    );
  }

  function toggleSourceFilterPanel(kind) {
    state.sourceFilterOpen = state.sourceFilterOpen === kind ? "" : kind;
    renderSourceFilterControls();
    const input =
      kind === "type"
        ? els.sourceTypeFilterSearch
        : els.sourceThemeFilterSearch;
    if (state.sourceFilterOpen === kind) setTimeout(() => input.focus(), 0);
  }

  function closeSourceFilterPanels() {
    if (!state.sourceFilterOpen) return;
    state.sourceFilterOpen = "";
    renderSourceFilterControls();
  }

  function getSelectedSources() {
    return Array.from(state.sourceAnchors).filter((anchor) =>
      SOURCE_ANCHORS.includes(anchor),
    );
  }

  function formatSourceList(sources) {
    return sources.length ? sources.join(", ") : "Any Source";
  }

  function formatHorrorList(horrors) {
    return horrors.length ? horrors.join(", ") : "Any horror";
  }

  function formatSelectedSourcesLabel(sources) {
    if (!sources.length) return "Any Source";
    if (sources.length === 1) return sources[0];
    if (sources.length === 2) return `${sources[0]} + 1`;
    return `${sources[0]} + ${sources.length - 1}`;
  }

  function renderNavigator() {
    const slot = getActiveSlot();
    renderTagFilters();
    const components = filteredComponents();
    els.navigatorTitle.textContent = slot
      ? `Choose ${slot.id === "sensoryLayer" && state.activeSensoryKind ? state.activeSensoryKind : slot.label}`
      : "Choose a component";
    els.navigatorMeta.textContent = `${components.length} compatible component${components.length === 1 ? "" : "s"} for ${WORKFLOWS[state.workflow].label}.`;
    els.navigatorCount.textContent = components.length;
    if (!components.length) {
      els.componentGrid.innerHTML = renderNoResultsActions();
      const clearButton = els.componentGrid.querySelector(
        "[data-clear-navigator-filters]",
      );
      const ignoreSourceButton = els.componentGrid.querySelector(
        "[data-ignore-source-filter]",
      );
      const ignoreIntrusionButton = els.componentGrid.querySelector(
        "[data-ignore-intrusion-filter]",
      );
      if (clearButton)
        clearButton.addEventListener("click", clearNavigatorFilters);
      if (ignoreSourceButton)
        ignoreSourceButton.addEventListener("click", ignoreSourceFilter);
      if (ignoreIntrusionButton)
        ignoreIntrusionButton.addEventListener("click", ignoreIntrusionFilter);
      hydrateIconButtonTooltips(els.componentGrid);
      return;
    }
    els.componentGrid.innerHTML = components
      .map((component) => renderComponentCard(component))
      .join("");
    els.componentGrid
      .querySelectorAll("[data-component-card]")
      .forEach((card) => {
        card.addEventListener("click", (event) => {
          if (event.target.closest("[data-component-toggle]")) return;
          event.stopPropagation();
          toggleExpandedComponentCard(card.dataset.componentCard);
        });
        card.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (event.target.closest("[data-component-toggle]")) return;
          event.preventDefault();
          toggleExpandedComponentCard(card.dataset.componentCard);
        });
        card.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          openComponentContextMenu(event, card.dataset.componentCard);
        });
        card.addEventListener("dragstart", (event) =>
          startComponentDrag(event, card.dataset.componentCard),
        );
        card.addEventListener("dragend", endComponentDrag);
      });
    els.componentGrid
      .querySelectorAll("[data-component-toggle]")
      .forEach((button) =>
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleComponentForActiveSlot(
            COMPONENTS.find(
              (item) => item.id === button.dataset.componentToggle,
            ),
          );
        }),
      );
    hydrateIconButtonTooltips(els.componentGrid);
  }

  function renderTagFilters() {
    const baseComponents = filteredComponents({ ignoreTag: true });
    const tags = Array.from(
      new Set(baseComponents.flatMap((component) => component.horror)),
    ).sort();
    Array.from(state.tags).forEach((tag) => {
      if (!tags.includes(tag)) state.tags.delete(tag);
    });
    const activeCount = getNavigatorFilterCount();
    els.tagFilterBtn.hidden = false;
    els.tagFilterBtn.classList.toggle(
      "active",
      activeCount > 0 || state.tagMenuOpen,
    );
    els.tagFilterBtn.setAttribute(
      "aria-expanded",
      state.tagMenuOpen ? "true" : "false",
    );
    els.tagFilterBtn.dataset.activeCount = String(activeCount);
    els.tagFilterBtn.removeAttribute("title");
    els.tagFilterBtn.setAttribute("data-key", "tooltip-generic");
    els.tagFilterBtn.setAttribute(
      "data-tooltip",
      activeCount
        ? `Component filters: ${activeCount} active`
        : "Component filters",
    );
    els.tagFilterRow.hidden = !state.tagMenuOpen;
    els.tagFilterRow.innerHTML = `<div class="tag-filter-row__head"><span>Component Filters</span><button class="tag-clear-btn" type="button" data-clear-tag-filters>Clear</button></div><div class="navigator-filter-panel"><section class="navigator-filter-section"><strong>Start From</strong><div class="filter-chip-grid">${WORKFLOWS[state.workflow].contexts.map((value) => renderNavigatorFilterChip("context", value, state.context === value)).join("")}</div></section><section class="navigator-filter-section"><strong>Turn Toward</strong><div class="filter-chip-grid">${HORROR_TYPES.map((value) => renderNavigatorFilterChip("horror", value, isHorrorSelected(value))).join("")}</div></section><section class="navigator-filter-section"><strong>Draw From</strong><div class="filter-chip-grid source-filter">${["Any Source", ...INSPIRATION_CARDS.map((card) => card.anchor)].map((value) => renderNavigatorFilterChip("source", value, value === "Any Source" ? !state.sourceAnchors.size : state.sourceAnchors.has(value))).join("")}</div></section><section class="navigator-filter-section"><strong>Hit With</strong><div class="filter-chip-grid">${INTRUSION_LEVELS.map((value) => renderNavigatorFilterChip("intrusion", value, state.intrusion === value)).join("")}</div></section>${tags.length ? `<section class="navigator-filter-section"><strong>Additional Themes</strong><div class="filter-chip-grid">${tags.map((tag) => renderNavigatorFilterChip("tag", tag, state.tags.has(tag))).join("")}</div></section>` : ""}</div>`;
    const clearButton = els.tagFilterRow.querySelector(
      "[data-clear-tag-filters]",
    );
    if (clearButton)
      clearButton.addEventListener("click", (event) => {
        event.stopPropagation();
        clearNavigatorFilters();
        state.tagMenuOpen = true;
        renderTagFilters();
      });
    els.tagFilterRow
      .querySelectorAll("[data-navigator-filter]")
      .forEach((button) =>
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          handleNavigatorFilterClick(
            button.dataset.navigatorFilter,
            button.dataset.filterValue,
          );
        }),
      );
  }

  function renderNavigatorFilterChip(kind, value, active) {
    return `<button class="navigator-filter-chip ${active ? "active" : ""}" type="button" data-navigator-filter="${kind}" data-filter-value="${escapeHtml(value)}" aria-pressed="${active ? "true" : "false"}">${escapeHtml(value)}</button>`;
  }

  function handleNavigatorFilterClick(kind, value) {
    if (kind === "context") state.context = value;
    if (kind === "horror") {
      toggleHorrorSelection(value);
      state.tags.clear();
    }
    if (kind === "source") {
      if (value === "Any Source") state.sourceAnchors.clear();
      else if (state.sourceAnchors.has(value))
        state.sourceAnchors.delete(value);
      else state.sourceAnchors.add(value);
      state.tags.clear();
    }
    if (kind === "intrusion") state.intrusion = value;
    if (kind === "tag") {
      if (state.tags.has(value)) state.tags.delete(value);
      else state.tags.add(value);
    }
    renderBriefSummary();
    renderSourceSummary();
    renderNavigator();
    renderInspirations();
    refreshOutputIfOpen();
  }

  function getNavigatorFilterCount() {
    let count = 0;
    if (state.context !== "Any") count += 1;
    count += getSelectedHorrors().length;
    if (state.sourceAnchors.size) count += state.sourceAnchors.size;
    if (state.intrusion !== "Any") count += 1;
    count += state.tags.size;
    return count;
  }

  function renderNoResultsActions() {
    const canIgnoreSource = state.sourceAnchors.size > 0;
    const canIgnoreIntrusion = state.intrusion !== "Any";
    return `<div class="empty">No components match this slot and filters.<div class="no-results-actions"><button class="no-results-action" type="button" data-clear-navigator-filters><i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>Clear all</button>${canIgnoreSource ? '<button class="no-results-action" type="button" data-ignore-source-filter><i class="fa-solid fa-eye-slash" aria-hidden="true"></i>Ignore inspiration</button>' : ""}${canIgnoreIntrusion ? '<button class="no-results-action" type="button" data-ignore-intrusion-filter><i class="fa-solid fa-gauge-simple" aria-hidden="true"></i>Ignore intensity</button>' : ""}</div></div>`;
  }

  function ignoreSourceFilter() {
    state.sourceAnchors.clear();
    renderSourceSummary();
    renderNavigator();
    renderInspirations();
    refreshOutputIfOpen();
    setStatus("Inspiration filter ignored.");
  }

  function ignoreIntrusionFilter() {
    state.intrusion = "Any";
    renderBriefControls();
    renderNavigator();
    refreshOutputIfOpen();
    setStatus("Intensity filter ignored.");
  }

  function clearNavigatorFilters() {
    state.context = "Any";
    state.horror = "Any";
    state.horrors.clear();
    state.sourceAnchors.clear();
    state.sourcePickerSearch = "";
    state.sourceTypeFilter = "Any Type";
    state.sourceThemeFilter = "Any Theme";
    state.intrusion = "Any";
    state.tags.clear();
    state.tagMenuOpen = false;
    state.search = "";
    els.searchInput.value = "";
    populateContexts();
    renderAll();
    setStatus("Navigator filters cleared.");
  }

  function renderComponentCard(component) {
    const isInBuild = isComponentSelectedInActiveSlot(component.id);
    const isExpanded = state.expandedComponentId === component.id;
    const actionLabel = getComponentActionLabel(component);
    const uiTitle = displayTitle(component.title);
    const sensoryBadge = component.sensoryKind
      ? `<span class="component-sensory-kind" title="${escapeHtml(component.sensoryKind)}" aria-label="${escapeHtml(component.sensoryKind)} detail"><i class="fa-solid ${escapeHtml(getSensoryKindIcon(component.sensoryKind))}" aria-hidden="true"></i><span>${escapeHtml(component.sensoryKind)}</span></span>`
      : "";
    const matchReasons = getMatchReasons(component);
    const toggleIcon = isInBuild ? "fa-minus" : "fa-plus";
    return `<article class="component-card ${isInBuild ? "in-build" : ""} ${isExpanded ? "expanded" : ""}" data-component-card="${component.id}" draggable="true" role="button" tabindex="0" aria-expanded="${isExpanded ? "true" : "false"}" title="Open details" aria-label="${escapeHtml(`${uiTitle}. Open details.`)}"><button class="component-toggle-btn" type="button" data-component-toggle="${component.id}" title="${escapeHtml(actionLabel)}" aria-label="${escapeHtml(actionLabel)}"><i class="fa-solid ${toggleIcon}" aria-hidden="true"></i></button><div class="card-top"><h3>${escapeHtml(uiTitle)}</h3>${sensoryBadge}</div><p class="summary">${escapeHtml(component.summary)}</p>${matchReasons.length ? `<div class="match-row" aria-label="Match reasons">${matchReasons.map((reason) => `<span class="match-chip">${escapeHtml(reason)}</span>`).join("")}</div>` : ""}${renderComponentMetaList(component)}</article>`;
  }

  function renderComponentMetaList(component) {
    const rows = [
      {
        label:
          component.sourceAnchors.length === 1 ? "Inspiration" : "Inspirations",
        values: component.sourceAnchors.length
          ? component.sourceAnchors
          : ["Unanchored"],
        className: "source-chip",
      },
      {
        label: component.horror.length === 1 ? "Theme" : "Themes",
        values: component.horror.slice(0, 3),
        className: "strong-chip",
      },
      {
        label: component.motifs.length === 1 ? "Motif" : "Motifs",
        values: component.motifs.slice(0, 4),
        className: "",
        format: "title",
      },
      { label: "Intensity", values: [component.intrusion], className: "" },
      { label: "Prep", values: [component.prep], className: "" },
    ].filter((row) => row.values && row.values.length);
    return `<div class="meta-list" aria-label="Component metadata">${rows.map((row) => `<div class="meta-row"><span class="meta-label">${escapeHtml(row.label)}</span><span class="meta-values">${row.values.map((value) => `<span class="meta-value ${row.className}">${escapeHtml(formatMetaValue(value, row.format))}</span>`).join("")}</span></div>`).join("")}</div>`;
  }

  function formatMetaValue(value, format) {
    const text = String(value || "");
    if (format !== "title") return text;
    return formatManualTitle(text);
  }

  function formatManualTitle(value) {
    const text = String(value || "")
      .trim()
      .split(" ")
      .filter(Boolean)
      .join(" ");
    if (!text) return "";
    const minorWords = new Set([
      "a",
      "an",
      "and",
      "as",
      "at",
      "but",
      "by",
      "for",
      "from",
      "in",
      "into",
      "nor",
      "of",
      "on",
      "or",
      "over",
      "per",
      "the",
      "to",
      "under",
      "vs",
      "with",
    ]);
    const words = text.toLowerCase().split(" ");
    return words
      .map((word, index) => {
        if (index > 0 && index < words.length - 1 && minorWords.has(word))
          return word;
        return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
      })
      .join(" ");
  }

  function getMatchReasons(component) {
    const reasons = [];
    if (state.context !== "Any" && component.contexts.includes(state.context))
      reasons.push(state.context);
    getSelectedHorrors()
      .filter((horror) => component.horror.includes(horror))
      .slice(0, 2)
      .forEach((horror) => reasons.push(horror));
    const sourceMatches = getSelectedSources().filter((anchor) =>
      component.sourceAnchors.includes(anchor),
    );
    sourceMatches.slice(0, 2).forEach((anchor) => reasons.push(anchor));
    if (state.intrusion !== "Any" && component.intrusion === state.intrusion)
      reasons.push(`${state.intrusion} intensity`);
    Array.from(state.tags)
      .filter((tag) => component.horror.includes(tag))
      .slice(0, 2)
      .forEach((tag) => reasons.push(tag));
    if (
      state.activeSlot === "sensoryLayer" &&
      state.activeSensoryKind &&
      component.sensoryKind === state.activeSensoryKind
    )
      reasons.push(component.sensoryKind);
    return Array.from(new Set(reasons)).slice(0, 4);
  }

  function toggleComponentForActiveSlot(component) {
    if (!component) return;
    const assignedSlotId = findComponentAssignedSlot(component);
    if (assignedSlotId) {
      state.build[assignedSlotId] = (state.build[assignedSlotId] || []).filter(
        (item) => item.id !== component.id,
      );
      setStatus(`Removed “${component.title}”.`);
    } else {
      const slot = resolveComponentTargetSlot(component);
      if (!slot) {
        setStatus("No compatible slot available for this component.");
        return;
      }
      const placed = placeComponentInSlot(
        component,
        slot.id,
        component.sensoryKind || "",
      );
      if (!placed) {
        setStatus("No compatible slot available for this component.");
        return;
      }
      if (slot.id === "sensoryLayer" && component.sensoryKind)
        setStatus(`Selected ${component.sensoryKind}: “${component.title}”.`);
      else if (slot.max === 1)
        setStatus(`Selected “${component.title}” for ${slot.label}.`);
      else setStatus(`Added “${component.title}” to ${slot.label}.`);
    }
    state.expandedComponentId = "";
    renderBuildSlots();
    refreshNavigatorSelectionState();
    refreshOutputIfOpen();
  }

  function resolveComponentTargetSlot(component) {
    if (!component) return null;
    const workflowSlots = WORKFLOWS[state.workflow].slots;
    const compatibleSlots = workflowSlots.filter((slot) =>
      component.slots.includes(slot.id),
    );
    if (!compatibleSlots.length) return null;
    if (state.activeSlot) {
      const activeCompatibleSlot = compatibleSlots.find(
        (slot) => slot.id === state.activeSlot,
      );
      if (activeCompatibleSlot) return activeCompatibleSlot;
    }
    if (component.sensoryKind) {
      const sensorySlot = compatibleSlots.find(
        (slot) => slot.id === "sensoryLayer",
      );
      if (sensorySlot) return sensorySlot;
    }
    return compatibleSlots[0];
  }

  function findComponentAssignedSlot(component) {
    if (!component) return "";
    const workflowSlots = WORKFLOWS[state.workflow].slots;
    const assignedSlot = workflowSlots.find(
      (slot) =>
        component.slots.includes(slot.id) &&
        (state.build[slot.id] || []).some((item) => item.id === component.id),
    );
    return assignedSlot ? assignedSlot.id : "";
  }

  function toggleExpandedComponentCard(componentId) {
    state.expandedComponentId =
      state.expandedComponentId === componentId ? "" : componentId;
    refreshNavigatorSelectionState();
  }

  function clearExpandedComponentCard() {
    if (!state.expandedComponentId) return;
    state.expandedComponentId = "";
    refreshNavigatorSelectionState();
  }

  function refreshNavigatorSelectionState() {
    els.componentGrid
      .querySelectorAll("[data-component-card]")
      .forEach((card) => {
        const component = COMPONENTS.find(
          (item) => item.id === card.dataset.componentCard,
        );
        if (!component) return;
        const selected = isComponentSelectedInActiveSlot(component.id);
        const expanded = state.expandedComponentId === component.id;
        const actionLabel = getComponentActionLabel(component);
        const uiTitle = displayTitle(component.title);
        card.classList.toggle("in-build", selected);
        card.classList.toggle("expanded", expanded);
        card.setAttribute("aria-expanded", expanded ? "true" : "false");
        card.title = "Open details";
        card.setAttribute("aria-label", `${uiTitle}. Open details.`);
        const toggleButton = card.querySelector("[data-component-toggle]");
        if (toggleButton) {
          toggleButton.removeAttribute("title");
          toggleButton.setAttribute("aria-label", actionLabel);
          toggleButton.setAttribute("data-key", "tooltip-generic");
          toggleButton.setAttribute("data-tooltip", actionLabel);
          toggleButton.innerHTML = `<i class="fa-solid ${selected ? "fa-minus" : "fa-plus"}" aria-hidden="true"></i>`;
        }
      });
    hydrateIconButtonTooltips(els.componentGrid);
  }

  function getComponentActionLabel(component) {
    const isSelected = isComponentSelectedInActiveSlot(component.id);
    const targetSlot = resolveComponentTargetSlot(component);
    const current = targetSlot ? state.build[targetSlot.id] || [] : [];
    if (isSelected) return "Remove component";
    if (
      targetSlot.id === "sensoryLayer" &&
      component.sensoryKind &&
      current.some((item) => item.sensoryKind === component.sensoryKind)
    )
      return `Replace current ${component.sensoryKind.toLowerCase()} detail`;
    if (targetSlot.max === 1 && current.length)
      return `Replace ${targetSlot.label}`;
    return targetSlot ? `Add to ${targetSlot.label}` : "Add component";
  }

  function isComponentSelectedInActiveSlot(componentId) {
    const component = COMPONENTS.find((item) => item.id === componentId);
    if (!component) return false;
    return Boolean(findComponentAssignedSlot(component));
  }

  function openContextMenu(event, slotId, componentId) {
    const slot = WORKFLOWS[state.workflow].slots.find(
      (item) => item.id === slotId,
    );
    const items = state.build[slotId] || [];
    if (!slot || !items.length) return;
    const isLocked = state.lockedSlots.has(slotId);
    const replaceLabel = slot.max === 1 ? "Replace" : "Add More";
    const destructiveAction = componentId
      ? `<button type="button" data-menu-action="remove" data-slot="${slotId}" data-id="${componentId}"><i class="fa-solid fa-xmark" aria-hidden="true"></i>Remove Item</button>`
      : `<button type="button" data-menu-action="clear" data-slot="${slotId}"><i class="fa-solid fa-trash" aria-hidden="true"></i>Clear Slot</button>`;
    showContextMenu(
      event,
      `<button type="button" data-menu-action="select" data-slot="${slotId}"><i class="fa-solid ${slot.max === 1 ? "fa-right-left" : "fa-plus"}" aria-hidden="true"></i>${replaceLabel}</button><button type="button" data-menu-action="regenerate" data-slot="${slotId}"><i class="fa-solid fa-rotate" aria-hidden="true"></i>Regenerate Slot</button><button type="button" data-menu-action="lock" data-slot="${slotId}"><i class="fa-solid ${isLocked ? "fa-lock-open" : "fa-lock"}" aria-hidden="true"></i>${isLocked ? "Unlock Slot" : "Lock Slot"}</button>${destructiveAction}`,
    );
  }

  function openComponentContextMenu(event, componentId) {
    const component = COMPONENTS.find((item) => item.id === componentId);
    if (!component) return;
    const isInBuild = isComponentSelectedInActiveSlot(component.id);
    const isExpanded = state.expandedComponentId === component.id;
    const actionLabel = getComponentActionLabel(component);
    const actionIcon = isInBuild
      ? "fa-minus"
      : actionLabel.startsWith("Replace")
        ? "fa-right-left"
        : "fa-plus";
    const detailLabel = isExpanded ? "Collapse Details" : "Expand Details";
    const detailIcon = isExpanded ? "fa-compress" : "fa-expand";
    showContextMenu(
      event,
      `<button type="button" data-menu-action="component-toggle" data-id="${component.id}"><i class="fa-solid ${actionIcon}" aria-hidden="true"></i>${escapeHtml(actionLabel)}</button><button type="button" data-menu-action="component-expand" data-id="${component.id}"><i class="fa-solid ${detailIcon}" aria-hidden="true"></i>${detailLabel}</button>`,
    );
  }

  function showContextMenu(event, html) {
    els.contextMenu.innerHTML = html;
    els.contextMenu.hidden = false;
    const menuRect = els.contextMenu.getBoundingClientRect();
    const left = Math.min(
      event.clientX,
      window.innerWidth - menuRect.width - 12,
    );
    const top = Math.min(
      event.clientY,
      window.innerHeight - menuRect.height - 12,
    );
    els.contextMenu.style.left = `${Math.max(12, left)}px`;
    els.contextMenu.style.top = `${Math.max(12, top)}px`;
    els.contextMenu.querySelectorAll("[data-menu-action]").forEach((button) =>
      button.addEventListener("click", () => {
        handleContextMenuAction(button);
        hideContextMenu();
      }),
    );
  }

  function handleContextMenuAction(button) {
    const action = button.dataset.menuAction;
    const slotId = button.dataset.slot;
    if (action === "select") selectSlot(slotId);
    if (action === "regenerate") regenerateSlot(slotId);
    if (action === "lock") toggleSlotLock(slotId);
    if (action === "remove") removeComponent(slotId, button.dataset.id);
    if (action === "clear") clearSlot(slotId);
    if (action === "component-toggle")
      toggleComponentForActiveSlot(
        COMPONENTS.find((item) => item.id === button.dataset.id),
      );
    if (action === "component-expand")
      toggleExpandedComponentCard(button.dataset.id);
  }

  function toggleSlotLock(slotId) {
    if (state.lockedSlots.has(slotId)) {
      state.lockedSlots.delete(slotId);
      setStatus("Slot unlocked.");
    } else {
      state.lockedSlots.add(slotId);
      setStatus("Slot locked. Quick Build will not replace it.");
    }
    renderBuildSlots();
    refreshOutputIfOpen();
  }

  function removeComponent(slotId, componentId) {
    state.build[slotId] = (state.build[slotId] || []).filter(
      (item) => item.id !== componentId,
    );
    setStatus("Component removed.");
    renderBuildSlots();
    renderNavigator();
    refreshOutputIfOpen();
  }

  function clearSlot(slotId) {
    state.build[slotId] = [];
    setStatus("Slot cleared.");
    renderBuildSlots();
    renderNavigator();
    refreshOutputIfOpen();
  }

  function hideContextMenu() {
    if (els.contextMenu) els.contextMenu.hidden = true;
  }

  function getWorkflowIcon(workflowId) {
    const icons = {
      location: "fa-map-location-dot",
      encounter: "fa-skull",
      reward: "fa-gem",
      clue: "fa-magnifying-glass",
    };
    return icons[workflowId] || "fa-diamond";
  }

  function getSlotIcon(slotId) {
    const icons = {
      horrorPremise: "fa-map",
      sensoryLayer: "fa-ear-listen",
      visibleAnomaly: "fa-eye",
      hazard: "fa-triangle-exclamation",
      clue: "fa-magnifying-glass",
      encounterTwist: "fa-skull",
      reward: "fa-gem",
      creatureCorruption: "fa-dna",
      openingSign: "fa-door-open",
      combatTwist: "fa-bolt",
      bossPhase: "fa-mask",
      lairEffect: "fa-dungeon",
      deathEffect: "fa-skull-crossbones",
      rewardType: "fa-gift",
      power: "fa-hand-fist",
      cost: "fa-droplet",
      temptation: "fa-hand-holding-heart",
      visibleSign: "fa-eye",
      escalation: "fa-arrow-trend-up",
      removal: "fa-ban",
      clueForm: "fa-scroll",
      reveal: "fa-eye-low-vision",
      disturbance: "fa-face-dizzy",
      falseReading: "fa-masks-theater",
      mechanicalCheck: "fa-dice-d20",
      followUp: "fa-shoe-prints",
    };
    return icons[slotId] || "fa-diamond";
  }

  function pickUniqueForSlot(slot, candidates) {
    const chosen = [];
    const usedSensoryKinds = new Set();
    for (const item of candidates) {
      if (slot.id === "sensoryLayer" && item.sensoryKind) {
        if (usedSensoryKinds.has(item.sensoryKind)) continue;
        usedSensoryKinds.add(item.sensoryKind);
      }
      chosen.push(item);
      if (chosen.length >= slot.max) break;
    }
    return chosen;
  }

  function regenerateSlot(slotId) {
    if (state.lockedSlots.has(slotId)) {
      setStatus("Unlock this slot before regenerating it.");
      return;
    }
    const slot = WORKFLOWS[state.workflow].slots.find(
      (item) => item.id === slotId,
    );
    const previousActiveSlot = state.activeSlot;
    state.activeSlot = slotId;
    const candidates = filteredComponents({ ignoreSensoryKind: true }).filter(
      (candidate) =>
        !(state.build[slotId] || []).some((item) => item.id === candidate.id),
    );
    state.activeSlot = previousActiveSlot;
    if (!slot || !candidates.length) {
      setStatus("No alternative component available for this slot.");
      return;
    }
    const sorted = [...candidates].sort(
      (a, b) => scoreComponent(b) - scoreComponent(a),
    );
    state.build[slotId] = pickUniqueForSlot(slot, sorted);
    setStatus(`${slot.label} regenerated.`);
    renderBuildSlots();
    renderNavigator();
    refreshOutputIfOpen();
  }

  function quickBuild(randomize) {
    const slots = WORKFLOWS[state.workflow].slots;
    slots.forEach((slot) => {
      if (state.lockedSlots.has(slot.id)) return;
      const previousActiveSlot = state.activeSlot;
      state.activeSlot = slot.id;
      const candidates = filteredComponents({ ignoreSensoryKind: true });
      state.activeSlot = previousActiveSlot;
      if (!candidates.length) return;
      const sorted = [...candidates].sort(
        (a, b) => scoreComponent(b) - scoreComponent(a),
      );
      const pool = randomize
        ? sorted.slice(0, Math.min(sorted.length, 6))
        : sorted;
      const chosen = [];
      const count = Math.min(
        slot.max,
        randomize && slot.max > 1
          ? Math.ceil(Math.random() * slot.max)
          : slot.max,
      );
      while (chosen.length < count && pool.length) {
        const index = randomize ? Math.floor(Math.random() * pool.length) : 0;
        const [item] = pool.splice(index, 1);
        if (
          slot.id === "sensoryLayer" &&
          item.sensoryKind &&
          chosen.some((existing) => existing.sensoryKind === item.sensoryKind)
        )
          continue;
        chosen.push(item);
      }
      state.build[slot.id] = chosen;
    });
    setStatus(
      randomize
        ? "Unlocked slots randomized."
        : "The Crucible has been filled. Locked slots preserved.",
    );
    renderBuildSlots();
    renderNavigator();
    if (state.view !== "compose") renderCurrentView();
  }

  function clearBuild() {
    resetBuildForWorkflow();
    els.compiledOutput.value = "";
    if (els.compiledView) els.compiledView.innerHTML = "";
    state.view = "compose";
    setStatus("Build cleared.");
    renderAll();
  }

  function scoreComponent(component) {
    let score = 0;
    if (state.context !== "Any" && component.contexts.includes(state.context))
      score += 4;
    const matchedHorrors = getSelectedHorrors().filter((horror) =>
      component.horror.includes(horror),
    );
    if (matchedHorrors.length) score += 4 + (matchedHorrors.length - 1) * 2;
    if (state.tags.size && component.horror.some((tag) => state.tags.has(tag)))
      score += 3;
    const matchedSources = getSelectedSources().filter((anchor) =>
      component.sourceAnchors.includes(anchor),
    );
    if (matchedSources.length) score += 8 + (matchedSources.length - 1) * 2;
    if (state.intrusion !== "Any" && component.intrusion === state.intrusion)
      score += 2;
    if (component.intrusion === "Low") score += 1;
    if (component.prep === "Instant") score += 1;
    return score;
  }

  function showView(view) {
    state.view = view;
    renderCurrentView();
  }

  function showCompiledView() {
    const output = compileBuild({ silent: true });
    if (!output) {
      setStatus("Add at least one component before compiling.");
      return;
    }
    state.view = "compiled";
    renderCurrentView();
    setStatus("Build compiled.");
  }

  function toggleExportView() {
    if (state.view === "export") {
      state.view =
        els.compiledView && els.compiledView.innerHTML.trim()
          ? "compiled"
          : "compose";
    } else {
      const output = compileBuild({ silent: true });
      if (!output) {
        setStatus("Add at least one component before exporting.");
        return;
      }
      state.view = "export";
    }
    renderCurrentView();
  }

  function renderCurrentView() {
    if (els.exportBtn)
      els.exportBtn.classList.toggle("active", state.view === "export");
    if (els.compileBtn)
      els.compileBtn.classList.toggle("active", state.view === "compiled");
    els.composeView.hidden = state.view !== "compose";
    els.compiledView.hidden = state.view !== "compiled";
    els.exportView.hidden = state.view !== "export";
    if (state.view === "compiled") {
      const output = compileBuild({ silent: true });
      els.compiledView.innerHTML = output
        ? renderCompiledPreview()
        : '<div class="empty">Add at least one component before compiling.</div>';
    }
    if (state.view === "export") compileBuild({ silent: true });
  }

  function compileBuild(options = {}) {
    const title =
      els.buildTitleInput.value.trim() ||
      WORKFLOWS[state.workflow].defaultTitle;
    const workflow = WORKFLOWS[state.workflow];
    const slots = workflow.slots;
    const compiledEntries = getCompiledEntries(slots);
    const allItems = compiledEntries.map((entry) => entry.item);
    const NL = String.fromCharCode(10);
    const BLANK = NL + NL;
    if (!allItems.length && !getActiveLocationRegions().length) {
      els.compiledOutput.value = "";
      if (!options.silent)
        setStatus("Add at least one component before compiling.");
      return "";
    }

    const contextText =
      state.context === "Any"
        ? "any compatible context"
        : `a ${state.context.toLowerCase()}`;
    const selectedHorrors = getSelectedHorrors();
    const horrorText = selectedHorrors.length
      ? formatHorrorList(selectedHorrors).toLowerCase()
      : "dark fantasy horror";
    const intrusionText =
      state.intrusion === "Any"
        ? "low-to-medium intrusion"
        : `${state.intrusion.toLowerCase()} intrusion`;
    const selectedSources = getSelectedSources();
    const sourceText = formatSourceList(selectedSources);
    const sourcePhrase = selectedSources.length
      ? `, drawing from ${formatSourceList(selectedSources)}`
      : "";
    const readAloud = buildOpeningReadAloud(compiledEntries);
    const mechanics = allItems
      .filter((item) => item.mechanics)
      .map((item) => `- ${item.title}: ${item.mechanics}`)
      .join(NL);
    const dropInUse = buildDropInUse(workflow, slots);
    const textSections = buildCompiledMarkdownTextSections(
      compiledEntries,
      NL,
      BLANK,
    );
    const slotSections = buildCompiledMarkdownSlotSections(slots, NL, BLANK);
    const regionSections = buildCompiledMarkdownRegionSections(NL, BLANK);

    const outputSections = [
      `# ${title}`,
      `## Use This When${NL}Use this when you need to ${workflow.label.toLowerCase()} in ${contextText}, with ${horrorText}${sourcePhrase}, and ${intrusionText}. It is designed to modify material the DM already has, not replace the current plot, map, villain, or objective.`,
      `## Opening Read-Aloud${NL}${readAloud || "No opening read-aloud text selected."}`,
      textSections,
      slotSections,
      regionSections,
      `## Mechanics${NL}${mechanics || "No mechanical payload selected."}`,
      `## Drop-In Use${NL}${dropInUse}`,
      `## At the Table${NL}**Need.** ${workflow.label}${NL}**Context.** ${state.context}${NL}**Horror.** ${getHorrorSummaryLabel()}${NL}**Source Anchors.** ${sourceText}${NL}**Intrusion.** ${state.intrusion}${NL}**Selected Components.** ${allItems.length}`,
    ].filter(Boolean);
    const output = outputSections.join(BLANK);
    els.compiledOutput.value = output;
    if (!options.silent) setStatus("Build compiled.");
    return output;
  }

  function getCompiledEntries(slots) {
    return slots.flatMap((slot) =>
      (state.build[slot.id] || []).map((item) => ({ slot, item })),
    );
  }

  function getTextValue(value, mode = state.readAloudMode) {
    if (!value) return "";
    if (typeof value === "object")
      return String(
        value[mode] || value.extended || value.compact || "",
      ).trim();
    return String(value).trim();
  }

  function getComponentTableText(item, mode = state.readAloudMode) {
    return getTextValue(item.tableText, mode) || item.summary || "";
  }

  function getTextBlockText(block, mode = state.readAloudMode) {
    return getTextValue(block.text || block, mode);
  }

  function normalizeTextBlocks(entry) {
    const item = entry.item;
    if (Array.isArray(item.textBlocks) && item.textBlocks.length) {
      return item.textBlocks.map((block) => ({
        role: block.role || "initial",
        trigger: block.trigger || "",
        label: block.label || item.title,
        text: block.text || block,
        audience: block.audience || "players",
        item,
        slot: entry.slot,
      }));
    }
    return [
      {
        role: getDefaultTextRole(entry),
        trigger: getDefaultTrigger(entry),
        label: item.sensoryKind || entry.slot.label || item.title,
        text: item.tableText || item.summary,
        audience: "players",
        item,
        slot: entry.slot,
      },
    ];
  }

  function getDefaultTextRole(entry) {
    const slotId = entry.slot.id;
    if (
      [
        "horrorPremise",
        "sensoryLayer",
        "visibleAnomaly",
        "openingSign",
        "creatureCorruption",
      ].includes(slotId)
    )
      return "initial";
    if (
      [
        "hazard",
        "encounterTwist",
        "combatTwist",
        "bossPhase",
        "lairEffect",
        "deathEffect",
        "followUp",
        "escalation",
      ].includes(slotId)
    )
      return "triggered";
    if (
      [
        "clue",
        "clueForm",
        "reveal",
        "disturbance",
        "falseReading",
        "mechanicalCheck",
      ].includes(slotId)
    )
      return "investigation";
    if (
      [
        "reward",
        "rewardType",
        "power",
        "cost",
        "temptation",
        "visibleSign",
        "removal",
      ].includes(slotId)
    )
      return "consequence";
    return "gm";
  }

  function getDefaultTrigger(entry) {
    const slotId = entry.slot.id;
    if (slotId === "hazard") return "When the danger is triggered";
    if (slotId === "encounterTwist" || slotId === "combatTwist")
      return "When combat starts or the scene turns violent";
    if (slotId === "bossPhase") return "When the boss escalates";
    if (slotId === "lairEffect")
      return "At initiative count 20 or when the lair asserts itself";
    if (slotId === "deathEffect") return "When the creature dies";
    if (
      slotId === "clue" ||
      slotId === "clueForm" ||
      slotId === "reveal" ||
      slotId === "disturbance"
    )
      return "When the party investigates the evidence";
    if (slotId === "reward")
      return "When the scene resolves or the object is claimed";
    return "";
  }

  function getTextBlocksByRole(entries) {
    return entries.flatMap(normalizeTextBlocks).reduce((groups, block) => {
      const role = block.role || "gm";
      groups[role] = groups[role] || [];
      groups[role].push(block);
      return groups;
    }, {});
  }

  function buildOpeningReadAloud(entries) {
    const initialBlocks = getTextBlocksByRole(entries).initial || [];
    return initialBlocks
      .map((block) => getTextBlockText(block))
      .filter(Boolean)
      .join(" ");
  }

  function buildCompiledMarkdownTextSections(entries, NL, BLANK) {
    const groups = getTextBlocksByRole(entries);
    const sections = [];
    const renderBlocks = (blocks) =>
      blocks
        .map((block) => {
          const text = getTextBlockText(block);
          if (!text) return null;
          const trigger = block.trigger ? `**${block.trigger}.** ` : "";
          return `${trigger}${text}`;
        })
        .filter(Boolean)
        .join(NL);
    if (groups.triggered.length)
      sections.push(`## Triggered Text${NL}${renderBlocks(groups.triggered)}`);
    if (groups.investigation.length)
      sections.push(
        `## Investigation / Reveals${NL}${renderBlocks(groups.investigation)}`,
      );
    if (groups.consequence.length)
      sections.push(
        `## Consequences / Rewards${NL}${renderBlocks(groups.consequence)}`,
      );
    const gmNotes = entries
      .map((entry) =>
        entry.item.narrative
          ? `**${entry.item.title}.** ${entry.item.narrative}`
          : null,
      )
      .filter(Boolean);
    if (gmNotes.length) sections.push(`## GM Notes${NL}${gmNotes.join(NL)}`);
    return sections.join(BLANK);
  }

  function renderCompiledTextSections(entries) {
    const groups = getTextBlocksByRole(entries);
    const sections = [];
    const renderBlocks = (blocks) =>
      blocks
        .map((block) => {
          const text = getTextBlockText(block);
          if (!text) return "";
          return `<article class="compiled-text-block">${block.trigger ? `<span class="compiled-trigger">${escapeHtml(block.trigger)}</span>` : ""}<p>${escapeHtml(text)}</p></article>`;
        })
        .join("");
    if (groups.triggered.length)
      sections.push(
        `<section class="compiled-section"><h2>Triggered Text</h2><div class="compiled-stack">${renderBlocks(groups.triggered)}</div></section>`,
      );
    if (groups.investigation.length)
      sections.push(
        `<section class="compiled-section"><h2>Investigation / Reveals</h2><div class="compiled-stack">${renderBlocks(groups.investigation)}</div></section>`,
      );
    if (groups.consequence.length)
      sections.push(
        `<section class="compiled-section"><h2>Consequences / Rewards</h2><div class="compiled-stack">${renderBlocks(groups.consequence)}</div></section>`,
      );
    const gmNotes = entries
      .filter((entry) => entry.item.narrative)
      .map(
        (entry) =>
          `<article class="compiled-text-block"><span class="compiled-trigger">${escapeHtml(displayTitle(entry.item.title))}</span><p>${escapeHtml(entry.item.narrative)}</p></article>`,
      )
      .join("");
    if (gmNotes)
      sections.push(
        `<section class="compiled-section"><h2>GM Notes</h2><div class="compiled-stack">${gmNotes}</div></section>`,
      );
    return sections.join("");
  }

  function buildCompiledMarkdownRegionSections(NL, BLANK) {
    const regions = getActiveLocationRegions();
    if (!regions.length) return "";
    const regionText = regions
      .map((region, index) => {
        const readAloud = getTextValue(region.readAloud) || region.feature;
        return `### ${index + 1}. ${region.name}${NL}**Function.** ${region.role} · ${region.shape} · ${region.size} · ${region.connectors} connection${region.connectors === 1 ? "" : "s"} · ${region.density}.${NL}**Read-Aloud.** ${readAloud}${NL}**Feature.** ${region.feature}${NL}**Interaction.** ${region.interaction}${NL}**Danger.** ${region.danger}${NL}**Secret.** ${region.secret}${NL}**Reward.** ${region.reward}${NL}**Map Tags.** ${(region.links || []).join(", ") || "none"}`;
      })
      .join(BLANK);
    return `## Exploration Regions${NL}${regionText}`;
  }

  function renderCompiledRegionSections() {
    const regions = getActiveLocationRegions();
    if (!regions.length) return "";
    return `<section class="compiled-section"><h2>Exploration Regions</h2><div class="compiled-region-grid">${regions.map((region, index) => `<article class="compiled-region"><strong>${index + 1}. ${escapeHtml(region.name)}</strong><p><span class="compiled-label">Function</span>${escapeHtml(region.role)} · ${escapeHtml(region.shape)} · ${escapeHtml(region.size)} · ${region.connectors} link${region.connectors === 1 ? "" : "s"} · ${escapeHtml(region.density)}</p><p><span class="compiled-label">Read-Aloud</span>${escapeHtml(getTextValue(region.readAloud) || region.feature)}</p><p><span class="compiled-label">Feature</span>${escapeHtml(region.feature)}</p><p><span class="compiled-label">Interaction</span>${escapeHtml(region.interaction)}</p><p><span class="compiled-label">Danger / Secret</span>${escapeHtml(region.danger)} ${escapeHtml(region.secret)}</p></article>`).join("")}</div></section>`;
  }

  function buildCompiledMarkdownSlotSections(slots, NL, BLANK) {
    return slots
      .map((slot) => {
        const items = state.build[slot.id] || [];
        if (!items.length) return null;
        if (slot.id === "sensoryLayer") {
          const lines = SENSORY_KINDS.map((kind) => {
            const item = items.find((entry) => entry.sensoryKind === kind);
            return item ? `**${kind}.** ${getComponentTableText(item)}` : null;
          }).filter(Boolean);
          return lines.length
            ? `## Sensory Details${NL}${lines.join(NL)}`
            : null;
        }
        return `## ${slot.label}${NL}${items.map((item) => `**${item.title}.** ${item.summary}`).join(NL)}`;
      })
      .filter(Boolean)
      .join(BLANK);
  }

  function buildReadAloud(items) {
    return items
      .map((item) => getComponentTableText(item))
      .filter(Boolean)
      .slice(0, 5)
      .join(" ");
  }

  function buildDropInUse(workflow, slots) {
    if (state.workflow === "location") {
      const has = (slotId) => (state.build[slotId] || []).length > 0;
      const parts = [];
      if (has("horrorPremise"))
        parts.push(
          "Use the Premise as the location’s core identity, not as a new plot.",
        );
      if (has("sensoryLayer"))
        parts.push(
          "Read the sensory details when the party enters, pauses, or investigates.",
        );
      if (has("visibleAnomaly"))
        parts.push(
          "Show the visible anomaly before players understand what it means.",
        );
      if (has("hazard"))
        parts.push(
          "Trigger the Hazard when players touch, disturb, spill blood, make noise, or cross the wrong threshold.",
        );
      if (has("clue"))
        parts.push("Use the Clue to help players make a concrete decision.");
      if (has("encounterTwist"))
        parts.push(
          "Apply the Encounter Twist only if a fight already happens here.",
        );
      if (has("reward"))
        parts.push(
          "Use the Outcome as what remains after the scene: reward, cost, mark, or consequence.",
        );
      return parts.length
        ? parts.join(" ")
        : "Attach the selected components to rooms, clues, enemies, or rewards already present in the session.";
    }
    return "Attach the selected components to the DM’s existing material as omens, complications, clues, rewards, or consequences. Do not replace the current objective unless the table wants a larger detour.";
  }

  function renderCompiledPreview() {
    const title =
      els.buildTitleInput.value.trim?.() ||
      WORKFLOWS[state.workflow].defaultTitle;
    const workflow = WORKFLOWS[state.workflow];
    const slots = workflow.slots;
    const compiledEntries = getCompiledEntries(slots);
    const allItems = compiledEntries.map((entry) => entry.item);
    if (!allItems.length && !getActiveLocationRegions().length)
      return '<div class="empty">Add at least one component or region before compiling.</div>';
    const readAloud = buildOpeningReadAloud(compiledEntries);
    const tableTextSections = renderCompiledTextSections(compiledEntries);
    const contextText = state.context === "Any" ? "Any context" : state.context;
    const selectedHorrors = getSelectedHorrors();
    const horrorText = selectedHorrors.length
      ? formatHorrorList(selectedHorrors)
      : "Dark fantasy horror";
    const selectedSources = getSelectedSources();
    const sourceText = selectedSources.length
      ? formatSourceList(selectedSources)
      : "Any source";
    const intrusionText =
      state.intrusion === "Any" ? "Low-to-medium" : state.intrusion;
    const sourcePhrase = selectedSources.length
      ? `, drawing from ${formatSourceList(selectedSources)}`
      : "";
    const slotSections = renderCompiledSlotSections(slots);
    const regionSections = renderCompiledRegionSections();
    const mechanicCards =
      allItems
        .filter((item) => item.mechanics)
        .map(
          (item) =>
            `<div class="compiled-mechanic"><strong>${escapeHtml(displayTitle(item.title))}</strong><p>${escapeHtml(item.mechanics)}</p></div>`,
        )
        .join("") ||
      '<div class="compiled-note"><p>No mechanical payload selected.</p></div>';
    const dropInUse = buildDropInUse(workflow, slots);
    return `<article class="compiled-sheet">
      <header class="compiled-hero"><p class="compiled-kicker">${escapeHtml(workflow.label)}</p><h1 class="compiled-title">${escapeHtml(title)}</h1></header>
      <section class="compiled-meta-grid" aria-label="Build metadata">
        <div class="compiled-meta-item"><span class="compiled-label">Start from</span><span class="compiled-value">${escapeHtml(contextText)}</span></div>
        <div class="compiled-meta-item"><span class="compiled-label">Turn toward</span><span class="compiled-value">${escapeHtml(horrorText)}</span></div>
        <div class="compiled-meta-item"><span class="compiled-label">Draw from</span><span class="compiled-value">${escapeHtml(sourceText)}</span></div>
        <div class="compiled-meta-item"><span class="compiled-label">Hit with</span><span class="compiled-value">${escapeHtml(intrusionText)}</span></div>
      </section>
      <section class="compiled-section"><h2>Use This When</h2><p>Use this when you need to ${escapeHtml(workflow.label.toLowerCase())} with ${escapeHtml(horrorText.toLowerCase())}${escapeHtml(sourcePhrase)} and ${escapeHtml(intrusionText.toLowerCase())}, without replacing the current plot, map, villain, or objective.</p></section>
      <section class="compiled-section"><h2>Opening Read-Aloud</h2><div class="read-aloud-box">${escapeHtml(readAloud || "No opening read-aloud text selected yet.")}</div><p class="compiled-mode-note">Mode: ${escapeHtml(state.readAloudMode === "extended" ? "Extended" : "Compact")}</p></section>
      ${tableTextSections}
      ${slotSections}
      ${regionSections}
      <section class="compiled-section"><h2>Mechanics</h2><div class="compiled-stack">${mechanicCards}</div></section>
      <section class="compiled-section"><h2>Drop-In Use</h2><div class="compiled-note"><p>${escapeHtml(dropInUse)}</p></div></section>
      <section class="compiled-section"><h2>At the Table</h2><div class="compiled-table-list"><div class="compiled-note"><span class="compiled-label">Need</span><p>${escapeHtml(workflow.label)}</p></div><div class="compiled-note"><span class="compiled-label">Selected Components</span><p>${allItems.length}</p></div></div></section>
    </article>`;
  }

  function renderCompiledSlotSections(slots) {
    return slots
      .map((slot) => {
        const items = state.build[slot.id] || [];
        if (!items.length) return "";
        if (slot.id === "sensoryLayer")
          return renderCompiledSensorySection(items);
        return `<section class="compiled-section"><h2>${escapeHtml(slot.label)}</h2><div class="compiled-component-grid">${items.map((item) => renderCompiledComponentCard(item)).join("")}</div></section>`;
      })
      .join("");
  }

  function renderCompiledSensorySection(items) {
    const cards = SENSORY_KINDS.map((kind) => {
      const item = items.find((entry) => entry.sensoryKind === kind);
      if (!item) return "";
      return `<article class="compiled-component"><span class="compiled-label"><i class="fa-solid ${escapeHtml(getSensoryKindIcon(kind))}" aria-hidden="true"></i> ${escapeHtml(kind)}</span><strong>${escapeHtml(displayTitle(item.title))}</strong><p>${escapeHtml(getComponentTableText(item))}</p></article>`;
    }).join("");
    return `<section class="compiled-section"><h2>Sensory Details</h2><div class="compiled-component-grid">${cards}</div></section>`;
  }

  function renderCompiledComponentCard(item) {
    return `<article class="compiled-component"><strong>${escapeHtml(displayTitle(item.title))}</strong><p>${escapeHtml(item.summary)}</p></article>`;
  }

  function refreshOutputIfOpen() {
    if (state.view !== "compose") renderCurrentView();
  }

  async function copyCompiled() {
    const output = compileBuild({ silent: true });
    if (!output) {
      setStatus("Add at least one component before copying.");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setStatus("Compiled build copied.");
    } catch (error) {
      els.compiledOutput.value = output;
      els.compiledOutput.select();
      document.execCommand("copy");
      setStatus("Compiled build selected/copied.");
    }
  }

  function openSavedBuildsModal() {
    if (!els.savedBuildsModal) return;
    renderSavedBuilds();
    els.savedBuildsModal.hidden = false;
  }

  function closeSavedBuildsModal() {
    if (!els.savedBuildsModal || els.savedBuildsModal.hidden) return;
    els.savedBuildsModal.hidden = true;
  }

  function saveBuild() {
    const output = compileBuild({ silent: true });
    if (!output) {
      setStatus("Add at least one component before saving.");
      return;
    }
    const saves = getSavedBuilds();
    const save = {
      id: `build-${Date.now()}`,
      title:
        els.buildTitleInput.value.trim() ||
        WORKFLOWS[state.workflow].defaultTitle,
      workflow: state.workflow,
      context: state.context,
      horror: getHorrorSummaryLabel(),
      horrors: getSelectedHorrors(),
      tags: Array.from(state.tags),
      sourceAnchors: getSelectedSources(),
      readAloudMode: state.readAloudMode,
      intrusion: state.intrusion,
      activeSlot: state.activeSlot,
      activeSensoryKind: state.activeSensoryKind,
      build: Object.fromEntries(
        Object.entries(state.build).map(([slotId, items]) => [
          slotId,
          items.map((item) => item.id),
        ]),
      ),
      lockedSlots: Array.from(state.lockedSlots),
      locationRegions: getActiveLocationRegions(),
      output,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(
        CRUOR_COMPOSER_SAVES_KEY,
        JSON.stringify([save, ...saves].slice(0, 12)),
      );
      renderSavedBuilds();
      setStatus("Build saved locally.");
    } catch (error) {
      setStatus("Could not save locally. Browser storage may be unavailable.");
    }
  }

  function getSavedBuilds() {
    try {
      return JSON.parse(localStorage.getItem(CRUOR_COMPOSER_SAVES_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function renderSavedBuilds() {
    const saves = getSavedBuilds();
    if (!saves.length) {
      els.savedList.innerHTML = '<div class="empty">No saved builds yet.</div>';
      return;
    }
    els.savedList.innerHTML = saves
      .map((save) => {
        const workflowLabel =
          WORKFLOWS[save.workflow]?.label ||
          save.workflow ||
          "Unknown workflow";
        return `<div class="saved-item"><div><strong>${escapeHtml(save.title)}</strong><span>${escapeHtml(workflowLabel)} \u00B7 ${escapeHtml(save.context)} \u00B7 ${escapeHtml(save.horror)} \u00B7 ${escapeHtml(formatSaveSources(save))}</span></div><button class="btn small ghost" type="button" data-load-save="${save.id}">Load</button></div>`;
      })
      .join("");
    els.savedList
      .querySelectorAll("[data-load-save]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          loadSavedBuild(button.dataset.loadSave),
        ),
      );
  }

  function formatSaveSources(save) {
    const sources = Array.isArray(save.sourceAnchors)
      ? save.sourceAnchors
      : save.sourceAnchor && save.sourceAnchor !== "Any Source"
        ? [save.sourceAnchor]
        : [];
    return sources.length ? formatSelectedSourcesLabel(sources) : "Any Source";
  }

  function loadSavedBuild(saveId) {
    const save = getSavedBuilds().find((item) => item.id === saveId);
    if (!save) return;
    if (!WORKFLOWS[save.workflow]) {
      setStatus("Saved build uses an unavailable workflow.");
      return;
    }
    state.workflow = save.workflow;
    state.context = save.context || "Any";
    setHorrorSelection(
      Array.isArray(save.horrors) && save.horrors.length
        ? save.horrors
        : HORROR_TYPES.includes(save.horror)
          ? [save.horror]
          : [],
    );
    state.tags = new Set(save.tags || []);
    state.sourceAnchors = new Set(
      (Array.isArray(save.sourceAnchors)
        ? save.sourceAnchors
        : save.sourceAnchor && save.sourceAnchor !== "Any Source"
          ? [save.sourceAnchor]
          : []
      ).filter((anchor) => SOURCE_ANCHORS.includes(anchor)),
    );
    state.readAloudMode =
      save.readAloudMode === "extended" ? "extended" : "compact";
    state.intrusion = INTRUSION_LEVELS.includes(save.intrusion)
      ? save.intrusion
      : "Any";
    populateContexts();
    resetBuildForWorkflow();
    const workflowSlots = WORKFLOWS[state.workflow].slots;
    state.activeSlot = workflowSlots.some((slot) => slot.id === save.activeSlot)
      ? save.activeSlot
      : workflowSlots[0].id;
    state.activeSensoryKind = SENSORY_KINDS.includes(save.activeSensoryKind)
      ? save.activeSensoryKind
      : "";
    state.lockedSlots = new Set(save.lockedSlots || []);
    state.locationRegions = sanitizeLocationRegions(save.locationRegions || []);
    Object.entries(migrateSavedBuildSlots(save.build || {})).forEach(
      ([slotId, ids]) => {
        state.build[slotId] = ids
          .map((id) => COMPONENTS.find((component) => component.id === id))
          .filter(Boolean);
      },
    );
    els.buildTitleInput.value = save.title;
    els.compiledOutput.value = save.output || "";
    renderAll();
    closeSavedBuildsModal();
    setStatus("Saved build loaded.");
  }

  function migrateSavedBuildSlots(build) {
    const slotMap = {
      skin: "horrorPremise",
      sensory: "sensoryLayer",
      visual: "visibleAnomaly",
    };
    return Object.entries(build || {}).reduce((result, [slotId, ids]) => {
      const nextSlotId = slotMap[slotId] || slotId;
      result[nextSlotId] = [
        ...(result[nextSlotId] || []),
        ...(Array.isArray(ids) ? ids : []),
      ];
      return result;
    }, {});
  }

  function getActiveSlot() {
    return (
      WORKFLOWS[state.workflow].slots.find(
        (slot) => slot.id === state.activeSlot,
      ) || null
    );
  }

  function getSlotDescription(slotId) {
    return (
      SLOT_DESCRIPTIONS[slotId] || "components that fit this part of the build."
    );
  }

  function getSensoryKindDescription(kind) {
    const descriptions = {
      Sound: "Choose an audible detail for the scene.",
      Smell: "Choose an odor or taste-like impression in the air.",
      Touch: "Choose a physical sensation, temperature, pressure, or texture.",
    };
    return descriptions[kind] || "a sensory detail.";
  }

  function getSensoryKindIcon(kind) {
    const icons = {
      Sound: "fa-ear-listen",
      Smell: "fa-wind",
      Touch: "fa-hand",
    };
    return icons[kind] || "fa-diamond";
  }

  function setStatus(message) {
    els.status.textContent = message;
    clearTimeout(setStatus._timer);
    setStatus._timer = setTimeout(() => {
      els.status.textContent = "";
    }, 2800);
  }

  function markdownToHtml(markdown) {
    const lines = escapeHtml(markdown).split(String.fromCharCode(10));
    return lines
      .map((line) => {
        if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith("- "))
          return `<p>• ${formatInline(line.slice(2))}</p>`;
        if (!line.trim()) return "";
        return `<p>${formatInline(line)}</p>`;
      })
      .join("");
  }

  function formatInline(text) {
    return text.replace(
      /\*\*(.*)\*\*/g,
      (match, content) => `<strong>${content}</strong>`,
    );
  }

  function displayTitle(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  try {
    if (onSnapshotProviderReady)
      onSnapshotProviderReady(createDarkenLocationSnapshot);
    init();
  } finally {
    document.addEventListener = originalDocumentAddEventListener;
    window.addEventListener = originalWindowAddEventListener;
  }

  return function cleanupCrucibleDomApp() {
    if (onSnapshotProviderReady) onSnapshotProviderReady(null);
    if (transitionBriefWizardTo._timer)
      clearTimeout(transitionBriefWizardTo._timer);
    if (setStatus._timer) clearTimeout(setStatus._timer);
    trackedGlobalListeners.forEach(([target, type, listener, options]) => {
      target.removeEventListener(type, listener, options);
    });
    trackedGlobalListeners.length = 0;
    if (rootElement && "innerHTML" in rootElement) rootElement.innerHTML = "";
  };
}
