const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const board = [];
const boardElement = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');
const nextPieceContainer = document.getElementById('next-piece-container'); 
const currentTimeElement = document.getElementById('current-time'); 
const encryptedBackgroundElement = document.querySelector('.encrypted-background'); 
const floatingLogoElement = document.getElementById('floating-logo'); 
const gameModal = document.getElementById('game-modal');
const modalScoreElement = document.getElementById('modal-score');

let score = 0;
let gameLoopInterval = null;
let isPaused = true; 
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

nextPiece = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];


// ====================================
// 🎧 AUDIO SETUP (TONE.JS)
// ====================================

// 1. Move/Rotate Sound (Beep frekuensi tinggi yang cepat)
const moveSynth = new Tone.MembraneSynth({
    pitchDecay: 0.005,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.1, sustain: 0.0, release: 0.01 }
}).toDestination();

// 2. Lock Sound (Blip nada rendah saat balok mendarat)
const lockSynth = new Tone.PluckSynth({
    attackNoise: 1, dampening: 2000, resonance: 0.7
}).toDestination();

// 3. Line Clear Sound (Chord naik seperti sinyal decryption success)
const clearSynth = new Tone.PolySynth(Tone.AMSynth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.05, release: 0.2 }
}).toDestination();

// 4. Start/Restart Sound (Konfirmasi)
const startSynth = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.01, decay: 0.05, sustain: 0.0, release: 0.1 }
}).toDestination();

// 5. Game Over Sound (Dramatis, Noise Descending)
const gameOverSynth = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.001, decay: 0.7, sustain: 0.0, release: 1.5 }
}).toDestination();


// FUNGSI AUDIO KHUSUS

function initializeAudioContext() {
    // Memastikan Tone.js dimulai setelah interaksi pengguna (klik tombol)
    if (Tone.context.state !== 'running') {
        Tone.start();
    }
}

function playMoveSound() {
    if (Tone.context.state !== 'running') return;
    moveSynth.triggerAttackRelease("C5", "32n"); // Suara gerakan/rotasi
}

function playLockSound() {
    if (Tone.context.state !== 'running') return;
    lockSynth.triggerAttackRelease("C2", "8n"); // Suara balok mendarat
}

function playClearSound(linesCleared) {
    if (Tone.context.state !== 'running') return;
    const baseNote = "G4";
    // Notes naik: G4, C5, E5, G5
    const notes = [baseNote, "C5", "E5", "G5"]; 
    const finalNote = notes[linesCleared - 1] || "G5";
    clearSynth.triggerAttackRelease([baseNote, finalNote], "4n"); // Chord sukses
}

function playStartSound() {
    if (Tone.context.state !== 'running') return;
    startSynth.triggerAttackRelease("G5", "16n"); // Suara game start
}

function playGameOverSound() {
    if (Tone.context.state !== 'running') return;
    // 1. Noise yang panjang
    gameOverSynth.triggerAttackRelease("1n");
    // 2. Nada descending yang pendek
    const notes = ["C3", "G2", "C2"];
    clearSynth.triggerAttackRelease(notes, "2n", Tone.now(), 0.5); 
}

// ====================================
// FUNGSI UTAMA UI & ANIMASI
// ====================================

function showModal(title, message, finalScore) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').innerHTML = message.replace('0', `<span id="modal-score">${finalScore}</span>`);
    gameModal.classList.remove('hidden');
}

function closeModal() {
    gameModal.classList.add('hidden');
    // Jika modal ditutup setelah game over, kita restart game
    if (startButton.textContent === 'RESTART GAME') {
        startGame();
    }
}
window.closeModal = closeModal; 

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    if (currentTimeElement) {
        currentTimeElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

function triggerScoreGlitch() {
    scoreElement.classList.add('glitch-active');
    setTimeout(() => {
        scoreElement.classList.remove('glitch-active');
    }, 200); 
}

// Animasi Latar Belakang (Kode identik dengan file sebelumnya)
function createRandomBackgroundCharacters() {
    if (!encryptedBackgroundElement) return;
    clearInterval(window.flickerInterval); 
    encryptedBackgroundElement.querySelectorAll('.flickering-char').forEach(char => char.remove());

    const characters = "0123456789ABCDEF "; 
    const numCharacters = 500; 
    const charSize = 20; 
    const now = Date.now();

    for (let i = 0; i < numCharacters; i++) {
        const span = document.createElement('span');
        span.textContent = characters[Math.floor(Math.random() * characters.length)]; 
        span.classList.add('flickering-char'); 
        span.style.left = `${Math.random() * window.innerWidth}px`;
        span.style.top = `${Math.random() * window.innerHeight}px`;
        span.style.fontSize = `${charSize + Math.random() * 5}px`; 
        
        const delay = Math.random() * 5000; 
        span.dataset.flickerTime = now + delay + (Math.random() * 1000 + 500); 
        span.dataset.hideTime = parseFloat(span.dataset.flickerTime) + (Math.random() * 1000 + 500); 

        encryptedBackgroundElement.appendChild(span);
    }
    window.flickerInterval = setInterval(animateFlickerTeleport, 50); 
}

function animateFlickerTeleport() {
    const chars = encryptedBackgroundElement.querySelectorAll('.flickering-char');
    const now = Date.now();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    chars.forEach(span => {
        const flickerTime = parseFloat(span.dataset.flickerTime);
        const hideTime = parseFloat(span.dataset.hideTime);
        
        if (now < flickerTime) {
             span.style.opacity = 0; 
        } else if (now < hideTime) {
            span.style.opacity = (Math.random() > 0.3) ? 1 : 0.5; 
        } else {
            span.style.left = `${Math.random() * viewportWidth}px`;
            span.style.top = `${Math.random() * viewportHeight}px`;
            const characters = "0123456789ABCDEF ";
            span.textContent = characters[Math.floor(Math.random() * characters.length)]; 

            const cycleDuration = Math.random() * 2000 + 1000; 
            span.dataset.flickerTime = now + (Math.random() * cycleDuration); 
            span.dataset.hideTime = parseFloat(span.dataset.flickerTime) + (Math.random() * 1500 + 500); 
        }
    });
}

let logoNextUpdate = Date.now(); 

function setRandomLogoTarget() {
    if (!floatingLogoElement) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const margin = 150;
    const targetX = Math.random() * (viewportWidth - 2 * margin) + margin;
    const targetY = Math.random() * (viewportHeight - 2 * margin) + margin;
    
    const duration = Math.random() * 10 + 10; 
    
    floatingLogoElement.style.transitionDuration = `${duration}s`;
    floatingLogoElement.style.left = `${targetX}px`;
    floatingLogoElement.style.top = `${targetY}px`;
    
    logoNextUpdate = Date.now() + (duration * 1000);
}

function animateFloatingLogoLoop() {
    if (!floatingLogoElement) return;
    if (Date.now() >= logoNextUpdate) {
        setRandomLogoTarget();
    }
    requestAnimationFrame(animateFloatingLogoLoop);
}
// ---------------------------------------------------

// ====================================
// FUNGSI GAME LOGIC
// ====================================

function initBoard() {
    boardElement.innerHTML = '';
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = Array(BOARD_WIDTH).fill(0);
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            boardElement.appendChild(cell);
        }
    }
    nextPieceContainer.innerHTML = '';
    for(let i = 0; i < 16; i++) { 
        const cell = document.createElement('div');
        cell.classList.add('next-cell');
        nextPieceContainer.appendChild(cell);
    }
}

