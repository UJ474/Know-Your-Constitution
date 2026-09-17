#!/usr/bin/env node
// Sansthaein Aur Samvidhan - learn Parts V & VI of the Constitution of India through terminal games.
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { spinWheelAnimation } from "./wheel.js";
import {
  TTY, W, C, ORGAN_COLOR, fg, bg, bold, dim, pad, center, clear, sleep, wrap, box, tag, progress,
  banner, header, bigText, dice,
} from "./ui.js";

const DATA = JSON.parse(readFileSync(new URL("./data.json", import.meta.url), "utf8"));
const ORGANS = ["Legislature", "Executive", "Judiciary"];

// ---------- input ----------

// Line-queue input so it works both interactively and with piped stdin.
const rl = createInterface({ input: process.stdin });
const lines = [];
const waiters = [];
let closed = false;
rl.on("line", (l) => (waiters.length ? waiters.shift()(l) : lines.push(l)));
rl.on("close", () => { closed = true; if (waiters.length) bye(); });

function bye() {
  console.log(`\n  ${fg(C.saffron, "Thanks for learning.")} ${fg(C.white, "Jai")} ${fg(C.green, "Hind!")}\n`);
  process.exit(0);
}

function input(prompt) {
  process.stdout.write(prompt);
  if (!lines.length && closed) bye();
  return new Promise((resolve) => (lines.length ? resolve(lines.shift()) : waiters.push(resolve)));
}

const print = (l) => console.log([].concat(l).join("\n"));
const pause = (msg = "Press Enter to continue") => input(`\n  ${dim(msg + " ↵")} `);

// Ask for a number 1..n; returns 0-based index or null for blank/invalid.
async function pick(prompt, n) {
  const s = (await input(`\n  ${fg(C.gold, "❯")} ${prompt} ${dim(`[1-${n}]`)}: `)).trim();
  const i = Number(s);
  return /^\d+$/.test(s) && i >= 1 && i <= n ? i - 1 : null;
}

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const choice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// ---------- shared screens ----------

const articleCard = (a) => box([
  `${tag(a.organ)}  ${dim(`Part ${a.part}`)}`, "",
  fg(ORGAN_COLOR[a.organ], bold(`Article ${a.article}`)),
  bold(a.title), "",
  ...wrap(a.simple, W - 4),
], { color: ORGAN_COLOR[a.organ] });

// Shows a question card, reveals the answer, and returns true if correct.
// `top` redraws whatever sits above the card (header, board, ...).
async function askQuestion(a, heading, top) {
  const card = (chosen) => box([
    `${tag(a.organ)}  ${dim(`Article ${a.article}`)}`, "",
    ...wrap(a.q, W - 4).map(bold), "",
    ...a.options.map((o, i) => {
      const key = `[${i + 1}]`;
      if (chosen === undefined) return `${fg(C.gold, bold(key))} ${o}`;
      if (i === a.answer) return fg(C.green, bold(`${key} ${o}  ✔`));
      if (i === chosen) return fg(C.red, bold(`${key} ${o}  ✘`));
      return dim(`${key} ${o}`);
    }),
  ], { title: heading, color: ORGAN_COLOR[a.organ] });

  clear(); top(); print(card());
  const chosen = await pick("Your answer", a.options.length);
  const ok = chosen === a.answer;
  clear(); top(); print(card(chosen ?? -1));
  print(box([bold(ok ? "✔ Correct!" : "✘ Not quite!"), "", ...wrap(a.simple, W - 4)],
    { title: ok ? "Well done" : "Learn it", color: ok ? C.green : C.red }));
  await pause();
  return ok;
}

async function results(title, score, total) {
  const pct = total ? score / total : 0;
  const stars = Math.round(pct * 5);
  const color = pct >= 0.7 ? C.green : pct >= 0.4 ? C.gold : C.red;
  const msg = pct >= 0.7 ? "Excellent! You know your Constitution."
    : pct >= 0.4 ? "Good effort! Keep learning." : "Keep practising - try Learn mode first.";
  clear(); print(header(title));
  print(box([
    "",
    ...bigText(`${score}/${total}`).map((l) => center(fg(color, bold(l)), W - 4)), "",
    center(fg(C.gold, "★".repeat(stars)) + fg(238, "★".repeat(5 - stars)), W - 4), "",
    center(bold(msg), W - 4), "",
  ], { title: "Result", color }));
  await pause("Press Enter for main menu");
}

// ---------- Learn ----------

async function learn() {
  clear(); print(header("Learn"));
  print(box([
    "",
    ...ORGANS.map((o, i) => `${fg(C.gold, bold(`[${i + 1}]`))} ${pad(tag(o), 16)} ${dim(`${DATA.filter((a) => a.organ === o).length} articles`)}`),
    "",
  ], { title: "Choose an organ of government", color: C.saffron }));
  const c = await pick("Organ", ORGANS.length);
  if (c === null) return;
  const cards = DATA.filter((a) => a.organ === ORGANS[c]);
  for (const [i, a] of cards.entries()) {
    clear(); print(header(`Learn › ${ORGANS[c]}`));
    print(`  ${progress(i + 1, cards.length, ORGAN_COLOR[a.organ])} ${dim(`${i + 1}/${cards.length}`)}\n`);
    print(articleCard(a));
    if ((await input(`\n  ${dim("Enter ↵ next  ·  q back")} `)).trim().toLowerCase() === "q") break;
  }
}

