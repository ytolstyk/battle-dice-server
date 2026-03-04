import { socketHandler } from "../socketHandler";
import { store } from "../store";
import { ConnectingUser, Roll } from "../types";

const user1: ConnectingUser = { id: "user1", name: "Alice" };
const user2: ConnectingUser = { id: "user2", name: "Bob" };
const roomId = "room1";
const socketId = "test-socket-id";

const sampleRoll: Roll = {
  diceResults: [{ dieType: "d6", value: 4 }],
  total: 4,
};

function createMocks() {
  const handlers: Record<string, (...args: unknown[]) => void> = {};
  const emitted: Array<{ event: string; data: unknown }> = [];

  const mockTo = {
    emit: jest.fn((event: string, data: unknown) => {
      emitted.push({ event, data });
    }),
  };

  const mockSocket = {
    id: socketId,
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers[event] = handler;
    }),
    join: jest.fn(),
    leave: jest.fn(),
  };

  const mockIo = {
    on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (event === "connection") handler(mockSocket);
    }),
    to: jest.fn(() => mockTo),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socketHandler(mockIo as any);

  return { handlers, emitted, mockSocket, mockTo, mockIo };
}

beforeEach(() => {
  store.state.rooms = {};
  store.state.socketInfo = {};
});

describe("joinRoom", () => {
  it("joins room, emits roomUpdated, and calls back with success", () => {
    const { handlers, emitted, mockSocket } = createMocks();
    const callback = jest.fn();

    handlers["joinRoom"]({ roomId, user: user1 }, callback);

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "roomUpdated" }),
    );
    expect(mockSocket.join).toHaveBeenCalledWith(roomId);
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["joinRoom"]({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });
});

describe("leaveRoom", () => {
  it("removes user, emits roomUpdated, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    store.addUserToRoom(user2, roomId, "socket2");
    const { handlers, emitted, mockSocket } = createMocks();
    const callback = jest.fn();

    handlers["leaveRoom"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "roomUpdated" }),
    );
    expect(mockSocket.leave).toHaveBeenCalledWith(roomId);
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["leaveRoom"]({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });
});

describe("updateDiceRules", () => {
  it("updates rules, emits diceRulesUpdated, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["updateDiceRules"](
      { roomId, userId: user1.id, diceRules: "2d6" },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "diceRulesUpdated" }),
    );
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["updateDiceRules"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });

  it("calls back with error when room not found", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["updateDiceRules"](
      { roomId, userId: user1.id, diceRules: "2d6" },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "room not found",
    });
  });
});

describe("rollDice", () => {
  it("sets user to rolling, emits diceRolled, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["rollDice"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "diceRolled" }),
    );
    expect(store.state.rooms[roomId].participants[0].status).toBe("rolling");
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["rollDice"]({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });

  it("calls back with error when room not found", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["rollDice"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "room not found",
    });
  });
});

describe("updateUserRollResult", () => {
  it("stores roll result, emits rollResult, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["updateUserRollResult"](
      { roomId, userId: user1.id, rollResult: sampleRoll },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "rollResult" }),
    );
    expect(store.state.rooms[roomId].participants[0].roll).toEqual(sampleRoll);
  });

  it("calls back with error for invalid roll result", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["updateUserRollResult"](
      {
        roomId,
        userId: user1.id,
        rollResult: { diceResults: [{ dieType: "d999", value: 4 }], total: 4 },
      },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });
});

describe("updateUserName", () => {
  it("updates name, emits userNameUpdated, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["updateUserName"](
      { roomId, userId: user1.id, userName: "Alicia" },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "userNameUpdated" }),
    );
    expect(store.state.rooms[roomId].participants[0].name).toBe("Alicia");
  });

  it("calls back with error for empty userName", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["updateUserName"](
      { roomId, userId: user1.id, userName: "" },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });
});

describe("requestReroll", () => {
  it("sets user to requestedReroll, emits rerollRequested, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["requestReroll"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "rerollRequested" }),
    );
    expect(store.state.rooms[roomId].participants[0].status).toBe(
      "requestedReroll",
    );
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["requestReroll"]({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });
});

describe("approveReroll", () => {
  it("sets target to connected, emits rerollResolved, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    store.addUserToRoom(user2, roomId, "socket2");
    store.updateUserRoll(roomId, user2.id, sampleRoll);
    store.requestUserReroll(roomId, user2.id);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["approveReroll"](
      { roomId, userId: user1.id, targetUserId: user2.id },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "rerollResolved" }),
    );
    const target = store.state.rooms[roomId].participants.find(
      (p) => p.id === user2.id,
    );
    expect(target!.status).toBe("connected");
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["approveReroll"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });
});

describe("declineReroll", () => {
  it("sets target to rerollDenied, emits rerollResolved, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    store.addUserToRoom(user2, roomId, "socket2");
    store.updateUserRoll(roomId, user2.id, sampleRoll);
    store.requestUserReroll(roomId, user2.id);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["declineReroll"](
      { roomId, userId: user1.id, targetUserId: user2.id },
      callback,
    );

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "rerollResolved" }),
    );
    const target = store.state.rooms[roomId].participants.find(
      (p) => p.id === user2.id,
    );
    expect(target!.status).toBe("rerollDenied");
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["declineReroll"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });
});

describe("resetRoom", () => {
  it("resets all users, emits roomUpdated, and calls back with success", () => {
    store.addUserToRoom(user1, roomId, socketId);
    store.addUserToRoom(user2, roomId, "socket2");
    store.updateUserRoll(roomId, user1.id, sampleRoll);
    store.updateUserRoll(roomId, user2.id, sampleRoll);
    const { handlers, emitted } = createMocks();
    const callback = jest.fn();

    handlers["resetRoom"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({ success: true });
    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "roomUpdated" }),
    );
    store.state.rooms[roomId].participants.forEach((p) => {
      expect(p.status).toBe("connected");
      expect(p.roll).toEqual({ diceResults: [], total: 0 });
    });
  });

  it("calls back with error on invalid payload", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["resetRoom"]({ roomId }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "invalid payload",
    });
  });

  it("calls back with error when room not found", () => {
    const { handlers } = createMocks();
    const callback = jest.fn();

    handlers["resetRoom"]({ roomId, userId: user1.id }, callback);

    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: "room not found",
    });
  });
});

describe("disconnect", () => {
  it("removes user and emits roomUpdated when room has remaining participants", () => {
    store.addUserToRoom(user1, roomId, socketId);
    store.addUserToRoom(user2, roomId, "socket2");
    const { handlers, emitted } = createMocks();

    handlers["disconnect"]();

    expect(emitted).toContainEqual(
      expect.objectContaining({ event: "roomUpdated" }),
    );
    expect(store.state.rooms[roomId].participants).toHaveLength(1);
  });

  it("deletes the room when the last user disconnects", () => {
    store.addUserToRoom(user1, roomId, socketId);
    const { handlers } = createMocks();

    handlers["disconnect"]();

    expect(store.state.rooms[roomId]).toBeUndefined();
  });

  it("does nothing when socket has no room info", () => {
    const { handlers, emitted } = createMocks();

    handlers["disconnect"]();

    expect(emitted).toHaveLength(0);
  });
});
