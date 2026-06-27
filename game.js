const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
canvas.width = 1280;
canvas.height = 720;

// Game States
const GAME_STATE = {
    TITLE: 'title',
    GAMEPLAY: 'gameplay',
    BOSS_FIGHT: 'boss_fight',
    LEVEL_COMPLETE: 'level_complete',
    GAME_OVER: 'game_over'
};

// Game Variables
let currentState = GAME_STATE.TITLE;
let currentLevel = 1;
let player1Active = true;
let player2Active = false;

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'j' || e.key === 'J') {
        if (currentState === GAME_STATE.TITLE) {
            player2Active = !player2Active;
        }
    }
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Player Class
class Player {
    constructor(x, y, isPlayer2 = false) {
        this.x = x;
        this.y = y;
        this.isPlayer2 = isPlayer2;
        this.width = 32;
        this.height = 32;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 3;
        this.jumpPower = 8;
        this.isJumping = false;
        this.health = 100;
        this.maxHealth = 100;
        this.weapon = 'sword'; // 'sword' or 'pistol'
        this.ammunition = 50;
        this.animationFrame = 0;
        this.direction = 1; // 1 for right, -1 for left
        this.isSwimming = true;
        this.swimSpeed = 2;
        this.color = isPlayer2 ? '#FFD700' : '#DC143C'; // Yellow or Red
        this.skinColor = '#8B4513'; // Brown skin
        this.invulnerable = 0;
        this.combo = 0;
        this.lastHitTime = 0;
    }

    handleInput() {
        if (this.isPlayer2) {
            // Player 2 controls: Arrow keys
            if (keys['ArrowLeft']) {
                this.velocityX = -this.speed;
                this.direction = -1;
            } else if (keys['ArrowRight']) {
                this.velocityX = this.speed;
                this.direction = 1;
            } else {
                this.velocityX *= 0.8;
            }

            if (keys['ArrowUp']) {
                this.velocityY = -this.swimSpeed;
            } else if (keys['ArrowDown']) {
                this.velocityY = this.swimSpeed;
            } else {
                this.velocityY *= 0.9;
            }

            if (keys['/']) {
                this.switchWeapon();
            }
            if (keys['.']) {
                this.attack();
            }
        } else {
            // Player 1 controls: WASD
            if (keys['a'] || keys['A']) {
                this.velocityX = -this.speed;
                this.direction = -1;
            } else if (keys['d'] || keys['D']) {
                this.velocityX = this.speed;
                this.direction = 1;
            } else {
                this.velocityX *= 0.8;
            }

            if (keys['w'] || keys['W']) {
                this.velocityY = -this.swimSpeed;
            } else if (keys['s'] || keys['S']) {
                this.velocityY = this.swimSpeed;
            } else {
                this.velocityY *= 0.9;
            }

            if (keys['e'] || keys['E']) {
                this.switchWeapon();
            }
            if (keys['c'] || keys['C']) {
                this.attack();
            }
        }
    }

    switchWeapon() {
        if (this.weapon === 'sword') {
            this.weapon = 'pistol';
        } else {
            this.weapon = 'sword';
        }
    }

    attack() {
        if (this.weapon === 'pistol' && this.ammunition > 0) {
            this.ammunition--;
            gameState.projectiles.push(new Projectile(
                this.x + (this.direction > 0 ? this.width : 0),
                this.y + this.height / 2,
                this.direction,
                'plasma'
            ));
        } else if (this.weapon === 'sword') {
            gameState.meleeAttacks.push(new MeleeAttack(this));
        }
    }

    update() {
        // Apply gravity/water physics
        this.velocityY += 0.3;
        this.velocityY = Math.max(Math.min(this.velocityY, 5), -5);
        this.velocityX = Math.max(Math.min(this.velocityX, this.speed), -this.speed);

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Boundary checking
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

        // Update animation
        this.animationFrame++;

        // Handle invulnerability
        if (this.invulnerable > 0) {
            this.invulnerable--;
        }

        // Reduce combo timer
        if (Date.now() - this.lastHitTime > 2000) {
            this.combo = 0;
        }
    }

    takeDamage(amount) {
        if (this.invulnerable > 0) return;
        this.health -= amount;
        this.invulnerable = 30;
        this.combo = 0;

        if (this.health <= 0) {
            this.health = 0;
        }
    }

