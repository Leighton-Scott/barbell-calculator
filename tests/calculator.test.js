import assert from "node:assert/strict";
import { calculateBarbellSetup } from "../src/calculator.js";

function setup(input, options) {
  return calculateBarbellSetup(input, options);
}

assert.deepEqual(setup(45).platesPerSide, []);
assert.equal(setup(45).actualWeight, 45);

assert.deepEqual(setup(135).platesPerSide, [45]);
assert.equal(setup(135).actualWeight, 135);

assert.deepEqual(setup(185).platesPerSide, [45, 25]);
assert.equal(setup(185).actualWeight, 185);

assert.deepEqual(setup(225).platesPerSide, [45, 45]);
assert.equal(setup(225).actualWeight, 225);

assert.equal(setup(183).actualWeight, 185);
assert.equal(setup(183).difference, 2);

assert.equal(setup(182).actualWeight, 180);
assert.equal(setup(182).difference, -2);

assert.equal(setup(40).actualWeight, 45);
assert.deepEqual(setup(40).platesPerSide, []);

assert.equal(setup("").actualWeight, 45);
assert.equal(setup("not a number").actualWeight, 45);

assert.equal(setup(187.5).actualWeight, 185);
assert.equal(setup(187.6).actualWeight, 190);

assert.equal(setup(1000).actualWeight, 1000);
assert.deepEqual(setup(1000).platesPerSide, [45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 25, 2.5]);

assert.equal(setup(1200).actualWeight, 1000);

assert.equal(setup(183, { roundingMode: "under" }).actualWeight, 180);
assert.equal(setup(182, { roundingMode: "over" }).actualWeight, 185);

assert.equal(setup(95, { barWeight: 35 }).actualWeight, 95);
assert.deepEqual(setup(95, { barWeight: 35 }).platesPerSide, [25, 5]);

assert.equal(setup(100, { unit: "kg" }).actualWeight, 100);
assert.deepEqual(setup(100, { unit: "kg" }).platesPerSide, [25, 15]);

assert.equal(setup(101, { unit: "kg" }).actualWeight, 100);
assert.equal(setup(101.5, { unit: "kg" }).actualWeight, 102.5);

const limited = setup(225, {
  inventory: {
    mode: "limited",
    counts: { 45: 1, 35: 0, 25: 1, 10: 1, 5: 0, 2.5: 0 }
  }
});

assert.equal(limited.actualWeight, 205);
assert.deepEqual(limited.platesPerSide, [45, 25, 10]);

const emptyHomeGym = setup(135, {
  inventory: {
    mode: "limited",
    counts: { 45: 0, 35: 0, 25: 0, 10: 0, 5: 0, 2.5: 0 }
  }
});

assert.equal(emptyHomeGym.actualWeight, 45);
assert.deepEqual(emptyHomeGym.platesPerSide, []);

console.log("Calculator tests passed");
