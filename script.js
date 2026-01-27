// Football Game JavaScript - Complete Working Version with Tackle Feature
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
let tackleCooldown = false;
let aiMoveCounter = 0;
let goalJustScored = false;
let celebrationActive = false;

// Player Data
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
    function gameLoop() {
        if (gameRunning && !celebrationActive) {
            updatePlayerMovement();
            updateBall();
            updateStamina();
            updatePlayerAnimations();
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
}

// Update player movement based on keys pressed
function updatePlayerMovement() {
    if (!selectedPlayer || !gameRunning || celebrationActive) return;
    
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
        if (length > 0) {
            moveX /= length;
            moveY /= length;
        }
        
        // Apply speed with sprint
        const baseSpeed = 1.5;
        const sprintMultiplier = (shiftPressed || isSprinting) && selectedPlayer.stamina > 20 ? 2.0 : 1.0;
        const currentStaminaEffect = Math.max(0.5, selectedPlayer.stamina / 100);
        const speed = baseSpeed * sprintMultiplier * currentStaminaEffect;
        
        moveSelectedPlayer(moveX * speed, moveY * speed);
        
        // Consume stamina when sprinting
        if (sprintMultiplier > 1.0) {
            selectedPlayer.stamina = Math.max(0, selectedPlayer.stamina - 0.8);
        }
    } else {
        // Remove running animation when not moving
        if (selectedPlayer) {
            selectedPlayer.element.classList.remove('running');
        }
        // Regenerate stamina when idle
        if (selectedPlayer && selectedPlayer.stamina < 100) {
            selectedPlayer.stamina = Math.min(100, selectedPlayer.stamina + 0.3);
        }
    }
}

// Move selected player with direction
function moveSelectedPlayer(deltaX, deltaY) {
    if (!selectedPlayer || celebrationActive) return;
    
    let newX = selectedPlayer.x + deltaX;
    let newY = selectedPlayer.y + deltaY;
    
    // Keep within bounds
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
    selectedPlayer.isMoving = true;
    
    // If player has ball, move ball with player
    if (selectedPlayer.hasBall) {
        moveBallWithPlayer();
    }
    
    // Check for ball contact
    checkBallContact();
    
    // Check for tackle opportunities when moving near opponent with ball
    if (!selectedPlayer.hasBall && ballWithPlayer && ballWithPlayer.team !== selectedPlayer.team) {
        const distance = getDistance(selectedPlayer.x, selectedPlayer.y, ballWithPlayer.x, ballWithPlayer.y);
        if (distance < 12) {
            // Chance to auto-tackle when very close
            if (Math.random() < 0.1) {
                attemptTackle(selectedPlayer, ballWithPlayer);
            }
        }
    }
}

// Start AI updates
function startAIUpdates() {
    if (aiUpdateInterval) clearInterval(aiUpdateInterval);
    aiUpdateInterval = setInterval(() => {
        if (gameRunning && gameActive && !celebrationActive) {
            updateAITeam();
        }
    }, 400);
}

// Stop AI updates
function stopAIUpdates() {
    if (aiUpdateInterval) {
        clearInterval(aiUpdateInterval);
        aiUpdateInterval = null;
    }
}

// Update AI team
function updateAITeam() {
    if (!gameRunning || !gameActive || celebrationActive) return;
    
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
                aiMoveCounter % (10 + index * 2) === 0) {
                
                setTimeout(() => {
                    updateAIPlayer(player);
                }, index * 50);
            }
        }
    });
}

// Update AI player
function updateAIPlayer(player) {
    if (!player || player.hasBall || celebrationActive) return;
    
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
            // Defending against opponent - try to tackle if close
            if (distanceToBall < 15 && Math.random() < 0.3) {
                attemptTackle(player, ballWithPlayer);
            } else {
                moveToDefensivePosition(player);
            }
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
        lastX: position.x,
        lastY: position.y,
        actionCooldown: 0,
        lastActionTime: 0
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
        isMoving: false,
        rotation: 0,
        lastTouch: null,
        lastScorer: null
    };

    // Give ball to a random player initially
    setTimeout(() => {
        const randomPlayer = playersOnField[Math.floor(Math.random() * 14)]; // Exclude goalkeepers
        giveBallToPlayer(randomPlayer);
    }, 1000);
}

