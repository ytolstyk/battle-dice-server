import { ConnectingUser, Roll, StoreState, User } from "./types";

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

export const store = {
  state: {} as StoreState,

  createRoom(roomId: string, user: ConnectingUser, socketId: string) {
    this.state.rooms[roomId] = {
      id: roomId,
      participants: [initUser(user)],
    };

    if (this.state.socketInfo.roomIds[socketId]) {
      this.state.socketInfo.roomIds[socketId].add(roomId);
    } else {
      this.state.socketInfo.roomIds[socketId] = new Set([roomId]);
    }

    return this.state.rooms[roomId];
  },

  addUserToRoom(user: ConnectingUser, roomId: string, socketId: string) {
    this.state.rooms[roomId]?.participants.push(initUser(user));

    if (this.state.socketInfo.userIds[socketId]) {
      this.state.socketInfo.userIds[socketId].add(user.id);
    } else {
      this.state.socketInfo.userIds[socketId] = new Set([user.id]);
    }

    return this.state.rooms[roomId];
  },

  removeUser(user: ConnectingUser, roomId: string, socketId: string) {
    this.state.rooms[roomId].participants = this.state.rooms[
      roomId
    ].participants.filter((participant) => participant.id !== user.id);

    this.state.socketInfo.userIds[socketId]?.delete(user.id);

    return this.state.rooms[roomId];
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

    return room;
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

    return room;
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
