/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import React, { useEffect, useRef, useState } from "react";

interface ColorPickerProps {
  color: string;
  onChange?: (color: string) => void;
  defaultColor: string;
}

const basicColors = ["#1382ff", "#0aa76a", "#57bb30", "#ff9d17", "#a07758", "#ff650f", "#f71d21", "#f33989", "#753ec0", "#838e99"]

// const basicColors = [DEFAULT_COLOUR, "#57a6ff", "#0cd185", "#77d353", "#ffba5c", "#b8977e", "#ff9052", "#f95f62", "#f77fb3", "#976dd0", "#c6cbd0"];

// const WIDTH = 214;
// const HEIGHT = 150;

export default function ColorPicker({
  color,
  onChange,
  defaultColor
}: Readonly<ColorPickerProps>) {
  const [selfColor, setSelfColor] = useState(transformColor("hex", color));
  // const [_inputColor, setInputColor] = useState(color);
  const innerDivRef = useRef(null);
  const colorList = [defaultColor, ...basicColors];

  useEffect(() => {
    // Check if the dropdown is actually active
    if (innerDivRef.current !== null && onChange) {
      onChange(selfColor.hex);
      // setInputColor(selfColor.hex);
    }
  }, [selfColor, onChange]);

  useEffect(() => {
    if (color === undefined) return;
    const newColor = transformColor("hex", color);
    setSelfColor(newColor);
    // setInputColor(newColor.hex);
  }, [color]);

  return (
    <div
      className="lexical-color-picker-wrapper"
      // style={{ width: WIDTH }}
      ref={innerDivRef}>
      <div className="lexical-color-picker-basic-color">
        {colorList.map((basicColor) => (
          <button
            className={basicColor === selfColor.hex ? "active" : ""}
            key={basicColor}
            style={{backgroundColor: basicColor}}
            onClick={() => {
              // setInputColor(basicColor);
              setSelfColor(transformColor("hex", basicColor));
            }}
          />
        ))}
      </div>
    </div>
  );
}

export interface Position {
  x: number;
  y: number;
}


interface RGB {
  b: number;
  g: number;
  r: number;
}
interface HSV {
  h: number;
  s: number;
  v: number;
}
interface Color {
  hex: string;
  hsv: HSV;
  rgb: RGB;
}

export function toHex(value: string): string {
  if (!value.startsWith('#')) {
    const ctx = document.createElement('canvas').getContext('2d');

    if (!ctx) {
      throw new Error('2d context not supported or canvas already initialized');
    }

    ctx.fillStyle = value;

    return ctx.fillStyle;
  } else if (value.length === 4 || value.length === 5) {
    value = value
      .split('')
      .map((v, i) => (i ? v + v : '#'))
      .join('');

    return value;
  } else if (value.length === 7 || value.length === 9) {
    return value;
  }

  return '#000000';
}

function hex2rgb(hex: string): RGB {
  const rbgArr = (
    hex
      .replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (m, r, g, b) => '#' + r + r + g + g + b + b,
      )
      .substring(1)
      .match(/.{2}/g) || []
  ).map((x) => parseInt(x, 16));

  return {
    b: rbgArr[2],
    g: rbgArr[1],
    r: rbgArr[0],
  };
}

function rgb2hsv({r, g, b}: RGB): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);

  const h = d
    ? (max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
        ? 2 + (b - r) / d
        : 4 + (r - g) / d) * 60
    : 0;
  const s = max ? (d / max) * 100 : 0;
  const v = max * 100;

  return {h, s, v};
}

function hsv2rgb({h, s, v}: HSV): RGB {
  s /= 100;
  v /= 100;

  const i = ~~(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  const index = i % 6;

  const r = Math.round([v, q, p, p, t, v][index] * 255);
  const g = Math.round([t, v, v, q, p, p][index] * 255);
  const b = Math.round([p, p, t, v, v, q][index] * 255);

  return {b, g, r};
}

function rgb2hex({b, g, r}: RGB): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function transformColor<M extends keyof Color, C extends Color[M]>(
  format: M,
  color: C,
): Color {
  let hex: Color['hex'] = toHex('#121212');
  let rgb: Color['rgb'] = hex2rgb(hex);
  let hsv: Color['hsv'] = rgb2hsv(rgb);

  if (format === 'hex') {
    const value = color as Color['hex'];

    hex = toHex(value);
    rgb = hex2rgb(hex);
    hsv = rgb2hsv(rgb);
  } else if (format === 'rgb') {
    const value = color as Color['rgb'];

    rgb = value;
    hex = rgb2hex(rgb);
    hsv = rgb2hsv(rgb);
  } else if (format === 'hsv') {
    const value = color as Color['hsv'];

    hsv = value;
    rgb = hsv2rgb(hsv);
    hex = rgb2hex(rgb);
  }

  return {hex, hsv, rgb};
}
