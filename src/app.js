import {
  BAR_WEIGHT,
  DEFAULT_PRESET,
  MAX_WEIGHT,
  ROUNDING_MODES,
  UNIT_PRESETS,
  calculateBarbellSetup
} from "./calculator.js?v=4";

const plateMeta = {
  45: { className: "plate-45", label: "45" },
  35: { className: "plate-35", label: "35" },
  25: { className: "plate-25", label: "25" },
  20: { className: "plate-20", label: "20" },
  15: { className: "plate-15", label: "15" },
  10: { className: "plate-10", label: "10" },
  5: { className: "plate-5", label: "5" },
  2.5: { className: "plate-2-5", label: "2.5" },
  1.25: { className: "plate-1-25", label: "1.25" }
};

const starterInventory = {
  lb: { 45: 4, 35: 1, 25: 2, 10: 2, 5: 2, 2.5: 2 },
  kg: { 25: 2, 20: 2, 15: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 2 }
};

const targetInput = document.querySelector("#target-weight");
const unitSuffix = document.querySelector("#unit-suffix");
const inputHelp = document.querySelector("#input-help");
const unitInputs = [...document.querySelectorAll('input[name="unit"]')];
const barWeightInput = document.querySelector("#bar-weight");
const roundingModeInput = document.querySelector("#rounding-mode");
const inventoryToggle = document.querySelector("#inventory-toggle");
const inventoryPanel = document.querySelector("#inventory-panel");
const inventoryGrid = document.querySelector("#inventory-grid");
const requestedWeight = document.querySelector("#requested-weight");
const actualWeight = document.querySelector("#actual-weight");
const differenceWeight = document.querySelector("#difference-weight");
const perSideTotal = document.querySelector("#per-side-total");
const plateList = document.querySelector("#plate-list");
const leftPlates = document.querySelector("#left-plates");
const rightPlates = document.querySelector("#right-plates");
const barbellVisual = document.querySelector("#barbell-visual");

function currentUnit() {
  return unitInputs.find((input) => input.checked)?.value ?? "lb";
}

function currentPreset() {
  return UNIT_PRESETS[currentUnit()] ?? DEFAULT_PRESET;
}

function currentConfig() {
  const preset = currentPreset();

  return {
    unit: preset.unit,
    barWeight: barWeightInput.value,
    maxWeight: preset.maxWeight,
    plates: preset.plates,
    roundingMode: roundingModeInput.value,
    inventory: inventoryToggle.checked
      ? { mode: "limited", counts: readInventoryCounts() }
      : { mode: "unlimited" }
  };
}

function readInventoryCounts() {
  return Object.fromEntries(
    [...inventoryGrid.querySelectorAll("input[data-plate]")].map((input) => [input.dataset.plate, input.value])
  );
}

function formatWeight(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(value % 1 === 0 ? 0 : 2).replace(/0$/, "");
}

function formatDifference(value, unit) {
  if (value === 0) return "Exact";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatWeight(value)} ${unit}`;
}

function createPlateElement(weight, side, unit) {
  const meta = plateMeta[weight] ?? { className: "plate-generic", label: formatWeight(weight) };
  const plate = document.createElement("span");
  plate.className = `plate ${meta.className}`;
  plate.dataset.weight = String(weight);
  plate.textContent = meta.label;
  plate.title = `${meta.label} ${unit} plate`;
  plate.setAttribute("aria-hidden", "true");

  if (side === "left") {
    plate.style.order = String(weight);
  }

  return plate;
}

function renderPlates(container, plates, side, unit) {
  container.replaceChildren();

  if (plates.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-sleeve";
    empty.textContent = "Empty bar";
    container.append(empty);
    return;
  }

  for (const plate of plates) {
    container.append(createPlateElement(plate, side, unit));
  }
}

function renderInventoryFields() {
  const preset = currentPreset();
  const savedCounts = readInventoryCounts();

  inventoryGrid.replaceChildren();

  for (const plate of preset.plates) {
    const label = document.createElement("label");
    label.className = "inventory-item";
    label.innerHTML = `
      <span>${formatWeight(plate)} ${preset.unit}</span>
      <input type="number" min="0" step="1" inputmode="numeric" data-plate="${plate}">
    `;
    const input = label.querySelector("input");
    input.value = savedCounts[plate] ?? starterInventory[preset.unit]?.[plate] ?? 2;
    input.addEventListener("input", updateCalculator);
    inventoryGrid.append(label);
  }
}

function updateUnitState() {
  const preset = currentPreset();
  unitSuffix.textContent = preset.unit;
  targetInput.max = String(preset.maxWeight);
  targetInput.step = preset.unit === "kg" ? "1.25" : "0.5";
  barWeightInput.value = String(preset.barWeight);
  barWeightInput.step = preset.unit === "kg" ? "1.25" : "0.5";
  barWeightInput.max = String(preset.maxWeight);
  renderInventoryFields();
  updateCalculator();
}

function updateInventoryVisibility() {
  inventoryPanel.hidden = !inventoryToggle.checked;
  updateCalculator();
}

function updateCalculator() {
  const setup = calculateBarbellSetup(targetInput.value, currentConfig());
  const { config } = setup;
  const displayTarget = setup.targetWeight === null ? config.barWeight : setup.targetWeight;
  const cappedLabel = setup.targetWeight !== null && setup.targetWeight > config.maxWeight
    ? "Capped at max"
    : formatDifference(setup.difference, config.unit);
  const platesText = setup.platesPerSide.length > 0
    ? setup.platesPerSide.map(formatWeight).join(" + ")
    : "Empty bar";
  const plateScale = Math.max(0.48, Math.min(1, 7.5 / Math.max(setup.platesPerSide.length, 7.5)));
  const heightScale = Math.max(0.86, Math.min(1, 0.82 + plateScale * 0.18));

  requestedWeight.textContent = `${formatWeight(displayTarget)} ${config.unit}`;
  actualWeight.textContent = `${formatWeight(setup.actualWeight)} ${config.unit}`;
  differenceWeight.textContent = cappedLabel;
  perSideTotal.textContent = `${formatWeight(setup.sideWeight)} ${config.unit}`;
  plateList.textContent = platesText;
  inputHelp.textContent = `Total bar weight, including the bar. Max load is ${formatWeight(config.maxWeight)} ${config.unit}.`;
  unitSuffix.textContent = config.unit;
  barbellVisual.style.setProperty("--plate-scale", String(plateScale));
  barbellVisual.style.setProperty("--height-scale", String(heightScale));
  barbellVisual.dataset.load = setup.platesPerSide.length >= 10 ? "heavy" : "normal";

  renderPlates(leftPlates, setup.platesPerSide, "left", config.unit);
  renderPlates(rightPlates, setup.platesPerSide, "right", config.unit);

  barbellVisual.setAttribute(
    "aria-label",
    `${formatWeight(setup.actualWeight)} ${config.unit} barbell loaded with ${platesText} per side`
  );
}

targetInput.addEventListener("input", updateCalculator);
barWeightInput.addEventListener("input", updateCalculator);
roundingModeInput.addEventListener("change", updateCalculator);
inventoryToggle.addEventListener("change", updateInventoryVisibility);
unitInputs.forEach((input) => input.addEventListener("change", updateUnitState));

document.querySelector("#target-form").addEventListener("submit", (event) => {
  event.preventDefault();
  targetInput.blur();
});

barWeightInput.value = String(BAR_WEIGHT);
targetInput.max = String(MAX_WEIGHT);
roundingModeInput.value = ROUNDING_MODES.nearest;
renderInventoryFields();
updateInventoryVisibility();
