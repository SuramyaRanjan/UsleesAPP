// 1. Game-over GIF/animation list
const gameOverImages = [
    "https://media.tenor.com/FzVwdbzkWs0AAAAM/peeing.gif",
    "https://media.tenor.com/9NnoQbpmoLsAAAAM/funny-gif.gif",
    "https://media.istockphoto.com/id/1306274586/vector/three-cute-friends-turd-a-drop-of-urine-and-toilet-paper.jpg?s=612x612&w=0&k=20&c=TRYmq0NJgj0By2oIeoJQ9cjBln1gzjNe985vTaLMwVo="
];

// 2. Overlay show/hide
function showGameOverAnimation() {
    const overlay = document.getElementById('gameover-overlay');
    const img = document.getElementById('gameover-img');
    img.src = gameOverImages[Math.floor(Math.random() * gameOverImages.length)];
    overlay.style.display = "flex";
}
function hideGameOverAnimation() {
    document.getElementById('gameover-overlay').style.display = "none";
}
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-overlay').onclick = hideGameOverAnimation;
});

// 3. Main App
class UsLessApp {
    constructor() {
        this.currentGame = 'menu';
        this.games = {};
        this.bgm = document.getElementById('bgm');
        this.isMuted = false;
        this.setupMuteButton();
        this.setupCharacterSelect();
        this.init();
        window.uslessApp = this;
    }
    init() {
        this.setupNavigation();
        this.initializeGames();
        this.updateMute();
    }
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const gameCards = document.querySelectorAll('.game-card');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchToGame(btn.dataset.game);
            });
        });
        gameCards.forEach(card => {
            card.addEventListener('click', () => {
                this.switchToGame(card.dataset.game);
            });
        });
    }
    // Character selection logic
    setupCharacterSelect() {
        const charCards = document.querySelectorAll('.character-card');
        const proceedBtn = document.getElementById('proceed-btn');
        let selectedCharacter = null;
        charCards.forEach(card => {
            card.addEventListener('click', function () {
                charCards.forEach(c => c.classList.remove('selected'));
                this.classList.add('selected');
                selectedCharacter = this.dataset.character;
                proceedBtn.disabled = false;
            });
        });
        if (proceedBtn) {
            proceedBtn.addEventListener('click', function () {
                document.querySelector('.nav-btn[data-game="snake"]').click();
            });
        }
    }
    switchToGame(gameId) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.game === gameId);
        });
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.toggle('active', screen.id === gameId);
        });
        if (this.games[gameId] && typeof this.games[gameId].start === 'function') {
            this.games[gameId].start();
        }
        this.currentGame = gameId;
        if (!this.isMuted) {
            this.bgm.play();
        }
    }
    initializeGames() {
        this.games.snake = new SnakeGame();
        this.games.shooter = new SpaceShooterGame();
        this.games.breakout = new BreakoutGame();
        this.games.jumper = new JumperGame();
    }
    setupMuteButton() {
        const muteBtn = document.getElementById('mute-btn');
        muteBtn.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            this.updateMute();
        });
        this.updateMute();
    }
    updateMute() {
        const muteBtn = document.getElementById('mute-btn');
        if (this.isMuted) {
            this.bgm.pause();
            muteBtn.innerText = "🔇";
        } else {
            this.bgm.volume = 0.4;
            this.bgm.play();
            muteBtn.innerText = "🔊";
        }
    }
    playSound(id, volume = 0.8) {
        if (!this.isMuted) {
            try {
                const audio = document.getElementById(id);
                audio.currentTime = 0;
                audio.volume = volume;
                audio.play();
            } catch {}
        }
    }
}

