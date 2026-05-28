import { DARKEN_LOCATION_WORKFLOW } from '../darken-location/darken-location.workflow.js';

export const WORKFLOWS = {
  [DARKEN_LOCATION_WORKFLOW.id]: DARKEN_LOCATION_WORKFLOW,
  encounter: {
    label: 'Twist an Encounter',
    description: 'Add corruption, phases, lair pressure, and death effects to a fight you already planned.',
    defaultTitle: 'Cruor Encounter Twist',
    contexts: ['Any', 'Undead', 'Beast', 'Humanoid', 'Fiend', 'Aberration', 'Boss Fight', 'Cultists'],
    slots: [
      { id: 'creatureCorruption', label: 'Creature Corruption', max: 1 },
      { id: 'openingSign', label: 'Opening Sign', max: 1 },
      { id: 'combatTwist', label: 'Combat Twist', max: 1 },
      { id: 'bossPhase', label: 'Boss Phase', max: 1 },
      { id: 'lairEffect', label: 'Lair Effect', max: 1 },
      { id: 'deathEffect', label: 'Death Effect', max: 1 },
      { id: 'reward', label: 'Loot or Consequence', max: 1 }
    ]
  },
  reward: {
    label: 'Create a Dark Reward',
    description: 'Turn loot, boons, secrets, mutations, or relics into useful rewards with a disturbing cost.',
    defaultTitle: 'Malicious Reward Build',
    contexts: ['Any', 'Relic', 'Weapon', 'Spell', 'Boon', 'Mutation', 'Secret', 'Pact'],
    slots: [
      { id: 'rewardType', label: 'Reward Type', max: 1 },
      { id: 'power', label: 'Power', max: 1 },
      { id: 'cost', label: 'Cost', max: 1 },
      { id: 'temptation', label: 'Temptation', max: 1 },
      { id: 'visibleSign', label: 'Visible Sign', max: 1 },
      { id: 'escalation', label: 'Escalation', max: 1 },
      { id: 'removal', label: 'Removal Condition', max: 1 }
    ]
  },
  clue: {
    label: 'Add a Disturbing Clue',
    description: 'Attach a disturbing reveal, false reading, check, and follow-up complication to an existing clue.',
    defaultTitle: 'Disturbing Clue Build',
    contexts: ['Any', 'Corpse', 'Inscription', 'Letter', 'Vision', 'Relic', 'Witness', 'Crime Scene'],
    slots: [
      { id: 'clueForm', label: 'Clue Form', max: 1 },
      { id: 'reveal', label: 'What It Reveals', max: 1 },
      { id: 'disturbance', label: 'Why It Is Disturbing', max: 1 },
      { id: 'falseReading', label: 'False Reading', max: 1 },
      { id: 'mechanicalCheck', label: 'Mechanical Check', max: 1 },
      { id: 'followUp', label: 'Follow-Up Complication', max: 1 }
    ]
  }
};

export const SLOT_DESCRIPTIONS = {
  horrorPremise: 'Choose the core horror idea of this place.',
  sensoryLayer: 'Add sound, smell, and touch details.',
  visibleAnomaly: 'Add something visibly wrong.',
  hazard: 'Add a danger that affects play.',
  clue: 'Add evidence players can act on.',
  encounterTwist: 'Add a twist if combat happens here.',
  reward: 'Add what remains after the scene.',
  creatureCorruption: 'how an existing creature is altered by the horror.',
  openingSign: 'what the party notices before the fight truly begins.',
  combatTwist: 'a rule or pressure that changes how the encounter plays.',
  bossPhase: 'a phase change or escalation for an important enemy.',
  lairEffect: 'recurring environmental pressure during the encounter.',
  deathEffect: 'what happens when a creature dies.',
  rewardType: 'the form this dark reward takes.',
  power: 'the practical benefit that makes the reward tempting.',
  cost: 'the price paid for using or carrying the reward.',
  temptation: 'why the character may want to keep using it.',
  visibleSign: 'the outward mark caused by the reward or corruption.',
  escalation: 'how the reward worsens or demands more over time.',
  removal: 'how the reward can be broken, purified, paid for, or escaped.',
  clueForm: 'the physical or experiential form of the clue.',
  reveal: 'the true information the clue communicates.',
  disturbance: 'the detail that makes the clue uncanny or horrific.',
  falseReading: 'a plausible but wrong interpretation.',
  mechanicalCheck: 'the check, save, DC, or rule interaction attached to the clue.',
  followUp: 'what happens after the clue is examined or disturbed.'
};

export const SENSORY_KINDS = ['Sound', 'Smell', 'Touch'];

