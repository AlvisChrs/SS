class Projectile {
    constructor({ position, velocity, radius, color, damage, owner, type = 'normal', life = 100 }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.damage = damage;
        this.owner = owner;
        this.type = type; 
        this.life = life;
        this.hitstun = 40;
        this.knockback = { x: 15, y: -5 };
    }
    
    draw(c) {
        c.save();
        if (this.type === 'gravity') {
            c.shadowColor = 'cyan'; c.shadowBlur = 30;
            c.fillStyle = 'rgba(0, 0, 255, 0.5)';
            c.beginPath(); c.arc(this.position.x, this.position.y, this.radius + Math.sin(Date.now()/50)*10, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'blue';
            c.beginPath(); c.arc(this.position.x, this.position.y, this.radius * 0.5, 0, Math.PI * 2); c.fill();
        } else if (this.type === 'rasenshuriken') {
            c.translate(this.position.x, this.position.y); c.rotate(Date.now() / 15);
            c.fillStyle = 'rgba(0, 191, 255, 0.7)'; c.beginPath(); c.arc(0, 0, this.radius, 0, Math.PI*2); c.fill();
            c.strokeStyle = 'white'; c.lineWidth = 6;
            const r = this.radius + 15;
            for(let i=0; i<4; i++) {
                c.beginPath(); c.moveTo(0, 0); c.lineTo(r, 0); c.stroke(); c.rotate(Math.PI/2);
            }
        } else if (this.type === 'shuriken') {
            c.translate(this.position.x, this.position.y);
            c.rotate(Date.now() / 20); 
            c.fillStyle = '#E0E0E0';
            c.beginPath();
            c.moveTo(0, -this.radius);
            c.lineTo(this.radius/4, -this.radius/4);
            c.lineTo(this.radius, 0);
            c.lineTo(this.radius/4, this.radius/4);
            c.lineTo(0, this.radius);
            c.lineTo(-this.radius/4, this.radius/4);
            c.lineTo(-this.radius, 0);
            c.lineTo(-this.radius/4, -this.radius/4);
            c.closePath(); 
            c.fill();
            c.strokeStyle = '#606060'; c.lineWidth = 1; c.stroke();
        } else if (this.type === 'fireball') {
            c.translate(this.position.x, this.position.y); c.rotate(Date.now() / 10);
            c.fillStyle = 'rgba(255, 69, 0, 0.8)';
            c.beginPath();
            for(let i=0; i<6; i++) {
                c.lineTo(Math.cos(i*Math.PI/3)*this.radius, Math.sin(i*Math.PI/3)*this.radius);
                c.lineTo(Math.cos((i+0.5)*Math.PI/3)*this.radius*0.6, Math.sin((i+0.5)*Math.PI/3)*this.radius*0.6);
            }
            c.fill();
            c.fillStyle = 'yellow';
            c.beginPath(); c.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2); c.fill();
            if (Math.random() < 0.3) spawnHitParticles(this.position, 'orange', 1);
        } else if (this.type === 'black_slash') {
            c.translate(this.position.x, this.position.y);
            const isFacingRight = this.velocity.x > 0;
            if (!isFacingRight) c.scale(-1, 1);
            c.fillStyle = '#222'; c.strokeStyle = 'red'; c.lineWidth = 2;
            c.beginPath();
            c.moveTo(0, -this.radius);
            c.quadraticCurveTo(this.radius*1.5, 0, 0, this.radius);
            c.quadraticCurveTo(this.radius, 0, 0, -this.radius);
            c.fill(); c.stroke();
            if (Math.random() < 0.3) spawnHitParticles(this.position, 'red', 2);
        } else if (this.type === 'amaterasu') {
            c.translate(this.position.x, this.position.y);
            c.fillStyle = 'rgba(0, 0, 0, 0.9)';
            c.beginPath();
            c.moveTo(-this.radius, 0);
            for(let i=-this.radius; i<=this.radius; i+=10) {
                c.lineTo(i, -Math.random()*this.radius*2 - this.radius);
            }
            c.lineTo(this.radius, 0);
            c.fill();
            if (Math.random() < 0.5) spawnHitParticles(this.position, 'black', 2);
        } else {
            c.shadowColor = this.color; c.shadowBlur = 20;
            c.fillStyle = this.color;
            c.beginPath(); c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'white';
            c.beginPath(); c.arc(this.position.x, this.position.y, this.radius * 0.4, 0, Math.PI * 2); c.fill();
        }
        c.restore();
    }
    
    update(c) {
        this.draw(c);
        let dt = window.dt || 1;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.life -= dt;
        
        if (this.type === 'normal' && Math.floor(this.life) % 2 === 0) {
            spawnHitParticles(this.position, this.color, 1, 0.1);
        }
    }
}

class Fighter {
    constructor({ position, characterType, isEnemy = false }) {
        this.position = position;
        this.velocity = { x: 0, y: 0 };
        this.width = 50; this.height = 130;
        
        this.isEnemy = isEnemy;
        this.characterType = characterType;
        this.facingRight = !isEnemy;
        this.isDead = false;
        
        this.health = 100;
        this.stamina = 100; this.maxStamina = 100;
        this.skillCooldown = 0;
        
        this.awakening = 0;
        this.awakeningActive = false;
        this.awakeningTimer = 0;
        this.damageMult = 1; this.cdMult = 1; this.speedMult = 1;
        
        this.hitstunFrames = 0;
        this.iFrames = 0;
        this.comboCount = 0; this.comboTimer = 0;
        
        this.isBlocking = false;
        this.blockTimer = 0;
        
        this.isCrouching = false;
        this.infinityActive = 0; 
        this.substituteActive = 0; 
        this.isCinematic = false; 
        this.cinematicFrame = 0;
        this.cinematicTarget = null;
        
        this.acceleration = 1.2;
        this.maxSpeed = 8;
        this.jumpPower = -16;
        this.onGround = false;
        this.scaleX = 1; this.scaleY = 1; 
        
        this.isAttacking = false;
        this.attackState = null;
        this.attackFrame = 0;
        this.skillFired = false;
        this.currentAttack = null;
        this.hasHit = false;
        this.attackBox = { position: { x: this.position.x, y: this.position.y }, width: 80, height: 50 };
        
        this.keys = { left: false, right: false, up: false, down: false, block: false };
        this.inputBuffer = []; 
        this.joints = null; 
        this.aiTimer = 0; 
        
        this.setupCharacter();
    }

    queueInput(inputKey) {
        this.inputBuffer.push({ key: inputKey, timer: 15 });
    }

    setupCharacter() {
        this.attacks = {
            light: { startup: 5, active: 8, recovery: 15, damage: 5, knockback: {x: 5, y: -2}, hitstun: 25, width: 80, height: 50, cost: 7 },
            sweep: { startup: 8, active: 10, recovery: 20, damage: 7, knockback: {x: 2, y: -10}, hitstun: 45, width: 100, height: 40, cost: 10, knockdown: true },
            air:   { startup: 6, active: 15, recovery: 15, damage: 8, knockback: {x: 6, y: 15}, hitstun: 30, width: 70, height: 70, cost: 7 }
        };

        switch(this.characterType) {
            case 'Gojo': 
                this.color = '#7F00FF'; this.maxSpeed = 9; this.acceleration = 1.8;
                this.skills = {
                    groundE: { name: 'HollowPurple', startup: 25, active: 15, recovery: 30, damage: 18, hitstun: 45, width: 100, height: 80, cost: 20, cd: 120 }, 
                    groundQ: { name: 'LapseBlue', startup: 15, active: 60, recovery: 20, damage: 2, hitstun: 5, width: 0, height: 0, cost: 15, cd: 120 }, 
                    crouchE: { name: 'Infinity', startup: 10, active: 1, recovery: 15, damage: 0, hitstun: 0, width: 0, height: 0, cost: 25, cd: 180 }, 
                    crouchQ: { name: 'ReversalRed', startup: 12, active: 10, recovery: 20, damage: 12, knockback: {x: 25, y: -5}, hitstun: 40, width: 60, height: 60, cost: 15, cd: 90 },
                    airE: { name: 'AerialPurple', startup: 20, active: 15, recovery: 20, damage: 14, hitstun: 40, width: 60, height: 60, cost: 17, cd: 100 },
                    airQ: { name: 'WarpStrike', startup: 15, active: 15, recovery: 20, damage: 8, hitstun: 40, width: 80, height: 80, cost: 12, cd: 80 }
                };
                break;
            case 'Goku': 
                this.color = '#FF8C00'; this.maxSpeed = 10.5; this.acceleration = 2.0; this.jumpPower = -18;
                this.skills = {
                    groundE: { name: 'Kamehameha', startup: 25, active: 15, recovery: 30, damage: 15, hitstun: 45, width: 1000, height: 80, cost: 20, cd: 120 }, 
                    groundQ: { name: 'InstantTransmission', startup: 15, active: 15, recovery: 20, damage: 12, knockback: {x: 0, y: 15}, hitstun: 40, width: 80, height: 100, cost: 17, cd: 80 }, 
                    crouchE: { name: 'MeteorSmash', startup: 12, active: 10, recovery: 25, damage: 0, knockback: {x: 0, y: 0}, hitstun: 0, width: 80, height: 50, cost: 25, cd: 180 }, 
                    crouchQ: { name: 'KiBlastVolley', startup: 10, active: 30, recovery: 15, damage: 5, hitstun: 20, width: 0, height: 0, cost: 15, cd: 90 },
                    airE: { name: 'AerialKamehameha', startup: 20, active: 15, recovery: 30, damage: 12, hitstun: 40, width: 800, height: 600, cost: 20, cd: 120 },
                    airQ: { name: 'DragonDive', startup: 10, active: 30, recovery: 20, damage: 12, knockback: {x: 10, y: 0}, hitstun: 40, width: 60, height: 60, cost: 15, cd: 100 }
                };
                break;
            case 'Naruto': 
                this.color = '#FFA500'; this.maxSpeed = 14; this.acceleration = 3.0;
                this.skills = {
                    groundE: { name: 'Rasengan', startup: 15, active: 20, recovery: 20, damage: 12, knockback: {x: 10, y: -4}, hitstun: 35, width: 90, height: 50, cost: 17, cd: 80 }, 
                    groundQ: { name: 'CloneLauncher', startup: 10, active: 15, recovery: 20, damage: 10, knockback: {x: 0, y: -25}, hitstun: 50, width: 60, height: 120, cost: 15, cd: 90 }, 
                    crouchE: { name: 'Substitution', startup: 5, active: 60, recovery: 10, damage: 0, hitstun: 0, width: 0, height: 0, cost: 20, cd: 150 }, 
                    crouchQ: { name: 'Rasenshuriken', startup: 25, active: 10, recovery: 20, damage: 4, hitstun: 20, width: 0, height: 0, cost: 25, cd: 120 },
                    airE: { name: 'AerialShuriken', startup: 10, active: 10, recovery: 15, damage: 8, hitstun: 20, width: 0, height: 0, cost: 12, cd: 45 },
                    airQ: { name: 'AerialCloneSlam', startup: 15, active: 15, recovery: 20, damage: 12, knockback: {x: 0, y: 20}, hitstun: 50, width: 0, height: 0, cost: 15, cd: 90 } 
                };
                break;
        }
    }

