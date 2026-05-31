export function clampPercent(value, min = 8, max = 92) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function getGeneratedRoomForRegion(generatedMap, regionId) {
  if (!generatedMap?.regions?.length || !regionId) return null;
  return (
    generatedMap.regions.find((room) => room.sourceRegionId === regionId) ||
    generatedMap.regions.find((room) => room.requestMetadata?.sourceRegionId === regionId) ||
    generatedMap.regions.find((room) => room.id === regionId) ||
    null
  );
}

export function getGeneratedRoomForRegionIndex(generatedMap, regionId, index) {
  return getGeneratedRoomForRegion(generatedMap, regionId) || generatedMap?.regions?.[index] || null;
}

export function getGeneratedRoomPositionStyle(generatedMap, room, index) {
  if (!generatedMap || !room?.labelPoint) {
    return {
      "--region-x": `${18 + (index % 3) * 31}%`,
      "--region-y": `${28 + Math.floor(index / 3) * 24}%`,
    };
  }

  const bounds = generatedMap.contentBounds || {
    x: 0,
    y: 0,
    width: generatedMap.config?.mapWidth || 1000,
    height: generatedMap.config?.mapHeight || 640,
  };
  const normalizedX = (room.labelPoint.x - bounds.x) / Math.max(1, bounds.width);
  const normalizedY = (room.labelPoint.y - bounds.y) / Math.max(1, bounds.height);

  return {
    "--region-x": `${clampPercent(12 + normalizedX * 76, 10, 90)}%`,
    "--region-y": `${clampPercent(14 + normalizedY * 68, 14, 82)}%`,
  };
}

export function getGeneratedRoomSurfaceLabel(room) {
  return room?.surfaceKind || room?.placementProfile || room?.shape || "generated room";
}
