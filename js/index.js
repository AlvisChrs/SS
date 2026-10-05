const canvas = document.querySelector('#game-canvas');
const c = canvas.getContext('2d');

canvas.width = 1024; canvas.height = 576;
window.activeProjectiles = [];
window.visualEffects = [];
window.globalState = globalState || { hitstop: 0, flashWhite: 0 };
globalState.difficulty = 'MEDIUM';
globalState.domainExpansion = 0;
globalState.domainOwner = null;

let player; let enemy; let timer = 60; let timerId;
let currentGameState = 'SELECT'; 
let p1CharSelection = 'Gojo'; let cpuCharSelection = 'Goku';

// Match & Difficulty State
let p1Rounds = 0; let p2Rounds = 0;

const selectScreen = document.getElementById('character-select');
const difficultyScreen = document.getElementById('difficulty-select');
const uiLayer = document.getElementById('ui-layer');
const gameOverScreen = document.getElementById('game-over');
const gameOverTitle = document.getElementById('game-over-title');
const pauseMenu = document.getElementById('pause-menu');
const matchBanner = document.getElementById('match-banner');
const guideScreen = document.getElementById('guide-screen');

window.showGuide = function() {
    guideScreen.style.display = 'block';
};

window.closeGuide = function() {
    guideScreen.style.display = 'none';
};

window.selectChar = function(playerNum, charName, btnElement) {
    if (playerNum === 1) {
        document.querySelectorAll('.p1-btn').forEach(b => b.classList.remove('active')); 
        btnElement.classList.add('active'); p1CharSelection = charName;
    } else {
        document.querySelectorAll('.cpu-btn').forEach(b => b.classList.remove('active')); 
        btnElement.classList.add('active'); cpuCharSelection = charName;
    }
};

function goToDifficulty() {
    selectScreen.style.display = 'none';
    difficultyScreen.style.display = 'flex';
}

function startGame(diff) {
    try {
        // Langkah 1 & Langkah 3: Set State & Kesulitan
        globalState.difficulty = diff;
        difficultyScreen.style.display = 'none'; gameOverScreen.style.display = 'none'; uiLayer.style.display = 'flex';
        
        // Langkah 2: Buat objek Player dan Enemy
        if (p1CharSelection === 'Itachi') player = new Itachi({ position: { x: 200, y: 0 }, isEnemy: false });
        else if (p1CharSelection === 'Asta') player = new Asta({ position: { x: 200, y: 0 }, isEnemy: false });
        else player = new Fighter({ position: { x: 200, y: 0 }, characterType: p1CharSelection, isEnemy: false });

        if (cpuCharSelection === 'Itachi') enemy = new Itachi({ position: { x: 750, y: 0 }, isEnemy: true });
        else if (cpuCharSelection === 'Asta') enemy = new Asta({ position: { x: 750, y: 0 }, isEnemy: true });
        else enemy = new Fighter({ position: { x: 750, y: 0 }, characterType: cpuCharSelection, isEnemy: true });
        
        // Langkah 4: Hubungkan UI
        document.getElementById('p1-name-display').innerText = p1CharSelection; document.getElementById('cpu-name-display').innerText = cpuCharSelection;
        p1Rounds = 0; p2Rounds = 0;
        
        resetRound(true);
    } catch (error) {
        console.error("CRITICAL ERROR DURING INITIALIZATION: " + error.stack);
        alert("Game crashed while loading characters. Check console for details.");
    }
}

function showBanner(text, duration = 0) {
    matchBanner.innerHTML = text; matchBanner.style.display = 'block';
    if (duration > 0) setTimeout(() => matchBanner.style.display = 'none', duration);
}

function resetRound(isFirst = false) {
    try {
        if (!player || !enemy) return;
        player.position.x = 200; player.position.y = 0;
        enemy.position.x = 750; enemy.position.y = 0;
        player.health = 100; enemy.health = 100;
        player.stamina = 100; enemy.stamina = 100;
        player.awakening = 0; enemy.awakening = 0;
        player.awakeningActive = false; enemy.awakeningActive = false;
        
        globalState.domainExpansion = 0; globalState.domainOwner = null;
        window.activeProjectiles = []; window.visualEffects = []; 
        if (typeof particles !== 'undefined') particles.length = 0;
        
        timer = 60;
        player.isAttacking = false; enemy.isAttacking = false;
        player.hitstunFrames = 0; enemy.hitstunFrames = 0;
        player.isDead = false; enemy.isDead = false;
        player.inputBuffer = []; enemy.inputBuffer = [];

        showBanner('FIGHT!', 1000);
        setTimeout(() => {
            if (currentGameState !== 'PAUSED') {
                currentGameState = 'PLAYING';
                clearTimeout(timerId); decreaseTimer();
            }
        }, 1000);
    } catch(error) {
        console.error("ERROR IN resetRound(): " + error);
    }
}

