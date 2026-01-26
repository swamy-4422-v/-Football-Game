// Football Game JavaScript - Complete Working Version
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
    addEvent("Game initialized. Click Start to begin!");
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

// Start AI updates
function startAIUpdates() {
    if (aiUpdateInterval) clearInterval(aiUpdateInterval);
    aiUpdateInterval = setInterval(updateAITeam, 200); // Update AI every 200ms
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
    if (!gameRunning) return;
    
    // Update each AI player
    playersOnField.forEach(player => {
        if (player.team === 'team-b') {
            updateAIPlayer(player);
        }
    });
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
        targetY: position.y
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

    updateBall();
}

// Update ball position
function updateBall() {
    if (!ball) return;
    
    // Apply velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    
    // Bounce off walls
    if (ball.x <= 2) {
        ball.velocityX *= -0.8;
        ball.x = 2.1;
        addEvent("Ball hits the wall!");
    }
    if (ball.x >= 98) {
        ball.velocityX *= -0.8;
        ball.x = 97.9;
        addEvent("Ball hits the wall!");
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
    
    // Check for goals
    checkForGoal();
    
    // Continue animation if still moving
    if (ball.isMoving) {
        ballAnimationFrame = requestAnimationFrame(updateBall);
    }
}

// Check if ball contacts a player
function checkBallContact() {
    if (!ball || ball.withPlayer || !ball.isMoving) return;
    
    playersOnField.forEach(player => {
        if (player.hasBall) return;
        
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 8) {
            giveBallToPlayer(player);
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
    
    addEvent(`${player.name} gets the ball!`, 'pass');
}

// Move ball with player
function moveBallWithPlayer() {
    if (!ball.withPlayer) return;
    
    ball.x = ball.withPlayer.x;
    ball.y = ball.withPlayer.y - 3;
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
}

// Pass the ball
function passBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }
    
    // Find teammates
    const teammates = playersOnField.filter(p => 
        p.team === selectedPlayer.team && 
        p !== selectedPlayer
    );
    
    if (teammates.length > 0) {
        // Find best teammate to pass to
        let bestTeammate = null;
        let bestScore = -Infinity;
        
        teammates.forEach(teammate => {
            const dx = teammate.x - ball.x;
            const dy = teammate.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50) {
                // Calculate score based on position and skill
                const positionScore = (100 - distance) / 10;
                const skillScore = teammate.skill / 10;
                const totalScore = positionScore + skillScore + Math.random() * 5;
                
                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestTeammate = teammate;
                }
            }
        });
        
        if (bestTeammate) {
            const dx = bestTeammate.x - ball.x;
            const dy = bestTeammate.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = Math.min(5, selectedPlayer.skill / 20);
            
            // Kick the ball
            ball.velocityX = (dx / distance) * speed;
            ball.velocityY = (dy / distance) * speed;
            ball.withPlayer = null;
            ballWithPlayer = null;
            selectedPlayer.hasBall = false;
            selectedPlayer.element.classList.remove('has-ball');
            ball.isMoving = true;
            
            addEvent(`${selectedPlayer.name} passes to ${bestTeammate.name}`, 'pass');
            updateBall();
        } else {
            addEvent("No open teammates to pass to!");
        }
    } else {
        addEvent("No teammates found!");
    }
}

// Shoot the ball
function shootBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }
    
    // Determine goal to shoot at
    let goalX, goalY;
    if (selectedPlayer.team === 'team-a') {
        goalX = 98; // Right goal
        goalY = 50 + (Math.random() - 0.5) * 10;
    } else {
        goalX = 2; // Left goal
        goalY = 50 + (Math.random() - 0.5) * 10;
    }
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(8, selectedPlayer.skill / 15 + Math.random() * 2);
    
    // Kick the ball
    ball.velocityX = (dx / distance) * power;
    ball.velocityY = (dy / distance) * power;
    ball.withPlayer = null;
    ballWithPlayer = null;
    selectedPlayer.hasBall = false;
    selectedPlayer.element.classList.remove('has-ball');
    ball.isMoving = true;
    
    addEvent(`${selectedPlayer.name} shoots!`, 'pass');
    updateBall();
}

// Update AI player
function updateAIPlayer(player) {
    if (!player) return;
    
    if (player.hasBall) {
        handleAIWithBall(player);
    } else {
        handleAIWithoutBall(player);
    }
}

// Handle AI player with ball
function handleAIWithBall(player) {
    if (!ballWithPlayer || ballWithPlayer !== player) return;
    
    const decision = Math.random();
    
    if (decision < 0.4) {
        // Pass
        aiPassBall(player);
    } else if (decision < 0.8) {
        // Shoot if close to goal
        const distanceToGoal = player.team === 'team-b' ? 100 - player.x : player.x;
        if (distanceToGoal < 40) {
            aiShootBall(player);
        } else {
            aiDribble(player);
        }
    } else {
        // Dribble
        aiDribble(player);
    }
}

