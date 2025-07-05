const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // You can restrict this to your frontend URL in production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/spaces", require("./routes/spaceRoutes"));

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ Connected to MongoDB");
  
  // Start server
  server.listen(process.env.PORT, () => {
    console.log(`🚀 Server running on port ${process.env.PORT}`);
  });
  
  // 🔌 Setup socket.io logic
  const players = {}; // Keep track of connected players by socket.id
  
  io.on("connection", (socket) => {
    console.log("🟢 New client connected:", socket.id);
    
    // When a player joins a space
    socket.on("player-join", (data) => {
      console.log("📥 Player joined:", data);
      
      // First, send existing players to the new player (before adding them)
      const existingPlayers = {};
      Object.keys(players).forEach(playerId => {
        existingPlayers[playerId] = {
          id: playerId,
          ...players[playerId]
        };
      });
      
      // Send existing players to the new player
      socket.emit("existing-players", existingPlayers);
      
      // Add the new player to the players object
      players[socket.id] = {
        ...data,
        id: socket.id
      };
      
      // Broadcast the new player to all other connected clients
      socket.broadcast.emit("player-joined", {
        id: socket.id,
        ...data
      });
      
      console.log("📊 Current players:", Object.keys(players).length);
    });
    
    // Handle movement updates
    socket.on("player-move", (position) => {
      if (players[socket.id]) {
        players[socket.id].position = position;
        
        // Broadcast movement to all other players
        socket.broadcast.emit("player-moved", {
          id: socket.id,
          position
        });
      }
    });
    
    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("🔴 Client disconnected:", socket.id);
      
      if (players[socket.id]) {
        delete players[socket.id];
        
        // Notify all other players about the disconnect
        socket.broadcast.emit("player-left", socket.id);
        
        console.log("📊 Remaining players:", Object.keys(players).length);
      }
    });
  });
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});