import { getCrucibleTemplate } from "./crucible.template.js";
import { startCrucibleDomApp } from "./crucible.events.js";

function applyCrucibleUiModeMarkers(rootElement) {
  const advancedSelectors = [
    ".brief-control-grid",
    "#clearBriefBtn",
    "#randomBuildBtn",
    "#savedBuildsBtn",
    "#clearBuildBtn",
    "#readModeToggle",
    "#workbenchResizer",
    "#tagFilterBtn",
    "#exportBtn",
    "#saveBtn",
    '[data-filter-combobox="type"]',
    '[data-filter-combobox="theme"]',
  ];

  const debugSelectors = [];

  advancedSelectors.forEach((selector) => {
    rootElement.querySelectorAll(selector).forEach((element) => {
      element.setAttribute("data-ui-mode-advanced-only", "");
      element.setAttribute("data-crucible-advanced-only", "");
    });
  });

  debugSelectors.forEach((selector) => {
    rootElement.querySelectorAll(selector).forEach((element) => {
      element.setAttribute("data-ui-mode-debug-only", "");
      element.setAttribute("data-crucible-debug-only", "");
    });
  });
}


export function mountCrucible(rootElement, options = {}) {
  if (!rootElement) throw new Error("mountCrucible requires a root element.");
  rootElement.innerHTML = getCrucibleTemplate();
  applyCrucibleUiModeMarkers(rootElement);
  return startCrucibleDomApp(rootElement, options);
}
