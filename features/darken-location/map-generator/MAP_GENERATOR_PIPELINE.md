# Map Generator Pipeline

## 1. Normalize Input

Convert user or Darken a Location data into a normalized map request.

## 2. Build Location Profile

Infer structural preferences from the request:

- dungeon-like;
- cave-like;
- ruin-like;
- crypt-like;
- temple-like;
- sewer-like;
- fortress-like;
- hybrid.

## 3. Build Area Graph

Create a graph of rooms, chambers, corridors, thresholds, and special areas.

The graph should define relationships before geometry.

## 4. Place Rooms

Place rooms in 2D space according to the graph, room importance, and layout profile.

## 5. Connect Areas

Generate corridors, tunnels, doors, stairs, secret passages, and loops.

## 6. Build Masks

Convert placed geometry into grid or polygon masks.

## 7. Add Details

Place labels, props, hazards, entrances, exits, stairs, and points of interest.

## 8. Render

Render the map from generated data.

Rendering must not mutate generation data.

## 9. Export

Export map image, SVG, and/or structured JSON.