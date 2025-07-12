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
      const speed = 1.5;  // Slower movement for spacesuit

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
      { type: 'engineering', width: 700, height: 600, name: 'Engineering Bay' },
      { type: 'storage', width: 350, height: 600, name: 'Cargo Hold' },
      { type: 'reactor', width: 250, height: 600, name: 'Reactor Core' },
      { type: 'reactor', width: 300, height: 600, name: 'Reactor Core' }
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
      const walls = createSpaceWalls(
        width, 
        height, 
        rowIndex, 
        colIndex, 
        SPACE_LAYOUT, 
        gameState.colliders, 
        currentX, 
        currentY
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

function createCommandChair(x, y, camera) {
    // Create main chair container
    const chairContainer = new Container();
    chairContainer.x = x;
    chairContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Chair base (circular)
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x1a1a1a);
    graphics.drawCircle(0, 15, 25);
    graphics.endFill();
    
    // Chair pedestal
    graphics.beginFill(0x1a1a1a);
    graphics.drawRect(-8, -10, 16, 25);
    graphics.endFill();
    
    // Main seat
    graphics.beginFill(0x3a3a3a);
    graphics.lineStyle(2, 0x4a4a4a);
    graphics.drawRoundedRect(-30, -25, 60, 35, 8);
    graphics.endFill();
    
    // Backrest
    graphics.beginFill(0x3a3a3a);
    graphics.lineStyle(2, 0x4a4a4a);
    graphics.drawRoundedRect(-25, -50, 50, 30, 5);
    graphics.endFill();
    
    // Headrest
    graphics.beginFill(0x3a3a3a);
    graphics.lineStyle(1, 0x4a4a4a);
    graphics.drawRoundedRect(-20, -65, 40, 12, 3);
    graphics.endFill();
    
    // Left armrest
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x1a1a1a);
    graphics.drawRoundedRect(-45, -15, 12, 25, 2);
    graphics.endFill();
    
    // Right armrest
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x1a1a1a);
    graphics.drawRoundedRect(33, -15, 12, 25, 2);
    graphics.endFill();
    
    // Left console panel
    graphics.beginFill(0x1a1a1a);
    graphics.drawRoundedRect(-42, -12, 6, 18, 1);
    graphics.endFill();
    
    // Right console panel
    graphics.beginFill(0x1a1a1a);
    graphics.drawRoundedRect(36, -12, 6, 18, 1);
    graphics.endFill();
    
    // Console details/buttons (left side)
    graphics.beginFill(0x00aaff);
    graphics.drawRect(-41, -10, 4, 2);
    graphics.drawRect(-41, -6, 4, 2);
    graphics.drawRect(-41, -2, 4, 2);
    graphics.drawRect(-41, 2, 4, 2);
    graphics.endFill();
    
    // Console details/buttons (right side)
    graphics.beginFill(0x00aaff);
    graphics.drawRect(37, -10, 4, 2);
    graphics.drawRect(37, -6, 4, 2);
    graphics.drawRect(37, -2, 4, 2);
    graphics.drawRect(37, 2, 4, 2);
    graphics.endFill();
    
    // Accent lighting on backrest
    graphics.beginFill(0x0066cc);
    graphics.drawRect(-3, -45, 6, 1);
    graphics.drawRect(-8, -40, 16, 1);
    graphics.endFill();
    
    // Side supports
    graphics.beginFill(0x1a1a1a);
    graphics.drawRect(-28, -40, 3, 20);
    graphics.drawRect(25, -40, 3, 20);
    graphics.endFill();
    
    // Central control display (optional)
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x0066cc);
    graphics.drawRoundedRect(-8, -30, 16, 8, 2);
    graphics.endFill();
    
    // Display details
    graphics.beginFill(0x00aaff);
    graphics.drawRect(-6, -28, 12, 1);
    graphics.drawRect(-6, -25, 12, 1);
    graphics.endFill();
    
    // Add graphics to container
    chairContainer.addChild(graphics);
    
    // Add brighter console elements for visual effect (instead of glow)
    const brightGraphics = new Graphics();
    brightGraphics.beginFill(0x33ccff); // Brighter blue
    brightGraphics.drawRect(-41, -10, 4, 2);
    brightGraphics.drawRect(-41, -6, 4, 2);
    brightGraphics.drawRect(-41, -2, 4, 2);
    brightGraphics.drawRect(-41, 2, 4, 2);
    brightGraphics.drawRect(37, -10, 4, 2);
    brightGraphics.drawRect(37, -6, 4, 2);
    brightGraphics.drawRect(37, -2, 4, 2);
    brightGraphics.drawRect(37, 2, 4, 2);
    brightGraphics.endFill();
    
    chairContainer.addChild(brightGraphics);
    
    return chairContainer;
}

