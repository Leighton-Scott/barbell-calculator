import { BAR_WEIGHT, MAX_WEIGHT, calculateBarbellSetup } from "./calculator.js";

const plateMeta = {
  45: { className: "plate-45", label: "45" },
  35: { className: "plate-35", label: "35" },
  25: { className: "plate-25", label: "25" },
  10: { className: "plate-10", label: "10" },
  5: { className: "plate-5", label: "5" },
  2.5: { className: "plate-2-5", label: "2.5" }
};

const targetInput = document.querySelector("#target-weight");
const requestedWeight = document.querySelector("#requested-weight");
const actualWeight = document.querySelector("#actual-weight");
const differenceWeight = document.querySelector("#difference-weight");
const perSideTotal = document.querySelector("#per-side-total");
const plateList = document.querySelector("#plate-list");
const leftPlates = document.querySelector("#left-plates");
const rightPlates = document.querySelector("#right-plates");
const barbellVisual = document.querySelector("#barbell-visual");

function formatWeight(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDifference(value) {
  if (value === 0) return "Exact";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatWeight(value)} lb`;
}

function createPlateElement(weight, side) {
  const meta = plateMeta[weight];
  const plate = document.createElement("span");
  plate.className = `plate ${meta.className}`;
  plate.dataset.weight = String(weight);
  plate.textContent = meta.label;
  plate.title = `${meta.label} lb plate`;
  plate.setAttribute("aria-hidden", "true");

  if (side === "left") {
    plate.style.order = String(weight);
  }

  return plate;
}

function renderPlates(container, plates, side) {
  container.replaceChildren();

  if (plates.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-sleeve";
    empty.textContent = "Empty bar";
    container.append(empty);
    return;
  }

  for (const plate of plates) {
    container.append(createPlateElement(plate, side));
  }
}

function updateCalculator() {
  const setup = calculateBarbellSetup(targetInput.value);
  const displayTarget = setup.targetWeight === null ? BAR_WEIGHT : setup.targetWeight;
  const cappedLabel = setup.targetWeight !== null && setup.targetWeight > MAX_WEIGHT
    ? "Capped at max"
    : formatDifference(setup.difference);
  const platesText = setup.platesPerSide.length > 0
    ? setup.platesPerSide.map(formatWeight).join(" + ")
    : "Empty bar";
  const plateScale = Math.max(0.48, Math.min(1, 7.5 / Math.max(setup.platesPerSide.length, 7.5)));
  const heightScale = Math.max(0.86, Math.min(1, 0.82 + plateScale * 0.18));

  requestedWeight.textContent = `${formatWeight(displayTarget)} lb`;
  actualWeight.textContent = `${formatWeight(setup.actualWeight)} lb`;
  differenceWeight.textContent = cappedLabel;
  perSideTotal.textContent = `${formatWeight(setup.sideWeight)} lb`;
  plateList.textContent = platesText;
  barbellVisual.style.setProperty("--plate-scale", String(plateScale));
  barbellVisual.style.setProperty("--height-scale", String(heightScale));
  barbellVisual.dataset.load = setup.platesPerSide.length >= 10 ? "heavy" : "normal";

  renderPlates(leftPlates, setup.platesPerSide, "left");
  renderPlates(rightPlates, setup.platesPerSide, "right");

  barbellVisual.setAttribute(
    "aria-label",
    `${formatWeight(setup.actualWeight)} lb barbell loaded with ${platesText} per side`
  );
}

targetInput.addEventListener("input", updateCalculator);
document.querySelector("#target-form").addEventListener("submit", (event) => {
  event.preventDefault();
  targetInput.blur();
});

updateCalculator();
