export const UNIT_PRESETS = {
  lb: {
    unit: "lb",
    barWeight: 45,
    maxWeight: 1000,
    plates: [45, 35, 25, 10, 5, 2.5]
  },
  kg: {
    unit: "kg",
    barWeight: 20,
    maxWeight: 500,
    plates: [25, 20, 15, 10, 5, 2.5, 1.25]
  }
};

export const ROUNDING_MODES = {
  nearest: "nearest",
  under: "under",
  over: "over"
};

export const DEFAULT_UNIT = "lb";
export const DEFAULT_PRESET = UNIT_PRESETS[DEFAULT_UNIT];
export const BAR_WEIGHT = DEFAULT_PRESET.barWeight;
export const MAX_WEIGHT = DEFAULT_PRESET.maxWeight;
export const PLATES = DEFAULT_PRESET.plates;

const WEIGHT_SCALE = 100;

export function parseTargetWeight(value) {
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateBarbellSetup(inputValue, options = {}) {
  const config = normalizeConfig(options);
  const targetWeight = parseTargetWeight(inputValue);
  const requestedWeight = targetWeight ?? config.barWeight;
  const cappedTargetWeight = clamp(requestedWeight, config.barWeight, config.maxWeight);
  const sideOptions = buildSideOptions(config);
  const selected = selectBestLoad(sideOptions, cappedTargetWeight, config);
  const actualWeight = selected.totalWeight;
  const sideWeight = roundWeight((actualWeight - config.barWeight) / 2);

  return {
    targetWeight,
    requestedWeight,
    cappedTargetWeight,
    actualWeight,
    difference: roundWeight(actualWeight - requestedWeight),
    sideWeight,
    platesPerSide: selected.plates,
    config
  };
}

export function calculateWarmupSets(workingWeightValue, options = {}) {
  const workingSetup = calculateBarbellSetup(workingWeightValue, options);
  const { config } = workingSetup;
  const workingWeight = workingSetup.actualWeight;
  const targets = [
    { label: "Empty bar", percent: null, targetWeight: config.barWeight, reps: "8-10" },
    { label: "50%", percent: 50, targetWeight: workingWeight * 0.5, reps: "5" },
    { label: "65%", percent: 65, targetWeight: workingWeight * 0.65, reps: "3" },
    { label: "75%", percent: 75, targetWeight: workingWeight * 0.75, reps: "2" },
    { label: "85%", percent: 85, targetWeight: workingWeight * 0.85, reps: "1" },
    { label: "92%", percent: 92, targetWeight: workingWeight * 0.92, reps: "1" }
  ];
  const seenLoads = new Set();

  return targets.reduce((sets, target) => {
    const setup = calculateBarbellSetup(target.targetWeight, config);

    if (setup.actualWeight >= workingWeight && workingWeight > config.barWeight) return sets;
    if (seenLoads.has(setup.actualWeight)) return sets;

    seenLoads.add(setup.actualWeight);
    sets.push({
      ...target,
      setup
    });
    return sets;
  }, []);
}

export function calculateOneRepMax(weightValue, repsValue) {
  const weight = parseTargetWeight(weightValue);
  const reps = Number.parseInt(String(repsValue).trim(), 10);

  if (!weight || !Number.isFinite(reps) || reps < 1) {
    return {
      weight,
      reps: Number.isFinite(reps) ? reps : null,
      estimates: [],
      average: null
    };
  }

  const estimates = reps === 1
    ? [
        { name: "Epley", value: weight },
        { name: "Brzycki", value: weight },
        { name: "Lombardi", value: weight }
      ]
    : [
        { name: "Epley", value: weight * (1 + reps / 30) },
        { name: "Brzycki", value: reps < 37 ? weight * (36 / (37 - reps)) : null },
        { name: "Lombardi", value: weight * Math.pow(reps, 0.1) }
      ].filter((estimate) => Number.isFinite(estimate.value));

  const average = estimates.length > 0
    ? estimates.reduce((sum, estimate) => sum + estimate.value, 0) / estimates.length
    : null;

  return {
    weight,
    reps,
    estimates: estimates.map((estimate) => ({
      ...estimate,
      value: roundWeight(estimate.value)
    })),
    average: average === null ? null : roundWeight(average)
  };
}

export function calculatePercentLoads(maxWeightValue, options = {}, percentages = [70, 75, 80, 85, 90]) {
  const maxWeight = parseTargetWeight(maxWeightValue);

  if (!maxWeight) {
    return [];
  }

  return percentages.map((percent) => {
    const targetWeight = roundWeight(maxWeight * (percent / 100));
    const setup = calculateBarbellSetup(targetWeight, options);

    return {
      percent,
      targetWeight,
      setup
    };
  });
}

export function normalizeConfig(options = {}) {
  const preset = UNIT_PRESETS[options.unit] ?? DEFAULT_PRESET;
  const barWeight = parsePositiveNumber(options.barWeight, preset.barWeight);
  const maxWeight = Math.max(barWeight, parsePositiveNumber(options.maxWeight, preset.maxWeight));
  const plates = normalizePlates(options.plates ?? preset.plates);
  const roundingMode = Object.values(ROUNDING_MODES).includes(options.roundingMode)
    ? options.roundingMode
    : ROUNDING_MODES.nearest;
  const inventory = normalizeInventory(options.inventory, plates);

  return {
    unit: preset.unit,
    barWeight,
    maxWeight,
    plates,
    roundingMode,
    inventory
  };
}

function buildSideOptions(config) {
  const maxSideUnits = toUnits((config.maxWeight - config.barWeight) / 2);
  let states = new Map([[0, []]]);

  for (const plate of config.plates) {
    const plateUnits = toUnits(plate);
    const available = config.inventory[plate] ?? Infinity;
    const maxCount = Number.isFinite(available)
      ? Math.max(0, available)
      : Math.floor(maxSideUnits / plateUnits);
    const nextStates = new Map(states);

    for (const [sum, existingPlates] of states.entries()) {
      for (let count = 1; count <= maxCount; count += 1) {
        const nextSum = sum + plateUnits * count;
        if (nextSum > maxSideUnits) break;
        const candidatePlates = existingPlates.concat(Array(count).fill(plate));
        if (!nextStates.has(nextSum) || isBetterPlateSet(candidatePlates, nextStates.get(nextSum))) {
          nextStates.set(nextSum, candidatePlates);
        }
      }
    }

    states = nextStates;
  }

  return [...states.entries()]
    .map(([sideUnits, plates]) => ({
      sideUnits,
      sideWeight: fromUnits(sideUnits),
      totalWeight: roundWeight(config.barWeight + 2 * fromUnits(sideUnits)),
      plates
    }))
    .sort((a, b) => a.totalWeight - b.totalWeight);
}

function selectBestLoad(sideOptions, targetWeight, config) {
  if (config.roundingMode === ROUNDING_MODES.under) {
    return [...sideOptions].reverse().find((option) => option.totalWeight <= targetWeight) ?? sideOptions[0];
  }

  if (config.roundingMode === ROUNDING_MODES.over) {
    return sideOptions.find((option) => option.totalWeight >= targetWeight) ?? sideOptions.at(-1);
  }

  return sideOptions.reduce((best, option) => {
    const bestDelta = Math.abs(best.totalWeight - targetWeight);
    const optionDelta = Math.abs(option.totalWeight - targetWeight);

    if (optionDelta < bestDelta) return option;
    if (optionDelta === bestDelta && option.totalWeight < best.totalWeight) return option;
    return best;
  }, sideOptions[0]);
}

function normalizePlates(plates) {
  return [...new Set(plates.map((plate) => parsePositiveNumber(plate, null)).filter(Boolean))]
    .sort((a, b) => b - a);
}

function normalizeInventory(inventory, plates) {
  if (!inventory || inventory.mode !== "limited") {
    return Object.fromEntries(plates.map((plate) => [plate, Infinity]));
  }

  return Object.fromEntries(plates.map((plate) => {
    const parsed = Number.parseInt(inventory.counts?.[plate], 10);
    return [plate, Number.isFinite(parsed) && parsed >= 0 ? parsed : 0];
  }));
}

function parsePositiveNumber(value, fallback) {
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isBetterPlateSet(candidate, current) {
  for (let index = 0; index < Math.max(candidate.length, current.length); index += 1) {
    const candidatePlate = candidate[index] ?? 0;
    const currentPlate = current[index] ?? 0;
    if (candidatePlate !== currentPlate) {
      return candidatePlate > currentPlate;
    }
  }

  return candidate.length < current.length;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toUnits(value) {
  return Math.round(value * WEIGHT_SCALE);
}

function fromUnits(value) {
  return value / WEIGHT_SCALE;
}

function roundWeight(value) {
  return Math.round(value * 100) / 100;
}
