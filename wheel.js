// Draws a colored, animated spin wheel in the terminal using Unicode half-blocks ("▀").
// Each character cell holds 2 "pixels": the top one as foreground color, the bottom one as background.
// This is the same trick terminal image viewers use, so it works in any 256-color terminal.

const R = 16; // wheel radius in pixels
const SEGMENTS = [
  { name: "Legislature", color: 208 }, // saffron
  { name: "Executive", color: 255 },   // white
  { name: "Judiciary", color: 34 },    // green
  { name: "Legislature", color: 208 },
  { name: "Executive", color: 255 },
  { name: "Judiciary", color: 34 },
];
const HUB = 19; // navy, like the Ashoka Chakra
const TAU = Math.PI * 2;
const SEG = TAU / SEGMENTS.length;
const POINTER = -Math.PI / 2; // pointer sits at the top

const mod = (a, m) => ((a % m) + m) % m;
const segAt = (angle, rot) => Math.floor(mod(angle - rot, TAU) / SEG);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pixel(x, y, rot) {
  const dx = x - R, dy = y - R;
  const d = Math.hypot(dx, dy);
  if (d > R + 0.3) return null;
  if (d < 2.2) return HUB;
  if (d > R - 0.8) return 240; // grey rim
  return SEGMENTS[segAt(Math.atan2(dy, dx), rot)].color;
}

function frame(rot) {
  const out = [" ".repeat(R - 1) + "\x1b[1;31m▼▼▼\x1b[0m"];
  // Label letters at the middle of each segment.
  const labels = new Map();
  SEGMENTS.forEach((s, i) => {
    const a = rot + (i + 0.5) * SEG;
    const cx = Math.round(R + Math.cos(a) * R * 0.62);
    const cy = Math.floor((R + Math.sin(a) * R * 0.62) / 2);
    labels.set(`${cx},${cy}`, s.name[0]);
  });
  for (let row = 0; row <= R; row++) {
    let line = "";
    for (let x = 0; x <= R * 2; x++) {
      const top = pixel(x, row * 2, rot);
      const bot = pixel(x, row * 2 + 1, rot);
      const label = labels.get(`${x},${row}`);
      if (label && top !== null && top === bot) {
        line += `\x1b[1;38;5;16;48;5;${top}m${label}\x1b[0m`;
      } else if (top === null && bot === null) {
        line += " ";
      } else if (top === null) {
        line += `\x1b[38;5;${bot}m▄\x1b[0m`;
      } else if (bot === null) {
        line += `\x1b[38;5;${top}m▀\x1b[0m`;
      } else {
        line += `\x1b[38;5;${top};48;5;${bot}m▀\x1b[0m`;
      }
    }
    out.push(line);
  }
  const current = SEGMENTS[segAt(POINTER, rot)];
  out.push(`\x1b[1;38;5;${current.color}m${" ".repeat(R - Math.floor(current.name.length / 2))}${current.name.padEnd(12)}\x1b[0m`);
  return out;
}

// Spins the wheel with an ease-out animation and resolves to the organ under the pointer.
export async function spinWheelAnimation() {
  const start = Math.random() * TAU;
  const total = TAU * (4 + Math.random() * 3); // 4-7 full turns
  const steps = process.stdout.isTTY ? 90 : 1;
  let height = 0;
  for (let i = 1; i <= steps; i++) {
    const p = i / steps;
    const rot = start + total * (1 - (1 - p) ** 3);
    const lines = frame(rot);
    if (height) process.stdout.write(`\x1b[${height}A`);
    process.stdout.write(lines.join("\n") + "\n");
    height = lines.length;
    if (i < steps) await sleep(33);
  }
  return SEGMENTS[segAt(POINTER, start + total)].name;
}
