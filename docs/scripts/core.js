/*v2.39 2025-08-28T20:05:28.342Z*/

// ─── Globals ───
let tooltipDefinitions = {};
let tagDefinitions = {};
let categoryColors = {};

window.applyTagIcons = function () {
  document.querySelectorAll(".tag").forEach((tag) => {
    const tagName = tag.textContent.trim();
    const tagData = tagDefinitions[tagName];
    if (tagData?.icon) {
      tag.style.setProperty("--tag-icon", `url("${tagData.icon}")`);
    }
    if (tagData?.category) {
      const color = categoryColors[tagData.category];
      if (color) {
        tag.style.borderColor = color;
        tag.style.color = color;
      }
    }
  });
};

// ─── Select title banner image ───
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".title-banner").forEach(el => {
    const src = el.getAttribute("data-img-src");
    if (src) {
      el.style.backgroundImage = `url(${src})`;
    }
  });
});


// ─── Remove preload/fadeout classes when page is ready ───
window.addEventListener("pageshow", () => {
  document.documentElement.classList.remove("preload");
  document.body.classList.remove("fade-out");
});

document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(() => {
    document.documentElement.classList.remove("preload");
  });

  // ─── Tooltip Container Factory ───
  window.createTooltipBox = function () {
    const tooltip = document.createElement("div");
    tooltip.classList.add("tooltip-box");

    const header = document.createElement("div");
    header.classList.add("tooltip-header");

    const icon = document.createElement("div");
    icon.classList.add("tooltip-icon");

    const title = document.createElement("strong");
    title.classList.add("tooltip-title");

    header.appendChild(icon);
    header.appendChild(title);

    const description = document.createElement("div");
    description.classList.add("tooltip-description");

    tooltip.appendChild(header);
    tooltip.appendChild(description);

    document.body.appendChild(tooltip);

    return { tooltip, icon, title, description, header };
  };

function getPageOffset(el) {
  let top = 0, left = 0;
  while (el) {
    top += el.offsetTop;
    left += el.offsetLeft;
    el = el.offsetParent;
  }
  return { top, left };
}

function positionTooltip(tooltip, target) {
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  const targetOffset = getPageOffset(target);
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;

  if (window.innerWidth <= 768) {
    // Mobile: tooltip sopra la parola, centrato rispetto alla freccia
    const desiredArrowX = targetOffset.left + target.offsetWidth / 2; // punto della parola
    let left = desiredArrowX - tooltipWidth / 2;

    // non far uscire il tooltip dai bordi dello schermo
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));

    // posiziona sopra la parola
    const top = targetOffset.top - tooltipHeight - 10;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    // posizione della freccia relativa al tooltip
    const arrowOffset = desiredArrowX - left;
    tooltip.style.setProperty("--arrow-left", `${arrowOffset}px`);
  } else {
    // Desktop: sotto la parola
    const left = targetOffset.left;
    const top = targetOffset.top + target.offsetHeight + 10;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
    tooltip.style.setProperty("--arrow-left", `12px`);
  }
}

  // ─── Initialize standard glossary tooltips (.tooltip) ───
  window.initializeTooltips = function (container = document) {
    const hoverWords = container.querySelectorAll(".tooltip");
    if (!hoverWords.length) return;

    const { tooltip, icon, title, description, header } = createTooltipBox();
    icon.style.display = "none";
    title.style.display = "none";
    header.style.display = "none";

    let hideTooltipTimeout = null;

    const showTooltip = (element) => {
      if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
      element.classList.add("active-tooltip");

      const rawKey = element.dataset.tooltipKey || element.textContent.trim();
      const keyLower = rawKey.toLowerCase();

      let entry = Object.values(tooltipDefinitions).find(
        (def) =>
          def.trigger &&
          (Array.isArray(def.trigger)
            ? def.trigger.some((t) => t.toLowerCase() === keyLower)
            : def.trigger.toLowerCase() === keyLower)
      );

      description.innerHTML =
        entry && entry.description
          ? entry.description
          : `No description available for <strong>${rawKey}</strong>.`;

      positionTooltip(tooltip, element);
      tooltip.classList.add("visible");
      tooltip.style.pointerEvents = "auto";
    };

    const hideTooltip = (element) => {
      element.classList.remove("active-tooltip");
      tooltip.classList.remove("visible");
      tooltip.style.pointerEvents = "none";
    };

    hoverWords.forEach((word) => {
      word.addEventListener("mouseenter", () => showTooltip(word));
      word.addEventListener("mouseleave", () => {
        hideTooltipTimeout = setTimeout(() => hideTooltip(word), 150);
      });

      word.addEventListener("touchstart", (e) => {
        e.preventDefault();
        showTooltip(word);
      });
      word.addEventListener("touchend", () => {
        hideTooltipTimeout = setTimeout(() => hideTooltip(word), 2000);
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
  };

  // ─── Initialize tag tooltips (.tag) ───
  window.initializeTagTooltips = function (container = document) {
    const tagElements = container.querySelectorAll(".tag");
    if (!tagElements.length) return;

    const { tooltip, icon, title, description } = createTooltipBox();
    icon.style.display = "";
    title.style.display = "";

    let hideTooltipTimeout = null;

    const showTooltipTag = async (tag) => {
      if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
      tag.classList.add("active-tag-tooltip");

      const tagKey = tag.textContent.trim();
      const tagData = tagDefinitions[tagKey];

      if (!tagData) {
        title.textContent = tagKey;
        description.innerHTML = `No description available for <strong>${tagKey}</strong>.`;
        return;
      }

      const category = tagData.category || "";
      const color = categoryColors[category] || "#D4B55A";
      tooltip.style.borderColor = color;
      tooltip.style.setProperty("--tooltip-color", color);

      title.textContent = tagKey;
      description.innerHTML = tagData.definition || "";

      try {
        const response = await fetch(tagData.icon);
        const svgText = await response.text();
        icon.innerHTML = svgText;
      } catch (error) {
        icon.innerHTML = "";
      }

      positionTooltip(tooltip, tag);
      tooltip.classList.add("visible");
      tooltip.style.pointerEvents = "auto";
    };

    const hideTooltipTag = (tag) => {
      tag.classList.remove("active-tag-tooltip");
      tooltip.classList.remove("visible");
      tooltip.style.pointerEvents = "none";
    };

    tagElements.forEach((tag) => {
      tag.addEventListener("mouseenter", () => showTooltipTag(tag));
      tag.addEventListener("mouseleave", () => {
        hideTooltipTimeout = setTimeout(() => hideTooltipTag(tag), 150);
      });

      tag.addEventListener("touchstart", (e) => {
        e.preventDefault();
        showTooltipTag(tag);
      });
      tag.addEventListener("touchend", () => {
        hideTooltipTimeout = setTimeout(() => hideTooltipTag(tag), 2000);
      });
    });

    tooltip.addEventListener("mouseenter", () => {
      if (hideTooltipTimeout) clearTimeout(hideTooltipTimeout);
    });
    tooltip.addEventListener("mouseleave", () => {
      tooltip.classList.remove("visible");
      tooltip.style.pointerEvents = "none";
      document.querySelector(".active-tag-tooltip")?.classList.remove("active-tag-tooltip");
    });
  };

  // ─── Load tooltip definitions ───
  fetch("/data/tooltips.json")
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      tooltipDefinitions = data;
      initializeTooltips();
    })
    .catch((err) => console.error("Error loading tooltip definitions:", err));

  // ─── Load tag and category definitions ───
  fetch("/data/tags.json")
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      if (data.tags) data.tags.forEach((tag) => (tagDefinitions[tag.name] = tag));
      if (data.categories)
        data.categories.forEach((cat) => (categoryColors[cat.name] = cat.color || "#D4B55A"));

      document.querySelectorAll(".tag").forEach((tag) => {
        const tagName = tag.textContent.trim();
        const tagData = tagDefinitions[tagName];
        const color = categoryColors[tagData?.category];
        if (color) {
          tag.style.borderColor = color;
          tag.style.color = color;
        }
      });

      applyTagIcons();
      initializeTagTooltips();
    })
    .catch((err) => console.error("Error loading tag definitions:", err));

  // ─── Expandable Sections ───
  const collapsibleItems = document.querySelectorAll(".collapsible-item, .collapsible-item-sb");
  collapsibleItems.forEach((item) => {
    const header = item.querySelector(".collapsible-header, .collapsible-header-sb");
    const content = item.querySelector(".collapsible-content, .collapsible-content-sb");
    const icon = item.querySelector(".collapsible-icon, .collapsible-icon-sb");

    content.style.height = "0px";

    header.addEventListener("click", () => {
      item.classList.toggle("expanded");
      icon?.classList.toggle("expanded-icon");

      if (item.classList.contains("expanded")) {
        content.style.height = content.scrollHeight + "px";
        content.classList.add("expanded-content");
      } else {
        content.style.height = content.offsetHeight + "px";
        requestAnimationFrame(() => {
          content.style.height = "0px";
        });
        content.classList.remove("expanded-content");
      }

      content.addEventListener(
        "transitionend",
        function handler() {
          if (item.classList.contains("expanded")) content.style.height = "auto";
          content.removeEventListener("transitionend", handler, { once: true });
        },
        { once: true }
      );
    });
  });

  // ─── Rule Toggles ───
  const toggles = document.querySelectorAll(".rule-switch input[data-rule]");
  toggles.forEach((cb) => {
    const key = "rule-" + cb.dataset.rule;
    if (localStorage.getItem(key) === "false") cb.checked = false;
    updateVisibility(cb.dataset.rule, cb.checked);
  });
  toggles.forEach((cb) =>
    cb.addEventListener("change", (e) => {
      const rule = e.target.dataset.rule;
      const on = e.target.checked;
      localStorage.setItem("rule-" + rule, on);
      updateVisibility(rule, on);
    })
  );

  function updateVisibility(rule, on) {
    document.querySelectorAll(".rule-" + rule).forEach((el) => {
      el.style.display = on ? "" : "none";
    });
  }
  function applyTagIcons() {
    document.querySelectorAll(".tag").forEach((tag) => {
      const tagName = tag.textContent.trim();
      const tagData = tagDefinitions[tagName];
      if (tagData?.icon) tag.style.setProperty("--tag-icon", `url("${tagData.icon}")`);
    });
  }

  // ─── Page Fade Navigation ───
  document.body.addEventListener("click", (e) => {
    const link = e.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      link.target === "_blank" ||
      (link.hostname && link.hostname !== location.hostname)
    )
      return;

    e.preventDefault();
    document.body.classList.add("fade-out");
    setTimeout(() => (window.location.href = href), 500);
  });
});