function handleRoundEnd() {
    if (currentGameState === 'ROUND_OVER') return;
    currentGameState = 'ROUND_OVER';
    clearTimeout(timerId);

    if (player.health > enemy.health) { p1Rounds++; showBanner('P1 WINS ROUND'); } 
    else if (enemy.health > player.health) { p2Rounds++; showBanner('CPU WINS ROUND'); } 
    else { showBanner('DRAW'); }
    updateUI();

    if (p1Rounds >= 2 || p2Rounds >= 2) {
        setTimeout(() => {
            currentGameState = 'GAMEOVER';
            uiLayer.style.display = 'none'; matchBanner.style.display = 'none'; gameOverScreen.style.display = 'flex';
            gameOverTitle.innerHTML = p1Rounds >= 2 ? 'PLAYER 1 WINS MATCH' : 'CPU WINS MATCH';
        }, 2000);
    } else {
        setTimeout(resetRound, 3000);
    }
}

function rematchGame() {
    pauseMenu.style.display = 'none'; gameOverScreen.style.display = 'none'; uiLayer.style.display = 'flex';
    p1Rounds = 0; p2Rounds = 0; window.groundDecals = []; resetRound();
}

function goToSelect() {
    clearTimeout(timerId); pauseMenu.style.display = 'none'; gameOverScreen.style.display = 'none'; uiLayer.style.display = 'none'; difficultyScreen.style.display = 'none'; selectScreen.style.display = 'flex'; currentGameState = 'SELECT';
    window.groundDecals = [];
}

function resumeGame() {
    pauseMenu.style.display = 'none'; currentGameState = savedState;
    if (currentGameState === 'PLAYING') decreaseTimer();
}

function decreaseTimer() {
    if (timer > 0 && currentGameState === 'PLAYING') {
        timerId = setTimeout(decreaseTimer, 1000); timer--; document.querySelector('#timer').innerHTML = timer;
    }
    if (timer === 0 && currentGameState === 'PLAYING') handleRoundEnd();
}

function updateUI() {
    if (!player || !enemy) return;
    document.querySelector('#player-health').style.width = Math.max(0, player.health) + '%'; document.querySelector('#enemy-health').style.width = Math.max(0, enemy.health) + '%';
    document.querySelector('#player-stamina').style.width = Math.max(0, player.stamina) + '%'; document.querySelector('#enemy-stamina').style.width = Math.max(0, enemy.stamina) + '%';
    document.querySelector('#player-awakening').style.width = player.awakening + '%'; document.querySelector('#enemy-awakening').style.width = enemy.awakening + '%';

    const p1Dots = document.querySelectorAll('#p1-rounds .round-dot');
    for(let i=0; i<2; i++) { if (i < p1Rounds) p1Dots[i].classList.add('won'); else p1Dots[i].classList.remove('won'); }
    const cpuDots = document.querySelectorAll('#cpu-rounds .round-dot');
    for(let i=0; i<2; i++) { if (i < p2Rounds) cpuDots[i].classList.add('won'); else cpuDots[i].classList.remove('won'); }
}

