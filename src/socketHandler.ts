import { DefaultEventsMap, Server, Socket } from "socket.io";
import { store } from "./store";
import { logMessage } from "./logger";
import {
  validateJoinRoom,
  validateLeaveRoom,
  validateUpdateDiceRules,
  validateRollDice,
  validateUpdateUserRollResult,
  validateUpdateUserName,
} from "./validators";

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

      const joinRoom = (payload: unknown) => {
        if (!validateJoinRoom(payload)) {
          logMessage("[joinRoom] invalid payload");
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
      };

      const leaveRoom = (payload: unknown) => {
        if (!validateLeaveRoom(payload)) {
          logMessage("[leaveRoom] invalid payload");
          return;
        }
        const { roomId, userId } = payload;

        logMessage(`[leaveRoom] roomId: ${roomId}, userId: ${userId}`);

        const room = store.removeUser(userId, roomId, socket.id);
        store.pruneRooms();

        logMessage(`User ${userId} left room ${roomId}`);

        io.to(roomId).emit("roomUpdated", room);
        socket.leave(roomId);
      };

      const updateDiceRules = (payload: unknown) => {
        if (!validateUpdateDiceRules(payload)) {
          logMessage("[updateDiceRules] invalid payload");
          return;
        }
        const { roomId, userId, diceRules } = payload;

        logMessage(
          `[updateDiceRules] roomId: ${roomId}, userId: ${userId}, diceRules: ${diceRules}`,
        );

        const room = store.updateDiceRules(roomId, userId, diceRules);

        io.to(roomId).emit("diceRulesUpdated", room);

        logMessage(`Dice rules updated in room ${roomId}`);
      };

      const rollDice = (payload: unknown) => {
        if (!validateRollDice(payload)) {
          logMessage("[rollDice] invalid payload");
          return;
        }
        const { roomId, userId } = payload;

        logMessage(`[rollDice] roomId: ${roomId}, userId: ${userId}`);

        const room = store.updateUserStatus(roomId, userId, "rolling");
        io.to(roomId).emit("diceRolled", room);

        logMessage(`User ${userId} rolled dice in room ${roomId}`);
      };

      const updateUserRollResult = (payload: unknown) => {
        if (!validateUpdateUserRollResult(payload)) {
          logMessage("[updateUserRollResult] invalid payload");
          return;
        }
        const { roomId, userId, rollResult } = payload;

        logMessage(
          `[updateUserRollResult] roomId: ${roomId}, userId: ${userId}, rollResult: ${rollResult}`,
        );

        const room = store.updateUserRoll(roomId, userId, rollResult);

        io.to(roomId).emit("rollResult", room);

        logMessage(`Transmitted roll result to room ${roomId}`);
      };

      const updateUserName = (payload: unknown) => {
        if (!validateUpdateUserName(payload)) {
          logMessage("[updateUserName] invalid payload");
          return;
        }
        const { roomId, userId, userName } = payload;

        logMessage(
          `[updateUserName] roomId: ${roomId}, userId: ${userId}, userName: ${userName}`,
        );

        const room = store.updateUserName(roomId, userId, userName);

        io.to(roomId).emit("userNameUpdated", room);

        logMessage(`User name updated for user ID ${userId}: ${userName}`);
      };

      const disconnect = () => () => {
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

      socket.on("disconnect", disconnect);
    },
  );
};
