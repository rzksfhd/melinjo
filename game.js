// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_HEIGHT = 50;
const GRAVITY = 0.6;
const JUMP_FORCE = -15;
const FLYING_FORCE_MULTIPLIER = 0.5;
const ENERGY_MAX = 100;
const ENERGY_JUMP_COST = 20;
const ENERGY_REFILL_RATE = 0.3;
const GAME_DURATION = 30; // seconds
const SCROLL_SPEED = 5;

// Game variables
let canvas, ctx;
let player;
let obstacles = [];
let melinjos = [];
let gameTime = 0;
let gameActive = true;
let lastTimestamp = 0;
let energy = ENERGY_MAX;

// Asset placeholders (replace with actual images later)
const dinoImage = new Image();
const melinjoImage = new Image();

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    // Initialize player
    player = {
        x: 100,
        y: CANVAS_HEIGHT - GROUND_HEIGHT - 40, // 40 is player height
        width: 50,
        height: 40,
        velocityY: 0,
        isJumping: false,
        jumpCount: 0
    };
    
    // Generate initial obstacles and melinjos
    generateObstacles();
    generateMelinjos();
    
    // Set up keyboard controls
    setupControls();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
};

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time for smooth animations
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (gameActive) {
        // Update game time
        gameTime += deltaTime / 1000; // Convert to seconds
        
        // Check if game is over
        if (gameTime >= GAME_DURATION) {
            gameActive = false;
        }
        
        // Update game elements
        updatePlayer();
        updateObstacles();
        updateMelinjos();
        updateEnergy();
        
        // Check collisions
        checkCollisions();
    }
    
    // Draw game elements
    drawBackground();
    drawGround();
    drawObstacles();
    drawMelinjos();
    drawPlayer();
    drawUI();
    
    // Display game over message if game is not active
    if (!gameActive) {
        drawGameOver();
    }
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Set up keyboard controls
function setupControls() {
    document.addEventListener('keydown', function(event) {
        // Space bar for jumping
        if (event.code === 'Space' && gameActive) {
            if (!player.isJumping) {
                // Initial jump
                if (energy >= ENERGY_JUMP_COST) {
                    player.velocityY = JUMP_FORCE;
                    player.isJumping = true;
                    player.jumpCount = 1;
                    energy -= ENERGY_JUMP_COST;
                }
            } else {
                // Additional jumps (flying) with diminishing height
                if (energy >= ENERGY_JUMP_COST) {
                    const flyingForce = JUMP_FORCE * FLYING_FORCE_MULTIPLIER / player.jumpCount;
                    player.velocityY = flyingForce;
                    player.jumpCount++;
                    energy -= ENERGY_JUMP_COST;
                }
            }
        }
    });
}

// Update player position and state
function updatePlayer() {
    // Apply gravity
    player.velocityY += GRAVITY;
    
    // Update player position
    player.y += player.velocityY;
    
    // Check if player is on the ground
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT - player.height;
    if (player.y >= groundY) {
        player.y = groundY;
        player.velocityY = 0;
        player.isJumping = false;
        player.jumpCount = 0;
    }
}

// Generate obstacles
function generateObstacles() {
    // Clear existing obstacles
    obstacles = [];
    
    // Generate random obstacles throughout the level
    const totalDistance = SCROLL_SPEED * GAME_DURATION * 60; // Approximate total level distance
    let position = 800; // Start after the visible screen
    
    while (position < totalDistance + 800) {
        // Random obstacle type (0: rock, 1: water)
        const type = Math.floor(Math.random() * 2);
        const width = type === 0 ? 30 + Math.random() * 20 : 60 + Math.random() * 40;
        const height = type === 0 ? 20 + Math.random() * 30 : 20;
        
        obstacles.push({
            x: position,
            y: CANVAS_HEIGHT - GROUND_HEIGHT - height,
            width: width,
            height: height,
            type: type
        });
        
        // Random distance between obstacles
        position += 300 + Math.random() * 300;
    }
}