    draw(c) {
        c.save();
        c.translate(this.position.x + this.width / 2, this.position.y + this.height);
        c.scale(this.scaleX, this.scaleY);
        c.translate(-(this.position.x + this.width / 2), -(this.position.y + this.height));
        
        if (this.iFrames > 0 && Math.floor(Date.now() / 50) % 2 === 0) { c.globalAlpha = 0.5; }
        
        this.drawSegmentedBody(c, this.color, this.position.x + this.width/2, this.position.y, this.facingRight ? 1 : -1);
        
        c.fillStyle = this.isEnemy ? '#FF4500' : '#00BFFF';
        c.font = '10px "Press Start 2P"';
        c.textAlign = 'center';
        c.fillText(this.isEnemy ? 'CPU' : 'P1', this.position.x + this.width/2, this.position.y - 25);
        c.beginPath(); c.moveTo(this.position.x + this.width/2 - 5, this.position.y - 18);
        c.lineTo(this.position.x + this.width/2 + 5, this.position.y - 18);
        c.lineTo(this.position.x + this.width/2, this.position.y - 10); c.fill();
        
        c.restore();
    }

    drawSegmentedBody(c, drawColor, cx, top, dir) {
        let t_shoulderY = top + 25; let t_hipY = top + 80;
        
        if (this.isCrouching && !this.isAttacking) { t_shoulderY += 20; t_hipY += 20; }
        const breathe = (this.onGround && Math.abs(this.velocity.x) < 1 && !this.isAttacking && !this.isCrouching) ? Math.sin(Date.now() / 200) * 3 : 0;
        t_shoulderY += breathe;

        let t_fElbow = {x: cx + 15*dir, y: t_shoulderY + 20}; let t_fHand = {x: cx + 25*dir, y: t_shoulderY - 5};
        let t_bElbow = {x: cx - 10*dir, y: t_shoulderY + 15}; let t_bHand = {x: cx + 5*dir, y: t_shoulderY + 5};
        let t_fKnee = {x: cx + 15*dir, y: t_hipY + 20}; let t_fFoot = {x: cx + 20*dir, y: t_hipY + 50};
        let t_bKnee = {x: cx - 10*dir, y: t_hipY + 20}; let t_bFoot = {x: cx - 5*dir, y: t_hipY + 50};

        if (this.isBlocking) {
            t_fElbow = {x: cx + 15*dir, y: t_shoulderY + 25}; t_fHand = {x: cx + 20*dir, y: t_shoulderY - 10};
            t_bElbow = {x: cx - 5*dir, y: t_shoulderY + 20}; t_bHand = {x: cx + 10*dir, y: t_shoulderY - 5};
            c.fillStyle = this.blockTimer <= 15 ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 191, 255, 0.3)';
            c.beginPath(); c.arc(cx + 15*dir, t_shoulderY, 40, 0, Math.PI*2); c.fill();
        } 
        else if (this.isAttacking) {
            const atk = this.currentAttack;
            if (atk === this.attacks.sweep) {
                t_shoulderY += 30; t_hipY += 30;
                t_fKnee = {x: cx + 30*dir, y: t_hipY + 10}; t_fFoot = {x: cx + 60*dir, y: t_hipY + 15}; 
                t_bKnee = {x: cx - 20*dir, y: t_hipY + 20}; t_bFoot = {x: cx - 10*dir, y: t_hipY + 30}; 
                t_fElbow = {x: cx + 10*dir, y: t_shoulderY + 20}; t_fHand = {x: cx + 20*dir, y: t_shoulderY + 40}; 
            } 
            else if (atk === this.attacks.air) {
                t_fKnee = {x: cx + 20*dir, y: t_hipY + 30}; t_fFoot = {x: cx + 40*dir, y: t_hipY + 60}; 
                t_bKnee = {x: cx - 10*dir, y: t_hipY + 10}; t_bFoot = {x: cx - 20*dir, y: t_hipY - 10}; 
                t_fElbow = {x: cx + 20*dir, y: t_shoulderY - 10}; t_fHand = {x: cx + 30*dir, y: t_shoulderY - 30}; 
            }
            else if (atk.name === 'MeteorSmash') {
                t_shoulderY += 20; 
                t_fElbow = {x: cx + 20*dir, y: t_shoulderY + 10}; t_fHand = {x: cx + 30*dir, y: t_shoulderY + 20}; 
                t_fKnee = {x: cx + 20*dir, y: t_hipY + 20}; t_fFoot = {x: cx + 40*dir, y: t_hipY + 20};
            }
            else {
                if (this.attackState === 'startup') {
                    let prog = Math.min(1, this.attackFrame / atk.startup);
                    let ease = prog < 0.5 ? 2 * prog * prog : 1 - Math.pow(-2 * prog + 2, 2) / 2;
                    t_fElbow.x -= 30 * dir * ease; t_fElbow.y -= 15 * ease;
                    t_fHand.x -= 50 * dir * ease; t_fHand.y -= 10 * ease;
                } else if (this.attackState === 'active') {
                    let prog = Math.min(1, (this.attackFrame - atk.startup) / atk.active);
                    let ease = prog === 1 ? 1 : 1 - Math.pow(2, -10 * prog); 
                    let extension = 1 + Math.sin(ease * Math.PI) * 0.2; // Overshoot
                    t_fElbow = {x: cx + 30*dir*extension, y: t_shoulderY + 5}; 
                    t_fHand = {x: cx + 60*dir*extension, y: t_shoulderY + 5};
                    t_bElbow = {x: cx - 20*dir, y: t_shoulderY + 15}; t_bHand = {x: cx - 10*dir, y: t_shoulderY + 30};
                } else {
                    let prog = Math.min(1, (this.attackFrame - atk.startup - atk.active) / atk.recovery);
                    let ease = prog === 1 ? 1 : 1 - Math.pow(2, -10 * prog);
                    t_fElbow = {x: cx + (30 - 10*ease)*dir, y: t_shoulderY + 5 + 10*ease}; 
                    t_fHand = {x: cx + (60 - 25*ease)*dir, y: t_shoulderY + 5};
                }
            }
        }
        else if (this.substituteActive > 0) {
            t_fElbow = {x: cx + 5*dir, y: t_shoulderY + 20}; t_fHand = {x: cx + 15*dir, y: t_shoulderY};
            t_bElbow = {x: cx - 5*dir, y: t_shoulderY + 20}; t_bHand = {x: cx + 5*dir, y: t_shoulderY};
        }
        else if (!this.onGround) {
            if (this.characterType === 'Gojo') {
                t_fKnee = {x: cx + 15*dir, y: t_hipY + 10}; t_fFoot = {x: cx + 10*dir, y: t_hipY + 40};
                t_bKnee = {x: cx - 10*dir, y: t_hipY + 15}; t_bFoot = {x: cx - 5*dir, y: t_hipY + 40};
            } else if (this.characterType === 'Naruto') {
                t_fKnee = {x: cx + 25*dir, y: t_hipY - 25}; t_fFoot = {x: cx + 15*dir, y: t_hipY + 10};
                t_bKnee = {x: cx - 25*dir, y: t_hipY - 15}; t_bFoot = {x: cx - 15*dir, y: t_hipY + 10};
            } else {
                t_fKnee = {x: cx + 25*dir, y: t_hipY - 5}; t_fFoot = {x: cx + 15*dir, y: t_hipY + 20};
                t_bKnee = {x: cx - 15*dir, y: t_hipY + 15}; t_bFoot = {x: cx - 10*dir, y: t_hipY + 40};
            }
        } 
        else if (Math.abs(this.velocity.x) > 1 && this.hitstunFrames === 0 && !this.isCrouching && this.characterType !== 'Gojo' && this.characterType !== 'Goku' && this.characterType !== 'Naruto') {
            const cycle = Date.now() / 80;
            t_fKnee = {x: cx + Math.sin(cycle)*30, y: t_hipY + 20}; t_fFoot = {x: cx + Math.sin(cycle)*40, y: t_hipY + 50};
            t_bKnee = {x: cx - Math.sin(cycle)*30, y: t_hipY + 20}; t_bFoot = {x: cx - Math.sin(cycle)*40, y: t_hipY + 50};
        } 
        else if (this.isCrouching) {
            if (this.characterType === 'Gojo') {
                t_fKnee = {x: cx + 15*dir, y: t_hipY - 10}; t_fFoot = {x: cx + 15*dir, y: t_hipY + 30}; 
                t_bKnee = {x: cx - 15*dir, y: t_hipY - 10}; t_bFoot = {x: cx - 15*dir, y: t_hipY + 30};
            } else if (this.characterType === 'Goku') {
                t_shoulderY += 20; t_hipY += 15;
                t_fKnee = {x: cx + 25*dir, y: t_hipY - 15}; t_fFoot = {x: cx + 30*dir, y: t_hipY + 15}; 
                t_bKnee = {x: cx - 20*dir, y: t_hipY - 15}; t_bFoot = {x: cx - 20*dir, y: t_hipY + 15};
            } else if (this.characterType === 'Naruto') {
                t_shoulderY += 25; t_hipY += 20;
                t_fElbow = {x: cx + 15*dir, y: t_shoulderY + 20}; t_fHand = {x: cx + 25*dir, y: t_hipY + 30}; 
                t_fKnee = {x: cx + 20*dir, y: t_hipY - 20}; t_fFoot = {x: cx + 15*dir, y: t_hipY + 10}; 
                t_bKnee = {x: cx - 20*dir, y: t_hipY - 20}; t_bFoot = {x: cx - 20*dir, y: t_hipY + 10};
            } else {
                t_fKnee = {x: cx + 20*dir, y: t_hipY - 10}; t_fFoot = {x: cx + 20*dir, y: t_hipY + 30}; 
                t_bKnee = {x: cx - 10*dir, y: t_hipY - 10}; t_bFoot = {x: cx - 10*dir, y: t_hipY + 30};
            }
        }
        else {
            const walkCycle = (Math.abs(this.velocity.x) > 1 && this.onGround) ? Math.sin(Date.now() / 80) : 0;
            if (this.characterType === 'Gojo') {
                t_fElbow = {x: cx + 10*dir, y: t_shoulderY + 25}; t_fHand = {x: cx + 10*dir, y: t_hipY - 5}; 
                t_bElbow = {x: cx - 15*dir, y: t_shoulderY + 20}; t_bHand = {x: cx - 5*dir, y: t_shoulderY + 10}; 
                t_fKnee = {x: cx + walkCycle*30 + 5*dir, y: t_hipY + 25 - Math.abs(walkCycle)*10}; 
                t_fFoot = {x: cx + walkCycle*40 + 5*dir, y: t_hipY + 50}; 
                t_bKnee = {x: cx - walkCycle*30 - 5*dir, y: t_hipY + 25 - Math.abs(walkCycle)*10}; 
                t_bFoot = {x: cx - walkCycle*40 - 5*dir, y: t_hipY + 50};
            } else if (this.characterType === 'Goku') {
                t_shoulderY += 5; t_hipY += 10;
                t_fElbow = {x: cx + 25*dir, y: t_shoulderY + 20}; t_fHand = {x: cx + 35*dir, y: t_shoulderY}; 
                t_bElbow = {x: cx - 20*dir, y: t_shoulderY + 15}; t_bHand = {x: cx - 10*dir, y: t_shoulderY - 5}; 
                if (Math.abs(this.velocity.x) > 1 && this.onGround) { t_shoulderY += 10; t_hipY += 10; }
                t_fKnee = {x: cx + walkCycle*35 + 15*dir, y: t_hipY + 20 - Math.abs(walkCycle)*15}; 
                t_fFoot = {x: cx + walkCycle*45 + 15*dir, y: t_hipY + 40}; 
                t_bKnee = {x: cx - walkCycle*35 - 15*dir, y: t_hipY + 20 - Math.abs(walkCycle)*15}; 
                t_bFoot = {x: cx - walkCycle*45 - 15*dir, y: t_hipY + 40}; 
            } else if (this.characterType === 'Naruto') {
                t_shoulderY += 15; t_hipY += 5;
                if (Math.abs(this.velocity.x) > 1 && this.onGround) {
                    t_shoulderY += 10; 
                    t_fElbow = {x: cx - 20*dir, y: t_shoulderY + 10}; t_fHand = {x: cx - 40*dir, y: t_shoulderY};
                    t_bElbow = {x: cx - 25*dir, y: t_shoulderY + 5}; t_bHand = {x: cx - 45*dir, y: t_shoulderY - 5};
                } else {
                    t_fElbow = {x: cx + 20*dir, y: t_shoulderY + 20}; t_fHand = {x: cx + 30*dir, y: t_shoulderY + 5}; 
                    t_bElbow = {x: cx - 15*dir, y: t_shoulderY + 20}; t_bHand = {x: cx - 25*dir, y: t_shoulderY + 10}; 
                }
                t_fKnee = {x: cx + walkCycle*35 + 10*dir, y: t_hipY + 20 - Math.abs(walkCycle)*10};
                t_fFoot = {x: cx + walkCycle*40 + 10*dir, y: t_hipY + 45};
                t_bKnee = {x: cx - walkCycle*35 - 10*dir, y: t_hipY + 20 - Math.abs(walkCycle)*10};
                t_bFoot = {x: cx - walkCycle*40 - 10*dir, y: t_hipY + 45};
            }
        }

