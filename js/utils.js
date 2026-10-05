const GRAVITY = 0.6;
const FRICTION = 0.85;
const globalState = { hitstop: 0, flashWhite: 0 };

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Draw a segmented limb with rounded caps
function drawLimb(c, x1, y1, x2, y2, thickness, color) {
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineWidth = thickness;
    c.strokeStyle = color;
    c.lineCap = 'round';
    c.stroke();
}

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    );
}

function projCollision(proj, target) {
    return (
        proj.position.x + proj.radius >= target.position.x &&
        proj.position.x - proj.radius <= target.position.x + target.width &&
        proj.position.y + proj.radius >= target.position.y &&
        proj.position.y - proj.radius <= target.position.y + target.height
    );
}

let shakeIntensity = 0;
function applyScreenShake(ctx) {
    if (shakeIntensity > 0) {
        const dx = (Math.random() - 0.5) * shakeIntensity;
        const dy = (Math.random() - 0.5) * shakeIntensity;
        ctx.translate(dx, dy);
        shakeIntensity *= 0.85;
        if (shakeIntensity < 0.5) shakeIntensity = 0;
    }
}

function triggerShake(intensity) {
    shakeIntensity = intensity;
}

const particles = [];
class Particle {
    constructor({ position, velocity, radius, color, life, gravity = 0.2, friction = 0.95 }) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.friction = friction;
    }
    draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.life / this.maxLife);
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }
    update(c) {
        this.draw(c);
        let dt = window.dt || 1;
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.velocity.y += this.gravity * dt; 
        this.velocity.x *= Math.pow(this.friction, dt); 
        this.velocity.y *= Math.pow(this.friction, dt);
        this.life -= dt;
    }
}

function spawnHitParticles(position, color, amount = 10, speedMult = 1) {
    const isExplosion = amount > 30;
    for (let i = 0; i < amount; i++) {
        const angle = isExplosion ? (Math.PI * 2 * (i / amount)) : (Math.random() * Math.PI * 2);
        const speed = isExplosion ? (Math.random() * 25 * speedMult) : (Math.random() * 15 * speedMult);
        particles.push(new Particle({
            position: { x: position.x, y: position.y },
            velocity: {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed - (isExplosion ? 0 : 5)
            },
            radius: Math.random() * (isExplosion ? 6 : 4) + 2,
            color: color,
            life: Math.random() * 15 + 10,
            gravity: isExplosion ? 0 : 0.2,
            friction: isExplosion ? 0.85 : 0.95
        }));
    }
}
