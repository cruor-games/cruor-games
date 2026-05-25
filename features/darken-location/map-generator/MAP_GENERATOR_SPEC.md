# Map Generator Specification

## Purpose

The map generator creates dark fantasy RPG maps for locations generated or described by Cruor Games tools.

The generator should support dungeons, catacombs, caves, ruins, crypts, lairs, temples, sewers, fortresses, and other enclosed adventure locations.

## Design Goal

Maps should feel similar in usefulness and readability to classic one-page dungeon generators, while being driven by structured parameters instead of pure randomness.

## Input Sources

Primary input:

- Darken a Location output.

Secondary input:

- manual user parameters;
- presets;
- seed-based regeneration.

## Required Controls

The generator should support:

- location type;
- environment;
- room count;
- important rooms;
- entrance count;
- danger level;
- verticality;
- symmetry/asymmetry;
- organic/geometric structure;
- density;
- secret areas;
- loops/dead ends;
- landmarks;
- labels;
- export mode.

## Output

The generator should produce:

- internal map data;
- visual map rendering;
- debug view;
- optional SVG/export-ready map.