        if (!this.joints) {
            this.joints = {
                fElbow: t_fElbow, fHand: t_fHand, bElbow: t_bElbow, bHand: t_bHand,
                fKnee: t_fKnee, fFoot: t_fFoot, bKnee: t_bKnee, bFoot: t_bFoot,
                shoulderY: t_shoulderY, hipY: t_hipY
            };
        } else {
            let dt = window.dt || 1;
            let amt = 1 - Math.pow(1 - 0.4, dt);
            const blend = (curr, targ) => { curr.x = lerp(curr.x, targ.x, amt); curr.y = lerp(curr.y, targ.y, amt); };
            blend(this.joints.fElbow, t_fElbow); blend(this.joints.fHand, t_fHand);
            blend(this.joints.bElbow, t_bElbow); blend(this.joints.bHand, t_bHand);
            blend(this.joints.fKnee, t_fKnee); blend(this.joints.fFoot, t_fFoot);
            blend(this.joints.bKnee, t_bKnee); blend(this.joints.bFoot, t_bFoot);
            this.joints.shoulderY = lerp(this.joints.shoulderY, t_shoulderY, amt);
            this.joints.hipY = lerp(this.joints.hipY, t_hipY, amt);
        }

        const j = this.joints;

        if (this.awakeningActive && this.characterType === 'Naruto') {
            c.strokeStyle = 'rgba(255, 140, 0, 0.6)'; c.lineWidth = 6;
            const time = Date.now() / 150;
            for(let i=0; i<3; i++) {
                c.beginPath(); c.moveTo(cx, j.hipY);
                c.quadraticCurveTo(cx - 40*dir, j.hipY - 20 + Math.sin(time + i)*15, cx - 60*dir + Math.cos(time + i)*10, j.shoulderY + i*15);
                c.stroke();
            }
        }

        drawLimb(c, cx, j.shoulderY, cx, j.hipY, 8, drawColor); 
        
        if (this.awakeningActive && this.characterType === 'Naruto') {
            c.strokeStyle = 'rgba(255, 140, 0, 0.8)'; c.lineWidth = 12; c.lineCap = 'round';
            c.beginPath(); c.moveTo(cx, j.shoulderY - 5); c.lineTo(cx, j.hipY + 5); c.stroke();
        }

        c.fillStyle = this.hitstunFrames > 0 ? 'red' : '#fff';
        if (this.awakeningActive && this.characterType === 'Goku') c.fillStyle = '#FFE135'; 
        c.beginPath(); c.arc(cx, j.shoulderY - 18, 16, 0, Math.PI*2); c.fill(); c.stroke(); 

        if (this.awakeningActive && this.characterType === 'Goku') {
            c.fillStyle = '#FFE135'; c.strokeStyle = '#DAA520'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(cx - 10, j.shoulderY - 30);
            c.lineTo(cx - 20, j.shoulderY - 60); c.lineTo(cx - 5, j.shoulderY - 45);
            c.lineTo(cx, j.shoulderY - 70); c.lineTo(cx + 5, j.shoulderY - 45);
            c.lineTo(cx + 20, j.shoulderY - 60); c.lineTo(cx + 10, j.shoulderY - 30);
            c.closePath(); c.fill(); c.stroke();
            if (Math.random() < 0.2) {
                c.strokeStyle = 'cyan'; c.lineWidth = 2; c.beginPath();
                c.moveTo(cx + (Math.random()-0.5)*80, j.hipY - Math.random()*100); c.lineTo(cx + (Math.random()-0.5)*80, j.hipY - Math.random()*100); c.stroke();
            }
        }

        drawLimb(c, cx, j.shoulderY, j.bElbow.x, j.bElbow.y, 6, drawColor); drawLimb(c, j.bElbow.x, j.bElbow.y, j.bHand.x, j.bHand.y, 5, drawColor);
        drawLimb(c, cx, j.hipY, j.bKnee.x, j.bKnee.y, 7, drawColor); drawLimb(c, j.bKnee.x, j.bKnee.y, j.bFoot.x, j.bFoot.y, 6, drawColor);
        drawLimb(c, cx, j.shoulderY, j.fElbow.x, j.fElbow.y, 6, drawColor); drawLimb(c, j.fElbow.x, j.fElbow.y, j.fHand.x, j.fHand.y, 5, drawColor);
        drawLimb(c, cx, j.hipY, j.fKnee.x, j.fKnee.y, 7, drawColor); drawLimb(c, j.fKnee.x, j.fKnee.y, j.fFoot.x, j.fFoot.y, 6, drawColor);

