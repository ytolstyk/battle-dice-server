import { store } from "../store";
import { ConnectingUser, Roll } from "../types";

const user1: ConnectingUser = { id: "user1", name: "Alice" };
const user2: ConnectingUser = { id: "user2", name: "Bob" };
const roomId = "room1";
const socketId1 = "socket1";
const socketId2 = "socket2";

const blankRoll: Roll = { diceResults: [], total: 0 };
const sampleRoll: Roll = { diceResults: [{ dieType: "d6", value: 4 }], total: 4 };

beforeEach(() => {
  store.state.rooms = {};
  store.state.socketInfo = {};
});

describe("addUserToRoom", () => {
  it("creates a new room with user as owner", () => {
    const room = store.addUserToRoom(user1, roomId, socketId1);
    expect(room.id).toBe(roomId);
    expect(room.ownerId).toBe(user1.id);
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0].status).toBe("connected");
    expect(room.participants[0].roll).toEqual(blankRoll);
  });

  it("adds a second user to an existing room", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    const room = store.addUserToRoom(user2, roomId, socketId2);
    expect(room.participants).toHaveLength(2);
    expect(room.ownerId).toBe(user1.id);
  });

  it("does not duplicate a user already in the room", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    const room = store.addUserToRoom(user1, roomId, socketId1);
    expect(room.participants).toHaveLength(1);
  });

  it("stores socket info", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    expect(store.state.socketInfo[socketId1]).toEqual({ roomId, userId: user1.id });
  });
});

describe("removeUser", () => {
  it("removes the user from the room", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.addUserToRoom(user2, roomId, socketId2);
    const room = store.removeUser(user1.id, roomId, socketId1);
    expect(room!.participants).toHaveLength(1);
    expect(room!.participants[0].id).toBe(user2.id);
  });

  it("returns undefined for a non-existent room", () => {
    const room = store.removeUser(user1.id, "nonexistent", socketId1);
    expect(room).toBeUndefined();
  });
});

describe("disconnectUser", () => {
  it("returns null for an unknown socket", () => {
    const result = store.disconnectUser("unknown-socket");
    expect(result).toBeNull();
  });

  it("removes user and returns updated room when participants remain", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.addUserToRoom(user2, roomId, socketId2);
    const result = store.disconnectUser(socketId1);
    expect(result).not.toBeNull();
    expect(result!.roomId).toBe(roomId);
    expect(result!.room.participants).toHaveLength(1);
    expect(result!.room.participants[0].id).toBe(user2.id);
  });

  it("deletes the room and returns null when the last user disconnects", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    const result = store.disconnectUser(socketId1);
    expect(result).toBeNull();
    expect(store.state.rooms[roomId]).toBeUndefined();
  });

  it("removes socket info on disconnect", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.addUserToRoom(user2, roomId, socketId2);
    store.disconnectUser(socketId1);
    expect(store.state.socketInfo[socketId1]).toBeUndefined();
  });
});

describe("updateDiceRules", () => {
  beforeEach(() => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.addUserToRoom(user2, roomId, socketId2);
    store.updateUserRoll(roomId, user2.id, sampleRoll);
  });

  it("allows the owner to update dice rules", () => {
    const room = store.updateDiceRules(roomId, user1.id, "2d6");
    expect(room!.diceRules).toBe("2d6");
  });

  it("resets all participants to connected with blank rolls on update", () => {
    store.updateDiceRules(roomId, user1.id, "2d6");
    store.state.rooms[roomId].participants.forEach((p) => {
      expect(p.status).toBe("connected");
      expect(p.roll).toEqual(blankRoll);
    });
  });

  it("does not update dice rules for a non-owner", () => {
    const room = store.updateDiceRules(roomId, user2.id, "2d6");
    expect(room!.diceRules).toBe("");
  });
});

describe("updateUserStatus", () => {
  beforeEach(() => {
    store.addUserToRoom(user1, roomId, socketId1);
  });

  it("updates the user status", () => {
    store.updateUserStatus(roomId, user1.id, "rolling");
    expect(store.state.rooms[roomId].participants[0].status).toBe("rolling");
  });

  it("does not update status when user has already rolled", () => {
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    store.updateUserStatus(roomId, user1.id, "rolling");
    expect(store.state.rooms[roomId].participants[0].status).toBe("hasRolled");
  });
});

describe("updateUserRoll", () => {
  it("sets roll result and status to hasRolled", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    const participant = store.state.rooms[roomId].participants[0];
    expect(participant.roll).toEqual(sampleRoll);
    expect(participant.status).toBe("hasRolled");
  });
});

describe("updateUserName", () => {
  it("updates the user name", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.updateUserName(roomId, user1.id, "Alicia");
    expect(store.state.rooms[roomId].participants[0].name).toBe("Alicia");
  });
});

describe("requestUserReroll", () => {
  beforeEach(() => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
  });

  it("transitions hasRolled to requestedReroll", () => {
    store.requestUserReroll(roomId, user1.id);
    expect(store.state.rooms[roomId].participants[0].status).toBe("requestedReroll");
  });

  it("does not transition if status is not hasRolled", () => {
    store.addUserToRoom(user2, roomId, socketId2);
    store.requestUserReroll(roomId, user2.id);
    const user2Participant = store.state.rooms[roomId].participants.find(
      (p) => p.id === user2.id,
    );
    expect(user2Participant!.status).toBe("connected");
  });
});

describe("approveReroll", () => {
  it("transitions requestedReroll to connected", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    store.requestUserReroll(roomId, user1.id);
    store.approveReroll(roomId, user1.id, user1.id);
    expect(store.state.rooms[roomId].participants[0].status).toBe("connected");
  });

  it("does not affect a user who has not requested a reroll", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    store.approveReroll(roomId, user1.id, user1.id);
    expect(store.state.rooms[roomId].participants[0].status).toBe("hasRolled");
  });
});

describe("declineReroll", () => {
  it("transitions requestedReroll to rerollDenied", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    store.requestUserReroll(roomId, user1.id);
    store.declineReroll(roomId, user1.id, user1.id);
    expect(store.state.rooms[roomId].participants[0].status).toBe("rerollDenied");
  });

  it("does not affect a user who has not requested a reroll", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    store.declineReroll(roomId, user1.id, user1.id);
    expect(store.state.rooms[roomId].participants[0].status).toBe("hasRolled");
  });
});

describe("resetRoom", () => {
  beforeEach(() => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.addUserToRoom(user2, roomId, socketId2);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    store.updateUserRoll(roomId, user2.id, sampleRoll);
  });

  it("allows owner to reset all users to connected with blank rolls", () => {
    const room = store.resetRoom(roomId, user1.id);
    room!.participants.forEach((p) => {
      expect(p.status).toBe("connected");
      expect(p.roll).toEqual(blankRoll);
    });
  });

  it("does not reset for a non-owner", () => {
    store.resetRoom(roomId, user2.id);
    expect(store.state.rooms[roomId].participants[0].status).toBe("hasRolled");
  });
});

describe("pruneRooms", () => {
  it("removes rooms with no participants", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.state.rooms[roomId].participants = [];
    store.pruneRooms();
    expect(store.state.rooms[roomId]).toBeUndefined();
  });

  it("keeps rooms that have participants", () => {
    store.addUserToRoom(user1, roomId, socketId1);
    store.pruneRooms();
    expect(store.state.rooms[roomId]).toBeDefined();
  });
});
