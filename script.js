// Football Game JavaScript - Fixed Working Version
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
let lastAIPositionUpdate = {};
let gameActive = true;
let passCooldown = false;
let shootCooldown = false;
let aiMoveCounter = 0;

// Player Data
const playerData = {
    teamA: [
        { id: 1, name: "Alex GK", position: "Goalkeeper", number: 1, skill: 85, speed: 70, defense: 90, attack: 30 },
        { id: 2, name: "Ben", position: "Defender", number: 4, skill: 78, speed: 75, defense: 85, attack: 40 },
        { id: 3, name: "Chris", position: "Defender", number: 5, skill: 82, speed: 72, defense: 88, attack: 35 },
        { id: 4, name: "David", position: "Defender", number: 3, skill: 80, speed: 78, defense: 83, attack: 45 },
        { id: 5, name: "Ethan", position: "Defender", number: 2, skill: 79, speed: 76, defense: 82, attack: 42 },
        { id: 6, name: "Finn", position: "Midfielder", number: 8, skill: 84, speed: 82, defense: 75, attack: 70 },
        { id: 7, name: "Greg", position: "Midfielder", number: 10, skill: 86, speed: 85, defense: 70, attack: 85 },
        { id: 8, name: "Harry", position: "Midfielder", number: 6, skill: 83, speed: 80, defense: 78, attack: 65 },
        { id: 9, name: "Ian", position: "Midfielder", number: 7, skill: 81, speed: 79, defense: 72, attack: 68 },
        { id: 10, name: "Jack", position: "Forward", number: 9, skill: 88, speed: 90, defense: 45, attack: 92 },
        { id: 11, name: "Kyle", position: "Forward", number: 11, skill: 85, speed: 88, defense: 50, attack: 90 }
    ],
    teamB: [
        { id: 12, name: "AI GK", position: "Goalkeeper", number: 1, skill: 82, speed: 70, defense: 88, attack: 25 },
        { id: 13, name: "AI Def 1", position: "Defender", number: 4, skill: 76, speed: 78, defense: 83, attack: 38 },
        { id: 14, name: "AI Def 2", position: "Defender", number: 5, skill: 79, speed: 80, defense: 85, attack: 35 },
        { id: 15, name: "AI Def 3", position: "Defender", number: 3, skill: 78, speed: 79, defense: 81, attack: 40 },
        { id: 16, name: "AI Def 4", position: "Defender", number: 2, skill: 80, speed: 81, defense: 84, attack: 38 },
        { id: 17, name: "AI Mid 1", position: "Midfielder", number: 8, skill: 84, speed: 85, defense: 73, attack: 72 },
        { id: 18, name: "AI Mid 2", position: "Midfielder", number: 10, skill: 87, speed: 88, defense: 68, attack: 88 },
        { id: 19, name: "AI Mid 3", position: "Midfielder", number: 6, skill: 83, speed: 86, defense: 76, attack: 68 },
        { id: 20, name: "AI For 1", position: "Forward", number: 9, skill: 89, speed: 93, defense: 42, attack: 94 },
        { id: 21, name: "AI For 2", position: "Forward", number: 11, skill: 85, speed: 90, defense: 48, attack: 92 },
        { id: 22, name: "AI For 3", position: "Forward", number: 7, skill: 87, speed: 89, defense: 46, attack: 91 }
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

// Start game loop for smooth movement
function startGameLoop() {
    function gameLoop() {
        if (gameRunning) {
            updatePlayerMovement();
            updateBall();
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
}

// Update player movement based on keys pressed
function updatePlayerMovement() {
    if (!selectedPlayer || !gameRunning) return;
    
    let moveX = 0;
    let moveY = 0;
    
    // Check arrow keys
    if (keysPressed['ArrowUp'] || keysPressed['w'] || keysPressed['W']) moveY -= 1;
    if (keysPressed['ArrowDown'] || keysPressed['s'] || keysPressed['S']) moveY += 1;
    if (keysPressed['ArrowLeft'] || keysPressed['a'] || keysPressed['A']) moveX -= 1;
    if (keysPressed['ArrowRight'] || keysPressed['d'] || keysPressed['D']) moveX += 1;
    
    if (moveX !== 0 || moveY !== 0) {
        // Normalize diagonal movement
        const length = Math.sqrt(moveX * moveX + moveY * moveY);
        moveX /= length;
        moveY /= length;
        
        // Apply speed with sprint
        const speed = shiftPressed || isSprinting ? 2.5 : 1.5;
        moveSelectedPlayer(moveX * speed, moveY * speed);
    } else {
        // Remove running animation when not moving
        if (selectedPlayer) {
            selectedPlayer.element.classList.remove('running');
        }
    }
}

// Move selected player with direction
function moveSelectedPlayer(deltaX, deltaY) {
    if (!selectedPlayer) return;
    
    let newX = selectedPlayer.x + deltaX;
    let newY = selectedPlayer.y + deltaY;
    
    // Keep within bounds (avoid goals)
    if (selectedPlayer.team === 'team-a') {
        newX = Math.max(10, Math.min(95, newX));
    } else {
        newX = Math.max(5, Math.min(90, newX));
    }
    newY = Math.max(10, Math.min(90, newY));
    
    // Update player position
    selectedPlayer.x = newX;
    selectedPlayer.y = newY;
    selectedPlayer.element.style.left = `${newX}%`;
    selectedPlayer.element.style.top = `${newY}%`;
    
    // Start running animation
    selectedPlayer.element.classList.add('running');
    
    // If player has ball, move ball with player
    if (selectedPlayer.hasBall) {
        moveBallWithPlayer();
    }
    
    // Check for ball contact
    checkBallContact();
}

// Start AI updates - FIXED: AI only moves when ball is near
function startAIUpdates() {
    if (aiUpdateInterval) clearInterval(aiUpdateInterval);
    aiUpdateInterval = setInterval(() => {
        if (gameRunning && gameActive) {
            updateAITeam();
        }
    }, 400); // Slower updates to prevent clustering
}

// Stop AI updates
function stopAIUpdates() {
    if (aiUpdateInterval) {
        clearInterval(aiUpdateInterval);
        aiUpdateInterval = null;
    }
}

// Update AI team - FIXED: Only move players when ball is near
function updateAITeam() {
    if (!gameRunning || !gameActive) return;
    
    aiMoveCounter++;
    
    // Update each AI player only when ball is near
    playersOnField.forEach((player, index) => {
        if (player.team === 'team-b' && !player.hasBall) {
            // Only move AI players when ball is near them or they're in position to intercept
            const distanceToBall = getDistance(player.x, player.y, ball.x, ball.y);
            
            // Move players based on ball position and their role
            if (distanceToBall < 40 || 
                (player.position === 'Defender' && distanceToBall < 50) ||
                (player.position === 'Goalkeeper' && distanceToBall < 30) ||
                aiMoveCounter % (10 + index * 2) === 0) { // Stagger movement
                
                setTimeout(() => {
                    updateAIPlayer(player);
                }, index * 50); // Stagger updates to prevent clustering
            }
        }
    });
}

// Update AI player - FIXED: Better positioning logic
function updateAIPlayer(player) {
    if (!player || player.hasBall) return;
    
    const currentTime = Date.now();
    const playerId = `player_${player.id}`;
    
    // Check collision cooldown
    if (playerCollisionCooldown[playerId] && currentTime - playerCollisionCooldown[playerId] < 500) {
        return;
    }
    
    // Only update position occasionally to prevent clustering
    if (lastAIPositionUpdate[playerId] && currentTime - lastAIPositionUpdate[playerId] < 1500) {
        return;
    }
    
    lastAIPositionUpdate[playerId] = currentTime;
    
    // Decision based on ball position and player role
    const distanceToBall = getDistance(player.x, player.y, ball.x, ball.y);
    
    if (ballWithPlayer) {
        if (ballWithPlayer.team === player.team) {
            // Supporting teammate
            moveToSupportPosition(player);
        } else {
            // Defending against opponent
            moveToDefensivePosition(player);
        }
    } else if (ball.isMoving && distanceToBall < 35) {
        // Ball is loose and near - move toward it
        moveTowardBall(player);
    } else if (distanceToBall < 25) {
        // Ball is static but near
        moveTowardBall(player);
    } else {
        // Return to position with some variation to prevent clustering
        returnToPositionWithVariation(player);
    }
}

// Create players on the field
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
        { x: 60, y: 25 }, { x: 60, y: 50 }, { x: 60, y: 75 }, // Midfielders
        { x: 40, y: 25 }, { x: 40, y: 50 }, { x: 40, y: 75 } // Forwards
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

// Create a single player
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
        targetX: position.x,
        targetY: position.y,
        lastMoveTime: 0
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

// Create the football
function createBall() {
    const field = document.getElementById('football-field');
    
    // Remove existing ball
    if (ball) {
        ball.element.remove();
        cancelAnimationFrame(ballAnimationFrame);
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
        isMoving: false
    };

    // Give ball to a random player initially
    setTimeout(() => {
        const randomPlayer = playersOnField[Math.floor(Math.random() * playersOnField.length)];
        giveBallToPlayer(randomPlayer);
    }, 500);
}

// Update ball position
function updateBall() {
    if (!ball) return;
    
    // Apply velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Bounce off walls - FIXED: Wider goal area
    if (ball.x <= 2 && (ball.y < 40 || ball.y > 60)) { // Not in goal
        ball.velocityX *= -0.8;
        ball.x = 2.1;
        addEvent("Ball hits the wall!", 'wall');
    }
    if (ball.x >= 98 && (ball.y < 40 || ball.y > 60)) { // Not in goal
        ball.velocityX *= -0.8;
        ball.x = 97.9;
        addEvent("Ball hits the wall!", 'wall');
    }
    if (ball.y <= 2) {
        ball.velocityY *= -0.8;
        ball.y = 2.1;
    }
    if (ball.y >= 98) {
        ball.velocityY *= -0.8;
        ball.y = 97.9;
    }
    
    // Apply friction
    ball.velocityX *= 0.96;
    ball.velocityY *= 0.96;
    
    // Update visual position
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
    
    // Rotate ball when moving
    if (Math.abs(ball.velocityX) > 0.1 || Math.abs(ball.velocityY) > 0.1) {
        ball.element.classList.add('moving');
        ball.isMoving = true;
    } else {
        ball.element.classList.remove('moving');
        ball.isMoving = false;
        ball.velocityX = 0;
        ball.velocityY = 0;
    }
    
    // Check for player contact
    checkBallContact();
    
    // Check for goals - FIXED: Proper goal detection
    checkForGoal();
    
    // Continue animation if still moving
    if (ball.isMoving) {
        ballAnimationFrame = requestAnimationFrame(updateBall);
    }
}

// Check if ball contacts a player - FIXED: Better interception
function checkBallContact() {
    if (!ball || ball.withPlayer || !ball.isMoving) return;
    
    playersOnField.forEach(player => {
        if (player.hasBall) return;
        
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Player can intercept ball if close enough
        if (distance < 10) {
            giveBallToPlayer(player);
            return;
        }
    });
}

// Give ball to player
function giveBallToPlayer(player) {
    if (ball.withPlayer === player) return;
    
    // Remove ball from previous player
    if (ball.withPlayer) {
        ball.withPlayer.hasBall = false;
        ball.withPlayer.element.classList.remove('has-ball');
    }
    
    // Give to new player
    ball.withPlayer = player;
    ballWithPlayer = player;
    player.hasBall = true;
    player.element.classList.add('has-ball');
    
    // Stop ball movement
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.x = player.x;
    ball.y = player.y - 3;
    ball.isMoving = false;
    
    // Cancel animation frame
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    // Update visual position
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
    ball.element.classList.remove('moving');
    
    // Update display
    updateBallPossession();
    updatePossessionStats(player.team === 'team-a' ? 'teamA' : 'teamB');
    
    addEvent(`${player.name} gets the ball!`, 'possession');
    
    // If AI player gets the ball, make AI decision after delay
    if (player.team === 'team-b' && gameRunning) {
        setTimeout(() => {
            makeAIDecision(player);
        }, 800);
    }
}

// Move ball with player
function moveBallWithPlayer() {
    if (!ball.withPlayer) return;
    
    ball.x = ball.withPlayer.x;
    ball.y = ball.withPlayer.y - 3;
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
}

// Pass the ball - FIXED: Working pass system
function passBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }
    
    if (passCooldown) return;
    
    // Find all teammates
    const teammates = playersOnField.filter(p => 
        p.team === selectedPlayer.team && 
        p !== selectedPlayer
    );
    
    if (teammates.length > 0) {
        // Find the closest teammate in front
        let bestTeammate = null;
        let bestDistance = Infinity;
        
        teammates.forEach(teammate => {
            const dx = teammate.x - selectedPlayer.x;
            const dy = teammate.y - selectedPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if teammate is in reasonable passing range and in front
            if (distance < 40 && distance < bestDistance) {
                // Check if teammate is in front (for better passing)
                const isInFront = (selectedPlayer.team === 'team-a' && teammate.x > selectedPlayer.x) ||
                                 (selectedPlayer.team === 'team-b' && teammate.x < selectedPlayer.x);
                
                if (isInFront || distance < 20) {
                    bestDistance = distance;
                    bestTeammate = teammate;
                }
            }
        });
        
        if (bestTeammate) {
            // Calculate direction to teammate
            const dx = bestTeammate.x - ball.x;
            const dy = bestTeammate.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Pass speed based on player skill
            const speed = Math.min(5, selectedPlayer.skill / 20);
            
            // Kick the ball toward teammate
            ball.velocityX = (dx / distance) * speed;
            ball.velocityY = (dy / distance) * speed;
            ball.withPlayer = null;
            ballWithPlayer = null;
            selectedPlayer.hasBall = false;
            selectedPlayer.element.classList.remove('has-ball');
            ball.isMoving = true;
            
            // Set cooldown
            passCooldown = true;
            setTimeout(() => { passCooldown = false; }, 500);
            
            addEvent(`${selectedPlayer.name} passes to ${bestTeammate.name}`, 'pass');
            
            // Start ball animation
            if (!ballAnimationFrame) {
                ballAnimationFrame = requestAnimationFrame(updateBall);
            }
        } else {
            // No good pass, try a clearance
            attemptClearance(selectedPlayer);
        }
    } else {
        addEvent("No teammates found!");
    }
}

// Attempt a clearance
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
    const speed = 4;
    
    ball.velocityX = (dx / distance) * speed;
    ball.velocityY = (dy / distance) * speed;
    ball.withPlayer = null;
    ballWithPlayer = null;
    player.hasBall = false;
    player.element.classList.remove('has-ball');
    ball.isMoving = true;
    
    // Set cooldown
    passCooldown = true;
    setTimeout(() => { passCooldown = false; }, 500);
    
    addEvent(`${player.name} clears the ball!`, 'clearance');
    
    // Start ball animation
    if (!ballAnimationFrame) {
        ballAnimationFrame = requestAnimationFrame(updateBall);
    }
}

// Shoot the ball - FIXED: Better shooting from distance
function shootBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }
    
    if (shootCooldown) return;
    
    // Check if in reasonable shooting range
    const distanceToGoal = selectedPlayer.team === 'team-a' ? 
        100 - selectedPlayer.x : selectedPlayer.x;
    
    if (distanceToGoal > 60) {
        addEvent("Too far from goal!");
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
    
    // Calculate direction to goal
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Shoot power based on player skill and distance
    const basePower = selectedPlayer.attack / 15;
    const distanceFactor = Math.max(0.5, 1 - (distanceToGoal / 80));
    const power = Math.min(8, basePower * distanceFactor);
    
    // Add accuracy based on skill
    const accuracy = selectedPlayer.skill / 100;
    const inaccuracy = (1 - accuracy) * 0.6;
    const offsetX = (Math.random() - 0.5) * inaccuracy;
    const offsetY = (Math.random() - 0.5) * inaccuracy;
    
    // Kick the ball toward goal
    ball.velocityX = (dx / distance) * power + offsetX;
    ball.velocityY = (dy / distance) * power + offsetY;
    ball.withPlayer = null;
    ballWithPlayer = null;
    selectedPlayer.hasBall = false;
    selectedPlayer.element.classList.remove('has-ball');
    ball.isMoving = true;
    
    // Set cooldown
    shootCooldown = true;
    setTimeout(() => { shootCooldown = false; }, 800);
    
    addEvent(`${selectedPlayer.name} shoots!`, 'shot');
    
    // Start ball animation
    if (!ballAnimationFrame) {
        ballAnimationFrame = requestAnimationFrame(updateBall);
    }
}

