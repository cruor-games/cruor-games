const providersByKey = new Map();

export function registerTooltipProvider(key, provider) {
  if (!key || typeof provider !== "function") {
    return () => {};
  }

  const providers = providersByKey.get(key) || [];
  providers.push(provider);
  providersByKey.set(key, providers);

  return () => {
    const currentProviders = providersByKey.get(key) || [];
    const nextProviders = currentProviders.filter((item) => item !== provider);
    if (nextProviders.length === 0) {
      providersByKey.delete(key);
      return;
    }
    providersByKey.set(key, nextProviders);
  };
}

export function getTooltipPayload(key, id, trigger) {
  const providers = providersByKey.get(key) || [];
  for (let index = providers.length - 1; index >= 0; index -= 1) {
    const payload = providers[index](id, trigger);
    if (payload) return payload;
  }

  if (key === "tooltip-generic" && id) {
    return {
      type: "generic",
      title: id,
      text: trigger?.getAttribute("data-tooltip-description") || "",
      kbd: trigger?.getAttribute("data-tooltip-kbd") || "",
    };
  }

  return null;
}