// 4. Snake Game
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('snake-score');
        this.highScoreEl = document.getElementById('snake-high');
        this.restartBtn = document.getElementById('snake-restart');
        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;
        this.init();
    }
    init() {
        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.direction = {x: 0, y: 0};
        this.score = 0;
        this.gameRunning = false;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.highScoreEl.textContent = this.highScore;
        this.setupControls();
        this.draw();
    }
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning) {
                this.gameRunning = true;
                this.gameLoop();
            }
            switch(e.key) {
                case 'ArrowUp': case 'w': case 'W':
                    if (this.direction.y !== 1) this.direction = {x: 0, y: -1}; break;
                case 'ArrowDown': case 's': case 'S':
                    if (this.direction.y !== -1) this.direction = {x: 0, y: 1}; break;
                case 'ArrowLeft': case 'a': case 'A':
                    if (this.direction.x !== 1) this.direction = {x: -1, y: 0}; break;
                case 'ArrowRight': case 'd': case 'D':
                    if (this.direction.x !== -1) this.direction = {x: 1, y: 0}; break;
            }
        });
        this.restartBtn.addEventListener('click', () => { 
            hideGameOverAnimation();
            this.start();
        });
    }
    generateFood() {
        return {x: Math.floor(Math.random() * this.tileCount), y: Math.floor(Math.random() * this.tileCount)};
    }
    start() { this.init(); }
    gameLoop() {
        if (!this.gameRunning) return;
        setTimeout(() => {
            this.clearCanvas();
            this.moveSnake();
            this.drawFood();
            this.drawSnake();
            if (this.checkGameOver()) {
                this.gameRunning = false;
                this.gameOver();
                return;
            }
            this.gameLoop();
        }, 150);
    }
    clearCanvas() {
        this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    moveSnake() {
        const head = {x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y};
        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreEl.textContent = this.score;
            this.food = this.generateFood();
            window.uslessApp.playSound('eat-sound', 0.8);
        } else { this.snake.pop(); }
    }
    drawSnake() {
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#8BC34A';
            this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
        });
    }
    drawFood() {
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 2, this.gridSize - 2);
    }
    checkGameOver() {
        const head = this.snake[0];
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) return true;
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) return true;
        }
        return false;
    }
    gameOver() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreEl.textContent = this.highScore;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        window.uslessApp.playSound('gameover-sound', 0.8);
        showGameOverAnimation();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
    draw() {
        this.clearCanvas();
        this.drawFood();
        this.drawSnake();
    }
}

