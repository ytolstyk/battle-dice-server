import { DefaultEventsMap, Server, Socket } from "socket.io";
import { store } from "./store";
import { ConnectingUser, Roll } from "./types";

export const socketHandler = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
) => {
  console.log("Socket handler initialized");
  io.on(
    "connection",
    (
      socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
    ) => {
      console.log("a user connected");

      const createRoom = (roomId: string, user: ConnectingUser) => {
        store.createRoom(roomId, user, socket.id);
        socket.join(roomId);

        console.log(`Room ${roomId} created by user ${user.name}`);

        socket.to(roomId).emit("roomCreated", store.state.rooms[roomId]);
      };

      const joinRoom = (roomId: string, user: ConnectingUser) => {
        store.addUserToRoom(user, roomId, socket.id);
        socket.join(roomId);

        console.log(`User ${user.name} joined room ${roomId}`);

        socket.to(roomId).emit("userJoined", store.state.rooms[roomId]);
      };

      const leaveRoom = (roomId: string, user: ConnectingUser) => {
        store.removeUser(user, roomId, socket.id);
        store.pruneRooms();

        console.log(`User ${user.name} left room ${roomId}`);

        socket.to(roomId).emit("userLeft", store.state.rooms[roomId]);
        socket.leave(roomId);
      };

      const rollDice = (roomId: string, userId: string) => {
        const room = store.updateUserStatus(roomId, userId, "rolling");
        socket.to(roomId).emit("diceRolled", room);

        console.log(`User ${userId} rolled dice in room ${roomId}`);
      };

      const transmitRollResult = (
        roomId: string,
        userId: string,
        rollResult: Roll
      ) => {
        const room = store.updateUserRoll(roomId, userId, rollResult);

        socket.to(roomId).emit("rollResult", room);

        console.log(`Transmitted roll result to room ${roomId}`);
      };

      socket.on("createRoom", createRoom);

      socket.on("joinRoom", joinRoom);

      socket.on("leaveRoom", leaveRoom);

      socket.on("rollDice", rollDice);

      socket.on("transmitRollResult", transmitRollResult);

      socket.on("disconnect", () => {
        store.disconnectUser(socket.id);
        store.pruneRooms();
        console.log("user disconnected");
      });
    }
  );
};
