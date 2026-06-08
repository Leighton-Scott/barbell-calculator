import { BAR_WEIGHT, calculateBarbellSetup } from "./calculator.js";

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
    plate.style.order = String(100 - weight);
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
  const platesText = setup.platesPerSide.length > 0
    ? setup.platesPerSide.map(formatWeight).join(" + ")
    : "Empty bar";

  requestedWeight.textContent = `${formatWeight(displayTarget)} lb`;
  actualWeight.textContent = `${formatWeight(setup.actualWeight)} lb`;
  differenceWeight.textContent = formatDifference(setup.difference);
  perSideTotal.textContent = `${formatWeight(setup.sideWeight)} lb`;
  plateList.textContent = platesText;

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