function spawnPiece() {
    currentPiece = nextPiece; 
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

function drawNextPiece() {
    nextPieceContainer.querySelectorAll('.next-cell').forEach(cell => cell.classList.remove('next-block'));

    for (let y = 0; y < nextPiece.length; y++) {
        for (let x = 0; x < nextPiece[y].length; x++) {
            if (nextPiece[y][x]) {
                const index = y * 4 + x; 
                if (nextPieceContainer.children[index]) {
                    nextPieceContainer.children[index].classList.add('next-block');
                }
            }
        }
    }
}

function draw() {
    boardElement.querySelectorAll('.cell').forEach(cell => cell.classList.remove('block'));

    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const index = y * BOARD_WIDTH + x;
            if (board[y][x] === 1) {
                boardElement.children[index].classList.add('block');
            }
        }
    }

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
    playLockSound(); 
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
        triggerScoreGlitch();
        playClearSound(linesCleared); 
    }
}

function movePiece(dx, dy) {
    if (!checkCollision(dx, dy)) {
        currentX += dx;
        currentY += dy;
        draw();
        
        // Memainkan suara hanya saat input pengguna, bukan drop otomatis
        if (dx !== 0 || dy !== 1) {
             playMoveSound(); 
        }
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
    const originalPiece = currentPiece;
    const newPiece = originalPiece[0].map((_, colIndex) => originalPiece.map(row => row[colIndex]).reverse());

    if (!checkCollision(0, 0, newPiece)) {
        currentPiece = newPiece;
        draw();
        playMoveSound(); 
    }
}

function gameOver() {
    playGameOverSound(); 
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    isPaused = true;
    startButton.textContent = 'RESTART GAME';
    // Menampilkan modal game over
    showModal('GAME OVER', `Data Stream Corrupted. Final Score: 0`, score);
}

function togglePause() {
    if (gameLoopInterval) {
        clearInterval(gameLoopInterval);
        gameLoopInterval = null; 
        isPaused = true;
        startButton.textContent = 'RESUME';
    } else if (isPaused && startButton.textContent === 'RESUME') {
        gameLoopInterval = setInterval(dropPiece, 1000);
        isPaused = false;
        startButton.textContent = 'PAUSE';
    }
}

function startGame() {
    // Memulai audio context saat interaksi pengguna (klik tombol)
    initializeAudioContext();
    playStartSound(); 

    // Tutup modal jika masih terbuka
    gameModal.classList.add('hidden');
    
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

// ====================================
// EVENT LISTENERS
// ====================================

startButton.addEventListener('click', () => {
    if (startButton.textContent === 'START GAME' || startButton.textContent === 'RESTART GAME') {
        startGame();
    } else if (startButton.textContent === 'PAUSE' || startButton.textContent === 'RESUME') {
        togglePause();
    }
});

document.addEventListener('keydown', (e) => {
    // Menutup modal jika tombol apa pun ditekan saat game over
    if (!gameModal.classList.contains('hidden')) {
        closeModal();
        return; 
    }
    
    if (!gameLoopInterval || isPaused) return; 
    
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
            // Fast drop: mereset interval agar drop otomatis tidak terlalu cepat
            if (movePiece(0, 1)) {
                 clearInterval(gameLoopInterval);
                 gameLoopInterval = setInterval(dropPiece, 1000); 
            }
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case 'Escape':
            togglePause();
            break;
    }
});

// --- Inisialisasi Awal ---
initBoard();
drawNextPiece();
setInterval(updateClock, 1000); 
updateClock(); 

// Panggil fungsi background acak saat dimuat
createRandomBackgroundCharacters();
window.addEventListener('resize', createRandomBackgroundCharacters);

// Mulai animasi logo yang bergerak halus
if (floatingLogoElement) {
    floatingLogoElement.style.left = `${window.innerWidth / 2}px`;
    floatingLogoElement.style.top = `${window.innerHeight / 2}px`;
    setRandomLogoTarget(); 
    animateFloatingLogoLoop(); 
}