    draw() {
        // Draw body (underwater bubble effect)
        ctx.fillStyle = this.invulnerable % 2 === 0 ? this.color : 'rgba(220, 20, 60, 0.5)';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw head
        ctx.fillStyle = this.skinColor;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 8, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8 * this.direction + (this.direction > 0 ? 4 : 0), this.y + 4, 3, 3);
        ctx.fillRect(this.x + 12 * this.direction + (this.direction > 0 ? 4 : 0), this.y + 4, 3, 3);

        // Draw weapon
        if (this.weapon === 'sword') {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + 12);
            ctx.lineTo(this.x + this.width / 2 + this.direction * 15, this.y + 5);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#00FFFF';
            ctx.fillRect(
                this.x + this.width / 2 + this.direction * 5,
                this.y + 14,
                8,
                4
            );
        }

        // Health bar
        const barWidth = 30;
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x - 5, this.y - 8, barWidth * (this.health / this.maxHealth), 3);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 5, this.y - 8, barWidth, 3);

        // Weapon indicator
        const weaponText = this.weapon === 'sword' ? '⚔' : '🔫';
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(weaponText, this.x + this.width / 2 - 5, this.y + this.height + 10);
    }
}

// Enemy Class
class Enemy {
    constructor(x, y, type = 'basic', level = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.level = level;
        this.width = 28;
        this.height = 28;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 1 + (level * 0.2);
        this.health = 20 + (level * 5);
        this.maxHealth = this.health;
        this.color = this.getColor();
        this.animationFrame = 0;
        this.sightRange = 200;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.target = null;

        // AI states
        this.state = 'patrol'; // patrol, chase, attack
        this.patrolX = x;
        this.patrolRange = 100;
        this.damage = 5 + (level * 2);
    }

    getColor() {
        const colors = {
            'basic': '#00AA55',
            'secondary': '#0080FF',
            'aggressive': '#FF6600'
        };
        return colors[this.type] || '#00AA55';
    }

    findTarget() {
        let closest = null;
        let minDistance = this.sightRange;

        if (gameState.player1) {
            const dist = Math.hypot(gameState.player1.x - this.x, gameState.player1.y - this.y);
            if (dist < minDistance) {
                closest = gameState.player1;
                minDistance = dist;
            }
        }

        if (gameState.player2 && minDistance > 0) {
            const dist = Math.hypot(gameState.player2.x - this.x, gameState.player2.y - this.y);
            if (dist < minDistance) {
                closest = gameState.player2;
                minDistance = dist;
            }
        }

        return closest;
    }

    update() {
        this.target = this.findTarget();

        if (this.target) {
            const dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);

            if (dist < this.attackRange) {
                this.state = 'attack';
                this.velocityX = 0;
                this.velocityY = 0;
                this.attackCooldown--;
                if (this.attackCooldown <= 0) {
                    this.target.takeDamage(this.damage);
                    this.attackCooldown = 30;
                }
            } else {
                this.state = 'chase';
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                const length = Math.hypot(dx, dy);
                this.velocityX = (dx / length) * this.speed;
                this.velocityY = (dy / length) * this.speed;
            }
        } else {
            this.state = 'patrol';
            if (Math.abs(this.x - this.patrolX) > this.patrolRange) {
                this.velocityX = this.patrolX > this.x ? this.speed : -this.speed;
            } else {
                this.velocityX *= 0.9;
            }
            this.velocityY *= 0.95;
        }

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Boundary checking
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

        this.animationFrame++;
    }

    takeDamage(amount) {
        this.health -= amount;
    }

    draw() {
        // Enemy body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Enemy eyes
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.x + 6, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);

        // Health bar
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y - 5, this.width * (this.health / this.maxHealth), 2);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y - 5, this.width, 2);
    }
}

// Boss Class
class Boss {
    constructor(x, y, bossType, level) {
        this.x = x;
        this.y = y;
        this.type = bossType; // 'shark', 'octopus', 'squid', 'leviathan'
        this.level = level;
        this.width = 60;
        this.height = 60;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = 150 + (level * 30);
        this.maxHealth = this.health;
        this.speed = 2 + (level * 0.3);
        this.attackPattern = 0;
        this.attackCooldown = 0;
        this.phase = 1;
        this.damage = 15 + (level * 5);
        this.color = this.getColor();
        this.animationFrame = 0;
    }

