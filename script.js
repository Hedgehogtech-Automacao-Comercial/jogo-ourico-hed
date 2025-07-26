document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos ---
    const gameContainer = document.getElementById('game-container');
    const hedgehog = document.getElementById('hedgehog');
    const messageDisplay = document.getElementById('message-display');
    const boostBar = document.getElementById('boost-bar');
    const boostBarContainer = document.getElementById('boost-container');
    const scoreValue = document.getElementById('score-value');
    const highscoreValue = document.getElementById('highscore-value');
    const muteButton = document.getElementById('mute-button');
    const attackButton = document.getElementById('attack-button');
    const formContainer = document.getElementById('form-container');
    const finalScoreDisplay = document.getElementById('final-score');
    const registerForm = document.getElementById('register-form');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const leaderboardList = document.getElementById('leaderboard-list');
    const restartButton = document.getElementById('restart-button');
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
    let spawnInterval = 100;
    
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

    // --- Lógica de Backend ---
    async function submitScore(name, email, score) {
        const modal = formContainer.querySelector('.modal');
        modal.innerHTML = '<h2>Enviando pontuação...</h2>'; // Feedback visual
        try {
            const response = await fetch('/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, score })
            });
            if (!response.ok) {
                throw new Error('Falha ao enviar pontuação');
            }
            await showLeaderboard();
        } catch (error) {
            console.error(error);
            modal.innerHTML = `<h2>Erro ao enviar.</h2> <p>Por favor, tente novamente mais tarde.</p><button id="close-error-btn">Ok</button>`;
            document.getElementById('close-error-btn').addEventListener('click', () => {
                formContainer.style.display = 'none';
                messageDisplay.innerHTML = `Pontuação final: ${score} <span>Pressione ESPAÇO para reiniciar</span>`;
                messageDisplay.style.display = 'block';
            });
        }
    }

    async function showLeaderboard() {
        formContainer.style.display = 'none';
        leaderboardContainer.style.display = 'flex';
        leaderboardList.innerHTML = '<li>Carregando...</li>';

        try {
            const response = await fetch('/api/leaderboard');
            const scores = await response.json();
            
            leaderboardList.innerHTML = '';
            if (scores.length === 0) {
                leaderboardList.innerHTML = '<li>Seja o primeiro a pontuar!</li>';
            } else {
                scores.forEach((player, index) => {
                    const li = document.createElement('li');
                    li.textContent = `#${index + 1} ${player.name} - ${player.score} pontos`;
                    leaderboardList.appendChild(li);
                });
            }
        } catch (error) {
            console.error(error);
            leaderboardList.innerHTML = '<li>Não foi possível carregar o ranking.</li>';
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
        if (spawnTimer >= spawnInterval) {
            spawnItem();
            spawnTimer = 0;
            if (spawnInterval > 40) {
                spawnInterval *= 0.99;
            }
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
            if (boostBarContainer) boostBarContainer.classList.add('ready');
            if (attackButton) attackButton.classList.add('ready');
            playSound('powerup');
        }
    }
    
    function triggerAttack() {
        if (!isBoostReady || isAttacking) return;
        isAttacking = true;
        isBoostReady = false;
        boostValue = 0;
        boostBar.style.backgroundSize = '0% 100%';
        if (boostBarContainer) boostBarContainer.classList.remove('ready');
        if (attackButton) attackButton.classList.remove('ready');
        
        hedgehog.classList.remove('run-frame-1', 'run-frame-2', 'jump-frame');
        hedgehog.classList.add('attack-pose');
        playSound('explosion');
        setTimeout(() => {
            isAttacking = false;
            hedgehog.classList.remove('attack-pose');
        }, 500);
    }

    function handleJumpPress() {
        if (!isGameRunning) {
            startGame();
        } else if (!isJumping) {
            isJumping = true;
            isJumpKeyDown = true;
            jumpTimeCounter = 0;
            verticalVelocity = initialJumpStrength;
            hedgehog.classList.add('jump-frame');
            hedgehog.classList.remove('run-frame-1', 'run-frame-2', 'attack-pose');
            playSound('jump');
        }
    }

    function handleJumpRelease() { isJumpKeyDown = false; }
    
    function handleKeyDown(e) {
        if (e.code === 'Space') { e.preventDefault(); handleJumpPress(); }
        if (e.code === 'KeyS') { if (isGameRunning) triggerAttack(); }
    }
    function handleKeyUp(e) { if (e.code === 'Space') { handleJumpRelease(); } }
    
    function startGame() {
        isGameRunning = true;
        score = 0;
        gameSpeed = 5;
        boostValue = 0;
        isBoostReady = false;
        isAttacking = false;
        spawnTimer = 0;
        spawnInterval = 100;
        hedgehog.classList.remove('crashed', 'attack-pose');
        document.querySelectorAll('.item').forEach(item => item.remove());
        messageDisplay.style.display = 'block';
        messageDisplay.innerHTML = `HED PDV <span>Pressione ESPAÇO para construir</span>`;
        formContainer.style.display = 'none';
        leaderboardContainer.style.display = 'none';
        updateScore(0);
        updateBoost(0);
        if (boostBarContainer) boostBarContainer.classList.remove('ready');
        if (attackButton) attackButton.classList.remove('ready');
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
        sounds.music.pause();
        playSound('gameover');

        finalScoreDisplay.textContent = score;
        formContainer.style.display = 'flex';
        messageDisplay.style.display = 'none';
    }

    // --- Inicialização e Event Listeners ---
    loadHighScore();
    
    // Controles do Teclado
    gameContainer.addEventListener('keydown', handleKeyDown);
    gameContainer.addEventListener('keyup', handleKeyUp);
    
    // Controles de Toque
    attackButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerAttack();
    });
    gameContainer.addEventListener('touchstart', (e) => { e.preventDefault(); handleJumpPress(); });
    gameContainer.addEventListener('touchend', (e) => { e.preventDefault(); handleJumpRelease(); });
    
    // Controles do Formulário e Ranking
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const playerName = document.getElementById('player-name').value;
        const playerEmail = document.getElementById('player-email').value;
        submitScore(playerName, playerEmail, score);
    });

    restartButton.addEventListener('click', () => {
        leaderboardContainer.style.display = 'none';
        startGame();
    });

    gameContainer.focus();
});
