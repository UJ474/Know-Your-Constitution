# Sansthaein Aur Samvidhan (Know Your Constitution)

**Institutions & Constitution:** a set of terminal games that teach **Part V (the Union)** and **Part VI (the States)** of the Constitution of India in plain language.

The project answers the *"Let's Learn Constitution in a Simpler Manner – Institution Perspective"* problem statement from the Ministry of Law & Justice (Department of Justice). The full brief is in [`Task.md`](Task.md). Every article is rewritten in simple words and grouped under one of the three organs of government:

| Organ | Colour |
| --- | --- |
| Legislature | Saffron |
| Executive | White |
| Judiciary | Green |

## Features

The main menu has five modes:

1. **Learn**: pick an organ and step through simple article cards.
2. **Quiz**: answer 10 random multiple-choice questions and get a score out of 5 stars.
3. **Spin the Wheel**: spin an animated, colour-coded wheel. It lands on an organ, and you answer a question about that organ. Plays 5 rounds.
4. **Flash Cards**: see the article number on the front, flip the card (with an animation) to read the explanation, then mark whether you knew it.
5. **Snakes & Ladders**: a 2-player board with 30 squares. Land on a ladder and you must answer a question to climb it. Land on a snake and a correct answer saves you from sliding down.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- A terminal with 256-colour and Unicode support (most modern terminals have both)

The project has **no dependencies**. It only uses Node's built-in modules.

## Getting started

```bash
git clone https://github.com/UJ474/Know-Your-Constitution.git
cd Know-Your-Constitution
npm start        # or: node app.js
```

To install it as a global `samvidhan` command:

```bash
npm link
samvidhan
```

### Controls

- Type the number of a menu option or answer, then press **Enter**.
- Press **Enter** to continue, flip a card or roll the dice.
- In Learn mode, type `q` to go back. In Flash Cards, type `y` if you knew it, `n` if you are still learning, or `q` to quit.

If stdout is not a TTY (for example, when input is piped in), animations are skipped. This lets you script or test the app:

```bash
printf '2\n2\n\n' | node app.js
```

## Articles covered

The data has 26 entries: 18 from Part V and 8 from Part VI.

| Organ | Part V (Union) | Part VI (States) |
| --- | --- | --- |
| Executive | 52, 54, 56, 58, 61, 72, 74–75, 76, 123, 148 | 153–155, 161, 163–164, 165 |
| Legislature | 79, 80, 83, 108, 109–110 | 168–170 |
| Judiciary | 124, 141, 143 | 214 & 217, 226, 233 |

## Project structure

```
.
├── app.js      # Entry point: input handling, main menu and all five game modes
├── ui.js       # Terminal UI helpers: colours, boxes, progress bars, big digits, dice
├── wheel.js    # Animated spin wheel drawn with Unicode half-blocks
├── data.json   # Article database: simplified text and quiz questions
├── Task.md     # Original problem statement
└── package.json
```

## Adding or editing articles

All content is stored in `data.json`. Each entry looks like this:

```json
{
  "article": "56",
  "part": "V",
  "organ": "Executive",
  "title": "Term of the President",
  "simple": "The President holds office for 5 years.",
  "q": "What is the term of the President?",
  "options": ["4 years", "5 years", "6 years"],
  "answer": 1
}
```

- `organ` must be `Legislature`, `Executive` or `Judiciary`.
- `answer` is the **0-based** index of the correct option.
- `article` is a string, so ranges such as `"74-75"` work. The big-digit font on flash cards supports digits, spaces, `-`, `/` and `&`.

New entries show up automatically in every game mode.

## Disclaimer

The explanations are simplified for learning and are not legal advice. For the authoritative text, see the [Constitution of India](https://legislative.gov.in/constitution-of-india/).

*Jai Hind!* 🇮🇳