// AI Decision making
function makeAIDecision(player) {
    if (!gameRunning || !ballWithPlayer || ballWithPlayer !== player) return;
    
    const decision = Math.random();
    
    // Check shooting chance first
    const distanceToGoal = player.team === 'team-b' ? player.x : 100 - player.x;
    
    if (distanceToGoal < 40 && decision < 0.4) {
        // Shoot if close to goal
        aiShootBall(player);
    } else if (decision < 0.7) {
        // Pass to teammate
        aiPassBall(player);
    } else {
        // Dribble
        aiDribble(player);
    }
}

// AI Pass
function aiPassBall(player) {
    const teammates = playersOnField.filter(p => 
        p.team === player.team && 
        p !== player &&
        !p.hasBall
    );
    
    if (teammates.length > 0) {
        // Find the best passing option
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
            if (teammate.position === 'Forward' && ((player.team === 'team-b' && teammate.x < player.x) || 
                (player.team === 'team-a' && teammate.x > player.x))) {
                score += 20;
            }
            
            if (score > bestScore && distance < 40) {
                bestScore = score;
                bestTeammate = teammate;
            }
        });
        
        if (bestTeammate) {
            const dx = bestTeammate.x - ball.x;
            const dy = bestTeammate.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = Math.min(4, player.skill / 25);
            
            ball.velocityX = (dx / distance) * speed;
            ball.velocityY = (dy / distance) * speed;
            ball.withPlayer = null;
            ballWithPlayer = null;
            player.hasBall = false;
            player.element.classList.remove('has-ball');
            ball.isMoving = true;
            
            addEvent(`${player.name} passes to ${bestTeammate.name}`, 'pass');
            return true;
        }
    }
    
    return false;
}

