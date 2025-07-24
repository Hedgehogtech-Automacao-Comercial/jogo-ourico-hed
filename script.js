document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos ---
    const gameContainer = document.getElementById('game-container');
    const hedgehog = document.getElementById('hedgehog');
    const messageDisplay = document.getElementById('message-display');
    const boostBar = document.getElementById('boost-bar');
    const boostBarContainer = document.getElementById('boost-container'); // Corrigido para pegar o container
    const scoreValue = document.getElementById('score-value');
    const highscoreValue = document.getElementById('highscore-value');
    const muteButton = document.getElementById('mute-button');
    const sounds = {
        music: document.getElementById('music-bg'),
        jump: document.getElementById('sound-jump'),
        collect: document.getElementById('sound-collect'),
        gameover: document.getElementById('sound-gameover'),
        explosion: document.getElementById('sound-explosion'),
        powerup: document.getElementById('sound-powerup')
    };

    // --- Configurações e Estado do Jogo ---
    let isGameRunning = false, isJumping = false, isMuted = true;
    let score = 0, highScore = 0;
    let hedgehogBottom = 24;
    let verticalVelocity = 0;
    const gravity = 0.9;
    const initialJumpStrength = 18;
    let gameSpeed = 5;
    let frameCounter = 0;
    let spawnTimer = 0;
    let gameLoopInterval;
    
    let boostValue = 0;
    const boostMax = 100;
    let isBoostReady = false;
    let isAttacking = false;
    let isJumpKeyDown = false;
    let jumpTimeCounter = 0;
    const maxJumpTime = 15;

    // --- Funções de Áudio ---
    function playSound(sound) {
        if (!isMuted && sounds[sound]) {
            sounds[sound].currentTime = 0;
            sounds[sound].play().catch(e => console.error("Erro ao tocar som:", e));
        }
    }
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        muteButton.textContent = isMuted ? '🔇' : '🔊';
        sounds.music.muted = isMuted;
        if (!isMuted && isGameRunning) {
            sounds.music.play();
        } else {
            sounds.music.pause();
        }
    });

    // --- Funções de Pontuação ---
    function loadHighScore() {
        highScore = localStorage.getItem('hedgehogHighScoreV2') || 0;
        highscoreValue.textContent = highScore;
    }
    function saveHighScore() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('hedgehogHighScoreV2', highScore);
            highscoreValue.textContent = highScore;
        }
    }

    // --- Loop Principal do Jogo ---
    function gameLoop() {
        if (!isGameRunning) return;
        gameSpeed += 0.003;
        frameCounter++;
        if (!isJumping && !isAttacking && frameCounter % 10 === 0) {
            hedgehog.classList.toggle('run-frame-1');
            hedgehog.classList.toggle('run-frame-2');
        }
        handleJump();
        handleItems();
        spawnTimer++;
        
        // CORREÇÃO 2: Diminuído o tempo de espera inicial (de 120 para 90)
        if (spawnTimer > (90 / (gameSpeed / 5))) {
            spawnItem();
            spawnTimer = 0; // Zera o cronômetro após criar um item
        }
    }

    // --- Lógicas de Gameplay ---
    function handleJump() {
        if (isJumping) {
            if (isJumpKeyDown && jumpTimeCounter < maxJumpTime) {
                verticalVelocity += 0.35;
                jumpTimeCounter++;
            }
            hedgehogBottom += verticalVelocity;
            verticalVelocity -= gravity;
            if (hedgehogBottom <= 24) {
                hedgehogBottom = 24;
                isJumping = false;
                hedgehog.classList.remove('jump-frame');
            }
            hedgehog.style.bottom = hedgehogBottom + 'px';
        }
    }

    function createExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${x - 32}px`;
        explosion.style.top = `${y - 32}px`;
        gameContainer.appendChild(explosion);
        setTimeout(() => explosion.remove(), 500);
    }

    function handleItems() {
        document.querySelectorAll(".item").forEach(item => {
            let itemLeft = item.offsetLeft;
            itemLeft -= gameSpeed;
            item.style.left = itemLeft + "px";
            if (itemLeft < -50) {
                item.remove();
                return;
            }
            const hedgehogRect = hedgehog.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();
            if (hedgehogRect.left < itemRect.right && hedgehogRect.right > itemRect.left && hedgehogRect.top < itemRect.bottom && hedgehogRect.bottom > itemRect.top) {
                if (item.classList.contains('bug')) {
                    if (isAttacking) {
                        createExplosion(itemRect.left, itemRect.top);
                        playSound('explosion');
                        updateScore(20);
                        item.remove();
                    } else {
                        endGame("Ops, um bug!");
                    }
                } else {
                    updateScore(10);
                    updateBoost(10);
                    // createParticle(itemRect.left, itemRect.top); // Partículas podem ser reativadas se desejado
                    playSound('collect');
                    item.remove();
                }
            }
        });
    }

    function updateScore(points) {
        score += points;
        scoreValue.textContent = score;
    }

    function updateBoost(value) {
        if (isBoostReady) return;
        boostValue = Math.min(boostValue + value, boostMax);
        const boostPercentage = (boostValue / boostMax) * 100;
        boostBar.style.backgroundSize = `${boostPercentage}% 100%`;
        if (boostValue >= boostMax) {
            isBoostReady = true;
            boostBarContainer.classList.add('ready');
            playSound('powerup');
        }
    }
    
    function triggerAttack() {
        if (!isBoostReady || isAttacking || isJumping) return;
        isAttacking = true;
        isBoostReady = false;
        boostValue = 0;
        boostBar.style.backgroundSize = '0% 100%';
        boostBarContainer.classList.remove('ready');
        hedgehog.classList.add('attack-pose');
        hedgehog.classList.remove('run-frame-1', 'run-frame-2');
        playSound('explosion');
        setTimeout(() => {
            isAttacking = false;
            hedgehog.classList.remove('attack-pose');
        }, 500);
    }

    // --- Controle do Jogo (Início, Fim, Comandos) ---
    function control(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!isGameRunning) startGame();
            else if (!isJumping) {
                isJumping = true;
                isJumpKeyDown = true;
                jumpTimeCounter = 0;
                verticalVelocity = initialJumpStrength;
                hedgehog.classList.add('jump-frame');
                hedgehog.classList.remove('run-frame-1', 'run-frame-2');
                playSound('jump');
            }
        }
        if (e.code === 'KeyS') {
            if (isGameRunning) triggerAttack();
        }
    }
    
    function releaseControl(e) {
        if (e.code === 'Space') {
            isJumpKeyDown = false;
        }
    }

    function startGame() {
        isGameRunning = true;
        score = 0;
        gameSpeed = 5;
        boostValue = 0;
        isBoostReady = false;
        isAttacking = false;
        spawnTimer = 0; // CORREÇÃO 1: Zerando o cronômetro a cada novo jogo
        hedgehog.classList.remove('crashed');
        document.querySelectorAll('.item').forEach(item => item.remove());
        messageDisplay.style.display = 'none';
        updateScore(0);
        updateBoost(0);
        boostBarContainer.classList.remove('ready');
        if (!isMuted) {
             sounds.music.currentTime = 0;
             sounds.music.play();
        }
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
        playSound('gameover');
    }

    // --- Inicialização ---
    loadHighScore();
    gameContainer.addEventListener('keydown', control);
    gameContainer.addEventListener('keyup', releaseControl);
    gameContainer.focus();
});