// ---------- Quiz ----------

async function quiz(total = 10) {
  let score = 0;
  for (const [i, a] of shuffle(DATA).slice(0, total).entries()) {
    const top = () => {
      print(header("Quiz"));
      print(`  ${progress(i + 1, total, C.saffron)} ${dim(`Question ${i + 1}/${total}`)}   ${fg(C.gold, `★ ${score}`)}\n`);
    };
    if (await askQuestion(a, `Question ${i + 1}`, top)) score++;
  }
  await results("Quiz complete", score, total);
}

// ---------- Spin the Wheel ----------

async function spinWheel(rounds = 5) {
  let score = 0;
  for (let r = 1; r <= rounds; r++) {
    const top = (extra = "") => {
      print(header("Spin the Wheel"));
      print(`  ${progress(r, rounds, C.saffron)} ${dim(`Round ${r}/${rounds}`)}   ${fg(C.gold, `★ ${score}`)}\n${extra}`);
    };
    clear(); top();
    await pause("Press Enter to spin the wheel");
    const organ = await spinWheelAnimation();
    await sleep(800);
    const a = choice(DATA.filter((x) => x.organ === organ));
    if (await askQuestion(a, `Round ${r}`, () => top(`  The wheel landed on ${tag(organ)}\n`))) score++;
  }
  await results("Wheel complete", score, rounds);
}

// ---------- Flash Cards ----------

const CARD_LINES = 13;

function flashFace(a, back) {
  const inner = W - 4;
  const color = ORGAN_COLOR[a.organ];
  const content = back
    ? [tag(a.organ), "", fg(color, bold(`Article ${a.article}`)), bold(a.title), "", ...wrap(a.simple, inner)]
    : ["", dim("A R T I C L E"), "", ...bigText(a.article).map((l) => fg(color, bold(l))), "", bold(a.title), "", tag(a.organ)]
      .map((l) => center(l, inner));
  while (content.length < CARD_LINES) content.push("");
  return box(content, { title: back ? "Back" : "Front", color: back ? color : C.gold });
}

const blankCard = (width, color) =>
  box(Array(CARD_LINES).fill(""), { width, color }).map((l) => " ".repeat((W - width) >> 1) + l);

async function flashCards() {
  const deck = shuffle(DATA);
  let known = 0, learning = 0;
  for (const [i, a] of deck.entries()) {
    const top = () => {
      print(header("Flash Cards"));
      print(`  ${progress(i + 1, deck.length, C.saffron)} ${dim(`Card ${i + 1}/${deck.length}`)}   ${fg(C.green, `✔ ${known}`)}  ${fg(C.red, `✘ ${learning}`)}\n`);
    };
    clear(); top(); print(flashFace(a, false));
    await pause("Press Enter to flip");

    // Flip animation: the card narrows to an edge, then widens showing the back.
    if (TTY) {
      for (const [w, color] of [[48, C.gold], [32, C.gold], [16, C.gold], [6, C.gold], [16, ORGAN_COLOR[a.organ]], [32, ORGAN_COLOR[a.organ]], [48, ORGAN_COLOR[a.organ]]]) {
        clear(); top(); print(blankCard(w, color));
        await sleep(45);
      }
    }
    clear(); top(); print(flashFace(a, true));

    const ans = (await input(`\n  ${fg(C.green, bold("[y]"))} knew it   ${fg(C.red, bold("[n]"))} still learning   ${dim("[q] quit")}  ${fg(C.gold, "❯")} `)).trim().toLowerCase();
    if (ans === "q") break;
    if (ans === "y") known++;
    else learning++;
  }
  if (known + learning) await results("Flash cards done", known, known + learning);
}

// ---------- Snakes & Ladders ----------

const BOARD = { size: 30, cols: 6, ladders: { 3: 11, 8: 16, 14: 25, 19: 28 }, snakes: { 29: 9, 22: 12, 17: 4, 26: 15 } };
const PLAYER_COLORS = [C.cyan, C.pink];

