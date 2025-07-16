import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getSpaceById } from "../api";
import { getUser } from "../api";
import socket from "../socket";
import LoadingScreen from "../components/LoadingScreen";
import {
  Application,
  Graphics,
  Container,
  Text,
  TextStyle,
  Ticker,
} from "pixi.js";
import LeftToolbar from "../components/Toolbar";
import useUser from "../hooks/useUser";
import AdminPanel from "../components/AdminPanel";


function SpaceStation() {
   const [showFade, setShowFade] = useState(false);
   const [speed, setSpeed] = useState(2);
   const [wallHackEnabled, setWallHackEnabled] = useState(false);
   const [fadeOpacity, setFadeOpacity] = useState(0);
   const { id } = useParams();
   const [space, setSpace] = useState(null);
   const [loadingPage, setLoadingPage] = useState(true);
   const [chatOpen, setChatOpen] = useState(false);
   const [chatMessage, setChatMessage] = useState("");
   const [messages, setMessages] = useState([]);
   const [playerName, setPlayerName] = useState("Player");
   const canvasRef = useRef(null);
   const appRef = useRef(null);
   const [avatarType, setAvatarType] = useState("null");
   const [showBackWarning, setShowBackWarning] = useState(false);
   const [onlinePlayers, setOnlinePlayers] = useState([]);
   const [showToolbar, setShowToolbar] = useState(true);
   const [hackPermissions, setHackPermissions] = useState({
     wallhack: false,
     speedup: false,
     teleport: false,
   });
   const { user, loading } = useUser();
 
   const currentUserId = user?._id;
   const isOwner = space?.creator?.toString?.() === currentUserId;

  const gameStateRef = useRef({
    colliders: [],
    player: null,
    world: null,
    camera: null,
    otherPlayers: {},
    socketId: null,
    furniture: [],
    keys: {},
    TILE_SIZE: 32,
    ROOM_GRID: {
      rows: 2,
      cols: 2,
      roomWidth: 800,
      roomHeight: 600,
    },
    chatBubbles: [],
  });

    const PLAYER_BOUNDS = {
    offsetX: -8,
    offsetY: -12,
    width: 16,
    height: 45,
  };

    const handlePermissionsChange = (newPermissions) => {
    console.log("🔧 Admin updating permissions:", newPermissions);
    
    // Update local state
    setHackPermissions(newPermissions);
    
    // Broadcast to all users in the space
    if (socket && isOwner) {
      socket.emit("hackPermissionsUpdate", {
        permissions: newPermissions,
        targetUserId: "all" // Send to all users
      });
      
      console.log("📡 Broadcasted permissions to all users");
    }
  };

    const createGirlPlayer = (gameState, playerName = "You") => {
  const player = new Graphics();
  const legLeft = new Graphics();
  const legRight = new Graphics();
  const armLeft = new Graphics();
  const armRight = new Graphics();

  // Space station color palette
  const skinColor = 0xf4c2a1;
  const skinShadow = 0xe6b596;
  const suitPrimary = 0x2c3e50; // Dark blue-gray suit
  const suitSecondary = 0x34495e; // Lighter blue-gray
  const suitAccent = 0x3498db; // Bright blue accents
  const suitHighlight = 0x5dade2; // Light blue highlights
  const helmetColor = 0x85929e; // Metallic helmet
  const helmetReflection = 0xaeb6bf;
  const visorColor = 0x1a1a2e; // Dark visor with slight blue tint
  const visorReflection = 0x16213e;
  const hairColor = 0x8b4513; // Auburn/brown hair
  const hairHighlight = 0xa0522d;
  const bootColor = 0x2c3e50; // Dark space boots
  const bootAccent = 0x3498db; // Blue boot details
  const glowColor = 0x00ffff; // Cyan glow for tech elements

  // Main spacesuit body
  player.beginFill(suitPrimary);
  player.drawRect(-8, -5, 16, 18);
  player.endFill();

  // Suit paneling and details
  player.beginFill(suitSecondary);
  player.drawRect(-7, -4, 14, 2);
  player.drawRect(-7, 8, 14, 2);
  player.endFill();

  // Chest control panel
  player.beginFill(suitSecondary);
  player.drawRect(-5, -2, 10, 8);
  player.endFill();

  // Control panel details
  player.beginFill(suitAccent);
  player.drawRect(-4, -1, 3, 1);
  player.drawRect(-4, 1, 3, 1);
  player.drawRect(-4, 3, 3, 1);
  player.endFill();

  // Status lights
  player.beginFill(glowColor);
  player.drawRect(2, -1, 1, 1);
  player.drawRect(2, 1, 1, 1);
  player.endFill();

  // Emergency button
  player.beginFill(0xff4757);
  player.drawRect(2, 3, 1, 1);
  player.endFill();

  // Suit seams and reinforcement
  player.beginFill(suitHighlight);
  player.drawRect(-8, -5, 1, 18);
  player.drawRect(7, -5, 1, 18);
  player.drawRect(-8, 6, 16, 1);
  player.endFill();

  // Head with space helmet
  player.beginFill(helmetColor);
  player.drawRect(-7, -19, 14, 13);
  player.endFill();

  // Helmet reflections
  player.beginFill(helmetReflection);
  player.drawRect(-6, -18, 3, 10);
  player.drawRect(3, -18, 3, 10);
  player.endFill();

  // Visor
  player.beginFill(visorColor);
  player.drawRect(-6, -17, 12, 9);
  player.endFill();

  // Visor reflection
  player.beginFill(visorReflection);
  player.drawRect(-5, -16, 4, 6);
  player.endFill();

  // Face visible through visor
  player.beginFill(skinColor);
  player.drawRect(-4, -15, 8, 6);
  player.endFill();

  // Face shadow
  player.beginFill(skinShadow);
  player.drawRect(-4, -11, 8, 2);
  player.endFill();

  // Hair visible in helmet (shorter, practical style)
  player.beginFill(hairColor);
  player.drawRect(-3, -16, 6, 4);
  player.endFill();

  // Hair highlights
  player.beginFill(hairHighlight);
  player.drawRect(-2, -15, 2, 3);
  player.endFill();

  // Eyes
  player.beginFill(0xffffff);
  player.drawRect(-3, -14, 1, 1);
  player.drawRect(2, -14, 1, 1);
  player.endFill();

  // Eye pupils
  player.beginFill(0x2980b9);
  player.drawRect(-2.5, -13.5, 0.5, 0.5);
  player.drawRect(2.5, -13.5, 0.5, 0.5);
  player.endFill();

  // Nose
  player.beginFill(skinShadow);
  player.drawRect(-0.5, -12, 1, 1);
  player.endFill();

  // Lips
  player.beginFill(0xc0392b);
  player.drawRect(-1, -10, 2, 1);
  player.endFill();

  // Helmet communication device
  player.beginFill(suitAccent);
  player.drawRect(-8, -12, 2, 3);
  player.endFill();

  // Comm device details
  player.beginFill(glowColor);
  player.drawRect(-7, -11, 1, 1);
  player.endFill();

  // Left arm with suit details
  armLeft.beginFill(suitPrimary);
  armLeft.drawRect(-10, -2, 3, 12);
  armLeft.endFill();

  // Arm joint/shoulder pad
  armLeft.beginFill(suitSecondary);
  armLeft.drawRect(-10, -2, 3, 3);
  armLeft.endFill();

  // Arm seams
  armLeft.beginFill(suitHighlight);
  armLeft.drawRect(-10, 2, 3, 1);
  armLeft.drawRect(-10, 6, 3, 1);
  armLeft.endFill();

  // Space glove
  armLeft.beginFill(helmetColor);
  armLeft.drawRect(-9, 10, 2, 3);
  armLeft.endFill();

  // Glove details
  armLeft.beginFill(suitAccent);
  armLeft.drawRect(-9, 10, 2, 1);
  armLeft.endFill();

  // Right arm (mirror of left)
  armRight.beginFill(suitPrimary);
  armRight.drawRect(7, -2, 3, 12);
  armRight.endFill();

  armRight.beginFill(suitSecondary);
  armRight.drawRect(7, -2, 3, 3);
  armRight.endFill();

  armRight.beginFill(suitHighlight);
  armRight.drawRect(7, 2, 3, 1);
  armRight.drawRect(7, 6, 3, 1);
  armRight.endFill();

  armRight.beginFill(helmetColor);
  armRight.drawRect(7, 10, 2, 3);
  armRight.endFill();

  armRight.beginFill(suitAccent);
  armRight.drawRect(7, 10, 2, 1);
  armRight.endFill();

  player.addChild(armLeft);
  player.addChild(armRight);

  // Lower body suit
  player.beginFill(suitPrimary);
  player.drawRect(-7, 13, 14, 10);
  player.endFill();

  // Lower body paneling
  player.beginFill(suitSecondary);
  player.drawRect(-6, 14, 12, 2);
  player.drawRect(-6, 19, 12, 2);
  player.endFill();

  // Utility belt
  player.beginFill(suitAccent);
  player.drawRect(-7, 16, 14, 2);
  player.endFill();

  // Belt pouches
  player.beginFill(suitSecondary);
  player.drawRect(-6, 16, 2, 2);
  player.drawRect(-2, 16, 2, 2);
  player.drawRect(2, 16, 2, 2);
  player.endFill();

  // Legs with suit details
  legLeft.beginFill(suitPrimary);
  legLeft.drawRect(-5, 23, 4, 6);
  legLeft.endFill();

  // Leg seams
  legLeft.beginFill(suitHighlight);
  legLeft.drawRect(-5, 25, 4, 1);
  legLeft.endFill();

  legRight.beginFill(suitPrimary);
  legRight.drawRect(1, 23, 4, 6);
  legRight.endFill();

  legRight.beginFill(suitHighlight);
  legRight.drawRect(1, 25, 4, 1);
  legRight.endFill();

  player.addChild(legLeft);
  player.addChild(legRight);

  // Space boots
  const bootLeft = new Graphics();
  bootLeft.beginFill(bootColor);
  bootLeft.drawRect(-6, 29, 5, 4);
  bootLeft.endFill();

  // Boot sole (thicker for space)
  bootLeft.beginFill(0x1a1a1a);
  bootLeft.drawRect(-6, 32, 5, 2);
  bootLeft.endFill();

  // Boot details
  bootLeft.beginFill(bootAccent);
  bootLeft.drawRect(-6, 29, 5, 1);
  bootLeft.drawRect(-5, 30, 1, 2);
  bootLeft.endFill();

  // Magnetic attachment point
  bootLeft.beginFill(helmetColor);
  bootLeft.drawRect(-4, 33, 1, 1);
  bootLeft.endFill();

  const bootRight = new Graphics();
  bootRight.beginFill(bootColor);
  bootRight.drawRect(1, 29, 5, 4);
  bootRight.endFill();

  bootRight.beginFill(0x1a1a1a);
  bootRight.drawRect(1, 32, 5, 2);
  bootRight.endFill();

  bootRight.beginFill(bootAccent);
  bootRight.drawRect(1, 29, 5, 1);
  bootRight.drawRect(4, 30, 1, 2);
  bootRight.endFill();

  bootRight.beginFill(helmetColor);
  bootRight.drawRect(3, 33, 1, 1);
  bootRight.endFill();

  player.addChild(bootLeft);
  player.addChild(bootRight);

  // Life support backpack
  const backpack = new Graphics();
  backpack.beginFill(suitSecondary);
  backpack.drawRect(-4, 2, 8, 8);
  backpack.endFill();

  // Backpack details
  backpack.beginFill(suitAccent);
  backpack.drawRect(-3, 3, 6, 1);
  backpack.drawRect(-3, 7, 6, 1);
  backpack.endFill();

  // Oxygen indicator
  backpack.beginFill(0x2ecc71);
  backpack.drawRect(2, 4, 1, 1);
  backpack.endFill();

  // Warning light
  backpack.beginFill(0xf39c12);
  backpack.drawRect(2, 6, 1, 1);
  backpack.endFill();

  // Add backpack behind player
  player.addChildAt(backpack, 0);

  // Name tag with futuristic styling
  const nameTag = new Text({
    text: playerName,
    style: new TextStyle({
      fontSize: 12,
      fill: glowColor,
      fontFamily: "Arial",
      stroke: { color: 0x000000, width: 2 },
      dropShadow: {
        color: glowColor,
        blur: 3,
        angle: Math.PI / 4,
        distance: 2,
      },
    }),
  });
  nameTag.anchor.set(0.5);
  nameTag.y = -35;
  player.addChild(nameTag);

  // Initial position
  player.x = 400;
  player.y = 300;

  // Add to scene
  gameState.camera.addChild(player);
  gameState.player = player;

  // Enhanced animation state
  let walking = false;
  let walkFrame = 0;
  let direction = "down";
  const walkSpeed = 0.3;
  const legSwingAmount = 3; // Slightly less swing for space suit
  const armSwingAmount = 2; // Reduced for bulky suit
  const bodyBobAmount = 0.8; // Less bobbing for weightier movement

  let tickerFn = () => {
    if (!player || !player.parent) return; // prevent stale access
    if (walking) {
      walkFrame += walkSpeed;

      const legAngle = Math.sin(walkFrame) * legSwingAmount;
      const armAngle = Math.sin(walkFrame) * armSwingAmount;
      const bodyBob = Math.abs(Math.sin(walkFrame * 2)) * bodyBobAmount;

      // Leg animation (opposite swing)
      legLeft.y = 0 + legAngle;
      legRight.y = 0 - legAngle;

      // Arm animation (opposite to legs for natural walking)
      armLeft.y = 0 - armAngle * 0.7;
      armRight.y = 0 + armAngle * 0.7;

      // Slight arm rotation (less for bulky suit)
      armLeft.rotation = -armAngle * 0.05;
      armRight.rotation = armAngle * 0.05;

      // Body bobbing (exclude specific parts)
      player.children.forEach((child) => {
        if (
          child !== legLeft &&
          child !== legRight &&
          child !== bootLeft &&
          child !== bootRight &&
          child !== backpack
        ) {
          child.y += Math.sin(walkFrame * 2) * 0.3;
        }
      });

      // Backpack slight movement
      backpack.y += Math.sin(walkFrame * 2) * 0.2;

      // Directional facing (flip sprite)
      if (direction === "left") {
        player.scale.x = -1;
      } else if (direction === "right") {
        player.scale.x = 1;
      }
      nameTag.scale.x = 1 / player.scale.x;
    } else {
      // Return to idle position smoothly
      legLeft.y += (0 - legLeft.y) * 0.1;
      legRight.y += (0 - legRight.y) * 0.1;
      armLeft.y += (0 - armLeft.y) * 0.1;
      armRight.y += (0 - armRight.y) * 0.1;
      armLeft.rotation += (0 - armLeft.rotation) * 0.1;
      armRight.rotation += (0 - armRight.rotation) * 0.1;
      backpack.y += (0 - backpack.y) * 0.1;

      // Reset body parts to original positions
      player.children.forEach((child) => {
        if (
          child !== legLeft &&
          child !== legRight &&
          child !== bootLeft &&
          child !== bootRight &&
          child !== nameTag &&
          child !== backpack
        ) {
          child.y += Math.sin(walkFrame * 2) * 0.3;
        }
      });
    }
  };

  // Ticker-based enhanced animation
  Ticker.shared.add(tickerFn);
  player._tickerFn = tickerFn;

  // Enhanced movement API
  player.walk = (dir) => {
    walking = true;
    direction = dir;
    const speed = 1.8; // Slightly slower for space suit

    if (dir === "left") player.x -= speed;
    if (dir === "right") player.x += speed;
    if (dir === "up") player.y -= speed;
    if (dir === "down") player.y += speed;
  };

  player.stop = () => {
    walking = false;
  };

  // Store original positions for smooth transitions
  player.children.forEach((child) => {
    child.originalY = child.y;
  });

  return player;
};
  
    const createSpidey = (gameState, playerName = "Spiderman") => {
      const player = new Graphics();
      const legLeft = new Graphics();
      const legRight = new Graphics();
      const armLeft = new Graphics();
      const armRight = new Graphics();
  
      // Enhanced Spiderman color palette
      const spidermanRed = 0xdc143c;
      const spidermanRedShadow = 0xa01024;
      const spidermanRedHighlight = 0xff3050;
      const spidermanBlue = 0x1e40af;
      const spidermanBlueShadow = 0x1e3a8a;
      const spidermanBlueHighlight = 0x3b82f6;
      const webColor = 0x000000;
      const eyeColor = 0xffffff;
      const eyeReflection = 0xe0e0e0;
      const muscleShadow = 0x8b1538;
  
      // Create separate graphics objects for emblem and web patterns
      const emblem = new Graphics();
      const webPattern = new Graphics();
  
      // Main body (red suit with muscle definition)
      player.beginFill(spidermanRed);
      player.drawRect(-8, -5, 16, 18);
      player.endFill();
  
      // Muscle definition on torso
      player.beginFill(spidermanRedShadow);
      player.drawRect(-6, -3, 2, 8); // Left pec
      player.drawRect(4, -3, 2, 8); // Right pec
      player.drawRect(-2, 2, 4, 6); // Abs
      player.endFill();
  
      // Body highlights
      player.beginFill(spidermanRedHighlight);
      player.drawRect(-7, -4, 1, 6); // Left highlight
      player.drawRect(6, -4, 1, 6); // Right highlight
      player.endFill();
  
      // Body shadow
      player.beginFill(spidermanRedShadow);
      player.drawRect(-8, 11, 16, 2);
      player.endFill();
  
      // Enhanced spider emblem on chest
      emblem.beginFill(webColor);
      // Spider body (more detailed)
      emblem.drawRect(-1, -3, 2, 8);
      emblem.drawRect(-2, -1, 4, 2);
      // Spider legs (more realistic)
      emblem.drawRect(-5, -1, 3, 1);
      emblem.drawRect(2, -1, 3, 1);
      emblem.drawRect(-4, 1, 2, 1);
      emblem.drawRect(2, 1, 2, 1);
      emblem.drawRect(-3, 3, 1, 1);
      emblem.drawRect(2, 3, 1, 1);
      // Add spider head
      emblem.drawRect(-1, -4, 2, 2);
      emblem.endFill();
  
      // Enhanced web pattern on torso
      webPattern.beginFill(webColor);
      // Vertical web lines
      for (let i = -6; i <= 6; i += 2) {
        webPattern.drawRect(i, -4, 1, 16);
      }
      // Horizontal web lines
      for (let i = -4; i <= 12; i += 2) {
        webPattern.drawRect(-7, i, 14, 1);
      }
      // Diagonal web connections
      for (let i = -6; i <= 4; i += 2) {
        webPattern.drawRect(i, -3 + Math.abs(i), 1, 1);
        webPattern.drawRect(i, 1 + Math.abs(i), 1, 1);
      }
      webPattern.endFill();
  
      // Head (full mask with better shape)
      player.beginFill(spidermanRed);
      player.drawRect(-6, -18, 12, 12);
      player.endFill();
  
      // Head muscle definition
      player.beginFill(spidermanRedShadow);
      player.drawRect(-5, -16, 2, 3); // Left cheek
      player.drawRect(3, -16, 2, 3); // Right cheek
      player.drawRect(-2, -12, 4, 2); // Jaw line
      player.endFill();
  
      // Head highlights
      player.beginFill(spidermanRedHighlight);
      player.drawRect(-5, -17, 1, 2);
      player.drawRect(4, -17, 1, 2);
      player.endFill();
  
      // Enhanced web pattern on head
      player.beginFill(webColor);
      // Radial web pattern from center
      for (let i = -5; i <= 5; i += 2) {
        player.drawRect(i, -18, 1, 12);
      }
      for (let i = -17; i <= -7; i += 2) {
        player.drawRect(-6, i, 12, 1);
      }
      // Curved web lines around eyes
      player.drawRect(-6, -15, 2, 1);
      player.drawRect(-6, -14, 3, 1);
      player.drawRect(3, -15, 3, 1);
      player.drawRect(4, -14, 2, 1);
      player.endFill();
  
      // Enhanced Spiderman eyes (larger and more expressive)
      player.beginFill(eyeColor);
      // Left eye (teardrop shape)
      player.drawRect(-5, -16, 4, 5);
      player.drawRect(-4, -17, 2, 1);
      player.drawRect(-4, -11, 2, 1);
      // Right eye
      player.drawRect(1, -16, 4, 5);
      player.drawRect(2, -17, 2, 1);
      player.drawRect(2, -11, 2, 1);
      player.endFill();
  
      // Eye reflections
      player.beginFill(eyeReflection);
      player.drawRect(-4, -15, 1, 1);
      player.drawRect(2, -15, 1, 1);
      player.endFill();
  
      // Eye outline (more detailed)
      player.beginFill(webColor);
      // Left eye outline
      player.drawRect(-5, -17, 4, 1);
      player.drawRect(-5, -11, 4, 1);
      player.drawRect(-5, -16, 1, 5);
      player.drawRect(-1, -16, 1, 5);
      player.drawRect(-4, -17, 1, 1);
      player.drawRect(-2, -17, 1, 1);
      // Right eye outline
      player.drawRect(1, -17, 4, 1);
      player.drawRect(1, -11, 4, 1);
      player.drawRect(1, -16, 1, 5);
      player.drawRect(4, -16, 1, 5);
      player.drawRect(2, -17, 1, 1);
      player.drawRect(4, -17, 1, 1);
      player.endFill();
  
      // Enhanced arms (red with better muscle definition)
      armLeft.beginFill(spidermanRed);
      armLeft.drawRect(-10, -2, 3, 12);
      armLeft.endFill();
  
      // Muscle definition on arms
      armLeft.beginFill(spidermanRedShadow);
      armLeft.drawRect(-9, 0, 1, 8); // Bicep
      armLeft.endFill();
  
      armLeft.beginFill(spidermanRedHighlight);
      armLeft.drawRect(-10, 1, 1, 6);
      armLeft.endFill();
  
      // Enhanced web pattern on arms
      armLeft.beginFill(webColor);
      armLeft.drawRect(-10, 0, 3, 1);
      armLeft.drawRect(-10, 3, 3, 1);
      armLeft.drawRect(-10, 6, 3, 1);
      armLeft.drawRect(-9, -2, 1, 12);
      // Diagonal connections
      armLeft.drawRect(-10, 1, 1, 1);
      armLeft.drawRect(-8, 2, 1, 1);
      armLeft.drawRect(-10, 4, 1, 1);
      armLeft.drawRect(-8, 5, 1, 1);
      armLeft.endFill();
  
      // Enhanced hands
      armLeft.beginFill(spidermanRed);
      armLeft.drawRect(-9, 10, 2, 3);
      armLeft.endFill();
  
      // Hand web pattern
      armLeft.beginFill(webColor);
      armLeft.drawRect(-9, 11, 2, 1);
      armLeft.endFill();
  
      // Right arm (mirrored)
      armRight.beginFill(spidermanRed);
      armRight.drawRect(7, -2, 3, 12);
      armRight.endFill();
  
      armRight.beginFill(spidermanRedShadow);
      armRight.drawRect(8, 0, 1, 8);
      armRight.endFill();
  
      armRight.beginFill(spidermanRedHighlight);
      armRight.drawRect(9, 1, 1, 6);
      armRight.endFill();
  
      armRight.beginFill(webColor);
      armRight.drawRect(7, 0, 3, 1);
      armRight.drawRect(7, 3, 3, 1);
      armRight.drawRect(7, 6, 3, 1);
      armRight.drawRect(8, -2, 1, 12);
      armRight.drawRect(9, 1, 1, 1);
      armRight.drawRect(7, 2, 1, 1);
      armRight.drawRect(9, 4, 1, 1);
      armRight.drawRect(7, 5, 1, 1);
      armRight.endFill();
  
      armRight.beginFill(spidermanRed);
      armRight.drawRect(7, 10, 2, 3);
      armRight.endFill();
  
      armRight.beginFill(webColor);
      armRight.drawRect(7, 11, 2, 1);
      armRight.endFill();
  
      // Enhanced legs (blue suit with muscle definition)
      legLeft.beginFill(spidermanBlue);
      legLeft.drawRect(-5, 13, 4, 16);
      legLeft.endFill();
  
      // Muscle definition on legs
      legLeft.beginFill(spidermanBlueShadow);
      legLeft.drawRect(-4, 15, 1, 12); // Quad muscle
      legLeft.drawRect(-2, 17, 1, 8); // Inner muscle
      legLeft.endFill();
  
      legLeft.beginFill(spidermanBlueHighlight);
      legLeft.drawRect(-5, 16, 1, 10);
      legLeft.endFill();
  
      // Enhanced web pattern on legs
      legLeft.beginFill(webColor);
      legLeft.drawRect(-5, 16, 4, 1);
      legLeft.drawRect(-5, 20, 4, 1);
      legLeft.drawRect(-5, 24, 4, 1);
      legLeft.drawRect(-3, 13, 1, 16);
      // Diagonal connections
      legLeft.drawRect(-5, 17, 1, 1);
      legLeft.drawRect(-2, 18, 1, 1);
      legLeft.drawRect(-5, 21, 1, 1);
      legLeft.drawRect(-2, 22, 1, 1);
      legLeft.endFill();
  
      // Right leg (mirrored)
      legRight.beginFill(spidermanBlue);
      legRight.drawRect(1, 13, 4, 16);
      legRight.endFill();
  
      legRight.beginFill(spidermanBlueShadow);
      legRight.drawRect(3, 15, 1, 12);
      legRight.drawRect(1, 17, 1, 8);
      legRight.endFill();
  
      legRight.beginFill(spidermanBlueHighlight);
      legRight.drawRect(4, 16, 1, 10);
      legRight.endFill();
  
      legRight.beginFill(webColor);
      legRight.drawRect(1, 16, 4, 1);
      legRight.drawRect(1, 20, 4, 1);
      legRight.drawRect(1, 24, 4, 1);
      legRight.drawRect(2, 13, 1, 16);
      legRight.drawRect(4, 17, 1, 1);
      legRight.drawRect(1, 18, 1, 1);
      legRight.drawRect(4, 21, 1, 1);
      legRight.drawRect(1, 22, 1, 1);
      legRight.endFill();
  
      // Enhanced boots
      const shoeLeft = new Graphics();
      shoeLeft.beginFill(spidermanRed);
      shoeLeft.drawRect(-6, 29, 5, 3);
      shoeLeft.endFill();
  
      // Boot details
      shoeLeft.beginFill(spidermanRedShadow);
      shoeLeft.drawRect(-6, 30, 5, 1);
      shoeLeft.endFill();
  
      shoeLeft.beginFill(webColor);
      shoeLeft.drawRect(-5, 29, 1, 3);
      shoeLeft.drawRect(-3, 29, 1, 3);
      shoeLeft.endFill();
  
      const shoeRight = new Graphics();
      shoeRight.beginFill(spidermanRed);
      shoeRight.drawRect(1, 29, 5, 3);
      shoeRight.endFill();
  
      shoeRight.beginFill(spidermanRedShadow);
      shoeRight.drawRect(1, 30, 5, 1);
      shoeRight.endFill();
  
      shoeRight.beginFill(webColor);
      shoeRight.drawRect(2, 29, 1, 3);
      shoeRight.drawRect(4, 29, 1, 3);
      shoeRight.endFill();
  
      // Add all child elements in correct order
      player.addChild(webPattern); // Web pattern first
      player.addChild(emblem); // Emblem on top
      player.addChild(armLeft);
      player.addChild(armRight);
      player.addChild(legLeft);
      player.addChild(legRight);
      player.addChild(shoeLeft);
      player.addChild(shoeRight);
  
      // Name tag
      const nameTag = new Text({
        text: playerName,
        style: new TextStyle({
          fontSize: 12,
          fill: 0xffffff,
          fontFamily: "Arial",
          stroke: { color: 0x000000, width: 2 },
          dropShadow: {
            color: 0x000000,
            blur: 2,
            angle: Math.PI / 4,
            distance: 2,
          },
        }),
      });
      nameTag.anchor.set(0.5);
      nameTag.y = -35;
      player.addChild(nameTag);
  
      return setupPlayerAnimation(
        player,
        gameState,
        legLeft,
        legRight,
        armLeft,
        armRight,
        shoeLeft,
        shoeRight,
        nameTag,
        null,
        emblem,
        webPattern
      );
    };
   
    // Batman Character Design
    const createBatman = (gameState, playerName = "Batman") => {
      let tickerFn = null;
      const player = new Graphics();
      const legLeft = new Graphics();
      const legRight = new Graphics();
      const armLeft = new Graphics();
      const armRight = new Graphics();
  
      // Batman color palette
      const batmanGray = 0x4a5568;
      const batmanGrayShadow = 0x2d3748;
      const batmanBlack = 0x1a202c;
      const batmanBlackShadow = 0x000000;
      const batmanYellow = 0xffd700;
      const batmanYellowShadow = 0xe6c200;
      const batmanBlue = 0x2563eb;
      const capeColor = 0x1a202c;
  
      // Cape (behind character) - Ensure this is added first to be at the back
      const cape = new Graphics();
      cape.beginFill(capeColor);
      cape.drawRect(-12, -8, 24, 25);
      cape.endFill();
  
      // Cape shadow
      cape.beginFill(batmanBlackShadow);
      cape.drawRect(-12, 15, 24, 2);
      cape.endFill();
  
      player.addChild(cape); // Add cape first
  
      // Main body (gray suit)
      player.beginFill(batmanGray);
      player.drawRect(-8, -5, 16, 18);
      player.endFill();
  
      // Body shadow
      player.beginFill(batmanGrayShadow);
      player.drawRect(-8, 11, 16, 2);
      player.endFill();
  
      // Head with cowl (drawn after body)
      player.beginFill(batmanGray);
      player.drawRect(-6, -18, 12, 12);
      player.endFill();
  
      // Batman cowl ears
      player.beginFill(batmanGray);
      player.drawRect(-4, -22, 2, 4);
      player.drawRect(2, -22, 2, 4);
      player.endFill();
  
      // Cowl shadow
      player.beginFill(batmanGrayShadow);
      player.drawRect(-6, -8, 12, 2);
      player.endFill();
  
      // Batman eyes (white slits)
      player.beginFill(0xffffff);
      player.drawRect(-4, -15, 2, 1);
      player.drawRect(2, -15, 2, 1);
      player.endFill();
  
      // Mouth (stern expression)
      player.beginFill(batmanGrayShadow);
      player.drawRect(-1, -10, 2, 1);
      player.endFill();
  
      // Create separate graphics objects for emblem and belt
      const emblem = new Graphics();
      const belt = new Graphics();
  
      // Bat emblem on chest - separate object
      emblem.beginFill(batmanYellow);
      emblem.drawRect(-3, -2, 6, 4);
      emblem.endFill();
  
      // Bat symbol
      emblem.beginFill(batmanBlack);
      // Bat body
      emblem.drawRect(-1, -1, 2, 2);
      // Bat wings
      emblem.drawRect(-3, 0, 2, 1);
      emblem.drawRect(1, 0, 2, 1);
      // Wing tips
      emblem.drawRect(-4, 1, 1, 1);
      emblem.drawRect(3, 1, 1, 1);
      emblem.endFill();
  
      // Utility belt - separate object
      belt.beginFill(batmanYellow);
      belt.drawRect(-8, 8, 16, 2);
      belt.endFill();
  
      // Belt pouches
      belt.beginFill(batmanYellowShadow);
      belt.drawRect(-6, 8, 2, 2);
      belt.drawRect(-2, 8, 2, 2);
      belt.drawRect(2, 8, 2, 2);
      belt.endFill();
  
      // Belt buckle
      belt.beginFill(batmanYellowShadow);
      belt.drawRect(-1, 8, 2, 2);
      belt.endFill();
  
      // Add emblem and belt to player
      player.addChild(emblem);
      player.addChild(belt);
  
      // Arms (gray with black gloves)
      armLeft.beginFill(batmanGray);
      armLeft.drawRect(-10, -2, 3, 10);
      armLeft.endFill();
  
      // Black gloves
      armLeft.beginFill(batmanBlack);
      armLeft.drawRect(-10, 8, 3, 5);
      armLeft.endFill();
  
      armRight.beginFill(batmanGray);
      armRight.drawRect(7, -2, 3, 10);
      armRight.endFill();
  
      armRight.beginFill(batmanBlack);
      armRight.drawRect(7, 8, 3, 5);
      armRight.endFill();
  
      player.addChild(armLeft);
      player.addChild(armRight);
  
      // Legs (gray with black boots)
      legLeft.beginFill(batmanGray);
      legLeft.drawRect(-5, 13, 4, 12);
      legLeft.endFill();
  
      // Black boots
      legLeft.beginFill(batmanBlack);
      legLeft.drawRect(-5, 25, 4, 4);
      legLeft.endFill();
  
      legRight.beginFill(batmanGray);
      legRight.drawRect(1, 13, 4, 12);
      legRight.endFill();
  
      legRight.beginFill(batmanBlack);
      legRight.drawRect(1, 25, 4, 4);
      legRight.endFill();
  
      player.addChild(legLeft);
      player.addChild(legRight);
  
      // Boots
      const shoeLeft = new Graphics();
      shoeLeft.beginFill(batmanBlack);
      shoeLeft.drawRect(-6, 29, 5, 3);
      shoeLeft.endFill();
  
      const shoeRight = new Graphics();
      shoeRight.beginFill(batmanBlack);
      shoeRight.drawRect(1, 29, 5, 3);
      shoeRight.endFill();
  
      player.addChild(shoeLeft);
      player.addChild(shoeRight);
  
      // Name tag
      const nameTag = new Text({
        text: playerName,
        style: new TextStyle({
          fontSize: 12,
          fill: 0xffffff,
          fontFamily: "Arial",
          stroke: { color: 0x000000, width: 2 },
          dropShadow: {
            color: 0x000000,
            blur: 2,
            angle: Math.PI / 4,
            distance: 2,
          },
        }),
      });
      nameTag.anchor.set(0.5);
      nameTag.y = -35;
      player.addChild(nameTag);
  
      return setupPlayerAnimation(
        player,
        gameState,
        legLeft,
        legRight,
        armLeft,
        armRight,
        shoeLeft,
        shoeRight,
        nameTag,
        cape,
        emblem,
        belt
      );
    };
  
    // Shared animation setup function
    const setupPlayerAnimation = (
      player,
      gameState,
      legLeft,
      legRight,
      armLeft,
      armRight,
      shoeLeft,
      shoeRight,
      nameTag,
      cape = null,
      emblem = null,
      belt = null
    ) => {
      // Initial position
      let tickerFn = null;
      player.x = 400;
      player.y = 300;
  
      // Add to scene
      gameState.camera.addChild(player);
      gameState.player = player;
  
      // Animation variables
      let walking = false;
      let walkFrame = 0;
      let direction = "down";
      const walkSpeed = 0.3;
      const legSwingAmount = 4;
      const armSwingAmount = 3;
      const bodyBobAmount = 1;
  
      tickerFn = () => {
        if (!player || !player.parent) return; // prevent stale access
  
        if (walking) {
          walkFrame += walkSpeed;
  
          const legAngle = Math.sin(walkFrame) * legSwingAmount;
          const armAngle = Math.sin(walkFrame) * armSwingAmount;
          const bodyBob = Math.abs(Math.sin(walkFrame * 2)) * bodyBobAmount;
  
          legLeft.y = 0 + legAngle;
          legRight.y = 0 - legAngle;
  
          armLeft.y = 0 - armAngle * 0.7;
          armRight.y = 0 + armAngle * 0.7;
  
          armLeft.rotation = -armAngle * 0.1;
          armRight.rotation = armAngle * 0.1;
  
          player.children.forEach((child) => {
            if (
              child !== legLeft &&
              child !== legRight &&
              child !== shoeLeft &&
              child !== shoeRight &&
              child !== cape &&
              child !== emblem &&
              child !== belt
            ) {
              child.y += Math.sin(walkFrame * 2) * 0.3;
            }
          });
  
          if (direction === "left") {
            player.scale.x = -1;
          } else if (direction === "right") {
            player.scale.x = 1;
          }
          nameTag.scale.x = 1 / player.scale.x;
        } else {
          legLeft.y += (0 - legLeft.y) * 0.1;
          legRight.y += (0 - legRight.y) * 0.1;
          armLeft.y += (0 - armLeft.y) * 0.1;
          armRight.y += (0 - armRight.y) * 0.1;
          armLeft.rotation += (0 - armLeft.rotation) * 0.1;
          armRight.rotation += (0 - armRight.rotation) * 0.1;
  
          player.children.forEach((child) => {
            if (
              child !== legLeft &&
              child !== legRight &&
              child !== shoeLeft &&
              child !== shoeRight &&
              child !== nameTag &&
              child !== cape &&
              child !== emblem &&
              child !== belt
            ) {
              child.y += Math.sin(walkFrame * 2) * 0.3;
            }
          });
        }
      };
  
      Ticker.shared.add(tickerFn);
      player._tickerFn = tickerFn;
  
      player.walk = (dir) => {
        walking = true;
        direction = dir;
        const speed = 2;
  
        if (dir === "left") player.x -= speed;
        if (dir === "right") player.x += speed;
        if (dir === "up") player.y -= speed;
        if (dir === "down") player.y += speed;
      };
  
      player.stop = () => {
        walking = false;
      };
  
      player.children.forEach((child) => {
        child.originalY = child.y;
      });
  
      return player;
    };
  
    // ALTERNATIVE MALE VERSION (CASUAL STYLE)
const createMalePlayer = (gameState, playerName = "Commander") => {
  let tickerFn = null;
  const player = new Graphics();
  const legLeft = new Graphics();
  const legRight = new Graphics();
  const armLeft = new Graphics();
  const armRight = new Graphics();

  // Space station crew color palette
  const skinColor = 0xd4a574;
  const skinShadow = 0xc19660;
  const suitColor = 0x2c3e50; // Dark blue space suit
  const suitShadow = 0x1a252f;
  const suitAccent = 0x3498db; // Bright blue accents
  const hairColor = 0x4a4a4a; // Gray/silver hair
  const bootColor = 0x1a1a1a; // Black space boots
  const helmetRim = 0x5d6d7e; // Metallic helmet rim

  // Player body (space suit torso)
  player.beginFill(suitColor);
  player.drawRect(-9, -5, 18, 22);
  player.endFill();

  // Suit shadow
  player.beginFill(suitShadow);
  player.drawRect(-9, 15, 18, 2);
  player.endFill();

  // Chest control panel
  player.beginFill(suitAccent);
  player.drawRect(-7, 2, 14, 8);
  player.endFill();

  // Control panel buttons
  player.beginFill(0xe74c3c); // Red button
  player.drawRect(-5, 4, 2, 2);
  player.endFill();

  player.beginFill(0x27ae60); // Green button
  player.drawRect(-1, 4, 2, 2);
  player.endFill();

  player.beginFill(0xf39c12); // Orange button
  player.drawRect(3, 4, 2, 2);
  player.endFill();

  // Status display screen
  player.beginFill(0x2ecc71);
  player.drawRect(-6, 7, 12, 2);
  player.endFill();

  // Suit seams/panels
  player.beginFill(suitAccent);
  player.drawRect(-9, -2, 18, 1);
  player.drawRect(-9, 12, 18, 1);
  player.endFill();

  // Utility belt
  player.beginFill(0x34495e);
  player.drawRect(-8, 14, 16, 3);
  player.endFill();

  // Belt pouches
  player.beginFill(0x7f8c8d);
  player.drawRect(-6, 15, 2, 2);
  player.drawRect(-1, 15, 2, 2);
  player.drawRect(4, 15, 2, 2);
  player.endFill();

  // Head
  player.beginFill(skinColor);
  player.drawRect(-6, -18, 12, 12);
  player.endFill();

  // Face shadow
  player.beginFill(skinShadow);
  player.drawRect(-6, -8, 12, 2);
  player.endFill();

  // Short professional hair
  player.beginFill(hairColor);
  player.drawRect(-7, -19, 14, 6);
  player.endFill();

  // Hair highlights
  player.beginFill(0x6a6a6a);
  player.drawRect(-5, -18, 2, 3);
  player.drawRect(1, -18, 2, 3);
  player.drawRect(4, -17, 2, 2);
  player.endFill();

  // Eyes with focused expression
  player.beginFill(0xffffff);
  player.drawRect(-4, -15, 2, 2);
  player.drawRect(2, -15, 2, 2);
  player.endFill();

  // Eye pupils
  player.beginFill(0x000000);
  player.drawRect(-3.5, -14.5, 1, 1);
  player.drawRect(2.5, -14.5, 1, 1);
  player.endFill();

  // Nose
  player.beginFill(skinShadow);
  player.drawRect(-0.5, -12, 1, 1);
  player.endFill();

  // Determined expression
  player.beginFill(skinShadow);
  player.drawRect(-1, -10, 3, 1);
  player.endFill();

  // Communication headset
  player.beginFill(0x34495e);
  player.drawRect(-7, -16, 2, 1);
  player.drawRect(5, -16, 2, 1);
  player.endFill();

  // Headset mic
  player.beginFill(0x7f8c8d);
  player.drawRect(-8, -15, 1, 2);
  player.endFill();

  // Arms in space suit sleeves
  armLeft.beginFill(suitColor);
  armLeft.drawRect(-11, -2, 4, 14);
  armLeft.endFill();

  // Sleeve panels
  armLeft.beginFill(suitAccent);
  armLeft.drawRect(-11, 2, 4, 1);
  armLeft.drawRect(-11, 8, 4, 1);
  armLeft.endFill();

  // Glove cuffs
  armLeft.beginFill(suitShadow);
  armLeft.drawRect(-11, 10, 4, 2);
  armLeft.endFill();

  // Space gloves
  armLeft.beginFill(0x2c3e50);
  armLeft.drawRect(-10, 12, 2, 3);
  armLeft.endFill();

  // Glove details
  armLeft.beginFill(suitAccent);
  armLeft.drawRect(-10, 12, 2, 1);
  armLeft.endFill();

  armRight.beginFill(suitColor);
  armRight.drawRect(7, -2, 4, 14);
  armRight.endFill();

  armRight.beginFill(suitAccent);
  armRight.drawRect(7, 2, 4, 1);
  armRight.drawRect(7, 8, 4, 1);
  armRight.endFill();

  armRight.beginFill(suitShadow);
  armRight.drawRect(7, 10, 4, 2);
  armRight.endFill();

  armRight.beginFill(0x2c3e50);
  armRight.drawRect(8, 12, 2, 3);
  armRight.endFill();

  armRight.beginFill(suitAccent);
  armRight.drawRect(8, 12, 2, 1);
  armRight.endFill();

  player.addChild(armLeft);
  player.addChild(armRight);

  // Space suit pants
  legLeft.beginFill(suitColor);
  legLeft.drawRect(-7, 17, 6, 10);
  legLeft.endFill();

  // Pants shadow
  legLeft.beginFill(suitShadow);
  legLeft.drawRect(-7, 25, 6, 2);
  legLeft.endFill();

  // Leg panel seams
  legLeft.beginFill(suitAccent);
  legLeft.drawRect(-7, 20, 6, 1);
  legLeft.endFill();

  // Knee protection
  legLeft.beginFill(0x34495e);
  legLeft.drawRect(-6, 22, 4, 2);
  legLeft.endFill();

  legRight.beginFill(suitColor);
  legRight.drawRect(1, 17, 6, 10);
  legRight.endFill();

  legRight.beginFill(suitShadow);
  legRight.drawRect(1, 25, 6, 2);
  legRight.endFill();

  legRight.beginFill(suitAccent);
  legRight.drawRect(1, 20, 6, 1);
  legRight.endFill();

  legRight.beginFill(0x34495e);
  legRight.drawRect(2, 22, 4, 2);
  legRight.endFill();

  player.addChild(legLeft);
  player.addChild(legRight);

  // Space boots
  const shoeLeft = new Graphics();
  shoeLeft.beginFill(bootColor);
  shoeLeft.drawRect(-8, 27, 7, 4);
  shoeLeft.endFill();

  // Boot sole with tread
  shoeLeft.beginFill(0x34495e);
  shoeLeft.drawRect(-8, 30, 7, 1);
  shoeLeft.endFill();

  // Boot details/buckles
  shoeLeft.beginFill(0x7f8c8d);
  shoeLeft.drawRect(-7, 28, 5, 1);
  shoeLeft.endFill();

  // Magnetic boot indicators
  shoeLeft.beginFill(0xe74c3c);
  shoeLeft.drawRect(-3, 29, 1, 1);
  shoeLeft.endFill();

  const shoeRight = new Graphics();
  shoeRight.beginFill(bootColor);
  shoeRight.drawRect(1, 27, 7, 4);
  shoeRight.endFill();

  shoeRight.beginFill(0x34495e);
  shoeRight.drawRect(1, 30, 7, 1);
  shoeRight.endFill();

  shoeRight.beginFill(0x7f8c8d);
  shoeRight.drawRect(2, 28, 5, 1);
  shoeRight.endFill();

  shoeRight.beginFill(0xe74c3c);
  shoeRight.drawRect(4, 29, 1, 1);
  shoeRight.endFill();

  player.addChild(shoeLeft);
  player.addChild(shoeRight);

  // Rank insignia on shoulder
  const rankInsignia = new Graphics();
  rankInsignia.beginFill(0xffd700);
  rankInsignia.drawRect(-8, -3, 3, 1);
  rankInsignia.drawRect(-8, -1, 3, 1);
  rankInsignia.endFill();
  player.addChild(rankInsignia);

  // Name tag with space theme
  const nameTag = new Text({
    text: playerName,
    style: new TextStyle({
      fontSize: 12,
      fill: 0x3498db,
      fontFamily: "Arial",
      stroke: { color: 0x000000, width: 2 },
      dropShadow: {
        color: 0x000000,
        blur: 2,
        angle: Math.PI / 4,
        distance: 2,
      },
    }),
  });
  nameTag.anchor.set(0.5);
  nameTag.y = -35;
  player.addChild(nameTag);

  // Initial position
  player.x = 400;
  player.y = 300;

  // Add to scene
  gameState.camera.addChild(player);
  gameState.player = player;

  // Enhanced animation state
  let walking = false;
  let walkFrame = 0;
  let direction = "down";
  const walkSpeed = 0.3;
  const legSwingAmount = 3; // Slightly reduced for heavier space suit
  const armSwingAmount = 2.5; // Reduced for bulkier arms
  const bodyBobAmount = 0.8; // Less bouncy for weighted suit

  tickerFn = () => {
    if (!player || !player.parent) return;
    if (walking) {
      walkFrame += walkSpeed;

      const legAngle = Math.sin(walkFrame) * legSwingAmount;
      const armAngle = Math.sin(walkFrame) * armSwingAmount;
      const bodyBob = Math.abs(Math.sin(walkFrame * 2)) * bodyBobAmount;

      // Leg animation (opposite swing)
      legLeft.y = 0 + legAngle;
      legRight.y = 0 - legAngle;

      // Arm animation (opposite to legs for natural walking)
      armLeft.y = 0 - armAngle * 0.7;
      armRight.y = 0 + armAngle * 0.7;

      // Slight arm rotation
      armLeft.rotation = -armAngle * 0.08; // Reduced rotation for bulkier suit
      armRight.rotation = armAngle * 0.08;

      // Body bobbing
      player.children.forEach((child) => {
        if (
          child !== legLeft &&
          child !== legRight &&
          child !== shoeLeft &&
          child !== shoeRight
        ) {
          child.y += Math.sin(walkFrame * 2) * 0.25; // Reduced bobbing
        }
      });

      // Directional facing (flip sprite)
      if (direction === "left") {
        player.scale.x = -1;
      } else if (direction === "right") {
        player.scale.x = 1;
      }
      nameTag.scale.x = 1 / player.scale.x;
    } else {
      // Return to idle position smoothly
      legLeft.y += (0 - legLeft.y) * 0.1;
      legRight.y += (0 - legRight.y) * 0.1;
      armLeft.y += (0 - armLeft.y) * 0.1;
      armRight.y += (0 - armRight.y) * 0.1;
      armLeft.rotation += (0 - armLeft.rotation) * 0.1;
      armRight.rotation += (0 - armRight.rotation) * 0.1;

      // Reset body parts to original positions (remove the continuous animation)
      player.children.forEach((child) => {
        if (
          child !== legLeft &&
          child !== legRight &&
          child !== shoeLeft &&
          child !== shoeRight &&
          child !== nameTag &&
          child.originalY !== undefined
        ) {
          child.y += (child.originalY - child.y) * 0.1;
        }
      });
    }
  };

  // Ticker-based enhanced animation
  Ticker.shared.add(tickerFn);
  player._tickerFn = tickerFn;

  // Enhanced movement API
  player.walk = (dir) => {
    walking = true;
    direction = dir;
    const speed = 1.8; // Slightly slower for heavy space suit

    if (dir === "left") player.x -= speed;
    if (dir === "right") player.x += speed;
    if (dir === "up") player.y -= speed;
    if (dir === "down") player.y += speed;
  };

  player.stop = () => {
    walking = false;
  };

  // Store original positions for smooth transitions
  player.children.forEach((child) => {
    child.originalY = child.y;
  });

  return player;
};

  const createPlayer = (gameState, playerName = "Astronaut") => {
    const player = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Space suit color palette
    const suitColor = 0xe8e8e8;        // Light gray suit
    const suitShadow = 0xc0c0c0;       // Darker gray shadow
    const suitAccent = 0x4169e1;       // Royal blue accents
    const helmetColor = 0xf0f8ff;      // Light blue helmet
    const helmetShadow = 0xd0d0d0;     // Helmet shadow
    const visorColor = 0x1e1e1e;       // Dark visor
    const visorReflect = 0x87ceeb;     // Visor reflection
    const bootColor = 0x2c2c2c;       // Dark gray boots
    const gloveColor = 0xffffff;       // White gloves
    const tubeColor = 0xff4500;        // Orange life support tubes

    // Main spacesuit body
    player.beginFill(suitColor);
    player.drawRect(-10, -5, 20, 22);
    player.endFill();

    // Body shadow/depth
    player.beginFill(suitShadow);
    player.drawRect(-10, 15, 20, 2);
    player.endFill();

    // Chest control panel
    player.beginFill(suitAccent);
    player.drawRect(-6, -2, 12, 8);
    player.endFill();

    // Control panel details
    player.beginFill(0x32cd32);  // Green lights
    player.drawRect(-4, 0, 2, 1);
    player.drawRect(2, 0, 2, 1);
    player.endFill();

    player.beginFill(0xff0000);  // Red warning light
    player.drawRect(-1, 2, 2, 1);
    player.endFill();

    player.beginFill(0x000000);  // Black buttons
    player.drawRect(-4, 4, 1, 1);
    player.drawRect(-2, 4, 1, 1);
    player.drawRect(1, 4, 1, 1);
    player.drawRect(3, 4, 1, 1);
    player.endFill();

     // Helmet (oval shape - outer shell)
    player.beginFill(helmetColor);
    player.drawEllipse(0, -14, 8, 10);
    player.endFill();

    // Helmet shadow/depth (oval)
    player.beginFill(helmetShadow);
    player.drawEllipse(0, -12, 7, 2);
    player.endFill();


    // Visor (main dark area)
    player.beginFill(visorColor);
    player.drawEllipse(0, -14, 6, 8);
    player.endFill();

    // Visor reflection effect
    player.beginFill(visorReflect);
    player.drawRect(-5, -19, 4, 3);
    player.endFill();

    // Visor secondary reflection
    player.beginFill(0xffffff);
    player.drawRect(-4, -18, 2, 1);
    player.endFill();

    // Helmet antenna
    player.beginFill(0x696969);
    player.drawRect(-1, -23, 2, 1);
    player.endFill();

    // Helmet light
    player.beginFill(0xffff00);
    player.drawRect(-2, -22, 4, 1);
    player.endFill();

    // Life support tubes connecting helmet to body
    player.beginFill(tubeColor);
    player.drawRect(-7, -8, 2, 6);
    player.drawRect(5, -8, 2, 6);
    player.endFill();

    // Arms (separate for animation) - bulky spacesuit arms
    armLeft.beginFill(suitColor);
    armLeft.drawRect(-12, -2, 4, 14);
    armLeft.endFill();

    // Left arm shadow
    armLeft.beginFill(suitShadow);
    armLeft.drawRect(-12, 10, 4, 2);
    armLeft.endFill();

    // Left arm joint
    armLeft.beginFill(suitAccent);
    armLeft.drawRect(-12, 3, 4, 2);
    armLeft.endFill();

    // Left glove
    armLeft.beginFill(gloveColor);
    armLeft.drawRect(-13, 12, 5, 4);
    armLeft.endFill();

    armRight.beginFill(suitColor);
    armRight.drawRect(8, -2, 4, 14);
    armRight.endFill();

    // Right arm shadow
    armRight.beginFill(suitShadow);
    armRight.drawRect(8, 10, 4, 2);
    armRight.endFill();

    // Right arm joint
    armRight.beginFill(suitAccent);
    armRight.drawRect(8, 3, 4, 2);
    armRight.endFill();

    // Right glove
    armRight.beginFill(gloveColor);
    armRight.drawRect(8, 12, 5, 4);
    armRight.endFill();

    player.addChild(armLeft);
    player.addChild(armRight);

    // Legs - bulky spacesuit legs
    legLeft.beginFill(suitColor);
    legLeft.drawRect(-7, 17, 6, 14);
    legLeft.endFill();

    // Left leg shadow
    legLeft.beginFill(suitShadow);
    legLeft.drawRect(-7, 29, 6, 2);
    legLeft.endFill();

    // Left leg joint
    legLeft.beginFill(suitAccent);
    legLeft.drawRect(-7, 22, 6, 2);
    legLeft.endFill();

    legRight.beginFill(suitColor);
    legRight.drawRect(1, 17, 6, 14);
    legRight.endFill();

    // Right leg shadow
    legRight.beginFill(suitShadow);
    legRight.drawRect(1, 29, 6, 2);
    legRight.endFill();

    // Right leg joint
    legRight.beginFill(suitAccent);
    legRight.drawRect(1, 22, 6, 2);
    legRight.endFill();

    player.addChild(legLeft);
    player.addChild(legRight);

    // Space boots
    const bootLeft = new Graphics();
    bootLeft.beginFill(bootColor);
    bootLeft.drawRect(-8, 31, 8, 5);
    bootLeft.endFill();

    // Boot treads
    bootLeft.beginFill(0x000000);
    bootLeft.drawRect(-8, 35, 8, 1);
    bootLeft.endFill();

    // Boot highlight
    bootLeft.beginFill(0x808080);
    bootLeft.drawRect(-8, 31, 8, 1);
    bootLeft.endFill();

    const bootRight = new Graphics();
    bootRight.beginFill(bootColor);
    bootRight.drawRect(0, 31, 8, 5);
    bootRight.endFill();

    // Boot treads
    bootRight.beginFill(0x000000);
    bootRight.drawRect(0, 35, 8, 1);
    bootRight.endFill();

    // Boot highlight
    bootRight.beginFill(0x808080);
    bootRight.drawRect(0, 31, 8, 1);
    bootRight.endFill();

    player.addChild(bootLeft);
    player.addChild(bootRight);

    // Utility belt with space tools
    player.beginFill(0x2f4f4f);
    player.drawRect(-10, 15, 20, 3);
    player.endFill();

    // Belt pouches
    player.beginFill(0x1c1c1c);
    player.drawRect(-8, 16, 3, 2);
    player.drawRect(-2, 16, 3, 2);
    player.drawRect(3, 16, 3, 2);
    player.endFill();

    // Backpack life support system
    player.beginFill(0x4682b4);
    player.drawRect(-6, -3, 12, 6);
    player.endFill();

    // Backpack details
    player.beginFill(0x000000);
    player.drawRect(-5, -2, 2, 1);
    player.drawRect(-1, -2, 2, 1);
    player.drawRect(3, -2, 2, 1);
    player.endFill();

    let tickerFn = null;
    // Name tag with space theme
    const nameTag = new Text({
      text: playerName,
      style: new TextStyle({
        fontSize: 12,
        fill: 0x00ffff,  // Cyan color for space theme
        fontFamily: "Arial",
        stroke: { color: 0x000080, width: 2 },
        dropShadow: {
          color: 0x000080,
          blur: 3,
          angle: Math.PI / 4,
          distance: 2,
        },
      }),
    });
    nameTag.anchor.set(0.5);
    nameTag.y = -40;
    player.addChild(nameTag);

    // Initial position
    player.x = 400;
    player.y = 300;

    // Add to scene
    gameState.camera.addChild(player);
    gameState.player = player;
    player.zIndex = 100;

    // Enhanced animation state (slower for bulky suit)
    let walking = false;
    let walkFrame = 0;
    let direction = "down";
    const walkSpeed = 0.2;  // Slower for heavy spacesuit
    const legSwingAmount = 2;  // Less swing for bulky suit
    const armSwingAmount = 1.5;  // Reduced arm swing
    const bodyBobAmount = 0.5;  // Subtle bobbing

    tickerFn = () => {
      if (!player || !player.parent) return;
      if (walking) {
        walkFrame += walkSpeed;

        const legAngle = Math.sin(walkFrame) * legSwingAmount;
        const armAngle = Math.sin(walkFrame) * armSwingAmount;

        // Leg animation (more constrained for spacesuit)
        legLeft.y = 0 + legAngle;
        legRight.y = 0 - legAngle;

        // Arm animation (less dramatic for bulky suit)
        armLeft.y = 0 - armAngle * 0.5;
        armRight.y = 0 + armAngle * 0.5;

        // Minimal arm rotation for bulky suit
        armLeft.rotation = -armAngle * 0.05;
        armRight.rotation = armAngle * 0.05;

        // Subtle body bobbing
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== bootLeft &&
            child !== bootRight
          ) {
            child.y += Math.sin(walkFrame * 2) * 0.2;
          }
        });

        // Directional facing
        if (direction === "left") {
          player.scale.x = -1;
        } else if (direction === "right") {
          player.scale.x = 1;
        }
        nameTag.scale.x = 1 / player.scale.x;
      } else {
        // Return to idle position smoothly
        legLeft.y += (0 - legLeft.y) * 0.1;
        legRight.y += (0 - legRight.y) * 0.1;
        armLeft.y += (0 - armLeft.y) * 0.1;
        armRight.y += (0 - armRight.y) * 0.1;
        armLeft.rotation += (0 - armLeft.rotation) * 0.1;
        armRight.rotation += (0 - armRight.rotation) * 0.1;

        // Reset body parts to original positions
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== bootLeft &&
            child !== bootRight &&
            child !== nameTag
          ) {
            child.y += Math.sin(walkFrame * 2) * 0.2;
          }
        });
      }
    };

    // Ticker-based animation
    Ticker.shared.add(tickerFn);
    player._tickerFn = tickerFn;

    // Movement API (slightly slower for heavy suit)
    player.walk = (dir) => {
      walking = true;
      direction = dir;
      const speed = 2;  // Slower movement for spacesuit

      if (dir === "left") player.x -= speed;
      if (dir === "right") player.x += speed;
      if (dir === "up") player.y -= speed;
      if (dir === "down") player.y += speed;
    };

    player.stop = () => {
      walking = false;
    };

    // Store original positions for smooth transitions
    player.children.forEach((child) => {
      child.originalY = child.y;
    });

    return player;
};

const createOtherPlayer = (name, position) => {
    const container = new Container();

    // Create main body graphics
    const body = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Different space suit color palette for distinction
    const suitColor = 0xf0f0f0;        // Slightly whiter suit
    const suitShadow = 0xd0d0d0;       // Lighter shadow
    const suitAccent = 0xe74c3c;       // Red accents (vs blue in main player)
    const helmetColor = 0xffe4e1;      // Light pink helmet tint
    const helmetShadow = 0xddd0d0;     // Pinkish helmet shadow
    const visorColor = 0x2c2c2c;       // Slightly lighter visor
    const visorReflect = 0xffa07a;     // Light salmon reflection
    const bootColor = 0x8b4513;       // Brown boots (vs gray in main)
    const gloveColor = 0xfff8dc;       // Cream gloves
    const tubeColor = 0x32cd32;        // Green life support tubes (vs orange)

    // Main spacesuit body
    body.beginFill(suitColor);
    body.drawRect(-10, -5, 20, 22);
    body.endFill();

    // Body shadow/depth
    body.beginFill(suitShadow);
    body.drawRect(-10, 15, 20, 2);
    body.endFill();

    // Chest control panel (red theme)
    body.beginFill(suitAccent);
    body.drawRect(-6, -2, 12, 8);
    body.endFill();

    // Control panel details (different layout)
    body.beginFill(0xffff00);  // Yellow lights (vs green)
    body.drawRect(-4, 1, 2, 1);
    body.drawRect(2, 1, 2, 1);
    body.endFill();

    body.beginFill(0x00ff00);  // Green status light (vs red warning)
    body.drawRect(-1, 0, 2, 1);
    body.endFill();

    body.beginFill(0x000000);  // Black buttons (different arrangement)
    body.drawRect(-3, 4, 1, 1);
    body.drawRect(0, 4, 1, 1);
    body.drawRect(2, 4, 1, 1);
    body.endFill();

    // Additional control panel stripe
    body.beginFill(0xffffff);
    body.drawRect(-6, 3, 12, 1);
    body.endFill();

    // Helmet (oval shape - outer shell)
    body.beginFill(helmetColor);
    body.drawEllipse(0, -14, 8, 10);
    body.endFill();

    // Helmet shadow/depth (oval)
    body.beginFill(helmetShadow);
    body.drawEllipse(0, -12, 7, 2);
    body.endFill();

    // Visor (main dark area)
    body.beginFill(visorColor);
    body.drawEllipse(0, -14, 6, 8);
    body.endFill();

    // Visor reflection effect (different position)
    body.beginFill(visorReflect);
    body.drawRect(-4, -18, 3, 2);
    body.endFill();

    // Visor secondary reflection
    body.beginFill(0xffffff);
    body.drawRect(-3, -17, 1, 1);
    body.endFill();

    // Helmet antenna (different style)
    body.beginFill(0x696969);
    body.drawRect(-2, -23, 4, 1);
    body.endFill();

    // Helmet light (different color)
    body.beginFill(0xff6347);  // Tomato red light
    body.drawRect(-2, -22, 4, 1);
    body.endFill();

    // Life support tubes connecting helmet to body (green)
    body.beginFill(tubeColor);
    body.drawRect(-7, -8, 2, 6);
    body.drawRect(5, -8, 2, 6);
    body.endFill();

    // Arms (separate for animation) - bulky spacesuit arms
    armLeft.beginFill(suitColor);
    armLeft.drawRect(-12, -2, 4, 14);
    armLeft.endFill();

    // Left arm shadow
    armLeft.beginFill(suitShadow);
    armLeft.drawRect(-12, 10, 4, 2);
    armLeft.endFill();

    // Left arm joint (red accent)
    armLeft.beginFill(suitAccent);
    armLeft.drawRect(-12, 3, 4, 2);
    armLeft.endFill();

    // Left glove
    armLeft.beginFill(gloveColor);
    armLeft.drawRect(-13, 12, 5, 4);
    armLeft.endFill();

    // Left arm patch/badge
    armLeft.beginFill(0xffd700);
    armLeft.drawRect(-11, 1, 2, 1);
    armLeft.endFill();

    armRight.beginFill(suitColor);
    armRight.drawRect(8, -2, 4, 14);
    armRight.endFill();

    // Right arm shadow
    armRight.beginFill(suitShadow);
    armRight.drawRect(8, 10, 4, 2);
    armRight.endFill();

    // Right arm joint (red accent)
    armRight.beginFill(suitAccent);
    armRight.drawRect(8, 3, 4, 2);
    armRight.endFill();

    // Right glove
    armRight.beginFill(gloveColor);
    armRight.drawRect(8, 12, 5, 4);
    armRight.endFill();

    // Right arm patch/badge
    armRight.beginFill(0xffd700);
    armRight.drawRect(9, 1, 2, 1);
    armRight.endFill();

    // Legs - bulky spacesuit legs
    legLeft.beginFill(suitColor);
    legLeft.drawRect(-7, 17, 6, 14);
    legLeft.endFill();

    // Left leg shadow
    legLeft.beginFill(suitShadow);
    legLeft.drawRect(-7, 29, 6, 2);
    legLeft.endFill();

    // Left leg joint (red accent)
    legLeft.beginFill(suitAccent);
    legLeft.drawRect(-7, 22, 6, 2);
    legLeft.endFill();

    legRight.beginFill(suitColor);
    legRight.drawRect(1, 17, 6, 14);
    legRight.endFill();

    // Right leg shadow
    legRight.beginFill(suitShadow);
    legRight.drawRect(1, 29, 6, 2);
    legRight.endFill();

    // Right leg joint (red accent)
    legRight.beginFill(suitAccent);
    legRight.drawRect(1, 22, 6, 2);
    legRight.endFill();

    // Space boots (brown instead of gray)
    const bootLeft = new Graphics();
    bootLeft.beginFill(bootColor);
    bootLeft.drawRect(-8, 31, 8, 5);
    bootLeft.endFill();

    // Boot treads
    bootLeft.beginFill(0x000000);
    bootLeft.drawRect(-8, 35, 8, 1);
    bootLeft.endFill();

    // Boot highlight
    bootLeft.beginFill(0xcd853f);
    bootLeft.drawRect(-8, 31, 8, 1);
    bootLeft.endFill();

    const bootRight = new Graphics();
    bootRight.beginFill(bootColor);
    bootRight.drawRect(0, 31, 8, 5);
    bootRight.endFill();

    // Boot treads
    bootRight.beginFill(0x000000);
    bootRight.drawRect(0, 35, 8, 1);
    bootRight.endFill();

    // Boot highlight
    bootRight.beginFill(0xcd853f);
    bootRight.drawRect(0, 31, 8, 1);
    bootRight.endFill();

    // Utility belt with space tools (different color)
    body.beginFill(0x8b0000);  // Dark red belt
    body.drawRect(-10, 15, 20, 3);
    body.endFill();

    // Belt pouches (different arrangement)
    body.beginFill(0x2c2c2c);
    body.drawRect(-7, 16, 2, 2);
    body.drawRect(-3, 16, 2, 2);
    body.drawRect(1, 16, 2, 2);
    body.drawRect(5, 16, 2, 2);
    body.endFill();

    // Backpack life support system (different color)
    body.beginFill(0x228b22);  // Forest green
    body.drawRect(-6, -3, 12, 6);
    body.endFill();

    // Backpack details (different pattern)
    body.beginFill(0x000000);
    body.drawRect(-4, -2, 1, 1);
    body.drawRect(-2, -1, 1, 1);
    body.drawRect(0, -2, 1, 1);
    body.drawRect(2, -1, 1, 1);
    body.drawRect(4, -2, 1, 1);
    body.endFill();

    // Name tag with different color scheme
    const nameTag = new Text({
      text: name,
      style: new TextStyle({
        fontSize: 12,
        fill: 0xff6347,  // Tomato red instead of cyan
        fontFamily: "Arial",
        stroke: { color: 0x8b0000, width: 2 },
        dropShadow: {
          color: 0x8b0000,
          blur: 3,
          angle: Math.PI / 4,
          distance: 2,
        },
      }),
    });
    nameTag.anchor.set(0.5);
    nameTag.y = -40;

    // Add all parts to container
    container.addChild(body);
    container.addChild(armLeft);
    container.addChild(armRight);
    container.addChild(legLeft);
    container.addChild(legRight);
    container.addChild(bootLeft);
    container.addChild(bootRight);
    container.addChild(nameTag);

    // Position the container
    container.x = position.x;
    container.y = position.y;

    // Animation state (matching main player but slightly different)
    let walking = false;
    let walkFrame = 0;
    let direction = "down";
    let stopTimeout = null;
    const walkSpeed = 0.22;  // Slightly different speed
    const legSwingAmount = 1.8;  // Slightly different swing
    const armSwingAmount = 1.3;
    const bodyBobAmount = 0.4;

    // Store original positions for smooth transitions
    const originalPositions = {
      armLeft: { y: armLeft.y, rotation: armLeft.rotation },
      armRight: { y: armRight.y, rotation: armRight.rotation },
      legLeft: { y: legLeft.y },
      legRight: { y: legRight.y },
      body: { y: body.y },
    };

    // Animation ticker function
    let tickerFn = null;

    tickerFn = () => {
      if (!container || !container.parent) return;

      if (walking) {
        walkFrame += walkSpeed;

        const legAngle = Math.sin(walkFrame) * legSwingAmount;
        const armAngle = Math.sin(walkFrame) * armSwingAmount;

        // Leg animation (more constrained for spacesuit)
        legLeft.y = originalPositions.legLeft.y + legAngle;
        legRight.y = originalPositions.legRight.y - legAngle;

        // Arm animation (less dramatic for bulky suit)
        armLeft.y = originalPositions.armLeft.y - armAngle * 0.5;
        armRight.y = originalPositions.armRight.y + armAngle * 0.5;

        // Minimal arm rotation for bulky suit
        armLeft.rotation = -armAngle * 0.05;
        armRight.rotation = armAngle * 0.05;

        // Subtle body bobbing
        body.y = originalPositions.body.y + Math.sin(walkFrame * 2) * 0.2;

        // Directional facing
        if (direction === "left") {
          container.scale.x = -1;
        } else if (direction === "right") {
          container.scale.x = 1;
        }
        nameTag.scale.x = 1 / container.scale.x;
      } else {
        // Return to idle position smoothly
        legLeft.y += (originalPositions.legLeft.y - legLeft.y) * 0.1;
        legRight.y += (originalPositions.legRight.y - legRight.y) * 0.1;
        armLeft.y += (originalPositions.armLeft.y - armLeft.y) * 0.1;
        armRight.y += (originalPositions.armRight.y - armRight.y) * 0.1;
        armLeft.rotation += (originalPositions.armLeft.rotation - armLeft.rotation) * 0.1;
        armRight.rotation += (originalPositions.armRight.rotation - armRight.rotation) * 0.1;
        body.y += (originalPositions.body.y - body.y) * 0.1;
      }
    };

    // Add ticker for animations
    Ticker.shared.add(tickerFn);
    container._tickerFn = tickerFn;

    // Movement API
    container.walk = (dir) => {
      walking = true;
      direction = dir;

      // Clear any existing stop timeout
      if (stopTimeout) {
        clearTimeout(stopTimeout);
        stopTimeout = null;
      }
    };

    container.stop = () => {
      walking = false;

      // Clear any existing stop timeout
      if (stopTimeout) {
        clearTimeout(stopTimeout);
        stopTimeout = null;
      }
    };

    // Update position method
    container.updatePosition = (newPosition, isMoving, newDirection) => {
      // Update position
      container.x = newPosition.x;
      container.y = newPosition.y;

      if (isMoving) {
        container.walk(newDirection);
      } else {
        container.stop();
      }

      // Backup: Auto-stop after 200ms of no updates
      if (stopTimeout) {
        clearTimeout(stopTimeout);
      }

      stopTimeout = setTimeout(() => {
        container.stop();
      }, 200);
    };

    // Cleanup function
    container.destroy = () => {
      if (tickerFn) {
        Ticker.shared.remove(tickerFn);
      }
      if (stopTimeout) {
        clearTimeout(stopTimeout);
      }
      container.removeChildren();
    };

    return container;
};

const createOtherMalePlayer = (name, position) => {
    const container = new Container();

    // Space station crew color palette (same as createMalePlayer)
    const skinColor = 0xd4a574;
    const skinShadow = 0xc19660;
    const suitColor = 0x2c3e50; // Dark blue space suit
    const suitShadow = 0x1a252f;
    const suitAccent = 0x3498db; // Bright blue accents
    const hairColor = 0x4a4a4a; // Gray/silver hair
    const bootColor = 0x1a1a1a; // Black space boots
    const helmetRim = 0x5d6d7e; // Metallic helmet rim

    // Create main body graphics
    const body = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Player body (space suit torso)
    body.beginFill(suitColor);
    body.drawRect(-9, -5, 18, 22);
    body.endFill();

    // Suit shadow
    body.beginFill(suitShadow);
    body.drawRect(-9, 15, 18, 2);
    body.endFill();

    // Chest control panel
    body.beginFill(suitAccent);
    body.drawRect(-7, 2, 14, 8);
    body.endFill();

    // Control panel buttons
    body.beginFill(0xe74c3c); // Red button
    body.drawRect(-5, 4, 2, 2);
    body.endFill();

    body.beginFill(0x27ae60); // Green button
    body.drawRect(-1, 4, 2, 2);
    body.endFill();

    body.beginFill(0xf39c12); // Orange button
    body.drawRect(3, 4, 2, 2);
    body.endFill();

    // Status display screen
    body.beginFill(0x2ecc71);
    body.drawRect(-6, 7, 12, 2);
    body.endFill();

    // Suit seams/panels
    body.beginFill(suitAccent);
    body.drawRect(-9, -2, 18, 1);
    body.drawRect(-9, 12, 18, 1);
    body.endFill();

    // Utility belt
    body.beginFill(0x34495e);
    body.drawRect(-8, 14, 16, 3);
    body.endFill();

    // Belt pouches
    body.beginFill(0x7f8c8d);
    body.drawRect(-6, 15, 2, 2);
    body.drawRect(-1, 15, 2, 2);
    body.drawRect(4, 15, 2, 2);
    body.endFill();

    // Head
    body.beginFill(skinColor);
    body.drawRect(-6, -18, 12, 12);
    body.endFill();

    // Face shadow
    body.beginFill(skinShadow);
    body.drawRect(-6, -8, 12, 2);
    body.endFill();

    // Short professional hair
    body.beginFill(hairColor);
    body.drawRect(-7, -19, 14, 6);
    body.endFill();

    // Hair highlights
    body.beginFill(0x6a6a6a);
    body.drawRect(-5, -18, 2, 3);
    body.drawRect(1, -18, 2, 3);
    body.drawRect(4, -17, 2, 2);
    body.endFill();

    // Eyes with focused expression
    body.beginFill(0xffffff);
    body.drawRect(-4, -15, 2, 2);
    body.drawRect(2, -15, 2, 2);
    body.endFill();

    // Eye pupils
    body.beginFill(0x000000);
    body.drawRect(-3.5, -14.5, 1, 1);
    body.drawRect(2.5, -14.5, 1, 1);
    body.endFill();

    // Nose
    body.beginFill(skinShadow);
    body.drawRect(-0.5, -12, 1, 1);
    body.endFill();

    // Determined expression
    body.beginFill(skinShadow);
    body.drawRect(-1, -10, 3, 1);
    body.endFill();

    // Communication headset
    body.beginFill(0x34495e);
    body.drawRect(-7, -16, 2, 1);
    body.drawRect(5, -16, 2, 1);
    body.endFill();

    // Headset mic
    body.beginFill(0x7f8c8d);
    body.drawRect(-8, -15, 1, 2);
    body.endFill();

    // Rank insignia on shoulder
    body.beginFill(0xffd700);
    body.drawRect(-8, -3, 3, 1);
    body.drawRect(-8, -1, 3, 1);
    body.endFill();

    // Arms in space suit sleeves
    armLeft.beginFill(suitColor);
    armLeft.drawRect(-11, -2, 4, 14);
    armLeft.endFill();

    // Sleeve panels
    armLeft.beginFill(suitAccent);
    armLeft.drawRect(-11, 2, 4, 1);
    armLeft.drawRect(-11, 8, 4, 1);
    armLeft.endFill();

    // Glove cuffs
    armLeft.beginFill(suitShadow);
    armLeft.drawRect(-11, 10, 4, 2);
    armLeft.endFill();

    // Space gloves
    armLeft.beginFill(0x2c3e50);
    armLeft.drawRect(-10, 12, 2, 3);
    armLeft.endFill();

    // Glove details
    armLeft.beginFill(suitAccent);
    armLeft.drawRect(-10, 12, 2, 1);
    armLeft.endFill();

    armRight.beginFill(suitColor);
    armRight.drawRect(7, -2, 4, 14);
    armRight.endFill();

    armRight.beginFill(suitAccent);
    armRight.drawRect(7, 2, 4, 1);
    armRight.drawRect(7, 8, 4, 1);
    armRight.endFill();

    armRight.beginFill(suitShadow);
    armRight.drawRect(7, 10, 4, 2);
    armRight.endFill();

    armRight.beginFill(0x2c3e50);
    armRight.drawRect(8, 12, 2, 3);
    armRight.endFill();

    armRight.beginFill(suitAccent);
    armRight.drawRect(8, 12, 2, 1);
    armRight.endFill();

    // Space suit pants
    legLeft.beginFill(suitColor);
    legLeft.drawRect(-7, 17, 6, 10);
    legLeft.endFill();

    // Pants shadow
    legLeft.beginFill(suitShadow);
    legLeft.drawRect(-7, 25, 6, 2);
    legLeft.endFill();

    // Leg panel seams
    legLeft.beginFill(suitAccent);
    legLeft.drawRect(-7, 20, 6, 1);
    legLeft.endFill();

    // Knee protection
    legLeft.beginFill(0x34495e);
    legLeft.drawRect(-6, 22, 4, 2);
    legLeft.endFill();

    legRight.beginFill(suitColor);
    legRight.drawRect(1, 17, 6, 10);
    legRight.endFill();

    legRight.beginFill(suitShadow);
    legRight.drawRect(1, 25, 6, 2);
    legRight.endFill();

    legRight.beginFill(suitAccent);
    legRight.drawRect(1, 20, 6, 1);
    legRight.endFill();

    legRight.beginFill(0x34495e);
    legRight.drawRect(2, 22, 4, 2);
    legRight.endFill();

    // Space boots
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(bootColor);
    shoeLeft.drawRect(-8, 27, 7, 4);
    shoeLeft.endFill();

    // Boot sole with tread
    shoeLeft.beginFill(0x34495e);
    shoeLeft.drawRect(-8, 30, 7, 1);
    shoeLeft.endFill();

    // Boot details/buckles
    shoeLeft.beginFill(0x7f8c8d);
    shoeLeft.drawRect(-7, 28, 5, 1);
    shoeLeft.endFill();

    // Magnetic boot indicators
    shoeLeft.beginFill(0xe74c3c);
    shoeLeft.drawRect(-3, 29, 1, 1);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(bootColor);
    shoeRight.drawRect(1, 27, 7, 4);
    shoeRight.endFill();

    shoeRight.beginFill(0x34495e);
    shoeRight.drawRect(1, 30, 7, 1);
    shoeRight.endFill();

    shoeRight.beginFill(0x7f8c8d);
    shoeRight.drawRect(2, 28, 5, 1);
    shoeRight.endFill();

    shoeRight.beginFill(0xe74c3c);
    shoeRight.drawRect(4, 29, 1, 1);
    shoeRight.endFill();

    // Name tag with space theme
    const nameTag = new Text({
      text: name,
      style: new TextStyle({
        fontSize: 12,
        fill: 0x3498db,
        fontFamily: "Arial",
        stroke: { color: 0x000000, width: 2 },
        dropShadow: {
          color: 0x000000,
          blur: 2,
          angle: Math.PI / 4,
          distance: 2,
        },
      }),
    });
    nameTag.anchor.set(0.5);
    nameTag.y = -35;

    // Add all parts to container
    container.addChild(body);
    container.addChild(armLeft);
    container.addChild(armRight);
    container.addChild(legLeft);
    container.addChild(legRight);
    container.addChild(shoeLeft);
    container.addChild(shoeRight);
    container.addChild(nameTag);
    container.nameTag = nameTag;
    container.nameText = nameTag; // For compatibility
    container.playerName = name;

    // Position the container
    container.x = position.x;
    container.y = position.y;

    // Animation state
    let walking = false;
    let walkFrame = 0;
    let direction = "down";
    let stopTimeout = null;
    const walkSpeed = 0.3;
    const legSwingAmount = 3; // Slightly reduced for heavier space suit
    const armSwingAmount = 2.5; // Reduced for bulkier arms
    const bodyBobAmount = 0.8; // Less bouncy for weighted suit

    // Store original positions for smooth transitions
    const originalPositions = {
      armLeft: { y: armLeft.y, rotation: armLeft.rotation },
      armRight: { y: armRight.y, rotation: armRight.rotation },
      legLeft: { y: legLeft.y },
      legRight: { y: legRight.y },
      body: { y: body.y },
    };

    // Animation ticker function
    let tickerFn = null;

    tickerFn = () => {
      if (!container || !container.parent) return; // prevent stale access

      if (walking) {
        walkFrame += walkSpeed;

        const legAngle = Math.sin(walkFrame) * legSwingAmount;
        const armAngle = Math.sin(walkFrame) * armSwingAmount;
        const bodyBob = Math.abs(Math.sin(walkFrame * 2)) * bodyBobAmount;

        // Leg animation (opposite swing)
        legLeft.y = originalPositions.legLeft.y + legAngle;
        legRight.y = originalPositions.legRight.y - legAngle;

        // Arm animation (opposite to legs for natural walking)
        armLeft.y = originalPositions.armLeft.y - armAngle * 0.7;
        armRight.y = originalPositions.armRight.y + armAngle * 0.7;

        // Slight arm rotation - reduced for bulkier suit
        armLeft.rotation = -armAngle * 0.08;
        armRight.rotation = armAngle * 0.08;

        // Body bobbing - reduced for weighted suit
        const bodyBobOffset = Math.sin(walkFrame * 2) * 0.25;
        body.y = originalPositions.body.y + bodyBobOffset;

        // Directional facing (flip sprite)
        if (direction === "left") {
          container.scale.x = -1;
        } else if (direction === "right") {
          container.scale.x = 1;
        }
        nameTag.scale.x = 1 / container.scale.x;
      } else {
        // Return to idle position smoothly
        legLeft.y += (originalPositions.legLeft.y - legLeft.y) * 0.1;
        legRight.y += (originalPositions.legRight.y - legRight.y) * 0.1;
        armLeft.y += (originalPositions.armLeft.y - armLeft.y) * 0.1;
        armRight.y += (originalPositions.armRight.y - armRight.y) * 0.1;
        armLeft.rotation +=
          (originalPositions.armLeft.rotation - armLeft.rotation) * 0.1;
        armRight.rotation +=
          (originalPositions.armRight.rotation - armRight.rotation) * 0.1;
        body.y += (originalPositions.body.y - body.y) * 0.1;
      }
    };

    // Add ticker for animations
    Ticker.shared.add(tickerFn);
    container._tickerFn = tickerFn;

    // Enhanced movement API
    container.walk = (dir) => {
      walking = true;
      direction = dir;

      // Clear any existing stop timeout
      if (stopTimeout) {
        clearTimeout(stopTimeout);
        stopTimeout = null;
      }
    };

    container.stop = () => {
      walking = false;

      // Clear any existing stop timeout
      if (stopTimeout) {
        clearTimeout(stopTimeout);
        stopTimeout = null;
      }
    };

    // Update position method
    container.updatePosition = (newPosition, isMoving, newDirection) => {
      // Update position
      container.x = newPosition.x;
      container.y = newPosition.y;

      if (isMoving) {
        container.walk(newDirection);
      } else {
        container.stop();
      }

      // Backup: Auto-stop after 200ms of no updates
      if (stopTimeout) {
        clearTimeout(stopTimeout);
      }

      stopTimeout = setTimeout(() => {
        container.stop();
      }, 200);
    };

    // Cleanup function
    container.destroy = () => {
      if (tickerFn) {
        Ticker.shared.remove(tickerFn);
      }
      container.removeChildren();
    };

    return container;
  };

 const createOtherFemalePlayer = (name, position) => {
  const container = new Container();

  // Space station color palette (same as createSpaceFemalePlayer)
  const skinColor = 0xf4c2a1;
  const skinShadow = 0xe6b596;
  const suitPrimary = 0x2c3e50; // Dark blue-gray suit
  const suitSecondary = 0x34495e; // Lighter blue-gray
  const suitAccent = 0x3498db; // Bright blue accents
  const suitHighlight = 0x5dade2; // Light blue highlights
  const helmetColor = 0x85929e; // Metallic helmet
  const helmetReflection = 0xaeb6bf;
  const visorColor = 0x1a1a2e; // Dark visor with slight blue tint
  const visorReflection = 0x16213e;
  const hairColor = 0x8b4513; // Auburn/brown hair
  const hairHighlight = 0xa0522d;
  const bootColor = 0x2c3e50; // Dark space boots
  const bootAccent = 0x3498db; // Blue boot details
  const glowColor = 0x00ffff; // Cyan glow for tech elements

  // Create main body graphics
  const body = new Graphics();
  const legLeft = new Graphics();
  const legRight = new Graphics();
  const armLeft = new Graphics();
  const armRight = new Graphics();

  // Main spacesuit body
  body.beginFill(suitPrimary);
  body.drawRect(-8, -5, 16, 18);
  body.endFill();

  // Suit paneling and details
  body.beginFill(suitSecondary);
  body.drawRect(-7, -4, 14, 2);
  body.drawRect(-7, 8, 14, 2);
  body.endFill();

  // Chest control panel
  body.beginFill(suitSecondary);
  body.drawRect(-5, -2, 10, 8);
  body.endFill();

  // Control panel details
  body.beginFill(suitAccent);
  body.drawRect(-4, -1, 3, 1);
  body.drawRect(-4, 1, 3, 1);
  body.drawRect(-4, 3, 3, 1);
  body.endFill();

  // Status lights
  body.beginFill(glowColor);
  body.drawRect(2, -1, 1, 1);
  body.drawRect(2, 1, 1, 1);
  body.endFill();

  // Emergency button
  body.beginFill(0xff4757);
  body.drawRect(2, 3, 1, 1);
  body.endFill();

  // Suit seams and reinforcement
  body.beginFill(suitHighlight);
  body.drawRect(-8, -5, 1, 18);
  body.drawRect(7, -5, 1, 18);
  body.drawRect(-8, 6, 16, 1);
  body.endFill();

  // Head with space helmet
  body.beginFill(helmetColor);
  body.drawRect(-7, -19, 14, 13);
  body.endFill();

  // Helmet reflections
  body.beginFill(helmetReflection);
  body.drawRect(-6, -18, 3, 10);
  body.drawRect(3, -18, 3, 10);
  body.endFill();

  // Visor
  body.beginFill(visorColor);
  body.drawRect(-6, -17, 12, 9);
  body.endFill();

  // Visor reflection
  body.beginFill(visorReflection);
  body.drawRect(-5, -16, 4, 6);
  body.endFill();

  // Face visible through visor
  body.beginFill(skinColor);
  body.drawRect(-4, -15, 8, 6);
  body.endFill();

  // Face shadow
  body.beginFill(skinShadow);
  body.drawRect(-4, -11, 8, 2);
  body.endFill();

  // Hair visible in helmet (shorter, practical style)
  body.beginFill(hairColor);
  body.drawRect(-3, -16, 6, 4);
  body.endFill();

  // Hair highlights
  body.beginFill(hairHighlight);
  body.drawRect(-2, -15, 2, 3);
  body.endFill();

  // Eyes
  body.beginFill(0xffffff);
  body.drawRect(-3, -14, 1, 1);
  body.drawRect(2, -14, 1, 1);
  body.endFill();

  // Eye pupils
  body.beginFill(0x2980b9);
  body.drawRect(-2.5, -13.5, 0.5, 0.5);
  body.drawRect(2.5, -13.5, 0.5, 0.5);
  body.endFill();

  // Nose
  body.beginFill(skinShadow);
  body.drawRect(-0.5, -12, 1, 1);
  body.endFill();

  // Lips
  body.beginFill(0xc0392b);
  body.drawRect(-1, -10, 2, 1);
  body.endFill();

  // Helmet communication device
  body.beginFill(suitAccent);
  body.drawRect(-8, -12, 2, 3);
  body.endFill();

  // Comm device details
  body.beginFill(glowColor);
  body.drawRect(-7, -11, 1, 1);
  body.endFill();

  // Lower body suit
  body.beginFill(suitPrimary);
  body.drawRect(-7, 13, 14, 10);
  body.endFill();

  // Lower body paneling
  body.beginFill(suitSecondary);
  body.drawRect(-6, 14, 12, 2);
  body.drawRect(-6, 19, 12, 2);
  body.endFill();

  // Utility belt
  body.beginFill(suitAccent);
  body.drawRect(-7, 16, 14, 2);
  body.endFill();

  // Belt pouches
  body.beginFill(suitSecondary);
  body.drawRect(-6, 16, 2, 2);
  body.drawRect(-2, 16, 2, 2);
  body.drawRect(2, 16, 2, 2);
  body.endFill();

  // Left arm with suit details
  armLeft.beginFill(suitPrimary);
  armLeft.drawRect(-10, -2, 3, 12);
  armLeft.endFill();

  // Arm joint/shoulder pad
  armLeft.beginFill(suitSecondary);
  armLeft.drawRect(-10, -2, 3, 3);
  armLeft.endFill();

  // Arm seams
  armLeft.beginFill(suitHighlight);
  armLeft.drawRect(-10, 2, 3, 1);
  armLeft.drawRect(-10, 6, 3, 1);
  armLeft.endFill();

  // Space glove
  armLeft.beginFill(helmetColor);
  armLeft.drawRect(-9, 10, 2, 3);
  armLeft.endFill();

  // Glove details
  armLeft.beginFill(suitAccent);
  armLeft.drawRect(-9, 10, 2, 1);
  armLeft.endFill();

  // Right arm (mirror of left)
  armRight.beginFill(suitPrimary);
  armRight.drawRect(7, -2, 3, 12);
  armRight.endFill();

  armRight.beginFill(suitSecondary);
  armRight.drawRect(7, -2, 3, 3);
  armRight.endFill();

  armRight.beginFill(suitHighlight);
  armRight.drawRect(7, 2, 3, 1);
  armRight.drawRect(7, 6, 3, 1);
  armRight.endFill();

  armRight.beginFill(helmetColor);
  armRight.drawRect(7, 10, 2, 3);
  armRight.endFill();

  armRight.beginFill(suitAccent);
  armRight.drawRect(7, 10, 2, 1);
  armRight.endFill();

  // Legs with suit details
  legLeft.beginFill(suitPrimary);
  legLeft.drawRect(-5, 23, 4, 6);
  legLeft.endFill();

  // Leg seams
  legLeft.beginFill(suitHighlight);
  legLeft.drawRect(-5, 25, 4, 1);
  legLeft.endFill();

  legRight.beginFill(suitPrimary);
  legRight.drawRect(1, 23, 4, 6);
  legRight.endFill();

  legRight.beginFill(suitHighlight);
  legRight.drawRect(1, 25, 4, 1);
  legRight.endFill();

  // Space boots
  const bootLeft = new Graphics();
  bootLeft.beginFill(bootColor);
  bootLeft.drawRect(-6, 29, 5, 4);
  bootLeft.endFill();

  // Boot sole (thicker for space)
  bootLeft.beginFill(0x1a1a1a);
  bootLeft.drawRect(-6, 32, 5, 2);
  bootLeft.endFill();

  // Boot details
  bootLeft.beginFill(bootAccent);
  bootLeft.drawRect(-6, 29, 5, 1);
  bootLeft.drawRect(-5, 30, 1, 2);
  bootLeft.endFill();

  // Magnetic attachment point
  bootLeft.beginFill(helmetColor);
  bootLeft.drawRect(-4, 33, 1, 1);
  bootLeft.endFill();

  const bootRight = new Graphics();
  bootRight.beginFill(bootColor);
  bootRight.drawRect(1, 29, 5, 4);
  bootRight.endFill();

  bootRight.beginFill(0x1a1a1a);
  bootRight.drawRect(1, 32, 5, 2);
  bootRight.endFill();

  bootRight.beginFill(bootAccent);
  bootRight.drawRect(1, 29, 5, 1);
  bootRight.drawRect(4, 30, 1, 2);
  bootRight.endFill();

  bootRight.beginFill(helmetColor);
  bootRight.drawRect(3, 33, 1, 1);
  bootRight.endFill();

  // Life support backpack
  const backpack = new Graphics();
  backpack.beginFill(suitSecondary);
  backpack.drawRect(-4, 2, 8, 8);
  backpack.endFill();

  // Backpack details
  backpack.beginFill(suitAccent);
  backpack.drawRect(-3, 3, 6, 1);
  backpack.drawRect(-3, 7, 6, 1);
  backpack.endFill();

  // Oxygen indicator
  backpack.beginFill(0x2ecc71);
  backpack.drawRect(2, 4, 1, 1);
  backpack.endFill();

  // Warning light
  backpack.beginFill(0xf39c12);
  backpack.drawRect(2, 6, 1, 1);
  backpack.endFill();

  // Name Tag with futuristic styling
  const nameTag = new Text({
    text: name,
    style: new TextStyle({
      fontSize: 12,
      fill: glowColor,
      fontFamily: "Arial",
      stroke: { color: 0x000000, width: 2 },
      dropShadow: {
        color: glowColor,
        blur: 3,
        angle: Math.PI / 4,
        distance: 2,
      },
    }),
  });
  nameTag.anchor.set(0.5);
  nameTag.y = -35;

  // Add all parts to container (backpack first so it's behind)
  container.addChild(backpack);
  container.addChild(body);
  container.addChild(armLeft);
  container.addChild(armRight);
  container.addChild(legLeft);
  container.addChild(legRight);
  container.addChild(bootLeft);
  container.addChild(bootRight);
  container.addChild(nameTag);

  // Store references for compatibility
  container.nameTag = nameTag;
  container.nameText = nameTag; // For compatibility
  container.playerName = name;

  // Position the container
  container.x = position.x;
  container.y = position.y;

  // Animation state
  let walking = false;
  let walkFrame = 0;
  let direction = "down";
  let stopTimeout = null;
  const walkSpeed = 0.3;
  const legSwingAmount = 3; // Slightly less swing for space suit
  const armSwingAmount = 2; // Reduced for bulky suit
  const bodyBobAmount = 0.8; // Less bobbing for weightier movement

  // Store original positions for smooth transitions
  const originalPositions = {
    armLeft: { y: armLeft.y, rotation: armLeft.rotation },
    armRight: { y: armRight.y, rotation: armRight.rotation },
    legLeft: { y: legLeft.y },
    legRight: { y: legRight.y },
    body: { y: body.y },
    backpack: { y: backpack.y },
  };

  // Animation ticker function
  let tickerFn = null;

  tickerFn = () => {
    if (!container || !container.parent) return; // prevent stale access

    if (walking) {
      walkFrame += walkSpeed;

      const legAngle = Math.sin(walkFrame) * legSwingAmount;
      const armAngle = Math.sin(walkFrame) * armSwingAmount;
      const bodyBob = Math.abs(Math.sin(walkFrame * 2)) * bodyBobAmount;

      // Leg animation (opposite swing)
      legLeft.y = originalPositions.legLeft.y + legAngle;
      legRight.y = originalPositions.legRight.y - legAngle;

      // Arm animation (opposite to legs for natural walking)
      armLeft.y = originalPositions.armLeft.y - armAngle * 0.7;
      armRight.y = originalPositions.armRight.y + armAngle * 0.7;

      // Slight arm rotation (less for bulky suit)
      armLeft.rotation = -armAngle * 0.05;
      armRight.rotation = armAngle * 0.05;

      // Body bobbing
      const bodyBobOffset = Math.sin(walkFrame * 2) * 0.3;
      body.y = originalPositions.body.y + bodyBobOffset;

      // Backpack slight movement
      backpack.y = originalPositions.backpack.y + Math.sin(walkFrame * 2) * 0.2;

      // Directional facing (flip sprite)
      if (direction === "left") {
        container.scale.x = -1;
      } else if (direction === "right") {
        container.scale.x = 1;
      }
      nameTag.scale.x = 1 / container.scale.x;
    } else {
      // Return to idle position smoothly
      legLeft.y += (originalPositions.legLeft.y - legLeft.y) * 0.1;
      legRight.y += (originalPositions.legRight.y - legRight.y) * 0.1;
      armLeft.y += (originalPositions.armLeft.y - armLeft.y) * 0.1;
      armRight.y += (originalPositions.armRight.y - armRight.y) * 0.1;
      armLeft.rotation += (originalPositions.armLeft.rotation - armLeft.rotation) * 0.1;
      armRight.rotation += (originalPositions.armRight.rotation - armRight.rotation) * 0.1;
      body.y += (originalPositions.body.y - body.y) * 0.1;
      backpack.y += (originalPositions.backpack.y - backpack.y) * 0.1;
    }
  };

  // Add ticker for animations
  Ticker.shared.add(tickerFn);
  container._tickerFn = tickerFn;

  // Enhanced movement API
  container.walk = (dir) => {
    walking = true;
    direction = dir;

    // Clear any existing stop timeout
    if (stopTimeout) {
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }
  };

  container.stop = () => {
    walking = false;

    // Clear any existing stop timeout
    if (stopTimeout) {
      clearTimeout(stopTimeout);
      stopTimeout = null;
    }
  };

  // Update position method
  container.updatePosition = (newPosition, isMoving, newDirection) => {
    // Update position
    container.x = newPosition.x;
    container.y = newPosition.y;

    if (isMoving) {
      container.walk(newDirection);
    } else {
      container.stop();
    }

    // Backup: Auto-stop after 200ms of no updates
    if (stopTimeout) {
      clearTimeout(stopTimeout);
    }

    stopTimeout = setTimeout(() => {
      container.stop();
    }, 200);
  };

  // Cleanup function
  container.destroy = () => {
    if (tickerFn) {
      Ticker.shared.remove(tickerFn);
    }
    container.removeChildren();
  };

  return container;
};

  const createOtherSpideyPlayer = (name, position) => {
    const player = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Enhanced Spiderman color palette
    const spidermanRed = 0xdc143c;
    const spidermanRedShadow = 0xa01024;
    const spidermanRedHighlight = 0xff3050;
    const spidermanBlue = 0x1e40af;
    const spidermanBlueShadow = 0x1e3a8a;
    const spidermanBlueHighlight = 0x3b82f6;
    const webColor = 0x000000;
    const eyeColor = 0xffffff;
    const eyeReflection = 0xe0e0e0;
    const muscleShadow = 0x8b1538;

    // Create separate graphics objects for emblem and web patterns
    const emblem = new Graphics();
    const webPattern = new Graphics();

    // Main body (red suit with muscle definition)
    player.beginFill(spidermanRed);
    player.drawRect(-8, -5, 16, 18);
    player.endFill();

    // Muscle definition on torso
    player.beginFill(spidermanRedShadow);
    player.drawRect(-6, -3, 2, 8); // Left pec
    player.drawRect(4, -3, 2, 8); // Right pec
    player.drawRect(-2, 2, 4, 6); // Abs
    player.endFill();

    // Body highlights
    player.beginFill(spidermanRedHighlight);
    player.drawRect(-7, -4, 1, 6); // Left highlight
    player.drawRect(6, -4, 1, 6); // Right highlight
    player.endFill();

    // Body shadow
    player.beginFill(spidermanRedShadow);
    player.drawRect(-8, 11, 16, 2);
    player.endFill();

    // Enhanced spider emblem on chest
    emblem.beginFill(webColor);
    // Spider body (more detailed)
    emblem.drawRect(-1, -3, 2, 8);
    emblem.drawRect(-2, -1, 4, 2);
    // Spider legs (more realistic)
    emblem.drawRect(-5, -1, 3, 1);
    emblem.drawRect(2, -1, 3, 1);
    emblem.drawRect(-4, 1, 2, 1);
    emblem.drawRect(2, 1, 2, 1);
    emblem.drawRect(-3, 3, 1, 1);
    emblem.drawRect(2, 3, 1, 1);
    // Add spider head
    emblem.drawRect(-1, -4, 2, 2);
    emblem.endFill();

    // Enhanced web pattern on torso
    webPattern.beginFill(webColor);
    // Vertical web lines
    for (let i = -6; i <= 6; i += 2) {
      webPattern.drawRect(i, -4, 1, 16);
    }
    // Horizontal web lines
    for (let i = -4; i <= 12; i += 2) {
      webPattern.drawRect(-7, i, 14, 1);
    }
    // Diagonal web connections
    for (let i = -6; i <= 4; i += 2) {
      webPattern.drawRect(i, -3 + Math.abs(i), 1, 1);
      webPattern.drawRect(i, 1 + Math.abs(i), 1, 1);
    }
    webPattern.endFill();

    // Head (full mask with better shape)
    player.beginFill(spidermanRed);
    player.drawRect(-6, -18, 12, 12);
    player.endFill();

    // Head muscle definition
    player.beginFill(spidermanRedShadow);
    player.drawRect(-5, -16, 2, 3); // Left cheek
    player.drawRect(3, -16, 2, 3); // Right cheek
    player.drawRect(-2, -12, 4, 2); // Jaw line
    player.endFill();

    // Head highlights
    player.beginFill(spidermanRedHighlight);
    player.drawRect(-5, -17, 1, 2);
    player.drawRect(4, -17, 1, 2);
    player.endFill();

    // Enhanced web pattern on head
    player.beginFill(webColor);
    // Radial web pattern from center
    for (let i = -5; i <= 5; i += 2) {
      player.drawRect(i, -18, 1, 12);
    }
    for (let i = -17; i <= -7; i += 2) {
      player.drawRect(-6, i, 12, 1);
    }
    // Curved web lines around eyes
    player.drawRect(-6, -15, 2, 1);
    player.drawRect(-6, -14, 3, 1);
    player.drawRect(3, -15, 3, 1);
    player.drawRect(4, -14, 2, 1);
    player.endFill();

    // Enhanced Spiderman eyes (larger and more expressive)
    player.beginFill(eyeColor);
    // Left eye (teardrop shape)
    player.drawRect(-5, -16, 4, 5);
    player.drawRect(-4, -17, 2, 1);
    player.drawRect(-4, -11, 2, 1);
    // Right eye
    player.drawRect(1, -16, 4, 5);
    player.drawRect(2, -17, 2, 1);
    player.drawRect(2, -11, 2, 1);
    player.endFill();

    // Eye reflections
    player.beginFill(eyeReflection);
    player.drawRect(-4, -15, 1, 1);
    player.drawRect(2, -15, 1, 1);
    player.endFill();

    // Eye outline (more detailed)
    player.beginFill(webColor);
    // Left eye outline
    player.drawRect(-5, -17, 4, 1);
    player.drawRect(-5, -11, 4, 1);
    player.drawRect(-5, -16, 1, 5);
    player.drawRect(-1, -16, 1, 5);
    player.drawRect(-4, -17, 1, 1);
    player.drawRect(-2, -17, 1, 1);
    // Right eye outline
    player.drawRect(1, -17, 4, 1);
    player.drawRect(1, -11, 4, 1);
    player.drawRect(1, -16, 1, 5);
    player.drawRect(4, -16, 1, 5);
    player.drawRect(2, -17, 1, 1);
    player.drawRect(4, -17, 1, 1);
    player.endFill();

    // Enhanced arms (red with better muscle definition)
    armLeft.beginFill(spidermanRed);
    armLeft.drawRect(-10, -2, 3, 12);
    armLeft.endFill();

    // Muscle definition on arms
    armLeft.beginFill(spidermanRedShadow);
    armLeft.drawRect(-9, 0, 1, 8); // Bicep
    armLeft.endFill();

    armLeft.beginFill(spidermanRedHighlight);
    armLeft.drawRect(-10, 1, 1, 6);
    armLeft.endFill();

    // Enhanced web pattern on arms
    armLeft.beginFill(webColor);
    armLeft.drawRect(-10, 0, 3, 1);
    armLeft.drawRect(-10, 3, 3, 1);
    armLeft.drawRect(-10, 6, 3, 1);
    armLeft.drawRect(-9, -2, 1, 12);
    // Diagonal connections
    armLeft.drawRect(-10, 1, 1, 1);
    armLeft.drawRect(-8, 2, 1, 1);
    armLeft.drawRect(-10, 4, 1, 1);
    armLeft.drawRect(-8, 5, 1, 1);
    armLeft.endFill();

    // Enhanced hands
    armLeft.beginFill(spidermanRed);
    armLeft.drawRect(-9, 10, 2, 3);
    armLeft.endFill();

    // Hand web pattern
    armLeft.beginFill(webColor);
    armLeft.drawRect(-9, 11, 2, 1);
    armLeft.endFill();

    // Right arm (mirrored)
    armRight.beginFill(spidermanRed);
    armRight.drawRect(7, -2, 3, 12);
    armRight.endFill();

    armRight.beginFill(spidermanRedShadow);
    armRight.drawRect(8, 0, 1, 8);
    armRight.endFill();

    armRight.beginFill(spidermanRedHighlight);
    armRight.drawRect(9, 1, 1, 6);
    armRight.endFill();

    armRight.beginFill(webColor);
    armRight.drawRect(7, 0, 3, 1);
    armRight.drawRect(7, 3, 3, 1);
    armRight.drawRect(7, 6, 3, 1);
    armRight.drawRect(8, -2, 1, 12);
    armRight.drawRect(9, 1, 1, 1);
    armRight.drawRect(7, 2, 1, 1);
    armRight.drawRect(9, 4, 1, 1);
    armRight.drawRect(7, 5, 1, 1);
    armRight.endFill();

    armRight.beginFill(spidermanRed);
    armRight.drawRect(7, 10, 2, 3);
    armRight.endFill();

    armRight.beginFill(webColor);
    armRight.drawRect(7, 11, 2, 1);
    armRight.endFill();

    // Enhanced legs (blue suit with muscle definition)
    legLeft.beginFill(spidermanBlue);
    legLeft.drawRect(-5, 13, 4, 16);
    legLeft.endFill();

    // Muscle definition on legs
    legLeft.beginFill(spidermanBlueShadow);
    legLeft.drawRect(-4, 15, 1, 12); // Quad muscle
    legLeft.drawRect(-2, 17, 1, 8); // Inner muscle
    legLeft.endFill();

    legLeft.beginFill(spidermanBlueHighlight);
    legLeft.drawRect(-5, 16, 1, 10);
    legLeft.endFill();

    // Enhanced web pattern on legs
    legLeft.beginFill(webColor);
    legLeft.drawRect(-5, 16, 4, 1);
    legLeft.drawRect(-5, 20, 4, 1);
    legLeft.drawRect(-5, 24, 4, 1);
    legLeft.drawRect(-3, 13, 1, 16);
    // Diagonal connections
    legLeft.drawRect(-5, 17, 1, 1);
    legLeft.drawRect(-2, 18, 1, 1);
    legLeft.drawRect(-5, 21, 1, 1);
    legLeft.drawRect(-2, 22, 1, 1);
    legLeft.endFill();

    // Right leg (mirrored)
    legRight.beginFill(spidermanBlue);
    legRight.drawRect(1, 13, 4, 16);
    legRight.endFill();

    legRight.beginFill(spidermanBlueShadow);
    legRight.drawRect(3, 15, 1, 12);
    legRight.drawRect(1, 17, 1, 8);
    legRight.endFill();

    legRight.beginFill(spidermanBlueHighlight);
    legRight.drawRect(4, 16, 1, 10);
    legRight.endFill();

    legRight.beginFill(webColor);
    legRight.drawRect(1, 16, 4, 1);
    legRight.drawRect(1, 20, 4, 1);
    legRight.drawRect(1, 24, 4, 1);
    legRight.drawRect(2, 13, 1, 16);
    legRight.drawRect(4, 17, 1, 1);
    legRight.drawRect(1, 18, 1, 1);
    legRight.drawRect(4, 21, 1, 1);
    legRight.drawRect(1, 22, 1, 1);
    legRight.endFill();

    // Enhanced boots
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(spidermanRed);
    shoeLeft.drawRect(-6, 29, 5, 3);
    shoeLeft.endFill();

    // Boot details
    shoeLeft.beginFill(spidermanRedShadow);
    shoeLeft.drawRect(-6, 30, 5, 1);
    shoeLeft.endFill();

    shoeLeft.beginFill(webColor);
    shoeLeft.drawRect(-5, 29, 1, 3);
    shoeLeft.drawRect(-3, 29, 1, 3);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(spidermanRed);
    shoeRight.drawRect(1, 29, 5, 3);
    shoeRight.endFill();

    shoeRight.beginFill(spidermanRedShadow);
    shoeRight.drawRect(1, 30, 5, 1);
    shoeRight.endFill();

    shoeRight.beginFill(webColor);
    shoeRight.drawRect(2, 29, 1, 3);
    shoeRight.drawRect(4, 29, 1, 3);
    shoeRight.endFill();

    // Add all child elements in correct order
    player.addChild(webPattern); // Web pattern first
    player.addChild(emblem); // Emblem on top
    player.addChild(armLeft);
    player.addChild(armRight);
    player.addChild(legLeft);
    player.addChild(legRight);
    player.addChild(shoeLeft);
    player.addChild(shoeRight);

    // Name tag
    const nameTag = new Text({
      text: name,
      style: new TextStyle({
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: "Arial",
        stroke: { color: 0x000000, width: 2 },
        dropShadow: {
          color: 0x000000,
          blur: 2,
          angle: Math.PI / 4,
          distance: 2,
        },
      }),
    });
    nameTag.anchor.set(0.5);
    nameTag.y = -35;
    player.addChild(nameTag);
    player.nameTag = nameTag;
    player.nameText = nameTag; // For compatibility
    player.playerName = name;

    // Position the player
    player.x = position.x;
    player.y = position.y;

    // Use the provided animation function
    return setupPlayerAnimationForOtherPlayer(
      player,
      legLeft,
      legRight,
      armLeft,
      armRight,
      shoeLeft,
      shoeRight,
      nameTag,
      null,
      emblem,
      webPattern
    );
  };

  const createOtherBatmanPlayer = (name, position, gameState) => {
    const player = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Batman color palette (same as createBatman)
    const batmanGray = 0x4a5568;
    const batmanGrayShadow = 0x2d3748;
    const batmanBlack = 0x1a202c;
    const batmanBlackShadow = 0x000000;
    const batmanYellow = 0xffd700;
    const batmanYellowShadow = 0xe6c200;
    const batmanBlue = 0x2563eb;
    const capeColor = 0x1a202c;

    // Cape (behind character) - Ensure this is added first to be at the back
    const cape = new Graphics();
    cape.beginFill(capeColor);
    cape.drawRect(-12, -8, 24, 25);
    cape.endFill();

    // Cape shadow
    cape.beginFill(batmanBlackShadow);
    cape.drawRect(-12, 15, 24, 2);
    cape.endFill();

    player.addChild(cape); // Add cape first

    // Main body (gray suit)
    player.beginFill(batmanGray);
    player.drawRect(-8, -5, 16, 18);
    player.endFill();

    // Body shadow
    player.beginFill(batmanGrayShadow);
    player.drawRect(-8, 11, 16, 2);
    player.endFill();

    // Head with cowl (drawn after body)
    player.beginFill(batmanGray);
    player.drawRect(-6, -18, 12, 12);
    player.endFill();

    // Batman cowl ears
    player.beginFill(batmanGray);
    player.drawRect(-4, -22, 2, 4);
    player.drawRect(2, -22, 2, 4);
    player.endFill();

    // Cowl shadow
    player.beginFill(batmanGrayShadow);
    player.drawRect(-6, -8, 12, 2);
    player.endFill();

    // Batman eyes (white slits)
    player.beginFill(0xffffff);
    player.drawRect(-4, -15, 2, 1);
    player.drawRect(2, -15, 2, 1);
    player.endFill();

    // Mouth (stern expression)
    player.beginFill(batmanGrayShadow);
    player.drawRect(-1, -10, 2, 1);
    player.endFill();

    // Create separate graphics objects for emblem and belt
    const emblem = new Graphics();
    const belt = new Graphics();

    // Bat emblem on chest - separate object
    emblem.beginFill(batmanYellow);
    emblem.drawRect(-3, -2, 6, 4);
    emblem.endFill();

    // Bat symbol
    emblem.beginFill(batmanBlack);
    // Bat body
    emblem.drawRect(-1, -1, 2, 2);
    // Bat wings
    emblem.drawRect(-3, 0, 2, 1);
    emblem.drawRect(1, 0, 2, 1);
    // Wing tips
    emblem.drawRect(-4, 1, 1, 1);
    emblem.drawRect(3, 1, 1, 1);
    emblem.endFill();

    // Utility belt - separate object
    belt.beginFill(batmanYellow);
    belt.drawRect(-8, 8, 16, 2);
    belt.endFill();

    // Belt pouches
    belt.beginFill(batmanYellowShadow);
    belt.drawRect(-6, 8, 2, 2);
    belt.drawRect(-2, 8, 2, 2);
    belt.drawRect(2, 8, 2, 2);
    belt.endFill();

    // Belt buckle
    belt.beginFill(batmanYellowShadow);
    belt.drawRect(-1, 8, 2, 2);
    belt.endFill();

    // Add emblem and belt to player
    player.addChild(emblem);
    player.addChild(belt);

    // Arms (gray with black gloves)
    armLeft.beginFill(batmanGray);
    armLeft.drawRect(-10, -2, 3, 10);
    armLeft.endFill();

    // Black gloves
    armLeft.beginFill(batmanBlack);
    armLeft.drawRect(-10, 8, 3, 5);
    armLeft.endFill();

    armRight.beginFill(batmanGray);
    armRight.drawRect(7, -2, 3, 10);
    armRight.endFill();

    armRight.beginFill(batmanBlack);
    armRight.drawRect(7, 8, 3, 5);
    armRight.endFill();

    player.addChild(armLeft);
    player.addChild(armRight);

    // Legs (gray with black boots)
    legLeft.beginFill(batmanGray);
    legLeft.drawRect(-5, 13, 4, 12);
    legLeft.endFill();

    // Black boots
    legLeft.beginFill(batmanBlack);
    legLeft.drawRect(-5, 25, 4, 4);
    legLeft.endFill();

    legRight.beginFill(batmanGray);
    legRight.drawRect(1, 13, 4, 12);
    legRight.endFill();

    legRight.beginFill(batmanBlack);
    legRight.drawRect(1, 25, 4, 4);
    legRight.endFill();

    player.addChild(legLeft);
    player.addChild(legRight);

    // Boots
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(batmanBlack);
    shoeLeft.drawRect(-6, 29, 5, 3);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(batmanBlack);
    shoeRight.drawRect(1, 29, 5, 3);
    shoeRight.endFill();

    player.addChild(shoeLeft);
    player.addChild(shoeRight);

    // Name tag
    const nameTag = new Text({
      text: name,
      style: new TextStyle({
        fontSize: 12,
        fill: 0xffffff,
        fontFamily: "Arial",
        stroke: { color: 0x000000, width: 2 },
        dropShadow: {
          color: 0x000000,
          blur: 2,
          angle: Math.PI / 4,
          distance: 2,
        },
      }),
    });
    nameTag.anchor.set(0.5);
    nameTag.y = -35;
    player.addChild(nameTag);
    player.nameTag = nameTag;
    player.nameText = nameTag; // For compatibility
    player.playerName = name;

    // Set initial position
    player.x = position.x;
    player.y = position.y;

    // Use the existing setupPlayerAnimation function but modify it to not add to gameState.camera
    // and not set gameState.player (since this is for other players)
    const animatedPlayer = setupPlayerAnimationForOtherPlayer(
      player,
      legLeft,
      legRight,
      armLeft,
      armRight,
      shoeLeft,
      shoeRight,
      nameTag,
      cape,
      emblem,
      belt
    );

    return animatedPlayer;
  };

   const setupPlayerAnimationForOtherPlayer = (
      player,
      legLeft,
      legRight,
      armLeft,
      armRight,
      shoeLeft,
      shoeRight,
      nameTag,
      cape = null,
      emblem = null,
      belt = null
    ) => {
      // Animation variables
      let walking = false;
      let walkFrame = 0;
      let direction = "down";
      const walkSpeed = 0.3;
      const legSwingAmount = 4;
      const armSwingAmount = 3;
      const bodyBobAmount = 1;
  
      let tickerFn = () => {
        if (!player || !player.parent) return; // prevent stale access
  
        if (walking) {
          walkFrame += walkSpeed;
  
          const legAngle = Math.sin(walkFrame) * legSwingAmount;
          const armAngle = Math.sin(walkFrame) * armSwingAmount;
          const bodyBob = Math.abs(Math.sin(walkFrame * 2)) * bodyBobAmount;
  
          legLeft.y = 0 + legAngle;
          legRight.y = 0 - legAngle;
  
          armLeft.y = 0 - armAngle * 0.7;
          armRight.y = 0 + armAngle * 0.7;
  
          armLeft.rotation = -armAngle * 0.1;
          armRight.rotation = armAngle * 0.1;
  
          player.children.forEach((child) => {
            if (
              child !== legLeft &&
              child !== legRight &&
              child !== shoeLeft &&
              child !== shoeRight &&
              child !== cape &&
              child !== emblem &&
              child !== belt
            ) {
              child.y += Math.sin(walkFrame * 2) * 0.3;
            }
          });
  
          if (direction === "left") {
            player.scale.x = -1;
          } else if (direction === "right") {
            player.scale.x = 1;
          }
          nameTag.scale.x = 1 / player.scale.x;
        } else {
          legLeft.y += (0 - legLeft.y) * 0.1;
          legRight.y += (0 - legRight.y) * 0.1;
          armLeft.y += (0 - armLeft.y) * 0.1;
          armRight.y += (0 - armRight.y) * 0.1;
          armLeft.rotation += (0 - armLeft.rotation) * 0.1;
          armRight.rotation += (0 - armRight.rotation) * 0.1;
  
          player.children.forEach((child) => {
            if (
              child !== legLeft &&
              child !== legRight &&
              child !== shoeLeft &&
              child !== shoeRight &&
              child !== nameTag &&
              child !== cape &&
              child !== emblem &&
              child !== belt
            ) {
              child.y += Math.sin(walkFrame * 2) * 0.3;
            }
          });
        }
      };
  
      Ticker.shared.add(tickerFn);
      player._tickerFn = tickerFn;
  
      player.walk = (dir) => {
        walking = true;
        direction = dir;
        const speed = 2;
  
        if (dir === "left") player.x -= speed;
        if (dir === "right") player.x += speed;
        if (dir === "up") player.y -= speed;
        if (dir === "down") player.y += speed;
      };
  
      player.stop = () => {
        walking = false;
      };
  
      // Add updatePosition method for network synchronization
      player.updatePosition = (newPosition, isMoving, newDirection) => {
        player.x = newPosition.x;
        player.y = newPosition.y;
  
        if (isMoving) {
          player.walk(newDirection);
        } else {
          player.stop();
        }
      };
  
      // Add destroy method for cleanup
      player.destroy = () => {
        if (tickerFn) {
          Ticker.shared.remove(tickerFn);
        }
        if (player.parent) {
          player.parent.removeChild(player);
        }
      };
  
      player.children.forEach((child) => {
        child.originalY = child.y;
      });
  
      return player;
    };

 const avatarMap = {
    default: createPlayer,
    Batman: createBatman,
    Spiderman: createSpidey,
    Male: createMalePlayer,
    Female: createGirlPlayer,
  };
    const avatarOtherMap = {
    default: createOtherPlayer,
    Batman: createOtherBatmanPlayer,
    Spiderman: createOtherSpideyPlayer,
    Male: createOtherMalePlayer,
    Female: createOtherFemalePlayer,
  };
 const createFn = avatarMap[avatarType] || createPlayer;

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await getSpaceById(id);
        setSpace(res.data.space);
      } catch (err) {
        console.error("Failed to load space:", err);
      } finally {
        setTimeout(() => {
          setLoadingPage(false);
        }, 1500);
      }
    };

    fetchSpace();
  }, [id]);

   useEffect(() => {
      const fetchPlayerName = async () => {
        try {
          const res = await getUser();
          if (res.data?.username) {
            setPlayerName(res.data.username);
          }
        } catch (err) {
          console.error("Failed to fetch user info:", err);
        }
      };
  
      fetchPlayerName();
    }, []);

     useEffect(() => {
        if (gameStateRef.current) {
          gameStateRef.current.wallHackEnabled = wallHackEnabled;
        }
      }, [wallHackEnabled]);

      useEffect(() => {
        if (!socket.connected) {
          socket.connect();
        }
      
        const handleConnect = () => {
          console.log("🟢 Connected:", socket.id);
          gameStateRef.current.socketId = socket.id;
        };
      
        socket.on("connect", handleConnect);
      
        return () => {
          socket.off("connect", handleConnect);
          socket.disconnect(); // ✅ clean disconnect on unmount
        };
      }, []);

         useEffect(() => {
        if (socket && space && !isOwner) {
          // Request permissions when joining as non-owner
          const requestPermissions = () => {
            socket.emit("requestPermissions");
            console.log("❓ Requested permissions from admin");
          };
      
          // Request permissions after a short delay to ensure connection is stable
          const timeoutId = setTimeout(requestPermissions, 1500);
      
          return () => clearTimeout(timeoutId);
        }
      }, [socket, space, isOwner]);

  useEffect(() => {
    if (!loadingPage && space && canvasRef.current) {
      const initPixi = async () => {
        const app = new Application();
        await app.init({
          width: 1200,
          height: 800,
          background: "#1a1a2e", // Darker pixelated theme background
          antialias: false, // Keep this false for pixelated look
          resolution: 1,
          roundPixels: true, // Add this for crisp pixel rendering
        });

        appRef.current = app;
        canvasRef.current.appendChild(app.canvas);
        initGame(app);
      };

            const initGame = (app) => {
              const gameState = gameStateRef.current;
      
              gameState.app = app; // ✅ Add this line to store the app reference
      
              gameState.colliders = [];
              gameState.world = new Container();
              app.stage.addChild(gameState.world);
      
              gameState.camera = new Container();
              gameState.world.addChild(gameState.camera);
      
              createSpaceStationGrid(gameState);
              populateRooms(gameState);
              createFn(gameState, playerName);
              setupSocketListeners(gameState);
      
            //   ✅ Now emit player-join after everything is ready
              socket.emit("player-join", {
                name: playerName,
                position: {
                  x: gameState.player.x,
                  y: gameState.player.y,
                },
                avatarKey: gameState.player.avatarKey,
                spaceId: space._id,
              });
              console.log(
                "🙋 Sending player-join",
                playerName,
                gameState.player.x,
                gameState.player.y
              );
      
              setupInput(gameState, app);
      
              // app.ticker drives the game loop
              app.ticker.add(() => gameLoop(gameState, app));
            };

const setupSocketListeners = (gameState) => {
  // ✅ Remove any existing listeners first
  socket.off("existing-players");
  socket.off("player-joined");
  socket.off("player-moved");
  socket.off("player-left");
  socket.off("avatar-change");
  socket.off("player-emote");
  socket.off("hackPermissionsUpdate");
  socket.off("requestPermissions");
  socket.off("userJoined");

  socket.on("existing-players", (players) => {
    console.log("📥 Received existing players:", players);
    console.log("🆔 My socket ID:", gameState.socketId);
    const updated = [];

    for (const id in players) {
      if (id === gameState.socketId) {
        console.log("⏭️ Skipping own player:", id);
        continue;
      }

      const data = players[id];
      console.log("➕ Adding existing player:", id, data);

      // ✅ Create player with avatarKey if available
      const container = createOtherPlayerWithAvatar(
        data.name,
        data.position,
        data.avatarKey
      );
      gameState.otherPlayers[id] = container;
      gameState.camera.addChild(container);
      updated.push(data.name);
    }
    if (!isOwner) {
      setTimeout(() => {
        socket.emit("requestPermissions");
      }, 500);
    }
    setOnlinePlayers([playerName, ...updated]);
  });

  socket.on("player-joined", (data) => {
    console.log("📥 New player joined:", data);

    if (data.id === gameState.socketId) {
      console.log("⏭️ Skipping own player join event");
      return;
    }

    if (gameState.otherPlayers[data.id]) {
      console.log("⏭️ Player already exists:", data.id);
      return;
    }

    // ✅ Create player with avatarKey
    const container = createOtherPlayerWithAvatar(
      data.name,
      data.position,
      data.avatarKey
    );
    gameState.otherPlayers[data.id] = container;
    gameState.camera.addChild(container);
    setOnlinePlayers((prev) => [...prev, data.name]);
    console.log("➕ Added new player:", data.id);

    // ✅ Send current permissions to new player (if owner)
    if (isOwner) {
      socket.emit("hackPermissionsUpdate", {
        permissions: hackPermissions,
        targetUserId: data.id,
      });
    }
  });

  // ✅ FIXED: Now handles name and avatarKey from server
  socket.on(
    "player-moved",
    ({ id, position, isMoving, direction, name, avatarKey }) => {
      const gameState = gameStateRef.current;
      const player = gameState.otherPlayers[id];

      if (player && player.updatePosition) {
        // Use enhanced updatePosition with movement state
        player.updatePosition(position, isMoving, direction);

        // ✅ Update name and avatarKey if they've changed
        if (name && player.nameText) {
          player.nameText.text = name;
        }

        // ✅ Store avatarKey for reference
        if (avatarKey) {
          player.avatarKey = avatarKey;
        }
      } else if (player) {
        // Fallback
        player.x = position.x;
        player.y = position.y;

        if (isMoving) {
          player.walk(direction);
        } else {
          player.stop();
        }

        // ✅ Update name and avatarKey here too
        if (name && player.nameText) {
          player.nameText.text = name;
        }
        if (avatarKey) {
          player.avatarKey = avatarKey;
        }
      }
    }
  );

  // ✅ FIXED: Simplified avatar change - just recreate the player
  socket.on("avatar-change", (data) => {
    const { playerId, avatarKey, position, name } = data;

    // Don't update our own player
    if (playerId === socket.id) return;

    const gameState = gameStateRef.current;
    if (!gameState) return;

    const existingPlayer = gameState.otherPlayers[playerId];
    if (!existingPlayer) return;

    // ✅ Use position from server if available, otherwise use current position
    const currentPosition = position || {
      x: existingPlayer.x,
      y: existingPlayer.y,
    };

    // ✅ Use name from server if available, otherwise try to get from existing player
    let currentName = name || "Unknown";
    if (!name) {
      if (existingPlayer.nameText?.text) {
        currentName = existingPlayer.nameText.text;
      } else if (existingPlayer.nameTag?.text) {
        currentName = existingPlayer.nameTag.text;
      } else if (existingPlayer.playerName) {
        currentName = existingPlayer.playerName;
      }
    }

    const wasMoving = existingPlayer.isMoving || false;
    const currentDirection = existingPlayer.direction || "down";

    console.log(
      `🔄 Avatar change for ${currentName} (${playerId}) to ${avatarKey}`
    );
    console.log(`📍 Using position:`, currentPosition);
    console.log(`🏃 Was moving:`, wasMoving, `Direction:`, currentDirection);

    // Remove old player
    gameState.camera.removeChild(existingPlayer);
    existingPlayer.destroy({ children: true });

    // ✅ Create new avatar with preserved/updated state
    const newOtherPlayer = createOtherPlayerWithAvatar(
      currentName,
      currentPosition,
      avatarKey
    );

    // ✅ Restore movement state
    if (wasMoving) {
      newOtherPlayer.walk(currentDirection);
    }

    // Store in game state
    gameState.otherPlayers[playerId] = newOtherPlayer;
    gameState.camera.addChild(newOtherPlayer);

    console.log(`✅ Player ${currentName} changed avatar to: ${avatarKey}`);
  });

  socket.on("player-emote", ({ id, emoji }) => {
    const gameState = gameStateRef.current;
    const player = gameState.otherPlayers[id];
    if (player) {
      triggerEmoteOnOther(player, emoji);
    }
  });

  socket.on("player-left", (id) => {
    console.log("📤 Player left:", id);
    const player = gameState.otherPlayers[id];
    if (player) {
      gameState.camera.removeChild(player);
      player.destroy();
      const name = player.playerName || "Unknown";
      delete gameState.otherPlayers[id];
      setOnlinePlayers((prev) => prev.filter((n) => n !== name));
    }
  });

  // ✅ NEW: Permission-related socket listeners
  socket.on("hackPermissionsUpdate", (data) => {
    console.log("🔧 Received permission update:", data);

    // Only non-owners should update their permissions from server
    if (!isOwner) {
      setHackPermissions(data.permissions || data);
    }
  });

  socket.on("requestPermissions", (userId) => {
    console.log("❓ Permission request from:", userId);

    // Only owners should respond to permission requests
    if (isOwner) {
      socket.emit("hackPermissionsUpdate", {
        permissions: hackPermissions,
        targetUserId: userId,
      });
    }
  });

  // ✅ NEW: Handle when user joins (for permission sync)
  socket.on("userJoined", (userData) => {
    console.log("👋 User joined notification:", userData);

    // Send permissions to newly joined user if we're the owner
    if (isOwner) {
      setTimeout(() => {
        socket.emit("hackPermissionsUpdate", {
          permissions: hackPermissions,
          targetUserId: userData.id,
        });
      }, 1000); // Small delay to ensure they're ready
    }
  });
};


      const createOtherPlayerWithAvatar = (name, position, avatarKey) => {
        let container;

        if (avatarKey && avatarOtherMap[avatarKey]) {
          // Create with specific avatar
          const createFn = avatarOtherMap[avatarKey];
          container = createFn(name, gameStateRef.current);
        } else {
          // Fallback to default createOtherPlayer
          container = createOtherPlayer(name, position);
        }

        // Set position
        container.x = position.x;
        container.y = position.y;

        // Store avatar key for future reference
        container.avatarKey = avatarKey;

        return container;
      };

      const triggerEmoteOnOther = (player, emoji) => {
        const world = gameStateRef.current?.world;
        if (!player || !world) return;

        // If an old emote bubble exists, destroy it
        if (player.emoteBubble) {
          world.removeChild(player.emoteBubble);
          player.emoteBubble.destroy();
        }

        // Create container for the entire emote bubble
        const container = new Container();
        container.x = player.x;
        container.y = player.y - 60;
        world.addChild(container);

        // Create bubble background
        const bubble = new Graphics();
        bubble.beginFill(0x000000, 0.8);
        bubble.lineStyle(3, 0xffffff, 1);
        bubble.drawRoundedRect(-35, -25, 70, 50, 15);
        bubble.endFill();

        // Add subtle gradient effect
        bubble.beginFill(0x333333, 0.3);
        bubble.drawRoundedRect(-35, -25, 70, 25, 15);
        bubble.endFill();

        // Create bubble tail
        const tail = new Graphics();
        tail.beginFill(0x000000, 0.8);
        tail.lineStyle(3, 0xffffff, 1);
        tail.moveTo(0, 20);
        tail.lineTo(-8, 35);
        tail.lineTo(8, 35);
        tail.closePath();
        tail.endFill();

        container.addChild(bubble);
        container.addChild(tail);
        console.log("🚀 Showing emoji:", emoji, typeof emoji);

        // Create emoji text
        const style = new TextStyle({
          fontSize: 28,
          fill: "white",
          fontWeight: "bold",
          dropShadow: true,
          dropShadowColor: "#000000",
          dropShadowBlur: 4,
          dropShadowAngle: Math.PI / 6,
          dropShadowDistance: 2,
        });

        const text = new Text(emoji, style);
        text.anchor.set(0.5);
        text.x = 0;
        text.y = -5;
        container.addChild(text);

        // Initial state
        container.alpha = 0;
        container.scale.set(0.3);

        player.emoteBubble = container;

        // Enhanced animation with easing
        const startTime = Date.now();
        const totalDuration = 3000;
        const phaseInDuration = 400;
        const phaseOutDuration = 500;
        const holdDuration = totalDuration - phaseInDuration - phaseOutDuration;

        // Easing functions
        const easeOutBack = (t) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };

        const easeInCubic = (t) => t * t * t;

        const animate = () => {
          if (!player.emoteBubble) return;

          const now = Date.now();
          const elapsed = now - startTime;

          // Update position to follow player
          const targetX = player.x;
          const targetY = player.y - 60;

          // Smooth position interpolation
          container.x += (targetX - container.x) * 0.15;
          container.y += (targetY - container.y) * 0.15;

          if (elapsed < phaseInDuration) {
            // Phase In: Bounce in effect
            const progress = elapsed / phaseInDuration;
            const easedProgress = easeOutBack(progress);

            container.alpha = progress;
            container.scale.set(0.3 + easedProgress * 0.7);

            // Subtle float animation
            const floatOffset = Math.sin(elapsed * 0.01) * 2;
            container.y = targetY + floatOffset;
          } else if (elapsed < phaseInDuration + holdDuration) {
            // Hold Phase: Gentle floating
            container.alpha = 1;
            container.scale.set(1);

            const holdElapsed = elapsed - phaseInDuration;
            const floatOffset = Math.sin(holdElapsed * 0.005) * 3;
            const bobOffset = Math.sin(holdElapsed * 0.008) * 1.5;

            container.y = targetY + floatOffset;
            container.x = targetX + bobOffset;

            // Subtle scale pulsing
            const pulseScale = 1 + Math.sin(holdElapsed * 0.006) * 0.05;
            container.scale.set(pulseScale);
          } else if (elapsed < totalDuration) {
            // Phase Out: Fade and shrink
            const fadeProgress =
              (elapsed - phaseInDuration - holdDuration) / phaseOutDuration;
            const easedFade = easeInCubic(fadeProgress);

            container.alpha = 1 - easedFade;
            container.scale.set(1 - easedFade * 0.3);

            // Float up while fading
            const floatUp = easedFade * 20;
            container.y = targetY - floatUp;
          } else {
            // Animation complete
            world.removeChild(container);
            container.destroy();
            player.emoteBubble = null;
            return;
          }

          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      };

const addWithCollider = (container, displayObject, bounds, colliders) => {
container.addChild(displayObject);
colliders.push(bounds);
};            


const createSpaceStationGrid = (gameState) => {
  const { camera, TILE_SIZE } = gameState;
  
  // Define space station layout with uneven room sizes
  const SPACE_LAYOUT = [
    // Row 0: Command deck and observation
    [
      { type: 'bridge', width: 600, height: 400, name: 'Command Bridge' },
      { type: 'observation', width: 400, height: 400, name: 'Observation Deck' },
      { type: 'communications', width: 600, height: 400, name: 'Comms Array' }
    ],
    // Row 1: Main corridors and facilities
    [
      { type: 'secret_room', width: 200, height: 500, name: 'Hidden Room' },
      { type: 'med_bay', width: 500, height: 500, name: 'Medical Bay' },
      { type: 'lab', width: 450, height: 500, name: 'Research Lab' },
      { type: 'corridor2', width: 450, height: 500, name: 'Corridor A' },
    ],
    // Row 2: Engineering and storage
    [
      { type: 'engineering', width: 700, height: 550, name: 'Engineering Bay' },
      { type: 'storage', width: 350, height: 550, name: 'Cargo Hold' },
      { type: 'reactor', width: 550, height: 550, name: 'Reactor Core' },
    ],
    // Row 3: Living quarters
    [
      { type: 'quarters', width: 350, height: 350, name: 'Crew Quarters A' },
      { type: 'quarters', width: 350, height: 350, name: 'Crew Quarters B' },
      { type: 'cafeteria', width: 450, height: 350, name: 'Mess Hall' },
      { type: 'recreation', width: 450, height: 350, name: 'Recreation' }
    ]
  ];

  const trueWorldHeight = SPACE_LAYOUT.reduce((sum, row) => {
  const rowHeight = Math.max(...row.map(room => room.height));
  return sum + rowHeight;
}, 0);

const trueWorldWidth = Math.max(
  ...SPACE_LAYOUT.map(row => row.reduce((w, room) => w + room.width, 0))
);

gameState.worldHeight = trueWorldHeight;
  gameState.worldWidth = trueWorldWidth;



  const roomConnections = {
  "0,0": { top: false, bottom: true, left: false, right: false, airlockOffsets: { bottom: 100 } },
  "0,1": { top: false, bottom: true, left: false, right: false, airlockOffsets:{ bottom: 70} },
  "0,2": { top: false, bottom: true, left: false, right: false, airlockOffsets: { bottom: 55 } },
  "1,0": { top: false, bottom: true, left: false, right: false },
  "1,1": { top: true, bottom: false, left: false, right: true, airlockOffsets:{ right: -20, top: -50} },
  "1,2": { top: true, bottom: false, left: true, right: true, airlockOffsets:{ left: -20, top: -55, right: -20} },
  "1,3": { top: true, bottom: true, left: true, right: false, airlockOffsets:{left: -20, top: -20, bottom: 110} },
  "2,0": { top: false, bottom: false, left: false, right: true, airlockOffsets: {right: -40} },
  "2,1": { top: false, bottom: false, left: true, right: true, airlockOffsets: { left: -40, right: -40 } },
  "2,2": { top: true, bottom: true, left: true, right: false, airlockOffsets:{ left: -40, top: 160, bottom: 35} },
  "3,0": { top: false, bottom: false, left: false, right: true, airlockOffsets: {right: -40} },
  "3,1": { top: false, bottom: false, left: true, right: true, airlockOffsets: { left: -40, right: -40 } },
  "3,2": { top: false, bottom: false, left: true, right: true, airlockOffsets: { left: -40, right: -40 } },
  "3,3": { top: true, bottom: false, left: true, right: false, airlockOffsets: { left: -40, top: -15 } },
};


  let currentY = 0;
  
  SPACE_LAYOUT.forEach((row, rowIndex) => {
    let currentX = 0;
    const rowHeight = Math.max(...row.map(room => room.height));
    
    row.forEach((roomData, colIndex) => {
      const { type, width, height, name } = roomData;
      
      const room = new Container();
      room.x = currentX;
      room.y = currentY;
      
      // Create floor tiles with space-themed colors
      for (let y = 0; y < height; y += TILE_SIZE) {
        for (let x = 0; x < width; x += TILE_SIZE) {
          const tile = createSpaceFloorTile(x, y, TILE_SIZE, type);
          room.addChild(tile);
        }
      }
      
      // Create walls and airlocks
const key = `${rowIndex},${colIndex}`;
const connections = roomConnections[key] || {};

const walls = createSpaceWalls(
  width, 
  height, 
  rowIndex, 
  colIndex, 
  SPACE_LAYOUT, 
  gameState.colliders, 
  currentX, 
  currentY,
  connections // pass custom connection config here
);

      walls.forEach(wall => room.addChild(wall));
      
      
      // Add room label with sci-fi styling
      const label = new Text({
        text: name,
        style: new TextStyle({
          fontSize: 12,
          fill: 0x00ffff, // Cyan color for sci-fi feel
          fontFamily: "Courier New",
          stroke: { color: 0x000033, width: 2 },
        }),
      });
      label.x = width / 2;
      label.y = 15;
      label.anchor.set(0.5);
      room.addChild(label);
      
      camera.addChild(room);
      currentX += width;
    });
    
    currentY += rowHeight;
  });
  
};

function createCommandChair(x, y, camera, colliders) {
    // Create main command chair container
    const chairContainer = new Container();
    chairContainer.x = x;
    chairContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Chair base pedestal (scaled up)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawCircle(0, 45, 24);
    graphics.endFill();
    
    // Base ring details
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawCircle(0, 45, 18);
    graphics.drawCircle(0, 45, 12);
    graphics.endFill();
    
    // Hydraulic cylinder
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-8, 25, 16, 20, 5);
    graphics.endFill();
    
    // Hydraulic segments
    graphics.lineStyle(1, 0x666666);
    graphics.moveTo(-8, 30);
    graphics.lineTo(8, 30);
    graphics.moveTo(-8, 35);
    graphics.lineTo(8, 35);
    graphics.moveTo(-8, 40);
    graphics.lineTo(8, 40);
    
    // Main seat cushion (scaled up)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-35, 10, 70, 28, 10);
    graphics.endFill();
    
    // Seat surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-32, 13, 64, 22, 8);
    graphics.endFill();
    
    // Seat quilting pattern
    graphics.lineStyle(1, 0x555555, 0.3);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 7; j++) {
            graphics.drawRoundedRect(-28 + j * 8, 16 + i * 4.5, 6, 3.5, 2);
        }
    }
    
    // Backrest (scaled up)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-28, -35, 56, 45, 10);
    graphics.endFill();
    
    // Backrest cushion
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-25, -32, 50, 39, 8);
    graphics.endFill();
    
    // Backrest quilting
    graphics.lineStyle(1, 0x555555, 0.3);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            graphics.drawRoundedRect(-20 + j * 8, -28 + i * 7, 6, 5, 2);
        }
    }
    
    // Left armrest (scaled up)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-48, -8, 16, 35, 8);
    graphics.endFill();
    
    // Left armrest pad
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-45, -5, 10, 29, 5);
    graphics.endFill();
    
    // Right armrest (scaled up)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(32, -8, 16, 35, 8);
    graphics.endFill();
    
    // Right armrest pad
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(35, -5, 10, 29, 5);
    graphics.endFill();
    
    // Left armrest control panel (scaled up)
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-44, -2, 8, 16, 4);
    graphics.endFill();
    
    // Left control buttons
    const leftButtons = [
        {x: -40, y: 1, color: 0x00ff00}, // Power
        {x: -40, y: 5, color: 0x0066ff}, // Systems
        {x: -40, y: 9, color: 0xff6600}, // Weapons
        {x: -40, y: 13, color: 0xffff00}  // Shields
    ];
    
    leftButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawCircle(btn.x, btn.y, 1.5);
        graphics.endFill();
    });
    
    // Right armrest control panel (scaled up)
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(36, -2, 8, 16, 4);
    graphics.endFill();
    
    // Right control buttons
    const rightButtons = [
        {x: 40, y: 1, color: 0x00ffff}, // Navigation
        {x: 40, y: 5, color: 0xff00ff}, // Communications
        {x: 40, y: 9, color: 0xff0000}, // Emergency
        {x: 40, y: 13, color: 0x66ff00} // Diagnostics
    ];
    
    rightButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawCircle(btn.x, btn.y, 1.5);
        graphics.endFill();
    });
    
    // Headrest (scaled up)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-16, -50, 32, 16, 8);
    graphics.endFill();
    
    // Headrest cushion
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-14, -47, 28, 10, 5);
    graphics.endFill();
    
    // Headrest support arms
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-20, -42, 6, 10, 3);
    graphics.drawRoundedRect(14, -42, 6, 10, 3);
    graphics.endFill();
    
    // Integrated display screen in headrest (scaled up)
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-12, -46, 24, 8, 3);
    graphics.endFill();
    
    // Display content
    graphics.beginFill(0x004466);
    graphics.drawRect(-10, -44, 20, 1.5);
    graphics.drawRect(-10, -41, 14, 1.5);
    graphics.drawRect(-10, -38, 16, 1.5);
    graphics.endFill();
    
    // Chair frame reinforcement (scaled up)
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-32, 8, 64, 4, 2);
    graphics.drawRoundedRect(-28, -37, 56, 4, 2);
    graphics.endFill();
    
    // Side lumbar support (scaled up)
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-32, -20, 4, 20, 2);
    graphics.drawRoundedRect(28, -20, 4, 20, 2);
    graphics.endFill();
    
    // Status indicator panel on backrest (scaled up)
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-8, -25, 16, 12, 4);
    graphics.endFill();
    
    // Status LEDs
    const statusLEDs = [
        {x: -4, y: -22, color: 0x00ff00}, // System Status
        {x: 0, y: -22, color: 0x0066ff},  // Navigation
        {x: 4, y: -22, color: 0xff6600},  // Weapons
        {x: -4, y: -17, color: 0x00ff00}, // Shields
        {x: 0, y: -17, color: 0x00ffff},  // Communications
        {x: 4, y: -17, color: 0xffff00}   // Power
    ];
    
    statusLEDs.forEach(led => {
        graphics.beginFill(led.color);
        graphics.drawCircle(led.x, led.y, 1.5);
        graphics.endFill();
    });
    
    // Armrest data displays (scaled up)
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-43, 18, 6, 4, 2);
    graphics.drawRoundedRect(37, 18, 6, 4, 2);
    graphics.endFill();
    
    // Chair adjustment controls (scaled up)
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-12, 40, 24, 6, 3);
    graphics.endFill();
    
    // Adjustment buttons
    const adjustButtons = [
        {x: -7, y: 43, color: 0x0066ff}, // Height
        {x: 0, y: 43, color: 0x00ff00}, // Recline
        {x: 7, y: 43, color: 0xff6600}   // Rotate
    ];
    
    adjustButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.drawCircle(btn.x, btn.y, 1.5);
        graphics.endFill();
    });
    
    // Power cables (scaled up)
    graphics.lineStyle(2, 0x333333);
    graphics.moveTo(-24, 45);
    graphics.bezierCurveTo(-35, 52, -42, 58, -48, 65);
    graphics.moveTo(24, 45);
    graphics.bezierCurveTo(35, 52, 42, 58, 48, 65);
    
    // Emergency release handle (scaled up)
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(20, 24, 12, 5, 3);
    graphics.endFill();
    
    // Handle grip
    graphics.beginFill(0xffffff);
    graphics.drawRoundedRect(21, 25, 10, 3, 2);
    graphics.endFill();
    
    // Swivel mechanism indicators (scaled up)
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 8; i++) {
        const angle = i * 0.785; // 45 degrees
        const x = Math.cos(angle) * 20;
        const y = 45 + Math.sin(angle) * 20;
        graphics.drawCircle(x, y, 1.5);
    }
    graphics.endFill();
    
    chairContainer.addChild(graphics);
    
    // Add subtle breathing animation for status LEDs
    let breatheTime = 0;
    const breatheAnimation = () => {
        breatheTime += 0.015;
        const alpha = 0.7 + Math.sin(breatheTime) * 0.3;
        
        // Create breathing effect for status indicators
        const breatheGraphics = new Graphics();
        statusLEDs.forEach(led => {
            breatheGraphics.beginFill(led.color, alpha);
            breatheGraphics.drawCircle(led.x, led.y, 1);
            breatheGraphics.endFill();
        });
        
        // Remove old breathing effect and add new one
        if (chairContainer.children.length > 1) {
            chairContainer.removeChildAt(1);
        }
        chairContainer.addChild(breatheGraphics);
        
        requestAnimationFrame(breatheAnimation);
    };
    breatheAnimation();

    const bounds = {
      x: x - 35, // left side (based on seat and backrest)
      y: y - 50, // top of headrest
      width: 70, // full width of chair (seat + arms + armrests)
      height: 100, // from headrest to bottom pedestal base
      label: "commandchair",
    };


        if (colliders) {
          addWithCollider(camera, chairContainer, bounds, colliders);
        }
    
    return chairContainer;
}

function createHoloDisplay(x, y, camera, colliders) {
    // Create main holographic display container
    const holoContainer = new Container();
    holoContainer.x = x;
    holoContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main holographic projector base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-40, 25, 80, 15, 6);
    graphics.endFill();
    
    // Projector housing
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-35, 20, 70, 10, 4);
    graphics.endFill();
    
    // Holographic emitter array
    graphics.beginFill(0x0066cc);
    graphics.lineStyle(1, 0x0088ff);
    for (let i = 0; i < 7; i++) {
        graphics.drawCircle(-30 + i * 10, 25, 2);
    }
    graphics.endFill();
    
    // Central holographic display area
    graphics.beginFill(0x001122, 0.3);
    graphics.lineStyle(2, 0x0066cc, 0.7);
    graphics.drawRoundedRect(-50, -40, 100, 60, 8);
    graphics.endFill();
    
    // Holographic grid overlay
    graphics.lineStyle(1, 0x004466, 0.4);
    for (let i = 0; i <= 10; i++) {
        graphics.moveTo(-50 + i * 10, -40);
        graphics.lineTo(-50 + i * 10, 20);
    }
    for (let i = 0; i <= 6; i++) {
        graphics.moveTo(-50, -40 + i * 10);
        graphics.lineTo(50, -40 + i * 10);
    }
    
    // 3D molecular structure hologram
    graphics.beginFill(0x0088cc, 0.8);
    graphics.lineStyle(1, 0x00aaff);
    
    // Central atom
    graphics.drawCircle(-15, -10, 6);
    
    // Orbital electrons
    graphics.beginFill(0x00ff66, 0.6);
    graphics.drawCircle(-25, -15, 3);
    graphics.drawCircle(-8, -20, 3);
    graphics.drawCircle(-5, -5, 3);
    graphics.drawCircle(-20, -2, 3);
    graphics.endFill();
    
    // Electron bonds
    graphics.lineStyle(1, 0x0066aa, 0.5);
    graphics.moveTo(-15, -10);
    graphics.lineTo(-25, -15);
    graphics.moveTo(-15, -10);
    graphics.lineTo(-8, -20);
    graphics.moveTo(-15, -10);
    graphics.lineTo(-5, -5);
    graphics.moveTo(-15, -10);
    graphics.lineTo(-20, -2);
    
    // Orbital paths
    graphics.lineStyle(1, 0x004488, 0.3);
    graphics.drawCircle(-15, -10, 12);
    graphics.drawCircle(-15, -10, 8);
    graphics.drawCircle(-15, -10, 16);
    
    // DNA strand visualization
    graphics.beginFill(0xff6600, 0.7);
    graphics.lineStyle(1, 0xff8800);
    for (let i = 0; i < 20; i++) {
        const x = 10 + i * 2;
        const y1 = -25 + Math.sin(i * 0.5) * 8;
        const y2 = -25 + Math.sin(i * 0.5 + Math.PI) * 8;
        graphics.drawCircle(x, y1, 1.5);
        graphics.drawCircle(x, y2, 1.5);
        
        // DNA rungs
        graphics.lineStyle(1, 0xffaa44, 0.5);
        graphics.moveTo(x, y1);
        graphics.lineTo(x, y2);
    }
    graphics.endFill();
    
    // Data stream visualization
    graphics.beginFill(0x00ff00, 0.6);
    graphics.lineStyle(1, 0x44ff44);
    for (let i = 0; i < 8; i++) {
        const height = 2 + Math.sin(i * 0.8) * 4;
        graphics.drawRoundedRect(15 + i * 4, 5 - height, 3, height * 2, 1);
    }
    graphics.endFill();
    
    // Holographic interface panels
    graphics.beginFill(0x001144, 0.4);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-48, -35, 20, 15, 4);
    graphics.drawRoundedRect(28, -35, 20, 15, 4);
    graphics.drawRoundedRect(-48, 5, 20, 12, 4);
    graphics.drawRoundedRect(28, 5, 20, 12, 4);
    graphics.endFill();
    
    // Interface button arrays
    const buttonColors = [0x00ff00, 0x0066ff, 0xff6600, 0xffff00];
    buttonColors.forEach((color, index) => {
        graphics.beginFill(color, 0.7);
        graphics.drawCircle(-43 + index * 4, -27, 1.5);
        graphics.drawCircle(33 + index * 4, -27, 1.5);
        graphics.endFill();
    });
    
    // Holographic text displays
    graphics.beginFill(0x002200, 0.5);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-45, 7, 16, 8, 2);
    graphics.drawRoundedRect(31, 7, 16, 8, 2);
    graphics.endFill();
    
    // Power indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-25, 32, 2);
    graphics.drawCircle(0, 32, 2);
    graphics.drawCircle(25, 32, 2);
    graphics.endFill();
    
    // Support columns
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-45, 40, 6, 15, 3);
    graphics.drawRoundedRect(-5, 40, 6, 15, 3);
    graphics.drawRoundedRect(35, 40, 6, 15, 3);
    graphics.endFill();
    
    holoContainer.addChild(graphics);
    
    // Add subtle pulsing animation for holographic effect
    let pulseTime = 0;
    const pulseAnimation = () => {
        pulseTime += 0.02;
        graphics.alpha = 0.9 + Math.sin(pulseTime) * 0.1;
        requestAnimationFrame(pulseAnimation);
    };
    pulseAnimation();

    const bounds = {
  x: x - 50,
  y: y - 40,
  width: 100,
  height: 95, // from -40 to 55
  label: "holodisplay"
};

if(colliders){
    addWithCollider(camera, holoContainer, bounds, colliders);
}

if (!window.interactables) window.interactables = [];
window.interactables.push({
  label: "holodisplay",
  bounds,
  message: "Live 3D rendering of local space, showing friendly, neutral, and hostile contacts",
  bubble: null,
});

    
    return holoContainer;
}

function createNavConsole(x, y, camera, colliders) {
    // Create main navigation console container
    const navContainer = new Container();
    navContainer.x = x;
    navContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main console base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-60, 15, 120, 25, 8);
    graphics.endFill();
    
    // Console surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-55, 10, 110, 20, 6);
    graphics.endFill();
    
    // Main navigation display
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-45, -25, 90, 35, 6);
    graphics.endFill();
    
    // Display bezel
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-43, -23, 86, 31, 4);
    graphics.endFill();
    
    // Navigation map display
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-41, -21, 82, 27, 3);
    graphics.endFill();
    
    // Radar/Map grid
    graphics.lineStyle(1, 0x004466, 0.4);
    graphics.drawCircle(0, -7, 15);
    graphics.drawCircle(0, -7, 10);
    graphics.drawCircle(0, -7, 5);
    
    // Grid lines
    graphics.moveTo(-15, -7);
    graphics.lineTo(15, -7);
    graphics.moveTo(0, -22);
    graphics.lineTo(0, 8);
    graphics.moveTo(-11, -18);
    graphics.lineTo(11, 4);
    graphics.moveTo(11, -18);
    graphics.lineTo(-11, 4);
    
    // Navigation waypoints
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-8, -15, 2);
    graphics.drawCircle(12, -10, 2);
    graphics.drawCircle(-5, 2, 2);
    graphics.drawCircle(8, -2, 2);
    graphics.endFill();
    
    // Current position indicator
    graphics.beginFill(0xff0000);
    graphics.drawCircle(0, -7, 3);
    graphics.endFill();
    
    // Compass display
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(25, -20, 15, 15, 3);
    graphics.endFill();
    
    // Compass needle
    graphics.lineStyle(2, 0x00ff00);
    graphics.moveTo(32, -17);
    graphics.lineTo(32, -9);
    graphics.lineStyle(1, 0xff0000);
    graphics.moveTo(32, -13);
    graphics.lineTo(32, -11);
    
    // Speed/Distance readout
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-40, -20, 15, 12, 3);
    graphics.endFill();
    
    // Speed bars
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 5; i++) {
        const height = 1 + i * 1.2;
        graphics.drawRect(-38 + i * 2.5, -11 - height, 2, height);
    }
    graphics.endFill();
    
    // Control button layout
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-50, 12, 100, 12, 4);
    graphics.endFill();
    
    // Navigation control buttons
    const navButtons = [
        {x: -40, y: 18, color: 0x00ff00, label: 'NAV'},
        {x: -25, y: 18, color: 0x0066ff, label: 'MAP'},
        {x: -10, y: 18, color: 0xff6600, label: 'WPT'},
        {x: 5, y: 18, color: 0xffff00, label: 'TRK'},
        {x: 20, y: 18, color: 0x00ffff, label: 'GPS'},
        {x: 35, y: 18, color: 0xff00ff, label: 'COM'}
    ];
    
    navButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawRoundedRect(btn.x - 5, btn.y - 3, 10, 6, 2);
        graphics.endFill();
    });
    
    // Side control panels
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-70, -20, 15, 40, 6);
    graphics.drawRoundedRect(55, -20, 15, 40, 6);
    graphics.endFill();
    
    // Left panel controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 6; i++) {
        graphics.drawRoundedRect(-67, -17 + i * 6, 9, 4, 2);
    }
    graphics.endFill();
    
    // Right panel controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 6; i++) {
        graphics.drawRoundedRect(58, -17 + i * 6, 9, 4, 2);
    }
    graphics.endFill();
    
    // Status LED array
    const statusColors = [0x00ff00, 0x00ff00, 0xff6600, 0x0066ff, 0x00ff00, 0xff0000];
    statusColors.forEach((color, index) => {
        graphics.beginFill(color);
        graphics.drawCircle(-62 + index * 2, -25, 1);
        graphics.drawCircle(60 + index * 2, -25, 1);
        graphics.endFill();
    });
    
    // Directional indicator lights
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(-10, -30, 3); // North
    graphics.drawCircle(10, -30, 3);  // South
    graphics.drawCircle(-20, -7, 3);  // West
    graphics.drawCircle(20, -7, 3);   // East
    graphics.endFill();
    
    // Emergency beacon
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(45, -15, 4);
    graphics.endFill();
    
    // Beacon center
    graphics.beginFill(0xffffff);
    graphics.drawCircle(45, -15, 1.5);
    graphics.endFill();
    
    // Communication array
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-15, 25, 30, 8, 3);
    graphics.endFill();
    
    // Antenna elements
    graphics.lineStyle(2, 0x666666);
    graphics.moveTo(-10, 25);
    graphics.lineTo(-10, 20);
    graphics.moveTo(-5, 25);
    graphics.lineTo(-5, 18);
    graphics.moveTo(0, 25);
    graphics.lineTo(0, 16);
    graphics.moveTo(5, 25);
    graphics.lineTo(5, 18);
    graphics.moveTo(10, 25);
    graphics.lineTo(10, 20);
    
    // Power distribution
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-25, 35, 50, 8, 4);
    graphics.endFill();
    
    // Power levels
    graphics.beginFill(0x00ff00);
    for (let i = 0; i < 8; i++) {
        graphics.drawRect(-22 + i * 5.5, 37, 4, 4);
    }
    graphics.endFill();
    
    // Support legs
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-60, 45, 6, 12, 3);
    graphics.drawRoundedRect(-20, 45, 6, 12, 3);
    graphics.drawRoundedRect(15, 45, 6, 12, 3);
    graphics.drawRoundedRect(55, 45, 6, 12, 3);
    graphics.endFill();
    
    navContainer.addChild(graphics);
    
    // Add subtle scanning animation for radar
    let scanTime = 0;
    const scanAnimation = () => {
        scanTime += 0.03;
        
        // Create scanning line effect
        const scanGraphics = new Graphics();
        scanGraphics.lineStyle(1, 0x00ff00, 0.5);
        const angle = scanTime;
        const x1 = Math.cos(angle) * 5;
        const y1 = -7 + Math.sin(angle) * 5;
        const x2 = Math.cos(angle) * 15;
        const y2 = -7 + Math.sin(angle) * 15;
        
        scanGraphics.moveTo(0, -7);
        scanGraphics.lineTo(x2, y2);
        
        // Remove old scan line and add new one
        if (navContainer.children.length > 1) {
            navContainer.removeChildAt(1);
        }
        navContainer.addChild(scanGraphics);
        
        requestAnimationFrame(scanAnimation);
    };
    scanAnimation();
    const bounds = {
  x: x - 70,
  y: y - 25,
  width: 140,
  height: 82,
  label: "navconsole"
};
    if(colliders)
        addWithCollider(camera, navContainer, bounds, colliders);
    
    return navContainer;
}

const createSpaceFloorTile = (x, y, size, roomType) => {
  const tile = new Graphics();
  
  // Get space-themed colors based on room type
  const colors = getSpaceFloorColors(roomType);
  const { baseColor, highlightColor, shadowColor, darkShadow, groutColor } = colors;
  
  // Main tile body
  tile.rect(x, y, size, size);
  tile.fill(baseColor);
  
  // Add subtle gradient effect with highlight
  tile.rect(x + 1, y + 1, size - 8, size - 8);
  tile.fill(highlightColor);
  
  // Inner tile area (main surface)
  tile.rect(x + 3, y + 3, size - 6, size - 6);
  tile.fill(baseColor);
  
  // Add realistic beveled edges
  // Top highlight
  tile.rect(x + 2, y + 2, size - 4, 1);
  tile.fill(highlightColor);
  
  // Left highlight
  tile.rect(x + 2, y + 2, 1, size - 4);
  tile.fill(highlightColor);
  
  // Bottom shadow
  tile.rect(x + 2, y + size - 3, size - 4, 1);
  tile.fill(shadowColor);
  
  // Right shadow
  tile.rect(x + size - 3, y + 2, 1, size - 4);
  tile.fill(shadowColor);
  
  // Deep corner shadows for more depth
  tile.rect(x + size - 2, y + size - 2, 2, 2);
  tile.fill(darkShadow);
  
  // Add room-specific surface details
  addSpaceFloorDetails(tile, x, y, size, roomType, colors);
  
  // Enhanced border/grout line
  tile.stroke({ width: 2, color: groutColor });
  
  // Add slight wear pattern (diagonal line) - more subtle for space
  tile.moveTo(x + size * 0.1, y + size * 0.9);
  tile.lineTo(x + size * 0.9, y + size * 0.1);
  tile.stroke({ width: 0.3, color: shadowColor, alpha: 0.2 });
  
  return tile;
};

const getSpaceFloorColors = (roomType) => {
  const colorSchemes = {
    bridge: {
      baseColor: 0x2a3f5f,       // Deep blue
      highlightColor: 0x3a5f8f,  // Lighter blue
      shadowColor: 0x1a2f4f,     // Darker blue
      darkShadow: 0x0a1f3f,      // Very dark blue
      groutColor: 0x1a1a2a       // Dark grout
    },
    observation: {
      baseColor: 0x1f1f3f,       // Very deep blue
      highlightColor: 0x2f2f5f,  // Slightly lighter
      shadowColor: 0x0f0f2f,     // Darker
      darkShadow: 0x05051f,      // Very dark
      groutColor: 0x151520       // Dark grout
    },
    communications: {
      baseColor: 0x2f3f2f,       // Dark green-blue
      highlightColor: 0x3f5f4f,  // Lighter green-blue
      shadowColor: 0x1f2f1f,     // Darker green
      darkShadow: 0x0f1f0f,      // Very dark green
      groutColor: 0x1a1f1a       // Dark green grout
    },
    corridor: {
      baseColor: 0x3f3f3f,       // Medium gray
      highlightColor: 0x5f5f5f,  // Lighter gray
      shadowColor: 0x2f2f2f,     // Darker gray
      darkShadow: 0x1f1f1f,      // Very dark gray
      groutColor: 0x2a2a2a       // Dark gray grout
    },
    med_bay: {
      baseColor: 0x2f4f2f,       // Medical green
      highlightColor: 0x4f7f4f,  // Lighter green
      shadowColor: 0x1f3f1f,     // Darker green
      darkShadow: 0x0f2f0f,      // Very dark green
      groutColor: 0x1a2a1a       // Dark green grout
    },
    lab: {
      baseColor: 0x4f2f4f,       // Purple
      highlightColor: 0x7f4f7f,  // Lighter purple
      shadowColor: 0x3f1f3f,     // Darker purple
      darkShadow: 0x2f0f2f,      // Very dark purple
      groutColor: 0x2a1a2a       // Dark purple grout
    },
    engineering: {
      baseColor: 0x5f4f2f,       // Orange-brown
      highlightColor: 0x8f7f4f,  // Lighter orange
      shadowColor: 0x4f3f1f,     // Darker orange
      darkShadow: 0x3f2f0f,      // Very dark orange
      groutColor: 0x2a221a       // Dark orange grout
    },
    storage: {
      baseColor: 0x5f4f2f,       // Orange-brown
      highlightColor: 0x8f7f4f,  // Lighter orange
      shadowColor: 0x4f3f1f,     // Darker orange
      darkShadow: 0x3f2f0f,      // Very dark orange
      groutColor: 0x2a221a      // Dark gray grout
    },
    reactor: {
      baseColor: 0x5f2f2f,       // Deep red
      highlightColor: 0x8f4f4f,  // Lighter red
      shadowColor: 0x4f1f1f,     // Darker red
      darkShadow: 0x3f0f0f,      // Very dark red
      groutColor: 0x2a1a1a       // Dark red grout
    },
    quarters: {
      baseColor: 0x2f2f2f,       // Dark gray
      highlightColor: 0x4f4f4f,  // Lighter gray
      shadowColor: 0x1f1f1f,     // Darker gray
      darkShadow: 0x0f0f0f,      // Very dark gray
      groutColor: 0x1a1a1a       // Very dark grout
    },
    cafeteria: {
      baseColor: 0x3f3f2f,       // Warm gray
      highlightColor: 0x5f5f4f,  // Lighter warm gray
      shadowColor: 0x2f2f1f,     // Darker warm gray
      darkShadow: 0x1f1f0f,      // Very dark warm gray
      groutColor: 0x202018       // Dark warm grout
    },
    recreation: {
      baseColor: 0x2f3f4f,       // Blue-gray
      highlightColor: 0x4f5f7f,  // Lighter blue-gray
      shadowColor: 0x1f2f3f,     // Darker blue-gray
      darkShadow: 0x0f1f2f,      // Very dark blue-gray
      groutColor: 0x1a1f2a       // Dark blue grout
    }
  };
  
  return colorSchemes[roomType] || colorSchemes.corridor;
};

const addSpaceFloorDetails = (tile, x, y, size, roomType, colors) => {
  const { highlightColor, shadowColor } = colors;
  
  switch (roomType) {
    case 'bridge':
      // Command center pattern - cross pattern
      tile.rect(x + size * 0.4, y + size * 0.1, size * 0.2, size * 0.8);
      tile.fill(shadowColor);
      tile.rect(x + size * 0.1, y + size * 0.4, size * 0.8, size * 0.2);
      tile.fill(shadowColor);
      break;
      
    case 'med_bay':
      // Medical cross symbol
      tile.rect(x + size * 0.4, y + size * 0.2, size * 0.2, size * 0.6);
      tile.fill(highlightColor);
      tile.rect(x + size * 0.2, y + size * 0.4, size * 0.6, size * 0.2);
      tile.fill(highlightColor);
      break;
      
    case 'engineering':
      // Gear-like pattern
      tile.circle(x + size * 0.5, y + size * 0.5, size * 0.15);
      tile.fill(shadowColor);
      tile.circle(x + size * 0.5, y + size * 0.5, size * 0.08);
      tile.fill(highlightColor);
      break;
      
    case 'reactor':
      // Radiation warning pattern
      tile.circle(x + size * 0.5, y + size * 0.5, size * 0.2);
      tile.fill(shadowColor);
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const centerX = x + size * 0.5 + Math.cos(angle) * size * 0.15;
        const centerY = y + size * 0.5 + Math.sin(angle) * size * 0.15;
        tile.circle(centerX, centerY, size * 0.05);
        tile.fill(highlightColor);
      }
      break;
      
    case 'corridor':
      // Directional arrows
      tile.moveTo(x + size * 0.2, y + size * 0.5);
      tile.lineTo(x + size * 0.8, y + size * 0.5);
      tile.lineTo(x + size * 0.7, y + size * 0.3);
      tile.moveTo(x + size * 0.8, y + size * 0.5);
      tile.lineTo(x + size * 0.7, y + size * 0.7);
      tile.stroke({ width: 1, color: shadowColor, alpha: 0.5 });
      break;
      
    default:
      // Default pattern - small dots
      tile.circle(x + size * 0.3, y + size * 0.3, 0.5);
      tile.fill(highlightColor);
      tile.circle(x + size * 0.7, y + size * 0.2, 0.5);
      tile.fill(shadowColor);
      tile.circle(x + size * 0.2, y + size * 0.8, 0.5);
      tile.fill(shadowColor);
      tile.circle(x + size * 0.8, y + size * 0.7, 0.5);
      tile.fill(highlightColor);
      break;
  }
};

      const willCollide = (x, y, colliders) => {
        const bounds = {
          x: x + PLAYER_BOUNDS.offsetX,
          y: y + PLAYER_BOUNDS.offsetY,
          width: PLAYER_BOUNDS.width,
          height: PLAYER_BOUNDS.height,
        };

        return colliders.some(
          (col) =>
            bounds.x < col.x + col.width &&
            bounds.x + bounds.width > col.x &&
            bounds.y < col.y + col.height &&
            bounds.y + bounds.height > col.y
        );
      };

const createSpaceWalls = (width, height, row, col, layout, colliders, offsetX, offsetY, connections = {}) => {
  const walls = [];
  const thick = 24;        // Thick hull walls
  const thin = 12;         // Thin interior walls
  const airlockSize = 80;  // Airlock door size

  const wallColor = 0x2a2a2a;
  const wallHighlight = 0x4a4a4a;
  const wallShadow = 0x1a1a1a;

  // ─── Top Wall ───
  const topThickness = row === 0 ? thick : thin;
  const topWall = new Graphics();
  const hasTopDoor = connections.top;
  const airlockOffsets = connections.airlockOffsets || {};

  if (hasTopDoor) {
    const start = width / 2 - airlockSize / 2 + airlockOffsets.top;
    const end = start + airlockSize;

    topWall.beginFill(wallColor);
    topWall.drawRect(0, 0, start, topThickness);
    topWall.drawRect(end, 0, width - end, topThickness);
    topWall.endFill();

    createAirlockDoor(topWall, start, 0, airlockSize, topThickness, 'horizontal');
    // Left of airlock
colliders.push({
  x: offsetX + 0,
  y: offsetY + 0,
  width: start,
  height: topThickness,
});

// Right of airlock
colliders.push({
  x: offsetX + end,
  y: offsetY + 0,
  width: width - end,
  height: topThickness,
});
  } else {
    topWall.beginFill(wallColor);
    topWall.drawRect(0, 0, width, topThickness);
    topWall.endFill();
    colliders.push({
  x: offsetX,
  y: offsetY,
  width,
  height: topThickness,
});

  }

  // Highlight + shadow
  topWall.beginFill(wallHighlight);
  topWall.drawRect(0, 0, width, 2);
  topWall.endFill();

  topWall.beginFill(wallShadow);
  topWall.drawRect(0, topThickness - 2, width, 2);
  topWall.endFill();

  walls.push(topWall);

  // ─── Bottom Wall ───
  const bottomThickness = row === layout.length - 1 ? thick : thin;
  const bottomWall = new Graphics();
  const bottomY = height - bottomThickness;
  const hasBottomDoor = connections.bottom;

  if (hasBottomDoor) {
    const start = width / 2 - airlockSize / 2 + airlockOffsets.bottom;
    const end = start + airlockSize;

    bottomWall.beginFill(wallColor);
    bottomWall.drawRect(0, bottomY, start, bottomThickness);
    bottomWall.drawRect(end, bottomY, width - end, bottomThickness);
    bottomWall.endFill();

    createAirlockDoor(bottomWall, start, bottomY, airlockSize, bottomThickness, 'horizontal');
    colliders.push({
    x: offsetX,
    y: offsetY + bottomY,
    width: start,
    height: bottomThickness,
  });
  colliders.push({
    x: offsetX + end,
    y: offsetY + bottomY,
    width: width - end,
    height: bottomThickness,
  });
  } else {
    bottomWall.beginFill(wallColor);
    bottomWall.drawRect(0, bottomY, width, bottomThickness);
    bottomWall.endFill();
     colliders.push({
    x: offsetX,
    y: offsetY + bottomY,
    width,
    height: bottomThickness,
  });
  }

  bottomWall.beginFill(wallHighlight);
  bottomWall.drawRect(0, bottomY, width, 2);
  bottomWall.endFill();

  bottomWall.beginFill(wallShadow);
  bottomWall.drawRect(0, bottomY + bottomThickness - 2, width, 2);
  bottomWall.endFill();

  walls.push(bottomWall);

  // ─── Left Wall ───
  const leftThickness = col === 0 ? thick : thin;
  const leftWall = new Graphics();
  const hasLeftDoor = connections.left;

  if (hasLeftDoor) {
    const start = height / 2 - airlockSize / 2 + airlockOffsets.left;
    const end = start + airlockSize;

    leftWall.beginFill(wallColor);
    leftWall.drawRect(0, 0, leftThickness, start);
    leftWall.drawRect(0, end, leftThickness, height - end);
    leftWall.endFill();

    createAirlockDoor(leftWall, 0, start, leftThickness, airlockSize, 'vertical');
    colliders.push({
    x: offsetX,
    y: offsetY,
    width: leftThickness,
    height: start,
  });
  colliders.push({
    x: offsetX,
    y: offsetY + end,
    width: leftThickness,
    height: height - end,
  });
  } else {
    leftWall.beginFill(wallColor);
    leftWall.drawRect(0, 0, leftThickness, height);
    leftWall.endFill();
    colliders.push({
    x: offsetX,
    y: offsetY,
    width: leftThickness,
    height: height,
  });
  }

  leftWall.beginFill(wallHighlight);
  leftWall.drawRect(0, 0, 2, height);
  leftWall.endFill();

  leftWall.beginFill(wallShadow);
  leftWall.drawRect(leftThickness - 2, 0, 2, height);
  leftWall.endFill();

  walls.push(leftWall);

  // ─── Right Wall ───
  const rightThickness = col === layout[row].length - 1 ? thick : thin;
  const rightWall = new Graphics();
  const rightX = width - rightThickness;
  const hasRightDoor = connections.right;

  if (hasRightDoor) {
    const start = height / 2 - airlockSize / 2 + airlockOffsets.right;
    const end = start + airlockSize;

    rightWall.beginFill(wallColor);
    rightWall.drawRect(rightX, 0, rightThickness, start);
    rightWall.drawRect(rightX, end, rightThickness, height - end);
    rightWall.endFill();

    createAirlockDoor(rightWall, rightX, start, rightThickness, airlockSize, 'vertical');
     colliders.push({
    x: offsetX + rightX,
    y: offsetY,
    width: rightThickness,
    height: start,
  });
  colliders.push({
    x: offsetX + rightX,
    y: offsetY + end,
    width: rightThickness,
    height: height - end,
  });
  } else {
    rightWall.beginFill(wallColor);
    rightWall.drawRect(rightX, 0, rightThickness, height);
    rightWall.endFill();
     colliders.push({
    x: offsetX + rightX,
    y: offsetY,
    width: rightThickness,
    height: height,
  });
  }

  rightWall.beginFill(wallHighlight);
  rightWall.drawRect(rightX, 0, 2, height);
  rightWall.endFill();

  rightWall.beginFill(wallShadow);
  rightWall.drawRect(rightX + rightThickness - 2, 0, 2, height);
  rightWall.endFill();

  walls.push(rightWall);

  return walls;
};


const createAirlockDoor = (wall, x, y, width, height, orientation) => {
  // Transparent bluish glass panel
  wall.beginFill(0x004466, 0.3);
  wall.drawRect(x, y, width, height);
  wall.endFill();

  if (orientation === 'horizontal') {
    // Top highlight
    wall.beginFill(0x0066aa, 0.4);
    wall.drawRect(x + 5, y, width - 10, 2);
    wall.endFill();

    // Bottom shadow
    wall.beginFill(0x002244, 0.4);
    wall.drawRect(x + 5, y + height - 2, width - 10, 2);
    wall.endFill();

    // Center line
    wall.beginFill(0x002244, 0.4);
    wall.drawRect(x + width / 2 - 1, y + 2, 2, height - 4);
    wall.endFill();
  } else {
    // Left highlight
    wall.beginFill(0x0066aa, 0.4);
    wall.drawRect(x, y + 5, 2, height - 10);
    wall.endFill();

    // Right shadow
    wall.beginFill(0x002244, 0.4);
    wall.drawRect(x + width - 2, y + 5, 2, height - 10);
    wall.endFill();

    // Center line
    wall.beginFill(0x002244, 0.4);
    wall.drawRect(x + 2, y + height / 2 - 1, width - 4, 2);
    wall.endFill();
  }
};

function createControlStation(x, y, camera, colliders) {
    // Create main station container
    const stationContainer = new Container();
    stationContainer.x = x;
    stationContainer.y = y;
    stationContainer.zIndex = 1;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main station base (hexagonal design)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.moveTo(0, -50);
    graphics.lineTo(43, -25);
    graphics.lineTo(43, 25);
    graphics.lineTo(0, 50);
    graphics.lineTo(-43, 25);
    graphics.lineTo(-43, -25);
    graphics.closePath();
    graphics.endFill();
    
    // Inner hexagonal frame
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x2a2a2a);
    graphics.moveTo(0, -42);
    graphics.lineTo(36, -21);
    graphics.lineTo(36, 21);
    graphics.lineTo(0, 42);
    graphics.lineTo(-36, 21);
    graphics.lineTo(-36, -21);
    graphics.closePath();
    graphics.endFill();
    
    // Central command hub
    graphics.beginFill(0x001133);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawCircle(0, 0, 25);
    graphics.endFill();
    
    // Central holographic display
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x00aaff);
    graphics.drawCircle(0, 0, 18);
    graphics.endFill();
    
    // Command center cross-hairs
    graphics.lineStyle(2, 0x00ff66);
    graphics.moveTo(-15, 0);
    graphics.lineTo(15, 0);
    graphics.moveTo(0, -15);
    graphics.lineTo(0, 15);
    
    // Inner targeting rings
    graphics.lineStyle(1, 0x00ccff, 0.6);
    graphics.drawCircle(0, 0, 8);
    graphics.drawCircle(0, 0, 12);
    
    // Six control panels around the hexagon
    const panelPositions = [
        { x: 0, y: -35, rotation: 0 },
        { x: 30, y: -17, rotation: 60 },
        { x: 30, y: 17, rotation: 120 },
        { x: 0, y: 35, rotation: 180 },
        { x: -30, y: 17, rotation: 240 },
        { x: -30, y: -17, rotation: 300 }
    ];
    
    panelPositions.forEach((panel, index) => {
        // Panel background
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(1, 0x444444);
        graphics.drawRoundedRect(panel.x - 8, panel.y - 6, 16, 12, 2);
        graphics.endFill();
        
        // Panel screen
        graphics.beginFill(0x0d1a0d);
        graphics.lineStyle(1, 0x00ff66, 0.5);
        graphics.drawRoundedRect(panel.x - 6, panel.y - 4, 12, 8, 1);
        graphics.endFill();
        
        // Panel indicators
        const colors = [0x00ff00, 0xff6600, 0x0066ff, 0xff0000, 0x00ccff, 0xff00ff];
        graphics.beginFill(colors[index]);
        graphics.drawRect(panel.x - 4, panel.y - 2, 8, 1);
        graphics.drawRect(panel.x - 4, panel.y + 1, 8, 1);
        graphics.endFill();
        
        // Status LED
        graphics.beginFill(colors[index]);
        graphics.drawCircle(panel.x + 10, panel.y, 2);
        graphics.endFill();
    });
    
    // Power conduits connecting panels
    graphics.lineStyle(2, 0x0099ff, 0.4);
    graphics.moveTo(0, -25);
    graphics.lineTo(0, -35);
    graphics.moveTo(22, -12);
    graphics.lineTo(30, -17);
    graphics.moveTo(22, 12);
    graphics.lineTo(30, 17);
    graphics.moveTo(0, 25);
    graphics.lineTo(0, 35);
    graphics.moveTo(-22, 12);
    graphics.lineTo(-30, 17);
    graphics.moveTo(-22, -12);
    graphics.lineTo(-30, -17);
    
    // Corner data terminals
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-40, -40, 6, 10, 1);
    graphics.drawRoundedRect(34, -40, 6, 10, 1);
    graphics.drawRoundedRect(34, 30, 6, 10, 1);
    graphics.drawRoundedRect(-40, 30, 6, 10, 1);
    graphics.endFill();
    
    // Terminal screens
    graphics.beginFill(0x001a00);
    graphics.drawRect(-38, -38, 2, 6);
    graphics.drawRect(36, -38, 2, 6);
    graphics.drawRect(36, 32, 2, 6);
    graphics.drawRect(-38, 32, 2, 6);
    graphics.endFill();
    
    // Data flow lines
    graphics.lineStyle(1, 0x00ff66, 0.3);
    graphics.moveTo(-37, -35);
    graphics.lineTo(-30, -25);
    graphics.moveTo(37, -35);
    graphics.lineTo(30, -25);
    graphics.moveTo(37, 35);
    graphics.lineTo(30, 25);
    graphics.moveTo(-37, 35);
    graphics.lineTo(-30, 25);
    
    // Central power core
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x00aaff);
    graphics.drawCircle(0, 0, 5);
    graphics.endFill();
    
    // Power core pulsing ring
    graphics.lineStyle(2, 0x00ffff, 0.8);
    graphics.drawCircle(0, 0, 3);
    
    // Structural supports
    graphics.lineStyle(3, 0x2a2a2a);
    graphics.moveTo(-30, -30);
    graphics.lineTo(30, 30);
    graphics.moveTo(30, -30);
    graphics.lineTo(-30, 30);
    
    // Add graphics to container
    stationContainer.addChild(graphics);
    
    // Create animated elements
    const createRotatingElement = (radius, color, speed) => {
        const element = new Graphics();
        element.beginFill(color);
        element.drawRect(-1, -8, 2, 16);
        element.endFill();
        element.alpha = 0.6;
        
        let rotation = 0;
        const animate = () => {
            rotation += speed;
            element.x = Math.cos(rotation) * radius;
            element.y = Math.sin(rotation) * radius;
            element.rotation = rotation;
            requestAnimationFrame(animate);
        };
        animate();
        return element;
    };
    
    // Add rotating scanner arms
    const scanner1 = createRotatingElement(20, 0x00ff66, 0.02);
    const scanner2 = createRotatingElement(22, 0x00ccff, -0.015);
    const scanner3 = createRotatingElement(24, 0xff6600, 0.01);
    
    stationContainer.addChild(scanner1);
    stationContainer.addChild(scanner2);
    stationContainer.addChild(scanner3);
    
    // Pulsing power core
    const powerCore = new Graphics();
    powerCore.beginFill(0x00ffff);
    powerCore.drawCircle(0, 0, 3);
    powerCore.endFill();
    
    let pulse = 0;
    const animatePulse = () => {
        pulse += 0.1;
        powerCore.alpha = 0.4 + Math.sin(pulse) * 0.4;
        powerCore.scale.set(0.8 + Math.sin(pulse) * 0.3);
        requestAnimationFrame(animatePulse);
    };
    animatePulse();
    
    stationContainer.addChild(powerCore);
    
    // Data stream animation
    const dataStream = new Graphics();
    let streamOffset = 0;
    
    const animateDataStream = () => {
        streamOffset += 0.5;
        dataStream.clear();
        dataStream.lineStyle(1, 0x00ff66, 0.6);
        
        // Create flowing data points
        for (let i = 0; i < 6; i++) {
            const angle = (i * 60 + streamOffset) * Math.PI / 180;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            dataStream.drawCircle(x, y, 1);
        }
        
        requestAnimationFrame(animateDataStream);
    };
    animateDataStream();
    
    stationContainer.addChild(dataStream);
            const bounds = {
  x: x - 45,
  y: y - 52,
  width: 90,
  height: 104,
  label: "controlstation"
};
if(colliders){
    addWithCollider(camera, stationContainer, bounds, colliders);
}

 if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "controlstation",
          bounds,
          message: "Accessing the main sensor array. Distant stars and unseen threats flicker across these screens",
          bubble: null,
        });
    
    return stationContainer;
}

function createBridgeStation(x, y, camera, colliders) {
    // Create main bridge station container
    const bridgeContainer = new Container();
    bridgeContainer.x = x;
    bridgeContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main bridge station base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-90, 20, 180, 40, 12);
    graphics.endFill();
    
    // Station surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-87, 17, 174, 37, 10);
    graphics.endFill();
    
    // Main bridge housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-85, -60, 170, 80, 15);
    graphics.endFill();
    
    // Primary tactical display
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-80, -55, 160, 60, 12);
    graphics.endFill();
    
    // Main viewscreen frame
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-77, -52, 154, 54, 10);
    graphics.endFill();
    
    // Central viewscreen
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-75, -50, 150, 50, 8);
    graphics.endFill();
    
    // Navigation grid overlay
    graphics.lineStyle(1, 0x004466, 0.3);
    for (let i = 0; i <= 15; i++) {
        graphics.moveTo(-75 + i * 10, -50);
        graphics.lineTo(-75 + i * 10, 0);
    }
    for (let i = 0; i <= 5; i++) {
        graphics.moveTo(-75, -50 + i * 10);
        graphics.lineTo(75, -50 + i * 10);
    }
    
    // Central navigation hub
    graphics.beginFill(0x002244);
    graphics.lineStyle(2, 0x0088cc);
    graphics.drawCircle(0, -25, 15);
    graphics.endFill();
    
    // Hub core
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(0, -25, 8);
    graphics.endFill();
    
    // Navigation waypoints
    graphics.beginFill(0x00ff66);
    const waypoints = [
        {x: -45, y: -35, size: 2},
        {x: -20, y: -40, size: 1.5},
        {x: 25, y: -30, size: 2},
        {x: 50, y: -35, size: 1.5},
        {x: -30, y: -15, size: 1.5},
        {x: 35, y: -20, size: 2},
        {x: -55, y: -20, size: 1.5},
        {x: 60, y: -15, size: 1.5}
    ];
    
    waypoints.forEach(wp => {
        graphics.drawCircle(wp.x, wp.y, wp.size);
    });
    graphics.endFill();
    
    // Navigation routes
    graphics.lineStyle(1, 0x00cc66, 0.4);
    graphics.moveTo(-45, -35);
    graphics.lineTo(-20, -40);
    graphics.lineTo(25, -30);
    graphics.lineTo(50, -35);
    graphics.moveTo(-30, -15);
    graphics.lineTo(35, -20);
    
    // Ship status displays
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-78, -47, 30, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-45, -47, 30, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(-12, -47, 30, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0x110011);
    graphics.lineStyle(1, 0xcc44cc);
    graphics.drawRoundedRect(21, -47, 30, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0x111100);
    graphics.lineStyle(1, 0xcccc44);
    graphics.drawRoundedRect(54, -47, 21, 12, 3);
    graphics.endFill();
    
    // System status bars
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 10; i++) {
        const height = 1 + Math.sin(i * 0.6) * 2 + 1.5;
        graphics.drawRect(-76 + i * 2.5, -40 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 10; i++) {
        const height = 1 + Math.cos(i * 0.5) * 2 + 1.5;
        graphics.drawRect(-43 + i * 2.5, -40 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0x6600ff);
    for (let i = 0; i < 10; i++) {
        const height = 1 + Math.sin(i * 0.8 + 1) * 2 + 1.5;
        graphics.drawRect(-10 + i * 2.5, -40 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff66cc);
    for (let i = 0; i < 10; i++) {
        const height = 1 + Math.cos(i * 0.4 + 2) * 2 + 1.5;
        graphics.drawRect(23 + i * 2.5, -40 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xffff66);
    for (let i = 0; i < 7; i++) {
        const height = 1 + Math.sin(i * 0.7 + 3) * 2 + 1.5;
        graphics.drawRect(56 + i * 2.5, -40 - height, 2, height);
    }
    graphics.endFill();
    
    // Communications array
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-70, -18, 35, 15, 3);
    graphics.endFill();
    
    graphics.beginFill(0x220000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(35, -18, 35, 15, 3);
    graphics.endFill();
    
    // Communication indicators
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 3; j++) {
            const alpha = 0.3 + Math.sin(i * 0.5 + j * 0.8) * 0.4;
            graphics.beginFill(0x00ff66, alpha);
            graphics.drawCircle(-65 + i * 4, -15 + j * 4, 1);
        }
    }
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 3; j++) {
            const alpha = 0.3 + Math.cos(i * 0.6 + j * 0.9) * 0.4;
            graphics.beginFill(0xff6600, alpha);
            graphics.drawCircle(40 + i * 4, -15 + j * 4, 1);
        }
    }
    graphics.endFill();
    
    // Left command console
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-95, -40, 20, 80, 10);
    graphics.endFill();
    
    // Command controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 6; i++) {
        graphics.drawRoundedRect(-92, -35 + i * 11, 14, 4, 2);
    }
    graphics.endFill();
    
    // Control sliders
    graphics.beginFill(0x0066cc);
    graphics.drawRoundedRect(-90, -34, 3, 2, 1);
    graphics.drawRoundedRect(-87, -23, 3, 2, 1);
    graphics.drawRoundedRect(-84, -12, 3, 2, 1);
    graphics.drawRoundedRect(-88, -1, 3, 2, 1);
    graphics.drawRoundedRect(-86, 10, 3, 2, 1);
    graphics.drawRoundedRect(-89, 21, 3, 2, 1);
    graphics.endFill();
    
    // Command interface buttons
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(-85, -45, 4);
    graphics.drawCircle(-85, 30, 4);
    graphics.endFill();
    
    // Button indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-85, -45, 2);
    graphics.beginFill(0xff0000);
    graphics.drawCircle(-85, 30, 2);
    graphics.endFill();
    
    // Right command console
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(75, -40, 20, 80, 10);
    graphics.endFill();
    
    // Tactical control matrix
    const tacMatrix = [
        [0x00ff00, 0xff0000, 0x0066ff, 0xff6600],
        [0x00ffff, 0xff00ff, 0x66ff00, 0xffff00],
        [0x0066cc, 0xcc6600, 0x6600cc, 0xcc0066],
        [0x00cc66, 0xcc0066, 0x66cc00, 0xcc6600],
        [0x0088cc, 0xcc8800, 0x8800cc, 0xcc0088],
        [0x00aacc, 0xccaa00, 0xaa00cc, 0xcc00aa]
    ];
    
    tacMatrix.forEach((row, i) => {
        row.forEach((color, j) => {
            graphics.beginFill(color);
            graphics.lineStyle(1, 0x333333);
            graphics.drawRoundedRect(78 + j * 3.5, -37 + i * 6, 3, 4, 1);
            graphics.endFill();
        });
    });
    
    // Emergency bridge lockdown
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(85, 30, 6);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(85, 30, 3);
    graphics.endFill();
    
    // Main bridge interface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-80, 5, 160, 20, 6);
    graphics.endFill();
    
    // Primary bridge controls
    const bridgeControls = [
        {x: -70, y: 15, color: 0x00ff00, size: 8},
        {x: -50, y: 15, color: 0xff0000, size: 8},
        {x: -30, y: 15, color: 0x0066ff, size: 8},
        {x: -10, y: 15, color: 0xff6600, size: 8},
        {x: 10, y: 15, color: 0x00ffff, size: 8},
        {x: 30, y: 15, color: 0xff00ff, size: 8},
        {x: 50, y: 15, color: 0x66ff00, size: 8},
        {x: 70, y: 15, color: 0xffff00, size: 8}
    ];
    
    bridgeControls.forEach(ctrl => {
        graphics.beginFill(ctrl.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawRoundedRect(ctrl.x - ctrl.size/2, ctrl.y - 3, ctrl.size, 6, 3);
        graphics.endFill();
    });
    
    // Bridge status monitoring
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-40, 27, 80, 25, 8);
    graphics.endFill();
    
    // Bridge system status
    const bridgeStatus = [
        {x: -35, y: 32, color: 0x00ff00}, {x: -30, y: 32, color: 0x00ff00},
        {x: -25, y: 32, color: 0xff6600}, {x: -20, y: 32, color: 0x00ff00},
        {x: -15, y: 32, color: 0x00ff00}, {x: -10, y: 32, color: 0x0066ff},
        {x: -5, y: 32, color: 0x00ff00}, {x: 0, y: 32, color: 0x00ff00},
        {x: 5, y: 32, color: 0xff0000}, {x: 10, y: 32, color: 0x00ff00},
        {x: 15, y: 32, color: 0x00ff00}, {x: 20, y: 32, color: 0x00ff00},
        {x: 25, y: 32, color: 0xffff00}, {x: 30, y: 32, color: 0x00ff00},
        {x: 35, y: 32, color: 0x00ff00},
        {x: -35, y: 37, color: 0x00ff00}, {x: -30, y: 37, color: 0x00ff00},
        {x: -25, y: 37, color: 0x00ff00}, {x: -20, y: 37, color: 0x00ff00},
        {x: -15, y: 37, color: 0x00ff00}, {x: -10, y: 37, color: 0x00ff00},
        {x: -5, y: 37, color: 0x00ff00}, {x: 0, y: 37, color: 0x00ff00},
        {x: 5, y: 37, color: 0x00ff00}, {x: 10, y: 37, color: 0x00ff00},
        {x: 15, y: 37, color: 0x00ff00}, {x: 20, y: 37, color: 0x00ff00},
        {x: 25, y: 37, color: 0x00ff00}, {x: 30, y: 37, color: 0x00ff00},
        {x: 35, y: 37, color: 0x00ff00},
        {x: -35, y: 42, color: 0x00ff00}, {x: -30, y: 42, color: 0x00ff00},
        {x: -25, y: 42, color: 0x00ff00}, {x: -20, y: 42, color: 0x00ff00},
        {x: -15, y: 42, color: 0x00ff00}, {x: -10, y: 42, color: 0x00ff00},
        {x: -5, y: 42, color: 0x00ff00}, {x: 0, y: 42, color: 0x00ff00},
        {x: 5, y: 42, color: 0x00ff00}, {x: 10, y: 42, color: 0x00ff00},
        {x: 15, y: 42, color: 0x00ff00}, {x: 20, y: 42, color: 0x00ff00},
        {x: 25, y: 42, color: 0x00ff00}, {x: 30, y: 42, color: 0x00ff00},
        {x: 35, y: 42, color: 0x00ff00}
    ];
    
    bridgeStatus.forEach(status => {
        graphics.beginFill(status.color);
        graphics.drawCircle(status.x, status.y, 1.5);
        graphics.endFill();
    });
    
    // Bridge support columns
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-85, 55, 10, 25, 5);
    graphics.drawRoundedRect(-35, 55, 10, 25, 5);
    graphics.drawRoundedRect(25, 55, 10, 25, 5);
    graphics.drawRoundedRect(75, 55, 10, 25, 5);
    graphics.endFill();
    
    // Data connection ports
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-100, 15, 6, 4, 2);
    graphics.drawRoundedRect(-100, 22, 6, 4, 2);
    graphics.drawRoundedRect(-100, 29, 6, 4, 2);
    graphics.drawRoundedRect(94, 15, 6, 4, 2);
    graphics.drawRoundedRect(94, 22, 6, 4, 2);
    graphics.drawRoundedRect(94, 29, 6, 4, 2);
    graphics.endFill();
    
    // Power status indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-85, 65, 2);
    graphics.drawCircle(-35, 65, 2);
    graphics.drawCircle(30, 65, 2);
    graphics.drawCircle(80, 65, 2);
    graphics.endFill();
    
    // Add graphics to container
    bridgeContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    bridgeContainer.addChild(animatedElements);
    
    // Animation for tactical display and system activity
    let animationTime = 0;
    
    const animateBridge = () => {
        animationTime += 0.04;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate tactical scanning sweep
        const sweepAngle = animationTime * 2;
        const sweepRadius = 50;
        animatedElements.lineStyle(2, 0x00ff88, 0.5);
        for (let i = 0; i < 3; i++) {
            const angle = sweepAngle + i * 2.094; // 120 degrees apart
            const sweepX = Math.cos(angle) * sweepRadius;
            const sweepY = -25 + Math.sin(angle) * sweepRadius;
            animatedElements.moveTo(0, -25);
            animatedElements.lineTo(sweepX, sweepY);
        }
        
        // Animate navigation route updates
        animatedElements.lineStyle(2, 0x00ccff, 0.6);
        const routeProgress = (animationTime * 30) % 150;
        animatedElements.moveTo(-75 + routeProgress, -50);
        animatedElements.lineTo(-75 + routeProgress, 0);
        
        // Animate central hub pulsing
        const hubAlpha = 0.4 + Math.sin(animationTime * 3) * 0.3;
        animatedElements.beginFill(0x00aaff, hubAlpha);
        animatedElements.drawCircle(0, -25, 5);
        animatedElements.endFill();
        
        // Animate communication signals
        for (let i = 0; i < 4; i++) {
            const signalAlpha = 0.2 + Math.sin(animationTime * 4 + i * 1.57) * 0.4;
            animatedElements.beginFill(0x00ff66, signalAlpha);
            animatedElements.drawCircle(-52 + i * 15, -10, 2);
            animatedElements.endFill();
            
            animatedElements.beginFill(0xff6600, signalAlpha);
            animatedElements.drawCircle(52 + i * 15, -10, 2);
            animatedElements.endFill();
        }
        
        // Animate tactical waypoint connections
        animatedElements.lineStyle(1, 0x66ff00, 0.5);
        waypoints.forEach((wp, index) => {
            const connectAlpha = 0.3 + Math.sin(animationTime * 2 + index * 0.8) * 0.4;
            animatedElements.lineStyle(1, 0x66ff00, connectAlpha);
            animatedElements.moveTo(0, -25);
            animatedElements.lineTo(wp.x, wp.y);
        });
        
        requestAnimationFrame(animateBridge);
    };
    
    // Start animation
    animateBridge();
    
    // Provide external animate method
    bridgeContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 100,
  y: y - 60,
  width: 200,
  height: 140,
  label: "bridgestation"
};

if(colliders){
    addWithCollider(camera, bridgeContainer, bounds, colliders);
}

if (!window.interactables) window.interactables = [];
window.interactables.push({
  label: "bridgestation",
  bounds,
  message: "Scans of uncharted nebulae and distant civilizations flicker across these holographic displays",
  bubble: null,
});
    
    return bridgeContainer;
}

function createTelescope(x, y, camera, colliders) {
    // Create main telescope container
    const telescopeContainer = new Container();
    telescopeContainer.x = x;
    telescopeContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main telescope base/mount
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-15, 60, 30, 25, 8);
    graphics.endFill();
    
    // Base platform
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-25, 80, 50, 12, 6);
    graphics.endFill();
    
    // Support legs
    graphics.beginFill(0x333333);
    graphics.drawRect(-20, 85, 4, 8);
    graphics.drawRect(-2, 85, 4, 8);
    graphics.drawRect(16, 85, 4, 8);
    graphics.endFill();
    
    // Main telescope tube (primary)
    graphics.beginFill(0x2d2d2d);
    graphics.lineStyle(3, 0x4a4a4a);
    graphics.drawRoundedRect(-12, -80, 24, 140, 12);
    graphics.endFill();
    
    // Telescope tube segments
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-10, -75, 20, 20, 10);
    graphics.drawRoundedRect(-10, -50, 20, 20, 10);
    graphics.drawRoundedRect(-10, -25, 20, 20, 10);
    graphics.drawRoundedRect(-10, 0, 20, 20, 10);
    graphics.drawRoundedRect(-10, 25, 20, 20, 10);
    graphics.endFill();
    
    // Telescope lens housing (front)
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x666666);
    graphics.drawCircle(0, -85, 15);
    graphics.endFill();
    
    // Main lens
    graphics.beginFill(0x001133);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawCircle(0, -85, 12);
    graphics.endFill();
    
    // Lens reflection
    graphics.beginFill(0x4da6ff);
    graphics.drawCircle(-3, -88, 4);
    graphics.endFill();
    
    // Lens grid pattern
    graphics.lineStyle(1, 0x0099ff, 0.4);
    graphics.moveTo(-8, -85);
    graphics.lineTo(8, -85);
    graphics.moveTo(0, -93);
    graphics.lineTo(0, -77);
    graphics.drawCircle(0, -85, 6);
    
    // Secondary lens/mirror housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawCircle(0, 65, 8);
    graphics.endFill();
    
    // Eyepiece
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-4, 65, 8, 15, 4);
    graphics.endFill();
    
    // Focusing mechanism
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-15, 10, 8, 12, 3);
    graphics.drawRoundedRect(7, 10, 8, 12, 3);
    graphics.endFill();
    
    // Focus adjustment knobs
    graphics.beginFill(0x4a4a4a);
    graphics.drawCircle(-11, 16, 4);
    graphics.drawCircle(11, 16, 4);
    graphics.endFill();
    
    // Knob details
    graphics.lineStyle(1, 0x666666);
    graphics.moveTo(-13, 16);
    graphics.lineTo(-9, 16);
    graphics.moveTo(-11, 14);
    graphics.lineTo(-11, 18);
    graphics.moveTo(9, 16);
    graphics.lineTo(13, 16);
    graphics.moveTo(11, 14);
    graphics.lineTo(11, 18);
    
    // Control panel on telescope
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(20, -30, 35, 50, 8);
    graphics.endFill();
    
    // Control panel screen
    graphics.beginFill(0x001a00);
    graphics.lineStyle(1, 0x00ff66);
    graphics.drawRoundedRect(25, -25, 25, 20, 4);
    graphics.endFill();
    
    // Screen grid
    graphics.lineStyle(1, 0x00cc44, 0.6);
    for (let i = -20; i <= 0; i += 5) {
        graphics.moveTo(27, i);
        graphics.lineTo(48, i);
    }
    for (let i = 30; i <= 45; i += 5) {
        graphics.moveTo(i, -20);
        graphics.lineTo(i, -10);
    }
    
    // Control buttons
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawCircle(30, 5, 3);
    graphics.drawCircle(40, 5, 3);
    graphics.drawCircle(50, 5, 3);
    graphics.drawCircle(35, 12, 3);
    graphics.drawCircle(45, 12, 3);
    graphics.endFill();
    
    // Button LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(30, 5, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(40, 5, 1);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(50, 5, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(35, 12, 1);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(45, 12, 1);
    graphics.endFill();
    
    // Telescope mounting arm
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-8, 60, 16, 8, 4);
    graphics.endFill();
    
    // Altitude adjustment mechanism
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-20, 45, 12, 20, 6);
    graphics.drawRoundedRect(8, 45, 12, 20, 6);
    graphics.endFill();
    
    // Adjustment gears
    graphics.beginFill(0x4a4a4a);
    graphics.drawCircle(-14, 55, 5);
    graphics.drawCircle(14, 55, 5);
    graphics.endFill();
    
    // Gear teeth
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = -14 + Math.cos(angle) * 4;
        const y1 = 55 + Math.sin(angle) * 4;
        const x2 = -14 + Math.cos(angle) * 6;
        const y2 = 55 + Math.sin(angle) * 6;
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        
        const x3 = 14 + Math.cos(angle) * 4;
        const y3 = 55 + Math.sin(angle) * 4;
        const x4 = 14 + Math.cos(angle) * 6;
        const y4 = 55 + Math.sin(angle) * 6;
        graphics.moveTo(x3, y3);
        graphics.lineTo(x4, y4);
    }
    
    // Finder scope
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-25, -60, 6, 40, 3);
    graphics.endFill();
    
    // Finder scope lens
    graphics.beginFill(0x001133);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawCircle(-22, -62, 3);
    graphics.endFill();
    
    // Finder scope eyepiece
    graphics.beginFill(0x333333);
    graphics.drawCircle(-22, -18, 2);
    graphics.endFill();
    
    // Cable management
    graphics.beginFill(0x1a1a1a);
    graphics.drawRoundedRect(16, 25, 4, 35, 2);
    graphics.endFill();
    
    // Power cable
    graphics.lineStyle(2, 0x333333);
    graphics.moveTo(18, 60);
    graphics.lineTo(25, 65);
    graphics.lineTo(35, 70);
    graphics.lineTo(45, 75);
    
    // Telescope tube details and vents
    graphics.beginFill(0x0d0d0d);
    for (let i = -70; i < 50; i += 25) {
        graphics.drawRect(-8, i, 2, 8);
        graphics.drawRect(6, i, 2, 8);
    }
    graphics.endFill();
    
    // Telescope serial number plate
    graphics.beginFill(0x4a4a4a);
    graphics.drawRoundedRect(-6, 35, 12, 6, 2);
    graphics.endFill();
    
    // Add graphics to container
    telescopeContainer.addChild(graphics);
    
    // Create animated elements
    
    // Rotating focusing mechanism
    const focusKnob1 = new Graphics();
    focusKnob1.beginFill(0x666666);
    focusKnob1.drawCircle(0, 0, 1);
    focusKnob1.endFill();
    focusKnob1.x = -11;
    focusKnob1.y = 16;
    
    const focusKnob2 = new Graphics();
    focusKnob2.beginFill(0x666666);
    focusKnob2.drawCircle(0, 0, 1);
    focusKnob2.endFill();
    focusKnob2.x = 11;
    focusKnob2.y = 16;
    
    let focusRotation = 0;
    const animateFocus = () => {
        focusRotation += 0.02;
        focusKnob1.rotation = focusRotation;
        focusKnob2.rotation = -focusRotation;
        requestAnimationFrame(animateFocus);
    };
    animateFocus();
    
    telescopeContainer.addChild(focusKnob1);
    telescopeContainer.addChild(focusKnob2);
    
    // Rotating gears
    const gear1 = new Graphics();
    gear1.lineStyle(1, 0x888888);
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = Math.cos(angle) * 3;
        const y1 = Math.sin(angle) * 3;
        const x2 = Math.cos(angle) * 5;
        const y2 = Math.sin(angle) * 5;
        gear1.moveTo(x1, y1);
        gear1.lineTo(x2, y2);
    }
    gear1.x = -14;
    gear1.y = 55;
    
    const gear2 = new Graphics();
    gear2.lineStyle(1, 0x888888);
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = Math.cos(angle) * 3;
        const y1 = Math.sin(angle) * 3;
        const x2 = Math.cos(angle) * 5;
        const y2 = Math.sin(angle) * 5;
        gear2.moveTo(x1, y1);
        gear2.lineTo(x2, y2);
    }
    gear2.x = 14;
    gear2.y = 55;
    
    let gearRotation = 0;
    const animateGears = () => {
        gearRotation += 0.01;
        gear1.rotation = gearRotation;
        gear2.rotation = -gearRotation;
        requestAnimationFrame(animateGears);
    };
    animateGears();
    
    telescopeContainer.addChild(gear1);
    telescopeContainer.addChild(gear2);
    
    // Pulsing control panel screen
    const screenGlow = new Graphics();
    screenGlow.beginFill(0x00ff66);
    screenGlow.drawRoundedRect(0, 0, 25, 20, 4);
    screenGlow.endFill();
    screenGlow.x = 25;
    screenGlow.y = -25;
    screenGlow.alpha = 0.1;
    
    let screenPulse = 0;
    const animateScreen = () => {
        screenPulse += 0.05;
        screenGlow.alpha = 0.05 + Math.sin(screenPulse) * 0.1;
        requestAnimationFrame(animateScreen);
    };
    animateScreen();
    
    telescopeContainer.addChild(screenGlow);
    
    // Scanning reticle on screen
    const reticle = new Graphics();
    reticle.lineStyle(1, 0x00ff66, 0.8);
    reticle.drawCircle(0, 0, 3);
    reticle.moveTo(-2, 0);
    reticle.lineTo(2, 0);
    reticle.moveTo(0, -2);
    reticle.lineTo(0, 2);
    reticle.x = 37;
    reticle.y = -15;
    
    let reticleRotation = 0;
    const animateReticle = () => {
        reticleRotation += 0.03;
        reticle.rotation = reticleRotation;
        requestAnimationFrame(animateReticle);
    };
    animateReticle();
    
    telescopeContainer.addChild(reticle);
    
    // Blinking status LEDs
    const createBlinkingLED = (x, y, color, speed) => {
        const led = new Graphics();
        led.beginFill(color);
        led.drawCircle(0, 0, 1);
        led.endFill();
        led.x = x;
        led.y = y;
        
        let blinkTimer = Math.random() * 6.28;
        const animateBlink = () => {
            blinkTimer += speed;
            led.alpha = 0.3 + Math.sin(blinkTimer) * 0.7;
            requestAnimationFrame(animateBlink);
        };
        animateBlink();
        return led;
    };
    
    // Add blinking LEDs
    const led1 = createBlinkingLED(30, 5, 0x00ff00, 0.08);
    const led2 = createBlinkingLED(40, 5, 0xff6600, 0.12);
    const led3 = createBlinkingLED(50, 5, 0x0066ff, 0.06);
    
    telescopeContainer.addChild(led1);
    telescopeContainer.addChild(led2);
    telescopeContainer.addChild(led3);
    
    // Lens reflection animation
    const lensReflection = new Graphics();
    lensReflection.beginFill(0x66ccff);
    lensReflection.drawCircle(0, 0, 2);
    lensReflection.endFill();
    lensReflection.x = -3;
    lensReflection.y = -88;
    lensReflection.alpha = 0.6;
    
    let reflectionPulse = 0;
    const animateReflection = () => {
        reflectionPulse += 0.04;
        lensReflection.alpha = 0.4 + Math.sin(reflectionPulse) * 0.3;
        lensReflection.scale.x = lensReflection.scale.y = 0.8 + Math.sin(reflectionPulse) * 0.4;
        requestAnimationFrame(animateReflection);
    };
    animateReflection();
    
    telescopeContainer.addChild(lensReflection);
    
    // Tracking crosshair on control screen
    const crosshair = new Graphics();
    crosshair.lineStyle(1, 0x00cc44, 0.6);
    crosshair.moveTo(-3, 0);
    crosshair.lineTo(3, 0);
    crosshair.moveTo(0, -3);
    crosshair.lineTo(0, 3);
    crosshair.x = 37;
    crosshair.y = -15;
    
    let crosshairMove = 0;
    const animateCrosshair = () => {
        crosshairMove += 0.02;
        crosshair.x = 37 + Math.sin(crosshairMove) * 2;
        crosshair.y = -15 + Math.cos(crosshairMove * 0.7) * 1.5;
        requestAnimationFrame(animateCrosshair);
    };
    animateCrosshair();
    
    telescopeContainer.addChild(crosshair);
            const bounds = {
  x: x - 40,    // -25 to +55 → center ~x, span 80
  y: y - 88,    // -88 to +88
  width: 80,
  height: 176,
  label: "telescope"
};
if(colliders) addWithCollider(camera, telescopeContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "telescope",
    bounds,
    message: "The Telescope's aperture points silently towards the inky blackness, patiently gathering light from distant, unseen wonders",
    bubble: null,
});
    
    return telescopeContainer;
}

function createObservationSeat(x, y, camera, colliders) {
    // Create main seat container
    const seatContainer = new Container();
    seatContainer.x = x;
    seatContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Base platform/floor mount
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-25, 45, 50, 8, 4);
    graphics.endFill();
    
    // Support column
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-8, 25, 16, 25, 6);
    graphics.endFill();
    
    // Hydraulic cylinder details
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(-6, 27, 12, 4, 2);
    graphics.drawRoundedRect(-6, 35, 12, 4, 2);
    graphics.drawRoundedRect(-6, 43, 12, 4, 2);
    graphics.endFill();
    
    // Seat base mechanism
    graphics.beginFill(0x2d2d2d);
    graphics.lineStyle(2, 0x4a4a4a);
    graphics.drawRoundedRect(-22, 15, 44, 12, 6);
    graphics.endFill();
    
    // Seat cushion base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-20, -5, 40, 20, 8);
    graphics.endFill();
    
    // Seat cushion padding
    graphics.beginFill(0x0d2d4d);
    graphics.lineStyle(1, 0x4a6a8a);
    graphics.drawRoundedRect(-18, -3, 36, 16, 6);
    graphics.endFill();
    
    // Seat quilting pattern
    graphics.lineStyle(1, 0x2a4a6a, 0.6);
    // Vertical lines
    for (let i = -12; i <= 12; i += 8) {
        graphics.moveTo(i, -1);
        graphics.lineTo(i, 11);
    }
    // Horizontal lines
    for (let i = 1; i <= 9; i += 4) {
        graphics.moveTo(-16, i);
        graphics.lineTo(16, i);
    }
    
    // Backrest lower section
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-18, -35, 36, 32, 6);
    graphics.endFill();
    
    // Backrest padding
    graphics.beginFill(0x0d2d4d);
    graphics.lineStyle(1, 0x4a6a8a);
    graphics.drawRoundedRect(-16, -33, 32, 28, 4);
    graphics.endFill();
    
    // Backrest quilting
    graphics.lineStyle(1, 0x2a4a6a, 0.6);
    // Vertical lines
    for (let i = -10; i <= 10; i += 7) {
        graphics.moveTo(i, -31);
        graphics.lineTo(i, -7);
    }
    // Horizontal lines
    for (let i = -28; i <= -10; i += 6) {
        graphics.moveTo(-14, i);
        graphics.lineTo(14, i);
    }
    
    // Armrests
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-28, -15, 8, 25, 4);
    graphics.drawRoundedRect(20, -15, 8, 25, 4);
    graphics.endFill();
    
    // Armrest padding
    graphics.beginFill(0x0d2d4d);
    graphics.lineStyle(1, 0x4a6a8a);
    graphics.drawRoundedRect(-26, -13, 4, 21, 2);
    graphics.drawRoundedRect(22, -13, 4, 21, 2);
    graphics.endFill();
    
    // Control panels on armrests
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-30, -8, 6, 12, 3);
    graphics.drawRoundedRect(24, -8, 6, 12, 3);
    graphics.endFill();
    
    // Control buttons
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawCircle(-27, -5, 2);
    graphics.drawCircle(-27, 1, 2);
    graphics.drawCircle(27, -5, 2);
    graphics.drawCircle(27, 1, 2);
    graphics.endFill();
    
    // Button LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-27, -5, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(-27, 1, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(27, -5, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(27, 1, 0.8);
    graphics.endFill();
    
    // Headrest
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-12, -50, 24, 18, 6);
    graphics.endFill();
    
    // Headrest padding
    graphics.beginFill(0x0d2d4d);
    graphics.lineStyle(1, 0x4a6a8a);
    graphics.drawRoundedRect(-10, -48, 20, 14, 4);
    graphics.endFill();
    
    // Headrest support arms
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-14, -42, 4, 10, 2);
    graphics.drawRoundedRect(10, -42, 4, 10, 2);
    graphics.endFill();
    
    // Seat adjustment mechanisms
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-25, 8, 6, 8, 3);
    graphics.drawRoundedRect(19, 8, 6, 8, 3);
    graphics.endFill();
    
    // Adjustment levers
    graphics.beginFill(0x4a4a4a);
    graphics.drawRoundedRect(-22, 6, 4, 3, 1);
    graphics.drawRoundedRect(20, 6, 4, 3, 1);
    graphics.endFill();
    
    // Swivel mechanism
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawCircle(0, 20, 12);
    graphics.endFill();
    
    // Swivel ring
    graphics.beginFill(0x333333);
    graphics.drawCircle(0, 20, 8);
    graphics.endFill();
    
    // Swivel center
    graphics.beginFill(0x1a1a1a);
    graphics.drawCircle(0, 20, 4);
    graphics.endFill();
    
    // Power cables
    graphics.lineStyle(2, 0x333333);
    graphics.moveTo(-20, 25);
    graphics.lineTo(-30, 30);
    graphics.lineTo(-35, 40);
    graphics.lineTo(-40, 45);
    
    // Seat sensors/vents
    graphics.beginFill(0x0d0d0d);
    graphics.drawRect(-15, -1, 2, 6);
    graphics.drawRect(-5, -1, 2, 6);
    graphics.drawRect(5, -1, 2, 6);
    graphics.drawRect(13, -1, 2, 6);
    graphics.endFill();
    
    // Seat identification plate
    graphics.beginFill(0x4a4a4a);
    graphics.drawRoundedRect(-8, 12, 16, 4, 2);
    graphics.endFill();
    
    // Add graphics to container
    seatContainer.addChild(graphics);
    
    // Create animated elements
    
    // Blinking control LEDs
    const createBlinkingLED = (x, y, color, speed) => {
        const led = new Graphics();
        led.beginFill(color);
        led.drawCircle(0, 0, 0.8);
        led.endFill();
        led.x = x;
        led.y = y;
        
        let blinkTimer = Math.random() * 6.28;
        const animateBlink = () => {
            blinkTimer += speed;
            led.alpha = 0.3 + Math.sin(blinkTimer) * 0.7;
            requestAnimationFrame(animateBlink);
        };
        animateBlink();
        
        return led;
    };
    
    // Add blinking LEDs for both armrests
    const leftLED1 = createBlinkingLED(-27, -5, 0x00ff00, 0.06);
    const leftLED2 = createBlinkingLED(-27, 1, 0x0066ff, 0.08);
    const rightLED1 = createBlinkingLED(27, -5, 0xff6600, 0.05);
    const rightLED2 = createBlinkingLED(27, 1, 0xff0000, 0.07);
    
    seatContainer.addChild(leftLED1);
    seatContainer.addChild(leftLED2);
    seatContainer.addChild(rightLED1);
    seatContainer.addChild(rightLED2);
    
    // Hydraulic movement simulation
    let hydraulicPulse = 0;
    const hydraulicCylinder = new Graphics();
    hydraulicCylinder.beginFill(0x555555);
    hydraulicCylinder.drawRect(-2, 0, 4, 6);
    hydraulicCylinder.endFill();
    hydraulicCylinder.x = 0;
    hydraulicCylinder.y = 30;
    
    const animateHydraulic = () => {
        hydraulicPulse += 0.02;
        hydraulicCylinder.y = 30 + Math.sin(hydraulicPulse) * 0.5;
        requestAnimationFrame(animateHydraulic);
    };
    animateHydraulic();
    
    seatContainer.addChild(hydraulicCylinder);
    
    // Swivel rotation (very slow)
    let swivelRotation = 0;
    const swivelRing = new Graphics();
    swivelRing.lineStyle(1, 0x666666, 0.5);
    swivelRing.drawCircle(0, 0, 10);
    swivelRing.x = 0;
    swivelRing.y = 20;
    
    const animateSwivel = () => {
        swivelRotation += 0.005;
        swivelRing.rotation = swivelRotation;
        requestAnimationFrame(animateSwivel);
    };
    animateSwivel();
    
    seatContainer.addChild(swivelRing);
    
    // Comfort adjustment indicator
    const comfortIndicator = new Graphics();
    comfortIndicator.beginFill(0x00ff66);
    comfortIndicator.drawRect(0, 0, 1, 2);
    comfortIndicator.endFill();
    comfortIndicator.x = 0;
    comfortIndicator.y = 13;
    comfortIndicator.alpha = 0.6;
    
    let comfortPulse = 0;
    const animateComfort = () => {
        comfortPulse += 0.03;
        comfortIndicator.alpha = 0.4 + Math.sin(comfortPulse) * 0.3;
        requestAnimationFrame(animateComfort);
    };
    animateComfort();
    
    seatContainer.addChild(comfortIndicator);
    
    // Seat warming elements (subtle glow)
    const seatWarmth = new Graphics();
    seatWarmth.beginFill(0xff4400);
    seatWarmth.drawRoundedRect(-18, -3, 36, 16, 6);
    seatWarmth.endFill();
    seatWarmth.alpha = 0.05;
    
    let warmthPulse = 0;
    const animateWarmth = () => {
        warmthPulse += 0.02;
        seatWarmth.alpha = 0.03 + Math.sin(warmthPulse) * 0.04;
        requestAnimationFrame(animateWarmth);
    };
    animateWarmth();
    
    seatContainer.addChild(seatWarmth);
    const bounds = {
  x: x - 35,    // center x - half width
  y: y - 50,    // top
  width: 70,
  height: 95,
  label: "observationSeat"
};

if(colliders){
    addWithCollider(camera, seatContainer, bounds, colliders);
}
    
    return seatContainer;
}

function createSpacePlant(x, y, camera, colliders) {
    // Create main plant container
    const plantContainer = new Container();
    plantContainer.x = x;
    plantContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Hydroponic base platform
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-15, 25, 30, 6, 3);
    graphics.endFill();
    
    // Support legs
    graphics.beginFill(0x2a2a2a);
    graphics.drawRect(-12, 28, 2, 4);
    graphics.drawRect(-1, 28, 2, 4);
    graphics.drawRect(10, 28, 2, 4);
    graphics.endFill();
    
    // Main growing chamber
    graphics.beginFill(0x0d2d1a);
    graphics.lineStyle(2, 0x2a4a2a);
    graphics.drawRoundedRect(-12, 10, 24, 18, 6);
    graphics.endFill();
    
    // Transparent dome/viewing window
    graphics.beginFill(0x0066cc);
    graphics.lineStyle(1, 0x4da6ff);
    graphics.drawRoundedRect(-10, 12, 20, 14, 4);
    graphics.endFill();
    
    // Dome reflection
    graphics.beginFill(0x66ccff);
    graphics.drawRoundedRect(-8, 14, 6, 4, 2);
    graphics.endFill();
    
    // Nutrient reservoir
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-8, 20, 16, 8, 4);
    graphics.endFill();
    
    // Nutrient level indicator
    graphics.beginFill(0x00ff66);
    graphics.drawRect(-6, 22, 12, 2);
    graphics.endFill();
    
    // Control panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(14, 15, 12, 12, 3);
    graphics.endFill();
    
    // Control display
    graphics.beginFill(0x001a00);
    graphics.lineStyle(1, 0x00ff66);
    graphics.drawRoundedRect(16, 17, 8, 6, 2);
    graphics.endFill();
    
    // Display grid
    graphics.lineStyle(1, 0x00cc44, 0.6);
    graphics.moveTo(17, 19);
    graphics.lineTo(23, 19);
    graphics.moveTo(17, 21);
    graphics.lineTo(23, 21);
    graphics.moveTo(19, 18);
    graphics.lineTo(19, 22);
    graphics.moveTo(21, 18);
    graphics.lineTo(21, 22);
    
    // Control buttons
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawCircle(17, 25, 1.5);
    graphics.drawCircle(21, 25, 1.5);
    graphics.endFill();
    
    // Button LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(17, 25, 0.6);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(21, 25, 0.6);
    graphics.endFill();
    
    // Main plant stem
    graphics.beginFill(0x2a4a2a);
    graphics.lineStyle(1, 0x4a6a4a);
    graphics.drawRoundedRect(-1, -5, 2, 20, 1);
    graphics.endFill();
    
    // Plant stem nodes
    graphics.beginFill(0x4a6a4a);
    graphics.drawCircle(0, 0, 1.5);
    graphics.drawCircle(0, 8, 1.5);
    graphics.endFill();
    
    // Main leaves
    graphics.beginFill(0x1a4a2a);
    graphics.lineStyle(1, 0x2a6a3a);
    
    // Left leaf cluster
    graphics.drawEllipse(-6, -2, 5, 3);
    graphics.drawEllipse(-8, 2, 4, 2.5);
    graphics.drawEllipse(-5, 6, 3, 2);
    
    // Right leaf cluster
    graphics.drawEllipse(6, -1, 5, 3);
    graphics.drawEllipse(7, 3, 4, 2.5);
    graphics.drawEllipse(5, 7, 3, 2);
    
    // Top leaves
    graphics.drawEllipse(-3, -8, 4, 2.5);
    graphics.drawEllipse(3, -7, 4, 2.5);
    graphics.drawEllipse(0, -12, 3, 2);
    
    graphics.endFill();
    
    // Leaf veins
    graphics.lineStyle(1, 0x4a8a5a, 0.6);
    // Left cluster veins
    graphics.moveTo(-8, -2);
    graphics.lineTo(-4, -2);
    graphics.moveTo(-10, 2);
    graphics.lineTo(-6, 2);
    graphics.moveTo(-6, 6);
    graphics.lineTo(-3, 6);
    
    // Right cluster veins
    graphics.moveTo(4, -1);
    graphics.lineTo(8, -1);
    graphics.moveTo(5, 3);
    graphics.lineTo(9, 3);
    graphics.moveTo(3, 7);
    graphics.lineTo(7, 7);
    
    // Top veins
    graphics.moveTo(-5, -8);
    graphics.lineTo(-1, -8);
    graphics.moveTo(1, -7);
    graphics.lineTo(5, -7);
    graphics.moveTo(-1, -12);
    graphics.lineTo(1, -12);
    
    // Bioluminescent spots on leaves
    graphics.beginFill(0x66ff99);
    graphics.drawCircle(-6, -2, 0.8);
    graphics.drawCircle(6, -1, 0.8);
    graphics.drawCircle(-7, 3, 0.6);
    graphics.drawCircle(6, 4, 0.6);
    graphics.drawCircle(0, -10, 0.7);
    graphics.endFill();
    
    // Root system (visible through transparent chamber)
    graphics.beginFill(0x4a4a2a);
    graphics.lineStyle(1, 0x6a6a3a, 0.7);
    graphics.drawRoundedRect(-3, 15, 1, 8, 0.5);
    graphics.drawRoundedRect(2, 16, 1, 7, 0.5);
    graphics.drawRoundedRect(-1, 18, 1, 6, 0.5);
    graphics.endFill();
    
    // Root tendrils
    graphics.lineStyle(1, 0x6a6a3a, 0.5);
    graphics.moveTo(-2, 20);
    graphics.lineTo(-4, 22);
    graphics.moveTo(1, 21);
    graphics.lineTo(3, 23);
    graphics.moveTo(0, 22);
    graphics.lineTo(-2, 24);
    
    // Hydroponic tubes
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(-10, 28, 2, 6, 1);
    graphics.drawRoundedRect(8, 28, 2, 6, 1);
    graphics.endFill();
    
    // Nutrient flow indicators
    graphics.beginFill(0x00ff66);
    graphics.drawRect(-9, 30, 1, 1);
    graphics.drawRect(9, 31, 1, 1);
    graphics.endFill();
    
    // Growth monitoring sensors
    graphics.beginFill(0x4a4a4a);
    graphics.drawCircle(-8, 8, 1);
    graphics.drawCircle(8, 10, 1);
    graphics.endFill();
    
    // Sensor LEDs
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-8, 8, 0.4);
    graphics.drawCircle(8, 10, 0.4);
    graphics.endFill();
    
    // Atmospheric processor vents
    graphics.beginFill(0x0d0d0d);
    graphics.drawRect(-6, 28, 1, 2);
    graphics.drawRect(5, 28, 1, 2);
    graphics.endFill();
    
    // Plant ID tag
    graphics.beginFill(0x4a4a4a);
    graphics.drawRoundedRect(-4, 12, 8, 2, 1);
    graphics.endFill();
    
    // Add graphics to container
    plantContainer.addChild(graphics);
    
    // Create animated elements
    
    // Pulsing bioluminescent spots
    const createPulsingSpot = (x, y, color, speed) => {
        const spot = new Graphics();
        spot.beginFill(color);
        spot.drawCircle(0, 0, 0.8);
        spot.endFill();
        spot.x = x;
        spot.y = y;
        
        let pulseTimer = Math.random() * 6.28;
        const animatePulse = () => {
            pulseTimer += speed;
            spot.alpha = 0.4 + Math.sin(pulseTimer) * 0.4;
            spot.scale.x = spot.scale.y = 0.8 + Math.sin(pulseTimer) * 0.3;
            requestAnimationFrame(animatePulse);
        };
        animatePulse();
        
        return spot;
    };
    
    // Add pulsing bioluminescent spots
    const bioSpot1 = createPulsingSpot(-6, -2, 0x66ff99, 0.08);
    const bioSpot2 = createPulsingSpot(6, -1, 0x66ff99, 0.06);
    const bioSpot3 = createPulsingSpot(-7, 3, 0x66ff99, 0.07);
    const bioSpot4 = createPulsingSpot(6, 4, 0x66ff99, 0.09);
    const bioSpot5 = createPulsingSpot(0, -10, 0x66ff99, 0.05);
    
    plantContainer.addChild(bioSpot1);
    plantContainer.addChild(bioSpot2);
    plantContainer.addChild(bioSpot3);
    plantContainer.addChild(bioSpot4);
    plantContainer.addChild(bioSpot5);
    
    // Gentle leaf swaying
    const leafCluster1 = new Graphics();
    leafCluster1.beginFill(0x1a4a2a);
    leafCluster1.drawEllipse(0, 0, 2, 1);
    leafCluster1.endFill();
    leafCluster1.x = -6;
    leafCluster1.y = -2;
    
    const leafCluster2 = new Graphics();
    leafCluster2.beginFill(0x1a4a2a);
    leafCluster2.drawEllipse(0, 0, 2, 1);
    leafCluster2.endFill();
    leafCluster2.x = 6;
    leafCluster2.y = -1;
    
    let leafSway = 0;
    const animateLeaves = () => {
        leafSway += 0.03;
        leafCluster1.rotation = Math.sin(leafSway) * 0.1;
        leafCluster2.rotation = Math.sin(leafSway + 1) * 0.1;
        requestAnimationFrame(animateLeaves);
    };
    animateLeaves();
    
    plantContainer.addChild(leafCluster1);
    plantContainer.addChild(leafCluster2);
    
    // Nutrient flow animation
    const nutrientFlow = new Graphics();
    nutrientFlow.beginFill(0x00ff66);
    nutrientFlow.drawCircle(0, 0, 0.5);
    nutrientFlow.endFill();
    nutrientFlow.x = -9;
    nutrientFlow.y = 30;
    nutrientFlow.alpha = 0.7;
    
    let flowPosition = 0;
    const animateNutrientFlow = () => {
        flowPosition += 0.1;
        nutrientFlow.y = 30 + Math.sin(flowPosition) * 2;
        nutrientFlow.alpha = 0.4 + Math.sin(flowPosition) * 0.3;
        requestAnimationFrame(animateNutrientFlow);
    };
    animateNutrientFlow();
    
    plantContainer.addChild(nutrientFlow);
    
    // Control panel display animation
    const displayGlow = new Graphics();
    displayGlow.beginFill(0x00ff66);
    displayGlow.drawRoundedRect(0, 0, 8, 6, 2);
    displayGlow.endFill();
    displayGlow.x = 16;
    displayGlow.y = 17;
    displayGlow.alpha = 0.1;
    
    let displayPulse = 0;
    const animateDisplay = () => {
        displayPulse += 0.04;
        displayGlow.alpha = 0.05 + Math.sin(displayPulse) * 0.1;
        requestAnimationFrame(animateDisplay);
    };
    animateDisplay();
    
    plantContainer.addChild(displayGlow);
    
    // Blinking sensor LEDs
    const sensorLED1 = new Graphics();
    sensorLED1.beginFill(0xff6600);
    sensorLED1.drawCircle(0, 0, 0.4);
    sensorLED1.endFill();
    sensorLED1.x = -8;
    sensorLED1.y = 8;
    
    const sensorLED2 = new Graphics();
    sensorLED2.beginFill(0xff6600);
    sensorLED2.drawCircle(0, 0, 0.4);
    sensorLED2.endFill();
    sensorLED2.x = 8;
    sensorLED2.y = 10;
    
    let sensorBlink = 0;
    const animateSensors = () => {
        sensorBlink += 0.12;
        sensorLED1.alpha = 0.3 + Math.sin(sensorBlink) * 0.7;
        sensorLED2.alpha = 0.3 + Math.sin(sensorBlink + 2) * 0.7;
        requestAnimationFrame(animateSensors);
    };
    animateSensors();
    
    plantContainer.addChild(sensorLED1);
    plantContainer.addChild(sensorLED2);
    
    // Growth indicator
    const growthIndicator = new Graphics();
    growthIndicator.beginFill(0x00ff00);
    growthIndicator.drawRect(0, 0, 1, 0.5);
    growthIndicator.endFill();
    growthIndicator.x = 0;
    growthIndicator.y = 13;
    
    let growthPulse = 0;
    const animateGrowth = () => {
        growthPulse += 0.02;
        growthIndicator.alpha = 0.5 + Math.sin(growthPulse) * 0.3;
        requestAnimationFrame(animateGrowth);
    };
    animateGrowth();
    
    plantContainer.addChild(growthIndicator);
    const bounds = {
  x: x - 20.5,
  y: y - 12,
  width: 41,
  height: 46,
  label: "spacePlant"
};
if(colliders) addWithCollider(camera, growthIndicator, bounds, colliders);
    
    return plantContainer;
}

function createCommArray(x, y, camera, colliders) {
    // Create main communication array container
    const commContainer = new Container();
    commContainer.x = x;
    commContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Base platform
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-40, 80, 80, 12, 6);
    graphics.endFill();
    
    // Support legs
    graphics.beginFill(0x2a2a2a);
    graphics.drawRect(-35, 85, 6, 10);
    graphics.drawRect(-3, 85, 6, 10);
    graphics.drawRect(29, 85, 6, 10);
    graphics.endFill();
    
    // Main support column
    graphics.beginFill(0x2d2d2d);
    graphics.lineStyle(3, 0x4a4a4a);
    graphics.drawRoundedRect(-8, 40, 16, 45, 8);
    graphics.endFill();
    
    // Support column details
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-6, 45, 12, 6, 3);
    graphics.drawRoundedRect(-6, 55, 12, 6, 3);
    graphics.drawRoundedRect(-6, 65, 12, 6, 3);
    graphics.drawRoundedRect(-6, 75, 12, 6, 3);
    graphics.endFill();
    
    // Main dish support mechanism
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-12, 25, 24, 20, 10);
    graphics.endFill();
    
    // Dish gimbal system
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawCircle(0, 35, 15);
    graphics.endFill();
    
    // Inner gimbal ring
    graphics.beginFill(0x333333);
    graphics.drawCircle(0, 35, 10);
    graphics.endFill();
    
    // Main communication dish
    graphics.beginFill(0x2d2d2d);
    graphics.lineStyle(3, 0x4a4a4a);
    graphics.drawEllipse(0, 0, 35, 20);
    graphics.endFill();
    
    // Dish inner surface
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawEllipse(0, 0, 30, 17);
    graphics.endFill();
    
    // Dish mesh pattern
    graphics.lineStyle(1, 0x444444, 0.6);
    // Concentric circles
    for (let i = 8; i <= 28; i += 6) {
        graphics.drawEllipse(0, 0, i, i * 0.6);
    }
    // Radial lines
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = Math.cos(angle) * 8;
        const y1 = Math.sin(angle) * 5;
        const x2 = Math.cos(angle) * 30;
        const y2 = Math.sin(angle) * 17;
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
    }
    
    // Central feed horn
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-3, -8, 6, 16, 3);
    graphics.endFill();
    
    // Feed horn details
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(-2, -6, 4, 3, 1);
    graphics.drawRoundedRect(-2, -1, 4, 3, 1);
    graphics.drawRoundedRect(-2, 4, 4, 3, 1);
    graphics.endFill();
    
    // Feed horn receiver
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(0, -10, 4);
    graphics.endFill();
    
    // Receiver lens
    graphics.beginFill(0x001133);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawCircle(0, -10, 3);
    graphics.endFill();
    
    // Lens reflection
    graphics.beginFill(0x4da6ff);
    graphics.drawCircle(-1, -11, 1.5);
    graphics.endFill();
    
    // Secondary antenna array
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-25, -15, 4, 25, 2);
    graphics.drawRoundedRect(-15, -20, 4, 30, 2);
    graphics.drawRoundedRect(11, -18, 4, 28, 2);
    graphics.drawRoundedRect(21, -12, 4, 22, 2);
    graphics.endFill();
    
    // Antenna tips
    graphics.beginFill(0x666666);
    graphics.drawCircle(-23, -17, 2);
    graphics.drawCircle(-13, -22, 2);
    graphics.drawCircle(13, -20, 2);
    graphics.drawCircle(23, -14, 2);
    graphics.endFill();
    
    // Antenna tip LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-23, -17, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-13, -22, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(13, -20, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(23, -14, 0.8);
    graphics.endFill();
    
    // Control housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-45, 15, 25, 35, 8);
    graphics.endFill();
    
    // Control panel screen
    graphics.beginFill(0x001a00);
    graphics.lineStyle(1, 0x00ff66);
    graphics.drawRoundedRect(-42, 20, 19, 12, 4);
    graphics.endFill();
    
    // Screen display elements
    graphics.lineStyle(1, 0x00cc44, 0.8);
    // Signal strength bars
    for (let i = 0; i < 6; i++) {
        const height = 2 + i * 1.5;
        graphics.drawRect(-40 + i * 3, 30 - height, 2, height);
    }
    
    // Frequency wave
    graphics.moveTo(-40, 24);
    for (let i = 0; i <= 16; i++) {
        const x = -40 + i;
        const y = 24 + Math.sin(i * 0.5) * 2;
        graphics.lineTo(x, y);
    }
    
    // Control buttons
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawCircle(-38, 38, 2);
    graphics.drawCircle(-32, 38, 2);
    graphics.drawCircle(-26, 38, 2);
    graphics.drawCircle(-38, 44, 2);
    graphics.drawCircle(-32, 44, 2);
    graphics.drawCircle(-26, 44, 2);
    graphics.endFill();
    
    // Button LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-38, 38, 0.8);
    graphics.drawCircle(-32, 44, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-32, 38, 0.8);
    graphics.drawCircle(-26, 44, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(-26, 38, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(-38, 44, 0.8);
    graphics.endFill();
    
    // Power distribution box
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(25, 25, 18, 25, 6);
    graphics.endFill();
    
    // Power status indicators
    graphics.beginFill(0x333333);
    graphics.drawRect(28, 30, 3, 2);
    graphics.drawRect(28, 34, 3, 2);
    graphics.drawRect(28, 38, 3, 2);
    graphics.drawRect(28, 42, 3, 2);
    graphics.endFill();
    
    // Power LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawRect(29, 30.5, 1, 1);
    graphics.drawRect(29, 34.5, 1, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawRect(29, 38.5, 1, 1);
    graphics.endFill();
    
    // Cooling vents
    graphics.beginFill(0x0d0d0d);
    for (let i = 0; i < 6; i++) {
        graphics.drawRect(35 + i * 2, 30, 1, 15);
    }
    graphics.endFill();
    
    // Cable management
    graphics.lineStyle(3, 0x333333);
    graphics.moveTo(-20, 50);
    graphics.lineTo(-30, 55);
    graphics.lineTo(-35, 60);
    graphics.lineTo(-25, 65);
    
    graphics.moveTo(20, 50);
    graphics.lineTo(30, 55);
    graphics.lineTo(35, 60);
    graphics.lineTo(25, 65);
    
    // Warning labels
    graphics.beginFill(0x4a4a4a);
    graphics.drawRoundedRect(-10, 50, 20, 4, 2);
    graphics.drawRoundedRect(-15, 70, 30, 4, 2);
    graphics.endFill();
    
    // Add graphics to container
    commContainer.addChild(graphics);
    
    // Create animated elements
    
    // Rotating main dish
    let dishRotation = 0;
    const dishElement = new Graphics();
    dishElement.lineStyle(1, 0x666666, 0.3);
    dishElement.drawEllipse(0, 0, 32, 18);
    dishElement.x = 0;
    dishElement.y = 0;
    
    const animateDish = () => {
        dishRotation += 0.005;
        dishElement.rotation = dishRotation;
        requestAnimationFrame(animateDish);
    };
    animateDish();
    
    commContainer.addChild(dishElement);
    
    // Pulsing signal transmission
    const signalPulse = new Graphics();
    signalPulse.lineStyle(2, 0x00ff66, 0.6);
    signalPulse.drawCircle(0, 0, 10);
    signalPulse.x = 0;
    signalPulse.y = -10;
    
    let pulseScale = 0;
    const animateSignal = () => {
        pulseScale += 0.1;
        const scale = 1 + Math.sin(pulseScale) * 0.5;
        signalPulse.scale.x = signalPulse.scale.y = scale;
        signalPulse.alpha = 0.8 - (scale - 1) * 0.8;
        requestAnimationFrame(animateSignal);
    };
    animateSignal();
    
    commContainer.addChild(signalPulse);
    
    // Scanning beam
    const scanBeam = new Graphics();
    scanBeam.lineStyle(1, 0x4da6ff, 0.7);
    scanBeam.moveTo(0, -10);
    scanBeam.lineTo(0, -60);
    scanBeam.x = 0;
    scanBeam.y = 0;
    
    let scanRotation = 0;
    const animateScan = () => {
        scanRotation += 0.02;
        scanBeam.rotation = scanRotation;
        scanBeam.alpha = 0.3 + Math.sin(scanRotation * 5) * 0.4;
        requestAnimationFrame(animateScan);
    };
    animateScan();
    
    commContainer.addChild(scanBeam);
    
    // Blinking antenna LEDs
    const createBlinkingAntenna = (x, y, color, speed) => {
        const led = new Graphics();
        led.beginFill(color);
        led.drawCircle(0, 0, 0.8);
        led.endFill();
        led.x = x;
        led.y = y;
        
        let blinkTimer = Math.random() * 6.28;
        const animateBlink = () => {
            blinkTimer += speed;
            led.alpha = 0.3 + Math.sin(blinkTimer) * 0.7;
            requestAnimationFrame(animateBlink);
        };
        animateBlink();
        
        return led;
    };
    
    // Add blinking antenna LEDs
    const antLED1 = createBlinkingAntenna(-23, -17, 0x00ff00, 0.08);
    const antLED2 = createBlinkingAntenna(-13, -22, 0xff6600, 0.12);
    const antLED3 = createBlinkingAntenna(13, -20, 0x0066ff, 0.06);
    const antLED4 = createBlinkingAntenna(23, -14, 0xff0000, 0.10);
    
    commContainer.addChild(antLED1);
    commContainer.addChild(antLED2);
    commContainer.addChild(antLED3);
    commContainer.addChild(antLED4);
    
    // Control panel screen animation
    const screenGlow = new Graphics();
    screenGlow.beginFill(0x00ff66);
    screenGlow.drawRoundedRect(0, 0, 19, 12, 4);
    screenGlow.endFill();
    screenGlow.x = -42;
    screenGlow.y = 20;
    screenGlow.alpha = 0.1;
    
    let screenPulse = 0;
    const animateScreen = () => {
        screenPulse += 0.03;
        screenGlow.alpha = 0.05 + Math.sin(screenPulse) * 0.1;
        requestAnimationFrame(animateScreen);
    };
    animateScreen();
    
    commContainer.addChild(screenGlow);
    
    // Signal strength animation
    const signalBars = [];
    for (let i = 0; i < 6; i++) {
        const bar = new Graphics();
        bar.beginFill(0x00ff66);
        const height = 2 + i * 1.5;
        bar.drawRect(0, 0, 2, height);
        bar.endFill();
        bar.x = -40 + i * 3;
        bar.y = 30 - height;
        signalBars.push(bar);
        commContainer.addChild(bar);
    }
    
    let signalAnimation = 0;
    const animateSignalBars = () => {
        signalAnimation += 0.1;
        signalBars.forEach((bar, index) => {
            bar.alpha = 0.3 + Math.sin(signalAnimation + index * 0.5) * 0.5;
        });
        requestAnimationFrame(animateSignalBars);
    };
    animateSignalBars();
    
    // Data transmission particles
    const createDataParticle = () => {
        const particle = new Graphics();
        particle.beginFill(0x00ff66);
        particle.drawCircle(0, 0, 1);
        particle.endFill();
        particle.x = 0;
        particle.y = -10;
        particle.alpha = 0.8;
        
        let particleLife = 0;
        const animateParticle = () => {
            particleLife += 0.05;
            particle.y -= 2;
            particle.alpha = Math.max(0, 0.8 - particleLife);
            
            if (particle.alpha > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                commContainer.removeChild(particle);
            }
        };
        animateParticle();
        
        return particle;
    };
    
    // Spawn data particles periodically
    setInterval(() => {
        const particle = createDataParticle();
        commContainer.addChild(particle);
    }, 1000);
    
    // Lens reflection animation
    const lensReflection = new Graphics();
    lensReflection.beginFill(0x66ccff);
    lensReflection.drawCircle(0, 0, 1);
    lensReflection.endFill();
    lensReflection.x = -1;
    lensReflection.y = -11;
    lensReflection.alpha = 0.6;
    
    let reflectionPulse = 0;
    const animateReflection = () => {
        reflectionPulse += 0.08;
        lensReflection.alpha = 0.4 + Math.sin(reflectionPulse) * 0.4;
        lensReflection.scale.x = lensReflection.scale.y = 0.8 + Math.sin(reflectionPulse) * 0.3;
        requestAnimationFrame(animateReflection);
    };
    animateReflection();
    
    commContainer.addChild(lensReflection);
    const bounds = {
  x: x - 44,
  y: y - 30,
  width: 88,
  height: 125,
  label: "commArray"
};
if(colliders)
    addWithCollider(camera, commContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "commArray",
    bounds,
    message: "A low, intermittent static crackles from the Comm Array's console, a constant reminder of the vast, empty spaces it tries to bridge",
    bubble: null, 
});
    
    return commContainer;
}

function createSignalProcessor(x, y, camera, colliders) {
    // Create main signal processor container
    const procContainer = new Container();
    procContainer.x = x;
    procContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main processor chassis
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-50, -40, 100, 80, 8);
    graphics.endFill();
    
    // Chassis reinforcement edges
    graphics.beginFill(0x2a2a2a);
    graphics.drawRoundedRect(-45, -35, 90, 8, 4);
    graphics.drawRoundedRect(-45, 27, 90, 8, 4);
    graphics.drawRect(-45, -35, 8, 70);
    graphics.drawRect(37, -35, 8, 70);
    graphics.endFill();
    
    // Central processing unit housing
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-35, -25, 70, 50, 6);
    graphics.endFill();
    
    // CPU cooling system
    graphics.beginFill(0x2d2d2d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-30, -20, 60, 40, 4);
    graphics.endFill();
    
    // Heat sink fins
    graphics.beginFill(0x333333);
    for (let i = 0; i < 12; i++) {
        graphics.drawRect(-28 + i * 5, -18, 3, 36);
    }
    graphics.endFill();
    
    // Cooling fan housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x666666);
    graphics.drawCircle(0, 0, 18);
    graphics.endFill();
    
    // Fan blades (will be animated)
    graphics.beginFill(0x4a4a4a);
    graphics.lineStyle(1, 0x777777);
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x1 = Math.cos(angle) * 6;
        const y1 = Math.sin(angle) * 6;
        const x2 = Math.cos(angle + 0.3) * 16;
        const y2 = Math.sin(angle + 0.3) * 16;
        graphics.moveTo(x1, y1);
        graphics.lineTo(x2, y2);
        graphics.lineTo(Math.cos(angle + 0.8) * 14, Math.sin(angle + 0.8) * 14);
        graphics.lineTo(Math.cos(angle + 0.5) * 4, Math.sin(angle + 0.5) * 4);
        graphics.lineTo(x1, y1);
    }
    graphics.endFill();
    
    // Fan center hub
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawCircle(0, 0, 4);
    graphics.endFill();
    
    // Processing cores indicators
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    const corePositions = [
        {x: -20, y: -15}, {x: -10, y: -15}, {x: 0, y: -15}, {x: 10, y: -15}, {x: 20, y: -15},
        {x: -20, y: -5}, {x: -10, y: -5}, {x: 10, y: -5}, {x: 20, y: -5},
        {x: -20, y: 5}, {x: -10, y: 5}, {x: 10, y: 5}, {x: 20, y: 5},
        {x: -20, y: 15}, {x: -10, y: 15}, {x: 0, y: 15}, {x: 10, y: 15}, {x: 20, y: 15}
    ];
    
    corePositions.forEach(pos => {
        graphics.drawRoundedRect(pos.x - 2, pos.y - 2, 4, 4, 1);
    });
    graphics.endFill();
    
    // Memory banks
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-45, -32, 12, 64, 4);
    graphics.drawRoundedRect(33, -32, 12, 64, 4);
    graphics.endFill();
    
    // Memory slots
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x333333);
    for (let i = 0; i < 8; i++) {
        graphics.drawRoundedRect(-43, -28 + i * 8, 8, 6, 2);
        graphics.drawRoundedRect(35, -28 + i * 8, 8, 6, 2);
    }
    graphics.endFill();
    
    // I/O ports
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, 32, 50, 8, 4);
    graphics.endFill();
    
    // Port connectors
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 6; i++) {
        graphics.drawRoundedRect(-20 + i * 7, 34, 5, 4, 1);
    }
    graphics.endFill();
    
    // Status displays
    graphics.beginFill(0x001a00);
    graphics.lineStyle(1, 0x00ff66);
    graphics.drawRoundedRect(-48, -10, 8, 20, 2);
    graphics.drawRoundedRect(40, -10, 8, 20, 2);
    graphics.endFill();
    
    // Power regulation unit
    graphics.beginFill(0x2d2d2d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, -38, 50, 6, 3);
    graphics.endFill();
    
    // Power LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-18, -35, 1.5);
    graphics.drawCircle(-8, -35, 1.5);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(2, -35, 1.5);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(12, -35, 1.5);
    graphics.endFill();
    
    // Add graphics to container
    procContainer.addChild(graphics);
    
    // Create animated elements
    
    // Rotating cooling fan
    const fanBlades = new Graphics();
    fanBlades.beginFill(0x4a4a4a);
    fanBlades.lineStyle(1, 0x777777);
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x1 = Math.cos(angle) * 6;
        const y1 = Math.sin(angle) * 6;
        const x2 = Math.cos(angle + 0.3) * 16;
        const y2 = Math.sin(angle + 0.3) * 16;
        fanBlades.moveTo(x1, y1);
        fanBlades.lineTo(x2, y2);
        fanBlades.lineTo(Math.cos(angle + 0.8) * 14, Math.sin(angle + 0.8) * 14);
        fanBlades.lineTo(Math.cos(angle + 0.5) * 4, Math.sin(angle + 0.5) * 4);
        fanBlades.lineTo(x1, y1);
    }
    fanBlades.endFill();
    
    let fanRotation = 0;
    const animateFan = () => {
        fanRotation += 0.15;
        fanBlades.rotation = fanRotation;
        requestAnimationFrame(animateFan);
    };
    animateFan();
    
    procContainer.addChild(fanBlades);
    
    // Processing core activity lights
    const coreActivities = [];
    corePositions.forEach((pos, index) => {
        const coreLight = new Graphics();
        coreLight.beginFill(0x00ff66);
        coreLight.drawCircle(0, 0, 1);
        coreLight.endFill();
        coreLight.x = pos.x;
        coreLight.y = pos.y;
        coreLight.alpha = 0.2;
        
        let coreTimer = Math.random() * 6.28;
        const animateCore = () => {
            coreTimer += 0.05 + Math.random() * 0.1;
            coreLight.alpha = 0.2 + Math.sin(coreTimer) * 0.6;
            requestAnimationFrame(animateCore);
        };
        animateCore();
        
        coreActivities.push(coreLight);
        procContainer.addChild(coreLight);
    });
    
    // Memory access indicators
    const memoryIndicators = [];
    for (let i = 0; i < 8; i++) {
        const leftMem = new Graphics();
        leftMem.beginFill(0x0066ff);
        leftMem.drawRect(0, 0, 2, 1);
        leftMem.endFill();
        leftMem.x = -41;
        leftMem.y = -26 + i * 8;
        leftMem.alpha = 0;
        
        const rightMem = new Graphics();
        rightMem.beginFill(0xff6600);
        rightMem.drawRect(0, 0, 2, 1);
        rightMem.endFill();
        rightMem.x = 37;
        rightMem.y = -26 + i * 8;
        rightMem.alpha = 0;
        
        memoryIndicators.push({left: leftMem, right: rightMem});
        procContainer.addChild(leftMem);
        procContainer.addChild(rightMem);
    }
    
    // Memory access animation
    let memoryAccessTimer = 0;
    const animateMemoryAccess = () => {
        memoryAccessTimer += 0.1;
        
        memoryIndicators.forEach((mem, index) => {
            const leftPhase = memoryAccessTimer + index * 0.5;
            const rightPhase = memoryAccessTimer + index * 0.7;
            
            mem.left.alpha = Math.max(0, Math.sin(leftPhase) * 0.8);
            mem.right.alpha = Math.max(0, Math.sin(rightPhase) * 0.8);
        });
        
        requestAnimationFrame(animateMemoryAccess);
    };
    animateMemoryAccess();
    
    // Data flow particles
    const createDataFlow = () => {
        const particle = new Graphics();
        particle.beginFill(0x00ccff);
        particle.drawCircle(0, 0, 1.5);
        particle.endFill();
        particle.x = -50;
        particle.y = Math.random() * 60 - 30;
        particle.alpha = 0.8;
        
        let flowLife = 0;
        const animateFlow = () => {
            flowLife += 0.08;
            particle.x += 3;
            particle.alpha = 0.8 - flowLife * 0.1;
            
            if (particle.x < 50 && particle.alpha > 0) {
                requestAnimationFrame(animateFlow);
            } else {
                procContainer.removeChild(particle);
            }
        };
        animateFlow();
        
        return particle;
    };
    
    // Spawn data flow particles
    setInterval(() => {
        const particle = createDataFlow();
        procContainer.addChild(particle);
    }, 300);
    
    // Status display screens
    const leftScreen = new Graphics();
    leftScreen.beginFill(0x001a00);
    leftScreen.drawRoundedRect(0, 0, 8, 20, 2);
    leftScreen.endFill();
    leftScreen.x = -48;
    leftScreen.y = -10;
    leftScreen.alpha = 0.1;
    
    const rightScreen = new Graphics();
    rightScreen.beginFill(0x1a0000);
    rightScreen.drawRoundedRect(0, 0, 8, 20, 2);
    rightScreen.endFill();
    rightScreen.x = 40;
    rightScreen.y = -10;
    rightScreen.alpha = 0.1;
    
    let screenPulse = 0;
    const animateScreens = () => {
        screenPulse += 0.04;
        leftScreen.alpha = 0.1 + Math.sin(screenPulse) * 0.15;
        rightScreen.alpha = 0.1 + Math.sin(screenPulse + 1) * 0.15;
        requestAnimationFrame(animateScreens);
    };
    animateScreens();
    
    procContainer.addChild(leftScreen);
    procContainer.addChild(rightScreen);
    const bounds={
  x: x - 52,
  y: y - 42,
  width: 104,
  height: 90,
  label: "processingArray"
}
if(colliders) addWithCollider(camera, procContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "processingArray",
    bounds,
    message: "A faint whirring emanates from the Signal Processor, its internal components meticulously refining garbled transmissions into understandable streams",
    bubble: null, 
});
    
    return procContainer;
}

function createMonitoringStation(x, y, camera, colliders) {
    // Create main monitoring station container
    const monitorContainer = new Container();
    monitorContainer.x = x;
    monitorContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main console base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-60, 20, 120, 40, 8);
    graphics.endFill();
    
    // Console slope/angle
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-55, 0, 110, 25, 6);
    graphics.endFill();
    
    // Primary display screen
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-45, -40, 90, 45, 8);
    graphics.endFill();
    
    // Screen bezel
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-42, -37, 84, 39, 6);
    graphics.endFill();
    
    // Main display area
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-40, -35, 80, 35, 4);
    graphics.endFill();
    
    // Display grid overlay
    graphics.lineStyle(1, 0x004466, 0.4);
    for (let i = 0; i < 9; i++) {
        graphics.moveTo(-40 + i * 10, -35);
        graphics.lineTo(-40 + i * 10, 0);
    }
    for (let i = 0; i < 4; i++) {
        graphics.moveTo(-40, -35 + i * 9);
        graphics.lineTo(40, -35 + i * 9);
    }
    
    // Radar sweep display
    graphics.beginFill(0x002244);
    graphics.lineStyle(1, 0x0088cc);
    graphics.drawCircle(-15, -20, 12);
    graphics.endFill();
    
    // Radar grid lines
    graphics.lineStyle(1, 0x0066aa, 0.6);
    graphics.drawCircle(-15, -20, 4);
    graphics.drawCircle(-15, -20, 8);
    graphics.drawCircle(-15, -20, 12);
    graphics.moveTo(-27, -20);
    graphics.lineTo(-3, -20);
    graphics.moveTo(-15, -32);
    graphics.lineTo(-15, -8);
    
    // Signal strength display
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(5, -32, 30, 20, 3);
    graphics.endFill();
    
    // Signal bars
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 8; i++) {
        const height = 2 + i * 2;
        graphics.drawRect(8 + i * 3, -14 - height, 2, height);
    }
    graphics.endFill();
    
    // Frequency spectrum
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-35, -8, 70, 6, 2);
    graphics.endFill();
    
    // Spectrum waveform
    graphics.lineStyle(1, 0xff6600, 0.8);
    graphics.moveTo(-33, -5);
    for (let i = 0; i <= 66; i++) {
        const x = -33 + i;
        const y = -5 + Math.sin(i * 0.3) * 2 + Math.sin(i * 0.1) * 1;
        graphics.lineTo(x, y);
    }
    
    // Secondary monitors
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-55, 2, 20, 15, 4);
    graphics.drawRoundedRect(35, 2, 20, 15, 4);
    graphics.endFill();
    
    // Secondary screen content
    graphics.beginFill(0x001a00);
    graphics.lineStyle(1, 0x00ff66);
    graphics.drawRoundedRect(-53, 4, 16, 11, 2);
    graphics.endFill();
    
    graphics.beginFill(0x1a0000);
    graphics.lineStyle(1, 0xff6600);
    graphics.drawRoundedRect(37, 4, 16, 11, 2);
    graphics.endFill();
    
    // Control panels
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-50, 22, 35, 35, 6);
    graphics.drawRoundedRect(15, 22, 35, 35, 6);
    graphics.endFill();
    
    // Control buttons layout
    const buttonPositions = [
        {x: -40, y: 30}, {x: -30, y: 30}, {x: -20, y: 30},
        {x: -40, y: 38}, {x: -30, y: 38}, {x: -20, y: 38},
        {x: -40, y: 46}, {x: -30, y: 46}, {x: -20, y: 46}
    ];
    
    buttonPositions.forEach(pos => {
        graphics.beginFill(0x333333);
        graphics.lineStyle(1, 0x666666);
        graphics.drawCircle(pos.x, pos.y, 3);
        graphics.endFill();
    });
    
    // Right panel sliders
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x444444);
    for (let i = 0; i < 5; i++) {
        graphics.drawRoundedRect(20 + i * 6, 25, 4, 25, 2);
    }
    graphics.endFill();
    
    // Slider handles
    graphics.beginFill(0x666666);
    graphics.lineStyle(1, 0x888888);
    for (let i = 0; i < 5; i++) {
        const yPos = 30 + Math.random() * 15;
        graphics.drawRoundedRect(19 + i * 6, yPos, 6, 4, 2);
    }
    graphics.endFill();
    
    // Status indicator panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-25, 22, 30, 35, 6);
    graphics.endFill();
    
    // Status LEDs
    const statusLEDs = [
        {x: -20, y: 28, color: 0x00ff00},
        {x: -15, y: 28, color: 0x00ff00},
        {x: -10, y: 28, color: 0xff6600},
        {x: -5, y: 28, color: 0x0066ff},
        {x: -20, y: 33, color: 0x00ff00},
        {x: -15, y: 33, color: 0xff0000},
        {x: -10, y: 33, color: 0x00ff00},
        {x: -5, y: 33, color: 0x00ff00}
    ];
    
    statusLEDs.forEach(led => {
        graphics.beginFill(led.color);
        graphics.drawCircle(led.x, led.y, 1.5);
        graphics.endFill();
    });
    
    // Digital displays
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-22, 38, 24, 8, 2);
    graphics.drawRoundedRect(-22, 48, 24, 6, 2);
    graphics.endFill();
    
    // Antenna array connection
    graphics.lineStyle(3, 0x333333);
    graphics.moveTo(0, -45);
    graphics.lineTo(0, -65);
    graphics.lineTo(-20, -70);
    graphics.lineTo(-30, -75);
    
    // Support structure
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-5, 57, 10, 8, 4);
    graphics.endFill();
    
    // Add graphics to container
    monitorContainer.addChild(graphics);
    
    // Create animated elements
    
    // Radar sweep
    const radarSweep = new Graphics();
    radarSweep.beginFill(0x0088cc);
    radarSweep.lineStyle(2, 0x00aaff, 0.6);
    radarSweep.moveTo(0, 0);
    radarSweep.lineTo(0, -12);
    radarSweep.endFill();
    radarSweep.x = -15;
    radarSweep.y = -20;
    
    let radarRotation = 0;
    const animateRadar = () => {
        radarRotation += 0.08;
        radarSweep.rotation = radarRotation;
        requestAnimationFrame(animateRadar);
    };
    animateRadar();
    
    monitorContainer.addChild(radarSweep);
    
    // Radar blips
    const radarBlips = [];
    for (let i = 0; i < 3; i++) {
        const blip = new Graphics();
        blip.beginFill(0x00ff88);
        blip.drawCircle(0, 0, 1);
        blip.endFill();
        blip.x = -15 + Math.random() * 20 - 10;
        blip.y = -20 + Math.random() * 20 - 10;
        blip.alpha = 0.8;
        
        let blipTimer = Math.random() * 6.28;
        const animateBlip = () => {
            blipTimer += 0.1;
            blip.alpha = 0.4 + Math.sin(blipTimer) * 0.4;
            requestAnimationFrame(animateBlip);
        };
        animateBlip();
        
        radarBlips.push(blip);
        monitorContainer.addChild(blip);
    }
    
    // Signal strength animation
    const signalBars = [];
    for (let i = 0; i < 8; i++) {
        const bar = new Graphics();
        bar.beginFill(0x00ff66);
        const height = 2 + i * 2;
        bar.drawRect(0, 0, 2, height);
        bar.endFill();
        bar.x = 8 + i * 3;
        bar.y = -14 - height;
        signalBars.push(bar);
        monitorContainer.addChild(bar);
    }
    
    let signalAnimation = 0;
    const animateSignalBars = () => {
        signalAnimation += 0.12;
        signalBars.forEach((bar, index) => {
            bar.alpha = 0.4 + Math.sin(signalAnimation + index * 0.4) * 0.5;
        });
        requestAnimationFrame(animateSignalBars);
    };
    animateSignalBars();
    
    // Frequency spectrum animation
    const spectrumLine = new Graphics();
    spectrumLine.lineStyle(1, 0xff6600, 0.8);
    spectrumLine.x = -35;
    spectrumLine.y = -8;
    
    let spectrumPhase = 0;
    const animateSpectrum = () => {
        spectrumPhase += 0.1;
        spectrumLine.clear();
        spectrumLine.lineStyle(1, 0xff6600, 0.8);
        spectrumLine.moveTo(2, 3);
        
        for (let i = 0; i <= 66; i++) {
            const x = 2 + i;
            const y = 3 + Math.sin(i * 0.3 + spectrumPhase) * 2 + Math.sin(i * 0.1 + spectrumPhase * 0.5) * 1;
            spectrumLine.lineTo(x, y);
        }
        
        requestAnimationFrame(animateSpectrum);
    };
    animateSpectrum();
    
    monitorContainer.addChild(spectrumLine);
    
    // Blinking status LEDs
    const blinkingLEDs = [];
    statusLEDs.forEach((led, index) => {
        const blinkLED = new Graphics();
        blinkLED.beginFill(led.color);
        blinkLED.drawCircle(0, 0, 1.5);
        blinkLED.endFill();
        blinkLED.x = led.x;
        blinkLED.y = led.y;
        
        let blinkTimer = Math.random() * 6.28;
        const speed = 0.05 + Math.random() * 0.1;
        const animateLED = () => {
            blinkTimer += speed;
            blinkLED.alpha = 0.3 + Math.sin(blinkTimer) * 0.6;
            requestAnimationFrame(animateLED);
        };
        animateLED();
        
        blinkingLEDs.push(blinkLED);
        monitorContainer.addChild(blinkLED);
    });
    
    // Screen glow effect
    const screenGlow = new Graphics();
    screenGlow.beginFill(0x0066cc);
    screenGlow.drawRoundedRect(0, 0, 80, 35, 4);
    screenGlow.endFill();
    screenGlow.x = -40;
    screenGlow.y = -35;
    screenGlow.alpha = 0.05;
    
    let glowPulse = 0;
    const animateGlow = () => {
        glowPulse += 0.02;
        screenGlow.alpha = 0.03 + Math.sin(glowPulse) * 0.05;
        requestAnimationFrame(animateGlow);
    };
    animateGlow();
    
    monitorContainer.addChild(screenGlow);
    
    // Data stream visualization
    const createDataStream = () => {
        const stream = new Graphics();
        stream.beginFill(0x00ccff);
        stream.drawRect(0, 0, 1, 2);
        stream.endFill();
        stream.x = -40;
        stream.y = -30 + Math.random() * 25;
        stream.alpha = 0.8;
        
        let streamLife = 0;
        const animateStream = () => {
            streamLife += 0.06;
            stream.x += 2.5;
            stream.alpha = 0.8 - streamLife * 0.1;
            
            if (stream.x < 40 && stream.alpha > 0) {
                requestAnimationFrame(animateStream);
            } else {
                monitorContainer.removeChild(stream);
            }
        };
        animateStream();
        
        return stream;
    };
    
    // Spawn data streams
    setInterval(() => {
        const stream = createDataStream();
        monitorContainer.addChild(stream);
    }, 500);
    
    // Button press simulation
    const simulateButtonPress = () => {
        const randomButton = Math.floor(Math.random() * buttonPositions.length);
        const pos = buttonPositions[randomButton];
        
        const buttonFlash = new Graphics();
        buttonFlash.beginFill(0x00ff66);
        buttonFlash.drawCircle(0, 0, 3);
        buttonFlash.endFill();
        buttonFlash.x = pos.x;
        buttonFlash.y = pos.y;
        buttonFlash.alpha = 0.8;
        
        let flashLife = 0;
        const animateFlash = () => {
            flashLife += 0.15;
            buttonFlash.alpha = 0.8 - flashLife;
            buttonFlash.scale.x = buttonFlash.scale.y = 1 + flashLife * 0.5;
            
            if (buttonFlash.alpha > 0) {
                requestAnimationFrame(animateFlash);
            } else {
                monitorContainer.removeChild(buttonFlash);
            }
        };
        animateFlash();
        
        monitorContainer.addChild(buttonFlash);
    };
    
    // Random button presses
    setInterval(() => {
        if (Math.random() < 0.3) {
            simulateButtonPress();
        }
    }, 2000);
    
    // Digital display updates
    const createDigitalDisplay = (x, y, width, height) => {
        const display = new Graphics();
        display.beginFill(0x00ff00);
        display.drawRect(0, 0, 2, 1);
        display.endFill();
        display.x = x;
        display.y = y;
        display.alpha = 0.8;
        
        let displayTimer = Math.random() * 6.28;
        const animateDisplay = () => {
            displayTimer += 0.08;
            display.alpha = 0.4 + Math.sin(displayTimer) * 0.4;
            requestAnimationFrame(animateDisplay);
        };
        animateDisplay();
        
        return display;
    };
    
    // Add digital display elements
    for (let i = 0; i < 6; i++) {
        const displayElement = createDigitalDisplay(-20 + i * 3, 40, 2, 1);
        monitorContainer.addChild(displayElement);
    }
    
    for (let i = 0; i < 8; i++) {
        const displayElement = createDigitalDisplay(-20 + i * 2.5, 50, 2, 1);
        monitorContainer.addChild(displayElement);
    }
    
    // Secondary screen animations
    const leftSecondaryGlow = new Graphics();
    leftSecondaryGlow.beginFill(0x00ff66);
    leftSecondaryGlow.drawRoundedRect(0, 0, 16, 11, 2);
    leftSecondaryGlow.endFill();
    leftSecondaryGlow.x = -53;
    leftSecondaryGlow.y = 4;
    leftSecondaryGlow.alpha = 0.08;
    
    const rightSecondaryGlow = new Graphics();
    rightSecondaryGlow.beginFill(0xff6600);
    rightSecondaryGlow.drawRoundedRect(0, 0, 16, 11, 2);
    rightSecondaryGlow.endFill();
    rightSecondaryGlow.x = 37;
    rightSecondaryGlow.y = 4;
    rightSecondaryGlow.alpha = 0.08;
    
    let secondaryPulse = 0;
    const animateSecondaryScreens = () => {
        secondaryPulse += 0.06;
        leftSecondaryGlow.alpha = 0.05 + Math.sin(secondaryPulse) * 0.08;
        rightSecondaryGlow.alpha = 0.05 + Math.sin(secondaryPulse + 1.5) * 0.08;
        requestAnimationFrame(animateSecondaryScreens);
    };
    animateSecondaryScreens();
    
    monitorContainer.addChild(leftSecondaryGlow);
    monitorContainer.addChild(rightSecondaryGlow);
    
    // Slider movement animation
    const sliderHandles = [];
    for (let i = 0; i < 5; i++) {
        const handle = new Graphics();
        handle.beginFill(0x888888);
        handle.lineStyle(1, 0xaaaaaa);
        handle.drawRoundedRect(0, 0, 6, 4, 2);
        handle.endFill();
        handle.x = 19 + i * 6;
        handle.y = 30 + Math.random() * 15;
        
        let sliderTimer = Math.random() * 6.28;
        const speed = 0.02 + Math.random() * 0.03;
        const animateSlider = () => {
            sliderTimer += speed;
            handle.y = 32 + Math.sin(sliderTimer) * 8;
            requestAnimationFrame(animateSlider);
        };
        animateSlider();
        
        sliderHandles.push(handle);
        monitorContainer.addChild(handle);
    }
    const bounds = {
  x: x - 65,    
  y: y - 45,       
  width: 130,     
  height: 120,     
  label: "monitoringStation"
};

if(colliders) addWithCollider(camera, monitorContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "monitoringStation",
    bounds,
    message: "A low, steady beep emanates from the Monitoring Station, indicating a constant, vigilant watch over the ship's vital signs",
    bubble: null, 
});
    
    return monitorContainer;
}

function createDataBank(x, y ,camera, colliders) {
    // Create main data bank container
    const dataContainer = new Container();
    dataContainer.x = x;
    dataContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main server rack chassis
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-40, -60, 80, 120, 8);
    graphics.endFill();
    
    // Rack mounting rails
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRect(-35, -55, 4, 110);
    graphics.drawRect(31, -55, 4, 110);
    graphics.endFill();
    
    // Rack unit separators
    graphics.beginFill(0x333333);
    for (let i = 0; i < 8; i++) {
        graphics.drawRect(-35, -50 + i * 15, 70, 2);
    }
    graphics.endFill();
    
    // Storage drive bays (multiple levels)
    const driveBays = [];
    for (let level = 0; level < 7; level++) {
        for (let slot = 0; slot < 4; slot++) {
            const bay = {
                x: -30 + slot * 15,
                y: -45 + level * 15,
                active: Math.random() > 0.3,
                level: level,
                slot: slot
            };
            driveBays.push(bay);
            
            // Drive bay housing
            graphics.beginFill(0x0d0d0d);
            graphics.lineStyle(1, 0x333333);
            graphics.drawRoundedRect(bay.x, bay.y, 12, 8, 2);
            graphics.endFill();
            
            // Drive bay front panel
            graphics.beginFill(0x2d2d2d);
            graphics.lineStyle(1, 0x555555);
            graphics.drawRoundedRect(bay.x + 1, bay.y + 1, 10, 6, 1);
            graphics.endFill();
            
            // Drive bay handle
            graphics.beginFill(0x4a4a4a);
            graphics.drawRoundedRect(bay.x + 9, bay.y + 2, 2, 4, 1);
            graphics.endFill();
        }
    }
    
    // Main control unit
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-35, 62, 70, 25, 6);
    graphics.endFill();
    
    // Control display screen
    graphics.beginFill(0x001a00);
    graphics.lineStyle(1, 0x00ff66);
    graphics.drawRoundedRect(-30, 67, 35, 15, 3);
    graphics.endFill();
    
    // Screen matrix display
    graphics.beginFill(0x00ff66);
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 12; col++) {
            if (Math.random() > 0.7) {
                graphics.drawRect(-28 + col * 2.5, 69 + row * 3, 1, 1);
            }
        }
    }
    graphics.endFill();
    
    // Control buttons
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    const buttonPositions = [
        {x: 8, y: 70}, {x: 15, y: 70}, {x: 22, y: 70},
        {x: 8, y: 76}, {x: 15, y: 76}, {x: 22, y: 76}
    ];
    
    buttonPositions.forEach(pos => {
        graphics.drawCircle(pos.x, pos.y, 2.5);
    });
    graphics.endFill();
    
    // Power distribution unit
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-35, 90, 70, 12, 4);
    graphics.endFill();
    
    // Power outlets
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x333333);
    for (let i = 0; i < 6; i++) {
        graphics.drawRoundedRect(-30 + i * 10, 93, 8, 6, 2);
    }
    graphics.endFill();
    
    // Cooling system
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-35, -75, 70, 12, 4);
    graphics.endFill();
    
    // Cooling fan grills
    graphics.beginFill(0x333333);
    for (let i = 0; i < 3; i++) {
        graphics.drawCircle(-20 + i * 20, -69, 5);
    }
    graphics.endFill();
    
    // Fan blade housings
    graphics.beginFill(0x0d0d0d);
    for (let i = 0; i < 3; i++) {
        graphics.drawCircle(-20 + i * 20, -69, 4);
    }
    graphics.endFill();
    
    // Network connectivity panel
    graphics.beginFill(0x2d2d2d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(25, -45, 12, 40, 4);
    graphics.endFill();
    
    // Network ports
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x333333);
    for (let i = 0; i < 8; i++) {
        graphics.drawRoundedRect(27, -40 + i * 4.5, 8, 3, 1);
    }
    graphics.endFill();
    
    // Status LED strip
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-40, -10, 6, 80, 3);
    graphics.endFill();
    
    // Individual status LEDs
    const statusLEDs = [];
    for (let i = 0; i < 16; i++) {
        const ledColor = Math.random() > 0.7 ? 0x00ff00 : 
                        Math.random() > 0.5 ? 0xff6600 : 0x0066ff;
        statusLEDs.push({
            x: -37,
            y: -5 + i * 4.5,
            color: ledColor,
            active: Math.random() > 0.3
        });
        
        graphics.beginFill(ledColor);
        graphics.drawCircle(-37, -5 + i * 4.5, 1);
        graphics.endFill();
    }
    
    // Cable management
    graphics.lineStyle(4, 0x333333);
    graphics.moveTo(-40, 20);
    graphics.lineTo(-50, 25);
    graphics.lineTo(-45, 35);
    graphics.lineTo(-55, 40);
    
    graphics.moveTo(40, 15);
    graphics.lineTo(50, 20);
    graphics.lineTo(45, 30);
    graphics.lineTo(55, 35);
    
    // Redundant power supplies
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-35, 105, 30, 15, 4);
    graphics.drawRoundedRect(5, 105, 30, 15, 4);
    graphics.endFill();
    
    // Power supply fans
    graphics.beginFill(0x1a1a1a);
    graphics.drawCircle(-20, 112, 4);
    graphics.drawCircle(20, 112, 4);
    graphics.endFill();
    
    // Power supply status
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-28, 108, 1);
    graphics.drawCircle(12, 108, 1);
    graphics.endFill();
    
    // Temperature sensors
    graphics.beginFill(0x4a4a4a);
    graphics.lineStyle(1, 0x777777);
    graphics.drawRoundedRect(-20, -58, 4, 4, 1);
    graphics.drawRoundedRect(0, -58, 4, 4, 1);
    graphics.drawRoundedRect(16, -58, 4, 4, 1);
    graphics.endFill();
    
    // Add graphics to container
    dataContainer.addChild(graphics);
    
    // Create animated elements
    
    // Drive bay activity indicators
    const driveActivities = [];
    driveBays.forEach(bay => {
        if (bay.active) {
            const activityLED = new Graphics();
            activityLED.beginFill(0x00ff00);
            activityLED.drawCircle(0, 0, 0.8);
            activityLED.endFill();
            activityLED.x = bay.x + 2;
            activityLED.y = bay.y + 2;
            
            let activityTimer = Math.random() * 6.28;
            const speed = 0.05 + Math.random() * 0.15;
            const animateActivity = () => {
                activityTimer += speed;
                activityLED.alpha = 0.3 + Math.sin(activityTimer) * 0.6;
                requestAnimationFrame(animateActivity);
            };
            animateActivity();
            
            driveActivities.push(activityLED);
            dataContainer.addChild(activityLED);
        }
    });
    
    // Data access indicators
    const accessIndicators = [];
    driveBays.forEach(bay => {
        const accessLED = new Graphics();
        accessLED.beginFill(0xff6600);
        accessLED.drawCircle(0, 0, 0.5);
        accessLED.endFill();
        accessLED.x = bay.x + 9;
        accessLED.y = bay.y + 2;
        accessLED.alpha = 0;
        
        accessIndicators.push(accessLED);
        dataContainer.addChild(accessLED);
    });
    
    // Random data access animation
    const triggerDataAccess = () => {
        const randomBay = Math.floor(Math.random() * accessIndicators.length);
        const indicator = accessIndicators[randomBay];
        
        let accessLife = 0;
        const animateAccess = () => {
            accessLife += 0.1;
            indicator.alpha = Math.max(0, 1 - accessLife);
            
            if (indicator.alpha > 0) {
                requestAnimationFrame(animateAccess);
            }
        };
        animateAccess();
    };
    
    // Trigger random data access
    setInterval(() => {
        if (Math.random() > 0.7) {
            triggerDataAccess();
        }
    }, 300);
    
    // Cooling fan rotation
    const fanBlades = [];
    for (let i = 0; i < 3; i++) {
        const fan = new Graphics();
        fan.lineStyle(1, 0x666666);
        for (let blade = 0; blade < 4; blade++) {
            const angle = (blade / 4) * Math.PI * 2;
            const x1 = Math.cos(angle) * 1;
            const y1 = Math.sin(angle) * 1;
            const x2 = Math.cos(angle + 0.5) * 3.5;
            const y2 = Math.sin(angle + 0.5) * 3.5;
            fan.moveTo(x1, y1);
            fan.lineTo(x2, y2);
        }
        fan.x = -20 + i * 20;
        fan.y = -69;
        
        let fanRotation = Math.random() * 6.28;
        const fanSpeed = 0.2 + Math.random() * 0.1;
        const animateFan = () => {
            fanRotation += fanSpeed;
            fan.rotation = fanRotation;
            requestAnimationFrame(animateFan);
        };
        animateFan();
        
        fanBlades.push(fan);
        dataContainer.addChild(fan);
    }
    
    // Power supply fan animation
    const psuFans = [];
    for (let i = 0; i < 2; i++) {
        const psuFan = new Graphics();
        psuFan.lineStyle(1, 0x555555);
        for (let blade = 0; blade < 3; blade++) {
            const angle = (blade / 3) * Math.PI * 2;
            const x1 = Math.cos(angle) * 1;
            const y1 = Math.sin(angle) * 1;
            const x2 = Math.cos(angle + 0.4) * 3;
            const y2 = Math.sin(angle + 0.4) * 3;
            psuFan.moveTo(x1, y1);
            psuFan.lineTo(x2, y2);
        }
        psuFan.x = i === 0 ? -20 : 20;
        psuFan.y = 112;
        
        let psuRotation = Math.random() * 6.28;
        const psuSpeed = 0.15 + Math.random() * 0.05;
        const animatePSUFan = () => {
            psuRotation += psuSpeed;
            psuFan.rotation = psuRotation;
            requestAnimationFrame(animatePSUFan);
        };
        animatePSUFan();
        
        psuFans.push(psuFan);
        dataContainer.addChild(psuFan);
    }
    
    // Status LED blinking
    const statusLEDElements = [];
    statusLEDs.forEach(led => {
        const ledElement = new Graphics();
        ledElement.beginFill(led.color);
        ledElement.drawCircle(0, 0, 1);
        ledElement.endFill();
        ledElement.x = led.x;
        ledElement.y = led.y;
        
        let blinkTimer = Math.random() * 6.28;
        const blinkSpeed = 0.03 + Math.random() * 0.07;
        const animateLED = () => {
            blinkTimer += blinkSpeed;
            ledElement.alpha = led.active ? 0.4 + Math.sin(blinkTimer) * 0.5 : 0.1;
            requestAnimationFrame(animateLED);
        };
        animateLED();
        
        statusLEDElements.push(ledElement);
        dataContainer.addChild(ledElement);
    });
    
    // Control screen animation
    const screenMatrix = new Graphics();
    screenMatrix.x = -30;
    screenMatrix.y = 67;
    
    let matrixUpdate = 0;
    const animateMatrix = () => {
        matrixUpdate += 0.1;
        screenMatrix.clear();
        screenMatrix.beginFill(0x00ff66);
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 12; col++) {
                if (Math.sin(matrixUpdate + row + col * 0.5) > 0.3) {
                    screenMatrix.drawRect(2 + col * 2.5, 2 + row * 3, 1, 1);
                }
            }
        }
        screenMatrix.endFill();
        
        requestAnimationFrame(animateMatrix);
    };
    animateMatrix();
    
    dataContainer.addChild(screenMatrix);
    
    // Control screen glow
    const screenGlow = new Graphics();
    screenGlow.beginFill(0x00ff66);
    screenGlow.drawRoundedRect(0, 0, 35, 15, 3);
    screenGlow.endFill();
    screenGlow.x = -30;
    screenGlow.y = 67;
    screenGlow.alpha = 0.05;
    
    let screenPulse = 0;
    const animateScreenGlow = () => {
        screenPulse += 0.02;
        screenGlow.alpha = 0.03 + Math.sin(screenPulse) * 0.05;
        requestAnimationFrame(animateScreenGlow);
    };
    animateScreenGlow();
    
    dataContainer.addChild(screenGlow);
    
    // Network activity indicators
    const networkActivities = [];
    for (let i = 0; i < 8; i++) {
        const netLED = new Graphics();
        netLED.beginFill(0x00ff00);
        netLED.drawCircle(0, 0, 0.5);
        netLED.endFill();
        netLED.x = 32;
        netLED.y = -39 + i * 4.5;
        netLED.alpha = 0;
        
        networkActivities.push(netLED);
        dataContainer.addChild(netLED);
    }
    
    // Network activity animation
    const triggerNetworkActivity = () => {
        const randomPort = Math.floor(Math.random() * networkActivities.length);
        const netLED = networkActivities[randomPort];
        
        let activityLife = 0;
        const animateNetActivity = () => {
            activityLife += 0.08;
            netLED.alpha = Math.max(0, 0.8 - activityLife);
            
            if (netLED.alpha > 0) {
                requestAnimationFrame(animateNetActivity);
            }
        };
        animateNetActivity();
    };
    
    // Trigger network activity
    setInterval(() => {
        if (Math.random() > 0.6) {
            triggerNetworkActivity();
        }
    }, 400);
    
    // Button press simulation
    const simulateButtonPress = () => {
        const randomButton = Math.floor(Math.random() * buttonPositions.length);
        const pos = buttonPositions[randomButton];
        
        const buttonFlash = new Graphics();
        buttonFlash.beginFill(0x00ccff);
        buttonFlash.drawCircle(0, 0, 2.5);
        buttonFlash.endFill();
        buttonFlash.x = pos.x;
        buttonFlash.y = pos.y;
        buttonFlash.alpha = 0.8;
        
        let flashLife = 0;
        const animateFlash = () => {
            flashLife += 0.12;
            buttonFlash.alpha = 0.8 - flashLife;
            buttonFlash.scale.x = buttonFlash.scale.y = 1 + flashLife * 0.3;
            
            if (buttonFlash.alpha > 0) {
                requestAnimationFrame(animateFlash);
            } else {
                dataContainer.removeChild(buttonFlash);
            }
        };
        animateFlash();
        
        dataContainer.addChild(buttonFlash);
    };
    
    // Random button presses
    setInterval(() => {
        if (Math.random() < 0.2) {
            simulateButtonPress();
        }
    }, 3000);
    
    // Data flow visualization
    const createDataFlow = () => {
        const dataPacket = new Graphics();
        dataPacket.beginFill(0x00ccff);
        dataPacket.drawRect(0, 0, 2, 1);
        dataPacket.endFill();
        dataPacket.x = -35;
        dataPacket.y = Math.random() * 100 - 50;
        dataPacket.alpha = 0.8;
        
        let flowLife = 0;
        const animateDataFlow = () => {
            flowLife += 0.06;
            dataPacket.x += 2;
            dataPacket.alpha = 0.8 - flowLife * 0.1;
            
            if (dataPacket.x < 35 && dataPacket.alpha > 0) {
                requestAnimationFrame(animateDataFlow);
            } else {
                dataContainer.removeChild(dataPacket);
            }
        };
        animateDataFlow();
        
        return dataPacket;
    };
    
    // Spawn data flow
    setInterval(() => {
        const dataPacket = createDataFlow();
        dataContainer.addChild(dataPacket);
    }, 800);
    
    // Temperature monitoring
    const tempSensors = [];
    for (let i = 0; i < 3; i++) {
        const tempLED = new Graphics();
        tempLED.beginFill(i === 1 ? 0xff6600 : 0x00ff00);
        tempLED.drawCircle(0, 0, 0.8);
        tempLED.endFill();
        tempLED.x = -18 + i * 16;
        tempLED.y = -56;
        
        let tempTimer = Math.random() * 6.28;
        const tempSpeed = 0.02 + Math.random() * 0.03;
        const animateTempSensor = () => {
            tempTimer += tempSpeed;
            tempLED.alpha = 0.4 + Math.sin(tempTimer) * 0.4;
            requestAnimationFrame(animateTempSensor);
        };
        animateTempSensor();
        
        tempSensors.push(tempLED);
        dataContainer.addChild(tempLED);
        
    }
    const bounds = {
  x: x - 45,       // includes cooling fans on the top and cables extending left
  y: y - 80,       // includes top cooling system (starts at -75) and some margin
  width: 90,       // from -45 to +45 (cables extend beyond -40/+40)
  height: 210,     // from -80 (cooling) to +130 (bottom PSU)
  label: "dataBank"
};
if (colliders) addWithCollider(camera, dataContainer, bounds, colliders);

if (!window.interactables) window.interactables = [];
window.interactables.push({
  label: "dataBank",
  bounds,
  message: "The cool, smooth surface of the Databank console invites interaction, promising access to centuries of collected knowledge and vital ship records",
  bubble: null,
});
    
    return dataContainer;
}

function createMedBed(x, y, camera, colliders) {
    // Create main medical bed container
    const medBedContainer = new Container();
    medBedContainer.x = x;
    medBedContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Bed base platform
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-80, 20, 160, 40, 8);
    graphics.endFill();
    
    // Bed surface/mattress
    graphics.beginFill(0x1a4a6a);
    graphics.lineStyle(2, 0x2a6a8a);
    graphics.drawRoundedRect(-75, 10, 150, 25, 6);
    graphics.endFill();
    
    // Bed surface padding lines
    graphics.lineStyle(1, 0x3a7a9a, 0.6);
    for (let i = 0; i < 7; i++) {
        graphics.moveTo(-70 + i * 23, 12);
        graphics.lineTo(-70 + i * 23, 33);
    }
    
    // Head section elevated
    graphics.beginFill(0x1a4a6a);
    graphics.lineStyle(2, 0x2a6a8a);
    graphics.drawRoundedRect(-75, 5, 50, 20, 6);
    graphics.endFill();
    
    // Medical scanner arch
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-85, -45, 170, 15, 8);
    graphics.endFill();
    
    // Scanner arch supports
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-85, -35, 12, 75, 6);
    graphics.drawRoundedRect(73, -35, 12, 75, 6);
    graphics.endFill();
    
    // Scanner array inside arch
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-80, -42, 160, 8, 4);
    graphics.endFill();
    
    // Individual scanner elements
    graphics.beginFill(0x004466);
    for (let i = 0; i < 16; i++) {
        graphics.drawCircle(-75 + i * 10, -38, 2);
    }
    graphics.endFill();
    
    // Vital signs monitor
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(90, -20, 50, 35, 8);
    graphics.endFill();
    
    // Monitor screen
    graphics.beginFill(0x001122);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawRoundedRect(95, -15, 40, 25, 6);
    graphics.endFill();
    
    // Heart rate line
    graphics.lineStyle(2, 0x00ff66);
    graphics.moveTo(100, -2);
    const heartRatePoints = [
        {x: 100, y: -2}, {x: 105, y: -2}, {x: 107, y: -10}, {x: 110, y: 5},
        {x: 112, y: -8}, {x: 115, y: -2}, {x: 125, y: -2}, {x: 130, y: -2}
    ];
    heartRatePoints.forEach(point => {
        graphics.lineTo(point.x, point.y);
    });
    
    // IV stand
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-95, -80, 8, 120, 4);
    graphics.endFill();
    
    // IV base
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawCircle(-91, 38, 12);
    graphics.endFill();
    
    // IV bag
    graphics.beginFill(0x4a6a8a);
    graphics.lineStyle(2, 0x6a8aaa);
    graphics.drawRoundedRect(-100, -75, 18, 25, 6);
    graphics.endFill();
    
    // IV tube
    graphics.lineStyle(2, 0x888888);
    graphics.moveTo(-88, -50);
    graphics.bezierCurveTo(-80, -40, -70, -30, -60, 15);
    
    // Control panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-60, 45, 120, 25, 6);
    graphics.endFill();
    
    // Control buttons
    const controlButtons = [
        {x: -45, y: 52, color: 0x00ff00}, // Start
        {x: -30, y: 52, color: 0xff0000}, // Stop
        {x: -15, y: 52, color: 0x0066ff}, // Scan
        {x: 0, y: 52, color: 0xff6600},   // Adjust
        {x: 15, y: 52, color: 0xffff00},  // Settings
        {x: 30, y: 52, color: 0xff00ff},  // Emergency
    ];
    
    controlButtons.forEach(button => {
        graphics.beginFill(button.color);
        graphics.lineStyle(2, 0x333333);
        graphics.drawRoundedRect(button.x - 5, button.y - 3, 10, 6, 3);
        graphics.endFill();
    });
    
    // Status display
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(40, 47, 35, 12, 4);
    graphics.endFill();
    
    // Bed legs
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-75, 55, 8, 15, 4);
    graphics.drawRoundedRect(-35, 55, 8, 15, 4);
    graphics.drawRoundedRect(25, 55, 8, 15, 4);
    graphics.drawRoundedRect(65, 55, 8, 15, 4);
    graphics.endFill();
    
    // Add graphics to container
    medBedContainer.addChild(graphics);
    
    // Create animated elements
    
    // Scanner beam animation
    const scannerBeam = new Graphics();
    scannerBeam.beginFill(0x00ccff);
    scannerBeam.drawRoundedRect(0, 0, 150, 3, 2);
    scannerBeam.endFill();
    scannerBeam.x = -75;
    scannerBeam.y = -40;
    scannerBeam.alpha = 0.6;
    
    let beamPosition = 0;
    let beamDirection = 1;
    const animateBeam = () => {
        beamPosition += beamDirection * 0.8;
        scannerBeam.y = -40 + beamPosition;
        scannerBeam.alpha = 0.8 - Math.abs(beamPosition) * 0.01;
        
        if (beamPosition > 60 || beamPosition < -5) {
            beamDirection *= -1;
        }
        
        requestAnimationFrame(animateBeam);
    };
    animateBeam();
    
    medBedContainer.addChild(scannerBeam);
    
    // Scanner elements pulsing
    const scannerElements = [];
    for (let i = 0; i < 16; i++) {
        const element = new Graphics();
        element.beginFill(0x00aaff);
        element.drawCircle(0, 0, 2);
        element.endFill();
        element.x = -75 + i * 10;
        element.y = -38;
        
        let pulseTimer = i * 0.4;
        const animatePulse = () => {
            pulseTimer += 0.06;
            element.alpha = 0.4 + Math.sin(pulseTimer) * 0.6;
            element.scale.x = element.scale.y = 0.8 + Math.sin(pulseTimer) * 0.4;
            requestAnimationFrame(animatePulse);
        };
        animatePulse();
        
        scannerElements.push(element);
        medBedContainer.addChild(element);
    }
    
    // Vital signs animation
    const vitalSigns = new Graphics();
    vitalSigns.lineStyle(2, 0x00ff66);
    vitalSigns.x = 95;
    vitalSigns.y = -2;
    
    let vitalPhase = 0;
    const animateVitals = () => {
        vitalPhase += 0.1;
        vitalSigns.clear();
        vitalSigns.lineStyle(2, 0x00ff66);
        vitalSigns.moveTo(5, 0);
        
        for (let i = 0; i <= 35; i++) {
            const x = 5 + i;
            let y = 0;
            
            // Create heartbeat pattern
            if (i % 15 === 5) {
                y = -8 + Math.sin(vitalPhase * 2) * 2;
            } else if (i % 15 === 6) {
                y = 3 + Math.sin(vitalPhase * 2) * 1;
            } else if (i % 15 === 7) {
                y = -6 + Math.sin(vitalPhase * 2) * 1;
            } else {
                y = Math.sin(i * 0.2 + vitalPhase) * 0.5;
            }
            
            vitalSigns.lineTo(x, y);
        }
        
        requestAnimationFrame(animateVitals);
    };
    animateVitals();
    
    medBedContainer.addChild(vitalSigns);
    
    // Status LEDs animation
    const statusLEDs = [];
    controlButtons.forEach((button, index) => {
        const led = new Graphics();
        led.beginFill(button.color);
        led.drawCircle(0, 0, 2);
        led.endFill();
        led.x = button.x;
        led.y = button.y - 8;
        
        let ledTimer = index * 0.8;
        const animateLED = () => {
            ledTimer += 0.04;
            led.alpha = 0.3 + Math.sin(ledTimer) * 0.5;
            requestAnimationFrame(animateLED);
        };
        animateLED();
        
        statusLEDs.push(led);
        medBedContainer.addChild(led);
    });
    
    // IV drip animation
    const createIVDrop = () => {
        const drop = new Graphics();
        drop.beginFill(0x88ccff);
        drop.drawCircle(0, 0, 1);
        drop.endFill();
        drop.x = -88;
        drop.y = -50;
        drop.alpha = 0.8;
        
        let dropSpeed = 0.5;
        const animateDrop = () => {
            drop.y += dropSpeed;
            drop.alpha = 0.8 - (drop.y + 50) * 0.01;
            
            if (drop.y < 15) {
                requestAnimationFrame(animateDrop);
            } else {
                medBedContainer.removeChild(drop);
            }
        };
        animateDrop();
        
        return drop;
    };
    
    // Spawn IV drops
    setInterval(() => {
        const drop = createIVDrop();
        medBedContainer.addChild(drop);
    }, 1500);
    
    // Holographic patient data
    const patientData = [];
    for (let i = 0; i < 8; i++) {
        const dataPoint = new Graphics();
        dataPoint.beginFill(0x00ffcc);
        dataPoint.drawRect(0, 0, 1, 2);
        dataPoint.endFill();
        dataPoint.x = -70 + i * 15;
        dataPoint.y = -10;
        dataPoint.alpha = 0.6;
        
        let dataTimer = i * 0.6;
        const animateData = () => {
            dataTimer += 0.08;
            dataPoint.alpha = 0.3 + Math.sin(dataTimer) * 0.4;
            dataPoint.y = -10 + Math.sin(dataTimer * 0.5) * 3;
            requestAnimationFrame(animateData);
        };
        animateData();
        
        patientData.push(dataPoint);
        medBedContainer.addChild(dataPoint);
    }
    const bounds = {
  x: x - 100,
  y: y - 40,
  width: 190,
  height: 150,
  label: "medbed"
};

if(colliders){
    addWithCollider(camera, medBedContainer, bounds, colliders);
}
if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "medbed",
    bounds,
    message: "Critical care array engaged. Monitoring neural and physiological functions.",
    bubble: null,
});
    return medBedContainer;
}

function createMedScanner(x, y, camera, colliders) {
    // Create main medical scanner container
    const scannerContainer = new Container();
    scannerContainer.x = x;
    scannerContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Scanner base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-40, 40, 80, 25, 8);
    graphics.endFill();
    
    // Main scanner column
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-15, -60, 30, 105, 8);
    graphics.endFill();
    
    // Scanner head unit
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-35, -65, 70, 20, 10);
    graphics.endFill();
    
    // Scanner lens array
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-30, -62, 60, 14, 7);
    graphics.endFill();
    
    // Individual scanner lenses
    const lensPositions = [
        {x: -20, y: -55}, {x: -5, y: -55}, {x: 10, y: -55},
        {x: -12, y: -58}, {x: 3, y: -58}, {x: 18, y: -58},
        {x: -20, y: -52}, {x: -5, y: -52}, {x: 10, y: -52}
    ];
    
    lensPositions.forEach(lens => {
        graphics.beginFill(0x004466);
        graphics.lineStyle(1, 0x0088cc);
        graphics.drawCircle(lens.x, lens.y, 3);
        graphics.endFill();
        
        // Lens center
        graphics.beginFill(0x00aaff);
        graphics.drawCircle(lens.x, lens.y, 1);
        graphics.endFill();
    });
    
    // Articulated arm segments
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-8, -35, 16, 25, 6);
    graphics.drawRoundedRect(-8, -10, 16, 20, 6);
    graphics.drawRoundedRect(-8, 15, 16, 20, 6);
    graphics.endFill();
    
    // Arm joints
    graphics.beginFill(0x444444);
    graphics.lineStyle(2, 0x666666);
    graphics.drawCircle(0, -23, 6);
    graphics.drawCircle(0, 2, 6);
    graphics.drawCircle(0, 27, 6);
    graphics.endFill();
    
    // Control interface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(45, -20, 35, 45, 8);
    graphics.endFill();
    
    // Interface screen
    graphics.beginFill(0x001122);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawRoundedRect(50, -15, 25, 20, 6);
    graphics.endFill();
    
    // Screen grid
    graphics.lineStyle(1, 0x004466, 0.4);
    for (let i = 0; i < 6; i++) {
        graphics.moveTo(50 + i * 5, -15);
        graphics.lineTo(50 + i * 5, 5);
    }
    for (let i = 0; i < 5; i++) {
        graphics.moveTo(50, -15 + i * 5);
        graphics.lineTo(75, -15 + i * 5);
    }
    
    // Control buttons
    const scannerButtons = [
        {x: 52, y: 10, color: 0x00ff00}, // Scan
        {x: 62, y: 10, color: 0xff6600}, // Adjust
        {x: 72, y: 10, color: 0xff0000}, // Stop
        {x: 52, y: 18, color: 0x0066ff}, // Settings
        {x: 62, y: 18, color: 0xffff00}, // Calibrate
        {x: 72, y: 18, color: 0xff00ff}  // Emergency
    ];
    
    scannerButtons.forEach(button => {
        graphics.beginFill(button.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawRoundedRect(button.x - 3, button.y - 2, 6, 4, 2);
        graphics.endFill();
    });
    
    // Laser targeting system
    graphics.beginFill(0x4a0000);
    graphics.lineStyle(2, 0x8a0000);
    graphics.drawRoundedRect(-25, -68, 50, 5, 3);
    graphics.endFill();
    
    // Targeting crosshairs
    graphics.lineStyle(1, 0xff0000, 0.8);
    graphics.moveTo(-20, -65);
    graphics.lineTo(20, -65);
    graphics.moveTo(0, -68);
    graphics.lineTo(0, -63);
    
    // Data cables
    graphics.lineStyle(3, 0x333333);
    graphics.moveTo(80, 0);
    graphics.bezierCurveTo(90, -10, 95, -20, 85, -30);
    graphics.bezierCurveTo(75, -35, 65, -25, 60, -15);
    
    // Scanner feet
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-35, 60, 12, 8, 4);
    graphics.drawRoundedRect(-5, 60, 12, 8, 4);
    graphics.drawRoundedRect(25, 60, 12, 8, 4);
    graphics.endFill();
    
    // Add graphics to container
    scannerContainer.addChild(graphics);
    
    // Create animated elements
    
    // Scanner beam projection
    const scanBeam = new Graphics();
    scanBeam.beginFill(0x00ccff);
    scanBeam.drawPolygon([
        0, 0,
        -30, 80,
        30, 80
    ]);
    scanBeam.endFill();
    scanBeam.x = 0;
    scanBeam.y = -45;
    scanBeam.alpha = 0.15;
    
    let beamPulse = 0;
    const animateScanBeam = () => {
        beamPulse += 0.08;
        scanBeam.alpha = 0.1 + Math.sin(beamPulse) * 0.15;
        requestAnimationFrame(animateScanBeam);
    };
    animateScanBeam();
    
    scannerContainer.addChild(scanBeam);
    
    // Rotating scanner head
    const scannerHead = new Graphics();
    scannerHead.beginFill(0x1a1a1a);
    scannerHead.lineStyle(2, 0x333333);
    scannerHead.drawRoundedRect(-35, -10, 70, 20, 10);
    scannerHead.endFill();
    scannerHead.x = 0;
    scannerHead.y = -55;
    
    let headRotation = 0;
    const animateHead = () => {
        headRotation += 0.02;
        scannerHead.rotation = Math.sin(headRotation) * 0.3;
        requestAnimationFrame(animateHead);
    };
    animateHead();
    
    scannerContainer.addChild(scannerHead);
    
    // Pulsing scanner lenses
    const scannerLenses = [];
    lensPositions.forEach((lens, index) => {
        const lensGlow = new Graphics();
        lensGlow.beginFill(0x00aaff);
        lensGlow.drawCircle(0, 0, 3);
        lensGlow.endFill();
        lensGlow.x = lens.x;
        lensGlow.y = lens.y;
        lensGlow.alpha = 0.4;
        
        let lensTimer = index * 0.7;
        const animateLens = () => {
            lensTimer += 0.09;
            lensGlow.alpha = 0.3 + Math.sin(lensTimer) * 0.6;
            lensGlow.scale.x = lensGlow.scale.y = 0.8 + Math.sin(lensTimer) * 0.4;
            requestAnimationFrame(animateLens);
        };
        animateLens();
        
        scannerLenses.push(lensGlow);
        scannerContainer.addChild(lensGlow);
    });
    
    // Scanning pattern display
    const scanPattern = new Graphics();
    scanPattern.lineStyle(2, 0x00ff88);
    scanPattern.x = 50;
    scanPattern.y = -15;
    
    let scanPhase = 0;
    const animateScanPattern = () => {
        scanPhase += 0.12;
        scanPattern.clear();
        scanPattern.lineStyle(2, 0x00ff88);
        
        // Create radar-like sweep pattern
        for (let i = 0; i < 8; i++) {
            const angle = (scanPhase + i * 0.785) % 6.28;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 8;
            
            scanPattern.moveTo(12.5, 2.5);
            scanPattern.lineTo(12.5 + x, 2.5 + y);
        }
        
        requestAnimationFrame(animateScanPattern);
    };
    animateScanPattern();
    
    scannerContainer.addChild(scanPattern);
    
    // Button press indicators
    const buttonGlows = [];
    scannerButtons.forEach((button, index) => {
        const glow = new Graphics();
        glow.beginFill(button.color);
        glow.drawRoundedRect(0, 0, 6, 4, 2);
        glow.endFill();
        glow.x = button.x - 3;
        glow.y = button.y - 2;
        glow.alpha = 0.2;
        
        let glowTimer = index * 1.2;
        const animateGlow = () => {
            glowTimer += 0.05;
            glow.alpha = 0.2 + Math.sin(glowTimer) * 0.4;
            requestAnimationFrame(animateGlow);
        };
        animateGlow();
        
        buttonGlows.push(glow);
        scannerContainer.addChild(glow);
    });
    
    // Data stream from scanner
    const createDataStream = () => {
        const stream = new Graphics();
        stream.beginFill(0x00ffcc);
        stream.drawRect(0, 0, 2, 1);
        stream.endFill();
        stream.x = Math.random() * 60 - 30;
        stream.y = -45;
        stream.alpha = 0.8;
        
        let streamSpeed = 0.8 + Math.random() * 0.4;
        const animateStream = () => {
            stream.y += streamSpeed;
            stream.alpha = 0.8 - (stream.y + 45) * 0.01;
            
            if (stream.y < 60 && stream.alpha > 0) {
                requestAnimationFrame(animateStream);
            } else {
                scannerContainer.removeChild(stream);
            }
        };
        animateStream();
        
        return stream;
    };
    
    // Spawn data streams
    setInterval(() => {
        const stream = createDataStream();
        scannerContainer.addChild(stream);
    }, 400);
    
    // Laser targeting line
    const targetingLine = new Graphics();
    targetingLine.lineStyle(2, 0xff0000, 0.6);
    targetingLine.moveTo(0, 0);
    targetingLine.lineTo(0, 100);
    targetingLine.x = 0;
    targetingLine.y = -65;
    
    let targetingPulse = 0;
    const animateTargeting = () => {
        targetingPulse += 0.15;
        targetingLine.alpha = 0.3 + Math.sin(targetingPulse) * 0.4;
        requestAnimationFrame(animateTargeting);
    };
    animateTargeting();
    
    scannerContainer.addChild(targetingLine);
    
    // Calibration particles
    const calibrationParticles = [];
    for (let i = 0; i < 12; i++) {
        const particle = new Graphics();
        particle.beginFill(0x66ccff);
        particle.drawCircle(0, 0, 1);
        particle.endFill();
        particle.x = Math.random() * 60 - 30;
        particle.y = Math.random() * 80 - 40;
        
        let particleTimer = Math.random() * 6.28;
        const particleSpeed = 0.03 + Math.random() * 0.05;
        const animateParticle = () => {
            particleTimer += particleSpeed;
            particle.x += Math.cos(particleTimer) * 0.5;
            particle.y += Math.sin(particleTimer) * 0.3;
            particle.alpha = 0.4 + Math.sin(particleTimer * 2) * 0.4;
            
            // Keep particles within bounds
            if (particle.x < -35) particle.x = 35;
            if (particle.x > 35) particle.x = -35;
            if (particle.y < -45) particle.y = 45;
            if (particle.y > 45) particle.y = -45;
            
            requestAnimationFrame(animateParticle);
        };
        animateParticle();
        
        calibrationParticles.push(particle);
        scannerContainer.addChild(particle);
    }
    const bounds = {
  x: x - 40,         // Left of scanner base
  y: y - 70,         // Top of scanner head
  width: 90,        // Covers all elements (arm, UI, cables)
  height: 140,
  label: "medscanner"
};
if(colliders){
    addWithCollider(camera, scannerContainer, bounds, colliders);
}

if(!window.interactables) window.interactables = [];
window.interactables.push({
    bounds,
    message: "The Medscanner hums softly, its diagnostic light currently off, awaiting a patient",
    bubble: null,
});

    
    return scannerContainer;
}

function createMedStorage(x, y, camera, colliders) {
    // Create main medical storage container
    const medContainer = new Container();
    medContainer.x = x;
    medContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main storage unit base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-30, -25, 60, 50, 6);
    graphics.endFill();
    
    // Storage unit front panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-28, -23, 56, 46, 4);
    graphics.endFill();
    
    // Display screen
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, -20, 50, 18, 4);
    graphics.endFill();
    
    // Screen bezel
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-23, -18, 46, 14, 3);
    graphics.endFill();
    
    // Main display area
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-22, -17, 44, 12, 2);
    graphics.endFill();
    
    // Medical cross symbol
    graphics.beginFill(0x00cc44);
    graphics.drawRect(-2, -14, 4, 8);
    graphics.drawRect(-6, -12, 12, 4);
    graphics.endFill();
    
    // Temperature readout
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(8, -16, 12, 10, 2);
    graphics.endFill();
    
    // Temperature display bars
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 4; i++) {
        graphics.drawRect(10 + i * 2, -14 + i, 1, 6 - i);
    }
    graphics.endFill();
    
    // Inventory status display
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-20, -16, 12, 10, 2);
    graphics.endFill();
    
    // Inventory grid
    graphics.lineStyle(1, 0xff6600, 0.6);
    for (let i = 0; i < 4; i++) {
        graphics.moveTo(-18 + i * 3, -14);
        graphics.lineTo(-18 + i * 3, -8);
    }
    for (let i = 0; i < 3; i++) {
        graphics.moveTo(-20, -14 + i * 2);
        graphics.lineTo(-8, -14 + i * 2);
    }
    
    // Control panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, 2, 50, 20, 4);
    graphics.endFill();
    
    // Control buttons
    const buttonPositions = [
        {x: -18, y: 8}, {x: -10, y: 8}, {x: -2, y: 8}, {x: 6, y: 8}, {x: 14, y: 8},
        {x: -18, y: 14}, {x: -10, y: 14}, {x: -2, y: 14}, {x: 6, y: 14}, {x: 14, y: 14}
    ];
    
    buttonPositions.forEach(pos => {
        graphics.beginFill(0x333333);
        graphics.lineStyle(1, 0x666666);
        graphics.drawCircle(pos.x, pos.y, 2);
        graphics.endFill();
    });
    
    // Status indicators
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-20, 25, 40, 8, 3);
    graphics.endFill();
    
    // Status LEDs
    const statusLEDs = [
        {x: -15, y: 29, color: 0x00ff00},
        {x: -9, y: 29, color: 0x00ff00},
        {x: -3, y: 29, color: 0xff6600},
        {x: 3, y: 29, color: 0x00ff00},
        {x: 9, y: 29, color: 0x0066ff},
        {x: 15, y: 29, color: 0x00ff00}
    ];
    
    statusLEDs.forEach(led => {
        graphics.beginFill(led.color);
        graphics.drawCircle(led.x, led.y, 1);
        graphics.endFill();
    });
    
    // Add graphics to container
    medContainer.addChild(graphics);
    const bounds = {
  x: x - 30,
  y: y - 25,
  width: 60,
  height: 58,
  label: "medstorage"
};
if(colliders){
    addWithCollider(camera, medContainer, bounds, colliders);
}
    
    return medContainer;
}

function createEmergencyKit(x, y,camera, colliders) {
    // Create main emergency kit container
    const emergencyContainer = new Container();
    emergencyContainer.x = x;
    emergencyContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main emergency unit base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-30, -25, 60, 50, 6);
    graphics.endFill();
    
    // Emergency unit front panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-28, -23, 56, 46, 4);
    graphics.endFill();
    
    // Main display screen
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, -20, 50, 18, 4);
    graphics.endFill();
    
    // Screen bezel
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-23, -18, 46, 14, 3);
    graphics.endFill();
    
    // Emergency display area
    graphics.beginFill(0x220000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-22, -17, 44, 12, 2);
    graphics.endFill();
    
    // Emergency alert symbol
    graphics.beginFill(0xff4400);
    graphics.drawPolygon([
        0, -15,
        -4, -8,
        4, -8
    ]);
    graphics.endFill();
    
    // Alert symbol exclamation
    graphics.beginFill(0xffffff);
    graphics.drawRect(-0.5, -13, 1, 3);
    graphics.drawCircle(0, -9, 0.5);
    graphics.endFill();
    
    // Emergency status display
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(8, -16, 12, 10, 2);
    graphics.endFill();
    
    // Status grid
    graphics.lineStyle(1, 0x00ff66, 0.6);
    for (let i = 0; i < 4; i++) {
        graphics.moveTo(10 + i * 2, -14);
        graphics.lineTo(10 + i * 2, -8);
    }
    for (let i = 0; i < 3; i++) {
        graphics.moveTo(8, -14 + i * 2);
        graphics.lineTo(20, -14 + i * 2);
    }
    
    // Communication display
    graphics.beginFill(0x000022);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-20, -16, 12, 10, 2);
    graphics.endFill();
    
    // Communication signal bars
    graphics.beginFill(0x0088ff);
    for (let i = 0; i < 4; i++) {
        const height = 1 + i;
        graphics.drawRect(-18 + i * 2, -8 - height, 1, height);
    }
    graphics.endFill();
    
    // Emergency control panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, 2, 50, 20, 4);
    graphics.endFill();
    
    // Emergency buttons
    const emergencyButtons = [
        {x: -15, y: 8, color: 0xff0000},
        {x: -5, y: 8, color: 0xff6600},
        {x: 5, y: 8, color: 0xffff00},
        {x: 15, y: 8, color: 0x00ff00}
    ];
    
    emergencyButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x666666);
        graphics.drawCircle(btn.x, btn.y, 3);
        graphics.endFill();
        
        // Button center
        graphics.beginFill(0x333333);
        graphics.drawCircle(btn.x, btn.y, 1);
        graphics.endFill();
    });
    
    // Secondary controls
    const secondaryButtons = [
        {x: -18, y: 16}, {x: -10, y: 16}, {x: -2, y: 16}, 
        {x: 6, y: 16}, {x: 14, y: 16}, {x: 22, y: 16}
    ];
    
    secondaryButtons.forEach(pos => {
        graphics.beginFill(0x333333);
        graphics.lineStyle(1, 0x666666);
        graphics.drawCircle(pos.x, pos.y, 1.5);
        graphics.endFill();
    });
    
    // Emergency beacon
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-8, -30, 16, 6, 3);
    graphics.endFill();
    
    // Beacon light
    graphics.beginFill(0xff0000);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(0, -27, 2);
    graphics.endFill();
    
    // Emergency status panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-20, 25, 40, 8, 3);
    graphics.endFill();
    
    // Emergency status LEDs
    const emergencyLEDs = [
        {x: -15, y: 29, color: 0xff0000},
        {x: -9, y: 29, color: 0xff0000},
        {x: -3, y: 29, color: 0xff6600},
        {x: 3, y: 29, color: 0x00ff00},
        {x: 9, y: 29, color: 0x0066ff},
        {x: 15, y: 29, color: 0x00ff00}
    ];
    
    emergencyLEDs.forEach(led => {
        graphics.beginFill(led.color);
        graphics.drawCircle(led.x, led.y, 1);
        graphics.endFill();
    });
    
    // Add graphics to container
    emergencyContainer.addChild(graphics);
    const bounds = {
  x: x - 30,
  y: y - 25,
  width: 60,
  height: 58,
  label: "emergencykit"
};
if(colliders){
    addWithCollider(camera, emergencyContainer, bounds, colliders);
}
    
    return emergencyContainer;
}

function createLabWorkstation(x, y, camera, colliders) {
    // Create main lab workstation container
    const labContainer = new Container();
    labContainer.x = x;
    labContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main workstation table base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-70, 20, 140, 30, 8);
    graphics.endFill();
    
    // Workstation surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-65, 15, 130, 25, 6);
    graphics.endFill();
    
    // Left equipment rack
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-65, -30, 25, 50, 6);
    graphics.endFill();
    
    // Microscope housing
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-60, -25, 15, 20, 4);
    graphics.endFill();
    
    // Microscope eyepiece
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x555555);
    graphics.drawCircle(-52, -30, 3);
    graphics.endFill();
    
    // Microscope objective lenses
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(-52, -15, 2);
    graphics.drawCircle(-52, -12, 1.5);
    graphics.drawCircle(-52, -9, 1);
    graphics.endFill();
    
    // Microscope stage
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-57, -10, 10, 8, 2);
    graphics.endFill();
    
    // Sample slides on stage
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-55, -8, 6, 4, 1);
    graphics.endFill();
    
    // Central analysis unit
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-30, -35, 60, 55, 8);
    graphics.endFill();
    
    // Main display screen
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, -30, 50, 30, 6);
    graphics.endFill();
    
    // Screen bezel
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-23, -28, 46, 26, 4);
    graphics.endFill();
    
    // Display area
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-21, -26, 42, 22, 3);
    graphics.endFill();
    
    // Display grid overlay
    graphics.lineStyle(1, 0x004466, 0.4);
    for (let i = 0; i < 5; i++) {
        graphics.moveTo(-21 + i * 10.5, -26);
        graphics.lineTo(-21 + i * 10.5, -4);
    }
    for (let i = 0; i < 3; i++) {
        graphics.moveTo(-21, -26 + i * 11);
        graphics.lineTo(21, -26 + i * 11);
    }
    
    // Molecular structure display
    graphics.beginFill(0x002244);
    graphics.lineStyle(1, 0x0088cc);
    graphics.drawCircle(-10, -15, 8);
    graphics.endFill();
    
    // Molecular bonds
    graphics.lineStyle(1, 0x0066aa, 0.6);
    graphics.drawCircle(-10, -15, 3);
    graphics.drawCircle(-10, -15, 6);
    graphics.moveTo(-18, -15);
    graphics.lineTo(-2, -15);
    graphics.moveTo(-10, -23);
    graphics.lineTo(-10, -7);
    graphics.moveTo(-16, -21);
    graphics.lineTo(-4, -9);
    graphics.moveTo(-16, -9);
    graphics.lineTo(-4, -21);
    
    // Data readout display
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(5, -23, 15, 15, 2);
    graphics.endFill();
    
    // Data bars
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 6; i++) {
        const height = 1 + i * 1.5;
        graphics.drawRect(7 + i * 2, -11 - height, 1.5, height);
    }
    graphics.endFill();
    
    // Spectrum analyzer
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-18, -8, 36, 4, 2);
    graphics.endFill();
    
    // Spectrum waveform
    graphics.lineStyle(1, 0xff6600, 0.8);
    graphics.moveTo(-16, -6);
    for (let i = 0; i <= 32; i++) {
        const x = -16 + i;
        const y = -6 + Math.sin(i * 0.4) * 1.5 + Math.sin(i * 0.15) * 0.8;
        graphics.lineTo(x, y);
    }
    
    // Right equipment rack
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(40, -30, 25, 50, 6);
    graphics.endFill();
    
    // Centrifuge unit
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(42, -25, 21, 15, 4);
    graphics.endFill();
    
    // Centrifuge chamber
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(52, -17, 6);
    graphics.endFill();
    
    // Sample tubes in centrifuge
    graphics.beginFill(0x0066cc);
    for (let i = 0; i < 6; i++) {
        const angle = i * 1.047; // 60 degrees
        const x = 52 + Math.cos(angle) * 4;
        const y = -17 + Math.sin(angle) * 4;
        graphics.drawCircle(x, y, 1);
    }
    graphics.endFill();
    
    // Thermal cycler
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(42, -8, 21, 12, 4);
    graphics.endFill();
    
    // Sample wells
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            graphics.drawCircle(44 + col * 2.2, -6 + row * 2.5, 0.8);
        }
    }
    graphics.endFill();
    
    // Control panel base
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-60, 5, 120, 15, 4);
    graphics.endFill();
    
    // Control buttons layout
    const buttonPositions = [
        {x: -50, y: 10, color: 0x00ff00}, // Start
        {x: -40, y: 10, color: 0xff0000}, // Stop
        {x: -30, y: 10, color: 0x0066ff}, // Analyze
        {x: -20, y: 10, color: 0xff6600}, // Calibrate
        {x: -10, y: 10, color: 0xffff00}, // Sample
        {x: 0, y: 10, color: 0x00ffff},   // Process
        {x: 10, y: 10, color: 0xff00ff},  // Archive
        {x: 20, y: 10, color: 0x66ff00},  // Export
        {x: 30, y: 10, color: 0xff6666},  // Clean
        {x: 40, y: 10, color: 0x6666ff},  // Maintenance
        {x: 50, y: 10, color: 0x888888}   // Power
    ];
    
    buttonPositions.forEach(pos => {
        graphics.beginFill(pos.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawRoundedRect(pos.x - 3, pos.y - 2, 6, 4, 2);
        graphics.endFill();
    });
    
    // Status indicator panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-15, 22, 30, 25, 6);
    graphics.endFill();
    
    // Status LEDs
    const statusLEDs = [
        {x: -10, y: 27, color: 0x00ff00}, // System Ready
        {x: -5, y: 27, color: 0x00ff00},  // Microscope
        {x: 0, y: 27, color: 0xff6600},   // Centrifuge
        {x: 5, y: 27, color: 0x0066ff},   // Thermal
        {x: 10, y: 27, color: 0x00ff00},  // Analysis
        {x: -10, y: 32, color: 0x00ff00}, // Sample
        {x: -5, y: 32, color: 0xff0000},  // Error
        {x: 0, y: 32, color: 0x00ff00},   // Data
        {x: 5, y: 32, color: 0x00ff00},   // Network
        {x: 10, y: 32, color: 0xffff00}   // Maintenance
    ];
    
    statusLEDs.forEach(led => {
        graphics.beginFill(led.color);
        graphics.drawCircle(led.x, led.y, 1.5);
        graphics.endFill();
    });
    
    // Digital displays
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-12, 37, 24, 6, 2);
    graphics.endFill();
    
    // Temperature display
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(20, 25, 20, 8, 2);
    graphics.endFill();
    
    // pH meter
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(20, 35, 20, 8, 2);
    graphics.endFill();
    
    // Sample storage compartments
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-35, 25, 15, 20, 4);
    graphics.endFill();
    
    // Storage slots
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            graphics.drawRoundedRect(-32 + j * 3, 28 + i * 5, 2.5, 4, 1);
        }
    }
    graphics.endFill();
    
    // Waste disposal unit
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(45, 25, 15, 20, 4);
    graphics.endFill();
    
    // Disposal opening
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(47, 30, 11, 8, 3);
    graphics.endFill();
    
    // Workstation legs
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-65, 45, 6, 10, 3);
    graphics.drawRoundedRect(-25, 45, 6, 10, 3);
    graphics.drawRoundedRect(15, 45, 6, 10, 3);
    graphics.drawRoundedRect(55, 45, 6, 10, 3);
    graphics.endFill();
    
    // Cable management
    graphics.lineStyle(2, 0x333333);
    graphics.moveTo(-65, 20);
    graphics.bezierCurveTo(-70, 25, -70, 30, -65, 35);
    graphics.moveTo(65, 20);
    graphics.bezierCurveTo(70, 25, 70, 30, 65, 35);
    
    // Emergency stop button
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(55, 12, 4);
    graphics.endFill();
    
    // Emergency stop button center
    graphics.beginFill(0xffffff);
    graphics.drawCircle(55, 12, 1.5);
    graphics.endFill();
    
    // Data ports
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-68, 30, 4, 2, 1);
    graphics.drawRoundedRect(-68, 33, 4, 2, 1);
    graphics.drawRoundedRect(-68, 36, 4, 2, 1);
    graphics.endFill();
    
    // Add graphics to container
    labContainer.addChild(graphics);
    const bounds = {
  x: x - 70,
  y: y - 35,
  width: 140,
  height: 90,
  label: "labworkstation"
};
if(colliders){
    addWithCollider(camera, labContainer, bounds, colliders);
}

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "labworkstation",
    bounds,
    message: "The holographic interface of the Lab Workstation flickers almost imperceptibly, displaying fragmented data from a recent, complex experiment",
    bubble: null,
});
    
    return labContainer;
}

function createSpecimenContainer(x, y, camera, colliders) {
    // Create main specimen container
    const specimenContainer = new Container();
    specimenContainer.x = x;
    specimenContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main containment unit base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-50, 15, 100, 25, 8);
    graphics.endFill();
    
    // Containment surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-47, 12, 94, 22, 6);
    graphics.endFill();
    
    // Primary specimen chamber
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-35, -40, 70, 55, 10);
    graphics.endFill();
    
    // Chamber viewing window
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-30, -35, 60, 35, 8);
    graphics.endFill();
    
    // Window frame
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-28, -33, 56, 31, 6);
    graphics.endFill();
    
    // Specimen viewing area
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-26, -31, 52, 27, 4);
    graphics.endFill();
    
    // Specimen samples (animated elements)
    const animatedSamples = new Graphics();
    
    // Sample vials
    const samplePositions = [
        {x: -15, y: -25, color: 0x00ff66, alpha: 0.8},
        {x: -5, y: -25, color: 0xff6600, alpha: 0.9},
        {x: 5, y: -25, color: 0x0066ff, alpha: 0.7},
        {x: 15, y: -25, color: 0xff00ff, alpha: 0.8},
        {x: -15, y: -15, color: 0x00ffff, alpha: 0.6},
        {x: -5, y: -15, color: 0xffff00, alpha: 0.9},
        {x: 5, y: -15, color: 0xff3366, alpha: 0.7},
        {x: 15, y: -15, color: 0x66ff00, alpha: 0.8}
    ];
    
    samplePositions.forEach(sample => {
        animatedSamples.beginFill(sample.color, sample.alpha);
        animatedSamples.lineStyle(1, 0x333333);
        animatedSamples.drawRoundedRect(sample.x - 3, sample.y - 2, 6, 4, 2);
        animatedSamples.endFill();
        
        // Sample content bubbles
        animatedSamples.beginFill(sample.color, sample.alpha * 0.3);
        animatedSamples.drawCircle(sample.x, sample.y, 1.5);
        animatedSamples.endFill();
    });
    
    // Environmental control panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-45, -5, 20, 20, 6);
    graphics.endFill();
    
    // Temperature control
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-43, -3, 16, 6, 2);
    graphics.endFill();
    
    // Humidity control
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-43, 4, 16, 6, 2);
    graphics.endFill();
    
    // Pressure gauge
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawCircle(-35, 12, 5);
    graphics.endFill();
    
    // Pressure indicator needle
    graphics.lineStyle(2, 0x8800ff);
    graphics.moveTo(-35, 12);
    graphics.lineTo(-35, 7);
    
    // Storage compartments
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(25, -5, 20, 20, 6);
    graphics.endFill();
    
    // Sample storage slots
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 4; j++) {
            graphics.drawRoundedRect(27 + j * 4, -2 + i * 8, 3, 6, 1);
        }
    }
    graphics.endFill();
    
    // Backup storage
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-10, 18, 20, 20, 6);
    graphics.endFill();
    
    // Cryo storage indicators
    graphics.beginFill(0x0066cc);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            graphics.drawCircle(-5 + j * 5, 23 + i * 5, 1);
        }
    }
    graphics.endFill();
    
    // Hazard warning indicators
    graphics.beginFill(0xff6600);
    graphics.lineStyle(2, 0x333333);
    graphics.drawPolygon([
        -40, -40, -35, -45, -30, -40
    ]);
    graphics.endFill();
    
    graphics.beginFill(0x000000);
    graphics.drawPolygon([
        -37, -42, -35, -39, -33, -42
    ]);
    graphics.endFill();
    
    // Biohazard symbol
    graphics.beginFill(0xff0000);
    graphics.lineStyle(1, 0x333333);
    graphics.drawCircle(35, -40, 6);
    graphics.endFill();
    
    // Biohazard symbol details
    graphics.beginFill(0x000000);
    graphics.drawCircle(35, -40, 3);
    graphics.endFill();
    
    // Containment seals
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-35, -42, 8, 3, 1);
    graphics.drawRoundedRect(-15, -42, 8, 3, 1);
    graphics.drawRoundedRect(7, -42, 8, 3, 1);
    graphics.drawRoundedRect(27, -42, 8, 3, 1);
    graphics.endFill();
    
    // Ventilation system
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-50, -15, 8, 25, 4);
    graphics.endFill();
    
    // Ventilation grilles
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 8; i++) {
        graphics.moveTo(-48, -13 + i * 3);
        graphics.lineTo(-44, -13 + i * 3);
    }
    
    // Filtration status
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-46, -18, 1.5);
    graphics.endFill();
    
    // Support legs
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-45, 35, 5, 12, 2);
    graphics.drawRoundedRect(-15, 35, 5, 12, 2);
    graphics.drawRoundedRect(10, 35, 5, 12, 2);
    graphics.drawRoundedRect(40, 35, 5, 12, 2);
    graphics.endFill();
    
    // Emergency release
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(40, 5, 3);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(40, 5, 1);
    graphics.endFill();
    
    // Add graphics to container
    specimenContainer.addChild(graphics);
    specimenContainer.addChild(animatedSamples);
    
    // Animation for sample bubbles
    let animationTime = 0;
    
    // Create animation function
    const animateSamples = () => {
        animationTime += 0.1;
        
        // Clear and redraw animated samples
        animatedSamples.clear();
        samplePositions.forEach((sample, index) => {
            const bubbleOffset = Math.sin(animationTime * 0.5 + index) * 0.5;
            const alphaVariation = Math.max(0.3, sample.alpha + Math.sin(animationTime * 0.3 + index) * 0.3);
            
            // Sample vial
            animatedSamples.beginFill(sample.color, alphaVariation);
            animatedSamples.lineStyle(1, 0x333333);
            animatedSamples.drawRoundedRect(sample.x - 3, sample.y - 2, 6, 4, 2);
            animatedSamples.endFill();
            
            // Animated bubble content
            animatedSamples.beginFill(sample.color, alphaVariation * 0.4);
            animatedSamples.drawCircle(sample.x, sample.y + bubbleOffset, 1.5);
            animatedSamples.endFill();
            
            // Additional floating particles
            animatedSamples.beginFill(sample.color, alphaVariation * 0.2);
            animatedSamples.drawCircle(sample.x + Math.sin(animationTime * 0.4 + index) * 0.8, 
                                     sample.y + bubbleOffset * 0.7, 0.5);
            animatedSamples.endFill();
        });
        
        requestAnimationFrame(animateSamples);
    };
    
    // Start animation
    animateSamples();
    
    // Also provide the animate method for external control
    specimenContainer.animate = function(delta) {
        // This can be called from external animation loops if needed
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 50,
  y: y - 45,
  width: 100,
  height: 92,
  label: "specimencontainer"
};
if(colliders) addWithCollider(camera, specimenContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "specimencontainer",
    bounds,
    message: "A faint, unsettling glow emanates from within the Specimen Container, hinting at something biological and very much alive (or recently so)",
    bubble: null,
});
    return specimenContainer;
}

function createAnalysisEquipment(x, y, camera, colliders) {
    // Create main analysis equipment container
    const analysisContainer = new Container();
    analysisContainer.x = x;
    analysisContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main equipment base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-60, 20, 120, 30, 8);
    graphics.endFill();
    
    // Equipment surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-57, 17, 114, 27, 6);
    graphics.endFill();
    
    // Main analysis chamber
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-45, -45, 90, 65, 10);
    graphics.endFill();
    
    // Primary display panel
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-40, -40, 80, 45, 8);
    graphics.endFill();
    
    // Display bezel
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-37, -37, 74, 39, 6);
    graphics.endFill();
    
    // Main analysis display
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-35, -35, 70, 35, 4);
    graphics.endFill();
    
    // Analysis visualization
    graphics.beginFill(0x002244);
    graphics.lineStyle(1, 0x0088cc);
    graphics.drawRoundedRect(-32, -32, 25, 25, 3);
    graphics.endFill();
    
    // 3D molecular model representation
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(-20, -20, 3);
    graphics.drawCircle(-15, -18, 2);
    graphics.drawCircle(-25, -22, 2);
    graphics.drawCircle(-20, -15, 2);
    graphics.drawCircle(-22, -25, 2);
    graphics.endFill();
    
    // Molecular bonds
    graphics.lineStyle(1, 0x0088cc, 0.7);
    graphics.moveTo(-20, -20);
    graphics.lineTo(-15, -18);
    graphics.moveTo(-20, -20);
    graphics.lineTo(-25, -22);
    graphics.moveTo(-20, -20);
    graphics.lineTo(-20, -15);
    graphics.moveTo(-20, -20);
    graphics.lineTo(-22, -25);
    
    // Spectral analysis display
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-5, -32, 32, 12, 3);
    graphics.endFill();
    
    // Animated spectral graph
    const spectralGraph = new Graphics();
    
    // Data analysis panel
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-5, -18, 32, 15, 3);
    graphics.endFill();
    
    // Data readout bars
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 12; i++) {
        const height = 1 + Math.sin(i * 0.5) * 2 + 2;
        graphics.drawRect(-3 + i * 2.5, -8 - height, 2, height);
    }
    graphics.endFill();
    
    // Left equipment rack
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-65, -25, 18, 45, 6);
    graphics.endFill();
    
    // Mass spectrometer
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-63, -23, 14, 12, 4);
    graphics.endFill();
    
    // Sample injection port
    graphics.beginFill(0x0066cc);
    graphics.lineStyle(1, 0x333333);
    graphics.drawCircle(-56, -17, 2);
    graphics.endFill();
    
    // Ion detector
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x777777);
    graphics.drawRoundedRect(-63, -9, 14, 8, 3);
    graphics.endFill();
    
    // Detector elements
    graphics.beginFill(0x00ffff);
    for (let i = 0; i < 8; i++) {
        graphics.drawCircle(-61 + i * 1.5, -5, 0.5);
    }
    graphics.endFill();
    
    // Vacuum pump
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-63, 2, 14, 15, 4);
    graphics.endFill();
    
    // Pump status indicator
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-56, 9, 1.5);
    graphics.endFill();
    
    // Right equipment rack
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(47, -25, 18, 45, 6);
    graphics.endFill();
    
    // Chromatography column
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(49, -23, 14, 20, 4);
    graphics.endFill();
    
    // Column packing visualization
    graphics.beginFill(0x666666);
    for (let i = 0; i < 15; i++) {
        graphics.drawCircle(51 + (i % 3) * 3, -21 + Math.floor(i / 3) * 2, 0.8);
    }
    graphics.endFill();
    
    // Flow detector
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x777777);
    graphics.drawRoundedRect(49, -1, 14, 8, 3);
    graphics.endFill();
    
    // Flow rate indicator
    graphics.beginFill(0xff6600);
    graphics.drawRoundedRect(51, 1, 10, 4, 2);
    graphics.endFill();
    
    // Autosampler
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(49, 9, 14, 10, 4);
    graphics.endFill();
    
    // Sample carousel
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(56, 14, 4);
    graphics.endFill();
    
    // Sample vials
    graphics.beginFill(0x0066cc);
    for (let i = 0; i < 8; i++) {
        const angle = i * 0.785; // 45 degrees
        const vialX = 56 + Math.cos(angle) * 2.5;
        const vialY = 14 + Math.sin(angle) * 2.5;
        graphics.drawCircle(vialX, vialY, 0.8);
    }
    graphics.endFill();
    
    // Control interface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-50, 5, 100, 12, 4);
    graphics.endFill();
    
    // Control buttons
    const controlButtons = [
        {x: -40, y: 10, color: 0x00ff00, label: 'RUN'},
        {x: -25, y: 10, color: 0xff0000, label: 'STOP'},
        {x: -10, y: 10, color: 0x0066ff, label: 'SCAN'},
        {x: 5, y: 10, color: 0xff6600, label: 'CAL'},
        {x: 20, y: 10, color: 0x00ffff, label: 'DATA'},
        {x: 35, y: 10, color: 0xffff00, label: 'SAVE'}
    ];
    
    controlButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawRoundedRect(btn.x - 5, btn.y - 2, 10, 4, 2);
        graphics.endFill();
    });
    
    // Status display
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-20, 22, 40, 25, 4);
    graphics.endFill();
    
    // Status indicators
    const statusIndicators = [
        {x: -15, y: 27, color: 0x00ff00, status: 'READY'},
        {x: -5, y: 27, color: 0x00ff00, status: 'PUMP'},
        {x: 5, y: 27, color: 0xff6600, status: 'HEAT'},
        {x: 15, y: 27, color: 0x0066ff, status: 'COOL'},
        {x: -15, y: 32, color: 0x00ff00, status: 'FLOW'},
        {x: -5, y: 32, color: 0x00ff00, status: 'PRES'},
        {x: 5, y: 32, color: 0xff0000, status: 'LEAK'},
        {x: 15, y: 32, color: 0x00ff00, status: 'DATA'}
    ];
    
    statusIndicators.forEach(indicator => {
        graphics.beginFill(indicator.color);
        graphics.drawCircle(indicator.x, indicator.y, 1.5);
        graphics.endFill();
    });
    
    // Temperature/pressure displays
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-45, 25, 20, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-45, 35, 20, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(25, 25, 20, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110011);
    graphics.lineStyle(1, 0xcc44cc);
    graphics.drawRoundedRect(25, 35, 20, 8, 2);
    graphics.endFill();
    
    // Support structure
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-55, 45, 6, 15, 3);
    graphics.drawRoundedRect(-20, 45, 6, 15, 3);
    graphics.drawRoundedRect(15, 45, 6, 15, 3);
    graphics.drawRoundedRect(50, 45, 6, 15, 3);
    graphics.endFill();
    
    // Emergency shutdown
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(50, 12, 4);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(50, 12, 1.5);
    graphics.endFill();
    
    // Add graphics to container
    analysisContainer.addChild(graphics);
    analysisContainer.addChild(spectralGraph);
    
    // Animation for spectral display and carousel
    let animationTime = 0;
    
    // Create animation function
    const animateAnalysis = () => {
        animationTime += 0.1;
        
        // Animate spectral graph
        spectralGraph.clear();
        spectralGraph.lineStyle(1, 0xff6600, 0.8);
        spectralGraph.moveTo(-3, -26);
        
        for (let i = 0; i <= 30; i++) {
            const x = -3 + i;
            const y = -26 + Math.sin(i * 0.3 + animationTime * 0.5) * 2.5 + 
                     Math.sin(i * 0.15 + animationTime * 0.3) * 1.2;
            spectralGraph.lineTo(x, y);
        }
        
        requestAnimationFrame(animateAnalysis);
    };
    
    // Start animation
    animateAnalysis();
    
    // Also provide the animate method for external control
    analysisContainer.animate = function(delta) {
        // This can be called from external animation loops if needed
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 65,
  y: y - 45,
  width: 130,
  height: 105,
  label: "analysisequipment"
};
if(colliders) addWithCollider(camera, analysisContainer, bounds, colliders);

if(!window.interactables) window.interactables = []; 
    window.interactables.push({
    label: "analysisequipment",  
    bounds,
    message: "The Analysis Equipment's many indicator lights are dark, its complex processes paused until a new dataset is uploaded",
    bubble: null,
});
    
    return analysisContainer;
}

function createEngineeringConsole(x, y, camera, colliders) {
    // Create main engineering console container
    const consoleContainer = new Container();
    consoleContainer.x = x;
    consoleContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main console base
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-80, 25, 160, 35, 10);
    graphics.endFill();
    
    // Console surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-77, 22, 154, 32, 8);
    graphics.endFill();
    
    // Main console housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-70, -55, 140, 80, 12);
    graphics.endFill();
    
    // Primary command display
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-65, -50, 130, 50, 8);
    graphics.endFill();
    
    // Display frame
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-62, -47, 124, 44, 6);
    graphics.endFill();
    
    // Main tactical display
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-60, -45, 120, 40, 4);
    graphics.endFill();
    
    // Grid overlay system
    graphics.lineStyle(1, 0x004466, 0.3);
    for (let i = 0; i <= 12; i++) {
        graphics.moveTo(-60 + i * 10, -45);
        graphics.lineTo(-60 + i * 10, -5);
    }
    for (let i = 0; i <= 4; i++) {
        graphics.moveTo(-60, -45 + i * 10);
        graphics.lineTo(60, -45 + i * 10);
    }
    
    // Central command hub
    graphics.beginFill(0x002244);
    graphics.lineStyle(2, 0x0088cc);
    graphics.drawCircle(0, -25, 12);
    graphics.endFill();
    
    // Hub core
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(0, -25, 6);
    graphics.endFill();
    
    // Command nodes
    graphics.beginFill(0x0066cc);
    for (let i = 0; i < 8; i++) {
        const angle = i * 0.785; // 45 degrees
        const nodeX = Math.cos(angle) * 9;
        const nodeY = -25 + Math.sin(angle) * 9;
        graphics.drawCircle(nodeX, nodeY, 1.5);
    }
    graphics.endFill();
    
    // Connection lines
    graphics.lineStyle(1, 0x0088cc, 0.5);
    for (let i = 0; i < 8; i++) {
        const angle = i * 0.785;
        const nodeX = Math.cos(angle) * 9;
        const nodeY = -25 + Math.sin(angle) * 9;
        graphics.moveTo(0, -25);
        graphics.lineTo(nodeX, nodeY);
    }
    
    // System status panels
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-58, -42, 25, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-30, -42, 25, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(-2, -42, 25, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0x110011);
    graphics.lineStyle(1, 0xcc44cc);
    graphics.drawRoundedRect(26, -42, 25, 12, 3);
    graphics.endFill();
    
    // System readouts
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 8; i++) {
        const height = 1 + Math.sin(i * 0.8) * 2 + 1.5;
        graphics.drawRect(-56 + i * 2.5, -35 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 8; i++) {
        const height = 1 + Math.cos(i * 0.6) * 2 + 1.5;
        graphics.drawRect(-28 + i * 2.5, -35 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0x6600ff);
    for (let i = 0; i < 8; i++) {
        const height = 1 + Math.sin(i * 0.4 + 1) * 2 + 1.5;
        graphics.drawRect(0 + i * 2.5, -35 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff66cc);
    for (let i = 0; i < 8; i++) {
        const height = 1 + Math.cos(i * 0.3 + 2) * 2 + 1.5;
        graphics.drawRect(28 + i * 2.5, -35 - height, 2, height);
    }
    graphics.endFill();
    
    // Tactical display zones
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-58, -25, 25, 15, 3);
    graphics.endFill();
    
    graphics.beginFill(0x220000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(33, -25, 25, 15, 3);
    graphics.endFill();
    
    // Zone indicators
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            graphics.drawCircle(-53 + i * 4, -22 + j * 4, 0.8);
        }
    }
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            graphics.drawCircle(38 + i * 4, -22 + j * 4, 0.8);
        }
    }
    graphics.endFill();
    
    // Left control panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-85, -35, 20, 60, 8);
    graphics.endFill();
    
    // Control sliders
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 4; i++) {
        graphics.drawRoundedRect(-82, -30 + i * 12, 14, 3, 1);
    }
    graphics.endFill();
    
    // Slider handles
    graphics.beginFill(0x0066cc);
    graphics.drawRoundedRect(-80, -29, 3, 1, 0.5);
    graphics.drawRoundedRect(-77, -17, 3, 1, 0.5);
    graphics.drawRoundedRect(-74, -5, 3, 1, 0.5);
    graphics.drawRoundedRect(-78, 7, 3, 1, 0.5);
    graphics.endFill();
    
    // Rotary controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(-75, -40, 4);
    graphics.drawCircle(-75, 15, 4);
    graphics.endFill();
    
    // Rotary indicators
    graphics.lineStyle(2, 0x00ff00);
    graphics.moveTo(-75, -40);
    graphics.lineTo(-73, -42);
    graphics.moveTo(-75, 15);
    graphics.lineTo(-77, 17);
    
    // Right control panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(65, -35, 20, 60, 8);
    graphics.endFill();
    
    // Button matrix
    const buttonMatrix = [
        [0x00ff00, 0xff0000, 0x0066ff, 0xff6600],
        [0x00ffff, 0xff00ff, 0x66ff00, 0xffff00],
        [0x0066cc, 0xcc6600, 0x6600cc, 0xcc0066],
        [0x00cc66, 0xcc6600, 0x6600cc, 0xcc0066]
    ];
    
    buttonMatrix.forEach((row, i) => {
        row.forEach((color, j) => {
            graphics.beginFill(color);
            graphics.lineStyle(1, 0x333333);
            graphics.drawRoundedRect(67 + j * 4, -32 + i * 6, 3, 4, 1);
            graphics.endFill();
        });
    });
    
    // Emergency controls
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(75, 15, 5);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(75, 15, 2);
    graphics.endFill();
    
    // Main control interface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-70, 5, 140, 15, 4);
    graphics.endFill();
    
    // Primary command buttons
    const commandButtons = [
        {x: -55, y: 12, color: 0x00ff00, size: 6},
        {x: -40, y: 12, color: 0xff0000, size: 6},
        {x: -25, y: 12, color: 0x0066ff, size: 6},
        {x: -10, y: 12, color: 0xff6600, size: 6},
        {x: 5, y: 12, color: 0x00ffff, size: 6},
        {x: 20, y: 12, color: 0xff00ff, size: 6},
        {x: 35, y: 12, color: 0x66ff00, size: 6},
        {x: 50, y: 12, color: 0xffff00, size: 6}
    ];
    
    commandButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawRoundedRect(btn.x - btn.size/2, btn.y - 2, btn.size, 4, 2);
        graphics.endFill();
    });
    
    // Status monitoring panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-30, 22, 60, 30, 6);
    graphics.endFill();
    
    // System status grid
    const systemStatus = [
        {x: -25, y: 27, color: 0x00ff00},
        {x: -20, y: 27, color: 0x00ff00},
        {x: -15, y: 27, color: 0xff6600},
        {x: -10, y: 27, color: 0x00ff00},
        {x: -5, y: 27, color: 0x00ff00},
        {x: 0, y: 27, color: 0x0066ff},
        {x: 5, y: 27, color: 0x00ff00},
        {x: 10, y: 27, color: 0x00ff00},
        {x: 15, y: 27, color: 0xff0000},
        {x: 20, y: 27, color: 0x00ff00},
        {x: 25, y: 27, color: 0x00ff00},
        {x: -25, y: 32, color: 0x00ff00},
        {x: -20, y: 32, color: 0x00ff00},
        {x: -15, y: 32, color: 0x00ff00},
        {x: -10, y: 32, color: 0xffff00},
        {x: -5, y: 32, color: 0x00ff00},
        {x: 0, y: 32, color: 0x00ff00},
        {x: 5, y: 32, color: 0x00ff00},
        {x: 10, y: 32, color: 0x00ff00},
        {x: 15, y: 32, color: 0x00ff00},
        {x: 20, y: 32, color: 0x00ff00},
        {x: 25, y: 32, color: 0x00ff00}
    ];
    
    systemStatus.forEach(status => {
        graphics.beginFill(status.color);
        graphics.drawCircle(status.x, status.y, 1.5);
        graphics.endFill();
    });
    
    // Performance monitors
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-75, 27, 20, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-75, 37, 20, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(55, 27, 20, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110011);
    graphics.lineStyle(1, 0xcc44cc);
    graphics.drawRoundedRect(55, 37, 20, 8, 2);
    graphics.endFill();
    
    // Console support structure
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-70, 55, 8, 20, 4);
    graphics.drawRoundedRect(-30, 55, 8, 20, 4);
    graphics.drawRoundedRect(22, 55, 8, 20, 4);
    graphics.drawRoundedRect(62, 55, 8, 20, 4);
    graphics.endFill();
    
    // Data connection ports
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-88, 20, 5, 3, 1);
    graphics.drawRoundedRect(-88, 25, 5, 3, 1);
    graphics.drawRoundedRect(-88, 30, 5, 3, 1);
    graphics.drawRoundedRect(83, 20, 5, 3, 1);
    graphics.drawRoundedRect(83, 25, 5, 3, 1);
    graphics.drawRoundedRect(83, 30, 5, 3, 1);
    graphics.endFill();
    
    // Power indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-75, 50, 2);
    graphics.drawCircle(75, 50, 2);
    graphics.endFill();
    
    // Add graphics to container
    consoleContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    consoleContainer.addChild(animatedElements);
    
    // Animation for data flow and system activity
    let animationTime = 0;
    
    const animateConsole = () => {
        animationTime += 0.08;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate data flow in connection lines
        animatedElements.lineStyle(1, 0x00ccff, 0.6);
        for (let i = 0; i < 8; i++) {
            const angle = i * 0.785;
            const progress = (animationTime + i * 0.5) % 2;
            
            if (progress < 1) {
                const startX = Math.cos(angle) * 6 * progress;
                const startY = -25 + Math.sin(angle) * 6 * progress;
                const endX = Math.cos(angle) * 9 * progress;
                const endY = -25 + Math.sin(angle) * 9 * progress;
                
                animatedElements.moveTo(startX, startY);
                animatedElements.lineTo(endX, endY);
            }
        }
        
        // Animate scanning line on main display
        const scanLine = (animationTime * 40) % 120;
        animatedElements.lineStyle(1, 0x00ff88, 0.4);
        animatedElements.moveTo(-60 + scanLine, -45);
        animatedElements.lineTo(-60 + scanLine, -5);
        
        // Animate pulsing central hub
        const pulseAlpha = 0.5 + Math.sin(animationTime * 2) * 0.3;
        animatedElements.beginFill(0x00ccff, pulseAlpha);
        animatedElements.drawCircle(0, -25, 3);
        animatedElements.endFill();
        
        requestAnimationFrame(animateConsole);
    };
    
    // Start animation
    animateConsole();
    
    // Provide external animate method
    consoleContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 90,       // includes left-side sliders, ports, and glow margin
  y: y - 60,       // includes top housing, buttons, and animated hub pulses
  width: 180,      // from -90 to +90: includes wide control panels and buttons
  height: 120,     // from -60 (top edge) to +60 (support base and LEDs)
  label: "engineeringConsole"
};
if(colliders) addWithCollider(camera, consoleContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "engineeringConsole",
    bounds,
    message: "A faint scent of hot metal and ozone hangs around the Engineering Console, hinting at the immense power flowing through the ship's core",
    bubble: null, 
});
    
    return consoleContainer;
}

function createPowerDistribution(x, y, camera, colliders) {
    const distributionContainer = new Container();
    distributionContainer.x = x;
    distributionContainer.y = y;
    
    const graphics = new Graphics();
    
    // Main distribution unit housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-75, -50, 150, 100, 12);
    graphics.endFill();
    
    // Primary power core chamber
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-70, -45, 140, 50, 8);
    graphics.endFill();
    
    // Power core containment
    graphics.beginFill(0x001133);
    graphics.lineStyle(2, 0x0066ff);
    graphics.drawCircle(0, -20, 25);
    graphics.endFill();
    
    // Core energy rings
    graphics.beginFill(0x0088ff);
    graphics.lineStyle(1, 0x00aaff);
    for (let i = 0; i < 3; i++) {
        const radius = 15 + i * 4;
        graphics.drawCircle(0, -20, radius);
    }
    graphics.endFill();
    
    // Central power core
    graphics.beginFill(0x00ccff);
    graphics.drawCircle(0, -20, 8);
    graphics.endFill();
    
    // Power distribution conduits
    graphics.lineStyle(3, 0x0066cc);
    const conduitPositions = [
        {angle: 0, length: 35},
        {angle: 1.047, length: 35},
        {angle: 2.094, length: 35},
        {angle: 3.141, length: 35},
        {angle: 4.188, length: 35},
        {angle: 5.235, length: 35}
    ];
    
    conduitPositions.forEach(conduit => {
        const endX = Math.cos(conduit.angle) * conduit.length;
        const endY = -20 + Math.sin(conduit.angle) * conduit.length;
        graphics.moveTo(0, -20);
        graphics.lineTo(endX, endY);
    });
    
    // Distribution nodes
    graphics.beginFill(0x0066cc);
    graphics.lineStyle(1, 0x0088ff);
    conduitPositions.forEach(conduit => {
        const nodeX = Math.cos(conduit.angle) * conduit.length;
        const nodeY = -20 + Math.sin(conduit.angle) * conduit.length;
        graphics.drawCircle(nodeX, nodeY, 4);
    });
    graphics.endFill();
    
    // Power regulation panels
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-85, -25, 18, 50, 6);
    graphics.drawRoundedRect(67, -25, 18, 50, 6);
    graphics.endFill();
    
    // Left panel - Input regulation
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-82, -22, 12, 8, 2);
    graphics.endFill();
    
    // Power input meters
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 6; i++) {
        const height = 2 + Math.sin(i * 0.6) * 3;
        graphics.drawRect(-80 + i * 1.5, -16 - height, 1.2, height);
    }
    graphics.endFill();
    
    // Regulation controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 3; i++) {
        graphics.drawRoundedRect(-82, -8 + i * 8, 12, 2, 1);
    }
    graphics.endFill();
    
    // Control sliders
    graphics.beginFill(0x00ff00);
    graphics.drawRoundedRect(-78, -7, 2, 0.8, 0.4);
    graphics.drawRoundedRect(-75, 1, 2, 0.8, 0.4);
    graphics.drawRoundedRect(-80, 9, 2, 0.8, 0.4);
    graphics.endFill();
    
    // Right panel - Output distribution
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(70, -22, 12, 8, 2);
    graphics.endFill();
    
    // Output meters
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 6; i++) {
        const height = 2 + Math.cos(i * 0.4) * 3;
        graphics.drawRect(72 + i * 1.5, -16 - height, 1.2, height);
    }
    graphics.endFill();
    
    // Distribution switches
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 6; i++) {
        graphics.drawRoundedRect(70 + (i % 2) * 6, -8 + Math.floor(i / 2) * 8, 4, 3, 1);
    }
    graphics.endFill();
    
    // Switch states
    graphics.beginFill(0x00ff00);
    graphics.drawRoundedRect(71, -7, 2, 1, 0.5);
    graphics.drawRoundedRect(77, -7, 2, 1, 0.5);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawRoundedRect(71, 1, 2, 1, 0.5);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawRoundedRect(77, 1, 2, 1, 0.5);
    graphics.drawRoundedRect(71, 9, 2, 1, 0.5);
    graphics.drawRoundedRect(77, 9, 2, 1, 0.5);
    graphics.endFill();
    
    // Main control interface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-60, 8, 120, 35, 6);
    graphics.endFill();
    
    // System status display
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-57, 12, 50, 10, 3);
    graphics.endFill();
    
    // Status readouts
    const statusData = [
        {x: -52, y: 17, color: 0x00ff00},
        {x: -47, y: 17, color: 0x00ff00},
        {x: -42, y: 17, color: 0xffff00},
        {x: -37, y: 17, color: 0x00ff00},
        {x: -32, y: 17, color: 0x00ff00},
        {x: -27, y: 17, color: 0x00ff00},
        {x: -22, y: 17, color: 0xff6600},
        {x: -17, y: 17, color: 0x00ff00},
        {x: -12, y: 17, color: 0x00ff00}
    ];
    
    statusData.forEach(status => {
        graphics.beginFill(status.color);
        graphics.drawCircle(status.x, status.y, 1.2);
        graphics.endFill();
    });
    
    // Emergency controls
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(10, 12, 20, 12, 3);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawRoundedRect(12, 14, 16, 8, 2);
    graphics.endFill();
    
    // Power routing matrix
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(33, 12, 22, 27, 3);
    graphics.endFill();
    
    // Matrix grid
    graphics.beginFill(0x0066cc);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            const alpha = (i + j) % 2 === 0 ? 1 : 0.3;
            graphics.beginFill(0x0066cc, alpha);
            graphics.drawCircle(36 + i * 4, 15 + j * 4, 1);
        }
    }
    graphics.endFill();
    
    // Power flow indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-60, 35, 2);
    graphics.drawCircle(-20, 35, 2);
    graphics.drawCircle(20, 35, 2);
    graphics.drawCircle(60, 35, 2);
    graphics.endFill();
    
    // Support structure
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-70, 45, 10, 15, 4);
    graphics.drawRoundedRect(-25, 45, 10, 15, 4);
    graphics.drawRoundedRect(15, 45, 10, 15, 4);
    graphics.drawRoundedRect(60, 45, 10, 15, 4);
    graphics.endFill();
    
    distributionContainer.addChild(graphics);
    
    // Animated elements
    const animatedElements = new Graphics();
    distributionContainer.addChild(animatedElements);
    
    let animationTime = 0;
    
    const animateDistribution = () => {
        animationTime += 0.06;
        animatedElements.clear();
        
        // Animate power flow through conduits
        animatedElements.lineStyle(2, 0x00ccff, 0.8);
        conduitPositions.forEach((conduit, index) => {
            const progress = (animationTime + index * 0.3) % 1;
            const flowX = Math.cos(conduit.angle) * conduit.length * progress;
            const flowY = -20 + Math.sin(conduit.angle) * conduit.length * progress;
            
            animatedElements.beginFill(0x00ccff, 0.8);
            animatedElements.drawCircle(flowX, flowY, 2);
            animatedElements.endFill();
        });
        
        // Pulsing power core
        const coreAlpha = 0.6 + Math.sin(animationTime * 3) * 0.4;
        animatedElements.beginFill(0x00ccff, coreAlpha);
        animatedElements.drawCircle(0, -20, 10);
        animatedElements.endFill();
        
        requestAnimationFrame(animateDistribution);
    };
    
    animateDistribution();
    
    distributionContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 95,       // accounts for left regulation panel and glow/margin beyond -85
  y: y - 60,       // includes top housing and animated power core (core center at -20, radius 25+10 pulse)
  width: 190,      // from -95 to +95: includes left/right panels, glow, matrix, and switches
  height: 135,     // from -60 (top) to +75 (bottom support legs and glow)
  label: "powerDistribution"
};
if(colliders) addWithCollider(camera, distributionContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "powerDistribution",
    bounds,
    message: "The faint scent of energized plasma lingers around the Power Distribution conduits, a subtle reminder of the immense forces contained within",
    bubble: null, 
});
    
    return distributionContainer;
}

function createRepairStation(x, y, camera, colliders) {
    const repairContainer = new Container();
    repairContainer.x = x;
    repairContainer.y = y;
    
    const graphics = new Graphics();
    
    // Main repair station housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-80, -45, 160, 90, 12);
    graphics.endFill();
    
    // Work surface
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-75, -15, 150, 35, 8);
    graphics.endFill();
    
    // Repair bay
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-70, -40, 140, 25, 6);
    graphics.endFill();
    
    // Diagnostic scanner array
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-65, -37, 130, 8, 3);
    graphics.endFill();
    
    // Scanner elements
    graphics.beginFill(0x0066cc);
    for (let i = 0; i < 13; i++) {
        graphics.drawCircle(-60 + i * 10, -33, 1.5);
    }
    graphics.endFill();
    
    // Repair arm assembly
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x666666);
    graphics.drawRoundedRect(-8, -42, 16, 8, 4);
    graphics.endFill();
    
    // Arm joints
    graphics.beginFill(0x444444);
    graphics.drawCircle(-5, -38, 2);
    graphics.drawCircle(0, -38, 2);
    graphics.drawCircle(5, -38, 2);
    graphics.endFill();
    
    // Repair tools
    graphics.beginFill(0x666666);
    graphics.lineStyle(1, 0x888888);
    graphics.drawRoundedRect(-25, -25, 8, 3, 1);
    graphics.drawRoundedRect(-10, -25, 8, 3, 1);
    graphics.drawRoundedRect(5, -25, 8, 3, 1);
    graphics.drawRoundedRect(20, -25, 8, 3, 1);
    graphics.endFill();
    
    // Tool indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-21, -23, 0.8);
    graphics.drawCircle(-6, -23, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(9, -23, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(24, -23, 0.8);
    graphics.endFill();
    
    // Left control panel - Diagnostics
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-85, -25, 18, 50, 6);
    graphics.endFill();
    
    // Diagnostic display
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-82, -22, 12, 15, 2);
    graphics.endFill();
    
    // System health indicators
    const healthData = [
        {x: -80, y: -20, color: 0x00ff00},
        {x: -76, y: -20, color: 0x00ff00},
        {x: -72, y: -20, color: 0xffff00},
        {x: -80, y: -16, color: 0x00ff00},
        {x: -76, y: -16, color: 0xff0000},
        {x: -72, y: -16, color: 0x00ff00},
        {x: -80, y: -12, color: 0x00ff00},
        {x: -76, y: -12, color: 0x00ff00},
        {x: -72, y: -12, color: 0x00ff00}
    ];
    
    healthData.forEach(health => {
        graphics.beginFill(health.color);
        graphics.drawCircle(health.x, health.y, 1);
        graphics.endFill();
    });
    
    // Repair mode controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 4; i++) {
        graphics.drawRoundedRect(-82, -2 + i * 5, 12, 3, 1);
    }
    graphics.endFill();
    
    // Mode indicators
    graphics.beginFill(0x00ff00);
    graphics.drawRoundedRect(-80, -1, 8, 1, 0.5);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawRoundedRect(-80, 4, 8, 1, 0.5);
    graphics.endFill();
    
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(-80, 9, 8, 1, 0.5);
    graphics.drawRoundedRect(-80, 14, 8, 1, 0.5);
    graphics.endFill();
    
    // Right control panel - Repair tools
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(67, -25, 18, 50, 6);
    graphics.endFill();
    
    // Tool selector matrix
    const toolMatrix = [
        [0x00ff00, 0xff6600, 0x0066ff],
        [0x00ffff, 0xff00ff, 0x66ff00],
        [0x0066cc, 0xcc6600, 0x6600cc],
        [0x00cc66, 0xcc0066, 0x6666cc]
    ];
    
    toolMatrix.forEach((row, i) => {
        row.forEach((color, j) => {
            graphics.beginFill(color);
            graphics.lineStyle(1, 0x333333);
            graphics.drawRoundedRect(69 + j * 4, -22 + i * 7, 3, 4, 1);
            graphics.endFill();
        });
    });
    
    // Tool calibration
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(75, 10, 4);
    graphics.endFill();
    
    graphics.lineStyle(2, 0x00ff00);
    graphics.moveTo(75, 10);
    graphics.lineTo(77, 8);
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(75, 18, 3);
    graphics.endFill();
    
    // Main work area
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-50, -12, 100, 25, 4);
    graphics.endFill();
    
    // Work grid
    graphics.lineStyle(0.5, 0x444444, 0.3);
    for (let i = 0; i <= 10; i++) {
        graphics.moveTo(-50 + i * 10, -12);
        graphics.lineTo(-50 + i * 10, 13);
    }
    for (let i = 0; i <= 2; i++) {
        graphics.moveTo(-50, -12 + i * 12.5);
        graphics.lineTo(50, -12 + i * 12.5);
    }
    
    // Component being repaired
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-15, -5, 30, 10, 3);
    graphics.endFill();
    
    // Component details
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(-10, 0, 2);
    graphics.drawCircle(0, 0, 2);
    graphics.drawCircle(10, 0, 2);
    graphics.endFill();
    
    // Repair indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-10, -8, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(0, -8, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(10, -8, 1);
    graphics.endFill();
    
    // Status monitoring
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-60, 22, 120, 18, 4);
    graphics.endFill();
    
    // Progress indicators
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-57, 25, 25, 4, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-30, 25, 25, 4, 2);
    graphics.endFill();
    
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(-3, 25, 25, 4, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110011);
    graphics.lineStyle(1, 0xcc44cc);
    graphics.drawRoundedRect(24, 25, 25, 4, 2);
    graphics.endFill();
    
    // Progress bars
    graphics.beginFill(0x00ff66);
    graphics.drawRect(-55, 26, 18, 2);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawRect(-28, 26, 12, 2);
    graphics.endFill();
    
    graphics.beginFill(0x6600ff);
    graphics.drawRect(-1, 26, 20, 2);
    graphics.endFill();
    
    graphics.beginFill(0xff66cc);
    graphics.drawRect(26, 26, 8, 2);
    graphics.endFill();
    
    // Completion status
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-57, 33, 2);
    graphics.drawCircle(-30, 33, 2);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-3, 33, 2);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(24, 33, 2);
    graphics.endFill();
    
    repairContainer.addChild(graphics);
    
    // Animated elements
    const animatedElements = new Graphics();
    repairContainer.addChild(animatedElements);
    
    let animationTime = 0;
    
    const animateRepair = () => {
        animationTime += 0.04;
        animatedElements.clear();
        
        // Animate scanning beam
        const scanPos = (animationTime * 60) % 130;
        animatedElements.lineStyle(1, 0x00ccff, 0.6);
        animatedElements.moveTo(-65 + scanPos, -37);
        animatedElements.lineTo(-65 + scanPos, -29);
        
        // Animate repair beam
        if (Math.sin(animationTime * 2) > 0) {
            animatedElements.lineStyle(2, 0x00ff88, 0.8);
            animatedElements.moveTo(0, -34);
            animatedElements.lineTo(0, -5);
        }
        
        // Pulsing repair indicators
        const pulseAlpha = 0.3 + Math.sin(animationTime * 4) * 0.7;
        animatedElements.beginFill(0x00ff88, pulseAlpha);
        animatedElements.drawCircle(0, -8, 1.5);
        animatedElements.endFill();
        
        requestAnimationFrame(animateRepair);
    };
    
    animateRepair();
    
    repairContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 95,       // accounts for left panel at -85 and margin for glow/effects
  y: y - 50,       // top housing reaches around -45, plus animated beam slightly above
  width: 190,      // from -95 to +95: includes both control panels and tool calibration
  height: 95,      // from -50 to +45: includes status display and animated completion dots
  label: "repairStation"
};
if(colliders) addWithCollider(camera, repairContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "repairStation",
    bounds,
    message: "A faint scent of lubricant and solder wafts from the Repair Station, hinting at recent repairs or ongoing maintenance",
    bubble: null,
});
    
    return repairContainer;
}

function createCargoContainer(x, y, camera, colliders) {
    const cargoContainer = new Container();
    cargoContainer.x = x;
    cargoContainer.y = y;
    
    const graphics = new Graphics();
    
    // Main container body - standard shipping container proportions
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRect(-60, -25, 120, 50);
    graphics.endFill();
    
    // Container door frame
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRect(50, -23, 8, 46);
    graphics.endFill();
    
    // Door hinges
    graphics.beginFill(0x555555);
    graphics.drawRect(49, -18, 3, 4);
    graphics.drawRect(49, -5, 3, 4);
    graphics.drawRect(49, 8, 3, 4);
    graphics.endFill();
    
    // Door handle and lock
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(52, 0, 2);
    graphics.endFill();
    
    graphics.beginFill(0x666666);
    graphics.drawRect(50, -1, 4, 2);
    graphics.endFill();
    
    // Lock status indicator
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(52, 0, 0.8);
    graphics.endFill();
    
    // Corrugated side panels (realistic container texture)
    graphics.lineStyle(1, 0x333333);
    for (let i = 0; i < 12; i++) {
        graphics.moveTo(-58 + i * 10, -25);
        graphics.lineTo(-58 + i * 10, 25);
    }
    
    // Horizontal reinforcement bands
    graphics.lineStyle(2, 0x555555);
    graphics.moveTo(-60, -15);
    graphics.lineTo(60, -15);
    graphics.moveTo(-60, 0);
    graphics.lineTo(60, 0);
    graphics.moveTo(-60, 15);
    graphics.lineTo(60, 15);
    
    // Corner posts (ISO standard)
    graphics.beginFill(0x333333);
    graphics.drawRect(-62, -27, 4, 4);
    graphics.drawRect(58, -27, 4, 4);
    graphics.drawRect(-62, 23, 4, 4);
    graphics.drawRect(58, 23, 4, 4);
    graphics.endFill();
    
    // Container ID plate
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-50, -20, 25, 8, 2);
    graphics.endFill();
    
    // ID text representation
    graphics.beginFill(0xcccccc);
    graphics.drawRect(-48, -18, 3, 1);
    graphics.drawRect(-44, -18, 5, 1);
    graphics.drawRect(-38, -18, 3, 1);
    graphics.drawRect(-34, -18, 2, 1);
    graphics.drawRect(-48, -16, 4, 1);
    graphics.drawRect(-43, -16, 3, 1);
    graphics.drawRect(-39, -16, 6, 1);
    graphics.endFill();
    
    // Cargo type indicator
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-20, -20, 15, 8, 2);
    graphics.endFill();
    
    // Hazmat symbols
    graphics.beginFill(0xff6600);
    graphics.drawRect(-18, -18, 3, 3);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawRect(-14, -18, 3, 3);
    graphics.endFill();
    
    graphics.beginFill(0x0066cc);
    graphics.drawRect(-10, -18, 3, 3);
    graphics.endFill();
    
    // Weight and capacity info
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(15, -20, 30, 8, 2);
    graphics.endFill();
    
    // Weight display
    graphics.beginFill(0x666666);
    graphics.drawRect(17, -18, 8, 1);
    graphics.drawRect(17, -16, 6, 1);
    graphics.drawRect(17, -14, 10, 1);
    graphics.drawRect(30, -18, 4, 1);
    graphics.drawRect(30, -16, 6, 1);
    graphics.drawRect(30, -14, 3, 1);
    graphics.endFill();
    
    // Bottom container rails
    graphics.beginFill(0x444444);
    graphics.drawRect(-58, 23, 116, 2);
    graphics.endFill();
    
    // Rail attachment points
    graphics.beginFill(0x555555);
    for (let i = 0; i < 6; i++) {
        graphics.drawCircle(-50 + i * 20, 24, 1);
    }
    graphics.endFill();
    
    // Side attachment points for crane lifting
    graphics.beginFill(0x555555);
    graphics.drawCircle(-60, -10, 2);
    graphics.drawCircle(-60, 10, 2);
    graphics.drawCircle(60, -10, 2);
    graphics.drawCircle(60, 10, 2);
    graphics.endFill();
    
    // Lifting point indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-60, -10, 1);
    graphics.drawCircle(-60, 10, 1);
    graphics.drawCircle(60, -10, 1);
    graphics.drawCircle(60, 10, 1);
    graphics.endFill();
    
    cargoContainer.addChild(graphics);
    const bounds = {
  x: x - 65,        // Accounts for container body (-60) and outer parts like corner posts and lifting points
  y: y - 30,        // Container body is -25, with top corner posts at -27 and slight margin
  width: 130,       // From -65 to +65 includes full width and lifting points on both ends
  height: 60,       // From -30 to +30 includes vertical margin, bottom rails, and top posts
  label: "cargoContainer"
};
if(colliders) addWithCollider(camera, cargoContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "cargoContainer",
    bounds,
    message: "A large, open-top container for storing cargo",
    bubble: null, 
});
    
    return cargoContainer;
}

function createLoadingEquipment(x, y) {
    const loadingContainer = new Container();
    loadingContainer.x = x;
    loadingContainer.y = y;
    
    const graphics = new Graphics();
    
    // Base platform
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-100, -20, 200, 40, 8);
    graphics.endFill();
    
    // Platform supports
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-95, -15, 30, 30, 4);
    graphics.drawRoundedRect(-15, -15, 30, 30, 4);
    graphics.drawRoundedRect(65, -15, 30, 30, 4);
    graphics.endFill();
    
    // Crane tower
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-12, -80, 24, 60, 6);
    graphics.endFill();
    
    // Crane arm
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-8, -85, 120, 8, 4);
    graphics.endFill();
    
    // Crane joints
    graphics.beginFill(0x444444);
    graphics.drawCircle(0, -81, 3);
    graphics.drawCircle(30, -81, 2);
    graphics.drawCircle(60, -81, 2);
    graphics.drawCircle(90, -81, 2);
    graphics.endFill();
    
    // Lifting mechanism
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x666666);
    graphics.drawRoundedRect(85, -88, 16, 12, 4);
    graphics.endFill();
    
    // Pulley system
    graphics.beginFill(0x444444);
    graphics.drawCircle(88, -82, 2);
    graphics.drawCircle(96, -82, 2);
    graphics.endFill();
    
    // Cables
    graphics.lineStyle(1, 0x666666);
    graphics.moveTo(88, -80);
    graphics.lineTo(88, -40);
    graphics.moveTo(96, -80);
    graphics.lineTo(96, -35);
    
    // Lifting hook
    graphics.beginFill(0x555555);
    graphics.lineStyle(2, 0x777777);
    graphics.drawRoundedRect(85, -42, 8, 6, 2);
    graphics.endFill();
    
    // Hook mechanism
    graphics.beginFill(0x666666);
    graphics.drawCircle(89, -39, 1.5);
    graphics.endFill();
    
    // Conveyor belt system
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-90, -12, 180, 8, 3);
    graphics.endFill();
    
    // Conveyor rollers
    graphics.beginFill(0x333333);
    for (let i = 0; i < 19; i++) {
        graphics.drawCircle(-85 + i * 10, -8, 2);
    }
    graphics.endFill();
    
    // Belt surface
    graphics.beginFill(0x1a1a1a);
    graphics.drawRoundedRect(-88, -10, 176, 4, 2);
    graphics.endFill();
    
    // Loading arms
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-85, -25, 12, 20, 4);
    graphics.drawRoundedRect(73, -25, 12, 20, 4);
    graphics.endFill();
    
    // Arm joints
    graphics.beginFill(0x444444);
    graphics.drawCircle(-79, -22, 2);
    graphics.drawCircle(-79, -18, 2);
    graphics.drawCircle(-79, -14, 2);
    graphics.drawCircle(79, -22, 2);
    graphics.drawCircle(79, -18, 2);
    graphics.drawCircle(79, -14, 2);
    graphics.endFill();
    
    // Hydraulic cylinders
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-82, -28, 6, 15, 2);
    graphics.drawRoundedRect(76, -28, 6, 15, 2);
    graphics.endFill();
    
    // Control station
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-25, -35, 50, 25, 6);
    graphics.endFill();
    
    // Control panels
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-22, -32, 15, 10, 2);
    graphics.drawRoundedRect(-5, -32, 15, 10, 2);
    graphics.drawRoundedRect(12, -32, 10, 10, 2);
    graphics.endFill();
    
    // Status displays
    const statusMatrix = [
        [0x00ff00, 0x00ff00, 0xff6600],
        [0x00ff00, 0xff0000, 0x00ff00],
        [0xff6600, 0x00ff00, 0x00ff00]
    ];
    
    statusMatrix.forEach((row, i) => {
        row.forEach((color, j) => {
            graphics.beginFill(color);
            graphics.drawCircle(-20 + j * 2, -30 + i * 2, 0.8);
            graphics.endFill();
        });
    });
    
    // Crane control indicators
    graphics.beginFill(0x0066cc);
    graphics.drawRect(-3, -30, 2, 1);
    graphics.drawRect(-3, -28, 3, 1);
    graphics.drawRect(-3, -26, 4, 1);
    graphics.drawRect(-3, -24, 2, 1);
    graphics.endFill();
    
    // Emergency controls
    graphics.beginFill(0xff0000);
    graphics.drawCircle(17, -27, 2);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(17, -20, 1.5);
    graphics.endFill();
    
    // Power indicators
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-20, -18, 40, 4, 2);
    graphics.endFill();
    
    graphics.beginFill(0x00ff66);
    graphics.drawRect(-18, -17, 28, 2);
    graphics.endFill();
    
    // Load sensors
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawCircle(-60, -8, 2);
    graphics.drawCircle(-30, -8, 2);
    graphics.drawCircle(0, -8, 2);
    graphics.drawCircle(30, -8, 2);
    graphics.drawCircle(60, -8, 2);
    graphics.endFill();
    
    // Sensor status
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(-60, -8, 1);
    graphics.drawCircle(-30, -8, 1);
    graphics.drawCircle(30, -8, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(0, -8, 1);
    graphics.endFill();
    
    graphics.beginFill(0x333333);
    graphics.drawCircle(60, -8, 1);
    graphics.endFill();
    
    loadingContainer.addChild(graphics);
    
    // Animated elements
    const animatedElements = new Graphics();
    loadingContainer.addChild(animatedElements);
    
    let animationTime = 0;
    
    const animateLoading = () => {
        animationTime += 0.02;
        animatedElements.clear();
        
        // Animate conveyor belt
        const beltOffset = (animationTime * 30) % 10;
        animatedElements.beginFill(0x333333);
        for (let i = 0; i < 20; i++) {
            const x = -90 + ((i * 10 + beltOffset) % 180);
            animatedElements.drawRect(x, -9, 2, 2);
        }
        animatedElements.endFill();
        
        // Animate crane movement
        const craneOffset = Math.sin(animationTime * 0.5) * 20;
        animatedElements.lineStyle(2, 0x00ff88, 0.6);
        animatedElements.moveTo(93 + craneOffset, -82);
        animatedElements.lineTo(93 + craneOffset, -45);
        
        // Pulsing power indicators
        const pulseAlpha = 0.4 + Math.sin(animationTime * 3) * 0.4;
        animatedElements.beginFill(0x00ff88, pulseAlpha);
        animatedElements.drawCircle(-60, -8, 1.2);
        animatedElements.drawCircle(-30, -8, 1.2);
        animatedElements.drawCircle(30, -8, 1.2);
        animatedElements.endFill();
        
        requestAnimationFrame(animateLoading);
    };
    
    animateLoading();
    
    loadingContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    
    return loadingContainer;
}

function createStorageLocker(x, y, camera, colliders) {
    const lockerContainer = new Container();
    lockerContainer.x = x;
    lockerContainer.y = y;
    
    const graphics = new Graphics();
    
    // Main locker body
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-25, -30, 50, 60, 4);
    graphics.endFill();
    
    // Locker door
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-23, -28, 46, 56, 3);
    graphics.endFill();
    
    // Door frame
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-22, -27, 44, 54, 2);
    
    // Ventilation slots
    graphics.lineStyle(1, 0x1a1a1a);
    for (let i = 0; i < 8; i++) {
        graphics.moveTo(-18 + i * 4, -25);
        graphics.lineTo(-16 + i * 4, -25);
        graphics.moveTo(-18 + i * 4, -22);
        graphics.lineTo(-16 + i * 4, -22);
        graphics.moveTo(-18 + i * 4, -19);
        graphics.lineTo(-16 + i * 4, -19);
    }
    
    // Digital lock panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-8, -10, 16, 12, 2);
    graphics.endFill();
    
    // Lock display
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-6, -8, 12, 4, 1);
    graphics.endFill();
    
    // Display segments
    graphics.beginFill(0x00ff66);
    graphics.drawRect(-5, -7, 2, 1);
    graphics.drawRect(-2, -7, 2, 1);
    graphics.drawRect(1, -7, 2, 1);
    graphics.drawRect(4, -7, 2, 1);
    graphics.endFill();
    
    // Keypad buttons
    const keypadButtons = [
        {x: -5, y: -2}, {x: -1, y: -2}, {x: 3, y: -2},
        {x: -5, y: 2}, {x: -1, y: 2}, {x: 3, y: 2}
    ];
    
    graphics.beginFill(0x444444);
    keypadButtons.forEach(btn => {
        graphics.drawCircle(btn.x, btn.y, 1.5);
    });
    graphics.endFill();
    
    // Active button indicator
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(-1, -2, 0.8);
    graphics.endFill();
    
    // Door handle
    graphics.beginFill(0x555555);
    graphics.lineStyle(1, 0x777777);
    graphics.drawRoundedRect(15, -3, 6, 6, 2);
    graphics.endFill();
    
    // Handle grip
    graphics.beginFill(0x666666);
    graphics.drawRect(16, -2, 4, 4);
    graphics.endFill();
    
    // Lock status LED
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(18, 8, 1);
    graphics.endFill();
    
    // Hinges
    graphics.beginFill(0x555555);
    graphics.drawRect(-24, -20, 3, 4);
    graphics.drawRect(-24, -5, 3, 4);
    graphics.drawRect(-24, 10, 3, 4);
    graphics.endFill();
    
    // Hinge pins
    graphics.beginFill(0x333333);
    graphics.drawCircle(-22, -18, 0.8);
    graphics.drawCircle(-22, -3, 0.8);
    graphics.drawCircle(-22, 12, 0.8);
    graphics.endFill();
    
    // ID plate
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-15, 15, 30, 8, 2);
    graphics.endFill();
    
    // Locker number
    graphics.beginFill(0xcccccc);
    graphics.drawRect(-12, 17, 3, 4);
    graphics.drawRect(-8, 17, 3, 4);
    graphics.drawRect(-4, 17, 3, 4);
    graphics.drawRect(1, 17, 3, 4);
    graphics.drawRect(5, 17, 3, 4);
    graphics.endFill();
    
    // Base/floor mount
    graphics.beginFill(0x444444);
    graphics.drawRect(-23, 28, 46, 2);
    graphics.endFill();
    
    // Floor bolts
    graphics.beginFill(0x555555);
    graphics.drawCircle(-18, 29, 1);
    graphics.drawCircle(-6, 29, 1);
    graphics.drawCircle(6, 29, 1);
    graphics.drawCircle(18, 29, 1);
    graphics.endFill();
    
    // Access card reader
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-18, 5, 8, 12, 2);
    graphics.endFill();
    
    // Card slot
    graphics.beginFill(0x000000);
    graphics.drawRect(-16, 7, 4, 1);
    graphics.endFill();
    
    // Reader indicators
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(-14, 10, 0.8);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-14, 13, 0.8);
    graphics.endFill();
    
    // Internal shelf indicators (visible through gap)
    graphics.lineStyle(1, 0x555555, 0.3);
    graphics.moveTo(-20, -15);
    graphics.lineTo(20, -15);
    graphics.moveTo(-20, 0);
    graphics.lineTo(20, 0);
    graphics.moveTo(-20, 15);
    graphics.lineTo(20, 15);
    
    // Side panel details
    graphics.beginFill(0x333333);
    graphics.drawRect(-25, -25, 2, 50);
    graphics.drawRect(23, -25, 2, 50);
    graphics.endFill();
    
    // Side ventilation
    graphics.beginFill(0x1a1a1a);
    for (let i = 0; i < 6; i++) {
        graphics.drawCircle(-24, -20 + i * 8, 1);
        graphics.drawCircle(24, -20 + i * 8, 1);
    }
    graphics.endFill();
    
    lockerContainer.addChild(graphics);
    const bounds = {
  x: x - 28,        // -25 (main body) - margin for hinges and side panels
  y: y - 32,        // -30 (top of locker) - margin for top stroke and rounded corners
  width: 56,        // From -28 to +28
  height: 64,       // From -32 to +32, includes base/floor mount and ID plate
  label: "storageLocker"
};

if(colliders) addWithCollider(camera, lockerContainer, bounds, colliders);
    
    return lockerContainer;
}

function createReactorCore(x, y,camera, colliders) {
  console.log("createReactorCore");
    // Create main reactor core container
    const reactorContainer = new Container();
    reactorContainer.x = x;
    reactorContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main reactor housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(4, 0x333333);
    graphics.drawCircle(0, 0, 65);
    graphics.endFill();
    
    // Outer containment ring
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x555555);
    graphics.drawCircle(0, 0, 55);
    graphics.endFill();
    
    // Inner reactor chamber
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x666666);
    graphics.drawCircle(0, 0, 45);
    graphics.endFill();
    
    // Core plasma chamber
    graphics.beginFill(0x002244);
    graphics.lineStyle(2, 0x0088cc);
    graphics.drawCircle(0, 0, 35);
    graphics.endFill();
    
    // Primary core
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x00aaff);
    graphics.drawCircle(0, 0, 25);
    graphics.endFill();
    
    // Core center
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(0, 0, 15);
    graphics.endFill();
    
    // Central core hub
    graphics.beginFill(0x00aaff);
    graphics.drawCircle(0, 0, 8);
    graphics.endFill();
    
    // Reactor control rods
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 6; i++) {
        const angle = i * 1.047; // 60 degrees
        const rodX = Math.cos(angle) * 20;
        const rodY = Math.sin(angle) * 20;
        graphics.drawRoundedRect(rodX - 1.5, rodY - 8, 3, 16, 1);
    }
    graphics.endFill();
    
    // Control rod indicators
    graphics.beginFill(0x00ff00);
    for (let i = 0; i < 6; i++) {
        const angle = i * 1.047;
        const rodX = Math.cos(angle) * 20;
        const rodY = Math.sin(angle) * 20;
        graphics.drawCircle(rodX, rodY - 10, 1);
    }
    graphics.endFill();
    
    // Magnetic field generators
    graphics.beginFill(0x110033);
    graphics.lineStyle(2, 0x4400cc);
    for (let i = 0; i < 8; i++) {
        const angle = i * 0.785; // 45 degrees
        const genX = Math.cos(angle) * 40;
        const genY = Math.sin(angle) * 40;
        graphics.drawRoundedRect(genX - 3, genY - 8, 6, 16, 2);
    }
    graphics.endFill();
    
    // Field coils
    graphics.beginFill(0x6600ff);
    for (let i = 0; i < 8; i++) {
        const angle = i * 0.785;
        const genX = Math.cos(angle) * 40;
        const genY = Math.sin(angle) * 40;
        graphics.drawCircle(genX, genY, 2);
    }
    graphics.endFill();
    
    // Plasma conduits
    graphics.lineStyle(2, 0x00ccff, 0.6);
    for (let i = 0; i < 12; i++) {
        const angle = i * 0.524; // 30 degrees
        const startX = Math.cos(angle) * 15;
        const startY = Math.sin(angle) * 15;
        const endX = Math.cos(angle) * 30;
        const endY = Math.sin(angle) * 30;
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, endY);
    }
    
    // Reactor monitoring systems
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-60, -50, 25, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(35, -50, 25, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(-60, 42, 25, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110011);
    graphics.lineStyle(1, 0xcc44cc);
    graphics.drawRoundedRect(35, 42, 25, 8, 2);
    graphics.endFill();
    
    // Monitoring readouts
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 8; i++) {
        const height = 1 + Math.sin(i * 0.5) * 1.5 + 1;
        graphics.drawRect(-57 + i * 2.5, -45 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 8; i++) {
        const height = 1 + Math.cos(i * 0.7) * 1.5 + 1;
        graphics.drawRect(38 + i * 2.5, -45 - height, 2, height);
    }
    graphics.endFill();
    
    // Emergency shutdown systems
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(-50, 0, 6);
    graphics.drawCircle(50, 0, 6);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(-50, 0, 3);
    graphics.drawCircle(50, 0, 3);
    graphics.endFill();
    
    // Power output indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-45, -60, 2);
    graphics.drawCircle(45, -60, 2);
    graphics.drawCircle(-45, 60, 2);
    graphics.drawCircle(45, 60, 2);
    graphics.endFill();
    
    // Add graphics to container
    reactorContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    reactorContainer.addChild(animatedElements);
    
    // Animation for plasma flow and energy pulses
    let animationTime = 0;
    
    const animateReactor = () => {
        animationTime += 0.06;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate plasma energy rings
        for (let ring = 0; ring < 3; ring++) {
            const ringRadius = 10 + ring * 8;
            const ringAlpha = 0.3 + Math.sin(animationTime * 2 + ring) * 0.2;
            const ringSize = ringRadius + Math.sin(animationTime * 3 + ring) * 2;
            
            animatedElements.beginFill(0x00ccff, ringAlpha);
            animatedElements.drawCircle(0, 0, ringSize);
            animatedElements.beginFill(0x002244, 1);
            animatedElements.drawCircle(0, 0, ringSize - 2);
            animatedElements.endFill();
        }
        
        // Animate energy pulses along conduits
        animatedElements.lineStyle(3, 0x00ffcc, 0.8);
        for (let i = 0; i < 12; i++) {
            const angle = i * 0.524 + animationTime * 0.5;
            const progress = (animationTime * 2 + i * 0.3) % 1;
            
            const startRadius = 15 + progress * 15;
            const endRadius = startRadius + 5;
            
            const startX = Math.cos(angle) * startRadius;
            const startY = Math.sin(angle) * startRadius;
            const endX = Math.cos(angle) * endRadius;
            const endY = Math.sin(angle) * endRadius;
            
            animatedElements.moveTo(startX, startY);
            animatedElements.lineTo(endX, endY);
        }
        
        // Animate core pulsing
        const coreAlpha = 0.6 + Math.sin(animationTime * 4) * 0.3;
        animatedElements.beginFill(0x00aaff, coreAlpha);
        animatedElements.drawCircle(0, 0, 5);
        animatedElements.endFill();
        
        requestAnimationFrame(animateReactor);
    };
    
    // Start animation
    animateReactor();
    
    // Provide external animate method
    reactorContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 70,         // Outer radius (65) + margin for animated plasma rings and power indicators
  y: y - 70,
  width: 130,        // Total width including outermost static and animated parts
  height: 140,
  label: "reactorCore"
};

if(colliders) addWithCollider(camera, reactorContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "reactorCore",
    bounds,
    message: "The Reactor Core pulses with immense, contained power, its faint hum resonating through the deck plating",
    bubble: null,
});
    
    return reactorContainer;
}

function createCoolingSystem(x, y, camera, colliders) {
    // Create main cooling system container
    const coolingContainer = new Container();
    coolingContainer.x = x;
    coolingContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main cooling unit housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-70, -40, 140, 80, 12);
    graphics.endFill();
    
    // Cooling chamber
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-65, -35, 130, 70, 10);
    graphics.endFill();
    
    // Primary coolant reservoir
    graphics.beginFill(0x001122);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawRoundedRect(-60, -30, 120, 25, 8);
    graphics.endFill();
    
    // Coolant level indicator
    graphics.beginFill(0x0088cc);
    graphics.drawRoundedRect(-58, -28, 116, 21, 6);
    graphics.endFill();
    
    // Coolant fluid
    graphics.beginFill(0x00aaff);
    graphics.drawRoundedRect(-56, -26, 112, 17, 4);
    graphics.endFill();
    
    // Cooling pipes - main distribution
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-45, -45, 8, 15, 4);
    graphics.drawRoundedRect(-15, -45, 8, 15, 4);
    graphics.drawRoundedRect(15, -45, 8, 15, 4);
    graphics.drawRoundedRect(45, -45, 8, 15, 4);
    graphics.endFill();
    
    // Return pipes
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-45, 30, 8, 15, 4);
    graphics.drawRoundedRect(-15, 30, 8, 15, 4);
    graphics.drawRoundedRect(15, 30, 8, 15, 4);
    graphics.drawRoundedRect(45, 30, 8, 15, 4);
    graphics.endFill();
    
    // Pipe connections
    graphics.beginFill(0x444444);
    graphics.drawCircle(-41, -37, 2);
    graphics.drawCircle(-11, -37, 2);
    graphics.drawCircle(19, -37, 2);
    graphics.drawCircle(49, -37, 2);
    graphics.drawCircle(-41, 37, 2);
    graphics.drawCircle(-11, 37, 2);
    graphics.drawCircle(19, 37, 2);
    graphics.drawCircle(49, 37, 2);
    graphics.endFill();
    
    // Heat exchangers
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x666666);
    graphics.drawRoundedRect(-70, -15, 15, 30, 6);
    graphics.drawRoundedRect(55, -15, 15, 30, 6);
    graphics.endFill();
    
    // Heat exchanger fins
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x777777);
    for (let i = 0; i < 8; i++) {
        graphics.drawRoundedRect(-68, -12 + i * 3, 11, 2, 1);
        graphics.drawRoundedRect(57, -12 + i * 3, 11, 2, 1);
    }
    graphics.endFill();
    
    // Cooling pumps
    graphics.beginFill(0x001100);
    graphics.lineStyle(2, 0x00cc44);
    graphics.drawCircle(-30, 10, 8);
    graphics.drawCircle(30, 10, 8);
    graphics.endFill();
    
    // Pump rotors
    graphics.beginFill(0x00ff66);
    graphics.lineStyle(1, 0x333333);
    for (let pump = 0; pump < 2; pump++) {
        const pumpX = pump === 0 ? -30 : 30;
        for (let i = 0; i < 6; i++) {
            const angle = i * 1.047; // 60 degrees
            const bladeX = pumpX + Math.cos(angle) * 4;
            const bladeY = 10 + Math.sin(angle) * 4;
            graphics.drawRoundedRect(bladeX - 0.5, bladeY - 2, 1, 4, 0.5);
        }
    }
    graphics.endFill();
    
    // Pump centers
    graphics.beginFill(0x333333);
    graphics.drawCircle(-30, 10, 2);
    graphics.drawCircle(30, 10, 2);
    graphics.endFill();
    
    // Temperature sensors
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-50, 5, 12, 6, 2);
    graphics.drawRoundedRect(-25, 5, 12, 6, 2);
    graphics.drawRoundedRect(0, 5, 12, 6, 2);
    graphics.drawRoundedRect(25, 5, 12, 6, 2);
    graphics.endFill();
    
    // Temperature readouts
    graphics.beginFill(0xff6600);
    for (let sensor = 0; sensor < 4; sensor++) {
        const sensorX = -44 + sensor * 25;
        const temp = 3 + Math.sin(sensor * 0.8) * 2;
        graphics.drawRect(sensorX, 8 - temp, 2, temp);
    }
    graphics.endFill();
    
    // Flow rate monitors
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(-55, -20, 15, 8, 2);
    graphics.drawRoundedRect(40, -20, 15, 8, 2);
    graphics.endFill();
    
    // Flow indicators
    graphics.beginFill(0x6600ff);
    for (let i = 0; i < 5; i++) {
        const height = 1 + Math.cos(i * 0.6) * 1.5 + 1;
        graphics.drawRect(-52 + i * 2, -15 - height, 1.5, height);
        graphics.drawRect(43 + i * 2, -15 - height, 1.5, height);
    }
    graphics.endFill();
    
    // System status panels
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-25, -35, 20, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(5, -35, 20, 8, 2);
    graphics.endFill();
    
    // Status indicators
    const statusLights = [
        {x: -22, y: -31, color: 0x00ff00},
        {x: -18, y: -31, color: 0x00ff00},
        {x: -14, y: -31, color: 0xffff00},
        {x: -10, y: -31, color: 0x00ff00},
        {x: 8, y: -31, color: 0xff0000},
        {x: 12, y: -31, color: 0x00ff00},
        {x: 16, y: -31, color: 0x00ff00},
        {x: 20, y: -31, color: 0x00ff00}
    ];
    
    statusLights.forEach(light => {
        graphics.beginFill(light.color);
        graphics.drawCircle(light.x, light.y, 1.5);
        graphics.endFill();
    });
    
    // Control valves
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(-60, 0, 4);
    graphics.drawCircle(60, 0, 4);
    graphics.endFill();
    
    // Valve indicators
    graphics.lineStyle(2, 0x00ff00);
    graphics.moveTo(-60, 0);
    graphics.lineTo(-58, -2);
    graphics.moveTo(60, 0);
    graphics.lineTo(62, -2);
    
    // Emergency coolant injection
    graphics.beginFill(0xff0000);
    graphics.lineStyle(2, 0x333333);
    graphics.drawCircle(0, 25, 5);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(0, 25, 2);
    graphics.endFill();
    
    // Power indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-65, -50, 2);
    graphics.drawCircle(65, -50, 2);
    graphics.endFill();
    
    // Add graphics to container
    coolingContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    coolingContainer.addChild(animatedElements);
    
    // Animation for coolant flow and pump rotation
    let animationTime = 0;
    
    const animateCooling = () => {
        animationTime += 0.05;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate coolant flow
        const flowOffset = (animationTime * 20) % 112;
        animatedElements.beginFill(0x00ccff, 0.6);
        animatedElements.drawRoundedRect(-56 + flowOffset, -26, 8, 17, 4);
        animatedElements.endFill();
        
        // Animate pump rotation
        animatedElements.lineStyle(2, 0x00ffcc, 0.8);
        for (let pump = 0; pump < 2; pump++) {
            const pumpX = pump === 0 ? -30 : 30;
            for (let i = 0; i < 6; i++) {
                const angle = i * 1.047 + animationTime * 3;
                const bladeX = pumpX + Math.cos(angle) * 5;
                const bladeY = 10 + Math.sin(angle) * 5;
                animatedElements.moveTo(pumpX, 10);
                animatedElements.lineTo(bladeX, bladeY);
            }
        }
        
        // Animate temperature fluctuations
        animatedElements.beginFill(0xff8800, 0.3);
        const tempWave = Math.sin(animationTime * 2) * 2;
        animatedElements.drawRoundedRect(-60, -30 + tempWave, 120, 2, 1);
        animatedElements.endFill();
        
        requestAnimationFrame(animateCooling);
    };
    
    // Start animation
    animateCooling();
    
    // Provide external animate method
    coolingContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 75,         // Encompasses the rounded edges, pipe protrusions, and valve reach
  y: y - 55,         // Covers pumps, pipes, indicators, and top margins
  width: 150,        // Total width across entire housing + outer pipes and valves
  height: 110,       // Total height including lower return pipes and emergency injection
  label: "coolingSystem"
};

if(colliders) addWithCollider(camera, coolingContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "coolingSystem",
    bounds,
    message: "A low, steady whoosh emanates from the Cooling System vents, as internal fluids circulate to prevent critical systems from overheating",
    bubble: null,
});
    
    return coolingContainer;
}

function createReactorControlPanel(x, y, camera, colliders) {
    const reactorContainer = new Container();
    reactorContainer.x = x;
    reactorContainer.y = y;
    
    const graphics = new Graphics();
    
    // Main reactor housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-90, -55, 180, 110, 15);
    graphics.endFill();
    
    // Reactor core chamber
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x006600);
    graphics.drawCircle(0, -10, 35);
    graphics.endFill();
    
    // Core containment rings
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x00cc00);
    graphics.drawCircle(0, -10, 30);
    graphics.drawCircle(0, -10, 25);
    graphics.drawCircle(0, -10, 20);
    graphics.endFill();
    
    // Reactor fuel rods
    graphics.beginFill(0x003300);
    graphics.lineStyle(1, 0x00ff00);
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const rodX = Math.cos(angle) * 15;
        const rodY = -10 + Math.sin(angle) * 15;
        graphics.drawRoundedRect(rodX - 2, rodY - 8, 4, 16, 2);
    }
    graphics.endFill();
    
    // Central reactor core
    graphics.beginFill(0x004400);
    graphics.lineStyle(2, 0x00ff44);
    graphics.drawCircle(0, -10, 8);
    graphics.endFill();
    
    // Core energy indicators
    graphics.beginFill(0x00ff88);
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const dotX = Math.cos(angle) * 5;
        const dotY = -10 + Math.sin(angle) * 5;
        graphics.drawCircle(dotX, dotY, 1);
    }
    graphics.endFill();
    
    // Left control panel - Power Management
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-85, -35, 22, 70, 8);
    graphics.endFill();
    
    // Power output display
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-82, -32, 16, 20, 3);
    graphics.endFill();
    
    // Power level bars
    const powerLevels = [95, 88, 76, 82, 91, 68];
    powerLevels.forEach((level, i) => {
        const barY = -28 + i * 2.5;
        graphics.beginFill(0x003300);
        graphics.drawRect(-80, barY, 12, 1.5);
        graphics.endFill();
        
        const powerWidth = (level / 100) * 12;
        let powerColor = 0x00ff00;
        if (level > 90) powerColor = 0xff6600;
        if (level < 75) powerColor = 0xff0000;
        
        graphics.beginFill(powerColor);
        graphics.drawRect(-80, barY, powerWidth, 1.5);
        graphics.endFill();
    });
    
    // Control rods position
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    for (let i = 0; i < 4; i++) {
        graphics.drawRoundedRect(-82, -8 + i * 6, 16, 4, 2);
    }
    graphics.endFill();
    
    // Rod position indicators
    const rodPositions = [0.8, 0.6, 0.9, 0.4];
    rodPositions.forEach((pos, i) => {
        const rodY = -6 + i * 6;
        graphics.beginFill(0x666666);
        graphics.drawRect(-80, rodY, 12, 1);
        graphics.endFill();
        
        graphics.beginFill(0x00ccff);
        graphics.drawCircle(-80 + pos * 12, rodY + 0.5, 0.8);
        graphics.endFill();
    });
    
    // Emergency shutdown button
    graphics.beginFill(0x330000);
    graphics.lineStyle(2, 0xff0000);
    graphics.drawCircle(-74, 22, 6);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(-74, 22, 4);
    graphics.endFill();
    
    // Right control panel - Monitoring
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(63, -35, 22, 70, 8);
    graphics.endFill();
    
    // Temperature gauge
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc0000);
    graphics.drawCircle(74, -20, 8);
    graphics.endFill();
    
    // Temperature needle
    graphics.lineStyle(2, 0xff6600);
    graphics.moveTo(74, -20);
    graphics.lineTo(74 + Math.cos(2.1) * 6, -20 + Math.sin(2.1) * 6);
    
    // Pressure readings
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc00);
    graphics.drawRoundedRect(67, -5, 14, 12, 2);
    graphics.endFill();
    
    const pressureData = [
        {x: 69, y: -2, value: 0.8},
        {x: 72, y: -2, value: 0.6},
        {x: 75, y: -2, value: 0.9},
        {x: 78, y: -2, value: 0.7},
        {x: 69, y: 1, value: 0.5},
        {x: 72, y: 1, value: 0.8},
        {x: 75, y: 1, value: 0.6},
        {x: 78, y: 1, value: 0.9}
    ];
    
    pressureData.forEach(data => {
        const height = data.value * 4;
        graphics.beginFill(0x00ff44);
        graphics.drawRect(data.x, data.y + 4 - height, 1, height);
        graphics.endFill();
    });
    
    // Coolant flow indicators
    graphics.beginFill(0x000033);
    graphics.lineStyle(1, 0x0066ff);
    graphics.drawRoundedRect(67, 12, 14, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(70, 16, 1);
    graphics.drawCircle(74, 16, 1);
    graphics.drawCircle(78, 16, 1);
    graphics.endFill();
    
    // Radiation monitoring
    graphics.beginFill(0x331100);
    graphics.lineStyle(1, 0xffaa00);
    graphics.drawRoundedRect(67, 25, 14, 8, 2);
    graphics.endFill();
    
    // Radiation level display
    graphics.beginFill(0xffaa00);
    for (let i = 0; i < 5; i++) {
        graphics.drawRect(68 + i * 2.5, 27, 1.5, 4);
    }
    graphics.endFill();
    
    // Bottom status panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-70, 40, 140, 12, 4);
    graphics.endFill();
    
    // System status indicators
    const statusItems = [
        {label: 'CORE', color: 0x00ff00, x: -60},
        {label: 'COOL', color: 0x0066ff, x: -30},
        {label: 'RODS', color: 0x00ff00, x: 0},
        {label: 'PRES', color: 0xffaa00, x: 30},
        {label: 'SAFE', color: 0x00ff00, x: 60}
    ];
    
    statusItems.forEach(item => {
        graphics.beginFill(item.color);
        graphics.drawCircle(item.x, 46, 2);
        graphics.endFill();
    });
    
    reactorContainer.addChild(graphics);
    
    // Animated elements
    const animatedElements = new Graphics();
    reactorContainer.addChild(animatedElements);
    
    let animationTime = 0;
    
    const animateReactor = () => {
        animationTime += 0.02;
        animatedElements.clear();
        
        // Pulsing reactor core
        const coreIntensity = 0.3 + Math.sin(animationTime * 3) * 0.7;
        animatedElements.beginFill(0x00ff88, coreIntensity);
        animatedElements.drawCircle(0, -10, 8);
        animatedElements.endFill();
        
        // Rotating energy field
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6 + animationTime;
            const dotX = Math.cos(angle) * 12;
            const dotY = -10 + Math.sin(angle) * 12;
            animatedElements.beginFill(0x00ff44, 0.8);
            animatedElements.drawCircle(dotX, dotY, 1.5);
            animatedElements.endFill();
        }
        
        // Coolant flow animation
        const flowOffset = (animationTime * 30) % 14;
        animatedElements.beginFill(0x0088ff, 0.6);
        animatedElements.drawCircle(67 + flowOffset, 16, 1);
        animatedElements.endFill();
        
        requestAnimationFrame(animateReactor);
    };
    
    animateReactor();
    
    reactorContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 95,             // Left-most edge includes outer left panel + padding
  y: y - 60,             // Top-most edge includes housing and gauge
  width: 190,            // Full width including both side panels and status indicators
  height: 120,           // Full height from top of reactor to bottom status panel
  label: "reactorControlPanel"
};

if(colliders) addWithCollider(camera, reactorContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "reactorControlPanel",
    bounds,
    message: "The large, physical overrides on the Reactor Control Panel are locked, a testament to the immense power they manage",
    bubble: null,
});
    
    return reactorContainer;
}

function createWarningSystem(x, y, camera, colliders) {
    const warningContainer = new Container();
    warningContainer.x = x;
    warningContainer.y = y;
    
    const graphics = new Graphics();
    
    // Main warning system housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-70, -50, 140, 100, 12);
    graphics.endFill();
    
    // Alert display panel
    graphics.beginFill(0x220000);
    graphics.lineStyle(2, 0x660000);
    graphics.drawRoundedRect(-65, -45, 130, 35, 8);
    graphics.endFill();
    
    // Main warning display
    graphics.beginFill(0x330000);
    graphics.lineStyle(1, 0xff0000);
    graphics.drawRoundedRect(-60, -40, 120, 25, 6);
    graphics.endFill();
    
    // Warning level indicators
    const warningLevels = [
        {level: 'CRITICAL', color: 0xff0000, y: -35, active: true},
        {level: 'HIGH', color: 0xff6600, y: -28, active: true},
        {level: 'MEDIUM', color: 0xffff00, y: -21, active: false},
        {level: 'LOW', color: 0x00ff00, y: -14, active: false}
    ];
    
    warningLevels.forEach(warning => {
        const alpha = warning.active ? 1.0 : 0.3;
        graphics.beginFill(warning.color, alpha);
        graphics.drawRect(-58, warning.y, 8, 4);
        graphics.endFill();
        
        graphics.beginFill(warning.color, alpha);
        graphics.drawCircle(-45, warning.y + 2, 1.5);
        graphics.endFill();
    });
    
    // Alert matrix display
    const alertMatrix = [
        [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
        [0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
        [1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1]
    ];
    
    alertMatrix.forEach((row, i) => {
        row.forEach((active, j) => {
            const color = active ? 0xff0000 : 0x330000;
            graphics.beginFill(color);
            graphics.drawRect(-35 + j * 7, -35 + i * 5, 5, 3);
            graphics.endFill();
        });
    });
    
    // Left sensor panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-65, -5, 20, 50, 6);
    graphics.endFill();
    
    // Sensor array
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00aa00);
    graphics.drawRoundedRect(-62, -2, 14, 20, 3);
    graphics.endFill();
    
    // Individual sensors
    const sensorStates = [
        {x: -59, y: 2, status: 'ok'},
        {x: -55, y: 2, status: 'warning'},
        {x: -51, y: 2, status: 'critical'},
        {x: -59, y: 6, status: 'ok'},
        {x: -55, y: 6, status: 'ok'},
        {x: -51, y: 6, status: 'warning'},
        {x: -59, y: 10, status: 'critical'},
        {x: -55, y: 10, status: 'ok'},
        {x: -51, y: 10, status: 'ok'},
        {x: -59, y: 14, status: 'ok'},
        {x: -55, y: 14, status: 'critical'},
        {x: -51, y: 14, status: 'warning'}
    ];
    
    sensorStates.forEach(sensor => {
        let color = 0x00ff00;
        if (sensor.status === 'warning') color = 0xffaa00;
        if (sensor.status === 'critical') color = 0xff0000;
        
        graphics.beginFill(color);
        graphics.drawCircle(sensor.x, sensor.y, 1);
        graphics.endFill();
    });
    
    // Communication status
    graphics.beginFill(0x000033);
    graphics.lineStyle(1, 0x0066ff);
    graphics.drawRoundedRect(-62, 22, 14, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawRect(-60, 24, 2, 1);
    graphics.drawRect(-57, 24, 3, 1);
    graphics.drawRect(-53, 24, 1, 1);
    graphics.drawRect(-60, 26, 4, 1);
    graphics.drawRect(-55, 26, 2, 1);
    graphics.drawRect(-60, 28, 1, 1);
    graphics.drawRect(-58, 28, 3, 1);
    graphics.endFill();
    
    // Emergency broadcast controls
    graphics.beginFill(0x330000);
    graphics.lineStyle(1, 0xff0000);
    graphics.drawRoundedRect(-62, 34, 14, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(-58, 38, 2);
    graphics.drawCircle(-52, 38, 2);
    graphics.endFill();
    
    // Right control panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(45, -5, 20, 50, 6);
    graphics.endFill();
    
    // Alert priority controls
    graphics.beginFill(0x220000);
    graphics.lineStyle(1, 0x880000);
    graphics.drawRoundedRect(48, -2, 14, 15, 3);
    graphics.endFill();
    
    // Priority buttons
    const priorities = [
        {x: 50, y: 2, level: 'P1', color: 0xff0000},
        {x: 55, y: 2, level: 'P2', color: 0xff6600},
        {x: 60, y: 2, level: 'P3', color: 0xffaa00},
        {x: 50, y: 6, level: 'P4', color: 0x00ff00},
        {x: 55, y: 6, level: 'P5', color: 0x0066ff},
        {x: 60, y: 6, level: 'ALL', color: 0x666666}
    ];
    
    priorities.forEach(priority => {
        graphics.beginFill(priority.color);
        graphics.drawRoundedRect(priority.x, priority.y, 3, 3, 1);
        graphics.endFill();
    });
    
    // Zone selector
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x008800);
    graphics.drawRoundedRect(48, 17, 14, 12, 3);
    graphics.endFill();
    
    // Zone grid
    const zoneGrid = [
        [1, 0, 1, 0, 1],
        [0, 1, 1, 1, 0],
        [1, 1, 0, 1, 1],
        [0, 1, 1, 0, 1]
    ];
    
    zoneGrid.forEach((row, i) => {
        row.forEach((active, j) => {
            const color = active ? 0x00ff00 : 0x004400;
            graphics.beginFill(color);
            graphics.drawRect(49 + j * 2.4, 18 + i * 2.5, 2, 2);
            graphics.endFill();
        });
    });
    
    // Acknowledgment controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(48, 33, 14, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawRoundedRect(50, 35, 4, 2, 1);
    graphics.endFill();
    
    graphics.beginFill(0xffaa00);
    graphics.drawRoundedRect(56, 35, 4, 2, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawRoundedRect(50, 38, 4, 2, 1);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawRoundedRect(56, 38, 4, 2, 1);
    graphics.endFill();
    
    // Bottom status bar
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-60, 45, 120, 8, 4);
    graphics.endFill();
    
    // Status indicators
    const statusIndicators = [
        {x: -50, color: 0xff0000, label: 'ALARM'},
        {x: -25, color: 0xff6600, label: 'WARN'},
        {x: 0, color: 0xffaa00, label: 'ATTN'},
        {x: 25, color: 0x00ff00, label: 'READY'},
        {x: 50, color: 0x0066ff, label: 'COMM'}
    ];
    
    statusIndicators.forEach(indicator => {
        graphics.beginFill(indicator.color);
        graphics.drawCircle(indicator.x, 49, 1.5);
        graphics.endFill();
    });
    
    warningContainer.addChild(graphics);
    
    // Animated elements
    const animatedElements = new Graphics();
    warningContainer.addChild(animatedElements);
    
    let animationTime = 0;
    
    const animateWarning = () => {
        animationTime += 0.05;
        animatedElements.clear();
        
        // Flashing critical alerts
        const flashIntensity = Math.sin(animationTime * 6) > 0 ? 1.0 : 0.3;
        animatedElements.beginFill(0xff0000, flashIntensity);
        animatedElements.drawRect(-58, -35, 8, 4);
        animatedElements.drawCircle(-45, -33, 1.5);
        animatedElements.endFill();
        
        // Scrolling alert text effect
        const scrollOffset = (animationTime * 20) % 84;
        animatedElements.beginFill(0xff4444, 0.8);
        animatedElements.drawRect(-35 + scrollOffset, -32, 2, 8);
        animatedElements.endFill();
        
        // Pulsing emergency buttons
        const emergencyPulse = 0.4 + Math.sin(animationTime * 4) * 0.6;
        animatedElements.beginFill(0xff0000, emergencyPulse);
        animatedElements.drawCircle(-58, 38, 2);
        animatedElements.drawCircle(-52, 38, 2);
        animatedElements.endFill();
        
        requestAnimationFrame(animateWarning);
    };
    
    animateWarning();
    
    warningContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 75,
  y: y - 55,
  width: 150,
  height: 115,
  label: "warningSystem"
};

if(colliders) addWithCollider(camera, warningContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "warningSystem",
    bounds,
    message: "A faint, almost imperceptible red glow pulses from within the Warning System's console, a constant pre-diagnostic check",
    bubble: null,
});
    
    return warningContainer;
}

function createSpaceBunk(x, y, camera, colliders) {
    // Create main bunk container
    const bunkContainer = new Container();
    bunkContainer.x = x;
    bunkContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main bunk frame structure
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-80, -40, 160, 80, 8);
    graphics.endFill();
    
    // Inner frame
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-75, -35, 150, 70, 6);
    graphics.endFill();
    
    // Mattress/sleeping surface
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-70, -30, 140, 25, 4);
    graphics.endFill();
    
    // Mattress padding lines
    graphics.lineStyle(1, 0x004488, 0.5);
    for (let i = 1; i < 7; i++) {
        graphics.moveTo(-70 + i * 20, -30);
        graphics.lineTo(-70 + i * 20, -5);
    }
    
    // Pillow area
    graphics.beginFill(0x004488);
    graphics.lineStyle(1, 0x0088cc);
    graphics.drawRoundedRect(-70, -30, 35, 25, 4);
    graphics.endFill();
    
    // Pillow surface detail
    graphics.beginFill(0x0066cc);
    graphics.drawRoundedRect(-67, -27, 29, 19, 3);
    graphics.endFill();
    
    // Control panel at head of bunk
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-78, -25, 12, 40, 4);
    graphics.endFill();
    
    // Environmental controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-76, -22, 8, 3, 1);
    graphics.drawRoundedRect(-76, -17, 8, 3, 1);
    graphics.drawRoundedRect(-76, -12, 8, 3, 1);
    graphics.endFill();
    
    // Control indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-72, -20, 1);
    graphics.drawCircle(-72, -10, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-72, -15, 1);
    graphics.endFill();
    
    // Temperature display
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-76, -7, 8, 6, 2);
    graphics.endFill();
    
    // Digital readout simulation
    graphics.beginFill(0x00ff88);
    graphics.drawRect(-75, -5, 1, 2);
    graphics.drawRect(-73, -5, 1, 2);
    graphics.drawRect(-71, -5, 1, 2);
    graphics.drawRect(-69, -5, 1, 2);
    graphics.endFill();
    
    // Storage compartment underneath
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-70, 0, 140, 30, 6);
    graphics.endFill();
    
    // Storage compartment door
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-68, 2, 65, 26, 4);
    graphics.endFill();
    
    // Door handle
    graphics.beginFill(0x666666);
    graphics.lineStyle(1, 0x888888);
    graphics.drawRoundedRect(-10, 13, 8, 4, 2);
    graphics.endFill();
    
    // Ventilation grilles
    graphics.lineStyle(1, 0x555555);
    for (let i = 0; i < 8; i++) {
        graphics.moveTo(5 + i * 8, 5);
        graphics.lineTo(5 + i * 8, 25);
    }
    
    // Privacy screen mount
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(72, -35, 6, 70, 3);
    graphics.endFill();
    
    // Privacy screen (retracted)
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(74, -33, 2, 20, 1);
    graphics.endFill();
    
    // Structural supports
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-78, 35, 6, 10, 3);
    graphics.drawRoundedRect(-25, 35, 6, 10, 3);
    graphics.drawRoundedRect(25, 35, 6, 10, 3);
    graphics.drawRoundedRect(72, 35, 6, 10, 3);
    graphics.endFill();
    
    // Safety rail
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(68, -5, 3, 35, 1);
    graphics.endFill();
    
    // Emergency release
    graphics.beginFill(0xff0000);
    graphics.lineStyle(1, 0x333333);
    graphics.drawCircle(-72, 8, 3);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(-72, 8, 1);
    graphics.endFill();
    
    // Status indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-72, 25, 2);
    graphics.endFill();
    
    // Add graphics to container
    bunkContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    bunkContainer.addChild(animatedElements);
    
    // Animation for status lights
    let animationTime = 0;
    
    const animateBunk = () => {
        animationTime += 0.05;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate breathing indicator
        const breathAlpha = 0.3 + Math.sin(animationTime) * 0.2;
        animatedElements.beginFill(0x00ffff, breathAlpha);
        animatedElements.drawCircle(0, -15, 2);
        animatedElements.endFill();
        
        // Animate temperature display
        const tempFlicker = Math.sin(animationTime * 8) > 0.8 ? 0.8 : 0.6;
        animatedElements.beginFill(0x00ff88, tempFlicker);
        animatedElements.drawRect(-75, -5, 1, 2);
        animatedElements.drawRect(-73, -5, 1, 2);
        animatedElements.drawRect(-71, -5, 1, 2);
        animatedElements.drawRect(-69, -5, 1, 2);
        animatedElements.endFill();
        
        requestAnimationFrame(animateBunk);
    };
    
    // Start animation
    animateBunk();
    
    // Provide external animate method
    bunkContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 85,
  y: y - 45,
  width: 170,
  height: 100,
  label: "spaceBunk"
};

if(colliders) addWithCollider(camera, bunkContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "spaceBunk",
    bounds,
    message: "Small, personalized trinkets are tucked into a recess of the Space Bunk, a small comfort in the vastness of space",
    bubble: null,
});
    
    return bunkContainer;
}

function createPersonalLocker(x, y, camera,colliders) {
    // Create main locker container
    const lockerContainer = new Container();
    lockerContainer.x = x;
    lockerContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main locker frame
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-30, -60, 60, 120, 8);
    graphics.endFill();
    
    // Inner frame
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-27, -57, 54, 114, 6);
    graphics.endFill();
    
    // Door frame
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, -55, 50, 110, 4);
    graphics.endFill();
    
    // Door surface
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-23, -53, 46, 106, 3);
    graphics.endFill();
    
    // Door panels
    graphics.beginFill(0x404040);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-21, -51, 42, 25, 2);
    graphics.drawRoundedRect(-21, -23, 42, 25, 2);
    graphics.drawRoundedRect(-21, 5, 42, 25, 2);
    graphics.drawRoundedRect(-21, 33, 42, 18, 2);
    graphics.endFill();
    
    // Identification panel
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-19, -49, 38, 8, 2);
    graphics.endFill();
    
    // ID display
    graphics.beginFill(0x00ff88);
    graphics.drawRect(-17, -47, 1, 4);
    graphics.drawRect(-15, -47, 1, 4);
    graphics.drawRect(-13, -47, 1, 4);
    graphics.drawRect(-11, -47, 1, 4);
    graphics.drawRect(-9, -47, 1, 4);
    graphics.drawRect(-7, -47, 1, 4);
    graphics.drawRect(-5, -47, 1, 4);
    graphics.drawRect(-3, -47, 1, 4);
    graphics.endFill();
    
    // Access control panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(15, -20, 12, 40, 4);
    graphics.endFill();
    
    // Biometric scanner
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(17, -18, 8, 12, 2);
    graphics.endFill();
    
    // Scanner surface
    graphics.beginFill(0x004488);
    graphics.drawRoundedRect(18, -17, 6, 10, 1);
    graphics.endFill();
    
    // Number pad
    const keypadButtons = [
        {x: 18, y: -2, num: '1'},
        {x: 21, y: -2, num: '2'},
        {x: 24, y: -2, num: '3'},
        {x: 18, y: 2, num: '4'},
        {x: 21, y: 2, num: '5'},
        {x: 24, y: 2, num: '6'},
        {x: 18, y: 6, num: '7'},
        {x: 21, y: 6, num: '8'},
        {x: 24, y: 6, num: '9'},
        {x: 21, y: 10, num: '0'}
    ];
    
    keypadButtons.forEach(btn => {
        graphics.beginFill(0x333333);
        graphics.lineStyle(1, 0x666666);
        graphics.drawRoundedRect(btn.x - 1, btn.y - 1, 2, 2, 0.5);
        graphics.endFill();
    });
    
    // Security status indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(21, 15, 1.5);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(18, 15, 1);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(24, 15, 1);
    graphics.endFill();
    
    // Door handle/latch
    graphics.beginFill(0x666666);
    graphics.lineStyle(1, 0x888888);
    graphics.drawRoundedRect(-15, 35, 12, 6, 3);
    graphics.endFill();
    
    // Latch mechanism
    graphics.beginFill(0x444444);
    graphics.drawRoundedRect(-13, 37, 8, 2, 1);
    graphics.endFill();
    
    // Ventilation system
    graphics.lineStyle(1, 0x555555);
    for (let i = 0; i < 12; i++) {
        graphics.moveTo(-19 + i * 3, 45);
        graphics.lineTo(-19 + i * 3, 49);
    }
    
    // Internal organization indicators
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-19, -21, 8, 4, 1);
    graphics.endFill();
    
    graphics.beginFill(0x220000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-19, 7, 8, 4, 1);
    graphics.endFill();
    
    graphics.beginFill(0x000022);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(-19, 35, 8, 4, 1);
    graphics.endFill();
    
    // Status readouts
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 3; i++) {
        graphics.drawRect(-17 + i * 2, -19, 1, 2);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 3; i++) {
        graphics.drawRect(-17 + i * 2, 9, 1, 2);
    }
    graphics.endFill();
    
    graphics.beginFill(0x6600ff);
    for (let i = 0; i < 3; i++) {
        graphics.drawRect(-17 + i * 2, 37, 1, 2);
    }
    graphics.endFill();
    
    // Power connection
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(27, 50, 4, 3, 1);
    graphics.endFill();
    
    // Power indicator
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(29, 46, 1.5);
    graphics.endFill();
    
    // Mounting brackets
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-32, -45, 4, 8, 2);
    graphics.drawRoundedRect(-32, -5, 4, 8, 2);
    graphics.drawRoundedRect(-32, 35, 4, 8, 2);
    graphics.drawRoundedRect(28, -45, 4, 8, 2);
    graphics.drawRoundedRect(28, -5, 4, 8, 2);
    graphics.drawRoundedRect(28, 35, 4, 8, 2);
    graphics.endFill();
    
    // Emergency override
    graphics.beginFill(0xff0000);
    graphics.lineStyle(1, 0x333333);
    graphics.drawCircle(21, -35, 2);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(21, -35, 0.8);
    graphics.endFill();
    
    // Add graphics to container
    lockerContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    lockerContainer.addChild(animatedElements);
    
    // Animation for security systems
    let animationTime = 0;
    
    const animateLocker = () => {
        animationTime += 0.06;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate biometric scanner
        const scanAlpha = 0.4 + Math.sin(animationTime * 2) * 0.3;
        animatedElements.beginFill(0x00ccff, scanAlpha);
        animatedElements.drawRoundedRect(18, -17, 6, 10, 1);
        animatedElements.endFill();
        
        // Animate security scanning line
        const scanLine = (animationTime * 15) % 10;
        animatedElements.lineStyle(1, 0x00ffff, 0.6);
        animatedElements.moveTo(18, -17 + scanLine);
        animatedElements.lineTo(24, -17 + scanLine);
        
        // Animate ID display flicker
        const idFlicker = Math.sin(animationTime * 6) > 0.7 ? 0.9 : 0.6;
        animatedElements.beginFill(0x00ff88, idFlicker);
        animatedElements.drawRect(-17, -47, 1, 4);
        animatedElements.drawRect(-15, -47, 1, 4);
        animatedElements.drawRect(-13, -47, 1, 4);
        animatedElements.drawRect(-11, -47, 1, 4);
        animatedElements.drawRect(-9, -47, 1, 4);
        animatedElements.drawRect(-7, -47, 1, 4);
        animatedElements.drawRect(-5, -47, 1, 4);
        animatedElements.drawRect(-3, -47, 1, 4);
        animatedElements.endFill();
        
        requestAnimationFrame(animateLocker);
    };
    
    // Start animation
    animateLocker();
    
    // Provide external animate method
    lockerContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 35,
  y: y - 65,
  width: 70,
  height: 130,
  label: "personalLocker"
};
if(colliders) addWithCollider(camera, lockerContainer, bounds, colliders);
    return lockerContainer;
}

function createRecTerminal(x, y, camera, colliders) {
    // Create main terminal container
    const terminalContainer = new Container();
    terminalContainer.x = x;
    terminalContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main terminal base/housing
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-50, -10, 100, 50, 8);
    graphics.endFill();
    
    // Base surface
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-47, -7, 94, 44, 6);
    graphics.endFill();
    
    // Monitor/display unit
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-45, -55, 90, 45, 10);
    graphics.endFill();
    
    // Screen bezel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-42, -52, 84, 39, 8);
    graphics.endFill();
    
    // Main display screen
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-40, -50, 80, 35, 6);
    graphics.endFill();
    
    // Active screen area
    graphics.beginFill(0x001122);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-38, -48, 76, 31, 4);
    graphics.endFill();
    
    // Entertainment content simulation
    graphics.beginFill(0x003366);
    graphics.drawRoundedRect(-36, -46, 25, 20, 2);
    graphics.endFill();
    
    graphics.beginFill(0x004488);
    graphics.drawRoundedRect(-34, -44, 21, 16, 1);
    graphics.endFill();
    
    // Media player interface
    graphics.beginFill(0x330033);
    graphics.lineStyle(1, 0x660066);
    graphics.drawRoundedRect(-8, -46, 44, 8, 2);
    graphics.endFill();
    
    // Progress bar
    graphics.beginFill(0x666666);
    graphics.drawRoundedRect(-6, -44, 40, 2, 1);
    graphics.endFill();
    
    graphics.beginFill(0x00ff88);
    graphics.drawRoundedRect(-6, -44, 25, 2, 1);
    graphics.endFill();
    
    // Media controls
    const mediaButtons = [
        {x: -6, y: -40, color: 0x0066ff, symbol: '◀◀'},
        {x: 2, y: -40, color: 0x00ff00, symbol: '▶'},
        {x: 10, y: -40, color: 0x0066ff, symbol: '▶▶'},
        {x: 18, y: -40, color: 0xff6600, symbol: '⏸'},
        {x: 26, y: -40, color: 0xff0000, symbol: '⏹'}
    ];
    
    mediaButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawRoundedRect(btn.x - 2, btn.y - 2, 4, 4, 1);
        graphics.endFill();
    });
    
    // Game/app selection menu
    graphics.beginFill(0x002200);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-36, -35, 72, 16, 3);
    graphics.endFill();
    
    // Menu items
    const menuItems = [
        {x: -32, y: -32, color: 0x00ff66, type: 'game'},
        {x: -20, y: -32, color: 0x66ff00, type: 'game'},
        {x: -8, y: -32, color: 0xff6600, type: 'media'},
        {x: 4, y: -32, color: 0x0066ff, type: 'comm'},
        {x: 16, y: -32, color: 0xff00ff, type: 'news'},
        {x: 28, y: -32, color: 0x00ffff, type: 'edu'}
    ];
    
    menuItems.forEach(item => {
        graphics.beginFill(item.color);
        graphics.drawRoundedRect(item.x - 2, item.y - 2, 4, 4, 1);
        graphics.endFill();
    });
    
    // Status bar
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-36, -22, 72, 4, 2);
    graphics.endFill();
    
    // Status indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-32, -20, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-28, -20, 1);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(-24, -20, 1);
    graphics.endFill();
    
    // Time/date display
    graphics.beginFill(0x00ff88);
    graphics.drawRect(25, -21, 1, 2);
    graphics.drawRect(27, -21, 1, 2);
    graphics.drawRect(29, -21, 1, 2);
    graphics.drawRect(31, -21, 1, 2);
    graphics.drawRect(33, -21, 1, 2);
    graphics.endFill();
    
    // Monitor stand/arm
    graphics.beginFill(0x444444);
    graphics.lineStyle(2, 0x666666);
    graphics.drawRoundedRect(-8, -12, 16, 8, 4);
    graphics.endFill();
    
    // Adjustment mechanism
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawCircle(0, -8, 3);
    graphics.endFill();
    
    // Keyboard/input panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-45, 5, 60, 25, 4);
    graphics.endFill();
    
    // Key layout simulation
    const keyRows = [
        {y: 8, keys: 12, width: 50},
        {y: 12, keys: 11, width: 48},
        {y: 16, keys: 10, width: 46},
        {y: 20, keys: 8, width: 40}
    ];
    
    keyRows.forEach(row => {
        graphics.beginFill(0x404040);
        graphics.lineStyle(1, 0x555555);
        for (let i = 0; i < row.keys; i++) {
            const keyX = -row.width/2 + (i * row.width/row.keys) + 2;
            graphics.drawRoundedRect(keyX, row.y, 3, 3, 0.5);
        }
        graphics.endFill();
    });
    
    // Special function keys
    graphics.beginFill(0x0066cc);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-43, 24, 6, 4, 1);
    graphics.drawRoundedRect(-35, 24, 6, 4, 1);
    graphics.drawRoundedRect(-27, 24, 6, 4, 1);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawRoundedRect(-19, 24, 6, 4, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawRoundedRect(-11, 24, 6, 4, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawRoundedRect(-3, 24, 6, 4, 1);
    graphics.endFill();
    
    // Trackpad/mouse area
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(8, 8, 20, 15, 3);
    graphics.endFill();
    
    // Trackpad surface
    graphics.beginFill(0x2a2a2a);
    graphics.drawRoundedRect(10, 10, 16, 11, 2);
    graphics.endFill();
    
    // Mouse buttons
    graphics.beginFill(0x404040);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(10, 23, 7, 4, 1);
    graphics.drawRoundedRect(19, 23, 7, 4, 1);
    graphics.endFill();
    
    // Audio/speaker grilles
    graphics.lineStyle(1, 0x555555);
    for (let i = 0; i < 6; i++) {
        graphics.moveTo(-45 + i * 3, -8);
        graphics.lineTo(-45 + i * 3, -4);
    }
    for (let i = 0; i < 6; i++) {
        graphics.moveTo(27 + i * 3, -8);
        graphics.lineTo(27 + i * 3, -4);
    }
    
    // Volume controls
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawCircle(-40, 0, 2);
    graphics.drawCircle(40, 0, 2);
    graphics.endFill();
    
    // Volume indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-40, 0, 1);
    graphics.drawCircle(40, 0, 1);
    graphics.endFill();
    
    // Data ports
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-50, 15, 3, 2, 1);
    graphics.drawRoundedRect(-50, 18, 3, 2, 1);
    graphics.drawRoundedRect(-50, 21, 3, 2, 1);
    graphics.endFill();
    
    // Power indicator
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-40, 32, 2);
    graphics.endFill();
    
    // Privacy shield (deployable)
    graphics.beginFill(0x404040);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(42, -55, 6, 45, 3);
    graphics.endFill();
    
    // Shield in retracted position
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(44, -53, 2, 15, 1);
    graphics.endFill();
    
    // Mounting brackets
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-52, -30, 4, 8, 2);
    graphics.drawRoundedRect(-52, 10, 4, 8, 2);
    graphics.drawRoundedRect(48, -30, 4, 8, 2);
    graphics.drawRoundedRect(48, 10, 4, 8, 2);
    graphics.endFill();
    
    // Add graphics to container
    terminalContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    terminalContainer.addChild(animatedElements);
    
    // Animation for screen activity and interface
    let animationTime = 0;
    
    const animateTerminal = () => {
        animationTime += 0.07;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate screen scan lines
        const scanLine1 = (animationTime * 30) % 76;
        const scanLine2 = (animationTime * 20 + 20) % 76;
        animatedElements.lineStyle(1, 0x004488, 0.3);
        animatedElements.moveTo(-38 + scanLine1, -48);
        animatedElements.lineTo(-38 + scanLine1, -17);
        animatedElements.lineStyle(1, 0x004488, 0.2);
        animatedElements.moveTo(-38 + scanLine2, -48);
        animatedElements.lineTo(-38 + scanLine2, -17);
        
        // Animate media player progress
        const progressWidth = 15 + Math.sin(animationTime * 0.3) * 10;
        animatedElements.beginFill(0x00ff88);
        animatedElements.drawRoundedRect(-6, -44, progressWidth, 2, 1);
        animatedElements.endFill();
        
        // Animate active menu item
        const activeItem = Math.floor(animationTime * 0.5) % 6;
        const activeX = -32 + activeItem * 12;
        animatedElements.beginFill(0xffffff, 0.4);
        animatedElements.drawRoundedRect(activeX - 3, -33, 6, 6, 2);
        animatedElements.endFill();
        
        // Animate status indicators
        const statusPulse = 0.5 + Math.sin(animationTime * 3) * 0.3;
        animatedElements.beginFill(0x00ff00, statusPulse);
        animatedElements.drawCircle(-32, -20, 1);
        animatedElements.endFill();
        
        // Animate time display
        const timeFlicker = Math.sin(animationTime * 4) > 0.5 ? 0.9 : 0.7;
        animatedElements.beginFill(0x00ff88, timeFlicker);
        animatedElements.drawRect(25, -21, 1, 2);
        animatedElements.drawRect(27, -21, 1, 2);
        animatedElements.drawRect(29, -21, 1, 2);
        animatedElements.drawRect(31, -21, 1, 2);
        animatedElements.drawRect(33, -21, 1, 2);
        animatedElements.endFill();
        
        // Animate entertainment content
        const contentPulse = 0.3 + Math.sin(animationTime * 1.5) * 0.2;
        animatedElements.beginFill(0x0066cc, contentPulse);
        animatedElements.drawRoundedRect(-34, -44, 21, 16, 1);
        animatedElements.endFill();
        
        requestAnimationFrame(animateTerminal);
    };
    
    // Start animation
    animateTerminal();
    
    // Provide external animate method
    terminalContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 55,
  y: y - 60,
  width: 110,
  height: 100,
  label: "recTerminal"
};
if(colliders) addWithCollider(camera, terminalContainer, bounds, colliders);
    return terminalContainer;
}

function createDiningTable(x, y, camera, colliders) {
    // Create main table container
    const tableContainer = new Container();
    tableContainer.x = x;
    tableContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main table base/pedestal
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-15, -10, 30, 60, 8);
    graphics.endFill();
    
    // Base inner detail
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-12, -5, 24, 50, 6);
    graphics.endFill();
    
    // Table surface (hexagonal futuristic shape)
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.moveTo(-60, -20);
    graphics.lineTo(-30, -35);
    graphics.lineTo(30, -35);
    graphics.lineTo(60, -20);
    graphics.lineTo(60, 20);
    graphics.lineTo(30, 35);
    graphics.lineTo(-30, 35);
    graphics.lineTo(-60, 20);
    graphics.lineTo(-60, -20);
    graphics.endFill();
    
    // Table surface inner panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x444444);
    graphics.moveTo(-55, -15);
    graphics.lineTo(-27, -28);
    graphics.lineTo(27, -28);
    graphics.lineTo(55, -15);
    graphics.lineTo(55, 15);
    graphics.lineTo(27, 28);
    graphics.lineTo(-27, 28);
    graphics.lineTo(-55, 15);
    graphics.lineTo(-55, -15);
    graphics.endFill();
    
    // Central holographic display area
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x004488);
    graphics.drawCircle(0, 0, 25);
    graphics.endFill();
    
    // Holographic projector ring
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawCircle(0, 0, 20);
    graphics.endFill();
    
    // Interface panels around edge
    const panelPositions = [
        [-40, -10], [40, -10], [0, -25], [0, 25], [-40, 10], [40, 10]
    ];
    
    panelPositions.forEach(pos => {
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(1, 0x555555);
        graphics.drawRoundedRect(pos[0] - 8, pos[1] - 3, 16, 6, 2);
        graphics.endFill();
        
        // Panel indicators
        graphics.beginFill(0x00ff00);
        graphics.drawCircle(pos[0] - 5, pos[1], 1);
        graphics.endFill();
        
        graphics.beginFill(0xff6600);
        graphics.drawCircle(pos[0] + 5, pos[1], 1);
        graphics.endFill();
    });
    
    // Power conduits in base
    graphics.beginFill(0x004488);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-8, 5, 16, 3, 1);
    graphics.drawRoundedRect(-8, 15, 16, 3, 1);
    graphics.drawRoundedRect(-8, 25, 16, 3, 1);
    graphics.endFill();
    
    // Base stabilizers
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-20, 45, 10, 8, 3);
    graphics.drawRoundedRect(10, 45, 10, 8, 3);
    graphics.endFill();
    
    // Add graphics to container
    tableContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    tableContainer.addChild(animatedElements);
    
    // Animation for holographic display
    let animationTime = 0;
    
    const animateTable = () => {
        animationTime += 0.03;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate holographic ring
        const holoAlpha = 0.3 + Math.sin(animationTime * 2) * 0.2;
        animatedElements.beginFill(0x00ffff, holoAlpha);
        animatedElements.drawCircle(0, 0, 18);
        animatedElements.endFill();
        
        // Animate power conduits
        const powerAlpha = 0.5 + Math.sin(animationTime * 3) * 0.3;
        animatedElements.beginFill(0x0088cc, powerAlpha);
        animatedElements.drawRoundedRect(-8, 5, 16, 3, 1);
        animatedElements.drawRoundedRect(-8, 15, 16, 3, 1);
        animatedElements.drawRoundedRect(-8, 25, 16, 3, 1);
        animatedElements.endFill();
        
        requestAnimationFrame(animateTable);
    };
    
    // Start animation
    animateTable();
    
    // Provide external animate method
    tableContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 65,
  y: y - 40,
  width: 130,
  height: 100,
  label: "diningTable"
};
if(colliders) addWithCollider(camera, tableContainer, bounds, colliders);
    
    return tableContainer;
}

function createFoodReplicator(x, y, camera, colliders) {
    // Create main replicator container
    const replicatorContainer = new Container();
    replicatorContainer.x = x;
    replicatorContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main replicator housing
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-50, -60, 100, 120, 12);
    graphics.endFill();
    
    // Inner housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-45, -55, 90, 110, 10);
    graphics.endFill();
    
    // Replication chamber (upper section)
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x004488);
    graphics.drawRoundedRect(-40, -50, 80, 40, 8);
    graphics.endFill();
    
    // Chamber viewing window
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-35, -45, 70, 30, 6);
    graphics.endFill();
    
    // Energy matrix grid inside chamber
    graphics.lineStyle(1, 0x0088cc, 0.6);
    for (let i = 1; i < 8; i++) {
        graphics.moveTo(-35 + i * 10, -45);
        graphics.lineTo(-35 + i * 10, -15);
    }
    for (let i = 1; i < 4; i++) {
        graphics.moveTo(-35, -45 + i * 10);
        graphics.lineTo(35, -45 + i * 10);
    }
    
    // Control interface panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-40, -5, 80, 25, 8);
    graphics.endFill();
    
    // Main display screen
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-35, -2, 35, 19, 4);
    graphics.endFill();
    
    // Display readout
    graphics.beginFill(0x00ff88);
    graphics.drawRect(-33, 3, 2, 3);
    graphics.drawRect(-29, 3, 2, 3);
    graphics.drawRect(-25, 3, 2, 3);
    graphics.drawRect(-21, 3, 2, 3);
    graphics.drawRect(-17, 3, 2, 3);
    graphics.drawRect(-13, 3, 2, 3);
    graphics.drawRect(-9, 3, 2, 3);
    graphics.drawRect(-5, 3, 2, 3);
    graphics.endFill();
    
    // Control buttons
    const buttonPositions = [
        [5, -1], [15, -1], [25, -1],
        [5, 7], [15, 7], [25, 7],
        [5, 15], [15, 15], [25, 15]
    ];
    
    buttonPositions.forEach((pos, index) => {
        graphics.beginFill(0x333333);
        graphics.lineStyle(1, 0x666666);
        graphics.drawRoundedRect(pos[0], pos[1], 8, 5, 2);
        graphics.endFill();
        
        // Button indicators
        const colors = [0x00ff00, 0xff6600, 0x0066cc];
        graphics.beginFill(colors[index % 3]);
        graphics.drawCircle(pos[0] + 4, pos[1] + 2.5, 1);
        graphics.endFill();
    });
    
    // Output tray
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-35, 25, 70, 15, 6);
    graphics.endFill();
    
    // Tray inner surface
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-32, 27, 64, 11, 4);
    graphics.endFill();
    
    // Material feed lines
    graphics.beginFill(0x004488);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-43, -30, 3, 50, 1);
    graphics.drawRoundedRect(40, -30, 3, 50, 1);
    graphics.endFill();
    
    // Energy couplings
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawCircle(-41, -35, 4);
    graphics.drawCircle(-41, -10, 4);
    graphics.drawCircle(-41, 15, 4);
    graphics.drawCircle(41, -35, 4);
    graphics.drawCircle(41, -10, 4);
    graphics.drawCircle(41, 15, 4);
    graphics.endFill();
    
    // Coupling inner details
    graphics.beginFill(0x004488);
    graphics.drawCircle(-41, -35, 2);
    graphics.drawCircle(-41, -10, 2);
    graphics.drawCircle(-41, 15, 2);
    graphics.drawCircle(41, -35, 2);
    graphics.drawCircle(41, -10, 2);
    graphics.drawCircle(41, 15, 2);
    graphics.endFill();
    
    // Base stabilizers
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-45, 55, 15, 8, 3);
    graphics.drawRoundedRect(30, 55, 15, 8, 3);
    graphics.endFill();
    
    // Emergency shutdown
    graphics.beginFill(0xff0000);
    graphics.lineStyle(1, 0x333333);
    graphics.drawCircle(35, 5, 4);
    graphics.endFill();
    
    graphics.beginFill(0xffffff);
    graphics.drawCircle(35, 5, 2);
    graphics.endFill();
    
    // Add graphics to container
    replicatorContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    replicatorContainer.addChild(animatedElements);
    
    // Animation for replication process
    let animationTime = 0;
    
    const animateReplicator = () => {
        animationTime += 0.04;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate energy matrix
        const matrixAlpha = 0.2 + Math.sin(animationTime * 4) * 0.15;
        animatedElements.beginFill(0x00ffff, matrixAlpha);
        animatedElements.drawRoundedRect(-35, -45, 70, 30, 6);
        animatedElements.endFill();
        
        // Animate material feed lines
        const feedAlpha = 0.4 + Math.sin(animationTime * 3) * 0.3;
        animatedElements.beginFill(0x0088cc, feedAlpha);
        animatedElements.drawRoundedRect(-43, -30, 3, 50, 1);
        animatedElements.drawRoundedRect(40, -30, 3, 50, 1);
        animatedElements.endFill();
        
        // Animate display flicker
        const displayFlicker = Math.sin(animationTime * 10) > 0.7 ? 0.9 : 0.7;
        animatedElements.beginFill(0x00ff88, displayFlicker);
        animatedElements.drawRect(-33, 3, 2, 3);
        animatedElements.drawRect(-29, 3, 2, 3);
        animatedElements.drawRect(-25, 3, 2, 3);
        animatedElements.drawRect(-21, 3, 2, 3);
        animatedElements.drawRect(-17, 3, 2, 3);
        animatedElements.drawRect(-13, 3, 2, 3);
        animatedElements.drawRect(-9, 3, 2, 3);
        animatedElements.drawRect(-5, 3, 2, 3);
        animatedElements.endFill();
        
        requestAnimationFrame(animateReplicator);
    };
    
    // Start animation
    animateReplicator();
    
    // Provide external animate method
    replicatorContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 55,
  y: y - 65,
  width: 110,
  height: 135,
  label: "foodReplicator"
};
if(colliders) addWithCollider(camera, replicatorContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "foodReplicator",
    bounds,
    message: "The Food Replicator's interface glows invitingly, displaying a vast menu of culinary delights, all just a few commands away.",
    bubble: null,
});
    
    return replicatorContainer;
}

function createBeverageDispenser(x, y, camera, colliders) {
    // Create main dispenser container
    const dispenserContainer = new Container();
    dispenserContainer.x = x;
    dispenserContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main dispenser housing
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-30, -70, 60, 140, 10);
    graphics.endFill();
    
    // Inner housing
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-25, -65, 50, 130, 8);
    graphics.endFill();
    
    // Upper fluid reservoir section
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x004488);
    graphics.drawRoundedRect(-20, -60, 40, 45, 6);
    graphics.endFill();
    
    // Reservoir viewing windows
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-17, -55, 12, 35, 4);
    graphics.drawRoundedRect(5, -55, 12, 35, 4);
    graphics.endFill();
    
    // Fluid level indicators
    graphics.beginFill(0x0088cc, 0.7);
    graphics.drawRoundedRect(-15, -45, 8, 15, 2); // First reservoir
    graphics.drawRoundedRect(7, -50, 8, 25, 2);  // Second reservoir
    graphics.endFill();
    
    // Reservoir separation divider
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-2, -57, 4, 39, 2);
    graphics.endFill();
    
    // Selection interface panel
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-20, -10, 40, 30, 6);
    graphics.endFill();
    
    // Selection buttons (3x2 grid)
    const selectionButtons = [
        [-12, -5], [0, -5], [12, -5],
        [-12, 8], [0, 8], [12, 8]
    ];
    
    const buttonLabels = [
        0x00ff00, 0xff6600, 0x0066cc,  // Top row: green, orange, blue
        0xff0066, 0xffff00, 0x00ffff   // Bottom row: pink, yellow, cyan
    ];
    
    selectionButtons.forEach((pos, index) => {
        graphics.beginFill(0x333333);
        graphics.lineStyle(1, 0x666666);
        graphics.drawRoundedRect(pos[0] - 4, pos[1] - 3, 8, 6, 2);
        graphics.endFill();
        
        // Button indicator light
        graphics.beginFill(buttonLabels[index]);
        graphics.drawCircle(pos[0], pos[1], 1.5);
        graphics.endFill();
    });
    
    // Dispensing mechanism
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-15, 25, 30, 20, 6);
    graphics.endFill();
    
    // Dispenser nozzle
    graphics.beginFill(0x444444);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-3, 45, 6, 8, 3);
    graphics.endFill();
    
    // Nozzle opening
    graphics.beginFill(0x0d0d0d);
    graphics.drawRoundedRect(-2, 50, 4, 3, 1);
    graphics.endFill();
    
    // Cup platform
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-12, 55, 24, 8, 4);
    graphics.endFill();
    
    // Platform surface
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x333333);
    graphics.drawRoundedRect(-10, 57, 20, 4, 2);
    graphics.endFill();
    
    // Side fluid conduits
    graphics.beginFill(0x004488);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-27, -50, 3, 80, 1);
    graphics.drawRoundedRect(24, -50, 3, 80, 1);
    graphics.endFill();
    
    // Conduit connection points
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawCircle(-25, -45, 3);
    graphics.drawCircle(-25, -25, 3);
    graphics.drawCircle(-25, -5, 3);
    graphics.drawCircle(-25, 15, 3);
    graphics.drawCircle(25, -45, 3);
    graphics.drawCircle(25, -25, 3);
    graphics.drawCircle(25, -5, 3);
    graphics.drawCircle(25, 15, 3);
    graphics.endFill();
    
    // Connection inner details
    graphics.beginFill(0x004488);
    graphics.drawCircle(-25, -45, 1.5);
    graphics.drawCircle(-25, -25, 1.5);
    graphics.drawCircle(-25, -5, 1.5);
    graphics.drawCircle(-25, 15, 1.5);
    graphics.drawCircle(25, -45, 1.5);
    graphics.drawCircle(25, -25, 1.5);
    graphics.drawCircle(25, -5, 1.5);
    graphics.drawCircle(25, 15, 1.5);
    graphics.endFill();
    
    // Temperature control indicator
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-18, 30, 12, 6, 2);
    graphics.endFill();
    
    // Temperature display
    graphics.beginFill(0x00ff88);
    graphics.drawRect(-16, 32, 1, 2);
    graphics.drawRect(-14, 32, 1, 2);
    graphics.drawRect(-12, 32, 1, 2);
    graphics.drawRect(-10, 32, 1, 2);
    graphics.drawRect(-8, 32, 1, 2);
    graphics.endFill();
    
    // Heating/cooling indicators
    graphics.beginFill(0xff6600);
    graphics.drawCircle(10, 32, 2);
    graphics.endFill();
    
    graphics.beginFill(0x00ffff);
    graphics.drawCircle(10, 37, 2);
    graphics.endFill();
    
    // Status indicator
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(0, 35, 2);
    graphics.endFill();
    
    // Base stabilizers
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-27, 65, 12, 8, 3);
    graphics.drawRoundedRect(15, 65, 12, 8, 3);
    graphics.endFill();
    
    // Add graphics to container
    dispenserContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    dispenserContainer.addChild(animatedElements);
    
    // Animation for fluid flow and indicators
    let animationTime = 0;
    
    const animateDispenser = () => {
        animationTime += 0.05;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate fluid levels with subtle movement
        const fluidWave = Math.sin(animationTime * 2) * 2;
        animatedElements.beginFill(0x00aaff, 0.8);
        animatedElements.drawRoundedRect(-15, -45 + fluidWave, 8, 15, 2);
        animatedElements.endFill();
        
        animatedElements.beginFill(0xff6600, 0.8);
        animatedElements.drawRoundedRect(7, -50 + fluidWave * 0.5, 8, 25, 2);
        animatedElements.endFill();
        
        // Animate fluid conduits
        const conduitAlpha = 0.4 + Math.sin(animationTime * 3) * 0.2;
        animatedElements.beginFill(0x0088cc, conduitAlpha);
        animatedElements.drawRoundedRect(-27, -50, 3, 80, 1);
        animatedElements.drawRoundedRect(24, -50, 3, 80, 1);
        animatedElements.endFill();
        
        // Animate temperature display
        const tempFlicker = Math.sin(animationTime * 8) > 0.8 ? 0.9 : 0.7;
        animatedElements.beginFill(0x00ff88, tempFlicker);
        animatedElements.drawRect(-16, 32, 1, 2);
        animatedElements.drawRect(-14, 32, 1, 2);
        animatedElements.drawRect(-12, 32, 1, 2);
        animatedElements.drawRect(-10, 32, 1, 2);
        animatedElements.drawRect(-8, 32, 1, 2);
        animatedElements.endFill();
        
        // Animate status indicator pulse
        const statusPulse = 0.5 + Math.sin(animationTime * 1.5) * 0.3;
        animatedElements.beginFill(0x00ff00, statusPulse);
        animatedElements.drawCircle(0, 35, 2);
        animatedElements.endFill();
        
        requestAnimationFrame(animateDispenser);
    };
    
    // Start animation
    animateDispenser();
    
    // Provide external animate method
    dispenserContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 35,
  y: y - 75,
  width: 70,
  height: 155,
  label: "beverageDispenser"
};
if(colliders) addWithCollider(camera, dispenserContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "beverageDispenser",
    bounds,
    message: "A faint gurgle can sometimes be heard from within the Beverage Dispenser, indicating its internal reservoirs are full and primed",
    bubble: null,
});
    return dispenserContainer;
}

function createExerciseEquipment(x, y, camera, colliders) {
    // Create main equipment container
    const equipmentContainer = new Container();
    equipmentContainer.x = x;
    equipmentContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main support base
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-25, 40, 50, 20, 8);
    graphics.endFill();
    
    // Base inner detail
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-22, 42, 44, 16, 6);
    graphics.endFill();
    
    // Main support column
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-8, -40, 16, 80, 4);
    graphics.endFill();
    
    // Support column inner detail
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-6, -38, 12, 76, 3);
    graphics.endFill();
    
    // Main exercise platform/display
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-40, -50, 80, 25, 6);
    graphics.endFill();
    
    // Platform inner panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-37, -47, 74, 19, 4);
    graphics.endFill();
    
    // Central display screen
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x004488);
    graphics.drawRoundedRect(-30, -45, 60, 15, 3);
    graphics.endFill();
    
    // Screen inner glow
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-28, -43, 56, 11, 2);
    graphics.endFill();
    
    // Exercise arm/resistance mechanism
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-45, -35, 15, 8, 3);
    graphics.drawRoundedRect(30, -35, 15, 8, 3);
    graphics.endFill();
    
    // Resistance coils
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawCircle(-37, -31, 6);
    graphics.drawCircle(37, -31, 6);
    graphics.endFill();
    
    // Control interface panels
    const controlPositions = [
        [-20, -40], [20, -40], [-15, -35], [15, -35]
    ];
    
    controlPositions.forEach(pos => {
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(1, 0x555555);
        graphics.drawRoundedRect(pos[0] - 4, pos[1] - 2, 8, 4, 1);
        graphics.endFill();
        
        // Control indicators
        graphics.beginFill(0x00ff00);
        graphics.drawCircle(pos[0] - 2, pos[1], 0.5);
        graphics.endFill();
        
        graphics.beginFill(0xff6600);
        graphics.drawCircle(pos[0] + 2, pos[1], 0.5);
        graphics.endFill();
    });
    
    // Power conduits in column
    graphics.beginFill(0x004488);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-6, -20, 12, 2, 1);
    graphics.drawRoundedRect(-6, -10, 12, 2, 1);
    graphics.drawRoundedRect(-6, 0, 12, 2, 1);
    graphics.drawRoundedRect(-6, 10, 12, 2, 1);
    graphics.endFill();
    
    // Base stabilizers
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-35, 55, 12, 6, 2);
    graphics.drawRoundedRect(23, 55, 12, 6, 2);
    graphics.endFill();
    
    // Add graphics to container
    equipmentContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    equipmentContainer.addChild(animatedElements);
    
    // Animation for display and power
    let animationTime = 0;
    
    const animateEquipment = () => {
        animationTime += 0.02;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate display screen
        const screenAlpha = 0.4 + Math.sin(animationTime * 1.5) * 0.2;
        animatedElements.beginFill(0x00ccff, screenAlpha);
        animatedElements.drawRoundedRect(-28, -43, 56, 11, 2);
        animatedElements.endFill();
        
        // Animate power conduits
        const powerAlpha = 0.6 + Math.sin(animationTime * 2.5) * 0.3;
        animatedElements.beginFill(0x0088cc, powerAlpha);
        animatedElements.drawRoundedRect(-6, -20, 12, 2, 1);
        animatedElements.drawRoundedRect(-6, -10, 12, 2, 1);
        animatedElements.drawRoundedRect(-6, 0, 12, 2, 1);
        animatedElements.drawRoundedRect(-6, 10, 12, 2, 1);
        animatedElements.endFill();
        
        requestAnimationFrame(animateEquipment);
    };
    
    // Start animation
    animateEquipment();
    
    // Provide external animate method
    equipmentContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 50,
  y: y - 55,
  width: 100,
  height: 120,
  label: "exerciseEquipment"
};
if(colliders) addWithCollider(camera, equipmentContainer, bounds, colliders);
    
    return equipmentContainer;
}

function createGameTable(x, y, camera, colliders) {
    // Create main table container
    const tableContainer = new Container();
    tableContainer.x = x;
    tableContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main table base/pedestal
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-18, -15, 36, 70, 8);
    graphics.endFill();
    
    // Base inner detail
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-15, -10, 30, 60, 6);
    graphics.endFill();
    
    // Table surface (rounded rectangle for gaming)
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-70, -40, 140, 80, 12);
    graphics.endFill();
    
    // Table surface inner panel
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-65, -35, 130, 70, 8);
    graphics.endFill();
    
    // Central gaming display area
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x004488);
    graphics.drawRoundedRect(-50, -25, 100, 50, 6);
    graphics.endFill();
    
    // Gaming display inner screen
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-47, -22, 94, 44, 4);
    graphics.endFill();
    
    // Player control zones (4 corners)
    const playerZones = [
        [-55, -30], [55, -30], [-55, 30], [55, 30]
    ];
    
    playerZones.forEach((pos, index) => {
        // Control panel
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(1, 0x555555);
        graphics.drawRoundedRect(pos[0] - 12, pos[1] - 8, 24, 16, 4);
        graphics.endFill();
        
        // Inner control surface
        graphics.beginFill(0x1a1a1a);
        graphics.lineStyle(1, 0x444444);
        graphics.drawRoundedRect(pos[0] - 10, pos[1] - 6, 20, 12, 3);
        graphics.endFill();
        
        // Player indicators
        const colors = [0x00ff00, 0xff0000, 0x0099ff, 0xffff00];
        graphics.beginFill(colors[index]);
        graphics.drawCircle(pos[0], pos[1], 2);
        graphics.endFill();
        
        // Control buttons
        graphics.beginFill(0x333333);
        graphics.drawCircle(pos[0] - 6, pos[1], 1.5);
        graphics.drawCircle(pos[0] + 6, pos[1], 1.5);
        graphics.endFill();
    });
    
    // Side interface panels
    const sidePositions = [
        [-60, 0], [60, 0], [0, -32], [0, 32]
    ];
    
    sidePositions.forEach(pos => {
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(1, 0x555555);
        graphics.drawRoundedRect(pos[0] - 6, pos[1] - 2, 12, 4, 2);
        graphics.endFill();
        
        // Status indicators
        graphics.beginFill(0x00ff00);
        graphics.drawCircle(pos[0] - 3, pos[1], 0.8);
        graphics.endFill();
        
        graphics.beginFill(0xff6600);
        graphics.drawCircle(pos[0] + 3, pos[1], 0.8);
        graphics.endFill();
    });
    
    // Power conduits in base
    graphics.beginFill(0x004488);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-12, 0, 24, 3, 1);
    graphics.drawRoundedRect(-12, 10, 24, 3, 1);
    graphics.drawRoundedRect(-12, 20, 24, 3, 1);
    graphics.drawRoundedRect(-12, 30, 24, 3, 1);
    graphics.endFill();
    
    // Base stabilizers
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-25, 50, 12, 8, 3);
    graphics.drawRoundedRect(13, 50, 12, 8, 3);
    graphics.endFill();
    
    // Add graphics to container
    tableContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    tableContainer.addChild(animatedElements);
    
    // Animation for gaming display and effects
    let animationTime = 0;
    
    const animateTable = () => {
        animationTime += 0.025;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate main gaming display
        const displayAlpha = 0.3 + Math.sin(animationTime * 1.8) * 0.15;
        animatedElements.beginFill(0x00ffcc, displayAlpha);
        animatedElements.drawRoundedRect(-47, -22, 94, 44, 4);
        animatedElements.endFill();
        
        // Animate power conduits
        const powerAlpha = 0.5 + Math.sin(animationTime * 2.2) * 0.25;
        animatedElements.beginFill(0x0088cc, powerAlpha);
        animatedElements.drawRoundedRect(-12, 0, 24, 3, 1);
        animatedElements.drawRoundedRect(-12, 10, 24, 3, 1);
        animatedElements.drawRoundedRect(-12, 20, 24, 3, 1);
        animatedElements.drawRoundedRect(-12, 30, 24, 3, 1);
        animatedElements.endFill();
        
        // Animate player zone highlights (subtle pulse)
        const playerZones = [
            [-55, -30], [55, -30], [-55, 30], [55, 30]
        ];
        const zoneAlpha = 0.1 + Math.sin(animationTime * 1.5) * 0.08;
        
        playerZones.forEach(pos => {
            animatedElements.beginFill(0x004488, zoneAlpha);
            animatedElements.drawRoundedRect(pos[0] - 10, pos[1] - 6, 20, 12, 3);
            animatedElements.endFill();
        });
        
        requestAnimationFrame(animateTable);
    };
    
    // Start animation
    animateTable();
    
    // Provide external animate method
    tableContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 75,
  y: y - 50,
  width: 150,
  height: 110,
  label: "gameTable"
};
if(colliders) addWithCollider(camera, tableContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "gameTable",
    bounds,
    message: "A faint hum emanates from the Game Table, hinting at the integrated holographic projector waiting to display intricate game worlds",
    bubble: null,
});
    
    return tableContainer;
}

function createEntertainmentConsole(x, y, camera, colliders) {
    // Create main console container
    const consoleContainer = new Container();
    consoleContainer.x = x;
    consoleContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main console base
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(3, 0x444444);
    graphics.drawRoundedRect(-80, 20, 160, 40, 8);
    graphics.endFill();
    
    // Base inner detail
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-77, 23, 154, 34, 6);
    graphics.endFill();
    
    // Main display screen (large central screen)
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x004488);
    graphics.drawRoundedRect(-70, -45, 140, 60, 8);
    graphics.endFill();
    
    // Screen inner display
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-67, -42, 134, 54, 6);
    graphics.endFill();
    
    // Screen bezel details
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-70, -45, 140, 8, 4);
    graphics.drawRoundedRect(-70, 7, 140, 8, 4);
    graphics.endFill();
    
    // Side speaker grilles
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-75, -35, 8, 40, 3);
    graphics.drawRoundedRect(67, -35, 8, 40, 3);
    graphics.endFill();
    
    // Speaker grille lines
    for (let i = -30; i <= 0; i += 5) {
        graphics.beginFill(0x1a1a1a);
        graphics.drawRoundedRect(-73, i, 4, 2, 1);
        graphics.drawRoundedRect(69, i, 4, 2, 1);
        graphics.endFill();
    }
    
    // Central control panel
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-50, 25, 100, 25, 6);
    graphics.endFill();
    
    // Control panel inner surface
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-47, 28, 94, 19, 4);
    graphics.endFill();
    
    // Control interface elements
    const controlPositions = [
        [-35, 37], [-15, 37], [5, 37], [25, 37],
        [-25, 32], [0, 32], [25, 32]
    ];
    
    controlPositions.forEach((pos, index) => {
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(1, 0x555555);
        graphics.drawRoundedRect(pos[0] - 4, pos[1] - 2, 8, 4, 2);
        graphics.endFill();
        
        // Control indicators
        const colors = [0x00ff00, 0xff0000, 0x0099ff, 0xffff00, 0xff6600, 0x9900ff, 0x00ffff];
        graphics.beginFill(colors[index % colors.length]);
        graphics.drawCircle(pos[0], pos[1], 1);
        graphics.endFill();
    });
    
    // Volume/equalizer bars
    const eqPositions = [-40, -25, -10, 5, 20, 35];
    eqPositions.forEach((xPos, index) => {
        const height = 8 + (index % 3) * 4;
        graphics.beginFill(0x004488);
        graphics.lineStyle(1, 0x0066cc);
        graphics.drawRoundedRect(xPos, 45 - height, 6, height, 1);
        graphics.endFill();
    });
    
    // Side status panels
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x555555);
    graphics.drawRoundedRect(-90, -10, 15, 20, 3);
    graphics.drawRoundedRect(75, -10, 15, 20, 3);
    graphics.endFill();
    
    // Status indicators
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-82, -5, 1.5);
    graphics.drawCircle(83, -5, 1.5);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-82, 5, 1.5);
    graphics.drawCircle(83, 5, 1.5);
    graphics.endFill();
    
    // Power conduits in base
    graphics.beginFill(0x004488);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-60, 30, 120, 3, 1);
    graphics.drawRoundedRect(-60, 40, 120, 3, 1);
    graphics.endFill();
    
    // Base support legs
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-85, 55, 15, 8, 3);
    graphics.drawRoundedRect(-25, 55, 15, 8, 3);
    graphics.drawRoundedRect(10, 55, 15, 8, 3);
    graphics.drawRoundedRect(70, 55, 15, 8, 3);
    graphics.endFill();
    
    // Add graphics to container
    consoleContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    consoleContainer.addChild(animatedElements);
    
    // Animation for display and effects
    let animationTime = 0;
    
    const animateConsole = () => {
        animationTime += 0.03;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate main display screen
        const screenAlpha = 0.4 + Math.sin(animationTime * 1.2) * 0.2;
        animatedElements.beginFill(0x00aaff, screenAlpha);
        animatedElements.drawRoundedRect(-67, -42, 134, 54, 6);
        animatedElements.endFill();
        
        // Animate power conduits
        const powerAlpha = 0.6 + Math.sin(animationTime * 2.8) * 0.3;
        animatedElements.beginFill(0x0088cc, powerAlpha);
        animatedElements.drawRoundedRect(-60, 30, 120, 3, 1);
        animatedElements.drawRoundedRect(-60, 40, 120, 3, 1);
        animatedElements.endFill();
        
        // Animate equalizer bars
        const eqPositions = [-40, -25, -10, 5, 20, 35];
        eqPositions.forEach((xPos, index) => {
            const baseHeight = 8 + (index % 3) * 4;
            const animatedHeight = baseHeight + Math.sin(animationTime * 3 + index) * 6;
            const eqAlpha = 0.5 + Math.sin(animationTime * 2 + index * 0.5) * 0.3;
            
            animatedElements.beginFill(0x0099ff, eqAlpha);
            animatedElements.drawRoundedRect(xPos, 45 - animatedHeight, 6, animatedHeight, 1);
            animatedElements.endFill();
        });
        
        // Animate speaker grilles (subtle pulse)
        const speakerAlpha = 0.2 + Math.sin(animationTime * 1.5) * 0.1;
        animatedElements.beginFill(0x004488, speakerAlpha);
        animatedElements.drawRoundedRect(-75, -35, 8, 40, 3);
        animatedElements.drawRoundedRect(67, -35, 8, 40, 3);
        animatedElements.endFill();
        
        requestAnimationFrame(animateConsole);
    };
    
    // Start animation
    animateConsole();
    
    // Provide external animate method
    consoleContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    const bounds = {
  x: x - 95,
  y: y - 55,
  width: 190,
  height: 120,
  label: "entertainmentConsole"
};
if(colliders) addWithCollider(camera, consoleContainer, bounds, colliders);

if(!window.interactables) window.interactables = [];
window.interactables.push({
    label: "entertainmentConsole",
    bounds,
    message: "The worn surface of the Entertainment Console's control panel suggests many hours of recreational use by the crew",
    bubble: null,
});
    
    return consoleContainer;
}

function createSpaceship(x, y) {
    // Create main spaceship container
    const spaceshipContainer = new Container();
    spaceshipContainer.x = x;
    spaceshipContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main hull - elongated vertical design
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-60, -200, 120, 400, 15);
    graphics.endFill();
    
    // Primary hull structure
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-55, -195, 110, 390, 12);
    graphics.endFill();
    
    // Command section (top)
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-45, -190, 90, 80, 10);
    graphics.endFill();
    
    // Bridge viewport
    graphics.beginFill(0x001122);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawRoundedRect(-40, -185, 80, 30, 8);
    graphics.endFill();
    
    // Bridge window frame
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-37, -182, 74, 24, 6);
    graphics.endFill();
    
    // Bridge interior glow
    graphics.beginFill(0x004466);
    graphics.drawRoundedRect(-35, -180, 70, 20, 4);
    graphics.endFill();
    
    // Navigation lights
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-50, -170, 3);
    graphics.drawCircle(50, -170, 3);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(-50, -160, 2);
    graphics.drawCircle(50, -160, 2);
    graphics.endFill();
    
    // Central command hub
    graphics.beginFill(0x002244);
    graphics.lineStyle(2, 0x0088cc);
    graphics.drawCircle(0, -165, 8);
    graphics.endFill();
    
    // Hub core
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(0, -165, 4);
    graphics.endFill();
    
    // Communication arrays
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(2, 0x333333);
    graphics.drawRoundedRect(-25, -210, 50, 15, 4);
    graphics.endFill();
    
    // Array elements
    graphics.beginFill(0x0066cc);
    for (let i = 0; i < 8; i++) {
        graphics.drawCircle(-20 + i * 5, -202, 1);
    }
    graphics.endFill();
    
    // Upper hull sections
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    graphics.drawRoundedRect(-50, -140, 100, 60, 8);
    graphics.endFill();
    
    // Sensor arrays
    graphics.beginFill(0x001100);
    graphics.lineStyle(1, 0x00cc44);
    graphics.drawRoundedRect(-45, -135, 20, 15, 3);
    graphics.endFill();
    
    graphics.beginFill(0x110000);
    graphics.lineStyle(1, 0xcc4400);
    graphics.drawRoundedRect(-20, -135, 20, 15, 3);
    graphics.endFill();
    
    graphics.beginFill(0x000011);
    graphics.lineStyle(1, 0x4400cc);
    graphics.drawRoundedRect(5, -135, 20, 15, 3);
    graphics.endFill();
    
    graphics.beginFill(0x110011);
    graphics.lineStyle(1, 0xcc44cc);
    graphics.drawRoundedRect(30, -135, 20, 15, 3);
    graphics.endFill();
    
    // Sensor readouts
    graphics.beginFill(0x00ff66);
    for (let i = 0; i < 6; i++) {
        const height = 1 + Math.sin(i * 0.8) * 2 + 1.5;
        graphics.drawRect(-43 + i * 2.5, -125 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    for (let i = 0; i < 6; i++) {
        const height = 1 + Math.cos(i * 0.6) * 2 + 1.5;
        graphics.drawRect(-18 + i * 2.5, -125 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0x6600ff);
    for (let i = 0; i < 6; i++) {
        const height = 1 + Math.sin(i * 0.4 + 1) * 2 + 1.5;
        graphics.drawRect(7 + i * 2.5, -125 - height, 2, height);
    }
    graphics.endFill();
    
    graphics.beginFill(0xff66cc);
    for (let i = 0; i < 6; i++) {
        const height = 1 + Math.cos(i * 0.3 + 2) * 2 + 1.5;
        graphics.drawRect(32 + i * 2.5, -125 - height, 2, height);
    }
    graphics.endFill();
    
    // Main engineering section
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-55, -75, 110, 150, 10);
    graphics.endFill();
    
    // Engineering core
    graphics.beginFill(0x002244);
    graphics.lineStyle(2, 0x0088cc);
    graphics.drawRoundedRect(-35, -60, 70, 120, 8);
    graphics.endFill();
    
    // Core containment field
    graphics.beginFill(0x004466);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-30, -55, 60, 110, 6);
    graphics.endFill();
    
    // Warp core
    graphics.beginFill(0x0066cc);
    graphics.drawRoundedRect(-20, -50, 40, 100, 4);
    graphics.endFill();
    
    // Core segments
    graphics.lineStyle(1, 0x00ccff);
    for (let i = 0; i < 10; i++) {
        graphics.moveTo(-20, -45 + i * 10);
        graphics.lineTo(20, -45 + i * 10);
    }
    
    // Power conduits
    graphics.lineStyle(2, 0x00ff88);
    graphics.moveTo(-25, -50);
    graphics.lineTo(-25, 50);
    graphics.moveTo(25, -50);
    graphics.lineTo(25, 50);
    
    // Side system panels
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-65, -60, 15, 120, 6);
    graphics.drawRoundedRect(50, -60, 15, 120, 6);
    graphics.endFill();
    
    // Control interfaces
    const controlButtons = [
        {x: -57, y: -50, color: 0x00ff00},
        {x: -57, y: -40, color: 0xff0000},
        {x: -57, y: -30, color: 0x0066ff},
        {x: -57, y: -20, color: 0xff6600},
        {x: -57, y: -10, color: 0x00ffff},
        {x: -57, y: 0, color: 0xff00ff},
        {x: -57, y: 10, color: 0x66ff00},
        {x: -57, y: 20, color: 0xffff00},
        {x: -57, y: 30, color: 0x00ff00},
        {x: -57, y: 40, color: 0xff0000},
        {x: 57, y: -50, color: 0x0066ff},
        {x: 57, y: -40, color: 0xff6600},
        {x: 57, y: -30, color: 0x00ffff},
        {x: 57, y: -20, color: 0xff00ff},
        {x: 57, y: -10, color: 0x66ff00},
        {x: 57, y: 0, color: 0xffff00},
        {x: 57, y: 10, color: 0x00ff00},
        {x: 57, y: 20, color: 0xff0000},
        {x: 57, y: 30, color: 0x0066ff},
        {x: 57, y: 40, color: 0xff6600}
    ];
    
    controlButtons.forEach(btn => {
        graphics.beginFill(btn.color);
        graphics.lineStyle(1, 0x333333);
        graphics.drawCircle(btn.x, btn.y, 2);
        graphics.endFill();
    });
    
    // Lower hull section
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawRoundedRect(-50, 80, 100, 115, 8);
    graphics.endFill();
    
    // Propulsion systems
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-40, 90, 80, 95, 6);
    graphics.endFill();
    
    // Engine housing
    graphics.beginFill(0x333333);
    graphics.lineStyle(2, 0x555555);
    graphics.drawRoundedRect(-35, 95, 70, 85, 5);
    graphics.endFill();
    
    // Thruster arrays
    graphics.beginFill(0x002244);
    graphics.lineStyle(2, 0x0088cc);
    graphics.drawRoundedRect(-30, 150, 25, 25, 4);
    graphics.drawRoundedRect(5, 150, 25, 25, 4);
    graphics.endFill();
    
    // Thruster cores
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(-17, 162, 8);
    graphics.drawCircle(17, 162, 8);
    graphics.endFill();
    
    // Thruster nozzles
    graphics.beginFill(0x004466);
    graphics.drawCircle(-17, 162, 5);
    graphics.drawCircle(17, 162, 5);
    graphics.endFill();
    
    // Maneuvering thrusters
    graphics.beginFill(0x333333);
    graphics.lineStyle(1, 0x666666);
    graphics.drawRoundedRect(-55, 100, 8, 12, 2);
    graphics.drawRoundedRect(47, 100, 8, 12, 2);
    graphics.drawRoundedRect(-55, 120, 8, 12, 2);
    graphics.drawRoundedRect(47, 120, 8, 12, 2);
    graphics.drawRoundedRect(-55, 140, 8, 12, 2);
    graphics.drawRoundedRect(47, 140, 8, 12, 2);
    graphics.drawRoundedRect(-55, 160, 8, 12, 2);
    graphics.drawRoundedRect(47, 160, 8, 12, 2);
    graphics.endFill();
    
    // Thruster glow
    graphics.beginFill(0x0088cc);
    graphics.drawCircle(-51, 106, 2);
    graphics.drawCircle(51, 106, 2);
    graphics.drawCircle(-51, 126, 2);
    graphics.drawCircle(51, 126, 2);
    graphics.drawCircle(-51, 146, 2);
    graphics.drawCircle(51, 146, 2);
    graphics.drawCircle(-51, 166, 2);
    graphics.drawCircle(51, 166, 2);
    graphics.endFill();
    
    // Hull plating details
    graphics.lineStyle(1, 0x333333, 0.5);
    for (let i = 0; i < 20; i++) {
        graphics.moveTo(-50, -190 + i * 20);
        graphics.lineTo(50, -190 + i * 20);
    }
    
    // Vertical hull lines
    graphics.moveTo(-40, -190);
    graphics.lineTo(-40, 190);
    graphics.moveTo(40, -190);
    graphics.lineTo(40, 190);
    graphics.moveTo(0, -190);
    graphics.lineTo(0, 190);
    
    // Deflector array
    graphics.beginFill(0x001122);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawRoundedRect(-25, 100, 50, 30, 6);
    graphics.endFill();
    
    // Deflector grid
    graphics.lineStyle(1, 0x004466, 0.6);
    for (let i = 0; i < 6; i++) {
        graphics.moveTo(-20 + i * 8, 105);
        graphics.lineTo(-20 + i * 8, 125);
    }
    for (let i = 0; i < 3; i++) {
        graphics.moveTo(-20, 110 + i * 5);
        graphics.lineTo(20, 110 + i * 5);
    }
    
    // Deflector dish
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(0, 115, 12);
    graphics.endFill();
    
    // Emergency systems
    graphics.beginFill(0xff0000);
    graphics.drawCircle(-45, 50, 2);
    graphics.drawCircle(45, 50, 2);
    graphics.drawCircle(-45, 75, 2);
    graphics.drawCircle(45, 75, 2);
    graphics.endFill();
    
    // Add graphics to container
    spaceshipContainer.addChild(graphics);
    
    // Create animated elements
    const animatedElements = new Graphics();
    spaceshipContainer.addChild(animatedElements);
    
    // Animation for engine glow and system activity
    let animationTime = 0;
    
    const animateSpaceship = () => {
        animationTime += 0.05;
        
        // Clear animated elements
        animatedElements.clear();
        
        // Animate main engine glow
        const engineGlow = 0.3 + Math.sin(animationTime * 3) * 0.2;
        animatedElements.beginFill(0x00ccff, engineGlow);
        animatedElements.drawCircle(-17, 162, 12);
        animatedElements.drawCircle(17, 162, 12);
        animatedElements.endFill();
        
        // Animate thruster trails
        const thrusterAlpha = 0.4 + Math.sin(animationTime * 4) * 0.2;
        animatedElements.beginFill(0x00aaff, thrusterAlpha);
        animatedElements.drawRoundedRect(-20, 175, 6, 15, 2);
        animatedElements.drawRoundedRect(14, 175, 6, 15, 2);
        animatedElements.endFill();
        
        // Animate maneuvering thruster glow
        const maneuverGlow = 0.2 + Math.sin(animationTime * 2 + 1) * 0.15;
        animatedElements.beginFill(0x0088cc, maneuverGlow);
        animatedElements.drawCircle(-51, 106, 3);
        animatedElements.drawCircle(51, 106, 3);
        animatedElements.drawCircle(-51, 126, 3);
        animatedElements.drawCircle(51, 126, 3);
        animatedElements.drawCircle(-51, 146, 3);
        animatedElements.drawCircle(51, 146, 3);
        animatedElements.drawCircle(-51, 166, 3);
        animatedElements.drawCircle(51, 166, 3);
        animatedElements.endFill();
        
        // Animate warp core
        const coreGlow = 0.4 + Math.sin(animationTime * 5) * 0.3;
        animatedElements.beginFill(0x0088ff, coreGlow);
        animatedElements.drawRoundedRect(-15, -45, 30, 90, 3);
        animatedElements.endFill();
        
        // Animate energy flow in core
        const flowPos = (animationTime * 30) % 90;
        animatedElements.beginFill(0x00ffaa, 0.8);
        animatedElements.drawCircle(0, -45 + flowPos, 2);
        animatedElements.endFill();
        
        // Animate deflector dish
        const dishGlow = 0.3 + Math.sin(animationTime * 2.5) * 0.2;
        animatedElements.beginFill(0x0066cc, dishGlow);
        animatedElements.drawCircle(0, 115, 15);
        animatedElements.endFill();
        
        // Animate navigation lights
        const navBlink = Math.sin(animationTime * 4) > 0 ? 0.8 : 0.2;
        animatedElements.beginFill(0x00ff00, navBlink);
        animatedElements.drawCircle(-50, -170, 4);
        animatedElements.drawCircle(50, -170, 4);
        animatedElements.endFill();
        
        // Animate bridge glow
        const bridgeGlow = 0.3 + Math.sin(animationTime * 1.5) * 0.1;
        animatedElements.beginFill(0x004466, bridgeGlow);
        animatedElements.drawRoundedRect(-30, -175, 60, 15, 3);
        animatedElements.endFill();
        
        requestAnimationFrame(animateSpaceship);
    };
    
    // Start animation
    animateSpaceship();
    
    // Provide external animate method
    spaceshipContainer.animate = function(delta) {
        animationTime += delta * 0.01;
    };
    
    return spaceshipContainer;
}

const createStandingAlienNPC = (
  x,
  y,
  camera,
  colliders,
  gameState,
  npcName = "??"
) => {
  const npc = new Graphics();

  // Alien color palette
  const alienSkinColor = 0x7dd3c0;      // Light teal alien skin
  const alienSkinShadow = 0x5fb3a3;     // Darker teal shadow
  const suitColor = 0x2c3e50;           // Dark blue-gray suit
  const suitShadow = 0x1a252f;          // Darker suit shadow
  const suitAccent = 0x3498db;          // Blue accent/trim
  const helmetColor = 0x34495e;         // Dark helmet
  const helmetGlass = 0x85c1e9;         // Light blue glass
  const gloveColor = 0x2c3e50;          // Same as suit
  const bootColor = 0x1a1a1a;           // Dark boots

  // Helmet (larger for alien head)
  npc.beginFill(helmetColor);
  npc.drawRect(-8, -24, 16, 16);
  npc.endFill();

  // Helmet glass visor (right side profile)
  npc.beginFill(helmetGlass);
  npc.drawRect(-7, -23, 14, 14);
  npc.endFill();

  // Helmet reflection effect
  npc.beginFill(0xffffff);
  npc.drawRect(-6, -22, 4, 6);
  npc.endFill();

  // Helmet rim/seal
  npc.beginFill(0x5d6d7e);
  npc.drawRect(-8, -8, 16, 2);
  npc.endFill();

  // Alien head inside helmet (visible through visor)
  npc.beginFill(alienSkinColor);
  npc.drawRect(-6, -20, 12, 10);
  npc.endFill();

  // Alien head shadow
  npc.beginFill(alienSkinShadow);
  npc.drawRect(-6, -18, 4, 6);
  npc.endFill();

  // Large alien eye (characteristic big eye)
  npc.beginFill(0x000000);
  npc.drawRect(-4, -18, 4, 4);
  npc.endFill();

  // Eye reflection
  npc.beginFill(0xffffff);
  npc.drawRect(-3, -17, 1, 1);
  npc.endFill();

  // Small alien nostril
  npc.beginFill(alienSkinShadow);
  npc.drawRect(-2, -14, 1, 1);
  npc.endFill();

  // Helmet breathing apparatus
  npc.beginFill(0x95a5a6);
  npc.drawRect(-3, -12, 6, 2);
  npc.endFill();

  // Breathing apparatus details
  npc.beginFill(0x7f8c8d);
  npc.drawRect(-2, -11, 1, 1);
  npc.drawRect(1, -11, 1, 1);
  npc.endFill();

  // Space suit torso
  npc.beginFill(suitColor);
  npc.drawRect(-10, -6, 20, 20);
  npc.endFill();

  // Suit shadow/depth
  npc.beginFill(suitShadow);
  npc.drawRect(-10, 12, 20, 2);
  npc.endFill();

  // Chest control panel
  npc.beginFill(suitAccent);
  npc.drawRect(-8, -4, 16, 6);
  npc.endFill();

  // Control panel buttons
  npc.beginFill(0xe74c3c);
  npc.drawRect(-6, -2, 2, 2);
  npc.endFill();

  npc.beginFill(0x27ae60);
  npc.drawRect(-3, -2, 2, 2);
  npc.endFill();

  npc.beginFill(0xf39c12);
  npc.drawRect(1, -2, 2, 2);
  npc.endFill();

  npc.beginFill(0x8e44ad);
  npc.drawRect(4, -2, 2, 2);
  npc.endFill();

  // Control panel screen
  npc.beginFill(0x2ecc71);
  npc.drawRect(-7, 1, 14, 2);
  npc.endFill();

  // Suit trim/seams
  npc.beginFill(suitAccent);
  npc.drawRect(-10, 4, 20, 1);
  npc.drawRect(-10, 8, 20, 1);
  npc.endFill();

  // Left arm (visible arm in profile)
  npc.beginFill(suitColor);
  npc.drawRect(-12, -2, 4, 12);
  npc.endFill();

  // Left arm shadow
  npc.beginFill(suitShadow);
  npc.drawRect(-12, 8, 4, 2);
  npc.endFill();

  // Right arm (partially visible)
  npc.beginFill(suitColor);
  npc.drawRect(8, 0, 4, 10);
  npc.endFill();

  // Right arm shadow
  npc.beginFill(suitShadow);
  npc.drawRect(8, 8, 4, 2);
  npc.endFill();

  // Gloves
  npc.beginFill(gloveColor);
  npc.drawRect(-12, 10, 4, 4);
  npc.drawRect(8, 10, 4, 4);
  npc.endFill();

  // Glove cuffs
  npc.beginFill(suitAccent);
  npc.drawRect(-12, 10, 4, 1);
  npc.drawRect(8, 10, 4, 1);
  npc.endFill();

  // Utility belt
  npc.beginFill(0x34495e);
  npc.drawRect(-10, 14, 20, 3);
  npc.endFill();

  // Belt pouches/tools
  npc.beginFill(0x95a5a6);
  npc.drawRect(-8, 15, 3, 2);
  npc.drawRect(-2, 15, 3, 2);
  npc.drawRect(4, 15, 3, 2);
  npc.endFill();

  // Legs
  npc.beginFill(suitColor);
  npc.drawRect(-8, 17, 7, 16);
  npc.drawRect(1, 17, 7, 16);
  npc.endFill();

  // Leg shadows
  npc.beginFill(suitShadow);
  npc.drawRect(-8, 31, 7, 2);
  npc.drawRect(1, 31, 7, 2);
  npc.endFill();

  // Leg joints/knee pads
  npc.beginFill(suitAccent);
  npc.drawRect(-7, 24, 5, 2);
  npc.drawRect(2, 24, 5, 2);
  npc.endFill();

  // Space boots
  npc.beginFill(bootColor);
  npc.drawRect(-9, 33, 8, 4);
  npc.drawRect(1, 33, 8, 4);
  npc.endFill();

  // Boot treads
  npc.beginFill(0x2c3e50);
  npc.drawRect(-9, 36, 8, 1);
  npc.drawRect(1, 36, 8, 1);
  npc.endFill();

  // Oxygen tank/life support backpack (visible from side)
  npc.beginFill(0x7f8c8d);
  npc.drawRect(10, -4, 3, 12);
  npc.endFill();

  // Backpack details
  npc.beginFill(0x95a5a6);
  npc.drawRect(10, -2, 3, 2);
  npc.drawRect(10, 2, 3, 2);
  npc.drawRect(10, 6, 3, 2);
  npc.endFill();

  // Oxygen hose
  npc.beginFill(0x34495e);
  npc.drawRect(7, -6, 2, 1);
  npc.drawRect(6, -7, 2, 1);
  npc.drawRect(5, -8, 2, 1);
  npc.endFill();

  // Helmet antenna
  npc.beginFill(0x95a5a6);
  npc.drawRect(-2, -26, 1, 2);
  npc.endFill();

  // Antenna tip (blinking light)
  npc.beginFill(0xe74c3c);
  npc.drawRect(-1.5, -27, 1, 1);
  npc.endFill();

  // Name tag with alien styling
  const nameTag = new Text({
    text: npcName,
    style: new TextStyle({
      fontSize: 10,
      fill: 0x7dd3c0,
      fontFamily: "Arial",
      stroke: { color: 0x000000, width: 2 },
      dropShadow: {
        color: 0x000000,
        blur: 2,
        angle: Math.PI / 4,
        distance: 2,
      },
    }),
  });
  nameTag.anchor.set(0.5);
  nameTag.y = -35;
  npc.addChild(nameTag);

  // Position the NPC
  npc.x = x;
  npc.y = y;

  // Add to scene
  if (gameState && gameState.camera) {
    gameState.camera.addChild(npc);
  }

  const bounds = {
    x: x - 15,
    y: y - 30,
    width: 30,
    height: 70,
    label: `standing-alien-npc-${npcName}`,
  };

  if (camera && colliders) {
    addWithCollider(camera, npc, bounds, colliders);
  }

  // Add to interactables (for Z key / text bubble)
  if (!window.interactables) window.interactables = [];
  window.interactables.push({
    label: `standing-alien-npc-${npcName}`,
    bounds,
    message: "Tf is this...",
    bubble: null,
  });

  // NPC properties
  npc.npcName = npcName;
  npc.isSitting = false;
  npc.isAlien = true;
  npc.facing = "left"; // Side-faced to the left (right side visible)

  return npc;
};

const populateRooms = (gameState) => {
  const { camera, TILE_SIZE } = gameState;
  
  // Define space station layout (same as your grid)
  const SPACE_LAYOUT = [
    // Row 0: Command deck and observation
    [
      { type: 'bridge', width: 600, height: 400, name: 'Command Bridge' },
      { type: 'observation', width: 400, height: 400, name: 'Observation Deck' },
      { type: 'communications', width: 600, height: 400, name: 'Comms Array' }
    ],
    // Row 1: Main corridors and facilities
    [
      { type: 'secret_room', width: 200, height: 500, name: 'Hidden Room' },
      { type: 'med_bay', width: 500, height: 500, name: 'Medical Bay' },
      { type: 'lab', width: 450, height: 500, name: 'Research Lab' },
      { type: 'corridor2', width: 450, height: 500, name: 'Corridor A' },
    ],
    // Row 2: Engineering and storage
    [
      { type: 'engineering', width: 700, height: 600, name: 'Engineering Bay' },
      { type: 'storage', width: 350, height: 600, name: 'Cargo Hold' },
      { type: 'reactor', width: 250, height: 600, name: 'Reactor Core' },
    ],
    // Row 3: Living quarters
    [
      { type: 'quartersa', width: 350, height: 350, name: 'Crew Quarters A' },
      { type: 'quartersb', width: 350, height: 350, name: 'Crew Quarters B' },
      { type: 'cafeteria', width: 450, height: 350, name: 'Mess Hall' },
      { type: 'recreation', width: 450, height: 350, name: 'Recreation' }
    ]
  ];

  let currentY = 0;
  
  SPACE_LAYOUT.forEach((row, rowIndex) => {
    let currentX = 0;
    const rowHeight = Math.max(...row.map(room => room.height));
    
    row.forEach((roomData, colIndex) => {
      const { type, width, height, name } = roomData;
      const offsetX = currentX;
      const offsetY = currentY;
      
      // Populate based on room type
      switch (type) {
        case 'bridge': // Command Bridge
          // Captain's command chair (center)
          camera.addChild(createCommandChair(
            offsetX + width / 2 -20,
            offsetY + height / 2 -30,
            camera,
            gameState.colliders
          ));
          
          // Navigation consoles (front)
          camera.addChild(createNavConsole(
            offsetX + width / 2 - 90,
            offsetY + 55,
            camera,
            gameState.colliders
          ));
          
          // // Side control stations
          camera.addChild(createControlStation(
            offsetX + 60,
            offsetY + 150,
            camera,
            gameState.colliders
          ));
          camera.addChild(createControlStation(
            offsetX + width - 60,
            offsetY + 150,
            camera,
            gameState.colliders
          ));
          
          // Holographic display (center front)
          camera.addChild(createHoloDisplay(
            offsetX + width / 2 + 90,
            offsetY + 60,
            camera,
            gameState.colliders
          ));
          
          // // Bridge crew stations
          camera.addChild(createBridgeStation(
            offsetX + 120,
            offsetY + height - 100,
            camera,
            gameState.colliders
          ));
          
          break;

        case 'observation': // Observation Deck
          // Telescope/observation equipment
          camera.addChild(createTelescope(
            offsetX + width / 2,
            offsetY + 90,
            camera,
            gameState.colliders
          ));
          
        //   // Observation seats
          camera.addChild(createObservationSeat(
            offsetX + 100,
            offsetY + 200,
            camera,
            gameState.colliders
          ));
          camera.addChild(createObservationSeat(
            offsetX + width - 100,
            offsetY + 200,
            camera,
            gameState.colliders
          ));
          
        //   // Atmospheric plants (space plants)
          camera.addChild(createSpacePlant(
            offsetX + 60,
            offsetY + height - 60,
            camera,
            gameState.colliders
          ));
          camera.addChild(createSpacePlant(
            offsetX + width - 60,
            offsetY + height - 60,
            camera,
            gameState.colliders
          ));
          break;

        case 'communications': // Comms Array
          // Communication arrays
          camera.addChild(createCommArray(
            offsetX + 80,
            offsetY + 50,
            camera,
            gameState.colliders
          ));
          camera.addChild(createCommArray(
            offsetX + width - 80,
            offsetY + 50,
            camera,
            gameState.colliders
          ));
          
          // Signal processing units
          camera.addChild(createSignalProcessor(
            offsetX + width / 2,
            offsetY + 50,
            camera,
            gameState.colliders
          ));
          
          // Monitoring stations
          camera.addChild(createMonitoringStation(
            offsetX + 80,
            offsetY + 320,
            camera,
            gameState.colliders
          ));
          camera.addChild(createMonitoringStation(
            offsetX + width - 80,
            offsetY + 320,
            camera,
            gameState.colliders
          ));
          
          // Data storage units
          camera.addChild(createDataBank(
            offsetX + 300,
            offsetY + height - 220,
            camera,
            gameState.colliders
          ));
          break;

        case 'med_bay': // Medical Bay
          // Medical beds
          camera.addChild(createMedBed(
            offsetX + 120,
            offsetY + 250,
            camera,
            gameState.colliders
          ));
             camera.addChild(createMedBed(
            offsetX + 120,
            offsetY + 420,
            camera,
            gameState.colliders
          ));
          
          // Medical equipment
          camera.addChild(createMedScanner(
            offsetX + 400,
            offsetY + 400,
            camera,
            gameState.colliders
          ));
          
        //   // Medical storage
          camera.addChild(createMedStorage(
            offsetX + 50,
            offsetY + 50,
            camera,
            gameState.colliders
          ));
          camera.addChild(createMedStorage(
            offsetX + width - 50,
            offsetY + 50,
            camera,
            gameState.colliders
          ));
          
          // Emergency medical kit
          camera.addChild(createEmergencyKit(
            offsetX + 50,
            offsetY +120,
            camera,
            gameState.colliders
          ));
          break;

        case 'lab': // Research Lab
          // Laboratory workstations
          camera.addChild(createLabWorkstation(
            offsetX + 90,
            offsetY + 100,
            camera,
            gameState.colliders
          ));
          camera.addChild(createLabWorkstation(
            offsetX + width - 90,
            offsetY + 100,
            camera,
            gameState.colliders
          ));
          
        //   // Specimen containers
          camera.addChild(createSpecimenContainer(
            offsetX + 80,
            offsetY + 420,
            camera,
            gameState.colliders
          ));
          camera.addChild(createSpecimenContainer(
            offsetX + width - 80,
            offsetY + 420,
            camera,
            gameState.colliders
          ));
          
          // Analysis equipment
          camera.addChild(createAnalysisEquipment(
            offsetX + width / 2,
            offsetY + 320,
            camera,
            gameState.colliders
          ));
          
        //   // Research terminals
        //   camera.addChild(createResearchTerminal(
        //     offsetX + 120,
        //     offsetY + 350,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createResearchTerminal(
        //     offsetX + width - 120,
        //     offsetY + 350,
        //     camera,
        //     gameState.colliders
        //   ));
          break;

        case 'engineering': // Engineering Bay
          // Main engineering console
          camera.addChild(createEngineeringConsole(
            offsetX + width / 2,
            offsetY + 120,
            camera,
            gameState.colliders
          ));
          
          // Power distribution units
          camera.addChild(createPowerDistribution(
            offsetX + 100,
            offsetY + 70,
            camera,
            gameState.colliders
          ));
          camera.addChild(createPowerDistribution(
            offsetX + width - 100,
            offsetY + 70,
            camera,
            gameState.colliders
          ));
          
          // Repair stations
          camera.addChild(createRepairStation(
            offsetX + 150,
            offsetY + 350,
            camera,
            gameState.colliders
          ));
          camera.addChild(createRepairStation(
            offsetX + width - 150,
            offsetY + 350,
            camera,
            gameState.colliders
          ));
           camera.addChild(createRepairStation(
            offsetX + 150,
            offsetY + 480,
            camera,
            gameState.colliders
          ));
          camera.addChild(createRepairStation(
            offsetX + width - 150,
            offsetY + 480,
            camera,
            gameState.colliders
          ));
          break;

        case 'storage': // Cargo Hold
          // Cargo containers in organized rows
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
              camera.addChild(createCargoContainer(
                offsetX + 90 + i * 80,
                offsetY + 380 + j * 120,
                camera,
                gameState.colliders
              ));
            }
          }
          
          // Loading equipment
          camera.addChild(createLoadingEquipment(
            offsetX + width / 2,
            offsetY + height - 150,
            camera,
            gameState.colliders
          ));
          
          // Storage lockers
          camera.addChild(createStorageLocker(
            offsetX + 40,
            offsetY + 60,
            camera,
            gameState.colliders
          ));
          camera.addChild(createStorageLocker(
            offsetX + 300,
            offsetY + 60,
            camera,
            gameState.colliders
          ));
          break;

        case 'reactor': // Reactor Core
          // Main reactor core
          camera.addChild(createReactorCore(
            offsetX + width / 2+ 120,
            offsetY + height / 2,
            camera,
            gameState.colliders
          ));
          
          // Cooling systems
          camera.addChild(createCoolingSystem(
            offsetX + 100,
            offsetY + 480,
            camera,
            gameState.colliders
          ));
           camera.addChild(createCoolingSystem(
            offsetX + 460,
            offsetY + 480,
            camera,
            gameState.colliders
          ));
      
          
          // Control panels
          camera.addChild(createReactorControlPanel(
            offsetX + 100,
            offsetY + 70,
            camera,
            gameState.colliders
          ));
          
          // Warning systems
          camera.addChild(createWarningSystem(
            offsetX + 280,
            offsetY + 70,
            camera,
            gameState.colliders
          ));
          break;

        case 'quartersa': // Crew Quarters
          // Bunk beds
          camera.addChild(createSpaceBunk(
            offsetX + 100,
            offsetY + 5,
            camera,
            gameState.colliders
          ));
          camera.addChild(createSpaceBunk(
            offsetX + 100,
            offsetY + 200,
            camera,
            gameState.colliders
          ));
          //Mysterious npc
           camera.addChild(createStandingAlienNPC(  
            offsetX + 60,
            offsetY + 100,
            camera,
            gameState.colliders
          ));
          // Personal storage
          camera.addChild(createPersonalLocker(
            offsetX + width - 60,
            offsetY + 200,
            camera,
            gameState.colliders
          ));
          
          // Recreation terminal
          camera.addChild(createRecTerminal(
            offsetX + width - 60,
            offsetY + 5,
            camera,
            gameState.colliders
          ));
          break;

        case 'quartersb': // Crew Quarters
          // Bunk beds
          camera.addChild(createSpaceBunk(
            offsetX + 100,
            offsetY + 5,
            camera,
            gameState.colliders
          ));
          camera.addChild(createSpaceBunk(
            offsetX + 100,
            offsetY + 200,
            camera,
            gameState.colliders
          ));
          // Personal storage
          camera.addChild(createPersonalLocker(
            offsetX + width - 60,
            offsetY + 200,
            camera,
            gameState.colliders
          ));
          
          // Recreation terminal
          camera.addChild(createRecTerminal(
            offsetX + width - 60,
            offsetY + 5,
            camera,
            gameState.colliders
          ));
          break;
       

        case 'cafeteria': // Mess Hall
          // Dining tables
            camera.addChild(createDiningTable(
            offsetX + 120,
            offsetY ,
            camera,
            gameState.colliders
          ));
          camera.addChild(createDiningTable(
            offsetX + width - 120,
            offsetY ,
            camera,
            gameState.colliders
          ));
          camera.addChild(createDiningTable(
            offsetX + 220,
            offsetY + 200,
            camera,
            gameState.colliders
          ));
          
          //Food replicator
          camera.addChild(createFoodReplicator(
           offsetX + width - 60,
            offsetY + 210,
            camera,
            gameState.colliders
          ));
          
          // Beverage dispenser
          camera.addChild(createBeverageDispenser(
            offsetX + 50,
            offsetY + 205,
            camera,
            gameState.colliders
          ));
          
          break;

        case 'recreation': // Recreation
          // Exercise equipment
          camera.addChild(createExerciseEquipment(
            offsetX + 120,
            offsetY + 80,
            camera,
            gameState.colliders
          ));
            camera.addChild(createExerciseEquipment(
            offsetX + width/2 + 80,
            offsetY + 80,
            camera,
            gameState.colliders
          ));
          
          // Entertainment console
          camera.addChild(createEntertainmentConsole(
            offsetX + width - 105,
            offsetY + height - 130,
            camera,
            gameState.colliders
          ));
          
          // Game table
          camera.addChild(createGameTable(
            offsetX + 90,
            offsetY + height - 120,
            camera,
            gameState.colliders
          ));
          break;

        case 'corridor2':

        camera.addChild(createSpacePlant(
            offsetX + 50,
            offsetY + height - 60,
            camera,
            gameState.colliders
          ));
          camera.addChild(createSpacePlant(
            offsetX +  width - 60,
            offsetY + height - 60,
            camera,
            gameState.colliders
          )); 
            camera.addChild(createSpacePlant(
            offsetX + 50,
            offsetY + 30,
            camera,
            gameState.colliders
          ));
          camera.addChild(createSpacePlant(
            offsetX +  width - 60,
            offsetY + 30,
            camera,
            gameState.colliders
          )); 

          break;

        case 'secret_room':
        camera.addChild(createSpaceship(
            offsetX + 110 ,
            offsetY + width/2 + 150 ,
            camera,
            gameState.colliders
        ))  

        break;

      }
      
      currentX += width;
    });
    
    currentY += rowHeight;
  });


};

   const setupMovementEmission = (gameState) => {
        let lastPosition = { x: gameState.player.x, y: gameState.player.y };
        let lastEmitTime = 0;
        let isCurrentlyMoving = false;
        let currentDirection = "down";

        const emitMovementUpdate = () => {
          const now = Date.now();
          const currentPosition = {
            x: gameState.player.x,
            y: gameState.player.y,
          };

          // Calculate distance moved
          const distance = Math.sqrt(
            Math.pow(currentPosition.x - lastPosition.x, 2) +
              Math.pow(currentPosition.y - lastPosition.y, 2)
          );

          // Determine if player is moving
          const isMoving = distance > 0.1;

          // Determine direction if moving
          if (isMoving) {
            const deltaX = currentPosition.x - lastPosition.x;
            const deltaY = currentPosition.y - lastPosition.y;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              currentDirection = deltaX > 0 ? "right" : "left";
            } else {
              currentDirection = deltaY > 0 ? "down" : "up";
            }
          }
          const stateChanged = isMoving !== isCurrentlyMoving;
          const movedEnough = distance > 2;
          const timeToUpdate = now - lastEmitTime > 100; // Every 100ms minimum

          if (stateChanged || movedEnough || (isMoving && timeToUpdate)) {
            socket.emit("player-move", {
              position: currentPosition,
              isMoving: isMoving,
              direction: currentDirection,
            });

            lastPosition = { ...currentPosition };
            lastEmitTime = now;
            isCurrentlyMoving = isMoving;
          }
        };

        return emitMovementUpdate;
      };

const setupInput = (gameState, app) => {
  gameState.keys = {};
  
  // Keyboard event listeners
  window.addEventListener('keydown', (e) => {
    gameState.keys[e.code] = true;
  });
  
  window.addEventListener('keyup', (e) => {
    gameState.keys[e.code] = false;
  });
};

// const gameLoop = (gameState, app) => {
//   const speed = gameState.playerSpeed || 2;
//   const { player, keys, camera, world, ROOM_GRID, colliders } = gameState;
//   const ROOM_WIDTH = gameState.worldWidth || 800;
//   const ROOM_HEIGHT = gameState.worldHeight || 600;

//   if (!player || !keys) return;

//   // Initialize movement emitter only after player exists
//   if (!gameState.movementEmitter) {
//     gameState.movementEmitter = setupMovementEmission(gameState);
//   }

//   // Store original position
//   const originalX = player.x;
//   const originalY = player.y;

//   // Calculate desired movement
//   let dx = 0;
//   let dy = 0;

//   if (keys["KeyW"] || keys["ArrowUp"]) dy -= speed;
//   if (keys["KeyS"] || keys["ArrowDown"]) dy += speed;
//   if (keys["KeyA"] || keys["ArrowLeft"]) dx -= speed;
//   if (keys["KeyD"] || keys["ArrowRight"]) dx += speed;

//   const moving = dx !== 0 || dy !== 0;

//   if (moving) {
//     let newX = originalX + dx;
//     let newY = originalY + dy;

//     // Apply movement directly (no collision detection)
//     player.x = newX;
//     player.y = newY;

//     // Determine animation direction based on movement
//     if (Math.abs(dx) > Math.abs(dy)) {
//       player.walk(dx > 0 ? "right" : "left");
//     } else if (dy !== 0) {
//       player.walk(dy > 0 ? "down" : "up");
//     }
//   } else {
//     player.stop();
//   }

//   // Emit movement updates every frame (after player position is updated)
//   if (gameState.movementEmitter) {
//     gameState.movementEmitter();
//   }

//   // Clamp player to room bounds (with proper margins)
//   const margin = 30;
//   player.x = Math.max(margin, Math.min(ROOM_WIDTH - margin, player.x));
//   player.y = Math.max(margin, Math.min(ROOM_HEIGHT - margin, player.y));

//   // Center camera on player
//   if (world && camera) {
//     const centerX = app.screen.width / 2;
//     const centerY = app.screen.height / 2;

//     world.x = centerX - player.x;
//     world.y = centerY - player.y;

//     // Clamp camera to room bounds
//     world.x = Math.max(
//       -(ROOM_WIDTH - app.screen.width),
//       Math.min(0, world.x)
//     );
//     world.y = Math.max(
//       -(ROOM_HEIGHT - app.screen.height),
//       Math.min(0, world.y)
//     );
//   }
// };

   const createTextBubble = (x, y, text, duration = 3000, parent) => {
        const container = new Container();

        const padding = 16;
        const fontSize = 13;
        const cornerRadius = 12;
        const tailHeight = 8;

        const textStyle = new TextStyle({
          fontSize,
          fill: 0x2c3e50,
          fontFamily: "Arial, sans-serif",
          fontWeight: "500",
          wordWrap: true,
          wordWrapWidth: 220,
          lineHeight: fontSize * 1.4,
          letterSpacing: 0.3,
        });

        const label = new Text(text, textStyle);

        const bubbleWidth = Math.max(label.width + padding * 2, 80);
        const bubbleHeight = label.height + padding * 2;

        // Shadow
        const shadow = new Graphics();
        shadow.beginFill(0x000000, 0.15);
        shadow.drawRoundedRect(6, 6, bubbleWidth, bubbleHeight, cornerRadius);
        shadow.beginFill(0x000000, 0.08);
        shadow.drawRoundedRect(4, 4, bubbleWidth, bubbleHeight, cornerRadius);
        shadow.beginFill(0x000000, 0.04);
        shadow.drawRoundedRect(2, 2, bubbleWidth, bubbleHeight, cornerRadius);
        shadow.endFill();

        // Main bubble
        const bubble = new Graphics();
        bubble.beginFill(0xffffff);
        bubble.drawRoundedRect(0, 0, bubbleWidth, bubbleHeight, cornerRadius);
        bubble.endFill();
        bubble.beginFill(0xf8f9fa, 0.8);
        bubble.drawRoundedRect(
          0,
          0,
          bubbleWidth,
          bubbleHeight * 0.6,
          cornerRadius
        );
        bubble.endFill();
        bubble.lineStyle(1.5, 0xe9ecef, 0.9);
        bubble.drawRoundedRect(0, 0, bubbleWidth, bubbleHeight, cornerRadius);
        bubble.lineStyle(0);
        bubble.beginFill(0xffffff, 0.6);
        bubble.drawRoundedRect(
          1,
          1,
          bubbleWidth - 2,
          bubbleHeight * 0.4,
          cornerRadius - 1
        );
        bubble.endFill();

        // Tail
        const tail = new Graphics();
        tail.beginFill(0xffffff);
        tail.lineStyle(1.5, 0xe9ecef, 0.9);
        const tailX = bubbleWidth / 2 - 6;
        const tailY = bubbleHeight;
        tail.moveTo(tailX, tailY);
        tail.lineTo(tailX + 6, tailY + tailHeight);
        tail.lineTo(tailX + 12, tailY);
        tail.closePath();
        tail.endFill();

        const tailShadow = new Graphics();
        tailShadow.beginFill(0x000000, 0.1);
        tailShadow.moveTo(tailX + 2, tailY + 2);
        tailShadow.lineTo(tailX + 8, tailY + tailHeight + 2);
        tailShadow.lineTo(tailX + 14, tailY + 2);
        tailShadow.closePath();
        tailShadow.endFill();

        const decoration = new Graphics();
        decoration.beginFill(0x3498db, 0.15);
        decoration.drawCircle(8, 8, 3);
        decoration.drawCircle(bubbleWidth - 8, 8, 3);
        decoration.endFill();
        decoration.beginFill(0xffffff, 0.8);
        decoration.drawCircle(bubbleWidth - 12, bubbleHeight - 12, 1);
        decoration.drawCircle(12, bubbleHeight - 8, 0.8);
        decoration.endFill();

        label.x = padding;
        label.y = padding;

        container.addChild(shadow, tailShadow, bubble, tail, decoration, label);
        let baseY;
        const shouldFlipDown = y - bubbleHeight - tailHeight < 10;
        if (shouldFlipDown) {
          // Below the object
          baseY = y + tailHeight + 4;
          tail.scale.y = -1;
          tail.y = -tail.y - bubbleHeight;
          tailShadow.scale.y = -1;
          tailShadow.y = -tailShadow.y - bubbleHeight;
        } else {
          // Above the object
          baseY = y - bubbleHeight - tailHeight;
        }
        let baseX = x - bubbleWidth / 2;

        // Prevent going off the left edge
        if (baseX < 8) {
          baseX = 8;
        }

        // Prevent going off the right edge (optional)
        const screenWidth = window.innerWidth || 800;
        if (baseX + bubbleWidth > screenWidth - 8) {
          baseX = screenWidth - bubbleWidth - 8;
        }

        container.x = baseX;

        container.y = baseY;

        let animationTime = 0;
        let isAnimating = true;
        let isDestroyed = false;

        const animate = () => {
          if (!isAnimating || isDestroyed) return;

          animationTime += 0.1;

          const floatOffset = Math.sin(animationTime) * 1.5;
          container.y = baseY + floatOffset; // inside animate

          const pulseScale = 1 + Math.sin(animationTime * 2) * 0.02;
          container.scale.set(pulseScale);

          decoration.alpha = 0.8 + Math.sin(animationTime * 3) * 0.2;

          requestAnimationFrame(animate);
        };

        const entranceAnimation = () => {
          let progress = 0;
          const step = () => {
            if (isDestroyed) return;

            progress += 0.15;
            const scale = 0.3 + (1 - 0.3) * (1 - Math.pow(1 - progress, 3));
            container.scale.set(scale);
            container.alpha = Math.min(progress, 1);

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              animate();
            }
          };
          step();
        };

        const exitAnimation = () => {
          if (isDestroyed) return;
          isAnimating = false;
          isDestroyed = true;

          let progress = 0;
          const step = () => {
            progress += 0.12;
            if (isDestroyed) {
              container.alpha = 1 - progress;
              container.scale.set(1 - progress * 0.3);
              container.y = baseY - progress * 10; // inside exit step
            }

            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              if (parent && parent.children.includes(container)) {
                parent.removeChild(container);
              }

              container.destroy({ children: true });

              const interactable = (window.interactables || []).find(
                (obj) => obj.bubble === container
              );
              if (interactable) {
                interactable.bubble = null;
              }
            }
          };
          step();
        };

        if (parent) {
          parent.addChild(container);
          entranceAnimation();
          setTimeout(() => exitAnimation(), duration - 800);
        }
        container.zIndex= 999

        return container;
      };


   const gameLoop = (gameState, app) => {
        const speed = gameState.playerSpeed || 2;
  const { player, keys, camera, world, ROOM_GRID, colliders } = gameState;
  const ROOM_WIDTH = gameState.worldWidth || 800;
  const ROOM_HEIGHT = gameState.worldHeight || 600;

        if (!player) return;

        // Initialize movement emitter only after player exists
        if (!gameState.movementEmitter) {
          gameState.movementEmitter = setupMovementEmission(gameState);
        }

        // Store original position
        const originalX = player.x;
        const originalY = player.y;

        // Calculate desired movement
        let dx = 0;
        let dy = 0;

        if (keys["KeyW"] || keys["ArrowUp"]) dy -= speed;
        if (keys["KeyS"] || keys["ArrowDown"]) dy += speed;
        if (keys["KeyA"] || keys["ArrowLeft"]) dx -= speed;
        if (keys["KeyD"] || keys["ArrowRight"]) dx += speed;

        const moving = dx !== 0 || dy !== 0;

        if (moving) {
          let newX = originalX;
          let newY = originalY;
          let moved = false;

          // Try diagonal movement first (most natural)
          if (dx !== 0 && dy !== 0) {
            const testX = originalX + dx;
            const testY = originalY + dy;
            if (
              !willCollide(testX, testY, colliders) ||
              gameState.wallHackEnabled
            ) {
              newX = testX;
              newY = testY;
              moved = true;
            }
          }

          // If diagonal failed, try each axis independently
          if (!moved) {
            // Try horizontal movement
            if (dx !== 0) {
              const testX = originalX + dx;
              if (
                !willCollide(testX, originalY, colliders) ||
                gameState.wallHackEnabled
              ) {
                newX = testX;
                moved = true;
              }
            }

            // Try vertical movement (independent of horizontal)
            if (dy !== 0) {
              const testY = originalY + dy;
              if (
                !willCollide(originalX, testY, colliders) ||
                gameState.wallHackEnabled
              ) {
                newY = testY;
                moved = true;
              }
            }

            // If both individual movements work, try combining them
            if (moved && newX !== originalX && newY !== originalY) {
              if (
                !willCollide(newX, newY, colliders) ||
                gameState.wallHackEnabled
              ) {
                // Combined movement is safe
              } else {
                // Combined movement would collide, choose primary direction
                if (Math.abs(dx) >= Math.abs(dy)) {
                  newY = originalY; // Prioritize horizontal
                } else {
                  newX = originalX; // Prioritize vertical
                }
              }
            }
          }

          // Apply movement and animation
          if (newX !== originalX || newY !== originalY) {
            player.x = newX;
            player.y = newY;

            // Determine animation direction based on actual movement
            const actualDx = newX - originalX;
            const actualDy = newY - originalY;

            if (Math.abs(actualDx) > Math.abs(actualDy)) {
              player.walk(actualDx > 0 ? "right" : "left");
            } else if (actualDy !== 0) {
              player.walk(actualDy > 0 ? "down" : "up");
            }
          } else {
            player.stop();
          }
        } else {
          player.stop();
        }

        // Emit movement updates every frame (after player position is updated)
        if (gameState.movementEmitter) {
          gameState.movementEmitter();
        }

        // Clamp player to room bounds (with proper margins)
        const margin = 30;
        player.x = Math.max(margin, Math.min(ROOM_WIDTH - margin, player.x));
        player.y = Math.max(margin, Math.min(ROOM_HEIGHT - margin, player.y));

        // Center camera on player
        const centerX = app.screen.width / 2;
        const centerY = app.screen.height / 2;

        world.x = centerX - player.x;
        world.y = centerY - player.y;

        // Clamp camera to room bounds
        world.x = Math.max(
          -(ROOM_WIDTH - app.screen.width),
          Math.min(0, world.x)
        );
        world.y = Math.max(
          -(ROOM_HEIGHT - app.screen.height),
          Math.min(0, world.y)
        );

        // Smooth interpolation for other players
        const lerp = (start, end, amt) => start + (end - start) * amt;

        Object.values(gameState.otherPlayers).forEach((p) => {
          if (p.targetX !== undefined && p.targetY !== undefined) {
            p.x = lerp(p.x, p.targetX, 0.1);
            p.y = lerp(p.y, p.targetY, 0.1);
          }
        });

        // ─── Z-Key Elevator Interaction ───
        if (keys["KeyZ"] && !window.textBubbleActive) {
          const px = player.x;
          const py = player.y;

          const INTERACT_MARGIN = 16;

          const nearby = (window.interactables || []).find((obj) => {
            const b = obj.bounds;
            return (
              player.x + INTERACT_MARGIN > b.x &&
              player.x - INTERACT_MARGIN < b.x + b.width &&
              player.y + INTERACT_MARGIN > b.y &&
              player.y - INTERACT_MARGIN < b.y + b.height
            );
          });

          if (nearby) {
            console.log("Nearby object:", nearby.label);

            // Hide bubble
            if (nearby.bubble && !nearby.bubble.destroyed) {
              nearby.bubble.destroy({ children: true });
              nearby.bubble = null;
              window.textBubbleActive = false;
            } else {
              // Show bubble
              const bubble = createTextBubble(
                player.x,
                player.y - 50,
                nearby.message,
                3000,
                gameState.camera
              );

              gameState.camera.addChild(bubble);
              nearby.bubble = bubble;
              window.textBubbleActive = true;

              // Reset after duration
              setTimeout(() => {
                window.textBubbleActive = false;
                nearby.bubble = null;
              }, 3000);
            }

            keys["KeyZ"] = false;
          }
        }
      };


      initPixi();

      return () => {
        if (gameStateRef.current.cleanup) gameStateRef.current.cleanup();
        appRef.current?.destroy(true);
      };
    }
  }, [loadingPage, space, playerName]);

  if (loadingPage) return <LoadingScreen />;

  const handleTeleportWithFade = async (loc) => {
    const gameState = gameStateRef.current;
    const { player, world, app, ROOM_GRID } = gameState;
     const ROOM_WIDTH = gameState.worldWidth || 800;
     const ROOM_HEIGHT = gameState.worldHeight || 600;

    setShowFade(true);
    setFadeOpacity(0);
    setFadeOpacity(1);
    await new Promise((res) => setTimeout(res, 400));

    // Move player
    player.x = loc.x;
    player.y = loc.y;

    // Adjust camera
    const centerX = app.screen.width / 2;
    const centerY = app.screen.height / 2;
    world.x = centerX - loc.x;
    world.y = centerY - loc.y;

    world.x = Math.max(-(ROOM_WIDTH - app.screen.width), Math.min(0, world.x));
    world.y = Math.max(
      -(ROOM_HEIGHT - app.screen.height),
      Math.min(0, world.y)
    );

    // ✅ FIXED: Notify other players about the position change
    if (socket && socket.connected) {
      // First emit the movement to update server state
      socket.emit("player-move", {
        position: { x: player.x, y: player.y },
        isMoving: false,
        direction: player.direction || "down",
      });

      // Add a small delay to ensure the server has updated the position
      await new Promise((res) => setTimeout(res, 100));

      console.log(`📡 Sent teleport position update: ${player.x}, ${player.y}`);
    }

    // Fade in
    setFadeOpacity(0);
    await new Promise((res) => setTimeout(res, 400));
    setShowFade(false);
  };

  const changeSpeed = (newspeed) => {
    setSpeed(newspeed);
    if (gameStateRef.current) {
      gameStateRef.current.playerSpeed = newspeed;
    }
  };

  const triggerEmote = (emoji) => {
    const player = gameStateRef.current?.player;
    const world = gameStateRef.current?.world;

    if (!player || !world) return;

    // If an old emote bubble exists, destroy it
    if (player.emoteBubble) {
      world.removeChild(player.emoteBubble);
      player.emoteBubble.destroy();
    }

    // Create container for the entire emote bubble
    const container = new Container();
    container.x = player.x;
    container.y = player.y - 60;
    world.addChild(container);

    // Create bubble background
    const bubble = new Graphics();
    bubble.beginFill(0x000000, 0.8);
    bubble.lineStyle(3, 0xffffff, 1);
    bubble.drawRoundedRect(-35, -25, 70, 50, 15);
    bubble.endFill();

    // Add subtle gradient effect
    bubble.beginFill(0x333333, 0.3);
    bubble.drawRoundedRect(-35, -25, 70, 25, 15);
    bubble.endFill();

    // Create bubble tail
    const tail = new Graphics();
    tail.beginFill(0x000000, 0.8);
    tail.lineStyle(3, 0xffffff, 1);
    tail.moveTo(0, 20);
    tail.lineTo(-8, 35);
    tail.lineTo(8, 35);
    tail.closePath();
    tail.endFill();

    container.addChild(bubble);
    container.addChild(tail);

    // Create emoji text
    const style = new TextStyle({
      fontSize: 28,
      fill: "white",
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 2,
    });

    const text = new Text(emoji, style);
    text.anchor.set(0.5);
    text.x = 0;
    text.y = -5;
    container.addChild(text);

    // Initial state
    container.alpha = 0;
    container.scale.set(0.3);

    player.emoteBubble = container;

    // Enhanced animation with easing
    const startTime = Date.now();
    const totalDuration = 3000;
    const phaseInDuration = 400;
    const phaseOutDuration = 500;
    const holdDuration = totalDuration - phaseInDuration - phaseOutDuration;

    // Easing functions
    const easeOutBack = (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const easeInCubic = (t) => t * t * t;

    const animate = () => {
      if (!player.emoteBubble) return;

      const now = Date.now();
      const elapsed = now - startTime;

      // Update position to follow player
      const targetX = player.x;
      const targetY = player.y - 60;

      // Smooth position interpolation
      container.x += (targetX - container.x) * 0.15;
      container.y += (targetY - container.y) * 0.15;

      if (elapsed < phaseInDuration) {
        // Phase In: Bounce in effect
        const progress = elapsed / phaseInDuration;
        const easedProgress = easeOutBack(progress);

        container.alpha = progress;
        container.scale.set(0.3 + easedProgress * 0.7);

        // Subtle float animation
        const floatOffset = Math.sin(elapsed * 0.01) * 2;
        container.y = targetY + floatOffset;
      } else if (elapsed < phaseInDuration + holdDuration) {
        // Hold Phase: Gentle floating
        container.alpha = 1;
        container.scale.set(1);

        const holdElapsed = elapsed - phaseInDuration;
        const floatOffset = Math.sin(holdElapsed * 0.005) * 3;
        const bobOffset = Math.sin(holdElapsed * 0.008) * 1.5;

        container.y = targetY + floatOffset;
        container.x = targetX + bobOffset;

        // Subtle scale pulsing
        const pulseScale = 1 + Math.sin(holdElapsed * 0.006) * 0.05;
        container.scale.set(pulseScale);
      } else if (elapsed < totalDuration) {
        // Phase Out: Fade and shrink
        const fadeProgress =
          (elapsed - phaseInDuration - holdDuration) / phaseOutDuration;
        const easedFade = easeInCubic(fadeProgress);

        container.alpha = 1 - easedFade;
        container.scale.set(1 - easedFade * 0.3);

        // Float up while fading
        const floatUp = easedFade * 20;
        container.y = targetY - floatUp;
      } else {
        // Animation complete
        world.removeChild(container);
        container.destroy();
        player.emoteBubble = null;
        return;
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    socket.emit("player-emote", {
      id: socket.id,
      emoji,
    });
  };

  const changeAvatar = (avatarKey) => {
    const gameState = gameStateRef.current;
    const createFn = avatarMap[avatarKey];
    if (!createFn || !gameState || !gameState.camera) return;

    // 1. Save current position
    const previousX = gameState.player?.x ?? 400;
    const previousY = gameState.player?.y ?? 300;

    if (gameState.player) {
      if (gameState.player._tickerFn) {
        Ticker.shared.remove(gameState.player._tickerFn);
      }
      gameState.camera.removeChild(gameState.player);
      gameState.player.destroy({ children: true });
      gameState.player = null;
    }

    // 3. Create new avatar
    const newPlayer = createFn(gameState, playerName);

    // 4. Restore previous position
    newPlayer.x = previousX;
    newPlayer.y = previousY;

    socket.emit("avatar-change", {
      avatarKey: avatarKey,
      x: newPlayer.x,
      y: newPlayer.y,
      playerName: playerName,
    });
  };

  const teleportLocations = [
  { label: 'Command Bridge', x: 400, y: 300 },
  { label: 'Observation Deck', x: 800, y: 250 },
  { label: 'Comms Array', x: 1200, y: 200 },
  { label: 'Medical Bay', x: 425, y: 675 },
  { label: 'Research Lab', x: 920, y: 635 },
  { label: 'Corridor A', x: 1400, y: 675 },
  { label: 'Engineering Bay', x: 350, y: 1225 },
  { label: 'Cargo Hold', x: 825, y: 1200 },
  { label: 'Reactor Core', x: 1400, y: 1200 },
  { label: 'Crew Quarters A', x: 175, y: 1580 },
  { label: 'Crew Quarters B', x: 575, y: 1580 },
  { label: 'Mess Hall', x: 1000, y: 1580 },
  { label: 'Recreation', x: 1350, y: 1550 }
];

  const avatarOptions = [
  { src: "/assets/avatar5.png", label: "Spiderman", width: 40, height: 50 },
  { src: "/assets/avatar4.png", label: "Batman", width: 20, height: 45 },
  { src: "/assets/avatar6.png", label: "Male", width: 35, height: 45 },
  { src: "/assets/avatar7.png", label: "Female", width: 35, height: 45 },
];


  return (
    <div
      style={{
        position: "relative",
        width: "125vw", // 100 / 0.8
        height: "125vh",
        overflow: "hidden",
        background: "#1a1a2e",
        transform: "scale(0.8)",
        transformOrigin: "top left",
      }}
    >
      {showBackWarning && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#f87171",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            zIndex: 1000,
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          🚫 Please use the "Leave" button to exit the space.
        </div>
      )}
      {/* Game Canvas - Centered */}
      <div
        ref={canvasRef}
        style={{
          width: "70%",
          height: "80%",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#BDC3C7",
          fontSize: "18px",
          fontFamily: "Arial, sans-serif",
        }}
      ></div>
      {/* Leave Button (Top Center) */}
      <div
        style={{
          position: "absolute",
          top: "0px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 101,
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={() => {
            setShowFade(true);
            setFadeOpacity(1);
            setTimeout(() => {
              window.location.href = "/home";
            }, 500);
          }}
          style={{
            fontFamily: "'Pixelify Sans', cursive",
            fontWeight: "normal",
            imageRendering: "pixelated",
            textRendering: "geometricPrecision",
            background: "#E74C3C",
            color: "white",
            border: "none",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "bold",
            cursor: "pointer",
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            transition: "background 0.3s",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#C0392B")}
          onMouseLeave={(e) => (e.target.style.background = "#E74C3C")}
        >
          Leave Space
        </button>
      </div>
      {showFade && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "black",
            opacity: fadeOpacity,
            transition: "opacity 0.4s ease",
            zIndex: 999,
            pointerEvents: "none",
          }}
        />
      )}
      {/* UI Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 100,
        }}
      >
        {/* 🔥 TOOLBAR TOGGLE BUTTON - Positioned in top-left corner */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={() => setShowToolbar(!showToolbar)}
            style={{
              background: showToolbar ? "#e74c3c" : "#27ae60",
              color: "white",
              border: "2px solid rgba(255,255,255,0.3)",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "Arial, sans-serif",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseOver={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.6)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.5)";
            }}
          >
            <span style={{ fontSize: "14px" }}>{showToolbar ? "✕" : "☰"}</span>
            {showToolbar ? "Hide" : "Show"}
          </button>
        </div>

        {/* Top Bar */}
        <div
          style={{
            position: "absolute",
            top: "50%", // Vertically center
            right: "10px", // Stick to right
            transform: "translateY(-50%)", // True vertical centering
            display: "flex",
            justifyContent: "flex-end", // Align content to right
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "20px 12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              width: "220px", // ⬅️ Smaller width
              height: "160px", // ⬆️ Greater height
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
              Metaverse X ( v1.0.0 )
            </div>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>
              Use WASD to move • Press Z to interact
            </div>
          </div>
        </div>

        {showToolbar && (
          <LeftToolbar
            space={space}
            playerName={playerName}
            gameStateRef={gameStateRef}
            onTeleport={handleTeleportWithFade}
            teleportLocations={teleportLocations}
            avatarOptions={avatarOptions}
            changeSpeed={changeSpeed}
            wallHackEnabled={wallHackEnabled}
            setWallHackEnabled={setWallHackEnabled}
            triggerEmote={triggerEmote}
            changeAvatar={changeAvatar}
            hackPermissions={hackPermissions}
            isOwner={isOwner}
          />
        )}

        <AdminPanel
          isOwner={isOwner}
          onPermissionsChange={handlePermissionsChange}
        />

        {/* Mini Map */}
        {/* <MetaverseMinimap gameStateRef={gameStateRef} /> */}

        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            background: "rgba(0,0,0,0.8)",
            borderRadius: "8px",
            padding: "12px",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            👥 Online Players ({onlinePlayers.length})
          </div>
          {onlinePlayers.map((name, index) => (
            <div
              key={name}
              style={{
                color: index === 0 ? "#3498DB" : "#BDC3C7",
                fontSize: "11px",
                marginBottom: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: index === 0 ? "#27AE60" : "#95A5A6",
                  marginRight: "8px",
                }}
              />
              {name} {index === 0 && "(You)"}
            </div>
          ))}
                
        </div>
      </div>
        
    </div>
  );
}

export default SpaceStation;