function createNavConsole(x, y) {
    // Create main console container
    const consoleContainer = new Container();
    consoleContainer.x = x;
    consoleContainer.y = y;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main console base (rounded rectangle)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(3, 0x333333);
    graphics.drawRoundedRect(-60, -40, 120, 80, 12);
    graphics.endFill();
    
    // Inner console frame
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(1, 0x2a2a2a);
    graphics.drawRoundedRect(-55, -35, 110, 70, 8);
    graphics.endFill();
    
    // Main holographic display area
    graphics.beginFill(0x001133);
    graphics.lineStyle(2, 0x0066cc);
    graphics.drawRoundedRect(-45, -25, 90, 35, 6);
    graphics.endFill();
    
    // Holographic display grid lines
    graphics.lineStyle(1, 0x0099ff, 0.6);
    // Horizontal grid lines
    for (let i = -20; i <= 5; i += 8) {
        graphics.moveTo(-40, i);
        graphics.lineTo(40, i);
    }
    // Vertical grid lines
    for (let i = -40; i <= 40; i += 15) {
        graphics.moveTo(i, -20);
        graphics.lineTo(i, 5);
    }
    
    // Central targeting reticle
    graphics.lineStyle(2, 0x00ff66, 0.8);
    graphics.drawCircle(0, -7, 12);
    graphics.moveTo(-8, -7);
    graphics.lineTo(8, -7);
    graphics.moveTo(0, -15);
    graphics.lineTo(0, 1);
    
    // Navigation compass rose
    graphics.lineStyle(1, 0x00ccff, 0.7);
    graphics.drawCircle(25, -15, 8);
    // Compass points
    graphics.moveTo(25, -23);
    graphics.lineTo(25, -19);
    graphics.moveTo(25, -11);
    graphics.lineTo(25, -7);
    graphics.moveTo(17, -15);
    graphics.lineTo(21, -15);
    graphics.moveTo(29, -15);
    graphics.lineTo(33, -15);
    
    // Control panel buttons (left side)
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    
    // Power button
    graphics.drawRoundedRect(-50, 15, 12, 8, 2);
    graphics.endFill();
    
    // Navigation mode buttons
    graphics.beginFill(0x1a4d1a);
    graphics.drawRoundedRect(-35, 15, 12, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x4d1a1a);
    graphics.drawRoundedRect(-20, 15, 12, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x1a1a4d);
    graphics.drawRoundedRect(-5, 15, 12, 8, 2);
    graphics.endFill();
    
    // Control panel buttons (right side)
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(1, 0x444444);
    
    // System status buttons
    graphics.drawRoundedRect(10, 15, 12, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x2a2a2a);
    graphics.drawRoundedRect(25, 15, 12, 8, 2);
    graphics.endFill();
    
    graphics.beginFill(0x2a2a2a);
    graphics.drawRoundedRect(40, 15, 12, 8, 2);
    graphics.endFill();
    
    // Button indicators/LEDs
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-44, 19, 2);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(-29, 19, 2);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawCircle(-14, 19, 2);
    graphics.endFill();
    
    graphics.beginFill(0x0066ff);
    graphics.drawCircle(1, 19, 2);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(16, 19, 2);
    graphics.endFill();
    
    graphics.beginFill(0xff0000);
    graphics.drawCircle(31, 19, 2);
    graphics.endFill();
    
    graphics.beginFill(0x00ff00);
    graphics.drawCircle(46, 19, 2);
    graphics.endFill();
    
    // Side data panels
    graphics.beginFill(0x0d1a0d);
    graphics.lineStyle(1, 0x00ff66, 0.5);
    graphics.drawRoundedRect(-55, -15, 8, 20, 2);
    graphics.endFill();
    
    graphics.beginFill(0x1a0d0d);
    graphics.lineStyle(1, 0xff6600, 0.5);
    graphics.drawRoundedRect(47, -15, 8, 20, 2);
    graphics.endFill();
    
    // Data readouts on side panels
    graphics.beginFill(0x00ff66);
    graphics.drawRect(-53, -12, 4, 1);
    graphics.drawRect(-53, -9, 4, 1);
    graphics.drawRect(-53, -6, 4, 1);
    graphics.drawRect(-53, -3, 4, 1);
    graphics.drawRect(-53, 0, 4, 1);
    graphics.endFill();
    
    graphics.beginFill(0xff6600);
    graphics.drawRect(49, -12, 4, 1);
    graphics.drawRect(49, -9, 4, 1);
    graphics.drawRect(49, -6, 4, 1);
    graphics.drawRect(49, -3, 4, 1);
    graphics.drawRect(49, 0, 4, 1);
    graphics.endFill();
    
    // Corner mounting brackets
    graphics.beginFill(0x333333);
    graphics.drawRect(-58, -38, 6, 6);
    graphics.drawRect(52, -38, 6, 6);
    graphics.drawRect(-58, 32, 6, 6);
    graphics.drawRect(52, 32, 6, 6);
    graphics.endFill();
    
    // Holographic scan lines (animated effect)
    graphics.lineStyle(1, 0x00ccff, 0.3);
    graphics.moveTo(-45, -20);
    graphics.lineTo(45, -20);
    graphics.moveTo(-45, -12);
    graphics.lineTo(45, -12);
    graphics.moveTo(-45, -4);
    graphics.lineTo(45, -4);
    
    // Add graphics to container
    consoleContainer.addChild(graphics);
    
    // Create animated elements
    const animatedGraphics = new Graphics();
    
    // Pulsing power indicator
    const createPulsingDot = (x, y, color) => {
        const dot = new Graphics();
        dot.beginFill(color);
        dot.drawCircle(0, 0, 3);
        dot.endFill();
        dot.x = x;
        dot.y = y;
        dot.alpha = 0.5;
        
        // Simple pulsing animation
        let pulse = 0;
        const animate = () => {
            pulse += 0.1;
            dot.alpha = 0.3 + Math.sin(pulse) * 0.4;
            requestAnimationFrame(animate);
        };
        animate();
        
        return dot;
    };
    
    // Add pulsing elements
    const powerPulse = createPulsingDot(0, -7, 0x00ff66);
    const navPulse = createPulsingDot(25, -15, 0x00ccff);
    
    consoleContainer.addChild(powerPulse);
    consoleContainer.addChild(navPulse);
    
    // Add scanning line animation
    const scanLine = new Graphics();
    scanLine.beginFill(0x00ccff);
    scanLine.drawRect(-45, 0, 90, 1);
    scanLine.endFill();
    scanLine.alpha = 0.6;
    scanLine.y = -25;
    
    let scanDirection = 1;
    const animateScan = () => {
        scanLine.y += scanDirection * 0.5;
        if (scanLine.y > 5) scanDirection = -1;
        if (scanLine.y < -25) scanDirection = 1;
        requestAnimationFrame(animateScan);
    };
    animateScan();
    
    consoleContainer.addChild(scanLine);
    
    return consoleContainer;
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
      baseColor: 0x3f3f3f,       // Gray
      highlightColor: 0x5f5f5f,  // Lighter gray
      shadowColor: 0x2f2f2f,     // Darker gray
      darkShadow: 0x1f1f1f,      // Very dark gray
      groutColor: 0x252525       // Dark gray grout
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