function drawBoard(players, turn, msg) {
  const { size, cols, ladders, snakes } = BOARD;
  const CW = 8;
  print(header("Snakes & Ladders"));
  for (let r = size / cols - 1; r >= 0; r--) {
    const nums = Array.from({ length: cols }, (_, c) => r * cols + c + 1);
    if (r % 2) nums.reverse();
    let l1 = "  ", l2 = "  ";
    nums.forEach((n, c) => {
      const shade = n === size ? 136 : ladders[n] ? 22 : snakes[n] ? 52 : (r + c) % 2 ? 236 : 239;
      const mark = n === size ? fg(C.gold, bold("HOME"))
        : ladders[n] ? fg(120, bold(`↑${ladders[n]}`))
        : snakes[n] ? fg(210, bold(`↓${snakes[n]}`)) : "";
      const tokens = players.map((p, i) => (p.pos === n ? fg(PLAYER_COLORS[i], bold("●")) : "")).filter(Boolean).join(" ");
      l1 += bg(shade, pad(fg(250, String(n).padStart(3)) + " " + mark, CW));
      l2 += bg(shade, center(tokens, CW));
    });
    print([l1, l2]);
  }
  print(`\n  ${fg(120, bold("↑"))} ${dim("ladder: answer right to climb")}    ${fg(210, bold("↓"))} ${dim("snake: answer right to escape")}\n`);
  print("  " + players.map((p, i) =>
    `${i === turn ? fg(C.gold, "▶") : " "} ${fg(PLAYER_COLORS[i], bold(`● ${p.name}`))} ${dim(p.pos ? `square ${p.pos}` : "start")}`).join("      "));
  if (msg) print(`\n  ${msg}`);
}

async function rollDice(color) {
  let n = 1;
  for (let i = 0; i < (TTY ? 10 : 1); i++) {
    n = randInt(1, 6);
    if (i) process.stdout.write("\x1b[5A");
    print(dice(n).map((l) => "  " + fg(color, l)));
    await sleep(50 + i * 15);
  }
  await sleep(400);
  return n;
}

async function snakesLadders() {
  const { size, ladders, snakes } = BOARD;
  clear(); print(header("Snakes & Ladders"));
  const players = [];
  for (const i of [0, 1]) {
    const name = (await input(`  ${fg(PLAYER_COLORS[i], bold("●"))} Player ${i + 1} name: `)).trim();
    players.push({ name: name || `Player ${i + 1}`, pos: 0 });
  }

  let msg = `First to square ${size} wins!`;
  for (let turn = 0; ; turn = (turn + 1) % players.length) {
    const p = players[turn];
    const color = PLAYER_COLORS[turn];
    const show = (m) => drawBoard(players, turn, m);

    clear(); show(msg);
    await pause(`${p.name}, press Enter to roll`);
    const roll = await rollDice(color);

    const target = p.pos + roll;
    if (target > size) {
      msg = `${fg(color, bold(p.name))} rolled ${roll} - needs an exact roll to reach ${size}.`;
      continue;
    }
    while (p.pos < target) {
      p.pos++;
      clear(); show(`${fg(color, bold(p.name))} rolled ${bold(String(roll))}...`);
      await sleep(150);
    }

    const from = p.pos;
    if (ladders[from]) {
      const ok = await askQuestion(choice(DATA), `Ladder! Answer to climb ${from} → ${ladders[from]}`, show);
      if (ok) p.pos = ladders[from];
      msg = ok ? fg(120, `${p.name} climbed the ladder from ${from} to ${p.pos}!`) : `${p.name} missed the ladder and stays on ${from}.`;
    } else if (snakes[from]) {
      const ok = await askQuestion(choice(DATA), `Snake! Answer to escape the fall to ${snakes[from]}`, show);
      if (!ok) p.pos = snakes[from];
      msg = ok ? fg(120, `${p.name} escaped the snake on ${from}!`) : fg(210, `${p.name} slid down from ${from} to ${p.pos}.`);
    } else {
      msg = `${fg(color, bold(p.name))} rolled ${roll} and moved to ${p.pos}.`;
    }

    if (p.pos === size) {
      clear(); show("");
      print("");
      print(box(["", center(fg(C.gold, bold(`★  ${p.name.toUpperCase()} WINS!  ★`)), W - 4), "",
        center(dim("Great job learning about India's institutions."), W - 4), ""], { color: C.gold }));
      await pause("Press Enter for main menu");
      return;
    }
  }
}

// ---------- Main menu ----------

const MENU = [
  ["Learn", "Simple article cards", learn],
  ["Quiz", "10 quick questions", quiz],
  ["Spin the Wheel", "Land on an organ, then answer", spinWheel],
  ["Flash Cards", "Flip cards, test your memory", flashCards],
  ["Snakes & Ladders", "2 players, answer to climb", snakesLadders],
];

async function main() {
  while (true) {
    clear();
    print(banner());
    print("");
    print(box([
      "",
      ...MENU.map(([name, desc], i) => `${fg(C.gold, bold(`[${i + 1}]`))} ${bold(name.padEnd(18))}${dim(desc)}`),
      `${fg(C.gold, bold(`[${MENU.length + 1}]`))} ${bold("Quit")}`,
      "",
    ], { title: "Main Menu", color: C.saffron }));
    const c = await pick("Choose", MENU.length + 1);
    if (c === null) continue;
    if (c === MENU.length) break;
    await MENU[c][2]();
  }
  bye();
}

main();
