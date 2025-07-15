import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getSpaceById } from "../api";
import { getUser } from "../api";
import LoadingScreen from "../components/LoadingScreen";
import {
  Application,
  Graphics,
  Container,
  Text,
  TextStyle,
  Ticker,
} from "pixi.js";
import MetaverseMinimap from "../components/Minimap";
import LeftToolbar from "../components/Toolbar";
import { io } from "socket.io-client";
import useUser from "../hooks/useUser";
import AdminPanel from "../components/AdminPanel";

const MetaverseWorld = () => {
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

    // Professional color palette for office girl
    const skinColor = 0xf4c2a1;
    const skinShadow = 0xe6b596;
    const blouseColor = 0xffffff; // White blouse
    const blouseShadow = 0xe8e8e8;
    const suitColor = 0x2c3e50; // Navy blue suit
    const suitShadow = 0x1a252f;
    const hairColor = 0x4a4a4a; // Dark brown/black hair
    const hairHighlight = 0x666666;
    const shoeColor = 0x000000; // Black heels
    const stockingColor = 0xf5deb3; // Nude stockings

    // Player body (white blouse)
    player.beginFill(blouseColor);
    player.drawRect(-8, -5, 16, 18);
    player.endFill();

    // Blouse shadow/depth
    player.beginFill(blouseShadow);
    player.drawRect(-8, 11, 16, 2);
    player.endFill();

    // Professional collar
    player.beginFill(blouseShadow);
    player.drawRect(-7, -4, 14, 3);
    player.endFill();

    // Suit jacket/blazer
    player.beginFill(suitColor);
    player.drawRect(-9, -3, 18, 16);
    player.endFill();

    // Jacket shadow
    player.beginFill(suitShadow);
    player.drawRect(-9, 11, 18, 2);
    player.endFill();

    // Jacket lapels
    player.beginFill(suitShadow);
    player.drawRect(-8, -2, 6, 8);
    player.drawRect(2, -2, 6, 8);
    player.endFill();

    // Showing white blouse underneath
    player.beginFill(blouseColor);
    player.drawRect(-2, -2, 4, 8);
    player.endFill();

    // Head with better shading
    player.beginFill(skinColor);
    player.drawRect(-6, -18, 12, 12);
    player.endFill();

    // Face shadow
    player.beginFill(skinShadow);
    player.drawRect(-6, -8, 12, 2);
    player.endFill();

    // Professional hair (neat bun/updo)
    player.beginFill(hairColor);
    player.drawRect(-7, -19, 14, 7);
    player.endFill();

    // Hair bun at back
    player.beginFill(hairColor);
    player.drawRect(-3, -21, 6, 4);
    player.endFill();

    // Hair highlights (subtle)
    player.beginFill(hairHighlight);
    player.drawRect(-6, -18, 3, 4);
    player.endFill();

    // Side part
    player.beginFill(hairHighlight);
    player.drawRect(-1, -19, 1, 6);
    player.endFill();

    // Eyes (professional makeup)
    player.beginFill(0xffffff);
    player.drawRect(-4, -15, 2, 2);
    player.drawRect(2, -15, 2, 2);
    player.endFill();

    // Eye pupils
    player.beginFill(0x000000);
    player.drawRect(-3.5, -14.5, 1, 1);
    player.drawRect(2.5, -14.5, 1, 1);
    player.endFill();

    // Subtle eyeliner
    player.beginFill(0x000000);
    player.drawRect(-4, -16, 2, 0.5);
    player.drawRect(2, -16, 2, 0.5);
    player.endFill();

    // Nose
    player.beginFill(skinShadow);
    player.drawRect(-0.5, -12, 1, 1);
    player.endFill();

    // Professional lipstick (subtle)
    player.beginFill(0xd63384);
    player.drawRect(-1, -10, 2, 1);
    player.endFill();

    // Arms in suit jacket
    armLeft.beginFill(suitColor);
    armLeft.drawRect(-10, -2, 3, 12);
    armLeft.endFill();

    // Jacket cuffs
    armLeft.beginFill(suitShadow);
    armLeft.drawRect(-10, 8, 3, 2);
    armLeft.endFill();

    // Hand showing
    armLeft.beginFill(skinColor);
    armLeft.drawRect(-9, 10, 2, 3);
    armLeft.endFill();

    armRight.beginFill(suitColor);
    armRight.drawRect(7, -2, 3, 12);
    armRight.endFill();

    armRight.beginFill(suitShadow);
    armRight.drawRect(7, 8, 3, 2);
    armRight.endFill();

    armRight.beginFill(skinColor);
    armRight.drawRect(7, 10, 2, 3);
    armRight.endFill();

    player.addChild(armLeft);
    player.addChild(armRight);

    // Professional pencil skirt
    player.beginFill(suitColor);
    player.drawRect(-7, 13, 14, 10);
    player.endFill();

    // Skirt shadow
    player.beginFill(suitShadow);
    player.drawRect(-7, 21, 14, 2);
    player.endFill();

    // Legs with stockings
    legLeft.beginFill(stockingColor);
    legLeft.drawRect(-5, 23, 4, 6);
    legLeft.endFill();

    legRight.beginFill(stockingColor);
    legRight.drawRect(1, 23, 4, 6);
    legRight.endFill();

    player.addChild(legLeft);
    player.addChild(legRight);

    // Professional heels
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(shoeColor);
    shoeLeft.drawRect(-6, 29, 5, 3);
    shoeLeft.endFill();

    // Heel
    shoeLeft.beginFill(shoeColor);
    shoeLeft.drawRect(-3, 32, 2, 2);
    shoeLeft.endFill();

    // Shoe highlight
    shoeLeft.beginFill(0x333333);
    shoeLeft.drawRect(-6, 29, 5, 1);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(shoeColor);
    shoeRight.drawRect(1, 29, 5, 3);
    shoeRight.endFill();

    // Heel
    shoeRight.beginFill(shoeColor);
    shoeRight.drawRect(2, 32, 2, 2);
    shoeRight.endFill();

    // Shoe highlight
    shoeRight.beginFill(0x333333);
    shoeRight.drawRect(1, 29, 5, 1);
    shoeRight.endFill();

    player.addChild(shoeLeft);
    player.addChild(shoeRight);

    // Name tag
    let tickerFn = null;
    // Name tag with better styling
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

        // Leg animation (opposite swing)
        legLeft.y = 0 + legAngle;
        legRight.y = 0 - legAngle;

        // Arm animation (opposite to legs for natural walking)
        armLeft.y = 0 - armAngle * 0.7;
        armRight.y = 0 + armAngle * 0.7;

        // Slight arm rotation
        armLeft.rotation = -armAngle * 0.1;
        armRight.rotation = armAngle * 0.1;

        // Body bobbing
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== shoeLeft &&
            child !== shoeRight
          ) {
            child.y += Math.sin(walkFrame * 2) * 0.3;
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

        // Reset body parts to original positions
        // Body bobbing (exclude nameTag)
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== shoeLeft &&
            child !== shoeRight &&
            child !== nameTag
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
      const speed = 2;

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
  const createMalePlayer = (gameState, playerName = "You") => {
    let tickerFn = null;
    const player = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Enhanced color palette for casual male
    const skinColor = 0xd4a574; // Slightly different skin tone
    const skinShadow = 0xc19660;
    const hoodieColor = 0x27ae60; // Green hoodie
    const hoodieShadow = 0x229954;
    const jeansColor = 0x34495e; // Dark blue jeans
    const jeansShadow = 0x2c3e50;
    const hairColor = 0x2c3e50; // Dark hair
    const sneakerColor = 0xff6b6b; // Red sneakers

    // Player body (hoodie)
    player.beginFill(hoodieColor);
    player.drawRect(-9, -5, 18, 22);
    player.endFill();

    // Hoodie shadow
    player.beginFill(hoodieShadow);
    player.drawRect(-9, 15, 18, 2);
    player.endFill();

    // Hoodie pocket
    player.beginFill(hoodieShadow);
    player.drawRect(-6, 5, 12, 8);
    player.endFill();

    // Hoodie strings
    player.beginFill(0xffffff);
    player.drawRect(-2, -3, 1, 8);
    player.drawRect(1, -3, 1, 8);
    player.endFill();

    // Head
    player.beginFill(skinColor);
    player.drawRect(-6, -18, 12, 12);
    player.endFill();

    // Face shadow
    player.beginFill(skinShadow);
    player.drawRect(-6, -8, 12, 2);
    player.endFill();

    // Messy hair style
    player.beginFill(hairColor);
    player.drawRect(-7, -19, 14, 7);
    player.endFill();

    // Hair spikes/texture
    player.beginFill(0x1a252f);
    player.drawRect(-6, -18, 2, 3);
    player.drawRect(-2, -19, 2, 3);
    player.drawRect(2, -18, 2, 3);
    player.drawRect(5, -17, 2, 2);
    player.endFill();

    // Eyes with different expression
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

    // Slight smile
    player.beginFill(skinShadow);
    player.drawRect(-1, -10, 3, 1);
    player.endFill();

    // Arms in hoodie sleeves
    armLeft.beginFill(hoodieColor);
    armLeft.drawRect(-11, -2, 4, 14);
    armLeft.endFill();

    // Sleeve cuffs
    armLeft.beginFill(hoodieShadow);
    armLeft.drawRect(-11, 10, 4, 2);
    armLeft.endFill();

    // Hand showing
    armLeft.beginFill(skinColor);
    armLeft.drawRect(-10, 12, 2, 3);
    armLeft.endFill();

    armRight.beginFill(hoodieColor);
    armRight.drawRect(7, -2, 4, 14);
    armRight.endFill();

    armRight.beginFill(hoodieShadow);
    armRight.drawRect(7, 10, 4, 2);
    armRight.endFill();

    armRight.beginFill(skinColor);
    armRight.drawRect(8, 12, 2, 3);
    armRight.endFill();

    player.addChild(armLeft);
    player.addChild(armRight);

    // Jeans
    legLeft.beginFill(jeansColor);
    legLeft.drawRect(-7, 17, 6, 10);
    legLeft.endFill();

    // Jeans shadow
    legLeft.beginFill(jeansShadow);
    legLeft.drawRect(-7, 25, 6, 2);
    legLeft.endFill();

    // Jeans stitching
    legLeft.beginFill(0x5d6d7e);
    legLeft.drawRect(-6, 17, 1, 10);
    legLeft.endFill();

    legRight.beginFill(jeansColor);
    legRight.drawRect(1, 17, 6, 10);
    legRight.endFill();

    legRight.beginFill(jeansShadow);
    legRight.drawRect(1, 25, 6, 2);
    legRight.endFill();

    legRight.beginFill(0x5d6d7e);
    legRight.drawRect(5, 17, 1, 10);
    legRight.endFill();

    player.addChild(legLeft);
    player.addChild(legRight);

    // Sneakers
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(sneakerColor);
    shoeLeft.drawRect(-8, 27, 7, 4);
    shoeLeft.endFill();

    // Sneaker sole
    shoeLeft.beginFill(0xffffff);
    shoeLeft.drawRect(-8, 30, 7, 1);
    shoeLeft.endFill();

    // Sneaker details
    shoeLeft.beginFill(0xffffff);
    shoeLeft.drawRect(-7, 28, 5, 1);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(sneakerColor);
    shoeRight.drawRect(1, 27, 7, 4);
    shoeRight.endFill();

    shoeRight.beginFill(0xffffff);
    shoeRight.drawRect(1, 30, 7, 1);
    shoeRight.endFill();

    shoeRight.beginFill(0xffffff);
    shoeRight.drawRect(2, 28, 5, 1);
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

        // Leg animation (opposite swing)
        legLeft.y = 0 + legAngle;
        legRight.y = 0 - legAngle;

        // Arm animation (opposite to legs for natural walking)
        armLeft.y = 0 - armAngle * 0.7;
        armRight.y = 0 + armAngle * 0.7;

        // Slight arm rotation
        armLeft.rotation = -armAngle * 0.1;
        armRight.rotation = armAngle * 0.1;

        // Body bobbing
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== shoeLeft &&
            child !== shoeRight
          ) {
            child.y += Math.sin(walkFrame * 2) * 0.3;
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

        // Reset body parts to original positions
        // Body bobbing (exclude nameTag)
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== shoeLeft &&
            child !== shoeRight &&
            child !== nameTag
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
      const speed = 2;

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

  const createPlayer = (gameState, playerName = "You") => {
    const player = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Enhanced color palette
    const skinColor = 0xf4c2a1;
    const skinShadow = 0xe6b596;
    const shirtColor = 0x3498db;
    const shirtShadow = 0x2980b9;
    const pantsColor = 0x2c3e50;
    const pantsShadow = 0x1a252f;
    const hairColor = 0x4b2e1e;
    const shoeColor = 0x000000;

    // Player body with depth
    player.beginFill(shirtColor);
    player.drawRect(-8, -5, 16, 20);
    player.endFill();

    // Body shadow/depth
    player.beginFill(shirtShadow);
    player.drawRect(-8, 13, 16, 2);
    player.endFill();

    // Shirt collar
    player.beginFill(shirtShadow);
    player.drawRect(-7, -4, 14, 3);
    player.endFill();

    // Head with better shading
    player.beginFill(skinColor);
    player.drawRect(-6, -18, 12, 12);
    player.endFill();

    // Face shadow
    player.beginFill(skinShadow);
    player.drawRect(-6, -8, 12, 2);
    player.endFill();

    // Hair with more detail
    player.beginFill(hairColor);
    player.drawRect(-7, -19, 14, 6);
    player.endFill();

    // Hair highlight
    player.beginFill(0x6b4423);
    player.drawRect(-6, -18, 3, 4);
    player.endFill();

    // Eyes with pupils
    player.beginFill(0xffffff);
    player.drawRect(-4, -15, 2, 2);
    player.drawRect(2, -15, 2, 2);
    player.endFill();

    // Eye pupils
    player.beginFill(0x000000);
    player.drawRect(-3.5, -14.5, 1, 1);
    player.drawRect(2.5, -14.5, 1, 1);
    player.endFill();

    // Nose (small dot)
    player.beginFill(skinShadow);
    player.drawRect(-0.5, -12, 1, 1);
    player.endFill();

    // Arms (separate for animation)
    armLeft.beginFill(skinColor);
    armLeft.drawRect(-10, -2, 3, 12);
    armLeft.endFill();

    // Left arm shadow
    armLeft.beginFill(skinShadow);
    armLeft.drawRect(-8, 8, 3, 2);
    armLeft.endFill();

    armRight.beginFill(skinColor);
    armRight.drawRect(7, -2, 3, 12);
    armRight.endFill();

    // Right arm shadow
    armRight.beginFill(skinShadow);
    armRight.drawRect(7, 8, 3, 2);
    armRight.endFill();

    player.addChild(armLeft);
    player.addChild(armRight);

    // Legs with better detail
    legLeft.beginFill(pantsColor);
    legLeft.drawRect(-6, 15, 5, 12);
    legLeft.endFill();

    // Left leg shadow
    legLeft.beginFill(pantsShadow);
    legLeft.drawRect(-6, 25, 5, 2);
    legLeft.endFill();

    legRight.beginFill(pantsColor);
    legRight.drawRect(1, 15, 5, 12);
    legRight.endFill();

    // Right leg shadow
    legRight.beginFill(pantsShadow);
    legRight.drawRect(1, 25, 5, 2);
    legRight.endFill();

    player.addChild(legLeft);
    player.addChild(legRight);

    // Enhanced shoes
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(shoeColor);
    shoeLeft.drawRect(-7, 27, 6, 4);
    shoeLeft.endFill();

    // Shoe highlight
    shoeLeft.beginFill(0x333333);
    shoeLeft.drawRect(-7, 27, 6, 1);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(shoeColor);
    shoeRight.drawRect(1, 27, 6, 4);
    shoeRight.endFill();

    // Shoe highlight
    shoeRight.beginFill(0x333333);
    shoeRight.drawRect(1, 27, 6, 1);
    shoeRight.endFill();

    player.addChild(shoeLeft);
    player.addChild(shoeRight);

    // Belt detail
    player.beginFill(0x8b4513);
    player.drawRect(-8, 13, 16, 2);
    player.endFill();

    // Belt buckle
    player.beginFill(0xffd700);
    player.drawRect(-1, 13.5, 2, 1);
    player.endFill();

    let tickerFn = null;
    // Name tag with better styling
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

        // Leg animation (opposite swing)
        legLeft.y = 0 + legAngle;
        legRight.y = 0 - legAngle;

        // Arm animation (opposite to legs for natural walking)
        armLeft.y = 0 - armAngle * 0.7;
        armRight.y = 0 + armAngle * 0.7;

        // Slight arm rotation
        armLeft.rotation = -armAngle * 0.1;
        armRight.rotation = armAngle * 0.1;

        // Body bobbing
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== shoeLeft &&
            child !== shoeRight
          ) {
            child.y += Math.sin(walkFrame * 2) * 0.3;
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

        // Reset body parts to original positions
        // Body bobbing (exclude nameTag)
        player.children.forEach((child) => {
          if (
            child !== legLeft &&
            child !== legRight &&
            child !== shoeLeft &&
            child !== shoeRight &&
            child !== nameTag
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
      const speed = 2;

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

    // Enhanced color palette (slightly different from main player)
    const skinColor = 0xe0ac69;
    const skinShadow = 0xd49c5a;
    const shirtColor = 0x6b7280; // Gray instead of blue
    const shirtShadow = 0x4b5563;
    const pantsColor = 0x374151;
    const pantsShadow = 0x1f2937;
    const hairColor = 0x8b4513;
    const shoeColor = 0x000000;

    // Create main body graphics
    const body = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Enhanced body with depth
    body.beginFill(shirtColor);
    body.drawRect(-8, -5, 16, 20);
    body.endFill();

    // Body shadow/depth
    body.beginFill(shirtShadow);
    body.drawRect(-8, 13, 16, 2);
    body.endFill();

    // Shirt collar
    body.beginFill(shirtShadow);
    body.drawRect(-7, -4, 14, 3);
    body.endFill();

    // Head with better shading
    body.beginFill(skinColor);
    body.drawRect(-6, -18, 12, 12);
    body.endFill();

    // Face shadow
    body.beginFill(skinShadow);
    body.drawRect(-6, -8, 12, 2);
    body.endFill();

    // Hair with more detail
    body.beginFill(hairColor);
    body.drawRect(-7, -19, 14, 6);
    body.endFill();

    // Hair highlight
    body.beginFill(0xa0522d);
    body.drawRect(-6, -18, 3, 4);
    body.endFill();

    // Eyes with pupils
    body.beginFill(0xffffff);
    body.drawRect(-4, -15, 2, 2);
    body.drawRect(2, -15, 2, 2);
    body.endFill();

    // Eye pupils
    body.beginFill(0x000000);
    body.drawRect(-3.5, -14.5, 1, 1);
    body.drawRect(2.5, -14.5, 1, 1);
    body.endFill();

    // Nose (small dot)
    body.beginFill(skinShadow);
    body.drawRect(-0.5, -12, 1, 1);
    body.endFill();

    // Enhanced arms (separate for animation)
    armLeft.beginFill(skinColor);
    armLeft.drawRect(-10, -2, 3, 12);
    armLeft.endFill();

    // Left arm shadow
    armLeft.beginFill(skinShadow);
    armLeft.drawRect(-8, 8, 3, 2);
    armLeft.endFill();

    armRight.beginFill(skinColor);
    armRight.drawRect(7, -2, 3, 12);
    armRight.endFill();

    // Right arm shadow
    armRight.beginFill(skinShadow);
    armRight.drawRect(7, 8, 3, 2);
    armRight.endFill();

    // Enhanced legs with better detail
    legLeft.beginFill(pantsColor);
    legLeft.drawRect(-6, 15, 5, 12);
    legLeft.endFill();

    // Left leg shadow
    legLeft.beginFill(pantsShadow);
    legLeft.drawRect(-6, 25, 5, 2);
    legLeft.endFill();

    legRight.beginFill(pantsColor);
    legRight.drawRect(1, 15, 5, 12);
    legRight.endFill();

    // Right leg shadow
    legRight.beginFill(pantsShadow);
    legRight.drawRect(1, 25, 5, 2);
    legRight.endFill();

    // Enhanced shoes
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(shoeColor);
    shoeLeft.drawRect(-7, 27, 6, 4);
    shoeLeft.endFill();

    // Shoe highlight
    shoeLeft.beginFill(0x333333);
    shoeLeft.drawRect(-7, 27, 6, 1);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(shoeColor);
    shoeRight.drawRect(1, 27, 6, 4);
    shoeRight.endFill();

    // Shoe highlight
    shoeRight.beginFill(0x333333);
    shoeRight.drawRect(1, 27, 6, 1);
    shoeRight.endFill();

    // Belt detail
    body.beginFill(0x8b4513);
    body.drawRect(-8, 13, 16, 2);
    body.endFill();

    // Belt buckle
    body.beginFill(0xffd700);
    body.drawRect(-1, 13.5, 2, 1);
    body.endFill();

    // Name Tag with better styling
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

    // Add all parts to container
    container.addChild(body);
    container.addChild(armLeft);
    container.addChild(armRight);
    container.addChild(legLeft);
    container.addChild(legRight);
    container.addChild(shoeLeft);
    container.addChild(shoeRight);
    container.addChild(nameTag);

    // Position the container
    container.x = position.x;
    container.y = position.y;

    // Animation state
    let walking = false;
    let walkFrame = 0;
    let direction = "down";
    let stopTimeout = null;
    const walkSpeed = 0.3;
    const legSwingAmount = 4;
    const armSwingAmount = 3;
    const bodyBobAmount = 1;

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

        // Slight arm rotation
        armLeft.rotation = -armAngle * 0.1;
        armRight.rotation = armAngle * 0.1;

        // Body bobbing
        body.y = originalPositions.body.y + Math.sin(walkFrame * 2) * 0.3;

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

  const createOtherMalePlayer = (name, position) => {
    const container = new Container();

    // Enhanced color palette for casual male (same as createMalePlayer)
    const skinColor = 0xd4a574; // Slightly different skin tone
    const skinShadow = 0xc19660;
    const hoodieColor = 0x27ae60; // Green hoodie
    const hoodieShadow = 0x229954;
    const jeansColor = 0x34495e; // Dark blue jeans
    const jeansShadow = 0x2c3e50;
    const hairColor = 0x2c3e50; // Dark hair
    const sneakerColor = 0xff6b6b; // Red sneakers

    // Create main body graphics
    const body = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Player body (hoodie)
    body.beginFill(hoodieColor);
    body.drawRect(-9, -5, 18, 22);
    body.endFill();

    // Hoodie shadow
    body.beginFill(hoodieShadow);
    body.drawRect(-9, 15, 18, 2);
    body.endFill();

    // Hoodie pocket
    body.beginFill(hoodieShadow);
    body.drawRect(-6, 5, 12, 8);
    body.endFill();

    // Hoodie strings
    body.beginFill(0xffffff);
    body.drawRect(-2, -3, 1, 8);
    body.drawRect(1, -3, 1, 8);
    body.endFill();

    // Head
    body.beginFill(skinColor);
    body.drawRect(-6, -18, 12, 12);
    body.endFill();

    // Face shadow
    body.beginFill(skinShadow);
    body.drawRect(-6, -8, 12, 2);
    body.endFill();

    // Messy hair style
    body.beginFill(hairColor);
    body.drawRect(-7, -19, 14, 7);
    body.endFill();

    // Hair spikes/texture
    body.beginFill(0x1a252f);
    body.drawRect(-6, -18, 2, 3);
    body.drawRect(-2, -19, 2, 3);
    body.drawRect(2, -18, 2, 3);
    body.drawRect(5, -17, 2, 2);
    body.endFill();

    // Eyes with different expression
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

    // Slight smile
    body.beginFill(skinShadow);
    body.drawRect(-1, -10, 3, 1);
    body.endFill();

    // Arms in hoodie sleeves
    armLeft.beginFill(hoodieColor);
    armLeft.drawRect(-11, -2, 4, 14);
    armLeft.endFill();

    // Sleeve cuffs
    armLeft.beginFill(hoodieShadow);
    armLeft.drawRect(-11, 10, 4, 2);
    armLeft.endFill();

    // Hand showing
    armLeft.beginFill(skinColor);
    armLeft.drawRect(-10, 12, 2, 3);
    armLeft.endFill();

    armRight.beginFill(hoodieColor);
    armRight.drawRect(7, -2, 4, 14);
    armRight.endFill();

    armRight.beginFill(hoodieShadow);
    armRight.drawRect(7, 10, 4, 2);
    armRight.endFill();

    armRight.beginFill(skinColor);
    armRight.drawRect(8, 12, 2, 3);
    armRight.endFill();

    // Jeans
    legLeft.beginFill(jeansColor);
    legLeft.drawRect(-7, 17, 6, 10);
    legLeft.endFill();

    // Jeans shadow
    legLeft.beginFill(jeansShadow);
    legLeft.drawRect(-7, 25, 6, 2);
    legLeft.endFill();

    // Jeans stitching
    legLeft.beginFill(0x5d6d7e);
    legLeft.drawRect(-6, 17, 1, 10);
    legLeft.endFill();

    legRight.beginFill(jeansColor);
    legRight.drawRect(1, 17, 6, 10);
    legRight.endFill();

    legRight.beginFill(jeansShadow);
    legRight.drawRect(1, 25, 6, 2);
    legRight.endFill();

    legRight.beginFill(0x5d6d7e);
    legRight.drawRect(5, 17, 1, 10);
    legRight.endFill();

    // Sneakers
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(sneakerColor);
    shoeLeft.drawRect(-8, 27, 7, 4);
    shoeLeft.endFill();

    // Sneaker sole
    shoeLeft.beginFill(0xffffff);
    shoeLeft.drawRect(-8, 30, 7, 1);
    shoeLeft.endFill();

    // Sneaker details
    shoeLeft.beginFill(0xffffff);
    shoeLeft.drawRect(-7, 28, 5, 1);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(sneakerColor);
    shoeRight.drawRect(1, 27, 7, 4);
    shoeRight.endFill();

    shoeRight.beginFill(0xffffff);
    shoeRight.drawRect(1, 30, 7, 1);
    shoeRight.endFill();

    shoeRight.beginFill(0xffffff);
    shoeRight.drawRect(2, 28, 5, 1);
    shoeRight.endFill();

    // Name Tag with better styling
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
    const legSwingAmount = 4;
    const armSwingAmount = 3;
    const bodyBobAmount = 1;

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

        // Slight arm rotation
        armLeft.rotation = -armAngle * 0.1;
        armRight.rotation = armAngle * 0.1;

        // Body bobbing - affect all body parts except legs and shoes
        const bodyBobOffset = Math.sin(walkFrame * 2) * 0.3;
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

    // Professional color palette for office girl (same as createGirlPlayer)
    const skinColor = 0xf4c2a1;
    const skinShadow = 0xe6b596;
    const blouseColor = 0xffffff; // White blouse
    const blouseShadow = 0xe8e8e8;
    const suitColor = 0x2c3e50; // Navy blue suit
    const suitShadow = 0x1a252f;
    const hairColor = 0x4a4a4a; // Dark brown/black hair
    const hairHighlight = 0x666666;
    const shoeColor = 0x000000; // Black heels
    const stockingColor = 0xf5deb3; // Nude stockings

    // Create main body graphics
    const body = new Graphics();
    const legLeft = new Graphics();
    const legRight = new Graphics();
    const armLeft = new Graphics();
    const armRight = new Graphics();

    // Player body (white blouse)
    body.beginFill(blouseColor);
    body.drawRect(-8, -5, 16, 18);
    body.endFill();

    // Blouse shadow/depth
    body.beginFill(blouseShadow);
    body.drawRect(-8, 11, 16, 2);
    body.endFill();

    // Professional collar
    body.beginFill(blouseShadow);
    body.drawRect(-7, -4, 14, 3);
    body.endFill();

    // Suit jacket/blazer
    body.beginFill(suitColor);
    body.drawRect(-9, -3, 18, 16);
    body.endFill();

    // Jacket shadow
    body.beginFill(suitShadow);
    body.drawRect(-9, 11, 18, 2);
    body.endFill();

    // Jacket lapels
    body.beginFill(suitShadow);
    body.drawRect(-8, -2, 6, 8);
    body.drawRect(2, -2, 6, 8);
    body.endFill();

    // Showing white blouse underneath
    body.beginFill(blouseColor);
    body.drawRect(-2, -2, 4, 8);
    body.endFill();

    // Head with better shading
    body.beginFill(skinColor);
    body.drawRect(-6, -18, 12, 12);
    body.endFill();

    // Face shadow
    body.beginFill(skinShadow);
    body.drawRect(-6, -8, 12, 2);
    body.endFill();

    // Professional hair (neat bun/updo)
    body.beginFill(hairColor);
    body.drawRect(-7, -19, 14, 7);
    body.endFill();

    // Hair bun at back
    body.beginFill(hairColor);
    body.drawRect(-3, -21, 6, 4);
    body.endFill();

    // Hair highlights (subtle)
    body.beginFill(hairHighlight);
    body.drawRect(-6, -18, 3, 4);
    body.endFill();

    // Side part
    body.beginFill(hairHighlight);
    body.drawRect(-1, -19, 1, 6);
    body.endFill();

    // Eyes (professional makeup)
    body.beginFill(0xffffff);
    body.drawRect(-4, -15, 2, 2);
    body.drawRect(2, -15, 2, 2);
    body.endFill();

    // Eye pupils
    body.beginFill(0x000000);
    body.drawRect(-3.5, -14.5, 1, 1);
    body.drawRect(2.5, -14.5, 1, 1);
    body.endFill();

    // Subtle eyeliner
    body.beginFill(0x000000);
    body.drawRect(-4, -16, 2, 0.5);
    body.drawRect(2, -16, 2, 0.5);
    body.endFill();

    // Nose
    body.beginFill(skinShadow);
    body.drawRect(-0.5, -12, 1, 1);
    body.endFill();

    // Professional lipstick (subtle)
    body.beginFill(0xd63384);
    body.drawRect(-1, -10, 2, 1);
    body.endFill();

    // Professional pencil skirt
    body.beginFill(suitColor);
    body.drawRect(-7, 13, 14, 10);
    body.endFill();

    // Skirt shadow
    body.beginFill(suitShadow);
    body.drawRect(-7, 21, 14, 2);
    body.endFill();

    // Arms in suit jacket
    armLeft.beginFill(suitColor);
    armLeft.drawRect(-10, -2, 3, 12);
    armLeft.endFill();

    // Jacket cuffs
    armLeft.beginFill(suitShadow);
    armLeft.drawRect(-10, 8, 3, 2);
    armLeft.endFill();

    // Hand showing
    armLeft.beginFill(skinColor);
    armLeft.drawRect(-9, 10, 2, 3);
    armLeft.endFill();

    armRight.beginFill(suitColor);
    armRight.drawRect(7, -2, 3, 12);
    armRight.endFill();

    armRight.beginFill(suitShadow);
    armRight.drawRect(7, 8, 3, 2);
    armRight.endFill();

    armRight.beginFill(skinColor);
    armRight.drawRect(7, 10, 2, 3);
    armRight.endFill();

    // Legs with stockings
    legLeft.beginFill(stockingColor);
    legLeft.drawRect(-5, 23, 4, 6);
    legLeft.endFill();

    legRight.beginFill(stockingColor);
    legRight.drawRect(1, 23, 4, 6);
    legRight.endFill();

    // Professional heels
    const shoeLeft = new Graphics();
    shoeLeft.beginFill(shoeColor);
    shoeLeft.drawRect(-6, 29, 5, 3);
    shoeLeft.endFill();

    // Heel
    shoeLeft.beginFill(shoeColor);
    shoeLeft.drawRect(-3, 32, 2, 2);
    shoeLeft.endFill();

    // Shoe highlight
    shoeLeft.beginFill(0x333333);
    shoeLeft.drawRect(-6, 29, 5, 1);
    shoeLeft.endFill();

    const shoeRight = new Graphics();
    shoeRight.beginFill(shoeColor);
    shoeRight.drawRect(1, 29, 5, 3);
    shoeRight.endFill();

    // Heel
    shoeRight.beginFill(shoeColor);
    shoeRight.drawRect(2, 32, 2, 2);
    shoeRight.endFill();

    // Shoe highlight
    shoeRight.beginFill(0x333333);
    shoeRight.drawRect(1, 29, 5, 1);
    shoeRight.endFill();

    // Name Tag with better styling
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
    const legSwingAmount = 4;
    const armSwingAmount = 3;
    const bodyBobAmount = 1;

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

        // Slight arm rotation
        armLeft.rotation = -armAngle * 0.1;
        armRight.rotation = armAngle * 0.1;

        // Body bobbing
        const bodyBobOffset = Math.sin(walkFrame * 2) * 0.3;
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

  // Modified setupPlayerAnimation for other players (doesn't interfere with main player)
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

  const socket = io("http://localhost:5000"); // ✅ change port if different
  socket.on("connect", () => {
    console.log("🟢 Connected:", socket.id);
    gameStateRef.current.socketId = socket.id;
  });

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

        createWorldGrid(gameState);
        populateRooms(gameState);
        createFn(gameState, playerName);
        setupSocketListeners(gameState);

        // ✅ Now emit player-join after everything is ready
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
          // const updated = [];

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
            // updated.push(data.name);
          }
          if (!isOwner) {
            setTimeout(() => {
              socket.emit("requestPermissions");
            }, 500);
          }
          // setOnlinePlayers([playerName, ...updated]);
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
          // setOnlinePlayers(prev => [...prev, data.name]);
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
          console.log(
            `🏃 Was moving:`,
            wasMoving,
            `Direction:`,
            currentDirection
          );

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

          console.log(
            `✅ Player ${currentName} changed avatar to: ${avatarKey}`
          );
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
            // const name = player.playerName || "Unknown";
            delete gameState.otherPlayers[id];
            // setOnlinePlayers(prev => prev.filter(n => n !== name));
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

      const createWorldGrid = (gameState) => {
        const { camera, ROOM_GRID } = gameState;
        const { rows, cols, roomWidth, roomHeight } = ROOM_GRID;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const offsetX = c * roomWidth;
            const offsetY = r * roomHeight;

            const room = new Container();
            room.x = offsetX;
            room.y = offsetY;

            const tileSize = gameState.TILE_SIZE;

            for (let y = 0; y < roomHeight; y += tileSize) {
              for (let x = 0; x < roomWidth; x += tileSize) {
                const tile = createFloorTile(x, y, tileSize);
                room.addChild(tile);
              }
            }
            const walls = createWalls(
              roomWidth,
              roomHeight,
              r,
              c,
              ROOM_GRID,
              gameState.colliders,
              offsetX,
              offsetY
            );
            walls.forEach((wall) => room.addChild(wall));

            if (r === 0 && c === 1) createOfficeFurniture(gameState, room);

            const label = new Text({
              text: `Room (${r}, ${c})`,
              style: new TextStyle({
                fontSize: 10,
                fill: 0xffffff,
                fontFamily: "Courier New",
                stroke: { color: 0x000000, width: 2 },
              }),
            });
            label.x = roomWidth / 2;
            label.y = 10;
            label.anchor.set(0.5);
            room.addChild(label);

            camera.addChild(room);
          }
        }
      };

      const addWithCollider = (container, displayObject, bounds, colliders) => {
        container.addChild(displayObject);
        colliders.push(bounds);
      };

      const createCat = (x, y, f1 = true, camera, colliders) => {
        const cat = new Container();

        // Animation variables
        let animationTime = 0;
        let sleepCycle = 0;
        let tailWag = 0;
        let breathing = 0;
        let eyeBlink = 0;
        let purring = false;

        // Create cat parts
        const createCatParts = () => {
          // Shadow/ground
          const shadow = new Graphics();
          shadow.beginFill(0x4a3c28, 0.3);
          shadow.drawEllipse(0, 18, 35, 8);
          shadow.endFill();

          // Cat body (main oval)
          const body = new Graphics();
          if (f1 === true) body.beginFill(0xf4d03f); //B2BEB5
          else body.beginFill(0xb2beb5); //B2BEB5
          body.drawEllipse(0, 0, 22, 10);
          body.endFill();

          // Body stripes
          const stripes = new Graphics();
          if (f1 === true) stripes.beginFill(0xe67e22); //7393B3
          else stripes.beginFill(0x7393b3); //7393B3
          stripes.drawRect(-18, -8, 3, 16);
          stripes.drawRect(-12, -10, 3, 20);
          stripes.drawRect(-4, -8, 3, 16);
          stripes.drawRect(4, -10, 3, 20);
          stripes.drawRect(12, -8, 3, 13);
          stripes.endFill();

          // Tail
          const tail = new Graphics();
          if (f1 === true) tail.beginFill(0xf4d03f);
          else tail.beginFill(0xb2beb5);
          tail.drawEllipse(0, 0, 10, 4);
          tail.endFill();

          // Tail stripes
          const tailStripes = new Graphics();
          if (f1 === true) tailStripes.beginFill(0xe67e22);
          else tailStripes.beginFill(0x7393b3);
          tailStripes.drawRect(-12, -2, 2, 4);
          tailStripes.drawRect(-6, -2, 2, 4);
          tailStripes.drawRect(0, -2, 2, 4);
          tailStripes.drawRect(6, -2, 2, 4);
          tailStripes.endFill();

          // Head
          const head = new Graphics();
          if (f1 === true) head.beginFill(0xf4d03f);
          else head.beginFill(0xb2beb5);
          head.drawCircle(0, 0, 8);
          head.endFill();

          // Head stripes
          const headStripes = new Graphics();
          if (f1 === true) headStripes.beginFill(0xe67e22);
          else headStripes.beginFill(0x7393b3);
          headStripes.drawRect(-8, -6, 2, 12);
          headStripes.drawRect(-2, -8, 2, 16);
          headStripes.drawRect(4, -6, 2, 12);
          headStripes.endFill();

          // Ears
          const leftEar = new Graphics();
          if (f1 === true) leftEar.beginFill(0xf4d03f);
          else leftEar.beginFill(0xb2beb5);
          leftEar.drawPolygon([-6, -10, -2, -18, 2, -12]);
          leftEar.endFill();

          const rightEar = new Graphics();
          if (f1 === true) rightEar.beginFill(0xf4d03f);
          else rightEar.beginFill(0xb2beb5);
          rightEar.drawPolygon([2, -10, 6, -18, 10, -12]);
          rightEar.endFill();

          // Inner ears
          const leftInnerEar = new Graphics();
          if (f1 === true) leftInnerEar.beginFill(0xf39c12);
          else leftInnerEar.beginFill(0xe2dfd2);
          leftInnerEar.drawPolygon([-4, -11, -2, -15, 0, -12]);
          leftInnerEar.endFill();

          const rightInnerEar = new Graphics();
          if (f1 === true) rightInnerEar.beginFill(0xf39c12);
          else rightInnerEar.beginFill(0xe2dfd2);
          rightInnerEar.drawPolygon([4, -11, 6, -15, 8, -12]);
          rightInnerEar.endFill();

          // Eyes (closed - straight lines)
          // Eyes (straight horizontal lines - closed look)
          const leftEye = new Graphics();
          leftEye.lineStyle(1.5, 0x2c3e50, 1); // thickness and color
          leftEye.moveTo(-6, -3); // start point
          leftEye.lineTo(-2, -3); // end point
          leftEye.stroke();

          const rightEye = new Graphics();
          rightEye.lineStyle(1.5, 0x2c3e50, 1);
          rightEye.moveTo(2, -3);
          rightEye.lineTo(6, -3);
          rightEye.stroke();

          // Nose
          const nose = new Graphics();
          nose.beginFill(0xf1c40f);
          nose.drawPolygon([0, 1, -2, 3, 2, 3]);
          nose.endFill();

          // Mouth
          const mouth = new Graphics();
          mouth.lineStyle(1, 0x2c3e50);
          mouth.moveTo(0, 4);
          mouth.lineTo(-3, 6);
          mouth.moveTo(0, 4);
          mouth.lineTo(3, 6);

          // Whiskers
          const whiskers = new Graphics();
          whiskers.lineStyle(1, 0x000000);
          // Left whiskers
          whiskers.moveTo(-8, 0);
          whiskers.lineTo(-15, -1);
          whiskers.moveTo(-8, 2);
          whiskers.lineTo(-15, 3);
          // Right whiskers
          whiskers.moveTo(8, 0);
          whiskers.lineTo(15, -1);
          whiskers.moveTo(8, 2);
          whiskers.lineTo(15, 3);

          // // Legs (small ovals)
          // const frontLeftLeg = new Graphics();
          // frontLeftLeg.beginFill(0xf4d03f);
          // frontLeftLeg.drawEllipse(-12, 12, 3, 6);
          // frontLeftLeg.endFill();

          // const frontRightLeg = new Graphics();
          // frontRightLeg.beginFill(0xf4d03f);
          // frontRightLeg.drawEllipse(12, 12, 3, 6);
          // frontRightLeg.endFill();

          // // Paws
          // const frontLeftPaw = new Graphics();
          // frontLeftPaw.beginFill(0xf39c12);
          // frontLeftPaw.drawCircle(-12, 16, 2);
          // frontLeftPaw.endFill();

          // const frontRightPaw = new Graphics();
          // frontRightPaw.beginFill(0xf39c12);
          // frontRightPaw.drawCircle(12, 16, 2);
          // frontRightPaw.endFill();

          return {
            shadow,
            body,
            stripes,
            tail,
            tailStripes,
            head,
            headStripes,
            leftEar,
            rightEar,
            leftInnerEar,
            rightInnerEar,
            leftEye,
            rightEye,
            nose,
            mouth,
            whiskers,
          };
        };

        const parts = createCatParts();

        // Add all parts to container
        Object.values(parts).forEach((part) => {
          cat.addChild(part);
        });

        // Position the cat
        cat.x = x;
        cat.y = y;

        // Sleep Z's container
        const sleepZs = new Container();
        cat.addChild(sleepZs);

        // Create floating Z's
        const createSleepZ = () => {
          const z = new Text("z", {
            fontSize: 8,
            fill: 0x5d6d7e,
            alpha: 0.7,
          });
          z.x = 15 + Math.random() * 10;
          z.y = -25;
          z.life = 120;
          z.maxLife = 120;
          sleepZs.addChild(z);
        };

        // Animation loop
        const animate = () => {
          animationTime += 0.1;
          sleepCycle += 0.05;
          tailWag = Math.sin(animationTime * 2) * 0.3;
          breathing = Math.sin(animationTime * 1.5) * 0.02;
          eyeBlink = Math.sin(animationTime * 0.3) > 0.95 ? 0.1 : 1;

          // Breathing animation
          parts.body.scale.y = 1 + breathing;

          // Tail wagging
          parts.tail.x = -30 + Math.sin(tailWag) * 3;
          parts.tail.y = -5 + Math.cos(tailWag) * 2;
          parts.tail.rotation = tailWag * 0.5;
          parts.tailStripes.x = parts.tail.x;
          parts.tailStripes.y = parts.tail.y;
          parts.tailStripes.rotation = parts.tail.rotation;

          // // Eye blinking
          // parts.leftEye.scale.y = eyeBlink;
          // parts.rightEye.scale.y = eyeBlink;

          const headOffsetX = 18;

          // Sleepy head nod
          parts.head.x = headOffsetX;
          parts.head.y = -10 + Math.sin(sleepCycle) * 2;
          parts.headStripes.x = headOffsetX;
          parts.headStripes.y = parts.head.y;
          parts.leftEar.x = headOffsetX - 2;
          parts.leftEar.y = parts.head.y + 4;
          parts.rightEar.x = headOffsetX - 2;
          parts.rightEar.y = parts.head.y + 4;
          parts.leftInnerEar.x = headOffsetX - 2;
          parts.leftInnerEar.y = parts.head.y + 2.5;
          parts.rightInnerEar.y = parts.head.y + 2.5;
          parts.rightInnerEar.x = headOffsetX - 2;
          parts.leftEye.y = parts.head.y;
          parts.leftEye.x = headOffsetX;
          parts.rightEye.y = parts.head.y;
          parts.rightEye.x = headOffsetX;
          parts.nose.y = parts.head.y;
          parts.nose.x = headOffsetX;
          parts.mouth.y = parts.head.y;
          parts.mouth.x = headOffsetX;
          parts.whiskers.y = parts.head.y;
          parts.whiskers.x = headOffsetX;

          // Create Z's occasionally
          if (Math.random() < 0.02) {
            createSleepZ();
          }

          // Update Z's
          sleepZs.children.forEach((z) => {
            z.life--;
            z.y -= 0.5;
            z.alpha = z.life / z.maxLife;
            z.x += Math.sin(z.life * 0.1) * 0.5;

            if (z.life <= 0) {
              sleepZs.removeChild(z);
            }
          });

          // Ear twitching
          if (Math.random() < 0.01) {
            parts.leftEar.rotation = Math.random() * 0.2 - 0.1;
            parts.rightEar.rotation = Math.random() * 0.2 - 0.1;
            parts.leftInnerEar.rotation = parts.leftEar.rotation;
            parts.rightInnerEar.rotation = parts.rightEar.rotation;
          } else {
            parts.leftEar.rotation *= 0.9;
            parts.rightEar.rotation *= 0.9;
            parts.leftInnerEar.rotation = parts.leftEar.rotation;
            parts.rightInnerEar.rotation = parts.rightEar.rotation;
          }

          requestAnimationFrame(animate);
        };

        // Start animation
        animate();

        const bounds = {
          x: x - 35, // shift left a bit to include tail
          y: y - 25, // slightly above
          width: 65, // extended width to include offset head
          height: 40, // enough to cover body + shadow
          label: "sleeping-cat",
        };

        // Add collider if needed
        if (camera && colliders) {
          addWithCollider(camera, cat, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "elevator",
          bounds,
          message: "A smol car sleeping...",
          bubble: null,
        });

        return cat;
      };

      const createFloorTile = (x, y, size) => {
        const tile = new Graphics();

        // Enhanced color palette for more realistic tiles
        const baseColor = 0x5ba3f5;
        const highlightColor = 0x7db8f7;
        const shadowColor = 0x3578c7;
        const darkShadow = 0x2c5aa0;
        const groutColor = 0x34495e;

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

        // Add subtle surface texture with small dots
        tile.circle(x + size * 0.3, y + size * 0.3, 0.5);
        tile.fill(highlightColor);

        tile.circle(x + size * 0.7, y + size * 0.2, 0.5);
        tile.fill(shadowColor);

        tile.circle(x + size * 0.2, y + size * 0.8, 0.5);
        tile.fill(shadowColor);

        tile.circle(x + size * 0.8, y + size * 0.7, 0.5);
        tile.fill(highlightColor);

        // Enhanced border/grout line
        tile.stroke({ width: 2, color: groutColor });

        // Add slight wear pattern (diagonal line)
        tile.moveTo(x + size * 0.1, y + size * 0.9);
        tile.lineTo(x + size * 0.9, y + size * 0.1);
        tile.stroke({ width: 0.5, color: shadowColor, alpha: 0.3 });

        return tile;
      };

      // Updated walls with pixel art styling
      const createWalls = (
        roomWidth,
        roomHeight,
        row,
        col,
        grid,
        colliders,
        offsetX,
        offsetY
      ) => {
        const walls = [];
        const thick = 32;
        const thin = 12;
        const gapSize = 80;

        const wallColor = 0x8b7355;
        const wallShadow = 0x6b5635;

        const { rows, cols } = grid;

        // ─── Top Wall ───
        const topThickness = row === 0 ? thick : thin;
        const hasRoomAbove = row > 0;
        const topWall = new Graphics();

        if (hasRoomAbove) {
          // Visual gap: centered but offset left by 90px
          const visualGapStart = roomWidth / 2 - gapSize / 2 - 90;
          const visualGapEnd = visualGapStart + gapSize;

          // Create visual walls
          topWall.rect(0, 0, visualGapStart, topThickness);
          topWall.rect(visualGapEnd, 0, roomWidth - visualGapEnd, topThickness);

          // Create collision boxes that EXACTLY match visual walls
          colliders.push({
            x: offsetX + 0,
            y: offsetY + 0,
            width: visualGapStart,
            height: topThickness,
          });
          colliders.push({
            x: offsetX + visualGapEnd,
            y: offsetY + 0,
            width: roomWidth - visualGapEnd,
            height: topThickness,
          });
        } else {
          // No door - solid wall
          topWall.rect(0, 0, roomWidth, topThickness);
          colliders.push({
            x: offsetX + 0,
            y: offsetY + 0,
            width: roomWidth,
            height: topThickness,
          });
        }

        topWall.fill(wallColor);
        topWall.rect(0, topThickness - 2, roomWidth, 2);
        topWall.fill(wallShadow);
        walls.push(topWall);

        // ─── Bottom Wall ───
        const bottomThickness = row === rows - 1 ? thick : thin;
        const hasRoomBelow = row < rows - 1;
        const bottomWall = new Graphics();
        const bottomY = roomHeight - bottomThickness;

        if (hasRoomBelow) {
          // IMPORTANT: Use EXACT same calculation as your original code
          const gapX = roomWidth / 2 - gapSize / 2 - 90;

          // Create visual walls (matching your original)
          bottomWall.rect(0, bottomY, gapX, bottomThickness);
          bottomWall.rect(
            gapX + gapSize,
            bottomY,
            roomWidth - (gapX + gapSize),
            bottomThickness
          );

          // Create collision boxes with IDENTICAL calculations
          colliders.push({
            x: offsetX + 0,
            y: offsetY + bottomY,
            width: gapX,
            height: bottomThickness,
          });
          colliders.push({
            x: offsetX + gapX + gapSize,
            y: offsetY + bottomY,
            width: roomWidth - (gapX + gapSize),
            height: bottomThickness,
          });
        } else {
          // No door - solid wall
          bottomWall.rect(0, bottomY, roomWidth, bottomThickness);
          colliders.push({
            x: offsetX + 0,
            y: offsetY + bottomY,
            width: roomWidth,
            height: bottomThickness,
          });
        }

        bottomWall.fill(wallColor);
        bottomWall.rect(0, bottomY, roomWidth, 2);
        bottomWall.fill(wallShadow);
        walls.push(bottomWall);

        // ─── Left Wall ───
        const leftThickness = col === 0 ? thick : thin;
        const hasRoomLeft = col > 0;
        const leftWall = new Graphics();

        if (hasRoomLeft) {
          // Visual gap: centered but offset up by 90px
          const visualGapStart = roomHeight / 2 - gapSize / 2 - 90;
          const visualGapEnd = visualGapStart + gapSize;

          // Create visual walls
          leftWall.rect(0, 0, leftThickness, visualGapStart);
          leftWall.rect(
            0,
            visualGapEnd,
            leftThickness,
            roomHeight - visualGapEnd
          );

          // Create collision boxes that EXACTLY match visual walls
          colliders.push({
            x: offsetX + 0,
            y: offsetY + 0,
            width: leftThickness,
            height: visualGapStart,
          });
          colliders.push({
            x: offsetX + 0,
            y: offsetY + visualGapEnd,
            width: leftThickness,
            height: roomHeight - visualGapEnd,
          });
        } else {
          // No door - solid wall
          leftWall.rect(0, 0, leftThickness, roomHeight);
          colliders.push({
            x: offsetX + 0,
            y: offsetY + 0,
            width: leftThickness,
            height: roomHeight,
          });
        }

        leftWall.fill(wallColor);
        leftWall.rect(leftThickness - 2, 0, 2, roomHeight);
        leftWall.fill(wallShadow);
        walls.push(leftWall);

        // ─── Right Wall ───
        const rightThickness = col === cols - 1 ? thick : thin;
        const hasRoomRight = col < cols - 1;
        const rightWall = new Graphics();
        const rightX = roomWidth - rightThickness;

        if (hasRoomRight) {
          // Visual gap: centered but offset up by 90px
          const visualGapStart = roomHeight / 2 - gapSize / 2 - 90;
          const visualGapEnd = visualGapStart + gapSize;

          // Create visual walls
          rightWall.rect(rightX, 0, rightThickness, visualGapStart);
          rightWall.rect(
            rightX,
            visualGapEnd,
            rightThickness,
            roomHeight - visualGapEnd
          );

          // Create collision boxes that EXACTLY match visual walls
          colliders.push({
            x: offsetX + rightX,
            y: offsetY + 0,
            width: rightThickness,
            height: visualGapStart,
          });
          colliders.push({
            x: offsetX + rightX,
            y: offsetY + visualGapEnd,
            width: rightThickness,
            height: roomHeight - visualGapEnd,
          });
        } else {
          // No door - solid wall
          rightWall.rect(rightX, 0, rightThickness, roomHeight);
          colliders.push({
            x: offsetX + rightX,
            y: offsetY + 0,
            width: rightThickness,
            height: roomHeight,
          });
        }

        rightWall.fill(wallColor);
        rightWall.rect(rightX, 0, 2, roomHeight);
        rightWall.fill(wallShadow);
        walls.push(rightWall);

        return walls;
      };

      const getPlayerBounds = (player) => {
        return {
          x: player.x + PLAYER_BOUNDS.offsetX,
          y: player.y + PLAYER_BOUNDS.offsetY,
          width: PLAYER_BOUNDS.width,
          height: PLAYER_BOUNDS.height,
        };
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

      const createElevator = (x, y, camera, colliders) => {
        const elevator = new Graphics();

        // Outer shaft frame (darker)
        elevator.rect(x - 32, y - 42, 64, 84);
        elevator.fill(0x1a252f);

        // Inner shaft background with gradient effect
        elevator.rect(x - 30, y - 40, 60, 80);
        elevator.fill(0x2c3e50);

        // Shaft inner walls (side shadows)
        elevator.rect(x - 30, y - 40, 5, 80);
        elevator.fill(0x1e2a38);
        elevator.rect(x + 25, y - 40, 5, 80);
        elevator.fill(0x1e2a38);

        // Door track/guide rails
        elevator.rect(x - 26, y - 38, 2, 76);
        elevator.fill(0x5d6d7e);
        elevator.rect(x + 24, y - 38, 2, 76);
        elevator.fill(0x5d6d7e);

        // LEFT ELEVATOR DOOR
        // Main door panel
        elevator.rect(x - 25, y - 35, 22, 70);
        elevator.fill(0xbdc3c7); // Light gray

        // Door frame/border
        elevator.rect(x - 25, y - 35, 22, 70);
        elevator.stroke({ color: 0x7f8c8d, width: 1 });

        // Door panel details
        elevator.rect(x - 23, y - 32, 18, 64);
        elevator.fill(0x95a5a6);
        elevator.stroke({ color: 0x7f8c8d, width: 1 });

        // Vertical ridges on left door
        for (let i = 0; i < 3; i++) {
          elevator.rect(x - 21 + i * 6, y - 30, 1, 60);
          elevator.fill(0x85929a);
        }

        // RIGHT ELEVATOR DOOR
        // Main door panel
        elevator.rect(x + 3, y - 35, 22, 70);
        elevator.fill(0xbdc3c7);

        // Door frame/border
        elevator.rect(x + 3, y - 35, 22, 70);
        elevator.stroke({ color: 0x7f8c8d, width: 1 });

        // Door panel details
        elevator.rect(x + 5, y - 32, 18, 64);
        elevator.fill(0x95a5a6);
        elevator.stroke({ color: 0x7f8c8d, width: 1 });

        // Vertical ridges on right door
        for (let i = 0; i < 3; i++) {
          elevator.rect(x + 7 + i * 6, y - 30, 1, 60);
          elevator.fill(0x85929a);
        }

        // DOOR HANDLES (improved)
        // Left door handle
        elevator.rect(x - 5, y - 4, 3, 12);
        elevator.fill(0x34495e);
        elevator.circle(x - 3.5, y - 2, 1.5);
        elevator.fill(0x2c3e50);
        elevator.circle(x - 3.5, y + 6, 1.5);
        elevator.fill(0x2c3e50);

        // Right door handle
        elevator.rect(x + 2, y - 4, 3, 12);
        elevator.fill(0x34495e);
        elevator.circle(x + 3.5, y - 2, 1.5);
        elevator.fill(0x2c3e50);
        elevator.circle(x + 3.5, y + 6, 1.5);
        elevator.fill(0x2c3e50);

        // Handle connecting strip
        elevator.rect(x - 5, y + 1, 10, 2);
        elevator.fill(0x2c3e50);

        // CONTROL PANEL (enhanced)
        // Panel background
        elevator.rect(x + 30, y - 22, 12, 44);
        elevator.fill(0x34495e);

        // Panel frame
        elevator.rect(x + 30, y - 22, 12, 44);
        elevator.stroke({ color: 0x2c3e50, width: 2 });

        // Panel inner area
        elevator.rect(x + 32, y - 20, 8, 40);
        elevator.fill(0x2c3e50);

        // FLOOR INDICATOR LIGHTS (enhanced)
        const floorLabels = ["4", "3", "2", "1"];
        for (let i = 0; i < 4; i++) {
          // Button background
          elevator.rect(x + 33, y - 17 + i * 8, 6, 6);
          elevator.fill(0x1a252f);

          // Button light
          elevator.circle(x + 36, y - 15 + i * 8, 2);
          elevator.fill(i === 0 ? 0xe74c3c : 0x2c3e50); // First light red, others off

          // Subtle glow effect for active light
          if (i === 0) {
            elevator.circle(x + 36, y - 15 + i * 8, 2.5);
            elevator.fill(0x8b2635);
          }
        }

        // ADDITIONAL DETAILS
        // Top shaft detail
        elevator.rect(x - 28, y - 40, 56, 3);
        elevator.fill(0x1e2a38);

        // Bottom shaft detail
        elevator.rect(x - 28, y + 37, 56, 3);
        elevator.fill(0x1e2a38);

        // Door gap (center seam)
        elevator.rect(x - 1, y - 35, 2, 70);
        elevator.fill(0x1a252f);

        // Floor indicator above doors
        elevator.rect(x - 12, y - 45, 24, 8);
        elevator.fill(0x1a252f);

        // Digital display
        elevator.rect(x - 10, y - 43, 20, 4);
        elevator.fill(0x000000);

        // "1" display
        elevator.rect(x - 2, y - 42, 4, 2);
        elevator.fill(0xff0000);

        // Emergency phone symbol
        elevator.rect(x + 33, y + 12, 6, 4);
        elevator.fill(0xff6b35);
        elevator.circle(x + 36, y + 14, 1);
        elevator.fill(0xffffff);

        // ✅ Keep original bounds and collision detection
        const bounds = {
          x: x - 25,
          y: y - 35,
          width: 50,
          height: 72,
          label: "elevator-doors",
        };

        if (colliders) {
          addWithCollider(camera, elevator, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "elevator",
          bounds,
          message: "The Elevator doors are tightly shut",
          bubble: null,
        });

        return elevator;
      };

      const createdoor = (x, y, camera, colliders, options = {}) => {
        const door = new Graphics();

        // Default options
        const opts = {
          doorType: "standard", // 'standard', 'office', 'fancy', 'modern'
          isOpen: false,
          color: 0x8b4513,
          frameColor: 0x654321,
          handleColor: 0xffd700,
          ...options,
        };

        if (opts.doorType === "office") {
          return createOfficeDoor(x, y, camera, colliders, opts);
        } else if (opts.doorType === "fancy") {
          return createFancyDoor(x, y, camera, colliders, opts);
        } else if (opts.doorType === "modern") {
          return createModernDoor(x, y, camera, colliders, opts);
        }

        // STANDARD WOODEN DOOR
        // Door frame (outer)
        door.rect(x - 30, y - 40, 60, 80);
        door.fill(opts.frameColor);

        // Door frame (inner highlight)
        door.rect(x - 28, y - 38, 56, 76);
        door.fill(0x8b6f47);

        // Main door body (using elevator bounds: width 50, height 72)
        door.rect(x - 25, y - 35, 50, 72);
        door.fill(opts.color);

        // Door panels (raised effect)
        // Top panel
        door.rect(x - 20, y - 28, 40, 28);
        door.stroke({ color: 0x654321, width: 2 });
        door.rect(x - 18, y - 26, 36, 24);
        door.fill(0xa0522d);

        // Bottom panel
        door.rect(x - 20, y + 4, 40, 28);
        door.stroke({ color: 0x654321, width: 2 });
        door.rect(x - 18, y + 6, 36, 24);
        door.fill(0xa0522d);

        // Door handle
        door.circle(x + 18, y, 4);
        door.fill(opts.handleColor);
        door.circle(x + 17, y - 1, 3);
        door.fill(0xdaa520);

        // Door hinges
        door.rect(x - 22, y - 20, 8, 6);
        door.fill(0x696969);
        door.rect(x - 22, y + 15, 8, 6);
        door.fill(0x696969);

        // Hinge screws
        door.circle(x - 20, y - 17, 1);
        door.circle(x - 16, y - 17, 1);
        door.circle(x - 20, y + 18, 1);
        door.circle(x - 16, y + 18, 1);
        door.fill(0x2f4f4f);

        // ✅ Use exact elevator bounds
        const bounds = {
          x: x - 25,
          y: y - 35,
          width: 50,
          height: 72,
          label: "door",
        };

        if (colliders) {
          addWithCollider(camera, door, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "door",
          bounds,
          message: "A sturdy wooden door.",
          bubble: null,
        });

        return door;
      };

      const createOfficeDoor = (x, y, camera, colliders, opts) => {
        const door = new Graphics();

        // Frame
        door.rect(x - 30, y - 40, 60, 80);
        door.fill(0x2f4f4f);

        // Main door (glass and wood)
        door.rect(x - 25, y - 35, 50, 72);
        door.fill(0x8b4513);

        // Glass window (upper half)
        door.rect(x - 20, y - 28, 40, 30);
        door.fill(0x87ceeb);
        door.stroke({ color: 0x654321, width: 2 });

        // Window grid
        door.moveTo(x, y - 28);
        door.lineTo(x, y + 2);
        door.moveTo(x - 20, y - 13);
        door.lineTo(x + 20, y - 13);
        door.stroke({ color: 0x654321, width: 1 });

        // Lower wood panel
        door.rect(x - 20, y + 8, 40, 24);
        door.fill(0xa0522d);
        door.stroke({ color: 0x654321, width: 2 });

        // Handle
        door.rect(x + 15, y - 2, 8, 4);
        door.fill(0xc0c0c0);

        // ✅ Same bounds
        const bounds = {
          x: x - 25,
          y: y - 35,
          width: 50,
          height: 72,
          label: "office-door",
        };

        if (colliders) {
          addWithCollider(camera, door, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "office-door",
          bounds,
          message: "An office door with frosted glass.",
          bubble: null,
        });

        return door;
      };

      const createFancyDoor = (x, y, camera, colliders, opts) => {
        const door = new Graphics();

        // Ornate frame
        door.rect(x - 32, y - 42, 64, 84);
        door.fill(0x8b4513);
        door.rect(x - 30, y - 40, 60, 80);
        door.fill(0xcd853f);

        // Main door
        door.rect(x - 25, y - 35, 50, 72);
        door.fill(0x8b4513);

        // Decorative carved panels
        door.rect(x - 20, y - 28, 40, 18);
        door.fill(0xa0522d);
        door.stroke({ color: 0x654321, width: 2 });

        // Decorative diamond pattern
        door.moveTo(x, y - 28);
        door.lineTo(x - 15, y - 19);
        door.lineTo(x, y - 10);
        door.lineTo(x + 15, y - 19);
        door.lineTo(x, y - 28);
        door.stroke({ color: 0x654321, width: 1 });

        // Middle panel
        door.rect(x - 20, y - 5, 40, 18);
        door.fill(0xa0522d);
        door.stroke({ color: 0x654321, width: 2 });

        // Bottom panel
        door.rect(x - 20, y + 18, 40, 14);
        door.fill(0xa0522d);
        door.stroke({ color: 0x654321, width: 2 });

        // Ornate handle
        door.circle(x + 18, y, 5);
        door.fill(0xffd700);
        door.circle(x + 18, y, 3);
        door.fill(0xdaa520);

        // ✅ Same bounds
        const bounds = {
          x: x - 25,
          y: y - 35,
          width: 50,
          height: 72,
          label: "fancy-door",
        };

        if (colliders) {
          addWithCollider(camera, door, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "fancy-door",
          bounds,
          message: "An ornate wooden door with decorative carvings.",
          bubble: null,
        });

        return door;
      };

      const createModernDoor = (x, y, camera, colliders, opts) => {
        const door = new Graphics();

        // Minimal frame
        door.rect(x - 28, y - 38, 56, 76);
        door.fill(0x2f4f4f);

        // Main door
        door.rect(x - 25, y - 35, 50, 72);
        door.fill(0x36454f);

        // Vertical accent strips
        door.rect(x - 18, y - 30, 3, 62);
        door.fill(0x708090);
        door.rect(x - 10, y - 30, 2, 62);
        door.fill(0x708090);

        // Modern handle (horizontal bar)
        door.rect(x + 10, y - 8, 12, 3);
        door.fill(0xc0c0c0);

        // Handle mounting
        door.circle(x + 12, y - 6, 1);
        door.circle(x + 20, y - 6, 1);
        door.fill(0x696969);

        // Door number plate
        door.rect(x - 5, y - 32, 10, 6);
        door.fill(0x1a1a1a);
        door.stroke({ color: 0xc0c0c0, width: 1 });

        // ✅ Same bounds
        const bounds = {
          x: x - 25,
          y: y - 35,
          width: 50,
          height: 72,
          label: "modern-door",
        };

        if (colliders) {
          addWithCollider(camera, door, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "modern-door",
          bounds,
          message: "A sleek modern door.",
          bubble: null,
        });

        return door;
      };

      const createOfficeDesk = (x, y, addCollider = true) => {
        const desk = new Graphics();

        // Desk surface - rich mahogany wood with grain texture
        desk.rect(x - 40, y - 20, 80, 40);
        desk.fill(0xa0522d);

        // Wood grain lines for texture
        desk.rect(x - 35, y - 15, 70, 1);
        desk.fill(0x8b4513);
        desk.rect(x - 32, y - 5, 64, 1);
        desk.fill(0x8b4513);
        desk.rect(x - 38, y + 5, 76, 1);
        desk.fill(0x8b4513);
        desk.rect(x - 30, y + 12, 60, 1);
        desk.fill(0x8b4513);

        // Desk edge highlight for 3D effect
        desk.rect(x - 40, y - 20, 80, 2);
        desk.fill(0xcd853f);

        // Desk shadow/depth - enhanced with gradient effect
        desk.rect(x - 40, y + 18, 80, 4);
        desk.fill(0x5d4037);
        desk.rect(x + 38, y - 20, 4, 40);
        desk.fill(0x5d4037);

        // Desk legs/support
        desk.rect(x - 38, y + 15, 6, 8);
        desk.fill(0x5d4037);
        desk.rect(x + 32, y + 15, 6, 8);
        desk.fill(0x5d4037);

        // Computer monitor - sleek modern design
        const monitor = new Graphics();

        // Monitor bezel - silver/metallic
        monitor.rect(x - 20, y - 25, 40, 30);
        monitor.fill(0x95a5a6);

        // Monitor screen - deep black with subtle blue tint
        monitor.rect(x - 18, y - 23, 36, 26);
        monitor.fill(0x1a1a2e);

        // Screen reflection/highlight
        monitor.rect(x - 17, y - 22, 8, 2);
        monitor.fill(0x3742fa);
        monitor.rect(x - 16, y - 19, 6, 1);
        monitor.fill(0x57606f);

        // Monitor brand logo area
        monitor.rect(x - 3, y + 4, 6, 2);
        monitor.fill(0x2f3542);

        // Monitor stand - modern design
        monitor.rect(x - 8, y + 8, 16, 8);
        monitor.fill(0x57606f);
        monitor.rect(x - 6, y + 16, 12, 6);
        monitor.fill(0x3d4454);

        // Stand base highlight
        monitor.rect(x - 6, y + 16, 12, 1);
        monitor.fill(0x747d8c);

        desk.addChild(monitor);

        // Keyboard - mechanical gaming style
        const keyboard = new Graphics();

        // Keyboard base - dark plastic
        keyboard.rect(x - 15, y + 10, 30, 12);
        keyboard.fill(0x2f3640);

        // Keyboard keys area
        keyboard.rect(x - 13, y + 12, 26, 8);
        keyboard.fill(0x1e272e);

        // Individual key highlights
        for (let i = 0; i < 6; i++) {
          for (let j = 0; j < 3; j++) {
            keyboard.rect(x - 11 + i * 4, y + 13 + j * 2, 3, 1.5);
            keyboard.fill(0x40444a);
          }
        }

        // Keyboard brand strip
        keyboard.rect(x - 13, y + 10, 26, 1);
        keyboard.fill(0x0984e3);

        desk.addChild(keyboard);

        // Mouse - ergonomic gaming mouse
        const mouse = new Graphics();

        // Mouse body - matte finish
        mouse.rect(x + 20, y + 10, 8, 12);
        mouse.fill(0x57606f);

        // Mouse buttons
        mouse.rect(x + 21, y + 11, 3, 5);
        mouse.fill(0x40444a);
        mouse.rect(x + 24.5, y + 11, 3, 5);
        mouse.fill(0x40444a);

        // Mouse scroll wheel
        mouse.rect(x + 22.5, y + 13, 1, 2);
        mouse.fill(0x2f3640);

        // Mouse LED indicator
        mouse.rect(x + 26, y + 12, 1, 1);
        mouse.fill(0xff3838);

        desk.addChild(mouse);

        // Desk lamp - modern architect style
        const lamp = new Graphics();

        // Lamp arm - metallic finish
        lamp.rect(x - 35, y - 15, 3, 25);
        lamp.fill(0x57606f);

        // Lamp arm joint
        lamp.rect(x - 36, y - 5, 5, 3);
        lamp.fill(0x40444a);

        // Lamp shade - warm LED
        lamp.rect(x - 42, y - 18, 12, 6);
        lamp.fill(0xffa502);

        // Lamp base/weight
        lamp.rect(x - 37, y + 8, 6, 4);
        lamp.fill(0x40444a);

        // Lamp light glow effect
        lamp.rect(x - 41, y - 17, 10, 4);
        lamp.fill(0xffb84d);

        desk.addChild(lamp);

        // Additional desk accessories for realism

        // Coffee mug
        const mug = new Graphics();
        mug.rect(x + 10, y - 5, 6, 8);
        mug.fill(0x2c3e50);
        mug.rect(x + 11, y - 4, 4, 6);
        mug.fill(0x8b4513); // Coffee color
        // Mug handle
        mug.rect(x + 16, y - 2, 2, 4);
        mug.fill(0x2c3e50);
        desk.addChild(mug);

        // Pen holder with pens
        const penHolder = new Graphics();
        penHolder.rect(x - 30, y + 5, 8, 10);
        penHolder.fill(0x34495e);
        // Pens sticking out
        penHolder.rect(x - 28, y + 2, 1, 6);
        penHolder.fill(0x3498db);
        penHolder.rect(x - 26, y + 1, 1, 7);
        penHolder.fill(0xe74c3c);
        penHolder.rect(x - 24, y + 3, 1, 5);
        penHolder.fill(0x2ecc71);
        desk.addChild(penHolder);

        // Notepad
        const notepad = new Graphics();
        notepad.rect(x + 5, y + 8, 12, 8);
        notepad.fill(0xffffff);
        notepad.rect(x + 5, y + 8, 12, 1);
        notepad.fill(0xff6b6b);
        // Notepad lines
        notepad.rect(x + 6, y + 10, 10, 0.5);
        notepad.fill(0xddd);
        notepad.rect(x + 6, y + 12, 10, 0.5);
        notepad.fill(0xddd);
        notepad.rect(x + 6, y + 14, 10, 0.5);
        notepad.fill(0xddd);
        desk.addChild(notepad);

        const bounds = {
          x: x - 40,
          y: y - 20,
          width: 80,
          height: 45,
        };

        if (addCollider && window?.gameStateRef?.current?.colliders) {
          gameStateRef.current.colliders.push(bounds);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "elevator",
          bounds,
          message: "A standard office desk. Nothing to do here...",
          bubble: null,
        });

        return desk;
      };

      // Updated office chair with better details
      const createOfficeChair = (x, y, addCollider = true) => {
        const chair = new Graphics();

        // Enhanced color palette
        const seatColor = 0x2c3e50;
        const backColor = 0x34495e;
        const highlight = 0x4a6274;
        const shadow = 0x1a252f;
        const baseColor = 0x7f8c8d;
        const wheelColor = 0x34495e;
        const accent = 0x3498db;

        // Chair seat with depth
        chair.rect(x - 16, y - 12, 32, 24);
        chair.fill(seatColor);

        // Add seat cushion effect
        chair.rect(x - 14, y - 10, 28, 20);
        chair.fill(highlight);

        // Seat button tufting
        chair.circle(x - 6, y - 2, 1.5);
        chair.circle(x + 6, y - 2, 1.5);
        chair.fill(shadow);

        // Seat edge highlight
        chair.rect(x - 16, y - 12, 32, 2);
        chair.fill(highlight);

        // Chair back with contour
        chair.rect(x - 14, y - 30, 28, 25);
        chair.fill(backColor);

        // Back cushion padding
        chair.rect(x - 12, y - 28, 24, 21);
        chair.fill(highlight);

        // Ergonomic back curve
        chair.rect(x - 10, y - 26, 20, 17);
        chair.fill(backColor);

        // Back support tufting
        chair.circle(x - 4, y - 20, 1);
        chair.circle(x + 4, y - 20, 1);
        chair.circle(x, y - 15, 1);
        chair.fill(shadow);

        // Back top highlight
        chair.rect(x - 14, y - 30, 28, 2);
        chair.fill(highlight);

        // Chair armrests with padding
        // Left armrest
        chair.rect(x - 20, y - 8, 8, 16);
        chair.fill(seatColor);
        chair.rect(x - 19, y - 7, 6, 14);
        chair.fill(highlight);
        chair.rect(x - 20, y - 8, 8, 2);
        chair.fill(highlight);

        // Right armrest
        chair.rect(x + 12, y - 8, 8, 16);
        chair.fill(seatColor);
        chair.rect(x + 13, y - 7, 6, 14);
        chair.fill(highlight);
        chair.rect(x + 12, y - 8, 8, 2);
        chair.fill(highlight);

        // Chair base/wheels with enhanced design
        chair.circle(x, y + 20, 12);
        chair.fill(baseColor);

        // Base inner circle for depth
        chair.circle(x, y + 20, 8);
        chair.fill(highlight);

        // Center hub
        chair.circle(x, y + 20, 4);
        chair.fill(shadow);

        // Brand accent dot
        chair.circle(x, y + 20, 1.5);
        chair.fill(accent);

        // Enhanced wheel spokes with better wheels
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const wx = x + Math.cos(angle) * 15;
          const wy = y + 20 + Math.sin(angle) * 15;

          // Wheel base
          chair.circle(wx, wy, 3);
          chair.fill(wheelColor);

          // Wheel highlight
          chair.circle(wx - 0.5, wy - 0.5, 2);
          chair.fill(baseColor);

          // Wheel center
          chair.circle(wx, wy, 1);
          chair.fill(shadow);

          // Connect spokes to center
          chair.moveTo(x + Math.cos(angle) * 4, y + 20 + Math.sin(angle) * 4);
          chair.lineTo(x + Math.cos(angle) * 12, y + 20 + Math.sin(angle) * 12);
          chair.stroke({ width: 2, color: shadow });
        }

        // Add subtle chair outline for definition
        chair.rect(x - 16, y - 12, 32, 24);
        chair.stroke({ width: 1, color: shadow, alpha: 0.3 });

        chair.rect(x - 14, y - 30, 28, 25);
        chair.stroke({ width: 1, color: shadow, alpha: 0.3 });

        if (addCollider && window?.gameStateRef?.current?.colliders) {
          gameStateRef.current.colliders.push({
            x: x - 16,
            y: y - 30,
            width: 32,
            height: 45,
          });
        }

        return chair;
      };

      // New reception desk function
      const createReceptionDesk = (x, y) => {
        const desk = new Graphics();

        // Main desk counter
        desk.rect(x - 60, y - 25, 120, 50);
        desk.fill(0x8b4513);

        // Desk shadow
        desk.rect(x - 60, y + 23, 120, 4);
        desk.fill(0x654321);

        // Computer setup
        const computer = new Graphics();
        computer.rect(x - 15, y - 20, 30, 20);
        computer.fill(0x2c3e50);
        computer.rect(x - 12, y - 17, 24, 14);
        computer.fill(0x000000);
        desk.addChild(computer);

        // Phone
        const phone = new Graphics();
        phone.rect(x + 25, y - 5, 12, 8);
        phone.fill(0x2c3e50);
        desk.addChild(phone);

        // Desk organizer
        const organizer = new Graphics();
        organizer.rect(x - 40, y - 8, 15, 12);
        organizer.fill(0x34495e);
        desk.addChild(organizer);

        return desk;
      };

      // New cubicle function
      const createCubicle = (x, y, width = 120, height = 100) => {
        const cubicle = new Container();
        const wallColor = 0x95a5a6;
        const colliders = gameStateRef.current?.colliders;

        // ─── Cubicle Walls ───
        const backWall = new Graphics();
        backWall.rect(-width / 2, -height / 2, width, 8);
        backWall.fill(wallColor);
        cubicle.addChild(backWall);

        const leftWall = new Graphics();
        leftWall.rect(-width / 2, -height / 2, 8, height / 2);
        leftWall.fill(wallColor);
        cubicle.addChild(leftWall);

        const rightWall = new Graphics();
        rightWall.rect(width / 2 - 8, -height / 2, 8, height / 2);
        rightWall.fill(wallColor);
        cubicle.addChild(rightWall);

        // ─── Desk ───
        const desk = createOfficeDesk(0, 10, false); // Centered inside cubicle
        cubicle.addChild(desk);

        // ─── Chair ───
        const chair = createOfficeChair(0, 35, false); // Slightly in front of desk
        cubicle.addChild(chair);

        // ─── Add Colliders ───
        if (colliders) {
          const worldX = x;
          const worldY = y;
          const offsetX = worldX - width / 2;
          const offsetY = worldY - height / 2;

          // 🧱 Wall Colliders
          colliders.push({
            x: offsetX,
            y: offsetY,
            width: width,
            height: 8,
            label: "cubicle-back",
          });
          colliders.push({
            x: offsetX,
            y: offsetY,
            width: 8,
            height: height / 2,
            label: "cubicle-left",
          });
          colliders.push({
            x: offsetX + width - 8,
            y: offsetY,
            width: 8,
            height: height / 2,
            label: "cubicle-right",
          });

          // 🖥️ Desk Collider (80x40 desk centered at 0,10)
          colliders.push({
            x: worldX - 40,
            y: worldY - 10,
            width: 80,
            height: 40,
            label: "cubicle-desk",
          });

          // 🪑 Chair Collider (32x45 chair centered at 0,35)
          colliders.push({
            x: worldX - 16,
            y: worldY + 10,
            width: 32,
            height: 45,
            label: "cubicle-chair",
          });
        }

        cubicle.x = x;
        cubicle.y = y;
        return cubicle;
      };

      // New meeting room table
      const createMeetingTable = (x, y, camera, colliders) => {
        const table = new Graphics();

        // Enhanced professional color palette
        const tableColor = 0x8b4513;
        const tableHighlight = 0xcd853f;
        const tableShadow = 0x5d4037;
        const tableDark = 0x3e2723;
        const legColor = 0x6d4c41;
        const legShadow = 0x4e342e;
        const glossyHighlight = 0xf4a460;
        const metalAccent = 0x37474f;
        const metalHighlight = 0x546e7a;

        // Enhanced table shadow with soft edges
        table.ellipse(x + 3, y + 3, 78, 48);
        table.fill({ color: tableShadow, alpha: 0.6 });

        // Main oval table surface
        table.ellipse(x, y, 80, 50);
        table.fill(tableColor);

        // Inner table surface with slight inset
        table.ellipse(x, y, 76, 46);
        table.fill(tableColor);

        // Sophisticated wood grain pattern following oval shape
        for (let i = 0; i < 8; i++) {
          const grainOffset = (i - 4) * 8;
          const grainWidth = 65 - Math.abs(grainOffset) * 0.3;
          const grainHeight = 35 - Math.abs(grainOffset) * 0.2;

          table.ellipse(x, y + grainOffset, grainWidth, grainHeight);
          table.fill({ color: tableShadow, alpha: 0.15 });

          table.ellipse(
            x - 1,
            y + grainOffset - 1,
            grainWidth - 2,
            grainHeight - 2
          );
          table.fill({ color: tableHighlight, alpha: 0.1 });
        }

        // Premium glossy surface highlights
        table.ellipse(x - 15, y - 10, 35, 12);
        table.fill({ color: glossyHighlight, alpha: 0.4 });

        table.ellipse(x + 20, y + 5, 25, 8);
        table.fill({ color: glossyHighlight, alpha: 0.3 });

        table.ellipse(x - 5, y + 15, 40, 10);
        table.fill({ color: glossyHighlight, alpha: 0.35 });

        // Professional table edge with beveled effect
        table.ellipse(x, y, 80, 50);
        table.stroke({ width: 2, color: metalAccent });

        table.ellipse(x - 1, y - 1, 78, 48);
        table.stroke({ width: 1, color: tableHighlight });

        // Enhanced table legs with modern design
        const legPositions = [
          { x: x - 60, y: y - 30 },
          { x: x + 60, y: y - 30 },
          { x: x - 60, y: y + 30 },
          { x: x + 60, y: y + 30 },
        ];

        legPositions.forEach((leg) => {
          // Leg base (chrome finish)
          table.circle(leg.x, leg.y, 8);
          table.fill(metalAccent);

          // Leg highlight ring
          table.circle(leg.x - 1, leg.y - 1, 7);
          table.fill(metalHighlight);

          // Leg main body
          table.circle(leg.x, leg.y, 6);
          table.fill(legColor);

          // Leg wood grain
          table.circle(leg.x, leg.y, 5);
          table.fill(tableColor);

          // Leg shadow
          table.circle(leg.x + 1, leg.y + 1, 4);
          table.fill({ color: legShadow, alpha: 0.7 });

          // Center detail
          table.circle(leg.x, leg.y, 2);
          table.fill(tableDark);

          // Enhanced connection bracket to table
          table.ellipse(leg.x, leg.y - 4, 8, 4);
          table.fill(metalAccent);

          table.ellipse(leg.x, leg.y - 3, 6, 3);
          table.fill(legColor);

          table.ellipse(leg.x, leg.y - 3, 6, 1);
          table.fill(metalHighlight);
        });

        // Modern cable management system (center)
        table.ellipse(x, y, 20, 12);
        table.fill(tableDark);

        table.ellipse(x, y, 16, 10);
        table.fill(metalAccent);

        table.ellipse(x, y, 14, 8);
        table.fill(0x263238);

        // Professional cable ports with metal finish
        table.circle(x - 4, y, 1.5);
        table.circle(x + 4, y, 1.5);
        table.fill(0x000000);

        // Port rings (chrome finish)
        table.circle(x - 4, y, 2);
        table.circle(x + 4, y, 2);
        table.stroke({ width: 0.5, color: metalHighlight });

        // Executive surface details

        // Corner accent details
        const cornerAccents = [
          { x: x - 35, y: y - 20, angle: 0 },
          { x: x + 35, y: y - 20, angle: 90 },
          { x: x - 35, y: y + 20, angle: 270 },
          { x: x + 35, y: y + 20, angle: 180 },
        ];

        cornerAccents.forEach((accent) => {
          table.ellipse(accent.x, accent.y, 8, 4);
          table.fill({ color: metalAccent, alpha: 0.3 });

          table.ellipse(accent.x, accent.y, 6, 3);
          table.fill({ color: metalHighlight, alpha: 0.2 });
        });

        // Professional surface reflection
        table.ellipse(x - 10, y - 8, 50, 20);
        table.fill({ color: 0xffffff, alpha: 0.08 });

        // Subtle ambient lighting effect
        table.ellipse(x, y - 5, 60, 15);
        table.fill({ color: glossyHighlight, alpha: 0.12 });

        // Premium edge inlay
        table.ellipse(x, y, 78, 48);
        table.stroke({ width: 1, color: tableHighlight });

        // Outer professional border
        table.ellipse(x, y, 82, 52);
        table.stroke({ width: 1, color: metalAccent });

        // Table surface texture details
        for (let i = 0; i < 4; i++) {
          const angle = (i * 90 * Math.PI) / 180;
          const textureX = x + Math.cos(angle) * 25;
          const textureY = y + Math.sin(angle) * 15;

          table.ellipse(textureX, textureY, 12, 3);
          table.fill({ color: tableShadow, alpha: 0.1 });
        }

        // Maintain exact same collision bounds
        const bounds = {
          x: x - 80,
          y: y - 50,
          width: 160,
          height: 100,
          label: "meeting-table",
        };

        if (colliders) {
          addWithCollider(camera, table, bounds, colliders);
        }

        return table;
      };

      const createReceptionCounter = (x, y, camera, colliders) => {
        const counter = new Graphics();

        // Main counter surface - rich mahogany with marble inlay
        counter.rect(x - 80, y - 20, 160, 40);
        counter.fill(0xa0522d);

        // Marble inlay strip
        counter.rect(x - 75, y - 15, 150, 8);
        counter.fill(0xf8f9fa);

        // Marble veining pattern
        counter.rect(x - 70, y - 13, 20, 1);
        counter.fill(0xadb5bd);
        counter.rect(x - 40, y - 12, 35, 1);
        counter.fill(0xadb5bd);
        counter.rect(x + 10, y - 14, 25, 1);
        counter.fill(0xadb5bd);
        counter.rect(x + 45, y - 11, 20, 1);
        counter.fill(0xadb5bd);

        // Wood grain texture on main surface
        counter.rect(x - 75, y - 5, 150, 1);
        counter.fill(0x8b4513);
        counter.rect(x - 72, y + 2, 144, 1);
        counter.fill(0x8b4513);
        counter.rect(x - 78, y + 8, 156, 1);
        counter.fill(0x8b4513);
        counter.rect(x - 70, y + 12, 140, 1);
        counter.fill(0x8b4513);

        // Counter edge highlight
        counter.rect(x - 80, y - 20, 160, 2);
        counter.fill(0xcd853f);

        // Counter shadow/depth - enhanced gradient
        counter.rect(x - 80, y + 18, 160, 4);
        counter.fill(0x5d4037);
        counter.rect(x + 78, y - 20, 4, 40);
        counter.fill(0x5d4037);

        // Reception counter supports
        counter.rect(x - 75, y + 15, 8, 8);
        counter.fill(0x5d4037);
        counter.rect(x - 25, y + 15, 8, 8);
        counter.fill(0x5d4037);
        counter.rect(x + 25, y + 15, 8, 8);
        counter.fill(0x5d4037);
        counter.rect(x + 67, y + 15, 8, 8);
        counter.fill(0x5d4037);

        // Modern monitor with animated screen
        const monitor = new Graphics();

        // Monitor bezel - sleek black with silver trim
        monitor.rect(x - 20, y - 25, 40, 30);
        monitor.fill(0x2c3e50);

        // Silver trim
        monitor.rect(x - 19, y - 24, 38, 1);
        monitor.fill(0x95a5a6);
        monitor.rect(x - 19, y + 4, 38, 1);
        monitor.fill(0x95a5a6);

        // Screen bezel
        monitor.rect(x - 18, y - 23, 36, 26);
        monitor.fill(0x1a1a2e);

        // Animated screen content
        const screenContent = new Graphics();

        // Create animated elements that will cycle
        const createScreenAnimation = () => {
          screenContent.clear();

          // Background - professional blue gradient
          screenContent.rect(x - 15, y - 20, 30, 20);
          screenContent.fill(0x2980b9);

          // Animated progress bars
          const time = Date.now() * 0.001;
          const progress1 = (Math.sin(time * 0.5) + 1) * 0.5;
          const progress2 = (Math.sin(time * 0.7 + 1) + 1) * 0.5;
          const progress3 = (Math.sin(time * 0.3 + 2) + 1) * 0.5;

          // Progress bar backgrounds
          screenContent.rect(x - 12, y - 17, 24, 2);
          screenContent.fill(0x34495e);
          screenContent.rect(x - 12, y - 13, 24, 2);
          screenContent.fill(0x34495e);
          screenContent.rect(x - 12, y - 9, 24, 2);
          screenContent.fill(0x34495e);

          // Animated progress fills
          screenContent.rect(x - 12, y - 17, 24 * progress1, 2);
          screenContent.fill(0x27ae60);
          screenContent.rect(x - 12, y - 13, 24 * progress2, 2);
          screenContent.fill(0xf39c12);
          screenContent.rect(x - 12, y - 9, 24 * progress3, 2);
          screenContent.fill(0xe74c3c);

          // Blinking cursor
          if (Math.floor(time * 2) % 2) {
            screenContent.rect(x + 10, y - 5, 1, 3);
            screenContent.fill(0xffffff);
          }

          // Scrolling text simulation
          const scrollOffset = (time * 20) % 40;
          screenContent.rect(x - 14, y - 5, 2, 1);
          screenContent.fill(0xffffff);
          screenContent.rect(x - 14 + scrollOffset, y - 3, 3, 1);
          screenContent.fill(0xffffff);
          screenContent.rect(x - 14 + ((scrollOffset + 10) % 30), y - 1, 4, 1);
          screenContent.fill(0xffffff);
        };

        // Initial screen setup
        createScreenAnimation();
        monitor.addChild(screenContent);

        // Start animation loop
        const animateScreen = () => {
          createScreenAnimation();
          requestAnimationFrame(animateScreen);
        };
        animateScreen();

        // Monitor stand
        monitor.rect(x - 8, y + 8, 16, 8);
        monitor.fill(0x57606f);
        monitor.rect(x - 6, y + 16, 12, 6);
        monitor.fill(0x3d4454);

        // Monitor brand logo
        monitor.rect(x - 3, y + 4, 6, 1);
        monitor.fill(0x95a5a6);

        counter.addChild(monitor);

        // Modern office phone with details
        const phone = new Graphics();

        // Phone base
        phone.rect(x + 30, y - 5, 15, 10);
        phone.fill(0x2c3e50);

        // Phone display
        phone.rect(x + 32, y - 3, 6, 3);
        phone.fill(0x0984e3);

        // Phone buttons
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 4; j++) {
            phone.rect(x + 31 + j * 3, y + 1 + i * 2, 2, 1.5);
            phone.fill(0x57606f);
          }
        }

        // Phone handset
        phone.rect(x + 46, y - 4, 3, 8);
        phone.fill(0x34495e);

        counter.addChild(phone);

        // Enhanced keyboard
        const keyboard = new Graphics();

        // Keyboard base
        keyboard.rect(x - 15, y + 5, 30, 12);
        keyboard.fill(0x2f3640);

        // Keyboard keys area
        keyboard.rect(x - 13, y + 7, 26, 8);
        keyboard.fill(0x1e272e);

        // Individual keys
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 3; j++) {
            keyboard.rect(x - 11 + i * 3, y + 8 + j * 2.5, 2.5, 2);
            keyboard.fill(0x40444a);
          }
        }

        // Space bar
        keyboard.rect(x - 8, y + 14, 16, 2);
        keyboard.fill(0x40444a);

        counter.addChild(keyboard);

        // Enhanced papers with multiple sheets
        const papers = new Graphics();

        // Bottom sheet
        papers.rect(x - 50, y - 7, 20, 15);
        papers.fill(0xf8f9fa);
        papers.stroke({ width: 1, color: 0xbdc3c7 });

        // Middle sheet (slightly offset)
        papers.rect(x - 49, y - 8, 20, 15);
        papers.fill(0xffffff);
        papers.stroke({ width: 1, color: 0xbdc3c7 });

        // Top sheet
        papers.rect(x - 48, y - 9, 20, 15);
        papers.fill(0xffffff);
        papers.stroke({ width: 1, color: 0xbdc3c7 });

        // Text lines on papers
        papers.rect(x - 46, y - 7, 16, 0.5);
        papers.fill(0x7f8c8d);
        papers.rect(x - 46, y - 5, 14, 0.5);
        papers.fill(0x7f8c8d);
        papers.rect(x - 46, y - 3, 12, 0.5);
        papers.fill(0x7f8c8d);
        papers.rect(x - 46, y - 1, 15, 0.5);
        papers.fill(0x7f8c8d);

        counter.addChild(papers);

        // Additional reception accessories

        // Name plate/sign
        const nameplate = new Graphics();
        nameplate.rect(x - 70, y - 8, 15, 6);
        nameplate.fill(0x2c3e50);
        nameplate.rect(x - 69, y - 7, 13, 4);
        nameplate.fill(0xffffff);
        // Text placeholder lines
        nameplate.rect(x - 67, y - 6, 9, 0.5);
        nameplate.fill(0x2c3e50);
        nameplate.rect(x - 67, y - 4, 7, 0.5);
        nameplate.fill(0x2c3e50);
        counter.addChild(nameplate);

        // Pen holder with pens
        const penHolder = new Graphics();
        penHolder.rect(x + 55, y - 2, 8, 8);
        penHolder.fill(0x34495e);
        // Pens
        penHolder.rect(x + 57, y - 5, 1, 6);
        penHolder.fill(0x3498db);
        penHolder.rect(x + 59, y - 4, 1, 5);
        penHolder.fill(0xe74c3c);
        penHolder.rect(x + 61, y - 6, 1, 7);
        penHolder.fill(0x2ecc71);
        counter.addChild(penHolder);

        // Business card holder
        const cardHolder = new Graphics();
        cardHolder.rect(x + 40, y + 5, 12, 6);
        cardHolder.fill(0x95a5a6);
        cardHolder.rect(x + 41, y + 6, 10, 4);
        cardHolder.fill(0xffffff);
        counter.addChild(cardHolder);

        // Small potted plant
        const plant = new Graphics();
        plant.rect(x - 75, y + 5, 6, 6);
        plant.fill(0x8b4513);
        plant.rect(x - 74, y + 3, 4, 4);
        plant.fill(0x27ae60);
        plant.rect(x - 73, y + 1, 2, 3);
        plant.fill(0x2ecc71);
        counter.addChild(plant);

        const bounds = {
          x: x - 80,
          y: y - 23,
          width: 160,
          height: 42,
        };

        // ✅ Collider (unchanged)
        if (camera && colliders) {
          addWithCollider(camera, counter, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "elevator",
          bounds,
          message:
            "An unmanned reception desk. The screen is active, but there's nothing to do here",
          bubble: null,
        });

        return counter;
      };

      const createOfficeCounters = (x, y, n, camera, colliders) => {
        const officeArea = new Graphics();

        // Individual counter creation function
        const createSingleCounter = (counterX, counterY, counterIndex) => {
          const counter = new Graphics();

          // Desk surface - professional wood finish
          counter.rect(counterX - 40, counterY - 25, 80, 50);
          counter.fill(0xa0522d);

          // Wood grain texture
          counter.rect(counterX - 35, counterY - 20, 70, 1);
          counter.fill(0x8b4513);
          counter.rect(counterX - 32, counterY - 10, 64, 1);
          counter.fill(0x8b4513);
          counter.rect(counterX - 38, counterY, 76, 1);
          counter.fill(0x8b4513);
          counter.rect(counterX - 30, counterY + 10, 60, 1);
          counter.fill(0x8b4513);

          // Desk edge highlight
          counter.rect(counterX - 40, counterY - 25, 80, 2);
          counter.fill(0xcd853f);

          // Desk shadow/depth
          counter.rect(counterX - 40, counterY + 23, 80, 4);
          counter.fill(0x5d4037);
          counter.rect(counterX + 38, counterY - 25, 4, 50);
          counter.fill(0x5d4037);

          // Desk legs
          counter.rect(counterX - 35, counterY + 20, 6, 6);
          counter.fill(0x5d4037);
          counter.rect(counterX + 29, counterY + 20, 6, 6);
          counter.fill(0x5d4037);

          // Laptop with animated screen
          const laptop = new Graphics();

          // Laptop base
          laptop.rect(counterX - 15, counterY - 15, 30, 20);
          laptop.fill(0x2c3e50);

          // Laptop screen
          laptop.rect(counterX - 13, counterY - 30, 26, 15);
          laptop.fill(0x34495e);

          // Screen bezel
          laptop.rect(counterX - 11, counterY - 28, 22, 11);
          laptop.fill(0x1a1a2e);

          // Animated screen content
          const screenContent = new Graphics();

          const createLaptopAnimation = () => {
            screenContent.clear();

            // Screen background
            screenContent.rect(counterX - 10, counterY - 27, 20, 9);
            screenContent.fill(0x2980b9);

            const time = Date.now() * 0.001 + counterIndex * 0.5;

            // Animated elements based on counter index
            if (counterIndex === 0) {
              // Email interface
              screenContent.rect(counterX - 9, counterY - 26, 18, 1.5);
              screenContent.fill(0x3498db);

              // Email list items
              const emailOffset = (time * 3) % 12;
              screenContent.rect(
                counterX - 8,
                counterY - 24 + emailOffset,
                16,
                0.8
              );
              screenContent.fill(0xffffff);
              screenContent.rect(
                counterX - 8,
                counterY - 22 + emailOffset,
                14,
                0.8
              );
              screenContent.fill(0xecf0f1);
              screenContent.rect(
                counterX - 8,
                counterY - 20 + emailOffset,
                15,
                0.8
              );
              screenContent.fill(0xffffff);
            } else if (counterIndex === 1) {
              // Spreadsheet interface
              for (let i = 0; i < 5; i++) {
                screenContent.rect(counterX - 9 + i * 4, counterY - 27, 0.3, 9);
                screenContent.fill(0x7f8c8d);
              }
              for (let i = 0; i < 6; i++) {
                screenContent.rect(
                  counterX - 9,
                  counterY - 26 + i * 1.5,
                  18,
                  0.3
                );
                screenContent.fill(0x7f8c8d);
              }

              // Animated cell selection
              const cellX = Math.floor((time * 2) % 4);
              const cellY = Math.floor((time * 1.5) % 5);
              screenContent.rect(
                counterX - 9 + cellX * 4,
                counterY - 26 + cellY * 1.5,
                4,
                1.5
              );
              screenContent.fill(0x3498db);
            } else if (counterIndex === 2) {
              // Code editor
              screenContent.rect(counterX - 9, counterY - 27, 18, 1.5);
              screenContent.fill(0x2c3e50);

              // Code lines
              const codeScroll = (time * 2) % 15;
              screenContent.rect(
                counterX - 8,
                counterY - 25 + codeScroll,
                10,
                0.8
              );
              screenContent.fill(0xe74c3c);
              screenContent.rect(
                counterX - 8,
                counterY - 23 + codeScroll,
                14,
                0.8
              );
              screenContent.fill(0x2ecc71);
              screenContent.rect(
                counterX - 8,
                counterY - 21 + codeScroll,
                8,
                0.8
              );
              screenContent.fill(0xf39c12);
              screenContent.rect(
                counterX - 8,
                counterY - 19 + codeScroll,
                12,
                0.8
              );
              screenContent.fill(0x9b59b6);
            } else {
              // Dashboard/charts
              screenContent.rect(counterX - 9, counterY - 26, 18, 1.5);
              screenContent.fill(0x34495e);

              // Animated bar chart
              const bar1 = Math.sin(time * 0.8) * 3 + 5;
              const bar2 = Math.sin(time * 1.2 + 1) * 2.5 + 4;
              const bar3 = Math.sin(time * 0.6 + 2) * 3.5 + 6;

              screenContent.rect(counterX - 6, counterY - 20, 3, -bar1);
              screenContent.fill(0x3498db);
              screenContent.rect(counterX - 2, counterY - 20, 3, -bar2);
              screenContent.fill(0xe74c3c);
              screenContent.rect(counterX + 2, counterY - 20, 3, -bar3);
              screenContent.fill(0x2ecc71);
            }

            // Blinking cursor
            if (Math.floor(time * 2) % 2) {
              screenContent.rect(counterX + 7, counterY - 22, 0.8, 1.5);
              screenContent.fill(0xffffff);
            }
          };

          createLaptopAnimation();
          laptop.addChild(screenContent);

          // Laptop keyboard
          laptop.rect(counterX - 12, counterY - 2, 24, 6);
          laptop.fill(0x2c3e50);

          // Laptop trackpad
          laptop.rect(counterX - 3, counterY + 6, 6, 4);
          laptop.fill(0x34495e);

          counter.addChild(laptop);

          // Animated coffee mug with steam
          const coffeeMug = new Graphics();

          // Mug base
          coffeeMug.rect(counterX + 20, counterY - 8, 6, 8);
          coffeeMug.fill(0x8b4513);

          // Coffee surface
          coffeeMug.rect(counterX + 21, counterY - 7, 4, 1.5);
          coffeeMug.fill(0x3e2723);

          // Mug handle
          coffeeMug.rect(counterX + 26, counterY - 6, 2, 4);
          coffeeMug.fill(0x8b4513);
          coffeeMug.rect(counterX + 27, counterY - 5, 0.8, 2);
          coffeeMug.fill(0x000000);

          // Animated steam
          const steamGraphics = new Graphics();
          const createSteamAnimation = () => {
            steamGraphics.clear();

            const steamTime = Date.now() * 0.003 + counterIndex * 0.3;

            // Multiple steam wisps
            for (let i = 0; i < 3; i++) {
              const wispX =
                counterX + 22 + i * 1.5 + Math.sin(steamTime * 2 + i) * 1.5;
              const wispY = counterY - 10 - ((steamTime * 8 + i * 4) % 12);
              const opacity = Math.max(
                0,
                1 - ((steamTime * 8 + i * 4) % 12) / 12
              );

              if (opacity > 0) {
                steamGraphics.rect(wispX, wispY, 0.8, 1.5);
                steamGraphics.fill(0xe8f4f8);
              }
            }
          };

          createSteamAnimation();
          coffeeMug.addChild(steamGraphics);

          counter.addChild(coffeeMug);

          // Books stack
          const books = new Graphics();

          // Book 1 (bottom)
          books.rect(counterX - 35, counterY + 5, 12, 10);
          books.fill(0x3498db);
          books.rect(counterX - 35, counterY + 5, 12, 1.5);
          books.fill(0x2980b9);

          // Book 2 (middle)
          books.rect(counterX - 34, counterY + 2, 12, 10);
          books.fill(0xe74c3c);
          books.rect(counterX - 34, counterY + 2, 12, 1.5);
          books.fill(0xc0392b);

          // Book 3 (top)
          books.rect(counterX - 33, counterY - 1, 12, 10);
          books.fill(0x2ecc71);
          books.rect(counterX - 33, counterY - 1, 12, 1.5);
          books.fill(0x27ae60);

          counter.addChild(books);

          // Papers and documents
          const papers = new Graphics();

          // Paper stack
          papers.rect(counterX + 8, counterY + 8, 15, 12);
          papers.fill(0xffffff);
          papers.rect(counterX + 9, counterY + 7, 15, 12);
          papers.fill(0xf8f9fa);
          papers.rect(counterX + 10, counterY + 6, 15, 12);
          papers.fill(0xffffff);

          // Text lines
          papers.rect(counterX + 11, counterY + 9, 12, 0.4);
          papers.fill(0x7f8c8d);
          papers.rect(counterX + 11, counterY + 11, 10, 0.4);
          papers.fill(0x7f8c8d);
          papers.rect(counterX + 11, counterY + 13, 9, 0.4);
          papers.fill(0x7f8c8d);
          papers.rect(counterX + 11, counterY + 15, 11, 0.4);
          papers.fill(0x7f8c8d);

          counter.addChild(papers);

          // Desk accessories

          // Pen holder
          const penHolder = new Graphics();
          penHolder.rect(counterX + 28, counterY - 5, 5, 6);
          penHolder.fill(0x34495e);
          // Pens
          penHolder.rect(counterX + 29, counterY - 7, 0.8, 4);
          penHolder.fill(0x3498db);
          penHolder.rect(counterX + 30.5, counterY - 6, 0.8, 3);
          penHolder.fill(0xe74c3c);
          penHolder.rect(counterX + 32, counterY - 8, 0.8, 5);
          penHolder.fill(0x2ecc71);
          counter.addChild(penHolder);

          // Desk lamp
          const lamp = new Graphics();
          lamp.rect(counterX - 32, counterY - 15, 2, 15);
          lamp.fill(0x57606f);
          lamp.rect(counterX - 37, counterY - 18, 8, 4);
          lamp.fill(0xffa502);
          lamp.rect(counterX - 34, counterY + 2, 4, 2);
          lamp.fill(0x40444a);
          counter.addChild(lamp);

          // Mouse
          const mouse = new Graphics();
          mouse.rect(counterX + 3, counterY + 12, 4, 6);
          mouse.fill(0x57606f);
          mouse.rect(counterX + 3.5, counterY + 13, 1.5, 3);
          mouse.fill(0x40444a);
          mouse.rect(counterX + 5.5, counterY + 13, 1.5, 3);
          mouse.fill(0x40444a);
          counter.addChild(mouse);
          // Replace custom chair with shared component
          const chair = createOfficeChair(counterX, counterY + 60, false); // false = no internal collider
          counter.addChild(chair);

          // Animate
          const steam = new Graphics();
          const animate = () => {
            createLaptopAnimation();
            steam.clear();
            const t = Date.now() * 0.003 + counterIndex * 0.3;
            for (let i = 0; i < 3; i++) {
              const sx = counterX + 22 + i * 1.5 + Math.sin(t * 2 + i) * 1.5;
              const sy = counterY - 10 - ((t * 8 + i * 4) % 12);
              const opacity = Math.max(0, 1 - ((t * 8 + i * 4) % 12) / 12);
              if (opacity > 0) steam.rect(sx, sy, 0.8, 1.5).fill(0xe8f4f8);
            }
            requestAnimationFrame(animate);
          };
          animate();
          counter.addChild(steam);

          return counter;
        };

        const spacing = 100;
        const startX = x - spacing * 1.5;

        for (let i = 0; i < n; i++) {
          const counterX = startX + i * spacing;
          const counter = createSingleCounter(counterX, y, i);
          officeArea.addChild(counter);

          // Back wall
          const backWall = new Graphics();
          backWall.rect(counterX - 45, y - 38, 90, 6);
          backWall.fill(0x95a5a6);
          officeArea.addChild(backWall);

          // Left side wall (only for i == 0)
          if (i === 0) {
            const leftWall = new Graphics();
            leftWall.rect(counterX - 50, y - 38, 6, 66);
            leftWall.fill(0x95a5a6);
            officeArea.addChild(leftWall);

            if (camera && colliders) {
              addWithCollider(
                camera,
                leftWall,
                {
                  x: counterX - 50,
                  y: y - 38,
                  width: 6,
                  height: 66,
                  label: "cubicle-wall-left",
                },
                colliders
              );
            }
          }

          // Right side wall (only for i == 3)
          if (i === n - 1) {
            const rightWall = new Graphics();
            rightWall.rect(counterX + 45, y - 38, 6, 66);
            rightWall.fill(0x95a5a6);
            officeArea.addChild(rightWall);

            if (camera && colliders) {
              addWithCollider(
                camera,
                rightWall,
                {
                  x: counterX + 45,
                  y: y - 38,
                  width: 6,
                  height: 66,
                  label: "cubicle-wall-right",
                },
                colliders
              );
            }
          }

          // Middle dividers for counters 1, 2, 3
          if (i !== 0) {
            const sideWall = new Graphics();
            sideWall.rect(counterX - 50, y - 38, 6, 66);
            sideWall.fill(0x95a5a6);
            officeArea.addChild(sideWall);

            if (camera && colliders) {
              addWithCollider(
                camera,
                sideWall,
                {
                  x: counterX - 50,
                  y: y - 38,
                  width: 6,
                  height: 66,
                  label: `cubicle-divider-${i}`,
                },
                colliders
              );
            }
          }

          // Add colliders for counter and back wall
          if (camera && colliders) {
            addWithCollider(
              camera,
              counter,
              {
                x: counterX - 40,
                y: y - 25,
                width: 80,
                height: 50,
                label: `office-counter-${i + 1}`,
              },
              colliders
            );

            addWithCollider(
              camera,
              backWall,
              {
                x: counterX - 45,
                y: y - 36,
                width: 90,
                height: 6,
                label: `cubicle-back-wall-${i + 1}`,
              },
              colliders
            );
          }
        }

        return officeArea;
      };

      // Lobby seating area
      const createLobbySeating = (x, y, camera, colliders) => {
        const sofa = new Graphics();
        const sofaWidth = 120;
        const sofaHeight = 60;

        // 🛋️ Sofa body
        sofa.lineStyle(2, 0x2c3e50, 1);
        sofa.beginFill(0x34495e);
        sofa.drawRoundedRect(x, y, sofaWidth, sofaHeight, 8);
        sofa.endFill();

        // 🪑 Backrest
        sofa.lineStyle(2, 0x2c3e50, 1);
        sofa.beginFill(0x2c3e50);
        sofa.drawRoundedRect(x + 5, y, sofaWidth - 10, 12, 6);
        sofa.endFill();

        // 💺 Cushions
        const cushionWidth = (sofaWidth - 20) / 3;
        for (let i = 0; i < 3; i++) {
          const cushionX = x + 10 + i * cushionWidth;
          const cushionY = y + 15;

          sofa.lineStyle(1, 0x2c3e50, 1);
          sofa.beginFill(0x3498db);
          sofa.drawRoundedRect(cushionX, cushionY, cushionWidth - 2, 35, 4);
          sofa.endFill();

          // Tuft
          sofa.beginFill(0x2980b9);
          sofa.drawCircle(cushionX + cushionWidth / 2 - 1, cushionY + 17, 2);
          sofa.endFill();
        }

        // 🛡️ Armrests
        sofa.lineStyle(2, 0x2c3e50, 1);
        sofa.beginFill(0x2c3e50);
        sofa.drawRoundedRect(x, y + 12, 15, 48, 6);
        sofa.drawRoundedRect(x + sofaWidth - 15, y + 12, 15, 48, 6);
        sofa.endFill();

        // ✨ Depth
        sofa.lineStyle(1, 0x1a252f, 0.3);
        sofa.drawRoundedRect(x + 2, y + 2, sofaWidth - 4, sofaHeight - 4, 6);
        sofa.stroke();

        // 🔘 Legs
        sofa.beginFill(0x2c3e50);
        sofa.drawCircle(x + 12, y + sofaHeight - 5, 3);
        sofa.drawCircle(x + sofaWidth - 12, y + sofaHeight - 5, 3);
        sofa.drawCircle(x + 12, y + 8, 3);
        sofa.drawCircle(x + sofaWidth - 12, y + 8, 3);
        sofa.endFill();

        // 📐 Accent lines
        sofa.lineStyle(1, 0x5dade2, 0.6);
        sofa.moveTo(x + 15, y + 5);
        sofa.lineTo(x + 25, y + 5);
        sofa.moveTo(x + sofaWidth - 25, y + 5);
        sofa.lineTo(x + sofaWidth - 15, y + 5);
        sofa.stroke();

        // const bounds = {
        //   x,
        //   y,
        //   width: sofaWidth,
        //   height: sofaHeight,
        //   label: "lobby-seating"
        // };

        const bounds = {
          x: x - 4,
          y: y - 2,
          width: sofaWidth,
          height: sofaHeight,
          label: "lobby-seating",
        };

        // ✅ Add collision
        if (camera && colliders) {
          addWithCollider(camera, sofa, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        console.log("Registering lobby-seating interactable at", bounds);
        window.interactables.push({
          label: "lobby-seating",
          bounds,
          message:
            "This sofa seems inviting, but it's part of the office decor",
          bubble: null,
        });

        return sofa;
      };

      const createVerticalLeftSofa = (x, y, camera, colliders) => {
        const sofa = new Graphics();
        const sofaWidth = 60; // Swapped dimensions for vertical orientation
        const sofaHeight = 120;

        // 🛋️ Main sofa body with gradient effect
        sofa.lineStyle(2, 0x5d4037, 1);
        sofa.beginFill(0x8d6e63); // Warm brown leather
        sofa.drawRoundedRect(x, y, sofaWidth, sofaHeight, 8);
        sofa.endFill();

        // Body shadow for depth
        sofa.lineStyle(0);
        sofa.beginFill(0x6d4c41); // Darker shadow
        sofa.drawRoundedRect(x + 2, y + 2, sofaWidth - 4, sofaHeight - 4, 6);
        sofa.endFill();

        // 🪑 Left-facing backrest (right side of vertical sofa)
        sofa.lineStyle(2, 0x5d4037, 1);
        sofa.beginFill(0x795548); // Rich brown backrest
        sofa.drawRoundedRect(x + sofaWidth - 12, y + 5, 12, sofaHeight - 10, 6);
        sofa.endFill();

        // Backrest padding detail
        sofa.lineStyle(0);
        sofa.beginFill(0x8d6e63); // Lighter padding
        sofa.drawRoundedRect(x + sofaWidth - 10, y + 8, 8, sofaHeight - 16, 4);
        sofa.endFill();

        // 💺 Vertical seat cushions (3 cushions stacked vertically)
        const cushionHeight = (sofaHeight - 20) / 3;
        for (let i = 0; i < 3; i++) {
          const cushionX = x + 8;
          const cushionY = y + 10 + i * cushionHeight;

          // Main cushion with rich texture
          sofa.lineStyle(1, 0x5d4037, 1);
          sofa.beginFill(0xa1887f); // Warm taupe cushion
          sofa.drawRoundedRect(cushionX, cushionY, 35, cushionHeight - 2, 4);
          sofa.endFill();

          // Cushion highlight
          sofa.lineStyle(0);
          sofa.beginFill(0xbcaaa4); // Light highlight
          sofa.drawRoundedRect(cushionX + 1, cushionY + 1, 33, 3, 2);
          sofa.endFill();

          // Cushion shadow
          sofa.beginFill(0x8d6e63); // Darker shadow
          sofa.drawRoundedRect(
            cushionX + 1,
            cushionY + cushionHeight - 6,
            33,
            3,
            2
          );
          sofa.endFill();

          // Elegant button tuft
          sofa.beginFill(0x5d4037); // Dark button
          sofa.drawCircle(cushionX + 17, cushionY + cushionHeight / 2 - 1, 2);
          sofa.endFill();

          // Button highlight
          sofa.beginFill(0x795548); // Subtle highlight
          sofa.drawCircle(cushionX + 16, cushionY + cushionHeight / 2 - 2, 1);
          sofa.endFill();
        }

        // 🛡️ Armrests (top and bottom for vertical orientation)
        sofa.lineStyle(2, 0x5d4037, 1);
        sofa.beginFill(0x6d4c41); // Darker armrests

        // Top armrest
        sofa.drawRoundedRect(x + 5, y, 40, 15, 6);
        // Bottom armrest
        sofa.drawRoundedRect(x + 5, y + sofaHeight - 15, 40, 15, 6);
        sofa.endFill();

        // Armrest padding
        sofa.lineStyle(0);
        sofa.beginFill(0x8d6e63); // Lighter padding
        sofa.drawRoundedRect(x + 8, y + 3, 34, 9, 3);
        sofa.drawRoundedRect(x + 8, y + sofaHeight - 12, 34, 9, 3);
        sofa.endFill();

        // ✨ Elegant piping detail
        sofa.lineStyle(2, 0x4a2c20, 1); // Dark piping
        sofa.drawRoundedRect(x + 4, y + 4, sofaWidth - 8, sofaHeight - 8, 4);
        sofa.stroke();

        // 🔘 Stylish wooden legs
        const legColor = 0x3e2723; // Dark wood
        const legHighlight = 0x5d4037; // Wood highlight

        // Front legs (visible from left side)
        sofa.beginFill(legColor);
        sofa.drawRoundedRect(x + 8, y + sofaHeight - 8, 4, 8, 2);
        sofa.drawRoundedRect(x + 8, y, 4, 8, 2);
        sofa.endFill();

        // Back legs (partially visible)
        sofa.beginFill(0x2e1a16); // Darker for distance
        sofa.drawRoundedRect(x + sofaWidth - 8, y + sofaHeight - 8, 4, 8, 2);
        sofa.drawRoundedRect(x + sofaWidth - 8, y, 4, 8, 2);
        sofa.endFill();

        // Leg highlights
        sofa.beginFill(legHighlight);
        sofa.drawRect(x + 8, y + 1, 1, 6);
        sofa.drawRect(x + 8, y + sofaHeight - 7, 1, 6);
        sofa.endFill();

        // 📐 Luxury accent stitching
        sofa.lineStyle(1, 0xd7ccc8, 0.8); // Light stitching

        // Vertical stitching lines on backrest
        sofa.moveTo(x + sofaWidth - 8, y + 10);
        sofa.lineTo(x + sofaWidth - 8, y + sofaHeight - 10);

        // Horizontal stitching on armrests
        sofa.moveTo(x + 10, y + 7);
        sofa.lineTo(x + 38, y + 7);
        sofa.moveTo(x + 10, y + sofaHeight - 8);
        sofa.lineTo(x + 38, y + sofaHeight - 8);
        sofa.stroke();

        // ✨ Subtle fabric texture lines
        sofa.lineStyle(1, 0x6d4c41, 0.3);
        for (let i = 0; i < 4; i++) {
          const lineX = x + 12 + i * 8;
          sofa.moveTo(lineX, y + 20);
          sofa.lineTo(lineX, y + sofaHeight - 20);
        }
        sofa.stroke();

        // 🌟 Elegant corner details
        sofa.lineStyle(0);
        sofa.beginFill(0xbcaaa4); // Light accent
        sofa.drawCircle(x + 6, y + 6, 2);
        sofa.drawCircle(x + sofaWidth - 6, y + 6, 2);
        sofa.drawCircle(x + 6, y + sofaHeight - 6, 2);
        sofa.drawCircle(x + sofaWidth - 6, y + sofaHeight - 6, 2);
        sofa.endFill();

        // const bounds = {
        //   x,
        //   y,
        //   width: sofaWidth,
        //   height: sofaHeight,
        //   label: "vertical-left-sofa"
        // };

        const bounds = {
          x: x - 4,
          y: y - 2,
          width: sofaWidth,
          height: sofaHeight,
          label: "vertical-left-sofa",
        };

        // ✅ Add collision
        if (camera && colliders) {
          addWithCollider(camera, sofa, bounds, colliders);
        }

        return sofa;
      };

      const createWindows = (roomWidth, roomHeight) => {
        const windows = [];
        const windowWidth = 120;
        const windowHeight = 80;

        // Windows on top wall
        for (let i = 0; i < 3; i++) {
          const window = new Graphics();
          const x = (roomWidth / 4) * (i + 1) - windowWidth / 2;

          // Outer window frame (dark border)
          window.rect(x - 4, 1, windowWidth + 8, windowHeight + 8);
          window.fill(0x2c3e50);

          // Inner window frame (lighter border)
          window.rect(x - 2, 3, windowWidth + 4, windowHeight + 4);
          window.fill(0x34495e);

          // Main window area (sky blue with pixelated effect)
          window.rect(x, 5, windowWidth, windowHeight);
          window.fill(0x3498db);

          // Pixelated glass effect - create small squares
          for (let px = 0; px < windowWidth; px += 8) {
            for (let py = 0; py < windowHeight; py += 8) {
              if ((px + py) % 16 === 0) {
                window.rect(x + px, 5 + py, 8, 8);
                window.fill(0x87ceeb);
              }
            }
          }

          // Thick pixelated window cross (vertical)
          window.rect(x + windowWidth / 2 - 4, 5, 8, windowHeight);
          window.fill(0x2c3e50);

          // Thick pixelated window cross (horizontal)
          window.rect(x, 5 + windowHeight / 2 - 4, windowWidth, 8);
          window.fill(0x2c3e50);

          // Corner details for pixelated look
          const cornerSize = 6;
          // Top-left corner
          window.rect(x - 2, 3, cornerSize, cornerSize);
          window.fill(0x1a252f);
          // Top-right corner
          window.rect(
            x + windowWidth + 2 - cornerSize,
            3,
            cornerSize,
            cornerSize
          );
          window.fill(0x1a252f);
          // Bottom-left corner
          window.rect(
            x - 2,
            5 + windowHeight + 2 - cornerSize,
            cornerSize,
            cornerSize
          );
          window.fill(0x1a252f);
          // Bottom-right corner
          window.rect(
            x + windowWidth + 2 - cornerSize,
            5 + windowHeight + 2 - cornerSize,
            cornerSize,
            cornerSize
          );
          window.fill(0x1a252f);

          windows.push(window);
        }

        return windows;
      };

      const createDoor = (x, y, orientation = "bottom") => {
        const door = new Graphics();

        let doorWidth = 80;
        let doorHeight = 8;

        // Swap width & height for vertical orientations
        if (orientation === "left" || orientation === "right") {
          [doorWidth, doorHeight] = [doorHeight, doorWidth];
        }

        // Shadow
        door.beginFill(0x3e1f0d);
        door.drawRect(x + 2, y + 2, doorWidth, doorHeight);
        door.endFill();

        // Main body
        door.beginFill(0x4b2e1e);
        door.drawRect(x, y, doorWidth, doorHeight);
        door.endFill();

        // Grain
        door.beginFill(0x6d4c41);
        for (let i = 0; i < doorWidth; i += 8) {
          for (let j = 0; j < doorHeight; j += 4) {
            if ((i + j) % 12 === 0) {
              door.drawRect(x + i, y + j, 6, 2);
            }
          }
        }
        door.endFill();

        return door;
      };

      const createBookshelf = (x, y, camera, colliders) => {
        const shelf = new Graphics();
        const width = 60;
        const height = 100;
        const shelfCount = 3;
        const bookPadding = 5;

        // Enhanced frame with gradient effect
        shelf.beginFill(0x5d4037); // Rich walnut brown
        shelf.drawRect(x, y, width, height);
        shelf.endFill();

        // Add frame shadow/depth
        shelf.beginFill(0x3e2723); // Darker shadow
        shelf.drawRect(x + width - 2, y + 2, 2, height - 2); // Right shadow
        shelf.drawRect(x + 2, y + height - 2, width - 2, 2); // Bottom shadow
        shelf.endFill();

        // Add frame highlight
        shelf.beginFill(0x8d6e63); // Lighter highlight
        shelf.drawRect(x, y, 1, height); // Left highlight
        shelf.drawRect(x, y, width, 1); // Top highlight
        shelf.endFill();

        // Enhanced shelves with depth
        const shelfHeight = height / (shelfCount + 1);
        for (let i = 1; i <= shelfCount; i++) {
          const shelfY = y + i * shelfHeight;

          // Shelf surface
          shelf.beginFill(0x6d4c41);
          shelf.drawRect(x + 2, shelfY - 1, width - 4, 2);
          shelf.endFill();

          // Shelf shadow
          shelf.beginFill(0x3e2723);
          shelf.drawRect(x + 2, shelfY + 1, width - 4, 1);
          shelf.endFill();
        }

        // Enhanced books with more variety and details
        const bookColors = [
          0xe74c3c, 0x3498db, 0x27ae60, 0xf1c40f, 0x9b59b6, 0xe67e22, 0x1abc9c,
          0x34495e, 0x8e44ad, 0xc0392b, 0x16a085, 0x2980b9, 0x7f8c8d, 0xd35400,
          0x8b4513,
        ];

        for (let row = 0; row < shelfCount; row++) {
          let bx = x + bookPadding;
          const by = y + row * shelfHeight + 5;

          while (bx < x + width - 10) {
            const bookWidth = 5 + Math.floor(Math.random() * 4);
            const bookHeight = shelfHeight - 10 - Math.floor(Math.random() * 5);
            const bookY = by + (shelfHeight - 10 - bookHeight);

            // Main book color
            const bookColor =
              bookColors[Math.floor(Math.random() * bookColors.length)];
            shelf.beginFill(bookColor);
            shelf.drawRect(bx, bookY, bookWidth, bookHeight);
            shelf.endFill();

            // Book spine details
            if (bookWidth > 6) {
              // Spine highlight
              shelf.beginFill(0xffffff);
              shelf.drawRect(bx, bookY, 1, bookHeight);
              shelf.endFill();

              // Spine shadow
              shelf.beginFill(0x2c3e50);
              shelf.drawRect(bx + bookWidth - 1, bookY, 1, bookHeight);
              shelf.endFill();
            }

            // Book title lines (small decorative lines)
            if (bookHeight > 8 && Math.random() > 0.3) {
              shelf.lineStyle(1, 0xffffff, 0.6);
              const lineY = bookY + Math.floor(bookHeight * 0.3);
              shelf.moveTo(bx + 1, lineY);
              shelf.lineTo(bx + bookWidth - 1, lineY);

              if (bookHeight > 12 && Math.random() > 0.5) {
                const lineY2 = bookY + Math.floor(bookHeight * 0.6);
                shelf.moveTo(bx + 1, lineY2);
                shelf.lineTo(bx + bookWidth - 1, lineY2);
              }
            }

            // Reset line style
            shelf.lineStyle(0);

            bx += bookWidth + 2;
          }
        }

        // Add decorative corner brackets
        shelf.lineStyle(1, 0x8d6e63);
        // Top-left corner
        shelf.moveTo(x + 2, y + 8);
        shelf.lineTo(x + 2, y + 2);
        shelf.lineTo(x + 8, y + 2);

        // Top-right corner
        shelf.moveTo(x + width - 8, y + 2);
        shelf.lineTo(x + width - 2, y + 2);
        shelf.lineTo(x + width - 2, y + 8);

        // Bottom-left corner
        shelf.moveTo(x + 2, y + height - 8);
        shelf.lineTo(x + 2, y + height - 2);
        shelf.lineTo(x + 8, y + height - 2);

        // Bottom-right corner
        shelf.moveTo(x + width - 8, y + height - 2);
        shelf.lineTo(x + width - 2, y + height - 2);
        shelf.lineTo(x + width - 2, y + height - 8);

        shelf.lineStyle(0);

        const bounds = {
          x: x - 3,
          y,
          width: width + 4,
          height,
          label: "bookshelf",
        };

        // ✅ Add collider
        if (camera && colliders) {
          addWithCollider(camera, shelf, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "bookshelf",
          bounds,
          message:
            "A handcrafted wooden bookshelf filled with colorful books. The spines show signs of age and use.",
          bubble: null,
        });

        return shelf;
      };

      const createOfficeCat = (x, y) => {
        const cat = new Container(); // Assuming PIXI is globally available or imported

        // Enhanced cat colors
        const mainColor = 0x95a5a6; // Soft gray
        const darkColor = 0x7f8c8d; // Darker gray for stripes
        const lightColor = 0xbdc3c7; // Lighter gray for highlights
        const pinkColor = 0xf8c8dc; // Inner ears and nose
        const blackColor = 0x2c3e50; // Eyes and details

        // --- Core Principles for PixiJS Graphics ---
        // 1. All drawing commands (`drawCircle`, `drawEllipse`, `lineTo`, etc.) are relative
        //    to the Graphics object's own local coordinate system (its 0,0).
        // 2. To position a drawn shape, you should set the `x` and `y` properties
        //    of the Graphics object itself, *after* drawing.
        // 3. Clear and redraw: If you modify a Graphics object's drawing, you generally need
        //    to `clear()` it and redraw everything. For static shapes like these,
        //    drawing them once is enough.
        // 4. Order of addition: Children added later are rendered on top of earlier children.

        // Body (main oval, more realistic proportions)
        const body = new Graphics();
        body.beginFill(mainColor);
        body.drawEllipse(0, 0, 28, 16); // Draw relative to its own (0,0)
        body.endFill();

        // Body stripes/patterns
        body.beginFill(darkColor);
        body.drawEllipse(-5, -3, 15, 3);
        body.drawEllipse(5, 2, 12, 3);
        body.drawEllipse(-8, 6, 10, 2);
        body.endFill();

        // Chest/belly highlight
        body.beginFill(lightColor);
        body.drawEllipse(-8, 8, 18, 6);
        body.endFill();
        body.x = x; // Position the body Graphics object
        body.y = y;

        // Tail (more curved and detailed)
        const tail = new Graphics();
        tail.beginFill(mainColor);
        tail.drawEllipse(0, 0, 12, 5); // Base of the tail
        tail.drawEllipse(6, -7, 8, 4); // Middle segment
        tail.drawEllipse(9, -15, 6, 3); // Tip
        tail.endFill();

        // Tail stripes (relative to tail's own (0,0))
        tail.beginFill(darkColor);
        tail.drawEllipse(0, 0, 8, 2);
        tail.drawEllipse(6, -7, 5, 2);
        tail.endFill();
        tail.x = x + 22; // Position the tail Graphics object
        tail.y = y + 5;
        tail.pivot.set(0, 0); // Set pivot for rotation at the base of the tail

        // Head (better proportions)
        const head = new Graphics();
        head.beginFill(mainColor);
        head.drawCircle(0, 0, 12); // Draw relative to its own (0,0)
        head.endFill();

        // Head stripes
        head.beginFill(darkColor);
        head.drawEllipse(4, -7, 8, 2);
        head.drawEllipse(-3, -4, 6, 2);
        head.drawEllipse(2, 3, 10, 2);
        head.endFill();
        head.x = x - 22; // Position the head Graphics object
        head.y = y - 8;

        // Ears (more realistic shape)
        const ears = new Graphics();
        ears.beginFill(mainColor);
        // Left ear (relative to ears's (0,0))
        ears.moveTo(-8, 0);
        ears.lineTo(-3, -7);
        ears.lineTo(2, -3);
        ears.closePath();
        // Right ear
        ears.moveTo(2, -3);
        ears.lineTo(7, -7);
        ears.lineTo(12, 0);
        ears.closePath();
        ears.endFill();
        ears.x = x - 22; // Position the ears Graphics object
        ears.y = y - 15;
        ears.pivot.set(0, 0); // Pivot for ear twitch

        // Inner ears
        const innerEars = new Graphics();
        innerEars.beginFill(pinkColor);
        innerEars.moveTo(-6, 1);
        innerEars.lineTo(-2, -3);
        innerEars.lineTo(0, 0);
        innerEars.closePath();
        innerEars.moveTo(0, 0);
        innerEars.lineTo(4, -3);
        innerEars.lineTo(8, 1);
        innerEars.closePath();
        innerEars.endFill();
        innerEars.x = x - 22; // Position the innerEars Graphics object
        innerEars.y = y - 15;

        // Muzzle area
        const muzzle = new Graphics();
        muzzle.beginFill(lightColor);
        muzzle.drawEllipse(0, 0, 8, 5);
        muzzle.endFill();
        muzzle.x = x - 22; // Position the muzzle Graphics object
        muzzle.y = y - 4;

        // Eyes (closed/sleeping with lashes)
        const eyes = new Graphics();
        eyes.lineStyle(2, blackColor);
        // Left eye (curved sleepy line)
        eyes.moveTo(-5, 0);
        eyes.quadraticCurveTo(-3, -2, -1, 0);
        // Right eye
        eyes.moveTo(3, 0);
        eyes.quadraticCurveTo(5, -2, 7, 0);

        // Eyelashes
        eyes.lineStyle(1, blackColor, 0.8);
        eyes.moveTo(-5, -1);
        eyes.lineTo(-6, -3);
        eyes.moveTo(-1, -1);
        eyes.lineTo(-2, -3);
        eyes.moveTo(3, -1);
        eyes.lineTo(2, -3);
        eyes.moveTo(7, -1);
        eyes.lineTo(8, -3);
        eyes.x = x - 22; // Position the eyes Graphics object
        eyes.y = y - 10;

        // Nose (heart-shaped)
        const nose = new Graphics();
        nose.beginFill(pinkColor);
        nose.moveTo(0, 0);
        nose.quadraticCurveTo(-2, -2, 0, -1);
        nose.quadraticCurveTo(2, -2, 0, 0);
        nose.endFill();
        nose.x = x - 22; // Position the nose Graphics object
        nose.y = y - 6;

        // Mouth (subtle smile)
        const mouth = new Graphics();
        mouth.lineStyle(1, blackColor);
        mouth.moveTo(0, 0);
        mouth.quadraticCurveTo(-2, 2, -4, 1);
        mouth.moveTo(0, 0);
        mouth.quadraticCurveTo(2, 2, 4, 1);
        mouth.x = x - 22; // Position the mouth Graphics object
        mouth.y = y - 5;

        // Paws (visible ones)
        const paws = new Graphics();
        paws.beginFill(mainColor);
        // Front paws tucked under
        paws.drawEllipse(0, 0, 6, 4);
        paws.drawEllipse(10, 2, 5, 3);
        paws.endFill();

        // Paw pads
        paws.beginFill(pinkColor);
        paws.drawCircle(0, 0, 1.5);
        paws.drawCircle(10, 2, 1);
        paws.endFill();
        paws.x = x - 12; // Position the paws Graphics object
        paws.y = y + 10;

        // Whiskers
        const whiskers = new Graphics();
        whiskers.lineStyle(1, blackColor, 0.8);
        // Left whiskers
        whiskers.moveTo(0, 0);
        whiskers.lineTo(-8, -2);
        whiskers.moveTo(0, 2);
        whiskers.lineTo(-8, 2);
        whiskers.moveTo(0, 4);
        whiskers.lineTo(-8, 6);
        // Right whiskers
        whiskers.moveTo(14, 0);
        whiskers.lineTo(22, -2);
        whiskers.moveTo(14, 2);
        whiskers.lineTo(22, 2);
        whiskers.moveTo(14, 4);
        whiskers.lineTo(22, 6);
        whiskers.x = x - 30; // Position the whiskers Graphics object
        whiskers.y = y - 6;

        // Add all parts to container
        // Order matters for layering! (back to front)
        cat.addChild(
          body,
          tail,
          head,
          ears,
          innerEars,
          muzzle,
          eyes,
          nose,
          mouth,
          paws,
          whiskers
        );

        // Enhanced breathing animation with tail twitch
        let breathingTime = 0;
        let tailTime = 0;
        let earTwitchTimer = 0; // To control ear twitch frequency

        const animate = () => {
          breathingTime += 0.03;
          tailTime += 0.02;
          earTwitchTimer += 1; // Increment on each frame

          // Gentle breathing animation (scaling the body)
          // Adjust pivot to scale from the bottom/center for a more natural effect
          body.pivot.set(0, 16); // Center of the bottom of the ellipse (relative to body's own coords)
          const breathingScale = 1 + Math.sin(breathingTime) * 0.015;
          body.scale.set(breathingScale, breathingScale);

          // Subtle tail movement (rotation around its pivot)
          const tailMovement = Math.sin(tailTime * 0.5) * 0.1; // Increased range for visibility
          tail.rotation = tailMovement;

          // Occasional ear twitch
          if (earTwitchTimer % 200 === 0 && Math.random() < 0.8) {
            // Adjust frequency
            ears.rotation = 0.1; // Rotate slightly
            setTimeout(() => {
              ears.rotation = 0; // Reset after a short delay
            }, 100);
          }

          requestAnimationFrame(animate);
        };

        animate();

        return cat;
      };

      // Example usage (assuming you have a PixiJS Application instance named 'app'):
      // const app = new PIXI.Application({
      //     width: 800,
      //     height: 600,
      //     backgroundColor: 0x1099bb,
      // });
      // document.body.appendChild(app.view);
      //
      // const officeCat = createOfficeCat(app.screen.width / 2, app.screen.height / 2);
      // app.stage.addChild(officeCat);

      const createOfficeFurniture = (gameState) => {
        const { camera, colliders } = gameState;

        // Conference table (assume ~160×64)
        const confTable = createConferenceTable(600, 400);
        addWithCollider(
          camera,
          confTable,
          {
            x: 600 - 104,
            y: 400 - 50,
            width: 205,
            height: 105,
          },
          gameState.colliders
        );

        // Office desks
        const deskPositions = [
          { x: 150, y: 150, rotation: 0 },
          { x: 150, y: 350, rotation: 0 },
          { x: 150, y: 550, rotation: 0 },
        ];

        deskPositions.forEach((pos) => {
          const desk = createOfficeDesk(pos.x, pos.y);
          desk.rotation = pos.rotation;
          addWithCollider(
            camera,
            desk,
            {
              x: pos.x - 40,
              y: pos.y - 20,
              width: 80,
              height: 44,
            },
            gameState.colliders
          );
        });

        // Office chairs (optional: block or allow walk-through)
        const chairPositions = [
          { x: 200, y: 180 },
          { x: 200, y: 400 },
          { x: 150, y: 490 },
          // Conference chairs
          { x: 550, y: 320 },
          { x: 650, y: 320 },
          { x: 750, y: 340 },
          { x: 550, y: 450 },
          { x: 650, y: 450 },
          { x: 750, y: 450 },
        ];

        chairPositions.forEach((pos) => {
          const chair = createOfficeChair(pos.x, pos.y);
          // Comment out the collider if chairs should be passable
          addWithCollider(
            camera,
            chair,
            {
              x: pos.x - 18,
              y: pos.y - 30,
              width: 40,
              height: 58,
            },
            gameState.colliders
          );
        });

        // Whiteboards
        const whiteboard1 = createWhiteboard(
          38,
          250,
          camera,
          gameState.colliders
        );
        camera.addChild(whiteboard1);
      };

      const createConferenceTable = (x, y) => {
        const table = new Graphics();

        // Enhanced professional color palette
        const tableColor = 0x8b4513;
        const tableHighlight = 0xcd853f;
        const tableShadow = 0x5d4037;
        const tableDark = 0x3e2723;
        const legColor = 0x6d4c41;
        const legShadow = 0x4e342e;
        const glossyHighlight = 0xf4a460;
        const metalAccent = 0x37474f;
        const metalHighlight = 0x546e7a;

        // Main table surface with enhanced depth
        table.rect(x - 100, y - 50, 200, 100);
        table.fill(tableColor);

        // Enhanced beveled edges
        table.rect(x - 100, y - 50, 200, 4);
        table.fill(tableHighlight);

        table.rect(x - 100, y - 50, 4, 100);
        table.fill(tableHighlight);

        table.rect(x - 100, y + 46, 200, 4);
        table.fill(tableShadow);

        table.rect(x + 96, y - 50, 4, 100);
        table.fill(tableShadow);

        // Inner table surface (main working area)
        table.rect(x - 96, y - 46, 192, 92);
        table.fill(tableColor);

        // Sophisticated wood grain pattern
        for (let i = 0; i < 12; i++) {
          const grainY = y - 40 + i * 7;
          const grainWidth = 170 + Math.sin(i * 0.5) * 10;

          table.rect(x - 85, grainY, grainWidth, 0.8);
          table.fill({ color: tableShadow, alpha: 0.6 });

          table.rect(x - 80, grainY + 1, grainWidth - 10, 0.4);
          table.fill({ color: tableHighlight, alpha: 0.4 });
        }

        // Premium glossy surface highlights
        table.rect(x - 75, y - 35, 50, 3);
        table.fill({ color: glossyHighlight, alpha: 0.8 });

        table.rect(x + 15, y - 25, 35, 2);
        table.fill({ color: glossyHighlight, alpha: 0.6 });

        table.rect(x - 55, y + 8, 70, 1.5);
        table.fill({ color: glossyHighlight, alpha: 0.7 });

        // Professional metal trim
        table.rect(x - 100, y - 50, 200, 100);
        table.stroke({ width: 3, color: metalAccent });

        table.rect(x - 98, y - 48, 196, 96);
        table.stroke({ width: 1, color: metalHighlight });

        // Enhanced table legs with modern design
        const legPositions = [
          { x: x - 80, y: y - 30 },
          { x: x + 80, y: y - 30 },
          { x: x - 80, y: y + 30 },
          { x: x + 80, y: y + 30 },
        ];

        legPositions.forEach((leg) => {
          // Leg base (chrome finish)
          table.circle(leg.x, leg.y, 7);
          table.fill(metalAccent);

          // Leg highlight ring
          table.circle(leg.x - 1, leg.y - 1, 6);
          table.fill(metalHighlight);

          // Leg main body
          table.circle(leg.x, leg.y, 5);
          table.fill(legColor);

          // Leg wood grain
          table.circle(leg.x, leg.y, 4);
          table.fill(tableColor);

          // Leg shadow
          table.circle(leg.x + 1, leg.y + 1, 3);
          table.fill({ color: legShadow, alpha: 0.7 });

          // Center detail
          table.circle(leg.x, leg.y, 1.5);
          table.fill(tableDark);

          // Enhanced connection bracket
          table.rect(leg.x - 3, leg.y - 6, 6, 6);
          table.fill(metalAccent);

          table.rect(leg.x - 2, leg.y - 5, 4, 4);
          table.fill(legColor);

          table.rect(leg.x - 2, leg.y - 5, 4, 1);
          table.fill(metalHighlight);
        });

        // Modern cable management system
        table.rect(x - 18, y - 8, 36, 16);
        table.fill(tableDark);

        table.rect(x - 16, y - 6, 32, 12);
        table.fill(metalAccent);

        table.rect(x - 15, y - 5, 30, 10);
        table.fill(0x263238);

        // Professional cable ports with metal finish
        table.circle(x - 10, y, 1.5);
        table.circle(x, y, 1.5);
        table.circle(x + 10, y, 1.5);
        table.fill(0x000000);

        // Port rings (chrome finish)
        table.circle(x - 10, y, 2);
        table.circle(x, y, 2);
        table.circle(x + 10, y, 2);
        table.stroke({ width: 0.5, color: metalHighlight });

        // Executive nameplate area
        table.rect(x - 30, y - 46, 60, 10);
        table.fill(tableDark);

        table.rect(x - 28, y - 44, 56, 6);
        table.fill(metalAccent);

        table.rect(x - 26, y - 42, 52, 2);
        table.fill(metalHighlight);

        // Professional surface reflection
        table.rect(x - 90, y - 42, 180, 20);
        table.fill({ color: 0xffffff, alpha: 0.08 });

        // Additional premium details

        // Corner reinforcements
        const cornerSize = 8;
        const corners = [
          { x: x - 95, y: y - 45 },
          { x: x + 95 - cornerSize, y: y - 45 },
          { x: x - 95, y: y + 45 - cornerSize },
          { x: x + 95 - cornerSize, y: y + 45 - cornerSize },
        ];

        corners.forEach((corner) => {
          table.rect(corner.x, corner.y, cornerSize, cornerSize);
          table.fill({ color: metalAccent, alpha: 0.3 });

          table.rect(
            corner.x + 1,
            corner.y + 1,
            cornerSize - 2,
            cornerSize - 2
          );
          table.fill({ color: metalHighlight, alpha: 0.2 });
        });

        // Subtle ambient lighting effect
        table.rect(x - 85, y - 38, 170, 8);
        table.fill({ color: glossyHighlight, alpha: 0.15 });

        // Professional edge detail
        table.rect(x - 99, y - 49, 198, 98);
        table.stroke({ width: 1, color: tableHighlight });

        return table;
      };

      const createPlant = (x, y, camera, colliders) => {
        const plant = new Graphics();

        // Pot with gradient effect (darker at bottom)
        plant.rect(x - 12, y + 8, 24, 18);
        plant.fill(0x8b4513); // Saddle brown

        // Pot rim
        plant.rect(x - 14, y + 6, 28, 4);
        plant.fill(0xa0522d); // Sienna

        // Soil
        plant.rect(x - 10, y + 8, 20, 3);
        plant.fill(0x654321); // Dark brown

        // Plant stem
        plant.rect(x - 1, y - 2, 2, 12);
        plant.fill(0x228b22); // Forest green

        // Main leaves (layered for depth)
        // Back leaves (darker)
        plant.circle(x - 12, y - 8, 9);
        plant.circle(x + 12, y - 8, 9);
        plant.fill(0x006400); // Dark green

        // Middle leaves
        plant.circle(x - 8, y - 12, 10);
        plant.circle(x + 8, y - 12, 10);
        plant.fill(0x228b22); // Forest green

        // Front leaves (lighter/brighter)
        plant.circle(x - 4, y - 18, 8);
        plant.circle(x + 4, y - 18, 8);
        plant.circle(x, y - 22, 11);
        plant.fill(0x32cd32); // Lime green

        // Small accent leaves
        plant.circle(x - 6, y - 25, 5);
        plant.circle(x + 6, y - 25, 5);
        plant.fill(0x90ee90); // Light green

        // Optional: Add small highlights on leaves
        plant.circle(x - 2, y - 20, 2);
        plant.circle(x + 10, y - 10, 2);
        plant.circle(x - 10, y - 6, 2);
        plant.fill(0xadff2f); // Green yellow highlights

        const bounds = {
          x: x - 14,
          y: y - 30,
          width: 28,
          height: 56,
          label: "plant",
        };

        if (camera && colliders) {
          addWithCollider(camera, plant, bounds, colliders);
        }

        // 🗨️ Optional interaction bubble
        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "plant",
          bounds,
          message: "A small healthy plant brightens the space.",
          bubble: null,
        });

        return plant;
      };

      const createWhiteboard = (x, y, camera, colliders) => {
        const board = new Graphics();

        // Board surface
        board.rect(x - 5, y - 40, 10, 80);
        board.fill(0xffffff);

        // Board frame
        board.rect(x - 6, y - 41, 12, 82);
        board.stroke({ width: 2, color: 0x2c3e50 });

        const bounds = {
          x: x - 6,
          y: y - 41,
          width: 12,
          height: 82,
          label: "whiteboard",
        };

        if (colliders) {
          addWithCollider(camera, board, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "whiteboard",
          bounds,
          message: "A simple whiteboard...nothing to do here",
          bubble: null,
        });

        return board;
      };

      const createPrinter = (x, y) => {
        const printer = new Graphics();

        // Printer body
        printer.rect(x - 20, y - 15, 40, 30);
        printer.fill(0xbdc3c7);

        // Printer details
        printer.rect(x - 15, y - 10, 30, 5);
        printer.fill(0x2c3e50);

        return printer;
      };

      const createWaterCooler = (x, y) => {
        const cooler = new Graphics();

        // Base
        cooler.rect(x - 15, y + 10, 30, 20);
        cooler.fill(0x3498db);

        // Water bottle
        cooler.rect(x - 10, y - 20, 20, 30);
        cooler.fill(0x85c1e9);

        // Tap
        cooler.rect(x - 5, y + 5, 10, 3);
        cooler.fill(0x2c3e50);

        return cooler;
      };

      // New functions for lobby-specific furniture

      // Vending machine
      const createVendingMachine = (x, y, camera, colliders) => {
        const machine = new Container();

        // Main body with gradient effect
        const body = new Graphics();
        body.beginFill(0x2c3e50);
        body.drawRect(x, y, 40, 80);
        body.endFill();

        // Body highlights and shadows for depth
        body.beginFill(0x34495e);
        body.drawRect(x, y, 2, 80); // Left highlight
        body.drawRect(x, y, 40, 2); // Top highlight
        body.endFill();

        body.beginFill(0x1a252f);
        body.drawRect(x + 38, y + 2, 2, 78); // Right shadow
        body.drawRect(x + 2, y + 78, 38, 2); // Bottom shadow
        body.endFill();

        // Brand name at top
        const brandText = new Graphics();
        brandText.beginFill(0xffffff);
        brandText.drawRect(x + 8, y + 3, 24, 4);
        brandText.endFill();
        brandText.beginFill(0x2c3e50);
        brandText.drawRect(x + 9, y + 3.5, 22, 3);
        brandText.endFill();

        // Glass front with realistic reflection
        const glassFront = new Graphics();
        glassFront.beginFill(0x85c1e9, 0.3); // Semi-transparent blue
        glassFront.drawRect(x + 5, y + 10, 30, 50);
        glassFront.endFill();

        // Glass frame
        glassFront.lineStyle(2, 0x34495e);
        glassFront.drawRect(x + 5, y + 10, 30, 50);
        glassFront.lineStyle(0);

        // Glass reflection effect
        glassFront.beginFill(0xffffff, 0.2);
        glassFront.drawRect(x + 6, y + 11, 8, 48);
        glassFront.endFill();

        // Snack shelves (metal dividers)
        const shelves = new Graphics();
        shelves.beginFill(0x95a5a6);
        for (let row = 0; row < 3; row++) {
          const shelfY = y + 25 + row * 10;
          shelves.drawRect(x + 6, shelfY, 28, 1);
        }
        shelves.endFill();

        // Enhanced snacks with variety
        const snacks = new Container();
        const snackTypes = [
          { color: 0xe74c3c, name: "chips" },
          { color: 0xf39c12, name: "cookies" },
          { color: 0x27ae60, name: "candy" },
          { color: 0x9b59b6, name: "chocolate" },
        ];

        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 3; col++) {
            const snack = new Graphics();
            const snackType = snackTypes[row];

            // Main snack package
            snack.beginFill(snackType.color);
            snack.drawRect(x + 8 + col * 8, y + 15 + row * 10, 6, 6);
            snack.endFill();

            // Package highlight
            snack.beginFill(0xffffff, 0.4);
            snack.drawRect(x + 8 + col * 8, y + 15 + row * 10, 6, 1);
            snack.endFill();

            // Package brand line
            snack.beginFill(0xffffff, 0.6);
            snack.drawRect(x + 9 + col * 8, y + 17 + row * 10, 4, 0.5);
            snack.endFill();

            snacks.addChild(snack);
          }
        }

        // Control panel background
        const controlPanel = new Graphics();
        controlPanel.beginFill(0x34495e);
        controlPanel.drawRect(x + 3, y + 62, 34, 16);
        controlPanel.endFill();

        // Panel border
        controlPanel.lineStyle(1, 0x2c3e50);
        controlPanel.drawRect(x + 3, y + 62, 34, 16);
        controlPanel.lineStyle(0);

        // Coin slot with depth
        const coinSlot = new Graphics();
        coinSlot.beginFill(0x1a252f);
        coinSlot.drawRect(x + 5, y + 65, 8, 3);
        coinSlot.endFill();
        coinSlot.beginFill(0x34495e);
        coinSlot.drawRect(x + 5, y + 65, 8, 1);
        coinSlot.endFill();

        // Coin slot label
        const coinLabel = new Graphics();
        coinLabel.beginFill(0xffffff);
        coinLabel.drawRect(x + 5, y + 63, 8, 1);
        coinLabel.endFill();

        // Enhanced buttons with LED indicators
        const buttons = new Container();
        const buttonColors = [0xe74c3c, 0xf39c12, 0x27ae60];

        for (let i = 0; i < 3; i++) {
          const button = new Graphics();
          const buttonX = x + 20 + i * 6;
          const buttonY = y + 68;

          // Button shadow
          button.beginFill(0x1a252f);
          button.drawCircle(buttonX + 0.5, buttonY + 0.5, 2.2);
          button.endFill();

          // Main button
          button.beginFill(buttonColors[i]);
          button.drawCircle(buttonX, buttonY, 2);
          button.endFill();

          // Button highlight
          button.beginFill(0xffffff, 0.4);
          button.drawEllipse(buttonX - 0.5, buttonY - 0.5, 1.2, 0.8);
          button.endFill();

          // LED indicator
          const led = new Graphics();
          led.beginFill(0x2ecc71);
          led.drawCircle(buttonX, buttonY - 4, 0.8);
          led.endFill();

          button.addChild(led);
          buttons.addChild(button);
        }

        // Dispensing slot with depth
        const dispensingSlot = new Graphics();
        dispensingSlot.beginFill(0x000000);
        dispensingSlot.drawRect(x + 8, y + 72, 24, 6);
        dispensingSlot.endFill();

        // Slot opening highlight
        dispensingSlot.beginFill(0x34495e);
        dispensingSlot.drawRect(x + 8, y + 72, 24, 1);
        dispensingSlot.endFill();

        // Slot bottom
        dispensingSlot.beginFill(0x1a252f);
        dispensingSlot.drawRect(x + 8, y + 77, 24, 1);
        dispensingSlot.endFill();

        // Digital display
        const display = new Graphics();
        display.beginFill(0x000000);
        display.drawRect(x + 15, y + 63, 12, 4);
        display.endFill();

        // Display border
        display.lineStyle(1, 0x34495e);
        display.drawRect(x + 15, y + 63, 12, 4);
        display.lineStyle(0);

        // Add all components to machine
        machine.addChild(
          body,
          brandText,
          glassFront,
          shelves,
          snacks,
          controlPanel,
          coinSlot,
          coinLabel,
          buttons,
          dispensingSlot,
          display
        );

        // Animated elements
        let time = 0;
        let ledTime = 0;

        const animate = () => {
          time += 0.02;
          ledTime += 0.1;

          // Humming vibration effect
          const vibration = Math.sin(time * 8) * 0.15;
          machine.x = vibration;

          // Pulsing LED indicators
          const ledAlpha = 0.7 + Math.sin(ledTime) * 0.3;
          buttons.children.forEach((button, index) => {
            const led = button.children[0];
            led.alpha = ledAlpha + Math.sin(ledTime + index * 0.5) * 0.2;
          });

          // Flickering display
          if (Math.random() < 0.05) {
            display.alpha = 0.3;
            setTimeout(() => {
              display.alpha = 1;
            }, 50);
          }

          // Occasional snack package glint
          if (Math.random() < 0.01) {
            const randomSnack =
              snacks.children[
                Math.floor(Math.random() * snacks.children.length)
              ];
            randomSnack.alpha = 1.5;
            setTimeout(() => {
              randomSnack.alpha = 1;
            }, 100);
          }

          requestAnimationFrame(animate);
        };

        animate();

        const bounds = {
          x: x,
          y: y,
          width: 40,
          height: 82,
          label: "vending-machine",
        };

        // ✅ Add collision box
        if (colliders && camera) {
          addWithCollider(camera, machine, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "vending-machine",
          bounds,
          message:
            "The vending machine hums and glows softly. LED indicators pulse rhythmically, but the coin slot seems jammed.",
          bubble: null,
        });

        return machine;
      };

      // Digital clock display
      const createDigitalClock = (x, y, camera, colliders) => {
        const clock = new Graphics();

        // Outer frame with gradient effect
        clock.rect(x - 2, y - 2, 84, 34);
        clock.fill(0x34495e); // Dark blue-gray frame

        // Main clock body with rounded corners effect
        clock.rect(x, y, 80, 30);
        clock.fill(0x2c3e50); // Dark background

        // Inner bezel
        clock.rect(x + 2, y + 2, 76, 26);
        clock.fill(0x1a252f); // Even darker inner

        // LED display area with subtle glow effect
        clock.rect(x + 5, y + 5, 70, 20);
        clock.fill(0x0a0a0a); // Very dark display

        // Display border for depth
        clock.rect(x + 4, y + 4, 72, 22);
        clock.stroke({ color: 0x1e3a8a, width: 1 }); // Subtle blue border

        // Time text with glow effect
        const timeText = new Text({
          text: "00:00:00",
          style: new TextStyle({
            fontSize: 14,
            fill: 0x00ff41, // Bright green LED color
            fontFamily: "monospace",
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: 0x00aa2e,
            dropShadowBlur: 3,
            dropShadowDistance: 0,
          }),
        });

        timeText.x = x + 40;
        timeText.y = y + 15;
        timeText.anchor.set(0.5);
        clock.addChild(timeText);

        // Colon blinking dots (for animation)
        const colonText = new Text({
          text: ":",
          style: new TextStyle({
            fontSize: 14,
            fill: 0x00ff41,
            fontFamily: "monospace",
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: 0x00aa2e,
            dropShadowBlur: 3,
            dropShadowDistance: 0,
          }),
        });
        const dotText = new Text({
          text: ":",
          style: new TextStyle({
            fontSize: 14,
            fill: 0x00ff41,
            fontFamily: "monospace",
            fontWeight: "bold",
            dropShadow: true,
            dropShadowColor: 0x00aa2e,
            dropShadowBlur: 3,
            dropShadowDistance: 0,
          }),
        });

        colonText.x = x + 28;
        colonText.y = y + 14;
        colonText.anchor.set(0.5);
        clock.addChild(colonText);
        dotText.x = x + 52;
        dotText.y = y + 14;
        dotText.anchor.set(0.5);
        clock.addChild(dotText);

        // Update function for real-time display
        const updateTime = () => {
          const now = new Date();

          // Format time
          let hours = now.getHours();
          const minutes = now.getMinutes().toString().padStart(2, "0");
          const seconds = now.getSeconds().toString().padStart(2, "0");

          // Convert to 12-hour format
          hours = hours % 12;
          hours = hours ? hours : 12; // 0 should be 12
          const hoursStr = hours.toString().padStart(2, "0");

          // Update texts
          timeText.text = `${hoursStr} ${minutes} ${seconds}`;

          // Blinking colon effect
          colonText.visible = now.getMilliseconds() < 500;
          dotText.visible = now.getMilliseconds() < 500;
        };

        // Start the clock
        updateTime();
        const interval = setInterval(updateTime, 100);

        // Store interval reference for cleanup
        clock.clockInterval = interval;

        // Add cleanup method
        clock.destroy = function () {
          if (this.clockInterval) {
            clearInterval(this.clockInterval);
          }
          Graphics.prototype.destroy.call(this);
        };

        const bounds = {
          x: x - 2,
          y: y - 2,
          width: 84,
          height: 34,
          label: "digital-clock",
        };

        if (camera && colliders) {
          addWithCollider(camera, clock, bounds, colliders);
        }

        // Optional interaction
        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "digital-clock",
          bounds,
          message: "The digital clock is showing the current time.",
          bubble: null,
        });

        return clock;
      };

      // Water dispenser
      const createWaterDispenser = (x, y, camera, colliders) => {
        const dispenser = new Graphics();

        // Animation variables
        let animationTime = 0;
        let bubbleOffset = 0;
        let ledPulse = 0;
        let waterDrops = [];

        // Create water drop animation
        const createWaterDrop = () => {
          if (Math.random() < 0.05) {
            // 5% chance per frame
            waterDrops.push({
              x: x + 15 + (Math.random() - 0.5) * 10,
              y: y + 55,
              life: 20 + Math.random() * 10,
              maxLife: 30,
            });
          }
        };

        // Update water drops
        const updateWaterDrops = () => {
          waterDrops = waterDrops.filter((drop) => {
            drop.life--;
            drop.y += 0.5;
            return drop.life > 0;
          });
        };

        // Main render function
        const render = () => {
          dispenser.clear();
          animationTime += 0.1;
          bubbleOffset = Math.sin(animationTime * 0.5) * 2;
          ledPulse = (Math.sin(animationTime * 2) + 1) * 0.3 + 0.4;

          // Main body with gradient effect
          dispenser.rect(x, y, 30, 60);
          dispenser.fill(0x3498db);

          // Add depth with shadow/border
          dispenser.rect(x + 1, y + 1, 28, 58);
          dispenser.fill(0x2980b9);

          // Inner main body
          dispenser.rect(x + 2, y + 2, 26, 56);
          dispenser.fill(0x5dade2);

          // Animated highlight on main body
          const highlightIntensity = 0.5 + Math.sin(animationTime * 0.8) * 0.1;
          dispenser.rect(x + 3, y + 3, 8, 54);
          dispenser.fill(0x74b9ff);

          // Water bottle on top with more realistic look
          dispenser.rect(x + 5, y - 15, 20, 20);
          dispenser.fill(0x85c1e9);

          // Bottle highlight
          dispenser.rect(x + 6, y - 14, 6, 18);
          dispenser.fill(0xa8d5f2);

          // Animated water level indicator with bubbles
          dispenser.rect(x + 6, y - 5 + bubbleOffset * 0.2, 18, 8);
          dispenser.fill(0x74b9ff);

          // Animated bubbles in water bottle
          const bubble1Y = y - 8 + Math.sin(animationTime * 1.2) * 3;
          const bubble2Y = y - 12 + Math.sin(animationTime * 0.8 + 1) * 2;

          dispenser.circle(x + 12, bubble1Y, 1);
          dispenser.circle(x + 18, bubble2Y, 0.5);
          dispenser.fill(0x9bd3f5);

          // Bottle cap
          dispenser.rect(x + 13, y - 18, 4, 3);
          dispenser.fill(0x34495e);

          // Dispensing area with depth
          dispenser.rect(x + 8, y + 35, 14, 20);
          dispenser.fill(0x1a5490);

          // Inner dispensing area
          dispenser.rect(x + 9, y + 36, 12, 18);
          dispenser.fill(0x2471a3);

          // Taps with metallic look and subtle glow
          dispenser.circle(x + 10, y + 45, 3);
          dispenser.fill(0x34495e);

          // Tap highlights with animation
          const tapGlow = 0.8 + Math.sin(animationTime * 1.5) * 0.2;
          dispenser.circle(x + 10, y + 44, 2);
          dispenser.fill(0x5d6d7e);

          dispenser.circle(x + 20, y + 45, 3);
          dispenser.fill(0x34495e);

          dispenser.circle(x + 20, y + 44, 2);
          dispenser.fill(0x5d6d7e);

          // Tap centers (darker)
          dispenser.circle(x + 10, y + 45, 1);
          dispenser.circle(x + 20, y + 45, 1);
          dispenser.fill(0x2c3e50);

          // Control panel details
          dispenser.rect(x + 4, y + 15, 22, 12);
          dispenser.fill(0x2c3e50);

          // Panel buttons
          dispenser.rect(x + 6, y + 17, 4, 3);
          dispenser.fill(0xe74c3c);

          dispenser.rect(x + 12, y + 17, 4, 3);
          dispenser.fill(0x3498db);

          dispenser.rect(x + 18, y + 17, 4, 3);
          dispenser.fill(0x2ecc71);

          // Animated LED indicators with pulsing effect
          dispenser.circle(x + 8, y + 23, 1);
          dispenser.fill(0x2ecc71 + Math.floor(ledPulse * 0x111111));

          dispenser.circle(x + 15, y + 23, 1);
          dispenser.fill(0x3498db + Math.floor(ledPulse * 0x111111));

          dispenser.circle(x + 22, y + 23, 1);
          dispenser.fill(0xe74c3c + Math.floor(ledPulse * 0x111111));

          // Brand logo area with subtle glow
          dispenser.rect(x + 10, y + 5, 10, 6);
          dispenser.fill(0x34495e);

          // Logo highlight
          dispenser.rect(x + 11, y + 6, 8, 4);
          dispenser.fill(0x5d6d7e);

          // Base/feet
          dispenser.rect(x - 1, y + 58, 4, 4);
          dispenser.rect(x + 27, y + 58, 4, 4);
          dispenser.fill(0x2c3e50);

          // Drip tray
          dispenser.rect(x + 5, y + 55, 20, 3);
          dispenser.fill(0x95a5a6);

          // Drip tray highlight
          dispenser.rect(x + 6, y + 55, 18, 1);
          dispenser.fill(0xbdc3c7);

          // Animated water drops
          createWaterDrop();
          updateWaterDrops();

          waterDrops.forEach((drop) => {
            const alpha = drop.life / drop.maxLife;
            dispenser.circle(drop.x, drop.y, 1 * alpha);
            dispenser.fill(0x74b9ff);
          });

          // Power indicator light (slow pulse)
          const powerPulse = (Math.sin(animationTime * 0.5) + 1) * 0.5;
          dispenser.circle(x + 26, y + 8, 1);
          dispenser.fill(0x2ecc71 + Math.floor(powerPulse * 0x222222));

          // Cooling system indicator (faster blink)
          if (Math.sin(animationTime * 3) > 0.5) {
            dispenser.circle(x + 4, y + 8, 0.5);
            dispenser.fill(0x3498db);
          }
        };

        // Set up animation loop
        const animate = () => {
          render();
          requestAnimationFrame(animate);
        };

        // Start animation
        animate();

        const bounds = {
          x: x,
          y: y - 15,
          width: 30,
          height: 77, // 60 body + 15 bottle
          label: "water-dispenser",
        };

        // ✅ Collider covering body + bottle (unchanged)
        if (camera && colliders) {
          addWithCollider(camera, dispenser, bounds, colliders);
        }

        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "elevator",
          bounds,
          message:
            "You watch the endless flow of pixels. This water dispenser is decorative",
          bubble: null,
        });

        return dispenser;
      };

      const createStudyTable = (x, y, camera, colliders) => {
        const table = new Graphics();

        // TABLE LEGS (four legs for stability)
        // Front left leg
        table.rect(x - 62, y + 8, 6, 25);
        table.fill(0x654321);

        // Front right leg
        table.rect(x + 56, y + 8, 6, 25);
        table.fill(0x654321);

        // Back left leg
        table.rect(x - 62, y - 18, 6, 25);
        table.fill(0x5a3c1a);

        // Back right leg
        table.rect(x + 56, y - 18, 6, 25);
        table.fill(0x5a3c1a);

        // TABLE SUPPORT BAR
        table.rect(x - 60, y + 20, 120, 4);
        table.fill(0x5a3c1a);

        // TABLETOP (enhanced with wood grain effect)
        // Main tabletop
        table.rect(x - 70, y - 20, 140, 30);
        table.fill(0x8b5a2b);

        // Tabletop border/edge
        table.rect(x - 70, y - 20, 140, 30);
        table.stroke({ color: 0x654321, width: 2 });

        // Wood grain lines
        for (let i = 0; i < 8; i++) {
          table.moveTo(x - 65 + i * 17, y - 18);
          table.lineTo(x - 65 + i * 17, y + 8);
          table.stroke({ color: 0x734a26, width: 1 });
        }

        // Tabletop highlight
        table.rect(x - 68, y - 18, 136, 2);
        table.fill(0xa66830);

        // LAPTOP (more detailed)
        const laptop = new Graphics();

        // Laptop base
        laptop.rect(x - 40, y - 15, 35, 20);
        laptop.fill(0x2c3e50);
        laptop.stroke({ color: 0x1a252f, width: 1 });

        // Laptop screen (slightly angled)
        laptop.rect(x - 38, y - 16, 31, 2);
        laptop.fill(0x34495e); // Screen back

        // Screen display
        laptop.rect(x - 36, y - 14, 27, 15);
        laptop.fill(0x000000);

        // Screen bezel
        laptop.rect(x - 36, y - 14, 27, 15);
        laptop.stroke({ color: 0x2c3e50, width: 1 });

        // Keyboard area
        laptop.rect(x - 37, y - 12, 29, 12);
        laptop.fill(0x34495e);

        // Keyboard keys (simplified grid)
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 10; col++) {
            laptop.rect(x - 35 + col * 2.5, y - 10 + row * 2.5, 2, 2);
            laptop.fill(0x2c3e50);
          }
        }

        // Trackpad
        laptop.rect(x - 25, y - 2, 10, 6);
        laptop.fill(0x1a252f);
        laptop.stroke({ color: 0x2c3e50, width: 1 });

        table.addChild(laptop);

        // OPEN BOOK (more detailed)
        const book = new Graphics();

        // Book pages (layered for depth)
        book.rect(x + 8, y - 14, 29, 18);
        book.fill(0xf8f8ff); // Ghost white

        // Book cover/binding
        book.rect(x + 10, y - 12, 25, 16);
        book.fill(0xffffff);
        book.stroke({ color: 0xbdc3c7, width: 1 });

        // Book spine
        book.rect(x + 22, y - 12, 2, 16);
        book.fill(0xbdc3c7);

        // Text lines on pages
        for (let i = 0; i < 6; i++) {
          // Left page
          book.moveTo(x + 12, y - 8 + i * 2);
          book.lineTo(x + 21, y - 8 + i * 2);
          book.stroke({ color: 0x7f8c8d, width: 0.5 });

          // Right page
          book.moveTo(x + 25, y - 8 + i * 2);
          book.lineTo(x + 33, y - 8 + i * 2);
          book.stroke({ color: 0x7f8c8d, width: 0.5 });
        }

        // Bookmark
        book.rect(x + 30, y - 12, 2, 8);
        book.fill(0xe74c3c);

        table.addChild(book);

        // DESK LAMP (much more detailed)
        const lamp = new Graphics();

        // Lamp base (circular)
        lamp.circle(x + 47, y - 5, 8);
        lamp.fill(0x34495e);
        lamp.stroke({ color: 0x2c3e50, width: 2 });

        // Base inner circle
        lamp.circle(x + 47, y - 5, 5);
        lamp.fill(0x2c3e50);

        // Lamp arm (adjustable sections)
        lamp.rect(x + 45, y - 12, 4, 8);
        lamp.fill(0x34495e);

        // Lamp joint
        lamp.circle(x + 47, y - 12, 2);
        lamp.fill(0x2c3e50);

        // Upper arm
        lamp.rect(x + 42, y - 20, 8, 4);
        lamp.fill(0x34495e);

        // Lamp head (cone-shaped)
        lamp.moveTo(x + 40, y - 25);
        lamp.lineTo(x + 54, y - 25);
        lamp.lineTo(x + 52, y - 20);
        lamp.lineTo(x + 42, y - 20);
        lamp.lineTo(x + 40, y - 25);
        lamp.fill(0x34495e);

        // Lamp head inner (light source)
        lamp.moveTo(x + 42, y - 23);
        lamp.lineTo(x + 52, y - 23);
        lamp.lineTo(x + 50, y - 21);
        lamp.lineTo(x + 44, y - 21);
        lamp.lineTo(x + 42, y - 23);
        lamp.fill(0xfff8dc); // Light color

        // Light beam effect
        lamp.moveTo(x + 46, y - 21);
        lamp.lineTo(x + 30, y - 5);
        lamp.lineTo(x + 50, y - 5);
        lamp.lineTo(x + 50, y - 21);
        lamp.fill(0xfff8dc);
        lamp.alpha = 0.3;

        table.addChild(lamp);

        // Pen holder with pens
        const penHolder = new Graphics();
        penHolder.rect(x + 45, y - 8, 8, 10);
        penHolder.fill(0x34495e);
        penHolder.stroke({ color: 0x2c3e50, width: 1 });

        // Pens sticking out
        penHolder.rect(x + 47, y - 12, 1, 8);
        penHolder.fill(0x3498db); // Blue pen
        penHolder.rect(x + 49, y - 14, 1, 10);
        penHolder.fill(0xe74c3c); // Red pen
        penHolder.rect(x + 51, y - 13, 1, 9);
        penHolder.fill(0x2ecc71); // Green pen

        table.addChild(penHolder);

        // Sticky notes
        const notes = new Graphics();
        notes.rect(x - 10, y - 18, 8, 8);
        notes.fill(0xf1c40f); // Yellow sticky note
        notes.stroke({ color: 0xe67e22, width: 1 });

        notes.rect(x - 8, y - 16, 8, 8);
        notes.fill(0xe67e22); // Orange sticky note
        notes.stroke({ color: 0xd35400, width: 1 });

        table.addChild(notes);

        // ✅ Keep original collider bounds
        if (camera && colliders) {
          addWithCollider(
            camera,
            table,
            {
              x: x - 70,
              y: y - 20,
              width: 140,
              height: 30,
              label: "study-table",
            },
            colliders
          );
        }

        return table;
      };

      const createFloorMat = (x, y, rotation = 0) => {
        const mat = new Graphics();
        const width = 80;
        const height = 40;

        // 🔘 Main mat
        mat.lineStyle(2, 0x4a4a4a, 1);
        mat.beginFill(0x2c3e50);
        mat.drawRoundedRect(0, 0, width, height, 8);
        mat.endFill();

        // 🟦 Inner edge
        mat.lineStyle(1, 0x34495e, 1);
        mat.beginFill(0x34495e);
        mat.drawRoundedRect(3, 3, width - 6, height - 6, 6);
        mat.endFill();

        // 📏 Grid pattern
        mat.lineStyle(0.5, 0x1a252f, 0.3);
        for (let i = 1; i < 5; i++) {
          const lineX = (width / 5) * i;
          mat.moveTo(lineX, 8);
          mat.lineTo(lineX, height - 8);
        }
        for (let i = 1; i < 4; i++) {
          const lineY = (height / 4) * i;
          mat.moveTo(8, lineY);
          mat.lineTo(width - 8, lineY);
        }

        // 🔹 Corner wear
        mat.beginFill(0x1a252f);
        const cornerSize = 3;
        mat.drawCircle(12, 12, cornerSize);
        mat.drawCircle(width - 12, 12, cornerSize);
        mat.drawCircle(12, height - 12, cornerSize);
        mat.drawCircle(width - 12, height - 12, cornerSize);
        mat.endFill();

        // 💧 Texture dots
        mat.beginFill(0x1a252f);
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 6; col++) {
            if ((row + col) % 2 === 0) {
              const dotX = 15 + col * 12;
              const dotY = 20 + row * 12;
              mat.drawCircle(dotX, dotY, 1);
            }
          }
        }
        mat.endFill();

        // ✅ Position and rotate
        mat.pivot.set(width / 2, height / 2);
        mat.x = x;
        mat.y = y;
        mat.rotation = rotation;

        return mat;
      };

      const createWasteBin = (x, y) => {
        const bin = new Graphics();
        const width = 15;
        const height = 20;

        // Main bin body with gradient effect
        bin.beginFill(0x7f8c8d); // Base gray
        bin.drawRect(x, y + 2, width, height - 2);
        bin.endFill();

        // Left side highlight for 3D effect
        bin.beginFill(0x95a5a6); // Lighter gray for highlight
        bin.drawRect(x, y + 2, 2, height - 2);
        bin.endFill();

        // Right side shadow for depth
        bin.beginFill(0x6c7b7d); // Darker gray for shadow
        bin.drawRect(x + width - 2, y + 2, 2, height - 2);
        bin.endFill();

        // Lid with metallic look
        bin.beginFill(0x5d6d7e); // Base lid color
        bin.drawRect(x - 1, y, width + 2, 4);
        bin.endFill();

        // Lid highlight (top edge)
        bin.beginFill(0x7f8c8d); // Lighter edge
        bin.drawRect(x - 1, y, width + 2, 1);
        bin.endFill();

        // Lid shadow (bottom edge)
        bin.beginFill(0x485661); // Darker bottom
        bin.drawRect(x - 1, y + 3, width + 2, 1);
        bin.endFill();

        // Inner cavity for depth
        bin.beginFill(0x2c3e50); // Dark inner cavity
        bin.drawRect(x + 2, y + 6, width - 4, height - 8);
        bin.endFill();

        // Inner cavity highlight (left edge)
        bin.beginFill(0x485661); // Subtle inner highlight
        bin.drawRect(x + 2, y + 6, 1, height - 8);
        bin.endFill();

        // Slot/Opening with better definition
        bin.beginFill(0x1a1a1a); // Very dark slot
        bin.drawRect(x + 4, y + 2, width - 8, 2);
        bin.endFill();

        // Slot inner highlight for realism
        bin.beginFill(0x34495e); // Subtle slot highlight
        bin.drawRect(x + 4, y + 2, width - 8, 1);
        bin.endFill();

        // Bottom rim for base definition
        bin.beginFill(0x485661); // Darker bottom rim
        bin.drawRect(x, y + height, width, 1);
        bin.endFill();

        // Small waste bin label/symbol (optional detail)
        bin.beginFill(0x34495e); // Dark accent
        bin.drawRect(x + 6, y + 12, 3, 3);
        bin.endFill();

        return bin;
      };

      const createDecorTable = (x, y, camera, colliders) => {
        const table = new Graphics();
        const tableWidth = 80;
        const tableHeight = 50;

        // 🪵 Table surface
        table.lineStyle(2, 0x8b4513, 1);
        table.beginFill(0xd2691e);
        table.drawRoundedRect(x, y, tableWidth, tableHeight, 4);
        table.endFill();

        // ✨ Wood grain
        table.lineStyle(1, 0xa0522d, 0.4);
        for (let i = 0; i < 3; i++) {
          const grainY = y + 12 + i * 12;
          table.moveTo(x + 5, grainY);
          table.lineTo(x + tableWidth - 5, grainY);
          table.stroke();
        }

        // 🏺 Vase
        const vaseX = x + tableWidth * 0.6;
        const vaseY = y + tableHeight * 0.5;

        table.lineStyle(2, 0x4a4a4a, 1);
        table.beginFill(0x87ceeb);
        table.drawEllipse(vaseX, vaseY, 8, 6);
        table.endFill();

        table.lineStyle(1, 0x4682b4, 1);
        table.beginFill(0x4682b4);
        table.drawEllipse(vaseX, vaseY, 6, 4);
        table.endFill();

        // 🌸 Flowers
        const flowers = [
          { color: 0xff69b4, x: vaseX - 3, y: vaseY - 2 },
          { color: 0xffd700, x: vaseX + 2, y: vaseY - 3 },
          { color: 0xff4500, x: vaseX - 1, y: vaseY + 2 },
          { color: 0xff1493, x: vaseX + 3, y: vaseY + 1 },
          { color: 0xffa500, x: vaseX - 2, y: vaseY + 1 },
        ];

        flowers.forEach((flower) => {
          table.lineStyle(0.5, 0x228b22, 1);
          table.beginFill(flower.color);
          table.drawCircle(flower.x, flower.y, 2);
          table.endFill();
        });

        // 🍃 Leaves
        table.beginFill(0x32cd32);
        table.drawCircle(vaseX - 4, vaseY, 1);
        table.drawCircle(vaseX + 4, vaseY - 1, 1);
        table.drawCircle(vaseX + 1, vaseY + 3, 1);
        table.endFill();

        // 📄 Paper
        table.lineStyle(1, 0x696969, 1);
        table.beginFill(0xf5f5f5);
        table.drawRect(x + 8, y + 8, 20, 15);
        table.endFill();

        table.lineStyle(0.5, 0x808080, 1);
        for (let i = 0; i < 3; i++) {
          const lineY = y + 12 + i * 3;
          table.moveTo(x + 10, lineY);
          table.lineTo(x + 25, lineY);
          table.stroke();
        }

        // ☕ Coffee cup
        const cupX = x + 15;
        const cupY = y + 35;

        table.lineStyle(1, 0x654321, 1);
        table.beginFill(0xffffff);
        table.drawEllipse(cupX, cupY, 6, 5);
        table.endFill();

        table.beginFill(0x8b4513);
        table.drawEllipse(cupX, cupY, 4, 3);
        table.endFill();

        table.lineStyle(1, 0x654321, 1);
        table.drawEllipse(cupX + 8, cupY, 2, 3);
        table.stroke();

        const bounds = {
          x: x,
          y: y,
          width: tableWidth,
          height: tableHeight,
          label: "decor-table",
        };

        if (camera && colliders) {
          addWithCollider(camera, table, bounds, colliders);
        }
        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: "vending-machine",
          bounds,
          message: "The table looks nicely decorated...better not mess with it",
          bubble: null,
        });

        return table;
      };

      const createTable = (x, y, camera, colliders) => {
        const table = new Graphics();
        const tableWidth = 80;
        const tableHeight = 50;

        // 🪵 Table surface
        table.lineStyle(2, 0x8b4513, 1);
        table.beginFill(0xd2691e);
        table.drawRoundedRect(x, y, tableWidth, tableHeight, 4);
        table.endFill();

        // ✨ Wood grain
        table.lineStyle(1, 0xa0522d, 0.4);
        for (let i = 0; i < 3; i++) {
          const grainY = y + 12 + i * 12;
          table.moveTo(x + 5, grainY);
          table.lineTo(x + tableWidth - 5, grainY);
          table.stroke();
        }

        if (camera && colliders) {
          addWithCollider(
            camera,
            table,
            {
              x: x,
              y: y,
              width: tableWidth,
              height: tableHeight,
              label: "decor-table",
            },
            colliders
          );
        }

        return table;
      };

      const createInfoBoard = (offsetX, offsetY) => {
        const infoBoard = new Graphics();

        // Enhanced professional color palette
        const boardColor = 0xffffff;
        const frameColor = 0x2c3e50;
        const frameShadow = 0x1a252f;
        const frameHighlight = 0x34495e;
        const metalAccent = 0x546e7a;
        const screenGlow = 0xe3f2fd;

        // Board shadow (cast shadow)
        infoBoard.rect(offsetX + 127, offsetY - 8, 30, 40);
        infoBoard.fill({ color: 0x000000, alpha: 0.2 });

        // Professional frame (outer)
        infoBoard.rect(offsetX + 123, offsetY - 12, 34, 44);
        infoBoard.fill(frameColor);

        // Frame highlight (top and left)
        infoBoard.rect(offsetX + 123, offsetY - 12, 34, 2);
        infoBoard.fill(frameHighlight);

        infoBoard.rect(offsetX + 123, offsetY - 12, 2, 44);
        infoBoard.fill(frameHighlight);

        // Frame shadow (bottom and right)
        infoBoard.rect(offsetX + 123, offsetY + 30, 34, 2);
        infoBoard.fill(frameShadow);

        infoBoard.rect(offsetX + 155, offsetY - 12, 2, 44);
        infoBoard.fill(frameShadow);

        // Inner frame
        infoBoard.rect(offsetX + 124, offsetY - 11, 32, 42);
        infoBoard.fill(frameColor);

        // Main board surface (slightly inset)
        infoBoard.rect(offsetX + 125, offsetY - 10, 30, 40);
        infoBoard.fill(boardColor);

        // Screen/display area with subtle glow
        infoBoard.rect(offsetX + 126, offsetY - 9, 28, 38);
        infoBoard.fill(screenGlow);

        // Professional bezel
        infoBoard.rect(offsetX + 125, offsetY - 10, 30, 40);
        infoBoard.stroke({ width: 1, color: metalAccent });

        // Content area grid lines (subtle)
        for (let i = 1; i < 4; i++) {
          const lineY = offsetY - 10 + i * 10;
          infoBoard.rect(offsetX + 127, lineY, 26, 0.5);
          infoBoard.fill({ color: 0xbdc3c7, alpha: 0.3 });
        }

        // Vertical separator
        infoBoard.rect(offsetX + 139, offsetY - 8, 0.5, 36);
        infoBoard.fill({ color: 0xbdc3c7, alpha: 0.3 });

        // LED indicator (top right)
        infoBoard.circle(offsetX + 150, offsetY - 6, 1.5);
        infoBoard.fill(0x27ae60);

        // LED glow
        infoBoard.circle(offsetX + 150, offsetY - 6, 2.5);
        infoBoard.fill({ color: 0x27ae60, alpha: 0.3 });

        // Professional mounting brackets
        const bracketPositions = [
          { x: offsetX + 122, y: offsetY - 8 },
          { x: offsetX + 158, y: offsetY - 8 },
          { x: offsetX + 122, y: offsetY + 26 },
          { x: offsetX + 158, y: offsetY + 26 },
        ];

        bracketPositions.forEach((bracket) => {
          infoBoard.circle(bracket.x, bracket.y, 2);
          infoBoard.fill(metalAccent);

          infoBoard.circle(bracket.x, bracket.y, 1.5);
          infoBoard.fill(frameColor);

          infoBoard.circle(bracket.x, bracket.y, 0.5);
          infoBoard.fill(frameShadow);
        });

        // Content placeholders (simulate text/info)

        // Title area
        infoBoard.rect(offsetX + 127, offsetY - 7, 20, 2);
        infoBoard.fill({ color: 0x2c3e50, alpha: 0.8 });

        // Info lines
        const infoLines = [
          { x: offsetX + 127, y: offsetY - 2, width: 22, height: 1 },
          { x: offsetX + 127, y: offsetY + 2, width: 18, height: 1 },
          { x: offsetX + 127, y: offsetY + 6, width: 24, height: 1 },
          { x: offsetX + 127, y: offsetY + 10, width: 16, height: 1 },
          { x: offsetX + 127, y: offsetY + 14, width: 20, height: 1 },
          { x: offsetX + 127, y: offsetY + 18, width: 14, height: 1 },
          { x: offsetX + 127, y: offsetY + 22, width: 18, height: 1 },
        ];

        infoLines.forEach((line) => {
          infoBoard.rect(line.x, line.y, line.width, line.height);
          infoBoard.fill({ color: 0x7f8c8d, alpha: 0.6 });
        });

        // Professional logo/brand area (bottom)
        infoBoard.rect(offsetX + 127, offsetY + 26, 26, 2);
        infoBoard.fill({ color: 0x3498db, alpha: 0.7 });

        // Subtle reflection on screen
        infoBoard.rect(offsetX + 126, offsetY - 8, 12, 15);
        infoBoard.fill({ color: 0xffffff, alpha: 0.1 });

        // Professional edge detail
        infoBoard.rect(offsetX + 125, offsetY - 10, 30, 40);
        infoBoard.stroke({ width: 0.5, color: frameHighlight });

        return infoBoard;
      };

      const populateRooms = (gameState) => {
        const { camera, ROOM_GRID } = gameState;
        const { rows, cols, roomWidth, roomHeight } = ROOM_GRID;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const offsetX = col * roomWidth;
            const offsetY = row * roomHeight;
            const key = `${row},${col}`;

            switch (key) {
              case "0,0": // Lobby - Office Building Style
                // Central elevator bank (like in the image)
                camera.addChild(
                  createElevator(
                    offsetX + roomWidth / 2 - 30,
                    offsetY + 70,
                    camera,
                    gameState.colliders
                  )
                );

                // Digital clock above elevators
                camera.addChild(
                  createDigitalClock(
                    offsetX - 25 + roomWidth / 2 - 40,
                    offsetY,
                    camera,
                    gameState.colliders
                  )
                );

                // Reception counter (front and center)
                camera.addChild(
                  createReceptionCounter(
                    offsetX + +roomWidth / 2,
                    offsetY + 400,
                    camera,
                    gameState.colliders
                  )
                );

                // Lobby seating areas (left and right sides)
                camera.addChild(
                  createLobbySeating(
                    offsetX + 450,
                    offsetY + 520,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createLobbySeating(
                    offsetX + roomWidth - 200,
                    offsetY + 520,
                    camera,
                    gameState.colliders
                  )
                );

                // Vending machines along the walls
                camera.addChild(
                  createVendingMachine(
                    offsetX + 490,
                    offsetY + 10,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createVendingMachine(
                    offsetX + roomWidth - 240,
                    offsetY + 10,
                    camera,
                    gameState.colliders
                  )
                );

                // Water dispensers
                camera.addChild(
                  createWaterDispenser(
                    offsetX + 200,
                    offsetY + 30,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createWaterDispenser(
                    offsetX + roomWidth - 60,
                    offsetY + 30,
                    camera,
                    gameState.colliders
                  )
                );

                // Plants for decoration (corners and strategic spots
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 145,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 340,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + roomWidth - 40,
                    offsetY + 140,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 600,
                    offsetY + 400,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + roomWidth - 40,
                    offsetY + 280,
                    camera,
                    gameState.colliders
                  )
                );

                // Information board/directory
                camera.addChild(createInfoBoard(offsetX + 10, offsetY - 3));

                // Waste bins
                camera.addChild(createWasteBin(offsetX + 470, offsetY + 430));
                camera.addChild(
                  createWasteBin(offsetX + roomWidth - 50, offsetY + 550)
                );

                //Floor mat
                camera.addChild(createFloorMat(offsetX + 700, offsetY + 200));

                break;

              case "0,1": // Open Office Area
                // Create cubicles in grid pattern
                const cubiclePositions = [
                  { x: offsetX + 200, y: offsetY + 200 },
                  { x: offsetX + 400, y: offsetY + 200 },
                  { x: offsetX + 600, y: offsetY + 200 },
                  { x: offsetX + 200, y: offsetY + 400 },
                  { x: offsetX + 400, y: offsetY + 400 },
                  { x: offsetX + 600, y: offsetY + 400 },
                ];

                cubiclePositions.forEach((pos) => {
                  camera.addChild(createCubicle(pos.x, pos.y));
                });

                //Elevator
                camera.addChild(
                  createdoor(
                    offsetX + roomWidth / 2 + 250,
                    offsetY + 44,
                    camera,
                    gameState.colliders,
                    { doorType: "office" }
                  )
                );
                // Vending machines along the walls
                camera.addChild(
                  createVendingMachine(
                    offsetX + 490,
                    offsetY + 10,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createVendingMachine(
                    offsetX + roomWidth - 240,
                    offsetY + 10,
                    camera,
                    gameState.colliders
                  )
                );

                // Plants for decoration (corners and strategic spots
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 120,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 340,
                    camera,
                    gameState.colliders
                  )
                );

                // Digital clock above elevators
                camera.addChild(
                  createDigitalClock(
                    offsetX - 25 + roomWidth / 2 - 40,
                    offsetY + 5,
                    camera,
                    gameState.colliders
                  )
                );

                camera.addChild(
                  createBookshelf(
                    offsetX + 220,
                    offsetY,
                    camera,
                    gameState.colliders
                  )
                );

                // Lobby seating areas (left and right sides)
                camera.addChild(
                  createLobbySeating(
                    offsetX + 25,
                    offsetY + 520,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createLobbySeating(
                    offsetX + roomWidth - 260,
                    offsetY + 520,
                    camera,
                    gameState.colliders
                  )
                );

                // Printer station
                camera.addChild(
                  createTable(
                    offsetX + 680,
                    offsetY + 530,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(createPrinter(offsetX + 720, offsetY + 550));

                //waste bins
                camera.addChild(createWasteBin(offsetX + 350, offsetY + 450));
                camera.addChild(createWasteBin(offsetX + 150, offsetY + 40));

                // Study table
                camera.addChild(
                  createStudyTable(
                    offsetX + 440,
                    offsetY + 565,
                    camera,
                    gameState.colliders
                  )
                );

                //Floor mat
                camera.addChild(
                  createFloorMat(offsetX + 300, offsetY + 530, Math.PI / 2)
                );

                camera.addChild(
                  createDecorTable(
                    offsetX + 170,
                    offsetY + 530,
                    camera,
                    gameState.colliders
                  )
                );

                break;

              case "1,0": // Meeting Room
                // Central meeting table
                camera.addChild(
                  createMeetingTable(
                    offsetX + 400,
                    offsetY + 300,
                    camera,
                    gameState.colliders
                  )
                );

                // Chairs around the table
                const meetingChairs = [
                  { x: offsetX + 320, y: offsetY + 280 },
                  { x: offsetX + 480, y: offsetY + 280 },
                  { x: offsetX + 320, y: offsetY + 320 },
                  { x: offsetX + 480, y: offsetY + 320 },
                  { x: offsetX + 400, y: offsetY + 230 },
                  { x: offsetX + 400, y: offsetY + 370 },
                ];
                meetingChairs.forEach((pos) => {
                  camera.addChild(createOfficeChair(pos.x, pos.y));
                });

                // Whiteboard at front wall
                camera.addChild(
                  createWhiteboard(
                    offsetX + 38,
                    offsetY + 280,
                    camera,
                    gameState.colliders
                  )
                );

                // Plants in corners for aesthetics
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 120,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + roomWidth - 40,
                    offsetY + 120,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 400,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + roomWidth - 40,
                    offsetY + 400,
                    camera,
                    gameState.colliders
                  )
                );

                // Wall clock
                camera.addChild(
                  createDigitalClock(offsetX + roomWidth / 2 - 40, offsetY)
                );

                // Waste bin near door or corner
                camera.addChild(
                  createWasteBin(offsetX + roomWidth - 60, offsetY + 450)
                );

                // Small bookshelf or credenza
                camera.addChild(
                  createBookshelf(
                    offsetX + roomWidth - 200,
                    offsetY + 20,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createBookshelf(
                    offsetX + roomWidth - 280,
                    offsetY + 20,
                    camera,
                    gameState.colliders
                  )
                );

                // Floor mat near entrance (bottom-left)
                camera.addChild(
                  createFloorMat(offsetX + 305, offsetY + 80, Math.PI / 2)
                );

                // Lobby seating areas (left and right)
                camera.addChild(
                  createLobbySeating(
                    offsetX + 100,
                    offsetY + 500,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createLobbySeating(
                    offsetX + roomWidth - 280,
                    offsetY + 500,
                    camera,
                    gameState.colliders
                  )
                );

                //water-dispenser
                camera.addChild(
                  createWaterDispenser(
                    offsetX + roomWidth - 80,
                    offsetY + 500,
                    camera,
                    gameState.colliders
                  )
                );

                //dectable
                camera.addChild(
                  createDecorTable(
                    offsetX + 390,
                    offsetY + 510,
                    camera,
                    gameState.colliders
                  )
                );

                break;

              case "1,1": // Executive Office
                camera.addChild(
                  createOfficeCounters(
                    offsetX + 560,
                    offsetY + 70,
                    4,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createOfficeCounters(
                    offsetX + 220,
                    offsetY + 70,
                    2,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createOfficeCounters(
                    offsetX + 240,
                    offsetY + 470,
                    7,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createCat(
                    offsetX + 120,
                    offsetY + 400,
                    true,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 280,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 40,
                    offsetY + 390,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 540,
                    offsetY + 220,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createPlant(
                    offsetX + 540,
                    offsetY + 390,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(createFloorMat(offsetX + 60, offsetY + 210));
                camera.addChild(
                  createVerticalLeftSofa(
                    offsetX + 660,
                    offsetY + 240,
                    camera,
                    gameState.colliders
                  )
                );
                camera.addChild(
                  createSittingNPC(
                    offsetX + 655,
                    offsetY + 290,
                    camera,
                    gameState.colliders,
                    gameState
                  )
                );
                camera.addChild(
                  createCat(
                    offsetX + 670,
                    offsetY + 220,
                    false,
                    camera,
                    gameState.colliders
                  )
                );

                break;
            }
          }
        }
      };

      const createSittingNPC = (
        x,
        y,
        camera,
        colliders,
        gameState,
        npcName = "??"
      ) => {
        const npc = new Graphics();

        // Enhanced color palette (same as player)
        const skinColor = 0xf4c2a1;
        const skinShadow = 0xe6b596;
        const shirtColor = 0xffbf00;
        const shirtShadow = 0x2980b9;
        const pantsColor = 0x2c3e50;
        const pantsShadow = 0x1a252f;
        const hairColor = 0x4b2e1e;
        const shoeColor = 0x000000;

        // Head (right side profile)
        npc.beginFill(skinColor);
        npc.drawRect(-6, -18, 12, 12);
        npc.endFill();

        // Face shadow (right side profile shading)
        npc.beginFill(skinShadow);
        npc.drawRect(-6, -16, 4, 8);
        npc.endFill();

        // Hair with right side profile
        npc.beginFill(hairColor);
        npc.drawRect(-7, -19, 14, 6);
        npc.endFill();

        // Hair highlight (right side)
        npc.beginFill(0x6b4423);
        npc.drawRect(3, -18, 3, 4);
        npc.endFill();

        // Right side profile eye (only one visible)
        npc.beginFill(0xffffff);
        npc.drawRect(-4, -15, 2, 2);
        npc.endFill();

        // Eye pupil
        npc.beginFill(0x000000);
        npc.drawRect(-3.5, -14.5, 1, 1);
        npc.endFill();

        // Nose (right side profile - more prominent)
        npc.beginFill(skinShadow);
        npc.drawRect(-7, -12, 2, 2);
        npc.endFill();

        // Mouth (right side profile)
        npc.beginFill(0x8b4513);
        npc.drawRect(-5, -10, 1, 1);
        npc.endFill();

        // Body (sitting position - shorter torso)
        npc.beginFill(shirtColor);
        npc.drawRect(-8, -5, 16, 15);
        npc.endFill();

        // Body shadow/depth
        npc.beginFill(shirtShadow);
        npc.drawRect(-8, 8, 16, 2);
        npc.endFill();

        // Shirt collar
        npc.beginFill(shirtShadow);
        npc.drawRect(-7, -4, 14, 3);
        npc.endFill();

        // Left arm (visible arm, resting on lap)
        npc.beginFill(skinColor);
        npc.drawRect(-10, -2, 3, 8);
        npc.endFill();

        // Left arm shadow
        npc.beginFill(skinShadow);
        npc.drawRect(-8, 4, 3, 2);
        npc.endFill();

        // Right arm (partially visible, resting position)
        npc.beginFill(skinColor);
        npc.drawRect(7, 0, 3, 6);
        npc.endFill();

        // Right arm shadow
        npc.beginFill(skinShadow);
        npc.drawRect(7, 4, 3, 2);
        npc.endFill();

        // Hands (resting on lap)
        npc.beginFill(skinColor);
        npc.drawRect(-7, 6, 2, 2);
        npc.drawRect(8, 6, 2, 2);
        npc.endFill();

        // Upper legs (sitting position - horizontal)
        npc.beginFill(pantsColor);
        npc.drawRect(-6, 10, 12, 6);
        npc.endFill();

        // Upper leg shadow
        npc.beginFill(pantsShadow);
        npc.drawRect(-6, 14, 12, 2);
        npc.endFill();

        // Lower legs (bent down from knees)
        npc.beginFill(pantsColor);
        npc.drawRect(-5, 16, 4, 10);
        npc.drawRect(1, 16, 4, 10);
        npc.endFill();

        // Lower leg shadows
        npc.beginFill(pantsShadow);
        npc.drawRect(-5, 24, 4, 2);
        npc.drawRect(1, 24, 4, 2);
        npc.endFill();

        // Shoes (sitting position)
        npc.beginFill(shoeColor);
        npc.drawRect(-6, 26, 5, 3);
        npc.drawRect(1, 26, 5, 3);
        npc.endFill();

        // Shoe highlights
        npc.beginFill(0x333333);
        npc.drawRect(-6, 26, 5, 1);
        npc.drawRect(1, 26, 5, 1);
        npc.endFill();

        // Belt detail
        npc.beginFill(0x8b4513);
        npc.drawRect(-8, 8, 16, 2);
        npc.endFill();

        // Belt buckle
        npc.beginFill(0xffd700);
        npc.drawRect(-1, 8.5, 2, 1);
        npc.endFill();

        // Tie (professional office look)
        npc.beginFill(0x8b0000);
        npc.drawRect(-1, -1, 2, 8);
        npc.endFill();

        // Tie pattern
        npc.beginFill(0xa00000);
        npc.drawRect(-0.5, 0, 1, 1);
        npc.drawRect(-0.5, 3, 1, 1);
        npc.drawRect(-0.5, 6, 1, 1);
        npc.endFill();

        // Name tag with better styling
        const nameTag = new Text({
          text: npcName,
          style: new TextStyle({
            fontSize: 10,
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
        nameTag.y = -30;
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
          y: y - 10,
          width: 22,
          height: 40,
          label: `sitting-npc-${npcName}`,
        };

        if (camera && colliders) {
          addWithCollider(camera, npc, bounds, colliders);
        }

        // Add to interactables (for Z key / text bubble)
        if (!window.interactables) window.interactables = [];
        window.interactables.push({
          label: `sitting-npc-${npcName}`,
          bounds,
          message: "Tf is this...",
          bubble: null,
        });

        // NPC properties
        npc.npcName = npcName;
        npc.isSitting = true;
        npc.facing = "left"; // Side-faced to the left (right side visible)

        return npc;
      };

      const setupInput = (gameState, app) => {
        const handleKeyDown = (e) => {
          gameState.keys[e.code] = true;

          if (e.code === "Enter") {
            setChatOpen(true);
          }
        };

        const handleKeyUp = (e) => {
          gameState.keys[e.code] = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        gameState.cleanup = () => {
          window.removeEventListener("keydown", handleKeyDown);
          window.removeEventListener("keyup", handleKeyUp);
        };
      };

      const gameLoop = (gameState, app) => {
        const speed = gameState.playerSpeed || 2;
        const { player, keys, camera, world, ROOM_GRID, colliders } = gameState;
        const ROOM_WIDTH = ROOM_GRID.cols * ROOM_GRID.roomWidth;
        const ROOM_HEIGHT = ROOM_GRID.rows * ROOM_GRID.roomHeight;

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

        return container;
      };

      // Debug function to visualize collision boxes (optional)
      const renderDebugColliders = (colliders, container) => {
        colliders.forEach((c, i) => {
          const box = new Graphics();
          box.lineStyle(2, 0xff0000, 1); // Red outline, full opacity
          box.beginFill(0xff0000, 0.2); // Light red fill with transparency
          box.drawRect(c.x, c.y, c.width, c.height);
          box.endFill();
          container.addChild(box);

          // Optional: Add a small label
          const label = new Text({
            text: `#${i}`,
            style: new TextStyle({ fontSize: 10, fill: 0xffffff }),
          });
          label.x = c.x;
          label.y = c.y - 10;
          container.addChild(label);
        });
      };

      initPixi();

      return () => {
        if (gameStateRef.current.cleanup) gameStateRef.current.cleanup();
        appRef.current?.destroy(true);
      };
    }
  }, [loadingPage, space, playerName]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        player: playerName,
        message: chatMessage.trim(),
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setChatMessage("");
      setChatOpen(false);
    }
  };

  if (loadingPage) return <LoadingScreen />;

  const handleTeleportWithFade = async (loc) => {
    const gameState = gameStateRef.current;
    const { player, world, app, ROOM_GRID } = gameState;
    const ROOM_WIDTH = ROOM_GRID.cols * ROOM_GRID.roomWidth;
    const ROOM_HEIGHT = ROOM_GRID.rows * ROOM_GRID.roomHeight;

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

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#1a1a2e",
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
        <MetaverseMinimap gameStateRef={gameStateRef} />

        {/* Player List
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
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
      </div> */}
      </div>
        
    </div>
  );
};

export default MetaverseWorld;
