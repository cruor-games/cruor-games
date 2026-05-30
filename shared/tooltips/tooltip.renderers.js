function appendText(parent, tagName, className, text) {
  if (!text) return null;
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function appendFact(parent, label, value) {
  if (!value) return;
  const item = document.createElement("div");
  item.className = "region-fact-list__item";
  appendText(item, "dt", "", label);
  appendText(item, "dd", "", value);
  parent.appendChild(item);
}

function getRoomIcon(payload) {
  const text = [payload.role, payload.meta, payload.title, payload.shape]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (text.includes("corridor") || text.includes("connector"))
    return "fa-route";
  if (text.includes("entrance") || text.includes("threshold"))
    return "fa-door-open";
  if (text.includes("clue")) return "fa-magnifying-glass";
  if (text.includes("hazard") || text.includes("danger"))
    return "fa-triangle-exclamation";
  if (text.includes("vertical") || text.includes("shaft"))
    return "fa-arrow-down-up-across-line";
  return "fa-dungeon";
}

function normalizeTooltipText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function trimTooltipText(value, maxLength) {
  const text = normalizeTooltipText(value);
  if (text.length <= maxLength) return text;

  const slice = text.slice(0, maxLength + 1);
  const sentenceBreak = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf(";"),
    slice.lastIndexOf(":"),
    slice.lastIndexOf("—"),
  );
  const wordBreak = slice.lastIndexOf(" ");
  const breakPoint =
    sentenceBreak >= Math.floor(maxLength * 0.48)
      ? sentenceBreak + 1
      : wordBreak >= Math.floor(maxLength * 0.58)
        ? wordBreak
        : maxLength;

  return `${slice.slice(0, breakPoint).trim()}…`;
}

function resolveGenericTooltipCopy(payload) {
  const rawTitle = normalizeTooltipText(payload.title);
  const rawBody = normalizeTooltipText(payload.text);
  const sourceTitle = rawTitle || rawBody;

  if (!sourceTitle) {
    return { title: "", body: "" };
  }

  const title = trimTooltipText(sourceTitle, 68);
  let body = rawBody && rawBody !== rawTitle ? rawBody : "";

  if (!body && sourceTitle.length > title.length) {
    body = sourceTitle.slice(title.replace(/…$/, "").length).trim();
  }

  body = trimTooltipText(body, 180);

  if (body === title || body === `${title}…`) {
    body = "";
  }

  return { title, body };
}

function renderGenericTooltip(payload) {
  const { title, body } = resolveGenericTooltipCopy(payload);
  const tooltip = document.createElement("article");
  tooltip.className = "cruor-tooltip cruor-tooltip--generic";
  tooltip.setAttribute("role", "tooltip");

  const head = document.createElement("div");
  head.className = "cruor-tooltip__generic-head";
  appendText(head, "h2", "cruor-tooltip__title", title);
  appendText(head, "kbd", "cruor-tooltip__kbd", payload.kbd || "");
  tooltip.appendChild(head);

  appendText(tooltip, "p", "cruor-tooltip__body", body);
  return tooltip;
}

function renderRoomTooltip(payload) {
  const tooltip = document.createElement("article");
  tooltip.className =
    "cruor-tooltip cruor-tooltip--room region-card cruor-tooltip-region-card";
  tooltip.setAttribute("role", "tooltip");

  const top = document.createElement("div");
  top.className = "region-card__top";
  const titleWrap = document.createElement("div");
  titleWrap.className = "region-card__title";
  const icon = document.createElement("i");
  icon.className = `fa-solid ${payload.icon || getRoomIcon(payload)}`;
  icon.setAttribute("aria-hidden", "true");
  const titleText = document.createElement("div");
  appendText(titleText, "h3", "", payload.title || "Region");
  appendText(titleText, "div", "region-card__meta", payload.meta || "");
  titleWrap.append(icon, titleText);
  top.appendChild(titleWrap);
  tooltip.appendChild(top);

  appendText(tooltip, "p", "region-card__read", payload.readAloud || "");

  const facts = document.createElement("dl");
  facts.className = "region-fact-list";
  appendFact(facts, "Feature", payload.feature);
  appendFact(facts, "Interact", payload.interaction || payload.interact);
  appendFact(facts, "Danger", payload.danger);
  appendFact(facts, "Secret", payload.secret);
  if (facts.children.length > 0) tooltip.appendChild(facts);

  return tooltip;
}

export function renderTooltipPayload(payload) {
  if (!payload) return null;
  if (payload.type === "room") return renderRoomTooltip(payload);
  return renderGenericTooltip(payload);
}
