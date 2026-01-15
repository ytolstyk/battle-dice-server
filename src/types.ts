export type DiceResult = {
  dieType: string;
  value: number;
};

export type Roll = {
  diceResults: DiceResult[];
  total: number;
};

export type ConnectingUser = {
  id: string;
  name: string;
};

export type User = ConnectingUser & {
  status: "connected" | "disconnected" | "rolling";
  roll: Roll;
};

export type Room = {
  id: string;
  participants: User[];
};

export type StoreState = {
  rooms: Record<string, Room>;
  socketInfo: {
    roomIds: Record<string, Set<string>>;
    userIds: Record<string, Set<string>>;
  };
};
