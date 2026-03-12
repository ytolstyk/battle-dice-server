# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Run dev server on port 8080 (`ts-node src/server.ts`)
- `rtk err npm run build` — Compile TypeScript to `dist/`
- `rtk lint` - Run lint (`eslint`)
- `rtk tsc` - Type check (`tsc`)
- `npm run serve` — Run compiled production server from `dist/server.js`

No lint or test commands are configured.

## Architecture

This is a real-time multiplayer dice-rolling game server. It pairs with the frontend at [battle-dice-web](https://github.com/ytolstyk/battle-dice-web).

**Data flow:** Clients connect via Socket.IO → `socketHandler.ts` handles events → mutates state in `store.ts` → emits updates back to room members.

### Key files

- **`src/server.ts`** — Creates the HTTP server, configures Socket.IO with CORS, passes the `io` instance to `socketHandler`. Socket.IO path is `/battle-dice/`.
- **`src/socketHandler.ts`** — All Socket.IO event handling (`joinRoom`, `leaveRoom`, `rollDice`, `updateDiceRules`, `updateUserRollResult`, `updateUserName`, `disconnect`). After each mutation, emits the updated room state to all members.
- **`src/store.ts`** — Pure in-memory state (no database). Tracks rooms and socket-to-user mappings. Key functions: `addUserToRoom`, `removeUser`, `disconnectUser`, `updateDiceRules`, `updateUserStatus`, `updateUserRoll`, `updateUserName`, `pruneRooms`.
- **`src/types.ts`** — Shared types: `DiceResult`, `Roll`, `ConnectingUser`, `User`, `Room`, `StoreState`.

### Room ownership

The first user to join a room becomes its owner. Only the owner can call `updateDiceRules`. Owner ID is tracked in `Room.ownerId`.

### CORS origins

- Production: `https://main.d2wj3ci2d6hgbv.amplifyapp.com`
- Development: `http://localhost:5173`

### Validations

Before finishing any task, run the following commands:

1. **Lint** `rtk lint`
2. **Types** `rtk tsc`
3. **Build** `rtk err npm run build`
4. **Test** `rtk test npm run test`

If any command fails, fix the issue before submitting.
