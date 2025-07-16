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
    const spacePermissions = new Map(); // spaceId => { wallhack, speedup, teleport }

    // Helper functions
    const getUserSpace = (socketId) => {
      return players[socketId]?.spaceId;
    };

    const getUserId = (socketId) => {
      return socketId;
    };

    const getUserName = (socketId) => {
      return players[socketId]?.name || "Unknown";
    };

    io.on("connection", (socket) => {

      // 🧩 Join space/room
socket.on("player-join", (data) => {
  const { name, position, avatarKey, spaceId } = data;
  
  console.log(`📥 Player "${name}" (${socket.id}) joined space: ${spaceId}`);
  
  // ✅ Check if this player is already in the space with a different socket ID
  const existingPlayerEntry = Object.entries(players).find(([id, player]) => 
    player.name === name && player.spaceId === spaceId && id !== socket.id
  );
  
  if (existingPlayerEntry) {
    const [oldSocketId, oldPlayerData] = existingPlayerEntry;
    console.log(`🔄 Player "${name}" reconnected. Old ID: ${oldSocketId}, New ID: ${socket.id}`);
    
    // Remove old socket ID and notify others
    delete players[oldSocketId];
    socket.to(spaceId).emit("player-left", oldSocketId);
    
    // Small delay to ensure the player-left event is processed
    setTimeout(() => {
      // Now add the new player
      addNewPlayer();
    }, 100);
  } else {
    // New player joining
    addNewPlayer();
  }
  
  function addNewPlayer() {
    players[socket.id] = { name, position, avatarKey, spaceId };
    console.log("✅ Player stored:", socket.id, players[socket.id]);
    console.log("📊 All players:", Object.keys(players));

    socket.join(spaceId);

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

    // Send current permissions if they exist for this space
    const permissions = spacePermissions.get(spaceId);
    if (permissions) {
      socket.emit("hackPermissionsUpdate", { permissions });
    }

    // Notify other clients in the same room about new player
    socket.to(spaceId).emit("player-joined", {
      id: socket.id,
      name,
      position,
      avatarKey,
    });

    // Notify others about user joining (for permission sync)
    socket.to(spaceId).emit("userJoined", {
      id: socket.id,
      name: name
    });

    console.log("📊 Current total players:", Object.keys(players).length);
  }
});

      // 🕹 Movement updates - FIXED: Include name and avatarKey in broadcast
      socket.on("player-move", (data) => {
        const player = players[socket.id];
        console.log("player-move",player)
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
  console.log(`[EMOTE] Received from socket: ${socket.id}`);
  console.log(`[EMOTE] Player exists?`, !!players[socket.id]);
  console.log(`[EMOTE] All players:`, Object.keys(players));
  const player = players[socket.id];

  if (player) {
    console.log(`[EMOTE] ${socket.id} emitting emoji in space ${player.spaceId}`);
    socket.to(player.spaceId).emit("player-emote", {
      id: socket.id,
      emoji,
    });
  } else {
    console.warn(`[EMOTE] Ignored: no player found for socket ${socket.id}`);
    console.warn(`[EMOTE] Available players:`, Object.keys(players));
  }
});


      // ✅ NEW: Permission system handlers
      socket.on('hackPermissionsUpdate', (data) => {
        
        const { permissions, targetUserId } = data;
        const userSpace = getUserSpace(socket.id);
        
        if (userSpace) {
          // Store permissions for this space
          spacePermissions.set(userSpace, permissions);
          
          if (targetUserId === 'all') {
            // Broadcast to all users in the space except the sender
            socket.to(userSpace).emit('hackPermissionsUpdate', { permissions });
          } else if (targetUserId) {
            // Send to specific user - find their socket
            const targetSocket = Object.keys(players).find(id => 
              players[id].spaceId === userSpace && id === targetUserId
            );
            
            if (targetSocket) {
              io.to(targetSocket).emit('hackPermissionsUpdate', { permissions });
            }
          }
        }
      });

      socket.on('requestPermissions', () => {
        const userSpace = getUserSpace(socket.id);
        const userId = getUserId(socket.id);
        
        if (userSpace && userId) {
          // First check if we have stored permissions for this space
          const storedPermissions = spacePermissions.get(userSpace);
          if (storedPermissions) {
            // Send stored permissions directly
            socket.emit('hackPermissionsUpdate', { permissions: storedPermissions });
          } else {
            // Request permissions from space owner (broadcast to space)
            socket.to(userSpace).emit('requestPermissions', userId);
          }
        }
      });

      // ❌ Disconnect
      socket.on("disconnect", () => {
        const player = players[socket.id];
        if (player) {
          const userSpace = player.spaceId;
          
          // Notify others in the space
          socket.to(userSpace).emit("player-left", socket.id);
          
          // Remove player
          delete players[socket.id];
          console.log(`🔴 ${socket.id} disconnected from ${userSpace}`);

          // ✅ Check if space is now empty and clean up permissions
          const remainingPlayersInSpace = Object.values(players).filter(p => p.spaceId === userSpace);
          if (remainingPlayersInSpace.length === 0) {
            spacePermissions.delete(userSpace);
            console.log(`🧹 Cleaned up permissions for empty space: ${userSpace}`);
          }
        }
      });
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });