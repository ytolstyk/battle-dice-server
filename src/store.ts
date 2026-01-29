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

export const store = {
  state: {
    socketInfo: {},
    rooms: {},
  } as StoreState,

  addUserToRoom(user: ConnectingUser, roomId: string, socketId: string) {
    const room = this.state.rooms[roomId];
    this.state.socketInfo[socketId] = {
      roomId: roomId,
      userId: user.id,
    };

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

      if (userAlreadyIn) return room;

      this.state.rooms[roomId].participants.push(initUser(user));
    }

    return this.state.rooms[roomId];
  },

  removeUser(userId: string, roomId: string, socketId: string) {
    if (!this.state.rooms[roomId]) {
      return;
    }

    this.state.rooms[roomId].participants = this.state.rooms[
      roomId
    ].participants.filter((participant) => participant.id !== userId);

    this.state.socketInfo[socketId] = {
      userId,
      roomId: "",
    };

    return this.state.rooms[roomId];
  },

  disconnectUser(socketId: string) {
    const { userId, roomId } = this.state.socketInfo[socketId];

    if (userId && roomId) {
      const room = this.state.rooms[roomId];

      if (room) {
        this.state.rooms[roomId].participants = room.participants.filter(
          (participant) => participant.id !== userId,
        );

        delete this.state.socketInfo[socketId];

        if (this.state.rooms[roomId].participants.length > 1) {
          return { roomId, room };
        }

        delete this.state.rooms[roomId];
      }
    }

    return null;
  },

  updateDiceRules(roomId: string, userId: string, diceRules: string) {
    const room = this.state.rooms[roomId];

    if (room?.ownerId !== userId) {
      logMessage("Non-owner tried to update dice rules");
      return room;
    }

    if (room) {
      logMessage(`Updating room with dice rules: ${diceRules}`);
      this.state.rooms[roomId].diceRules = diceRules;

      const newParticipants =
        this.state.rooms[roomId].participants.map(initUser);

      this.state.rooms[roomId].participants = newParticipants;
    }

    return this.state.rooms[roomId];
  },

  updateUserStatus(roomId: string, userId: string, status: User["status"]) {
    const room = this.state.rooms[roomId];

    if (room) {
      room.participants.forEach((participant) => {
        if (participant.id === userId && participant.status !== "hasRolled") {
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
          participant.status = "hasRolled";
        }
      });
    }

    this.state.rooms[roomId] = room;

    return room;
  },

  updateUserName(roomId: string, userId: string, userName: string) {
    const room = this.state.rooms[roomId];

    if (room) {
      room.participants.forEach((u) => {
        if (u.id === userId) {
          u.name = userName;
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