// Handle AI player without ball
function handleAIWithoutBall(player) {
    if (ballWithPlayer) {
        if (ballWithPlayer.team === player.team) {
            // Support teammate with ball
            moveToSupportPosition(player);
        } else {
            // Defend against opponent with ball
            moveToDefensivePosition(player);
        }
    } else if (ball.isMoving) {
        // Chase loose ball
        moveTowardBall(player);
    } else {
        // Return to position
        returnToPosition(player);
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
        const target = teammates[Math.floor(Math.random() * teammates.length)];
        
        const dx = target.x - ball.x;
        const dy = target.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.min(4, player.skill / 25);
        
        ball.velocityX = (dx / distance) * speed;
        ball.velocityY = (dy / distance) * speed;
        ball.withPlayer = null;
        ballWithPlayer = null;
        player.hasBall = false;
        player.element.classList.remove('has-ball');
        ball.isMoving = true;
        
        addEvent(`${player.name} passes`, 'pass');
        updateBall();
    }
}

// AI Shoot
function aiShootBall(player) {
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
    const power = Math.min(6, player.skill / 20);
    
    ball.velocityX = (dx / distance) * power;
    ball.velocityY = (dy / distance) * power;
    ball.withPlayer = null;
    ballWithPlayer = null;
    player.hasBall = false;
    player.element.classList.remove('has-ball');
    ball.isMoving = true;
    
    addEvent(`${player.name} shoots!`, 'pass');
    updateBall();
}

// AI Dribble
function aiDribble(player) {
    // Move toward opponent's goal
    let moveX, moveY;
    if (player.team === 'team-b') {
        moveX = player.x - 1.5;
        moveY = player.y + (Math.random() - 0.5) * 3;
    } else {
        moveX = player.x + 1.5;
        moveY = player.y + (Math.random() - 0.5) * 3;
    }
    
    // Keep in bounds
    moveX = Math.max(5, Math.min(95, moveX));
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
    }, 200);
}

// Move to support position
function moveToSupportPosition(player) {
    if (!ballWithPlayer) return;
    
    const ballHolder = ballWithPlayer;
    const dx = ballHolder.x - player.x;
    const dy = ballHolder.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 15) {
        // Move toward ball holder
        const moveX = player.x + (dx / distance) * 0.8;
        const moveY = player.y + (dy / distance) * 0.8;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

// Move to defensive position
function moveToDefensivePosition(player) {
    if (!ballWithPlayer) return;
    
    const opponent = ballWithPlayer;
    const goalX = player.team === 'team-a' ? 10 : 90;
    
    // Position between opponent and goal
    const targetX = opponent.x + (goalX - opponent.x) * 0.3;
    const targetY = opponent.y;
    
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
        const moveX = player.x + (dx / distance) * 0.6;
        const moveY = player.y + (dy / distance) * 0.6;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

// Move toward ball
function moveTowardBall(player) {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 8) {
        const moveX = player.x + (dx / distance) * 1.0;
        const moveY = player.y + (dy / distance) * 1.0;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

// Return to position
function returnToPosition(player) {
    const dx = player.originalPosition.x - player.x;
    const dy = player.originalPosition.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 2) {
        const moveX = player.x + (dx / distance) * 0.4;
        const moveY = player.y + (dy / distance) * 0.4;
        
        player.x = Math.max(5, Math.min(95, moveX));
        player.y = Math.max(10, Math.min(90, moveY));
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
    }
}

// Check for goals
function checkForGoal() {
    if (!ball || !ball.isMoving) return;
    
    // Left goal (Team B scores)
    if (ball.x <= 5 && ball.y >= 40 && ball.y <= 60 && Math.abs(ball.velocityX) > 0.5) {
        teamBScore++;
        updateScoreboard();
        addEvent("GOAL! Team B scores!", 'goal');
        resetBall();
    }
    
    // Right goal (Team A scores)
    if (ball.x >= 95 && ball.y >= 40 && ball.y <= 60 && Math.abs(ball.velocityX) > 0.5) {
        teamAScore++;
        updateScoreboard();
        addEvent("GOAL! Team A scores!", 'goal');
        resetBall();
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
    
    // Give ball to random player after delay
    setTimeout(() => {
        const playersNearCenter = playersOnField.filter(p => 
            Math.abs(p.x - 50) < 20 && Math.abs(p.y - 50) < 20
        );
        
        if (playersNearCenter.length > 0) {
            const randomPlayer = playersNearCenter[Math.floor(Math.random() * playersNearCenter.length)];
            giveBallToPlayer(randomPlayer);
        }
    }, 1000);
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
        addEvent("Sprinting ON!");
    } else {
        sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        sprintBtn.style.transform = 'scale(1)';
        addEvent("Sprinting OFF!");
    }
}

// Update display functions
function updateScoreboard() {
    document.getElementById('team-a-score').textContent = teamAScore;
    document.getElementById('team-b-score').textContent = teamBScore;
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
    
    createPlayers();
    createBall();
    updateDisplay();
    
    document.getElementById('game-status').textContent = 'Ready';
    document.getElementById('game-status').style.color = '#fff';
    document.getElementById('selected-player').textContent = 'None';
    const sprintBtn = document.getElementById('sprint-btn');
    sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    sprintBtn.style.transform = 'scale(1)';
    
    addEvent("Game reset");
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
        if (selectedPlayer) moveSelectedPlayer(0, -2);
    });
    document.getElementById('move-down').addEventListener('click', () => {
        if (selectedPlayer) moveSelectedPlayer(0, 2);
    });
    document.getElementById('move-left').addEventListener('click', () => {
        if (selectedPlayer) moveSelectedPlayer(-2, 0);
    });
    document.getElementById('move-right').addEventListener('click', () => {
        if (selectedPlayer) moveSelectedPlayer(2, 0);
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
