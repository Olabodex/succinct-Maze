/**
 * Maze utilities and generation code
 */

// Default maze data for when server communication is not possible
const DEFAULT_MAZE = {
  id: 1,
  grid: [
    [0, 0, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0],
    [1, 1, 0, 0, 0, 1]
  ],
  width: 6,
  height: 6,
  startX: 0,
  startY: 0,
  exitX: 5,
  exitY: 2
};

// Cell types
const CELL_TYPE = {
  PATH: 0,
  WALL: 1
};

// Direction mappings
const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

/**
 * Creates a new maze with the specified dimensions
 * @param {number} width 
 * @param {number} height 
 * @returns {object} The maze data
 */
function createMaze(width = 6, height = 6) {
  // For simplicity in this vanilla version, we'll use the default maze
  // In a full implementation, we would generate a random maze here
  return {
    ...DEFAULT_MAZE,
    width,
    height
  };
}

/**
 * Gets the cell type at a specific position
 * @param {number[][]} grid The maze grid
 * @param {object} position The position {x, y}
 * @param {object} startPos The start position {x, y}
 * @param {object} exitPos The exit position {x, y}
 * @returns {string} The cell type ('wall', 'path', 'start', 'exit')
 */
function getCellType(grid, position, startPos, exitPos) {
  if (position.x === startPos.x && position.y === startPos.y) {
    return 'start';
  }
  
  if (position.x === exitPos.x && position.y === exitPos.y) {
    return 'exit';
  }
  
  if (grid[position.y] && grid[position.y][position.x] === CELL_TYPE.WALL) {
    return 'wall';
  }
  
  return 'path';
}

/**
 * Determines if a move is valid within the maze
 * @param {number[][]} grid The maze grid
 * @param {object} position Current position {x, y}
 * @param {string} direction Direction to move
 * @param {number} width Maze width
 * @param {number} height Maze height
 * @returns {boolean} Whether the move is valid
 */
function isValidMove(grid, position, direction, width, height) {
  const { dx, dy } = DIRECTIONS[direction];
  const newX = position.x + dx;
  const newY = position.y + dy;
  
  // Check boundaries
  if (newX < 0 || newX >= width || newY < 0 || newY >= height) {
    return false;
  }
  
  // Check if wall
  if (grid[newY][newX] === CELL_TYPE.WALL) {
    return false;
  }
  
  return true;
}

/**
 * Calculate the new position after a move
 * @param {object} position Current position {x, y}
 * @param {string} direction Direction to move
 * @returns {object} New position {x, y}
 */
function getNewPosition(position, direction) {
  const { dx, dy } = DIRECTIONS[direction];
  return {
    x: position.x + dx,
    y: position.y + dy
  };
}

/**
 * Check if the position is at the exit
 * @param {object} position Current position {x, y}
 * @param {object} exitPos Exit position {x, y}
 * @returns {boolean} Whether player is at exit
 */
function isAtExit(position, exitPos) {
  return position.x === exitPos.x && position.y === exitPos.y;
}

/**
 * Simulates a path through the maze to verify it's solvable
 * This is a simplified simulation of solving the maze
 * @param {object} mazeData The maze data
 * @param {Array} moves The array of moves made by the player
 * @returns {boolean} Whether the path successfully reaches the exit
 */
function verifyPath(mazeData, moves) {
  const position = { 
    x: mazeData.startX, 
    y: mazeData.startY 
  };
  
  for (const move of moves) {
    const { direction } = move;
    
    if (!isValidMove(mazeData.grid, position, direction, mazeData.width, mazeData.height)) {
      return false; // Invalid move
    }
    
    const newPosition = getNewPosition(position, direction);
    position.x = newPosition.x;
    position.y = newPosition.y;
  }
  
  // Check if the final position is the exit
  return isAtExit(position, { x: mazeData.exitX, y: mazeData.exitY });
}