        if (this.infinityActive > 0) {
            c.strokeStyle = 'rgba(148, 0, 211, 0.4)'; c.lineWidth = 4;
            c.beginPath(); c.arc(cx, j.shoulderY + 20, 70, 0, Math.PI*2); c.stroke();
        }
        if (this.isAttacking && this.currentAttack && this.currentAttack.name) {
            this.drawSkillVFX(c, j.fHand, dir);
        }
    }

    drawSkillVFX(c, handPos, dir) {
        c.save();
        const atk = this.currentAttack;
        if (this.characterType === 'Gojo') {
            if (atk.name === 'HollowPurple' && this.attackState === 'startup') {
                const p = this.attackFrame / atk.startup; const radius = lerp(40, 5, p); const angle = p * Math.PI * 4;
                c.fillStyle = 'red'; c.beginPath(); c.arc(handPos.x + Math.cos(angle)*radius, handPos.y + Math.sin(angle)*radius, 12, 0, Math.PI*2); c.fill();
                c.fillStyle = 'blue'; c.beginPath(); c.arc(handPos.x + Math.cos(angle + Math.PI)*radius, handPos.y + Math.sin(angle + Math.PI)*radius, 12, 0, Math.PI*2); c.fill();
            } else if (atk.name === 'LapseBlue' && this.attackState === 'startup') {
                c.fillStyle = 'rgba(0, 0, 255, 0.8)';
                c.beginPath(); c.arc(handPos.x, handPos.y, (this.attackFrame / atk.startup) * 20, 0, Math.PI*2); c.fill();
            } else if (atk.name === 'ReversalRed' && this.attackState === 'active') {
                const p = this.attackFrame / atk.active;
                c.fillStyle = `rgba(255, 0, 0, ${1 - p})`; c.beginPath(); c.arc(handPos.x + 30*dir, handPos.y, 60, 0, Math.PI*2); c.fill();
            }
        }  
        else if (this.characterType === 'Goku') {
            if (atk.name === 'Kamehameha' || atk.name === 'AirKamehameha') {
                if (this.attackState === 'startup') {
                    const p = this.attackFrame / atk.startup;
                    c.fillStyle = `rgba(0, 191, 255, ${p})`; c.beginPath(); c.arc(handPos.x, handPos.y, p * 30, 0, Math.PI*2); c.fill();
                    if (Math.random() < 0.5) spawnHitParticles({x: handPos.x + (Math.random()-0.5)*100, y: handPos.y + (Math.random()-0.5)*100}, 'cyan', 1, -0.5);
                } else if (this.attackState === 'active') {
                    c.translate(handPos.x, handPos.y);
                    if (atk.name === 'AirKamehameha') c.rotate(dir * Math.PI / 4); 
                    const isBig = this.awakeningActive ? 3 : 1;
                    const beamHeight = (60 + Math.random() * 20) * isBig;
                    c.fillStyle = 'rgba(0, 191, 255, 0.8)'; c.fillRect(0, -beamHeight/2, dir * canvas.width, beamHeight);
                    c.fillStyle = 'white'; c.fillRect(0, -15 * isBig, dir * canvas.width, 30 * isBig);
                    triggerShake(3 * isBig);
                }
            } else if (atk.name === 'InstantTransmission' && this.attackState === 'startup') {
                c.fillStyle = `rgba(255, 255, 255, ${1 - (this.attackFrame / atk.startup)})`;
                c.fillRect(this.position.x - 10, this.position.y, this.width + 20, this.height);
            } else if (atk.name === 'DragonDive' && this.attackState === 'active') {
                c.strokeStyle = 'rgba(255, 140, 0, 0.8)'; c.lineWidth = 15; c.beginPath();
                c.moveTo(this.position.x + this.width/2 - this.velocity.x*2, this.position.y + this.height/2 - this.velocity.y*2);
                c.lineTo(this.position.x + this.width/2, this.position.y + this.height/2); c.stroke();
            }
        }
        else if (this.characterType === 'Naruto') {
            if (atk.name === 'Rasengan' && (this.attackState === 'startup' || this.attackState === 'active')) {
                c.translate(handPos.x + 10*dir, handPos.y); c.rotate(Date.now() / 20);
                c.fillStyle = 'rgba(0, 255, 255, 0.9)'; c.beginPath(); c.arc(0, 0, 25, 0, Math.PI*2); c.fill();
                c.strokeStyle = 'white'; c.lineWidth = 3;
                for(let i=0; i<4; i++) { c.beginPath(); c.arc(0, 0, 20, i*Math.PI/2, i*Math.PI/2 + Math.PI/3); c.stroke(); }
            } else if (atk.name === 'Rasenshuriken' && this.attackState === 'startup') {
                c.translate(handPos.x + 10*dir, handPos.y); c.rotate(Date.now() / 10);
                c.fillStyle = 'rgba(0, 191, 255, 0.8)'; c.beginPath(); c.arc(0, 0, 20, 0, Math.PI*2); c.fill();
                c.strokeStyle = 'white'; c.lineWidth = 4;
                c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, 0); c.stroke();
                c.beginPath(); c.moveTo(0, -30); c.lineTo(0, 30); c.stroke();
            }
        }
        c.restore();
    }

    update() {
        if (this.isDead) return;

        this.inputBuffer = this.inputBuffer.filter(i => i.timer-- > 0); 

        if (this.iFrames > 0) this.iFrames--;
        if (this.skillCooldown > 0) this.skillCooldown--;
        if (this.comboTimer > 0) this.comboTimer--; else this.comboCount = 0;
        if (this.infinityActive > 0) this.infinityActive--;
        if (this.substituteActive > 0) this.substituteActive--;
        
        this.scaleX = lerp(this.scaleX, 1, 0.15); this.scaleY = lerp(this.scaleY, 1, 0.15);

        if (this.awakeningActive) {
            this.awakeningTimer--;
            if (this.awakeningTimer <= 0) this.awakeningActive = false;
            
            if (this.characterType === 'Goku') { this.damageMult = 1.4; this.cdMult = 0.4; this.speedMult = 2.2; }
            else if (this.characterType === 'Naruto') { 
                this.speedMult = 1.6; this.cdMult = 0.2; 
                if (this.health > 0 && this.health < 60) this.health = Math.min(60, this.health + 0.05);
            }
            else { this.damageMult = 1; this.cdMult = 1; this.speedMult = 1; }
        } else {
            this.damageMult = 1; this.cdMult = 1; this.speedMult = 1;
        }

        if (this.hitstunFrames > 0 && this.health <= 50 && Math.random() < 0.1 && window.groundDecals) {
            window.groundDecals.push({ x: this.position.x + this.width/2, life: 1000 });
        }

        if (globalState.domainExpansion > 0 && globalState.domainOwner !== this) {
            this.speedMult = 0; 
            this.hitstunFrames = 5; 
            this.isAttacking = false; 
            this.attackState = null; 
            this.velocity.x = 0; 
            if (this.onGround) this.velocity.y = 0;
            if (Math.random() < 0.2) spawnHitParticles(this.position, 'black', 1);
        }

        if (this.isCinematic) {
            this.cinematicFrame++;
            const target = this.cinematicTarget;
            target.hitstunFrames = 5; target.velocity.x = 0; target.velocity.y = 0;
            
            if (this.cinematicFrame % 10 === 0 && this.cinematicFrame < 50) {
                this.position.x = target.position.x + (Math.random() > 0.5 ? 50 : -50);
                this.position.y = target.position.y + (Math.random() > 0.5 ? -30 : 20);
                this.facingRight = this.position.x < target.position.x;
                spawnHitParticles(target.position, 'yellow', 10);
                triggerShake(15); target.health -= (2 * this.damageMult);
                globalState.hitstop = 4; globalState.flashWhite = 0.5; 
            }
            if (this.cinematicFrame === 60) {
                this.position.x = target.position.x - 60; this.position.y = target.position.y - 20; this.facingRight = true;
                target.health -= (10 * this.damageMult); target.velocity.x = 30; target.velocity.y = -5; target.hitstunFrames = 60;
                spawnHitParticles(target.position, 'red', 40, 4); 
                triggerShake(40); globalState.hitstop = 15; globalState.flashWhite = 1.0; 
                if (window.visualEffects) window.visualEffects.push({ type: 'speed_lines', timer: 20 });
                this.isCinematic = false; this.attackState = null; this.isAttacking = false;
            }
            return; 
        }

        const exhaustPenalty = this.stamina < 20 ? 0.4 : 1.0; 
        if (this.hitstunFrames > 0) {
            this.hitstunFrames--; this.isAttacking = false; this.isBlocking = false;
        }

        if (this.keys.block && this.hitstunFrames === 0 && !this.isAttacking && this.onGround) {
            this.isBlocking = true; this.blockTimer++;
        } else {
            this.isBlocking = false; this.blockTimer = 0;
        }

        this.isCrouching = this.keys.down && this.onGround && !this.isAttacking && !this.isBlocking;
        const canAct = this.hitstunFrames === 0 && !this.isAttacking && !this.isBlocking && !this.isCinematic && !this.isDead;

        if (canAct && !this.isCrouching) {
            if (this.keys.right) { this.velocity.x += (this.acceleration * exhaustPenalty * this.speedMult) * window.dt; this.facingRight = true; } 
            else if (this.keys.left) { this.velocity.x -= (this.acceleration * exhaustPenalty * this.speedMult) * window.dt; this.facingRight = false; } 
            else { this.velocity.x *= Math.pow(FRICTION, window.dt); }

            if (this.keys.up && this.onGround) {
                this.velocity.y = this.jumpPower; this.scaleX = 0.7; this.scaleY = 1.4; this.onGround = false;
            }
        } else {
            this.velocity.x *= Math.pow(FRICTION, window.dt); 
        }

        const currentMaxSpeed = this.maxSpeed * exhaustPenalty * this.speedMult;
        if (this.velocity.x > currentMaxSpeed) this.velocity.x = currentMaxSpeed;
        if (this.velocity.x < -currentMaxSpeed) this.velocity.x = -currentMaxSpeed;
        if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;

        this.velocity.y += GRAVITY * window.dt;
        this.position.x += this.velocity.x * window.dt;
        this.position.y += this.velocity.y * window.dt;

        if (this.position.y + this.height >= canvas.height - 50) {
            if (!this.onGround && this.velocity.y > 0) {
                this.scaleX = 1.3; this.scaleY = 0.7; spawnHitParticles({x: this.position.x + this.width/2, y: canvas.height - 50}, '#aaa', 5);
            }
            this.velocity.y = 0; this.position.y = canvas.height - 50 - this.height; this.onGround = true;
        } else { this.onGround = false; }
        
        const WORLD_WIDTH = canvas.width * 3;
        if (this.position.x <= 0) this.position.x = 0;
        if (this.position.x + this.width >= WORLD_WIDTH) this.position.x = WORLD_WIDTH - this.width;

        // INPUT BUFFER EXECUTION
        if (canAct && this.inputBuffer.length > 0) {
            let consumed = null;
            for (let i = 0; i < this.inputBuffer.length; i++) {
                const inp = this.inputBuffer[i].key;
                
                if (inp === 'awaken') {
                    if (this.awakening >= 100 && this.health <= 40 && !this.awakeningActive) {
                        this.awakeningActive = true; this.awakening = 0; this.awakeningTimer = 600;
                        window.globalState.awakeningCutscene = { timer: 120, character: this };
                        consumed = i; break;
                    }
                }
                else if (inp === 'skill1' && this.skillCooldown === 0) {
                    let chosen = this.isCrouching ? this.skills.crouchE : (!this.onGround ? this.skills.airE : this.skills.groundE);
                    if (chosen && this.stamina >= chosen.cost) { this.stamina -= chosen.cost; this.skillCooldown = chosen.cd * this.cdMult; this.startAttack(chosen); consumed = i; break; }
                }
                else if (inp === 'skill2' && this.skillCooldown === 0) {
                    let chosen = this.isCrouching ? this.skills.crouchQ : (!this.onGround ? this.skills.airQ : this.skills.groundQ);
                    if (chosen && this.stamina >= chosen.cost) { this.stamina -= chosen.cost; this.skillCooldown = chosen.cd * this.cdMult; this.startAttack(chosen); consumed = i; break; }
                }
                else if (inp === 'attack') {
                    if (this.awakeningActive && this.characterType === 'Goku') {
                        const target = this.isEnemy ? player : enemy;
                        if (Math.abs(target.position.x - this.position.x) > 80) {
                            this.position.x = target.position.x - (target.facingRight ? -60 : 60); this.position.y = target.position.y;
                            this.facingRight = target.position.x > this.position.x;
                            spawnHitParticles(this.position, 'white', 10);
                        }
                    }
                    if (!this.onGround && this.stamina >= this.attacks.air.cost) { this.stamina -= this.attacks.air.cost; this.startAttack(this.attacks.air); consumed = i; break; }
                    else if (this.isCrouching && this.stamina >= this.attacks.sweep.cost) { this.stamina -= this.attacks.sweep.cost; this.startAttack(this.attacks.sweep); consumed = i; break; }
                    else if (this.stamina >= this.attacks.light.cost) { this.stamina -= this.attacks.light.cost; this.startAttack(this.attacks.light); consumed = i; break; }
                }
            }
            if (consumed !== null) this.inputBuffer.splice(consumed, 1);
        }
        
        if (this.isAttacking) this.processAttack();
    }

    startAttack(attackObj) {
        if (window.AudioManager) window.AudioManager.playWhoosh();
        this.isAttacking = true; this.currentAttack = attackObj; this.attackFrame = 0; this.skillFired = false;
        this.attackState = 'startup'; this.hasHit = false; 
        
        this.attackBox.width = this.currentAttack.width; this.attackBox.height = this.currentAttack.height;
        if (this.awakeningActive && this.characterType === 'Goku' && (attackObj.name === 'Kamehameha' || attackObj.name === 'AirKamehameha')) {
            this.attackBox.height *= 3; 
        }
    }

    processAttack() {
        let animSpd = this.speedMult;
        if (globalState.domainExpansion > 0 && globalState.domainOwner !== this) animSpd = 0.2;
        this.attackFrame += animSpd;
        const atk = this.currentAttack;

        if (this.attackState === 'active') {
            if (atk.name === 'Rasengan') this.velocity.x = this.facingRight ? (20 * this.speedMult) : (-20 * this.speedMult); 
            if (atk === this.attacks.air) { this.velocity.y = 10; this.velocity.x = this.facingRight ? 10 : -10; } 
            if (atk.name === 'DragonDive') {
                this.velocity.x = this.facingRight ? (18 * this.speedMult) : (-18 * this.speedMult);
                this.velocity.y = 15 * this.speedMult;
            }
        }

        if (this.attackFrame <= atk.startup) {
            this.attackState = 'startup';
        } else if (this.attackFrame <= atk.startup + atk.active) {
            this.attackState = 'active';
            
            if (atk.name === 'KiBlastVolley' && Math.floor(this.attackFrame) % 6 === 0) {
                window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 30 + (Math.random()-0.5)*20 }, velocity: { x: this.facingRight ? 20 : -20, y: (Math.random()-0.5)*2 }, radius: 10, color: 'yellow', damage: 5 * this.damageMult, owner: this }));
            }

            if (!this.skillFired) {
                this.skillFired = true;
                if (atk.name === 'BlackSlash') {
                    window.activeProjectiles.push(new Projectile({
                        position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 20 },
                        velocity: { x: this.facingRight ? 18 : -18, y: 0 },
                        radius: 50, color: 'black', damage: 15 * this.damageMult, owner: this, type: 'black_slash', life: 120
                    }));
                    triggerShake(5);
                } else if (atk.name === 'HollowPurple') {
                    window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 40 }, velocity: { x: this.facingRight ? 15 : -15, y: 0 }, radius: 40, color: '#9400D3', damage: 25 * this.damageMult, owner: this }));
                    triggerShake(10);
                } else if (atk.name === 'LapseBlue') {
                    window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? 200 : -200), y: this.position.y + 40 }, velocity: { x: 0, y: 0 }, radius: 50, color: 'blue', damage: 2 * this.damageMult, owner: this, type: 'gravity', life: 180 }));
                } else if (atk.name === 'Infinity') {
                    this.infinityActive = 180; spawnHitParticles(this.position, 'purple', 30);
                } else if (atk.name === 'ReversalRed') {
                    spawnHitParticles({x: this.position.x + (this.facingRight?this.width:-20), y: this.position.y + 30}, 'red', 40, 4);
                    triggerShake(15);
                    this.attackBox.position.x = this.position.x + (this.facingRight ? 20 : -80);
                    this.attackBox.position.y = this.position.y;
                } else if (atk.name === 'AerialPurple') {
                    window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 40 }, velocity: { x: this.facingRight ? 12 : -12, y: 12 }, radius: 30, color: '#9400D3', damage: 20 * this.damageMult, owner: this }));
                    this.velocity.y = -5; this.velocity.x = this.facingRight ? -5 : 5; 
                    triggerShake(5);
                } else if (atk.name === 'WarpStrike') {
                    const target = this.isEnemy ? player : enemy;
                    const origX = this.position.x; const origY = this.position.y;
                    this.position.x = target.position.x + (target.facingRight ? -40 : target.width + 40);
                    this.position.y = target.position.y;
                    this.facingRight = target.facingRight; 
                    window.visualEffects.push({ type: 'speed_blitz', startX: origX, startY: origY, endX: this.position.x, endY: this.position.y, color: '#9400D3', timer: 15, maxTimer: 15, attacker: this, dir: this.facingRight ? 1 : -1 });
                    spawnHitParticles(this.position, 'blue', 20);
                } else if (atk.name === 'Substitution') {
                    this.substituteActive = 60; spawnHitParticles(this.position, 'white', 10);
                } else if (atk.name === 'Shuriken' || atk.name === 'AerialShuriken') {
                    for(let i=0; i<3; i++) {
                        window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 40 }, velocity: { x: this.facingRight ? 12 : -12, y: atk.name === 'AerialShuriken' ? 6+(i*4) : -4+(i*4) }, radius: 15, color: '#E0E0E0', damage: 8 * this.damageMult, owner: this, type: 'shuriken', life: 60 }));
                    }
                } else if (atk.name === 'Rasenshuriken') {
                    window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 30 }, velocity: { x: this.facingRight ? 6 : -6, y: 0 }, radius: 40, color: '#00BFFF', damage: 3 * this.damageMult, owner: this, type: 'rasenshuriken', life: 200 }));
                } else if (atk.name === 'AerialCloneSlam') {
                    const target = this.isEnemy ? player : enemy;
                    window.visualEffects.push({ type: 'clone_slam', position: { x: target.position.x, y: target.position.y - 150 }, target: target, timer: 30, dir: this.facingRight ? 1 : -1, attacker: this });
                } else if (atk.name === 'InstantTransmission') {
                    const target = this.isEnemy ? player : enemy;
                    const origX = this.position.x; const origY = this.position.y;
                    this.position.x = target.position.x; this.position.y = target.position.y - 150;
                    this.velocity.y = 5; this.velocity.x = 0; 
                    window.visualEffects.push({ type: 'speed_blitz', startX: origX, startY: origY, endX: this.position.x, endY: this.position.y, color: 'white', timer: 12, maxTimer: 12, attacker: this, dir: this.facingRight ? 1 : -1 });
                    spawnHitParticles(this.position, 'white', 20);
                }
            }

            if (atk.name !== 'InstantTransmission' && atk.name !== 'CloneLauncher' && atk.name !== 'AirKamehameha' && atk.name !== 'WarpStrike' && atk.name !== 'AerialCloneSlam' && atk.name !== 'AerialCrowSlam' && atk.name !== 'SpinningSlash' && atk.name !== 'BlackMeteorite' && atk.name !== 'SlamDown') {
                this.attackBox.position.x = this.facingRight ? this.position.x + this.width : this.position.x - this.attackBox.width;
                this.attackBox.position.y = this.position.y + 10;
                if (atk === this.attacks.sweep) this.attackBox.position.y += 40; 
                if (atk.name === 'DragonDive') {
                    this.attackBox.position.x = this.position.x + this.width/2 - 30;
                    this.attackBox.position.y = this.position.y + this.height/2;
                }
            } else if (atk.name === 'AirKamehameha') {
                this.attackBox.position.x = this.facingRight ? this.position.x : this.position.x - 800;
                this.attackBox.position.y = this.position.y;
            } else if (atk.name === 'AerialCrowSlam' || atk.name === 'SpinningSlash' || atk.name === 'BlackMeteorite' || atk.name === 'SlamDown') {
                this.attackBox.position.x = this.position.x + this.width/2 - this.attackBox.width/2;
                this.attackBox.position.y = this.position.y + this.height/2 - this.attackBox.height/2;
            }
            if (this.awakeningActive && this.characterType === 'Goku' && (atk.name === 'Kamehameha' || atk.name === 'AirKamehameha')) {
                this.attackBox.position.y = this.position.y - 40; 
            }
        } else if (this.attackFrame <= atk.startup + atk.active + atk.recovery) {
            this.attackState = 'recovery';
        } else {
            this.isAttacking = false; this.attackState = null;
        }
    }

    takeHit(attack, attacker, direction) {
        if (this.iFrames > 0) return;

        if (this.substituteActive > 0) {
            this.substituteActive = 0; 
            spawnHitParticles(this.position, '#8B4513', 40); 
            this.position.x = attacker.position.x - (attacker.facingRight ? 80 : -80); 
            this.position.y = attacker.position.y;
            this.facingRight = !attacker.facingRight;
            this.stamina = this.maxStamina; 
            return;
        }

        const baseDamage = attack.damage || 5;
        const actualDamage = baseDamage * (attacker ? attacker.damageMult : 1);

        if (this.isBlocking) {
            if (window.AudioManager) window.AudioManager.playBlock();
            if (this.blockTimer <= 15) { 
                globalState.hitstop = 30; globalState.flashWhite = 1.0;
                if (attacker && attacker instanceof Fighter) {
                    attacker.hitstunFrames = 60; attacker.velocity.x = -direction * 10;
                }
                spawnHitParticles(this.position, 'white', 40, 3); triggerShake(15);
                this.stamina = Math.min(this.maxStamina, this.stamina + 20); 
                this.awakening = Math.min(100, this.awakening + 20); 
                return; 
            } else { 
                let mitigation = 0.2;
                if (attacker && attacker.characterType === 'Naruto' && attacker.awakeningActive && attack === attacker.attacks.light) mitigation = 0.5; 
                
                this.health -= actualDamage * mitigation; 
                this.awakening = Math.min(100, this.awakening + (actualDamage * mitigation * 1.5));

                if (attacker) attacker.awakening = Math.min(100, attacker.awakening + 2);
                this.velocity.x = (attack.knockback ? attack.knockback.x : 5) * 0.4 * direction; 
                spawnHitParticles({x: this.position.x + this.width/2, y: this.position.y + this.height/2}, '#00bfff', 8); 
                triggerShake(2); return;
            }
        }

        if (window.AudioManager) window.AudioManager.playHit();
        if (attacker) attacker.awakening = Math.min(100, attacker.awakening + 10); 

        this.health -= actualDamage;
        this.awakening = Math.min(100, this.awakening + (actualDamage * 2.0)); 
        this.hitstunFrames = attack.hitstun || 20;
        this.velocity.x = (attack.knockback ? attack.knockback.x : 5) * direction;
        this.velocity.y = (attack.knockback ? attack.knockback.y : -2);
        this.scaleX = 1.3; this.scaleY = 0.7; 

        this.comboCount++; this.comboTimer = 180;
        if (this.comboCount >= 3) {
            this.iFrames = 60; this.hitstunFrames = 0; this.comboCount = 0;
            this.velocity.x = direction * 25; this.velocity.y = -6; 
            spawnHitParticles(this.position, '#ffff00', 30); globalState.hitstop = 15; 
        } else {
            globalState.hitstop = Math.floor(actualDamage / 2);
        }

        if (actualDamage >= 12 && !this.isBlocking) {
            window.globalState.impactFrame = 4;
            globalState.hitstop = 15; // 0.25s hitstop
            triggerShake(40);
            window.visualEffects.push({ type: 'shockwave', position: { x: this.position.x + this.width/2, y: this.position.y + this.height/2 }, timer: 15 });
            spawnHitParticles({ x: this.position.x + this.width/2, y: this.position.y + this.height/2 }, attacker ? attacker.color : 'white', 50, 4);
        }

        if (this.health <= 0) { this.health = 0; this.isDead = true; }
        triggerShake(actualDamage);
        spawnHitParticles(this.position, 'white', 10); spawnHitParticles(this.position, 'red', 5);
    }

    updateAI(target) {
        if (this.hitstunFrames > 0 || this.isDead || target.isDead) return;
        
        const distanceX = target.position.x - this.position.x;
        const absDistanceX = Math.abs(distanceX);
        if (!this.isAttacking && !this.isCinematic) this.facingRight = distanceX > 0;
        
        if (this.awakening >= 100 && this.health <= 40 && !this.awakeningActive && Math.random() < 0.1) {
            this.queueInput('awaken');
        }

        if (this.isAttacking || this.isCinematic) return; 

        this.aiTimer = (this.aiTimer || 0) + 1;
        let reactionThreshold = 5; 
        if (globalState.difficulty === 'EASY') reactionThreshold = 60; // 1 second delay
        if (globalState.difficulty === 'MEDIUM') reactionThreshold = 15; // 0.25 second delay (faster reaction)

        if (this.aiTimer >= reactionThreshold) {
            this.aiTimer = 0;
            this.keys = { left: false, right: false, up: false, down: false, block: false }; // Clear only on decision frame
            
            if (target.isAttacking && target.attackState === 'startup' && absDistanceX < 300) {
                let blockChance = globalState.difficulty === 'HARD' ? 0.9 : (globalState.difficulty === 'MEDIUM' ? 0.55 : 0.05);
                if (this.stamina > 30 && Math.random() < blockChance) { 
                    this.keys.block = true; this.facingRight = distanceX > 0; return; 
                }
            } 
            
            if ((globalState.difficulty === 'HARD' || (globalState.difficulty === 'MEDIUM' && Math.random() < 0.5)) && target.attackState === 'recovery' && absDistanceX < 150) {
                this.queueInput('attack'); return;
            }

            if (absDistanceX > 150) {
                if (Math.random() < 0.05 && this.onGround) this.keys.up = true; // Random jumps for AI
                if (globalState.difficulty !== 'EASY' || Math.random() < 0.6) {
                    this.keys[distanceX > 0 ? 'right' : 'left'] = true;
                }
                let skillChance = globalState.difficulty === 'HARD' ? 0.05 : (globalState.difficulty === 'MEDIUM' ? 0.03 : 0.005);
                if (this.skillCooldown === 0 && this.stamina >= 40 && Math.random() < skillChance) {
                    if (this.characterType === 'Goku') { this.queueInput('skill2'); } 
                    else if (this.characterType === 'Gojo') { this.queueInput('skill1'); } 
                    else if (this.characterType === 'Naruto' && !this.onGround) { this.queueInput('skill1'); } 
                    else if (this.characterType === 'Itachi') { this.queueInput(Math.random() < 0.5 ? 'skill1' : 'skill2'); }
                    else if (this.characterType === 'Asta') { this.queueInput('skill2'); }
                }
            } else {
                let aggressiveChance = globalState.difficulty === 'HARD' ? 0.4 : (globalState.difficulty === 'MEDIUM' ? 0.25 : 0.05);
                if (Math.random() < aggressiveChance) {
                    if (this.skillCooldown === 0 && this.stamina >= 50 && Math.random() < 0.4) {
                        if (this.characterType === 'Goku') { this.keys.down = true; this.queueInput('skill1'); } 
                        else if (this.characterType === 'Naruto') { this.queueInput('skill2'); } 
                        else if (this.characterType === 'Asta' || this.characterType === 'Itachi') {
                            if (Math.random() < 0.4) this.keys.down = true; 
                            this.queueInput(Math.random() < 0.5 ? 'skill1' : 'skill2');
                        }
                        else { this.queueInput('skill1'); }
                    } else if (this.stamina >= 20) {
                        if (Math.random() < 0.3) this.keys.down = true; 
                        this.queueInput('attack');
                    }
                } else if (Math.random() < 0.05) {
                    this.keys[distanceX > 0 ? 'left' : 'right'] = true; 
                }
            }
        }
    }
}