    getColor() {
        const colors = {
            'shark': '#404040',
            'octopus': '#8B008B',
            'squid': '#0080FF',
            'leviathan': '#2F4F4F'
        };
        return colors[this.type] || '#404040';
    }

    update() {
        // Determine phase based on health percentage
        this.phase = this.health > this.maxHealth * 0.5 ? 1 : 2;

        // Boss AI - circle and attack pattern
        const players = [gameState.player1, gameState.player2].filter(p => p);
        if (players.length === 0) return;

        const targetPlayer = players[0];
        const dx = targetPlayer.x - this.x;
        const dy = targetPlayer.y - this.y;
        const distance = Math.hypot(dx, dy);

        // Circular movement
        const angle = Math.atan2(dy, dx);
        this.velocityX = Math.cos(angle + Math.sin(this.animationFrame / 30)) * this.speed;
        this.velocityY = Math.sin(angle + Math.sin(this.animationFrame / 30)) * this.speed;

        this.x += this.velocityX;
        this.y += this.velocityY;

        // Boundary checking
        if (this.x < 20) this.x = 20;
        if (this.x + this.width > canvas.width - 20) this.x = canvas.width - this.width - 20;
        if (this.y < 20) this.y = 20;
        if (this.y + this.height > canvas.height - 20) this.y = canvas.height - this.height - 20;

        // Attack pattern
        this.attackCooldown--;
        if (this.attackCooldown <= 0) {
            this.performAttack(targetPlayer);
            this.attackCooldown = 40 - (this.phase - 1) * 10;
        }

        this.animationFrame++;
    }

    performAttack(target) {
        // Boss spawns projectiles or summons minions
        if (this.type === 'shark') {
            // Charge attack
            gameState.projectiles.push(new Projectile(
                this.x + this.width / 2,
                this.y + this.height / 2,
                Math.sign(target.x - this.x),
                'energy'
            ));
        } else if (this.type === 'octopus') {
            // Tentacle swipe
            for (let i = 0; i < 3; i++) {
                const angle = (Math.PI * 2 / 3) * i;
                gameState.projectiles.push(new Projectile(
                    this.x + this.width / 2,
                    this.y + this.height / 2,
                    Math.cos(angle),
                    'tentacle'
                ));
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
    }

    draw() {
        // Boss body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.type === 'shark') {
            ctx.moveTo(this.x + this.width, this.y + this.height / 2);
            ctx.lineTo(this.x, this.y + this.height / 4);
            ctx.lineTo(this.x, this.y + this.height * 0.75);
            ctx.closePath();
        } else {
            ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        }
        ctx.fill();

        // Boss eyes
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x + 12, this.y + 14, 6, 6);
        ctx.fillRect(this.x + 42, this.y + 14, 6, 6);

        // Health bar
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y - 15, this.width * (this.health / this.maxHealth), 5);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y - 15, this.width, 5);

        // Boss name
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type.toUpperCase(), this.x + this.width / 2, this.y - 25);
    }
}

// Projectile Class
class Projectile {
    constructor(x, y, directionX, type = 'plasma') {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.type = type;
        this.width = 8;
        this.height = 8;
        this.speed = 6;
        this.life = 100;
        this.color = type === 'plasma' ? '#00FF00' : '#FF00FF';
    }

