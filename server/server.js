const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/spaces", require("./routes/spaceRoutes"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    server.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });

    const players = {}; // socket.id => { name, position, spaceId, avatarKey }

    io.on("connection", (socket) => {

      // 🧩 Join space/room
      socket.on("player-join", (data) => {
        const { name, position, avatarKey, spaceId } = data;

        console.log(`📥 Player "${name}" joined space: ${spaceId}`);

        players[socket.id] = { name, position, avatarKey, spaceId };

        socket.join(spaceId); // ✅ Join the room for this space

        // Send existing players in the same space
        const existingPlayers = {};
        for (const id in players) {
          if (players[id].spaceId === spaceId && id !== socket.id) {
            existingPlayers[id] = {
              id,
              ...players[id],
            };
          }
        }

        socket.emit("existing-players", existingPlayers);

        // Notify other clients in the same room
        socket.to(spaceId).emit("player-joined", {
          id: socket.id,
          name,
          position,
          avatarKey,
        });

        console.log("📊 Current total players:", Object.keys(players).length);
      });

      // 🕹 Movement updates - FIXED: Include name and avatarKey in broadcast
      socket.on("player-move", (data) => {
        const player = players[socket.id];
        if (player) {
          const { position, isMoving, direction } = data;
          player.position = position;
          player.isMoving = isMoving;
          player.direction = direction;

          // ✅ FIXED: Include name and avatarKey so other players can display them
          socket.to(player.spaceId).emit("player-moved", {
            id: socket.id,
            position,
            isMoving,
            direction,
            name: player.name,        // ✅ Include name
            avatarKey: player.avatarKey, // ✅ Include avatarKey
          });
        }
      });

      // 🎭 Avatar change
      socket.on("avatar-change", ({ avatarKey }) => {
        const player = players[socket.id];
        if (player) {
          player.avatarKey = avatarKey;
          socket.to(player.spaceId).emit("avatar-change", {
            playerId: socket.id,
            avatarKey,
            position: player.position, // ✅ Include current position
            name: player.name,         // ✅ Include name for consistency
          });
        }
      });

      // 😂 Emote
      socket.on("player-emote", ({ emoji }) => {
        const player = players[socket.id];
        if (player) {
          socket.to(player.spaceId).emit("player-emote", {
            id: socket.id,
            emoji,
          });
        }
      });

      // ❌ Disconnect
      socket.on("disconnect", () => {
        const player = players[socket.id];
        if (player) {
          socket.to(player.spaceId).emit("player-left", socket.id);
          delete players[socket.id];
          console.log(`🔴 ${socket.id} disconnected from ${player.spaceId}`);
        }
      });
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });