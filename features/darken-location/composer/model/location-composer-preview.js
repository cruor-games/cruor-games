import { createMapRequestFromDarkenLocationState } from "../../darken-location.map-request.js";
import { DEFAULT_CONFIG, createConfigFromNormalizedMapRequest } from "../../map-generator/map-generator.input.js";
import { generateMap } from "../../map-generator/map-generator.pipeline.js";
import { createEmptyManualOverrides } from "../../map-generator/map-generator.state.js";

export function createLocationPreviewModel(snapshot) {
  const mapRequest = createMapRequestFromDarkenLocationState(snapshot);
  const previewConfig = createConfigFromNormalizedMapRequest(mapRequest, DEFAULT_CONFIG);

  try {
    return {
      mapRequest,
      previewConfig,
      previewResult: {
        generatedMap: generateMap(previewConfig, createEmptyManualOverrides()),
        error: "",
      },
    };
  } catch (error) {
    return {
      mapRequest,
      previewConfig,
      previewResult: {
        generatedMap: null,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function getLocationPreviewResetKey(mapRequest, digest) {
  return `${mapRequest.seed}:${mapRequest.requiredRegions.length}:${digest.filledSlots}`;
}