const createSpaceWalls = (width, height, row, col, layout, colliders, offsetX, offsetY) => {
  const walls = [];
  const thick = 24;        // Thick hull walls
  const thin = 12;         // Thin interior walls
  const airlockSize = 60;  // Airlock door size
  
  const wallColor = 0x2a2a2a;      // Dark gray hull
  const wallHighlight = 0x4a4a4a;  // Lighter gray for highlights
  const wallShadow = 0x1a1a1a;     // Darker shadow
  
  // ─── Top Wall ───
  const topThickness = row === 0 ? thick : thin;
  const hasRoomAbove = row > 0 && layout[row - 1] && layout[row - 1][col];
  const topWall = new Graphics();
  
  if (hasRoomAbove) {
    // Airlock positioned center-left
    const airlockStart = width / 2 - airlockSize / 2 - 60;
    const airlockEnd = airlockStart + airlockSize;
    
    // Create wall segments with airlock gap
    topWall.rect(0, 0, airlockStart, topThickness);
    topWall.rect(airlockEnd, 0, width - airlockEnd, topThickness);
    
    // Add airlock visual elements
    createAirlockDoor(topWall, airlockStart, 0, airlockSize, topThickness, 'horizontal');
  } else {
    // Solid hull wall
    topWall.rect(0, 0, width, topThickness);
  }
  
  topWall.fill(wallColor);
  // Add highlight strip
  topWall.rect(0, 0, width, 2);
  topWall.fill(wallHighlight);
  // Add shadow strip
  topWall.rect(0, topThickness - 2, width, 2);
  topWall.fill(wallShadow);
  walls.push(topWall);
  
  // ─── Bottom Wall ───
  const bottomThickness = row === layout.length - 1 ? thick : thin;
  const hasRoomBelow = row < layout.length - 1 && layout[row + 1] && layout[row + 1][col];
  const bottomWall = new Graphics();
  const bottomY = height - bottomThickness;
  
  if (hasRoomBelow) {
    const airlockStart = width / 2 - airlockSize / 2 - 60;
    const airlockEnd = airlockStart + airlockSize;
    
    // Create wall segments
    bottomWall.rect(0, bottomY, airlockStart, bottomThickness);
    bottomWall.rect(airlockEnd, bottomY, width - airlockEnd, bottomThickness);
    
    // Add airlock visual elements
    createAirlockDoor(bottomWall, airlockStart, bottomY, airlockSize, bottomThickness, 'horizontal');
  } else {
    // Solid hull wall
    bottomWall.rect(0, bottomY, width, bottomThickness);
  }
  
  bottomWall.fill(wallColor);
  bottomWall.rect(0, bottomY, width, 2);
  bottomWall.fill(wallHighlight);
  bottomWall.rect(0, bottomY + bottomThickness - 2, width, 2);
  bottomWall.fill(wallShadow);
  walls.push(bottomWall);
  
  // ─── Left Wall ───
  const leftThickness = col === 0 ? thick : thin;
  const hasRoomLeft = col > 0 && layout[row][col - 1];
  const leftWall = new Graphics();
  
  if (hasRoomLeft) {
    const airlockStart = height / 2 - airlockSize / 2 - 60;
    const airlockEnd = airlockStart + airlockSize;
    
    // Create wall segments
    leftWall.rect(0, 0, leftThickness, airlockStart);
    leftWall.rect(0, airlockEnd, leftThickness, height - airlockEnd);
    
    // Add airlock visual elements
    createAirlockDoor(leftWall, 0, airlockStart, leftThickness, airlockSize, 'vertical');
  } else {
    // Solid hull wall
    leftWall.rect(0, 0, leftThickness, height);
  }
  
  leftWall.fill(wallColor);
  leftWall.rect(0, 0, 2, height);
  leftWall.fill(wallHighlight);
  leftWall.rect(leftThickness - 2, 0, 2, height);
  leftWall.fill(wallShadow);
  walls.push(leftWall);
  
  // ─── Right Wall ───
  const rightThickness = col === layout[row].length - 1 ? thick : thin;
  const hasRoomRight = col < layout[row].length - 1 && layout[row][col + 1];
  const rightWall = new Graphics();
  const rightX = width - rightThickness;
  
  if (hasRoomRight) {
    const airlockStart = height / 2 - airlockSize / 2 - 60;
    const airlockEnd = airlockStart + airlockSize;
    
    // Create wall segments
    rightWall.rect(rightX, 0, rightThickness, airlockStart);
    rightWall.rect(rightX, airlockEnd, rightThickness, height - airlockEnd);
    
    // Add airlock visual elements
    createAirlockDoor(rightWall, rightX, airlockStart, rightThickness, airlockSize, 'vertical');
  } else {
    // Solid hull wall
    rightWall.rect(rightX, 0, rightThickness, height);
  }
  
  rightWall.fill(wallColor);
  rightWall.rect(rightX, 0, 2, height);
  rightWall.fill(wallHighlight);
  rightWall.rect(rightX + rightThickness - 2, 0, 2, height);
  rightWall.fill(wallShadow);
  walls.push(rightWall);
  
  return walls;
};