function processCollisions() {
    const handleMeleeHit = (attacker, defender) => {
        if (attacker.isAttacking && attacker.attackState === 'active' && !attacker.hasHit && defender.iFrames === 0) {
            if (defender.infinityActive > 0) { attacker.velocity.x = 0; spawnHitParticles(attacker.position, 'purple', 5); return; }

            if (rectangularCollision({ rectangle1: attacker, rectangle2: defender })) {
                attacker.hasHit = true;
                let isGuardBreak = false;

                if (attacker.currentAttack && attacker.currentAttack.name === 'InstantTransmission') {
                    globalState.hitstop = 10; globalState.flashWhite = 0.8; triggerShake(30); window.visualEffects.push({ type: 'speed_lines', timer: 15 });
                }
                if (attacker.characterType === 'Goku' && attacker.awakeningActive && (attacker.currentAttack.name === 'Kamehameha' || attacker.currentAttack.name === 'AirKamehameha')) {
                    isGuardBreak = true;
                }
                if (attacker.currentAttack && attacker.currentAttack.name === 'MeteorSmash') {
                    if (defender.characterType === 'Itachi' && defender.awakeningActive) {
                        defender.takeHit(attacker.currentAttack, attacker, attacker.facingRight ? 1 : -1);
                    } else {
                        attacker.isCinematic = true; attacker.cinematicTarget = defender; attacker.cinematicFrame = 0; return; 
                    }
                }
                
                if (attacker.currentAttack && attacker.currentAttack.name === 'DragonDive') {
                    triggerShake(20); globalState.hitstop = 10; window.globalState.impactFrame = 4;
                }

                if (isGuardBreak) defender.isBlocking = false; 

                defender.takeHit(attacker.currentAttack, attacker, attacker.facingRight ? 1 : -1);
                
                if (attacker.characterType === 'Naruto' && attacker.currentAttack.name === 'Rasengan') spawnHitParticles(defender.position, 'cyan', 40, 2);

                if (attacker.characterType === 'Naruto' && attacker.awakeningActive && (attacker.currentAttack === attacker.attacks.light || attacker.currentAttack === attacker.attacks.sweep || attacker.currentAttack === attacker.attacks.air)) {
                    window.visualEffects.push({
                        type: 'naruto_echo', attacker: attacker, defender: defender, attack: attacker.currentAttack, timer: 15, 
                        joints: JSON.parse(JSON.stringify(attacker.joints)), cx: attacker.position.x + attacker.width/2 - (attacker.facingRight ? 40 : -40), dir: attacker.facingRight ? 1 : -1
                    });
                }

                if (attacker.characterType === 'Itachi' && attacker.currentAttack && attacker.currentAttack.name === 'CrowDash') {
                    globalState.hitstop = 5;
                }
                
                if (attacker.characterType === 'Asta') {
                    if (attacker.currentAttack.name === 'BlackMeteorite') {
                        globalState.hitstop = 15; globalState.flashWhite = 0.5; triggerShake(25);
                    } else if (attacker.currentAttack.name === 'BullThrust') {
                        triggerShake(15);
                    }
                }
            }
        }
    };
    handleMeleeHit(player, enemy); handleMeleeHit(enemy, player);

    const handleCloneLauncher = (attacker, defender) => {
        if (attacker.characterType === 'Naruto' && attacker.currentAttack && attacker.currentAttack.name === 'CloneLauncher' && attacker.attackState === 'active' && !attacker.hasHit) {
            attacker.hasHit = true; 
            window.visualEffects.push({ type: 'clone_uppercut', position: { x: defender.position.x, y: canvas.height - 50 }, timer: 20, dir: attacker.facingRight ? 1 : -1 });
            if (defender.iFrames === 0 && defender.infinityActive === 0) defender.takeHit(attacker.currentAttack, attacker, 0); 
        }
    };
    handleCloneLauncher(player, enemy); handleCloneLauncher(enemy, player);

    for (let i = window.activeProjectiles.length - 1; i >= 0; i--) {
        const proj = window.activeProjectiles[i];
        const target = proj.owner === player ? enemy : player;
        
        if (target.infinityActive > 0 && projCollision(proj, target)) {
            proj.velocity.x *= 0.1; proj.life -= 5; spawnHitParticles(proj.position, 'purple', 2); continue; 
        }
        if (target.characterType === 'Asta' && target.awakeningActive && projCollision(proj, target)) {
            spawnHitParticles(proj.position, 'black', 10); window.activeProjectiles.splice(i, 1); continue;
        }
        if (target.characterType === 'Asta' && target.currentAttack && target.currentAttack.name === 'DemonDestroyer' && target.attackState === 'active' && projCollision(proj, target)) {
            proj.owner.takeHit({ damage: 2, hitstun: 10, knockback: {x: 0, y: 0} }, target, 0); 
            spawnHitParticles(proj.position, 'black', 15); window.activeProjectiles.splice(i, 1); continue;
        }
        if (proj.type === 'gravity') {
            const dist = proj.position.x - target.position.x;
            if (Math.abs(dist) < 300 && target.iFrames === 0) { target.velocity.x += (dist > 0 ? 1.0 : -1.0) * window.dt; }
        } 
        else if (target.iFrames === 0 && projCollision(proj, target)) {
            if (proj.type === 'rasenshuriken') {
                target.takeHit({ damage: proj.damage, hitstun: proj.hitstun, knockback: {x: 2 * (proj.velocity.x > 0 ? 1 : -1), y: -2} }, proj.owner, proj.velocity.x > 0 ? 1 : -1);
                spawnHitParticles(proj.position, proj.color, 10, 2);
                proj.velocity.x *= 0.5;
            } else if (proj.type === 'amaterasu') {
                if (Math.floor(proj.life) % 15 === 0) {
                    target.takeHit({ damage: proj.damage, hitstun: proj.hitstun, knockback: {x: 0, y: 0} }, proj.owner, 0);
                    spawnHitParticles(target.position, 'black', 10, 2);
                }
            } else {
                target.takeHit({ damage: proj.damage, hitstun: proj.hitstun, knockback: proj.knockback }, proj.owner, proj.velocity.x > 0 ? 1 : -1);
                spawnHitParticles(proj.position, proj.color, 30, 2);
                window.activeProjectiles.splice(i, 1);
            }
        }
    }
}

let lastTime = performance.now();
window.dt = 1;

window.groundDecals = [];
window.cameraX = 0;