// AI Shoot
function aiShootBall(player) {
    // Calculate target in goal
    let goalX, goalY;
    if (player.team === 'team-b') {
        goalX = 2;
        goalY = 50 + (Math.random() - 0.5) * 10;
    } else {
        goalX = 98;
        goalY = 50 + (Math.random() - 0.5) * 10;
    }
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(6, player.attack / 20);
    
    ball.velocityX = (dx / distance) * power;
    ball.velocityY = (dy / distance) * power;
    ball.withPlayer = null;
    ballWithPlayer = null;
    player.hasBall = false;
    player.element.classList.remove('has-ball');
    ball.isMoving = true;
    
    addEvent(`${player.name} shoots!`, 'shot');
    return true;
}

// AI Dribble
function aiDribble(player) {
    // Move toward opponent's goal
    let moveX, moveY;
    if (player.team === 'team-b') {
        moveX = player.x - 1.0;
        moveY = player.y + (Math.random() - 0.5) * 1.5;
    } else {
        moveX = player.x + 1.0;
        moveY = player.y + (Math.random() - 0.5) * 1.5;
    }
    
    // Keep in bounds
    moveX = Math.max(10, Math.min(90, moveX));
    moveY = Math.max(10, Math.min(90, moveY));
    
    player.x = moveX;
    player.y = moveY;
    player.element.style.left = `${moveX}%`;
    player.element.style.top = `${moveY}%`;
    
    // Move ball with player
    moveBallWithPlayer();
    
    // Add running animation
    player.element.classList.add('running');
    setTimeout(() => {
        player.element.classList.remove('running');
    }, 300);
    
    return true;
}