// Update ball position
function updateBall() {
    if (!ball || celebrationActive) return;
    
    // Apply velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Check for goal BEFORE boundary checks
    checkForGoal();
    
    // Only continue if no goal was scored
    if (goalJustScored) {
        return;
    }
    
    // Bounce off walls (except goal areas)
    const inLeftGoalArea = ball.x <= 5 && ball.y >= 35 && ball.y <= 65;
    const inRightGoalArea = ball.x >= 95 && ball.y >= 35 && ball.y <= 65;
    
    if (!inLeftGoalArea && !inRightGoalArea) {
        if (ball.x <= 2) {
            ball.velocityX = Math.abs(ball.velocityX) * 0.7;
            ball.x = 2.1;
        }
        if (ball.x >= 98) {
            ball.velocityX = -Math.abs(ball.velocityX) * 0.7;
            ball.x = 97.9;
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
    
    // Apply friction
    ball.velocityX *= 0.96;
    ball.velocityY *= 0.96;
    
    // Update visual position
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
    
    // Rotate ball when moving
    const speed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
    if (speed > 0.1) {
        ball.rotation += speed * 3;
        ball.element.style.transform = `rotate(${ball.rotation}deg)`;
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
    
    // Continue animation if still moving
    if (ball.isMoving && !ballAnimationFrame) {
        ballAnimationFrame = requestAnimationFrame(updateBall);
    } else if (!ball.isMoving && ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
}

// Check if ball contacts a player
function checkBallContact() {
    if (!ball || ball.withPlayer || !ball.isMoving || celebrationActive) return;
    
    playersOnField.forEach(player => {
        if (player.hasBall) return;
        
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Player can intercept ball if close enough
        if (distance < 10) {
            // Check interception chance based on skill
            const interceptionChance = player.skill / 100;
            if (Math.random() < interceptionChance) {
                giveBallToPlayer(player);
                addEvent(`${player.name} intercepts the ball!`, 'interception');
                return;
            } else {
                // Deflect ball
                ball.velocityX *= -0.5;
                ball.velocityY *= -0.5;
            }
        }
    });
}

// Give ball to player
function giveBallToPlayer(player) {
    if (ball.withPlayer === player || !player || celebrationActive) return;
    
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
    
    // Update display
    updateBallPossession();
    updatePossessionStats(player.team === 'team-a' ? 'teamA' : 'teamB');
    
    addEvent(`${player.name} controls the ball!`, 'possession');
    
    // If AI player gets the ball, make AI decision after delay
    if (player.team === 'team-b' && gameRunning && !celebrationActive) {
        setTimeout(() => {
            makeAIDecision(player);
        }, 500 + Math.random() * 300);
    }
}

// Move ball with player
function moveBallWithPlayer() {
    if (!ball.withPlayer || celebrationActive) return;
    
    ball.x = ball.withPlayer.x;
    ball.y = ball.withPlayer.y - 3;
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
}

// NEW: Tackle function to take ball from opponent
function tackle() {
    if (!selectedPlayer || !gameRunning || celebrationActive) {
        addEvent("Cannot tackle now!", 'warning');
        return;
    }
    
    if (tackleCooldown) {
        addEvent("Cannot tackle so quickly!", 'warning');
        return;
    }
    
    if (selectedPlayer.hasBall) {
        addEvent("You already have the ball!", 'warning');
        return;
    }
    
    // Find opponent with ball
    if (!ballWithPlayer || ballWithPlayer.team === selectedPlayer.team) {
        addEvent("No opponent has the ball!", 'warning');
        return;
    }
    
    const opponent = ballWithPlayer;
    const distance = getDistance(selectedPlayer.x, selectedPlayer.y, opponent.x, opponent.y);
    
    if (distance > 15) {
        addEvent("Too far to tackle!", 'warning');
        return;
    }
    
    // Attempt tackle
    attemptTackle(selectedPlayer, opponent);
}

// Attempt to tackle an opponent
function attemptTackle(tackler, opponent) {
    if (!tackler || !opponent || !opponent.hasBall || celebrationActive) return;
    
    const currentTime = Date.now();
    const tacklerId = `player_${tackler.id}`;
    
    // Check tackle cooldown
    if (playerCollisionCooldown[tacklerId] && currentTime - playerCollisionCooldown[tacklerId] < 1000) {
        return;
    }
    
    // Calculate tackle success chance
    const tackleChance = (tackler.defense / 100) * 0.7;
    const dribbleDefense = (opponent.skill / 100) * 0.4;
    const successChance = tackleChance - dribbleDefense + 0.3; // Base 30% chance
    
    // Show tackle animation
    tackler.element.classList.add('tackling');
    setTimeout(() => {
        tackler.element.classList.remove('tackling');
    }, 500);
    
    if (Math.random() < successChance) {
        // Successful tackle
        giveBallToPlayer(tackler);
        addEvent(`${tackler.name} tackles ${opponent.name} and wins the ball!`, 'tackle');
        
        // Stun opponent briefly
        opponent.element.classList.add('stunned');
        setTimeout(() => {
            opponent.element.classList.remove('stunned');
        }, 800);
        
        // Set cooldown
        tackleCooldown = true;
        setTimeout(() => { tackleCooldown = false; }, 1000);
        playerCollisionCooldown[tacklerId] = currentTime;
    } else {
        // Failed tackle
        addEvent(`${opponent.name} avoids ${tackler.name}'s tackle!`, 'dribble');
        
        // Set cooldown
        tackleCooldown = true;
        setTimeout(() => { tackleCooldown = false; }, 1000);
        playerCollisionCooldown[tacklerId] = currentTime;
        
        // Opponent might move away
        if (opponent.team === 'team-b') {
            setTimeout(() => {
                if (opponent.hasBall && !celebrationActive) {
                    aiDribble(opponent);
                }
            }, 300);
        }
    }
}

// Pass the ball
function passBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer || celebrationActive) {
        addEvent("You don't have the ball!", 'warning');
        return;
    }
    
    if (passCooldown) {
        addEvent("Cannot pass so quickly!", 'warning');
        return;
    }
    
    // Find all teammates
    const teammates = playersOnField.filter(p => 
        p.team === selectedPlayer.team && 
        p !== selectedPlayer
    );
    
    if (teammates.length > 0) {
        // Find the best passing option
        let bestTeammate = null;
        let bestScore = -Infinity;
        
        teammates.forEach(teammate => {
            const dx = teammate.x - selectedPlayer.x;
            const dy = teammate.y - selectedPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only consider reasonable distances
            if (distance > 5 && distance < 40) {
                let score = 0;
                
                // Base score based on skill
                score += selectedPlayer.skill / 5;
                
                // Distance preference (prefer medium distance passes)
                score += 30 - Math.abs(distance - 20);
                
                // Position preference
                if (teammate.position === 'Forward' && teammate.x > 60) score += 20;
                if (teammate.position === 'Midfielder') score += 15;
                
                // Check if teammate is open
                const defendersNearby = playersOnField.filter(p => 
                    p.team !== selectedPlayer.team &&
                    getDistance(p.x, p.y, teammate.x, teammate.y) < 15
                ).length;
                
                score -= defendersNearby * 10;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestTeammate = teammate;
                }
            }
        });
        
        if (bestTeammate && bestScore > 10) {
            // Calculate pass direction
            const dx = bestTeammate.x - ball.x;
            const dy = bestTeammate.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Pass speed based on player skill
            const passPower = Math.min(5, selectedPlayer.skill / 20);
            
            // Kick the ball toward teammate
            ball.velocityX = (dx / distance) * passPower;
            ball.velocityY = (dy / distance) * passPower;
            ball.withPlayer = null;
            ballWithPlayer = null;
            selectedPlayer.hasBall = false;
            selectedPlayer.element.classList.remove('has-ball');
            selectedPlayer.isMoving = false;
            selectedPlayer.element.classList.remove('running');
            ball.isMoving = true;
            lastBallTouchTime = Date.now();
            ball.lastScorer = null;
            
            // Set pass cooldown
            passCooldown = true;
            setTimeout(() => { passCooldown = false; }, 500);
            
            addEvent(`${selectedPlayer.name} passes to ${bestTeammate.name}`, 'pass');
            
            // Start ball animation
            if (!ballAnimationFrame) {
                ballAnimationFrame = requestAnimationFrame(updateBall);
            }
        } else {
            // No good pass available
            addEvent("No good passing options!", 'warning');
        }
    } else {
        addEvent("No teammates available!", 'warning');
    }
}

// Shoot the ball
function shootBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer || celebrationActive) {
        addEvent("You don't have the ball!", 'warning');
        return;
    }
    
    if (shootCooldown) {
        addEvent("Cannot shoot so quickly!", 'warning');
        return;
    }
    
    // Check if in shooting range
    const distanceToGoal = selectedPlayer.team === 'team-a' ? 
        100 - selectedPlayer.x : selectedPlayer.x;
    
    if (distanceToGoal > 70) {
        addEvent("Too far from goal!", 'warning');
        return;
    }
    
    // Determine goal to shoot at
    let goalX, goalY;
    if (selectedPlayer.team === 'team-a') {
        goalX = 98; // Right goal
        goalY = 50 + (Math.random() - 0.5) * 15; // More variation for realism
    } else {
        goalX = 2; // Left goal
        goalY = 50 + (Math.random() - 0.5) * 15;
    }
    
    // Calculate direction to goal
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Shoot power based on player skill and distance
    const basePower = selectedPlayer.attack / 15;
    const distanceFactor = Math.max(0.4, 1 - (distanceToGoal / 80));
    const power = Math.min(9, basePower * distanceFactor * (0.9 + Math.random() * 0.2));
    
    // Add accuracy based on skill
    const accuracy = selectedPlayer.skill / 100;
    const inaccuracy = (1 - accuracy) * 0.8;
    const offsetX = (Math.random() - 0.5) * inaccuracy;
    const offsetY = (Math.random() - 0.5) * inaccuracy;
    
    // Store who shot the ball (for goal attribution)
    ball.lastScorer = selectedPlayer;
    
    // Kick the ball toward goal
    ball.velocityX = (dx / distance) * power + offsetX;
    ball.velocityY = (dy / distance) * power + offsetY;
    ball.withPlayer = null;
    ballWithPlayer = null;
    selectedPlayer.hasBall = false;
    selectedPlayer.element.classList.remove('has-ball');
    selectedPlayer.isMoving = false;
    selectedPlayer.element.classList.remove('running');
    ball.isMoving = true;
    lastBallTouchTime = Date.now();
    
    // Set shoot cooldown
    shootCooldown = true;
    setTimeout(() => { shootCooldown = false; }, 800);
    
    addEvent(`${selectedPlayer.name} shoots from distance!`, 'shot');
    
    // Start ball animation
    if (!ballAnimationFrame) {
        ballAnimationFrame = requestAnimationFrame(updateBall);
    }
}

