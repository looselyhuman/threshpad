# Contributing to threshpad

## Prerequisites

- Ubuntu 24+ or Fedora 40+ with GNOME 45+
- Node.js 20+ (for ESLint)
- [`batctl`](https://github.com/Ooooze/batctl) installed at `/usr/local/bin/batctl`

## Setup

```bash
git clone https://github.com/looselyhuman/threshpad.git
cd threshpad
npm install   # installs ESLint
```

## Testing without hardware

```bash
THRESHPAD_MOCK=1 gnome-extensions enable threshpad@looselyhuman
```

The extension will read from `test/fixtures/` instead of live sysfs and skip
all batctl invocations.

## Code style

- 4-space indent, single quotes, semicolons
- JSDoc on all exported functions
- All I/O in try/catch — a GJS exception takes GNOME Shell down with it

Run the linter before committing:
```bash
npx eslint extension/
```

## Commit format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(panel): add live charge display
fix(sysfs): handle missing BAT1
chore: update dependencies
```

## Branch strategy

- `main` — tagged releases only
- `dev` — working branch; open PRs against this
- Feature branches: `feat/description`, `fix/description`