// AI movement helper functions - FIXED: Better positioning
function moveToSupportPosition(player) {
    if (!ballWithPlayer) return;
    
    const ballHolder = ballWithPlayer;
    const dx = ballHolder.x - player.x;
    const dy = ballHolder.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Support distance with variation to prevent clustering
    const supportDistance = 15 + (player.id % 5); // Different for each player
    
    if (distance > supportDistance + 5 || distance < supportDistance - 5) {
        const moveX = player.x + (dx / distance) * 0.5;
        const moveY = player.y + (dy / distance) * 0.5;
        
        player.x = Math.max(10, Math.min(90, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

function moveToDefensivePosition(player) {
    if (!ballWithPlayer) return;
    
    const opponent = ballWithPlayer;
    const goalX = player.team === 'team-a' ? 10 : 90;
    
    // Position between opponent and goal with variation
    const variation = (player.id % 3) - 1; // -1, 0, or 1
    const targetX = opponent.x + (goalX - opponent.x) * 0.4;
    const targetY = opponent.y + variation * 5;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 3) {
        const moveX = player.x + (dx / distance) * 0.6;
        const moveY = player.y + (dy / distance) * 0.6;
        
        player.x = Math.max(10, Math.min(90, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

function moveTowardBall(player) {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 8) {
        const moveX = player.x + (dx / distance) * 0.8;
        const moveY = player.y + (dy / distance) * 0.8;
        
        player.x = Math.max(10, Math.min(90, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

function returnToPositionWithVariation(player) {
    const variationX = (Math.random() - 0.5) * 3;
    const variationY = (Math.random() - 0.5) * 3;
    
    const targetX = player.originalPosition.x + variationX;
    const targetY = player.originalPosition.y + variationY;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 2) {
        const moveX = player.x + (dx / distance) * 0.3;
        const moveY = player.y + (dy / distance) * 0.3;
        
        player.x = Math.max(10, Math.min(90, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

// Helper function to calculate distance
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Check for goals - FIXED: Proper goal detection
function checkForGoal() {
    if (!ball || !ball.isMoving) return;
    
    // Check if ball is in goal area (wider detection)
    const inLeftGoal = ball.x <= 5 && ball.y >= 35 && ball.y <= 65;
    const inRightGoal = ball.x >= 95 && ball.y >= 35 && ball.y <= 65;
    
    if (inLeftGoal) {
        // Team B scores (ball in left goal)
        teamBScore++;
        updateScoreboard();
        addEvent("⚽ GOAL! Team B scores!", 'goal');
        highlightGoal('left');
        setTimeout(() => {
            resetBall();
        }, 1500);
        return;
    }
    
    if (inRightGoal) {
        // Team A scores (ball in right goal)
        teamAScore++;
        updateScoreboard();
        addEvent("⚽ GOAL! Team A scores!", 'goal');
        highlightGoal('right');
        setTimeout(() => {
            resetBall();
        }, 1500);
        return;
    }
}

// Highlight goal animation
function highlightGoal(side) {
    const goalElement = side === 'left' ? 
        document.querySelector('.left-goal') : 
        document.querySelector('.right-goal');
    
    if (goalElement) {
        goalElement.style.backgroundColor = 'rgba(16, 185, 129, 0.8)';
        goalElement.style.boxShadow = '0 0 40px rgba(16, 185, 129, 0.9)';
        
        setTimeout(() => {
            goalElement.style.backgroundColor = '';
            goalElement.style.boxShadow = '';
        }, 1500);
    }
}

// Reset ball position
function resetBall() {
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    if (ballWithPlayer) {
        ballWithPlayer.hasBall = false;
        ballWithPlayer.element.classList.remove('has-ball');
        ballWithPlayer = null;
    }
    
    ball.x = 50;
    ball.y = 50;
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.withPlayer = null;
    ball.isMoving = false;
    ball.element.style.left = '50%';
    ball.element.style.top = '50%';
    ball.element.classList.remove('moving');
    
    updateBallPossession();
    
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
    }, 500);
}

// Select a player
function selectPlayer(player) {
    if (player.team !== 'team-a') return;
    
    // Deselect previous player
    if (selectedPlayer) {
        selectedPlayer.element.classList.remove('selected');
        selectedPlayer.element.classList.remove('running');
    }
    
    // Select new player
    selectedPlayer = player;
    player.element.classList.add('selected');
    
    document.getElementById('selected-player').textContent = player.name;
    addEvent(`Selected ${player.name}`);
}

// Select next player
function selectNextPlayer() {
    const teamAPlayers = playersOnField.filter(p => p.team === 'team-a');
    if (teamAPlayers.length === 0) return;
    
    let currentIndex = selectedPlayer ? 
        teamAPlayers.findIndex(p => p.id === selectedPlayer.id) : -1;
    
    const nextIndex = (currentIndex + 1) % teamAPlayers.length;
    selectPlayer(teamAPlayers[nextIndex]);
}

// Toggle sprint mode
function toggleSprint() {
    isSprinting = !isSprinting;
    const sprintBtn = document.getElementById('sprint-btn');
    
    if (isSprinting) {
        sprintBtn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
        sprintBtn.style.transform = 'scale(1.05)';
        sprintBtn.innerHTML = '<i class="fas fa-running"></i> Sprint ON (Shift)';
        addEvent("Sprinting ON!");
    } else {
        sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        sprintBtn.style.transform = 'scale(1)';
        sprintBtn.innerHTML = '<i class="fas fa-running"></i> Sprint (Shift)';
        addEvent("Sprinting OFF!");
    }
}

// Update display functions
function updateScoreboard() {
    document.getElementById('team-a-score').textContent = teamAScore;
    document.getElementById('team-b-score').textContent = teamBScore;
    
    // Animate score update
    const scoreElement = document.querySelector('.score');
    scoreElement.style.transform = 'scale(1.3)';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
    }, 300);
}

function updateBallPossession() {
    const possessionElement = document.getElementById('ball-possession');
    if (ballWithPlayer) {
        possessionElement.textContent = ballWithPlayer.name;
        possessionElement.style.color = ballWithPlayer.team === 'team-a' ? '#3b82f6' : '#ef4444';
    } else {
        possessionElement.textContent = 'No one';
        possessionElement.style.color = '#fff';
    }
}

function updatePossessionStats(team) {
    if (team === 'teamA') {
        possession.teamA = Math.min(100, possession.teamA + 1);
        possession.teamB = Math.max(0, possession.teamB - 1);
    } else {
        possession.teamB = Math.min(100, possession.teamB + 1);
        possession.teamA = Math.max(0, possession.teamA - 1);
    }
    
    document.getElementById('possession').textContent = 
        `${possession.teamA}% - ${possession.teamB}%`;
}

function updateMatchTime() {
    const minutes = Math.floor(matchTime / 60);
    const seconds = matchTime % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('match-time').textContent = timeString;
}

function updateDisplay() {
    updateScoreboard();
    updateBallPossession();
    updateMatchTime();
}

// Event logging
function addEvent(message, type = '') {
    const eventLog = document.getElementById('event-log');
    const eventElement = document.createElement('div');
    eventElement.className = `event ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    eventElement.textContent = `[${time}] ${message}`;
    
    eventLog.prepend(eventElement);
    
    // Keep only last 10 events
    const events = eventLog.querySelectorAll('.event');
    if (events.length > 10) {
        events[events.length - 1].remove();
    }
}

// Game control functions
function startGame() {
    if (gameRunning) return;
    
    gameRunning = true;
    gameActive = true;
    document.getElementById('game-status').textContent = 'Playing';
    document.getElementById('game-status').style.color = '#00ff88';
    
    matchInterval = setInterval(() => {
        matchTime++;
        updateMatchTime();
        
        if (matchTime >= 180) {
            endGame();
        }
    }, 1000);
    
    addEvent("Game started!");
    startAIUpdates();
    
    if (!selectedPlayer) {
        const teamAPlayers = playersOnField.filter(p => p.team === 'team-a');
        if (teamAPlayers.length > 0) {
            selectPlayer(teamAPlayers[0]);
        }
    }
}

function pauseGame() {
    gameRunning = !gameRunning;
    gameActive = gameRunning;
    
    if (gameRunning) {
        document.getElementById('game-status').textContent = 'Playing';
        document.getElementById('game-status').style.color = '#00ff88';
        addEvent("Game resumed");
        startAIUpdates();
    } else {
        document.getElementById('game-status').textContent = 'Paused';
        document.getElementById('game-status').style.color = '#f59e0b';
        addEvent("Game paused");
        stopAIUpdates();
    }
}

function resetGame() {
    gameRunning = false;
    gameActive = false;
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
    passCooldown = false;
    shootCooldown = false;
    playerCollisionCooldown = {};
    lastAIPositionUpdate = {};
    aiMoveCounter = 0;
    
    createPlayers();
    createBall();
    updateDisplay();
    
    document.getElementById('game-status').textContent = 'Ready';
    document.getElementById('game-status').style.color = '#fff';
    document.getElementById('selected-player').textContent = 'None';
    const sprintBtn = document.getElementById('sprint-btn');
    sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    sprintBtn.style.transform = 'scale(1)';
    sprintBtn.innerHTML = '<i class="fas fa-running"></i> Sprint (Shift)';
    
    addEvent("Game reset");
}

function endGame() {
    gameRunning = false;
    gameActive = false;
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
        resultMessage = `You win! ${teamAScore}-${teamBScore}`;
    } else if (teamAScore < teamBScore) {
        resultMessage = `Computer wins! ${teamBScore}-${teamAScore}`;
    } else {
        resultMessage = `Draw! ${teamAScore}-${teamBScore}`;
    }
    
    addEvent(`Game over! ${resultMessage}`);
}

// Setup event listeners
function setupEventListeners() {
    // Movement buttons
    document.getElementById('move-up').addEventListener('click', () => {
        if (selectedPlayer && gameRunning) moveSelectedPlayer(0, -2);
    });
    document.getElementById('move-down').addEventListener('click', () => {
        if (selectedPlayer && gameRunning) moveSelectedPlayer(0, 2);
    });
    document.getElementById('move-left').addEventListener('click', () => {
        if (selectedPlayer && gameRunning) moveSelectedPlayer(-2, 0);
    });
    document.getElementById('move-right').addEventListener('click', () => {
        if (selectedPlayer && gameRunning) moveSelectedPlayer(2, 0);
    });

    // Action buttons
    document.getElementById('pass-btn').addEventListener('click', passBall);
    document.getElementById('shoot-btn').addEventListener('click', shootBall);
    document.getElementById('sprint-btn').addEventListener('click', toggleSprint);
    document.getElementById('select-btn').addEventListener('click', selectNextPlayer);

    // Game control buttons
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
}

// Setup keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameRunning && e.key !== ' ') return;
        
        // Store key state
        keysPressed[e.key] = true;
        
        // Check for Shift key
        if (e.key === 'Shift') {
            shiftPressed = true;
            if (!isSprinting) {
                toggleSprint();
            }
        }
        
        switch(e.key.toLowerCase()) {
            case ' ':
                if (!gameRunning) startGame();
                break;
            case 'p':
                if (e.key === 'p') {
                    e.preventDefault();
                    passBall();
                }
                break;
            case 's':
                if (e.key === 's') {
                    e.preventDefault();
                    shootBall();
                }
                break;
            case 'c':
                selectNextPlayer();
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        // Remove key state
        keysPressed[e.key] = false;
        
        // Handle Shift key release
        if (e.key === 'Shift') {
            shiftPressed = false;
            if (isSprinting) {
                toggleSprint();
            }
        }
        
        // Remove running animation when movement keys are released
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
            if (selectedPlayer) {
                selectedPlayer.element.classList.remove('running');
            }
        }
    });
}

// Initialize the game when page loads
window.addEventListener('load', initGame);

// Field click for player movement
document.getElementById('football-field').addEventListener('click', function(e) {
    if (!selectedPlayer || !gameRunning) return;
    
    const rect = this.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    selectedPlayer.x = Math.max(5, Math.min(95, x));
    selectedPlayer.y = Math.max(10, Math.min(90, y));
    selectedPlayer.element.style.left = `${selectedPlayer.x}%`;
    selectedPlayer.element.style.top = `${selectedPlayer.y}%`;
    
    if (selectedPlayer.hasBall) {
        moveBallWithPlayer();
    }
    
    addEvent(`${selectedPlayer.name} moves to new position`);
});

// Export functions for debugging
window.game = {
    initGame,
    startGame,
    pauseGame,
    resetGame,
    passBall,
    shootBall,
    selectNextPlayer,
    getState: () => ({
        gameRunning,
        teamAScore,
        teamBScore,
        matchTime,
        selectedPlayer: selectedPlayer?.name,
        ballWithPlayer: ballWithPlayer?.name,
        possession,
        ballPosition: { x: ball?.x, y: ball?.y }
    })
};
