// Football Game JavaScript - Enhanced Version
// Game Variables
let players = [];
let playersOnField = [];
let selectedPlayer = null;
let ball = null;
let ballWithPlayer = null;
let gameRunning = false;
let matchTime = 0;
let matchInterval = null;
let teamAScore = 0;
let teamBScore = 0;
let isSprinting = false;
let possession = { teamA: 50, teamB: 50 };
let ballAnimationFrame = null;
let aiUpdateInterval = null;
let keysPressed = {};
let shiftPressed = false;
let lastBallTouchTime = 0;
let gameSpeed = 1;
let playerCollisionCooldown = {};
let gameEvents = [];

// Enhanced Player Data
const playerData = {
    teamA: [
        { id: 1, name: "Alex GK", position: "Goalkeeper", number: 1, skill: 85, speed: 70, defense: 90, attack: 30, stamina: 95 },
        { id: 2, name: "Ben", position: "Defender", number: 4, skill: 78, speed: 75, defense: 85, attack: 40, stamina: 85 },
        { id: 3, name: "Chris", position: "Defender", number: 5, skill: 82, speed: 72, defense: 88, attack: 35, stamina: 87 },
        { id: 4, name: "David", position: "Defender", number: 3, skill: 80, speed: 78, defense: 83, attack: 45, stamina: 84 },
        { id: 5, name: "Ethan", position: "Defender", number: 2, skill: 79, speed: 76, defense: 82, attack: 42, stamina: 83 },
        { id: 6, name: "Finn", position: "Midfielder", number: 8, skill: 84, speed: 82, defense: 75, attack: 70, stamina: 88 },
        { id: 7, name: "Greg", position: "Midfielder", number: 10, skill: 86, speed: 85, defense: 70, attack: 85, stamina: 90 },
        { id: 8, name: "Harry", position: "Midfielder", number: 6, skill: 83, speed: 80, defense: 78, attack: 65, stamina: 86 },
        { id: 9, name: "Ian", position: "Midfielder", number: 7, skill: 81, speed: 79, defense: 72, attack: 68, stamina: 85 },
        { id: 10, name: "Jack", position: "Forward", number: 9, skill: 88, speed: 90, defense: 45, attack: 92, stamina: 92 },
        { id: 11, name: "Kyle", position: "Forward", number: 11, skill: 85, speed: 88, defense: 50, attack: 90, stamina: 91 }
    ],
    teamB: [
        { id: 12, name: "AI GK", position: "Goalkeeper", number: 1, skill: 82, speed: 70, defense: 88, attack: 25, stamina: 94 },
        { id: 13, name: "AI Def 1", position: "Defender", number: 4, skill: 76, speed: 78, defense: 83, attack: 38, stamina: 84 },
        { id: 14, name: "AI Def 2", position: "Defender", number: 5, skill: 79, speed: 80, defense: 85, attack: 35, stamina: 86 },
        { id: 15, name: "AI Def 3", position: "Defender", number: 3, skill: 78, speed: 79, defense: 81, attack: 40, stamina: 83 },
        { id: 16, name: "AI Def 4", position: "Defender", number: 2, skill: 80, speed: 81, defense: 84, attack: 38, stamina: 85 },
        { id: 17, name: "AI Mid 1", position: "Midfielder", number: 8, skill: 84, speed: 85, defense: 73, attack: 72, stamina: 89 },
        { id: 18, name: "AI Mid 2", position: "Midfielder", number: 10, skill: 87, speed: 88, defense: 68, attack: 88, stamina: 91 },
        { id: 19, name: "AI Mid 3", position: "Midfielder", number: 6, skill: 83, speed: 86, defense: 76, attack: 68, stamina: 87 },
        { id: 20, name: "AI For 1", position: "Forward", number: 9, skill: 89, speed: 93, defense: 42, attack: 94, stamina: 93 },
        { id: 21, name: "AI For 2", position: "Forward", number: 11, skill: 85, speed: 90, defense: 48, attack: 92, stamina: 92 },
        { id: 22, name: "AI For 3", position: "Forward", number: 7, skill: 87, speed: 89, defense: 46, attack: 91, stamina: 91 }
    ]
};

// Initialize the game
function initGame() {
    createPlayers();
    createBall();
    setupEventListeners();
    setupKeyboardControls();
    updateDisplay();
    addEvent("⚽ Game initialized. Click Start to begin!", 'system');
    startAIUpdates();
    startGameLoop();
}

// Start main game loop for smooth animation
function startGameLoop() {
    let lastTime = 0;
    
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = Math.min(timestamp - lastTime, 100) / 16;
        lastTime = timestamp;
        
        if (gameRunning) {
            updatePlayerMovement(deltaTime);
            updateBall(deltaTime);
            updateStamina(deltaTime);
            updatePlayerAnimations();
        }
        
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
}

// Update player movement with delta time
function updatePlayerMovement(deltaTime) {
    if (!selectedPlayer || !gameRunning || !selectedPlayer.hasBall) return;
    
    let moveX = 0;
    let moveY = 0;
    
    // Check keyboard inputs
    if (keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) moveY -= 1;
    if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) moveY += 1;
    if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) moveX -= 1;
    if (keysPressed['ArrowRight'] || keysPressed['d'] || keysPressed['D']) moveX += 1;
    
    if (moveX !== 0 || moveY !== 0) {
        // Normalize diagonal movement
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        if (length > 0) {
            moveX /= length;
            moveY /= length;
        }
        
        // Apply speed with sprint consideration
        const baseSpeed = 1.2;
        const sprintMultiplier = (shiftPressed || isSprinting) && selectedPlayer.stamina > 20 ? 1.8 : 1.0;
        const currentStaminaEffect = Math.max(0.5, selectedPlayer.stamina / 100);
        const speed = baseSpeed * sprintMultiplier * currentStaminaEffect * deltaTime * gameSpeed;
        
        moveSelectedPlayer(moveX * speed, moveY * speed);
        
        // Consume stamina when sprinting
        if (sprintMultiplier > 1.0) {
            selectedPlayer.stamina = Math.max(0, selectedPlayer.stamina - 0.5 * deltaTime);
        }
    } else {
        // Regenerate stamina when idle
        if (selectedPlayer.stamina < 100) {
            selectedPlayer.stamina = Math.min(100, selectedPlayer.stamina + 0.2 * deltaTime);
        }
    }
}

// Enhanced player movement with collision detection
function moveSelectedPlayer(deltaX, deltaY) {
    if (!selectedPlayer) return;
    
    let newX = selectedPlayer.x + deltaX;
    let newY = selectedPlayer.y + deltaY;
    
    // Enhanced boundary checking with position-based restrictions
    if (selectedPlayer.team === 'team-a') {
        // Team A (Blue) - restricted to their half mostly
        if (selectedPlayer.position === 'Goalkeeper') {
            newX = Math.max(5, Math.min(15, newX));
        } else if (selectedPlayer.position === 'Defender') {
            newX = Math.max(10, Math.min(40, newX));
        } else {
            newX = Math.max(5, Math.min(80, newX));
        }
    } else {
        // Team B (Red) - restricted to their half mostly
        if (selectedPlayer.position === 'Goalkeeper') {
            newX = Math.max(85, Math.min(95, newX));
        } else if (selectedPlayer.position === 'Defender') {
            newX = Math.max(60, Math.min(90, newX));
        } else {
            newX = Math.max(20, Math.min(95, newX));
        }
    }
    
    newY = Math.max(5, Math.min(95, newY));
    
    // Check for collisions with other players
    const collisionRadius = 4;
    let hasCollision = false;
    
    for (const player of playersOnField) {
        if (player === selectedPlayer) continue;
        
        const dx = player.x - newX;
        const dy = player.y - newY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < collisionRadius) {
            // Collision detected
            hasCollision = true;
            
            // If opponent has ball, attempt tackle
            if (player.hasBall && player.team !== selectedPlayer.team) {
                attemptTackle(selectedPlayer, player);
                break;
            }
            
            // Push players apart
            if (distance > 0) {
                const pushForce = 0.5;
                newX -= (dx / distance) * pushForce;
                newY -= (dy / distance) * pushForce;
            }
        }
    }
    
    // Update player position
    selectedPlayer.x = newX;
    selectedPlayer.y = newY;
    selectedPlayer.element.style.left = `${newX}%`;
    selectedPlayer.element.style.top = `${newY}%`;
    
    // If player has ball, move ball with player
    if (selectedPlayer.hasBall) {
        moveBallWithPlayer();
    }
    
    // Set moving animation
    if (deltaX !== 0 || deltaY !== 0) {
        selectedPlayer.isMoving = true;
        selectedPlayer.element.classList.add('running');
    }
}

