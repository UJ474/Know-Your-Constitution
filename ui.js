// Small terminal UI toolkit: 256-color helpers, boxes, progress bars, big digits and dice.

export const TTY = Boolean(process.stdout.isTTY);
export const W = 60; // standard content width

export const C = { saffron: 208, white: 255, green: 34, navy: 19, red: 196, gold: 220, grey: 244, cyan: 51, pink: 213 };
export const ORGAN_COLOR = { Legislature: C.saffron, Executive: C.white, Judiciary: C.green };

export const fg = (c, s) => `\x1b[38;5;${c}m${s}\x1b[39m`;
export const bg = (c, s) => `\x1b[48;5;${c}m${s}\x1b[49m`;
export const bold = (s) => `\x1b[1m${s}\x1b[22m`;
export const dim = (s) => `\x1b[2m${s}\x1b[22m`;

export const visibleLen = (s) => s.replace(/\x1b\[[0-9;]*m/g, "").length;
export const pad = (s, w) => s + " ".repeat(Math.max(0, w - visibleLen(s)));
export const center = (s, w) => pad(" ".repeat(Math.max(0, (w - visibleLen(s)) >> 1)) + s, w);

export const clear = () => process.stdout.write(TTY ? "\x1b[2J\x1b[H" : "\n");
export const sleep = (ms) => new Promise((r) => (TTY ? setTimeout(r, ms) : r()));

export function wrap(text, width) {
  const out = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > width) {
      out.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) out.push(line);
  return out;
}

// Rounded box, indented by 2 spaces. Returns an array of lines.
export function box(lines, { width = W, color = C.grey, title = "" } = {}) {
  const inner = width - 4;
  const t = title ? ` ${fg(color, bold(title))} ` : "";
  return [
    fg(color, "╭─") + t + fg(color, "─".repeat(Math.max(0, width - 3 - visibleLen(t))) + "╮"),
    ...lines.map((l) => `${fg(color, "│")} ${pad(l, inner)} ${fg(color, "│")}`),
    fg(color, "╰" + "─".repeat(width - 2) + "╯"),
  ].map((l) => "  " + l);
}

export const tag = (organ) => bg(ORGAN_COLOR[organ], fg(16, bold(` ${organ.toUpperCase()} `)));

export function progress(current, total, color, width = 24) {
  const filled = Math.round((current / total) * width);
  return fg(color, "█".repeat(filled)) + fg(238, "░".repeat(width - filled));
}

const bar = () => fg(C.saffron, "━".repeat(W / 3)) + fg(C.white, "━".repeat(W / 3)) + fg(C.green, "━".repeat(W / 3));

export const banner = () => [
  "  " + bar(), "",
  "  " + center(fg(C.saffron, bold("☸  SANSTHAEIN AUR SAMVIDHAN  ☸")), W),
  "  " + center(dim("Institutions & Constitution · Parts V & VI"), W), "",
  "  " + bar(),
];

export const header = (title) => [
  "  " + bar(),
  `  ${fg(C.saffron, bold("☸ SANSTHAEIN AUR SAMVIDHAN"))}  ${dim("›")}  ${bold(title)}`,
  "  " + bar(), "",
];

const FONT = {
  0: ["┏━┓", "┃ ┃", "┗━┛"], 1: [" ┓ ", " ┃ ", " ┻ "], 2: ["┏━┓", "┏━┛", "┗━━"], 3: ["┏━┓", " ━┫", "┗━┛"],
  4: ["╻ ╻", "┗━┫", "  ╹"], 5: ["┏━━", "┗━┓", "┗━┛"], 6: ["┏━━", "┣━┓", "┗━┛"], 7: ["━━┓", "  ┃", "  ╹"],
  8: ["┏━┓", "┣━┫", "┗━┛"], 9: ["┏━┓", "┗━┫", "┗━┛"], "-": ["   ", "━━━", "   "], "/": ["  ╱", " ╱ ", "╱  "],
  "&": ["   ", " & ", "   "], " ": [" ", " ", " "],
};

// Renders digits (and - / &) as 3-line big text.
export const bigText = (s) => [0, 1, 2].map((row) => [...s].map((ch) => (FONT[ch] ?? FONT[" "])[row]).join(" "));

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

export function dice(n) {
  const cell = (i) => (PIPS[n].includes(i) ? "●" : " ");
  return [
    "╭───────╮",
    ...[0, 3, 6].map((r) => `│ ${cell(r)} ${cell(r + 1)} ${cell(r + 2)} │`),
    "╰───────╯",
  ];
}
