# Battle Dice Server

A Socket.IO server for the Battle Dice multiplayer dice-rolling game. Players join shared rooms, roll dice, and see each other's results in real time. State is kept in memory — no database required.

**Web UI repo:** [battle-dice-web](https://github.com/ytolstyk/battle-dice-web)

## Running locally

```bash
npm install
npm start        # dev server on port 8080
```

```bash
npm run build    # compile TypeScript to dist/
npm run serve    # run compiled server
```

## Socket.IO

**Path:** `/battle-dice/`

All event handlers accept an optional acknowledgement callback: `(response: { success: boolean, error?: string }) => void`.

### Emitted by server

| Event | Trigger |
|---|---|
| `roomUpdated` | User joins, leaves, disconnects, or room is reset |
| `diceRulesUpdated` | Owner updates dice rules |
| `diceRolled` | A user starts rolling |
| `rollResult` | A user submits their roll result |
| `userNameUpdated` | A user changes their name |
| `rerollRequested` | A user requests a reroll |
| `rerollResolved` | A reroll request is approved or declined |

### Received by server

#### `joinRoom`
```json
{ "roomId": "string", "user": { "id": "string", "name": "string" } }
```
Adds the user to the room, creating it if it doesn't exist. The first user to join becomes the room owner.

#### `leaveRoom`
```json
{ "roomId": "string", "userId": "string" }
```

#### `updateDiceRules`
```json
{ "roomId": "string", "userId": "string", "diceRules": "string" }
```
Owner only. Resets all participants to `connected` status and clears rolls.

#### `rollDice`
```json
{ "roomId": "string", "userId": "string" }
```
Sets the user's status to `rolling`.

#### `updateUserRollResult`
```json
{
  "roomId": "string",
  "userId": "string",
  "rollResult": {
    "diceResults": [{ "dieType": "d6", "value": 4 }],
    "total": 4
  }
}
```
Valid die types: `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`. Sets the user's status to `hasRolled`.

#### `updateUserName`
```json
{ "roomId": "string", "userId": "string", "userName": "string" }
```

#### `requestReroll`
```json
{ "roomId": "string", "userId": "string" }
```
User requests a reroll after rolling. Sets status to `requestedReroll`.

#### `approveReroll`
```json
{ "roomId": "string", "userId": "string", "targetUserId": "string" }
```
Sets `targetUserId` status back to `connected`.

#### `declineReroll`
```json
{ "roomId": "string", "userId": "string", "targetUserId": "string" }
```
Sets `targetUserId` status to `rerollDenied`.

#### `resetRoom`
```json
{ "roomId": "string", "userId": "string" }
```
Owner only. Sets all participants to `connected` and clears all roll results.

## User statuses

| Status | Meaning |
|---|---|
| `connected` | In the room, ready to roll |
| `rolling` | Currently rolling |
| `hasRolled` | Roll submitted |
| `requestedReroll` | Waiting for owner to approve/decline a reroll |
| `rerollDenied` | Reroll request was declined |
| `disconnected` | Socket disconnected |