function animate(currentTime = performance.now()) {
    window.requestAnimationFrame(animate);
    
    window.dt = (currentTime - lastTime) / (1000 / 60);
    if (window.dt > 3) window.dt = 3; 
    lastTime = currentTime;

    const WORLD_WIDTH = canvas.width * 3;

    if (player && enemy) {
        const midX = (player.position.x + enemy.position.x) / 2;
        let targetCameraX = midX - canvas.width / 2;
        if (targetCameraX < 0) targetCameraX = 0;
        if (targetCameraX > WORLD_WIDTH - canvas.width) targetCameraX = WORLD_WIDTH - canvas.width;
        window.cameraX = lerp(window.cameraX, targetCameraX, 0.1 * window.dt);
    }

    if (window.globalState && window.globalState.domainExpansion > 0) {
        c.fillStyle = 'black'; c.fillRect(0, 0, canvas.width, canvas.height);
        c.save();
        c.translate(canvas.width/2, canvas.height/2);
        const grad = c.createRadialGradient(0, 0, 10, 0, 0, 500);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.15, 'rgba(138, 43, 226, 0.8)'); 
        grad.addColorStop(0.5, 'rgba(0, 0, 128, 0.4)');
        grad.addColorStop(1, 'transparent');
        c.fillStyle = grad;
        c.rotate(Date.now() / 3000);
        c.fillRect(-600, -600, 1200, 1200);
        
        c.fillStyle = 'white';
        for (let i = 1; i <= 60; i++) {
            const x = Math.sin(i * 123) * 600;
            const y = Math.cos(i * 321) * 600;
            c.globalAlpha = Math.max(0, Math.sin(Date.now()/400 + i));
            c.beginPath(); c.arc(x, y, (i%3)+1, 0, Math.PI*2); c.fill();
        }
        c.restore();
        c.fillStyle = 'rgba(0,0,0,0.8)'; c.fillRect(0, canvas.height - 50, canvas.width, 50);
    } else {
        c.fillStyle = '#111'; c.fillRect(0, 0, canvas.width, canvas.height);
        
        // Ambient Menu Particles (Cyber/Ember)
        if (currentGameState === 'SELECT' || currentGameState === 'DIFFICULTY') {
            c.save();
            const t = Date.now() / 1000;
            c.fillStyle = '#00E5FF';
            for(let i=0; i<100; i++) {
                const px = (Math.sin(i * 24.5 + t) * 0.5 + 0.5) * canvas.width;
                const py = (canvas.height + 50) - (((t * (10 + (i%20))) + (i * 99)) % (canvas.height + 100));
                c.globalAlpha = Math.max(0, Math.sin(t * 3 + i));
                c.beginPath(); c.arc(px, py, (i%3)+1, 0, Math.PI*2); c.fill();
            }
            c.restore();
        }

        // Ambient Arena Particles (Epic Rain)
        if (currentGameState === 'PLAYING' || currentGameState === 'ROUND_OVER' || currentGameState === 'PAUSED' || currentGameState === 'GAMEOVER') {
            c.save();
            const t = Date.now() / 1000;
            c.fillStyle = 'rgba(150, 200, 255, 0.4)';
            for (let i=0; i<150; i++) {
                const speed = 800 + (i%50)*10;
                // Add parallax to x and properly wrap it within the canvas width
                let px = ((i * 137) - (window.cameraX * 0.5)) % canvas.width;
                if (px < 0) px += canvas.width;
                
                let py = (((t * speed) + (i * 99)) % (canvas.height + 200)) - 100;
                c.globalAlpha = Math.max(0.1, Math.sin(t * 5 + i));
                
                c.beginPath();
                c.moveTo(px, py);
                c.lineTo(px - 5, py + 20); 
                c.lineWidth = (i%3)+1;
                c.strokeStyle = 'rgba(170, 210, 255, 0.5)';
                c.stroke();
            }
            c.restore();
        }

        // Parallax Mountain Layer (far)
        c.save();
        c.translate(-window.cameraX * 0.2, 0);
        c.fillStyle = '#1f2d3d';
        for (let i = 0; i < 20; i++) {
            c.beginPath(); c.moveTo(i * 250 - 100, canvas.height - 50);
            c.lineTo(i * 250 + 150, canvas.height - 350 + (i%2)*50);
            c.lineTo(i * 250 + 400, canvas.height - 50); c.fill();
        }
        c.restore();

        // Parallax City Layer (closer)
        c.save();
        c.translate(-window.cameraX * 0.5, 0);
        c.fillStyle = '#151e29';
        for (let i = 0; i < 30; i++) {
            c.fillRect(i * 150, canvas.height - 200 - (i%3)*60, 120, 200 + (i%3)*60);
        }
        c.restore();

        c.save();
        c.translate(-window.cameraX, 0);
        c.fillStyle = '#1a252f'; c.fillRect(0, canvas.height - 50, WORLD_WIDTH, 50);
        
        // Draw Ground Decals (Cracks)
        c.strokeStyle = '#0a1017'; c.lineWidth = 2;
        for (let decal of window.groundDecals) {
            if (!decal.points) {
                decal.points = [];
                for(let i=0; i<4; i++) {
                    let px = 0; let py = 0;
                    for(let j=0; j<3; j++) {
                        px += (Math.random()-0.5)*40; py += Math.random()*20;
                        decal.points.push({x: px, y: py});
                    }
                    decal.points.push(null);
                }
            }
            c.save(); c.translate(decal.x, canvas.height - 50);
            c.beginPath(); c.moveTo(0,0);
            for(let pt of decal.points) {
                if (!pt) { c.stroke(); c.beginPath(); c.moveTo(0,0); }
                else { c.lineTo(pt.x, pt.y); }
            }
            c.stroke(); c.restore();
        }
        c.restore();

        // Game Over Confetti
        if (currentGameState === 'GAMEOVER') {
            c.save();
            const t = Date.now() / 1000;
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];
            for(let i=0; i<150; i++) {
                c.fillStyle = colors[i % colors.length];
                const px = (i * 87) % canvas.width;
                const py = (((t * (150 + (i%50))) + (i * 99)) % (canvas.height + 100)) - 50;
                c.globalAlpha = 0.8;
                c.save();
                c.translate(px, py);
                c.rotate(t * (i%3 + 1));
                c.fillRect(-4, -4, 8, 8);
                c.restore();
            }
            c.restore();
        }
    }

    // PROTEKSI RENDER LOOP: JANGAN GAMBAR JIKA PLAYER/ENEMY NULL
    if ((currentGameState === 'PLAYING' || currentGameState === 'ROUND_OVER' || currentGameState === 'GAMEOVER') && player != null && enemy != null) {
        
        try {
            if (globalState.flashWhite > 0) {
                c.fillStyle = `rgba(255, 255, 255, ${globalState.flashWhite})`; c.fillRect(0, 0, canvas.width, canvas.height);
                globalState.flashWhite -= 0.05;
            }

            if (globalState.awakeningCutscene && globalState.awakeningCutscene.timer > 0) {
                const t = globalState.awakeningCutscene.timer;
                globalState.awakeningCutscene.timer--;
                const char = globalState.awakeningCutscene.character;
                
                c.save(); c.translate(-window.cameraX, 0);
                player.draw(c); enemy.draw(c);
                c.restore();
                c.fillStyle = 'rgba(0, 0, 0, 0.75)'; c.fillRect(0, 0, canvas.width, canvas.height);
                
                if (t > 40) {
                    c.save(); c.translate(-window.cameraX, 0);
                    char.draw(c);
                    if (t % 5 === 0) spawnHitParticles({x: char.position.x + char.width/2, y: char.position.y + char.height/2}, char.color, 5, 2);
                    c.restore();
                }

                if (t <= 100 && t > 20) {
                    const panelProg = t > 90 ? (100 - t)/10 : (t < 30 ? (t - 20)/10 : 1);
                    c.save();
                    c.translate(canvas.width/2, canvas.height/2);
                    if (Math.random() < 0.5) c.translate((Math.random()-0.5)*10, (Math.random()-0.5)*10);
                    
                    c.rotate(-Math.PI / 8);
                    
                    const bandWidth = 300 * panelProg;
                    c.fillStyle = 'white'; c.fillRect(-canvas.width, -bandWidth/2 - 5, canvas.width*2, bandWidth + 10);
                    c.fillStyle = 'black'; c.fillRect(-canvas.width, -bandWidth/2, canvas.width*2, bandWidth);

                    if (panelProg > 0.5) {
                        c.rotate(Math.PI / 8); 
                        c.scale(2, 2);
                        c.fillStyle = 'white';
                        c.beginPath(); c.arc(0, 0, 30, 0, Math.PI*2); c.fill();
                        
                        c.fillStyle = 'white';
                        if (char.characterType === 'Gojo') {
                            c.fillRect(-20, -50, 40, 40); 
                            c.fillStyle = 'cyan'; c.shadowColor = 'cyan'; c.shadowBlur = 20;
                            c.beginPath(); c.arc(10, -10, 5, 0, Math.PI*2); c.arc(-10, -10, 5, 0, Math.PI*2); c.fill();
                        } else if (char.characterType === 'Naruto') {
                            c.beginPath(); c.moveTo(-30, 0); c.lineTo(-40, -40); c.lineTo(0, -30); c.lineTo(40, -40); c.lineTo(30, 0); c.fill();
                            c.fillStyle = 'red'; c.shadowColor = 'red'; c.shadowBlur = 20;
                            c.fillRect(5, -15, 10, 5); c.fillRect(-15, -15, 10, 5);
                        } else if (char.characterType === 'Goku') {
                            c.beginPath(); c.moveTo(-35, 10); c.lineTo(-50, -30); c.lineTo(-10, -40); c.lineTo(10, -60); c.lineTo(30, -30); c.lineTo(40, 10); c.fill();
                            c.fillStyle = '#00FFCC'; c.shadowColor = '#00FFCC'; c.shadowBlur = 20;
                            c.beginPath(); c.arc(10, -10, 4, 0, Math.PI*2); c.arc(-10, -10, 4, 0, Math.PI*2); c.fill();
                        } else if (char.characterType === 'Itachi') {
                            c.fillStyle = 'black'; c.beginPath(); c.arc(0, 0, 15, 0, Math.PI*2); c.fill();
                            c.fillStyle = 'red'; c.shadowColor = 'red'; c.shadowBlur = 20;
                            c.beginPath(); c.arc(0, 0, 12, 0, Math.PI*2); c.fill();
                            c.fillStyle = 'black'; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI*2); c.fill();
                            // Mangekyou pattern
                            c.strokeStyle = 'black'; c.lineWidth = 3;
                            for(let i=0; i<3; i++) {
                                c.beginPath(); c.moveTo(0,0); 
                                c.lineTo(Math.cos(i*Math.PI*2/3 + t/2)*10, Math.sin(i*Math.PI*2/3 + t/2)*10); 
                                c.stroke();
                            }
                        } else if (char.characterType === 'Asta') {
                            c.fillStyle = '#444'; c.beginPath(); c.arc(0, 0, 15, 0, Math.PI*2); c.fill();
                            c.fillStyle = 'black'; c.fillRect(0, -20, 20, 40); 
                            c.fillStyle = 'red'; c.shadowColor = 'red'; c.shadowBlur = 20;
                            c.beginPath(); c.arc(7, -5, 4, 0, Math.PI*2); c.fill(); 
                            c.shadowBlur = 0;
                            c.fillStyle = '#1a1a1a'; c.fillRect(20, 10, 25, 30);
                            c.strokeStyle = '#555'; c.lineWidth = 1; c.strokeRect(20, 10, 25, 30);
                            c.fillStyle = 'black'; c.font = '20px serif'; c.fillText('♣', 32, 32); 
                        }
                    }
                    c.restore();
                }

                if (t <= 30) {
                    const expP = (30 - t) / 30; 
                    c.save();
                    const cx = char.position.x + char.width/2 - window.cameraX;
                    const cy = char.position.y + char.height/2;

                    if (char.characterType === 'Gojo') {
                        c.strokeStyle = 'white'; c.lineWidth = 2 + expP * 5;
                        c.beginPath();
                        for(let i=0; i<8; i++) {
                            c.moveTo(cx, cy);
                            c.lineTo(cx + Math.cos(i*Math.PI/4) * Math.pow(expP, 2) * canvas.width, cy + Math.sin(i*Math.PI/4) * Math.pow(expP, 2) * canvas.width);
                        }
                        c.stroke();
                        if (t === 1) { globalState.domainExpansion = 600; globalState.domainOwner = char; }
                    } 
                    else if (char.characterType === 'Naruto') {
                        c.fillStyle = `rgba(255, 140, 0, ${expP})`;
                        c.fillRect(cx - 150*expP, 0, 300*expP, canvas.height);
                        
                        c.fillStyle = `rgba(255, 0, 0, ${expP * 0.8})`;
                        c.shadowColor = 'red'; c.shadowBlur = 50;
                        c.beginPath(); 
                        c.ellipse(canvas.width/2 - 200, canvas.height/2 - 100, 80, 30, Math.PI/8, 0, Math.PI*2);
                        c.ellipse(canvas.width/2 + 200, canvas.height/2 - 100, 80, 30, -Math.PI/8, 0, Math.PI*2);
                        c.fill();
                        c.fillStyle = 'black';
                        c.beginPath(); c.ellipse(canvas.width/2 - 200, canvas.height/2 - 100, 10, 30, Math.PI/8, 0, Math.PI*2);
                        c.ellipse(canvas.width/2 + 200, canvas.height/2 - 100, 10, 30, -Math.PI/8, 0, Math.PI*2); c.fill();
                    }
                    else if (char.characterType === 'Goku') {
                        const r = Math.pow(expP, 4) * canvas.width * 2;
                        c.fillStyle = 'white'; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill();
                        
                        c.strokeStyle = Math.random() > 0.5 ? 'cyan' : 'yellow'; c.lineWidth = 5;
                        c.beginPath();
                        let lx = cx + (Math.random()-0.5)*400; let ly = 0;
                        c.moveTo(lx, ly);
                        for(let i=0; i<5; i++) {
                            lx += (Math.random()-0.5)*200; ly += canvas.height/5;
                            c.lineTo(lx, ly);
                        }
                        c.stroke();
                    } else if (char.characterType === 'Itachi') {
                        c.fillStyle = `rgba(255, 0, 0, ${expP * 0.5})`;
                        c.fillRect(0, 0, canvas.width, canvas.height);
                        c.fillStyle = `rgba(0, 0, 0, ${expP})`;
                        for(let i=0; i<20; i++) {
                            let r = Math.random()*20 + 10;
                            c.beginPath(); 
                            c.arc((t*50 + i*200)%canvas.width, (i*80)%canvas.height, r, 0, Math.PI*2); 
                            c.fill();
                        }
                    } else if (char.characterType === 'Asta') {
                        c.fillStyle = `rgba(0, 0, 0, ${expP * 0.8})`;
                        c.fillRect(0, 0, canvas.width, canvas.height);
                        c.fillStyle = `rgba(255, 0, 0, ${expP})`;
                        for(let i=0; i<10; i++) {
                            c.beginPath(); 
                            c.moveTo(cx, cy);
                            c.lineTo(cx + (Math.random()-0.5)*canvas.width, cy + (Math.random()-0.5)*canvas.height);
                            c.strokeStyle = Math.random() < 0.5 ? 'black' : 'red';
                            c.lineWidth = Math.random()*10;
                            c.stroke();
                        }
                    }
                    c.restore();
                }

                if (t === 0) {
                    triggerShake(50); globalState.flashWhite = 1.0;
                }
                
                
                if (typeof particles !== 'undefined') {
                    c.save(); c.translate(-window.cameraX, 0);
                    for (let i = particles.length - 1; i >= 0; i--) {
                        particles[i].draw(c);
                        particles[i].position.x += particles[i].velocity.x * window.dt;
                        particles[i].position.y += particles[i].velocity.y * window.dt;
                        particles[i].velocity.y += particles[i].gravity * window.dt; 
                        particles[i].velocity.x *= Math.pow(particles[i].friction, window.dt); 
                        particles[i].velocity.y *= Math.pow(particles[i].friction, window.dt);
                        particles[i].life -= window.dt;
                        if (particles[i].life <= 0) particles.splice(i, 1);
                    }
                    c.restore();
                }
                c.restore(); 
                return;
            }

            const hitstopActive = globalState.hitstop > 0;
            if (hitstopActive) {
                globalState.hitstop--; 
            }

            if (globalState.impactFrame > 0) {
                globalState.impactFrame--;
                c.globalCompositeOperation = 'difference';
                c.fillStyle = globalState.impactFrame % 2 === 0 ? 'black' : 'white';
                c.fillRect(0, 0, canvas.width, canvas.height);
                c.globalCompositeOperation = 'source-over';
            }

            if (!hitstopActive) {
                player.stamina = Math.min(player.maxStamina, player.stamina + 0.15); 
                enemy.stamina = Math.min(enemy.maxStamina, enemy.stamina + 0.15);
            }
            updateUI();
            
            c.save(); 
            if (typeof applyScreenShake === 'function') applyScreenShake(c);

            // Apply Dynamic Camera Translation to all entities
            c.translate(-window.cameraX, 0);

            if (currentGameState === 'PLAYING' && !hitstopActive) {
                enemy.updateAI(player); player.update(); enemy.update(); processCollisions();
                if (player.health <= 0 || enemy.health <= 0) handleRoundEnd();
            }

            for (let i = window.visualEffects.length - 1; i >= 0; i--) {
                const effect = window.visualEffects[i];
                if (effect.type === 'clone_uppercut') {
                    c.save(); c.globalAlpha = effect.timer / 20; c.strokeStyle = 'rgba(255, 165, 0, 0.7)'; c.lineWidth = 8; c.lineCap = 'round';
                    const yOffset = (20 - effect.timer) * 6; const ex = effect.position.x; const ey = effect.position.y;
                    c.beginPath(); c.arc(ex, ey - 100 - yOffset, 16, 0, Math.PI*2); c.stroke(); 
                    c.beginPath(); c.moveTo(ex, ey - 84 - yOffset); c.lineTo(ex, ey - 30 - yOffset); c.stroke(); 
                    c.beginPath(); c.moveTo(ex, ey - 75 - yOffset); c.lineTo(ex + 25*effect.dir, ey - 130 - yOffset); c.stroke(); 
                    if (effect.timer === 1) window.visualEffects.push({ type: 'smoke_poof', position: { x: ex, y: ey - yOffset }, timer: 15 });
                    c.restore();
                } else if (effect.type === 'clone_slam') {
                    c.save(); c.globalAlpha = effect.timer / 30; c.fillStyle = 'rgba(255, 165, 0, 0.8)';
                    const ex = effect.position.x; const ey = effect.position.y + (30 - effect.timer) * 5;
                    c.beginPath(); c.arc(ex, ey, 16, 0, Math.PI*2); c.fill();
                    c.fillRect(ex - 10, ey + 16, 20, 40);
                    c.fillRect(ex - 5, ey + 56, 10, 30);
                    
                    if (effect.timer === 15 && effect.target.iFrames === 0) {
                        effect.target.takeHit({ damage: 15, hitstun: 40, knockback: {x: 0, y: 15} }, effect.attacker, effect.dir);
                        spawnHitParticles(effect.target.position, 'white', 20);
                        window.visualEffects.push({ type: 'smoke_poof', position: { x: ex, y: ey + 50 }, timer: 15 });
                    }
                    c.restore();
                } else if (effect.type === 'smoke_poof') {
                    c.save(); c.globalAlpha = effect.timer / 15; c.fillStyle = 'gray';
                    c.beginPath(); c.arc(effect.position.x, effect.position.y - 50, (15 - effect.timer) * 5, 0, Math.PI*2); c.fill(); c.restore();
                } else if (effect.type === 'shockwave') {
                    const maxTimer = effect.maxTimer || 15;
                    c.save(); 
                    c.globalAlpha = Math.min(1, Math.max(0, effect.timer / maxTimer)); 
                    c.strokeStyle = 'white'; 
                    c.lineWidth = 10 * (effect.timer / maxTimer);
                    const radius = Math.max(0.1, (maxTimer - effect.timer) * 15);
                    c.beginPath(); c.arc(effect.position.x, effect.position.y, radius, 0, Math.PI*2); c.stroke();
                    c.restore();
                } else if (effect.type === 'speed_blitz') {
                    c.save();
                    const alpha = effect.timer / effect.maxTimer;
                    c.globalAlpha = alpha * 0.7;
                    
                    for (let j = 1; j <= 3; j++) {
                        const lerpAmt = j / 4;
                        const ghostX = effect.startX + (effect.endX - effect.startX) * lerpAmt;
                        const ghostY = effect.startY + (effect.endY - effect.startY) * lerpAmt;
                        c.save();
                        c.translate(ghostX + effect.attacker.width / 2, ghostY + effect.attacker.height);
                        c.scale(effect.attacker.scaleX, effect.attacker.scaleY);
                        c.translate(-(ghostX + effect.attacker.width / 2), -(ghostY + effect.attacker.height));
                        effect.attacker.drawSegmentedBody(c, effect.color, ghostX + effect.attacker.width / 2, ghostY, effect.dir);
                        c.restore();
                    }

                    c.globalAlpha = alpha;
                    c.strokeStyle = effect.color;
                    c.lineWidth = 4 * alpha;
                    c.lineCap = 'round';
                    c.beginPath();
                    c.moveTo(effect.startX + effect.attacker.width / 2, effect.startY + effect.attacker.height / 2);
                    c.lineTo(effect.endX + effect.attacker.width / 2, effect.endY + effect.attacker.height / 2);
                    c.stroke();
                    
                    c.strokeStyle = 'white';
                    c.lineWidth = 2 * alpha;
                    c.stroke();
                    
                    c.restore();
                } else if (effect.type === 'naruto_echo') {
                    if (effect.timer === 10 && effect.defender.iFrames === 0) {
                        effect.defender.takeHit(effect.attack, effect.attacker, effect.dir); spawnHitParticles(effect.defender.position, 'orange', 10);
                    }
                    c.save(); c.globalAlpha = effect.timer / 30; const j = effect.joints; const cx = effect.cx;
                    c.strokeStyle = 'orange'; c.lineWidth = 6; c.lineCap = 'round';
                    c.beginPath(); c.moveTo(cx, j.shoulderY); c.lineTo(cx, j.hipY); c.stroke(); 
                    c.beginPath(); c.arc(cx, j.shoulderY - 18, 16, 0, Math.PI*2); c.stroke(); 
                    c.beginPath(); c.moveTo(cx, j.shoulderY); c.lineTo(j.bElbow.x, j.bElbow.y); c.lineTo(j.bHand.x, j.bHand.y); c.stroke();
                    c.beginPath(); c.moveTo(cx, j.hipY); c.lineTo(j.bKnee.x, j.bKnee.y); c.lineTo(j.bFoot.x, j.bFoot.y); c.stroke();
                    c.beginPath(); c.moveTo(cx, j.shoulderY); c.lineTo(j.fElbow.x, j.fElbow.y); c.lineTo(j.fHand.x, j.fHand.y); c.stroke();
                    c.beginPath(); c.moveTo(cx, j.hipY); c.lineTo(j.fKnee.x, j.fKnee.y); c.lineTo(j.fFoot.x, j.fFoot.y); c.stroke();
                    c.restore();
                } else if (effect.type === 'aura_lines') {
                    c.save();
                    c.globalAlpha = effect.timer / effect.maxTimer;
                    c.strokeStyle = effect.color; c.lineWidth = 2;
                    c.beginPath();
                    c.moveTo(effect.startX, effect.startY);
                    c.lineTo(effect.endX, effect.endY);
                    c.stroke();
                    c.restore();
                } else if (effect.type === 'speed_lines') {
                    c.save(); c.globalAlpha = effect.timer / 15; c.strokeStyle = 'white'; c.lineWidth = 2; c.beginPath();
                    for (let j=0; j<40; j++) {
                        const angle = Math.random() * Math.PI * 2; const inner = 100 + Math.random() * 150; const outer = canvas.width;
                        c.moveTo(canvas.width/2 + Math.cos(angle)*inner, canvas.height/2 + Math.sin(angle)*inner); c.lineTo(canvas.width/2 + Math.cos(angle)*outer, canvas.height/2 + Math.sin(angle)*outer);
                    }
                    c.stroke(); c.restore();
                }
                if (!hitstopActive) effect.timer--; 
                if (effect.timer <= 0) window.visualEffects.splice(i, 1);
            }

            player.draw(c); enemy.draw(c);

            for (let i = window.activeProjectiles.length - 1; i >= 0; i--) {
                const p = window.activeProjectiles[i]; 
                if (!hitstopActive) p.update(c); else p.draw(c);
                if (p.life <= 0 || p.position.x < -200 || p.position.x > (canvas.width * 3) + 200 || p.position.y > canvas.height - 50) window.activeProjectiles.splice(i, 1);
            }
            if (typeof particles !== 'undefined') {
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i]; 
                    if (!hitstopActive) p.update(c); else p.draw(c);
                    if (p.life <= 0) particles.splice(i, 1);
                }
            }
            c.restore();

            if (globalState.domainExpansion > 0 && !hitstopActive) {
                globalState.domainExpansion--;
            }
        } catch (error) {
            console.error("CRITICAL ERROR IN RENDER LOOP: " + error.stack);
        }
    }
}
animate();

