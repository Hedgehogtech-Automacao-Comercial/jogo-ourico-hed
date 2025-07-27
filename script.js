document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos ---
    const gameContainer = document.getElementById('game-container');
    const hedgehog = document.getElementById('hedgehog');
    // ... (resto das referências continua o mesmo)
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
    // ... (resto das variáveis de estado continua o mesmo)
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
    let gameControlsActive = true;

    // --- Funções de Áudio, Pontuação, Backend, Loop, etc ---
    // (Nenhuma mudança em playSound, loadHighScore, saveHighScore, submitScore, showLeaderboard, gameLoop, spawnItem, handleJump, createExplosion, handleItems, updateScore, updateBoost, triggerAttack)
    function playSound(e){if(!isMuted&&sounds[e]){sounds[e].currentTime=0;sounds[e].play().catch(e=>console.error("Erro ao tocar som:",e))}}
    muteButton.addEventListener("click",()=>{isMuted=!isMuted;muteButton.textContent=isMuted?"🔇":"🔊";sounds.music.muted=isMuted;if(!isMuted&&isGameRunning)sounds.music.play();else sounds.music.pause()});function loadHighScore(){highScore=localStorage.getItem("hedgehogHighScoreV2")||0;highscoreValue.textContent=highScore}
    function saveHighScore(){if(score>highScore){highScore=score;localStorage.setItem("hedgehogHighScoreV2",highScore);highscoreValue.textContent=highScore}}async function submitScore(e,t,o){const n=formContainer.querySelector(".modal");n.innerHTML="<h2>Enviando pontuação...</h2>";try{const a=await fetch("/api/submit-score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:e,email:t,score:o})});if(!a.ok)throw new Error("Falha ao enviar pontuação");await showLeaderboard()}catch(r){console.error(r);n.innerHTML=`<h2>Erro ao enviar.</h2><button id="close-error-btn">Ok</button>`;document.getElementById("close-error-btn").addEventListener("click",()=>{formContainer.style.display="none";messageDisplay.innerHTML=`Pontuação final: ${score} <span>Pressione ESPAÇO para reiniciar</span>`;messageDisplay.style.display="block";gameControlsActive=true})}}
    async function showLeaderboard(){formContainer.style.display="none";leaderboardContainer.style.display="flex";leaderboardList.innerHTML="<li>Carregando...</li>";try{const e=await fetch("/api/leaderboard"),t=await e.json();leaderboardList.innerHTML="";if(0===t.length)leaderboardList.innerHTML="<li>Seja o primeiro a pontuar!</li>";else t.forEach((e,t)=>{const o=document.createElement("li");o.textContent=`#${t+1} ${e.name} - ${e.score} pontos`;leaderboardList.appendChild(o)})}catch(o){console.error(o);leaderboardList.innerHTML="<li>Não foi possível carregar o ranking.</li>"}}
    function gameLoop(){if(!isGameRunning)return;gameSpeed+=.003;frameCounter++;!isJumping&&!isAttacking&&frameCounter%10===0&&(hedgehog.classList.contains("run-frame-1")?(hedgehog.classList.remove("run-frame-1"),hedgehog.classList.add("run-frame-2")):(hedgehog.classList.remove("run-frame-2"),hedgehog.classList.add("run-frame-1")));handleJump();handleItems();spawnTimer++;if(spawnTimer>=spawnInterval){spawnItem();spawnTimer=0;spawnInterval>40&&(spawnInterval*=.99)}}
    function spawnItem(){const e=document.createElement("div");e.className="item";const t=Math.random();t<.5?e.classList.add("tool"):t<.8?e.classList.add("code"):e.classList.add("bug"),e.style.left=gameContainer.offsetWidth+"px",gameContainer.appendChild(e)}
    function handleJump(){if(isJumping){isJumpKeyDown&&jumpTimeCounter<maxJumpTime?(verticalVelocity+=.35,jumpTimeCounter++):void 0;hedgehogBottom+=verticalVelocity;verticalVelocity-=gravity;if(hedgehogBottom<=24){hedgehogBottom=24;isJumping=false;hedgehog.classList.remove("jump-frame");hedgehog.classList.add("run-frame-1")}hedgehog.style.bottom=hedgehogBottom+"px"}}
    function createExplosion(e,t){const o=document.createElement("div");o.className="explosion",o.style.left=`${e-32}px`,o.style.top=`${t-32}px`,gameContainer.appendChild(o),setTimeout(()=>{o.remove()},500)}
    function handleItems(){document.querySelectorAll(".item").forEach(e=>{let t=e.offsetLeft;t-=gameSpeed,e.style.left=t+"px";if(t<-50)return void e.remove();const o=hedgehog.getBoundingClientRect(),n=e.getBoundingClientRect();o.left<n.right&&o.right>n.left&&o.top<n.bottom&&o.bottom>n.top&&(e.classList.contains("bug")?isAttacking?(createExplosion(n.left,n.top),playSound("explosion"),updateScore(20),e.remove()):endGame("Ops, um bug!"):(updateScore(10),updateBoost(10),playSound("collect"),e.remove()))})}
    function updateScore(e){score+=e,scoreValue.textContent=score}
    function updateBoost(e){if(isBoostReady)return;boostValue=Math.min(boostValue+e,boostMax);const t=(boostValue/boostMax)*100;boostBar.style.backgroundSize=`${t}% 100%`;if(boostValue>=boostMax){isBoostReady=true,boostBarContainer&&boostBarContainer.classList.add("ready"),attackButton&&attackButton.classList.add("ready"),playSound("powerup")}}
    function triggerAttack(){if(!isBoostReady||isAttacking)return;isAttacking=true,isBoostReady=false,boostValue=0,boostBar.style.backgroundSize="0% 100%",boostBarContainer&&boostBarContainer.classList.remove("ready"),attackButton&&attackButton.classList.remove("ready"),hedgehog.classList.remove("run-frame-1","run-frame-2","jump-frame"),hedgehog.classList.add("attack-pose"),playSound("explosion"),setTimeout(()=>{isAttacking=false,hedgehog.classList.remove("attack-pose");hedgehog.classList.add("run-frame-1")},500)}
    function handleJumpPress(){if(!gameControlsActive)return;if(!isGameRunning)startGame();else if(!isJumping){isJumping=true,isJumpKeyDown=true,jumpTimeCounter=0,verticalVelocity=initialJumpStrength,hedgehog.classList.add("jump-frame"),hedgehog.classList.remove("run-frame-1","run-frame-2","attack-pose"),playSound("jump")}}
    function handleJumpRelease(){isJumpKeyDown=false}
    function handleKeyDown(e){"Space"===e.code&&(e.preventDefault(),handleJumpPress());"KeyS"===e.code&&isGameRunning&&gameControlsActive&&triggerAttack()}
    function handleKeyUp(e){"Space"===e.code&&handleJumpRelease()}

    function startGame() {
        gameControlsActive = true;
        isGameRunning = true;
        score = 0;
        gameSpeed = 5;
        boostValue = 0;
        isBoostReady = false;
        isAttacking = false;
        spawnTimer = 0;
        spawnInterval = 100;
        hedgehog.classList.remove('crashed', 'attack-pose', 'jump-frame');
        hedgehog.classList.add('run-frame-1');
        document.querySelectorAll('.item').forEach(item => item.remove());
        messageDisplay.style.display = 'none';
        formContainer.style.display = 'none';
        leaderboardContainer.style.display = 'none';
        updateScore(0);
        updateBoost(0);
        if (boostBarContainer) boostBarContainer.classList.remove('ready');
        if (attackButton) attackButton.classList.remove('ready');
        if (!isMuted) {
             sounds.music.currentTime = 0;
             sounds.music.play();
        } else {
             sounds.music.pause();
        }
        gameLoopInterval = setInterval(gameLoop, 20);
    }

    // CORREÇÃO: Função endGame atualizada para focar no campo de nome
    function endGame(message) {
        gameControlsActive = false;
        isGameRunning = false;
        clearInterval(gameLoopInterval);
        hedgehog.classList.add('crashed');
        saveHighScore();
        sounds.music.pause();
        playSound('gameover');

        const modal = formContainer.querySelector('.modal');
        modal.innerHTML = `
            <h2>Recorde!</h2>
            <p>Sua pontuação: <span id="final-score">${score}</span></p>
            <form id="register-form">
                <input type="text" id="player-name" placeholder="Seu nome" required maxlength="20">
                <input type="email" id="player-email" placeholder="Seu e-mail (opcional)">
                <button type="submit">Enviar Pontuação</button>
            </form>`;
        
        formContainer.querySelector('#register-form').addEventListener('submit', handleFormSubmit);
        
        formContainer.style.display = 'flex';
        messageDisplay.style.display = 'none';

        // CORREÇÃO: Foca no campo de nome para abrir o teclado
        setTimeout(() => {
            document.getElementById('player-name').focus();
        }, 100); 
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        const playerName = formContainer.querySelector('#player-name').value;
        const playerEmail = formContainer.querySelector('#player-email').value;
        submitScore(playerName, playerEmail, score);
    }

    // --- Inicialização e Event Listeners ---
    loadHighScore();
    
    gameContainer.addEventListener('keydown', handleKeyDown);
    gameContainer.addEventListener('keyup', handleKeyUp);
    
    attackButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (gameControlsActive) triggerAttack();
    });

    // CORREÇÃO: Listener de toque principal agora verifica se os controles estão ativos
    gameContainer.addEventListener('touchstart', (e) => {
        if (!gameControlsActive) return;
        // Impede que o toque em botões acione o pulo
        if (e.target === attackButton || e.target.closest('.modal')) return;
        e.preventDefault();
        handleJumpPress();
    });
    gameContainer.addEventListener('touchend', (e) => {
        if (!gameControlsActive) return;
        if (e.target === attackButton || e.target.closest('.modal')) return;
        e.preventDefault();
        handleJumpRelease();
    });
    
    registerForm.addEventListener('submit', handleFormSubmit);

    restartButton.addEventListener('click', () => {
        leaderboardContainer.style.display = 'none';
        startGame();
    });

    gameContainer.focus();
});
