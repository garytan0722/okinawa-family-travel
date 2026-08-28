import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const colors = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/gi)].map(([, name, value]) => [name, value]));

function luminance(hex) {
  const channels = hex.match(/[\da-f]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const [red, green, blue] = channels.map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return (.2126 * red) + (.7152 * green) + (.0722 * blue);
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

function declarationsFor(selector) {
  for (const [, selectors, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').map((item) => item.trim()).includes(selector)) return declarations;
  }
  return '';
}

function rule(selector) {
  const declarations = declarationsFor(selector);
  if (declarations) return declarations;
  assert.fail(`${selector} must have a CSS rule`);
}

test('primary sea actions keep normal white text readable', () => {
  assert.ok(contrast(colors.sea, '#ffffff') >= 4.5);
});

test('focus colors remain visible on light and primary surfaces', () => {
  assert.match(colors.focus, /^#[\da-f]{6}$/i);
  assert.match(colors['focus-on-color'], /^#[\da-f]{6}$/i);
  assert.ok(contrast(colors.focus, colors.ivory) >= 3);
  assert.ok(contrast(colors['focus-on-color'], colors.cocoa) >= 3);
});

test('focus ring color follows the surface surrounding each control', () => {
  for (const selector of [
    '.variant-tab.is-active:focus-visible',
    '.action-stack button:focus-visible',
    '.pdf-links a:focus-visible',
    '.emergency-card:focus-visible',
  ]) {
    assert.doesNotMatch(declarationsFor(selector), /focus-on-color|var\(--sun\)/);
  }
  assert.match(rule('.event-check input:focus-visible + .check-paw'), /var\(--focus\)/);
  assert.match(rule('.record-card button:focus-visible'), /var\(--focus-on-color\)/);
  assert.match(rule('.bottom-nav a:focus-visible'), /var\(--focus-on-color\)/);
});

test('energy controls provide a 44 pixel touch target', () => {
  const size = Number(rule('.energy-control button').match(/min-height:\s*([\d.]+)px/)?.[1]);
  assert.ok(size >= 44);
});

test('cat-paw completion stamp is prominent, tappable, and visible when checked', () => {
  const target = rule('.event-check');
  const stamp = rule('.dog-paw-stamp');
  const targetWidth = Number(target.match(/width:\s*([\d.]+)px/)?.[1]);
  const targetHeight = Number(target.match(/height:\s*([\d.]+)px/)?.[1]);
  const stampWidth = Number(stamp.match(/width:\s*([\d.]+)px/)?.[1]);
  const stampHeight = Number(stamp.match(/height:\s*([\d.]+)px/)?.[1]);
  assert.ok(targetWidth >= 52 && targetHeight >= 52, 'stamp target must grow beyond the former 44px control');
  assert.ok(stampWidth >= 48 && stampHeight >= 48, 'visible paw stamp must be substantially larger than 36px');
  assert.match(stamp, /opacity:\s*0/);
  assert.match(rule('.event-check input:checked + .check-paw .dog-paw-stamp'), /opacity:\s*1/);
});
