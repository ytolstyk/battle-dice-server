import { User } from "./types";

export const testUsers: User[] = [
  {
    id: "asdf",
    name: "test 1",
    status: "connected",
    roll: {
      diceResults: [],
      total: 0,
    },
  },
  {
    id: "qwer",
    name: "test 2",
    status: "rolling",
    roll: {
      diceResults: [],
      total: 0,
    },
  },
  {
    id: "zxcv",
    name: "test 3",
    status: "connected",
    roll: {
      diceResults: [
        {
          dieType: "d10",
          value: 8,
        },
        {
          dieType: "d6",
          value: 3,
        },
      ],
      total: 11,
    },
  },
];