// 5. Space Shooter Game
class SpaceShooterGame {
    constructor() {
        this.canvas = document.getElementById('shooter-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('shooter-score');
        this.livesEl = document.getElementById('shooter-lives');
        this.restartBtn = document.getElementById('shooter-restart');
        this.init();
    }
    init() {
        this.player = { x: this.canvas.width / 2, y: this.canvas.height - 50, width: 40, height: 30, speed: 5 };
        this.bullets = [];
        this.enemies = [];
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.keys = {};
        this.setupControls();
        this.draw();
    }
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (!this.gameRunning && (e.key === ' ' || e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'd')) {
                this.gameRunning = true;
                this.gameLoop();
            }
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
        this.restartBtn.addEventListener('click', () => { 
            hideGameOverAnimation();
            this.start();
        });
    }
    start() { this.init(); }
    gameLoop() {
        if (!this.gameRunning) return;
        this.update(); this.draw();
        if (this.lives <= 0) {
            this.gameRunning = false;
            this.gameOver();
            return;
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    update() {
        if ((this.keys['a'] || this.keys['A']) && this.player.x > 0) this.player.x -= this.player.speed;
        if ((this.keys['d'] || this.keys['D']) && this.player.x < this.canvas.width - this.player.width) this.player.x += this.player.speed;
        if (this.keys[' ']) {
            this.shoot();
            this.keys[' '] = false;
            window.uslessApp.playSound('shoot-sound', 0.7);
        }
        this.bullets.forEach((bullet, index) => {
            bullet.y -= bullet.speed;
            if (bullet.y < 0) this.bullets.splice(index, 1);
        });
        if (Math.random() < 0.02) this.spawnEnemy();
        this.enemies.forEach((enemy, index) => {
            enemy.y += enemy.speed;
            if (enemy.y > this.canvas.height) this.enemies.splice(index, 1);
            if (this.checkCollision(enemy, this.player)) {
                this.enemies.splice(index, 1);
                this.lives--;
                this.livesEl.textContent = this.lives;
                window.uslessApp.playSound('hit-sound', 0.8);
            }
        });
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.checkCollision(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 10;
                    this.scoreEl.textContent = this.score;
                    window.uslessApp.playSound('hit-sound', 0.8);
                }
            });
        });
    }
    shoot() {
        this.bullets.push({ x: this.player.x + this.player.width / 2, y: this.player.y, width: 3, height: 10, speed: 8 });
    }
    spawnEnemy() {
        this.enemies.push({ x: Math.random() * (this.canvas.width - 30), y: 0, width: 30, height: 30, speed: 2 + Math.random() * 3 });
    }
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawStars();
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.fillStyle = '#FFFF00';
        this.bullets.forEach(bullet => this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));
        this.ctx.fillStyle = '#FF0000';
        this.enemies.forEach(enemy => this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height));
    }
    drawStars() {
        this.ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
    gameOver() {
        window.uslessApp.playSound('gameover-sound', 0.8);
        showGameOverAnimation();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
}

// 6. Breakout Game
class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('breakout-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('breakout-score');
        this.livesEl = document.getElementById('breakout-lives');
        this.restartBtn = document.getElementById('breakout-restart');
        this.init();
    }
    init() {
        this.paddle = { x: this.canvas.width / 2 - 50, y: this.canvas.height - 30, width: 100, height: 15, speed: 8 };
        this.ball = { x: this.canvas.width / 2, y: this.canvas.height - 50, dx: 4, dy: -4, radius: 8 };
        this.bricks = [];
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.keys = {};
        this.createBricks();
        this.setupControls();
        this.draw();
    }
    createBricks() {
        const rows = 5, cols = 8, brickWidth = 70, brickHeight = 20, padding = 5, offsetTop = 60, offsetLeft = 35;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.bricks.push({ x: c * (brickWidth + padding) + offsetLeft, y: r * (brickHeight + padding) + offsetTop, width: brickWidth, height: brickHeight, visible: true, color: `hsl(${r * 60}, 70%, 50%)` });
            }
        }
    }
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (!this.gameRunning) {
                this.gameRunning = true;
                this.gameLoop();
            }
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
        this.restartBtn.addEventListener('click', () => { 
            hideGameOverAnimation();
            this.start();
        });
    }
    start() { this.init(); }
    gameLoop() {
        if (!this.gameRunning) return;
        this.update(); this.draw();
        if (this.lives <= 0 || this.bricks.every(brick => !brick.visible)) {
            this.gameRunning = false;
            this.gameOver();
            return;
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    update() {
        if ((this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) && this.paddle.x > 0) this.paddle.x -= this.paddle.speed;
        if ((this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) && this.paddle.x < this.canvas.width - this.paddle.width) this.paddle.x += this.paddle.speed;
        this.ball.x += this.ball.dx; this.ball.y += this.ball.dy;
        if (this.ball.x + this.ball.radius > this.canvas.width || this.ball.x - this.ball.radius < 0) this.ball.dx = -this.ball.dx;
        if (this.ball.y - this.ball.radius < 0) this.ball.dy = -this.ball.dy;
        if (this.ball.y + this.ball.radius > this.paddle.y && this.ball.x > this.paddle.x && this.ball.x < this.paddle.x + this.paddle.width) this.ball.dy = -this.ball.dy;
        this.bricks.forEach(brick => {
            if (brick.visible && this.ball.x + this.ball.radius > brick.x && this.ball.x - this.ball.radius < brick.x + brick.width && this.ball.y + this.ball.radius > brick.y && this.ball.y - this.ball.radius < brick.y + brick.height) {
                this.ball.dy = -this.ball.dy;
                brick.visible = false;
                this.score += 10;
                this.scoreEl.textContent = this.score;
                window.uslessApp.playSound('hit-sound', 0.7);
            }
        });
        if (this.ball.y > this.canvas.height) {
            this.lives--;
            this.livesEl.textContent = this.lives;
            this.ball.x = this.canvas.width / 2;
            this.ball.y = this.canvas.height - 50;
            this.ball.dy = -4;
            window.uslessApp.playSound('gameover-sound', 0.8);
        }
    }
    draw() {
        this.ctx.fillStyle = '#000'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#0095DD'; this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
        this.ctx.beginPath(); this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2); this.ctx.fillStyle = '#0095DD'; this.ctx.fill(); this.ctx.closePath();
        this.bricks.forEach(brick => { if (brick.visible) { this.ctx.fillStyle = brick.color; this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height); } });
    }
    gameOver() {
        const won = this.bricks.every(brick => !brick.visible);
        window.uslessApp.playSound('gameover-sound', 0.8);
        showGameOverAnimation();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff'; this.ctx.font = '30px Arial'; this.ctx.textAlign = 'center';
        this.ctx.fillText(won ? 'You Won!' : 'Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial'; this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
}

// 7. Jumper Game
class JumperGame {
    constructor() {
        this.canvas = document.getElementById('jumper-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('jumper-score');
        this.highScoreEl = document.getElementById('jumper-high');
        this.restartBtn = document.getElementById('jumper-restart');
        this.init();
    }
    init() {
        this.player = {
            x: 100,
            y: this.canvas.height - 60,
            width: 30,
            height: 30,
            velocityY: 0,
            grounded: true
        };
        this.obstacles = [];
        this.coins = [];
        this.score = 0;
        this.gameSpeed = 3;
        this.gameRunning = false;
        this.jumpPower = 15;
        this.highScore = localStorage.getItem('jumperHighScore') || 0;
        this.highScoreEl.textContent = this.highScore;
        this.setupControls();
        this.draw();
    }
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                if (!this.gameRunning) {
                    this.gameRunning = true;
                    this.gameLoop();
                }
                this.jump();
            }
        });
        this.restartBtn.addEventListener('click', () => { 
            hideGameOverAnimation();
            this.start(); 
        });
    }
    start() { this.init(); }
    jump() {
        if (this.player.grounded) {
            this.player.velocityY = -this.jumpPower;
            this.player.grounded = false;
            window.uslessApp.playSound('jump-sound', 0.6);
        }
    }
    gameLoop() {
        if (!this.gameRunning) return;
        this.update();
        this.draw();
        if (this.checkCollisions()) {
            this.gameRunning = false;
            this.gameOver();
            return;
        }
        requestAnimationFrame(() => this.gameLoop());
    }
    update() {
        this.player.velocityY += 0.8;
        this.player.y += this.player.velocityY;
        if (this.player.y > this.canvas.height - 60) {
            this.player.y = this.canvas.height - 60;
            this.player.velocityY = 0;
            this.player.grounded = true;
        }
        if (Math.random() < 0.01) this.spawnObstacle();
        if (Math.random() < 0.008) this.spawnCoin();
        this.obstacles.forEach((obstacle, index) => {
            obstacle.x -= this.gameSpeed;
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(index, 1);
                this.score += 5;
                this.scoreEl.textContent = this.score;
            }
        });
        this.coins.forEach((coin, index) => {
            coin.x -= this.gameSpeed;
            if (coin.x + coin.width < 0) this.coins.splice(index, 1);
        });
        this.gameSpeed += 0.001;
    }
    spawnObstacle() {
        this.obstacles.push({
            x: this.canvas.width,
            y: this.canvas.height - 50,
            width: 30,
            height: 50
        });
    }
    spawnCoin() {
        this.coins.push({
            x: this.canvas.width,
            y: this.canvas.height - 100 - Math.random() * 50,
            width: 20,
            height: 20
        });
    }
    checkCollisions() {
        for (let obstacle of this.obstacles) {
            if (this.player.x < obstacle.x + obstacle.width &&
                this.player.x + this.player.width > obstacle.x &&
                this.player.y < obstacle.y + obstacle.height &&
                this.player.y + this.player.height > obstacle.y) {
                return true;
            }
        }
        this.coins.forEach((coin, index) => {
            if (this.player.x < coin.x + coin.width &&
                this.player.x + this.player.width > coin.x &&
                this.player.y < coin.y + coin.height &&
                this.player.y + this.player.height > coin.y) {
                this.coins.splice(index, 1);
                this.score += 20;
                this.scoreEl.textContent = this.score;
                window.uslessApp.playSound('eat-sound', 0.7);
            }
        });
        return false;
    }
    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.canvas.height - 30, this.canvas.width, 30);
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.fillStyle = '#8B0000';
        this.obstacles.forEach(obstacle => this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height));
        this.ctx.fillStyle = '#FFD700';
        this.coins.forEach(coin => this.ctx.fillRect(coin.x, coin.y, coin.width, coin.height));
    }
    gameOver() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreEl.textContent = this.highScore;
            localStorage.setItem('jumperHighScore', this.highScore);
        }
        window.uslessApp.playSound('gameover-sound', 0.8);
        showGameOverAnimation();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
}

// 8. Start app after DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uslessApp = new UsLessApp();
});
