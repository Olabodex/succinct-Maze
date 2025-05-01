/**
 * zkMaze Game - Main Game Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  // Game state
  const gameState = {
    playerPosition: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
    exitPosition: { x: 5, y: 5 },
    maze: null,
    mazeId: null,
    moveCount: 0,
    revealedCells: [], // 2D array tracking which cells player has seen
    gameStarted: false,
    verificationState: 'initial', // 'initial', 'proving', 'success', 'failed'
    movesHistory: [], // Track player's moves for verification
    isLoading: false
  };

  // DOM Elements
  const elements = {
    gameBoard: document.getElementById('game-board'),
    moveCounter: document.getElementById('move-counter'),
    startGameBtn: document.getElementById('start-game'),
    resetGameBtn: document.getElementById('reset-game'),
    verifyBtn: document.getElementById('verify-btn'),
    resetVerifyBtn: document.getElementById('reset-verify-btn'),
    verificationStatus: document.getElementById('verification-status'),
    verificationPrompt: document.getElementById('verification-prompt'),
    positionDisplay: document.getElementById('position-display'),
    statusDisplay: document.getElementById('status-display'),
    infoModal: document.getElementById('info-modal'),
    closeBtn: document.querySelector('.close-btn'),
    upBtn: document.getElementById('up-btn'),
    downBtn: document.getElementById('down-btn'),
    leftBtn: document.getElementById('left-btn'),
    rightBtn: document.getElementById('right-btn')
  };

  // Initialize the game
  function initGame() {
    // Set up event listeners
    elements.startGameBtn.addEventListener('click', startGame);
    elements.resetGameBtn.addEventListener('click', resetGame);
    elements.verifyBtn.addEventListener('click', verifyEscape);
    elements.resetVerifyBtn.addEventListener('click', resetVerification);
    elements.closeBtn.addEventListener('click', hideInfoModal);
    
    // Direction button controls
    elements.upBtn.addEventListener('click', () => movePlayer('up'));
    elements.downBtn.addEventListener('click', () => movePlayer('down'));
    elements.leftBtn.addEventListener('click', () => movePlayer('left'));
    elements.rightBtn.addEventListener('click', () => movePlayer('right'));
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === elements.infoModal) {
        hideInfoModal();
      }
    });
  }

  // Handle keyboard input
  function handleKeyPress(event) {
    if (!gameState.gameStarted) return;
    
    switch(event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        movePlayer('up');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        movePlayer('down');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        movePlayer('left');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        movePlayer('right');
        break;
    }
  }

  // Start a new game
  function startGame() {
    gameState.isLoading = true;
    updateUI();
    
    // Create a new maze (in this simplified version, we use the default maze)
    const maze = createMaze();
    
    // Set up initial game state
    gameState.maze = maze.grid;
    gameState.mazeId = maze.id;
    gameState.startPosition = { x: maze.startX, y: maze.startY };
    gameState.exitPosition = { x: maze.exitX, y: maze.exitY };
    gameState.playerPosition = { ...gameState.startPosition };
    gameState.moveCount = 0;
    gameState.gameStarted = true;
    gameState.movesHistory = [];
    
    // Initialize revealed cells array
    gameState.revealedCells = Array(maze.height).fill().map(() => 
      Array(maze.width).fill(false)
    );
    
    // Mark start position as revealed
    revealCell(gameState.playerPosition);
    
    // Reveal adjacent cells to start position
    revealAdjacentCells(gameState.playerPosition);
    
    gameState.isLoading = false;
    updateUI();
    renderMaze();
  }

  // Reset the current game
  function resetGame() {
    if (!gameState.gameStarted) return;
    
    // Reset player to start position
    gameState.playerPosition = { ...gameState.startPosition };
    gameState.moveCount = 0;
    gameState.movesHistory = [];
    
    // Reset revealed cells, only show the start position
    gameState.revealedCells = gameState.revealedCells.map(row => row.map(() => false));
    revealCell(gameState.playerPosition);
    revealAdjacentCells(gameState.playerPosition);
    
    resetVerification();
    updateUI();
    renderMaze();
  }

  // Move the player in a direction
  function movePlayer(direction) {
    if (!gameState.gameStarted) return;
    
    // Check if the move is valid
    if (isValidMove(gameState.maze, gameState.playerPosition, direction, 
        gameState.maze[0].length, gameState.maze.length)) {
      
      // Update player position
      const newPosition = getNewPosition(gameState.playerPosition, direction);
      gameState.playerPosition = newPosition;
      
      // Increment move counter
      gameState.moveCount++;
      
      // Add move to history for verification
      gameState.movesHistory.push({ direction });
      
      // Reveal the cell player moved to
      revealCell(gameState.playerPosition);
      
      // Reveal adjacent cells
      revealAdjacentCells(gameState.playerPosition);
      
      // Check if player reached the exit
      if (isAtExit(gameState.playerPosition, gameState.exitPosition)) {
        elements.verifyBtn.disabled = false;
      }
      
      updateUI();
      renderMaze();
    }
  }

  // Mark a cell as revealed
  function revealCell(position) {
    if (position.y >= 0 && position.y < gameState.revealedCells.length &&
        position.x >= 0 && position.x < gameState.revealedCells[0].length) {
      gameState.revealedCells[position.y][position.x] = true;
    }
  }

  // Reveal cells adjacent to the player's position
  function revealAdjacentCells(position) {
    // Reveal cells in all four directions
    const directions = ['up', 'down', 'left', 'right'];
    
    directions.forEach(dir => {
      const adjacentPos = getNewPosition(position, dir);
      revealCell(adjacentPos);
    });
  }

  // Verify the escape path using zero-knowledge proof
  function verifyEscape() {
    if (!isAtExit(gameState.playerPosition, gameState.exitPosition)) {
      updateVerificationStatus('You must reach the exit first!', 'error');
      return;
    }
    
    // Set verification state to 'proving'
    gameState.verificationState = 'proving';
    updateUI();
    
    // Create and show loader
    const loader = document.createElement('div');
    loader.className = 'verification-loader';
    elements.verificationStatus.innerHTML = '';
    elements.verificationStatus.appendChild(loader);
    
    // Update verification prompt
    elements.verificationPrompt.textContent = 'Generating zero-knowledge proof...';
    
    // Simulate proof generation with a delay
    setTimeout(() => {
      // Check if path is valid (simplified ZK verification)
      const isValid = verifyPath({
        grid: gameState.maze,
        startX: gameState.startPosition.x,
        startY: gameState.startPosition.y,
        exitX: gameState.exitPosition.x,
        exitY: gameState.exitPosition.y,
        width: gameState.maze[0].length,
        height: gameState.maze.length
      }, gameState.movesHistory);
      
      if (isValid) {
        gameState.verificationState = 'success';
        updateVerificationStatus('✅ Proof verified! You have successfully proven you escaped the maze without revealing your path.', 'success');
        elements.verificationPrompt.textContent = 'Verification successful!';
      } else {
        gameState.verificationState = 'failed';
        updateVerificationStatus('❌ Verification failed. The proof is invalid.', 'error');
        elements.verificationPrompt.textContent = 'Verification failed. Try again?';
      }
      
      updateUI();
    }, 1500); // Simulate proof generation delay
  }

  // Reset the verification state
  function resetVerification() {
    gameState.verificationState = 'initial';
    elements.verificationPrompt.textContent = 'Ready to prove you\'ve found the exit?';
    elements.verificationStatus.innerHTML = '';
    updateUI();
  }

  // Update verification status message
  function updateVerificationStatus(message, type = '') {
    elements.verificationStatus.innerHTML = '';
    elements.verificationStatus.textContent = message;
    
    // Remove any existing status classes
    elements.verificationStatus.classList.remove('success', 'error', 'processing');
    
    // Add appropriate class based on type
    if (type === 'success') {
      elements.verificationStatus.classList.add('success');
    } else if (type === 'error') {
      elements.verificationStatus.classList.add('error');
    } else {
      elements.verificationStatus.classList.add('processing');
    }
  }

  // Show info modal
  function showInfoModal() {
    elements.infoModal.classList.add('show');
  }

  // Hide info modal
  function hideInfoModal() {
    elements.infoModal.classList.remove('show');
  }

  // Render the maze on the game board
  function renderMaze() {
    if (!gameState.maze) return;
    
    // Clear existing cells
    elements.gameBoard.innerHTML = '';
    
    // Set the grid layout
    const width = gameState.maze[0].length;
    const height = gameState.maze.length;
    elements.gameBoard.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    elements.gameBoard.style.gridTemplateRows = `repeat(${height}, 1fr)`;
    
    // Create and add cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const position = { x, y };
        const cellElement = document.createElement('div');
        cellElement.classList.add('cell');
        
        const isRevealed = gameState.revealedCells[y][x];
        
        if (isRevealed) {
          cellElement.classList.add('cell-revealed');
          
          // Determine cell type
          const cellType = getCellType(
            gameState.maze, 
            position, 
            gameState.startPosition, 
            gameState.exitPosition
          );
          
          cellElement.classList.add(`cell-${cellType}`);
        } else {
          cellElement.classList.add('cell-hidden');
        }
        
        // Mark player position
        if (gameState.playerPosition.x === x && gameState.playerPosition.y === y) {
          cellElement.classList.add('cell-player');
        }
        
        elements.gameBoard.appendChild(cellElement);
      }
    }
  }

  // Update UI elements based on game state
  function updateUI() {
    // Update move counter
    elements.moveCounter.textContent = `Moves: ${gameState.moveCount}`;
    
    // Update position display
    elements.positionDisplay.textContent = `X: ${gameState.playerPosition.x}, Y: ${gameState.playerPosition.y}`;
    
    // Update status display
    const atExit = isAtExit(gameState.playerPosition, gameState.exitPosition);
    if (atExit) {
      elements.statusDisplay.textContent = 'At Exit!';
    } else {
      elements.statusDisplay.textContent = 'Navigating';
    }
    
    // Update button states
    elements.startGameBtn.disabled = gameState.gameStarted;
    elements.resetGameBtn.disabled = !gameState.gameStarted;
    
    // Update direction buttons
    const directionBtns = [elements.upBtn, elements.downBtn, elements.leftBtn, elements.rightBtn];
    directionBtns.forEach(btn => {
      btn.disabled = !gameState.gameStarted;
    });
    
    // Update verification buttons
    elements.verifyBtn.disabled = !gameState.gameStarted || !atExit || 
                                 gameState.verificationState === 'proving' || 
                                 gameState.verificationState === 'success';
    
    elements.resetVerifyBtn.disabled = !gameState.gameStarted || 
                                       gameState.verificationState === 'initial' || 
                                       gameState.verificationState === 'proving';
  }

  // Initialize the game
  initGame();
});