// AI Decision making
function makeAIDecision(player) {
    if (!gameRunning || !ballWithPlayer || ballWithPlayer !== player || celebrationActive) return;
    
    const currentTime = Date.now();
    if (currentTime - player.lastActionTime < player.actionCooldown) return;
    
    const decision = Math.random();
    
    // Check shooting chance first
    const distanceToGoal = player.team === 'team-b' ? player.x : 100 - player.x;
    
    if (distanceToGoal < 45 && decision < 0.5) {
        // Shoot if close to goal
        aiShootBall(player);
        player.lastActionTime = currentTime;
        player.actionCooldown = 1000 + Math.random() * 500;
        return;
    }
    
    // Then check passing
    if (decision < 0.8) {
        if (aiPassBall(player)) {
            player.lastActionTime = currentTime;
            player.actionCooldown = 800 + Math.random() * 400;
            return;
        }
    }
    
    // Otherwise dribble
    aiDribble(player);
    player.lastActionTime = currentTime;
    player.actionCooldown = 600 + Math.random() * 300;
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
            
            if (distance > 5 && distance < 35) {
                let score = 0;
                
                // Base score
                score += player.skill / 5;
                
                // Distance preference
                score += 25 - Math.abs(distance - 20);
                
                // Position preference
                if (teammate.position === 'Forward' && teammate.x > 60) score += 25;
                if (teammate.position === 'Midfielder') score += 15;
                
                // Forward pass bonus
                if ((player.team === 'team-b' && teammate.x < player.x) ||
                    (player.team === 'team-a' && teammate.x > player.x)) {
                    score += 20;
                }
                
                if (score > bestScore) {
                    bestScore = score;
                    bestTeammate = teammate;
                }
            }
        });
        
        if (bestTeammate && bestScore > 15) {
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
            lastBallTouchTime = Date.now();
            ball.lastScorer = null;
            
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
        goalY = 50 + (Math.random() - 0.5) * 15;
    } else {
        goalX = 98;
        goalY = 50 + (Math.random() - 0.5) * 15;
    }
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(7, player.attack / 18);
    
    // Store who shot the ball
    ball.lastScorer = player;
    
    // Kick the ball toward goal
    ball.velocityX = (dx / distance) * power;
    ball.velocityY = (dy / distance) * power;
    ball.withPlayer = null;
    ballWithPlayer = null;
    player.hasBall = false;
    player.element.classList.remove('has-ball');
    ball.isMoving = true;
    lastBallTouchTime = Date.now();
    
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
    player.isMoving = true;
    
    // Move ball with player
    moveBallWithPlayer();
    
    // Add running animation
    player.element.classList.add('running');
    setTimeout(() => {
        player.isMoving = false;
        player.element.classList.remove('running');
    }, 300);
    
    return true;
}

