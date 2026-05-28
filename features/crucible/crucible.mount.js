import { getCrucibleTemplate } from './crucible.template.js';
import { startCrucibleDomApp } from './crucible.events.js';

export function mountCrucible(rootElement, options = {}) {
  if (!rootElement) throw new Error('mountCrucible requires a root element.');
  rootElement.innerHTML = getCrucibleTemplate();
  return startCrucibleDomApp(rootElement, options);
}