// Start AI updates with better timing
function startAIUpdates() {
    if (aiUpdateInterval) clearInterval(aiUpdateInterval);
    aiUpdateInterval = setInterval(() => {
        if (gameRunning) {
            updateAITeam();
        }
    }, 250); // Slightly faster AI updates
}

// Stop AI updates
function stopAIUpdates() {
    if (aiUpdateInterval) {
        clearInterval(aiUpdateInterval);
        aiUpdateInterval = null;
    }
}

// Enhanced AI team update
function updateAITeam() {
    if (!gameRunning) return;
    
    // Update each AI player
    playersOnField.forEach(player => {
        if (player.team === 'team-b' && !player.hasBall) {
            updateAIPlayer(player);
        }
    });
    
    // Make team-wide decisions
    makeTeamAIDecision();
}

// Enhanced AI player update
function updateAIPlayer(player) {
    if (!player || player.hasBall) return;
    
    const currentTime = Date.now();
    const playerId = `player_${player.id}`;
    
    // Check collision cooldown
    if (playerCollisionCooldown[playerId] && currentTime - playerCollisionCooldown[playerId] < 500) {
        return;
    }
    
    // Decision logic based on game state
    if (ballWithPlayer) {
        if (ballWithPlayer.team === player.team) {
            // Supporting teammate
            if (Math.random() < 0.7) {
                moveToSupportPosition(player);
            } else {
                moveToOpenSpace(player);
            }
        } else {
            // Defending against opponent
            if (player.position === 'Defender' || player.position === 'Goalkeeper') {
                moveToDefensivePosition(player);
            } else {
                moveToPressurePosition(player);
            }
        }
    } else if (ball.isMoving) {
        // Ball is loose
        if (Math.random() < 0.4 || player.position === 'Forward') {
            moveTowardBall(player);
        } else {
            moveToTacticalPosition(player);
        }
    } else {
        // Ball is static
        returnToPosition(player);
    }
}

// Team-wide AI decision making
function makeTeamAIDecision() {
    if (!ballWithPlayer || ballWithPlayer.team !== 'team-b' || !gameRunning) return;
    
    const ballHolder = ballWithPlayer;
    const decision = Math.random();
    const timeSinceLastTouch = Date.now() - lastBallTouchTime;
    
    // Don't make decisions too frequently
    if (timeSinceLastTouch < 800) return;
    
    if (decision < 0.3 && isInShootingRange(ballHolder)) {
        // Shoot if in range
        setTimeout(() => aiShootBall(ballHolder), 300);
    } else if (decision < 0.7) {
        // Look for pass
        setTimeout(() => {
            if (ballWithPlayer === ballHolder) {
                aiPassBall(ballHolder);
            }
        }, 200);
    } else {
        // Dribble or hold ball
        setTimeout(() => {
            if (ballWithPlayer === ballHolder) {
                aiDribble(ballHolder);
            }
        }, 400);
    }
}

// Check if player is in shooting range
function isInShootingRange(player) {
    if (player.team === 'team-b') {
        const distanceToGoal = player.x;
        return distanceToGoal < 35;
    } else {
        const distanceToGoal = 100 - player.x;
        return distanceToGoal < 35;
    }
}

// Enhanced createPlayers function
function createPlayers() {
    const field = document.getElementById('football-field');
    
    // Clear existing players
    playersOnField.forEach(player => {
        if (player.element) player.element.remove();
    });
    playersOnField = [];
    players = [];

    const teamAPositions = [
        { x: 10, y: 50 },  // Goalkeeper
        { x: 25, y: 20 }, { x: 25, y: 35 }, { x: 25, y: 65 }, { x: 25, y: 80 }, // Defenders
        { x: 45, y: 15 }, { x: 45, y: 40 }, { x: 45, y: 60 }, { x: 45, y: 85 }, // Midfielders
        { x: 65, y: 35 }, { x: 65, y: 65 } // Forwards
    ];

    const teamBPositions = [
        { x: 90, y: 50 },  // Goalkeeper
        { x: 75, y: 20 }, { x: 75, y: 35 }, { x: 75, y: 65 }, { x: 75, y: 80 }, // Defenders
        { x: 55, y: 25 }, { x: 55, y: 50 }, { x: 55, y: 75 }, // Midfielders
        { x: 35, y: 25 }, { x: 35, y: 50 }, { x: 35, y: 75 } // Forwards
    ];

    playerData.teamA.forEach((data, index) => {
        if (index < teamAPositions.length) {
            createPlayer(data, 'team-a', teamAPositions[index]);
        }
    });

    playerData.teamB.forEach((data, index) => {
        if (index < teamBPositions.length) {
            createPlayer(data, 'team-b', teamBPositions[index]);
        }
    });
}

// Enhanced createPlayer function
function createPlayer(data, team, position) {
    const field = document.getElementById('football-field');
    
    const playerElement = document.createElement('div');
    playerElement.className = `player ${team} ${data.position.toLowerCase()}`;
    playerElement.style.left = `${position.x}%`;
    playerElement.style.top = `${position.y}%`;
    playerElement.dataset.playerId = data.id;
    
    playerElement.innerHTML = `
        <div class="player-head"></div>
        <div class="player-body"></div>
        <div class="player-jersey">${data.number}</div>
        <div class="player-legs">
            <div class="leg"></div>
            <div class="leg"></div>
        </div>
        <div class="player-stamina">
            <div class="stamina-bar" style="width: ${data.stamina}%"></div>
        </div>
    `;

    field.appendChild(playerElement);

    const player = {
        ...data,
        team: team,
        element: playerElement,
        x: position.x,
        y: position.y,
        originalPosition: { x: position.x, y: position.y },
        isMoving: false,
        hasBall: false,
        stamina: data.stamina,
        targetX: position.x,
        targetY: position.y,
        lastActionTime: 0,
        actionCooldown: 0
    };

    playersOnField.push(player);
    players.push(player);

    if (team === 'team-a') {
        playerElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectPlayer(player);
        });
        playerElement.style.cursor = 'pointer';
    } else {
        playerElement.style.cursor = 'default';
    }
}

// Enhanced createBall function
function createBall() {
    const field = document.getElementById('football-field');
    
    // Remove existing ball
    if (ball) {
        ball.element.remove();
        if (ballAnimationFrame) {
            cancelAnimationFrame(ballAnimationFrame);
        }
    }

    const ballElement = document.createElement('div');
    ballElement.className = 'football';
    ballElement.id = 'football';
    ballElement.innerHTML = '<div class="ball-pattern"></div>';
    
    field.appendChild(ballElement);

    ball = {
        element: ballElement,
        x: 50,
        y: 50,
        velocityX: 0,
        velocityY: 0,
        withPlayer: null,
        isMoving: false,
        rotation: 0,
        lastTouch: null
    };

    // Give ball to a random player initially
    setTimeout(() => {
        const teamAForward = playersOnField.find(p => p.team === 'team-a' && p.position === 'Forward');
        if (teamAForward) {
            giveBallToPlayer(teamAForward);
        } else {
            const randomPlayer = playersOnField[Math.floor(Math.random() * playersOnField.length)];
            giveBallToPlayer(randomPlayer);
        }
    }, 1000);
}