class Itachi extends Fighter {
    constructor({ position, isEnemy = false }) {
        super({ position, characterType: 'Itachi', isEnemy });
        this.color = '#111';
        this.maxSpeed = 15; this.acceleration = 3.5; this.jumpPower = -17;
    }

    setupCharacter() {
        super.setupCharacter();
        this.skills = {
            groundE: { name: 'Fireball', startup: 20, active: 30, recovery: 20, damage: 22, hitstun: 40, width: 80, height: 80, cost: 20, cd: 70 }, 
            groundQ: { name: 'CrowDash', startup: 10, active: 20, recovery: 15, damage: 15, knockback: {x: 10, y: -5}, hitstun: 40, width: 60, height: 100, cost: 15, cd: 60 }, 
            crouchE: { name: 'SharinganCounter', startup: 5, active: 60, recovery: 15, damage: 0, hitstun: 0, width: 0, height: 0, cost: 20, cd: 120 }, 
            crouchQ: { name: 'Amaterasu', startup: 25, active: 10, recovery: 25, damage: 5, hitstun: 15, width: 0, height: 0, cost: 25, cd: 110 },
            airE: { name: 'PhoenixFire', startup: 15, active: 15, recovery: 20, damage: 10, hitstun: 30, width: 0, height: 0, cost: 18, cd: 70 },
            airQ: { name: 'AerialCrowSlam', startup: 15, active: 30, recovery: 20, damage: 18, knockback: {x: 0, y: -15}, hitstun: 50, width: 60, height: 60, cost: 15, cd: 80 } 
        };
    }

