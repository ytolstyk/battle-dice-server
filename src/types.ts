export type DiceResult = {
  dieType: "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";
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
  status: "connected" | "disconnected" | "rolling" | "hasRolled";
  roll: Roll;
};

export type Room = {
  id: string;
  ownerId: string;
  diceRules: string;
  participants: User[];
};

export type StoreState = {
  rooms: Record<string, Room>;
  socketInfo: Record<
    string,
    {
      roomId: string;
      userId: string;
    }
  >;
};
