document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos ---
    const gameContainer = document.getElementById('game-container');
    const hedgehog = document.getElementById('hedgehog');
    const messageDisplay = document.getElementById('message-display');
    const progressBar = document.getElementById('progress-bar');
    const scoreValue = document.getElementById('score-value');
    const highscoreValue = document.getElementById('highscore-value');
    const muteButton = document.getElementById('mute-button');
    const sounds = {
        music: document.getElementById('music-bg'),
        jump: document.getElementById('sound-jump'),
        collect: document.getElementById('sound-collect'),
        gameover: document.getElementById('sound-gameover'),
    };

    // --- Configurações e Estado do Jogo ---
    let isGameRunning = false, isJumping = false, isMuted = true;
    let score = 0, highScore = 0;
    const goalScore = 200; // Pontuação para "vencer"
    let hedgehogBottom = 24; // Posição inicial no chão
    let verticalVelocity = 0;
    const gravity = 0.9;
    const jumpStrength = 20;
    let gameSpeed = 5;
    let frameCounter = 0;
    let spawnTimer = 0;
    let gameLoopInterval;

    // --- Funções de Áudio ---
    function playSound(sound) {
        if (!isMuted && sounds[sound]) {
            sounds[sound].currentTime = 0;
            sounds[sound].play();
        }
    }
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? '🔇' : '🔊';
        if (isMuted) {
            sounds.music.pause();
        } else if (isGameRunning) {
            sounds.music.play();
        }
    });

    // --- Funções de Pontuação ---
    function loadHighScore() {
        highScore = localStorage.getItem('hedgehogHighScore') || 0;
        highscoreValue.textContent = highScore;
    }
    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('hedgehogHighScore', highScore);
            highscoreValue.textContent = highScore;
        }
    }

    // --- Loop Principal do Jogo ---
    function gameLoop() {
        frameCounter++;
        if (!isJumping && frameCounter % 10 === 0) {
            hedgehog.classList.toggle('run-frame-1');
            hedgehog.classList.toggle('run-frame-2');
        }
        handleJump();
        handleItems();
        spawnTimer++;
        if (spawnTimer > (120 / (gameSpeed / 5))) {
            spawnItem();
            spawnTimer = 0;
        }
    }

    // --- Lógicas de Gameplay ---
    function handleJump() {
        if (!isJumping) return;
        hedgehogBottom += verticalVelocity;
        verticalVelocity -= gravity;
        if (hedgehogBottom <= 24) {
            hedgehogBottom = 24;
            isJumping = false;
            hedgehog.classList.remove('jump-frame');
        }
        hedgehog.style.bottom = hedgehogBottom + 'px';
    }

    function createParticle(x, y) {
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${x + (Math.random() - 0.5) * 20}px`;
            particle.style.top = `${y + (Math.random() - 0.5) * 20}px`;
            gameContainer.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
    }

    function spawnItem() {
        const itemDiv = document.createElement("div");
        itemDiv.className = 'item';
        const random = Math.random();
        if (random < 0.5) itemDiv.classList.add("tool");
        else if (random < 0.8) itemDiv.classList.add("code");
        else itemDiv.classList.add("bug");
        
        itemDiv.style.left = gameContainer.offsetWidth + "px";
        gameContainer.appendChild(itemDiv);
    }

    function handleItems() {
        document.querySelectorAll(".item").forEach(item => {
            let itemLeft = item.offsetLeft;
            itemLeft -= gameSpeed;
            item.style.left = itemLeft + "px";

            if (itemLeft < -50) item.remove();

            const hedgehogRect = hedgehog.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();

            if (hedgehogRect.left < itemRect.right && hedgehogRect.right > itemRect.left && hedgehogRect.top < itemRect.bottom && hedgehogRect.bottom > itemRect.top) {
                if (item.classList.contains('bug')) {
                    endGame("Ops, um bug!");
                } else {
                    updateScore(10);
                    createParticle(itemRect.left, itemRect.top);
                    playSound('collect');
                    item.remove();
                }
            }
        });
    }

    function updateScore(points) {
        score += points;
        scoreValue.textContent = score;
        const progress = Math.min(score / goalScore * 100, 100);
        progressBar.style.width = progress + "%";
        if (score >= goalScore) {
            endGame("Construção Concluída!");
        }
    }

    // --- Controle do Jogo (Início, Fim, Comandos) ---
    function control(e) {
        if (e.code === 'Space' || e.type === 'touchstart') {
            e.preventDefault();
            if (!isGameRunning) startGame();
            else if (!isJumping) {
                isJumping = true;
                verticalVelocity = jumpStrength;
                hedgehog.classList.add('jump-frame');
                hedgehog.classList.remove('run-frame-1', 'run-frame-2');
                playSound('jump');
            }
        }
    }

    function startGame() {
        isGameRunning = true;
        score = 0;
        gameSpeed = 5;
        hedgehog.classList.remove('crashed');
        document.querySelectorAll('.item').forEach(item => item.remove());
        messageDisplay.style.display = 'none';
        updateScore(0);
        if (!isMuted) sounds.music.play();
        gameLoopInterval = setInterval(gameLoop, 20);
    }

    function endGame(message) {
        isGameRunning = false;
        clearInterval(gameLoopInterval);
        hedgehog.classList.add('crashed');
        saveHighScore();
        messageDisplay.innerHTML = `${message} <span>Pressione ESPAÇO para reiniciar</span>`;
        messageDisplay.style.display = 'block';
        sounds.music.pause();
        sounds.music.currentTime = 0;
        playSound('gameover');
    }

    // --- Inicialização ---
    loadHighScore();
    gameContainer.addEventListener('keydown', control);
    gameContainer.addEventListener('touchstart', control);
    gameContainer.focus(); // Foca no jogo ao carregar
});
