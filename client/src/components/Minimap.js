import React, { useState, useEffect } from 'react';

const MetaverseMinimap = ({ gameStateRef }) => {
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

  // Calculate container dimensions
  const containerWidth = 220;
  const containerHeight = 180;
  const headerHeight = 43;
  
  // Calculate available space for the minimap (fill entire content area)
  const availableWidth = containerWidth;
  const availableHeight = containerHeight - headerHeight;
  
  // Make minimap fill the entire available space
  const minimapWidth = availableWidth;
  const minimapHeight = availableHeight;
  
  const { rows, cols } = gameState.ROOM_GRID;
  const roomWidth = minimapWidth / cols;
  const roomHeight = minimapHeight / rows;

  // Helper functions
  const getPlayerRoom = (x, y) => {
    const { roomWidth: worldRoomWidth, roomHeight: worldRoomHeight } = gameState.ROOM_GRID;
    const col = Math.floor(x / worldRoomWidth);
    const row = Math.floor(y / worldRoomHeight);
    return { row, col };
  };

  const worldToMinimap = (x, y, minimapWidth, minimapHeight) => {
    const { rows, cols, roomWidth: worldRoomWidth, roomHeight: worldRoomHeight } = gameState.ROOM_GRID;
    const worldWidth = cols * worldRoomWidth;
    const worldHeight = rows * worldRoomHeight;
    
    return {
      x: (x / worldWidth) * minimapWidth,
      y: (y / worldHeight) * minimapHeight
    };
  };

  // Get player position and current room
  const playerPosition = gameState.player ? {
    x: gameState.player.x || 0,
    y: gameState.player.y || 0
  } : { x: 0, y: 0 };

  const currentRoom = gameState.player ? getPlayerRoom(playerPosition.x, playerPosition.y) : { row: 0, col: 0 };

  // Get player position on minimap
  const playerMinimapPos = worldToMinimap(
    playerPosition.x, 
    playerPosition.y, 
    minimapWidth, 
    minimapHeight
  );

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
        📍 Mini Map
      </div>

      {/* Minimap Content - fill entire remaining space */}
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
          viewBox={`0 0 ${minimapWidth} ${minimapHeight}`}
          style={{ 
            background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
            display: 'block'
          }}
        >
          {/* Room Grid with enhanced styling */}
          {Array.from({ length: rows }, (_, r) => 
            Array.from({ length: cols }, (_, c) => {
              const x = c * roomWidth;
              const y = r * roomHeight;
              const isCurrentRoom = currentRoom.row === r && currentRoom.col === c;
              
              return (
                <g key={`room-${r}-${c}`}>
                  {/* Room Rectangle with gradient */}
                  <defs>
                    <linearGradient
                      id={`roomGradient-${r}-${c}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: isCurrentRoom ? "#3498DB" : "#34495E",
                          stopOpacity: isCurrentRoom ? 0.8 : 0.3,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: isCurrentRoom ? "#2980B9" : "#2C3E50",
                          stopOpacity: isCurrentRoom ? 0.6 : 0.2,
                        }}
                      />
                    </linearGradient>
                  </defs>

                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={roomWidth - 2}
                    height={roomHeight - 2}
                    fill={`url(#roomGradient-${r}-${c})`}
                    stroke={isCurrentRoom ? "#3498DB" : "#BDC3C7"}
                    strokeWidth={isCurrentRoom ? "2" : "1"}
                    rx="4"
                    ry="4"
                  />

                  {/* Room glow effect for current room */}
                  {isCurrentRoom && (
                    <rect
                      x={x + 1}
                      y={y + 1}
                      width={roomWidth - 2}
                      height={roomHeight - 2}
                      fill="none"
                      stroke="#3498DB"
                      strokeWidth="1"
                      rx="4"
                      ry="4"
                      opacity="0.6"
                      filter="blur(2px)"
                    />
                  )}

                  {/* Room Label with better styling - adjust font size based on room size */}
                  <text
                    x={x + roomWidth / 2}
                    y={y + roomHeight / 2 + 6}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.min(roomWidth / 16, roomHeight / 12, 6)}
                    fill="#F39C12"
                    fontWeight="bold"
                  >
                    Room {r},{c}
                  </text>

                  {/* Office furniture indicators */}
                  {r === 0 && c === 0 && (
                    <g>
                      <text
                        x={x + roomWidth / 2}
                        y={y + roomHeight / 2 - 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={Math.min(roomWidth / 12, roomHeight / 8, 8)}
                        fill="#E8F4F8"
                        fontWeight="bold"
                        textShadow="0 1px 2px rgba(0,0,0,0.5)"
                      >
                        Meeting room
                      </text>
                      {/* Small desk indicators */}
                      <circle
                        cx={x + Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                      <circle
                        cx={x + roomWidth - Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                    </g>
                  )}
                 {r === 0 && c === 1 && (
                    <g>
                      <text
                        x={x + roomWidth / 2}
                        y={y + roomHeight / 2 - 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={Math.min(roomWidth / 12, roomHeight / 8, 8)}
                        fill="#E8F4F8"
                        fontWeight="bold"
                        textShadow="0 1px 2px rgba(0,0,0,0.5)"
                      >
                        Library
                      </text>
                      {/* Small desk indicators */}
                      <circle
                        cx={x + Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                      <circle
                        cx={x + roomWidth - Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                    </g>
                  )}
                {r === 1 && c === 0 && (
                    <g>
                      <text
                        x={x + roomWidth / 2}
                        y={y + roomHeight / 2 - 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={Math.min(roomWidth / 12, roomHeight / 8, 8)}
                        fill="#E8F4F8"
                        fontWeight="bold"
                        textShadow="0 1px 2px rgba(0,0,0,0.5)"
                      >
                        Conference room
                      </text>
                      {/* Small desk indicators */}
                      <circle
                        cx={x + Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                      <circle
                        cx={x + roomWidth - Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                    </g>
                  )}
                    {r === 1 && c === 1 && (
                    <g>
                      <text
                        x={x + roomWidth / 2}
                        y={y + roomHeight / 2 - 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={Math.min(roomWidth / 12, roomHeight / 8, 8)}
                        fill="#E8F4F8"
                        fontWeight="bold"
                        textShadow="0 1px 2px rgba(0,0,0,0.5)"
                      >
                        Game room
                      </text>
                      {/* Small desk indicators */}
                      <circle
                        cx={x + Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                      <circle
                        cx={x + roomWidth - Math.min(roomWidth * 0.15, 10)}
                        cy={y + Math.min(roomHeight * 0.15, 10)}
                        r={Math.min(roomWidth / 40, 2)}
                        fill="#D35400"
                        opacity="0.7"
                      />
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Other Players with enhanced styling */}
          {gameState.otherPlayers && gameState.otherPlayers.length > 0 && 
            gameState.otherPlayers.map((player, index) => {
              const pos = worldToMinimap(player.x || 0, player.y || 0, minimapWidth, minimapHeight);
              const playerSize = Math.min(minimapWidth / 60, minimapHeight / 45, 3);
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
                    strokeWidth="1.5"
                  />
                  {/* Player name with background */}
                  <rect
                    x={pos.x - 15}
                    y={pos.y - 15}
                    width="30"
                    height="8"
                    fill="rgba(0,0,0,0.7)"
                    rx="2"
                    ry="2"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 9}
                    textAnchor="middle"
                    fontSize={Math.min(minimapWidth / 30, minimapHeight / 22, 6)}
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
              r={Math.min(minimapWidth / 25, minimapHeight / 18, 8)}
              fill="#27AE60"
              opacity="0.4"
              filter="blur(3px)"
            />
            {/* Pulsing ring */}
            <circle
              cx={playerMinimapPos.x}
              cy={playerMinimapPos.y}
              r={Math.min(minimapWidth / 30, minimapHeight / 22, 6)}
              fill="none"
              stroke="#27AE60"
              strokeWidth="2"
              opacity="0.6"
            >
              <animate 
                attributeName="r" 
                values={`${Math.min(minimapWidth / 30, minimapHeight / 22, 6)};${Math.min(minimapWidth / 18, minimapHeight / 13, 10)};${Math.min(minimapWidth / 30, minimapHeight / 22, 6)}`}
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
              r={Math.min(minimapWidth / 45, minimapHeight / 33, 4)}
              fill="#27AE60"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            {/* Player label with background */}
            <rect
              x={playerMinimapPos.x - 12}
              y={playerMinimapPos.y - 18}
              width="24"
              height="10"
              fill="rgba(39, 174, 96, 0.8)"
              rx="3"
              ry="3"
            />
            <text
              x={playerMinimapPos.x}
              y={playerMinimapPos.y - 11}
              textAnchor="middle"
              fontSize={Math.min(minimapWidth / 25, minimapHeight / 19, 7)}
              fill="#FFFFFF"
              fontWeight="bold"
            >
              YOU
            </text>
          </g>

          {/* Enhanced Grid Lines */}
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line
              key={`v-line-${i}`}
              x1={i * roomWidth}
              y1={0}
              x2={i * roomWidth}
              y2={minimapHeight}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line
              key={`h-line-${i}`}
              x1={0}
              y1={i * roomHeight}
              x2={minimapWidth}
              y2={i * roomHeight}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default MetaverseMinimap;