// Enhanced updateBall function with physics
function updateBall(deltaTime) {
    if (!ball) return;
    
    // Apply gravity effect (very slight)
    ball.velocityY += 0.001;
    
    // Apply velocity with delta time
    ball.x += ball.velocityX * deltaTime * gameSpeed;
    ball.y += ball.velocityY * deltaTime * gameSpeed;
    
    // Enhanced boundary bouncing with goal areas
    const inLeftGoalArea = ball.x <= 5 && ball.y >= 40 && ball.y <= 60;
    const inRightGoalArea = ball.x >= 95 && ball.y >= 40 && ball.y <= 60;
    
    if (!inLeftGoalArea && !inRightGoalArea) {
        // Regular boundary bouncing
        if (ball.x <= 2) {
            ball.velocityX = Math.abs(ball.velocityX) * 0.7;
            ball.x = 2.1;
            addEvent("Ball hits the side!", 'wall');
        }
        if (ball.x >= 98) {
            ball.velocityX = -Math.abs(ball.velocityX) * 0.7;
            ball.x = 97.9;
            addEvent("Ball hits the side!", 'wall');
        }
        if (ball.y <= 2) {
            ball.velocityY = Math.abs(ball.velocityY) * 0.7;
            ball.y = 2.1;
        }
        if (ball.y >= 98) {
            ball.velocityY = -Math.abs(ball.velocityY) * 0.7;
            ball.y = 97.9;
        }
    }
    
    // Enhanced friction based on surface
    const friction = 0.965;
    ball.velocityX *= friction;
    ball.velocityY *= friction;
    
    // Update visual position
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
    
    // Rotate ball based on movement
    const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
    if (speed > 0.1) {
        ball.rotation += speed * 2;
        ball.element.style.transform = `rotate(${ball.rotation}deg)`;
        ball.element.classList.add('moving');
        ball.isMoving = true;
    } else {
        ball.element.classList.remove('moving');
        ball.isMoving = false;
        ball.velocityX = 0;
        ball.velocityY = 0;
    }
    
    // Enhanced player contact detection
    checkBallContact();
    
    // Check for goals
    checkForGoal();
    
    // Update possession stats when ball moves
    if (ball.isMoving) {
        updatePossessionDuringPlay();
    }
}

// Enhanced ball contact detection
function checkBallContact() {
    if (!ball || ball.withPlayer || !ball.isMoving) return;
    
    const currentTime = Date.now();
    
    // Sort players by distance to ball for priority
    const playersNearBall = playersOnField
        .filter(player => {
            if (player.hasBall) return false;
            
            const dx = player.x - ball.x;
            const dy = player.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Distance threshold based on player position
            const interceptRange = player.position === 'Goalkeeper' ? 6 : 
                                  player.position === 'Defender' ? 5 : 4;
            
            return distance < interceptRange;
        })
        .sort((a, b) => {
            const distA = Math.sqrt((a.x - ball.x) ** 2 + (a.y - ball.y) ** 2);
            const distB = Math.sqrt((b.x - ball.x) ** 2 + (b.y - ball.y) ** 2);
            return distA - distB;
        });
    
    if (playersNearBall.length > 0) {
        const interceptingPlayer = playersNearBall[0];
        
        // Calculate interception chance based on skill and position
        const interceptionChance = (interceptingPlayer.skill / 100) * 
                                  (interceptingPlayer.position === 'Goalkeeper' ? 1.2 : 
                                   interceptingPlayer.position === 'Defender' ? 1.1 : 1.0);
        
        if (Math.random() < interceptionChance) {
            interceptBall(interceptingPlayer);
        } else {
            // Deflect ball
            deflectBall(interceptingPlayer);
        }
    }
}

// Intercept ball function
function interceptBall(player) {
    giveBallToPlayer(player);
    
    // Add successful interception event
    if (player.team === 'team-a') {
        addEvent(`${player.name} intercepts the ball!`, 'interception');
    }
}

// Deflect ball function
function deflectBall(player) {
    // Calculate deflection angle
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        // Deflect ball away from player
        ball.velocityX = (dx / distance) * 2;
        ball.velocityY = (dy / distance) * 2;
        
        // Reduce ball speed after deflection
        ball.velocityX *= 0.7;
        ball.velocityY *= 0.7;
        
        addEvent(`${player.name} deflects the ball!`, 'deflection');
    }
}

// Enhanced giveBallToPlayer function
function giveBallToPlayer(player) {
    if (ball.withPlayer === player || !player) return;
    
    // Remove ball from previous player
    if (ball.withPlayer) {
        ball.withPlayer.hasBall = false;
        ball.withPlayer.element.classList.remove('has-ball');
        ball.withPlayer.isMoving = false;
        ball.withPlayer.element.classList.remove('running');
    }
    
    // Give to new player
    ball.withPlayer = player;
    ballWithPlayer = player;
    player.hasBall = true;
    player.element.classList.add('has-ball');
    lastBallTouchTime = Date.now();
    ball.lastTouch = player;
    
    // Stop ball movement
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.x = player.x;
    ball.y = player.y - 3;
    ball.isMoving = false;
    ball.rotation = 0;
    ball.element.style.transform = 'rotate(0deg)';
    
    // Cancel animation frame
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    // Update visual position
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
    ball.element.classList.remove('moving');
    
    // Update display and stats
    updateBallPossession();
    updatePossessionStats(player.team === 'team-a' ? 'teamA' : 'teamB');
    
    // Add event
    const eventType = player.team === 'team-a' ? 'possession' : 'opposition';
    addEvent(`${player.name} controls the ball!`, eventType);
    
    // If AI player gets the ball, make AI decision after delay
    if (player.team === 'team-b' && gameRunning) {
        setTimeout(() => {
            makeAIDecision(player);
        }, 600 + Math.random() * 400);
    }
    
    // Trigger player reaction animation
    player.element.classList.add('ball-control');
    setTimeout(() => {
        player.element.classList.remove('ball-control');
    }, 300);
}

// Move ball with player (enhanced)
function moveBallWithPlayer() {
    if (!ball.withPlayer) return;
    
    // Ball position relative to player (slightly ahead in movement direction)
    const player = ball.withPlayer;
    const ballOffsetX = player.isMoving ? 1 : 0;
    const ballOffsetY = -3; // Above player's feet
    
    ball.x = player.x + ballOffsetX;
    ball.y = player.y + ballOffsetY;
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
}

// Enhanced passBall function with better targeting
function passBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!", 'warning');
        return;
    }
    
    // Find all teammates
    const teammates = playersOnField.filter(p => 
        p.team === selectedPlayer.team && 
        p !== selectedPlayer &&
        !p.hasBall
    );
    
    if (teammates.length > 0) {
        // Find the best passing option based on position and openness
        let bestTarget = null;
        let bestScore = -Infinity;
        
        teammates.forEach(teammate => {
            const dx = teammate.x - selectedPlayer.x;
            const dy = teammate.y - selectedPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Calculate pass score
            let score = 0;
            
            // Prefer closer teammates for short passes
            if (distance < 25) score += 30 - distance;
            
            // Prefer teammates in good positions
            if (teammate.position === 'Forward' && teammate.x > 60) score += 20;
            if (teammate.position === 'Midfielder' && Math.abs(teammate.x - 50) < 20) score += 15;
            
            // Check if teammate is marked
            const defendersNearby = playersOnField.filter(p => 
                p.team !== selectedPlayer.team &&
                Math.sqrt((p.x - teammate.x) ** 2 + (p.y - teammate.y) ** 2) < 10
            ).length;
            
            score -= defendersNearby * 10;
            
            // Check if pass is possible (not too many opponents in way)
            if (score > bestScore && distance < 40) {
                bestScore = score;
                bestTarget = teammate;
            }
        });
        
        if (bestTarget) {
            executePass(selectedPlayer, bestTarget);
        } else {
            // Try a clearance or long pass
            attemptClearance(selectedPlayer);
        }
    } else {
        addEvent("No teammates available!", 'warning');
    }
}

