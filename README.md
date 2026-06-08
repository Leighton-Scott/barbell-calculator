# Barbell Calculator

A mobile-friendly GitHub Pages app for calculating the closest loadable Olympic barbell setup for a target weight.

## What it does

- Uses a 45 lb Olympic bar.
- Supports pound and kilogram presets.
- Supports custom bar weight, rounding mode, and optional plate inventory limits.
- Uses common US plates by default: 45, 35, 25, 10, 5, and 2.5 lb.
- Rounds to the nearest loadable total by default, with ties rounding down.
- Shows the actual weight, difference from target, and plates needed per side.
- Displays a clean visual barbell with matching plates on both sides.

## Local use

Open `index.html` in a browser, or serve the folder with any static file server.

To run the calculator unit tests:

```sh
npm test
```
