/**
 * SVG → PNG для колод 2–9. Первая колода не трогается.
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

const SVG_DIR = path.join(__dirname, '..', 'public', 'img', 'svg');
const OUT_WIDTH = 205;

const FROM_SVG = [
  ['2часть.svg', '2часть.png'],
  ['3часть.svg', '3часть.png'],
  ['4часть.svg', '4часть.png'],
  ['5часть.svg', '5часть.png'],
  ['6часть.svg', '6часть.png'],
  ['6.5часть.svg', '6.5часть.png'],
  ['7часть.svg', '7часть.png'],
  ['8часть .svg', '8часть.png'],
  ['9часть.svg', '9часть.png'],
];

function renderSvg(svgName) {
  const svg = fs.readFileSync(path.join(SVG_DIR, svgName));
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: OUT_WIDTH * 2 } });
  return resvg.render().asPng();
}

async function toPng(svgName, pngName) {
  const rendered = renderSvg(svgName);
  const out = await sharp(rendered)
    .resize({ width: OUT_WIDTH, withoutEnlargement: false })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(SVG_DIR, pngName), out);
  console.log('ok', pngName);
}

(async () => {
  console.log('skip 1часть (1).png');
  for (const [svg, png] of FROM_SVG) {
    // eslint-disable-next-line no-await-in-loop
    await toPng(svg, png);
  }
})();