    drawSegmentedBody(c, color, cx, cy, dir) {
        if (this.currentAttack && this.currentAttack.name === 'CrowDash' && this.attackState === 'active') {
            c.fillStyle = 'black';
            for (let i = 0; i < 15; i++) {
                const ox = (Math.random() - 0.5) * 100;
                const oy = (Math.random() - 0.5) * 100 + 60;
                c.beginPath();
                c.moveTo(cx + ox, cy + oy);
                c.lineTo(cx + ox - 10*dir, cy + oy - 5);
                c.lineTo(cx + ox - 8*dir, cy + oy + 5);
                c.fill();
            }
            return;
        }

        super.drawSegmentedBody(c, color, cx, cy, dir);
        let t_shoulderY = cy + 25;
        let headY = cy + 10;
        if (this.isCrouching && !this.isAttacking) {
            t_shoulderY += 20;
            headY += 20;
        }

        c.fillStyle = '#111';
        c.beginPath(); c.moveTo(cx - 15*dir, t_shoulderY); c.lineTo(cx + 15*dir, t_shoulderY); 
        c.lineTo(cx + 35*dir, cy + 128); c.lineTo(cx - 35*dir, cy + 128); c.fill();
        c.strokeStyle = 'red'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 35*dir, cy + 128); c.lineTo(cx + 35*dir, cy + 128); c.stroke();
        
