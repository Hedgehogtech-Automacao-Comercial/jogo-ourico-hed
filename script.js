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
    
    // CORREÇÃO: Variável para controlar se os controles do jogo estão ativos
    let gameControlsActive = true;

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
        modal.innerHTML = '<h2>Enviando pontuação...</h2>';
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
            modal.innerHTML = `<h2>Erro ao enviar.</h2><button id="close-error-btn">Ok</button>`;
            document.getElementById('close-error-btn').addEventListener('click', () => {
                formContainer.style.display = 'none';
                messageDisplay.style.display = 'block';
                messageDisplay.innerHTML = `Pontuação final: ${score} <span>Pressione ESPAÇO para reiniciar</span>`;
                gameControlsActive = true; // Reativa os controles
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
    
    // --- Loop Principal e Lógicas de Gameplay ---
    // (Nenhuma mudança necessária no gameLoop, handleJump, createExplosion, handleItems, updateScore, updateBoost, triggerAttack)
    function gameLoop(){if(!isGameRunning)return;gameSpeed+=.003;frameCounter++;!isJumping&&!isAttacking&&frameCounter%10===0&&hedgehog.classList.toggle("run-frame-1");handleJump();handleItems();spawnTimer++;if(spawnTimer>=spawnInterval){spawnItem();spawnTimer=0;spawnInterval>40&&(spawnInterval*=.99)}}
    function handleJump(){if(isJumping){isJumpKeyDown&&jumpTimeCounter<maxJumpTime?(verticalVelocity+=.35,jumpTimeCounter++):void 0;hedgehogBottom+=verticalVelocity;verticalVelocity-=gravity;if(hedgehogBottom<=24){hedgehogBottom=24;isJumping=false;hedgehog.classList.remove("jump-frame")}hedgehog.style.bottom=hedgehogBottom+"px"}}
    function createExplosion(e,t){const o=document.createElement("div");o.className="explosion",o.style.left=`${e-32}px`,o.style.top=`${t-32}px`,gameContainer.appendChild(o),setTimeout(()=>{o.remove()},500)}
    function spawnItem(){const e=document.createElement("div");e.className="item";const t=Math.random();t<.5?e.classList.add("tool"):t<.8?e.classList.add("code"):e.classList.add("bug"),e.style.left=gameContainer.offsetWidth+"px",gameContainer.appendChild(e)}
    function handleItems(){document.querySelectorAll(".item").forEach(e=>{let t=e.offsetLeft;t-=gameSpeed,e.style.left=t+"px";if(t<-50)return void e.remove();const o=hedgehog.getBoundingClientRect(),n=e.getBoundingClientRect();o.left<n.right&&o.right>n.left&&o.top<n.bottom&&o.bottom>n.top&&(e.classList.contains("bug")?isAttacking?(createExplosion(n.left,n.top),playSound("explosion"),updateScore(20),e.remove()):endGame("Ops, um bug!"):(updateScore(10),updateBoost(10),playSound("collect"),e.remove()))})}
    function updateScore(e){score+=e,scoreValue.textContent=score}
    function updateBoost(e){if(isBoostReady)return;boostValue=Math.min(boostValue+e,boostMax);const t=(boostValue/boostMax)*100;boostBar.style.backgroundSize=`${t}% 100%`;if(boostValue>=boostMax){isBoostReady=true,boostBarContainer&&boostBarContainer.classList.add("ready"),attackButton&&attackButton.classList.add("ready"),playSound("powerup")}}
    function triggerAttack(){if(!isBoostReady||isAttacking)return;isAttacking=true,isBoostReady=false,boostValue=0,boostBar.style.backgroundSize="0% 100%",boostBarContainer&&boostBarContainer.classList.remove("ready"),attackButton&&attackButton.classList.remove("ready"),hedgehog.classList.remove("run-frame-1","run-frame-2","jump-frame"),hedgehog.classList.add("attack-pose"),playSound("explosion"),setTimeout(()=>{isAttacking=false,hedgehog.classList.remove("attack-pose")},500)}

    // --- Controle do Jogo (Início, Fim, Comandos) ---
    function handleJumpPress() {
        if (!gameControlsActive) return; // CORREÇÃO: Impede o pulo se os controles estiverem inativos

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
        if (e.code === 'KeyS') { if (isGameRunning && gameControlsActive) triggerAttack(); }
    }
    function handleKeyUp(e) { if (e.code === 'Space') { handleJumpRelease(); } }
    
    function startGame() {
        gameControlsActive = true; // CORREÇÃO: Ativa os controles no início do jogo
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
        messageDisplay.style.display = 'none'; // CORREÇÃO: Garante que a mensagem suma
        updateScore(0);
        updateBoost(0);
        if (boostBarContainer) boostBarContainer.classList.remove('ready');
        if (attackButton) attackButton.classList.remove('ready');
        if (!isMuted) {
             sounds.music.currentTime = 0;
             sounds.music.play();
        } else {
             sounds.music.pause(); // CORREÇÃO: Garante que a música não toque se mutada
        }
        gameLoopInterval = setInterval(gameLoop, 20);
    }

    function endGame(message) {
        gameControlsActive = false; // CORREÇÃO: Desativa os controles do jogo (pulo/ataque)
        isGameRunning = false;
        clearInterval(gameLoopInterval);
        hedgehog.classList.add('crashed');
        saveHighScore();
        sounds.music.pause();
        playSound('gameover');

        // CORREÇÃO: Reseta o conteúdo do formulário para o estado original
        const modal = formContainer.querySelector('.modal');
        modal.innerHTML = `
            <h2>Recorde!</h2>
            <p>Sua pontuação: <span id="final-score">${score}</span></p>
            <form id="register-form">
                <input type="text" id="player-name" placeholder="Seu nome" required maxlength="20">
                <input type="email" id="player-email" placeholder="Seu e-mail (opcional)">
                <button type="submit">Enviar Pontuação</button>
            </form>`;
        
        // Re-adiciona o event listener ao novo formulário
        formContainer.querySelector('#register-form').addEventListener('submit', handleFormSubmit);

        finalScoreDisplay.textContent = score;
        formContainer.style.display = 'flex';
        messageDisplay.style.display = 'none';
    }

    // --- Inicialização e Event Listeners ---
    function handleFormSubmit(e) {
        e.preventDefault();
        const playerName = formContainer.querySelector('#player-name').value;
        const playerEmail = formContainer.querySelector('#player-email').value;
        submitScore(playerName, playerEmail, score);
    }

    loadHighScore();
    
    gameContainer.addEventListener('keydown', handleKeyDown);
    gameContainer.addEventListener('keyup', handleKeyUp);
    
    attackButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gameControlsActive) triggerAttack();
    });
    gameContainer.addEventListener('touchstart', (e) => { e.preventDefault(); handleJumpPress(); });
    gameContainer.addEventListener('touchend', (e) => { e.preventDefault(); handleJumpRelease(); });
    
    registerForm.addEventListener('submit', handleFormSubmit);

    restartButton.addEventListener('click', () => {
        leaderboardContainer.style.display = 'none';
        messageDisplay.style.display = 'block'; // Mostra a mensagem inicial de novo
        startGame();
    });

    gameContainer.focus();
});
