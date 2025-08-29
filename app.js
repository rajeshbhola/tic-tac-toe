// Tic Tac Toe Game JavaScript

class TicTacToe {
    constructor() {
        this.gameConfig = {
            boardSize: 3,
            winConditions: [
                // Rows
                { cells: [[0,0],[0,1],[0,2]], type: 'row', index: 0 },
                { cells: [[1,0],[1,1],[1,2]], type: 'row', index: 1 },
                { cells: [[2,0],[2,1],[2,2]], type: 'row', index: 2 },
                // Columns  
                { cells: [[0,0],[1,0],[2,0]], type: 'col', index: 0 },
                { cells: [[0,1],[1,1],[2,1]], type: 'col', index: 1 },
                { cells: [[0,2],[1,2],[2,2]], type: 'col', index: 2 },
                // Diagonals
                { cells: [[0,0],[1,1],[2,2]], type: 'diag', index: 0 },
                { cells: [[0,2],[1,1],[2,0]], type: 'diag', index: 1 }
            ],
            players: {
                human: "X",
                ai: "O"
            }
        };

        this.gameState = {
            board: Array(9).fill(''),
            currentPlayer: 'X',
            gameMode: 'pvp', // 'pvp' or 'ai'
            isGameActive: true,
            isAiThinking: false,
            winningCondition: null,
            scores: {
                X: 0,
                O: 0,
                draws: 0
            }
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.updateScoreboard();
    }

    bindEvents() {
        // Mode selection
        document.getElementById('pvpBtn').addEventListener('click', () => this.setGameMode('pvp'));
        document.getElementById('aiBtn').addEventListener('click', () => this.setGameMode('ai'));

        // Game board cells
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleCellClick(index);
            });
        });

        // Control buttons
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('resetScoreBtn').addEventListener('click', () => this.resetScore());

        // Modal buttons
        document.getElementById('playAgainBtn').addEventListener('click', () => this.playAgain());
        document.getElementById('modalOverlay').addEventListener('click', () => this.closeModal());

        // Prevent context menu on long press for mobile
        document.addEventListener('contextmenu', (e) => {
            if (e.target.classList.contains('cell')) {
                e.preventDefault();
            }
        });
    }

    setGameMode(mode) {
        this.gameState.gameMode = mode;
        
        // Update UI
        const pvpBtn = document.getElementById('pvpBtn');
        const aiBtn = document.getElementById('aiBtn');
        const playerOLabel = document.getElementById('playerOLabel');

        if (mode === 'pvp') {
            pvpBtn.classList.add('active');
            pvpBtn.classList.remove('btn--outline');
            pvpBtn.classList.add('btn--primary');
            
            aiBtn.classList.remove('active');
            aiBtn.classList.add('btn--outline');
            aiBtn.classList.remove('btn--primary');
            
            playerOLabel.textContent = 'Player O';
        } else {
            aiBtn.classList.add('active');
            aiBtn.classList.remove('btn--outline');
            aiBtn.classList.add('btn--primary');
            
            pvpBtn.classList.remove('active');
            pvpBtn.classList.add('btn--outline');
            pvpBtn.classList.remove('btn--primary');
            
            playerOLabel.textContent = 'AI';
        }

        this.newGame();
    }

    handleCellClick(index) {
        if (!this.gameState.isGameActive || 
            this.gameState.board[index] !== '' || 
            this.gameState.isAiThinking) {
            return;
        }

        this.makeMove(index, this.gameState.currentPlayer);
    }

    makeMove(index, player) {
        this.gameState.board[index] = player;
        this.updateCell(index, player);
        
        const winner = this.checkWinner();
        if (winner) {
            this.handleGameEnd(winner);
            return;
        }

        if (this.isBoardFull()) {
            this.handleGameEnd('draw');
            return;
        }

        this.switchPlayer();

        // AI turn - use setTimeout to ensure proper turn handling
        if (this.gameState.gameMode === 'ai' && 
            this.gameState.currentPlayer === 'O' && 
            this.gameState.isGameActive &&
            !this.gameState.isAiThinking) {
            
            setTimeout(() => {
                this.handleAIMove();
            }, 500);
        }
    }

    handleAIMove() {
        if (!this.gameState.isGameActive || this.gameState.isAiThinking) {
            return;
        }

        this.gameState.isAiThinking = true;
        document.getElementById('gameMessage').textContent = 'AI is thinking...';

        // AI move with delay for better UX
        setTimeout(() => {
            const bestMove = this.getBestMove();
            if (bestMove !== -1 && this.gameState.isGameActive) {
                this.makeMove(bestMove, 'O');
            }
            
            this.gameState.isAiThinking = false;
            if (this.gameState.isGameActive) {
                document.getElementById('gameMessage').textContent = 'Your turn!';
            }
        }, 800);
    }

    getBestMove() {
        // First, check if AI can win
        for (let i = 0; i < 9; i++) {
            if (this.gameState.board[i] === '') {
                this.gameState.board[i] = 'O';
                if (this.checkWinnerForBoard(this.gameState.board) === 'O') {
                    this.gameState.board[i] = '';
                    return i;
                }
                this.gameState.board[i] = '';
            }
        }

        // Then, check if AI needs to block player from winning
        for (let i = 0; i < 9; i++) {
            if (this.gameState.board[i] === '') {
                this.gameState.board[i] = 'X';
                if (this.checkWinnerForBoard(this.gameState.board) === 'X') {
                    this.gameState.board[i] = '';
                    return i;
                }
                this.gameState.board[i] = '';
            }
        }

        // Use minimax for optimal play
        let bestScore = -Infinity;
        let bestMove = -1;

        for (let i = 0; i < 9; i++) {
            if (this.gameState.board[i] === '') {
                this.gameState.board[i] = 'O';
                const score = this.minimax(this.gameState.board, 0, false);
                this.gameState.board[i] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinnerForBoard(board);
        
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (this.isBoardFullForBoard(board)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    checkWinner() {
        const result = this.checkWinnerForBoard(this.gameState.board);
        if (result) {
            this.gameState.winningCondition = this.getWinningCondition();
        }
        return result;
    }

    checkWinnerForBoard(board) {
        for (const condition of this.gameConfig.winConditions) {
            const [a, b, c] = condition.cells.map(([row, col]) => row * 3 + col);
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    getWinningCondition() {
        for (const condition of this.gameConfig.winConditions) {
            const [a, b, c] = condition.cells.map(([row, col]) => row * 3 + col);
            const board = this.gameState.board;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return condition;
            }
        }
        return null;
    }

    isBoardFull() {
        return this.isBoardFullForBoard(this.gameState.board);
    }

    isBoardFullForBoard(board) {
        return board.every(cell => cell !== '');
    }

    switchPlayer() {
        this.gameState.currentPlayer = this.gameState.currentPlayer === 'X' ? 'O' : 'X';
        this.updateCurrentPlayerDisplay();
    }

    updateCell(index, player) {
        const cell = document.querySelector(`[data-cell="${index}"]`);
        cell.textContent = player;
        cell.classList.add('occupied');
        cell.classList.add(player === 'X' ? 'player-x' : 'player-o');
        
        // Add animation
        cell.style.transform = 'scale(0.8)';
        setTimeout(() => {
            cell.style.transform = 'scale(1)';
        }, 100);
    }

    updateCurrentPlayerDisplay() {
        const currentPlayerEl = document.getElementById('currentPlayer');
        currentPlayerEl.textContent = this.gameState.currentPlayer;
        currentPlayerEl.classList.toggle('player-o', this.gameState.currentPlayer === 'O');
    }

    updateUI() {
        this.updateCurrentPlayerDisplay();
        document.getElementById('gameMessage').textContent = 'Make your move!';
    }

    handleGameEnd(result) {
        this.gameState.isGameActive = false;
        this.gameState.isAiThinking = false;
        
        if (result === 'draw') {
            this.gameState.scores.draws++;
            this.showGameOverModal('It\'s a Draw!', 'Good game! Try again?', 'draw');
        } else {
            this.gameState.scores[result]++;
            this.highlightWinningCells(result);
            
            let message, subtitle, modalType;
            if (this.gameState.gameMode === 'ai') {
                if (result === 'X') {
                    message = 'Congrats! You Won!';
                    subtitle = 'Great job beating the AI!';
                    modalType = 'win';
                } else {
                    message = 'AI Won!';
                    subtitle = 'Better luck next time!';
                    modalType = 'lose';
                }
            } else {
                message = `Congrats! Player ${result} Won!`;
                subtitle = 'Excellent game!';
                modalType = result === 'X' ? 'win' : 'lose';
            }
            
            this.showGameOverModal(message, subtitle, modalType);
        }
        
        this.updateScoreboard();
    }

    highlightWinningCells(winner) {
        if (this.gameState.winningCondition) {
            const condition = this.gameState.winningCondition;
            const cellIndices = condition.cells.map(([row, col]) => row * 3 + col);
            
            cellIndices.forEach(index => {
                const cell = document.querySelector(`[data-cell="${index}"]`);
                cell.classList.add('winner');
            });
            
            this.drawWinningLine(condition);
        }
    }

    drawWinningLine(condition) {
        const winningLine = document.getElementById('winningLine');
        const gameBoard = document.getElementById('gameBoard');
        
        const cellSize = 80;
        const gap = 8;
        const padding = 16;
        
        const [startCell, endCell] = [condition.cells[0], condition.cells[2]];
        
        const startX = padding + startCell[1] * (cellSize + gap) + cellSize / 2;
        const startY = padding + startCell[0] * (cellSize + gap) + cellSize / 2;
        const endX = padding + endCell[1] * (cellSize + gap) + cellSize / 2;
        const endY = padding + endCell[0] * (cellSize + gap) + cellSize / 2;
        
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        winningLine.style.width = `${length}px`;
        winningLine.style.height = '4px';
        winningLine.style.left = `${startX}px`;
        winningLine.style.top = `${startY - 2}px`;
        winningLine.style.transform = `rotate(${angle}deg)`;
        winningLine.style.transformOrigin = '0 50%';
        winningLine.classList.add('show');
    }

    showGameOverModal(title, message, type = 'default') {
        const modal = document.getElementById('gameOverModal');
        const modalContent = document.getElementById('modalContent');
        
        // Remove existing modal type classes
        modalContent.classList.remove('win-modal', 'lose-modal', 'draw-modal', 'default-modal');
        
        // Add appropriate class based on type
        switch(type) {
            case 'win':
                modalContent.classList.add('win-modal');
                break;
            case 'lose':
                modalContent.classList.add('lose-modal');
                break;
            case 'draw':
                modalContent.classList.add('draw-modal');
                break;
            default:
                modalContent.classList.add('default-modal');
        }
        
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('gameOverModal').classList.add('hidden');
    }

    updateScoreboard() {
        document.getElementById('scoreX').textContent = this.gameState.scores.X;
        document.getElementById('scoreO').textContent = this.gameState.scores.O;
        document.getElementById('scoreDraw').textContent = this.gameState.scores.draws;
    }

    newGame() {
        this.gameState.board = Array(9).fill('');
        this.gameState.currentPlayer = 'X';
        this.gameState.isGameActive = true;
        this.gameState.isAiThinking = false;
        this.gameState.winningCondition = null;
        
        // Clear board UI
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('occupied', 'player-x', 'player-o', 'winner');
            cell.style.transform = '';
        });
        
        // Hide winning line
        const winningLine = document.getElementById('winningLine');
        winningLine.classList.remove('show');
        
        this.updateUI();
        this.closeModal();
    }

    playAgain() {
        this.newGame();
    }

    resetScore() {
        this.gameState.scores = {
            X: 0,
            O: 0,
            draws: 0
        };
        this.updateScoreboard();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});

// Prevent zoom on double tap for iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Add visual feedback for touch events
document.addEventListener('touchstart', function(e) {
    if (e.target.classList.contains('cell') && !e.target.classList.contains('occupied')) {
        e.target.style.transform = 'scale(0.95)';
    }
});

document.addEventListener('touchend', function(e) {
    if (e.target.classList.contains('cell')) {
        setTimeout(() => {
            if (!e.target.style.transform.includes('scale(0.8)')) {
                e.target.style.transform = '';
            }
        }, 100);
    }
});