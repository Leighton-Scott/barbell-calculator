import assert from "node:assert/strict";
import { calculateBarbellSetup } from "../src/calculator.js";

function setup(input) {
  return calculateBarbellSetup(input);
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

console.log("Calculator tests passed");