        c.fillStyle = 'red'; c.shadowColor = 'red'; c.shadowBlur = 10; c.beginPath(); c.arc(cx + 5*dir, headY, 3, 0, Math.PI*2); c.fill(); c.shadowBlur = 0;

        if (this.awakeningActive) {
            c.save();
            c.strokeStyle = 'rgba(255, 50, 0, 0.6)'; c.lineWidth = 15; c.lineCap = 'round';
            c.shadowColor = 'red'; c.shadowBlur = 20;
            c.beginPath();
            for(let i=0; i<4; i++) {
                c.moveTo(cx - 30*dir, cy + 30 + i*20);
                c.quadraticCurveTo(cx + 60*dir, cy + 30 + i*20, cx + 50*dir, cy + 50 + i*20);
            }
            c.moveTo(cx - 40*dir, cy + 10); c.lineTo(cx - 40*dir, cy + 110);
            c.stroke();
            c.restore();
        }
    }

    startAttack(attackObj) {
        super.startAttack(attackObj);
        if (this.awakeningActive && (attackObj === this.attacks.light || attackObj === this.attacks.sweep || attackObj === this.attacks.air)) {
            this.attackBox.width *= 2.5; 
            this.attackBox.height *= 1.5;
        }
    }

    update() {
        if (this.awakeningActive) {
            this.awakeningTimer--;
            if (this.awakeningTimer <= 0) this.awakeningActive = false;
            this.damageMult = 1.3; this.cdMult = 0.3; this.speedMult = 1.2;
            if (this.isAttacking && this.currentAttack !== this.attacks.air && !this.skillFired) {
                this.attackBox.width = this.currentAttack.width * 2;
                this.attackBox.height = this.currentAttack.height * 2;
            }
        } else {
            this.damageMult = 1; this.cdMult = 1; this.speedMult = 1;
        }

        super.update();

        if (!this.isAttacking || this.attackState === 'startup') {
            this.itachiSkillFired = false;
        }

        if (this.isAttacking && this.attackState === 'active') {
            const atk = this.currentAttack;
            if (!this.itachiSkillFired) {
                this.itachiSkillFired = true;
                if (atk.name === 'Fireball') {
                    window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 20 }, velocity: { x: this.facingRight ? 12 : -12, y: 0 }, radius: 35, color: '#FF4500', damage: 15 * this.damageMult, owner: this, type: 'fireball', life: 120 }));
                    triggerShake(10);
                } else if (atk.name === 'PhoenixFire') {
                    for(let i=-1; i<=1; i++) {
                        window.activeProjectiles.push(new Projectile({ position: { x: this.position.x + (this.facingRight ? this.width : 0), y: this.position.y + 40 }, velocity: { x: this.facingRight ? 10 : -10, y: 8 + i*4 }, radius: 15, color: '#FF4500', damage: 8 * this.damageMult, owner: this, type: 'fireball', life: 60 }));
                    }
                } else if (atk.name === 'Amaterasu') {
                    const target = this.isEnemy ? player : enemy;
                    window.activeProjectiles.push(new Projectile({ position: { x: target.position.x + target.width/2, y: canvas.height - 50 }, velocity: { x: 0, y: 0 }, radius: 60, color: 'black', damage: 3 * this.damageMult, owner: this, type: 'amaterasu', life: 120 }));
                } else if (atk.name === 'CrowDash') {
                    this.velocity.x = this.facingRight ? 20 : -20;
                    this.iFrames = 2;
                    if (Math.random() < 0.5) spawnHitParticles({x: this.position.x + this.width/2, y: this.position.y + this.height/2}, 'black', 2);
                } else if (atk.name === 'AerialCrowSlam') {
                    this.velocity.x = this.facingRight ? 15 : -15; this.velocity.y = 15;
                }
            }

            if (atk.name === 'CrowDash') {
                if (Math.random() < 0.5) spawnHitParticles(this.position, 'black', 2);
            } else if (atk.name === 'AerialCrowSlam') {
                if (Math.random() < 0.5) spawnHitParticles(this.position, 'black', 3);
            }
        }
    }

    takeHit(attack, attacker, direction) {
        if (this.currentAttack && this.currentAttack.name === 'SharinganCounter' && this.attackState === 'active') {
            if ((this.facingRight && attacker.position.x > this.position.x) || (!this.facingRight && attacker.position.x < this.position.x)) {
                attacker.hitstunFrames = 90; attacker.velocity.x = 0; attacker.velocity.y = 0;
                attacker.isAttacking = false;
                window.visualEffects.push({ type: 'sharingan_stun', target: attacker, timer: 90 });
                window.globalState.flashWhite = 1.0; window.globalState.hitstop = 30;
                this.isAttacking = false; this.attackState = 'idle'; this.stamina = Math.min(this.maxStamina, this.stamina + 20);
                spawnHitParticles(attacker.position, 'red', 30);
                return;
            }
        }
        if (this.awakeningActive) {
            const actualDamage = (attack.damage || 5) * (attacker ? attacker.damageMult : 1);
            this.health -= actualDamage * 0.2; // 80% mitigation
            spawnHitParticles(this.position, 'orange', 10);
            return; 
        }
        super.takeHit(attack, attacker, direction);
    }
}

class Asta extends Fighter {
    constructor({ position, isEnemy = false }) {
        super({ position, characterType: 'Asta', isEnemy });
        this.color = '#333';
        this.maxSpeed = 11; this.acceleration = 2; // slow base speed, heavy sword
        this.jumpPower = -15;
    }

    setupCharacter() {
        super.setupCharacter();
        this.skills = {
            groundE: { name: 'BlackSlash', startup: 15, active: 20, recovery: 20, damage: 15, knockback: {x: 10, y: -2}, hitstun: 40, width: 80, height: 80, cost: 20, cd: 80 }, 
            groundQ: { name: 'BullThrust', startup: 15, active: 15, recovery: 20, damage: 12, knockback: {x: 35, y: -5}, hitstun: 40, width: 80, height: 60, cost: 15, cd: 70 }, 
            crouchE: { name: 'DemonDestroyer', startup: 10, active: 90, recovery: 15, damage: 0, hitstun: 0, width: 0, height: 0, cost: 20, cd: 150 }, 
            crouchQ: { name: 'SpinningSlash', startup: 15, active: 40, recovery: 20, damage: 6, hitstun: 20, width: 220, height: 120, cost: 25, cd: 100 },
            airE: { name: 'BlackMeteorite', startup: 15, active: 30, recovery: 25, damage: 15, knockback: {x: 15, y: 10}, hitstun: 60, width: 80, height: 80, cost: 20, cd: 90 },
            airQ: { name: 'SlamDown', startup: 20, active: 20, recovery: 30, damage: 20, knockback: {x: 0, y: -15}, hitstun: 50, width: 60, height: 100, cost: 15, cd: 90 } 
        };
    }