// Execute a pass between players
function executePass(passer, receiver) {
    const dx = receiver.x - ball.x;
    const dy = receiver.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate pass speed based on player skill and distance
    const baseSpeed = Math.min(6, passer.skill / 20);
    const distanceFactor = Math.min(1.5, distance / 25);
    const speed = baseSpeed * distanceFactor;
    
    // Add slight curve to pass
    const curve = (Math.random() - 0.5) * 0.3;
    
    ball.velocityX = (dx / distance) * speed + curve;
    ball.velocityY = (dy / distance) * speed;
    ball.withPlayer = null;
    ballWithPlayer = null;
    passer.hasBall = false;
    passer.element.classList.remove('has-ball');
    passer.isMoving = false;
    passer.element.classList.remove('running');
    ball.isMoving = true;
    lastBallTouchTime = Date.now();
    
    addEvent(`${passer.name} passes to ${receiver.name}`, 'pass');
    updateBall();
    
    // Start ball animation
    if (!ballAnimationFrame) {
        ballAnimationFrame = requestAnimationFrame(() => updateBall(1));
    }
}

// Attempt a clearance (long kick)
function attemptClearance(player) {
    // Kick toward opponent's half
    let targetX, targetY;
    
    if (player.team === 'team-a') {
        targetX = 70 + Math.random() * 20;
        targetY = 30 + Math.random() * 40;
    } else {
        targetX = 30 - Math.random() * 20;
        targetY = 30 + Math.random() * 40;
    }
    
    const dx = targetX - ball.x;
    const dy = targetY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 5 + Math.random() * 2;
    
    ball.velocityX = (dx / distance) * speed;
    ball.velocityY = (dy / distance) * speed;
    ball.withPlayer = null;
    ballWithPlayer = null;
    player.hasBall = false;
    player.element.classList.remove('has-ball');
    ball.isMoving = true;
    
    addEvent(`${player.name} clears the ball!`, 'clearance');
    updateBall();
}

// Enhanced shootBall function with better physics
function shootBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!", 'warning');
        return;
    }
    
    // Check if player is in shooting range
    const isInRange = isInShootingRange(selectedPlayer);
    if (!isInRange) {
        addEvent("Too far from goal!", 'warning');
        return;
    }
    
    // Determine goal to shoot at
    let goalX, goalY;
    if (selectedPlayer.team === 'team-a') {
        goalX = 98; // Right goal
        goalY = 50 + (Math.random() - 0.5) * 8; // Add some variation
    } else {
        goalX = 2; // Left goal
        goalY = 50 + (Math.random() - 0.5) * 8;
    }
    
    // Calculate shot direction
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate shot power based on player skill and position
    const basePower = selectedPlayer.attack / 15;
    const positionBonus = selectedPlayer.position === 'Forward' ? 1.2 : 
                         selectedPlayer.position === 'Midfielder' ? 1.0 : 0.8;
    const power = Math.min(9, basePower * positionBonus);
    
    // Add curve based on player skill
    const curveAmount = selectedPlayer.skill / 100;
    const curve = (Math.random() - 0.5) * curveAmount * 0.8;
    
    // Kick the ball
    ball.velocityX = (dx / distance) * power + curve;
    ball.velocityY = (dy / distance) * power;
    ball.withPlayer = null;
    ballWithPlayer = null;
    selectedPlayer.hasBall = false;
    selectedPlayer.element.classList.remove('has-ball');
    selectedPlayer.isMoving = false;
    selectedPlayer.element.classList.remove('running');
    ball.isMoving = true;
    lastBallTouchTime = Date.now();
    
    addEvent(`${selectedPlayer.name} shoots!`, 'shot');
    updateBall();
    
    // Start ball animation
    if (!ballAnimationFrame) {
        ballAnimationFrame = requestAnimationFrame(() => updateBall(1));
    }
}

// Enhanced AI decision making
function makeAIDecision(player) {
    if (!gameRunning || !ballWithPlayer || ballWithPlayer !== player) return;
    
    const currentTime = Date.now();
    if (currentTime - player.lastActionTime < player.actionCooldown) return;
    
    // Decision weights based on player position and game state
    let passWeight = 0.4;
    let shootWeight = 0.3;
    let dribbleWeight = 0.3;
    
    // Adjust weights based on position
    if (player.position === 'Forward') {
        shootWeight += 0.2;
        dribbleWeight += 0.1;
        passWeight -= 0.3;
    } else if (player.position === 'Defender') {
        passWeight += 0.3;
        shootWeight -= 0.2;
        dribbleWeight -= 0.1;
    }
    
    // Adjust based on distance to goal
    const distanceToGoal = player.team === 'team-b' ? player.x : 100 - player.x;
    if (distanceToGoal < 25) {
        shootWeight += 0.3;
    } else if (distanceToGoal > 60) {
        passWeight += 0.2;
    }
    
    // Normalize weights
    const total = passWeight + shootWeight + dribbleWeight;
    passWeight /= total;
    shootWeight /= total;
    dribbleWeight /= total;
    
    const decision = Math.random();
    
    if (decision < passWeight) {
        // Pass to teammate
        aiPassBall(player);
        player.lastActionTime = currentTime;
        player.actionCooldown = 800 + Math.random() * 400;
    } else if (decision < passWeight + shootWeight) {
        // Shoot if in range
        if (isInShootingRange(player)) {
            aiShootBall(player);
            player.lastActionTime = currentTime;
            player.actionCooldown = 1000 + Math.random() * 500;
        } else {
            // Dribble instead
            aiDribble(player);
            player.lastActionTime = currentTime;
            player.actionCooldown = 600 + Math.random() * 300;
        }
    } else {
        // Dribble
        aiDribble(player);
        player.lastActionTime = currentTime;
        player.actionCooldown = 500 + Math.random() * 400;
    }
}

// Enhanced AI Pass
function aiPassBall(player) {
    const teammates = playersOnField.filter(p => 
        p.team === player.team && 
        p !== player &&
        !p.hasBall
    );
    
    if (teammates.length > 0) {
        // Find best passing option
        let bestTeammate = null;
        let bestScore = -Infinity;
        
        teammates.forEach(teammate => {
            const dx = teammate.x - player.x;
            const dy = teammate.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            let score = 0;
            
            // Distance scoring
            if (distance < 30) score += 25 - distance;
            
            // Position scoring
            if (teammate.position === 'Forward' && teammate.x > 60) score += 25;
            if (teammate.position === 'Midfielder') score += 15;
            
            // Defenders nearby penalty
            const defendersNearby = playersOnField.filter(p => 
                p.team !== player.team &&
                Math.sqrt((p.x - teammate.x) ** 2 + (p.y - teammate.y) ** 2) < 12
            ).length;
            
            score -= defendersNearby * 8;
            
            if (score > bestScore && distance < 45) {
                bestScore = score;
                bestTeammate = teammate;
            }
        });
        
        if (bestTeammate) {
            executePass(player, bestTeammate);
        }
    }
}

