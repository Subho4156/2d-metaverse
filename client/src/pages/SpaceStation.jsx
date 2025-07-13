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


function SpaceStation() {
  const [showFade, setShowFade] = useState(false);
  const [speed, setSpeed] = useState(6);
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
              createPlayer(gameState, playerName);
              populateRooms(gameState);
            //   createFn(gameState, playerName);
            //   setupSocketListeners(gameState);
      
              // ✅ Now emit player-join after everything is ready
            //   socket.emit("player-join", {
            //     name: playerName,
            //     position: {
            //       x: gameState.player.x,
            //       y: gameState.player.y,
            //     },
            //     avatarKey: gameState.player.avatarKey,
            //     spaceId: space._id,
            //   });
            //   console.log(
            //     "🙋 Sending player-join",
            //     playerName,
            //     gameState.player.x,
            //     gameState.player.y
            //   );
      
              setupInput(gameState, app);
      
              // app.ticker drives the game loop
              app.ticker.add(() => gameLoop(gameState, app));
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
      { type: 'corridor', width: 200, height: 500, name: 'Main Corridor A' },
      { type: 'med_bay', width: 500, height: 500, name: 'Medical Bay' },
      { type: 'lab', width: 450, height: 500, name: 'Research Lab' },
      { type: 'corridor', width: 450, height: 500, name: 'Corridor A' },
    ],
    // Row 2: Engineering and storage
    [
      { type: 'engineering', width: 700, height: 550, name: 'Engineering Bay' },
      { type: 'storage', width: 350, height: 550, name: 'Cargo Hold' },
      { type: 'reactor', width: 550, height: 550, name: 'Reactor Core' },
    ],
    // Row 3: Living quarters
    [
      { type: 'quarters', width: 300, height: 350, name: 'Crew Quarters A' },
      { type: 'quarters', width: 400, height: 350, name: 'Crew Quarters B' },
      { type: 'cafeteria', width: 500, height: 350, name: 'Mess Hall' },
      { type: 'recreation', width: 400, height: 350, name: 'Recreation' }
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
  "2,2": { top: true, bottom: true, left: true, right: false, airlockOffsets:{ left: -40, top: 160, bottom: 60} },
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


function createCommandChair(x, y) {
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
    
    return chairContainer;
}

function createHoloDisplay(x, y) {
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
    
    return holoContainer;
}

function createNavConsole(x, y) {
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

function createControlStation(x, y) {
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
    
    return stationContainer;
}

function createBridgeStation(x, y) {
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
    
    return bridgeContainer;
}

function createTelescope(x, y) {
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
    
    return telescopeContainer;
}

function createObservationSeat(x, y) {
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
    
    return seatContainer;
}

function createSpacePlant(x, y) {
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
    
    return plantContainer;
}

function createCommArray(x, y) {
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
    
    return commContainer;
}

function createSignalProcessor(x, y) {
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
    
    return procContainer;
}

function createMonitoringStation(x, y) {
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
    
    return monitorContainer;
}

function createDataBank(x, y) {
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
    
    return dataContainer;
}

function createMedBed(x, y) {
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
    
    return medBedContainer;
}

function createMedScanner(x, y) {
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
    
    return scannerContainer;
}

function createMedStorage(x, y) {
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
    
    return medContainer;
}

function createEmergencyKit(x, y) {
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
    
    return emergencyContainer;
}

function createLabWorkstation(x, y) {
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
    
    return labContainer;
}

function createSpecimenContainer(x, y) {
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
    
    return specimenContainer;
}

function createAnalysisEquipment(x, y) {
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
    
    return analysisContainer;
}

function createEngineeringConsole(x, y) {
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
    
    return consoleContainer;
}

function createPowerDistribution(x, y) {
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
    
    return distributionContainer;
}

function createRepairStation(x, y) {
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
    
    return repairContainer;
}

function createCargoContainer(x, y) {
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

function createStorageLocker(x, y) {
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
    
    return lockerContainer;
}

function createReactorCore(x, y) {
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
    
    return reactorContainer;
}

function createCoolingSystem(x, y) {
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
    
    return coolingContainer;
}

function createReactorControlPanel(x, y) {
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
    
    return reactorContainer;
}

function createWarningSystem(x, y) {
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
    
    return warningContainer;
}

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
      { type: 'corridor', width: 200, height: 500, name: 'Main Corridor A' },
      { type: 'med_bay', width: 500, height: 500, name: 'Medical Bay' },
      { type: 'lab', width: 450, height: 500, name: 'Research Lab' },
      { type: 'corridor', width: 450, height: 500, name: 'Corridor A' },
    ],
    // Row 2: Engineering and storage
    [
      { type: 'engineering', width: 700, height: 600, name: 'Engineering Bay' },
      { type: 'storage', width: 350, height: 600, name: 'Cargo Hold' },
      { type: 'reactor', width: 250, height: 600, name: 'Reactor Core' },
    ],
    // Row 3: Living quarters
    [
      { type: 'quarters', width: 300, height: 350, name: 'Crew Quarters A' },
      { type: 'quarters', width: 300, height: 350, name: 'Crew Quarters B' },
      { type: 'cafeteria', width: 400, height: 350, name: 'Mess Hall' },
      { type: 'recreation', width: 300, height: 350, name: 'Recreation' }
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
          ));
          
          // Navigation consoles (front)
          camera.addChild(createNavConsole(
            offsetX + width / 2 - 90,
            offsetY + 55,
            camera,
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
          
        //   // Star charts/displays
        //   camera.addChild(createStarChart(
        //     offsetX + 50,
        //     offsetY + 50,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createStarChart(
        //     offsetX + width - 50,
        //     offsetY + 50,
        //     camera,
        //     gameState.colliders
        //   ));
          
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
          
        //   // Drug synthesizer
        //   camera.addChild(createDrugSynthesizer(
        //     offsetX + width - 100,
        //     offsetY + 150,
        //     camera,
        //     gameState.colliders
        //   ));
          
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

        // case 'quarters': // Crew Quarters
        //   // Bunk beds
        //   camera.addChild(createSpaceBunk(
        //     offsetX + 80,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createSpaceBunk(
        //     offsetX + 80,
        //     offsetY + 200,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Personal storage
        //   camera.addChild(createPersonalLocker(
        //     offsetX + width - 60,
        //     offsetY + 120,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createPersonalLocker(
        //     offsetX + width - 60,
        //     offsetY + 200,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Recreation terminal
        //   camera.addChild(createRecTerminal(
        //     offsetX + width / 2,
        //     offsetY + height - 60,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

        // case 'cafeteria': // Mess Hall
        //   // Dining tables
        //   camera.addChild(createDiningTable(
        //     offsetX + 120,
        //     offsetY + 150,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createDiningTable(
        //     offsetX + width - 120,
        //     offsetY + 150,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Food replicator
        //   camera.addChild(createFoodReplicator(
        //     offsetX + width / 2,
        //     offsetY + 80,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Beverage dispenser
        //   camera.addChild(createBeverageDispenser(
        //     offsetX + 60,
        //     offsetY + 250,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Waste recycler
        //   camera.addChild(createWasteRecycler(
        //     offsetX + width - 60,
        //     offsetY + 250,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

        // case 'recreation': // Recreation
        //   // Exercise equipment
        //   camera.addChild(createExerciseEquipment(
        //     offsetX + 80,
        //     offsetY + 120,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Entertainment console
        //   camera.addChild(createEntertainmentConsole(
        //     offsetX + width - 80,
        //     offsetY + 120,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Relaxation pod
        //   camera.addChild(createRelaxationPod(
        //     offsetX + width / 2,
        //     offsetY + 200,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Game table
        //   camera.addChild(createGameTable(
        //     offsetX + width / 2,
        //     offsetY + height - 80,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

        // case 'corridor': // Corridors
  
        //   // Emergency stations
        //   camera.addChild(createEmergencyStation(
        //     offsetX + width / 2,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Lighting panels
        //   camera.addChild(createLightingPanel(
        //     offsetX + 30,
        //     offsetY + 200,
        //     camera,
        //     gameState.colliders
        //   ));
        //   if (width > 300) {
        //     camera.addChild(createLightingPanel(
        //       offsetX + width - 30,
        //       offsetY + 200,
        //       camera,
        //       gameState.colliders
        //     ));
        //   }
          
        //   // Air recycling units
        //   camera.addChild(createAirRecycler(
        //     offsetX + width / 2,
        //     offsetY + height - 80,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;


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

        //   if (stateChanged || movedEnough || (isMoving && timeToUpdate)) {
        //     socket.emit("player-move", {
        //       position: currentPosition,
        //       isMoving: isMoving,
        //       direction: currentDirection,
        //     });

        //     lastPosition = { ...currentPosition };
        //     lastEmitTime = now;
        //     isCurrentlyMoving = isMoving;
        //   }
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

// 3. Fixed gameLoop function (uncomment the movement code)
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
        // if (keys["KeyZ"] && !window.textBubbleActive) {
        //   const px = player.x;
        //   const py = player.y;

        //   const INTERACT_MARGIN = 16;

        //   const nearby = (window.interactables || []).find((obj) => {
        //     const b = obj.bounds;
        //     return (
        //       player.x + INTERACT_MARGIN > b.x &&
        //       player.x - INTERACT_MARGIN < b.x + b.width &&
        //       player.y + INTERACT_MARGIN > b.y &&
        //       player.y - INTERACT_MARGIN < b.y + b.height
        //     );
        //   });

        //   if (nearby) {
        //     console.log("Nearby object:", nearby.label);

        //     // Hide bubble
        //     if (nearby.bubble && !nearby.bubble.destroyed) {
        //       nearby.bubble.destroy({ children: true });
        //       nearby.bubble = null;
        //       window.textBubbleActive = false;
        //     } else {
        //       // Show bubble
        //       const bubble = createTextBubble(
        //         player.x,
        //         player.y - 50,
        //         nearby.message,
        //         3000,
        //         gameState.camera
        //       );

        //       gameState.camera.addChild(bubble);
        //       nearby.bubble = bubble;
        //       window.textBubbleActive = true;

        //       // Reset after duration
        //       setTimeout(() => {
        //         window.textBubbleActive = false;
        //         nearby.bubble = null;
        //       }, 3000);
        //     }

        //     keys["KeyZ"] = false;
        //   }
        // }
      };


      initPixi();

      return () => {
        if (gameStateRef.current.cleanup) gameStateRef.current.cleanup();
        appRef.current?.destroy(true);
      };
    }
  }, [loadingPage, space, playerName]);

  if (loadingPage) return <LoadingScreen />;

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundImage: `url('/assets/space_bg.gif')`,
        backgroundSize: "cover",       // optional: makes sure the image covers the entire area
      backgroundPosition: "center",  // optional: centers the image
      backgroundRepeat: "no-repeat"  // optional: prevents tiling
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
        {/* <div
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
          <span style={{ fontSize: "14px" }}>
            {showToolbar ? "✕" : "☰"}
          </span>
          {showToolbar ? "Hide" : "Show"}
        </button>
      </div> */}

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

        {/* {showToolbar && (
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
        />
      )} */}

        {/* Mini Map */}
        {/* <MetaverseMinimap gameStateRef={gameStateRef} /> */}

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
}

export default SpaceStation;
