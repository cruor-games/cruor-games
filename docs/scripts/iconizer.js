/*v1.5 2025-08-20T16:18:11.616Z*/

// ─── Iconizer global ───
let iconizerReplacements = null;

// Carica i dati JSON una volta sola
async function loadIconizerData() {
  if (!iconizerReplacements) {
    try {
      const res = await fetch("/data/iconizer.json");
      iconizerReplacements = await res.json();
    } catch (err) {
      console.error("Iconizer error loading JSON:", err);
      iconizerReplacements = {};
    }
  }
  return iconizerReplacements;
}

// Funzione riutilizzabile: sostituisce le span.iconize nel container passato
function runIconizer(container = document) {
  if (!iconizerReplacements) return;

  const keys = Object.keys(iconizerReplacements).map(escapeRegex);
  if (!keys.length) return;
  const pattern = new RegExp(`\\b(${keys.join("|")})\\b`, "g");

  container.querySelectorAll("span.iconize").forEach((span) => {
    span.innerHTML = span.innerHTML.replace(pattern, (match) => {
      const rep = iconizerReplacements[match];
      if (!rep) return match;
      // aggiunge data-icon-key per tooltip
      return `<img src="${rep.img}" alt="${rep.title}" class="iconized-text" data-icon-key="${match}">`;
    });
  });

  // inizializza i tooltip custom sugli iconized
  initializeIconizerTooltips(container);
}

// ─── Escape regex helper ───
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Inizializzazione automatica al DOMContentLoaded ───
document.addEventListener("DOMContentLoaded", async () => {
  await loadIconizerData();
  runIconizer(); // esegue su tutto il documento
});

// ─── Nuova funzione per tooltips di Iconizer ───
async function initializeIconizerTooltips(container = document) {
  const iconizerData = await loadIconizerData();
  if (!iconizerData) return;

  const iconizedElements = container.querySelectorAll("span.iconize img.iconized-text");
  if (!iconizedElements.length) return;

  const { tooltip, icon, title, description, header } = createTooltipBox();
  icon.style.display = "";
  title.style.display = "";

  let hideTooltipTimeout = null;

  iconizedElements.forEach((img) => {
    const key = img.dataset.iconKey; // impostato durante il runIconizer
    const data = iconizerData[key];
    if (!data) return;

    img.addEventListener("mouseenter", () => {
      if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);

      img.classList.add("active-tooltip");

      title.textContent = data.title;       // testo del tooltip
      description.innerHTML = data.description || ""; // puoi aggiungere un campo "description" se vuoi

      // inserisce l'icona del tooltip stessa immagine
      icon.innerHTML = `<img src="${data.img}" alt="${data.title}" class="tooltip-icon-img">`;

      const rect = img.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      tooltip.style.left = rect.left + scrollLeft + "px";
      tooltip.style.top = rect.bottom + scrollTop + 10 + "px";
      tooltip.classList.add("visible");
      tooltip.style.pointerEvents = "auto";
      tooltip.style.background = "#222";  // sfondo diverso
      tooltip.style.color = "#FFD700";    // testo dorato
      tooltip.style.border = "none";
      tooltip.style.borderRadius = "2px";
      title.style.fontSize = ".8rem";
      title.style.textTransform ="capitalize";
      tooltip.classList.add("no-before");
      header.style.borderBottom = "none";
      header.style.margin = "0 0 0 26px";
      icon.style.width = "26px";
      icon.style.height = "18px";
    });

    img.addEventListener("mouseleave", () => {
      hideTooltipTimeout = setTimeout(() => {
        img.classList.remove("active-tooltip");
        tooltip.classList.remove("visible");
        tooltip.style.pointerEvents = "none";
      }, 150);
    });
  });

  tooltip.addEventListener("mouseenter", () => {
    if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
  });

  tooltip.addEventListener("mouseleave", () => {
    tooltip.classList.remove("visible");
    tooltip.style.pointerEvents = "none";
    document.querySelector(".active-tooltip")?.classList.remove("active-tooltip");
  });
}