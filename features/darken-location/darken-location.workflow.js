export const DARKEN_LOCATION_WORKFLOW = {
  id: 'location',
  label: 'Darken a Location',
  description: 'Add horror texture, hazards, clues, and consequences to an existing place without replacing your prep.',
  defaultTitle: 'Cursed Location Build',
  contexts: ['Any', 'Cave', 'Crypt', 'Chapel', 'Forest', 'Mine', 'Noble House', 'Village', 'Ruins'],
  slots: [
    { id: 'horrorPremise', label: 'Premise', max: 1 },
    { id: 'sensoryLayer', label: 'Sensory Layer', max: 3 },
    { id: 'visibleAnomaly', label: 'Visible Anomaly', max: 2 },
    { id: 'hazard', label: 'Hazard', max: 1 },
    { id: 'clue', label: 'Clue', max: 1 },
    { id: 'encounterTwist', label: 'Encounter Twist', max: 1 },
    { id: 'reward', label: 'Outcome', max: 1 }
  ]
};

export default DARKEN_LOCATION_WORKFLOW;