// Enhanced AI Shoot
function aiShootBall(player) {
    // Calculate target in goal (not always center)
    let goalX, goalY;
    if (player.team === 'team-b') {
        goalX = 2;
        // Target corners more often
        goalY = Math.random() < 0.7 ? 45 + Math.random() * 10 : 50 + Math.random() * 10;
    } else {
        goalX = 98;
        goalY = Math.random() < 0.7 ? 45 + Math.random() * 10 : 50 + Math.random() * 10;
    }
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // AI shooting power with variation
    const basePower = player.attack / 18;
    const power = Math.min(8, basePower * (0.9 + Math.random() * 0.2));
    
    // Add slight inaccuracy based on skill
    const accuracy = player.skill / 100;
    const inaccuracy = (1 - accuracy) * 0.4;
    const offsetX = (Math.random() - 0.5) * inaccuracy;
    const offsetY = (Math.random() - 0.5) * inaccuracy;
    
    ball.velocityX = (dx / distance) * power + offsetX;
    ball.velocityY = (dy / distance) * power + offsetY;
    ball.withPlayer = null;
    ballWithPlayer = null;
    player.hasBall = false;
    player.element.classList.remove('has-ball');
    ball.isMoving = true;
    lastBallTouchTime = Date.now();
    
    addEvent(`${player.name} shoots!`, 'shot');
    updateBall();
}

// Enhanced AI Dribble
function aiDribble(player) {
    // Move toward opponent's goal with some intelligence
    let moveX, moveY;
    
    if (player.team === 'team-b') {
        moveX = player.x - 1.5;
        // Try to avoid opponents
        const opponentsAhead = playersOnField.filter(p => 
            p.team === 'team-a' && 
            p.x < player.x &&
            Math.abs(p.y - player.y) < 15
        );
        
        if (opponentsAhead.length > 0) {
            // Dodge to side
            moveY = player.y + (Math.random() - 0.5) * 3;
        } else {
            moveY = player.y + (Math.random() - 0.5) * 1.5;
        }
    } else {
        moveX = player.x + 1.5;
        const opponentsAhead = playersOnField.filter(p => 
            p.team === 'team-b' && 
            p.x > player.x &&
            Math.abs(p.y - player.y) < 15
        );
        
        if (opponentsAhead.length > 0) {
            moveY = player.y + (Math.random() - 0.5) * 3;
        } else {
            moveY = player.y + (Math.random() - 0.5) * 1.5;
        }
    }
    
    // Keep in bounds
    moveX = Math.max(5, Math.min(95, moveX));
    moveY = Math.max(10, Math.min(90, moveY));
    
    player.x = moveX;
    player.y = moveY;
    player.element.style.left = `${moveX}%`;
    player.element.style.top = `${moveY}%`;
    player.isMoving = true;
    
    // Move ball with player
    moveBallWithPlayer();
    
    // Add running animation
    player.element.classList.add('running');
    setTimeout(() => {
        player.isMoving = false;
        player.element.classList.remove('running');
    }, 300);
}

// AI movement helper functions
function moveToSupportPosition(player) {
    if (!ballWithPlayer) return;
    
    const ballHolder = ballWithPlayer;
    const dx = ballHolder.x - player.x;
    const dy = ballHolder.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 20) {
        // Move to support position (not too close)
        const targetDistance = 12 + Math.random() * 8;
        const moveX = player.x + (dx / distance) * 0.6;
        const moveY = player.y + (dy / distance) * 0.6;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
}

function moveToDefensivePosition(player) {
    if (!ballWithPlayer) return;
    
    const opponent = ballWithPlayer;
    const goalX = player.team === 'team-a' ? 10 : 90;
    
    // Position between opponent and goal
    const targetX = opponent.x + (goalX - opponent.x) * 0.4;
    const targetY = opponent.y + (Math.random() - 0.5) * 5;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 3) {
        const moveX = player.x + (dx / distance) * 0.8;
        const moveY = player.y + (dy / distance) * 0.8;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
}

function moveToPressurePosition(player) {
    if (!ballWithPlayer) return;
    
    const opponent = ballWithPlayer;
    const dx = opponent.x - player.x;
    const dy = opponent.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Move to pressure distance (close but not too close)
    const pressureDistance = 6;
    
    if (distance > pressureDistance + 2 || distance < pressureDistance - 2) {
        const targetX = opponent.x - (dx / distance) * pressureDistance;
        const targetY = opponent.y - (dy / distance) * pressureDistance;
        
        const moveX = player.x + (targetX - player.x) * 0.5;
        const moveY = player.y + (targetY - player.y) * 0.5;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
}

function moveTowardBall(player) {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 8) {
        const moveX = player.x + (dx / distance) * 1.2;
        const moveY = player.y + (dy / distance) * 1.2;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
}

function moveToOpenSpace(player) {
    // Find open space away from other players
    let bestX = player.x;
    let bestY = player.y;
    let bestSpace = 0;
    
    // Check several possible positions
    for (let i = 0; i < 5; i++) {
        const testX = player.x + (Math.random() - 0.5) * 20;
        const testY = player.y + (Math.random() - 0.5) * 20;
        
        // Check if position is valid
        if (testX < 5 || testX > 95 || testY < 10 || testY > 90) continue;
        
        // Calculate space around this position
        let minDistance = Infinity;
        for (const otherPlayer of playersOnField) {
            if (otherPlayer === player) continue;
            
            const dist = Math.sqrt((otherPlayer.x - testX) ** 2 + (otherPlayer.y - testY) ** 2);
            if (dist < minDistance) minDistance = dist;
        }
        
        if (minDistance > bestSpace) {
            bestSpace = minDistance;
            bestX = testX;
            bestY = testY;
        }
    }
    
    if (bestSpace > 8) {
        const dx = bestX - player.x;
        const dy = bestY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
            const moveX = player.x + (dx / distance) * 0.7;
            const moveY = player.y + (dy / distance) * 0.7;
            
            player.x = Math.max(5, Math.min(95, moveX));
            player.y = Math.max(10, Math.min(90, moveY));
            player.element.style.left = `${player.x}%`;
            player.element.style.top = `${player.y}%`;
            player.isMoving = true;
            
            setTimeout(() => {
                player.isMoving = false;
            }, 100);
        }
    }
}

function moveToTacticalPosition(player) {
    // Return to tactical position based on player role
    let targetX, targetY;
    
    if (player.position === 'Goalkeeper') {
        targetX = player.team === 'team-a' ? 10 : 90;
        targetY = 50;
    } else if (player.position === 'Defender') {
        targetX = player.team === 'team-a' ? 25 : 75;
        targetY = player.originalPosition.y;
    } else if (player.position === 'Midfielder') {
        targetX = player.team === 'team-a' ? 45 : 55;
        targetY = player.originalPosition.y;
    } else {
        targetX = player.team === 'team-a' ? 65 : 35;
        targetY = player.originalPosition.y;
    }
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 2) {
        const moveX = player.x + (dx / distance) * 0.5;
        const moveY = player.y + (dy / distance) * 0.5;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
}

function returnToPosition(player) {
    const dx = player.originalPosition.x - player.x;
    const dy = player.originalPosition.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 1) {
        const moveX = player.x + (dx / distance) * 0.4;
        const moveY = player.y + (dy / distance) * 0.4;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
}

