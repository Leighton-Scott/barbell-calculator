export const BAR_WEIGHT = 45;
export const PLATES = [45, 35, 25, 10, 5, 2.5];
export const LOAD_INCREMENT = 5;

export function parseTargetWeight(value) {
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function roundToLoadableTotal(targetWeight) {
  if (targetWeight === null || targetWeight <= BAR_WEIGHT) {
    return BAR_WEIGHT;
  }

  const stepsAboveBar = (targetWeight - BAR_WEIGHT) / LOAD_INCREMENT;
  const lowerSteps = Math.floor(stepsAboveBar);
  const upperSteps = Math.ceil(stepsAboveBar);
  const lowerTotal = BAR_WEIGHT + lowerSteps * LOAD_INCREMENT;
  const upperTotal = BAR_WEIGHT + upperSteps * LOAD_INCREMENT;

  const lowerDelta = Math.abs(targetWeight - lowerTotal);
  const upperDelta = Math.abs(upperTotal - targetWeight);

  return upperDelta < lowerDelta ? upperTotal : lowerTotal;
}

export function calculatePlatesPerSide(sideWeight) {
  const plates = [];
  let remaining = roundToHalfPound(sideWeight);

  for (const plate of PLATES) {
    while (remaining >= plate) {
      plates.push(plate);
      remaining = roundToHalfPound(remaining - plate);
    }
  }

  return plates;
}

export function calculateBarbellSetup(inputValue) {
  const targetWeight = parseTargetWeight(inputValue);
  const requestedWeight = targetWeight ?? BAR_WEIGHT;
  const actualWeight = roundToLoadableTotal(targetWeight);
  const sideWeight = (actualWeight - BAR_WEIGHT) / 2;
  const platesPerSide = calculatePlatesPerSide(sideWeight);

  return {
    targetWeight,
    requestedWeight,
    actualWeight,
    difference: roundToHalfPound(actualWeight - requestedWeight),
    sideWeight,
    platesPerSide
  };
}

function roundToHalfPound(value) {
  return Math.round(value * 2) / 2;
}
