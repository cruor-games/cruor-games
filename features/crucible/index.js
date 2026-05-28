import React, { useEffect, useRef } from 'react';
import { mountCrucible } from './crucible.mount.js';

export { mountCrucible };

export function Crucible({ onOpenMapGenerator, onSnapshotProviderReady } = {}) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return undefined;
    return mountCrucible(rootRef.current, { onOpenMapGenerator, onSnapshotProviderReady });
  }, [onOpenMapGenerator, onSnapshotProviderReady]);

  return React.createElement('div', { ref: rootRef });
}

export default Crucible;