// Attempt tackle function
function attemptTackle(tackler, ballHolder) {
    if (!tackler || !ballHolder || tackler.team === ballHolder.team) return;
    
    const currentTime = Date.now();
    const tacklerId = `player_${tackler.id}`;
    
    // Check tackle cooldown
    if (playerCollisionCooldown[tacklerId] && currentTime - playerCollisionCooldown[tacklerId] < 1000) {
        return;
    }
    
    // Calculate tackle success chance
    const tackleChance = (tackler.defense / 100) * 0.6 + 0.3;
    const dribbleDefense = (ballHolder.skill / 100) * 0.4;
    const successChance = tackleChance - dribbleDefense;
    
    if (Math.random() < successChance) {
        // Successful tackle
        giveBallToPlayer(tackler);
        addEvent(`${tackler.name} tackles ${ballHolder.name}!`, 'tackle');
        
        // Set cooldown
        playerCollisionCooldown[tacklerId] = currentTime;
        
        // Stun ball holder briefly
        ballHolder.element.classList.add('stunned');
        setTimeout(() => {
            ballHolder.element.classList.remove('stunned');
        }, 500);
    } else {
        // Failed tackle
        addEvent(`${ballHolder.name} avoids ${tackler.name}'s tackle!`, 'dribble');
        
        // Set cooldown for tackler
        playerCollisionCooldown[tacklerId] = currentTime;
    }
}

// Enhanced checkForGoal function
function checkForGoal() {
    if (!ball || !ball.isMoving) return;
    
    // Check if ball is in goal area with proper physics
    const inLeftGoal = ball.x <= 2 && ball.y >= 40 && ball.y <= 60;
    const inRightGoal = ball.x >= 98 && ball.y >= 40 && ball.y <= 60;
    
    // Also check if ball is moving slowly into goal
    const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
    const slowRollIntoGoal = speed < 0.5 && 
        ((ball.x <= 3 && ball.x > 1.5 && ball.y >= 42 && ball.y <= 58) ||
         (ball.x >= 97 && ball.x < 98.5 && ball.y >= 42 && ball.y <= 58));
    
    if (inLeftGoal || (slowRollIntoGoal && ball.x <= 3)) {
        // Team B scores (ball in left goal)
        teamBScore++;
        updateScoreboard();
        addEvent("⚽ GOAL! Team B scores!", 'goal');
        highlightGoal('left');
        celebrateGoal('team-b');
        setTimeout(() => {
            resetBall();
        }, 2000);
        return;
    }
    
    if (inRightGoal || (slowRollIntoGoal && ball.x >= 97)) {
        // Team A scores (ball in right goal)
        teamAScore++;
        updateScoreboard();
        addEvent("⚽ GOAL! Team A scores!", 'goal');
        highlightGoal('right');
        celebrateGoal('team-a');
        setTimeout(() => {
            resetBall();
        }, 2000);
        return;
    }
    
    // Check for near misses
    if ((ball.x <= 4 && ball.x > 2 && ball.y >= 38 && ball.y <= 62) ||
        (ball.x >= 96 && ball.x < 98 && ball.y >= 38 && ball.y <= 62)) {
        if (Math.random() < 0.3) {
            addEvent("Close! Just wide of the goal!", 'near-miss');
        }
    }
}

// Enhanced goal celebration
function celebrateGoal(scoringTeam) {
    // Highlight scoring team's players
    playersOnField.forEach(player => {
        if (player.team === (scoringTeam === 'team-a' ? 'team-a' : 'team-b')) {
            player.element.classList.add('celebrating');
            setTimeout(() => {
                player.element.classList.remove('celebrating');
            }, 1500);
        }
    });
    
    // Add confetti effect
    const field = document.getElementById('football-field');
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    field.appendChild(confetti);
    
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

// Enhanced highlight goal animation
function highlightGoal(side) {
    const goalElement = side === 'left' ? 
        document.querySelector('.left-goal') : 
        document.querySelector('.right-goal');
    
    if (goalElement) {
        goalElement.style.backgroundColor = 'rgba(16, 185, 129, 0.8)';
        goalElement.style.boxShadow = '0 0 40px rgba(16, 185, 129, 0.9), 0 0 80px rgba(16, 185, 129, 0.6)';
        
        // Pulsing effect
        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
            pulseCount++;
            if (pulseCount > 3) {
                clearInterval(pulseInterval);
                goalElement.style.backgroundColor = '';
                goalElement.style.boxShadow = '';
            } else {
                const intensity = 0.8 - (pulseCount * 0.2);
                goalElement.style.boxShadow = 
                    `0 0 ${40 - pulseCount * 10}px rgba(16, 185, 129, ${intensity}), 
                     0 0 ${80 - pulseCount * 20}px rgba(16, 185, 129, ${intensity * 0.7})`;
            }
        }, 300);
    }
}

// Enhanced reset ball function
function resetBall() {
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    // Reset all players
    playersOnField.forEach(player => {
        player.hasBall = false;
        player.element.classList.remove('has-ball');
        player.isMoving = false;
        player.element.classList.remove('running');
        player.element.classList.remove('celebrating');
        player.element.classList.remove('stunned');
        
        // Return to original positions
        player.x = player.originalPosition.x;
        player.y = player.originalPosition.y;
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    });
    
    ball.x = 50;
    ball.y = 50;
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.withPlayer = null;
    ballWithPlayer = null;
    ball.isMoving = false;
    ball.rotation = 0;
    ball.element.style.left = '50%';
    ball.element.style.top = '50%';
    ball.element.style.transform = 'rotate(0deg)';
    ball.element.classList.remove('moving');
    
    updateBallPossession();
    
    // Reset selected player if needed
    if (selectedPlayer) {
        selectPlayer(selectedPlayer);
    }
    
    // Give ball to team that didn't concede after delay
    setTimeout(() => {
        const teamToGetBall = teamAScore > teamBScore ? 'team-b' : 
                             teamBScore > teamAScore ? 'team-a' : 
                             Math.random() < 0.5 ? 'team-a' : 'team-b';
        
        const eligiblePlayers = playersOnField.filter(p => 
            p.team === teamToGetBall && 
            p.position !== 'Goalkeeper'
        );
        
        if (eligiblePlayers.length > 0) {
            const randomPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
            giveBallToPlayer(randomPlayer);
        }
    }, 1500);
}

// Enhanced stamina update
function updateStamina(deltaTime) {
    playersOnField.forEach(player => {
        if (player.isMoving) {
            // Consume stamina while moving
            const consumptionRate = player.hasBall ? 0.4 : 0.2;
            player.stamina = Math.max(0, player.stamina - consumptionRate * deltaTime);
        } else {
            // Regenerate stamina while idle
            const regenRate = 0.15;
            player.stamina = Math.min(100, player.stamina + regenRate * deltaTime);
        }
        
        // Update stamina bar if it exists
        const staminaBar = player.element.querySelector('.stamina-bar');
        if (staminaBar) {
            staminaBar.style.width = `${player.stamina}%`;
            
            // Change color based on stamina level
            if (player.stamina < 30) {
                staminaBar.style.backgroundColor = '#ef4444';
            } else if (player.stamina < 60) {
                staminaBar.style.backgroundColor = '#f59e0b';
            } else {
                staminaBar.style.backgroundColor = '#10b981';
            }
        }
        
        // Apply stamina effects
        if (player.stamina < 20) {
            player.element.classList.add('exhausted');
        } else {
            player.element.classList.remove('exhausted');
        }
    });
}

// Update player animations
function updatePlayerAnimations() {
    playersOnField.forEach(player => {
        if (player.isMoving) {
            if (!player.element.classList.contains('running')) {
                player.element.classList.add('running');
            }
        } else {
            if (player.element.classList.contains('running')) {
                player.element.classList.remove('running');
            }
        }
    });
}

// Enhanced selectPlayer function
function selectPlayer(player) {
    if (player.team !== 'team-a') {
        addEvent("Can only select your own team players!", 'warning');
        return;
    }
    
    // Deselect previous player
    if (selectedPlayer) {
        selectedPlayer.element.classList.remove('selected');
        selectedPlayer.element.classList.remove('running');
        
        // Reset player's movement state
        selectedPlayer.isMoving = false;
        keysPressed = {};
    }
    
    // Select new player
    selectedPlayer = player;
    player.element.classList.add('selected');
    
    document.getElementById('selected-player').textContent = player.name;
    document.getElementById('selected-player').style.color = '#3b82f6';
    
    addEvent(`Selected ${player.name} (${player.position})`, 'selection');
    
    // Highlight player briefly
    player.element.classList.add('highlight');
    setTimeout(() => {
        player.element.classList.remove('highlight');
    }, 500);
}