    update() {
        this.x += this.directionX * this.speed;
        this.life--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Melee Attack Class
class MeleeAttack {
    constructor(player) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        this.direction = player.direction;
        this.life = 15;
        this.width = 30;
        this.height = 30;
    }

    update() {
        this.life--;
        this.x = this.player.x + this.player.width / 2 + this.direction * 20;
        this.y = this.player.y + this.player.height / 2;
    }

    draw() {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Trap Class
class Trap {
    constructor(x, y, type = 'spike') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 20;
        this.height = 20;
        this.damage = 10;
        this.cooldown = 0;
        this.triggered = false;
        this.animationFrame = 0;
    }

    update() {
        this.animationFrame++;
        this.triggered = false;
    }

    checkCollision(player) {
        if (this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y) {
            if (!this.triggered) {
                player.takeDamage(this.damage);
                this.triggered = true;
            }
        }
    }

    draw() {
        if (this.type === 'spike') {
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y);
            ctx.lineTo(this.x + 20, this.y + 20);
            ctx.lineTo(this.x, this.y + 20);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'electric') {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Game State
let gameState = {
    player1: null,
    player2: null,
    enemies: [],
    bosses: [],
    projectiles: [],
    meleeAttacks: [],
    traps: [],
    score: 0,
    enemiesDefeated: 0,
    bossesDefeated: 0,
    currentBossPhase: 0,
    maxBosses: 2,
    spawnRate: 0.02
};

// Initialize level
function initializeLevel() {
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.meleeAttacks = [];
    gameState.traps = [];
    gameState.bosses = [];
    gameState.enemiesDefeated = 0;
    gameState.bossesDefeated = 0;
    gameState.spawnRate = 0.02 + (currentLevel * 0.01);

    // Create players
    if (!gameState.player1) {
        gameState.player1 = new Player(100, 200);
    } else {
        gameState.player1.x = 100;
        gameState.player1.y = 200;
        gameState.player1.health = gameState.player1.maxHealth;
    }

    if (player2Active) {
        if (!gameState.player2) {
            gameState.player2 = new Player(canvas.width - 150, 200, true);
        } else {
            gameState.player2.x = canvas.width - 150;
            gameState.player2.y = 200;
            gameState.player2.health = gameState.player2.maxHealth;
        }
    } else {
        gameState.player2 = null;
    }

    // Spawn initial enemies
    for (let i = 0; i < 3; i++) {
        spawnEnemy();
    }

    // Place traps
    gameState.traps.push(new Trap(300, 400, 'spike'));
    gameState.traps.push(new Trap(500, 250, 'electric'));
    gameState.traps.push(new Trap(700, 500, 'spike'));
    gameState.traps.push(new Trap(900, 300, 'electric'));
}

function spawnEnemy() {
    const enemyTypes = ['basic', 'secondary', 'aggressive'];
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height * 0.7);
    gameState.enemies.push(new Enemy(x, y, type, currentLevel));
}

function spawnBoss() {
    const bossTypes = ['shark', 'octopus', 'squid', 'leviathan'];
    const type = bossTypes[currentLevel % bossTypes.length];
    const x = canvas.width / 2;
    const y = canvas.height / 3;
    gameState.bosses.push(new Boss(x, y, type, currentLevel));
}

// Draw underwater background
function drawBackground() {
    // Water gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0080CC');
    gradient.addColorStop(1, '#001155');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bubbles
    for (let i = 0; i < 10; i++) {
        const x = (i * 128 + gameState.animationFrame * 2) % canvas.width;
        const y = (i * 72 + Math.sin(gameState.animationFrame / 50) * 50) % canvas.height;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Sand particles
    ctx.fillStyle = 'rgba(210, 180, 140, 0.1)';
    for (let i = 0; i < 20; i++) {
        const x = (i * 64 + gameState.animationFrame) % canvas.width;
        const y = canvas.height - 50 + Math.sin(i) * 20;
        ctx.fillRect(x, y, 2, 2);
    }
}

// Draw UI
function drawUI() {
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Level: ${currentLevel}`, 10, 25);
    ctx.fillText(`Score: ${gameState.score}`, 10, 50);

    // Player 1 stats
    ctx.fillText(`P1 HP: ${gameState.player1.health}/${gameState.player1.maxHealth}`, 10, 75);
    ctx.fillText(`Weapon: ${gameState.player1.weapon}`, 10, 100);
    if (gameState.player1.weapon === 'pistol') {
        ctx.fillText(`Ammo: ${gameState.player1.ammunition}`, 10, 125);
    }

    // Player 2 stats
    if (gameState.player2) {
        ctx.fillText(`P2 HP: ${gameState.player2.health}/${gameState.player2.maxHealth}`, canvas.width - 250, 25);
        ctx.fillText(`Weapon: ${gameState.player2.weapon}`, canvas.width - 250, 50);
        if (gameState.player2.weapon === 'pistol') {
            ctx.fillText(`Ammo: ${gameState.player2.ammunition}`, canvas.width - 250, 75);
        }
    }

    // Enemy count
    ctx.fillText(`Enemies: ${gameState.enemies.length}`, canvas.width - 200, canvas.height - 20);
}

// Title Screen
function drawTitleScreen() {
    // Background with animated planet
    const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 100, canvas.width / 2, canvas.height / 2, 500);
    gradient.addColorStop(0, '#FF6600');
    gradient.addColorStop(0.5, '#FF3300');
    gradient.addColorStop(1, '#000033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Destroying planet
    const planetX = canvas.width / 2;
    const planetY = canvas.height / 2;
    const planetRadius = 100;
    const destroyPhase = (Date.now() / 50) % 100;

    // Planet
    ctx.fillStyle = '#0080FF';
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2);
    ctx.fill();

    // Destruction effect
    if (destroyPhase < 50) {
        ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(planetX + Math.cos(destroyPhase / 50 * Math.PI * 2) * planetRadius * 0.5,
                planetY + Math.sin(destroyPhase / 50 * Math.PI * 2) * planetRadius * 0.5,
                planetRadius * (destroyPhase / 50),
                0, Math.PI * 2);
        ctx.fill();
    }

    // Stars
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(i) * canvas.width * 0.7) + canvas.width / 2;
        const y = (Math.cos(i * 1.5) * canvas.height * 0.6) + canvas.height / 2;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(x, y, 2, 2);
    }

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.fillText('GALAXY GLADIATORS', canvas.width / 2, 150);

    // Instructions
    ctx.fillStyle = '#FFF';
    ctx.font = '20px Arial';
    ctx.shadowColor = 'transparent';
    ctx.fillText('Press SPACE to Start', canvas.width / 2, canvas.height - 150);
    ctx.fillText('Press J to Toggle Player 2 (' + (player2Active ? 'ON' : 'OFF') + ')', canvas.width / 2, canvas.height - 100);

    // Controls
    ctx.font = '14px Arial';
    ctx.fillText('Player 1: WASD to move, E to switch weapon, C to attack', canvas.width / 2, canvas.height - 40);
    ctx.fillText('Player 2: Arrow keys to move, / to switch weapon, . to attack', canvas.width / 2, canvas.height + 10);
}

// Game Loop
function update() {
    if (currentState === GAME_STATE.TITLE) {
        if (keys[' ']) {
            currentState = GAME_STATE.GAMEPLAY;
            initializeLevel();
        }
    } else if (currentState === GAME_STATE.GAMEPLAY) {
        gameState.animationFrame = (gameState.animationFrame || 0) + 1;

        // Update players
        if (gameState.player1) {
            gameState.player1.handleInput();
            gameState.player1.update();
        }

        if (gameState.player2) {
            gameState.player2.handleInput();
            gameState.player2.update();
        }

        // Spawn enemies
        if (Math.random() < gameState.spawnRate && gameState.enemies.length < 15) {
            spawnEnemy();
        }

        // Check if should spawn boss
        if (gameState.enemies.length === 0 && gameState.bosses.length === 0 && gameState.bossesDefeated < gameState.maxBosses) {
            spawnBoss();
        }

        // Update enemies
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            gameState.enemies[i].update();

            // Check collision with traps
            for (let trap of gameState.traps) {
                if (gameState.enemies[i].x < trap.x + trap.width &&
                    gameState.enemies[i].x + gameState.enemies[i].width > trap.x &&
                    gameState.enemies[i].y < trap.y + trap.height &&
                    gameState.enemies[i].y + gameState.enemies[i].height > trap.y) {
                    gameState.enemies[i].takeDamage(15);
                }
            }

            // Check collision with projectiles
            for (let j = gameState.projectiles.length - 1; j >= 0; j--) {
                const proj = gameState.projectiles[j];
                if (gameState.enemies[i].x < proj.x + proj.width &&
                    gameState.enemies[i].x + gameState.enemies[i].width > proj.x &&
                    gameState.enemies[i].y < proj.y + proj.height &&
                    gameState.enemies[i].y + gameState.enemies[i].height > proj.y) {
                    gameState.enemies[i].takeDamage(10);
                    gameState.projectiles.splice(j, 1);
                }
            }

            // Check collision with melee
            for (let j = gameState.meleeAttacks.length - 1; j >= 0; j--) {
                const melee = gameState.meleeAttacks[j];
                if (gameState.enemies[i].x < melee.x + melee.width &&
                    gameState.enemies[i].x + gameState.enemies[i].width > melee.x &&
                    gameState.enemies[i].y < melee.y + melee.height &&
                    gameState.enemies[i].y + gameState.enemies[i].height > melee.y) {
                    gameState.enemies[i].takeDamage(20);
                }
            }

            // Remove dead enemies
            if (gameState.enemies[i].health <= 0) {
                gameState.score += 50 + (currentLevel * 10);
                gameState.enemiesDefeated++;
                gameState.enemies.splice(i, 1);
            }
        }

        // Update bosses
        for (let i = gameState.bosses.length - 1; i >= 0; i--) {
            gameState.bosses[i].update();

            // Check collision with projectiles
            for (let j = gameState.projectiles.length - 1; j >= 0; j--) {
                const proj = gameState.projectiles[j];
                if (gameState.bosses[i].x < proj.x + proj.width &&
                    gameState.bosses[i].x + gameState.bosses[i].width > proj.x &&
                    gameState.bosses[i].y < proj.y + proj.height &&
                    gameState.bosses[i].y + gameState.bosses[i].height > proj.y) {
                    gameState.bosses[i].takeDamage(15);
                    gameState.projectiles.splice(j, 1);
                }
            }

            // Check collision with melee
            for (let j = gameState.meleeAttacks.length - 1; j >= 0; j--) {
                const melee = gameState.meleeAttacks[j];
                if (gameState.bosses[i].x < melee.x + melee.width &&
                    gameState.bosses[i].x + gameState.bosses[i].width > melee.x &&
                    gameState.bosses[i].y < melee.y + melee.height &&
                    gameState.bosses[i].y + gameState.bosses[i].height > melee.y) {
                    gameState.bosses[i].takeDamage(25);
                }
            }

            // Remove dead bosses
            if (gameState.bosses[i].health <= 0) {
                gameState.score += 500 + (currentLevel * 100);
                gameState.bossesDefeated++;
                gameState.bosses.splice(i, 1);

                // Check if level complete
                if (gameState.bossesDefeated >= gameState.maxBosses) {
                    currentLevel++;
                    initializeLevel();
                }
            }
        }

        // Update projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            gameState.projectiles[i].update();
            if (gameState.projectiles[i].life <= 0 || gameState.projectiles[i].x < 0 || gameState.projectiles[i].x > canvas.width) {
                gameState.projectiles.splice(i, 1);
            }
        }

        // Update melee attacks
        for (let i = gameState.meleeAttacks.length - 1; i >= 0; i--) {
            gameState.meleeAttacks[i].update();
            if (gameState.meleeAttacks[i].life <= 0) {
                gameState.meleeAttacks.splice(i, 1);
            }
        }

        // Update traps
        for (let trap of gameState.traps) {
            trap.update();
            if (gameState.player1) {
                trap.checkCollision(gameState.player1);
            }
            if (gameState.player2) {
                trap.checkCollision(gameState.player2);
            }
        }

        // Check player death
        if (gameState.player1 && gameState.player1.health <= 0) {
            if (gameState.player2 && gameState.player2.health > 0) {
                gameState.player1 = null;
            } else {
                currentState = GAME_STATE.GAME_OVER;
            }
        }

        if (gameState.player2 && gameState.player2.health <= 0) {
            if (gameState.player1 && gameState.player1.health > 0) {
                gameState.player2 = null;
            }
        }
    }
}

// Draw everything
function draw() {
    if (currentState === GAME_STATE.TITLE) {
        drawTitleScreen();
    } else if (currentState === GAME_STATE.GAMEPLAY) {
        drawBackground();

        // Draw game objects
        for (let trap of gameState.traps) {
            trap.draw();
        }

        for (let enemy of gameState.enemies) {
            enemy.draw();
        }

        for (let boss of gameState.bosses) {
            boss.draw();
        }

        for (let proj of gameState.projectiles) {
            proj.draw();
        }

        for (let melee of gameState.meleeAttacks) {
            melee.draw();
        }

        if (gameState.player1) {
            gameState.player1.draw();
        }

        if (gameState.player2) {
            gameState.player2.draw();
        }

        drawUI();
    } else if (currentState === GAME_STATE.GAME_OVER) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = '#FFF';
        ctx.font = '28px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 60);
        ctx.fillText(`Reached Level: ${currentLevel}`, canvas.width / 2, canvas.height / 2 + 100);
        ctx.fillText('Press SPACE to Return to Title', canvas.width / 2, canvas.height / 2 + 150);

        if (keys[' ']) {
            currentState = GAME_STATE.TITLE;
            currentLevel = 1;
            gameState.score = 0;
        }
    }
}

// Animation loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
