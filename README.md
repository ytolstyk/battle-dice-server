# Battle Dice Express Server

Simple server using web sockets for the battle dice game.

## Tech

This app uses

- Node server
- Socket.IO
- Typescript
- In-memory storage

## How to use

Clone the repo, run `npm install`, then `npm run start` to initialize it. Change the port if necessary in `server.ts`.

You can send messages to the server from CLI, but why do that when there's a fully-built web UI? Check out the link below. Run them at the same time to get the full app experience. Both are already hosted, but I need to get a pretty URL for it.

## What's what

The server opens a websocket connection to the clients. It keeps track of different dice rooms in memory without a database.

### Web UI repo

[https://github.com/ytolstyk/battle-dice-web](https://github.com/ytolstyk/battle-dice-web)