// AI movement helper functions
function moveToSupportPosition(player) {
    if (!ballWithPlayer || ballWithPlayer.team !== player.team) return;
    
    const ballHolder = ballWithPlayer;
    const dx = ballHolder.x - player.x;
    const dy = ballHolder.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Support distance with variation to prevent clustering
    const supportDistance = 15 + (player.id % 5);
    
    if (distance > supportDistance + 5 || distance < supportDistance - 5) {
        const moveX = player.x + (dx / distance) * 0.5;
        const moveY = player.y + (dy / distance) * 0.5;
        
        player.x = Math.max(10, Math.min(90, moveX));
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
    if (!ballWithPlayer || ballWithPlayer.team === player.team) return;
    
    const opponent = ballWithPlayer;
    const goalX = player.team === 'team-a' ? 10 : 90;
    
    // Position between opponent and goal with variation
    const variation = (player.id % 3) - 1;
    const targetX = opponent.x + (goalX - opponent.x) * 0.4;
    const targetY = opponent.y + variation * 5;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
        const moveX = player.x + (dx / distance) * 0.6;
        const moveY = player.y + (dy / distance) * 0.6;
        
        player.x = Math.max(10, Math.min(90, moveX));
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
    
    if (distance > 10) {
        const moveX = player.x + (dx / distance) * 0.8;
        const moveY = player.y + (dy / distance) * 0.8;
        
        player.x = Math.max(10, Math.min(90, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
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
        const moveX = player.x + (dx / distance) * 0.4;
        const moveY = player.y + (dy / distance) * 0.4;
        
        player.x = Math.max(10, Math.min(90, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        player.isMoving = true;
        
        setTimeout(() => {
            player.isMoving = false;
        }, 100);
    }
}

// Update stamina
function updateStamina() {
    playersOnField.forEach(player => {
        if (player.isMoving) {
            // Consume stamina while moving
            const consumptionRate = player.hasBall ? 0.5 : 0.3;
            player.stamina = Math.max(0, player.stamina - consumptionRate);
        } else {
            // Regenerate stamina while idle
            const regenRate = 0.2;
            player.stamina = Math.min(100, player.stamina + regenRate);
        }
        
        // Update stamina bar
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

// Helper function to calculate distance
function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Check for goals
function checkForGoal() {
    if (!ball || !ball.isMoving || goalJustScored || celebrationActive) return;
    
    // Check if ball has entered goal area
    const ballSpeed = Math.sqrt(ball.velocityX * ball.velocityX + ball.velocityY * ball.velocityY);
    
    // More lenient goal detection
    const inLeftGoal = ball.x <= 5 && ball.y >= 35 && ball.y <= 65;
    const inRightGoal = ball.x >= 95 && ball.y >= 35 && ball.y <= 65;
    
    // Also check for balls moving into goal area
    const movingIntoLeftGoal = ball.x <= 10 && ball.x > 5 && ball.velocityX < -0.5;
    const movingIntoRightGoal = ball.x >= 90 && ball.x < 95 && ball.velocityX > 0.5;
    
    if ((inLeftGoal || (movingIntoLeftGoal && ball.x <= 8)) && ballSpeed > 0.3) {
        // Team B scores (ball in left goal)
        goalJustScored = true;
        celebrationActive = true;
        teamBScore++;
        updateScoreboard();
        
        // Determine scorer
        const scorerName = ball.lastScorer ? ball.lastScorer.name : "Team B";
        addEvent(`⚽ GOAL! ${scorerName} scores for Team B!`, 'goal');
        
        // Celebrate and reset
        celebrateGoal('team-b');
        setTimeout(() => {
            goalJustScored = false;
            celebrationActive = false;
            resetBall();
        }, 2500);
        return true;
    }
    
    if ((inRightGoal || (movingIntoRightGoal && ball.x >= 92)) && ballSpeed > 0.3) {
        // Team A scores (ball in right goal)
        goalJustScored = true;
        celebrationActive = true;
        teamAScore++;
        updateScoreboard();
        
        // Determine scorer
        const scorerName = ball.lastScorer ? ball.lastScorer.name : "Team A";
        addEvent(`⚽ GOAL! ${scorerName} scores for Team A!`, 'goal');
        
        // Celebrate and reset
        celebrateGoal('team-a');
        setTimeout(() => {
            goalJustScored = false;
            celebrationActive = false;
            resetBall();
        }, 2500);
        return true;
    }
    
    return false;
}

// Celebrate goal with team celebrations
function celebrateGoal(scoringTeam) {
    // Stop all movement
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    // Highlight the goal that was scored
    const goalElement = scoringTeam === 'team-a' ? 
        document.querySelector('.right-goal') : 
        document.querySelector('.left-goal');
    
    if (goalElement) {
        goalElement.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
        goalElement.style.boxShadow = '0 0 50px rgba(16, 185, 129, 1)';
        
        // Pulsing effect
        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
            pulseCount++;
            if (pulseCount > 4) {
                clearInterval(pulseInterval);
                goalElement.style.backgroundColor = '';
                goalElement.style.boxShadow = '';
            }
        }, 400);
    }
    
    // Make scoring team's players celebrate
    playersOnField.forEach(player => {
        if (player.team === scoringTeam) {
            // Add celebration animation
            player.element.classList.add('celebrating');
            
            // Make them jump and move slightly
            player.element.style.transition = 'all 0.5s ease';
            player.element.style.transform = 'translate(-50%, -60%) scale(1.1)';
            
            // Return to normal after celebration
            setTimeout(() => {
                player.element.classList.remove('celebrating');
                player.element.style.transform = 'translate(-50%, -50%) scale(1)';
                player.element.style.transition = 'all 0.3s ease';
            }, 2000);
        } else {
            // Make conceding team's players look dejected
            player.element.classList.add('stunned');
            setTimeout(() => {
                player.element.classList.remove('stunned');
            }, 1500);
        }
    });
    
    // Add confetti effect
    createConfetti();
}

// Create confetti effect for goals
function createConfetti() {
    const field = document.getElementById('football-field');
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    field.appendChild(confetti);
    
    // Remove confetti after animation
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

// Reset ball position after goal
function resetBall() {
    if (ballAnimationFrame) {
        cancelAnimationFrame(ballAnimationFrame);
        ballAnimationFrame = null;
    }
    
    // Remove ball from any player
    if (ballWithPlayer) {
        ballWithPlayer.hasBall = false;
        ballWithPlayer.element.classList.remove('has-ball');
        ballWithPlayer = null;
    }
    
    // Reset all celebration states
    playersOnField.forEach(player => {
        player.hasBall = false;
        player.element.classList.remove('has-ball');
        player.element.classList.remove('celebrating');
        player.element.classList.remove('stunned');
        player.element.classList.remove('running');
        player.isMoving = false;
        player.element.style.transform = 'translate(-50%, -50%)';
        player.element.style.transition = 'all 0.2s ease';
        
        // Return players to their positions
        player.x = player.originalPosition.x;
        player.y = player.originalPosition.y;
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    });
    
    // Reset ball to center
    ball.x = 50;
    ball.y = 50;
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.withPlayer = null;
    ball.isMoving = false;
    ball.lastScorer = null;
    ball.element.style.left = '50%';
    ball.element.style.top = '50%';
    ball.element.classList.remove('moving');
    
    updateBallPossession();
    
    // Reset selected player if needed
    if (selectedPlayer) {
        selectPlayer(selectedPlayer);
    }
    
    // Give ball to team that conceded after delay
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
    if (player.team !== 'team-a' || celebrationActive) return;
    
    // Deselect previous player
    if (selectedPlayer) {
        selectedPlayer.element.classList.remove('selected');
        selectedPlayer.element.classList.remove('running');
        selectedPlayer.isMoving = false;
    }
    
    // Select new player
    selectedPlayer = player;
    player.element.classList.add('selected');
    
    document.getElementById('selected-player').textContent = player.name;
    addEvent(`Selected ${player.name}`, 'selection');
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
    if (!selectedPlayer || celebrationActive) {
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

// Update display functions
function updateScoreboard() {
    document.getElementById('team-a-score').textContent = teamAScore;
    document.getElementById('team-b-score').textContent = teamBScore;
    
    // Animate score update
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
    } else {
        possessionElement.textContent = 'Ball is loose';
        possessionElement.style.color = '#fbbf24';
        possessionElement.style.fontWeight = 'normal';
    }
}

function updatePossessionStats(team) {
    if (team === 'teamA') {
        possession.teamA = Math.min(100, possession.teamA + 0.8);
        possession.teamB = Math.max(0, possession.teamB - 0.8);
    } else {
        possession.teamB = Math.min(100, possession.teamB + 0.8);
        possession.teamA = Math.max(0, possession.teamA - 0.8);
    }
    
    document.getElementById('possession').textContent = 
        `${Math.round(possession.teamA)}% - ${Math.round(possession.teamB)}%`;
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
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    eventElement.innerHTML = `<span class="event-time">[${time}]</span> ${message}`;
    
    eventLog.prepend(eventElement);
    
    // Keep only last 15 events
    const events = eventLog.querySelectorAll('.event');
    if (events.length > 15) {
        events[events.length - 1].remove();
    }
    
    // Scroll to top
    eventLog.scrollTop = 0;
}

// Game control functions
function startGame() {
    if (gameRunning || celebrationActive) {
        addEvent("Game is already running!", 'warning');
        return;
    }
    
    gameRunning = true;
    gameActive = true;
    document.getElementById('game-status').textContent = 'Playing';
    document.getElementById('game-status').style.color = '#00ff88';
    
    matchInterval = setInterval(() => {
        matchTime++;
        updateMatchTime();
        
        // End game after 3 minutes
        if (matchTime >= 180) {
            endGame();
        }
    }, 1000);
    
    addEvent("Game started! Good luck!", 'system');
    startAIUpdates();
    
    if (!selectedPlayer) {
        const teamAPlayers = playersOnField.filter(p => p.team === 'team-a');
        if (teamAPlayers.length > 0) {
            selectPlayer(teamAPlayers[0]);
        }
    }
}

function pauseGame() {
    if (matchTime === 0 && !gameRunning) {
        addEvent("Start the game first!", 'warning');
        return;
    }
    
    if (celebrationActive) {
        addEvent("Cannot pause during celebration!", 'warning');
        return;
    }
    
    gameRunning = !gameRunning;
    gameActive = gameRunning;
    
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
    }
}

function resetGame() {
    if (celebrationActive) {
        addEvent("Please wait for celebration to end!", 'warning');
        return;
    }
    
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
    tackleCooldown = false;
    playerCollisionCooldown = {};
    lastAIPositionUpdate = {};
    aiMoveCounter = 0;
    goalJustScored = false;
    celebrationActive = false;
    
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
    
    // Clear event log except instructions
    const eventLog = document.getElementById('event-log');
    eventLog.innerHTML = `
        <div class="event">Welcome to Football Game!</div>
        <div class="event">Click on a blue player to select them</div>
        <div class="event">Use arrow buttons or WASD keys to move</div>
        <div class="event">Press T or click Tackle button to take the ball</div>
    `;
    
    addEvent("Game reset. Ready to play!", 'system');
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

// Setup event listeners
function setupEventListeners() {
    // Movement buttons
    document.getElementById('move-up').addEventListener('click', () => {
        if (selectedPlayer && gameRunning && !celebrationActive) moveSelectedPlayer(0, -2);
    });
    document.getElementById('move-down').addEventListener('click', () => {
        if (selectedPlayer && gameRunning && !celebrationActive) moveSelectedPlayer(0, 2);
    });
    document.getElementById('move-left').addEventListener('click', () => {
        if (selectedPlayer && gameRunning && !celebrationActive) moveSelectedPlayer(-2, 0);
    });
    document.getElementById('move-right').addEventListener('click', () => {
        if (selectedPlayer && gameRunning && !celebrationActive) moveSelectedPlayer(2, 0);
    });

    // Action buttons
    document.getElementById('pass-btn').addEventListener('click', passBall);
    document.getElementById('shoot-btn').addEventListener('click', shootBall);
    document.getElementById('tackle-btn').addEventListener('click', tackle);
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
        if (celebrationActive && ![' '].includes(e.key)) {
            return;
        }
        
        if (!gameRunning && ![' ', 'c', 'C'].includes(e.key)) {
            return;
        }
        
        // Store key state
        keysPressed[e.key] = true;
        
        // Check for Shift key
        if (e.key === 'Shift') {
            shiftPressed = true;
            if (!isSprinting && selectedPlayer && gameRunning && !celebrationActive) {
                toggleSprint();
            }
        }
        
        switch(e.key.toLowerCase()) {
            case ' ':
                if (!gameRunning) {
                    startGame();
                } else if (!celebrationActive) {
                    pauseGame();
                }
                e.preventDefault();
                break;
            case 'p':
                if (gameRunning && !celebrationActive) {
                    passBall();
                    e.preventDefault();
                }
                break;
            case 's':
                if (gameRunning && !celebrationActive) {
                    shootBall();
                    e.preventDefault();
                }
                break;
            case 't':
                if (gameRunning && !celebrationActive) {
                    tackle();
                    e.preventDefault();
                }
                break;
            case 'c':
                if (!celebrationActive) {
                    selectNextPlayer();
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
            if (isSprinting && selectedPlayer && !celebrationActive) {
                toggleSprint();
            }
        }
        
        // Remove running animation when movement keys are released
        const movementKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
        if (movementKeys.includes(e.key.toLowerCase())) {
            if (selectedPlayer) {
                selectedPlayer.isMoving = false;
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

// Initialize the game when page loads
window.addEventListener('load', initGame);

// Field click for player movement
document.getElementById('football-field').addEventListener('click', function(e) {
    if (!selectedPlayer || !gameRunning || celebrationActive) return;
    
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
    tackle,
    selectNextPlayer,
    getState: () => ({
        gameRunning,
        teamAScore,
        teamBScore,
        matchTime,
        selectedPlayer: selectedPlayer?.name,
        ballWithPlayer: ballWithPlayer?.name,
        possession,
        ballPosition: { x: ball?.x, y: ball?.y },
        celebrationActive,
        goalJustScored
    })
};
