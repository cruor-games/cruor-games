export const SHARED_WORKFLOWS = [
  {
    id: "darken-location",
    label: "Darken a Location",
    type: "Workflow",
    status: "published",
    summary: "Transform an existing location into a table-ready dark fantasy horror site.",
  },
  {
    id: "monster-composer",
    label: "Monster Composer",
    type: "Workflow",
    status: "published",
    summary: "Build readable 5E-style horror monsters through anatomy, pressure, counterplay, run mode, and export.",
  },
  {
    id: "inspiration-archive",
    label: "Inspiration Archive",
    type: "Workflow",
    status: "published",
    summary: "Explain real inspirations and connect them to reusable Cruor content.",
  },
];

export const SHARED_MONSTER_SLOTS = [
  {
    id: "body",
    label: "Body",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "What the creature physically is.",
  },
  {
    id: "mind",
    label: "Mind",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "What drives its behavior.",
  },
  {
    id: "movement",
    label: "Movement",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "How it reaches the characters.",
  },
  {
    id: "attack",
    label: "Attack Pattern",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "Its main offensive loop.",
  },
  {
    id: "horror",
    label: "Horror Feature",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "The memorable disturbing element.",
  },
  {
    id: "twist",
    label: "Combat Twist",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "The rule that changes the fight.",
  },
  {
    id: "weakness",
    label: "Weakness / Tell",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "Counterplay and readability.",
  },
  {
    id: "death",
    label: "Death Effect",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "What happens when it dies.",
  },
  {
    id: "lair",
    label: "Lair / Scene Effect",
    type: "Monster Slot",
    workflows: ["monster-composer"],
    summary: "Optional pressure from the environment.",
  },
];
