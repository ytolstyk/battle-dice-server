import { logMessage } from "./logger";
import { ConnectingUser, Roll, Room, StoreState, User } from "./types";

function initUser(user: ConnectingUser): User {
  return {
    ...user,
    status: "connected",
    roll: {
      diceResults: [],
      total: 0,
    },
  };
}

function responseRoom(room: Room, userId: string) {
  return {
    ...room,
    isOwner: room.ownerId === userId,
    ownerId: "************",
  };
}

export const store = {
  state: {
    socketInfo: { userIds: {}, roomIds: {} },
    rooms: {},
  } as StoreState,

  addUserToRoom(user: ConnectingUser, roomId: string, socketId: string) {
    const room = this.state.rooms[roomId];

    if (!room) {
      this.state.rooms[roomId] = {
        id: roomId,
        ownerId: user.id,
        diceRules: "",
        participants: [initUser(user)],
      };
    } else {
      const { participants } = room;
      const userAlreadyIn = participants.map((u) => u.id).includes(user.id);

      if (userAlreadyIn) return responseRoom(room, user.id);

      this.state.rooms[roomId].participants.push(initUser(user));
    }

    if (this.state.socketInfo.userIds[socketId]) {
      this.state.socketInfo.userIds[socketId].add(user.id);
    } else {
      this.state.socketInfo.userIds[socketId] = new Set([user.id]);
    }

    return responseRoom(this.state.rooms[roomId], user.id);
  },

  removeUser(userId: string, roomId: string, socketId: string) {
    if (!this.state.rooms[roomId]) {
      return;
    }

    this.state.rooms[roomId].participants = this.state.rooms[
      roomId
    ].participants.filter((participant) => participant.id !== userId);

    this.state.socketInfo.userIds[socketId]?.delete(userId);

    return responseRoom(this.state.rooms[roomId], userId);
  },

  disconnectUser(socketId: string) {
    const userIds = this.state.socketInfo.userIds[socketId];
    const roomIds = this.state.socketInfo.roomIds[socketId];

    if (userIds && roomIds) {
      roomIds.forEach((roomId) => {
        const room = this.state.rooms[roomId];
        if (room) {
          room.participants = room.participants.filter(
            (participant) => !userIds.has(participant.id)
          );
        }
      });
    }

    delete this.state.socketInfo.userIds[socketId];
    delete this.state.socketInfo.roomIds[socketId];
  },

  updateDiceRules(roomId: string, userId: string, diceRules: string) {
    const room = this.state.rooms[roomId];

    if (room?.ownerId !== userId) {
      // handle error
      logMessage("Non-owner tried to update dice rules");
      return responseRoom(room, userId);
    }

    if (room) {
      logMessage(`Updating room with dice rules: ${diceRules}`);
      this.state.rooms[roomId].diceRules = diceRules;
    }

    return responseRoom(this.state.rooms[roomId], userId);
  },

  updateUserStatus(roomId: string, userId: string, status: User["status"]) {
    const room = this.state.rooms[roomId];

    if (room) {
      room.participants.forEach((participant) => {
        if (participant.id === userId) {
          participant.status = status;
        }
      });
    }

    this.state.rooms[roomId] = room;

    return responseRoom(room, userId);
  },

  updateUserRoll(roomId: string, userId: string, roll: Roll) {
    const room = this.state.rooms[roomId];

    if (room) {
      room.participants.forEach((participant) => {
        if (participant.id === userId) {
          participant.roll = roll;
          participant.status = "connected";
        }
      });
    }

    this.state.rooms[roomId] = room;

    return responseRoom(room, userId);
  },

  pruneRooms() {
    Object.keys(this.state.rooms).forEach((key) => {
      const room = this.state.rooms[key];

      if (room && room.participants.length === 0) {
        delete this.state.rooms[key];
      }
    });
  },
};