// Generate melinjo fruits
function generateMelinjos() {
    // Clear existing melinjos
    melinjos = [];
    
    // Generate random melinjos throughout the level
    const totalDistance = SCROLL_SPEED * GAME_DURATION * 60; // Approximate total level distance
    let position = 800; // Start after the visible screen
    
    while (position < totalDistance + 800) {
        // Random height for melinjos
        const height = 100 + Math.random() * 150;
        
        melinjos.push({
            x: position,
            y: CANVAS_HEIGHT - GROUND_HEIGHT - height,
            width: 20,
            height: 20,
            collected: false
        });
        
        // Random distance between melinjos
        position += 200 + Math.random() * 400;
    }
}

// Update obstacles position
function updateObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= SCROLL_SPEED;
    }
}

// Update melinjos position
function updateMelinjos() {
    for (let i = 0; i < melinjos.length; i++) {
        melinjos[i].x -= SCROLL_SPEED;
    }
}

// Update energy level
function updateEnergy() {
    // Refill energy over time
    if (energy < ENERGY_MAX) {
        energy += ENERGY_REFILL_RATE;
        if (energy > ENERGY_MAX) {
            energy = ENERGY_MAX;
        }
    }
    
    // Update energy bar UI
    document.getElementById('energyBar').style.width = `${energy}%`;
}

// Check collisions between player and game elements
function checkCollisions() {
    // Check obstacle collisions
    for (let i = 0; i < obstacles.length; i++) {
        if (!obstacles[i].passed && 
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y) {
            // Collision with obstacle - game over
            gameActive = false;
            return;
        }
        
        // Mark obstacles as passed
        if (obstacles[i].x + obstacles[i].width < player.x && !obstacles[i].passed) {
            obstacles[i].passed = true;
        }
    }
    
    // Check melinjo collisions
    for (let i = 0; i < melinjos.length; i++) {
        if (!melinjos[i].collected && 
            player.x < melinjos[i].x + melinjos[i].width &&
            player.x + player.width > melinjos[i].x &&
            player.y < melinjos[i].y + melinjos[i].height &&
            player.y + player.height > melinjos[i].y) {
            // Collect melinjo
            melinjos[i].collected = true;
            
            // Restore energy
            energy += 30;
            if (energy > ENERGY_MAX) {
                energy = ENERGY_MAX;
            }
        }
    }
    
    // Check if player fell off the screen
    if (player.y > CANVAS_HEIGHT) {
        gameActive = false;
    }
}

// Draw the background
function drawBackground() {
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);
}

// Draw the ground
function drawGround() {
    ctx.fillStyle = '#8B4513'; // Brown
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);
    
    // Draw grass on top of the ground
    ctx.fillStyle = '#7CFC00'; // Lawn green
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, 5);
}

// Draw the player (dinosaur)
function drawPlayer() {
    // For now, draw a simple rectangle as the dinosaur
    ctx.fillStyle = '#228B22'; // Forest green
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x + 35, player.y + 10, 10, 10);
    ctx.fillStyle = 'black';
    ctx.fillRect(player.x + 40, player.y + 12, 5, 5);
}

// Draw obstacles
function drawObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].x + obstacles[i].width > 0 && obstacles[i].x < CANVAS_WIDTH) {
            if (obstacles[i].type === 0) {
                // Rock
                ctx.fillStyle = '#808080'; // Gray
                ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
            } else {
                // Water
                ctx.fillStyle = '#1E90FF'; // Dodger blue
                ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
            }
        }
    }
}

// Draw melinjo fruits
function drawMelinjos() {
    for (let i = 0; i < melinjos.length; i++) {
        if (!melinjos[i].collected && 
            melinjos[i].x + melinjos[i].width > 0 && 
            melinjos[i].x < CANVAS_WIDTH) {
            // Draw a simple circle as melinjo
            ctx.fillStyle = '#FF6347'; // Tomato red
            ctx.beginPath();
            ctx.arc(
                melinjos[i].x + melinjos[i].width / 2,
                melinjos[i].y + melinjos[i].height / 2,
                melinjos[i].width / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
}

// Draw UI elements
function drawUI() {
    // Update timer
    document.getElementById('timer').textContent = `Time: ${Math.floor(gameTime)}s / ${GAME_DURATION}s`;
    
    // Energy bar is updated in updateEnergy()
}

// Draw game over message
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    
    if (gameTime >= GAME_DURATION) {
        ctx.fillText('Level Complete!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else {
        ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    
    ctx.font = '24px Arial';
    ctx.fillText('Press F5 to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}