// Enhanced selectNextPlayer function
function selectNextPlayer() {
    const teamAPlayers = playersOnField.filter(p => p.team === 'team-a');
    if (teamAPlayers.length === 0) return;
    
    let currentIndex = selectedPlayer ? 
        teamAPlayers.findIndex(p => p.id === selectedPlayer.id) : -1;
    
    const nextIndex = (currentIndex + 1) % teamAPlayers.length;
    selectPlayer(teamAPlayers[nextIndex]);
}

// Enhanced toggleSprint function
function toggleSprint() {
    if (!selectedPlayer) {
        addEvent("Select a player first!", 'warning');
        return;
    }
    
    if (selectedPlayer.stamina < 20 && !isSprinting) {
        addEvent(`${selectedPlayer.name} is too tired to sprint!`, 'warning');
        return;
    }
    
    isSprinting = !isSprinting;
    const sprintBtn = document.getElementById('sprint-btn');
    
    if (isSprinting) {
        sprintBtn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
        sprintBtn.style.transform = 'scale(1.05)';
        sprintBtn.innerHTML = '<i class="fas fa-running"></i> Sprint ON (Shift)';
        addEvent(`${selectedPlayer.name} starts sprinting!`, 'sprint');
        
        // Visual feedback
        if (selectedPlayer) {
            selectedPlayer.element.classList.add('sprinting');
        }
    } else {
        sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        sprintBtn.style.transform = 'scale(1)';
        sprintBtn.innerHTML = '<i class="fas fa-running"></i> Sprint (Shift)';
        addEvent(`${selectedPlayer.name} stops sprinting`, 'sprint');
        
        // Remove visual feedback
        if (selectedPlayer) {
            selectedPlayer.element.classList.remove('sprinting');
        }
    }
}

// Update possession during play
function updatePossessionDuringPlay() {
    if (!ball.isMoving) return;
    
    const currentTime = Date.now();
    if (currentTime - lastBallTouchTime > 100) {
        // Ball is loose, update possession based on last touch
        if (ball.lastTouch) {
            updatePossessionStats(ball.lastTouch.team === 'team-a' ? 'teamA' : 'teamB');
        }
    }
}

// Enhanced display update functions
function updateScoreboard() {
    document.getElementById('team-a-score').textContent = teamAScore;
    document.getElementById('team-b-score').textContent = teamBScore;
    
    // Animate score update with goal effect
    const scoreElement = document.querySelector('.score');
    scoreElement.style.transform = 'scale(1.5)';
    scoreElement.style.color = '#fbbf24';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
        scoreElement.style.color = '#fff';
    }, 500);
}

function updateBallPossession() {
    const possessionElement = document.getElementById('ball-possession');
    if (ballWithPlayer) {
        possessionElement.textContent = ballWithPlayer.name;
        possessionElement.style.color = ballWithPlayer.team === 'team-a' ? '#3b82f6' : '#ef4444';
        possessionElement.style.fontWeight = 'bold';
        
        // Add team icon
        possessionElement.innerHTML = `${ballWithPlayer.team === 'team-a' ? '🔵' : '🔴'} ${ballWithPlayer.name}`;
    } else {
        possessionElement.textContent = 'Ball is loose!';
        possessionElement.style.color = '#fbbf24';
        possessionElement.style.fontWeight = 'normal';
    }
}

function updatePossessionStats(team) {
    if (team === 'teamA') {
        possession.teamA = Math.min(100, possession.teamA + 0.5);
        possession.teamB = Math.max(0, possession.teamB - 0.5);
    } else {
        possession.teamB = Math.min(100, possession.teamB + 0.5);
        possession.teamA = Math.max(0, possession.teamA - 0.5);
    }
    
    document.getElementById('possession').textContent = 
        `${Math.round(possession.teamA)}% - ${Math.round(possession.teamB)}%`;
    
    // Color code possession display
    const possessionElement = document.getElementById('possession');
    if (possession.teamA > 60) {
        possessionElement.style.color = '#3b82f6';
    } else if (possession.teamB > 60) {
        possessionElement.style.color = '#ef4444';
    } else {
        possessionElement.style.color = '#fff';
    }
}

function updateMatchTime() {
    const minutes = Math.floor(matchTime / 60);
    const seconds = matchTime % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('match-time').textContent = timeString;
    
    // Color code time based on game phase
    const timeElement = document.getElementById('match-time');
    if (matchTime >= 150) { // Last 5 minutes
        timeElement.style.color = '#ef4444';
        timeElement.style.fontWeight = 'bold';
    } else if (matchTime >= 75) { // Second half
        timeElement.style.color = '#fbbf24';
    } else {
        timeElement.style.color = '#10b981';
    }
}

function updateDisplay() {
    updateScoreboard();
    updateBallPossession();
    updateMatchTime();
    updatePossessionStats('teamA'); // Initial update
}