let savedState = '';
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        if (guideScreen.style.display === 'block') {
            closeGuide();
            return;
        }
        if (currentGameState === 'PLAYING') {
            savedState = currentGameState; currentGameState = 'PAUSED';
            pauseMenu.style.display = 'flex'; clearTimeout(timerId);
        } else if (currentGameState === 'PAUSED') { resumeGame(); }
        return;
    }
    if (currentGameState !== 'PLAYING' || !player || player.isDead || player.hitstunFrames > 0 || player.isCinematic) return;
    switch (event.key.toLowerCase()) {
        case 'd': player.keys.right = true; break;
        case 'a': player.keys.left = true; break;
        case 'w': player.keys.up = true; break;
        case 's': player.keys.down = true; break;
        case ' ': player.keys.block = true; break; 
        case 'j': player.queueInput('attack'); break;
        case 'e': player.queueInput('skill1'); break;
        case 'q': player.queueInput('skill2'); break;
        case 'r': player.queueInput('awaken'); break;
    }
});
window.addEventListener('keyup', (event) => {
    if (currentGameState !== 'PLAYING' || !player) return;
    switch (event.key.toLowerCase()) {
        case 'd': player.keys.right = false; break;
        case 'a': player.keys.left = false; break;
        case 'w': player.keys.up = false; break;
        case 's': player.keys.down = false; break;
        case ' ': player.keys.block = false; break;
    }
});
