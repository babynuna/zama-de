const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const board = [];
const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');
const nextPieceContainer = document.getElementById('next-piece-container'); 

let score = 0;
let gameLoopInterval = null; // Inisialisasi null untuk cek Pause yang lebih baik
let isPaused = false; 
let currentPiece;
let nextPiece; 
let currentX;
let currentY;

// Definisikan Bentuk Tetris
const TETROMINOS = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 0], [0, 1, 1]], // Z
];

// Inisialisasi balok pertama kali
nextPiece = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];

// 1. Inisialisasi Papan Permainan
function initBoard() {
    boardElement.innerHTML = '';
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = Array(BOARD_WIDTH).fill(0); // Inisialisasi array board
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            boardElement.appendChild(cell);
        }
    }
    // Inisialisasi grid Next Piece
    nextPieceContainer.innerHTML = '';
    for(let i = 0; i < 16; i++) { // 4x4 grid
        const cell = document.createElement('div');
        cell.classList.add('next-cell');
        nextPieceContainer.appendChild(cell);
    }
}

// 2. Spawm Balok Baru (Perbaikan: pastikan balok saat ini diisi dari nextPiece)
function spawnPiece() {
    currentPiece = nextPiece; 
    
    // Tentukan balok baru untuk "Next Block"
    nextPiece = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)]; 

    currentX = Math.floor(BOARD_WIDTH / 2) - Math.floor(currentPiece[0].length / 2);
    currentY = 0;

    drawNextPiece(); 

    if (checkCollision(0, 0)) {
        gameOver();
        return false;
    }
    return true;
}

// 3. Gambar Next Block (Perbaikan: Menggunakan 4x4 grid di HTML)
function drawNextPiece() {
    // Bersihkan tampilan next block
    nextPieceContainer.querySelectorAll('.next-cell').forEach(cell => cell.classList.remove('next-block'));

    // Gambar balok berikutnya
    for (let y = 0; y < nextPiece.length; y++) {
        for (let x = 0; x < nextPiece[y].length; x++) {
            if (nextPiece[y][x]) {
                // Posisi di grid 4x4 Next Piece
                const index = y * 4 + x; 
                if (nextPieceContainer.children[index]) {
                    nextPieceContainer.children[index].classList.add('next-block');
                }
            }
        }
    }
}


// 4. Gambar Papan dan Balok (Tidak berubah signifikan)
function draw() {
    // Hapus Balok Lama dari tampilan grid
    boardElement.querySelectorAll('.cell').forEach(cell => cell.classList.remove('block'));

    // Gambar Balok yang Sudah Terkunci (Board)
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const index = y * BOARD_WIDTH + x;
            if (board[y][x] === 1) {
                boardElement.children[index].classList.add('block');
            }
        }
    }

    // Gambar Balok Saat Ini (Current Piece)
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                const boardY = currentY + y;
                const boardX = currentX + x;
                const index = boardY * BOARD_WIDTH + boardX;
                if (index >= 0 && index < boardElement.children.length) {
                    boardElement.children[index].classList.add('block');
                }
            }
        }
    }
}

// 5. Cek Tabrakan (Tidak berubah)
function checkCollision(dx, dy, piece = currentPiece) {
    for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
            if (piece[y][x]) {
                const newY = currentY + y + dy;
                const newX = currentX + x + dx;

                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                if (newY >= 0 && board[newY] && board[newY][newX] === 1) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 6. Kunci Balok & Clear Lines (Tidak berubah signifikan)
function lockPiece() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                const boardY = currentY + y;
                const boardX = currentX + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = 1;
                }
            }
        }
    }
    clearLines();
    if (spawnPiece()) {
        draw();
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (board[y].every(cell => cell === 1)) {
            board.splice(y, 1);
            board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; 
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreElement.textContent = score;
    }
}

// 7. Logika Pergerakan & Drop (Tidak berubah)
function movePiece(dx, dy) {
    if (!checkCollision(dx, dy)) {
        currentX += dx;
        currentY += dy;
        draw();
        return true;
    }
    return false;
}

function dropPiece() {
    if (!movePiece(0, 1)) {
        lockPiece();
    }
}

function rotatePiece() {
    // Logika Rotasi... (tetap sama)
    const originalPiece = currentPiece;
    const newPiece = originalPiece[0].map((_, colIndex) => originalPiece.map(row => row[colIndex]).reverse());

    if (!checkCollision(0, 0, newPiece)) {
        currentPiece = newPiece;
        draw();
    }
}

// 8. Game Over
function gameOver() {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    isPaused = true;
    alert(`Game Over! Final Score: ${score}.`);
    startButton.textContent = 'RESTART GAME';
}

// 9. Fungsi Toggle Pause (Perbaikan: Menggunakan gameLoopInterval untuk cek status)
function togglePause() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null; // Penting: set ke null saat pause
        isPaused = true;
        startButton.textContent = 'RESUME';
    } else if (isPaused && startButton.textContent === 'RESUME') {
        gameLoopInterval = setInterval(dropPiece, 1000);
        isPaused = false;
        startButton.textContent = 'PAUSE';
    }
}

// 10. Fungsi Mulai Game
function startGame() {
    score = 0;
    scoreElement.textContent = score;
    initBoard();
    if (spawnPiece()) {
        draw();
        gameLoopInterval = setInterval(dropPiece, 1000);
        isPaused = false;
        startButton.textContent = 'PAUSE';
    }
}

// 11. Event Listener Tombol Start
startButton.addEventListener('click', () => {
    if (startButton.textContent === 'START GAME' || startButton.textContent === 'RESTART GAME') {
        startGame();
    } else if (startButton.textContent === 'PAUSE' || startButton.textContent === 'RESUME') {
        togglePause();
    }
});

// 12. Kontrol Keyboard (Mengizinkan pergerakan hanya saat game aktif dan tidak di-pause)
document.addEventListener('keydown', (e) => {
    if (!gameLoopInterval || isPaused) return; 
    
    // Cegah scroll saat tekan panah
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            dropPiece();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'Escape': // Gunakan Escape untuk pause cepat
            togglePause();
            break;
    }
});

// --- Inisialisasi Awal ---
initBoard();
drawNextPiece();