    drawSegmentedBody(c, color, cx, cy, dir) {
        c.save();
        let isSpinning = (this.isAttacking && this.currentAttack.name === 'SpinningSlash');
        
        if (isSpinning) {
            c.translate(cx, cy + 40);
            c.rotate(this.attackFrame * 0.4); // Spin like Balmond
            c.translate(-cx, -(cy + 40));
        }

        super.drawSegmentedBody(c, color, cx, cy, dir);

        let t_shoulderY = cy + 25;
        if (this.isCrouching && !this.isAttacking) t_shoulderY += 20;
        const breathe = (this.onGround && Math.abs(this.velocity.x) < 1 && !this.isAttacking && !this.isCrouching) ? Math.sin(Date.now() / 200) * 3 : 0;
        t_shoulderY += breathe;

        let swordX = cx + 25 * dir;
        let swordY = t_shoulderY;
        let swordRot = dir === 1 ? -Math.PI / 4 : Math.PI / 4; 

        if (this.isBlocking) {
            swordX = cx + 20 * dir; swordY = t_shoulderY + 10;
            swordRot = 0; 
        } else if (this.isAttacking) {
            const atk = this.currentAttack;
            if (atk.name === 'BlackSlash') {
                if (this.attackState === 'startup') { swordRot = dir === 1 ? -Math.PI/2 : Math.PI/2; swordX -= 20*dir; }
                else if (this.attackState === 'active') { swordRot = dir === 1 ? Math.PI/2 : -Math.PI/2; swordX += 40*dir; swordY += 20; }
                else { swordRot = dir === 1 ? Math.PI*0.8 : -Math.PI*0.8; swordX += 20*dir; swordY += 30; }
            } else if (atk.name === 'BullThrust') {
                swordRot = dir === 1 ? Math.PI/2 : -Math.PI/2;
                swordX += 40*dir; swordY += 15;
            } else if (atk.name === 'DemonDestroyer') {
                swordRot = 0;
                swordX = cx + 15*dir; swordY = cy + 130; 
            } else if (atk.name === 'SpinningSlash') {
                swordRot = dir === 1 ? Math.PI/2 : -Math.PI/2; // Hold horizontal while body spins
                swordX += 40*dir; swordY += 15;
            } else if (atk.name === 'BlackMeteorite' || atk.name === 'SlamDown') {
                swordRot = dir === 1 ? Math.PI/4 : -Math.PI/4;
                swordX += 20*dir; swordY += 30;
                if (atk.name === 'SlamDown' && this.attackState === 'active') swordRot = 0; 
            } else if (atk === this.attacks.light || atk === this.attacks.air) {
                if (this.attackState === 'startup') { swordRot = dir === 1 ? -Math.PI/4 : Math.PI/4; swordX -= 10*dir; swordY -= 10; }
                else if (this.attackState === 'active') { swordRot = dir === 1 ? Math.PI/2 : -Math.PI/2; swordX += 40*dir; swordY += 15; }
                else { swordRot = dir === 1 ? Math.PI*0.7 : -Math.PI*0.7; swordX += 10*dir; swordY += 30; }
            } else if (atk === this.attacks.heavy) {
                if (this.attackState === 'startup') { swordRot = dir === 1 ? Math.PI/4 : -Math.PI/4; swordX += 20*dir; swordY -= 20; }
                else if (this.attackState === 'active') { swordRot = dir === 1 ? Math.PI*0.8 : -Math.PI*0.8; swordX += 20*dir; swordY += 40; }
                else { swordRot = dir === 1 ? -Math.PI*0.8 : Math.PI*0.8; swordX -= 10*dir; swordY += 20; }
            }
        } else if (this.substituteActive > 0) {
            c.restore(); return;
        }

        c.save(); // Save again for sword local transform

        // Draw Demon-Slayer Sword
        c.translate(swordX, swordY);
        c.rotate(swordRot);
        c.fillStyle = '#2a2a2a'; // Dark gray/dull black
        c.strokeStyle = '#111';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-10, -30); // Handle
        c.lineTo(10, -30);
        c.lineTo(10, -10); // Guard
        c.lineTo(25, -10);
        c.lineTo(25, 0);
        c.lineTo(15, 0);
        // Blade
        c.lineTo(20, 100);
        c.lineTo(0, 120); // Tip
        c.lineTo(-20, 100);
        c.lineTo(-15, 0);
        c.lineTo(-25, 0); // Guard
        c.lineTo(-25, -10);
        c.lineTo(-10, -10);
        c.closePath();
        c.fill();
        c.stroke();
        
        // Blade ridge
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 120); c.strokeStyle = '#444'; c.stroke();
        c.restore(); // restore sword transform
        
        c.restore(); // restore whole body transform

        if (this.awakeningActive) {
            // Draw Black Asta Wing
            c.save();
            c.translate(cx - 10*dir, t_shoulderY + 10);
            c.fillStyle = 'black';
            c.beginPath();
            c.moveTo(0, 0);
            const flap = Math.sin(Date.now() / 150) * 10;
            c.quadraticCurveTo(-40*dir, -20 - flap, -80*dir, -10 - flap*2);
            c.quadraticCurveTo(-50*dir, 10, -60*dir, 40);
            c.quadraticCurveTo(-30*dir, 20, 0, 20);
            c.fill();
            c.restore();

            // Aura particles
            if (Math.random() < 0.3) {
                let absX = this.position.x + this.width/2;
                let absY = this.position.y + this.height/2;
                window.visualEffects.push({
                    type: 'aura_lines', 
                    startX: absX + (Math.random()-0.5)*100, startY: absY + 100, endX: absX + (Math.random()-0.5)*100, endY: absY - 100, color: 'red', timer: 10, maxTimer: 10
                });
            }
        }
    }

    startAttack(attackObj) {
        super.startAttack(attackObj);
        if (attackObj.name === 'SpinningSlash') this.spinHitCount = 0;
    }

    update() {
        if (this.awakeningActive) {
            this.awakeningTimer--;
            if (this.awakeningTimer <= 0) this.awakeningActive = false;
            this.speedMult = 1.4; // 40% ms
            this.damageMult = 1.0; this.cdMult = 1.0; 
        } else {
            this.damageMult = 1; this.cdMult = 1; this.speedMult = 1;
        }

        super.update();
        
        if (this.isAttacking && this.currentAttack.name === 'BlackMeteorite' && this.attackState === 'startup') {
            this.velocity.x = 0; this.velocity.y = 0; // Float menacingly
        }

        if (this.isAttacking && this.attackState === 'active') {
            const atk = this.currentAttack;
            
            // Spinning Slash Multi-hit
            if (atk.name === 'SpinningSlash') {
                if (this.attackFrame % 8 === 0) this.hasHit = false; // Reset hit flag every 8 frames
                if (Math.random() < 0.5) spawnHitParticles({x: this.position.x + this.width/2 + (Math.random()-0.5)*120, y: this.position.y + this.height/2 + (Math.random()-0.5)*120}, 'black', 2);
                if (Math.random() < 0.5) spawnHitParticles({x: this.position.x + this.width/2 + (Math.random()-0.5)*120, y: this.position.y + this.height/2 + (Math.random()-0.5)*120}, 'red', 2);
            }
            
            if (atk.name === 'BlackMeteorite') {
                const target = this.isEnemy ? player : enemy;
                const dx = (target.position.x + target.width/2) - (this.position.x + this.width/2);
                const dy = (target.position.y + target.height/2) - (this.position.y + this.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Dynamically lock onto target!
                if (dist > 30) {
                    this.customVel = { x: (dx / dist) * 25, y: (dy / dist) * 25 };
                }
                
                if (this.customVel) {
                    this.position.x += this.customVel.x * window.dt;
                    this.position.y += this.customVel.y * window.dt;
                    this.velocity.x = 0;
                    this.velocity.y = 0; // stop gravity
                    // Trailing aura particles
                    if (Math.random() < 0.6) spawnHitParticles({x: this.position.x + this.width/2, y: this.position.y + this.height/2}, 'black', 3);
                    if (Math.random() < 0.6) spawnHitParticles({x: this.position.x + this.width/2, y: this.position.y + this.height/2}, 'red', 3);
                }
                if (this.hasHit || this.onGround) {
                    this.hasHit = true; 
                    this.attackState = 'recovery'; this.attackFrame = atk.startup + atk.active;
                }
            }
            
            if (atk.name === 'SlamDown') {
                this.velocity.y = 20;
                this.velocity.x = 0;
                if (this.onGround) {
                    window.visualEffects.push({ type: 'ground_crack', position: { x: this.position.x + this.width/2, y: document.getElementById('game-canvas').height - 50 }, timer: 60 });
                    this.hasHit = true; 
                    this.attackState = 'recovery'; this.attackFrame = atk.startup + atk.active;
                    triggerShake(30);
                    window.globalState.impactFrame = 4;
                    spawnHitParticles({x: this.position.x + this.width/2, y: document.getElementById('game-canvas').height - 50}, 'black', 30);
                }
            }

            if (atk.name === 'BullThrust') {
                this.velocity.x = this.facingRight ? 30 : -30;
                this.velocity.y = 0;
                if (this.onGround && Math.random() < 0.5) spawnHitParticles({x: this.position.x + (this.facingRight ? 0 : this.width), y: this.position.y + this.height}, 'gray', 3);
                if (this.hasHit) {
                    this.velocity.x = 0;
                    this.attackState = 'recovery'; this.attackFrame = atk.startup + atk.active;
                }
            }

            // Anti-Magic Cleave (projectile destroy on swing)
            if (atk.name === 'AntiMagicCleave') {
                for (let i = window.activeProjectiles.length - 1; i >= 0; i--) {
                    const proj = window.activeProjectiles[i];
                    if (proj.owner !== this) {
                        if (proj.position.x >= this.attackBox.position.x && proj.position.x <= this.attackBox.position.x + this.attackBox.width && 
                            proj.position.y >= this.attackBox.position.y && proj.position.y <= this.attackBox.position.y + this.attackBox.height) {
                            spawnHitParticles(proj.position, 'black', 20);
                            window.activeProjectiles.splice(i, 1);
                            globalState.hitstop = 3; 
                        }
                    }
                }
            }
        }
    }
}
