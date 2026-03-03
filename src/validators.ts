import { ConnectingUser, DiceResult, Roll } from "./types";

const VALID_DIE_TYPES = new Set([
  "d4",
  "d6",
  "d8",
  "d10",
  "d12",
  "d20",
  "d100",
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isConnectingUser(value: unknown): value is ConnectingUser {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return isNonEmptyString(obj.id) && isNonEmptyString(obj.name);
}

function isDiceResult(value: unknown): value is DiceResult {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return VALID_DIE_TYPES.has(obj.dieType as string) && typeof obj.value === "number";
}

function isRoll(value: unknown): value is Roll {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    Array.isArray(obj.diceResults) &&
    obj.diceResults.every(isDiceResult) &&
    typeof obj.total === "number"
  );
}

export function validateJoinRoom(
  payload: unknown,
): payload is { roomId: string; user: ConnectingUser } {
  if (typeof payload !== "object" || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return isNonEmptyString(obj.roomId) && isConnectingUser(obj.user);
}

export function validateLeaveRoom(
  payload: unknown,
): payload is { roomId: string; userId: string } {
  if (typeof payload !== "object" || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return isNonEmptyString(obj.roomId) && isNonEmptyString(obj.userId);
}

export function validateUpdateDiceRules(
  payload: unknown,
): payload is { roomId: string; userId: string; diceRules: string } {
  if (typeof payload !== "object" || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return (
    isNonEmptyString(obj.roomId) &&
    isNonEmptyString(obj.userId) &&
    typeof obj.diceRules === "string"
  );
}

export function validateRollDice(
  payload: unknown,
): payload is { roomId: string; userId: string } {
  if (typeof payload !== "object" || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return isNonEmptyString(obj.roomId) && isNonEmptyString(obj.userId);
}

export function validateUpdateUserRollResult(
  payload: unknown,
): payload is { roomId: string; userId: string; rollResult: Roll } {
  if (typeof payload !== "object" || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return (
    isNonEmptyString(obj.roomId) &&
    isNonEmptyString(obj.userId) &&
    isRoll(obj.rollResult)
  );
}

export function validateRequestReroll(
  payload: unknown,
): payload is { roomId: string; userId: string } {
  if (typeof payload !== "object" || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return isNonEmptyString(obj.roomId) && isNonEmptyString(obj.userId);
}

export function validateUpdateUserName(
  payload: unknown,
): payload is { roomId: string; userId: string; userName: string } {
  if (typeof payload !== "object" || payload === null) return false;
  const obj = payload as Record<string, unknown>;
  return (
    isNonEmptyString(obj.roomId) &&
    isNonEmptyString(obj.userId) &&
    isNonEmptyString(obj.userName)
  );
}
