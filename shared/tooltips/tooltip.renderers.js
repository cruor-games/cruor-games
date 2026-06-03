function appendText(parent, tagName, className, text) {
  if (!text) return null;
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function appendRichInlineText(parent, text) {
  const source = String(text || "");
  if (!source) return;

  const tokenPattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let cursor = 0;
  let match;

  while ((match = tokenPattern.exec(source))) {
    if (match.index > cursor) {
      parent.appendChild(document.createTextNode(source.slice(cursor, match.index)));
    }

    const element = document.createElement(match[2] ? "strong" : "em");
    element.textContent = match[2] || match[3] || "";
    parent.appendChild(element);
    cursor = match.index + match[0].length;
  }

  if (cursor < source.length) {
    parent.appendChild(document.createTextNode(source.slice(cursor)));
  }
}

function appendRichParagraph(parent, text) {
  const value = String(text || "").trim();
  if (!value) return null;
  const paragraph = document.createElement("p");
  paragraph.className = "cruor-tooltip__paragraph";
  appendRichInlineText(paragraph, value);
  parent.appendChild(paragraph);
  return paragraph;
}

function renderGenericTooltipBody(body) {
  if (!body) return null;

  const container = document.createElement("div");
  container.className = "cruor-tooltip__body";

  const blocks = String(body)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      appendRichParagraph(container, line);
    }
  }

  return container.children.length ? container : null;
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

function normalizeTooltipBodyText(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => normalizeTooltipText(line))
    .filter(Boolean)
    .join("\n");
}

function trimMultilineTooltipText(value, maxLength) {
  const text = normalizeTooltipBodyText(value);
  if (text.length <= maxLength) return text;

  const lines = text.split("\n");
  const kept = [];
  let length = 0;

  for (const line of lines) {
    const nextLength = length + line.length + (kept.length ? 1 : 0);
    if (nextLength > maxLength) break;
    kept.push(line);
    length = nextLength;
  }

  if (!kept.length) return `${text.slice(0, maxLength).trim()}…`;
  return `${kept.join("\n").trim()}…`;
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
  const rawBody = normalizeTooltipBodyText(payload.text);
  const sourceTitle = rawTitle || normalizeTooltipText(rawBody);

  if (!sourceTitle) {
    return { title: "", body: "" };
  }

  const title = trimTooltipText(sourceTitle, 68);
  let body = rawBody && rawBody !== rawTitle ? rawBody : "";

  if (!body && sourceTitle.length > title.length) {
    body = sourceTitle.slice(title.replace(/…$/, "").length).trim();
  }

  body = body.includes("\n") ? trimMultilineTooltipText(body, 640) : trimTooltipText(body, 180);

  if (body === title || body === `${title}…`) {
    body = "";
  }

  return { title, body };
}

function renderGenericTooltip(payload) {
  const { title, body } = resolveGenericTooltipCopy(payload);
  const tooltip = document.createElement("article");
  tooltip.className = `cruor-tooltip cruor-tooltip--generic${body.includes("\n") ? " cruor-tooltip--has-lines" : ""}`;
  tooltip.setAttribute("role", "tooltip");

  const head = document.createElement("div");
  head.className = "cruor-tooltip__generic-head";
  appendText(head, "h2", "cruor-tooltip__title", title);
  appendText(head, "kbd", "cruor-tooltip__kbd", payload.kbd || "");
  tooltip.appendChild(head);

  const bodyElement = renderGenericTooltipBody(body);
  if (bodyElement) tooltip.appendChild(bodyElement);
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