const createAirlockDoor = (wall, x, y, width, height, orientation) => {
  const airlockColor = 0x004466;      // Blue airlock
  const airlockHighlight = 0x0066aa;  // Lighter blue
  const airlockShadow = 0x002244;     // Darker blue
  
  // Main airlock frame
  wall.rect(x, y, width, height);
  wall.fill(airlockColor);
  
  if (orientation === 'horizontal') {
    // Horizontal airlock details
    wall.rect(x + 5, y, width - 10, 2);
    wall.fill(airlockHighlight);
    wall.rect(x + 5, y + height - 2, width - 10, 2);
    wall.fill(airlockShadow);
    
    // Center line
    wall.rect(x + width/2 - 1, y + 2, 2, height - 4);
    wall.fill(airlockShadow);
  } else {
    // Vertical airlock details
    wall.rect(x, y + 5, 2, height - 10);
    wall.fill(airlockHighlight);
    wall.rect(x + width - 2, y + 5, 2, height - 10);
    wall.fill(airlockShadow);
    
    // Center line
    wall.rect(x + 2, y + height/2 - 1, width - 4, 2);
    wall.fill(airlockShadow);
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
    bridgeContainer.zIndex = 1;
    
    // Create graphics object for drawing
    const graphics = new Graphics();
    
    // Main bridge platform (oval/elongated design)
    graphics.beginFill(0x1a1a1a);
    graphics.lineStyle(4, 0x333333);
    graphics.drawEllipse(0, 0, 80, 60);
    graphics.endFill();
    
    // Inner platform deck
    graphics.beginFill(0x0d0d0d);
    graphics.lineStyle(2, 0x2a2a2a);
    graphics.drawEllipse(0, 0, 72, 52);
    graphics.endFill();
    
    // Central captain's command platform
    graphics.beginFill(0x2a2a2a);
    graphics.lineStyle(2, 0x444444);
    graphics.drawEllipse(0, 0, 25, 20);
    graphics.endFill();
    
    // Main viewscreen/holographic display
    graphics.beginFill(0x001133);
    graphics.lineStyle(3, 0x0066cc);
    graphics.drawRoundedRect(-35, -45, 70, 25, 5);
    graphics.endFill();
    
    // Viewscreen frame details
    graphics.beginFill(0x333333);
    graphics.drawRoundedRect(-37, -47, 4, 29, 1);
    graphics.drawRoundedRect(33, -47, 4, 29, 1);
    graphics.drawRoundedRect(-35, -49, 70, 4, 1);
    graphics.endFill();
    
    // Holographic display content
    graphics.beginFill(0x003366);
    graphics.lineStyle(1, 0x00aaff);
    graphics.drawRoundedRect(-30, -40, 60, 15, 2);
    graphics.endFill();
    
    // Display grid and tactical overlay
    graphics.lineStyle(1, 0x0099ff, 0.6);
    for (let i = -25; i <= 25; i += 10) {
        graphics.moveTo(i, -38);
        graphics.lineTo(i, -27);
    }
    for (let i = -38; i <= -27; i += 5) {
        graphics.moveTo(-28, i);
        graphics.lineTo(28, i);
    }
    
    // Central tactical display
    graphics.lineStyle(2, 0x00ff66);
    graphics.drawCircle(0, -32, 8);
    graphics.moveTo(-5, -32);
    graphics.lineTo(5, -32);
    graphics.moveTo(0, -37);
    graphics.lineTo(0, -27);
    
    // Forward stations (helm, navigation, operations)
    const forwardStations = [
        { x: -45, y: -15, color: 0x00ff00, name: "HELM" },
        { x: 0, y: -25, color: 0x00ccff, name: "NAV" },
        { x: 45, y: -15, color: 0xffaa00, name: "OPS" }
    ];
    
    forwardStations.forEach(station => {
        // Station console
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(2, 0x444444);
        graphics.drawRoundedRect(station.x - 12, station.y - 8, 24, 16, 3);
        graphics.endFill();
        
        // Station display
        graphics.beginFill(0x0d1a0d);
        graphics.lineStyle(1, station.color);
        graphics.drawRoundedRect(station.x - 10, station.y - 6, 20, 12, 2);
        graphics.endFill();
        
        // Display content
        graphics.beginFill(station.color);
        graphics.drawRect(station.x - 8, station.y - 4, 16, 1);
        graphics.drawRect(station.x - 8, station.y - 1, 16, 1);
        graphics.drawRect(station.x - 8, station.y + 2, 16, 1);
        graphics.endFill();
        
        // Status indicator
        graphics.beginFill(station.color);
        graphics.drawCircle(station.x + 15, station.y, 3);
        graphics.endFill();
        
        // Control panels
        graphics.beginFill(0x1a1a1a);
        graphics.drawRoundedRect(station.x - 6, station.y + 10, 4, 6, 1);
        graphics.drawRoundedRect(station.x - 1, station.y + 10, 4, 6, 1);
        graphics.drawRoundedRect(station.x + 4, station.y + 10, 4, 6, 1);
        graphics.endFill();
    });
    
    // Rear stations (tactical, engineering, science)
    const rearStations = [
        { x: -50, y: 25, color: 0xff0000, name: "TAC" },
        { x: 0, y: 35, color: 0xff6600, name: "ENG" },
        { x: 50, y: 25, color: 0x6600ff, name: "SCI" }
    ];
    
    rearStations.forEach(station => {
        // Station console
        graphics.beginFill(0x2a2a2a);
        graphics.lineStyle(2, 0x444444);
        graphics.drawRoundedRect(station.x - 12, station.y - 8, 24, 16, 3);
        graphics.endFill();
        
        // Station display
        graphics.beginFill(0x1a0d0d);
        graphics.lineStyle(1, station.color);
        graphics.drawRoundedRect(station.x - 10, station.y - 6, 20, 12, 2);
        graphics.endFill();
        
        // Display content
        graphics.beginFill(station.color);
        graphics.drawRect(station.x - 8, station.y - 4, 16, 1);
        graphics.drawRect(station.x - 8, station.y - 1, 16, 1);
        graphics.drawRect(station.x - 8, station.y + 2, 16, 1);
        graphics.endFill();
        
        // Status indicator
        graphics.beginFill(station.color);
        graphics.drawCircle(station.x + 15, station.y, 3);
        graphics.endFill();
        
        // Control panels
        graphics.beginFill(0x1a1a1a);
        graphics.drawRoundedRect(station.x - 6, station.y + 10, 4, 6, 1);
        graphics.drawRoundedRect(station.x - 1, station.y + 10, 4, 6, 1);
        graphics.drawRoundedRect(station.x + 4, station.y + 10, 4, 6, 1);
        graphics.endFill();
    });
    
    // Captain's chair area details
    graphics.beginFill(0x333333);
    graphics.drawCircle(-8, -5, 3);
    graphics.drawCircle(8, -5, 3);
    graphics.drawCircle(-8, 5, 3);
    graphics.drawCircle(8, 5, 3);
    graphics.endFill();
    
    // Bridge structural supports
    graphics.lineStyle(3, 0x2a2a2a);
    graphics.moveTo(-60, -40);
    graphics.lineTo(60, -40);
    graphics.moveTo(-70, 0);
    graphics.lineTo(70, 0);
    graphics.moveTo(-60, 40);
    graphics.lineTo(60, 40);
    
    // Power distribution nodes
    graphics.beginFill(0x0066cc);
    graphics.drawCircle(-65, -35, 4);
    graphics.drawCircle(65, -35, 4);
    graphics.drawCircle(-65, 35, 4);
    graphics.drawCircle(65, 35, 4);
    graphics.endFill();
    
    // Data conduits
    graphics.lineStyle(2, 0x00aaff, 0.4);
    graphics.moveTo(-65, -35);
    graphics.lineTo(-45, -15);
    graphics.moveTo(65, -35);
    graphics.lineTo(45, -15);
    graphics.moveTo(-65, 35);
    graphics.lineTo(-50, 25);
    graphics.moveTo(65, 35);
    graphics.lineTo(50, 25);
    
    // Emergency lighting strips
    graphics.lineStyle(2, 0xff3300, 0.3);
    graphics.moveTo(-75, -50);
    graphics.lineTo(75, -50);
    graphics.moveTo(-75, 50);
    graphics.lineTo(75, 50);
    
    // Bridge perimeter details
    graphics.beginFill(0x1a1a1a);
    graphics.drawRoundedRect(-78, -8, 8, 16, 2);
    graphics.drawRoundedRect(70, -8, 8, 16, 2);
    graphics.endFill();
    
    // Access panels
    graphics.beginFill(0x333333);
    graphics.drawRect(-76, -6, 4, 12);
    graphics.drawRect(72, -6, 4, 12);
    graphics.endFill();
    
    // Add graphics to container
    bridgeContainer.addChild(graphics);
    
    // Create animated elements
    const createStatusLight = (x, y, color, speed) => {
        const light = new Graphics();
        light.beginFill(color);
        light.drawCircle(0, 0, 2);
        light.endFill();
        light.x = x;
        light.y = y;
        light.alpha = 0.5;
        
        let pulse = 0;
        const animate = () => {
            pulse += speed;
            light.alpha = 0.3 + Math.sin(pulse) * 0.5;
            requestAnimationFrame(animate);
        };
        animate();
        
        return light;
    };
    
    // Add pulsing status lights
    const helmLight = createStatusLight(-30, -15, 0x00ff00, 0.08);
    const navLight = createStatusLight(15, -25, 0x00ccff, 0.06);
    const opsLight = createStatusLight(60, -15, 0xffaa00, 0.07);
    const tacLight = createStatusLight(-35, 25, 0xff0000, 0.09);
    const engLight = createStatusLight(15, 35, 0xff6600, 0.05);
    const sciLight = createStatusLight(65, 25, 0x6600ff, 0.08);
    
    bridgeContainer.addChild(helmLight);
    bridgeContainer.addChild(navLight);
    bridgeContainer.addChild(opsLight);
    bridgeContainer.addChild(tacLight);
    bridgeContainer.addChild(engLight);
    bridgeContainer.addChild(sciLight);
    
    // Main viewscreen scanning effect
    const scanLine = new Graphics();
    scanLine.beginFill(0x00ccff);
    scanLine.drawRect(-30, 0, 60, 1);
    scanLine.endFill();
    scanLine.alpha = 0.7;
    scanLine.y = -40;
    
    let scanDirection = 1;
    const animateScan = () => {
        scanLine.y += scanDirection * 0.3;
        if (scanLine.y > -25) scanDirection = -1;
        if (scanLine.y < -40) scanDirection = 1;
        scanLine.alpha = 0.4 + Math.sin(scanLine.y * 0.2) * 0.3;
        requestAnimationFrame(animateScan);
    };
    animateScan();
    
    bridgeContainer.addChild(scanLine);
    
    // Power flow animation
    const powerFlow = new Graphics();
    let flowOffset = 0;
    
    const animatePowerFlow = () => {
        flowOffset += 0.1;
        powerFlow.clear();
        powerFlow.lineStyle(2, 0x00aaff, 0.6);
        
        // Flowing energy particles
        for (let i = 0; i < 8; i++) {
            const progress = (i / 8 + flowOffset) % 1;
            const angle = progress * Math.PI * 2;
            const radius = 45 + Math.sin(flowOffset * 2 + i) * 5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            powerFlow.drawCircle(x, y, 1.5);
        }
        
        requestAnimationFrame(animatePowerFlow);
    };
    animatePowerFlow();
    
    bridgeContainer.addChild(powerFlow);
    
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
      { type: 'reactor', width: 300, height: 600, name: 'Reactor Core' }
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
            offsetX + width / 2 - 20,
            offsetY + 60,
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
          
          // // Holographic display (center front)
          // camera.addChild(createHoloDisplay(
          //   offsetX + width / 2,
          //   offsetY + 120,
          //   camera,
          //   gameState.colliders
          // ));
          
          // // Bridge crew stations
          camera.addChild(createBridgeStation(
            offsetX + 120,
            offsetY + height - 80,
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

        // case 'communications': // Comms Array
        //   // Communication arrays
        //   camera.addChild(createCommArray(
        //     offsetX + 100,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createCommArray(
        //     offsetX + width - 100,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Signal processing units
        //   camera.addChild(createSignalProcessor(
        //     offsetX + width / 2,
        //     offsetY + 150,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Monitoring stations
        //   camera.addChild(createMonitoringStation(
        //     offsetX + 80,
        //     offsetY + 250,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createMonitoringStation(
        //     offsetX + width - 80,
        //     offsetY + 250,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Data storage units
        //   camera.addChild(createDataBank(
        //     offsetX + 50,
        //     offsetY + height - 60,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createDataBank(
        //     offsetX + width - 50,
        //     offsetY + height - 60,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

        // case 'med_bay': // Medical Bay
        //   // Medical beds
        //   camera.addChild(createMedBed(
        //     offsetX + 120,
        //     offsetY + 150,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createMedBed(
        //     offsetX + 120,
        //     offsetY + 300,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Medical equipment
        //   camera.addChild(createMedScanner(
        //     offsetX + 300,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Drug synthesizer
        //   camera.addChild(createDrugSynthesizer(
        //     offsetX + width - 100,
        //     offsetY + 150,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Medical storage
        //   camera.addChild(createMedStorage(
        //     offsetX + 50,
        //     offsetY + 80,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createMedStorage(
        //     offsetX + width - 50,
        //     offsetY + 80,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Emergency medical kit
        //   camera.addChild(createEmergencyKit(
        //     offsetX + width / 2,
        //     offsetY + height - 50,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

        // case 'lab': // Research Lab
        //   // Laboratory workstations
        //   camera.addChild(createLabWorkstation(
        //     offsetX + 100,
        //     offsetY + 120,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createLabWorkstation(
        //     offsetX + width - 100,
        //     offsetY + 120,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Specimen containers
        //   camera.addChild(createSpecimenContainer(
        //     offsetX + 80,
        //     offsetY + 250,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createSpecimenContainer(
        //     offsetX + width - 80,
        //     offsetY + 250,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Analysis equipment
        //   camera.addChild(createAnalysisEquipment(
        //     offsetX + width / 2,
        //     offsetY + 180,
        //     camera,
        //     gameState.colliders
        //   ));
          
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
        //   break;

        // case 'engineering': // Engineering Bay
        //   // Main engineering console
        //   camera.addChild(createEngineeringConsole(
        //     offsetX + width / 2,
        //     offsetY + 150,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Power distribution units
        //   camera.addChild(createPowerDistribution(
        //     offsetX + 100,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createPowerDistribution(
        //     offsetX + width - 100,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Repair stations
        //   camera.addChild(createRepairStation(
        //     offsetX + 150,
        //     offsetY + 350,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createRepairStation(
        //     offsetX + width - 150,
        //     offsetY + 350,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Tool storage
        //   camera.addChild(createToolStorage(
        //     offsetX + 60,
        //     offsetY + 450,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createToolStorage(
        //     offsetX + width - 60,
        //     offsetY + 450,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Fabrication units
        //   camera.addChild(createFabricationUnit(
        //     offsetX + width / 2 - 120,
        //     offsetY + 450,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createFabricationUnit(
        //     offsetX + width / 2 + 120,
        //     offsetY + 450,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

        // case 'storage': // Cargo Hold
        //   // Cargo containers in organized rows
        //   for (let i = 0; i < 3; i++) {
        //     for (let j = 0; j < 2; j++) {
        //       camera.addChild(createCargoContainer(
        //         offsetX + 80 + i * 80,
        //         offsetY + 100 + j * 120,
        //         camera,
        //         gameState.colliders
        //       ));
        //     }
        //   }
          
        //   // Loading equipment
        //   camera.addChild(createLoadingEquipment(
        //     offsetX + width / 2,
        //     offsetY + height - 80,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Storage lockers
        //   camera.addChild(createStorageLocker(
        //     offsetX + 30,
        //     offsetY + 400,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createStorageLocker(
        //     offsetX + width - 30,
        //     offsetY + 400,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

        // case 'reactor': // Reactor Core
        //   // Main reactor core
        //   camera.addChild(createReactorCore(
        //     offsetX + width / 2,
        //     offsetY + height / 2,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Cooling systems
        //   camera.addChild(createCoolingSystem(
        //     offsetX + 40,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
        //   camera.addChild(createCoolingSystem(
        //     offsetX + width - 40,
        //     offsetY + 100,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Control panels
        //   camera.addChild(createReactorControlPanel(
        //     offsetX + width / 2,
        //     offsetY + 80,
        //     camera,
        //     gameState.colliders
        //   ));
          
        //   // Warning systems
        //   camera.addChild(createWarningSystem(
        //     offsetX + 30,
        //     offsetY + 30,
        //     camera,
        //     gameState.colliders
        //   ));
        //   break;

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

// 2. Collision detection removed for now
const willCollide = (x, y, colliders) => {
  return false; // No collision detection for now
};

// 3. Fixed gameLoop function (uncomment the movement code)
const gameLoop = (gameState, app) => {
  const speed = gameState.playerSpeed || 2;
  const { player, keys, camera, world, ROOM_GRID, colliders } = gameState;
  const ROOM_WIDTH = ROOM_GRID?.cols * ROOM_GRID?.roomWidth || 800;
  const ROOM_HEIGHT = ROOM_GRID?.rows * ROOM_GRID?.roomHeight || 600;

  if (!player || !keys) return;

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
    let newX = originalX + dx;
    let newY = originalY + dy;

    // Apply movement directly (no collision detection)
    player.x = newX;
    player.y = newY;

    // Determine animation direction based on movement
    if (Math.abs(dx) > Math.abs(dy)) {
      player.walk(dx > 0 ? "right" : "left");
    } else if (dy !== 0) {
      player.walk(dy > 0 ? "down" : "up");
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
  if (world && camera) {
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
