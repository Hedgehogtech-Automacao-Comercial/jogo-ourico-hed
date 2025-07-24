document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos ---
    const gameContainer = document.getElementById('game-container');
    const hedgehog = document.getElementById('hedgehog');
    const messageDisplay = document.getElementById('message-display');
    const boostBar = document.getElementById('boost-bar');
    const boostBarContainer = document.getElementById('boost-container'); // ID correto do container
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
        gameSpeed += 0.003;
        frameCounter++;
        if (!isJumping && !isAttacking && frameCounter % 10 === 0) {
            hedgehog.classList.toggle('run-frame-1');
            hedgehog.classList.toggle('run-frame-2');
        }
        handleJump();
        handleItems();
        spawnTimer++;
        
        let spawnThreshold = 90 / (gameSpeed / 5);

        // DIAGNÓSTICO: Imprime o estado do cronômetro no console a cada frame.
        // console.log(`spawnTimer: ${spawnTimer}, Limite para criar item: ${spawnThreshold.toFixed(2)}`);

        if (spawnTimer > spawnThreshold) {
            spawnItem();
            spawnTimer = 0;
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
            // CORREÇÃO: Usando a referência correta para adicionar a classe 'ready'
            if (boostBarContainer) boostBarContainer.classList.add('ready');
            playSound('powerup');
        }
    }
    
    function triggerAttack() {
        if (!isBoostReady || isAttacking || isJumping) return;
        isAttacking = true;
        isBoostReady = false;
        boostValue = 0;
        boostBar.style.backgroundSize = '0% 100%';
        if (boostBarContainer) boostBarContainer.classList.remove('ready');
        hedgehog.classList.add('attack-pose');
        hedgehog.classList.remove('run-frame-1', 'run-frame-2');
        playSound('explosion');
        setTimeout(() => {
            isAttacking = false;
            hedgehog.classList.remove('attack-pose');
        }, 500);
    }
    
    function spawnItem() {
        // DIAGNÓSTICO: Mensagem que aparecerá no console toda vez que um item for criado.
        console.log("%c--- Item Criado! ---", "color: green; font-weight: bold;");

        const itemDiv = document.createElement("div");
        itemDiv.className = 'item';
        const random = Math.random();
        if (random < 0.5) itemDiv.classList.add("tool");
        else if (random < 0.8) itemDiv.classList.add("code");
        else itemDiv.classList.add("bug");
        
        itemDiv.style.left = gameContainer.offsetWidth + "px";
        gameContainer.appendChild(itemDiv);
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
        // DIAGNÓSTICO: Mensagem que aparecerá no console quando o jogo iniciar.
        console.log("Iniciando novo jogo...");

        isGameRunning = true;
        score = 0;
        gameSpeed = 5;
        boostValue = 0;
        isBoostReady = false;
        isAttacking = false;
        spawnTimer = 0;
        hedgehog.classList.remove('crashed');
        document.querySelectorAll('.item').forEach(item => item.remove());
        messageDisplay.style.display = 'none';
        updateScore(0);
        updateBoost(0);
        if (boostBarContainer) boostBarContainer.classList.remove('ready');
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
