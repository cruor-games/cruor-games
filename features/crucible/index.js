import React, { useEffect, useRef } from "react";
import { mountCrucible } from "./crucible.mount.js";

export { mountCrucible };

export function Crucible({ onOpenMapGenerator, onSnapshotProviderReady, uiMode = "simple" } = {}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return undefined;
    return mountCrucible(rootRef.current, {
      onOpenMapGenerator,
      onSnapshotProviderReady,
      uiMode,
    });
  }, [onOpenMapGenerator, onSnapshotProviderReady, uiMode]);

  return React.createElement("div", {
    ref: rootRef,
    "data-cruor-ui-mode": uiMode,
  });
}

export default Crucible;
