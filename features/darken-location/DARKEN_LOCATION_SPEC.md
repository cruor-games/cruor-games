# Darken a Location Specification

Darken a Location generates or structures a dark fantasy RPG location.

It may produce narrative, atmospheric, mechanical, and structural data.

For map generation, it should expose a normalized map request or enough data to build one.

## Map-Relevant Data

Useful data includes:

- location type;
- environment;
- room or area count;
- named rooms;
- important landmarks;
- entrances;
- exits;
- hazards;
- secrets;
- factions or inhabitants;
- mood;
- scale;
- density;
- verticality;
- geometry style.

## Integration Rule

Darken a Location should not call map generator internals directly.

It should provide data that can be normalized into the map generator data contract.
