import React, { useState, useEffect } from 'react';

const SpaceStationMinimap = ({ gameStateRef }) => {
  // Get current game state
  const gameState = gameStateRef?.current || {
    ROOM_GRID: { rows: 2, cols: 2, roomWidth: 800, roomHeight: 600 },
    player: null,
    otherPlayers: []
  };

  // Use React state for smooth updates
  const [, forceUpdate] = useState({});
  
  // Force re-render periodically to show player movement
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Define the space station layout with scaled dimensions for minimap
  const SPACE_LAYOUT = [
    // Row 0: Command deck and observation
    [
      { type: 'bridge', width: 84, height: 51, name: 'Command Bridge', color: '#4A90E2' },
      { type: 'observation', width: 48, height: 51, name: 'Observation Deck', color: '#7B68EE' },
      { type: 'communications', width: 72, height: 51, name: 'Comms Array', color: '#50C878' }
    ],
    // Row 1: Main corridors and facilities
    [
      { type: 'secret_room', width: 20, height: 54, name: 'Hidden Room', color: '#FF6B6B' },
      { type: 'med_bay', width: 80, height: 54, name: 'Medical Bay', color: '#FF69B4' },
      { type: 'lab', width: 58, height: 54, name: 'Research Lab', color: '#40E0D0' },
      { type: 'corridor2', width: 54, height: 54, name: 'Corridor A', color: '#D3D3D3' },
    ],
    // Row 2: Engineering and storage
    [
      { type: 'engineering', width: 91, height: 63, name: 'Engineering Bay', color: '#FFA500' },
      { type: 'storage', width: 48, height: 63, name: 'Cargo Hold', color: '#8B4513' },
      { type: 'reactor', width: 72, height: 63, name: 'Reactor Core', color: '#FF4500' },
    ],
    // Row 3: Living quarters
    [
      { type: 'quartersa', width: 46, height: 35, name: 'Crew Quarters A', color: '#9370DB' },
      { type: 'quartersb', width: 46, height: 35, name: 'Crew Quarters B', color: '#9370DB' },
      { type: 'cafeteria', width: 60, height: 35, name: 'Mess Hall', color: '#32CD32' },
      { type: 'recreation', width: 59, height: 35, name: 'Recreation', color: '#FFD700' }
    ]
  ];

  // Calculate container dimensions
  const containerWidth = 280;
  const containerHeight = 280;
  const headerHeight = 43;
  
  // Calculate available space for the minimap
  const availableWidth = containerWidth;
  const availableHeight = containerHeight - headerHeight;
  
  const minimapWidth = availableWidth;
  const minimapHeight = availableHeight;

  // Calculate room positions and total dimensions
  let currentY = 0;
  let maxWidth = 0;
  const rooms = [];
  
  SPACE_LAYOUT.forEach((row, rowIndex) => {
    let currentX = 0;
    const rowHeight = Math.max(...row.map(room => room.height));
    
    row.forEach((roomData, colIndex) => {
      const { type, width, height, name, color } = roomData;
      rooms.push({
        ...roomData,
        x: currentX,
        y: currentY,
        id: `${type}_${rowIndex}_${colIndex}`
      });
      
      currentX += width;
    });
    
    maxWidth = Math.max(maxWidth, currentX);
    currentY += rowHeight;
  });

  const totalWidth = maxWidth;
  const totalHeight = currentY;

  // Helper functions
  const getCurrentRoom = (x, y) => {
    // Scale player position to minimap coordinates
    const scaledX = (x / 10) * (totalWidth / minimapWidth);
    const scaledY = (y / 10) * (totalHeight / minimapHeight);
    
    return rooms.find(room => 
      scaledX >= room.x && 
      scaledX <= room.x + room.width &&
      scaledY >= room.y && 
      scaledY <= room.y + room.height
    );
  };

  const worldToMinimap = (x, y) => {
    // Convert world coordinates to minimap coordinates
    const worldWidth = totalWidth * 10; // Scale factor
    const worldHeight = totalHeight * 10;
    
    return {
      x: Math.max(0, Math.min(minimapWidth, (x / worldWidth) * minimapWidth)),
      y: Math.max(0, Math.min(minimapHeight, (y / worldHeight) * minimapHeight))
    };
  };

  // Get player position
  const playerPosition = gameState.player ? {
    x: gameState.player.x || 0,
    y: gameState.player.y || 0
  } : { x: 0, y: 0 };

  const currentRoom = getCurrentRoom(playerPosition.x, playerPosition.y);
  const playerMinimapPos = worldToMinimap(playerPosition.x, playerPosition.y);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: `${containerWidth}px`,
      height: `${containerHeight}px`,
      background: 'linear-gradient(135deg, rgba(15, 15, 30, 0.95), rgba(30, 30, 60, 0.95))',
      borderRadius: '12px',
      border: '2px solid rgba(52, 152, 219, 0.3)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      pointerEvents: 'auto',
      fontFamily: 'Arial, sans-serif',
      backdropFilter: 'blur(10px)',
      overflow: 'hidden'
    }}>
      {/* Header with gradient and glow effect */}
      <div style={{
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '10px 12px',
        borderBottom: '1px solid rgba(52, 152, 219, 0.3)',
        textAlign: 'center',
        background: 'linear-gradient(90deg, rgba(52, 152, 219, 0.2), rgba(155, 89, 182, 0.2))',
        textShadow: '0 0 10px rgba(52, 152, 219, 0.5)',
        height: `${headerHeight}px`,
        boxSizing: 'border-box'
      }}>
        🚀 Space Station Map
      </div>

      {/* Minimap Content */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: `${containerHeight - headerHeight}px`,
        background: 'linear-gradient(45deg, #2C3E50, #34495E)',
        boxSizing: 'border-box'
      }}>
        <svg 
          width="100%" 
          height="100%"
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          style={{ 
            background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
            display: 'block'
          }}
        >
          {/* Room rectangles with enhanced styling */}
          {rooms.map((room) => {
            const isCurrentRoom = currentRoom && currentRoom.id === room.id;
            
            return (
              <g key={room.id}>
                {/* Room gradient definition */}
                <defs>
                  <linearGradient
                    id={`roomGradient-${room.id}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style={{
                        stopColor: isCurrentRoom ? "#3498DB" : room.color,
                        stopOpacity: isCurrentRoom ? 0.8 : 0.6,
                      }}
                    />
                    <stop
                      offset="100%"
                      style={{
                        stopColor: isCurrentRoom ? "#2980B9" : room.color,
                        stopOpacity: isCurrentRoom ? 0.6 : 0.4,
                      }}
                    />
                  </linearGradient>
                </defs>

                {/* Room rectangle */}
                <rect
                  x={room.x + 1}
                  y={room.y + 1}
                  width={room.width - 2}
                  height={room.height - 2}
                  fill={`url(#roomGradient-${room.id})`}
                  stroke={isCurrentRoom ? "#3498DB" : "#BDC3C7"}
                  strokeWidth={isCurrentRoom ? "2" : "1"}
                  rx="2"
                  ry="2"
                />

                {/* Room glow effect for current room */}
                {isCurrentRoom && (
                  <rect
                    x={room.x + 1}
                    y={room.y + 1}
                    width={room.width - 2}
                    height={room.height - 2}
                    fill="none"
                    stroke="#3498DB"
                    strokeWidth="1"
                    rx="2"
                    ry="2"
                    opacity="0.6"
                    filter="blur(1px)"
                  />
                )}

                {/* Room name */}
                <text
                  x={room.x + room.width / 2}
                  y={room.y + room.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(room.width / 8, room.height / 6, 6)}
                  fill="#E8F4F8"
                  fontWeight="bold"
                  textShadow="0 1px 2px rgba(0,0,0,0.5)"
                >
                  {room.name.split(' ')[0]}
                </text>

                {/* Room type indicators */}
                {room.type === 'bridge' && (
                  <circle
                    cx={room.x + room.width / 2}
                    cy={room.y + room.height / 2 + 8}
                    r={2}
                    fill="#F39C12"
                    opacity="0.8"
                  />
                )}
                {room.type === 'reactor' && (
                  <circle
                    cx={room.x + room.width / 2}
                    cy={room.y + room.height / 2 + 8}
                    r={2}
                    fill="#E74C3C"
                    opacity="0.8"
                  >
                    <animate
                      attributeName="opacity"
                      values="0.8;0.3;0.8"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                {room.type === 'secret_room' && (
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2 + 8}
                    textAnchor="middle"
                    fontSize="4"
                    fill="#FF6B6B"
                    fontWeight="bold"
                  >
                    ?
                  </text>
                )}
              </g>
            );
          })}

          {/* Other Players with enhanced styling */}
          {gameState.otherPlayers && gameState.otherPlayers.length > 0 && 
            gameState.otherPlayers.map((player, index) => {
              const pos = worldToMinimap(player.x || 0, player.y || 0);
              const playerSize = 2;
              return (
                <g key={`player-${index}`}>
                  {/* Player glow effect */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={playerSize + 2}
                    fill="#E74C3C"
                    opacity="0.3"
                    filter="blur(2px)"
                  />
                  {/* Player dot */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={playerSize}
                    fill="#E74C3C"
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                  {/* Player name with background */}
                  <rect
                    x={pos.x - 10}
                    y={pos.y - 12}
                    width="20"
                    height="6"
                    fill="rgba(0,0,0,0.7)"
                    rx="1"
                    ry="1"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 8}
                    textAnchor="middle"
                    fontSize="4"
                    fill="#FFFFFF"
                    fontWeight="bold"
                  >
                    {player.name || `P${index + 1}`}
                  </text>
                </g>
              );
            })
          }

          {/* Current Player with enhanced styling */}
          <g>
            {/* Player glow effect */}
            <circle
              cx={playerMinimapPos.x}
              cy={playerMinimapPos.y}
              r={6}
              fill="#27AE60"
              opacity="0.4"
              filter="blur(2px)"
            />
            {/* Pulsing ring */}
            <circle
              cx={playerMinimapPos.x}
              cy={playerMinimapPos.y}
              r={4}
              fill="none"
              stroke="#27AE60"
              strokeWidth="1"
              opacity="0.6"
            >
              <animate 
                attributeName="r" 
                values="4;8;4"
                dur="2s" 
                repeatCount="indefinite"
              />
              <animate 
                attributeName="opacity" 
                values="0.6;0.2;0.6" 
                dur="2s" 
                repeatCount="indefinite"
              />
            </circle>
            {/* Player dot */}
            <circle
              cx={playerMinimapPos.x}
              cy={playerMinimapPos.y}
              r={3}
              fill="#27AE60"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            {/* Player label with background */}
            <rect
              x={playerMinimapPos.x - 8}
              y={playerMinimapPos.y - 15}
              width="16"
              height="7"
              fill="rgba(39, 174, 96, 0.8)"
              rx="2"
              ry="2"
            />
            <text
              x={playerMinimapPos.x}
              y={playerMinimapPos.y - 10}
              textAnchor="middle"
              fontSize="5"
              fill="#FFFFFF"
              fontWeight="bold"
            >
              YOU
            </text>
          </g>

          {/* Enhanced Grid Lines */}
          <g opacity="0.15">
            {rooms.map((room, index) => (
              <rect
                key={`grid-${index}`}
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="0.5"
              />
            ))}
          </g>
        </svg>
      </div>

      {/* Current Location Display */}
      <div style={{
        position: 'absolute',
        bottom: '5px',
        left: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '10px',
        color: '#E8F4F8',
        textAlign: 'center',
        border: '1px solid rgba(52, 152, 219, 0.3)'
      }}>
        📍 {currentRoom ? currentRoom.name : 'Unknown Area'}
      </div>
    </div>
  );
};

export default SpaceStationMinimap;