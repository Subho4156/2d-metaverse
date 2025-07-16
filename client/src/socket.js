// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: false, // Don't connect immediately
});

export default socket;
