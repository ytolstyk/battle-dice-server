import { DefaultEventsMap, Server, Socket } from "socket.io";
import { store } from "./store";
import { logMessage } from "./logger";
import { SocketResponse } from "./types";
import {
  validateJoinRoom,
  validateLeaveRoom,
  validateUpdateDiceRules,
  validateRollDice,
  validateUpdateUserRollResult,
  validateRequestReroll,
  validateUpdateUserName,
} from "./validators";

function getCallback(fn: unknown): (response: SocketResponse) => void {
  return typeof fn === "function"
    ? (fn as (r: SocketResponse) => void)
    : () => {};
}

export const socketHandler = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) => {
  logMessage("Socket handler initialized");

  io.on(
    "connection",
    (
      socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    ) => {
      logMessage("[connection] a user connected");

      const joinRoom = (payload: unknown, callbackFn: unknown) => {
        const callback = getCallback(callbackFn);

        if (!validateJoinRoom(payload)) {
          logMessage("[joinRoom] invalid payload");
          callback({ success: false, error: "invalid payload" });
          return;
        }
        const { roomId, user } = payload;

        logMessage(
          `[joinRoom] roomId: ${roomId}, user: ${user.id} ${user.name}`,
        );

        const room = store.addUserToRoom(user, roomId, socket.id);
        socket.join(roomId);
        store.pruneRooms();

        logMessage(`User ${user.name} joined room ${roomId}`);

        io.to(roomId).emit("roomUpdated", room);
        callback({ success: true });
      };

      const leaveRoom = (payload: unknown, callbackFn: unknown) => {
        const callback = getCallback(callbackFn);

        if (!validateLeaveRoom(payload)) {
          logMessage("[leaveRoom] invalid payload");
          callback({ success: false, error: "invalid payload" });
          return;
        }
        const { roomId, userId } = payload;

        logMessage(`[leaveRoom] roomId: ${roomId}, userId: ${userId}`);

        const room = store.removeUser(userId, roomId, socket.id);
        store.pruneRooms();

        logMessage(`User ${userId} left room ${roomId}`);

        io.to(roomId).emit("roomUpdated", room);
        socket.leave(roomId);
        callback({ success: true });
      };

      const updateDiceRules = (payload: unknown, callbackFn: unknown) => {
        const callback = getCallback(callbackFn);

        if (!validateUpdateDiceRules(payload)) {
          logMessage("[updateDiceRules] invalid payload");
          callback({ success: false, error: "invalid payload" });
          return;
        }
        const { roomId, userId, diceRules } = payload;

        logMessage(
          `[updateDiceRules] roomId: ${roomId}, userId: ${userId}, diceRules: ${diceRules}`,
        );

        const room = store.updateDiceRules(roomId, userId, diceRules);

        if (!room) {
          callback({ success: false, error: "room not found" });
          return;
        }

        io.to(roomId).emit("diceRulesUpdated", room);

        logMessage(`Dice rules updated in room ${roomId}`);
        callback({ success: true });
      };

      const rollDice = (payload: unknown, callbackFn: unknown) => {
        const callback = getCallback(callbackFn);

        if (!validateRollDice(payload)) {
          logMessage("[rollDice] invalid payload");
          callback({ success: false, error: "invalid payload" });
          return;
        }
        const { roomId, userId } = payload;

        logMessage(`[rollDice] roomId: ${roomId}, userId: ${userId}`);

        const room = store.updateUserStatus(roomId, userId, "rolling");

        if (!room) {
          callback({ success: false, error: "room not found" });
          return;
        }

        io.to(roomId).emit("diceRolled", room);

        logMessage(`User ${userId} rolled dice in room ${roomId}`);
        callback({ success: true });
      };

      const updateUserRollResult = (payload: unknown, callbackFn: unknown) => {
        const callback = getCallback(callbackFn);

        if (!validateUpdateUserRollResult(payload)) {
          logMessage("[updateUserRollResult] invalid payload");
          callback({ success: false, error: "invalid payload" });
          return;
        }
        const { roomId, userId, rollResult } = payload;

        logMessage(
          `[updateUserRollResult] roomId: ${roomId}, userId: ${userId}, rollResult: ${rollResult}`,
        );

        const room = store.updateUserRoll(roomId, userId, rollResult);

        if (!room) {
          callback({ success: false, error: "room not found" });
          return;
        }

        io.to(roomId).emit("rollResult", room);

        logMessage(`Transmitted roll result to room ${roomId}`);
        callback({ success: true });
      };

      const updateUserName = (payload: unknown, callbackFn: unknown) => {
        const callback = getCallback(callbackFn);

        if (!validateUpdateUserName(payload)) {
          logMessage("[updateUserName] invalid payload");
          callback({ success: false, error: "invalid payload" });
          return;
        }
        const { roomId, userId, userName } = payload;

        logMessage(
          `[updateUserName] roomId: ${roomId}, userId: ${userId}, userName: ${userName}`,
        );

        const room = store.updateUserName(roomId, userId, userName);

        if (!room) {
          callback({ success: false, error: "room not found" });
          return;
        }

        io.to(roomId).emit("userNameUpdated", room);

        logMessage(`User name updated for user ID ${userId}: ${userName}`);
        callback({ success: true });
      };

      const requestReroll = (payload: unknown, callbackFn: unknown) => {
        const callback = getCallback(callbackFn);

        if (!validateRequestReroll(payload)) {
          logMessage("[requestReroll] invalid payload");
          callback({ success: false, error: "invalid payload" });
          return;
        }
        const { roomId, userId } = payload;

        logMessage(`[requestReroll] roomId: ${roomId}, userId: ${userId}`);

        const room = store.requestUserReroll(roomId, userId);

        if (!room) {
          callback({ success: false, error: "room not found" });
          return;
        }

        io.to(roomId).emit("rerollRequested", room);

        logMessage(`User ${userId} requested reroll in room ${roomId}`);
        callback({ success: true });
      };

      const disconnect = () => {
        logMessage(`[disconnect] socketId: ${socket.id}`);

        const roomInfo = store.disconnectUser(socket.id);

        store.pruneRooms();

        if (roomInfo) {
          io.to(roomInfo.roomId).emit("roomUpdated", roomInfo.room);
          socket.leave(roomInfo.roomId);
        }

        logMessage("user disconnected");
      };

      socket.on("joinRoom", joinRoom);

      socket.on("leaveRoom", leaveRoom);

      socket.on("updateDiceRules", updateDiceRules);

      socket.on("rollDice", rollDice);

      socket.on("updateUserRollResult", updateUserRollResult);

      socket.on("updateUserName", updateUserName);

      socket.on("requestReroll", requestReroll);

      socket.on("disconnect", disconnect);
    },
  );
};