// Enhanced event logging
function addEvent(message, type = '') {
    const eventLog = document.getElementById('event-log');
    const eventElement = document.createElement('div');
    eventElement.className = `event ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Add icon based on event type
    let icon = '⚽';
    switch(type) {
        case 'goal': icon = '🥅'; break;
        case 'shot': icon = '🎯'; break;
        case 'pass': icon = '⇢'; break;
        case 'tackle': icon = '💥'; break;
        case 'interception': icon = '🛡️'; break;
        case 'dribble': icon = '🌀'; break;
        case 'sprint': icon = '⚡'; break;
        case 'warning': icon = '⚠️'; break;
        case 'system': icon = '🔄'; break;
        case 'selection': icon = '👉'; break;
    }
    
    eventElement.innerHTML = `<span class="event-time">[${time}]</span> <span class="event-icon">${icon}</span> ${message}`;
    
    eventLog.prepend(eventElement);
    gameEvents.unshift({ time, message, type });
    
    // Keep only last 15 events
    const events = eventLog.querySelectorAll('.event');
    if (events.length > 15) {
        events[events.length - 1].remove();
        gameEvents.pop();
    }
    
    // Scroll to top
    eventLog.scrollTop = 0;
}

// Game control functions
function startGame() {
    if (gameRunning) {
        addEvent("Game is already running!", 'warning');
        return;
    }
    
    gameRunning = true;
    document.getElementById('game-status').textContent = 'Playing';
    document.getElementById('game-status').style.color = '#00ff88';
    
    matchInterval = setInterval(() => {
        matchTime++;
        updateMatchTime();
        
        // Add commentary at certain times
        if (matchTime === 45 || matchTime === 90) {
            addEvent(`Half time! Score: ${teamAScore}-${teamBScore}`, 'system');
        }
        
        if (matchTime >= 180) {
            endGame();
        }
    }, 1000);
    
    addEvent("Game started! Good luck!", 'system');
    startAIUpdates();
    
    if (!selectedPlayer) {
        const teamAPlayers = playersOnField.filter(p => p.team === 'team-a');
        if (teamAPlayers.length > 0) {
            selectPlayer(teamAPlayers.find(p => p.position === 'Forward') || teamAPlayers[0]);
        }
    }
}

function pauseGame() {
    if (matchTime === 0 && !gameRunning) {
        addEvent("Start the game first!", 'warning');
        return;
    }
    
    gameRunning = !gameRunning;
    
    if (gameRunning) {
        document.getElementById('game-status').textContent = 'Playing';
        document.getElementById('game-status').style.color = '#00ff88';
        addEvent("Game resumed", 'system');
        startAIUpdates();
    } else {
        document.getElementById('game-status').textContent = 'Paused';
        document.getElementById('game-status').style.color = '#f59e0b';
        addEvent("Game paused", 'system');
        stopAIUpdates();
        
        // Stop all player animations
        playersOnField.forEach(player => {
            player.isMoving = false;
            player.element.classList.remove('running');
        });
    }
}

function resetGame() {
    gameRunning = false;
    if (matchInterval) {
        clearInterval(matchInterval);
        matchInterval = null;
    }
    
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    stopAIUpdates();
    
    matchTime = 0;
    teamAScore = 0;
    teamBScore = 0;
    possession = { teamA: 50, teamB: 50 };
    isSprinting = false;
    selectedPlayer = null;
    ballWithPlayer = null;
    keysPressed = {};
    shiftPressed = false;
    playerCollisionCooldown = {};
    lastBallTouchTime = 0;
    gameEvents = [];
    
    createPlayers();
    createBall();
    updateDisplay();
    
    document.getElementById('game-status').textContent = 'Ready';
    document.getElementById('game-status').style.color = '#fff';
    document.getElementById('selected-player').textContent = 'None';
    document.getElementById('selected-player').style.color = '#fff';
    
    const sprintBtn = document.getElementById('sprint-btn');
    sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    sprintBtn.style.transform = 'scale(1)';
    sprintBtn.innerHTML = '<i class="fas fa-running"></i> Sprint (Shift)';
    
    // Clear event log except instructions
    const eventLog = document.getElementById('event-log');
    eventLog.innerHTML = `
        <div class="event">Welcome to Football Game!</div>
        <div class="event">Click on a blue player to select them</div>
        <div class="event">Use arrow buttons or WASD keys to move</div>
    `;
    
    addEvent("Game reset. Ready to play!", 'system');
}

function endGame() {
    gameRunning = false;
    if (matchInterval) {
        clearInterval(matchInterval);
        matchInterval = null;
    }
    
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    stopAIUpdates();
    
    document.getElementById('game-status').textContent = 'Finished';
    document.getElementById('game-status').style.color = '#ef4444';
    
    let resultMessage = '';
    if (teamAScore > teamBScore) {
        resultMessage = `🎉 You win! ${teamAScore}-${teamBScore}`;
    } else if (teamAScore < teamBScore) {
        resultMessage = `😔 Computer wins! ${teamBScore}-${teamAScore}`;
    } else {
        resultMessage = `🤝 Draw! ${teamAScore}-${teamBScore}`;
    }
    
    addEvent(`Game over! ${resultMessage}`, 'system');
    
    // Show match stats
    setTimeout(() => {
        addEvent(`Match Stats: ${Math.round(possession.teamA)}% possession, ${matchTime} seconds played`, 'system');
    }, 1000);
}

// Enhanced setupEventListeners
function setupEventListeners() {
    // Movement buttons with better feedback
    const movementButtons = ['move-up', 'move-down', 'move-left', 'move-right'];
    movementButtons.forEach(id => {
        const btn = document.getElementById(id);
        btn.addEventListener('click', () => {
            if (!selectedPlayer || !gameRunning) {
                addEvent("Select a player and start the game first!", 'warning');
                return;
            }
            
            let deltaX = 0, deltaY = 0;
            switch(id) {
                case 'move-up': deltaY = -2; break;
                case 'move-down': deltaY = 2; break;
                case 'move-left': deltaX = -2; break;
                case 'move-right': deltaX = 2; break;
            }
            
            moveSelectedPlayer(deltaX, deltaY);
            
            // Button press effect
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
        });
    });

    // Action buttons with better feedback
    document.getElementById('pass-btn').addEventListener('click', () => {
        if (!gameRunning) {
            addEvent("Start the game first!", 'warning');
            return;
        }
        passBall();
        animateButton('pass-btn');
    });
    
    document.getElementById('shoot-btn').addEventListener('click', () => {
        if (!gameRunning) {
            addEvent("Start the game first!", 'warning');
            return;
        }
        shootBall();
        animateButton('shoot-btn');
    });
    
    document.getElementById('sprint-btn').addEventListener('click', () => {
        if (!gameRunning) {
            addEvent("Start the game first!", 'warning');
            return;
        }
        toggleSprint();
    });
    
    document.getElementById('select-btn').addEventListener('click', () => {
        selectNextPlayer();
        animateButton('select-btn');
    });

    // Game control buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
}

// Button animation helper
function animateButton(buttonId) {
    const btn = document.getElementById(buttonId);
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);
}

// Enhanced keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        // Store key state
        keysPressed[e.key] = true;
        
        // Handle Shift key
        if (e.key === 'Shift') {
            shiftPressed = true;
            if (!isSprinting && selectedPlayer && gameRunning) {
                toggleSprint();
            }
        }
        
        // Only process game controls if game is running
        if (!gameRunning && ![' ', 'c', 'C'].includes(e.key)) {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case ' ':
                if (!gameRunning) {
                    startGame();
                } else {
                    pauseGame();
                }
                e.preventDefault();
                break;
            case 'p':
                if (gameRunning) {
                    passBall();
                    e.preventDefault();
                }
                break;
            case 's':
                if (gameRunning) {
                    shootBall();
                    e.preventDefault();
                }
                break;
            case 'c':
                selectNextPlayer();
                e.preventDefault();
                break;
            case 'r':
                if (e.ctrlKey) {
                    resetGame();
                    e.preventDefault();
                }
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        // Remove key state
        keysPressed[e.key] = false;
        
        // Handle Shift key release
        if (e.key === 'Shift') {
            shiftPressed = false;
            if (isSprinting && selectedPlayer) {
                toggleSprint();
            }
        }
        
        // Remove running animation when movement keys are released
        const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
        if (movementKeys.includes(e.key.toLowerCase())) {
            if (selectedPlayer) {
                selectedPlayer.isMoving = false;
                selectedPlayer.element.classList.remove('running');
            }
        }
    });
    
    // Prevent arrow key scrolling
    window.addEventListener('keydown', function(e) {
        if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    }, false);
}

// Field click for player movement (optional)
document.getElementById('football-field').addEventListener('click', function(e) {
    if (!selectedPlayer || !gameRunning) return;
    
    const rect = this.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Move player to clicked position
    const dx = x - selectedPlayer.x;
    const dy = y - selectedPlayer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 2) {
        selectedPlayer.x = Math.max(5, Math.min(95, x));
        selectedPlayer.y = Math.max(10, Math.min(90, y));
        selectedPlayer.element.style.left = `${selectedPlayer.x}%`;
        selectedPlayer.element.style.top = `${selectedPlayer.y}%`;
        
        if (selectedPlayer.hasBall) {
            moveBallWithPlayer();
        }
        
        addEvent(`${selectedPlayer.name} moves to new position`);
    }
});

// Initialize the game when page loads
window.addEventListener('load', initGame);

// Export functions for debugging
window.game = {
    initGame,
    startGame,
    pauseGame,
    resetGame,
    passBall,
    shootBall,
    selectNextPlayer,
    toggleSprint,
    getState: () => ({
        gameRunning,
        teamAScore,
        teamBScore,
        matchTime,
        selectedPlayer: selectedPlayer?.name,
        ballWithPlayer: ballWithPlayer?.name,
        possession,
        ballPosition: { x: ball?.x, y: ball?.y },
        ballSpeed: ball ? Math.sqrt(ball.velocityX ** 2 + ball.velocityY ** 2) : 0
    }),
    getPlayers: () => playersOnField.map(p => ({
        name: p.name,
        position: p.position,
        team: p.team,
        stamina: p.stamina,
        hasBall: p.hasBall
    })),
    getEvents: () => [...gameEvents]
};
