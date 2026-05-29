# Map Generator Data Contract

## Normalized Map Request

The map generator should consume this kind of object:

```js
{
  id: string,
  seed: string | number,

  locationType: string,
  environment: string,
  mood: string[],

  size: "small" | "medium" | "large",
  roomCount: number,

  structure: {
    geometry: "organic" | "geometric" | "mixed",
    density: "sparse" | "normal" | "dense",
    linearity: "linear" | "branching" | "looping",
    verticality: "flat" | "some" | "high",
    symmetry: "low" | "medium" | "high"
  },

  requiredAreas: [
    {
      id: string,
      name: string,
      type: string,
      importance: "minor" | "standard" | "major",
      tags: string[]
    }
  ],

  hazards: string[],
  secrets: string[],
  landmarks: string[],

  output: {
    labels: boolean,
    grid: boolean,
    style: string
  }
}
```

## Rule

Darken a Location may have richer narrative data, but the map generator should only receive normalized structural data.

---

## 9. `docs/features/map-generator/REFERENCES.md`

Questo file deve indicare le reference senza incollarle dentro le istruzioni.

# Map Generator References

## External References Stored in Project

Reference files may exist for studying generation techniques and visual goals.

They are not production dependencies unless explicitly integrated.

Important references:

- Watabou One Page Dungeon Generator reference
- Watabou One Page Cave Generator reference
- Dungeon Scrawl reference

## Usage Rules

- Do not copy large blocks directly from reference files.
- Use references to understand algorithms, visual conventions, and useful rendering techniques.
- Reimplement only the necessary ideas in Cruor's architecture.
- Keep Cruor function names simple and project-specific.
