// Football Game JavaScript - Complete AI Version
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
let lastUpdateTime = 0;
let aiUpdateInterval = null;

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
}

// Start AI updates
function startAIUpdates() {
    if (aiUpdateInterval) clearInterval(aiUpdateInterval);
    aiUpdateInterval = setInterval(updateAllAIPlayers, 100); // Update AI every 100ms
}

// Stop AI updates
function stopAIUpdates() {
    if (aiUpdateInterval) {
        clearInterval(aiUpdateInterval);
        aiUpdateInterval = null;
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
        targetX: position.x,
        targetY: position.y,
        isMoving: false,
        hasBall: false,
        aiState: 'idle',
        originalPosition: { x: position.x, y: position.y }
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

    updateBallPosition();
}

// Update ball position
function updateBallPosition() {
    if (!ball) return;
    
    // Only animate if ball is moving
    if (Math.abs(ball.velocityX) < 0.01 && Math.abs(ball.velocityY) < 0.01 && !ball.withPlayer) {
        ball.velocityX = 0;
        ball.velocityY = 0;
        ball.isMoving = false;
        ball.element.classList.remove('moving');
        return;
    }

    // Apply velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Bounce off walls
    if (ball.x <= 2) {
        ball.velocityX *= -0.7;
        ball.x = 2.1;
    }
    if (ball.x >= 98) {
        ball.velocityX *= -0.7;
        ball.x = 97.9;
    }
    if (ball.y <= 2) {
        ball.velocityY *= -0.7;
        ball.y = 2.1;
    }
    if (ball.y >= 98) {
        ball.velocityY *= -0.7;
        ball.y = 97.9;
    }

    // Apply friction
    ball.velocityX *= 0.97;
    ball.velocityY *= 0.97;

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
    }

    // Check for player contact
    checkBallContact();

    // Check for goals
    checkForGoal();

    // Continue animation
    if (ball.isMoving) {
        ballAnimationFrame = requestAnimationFrame(updateBallPosition);
    }
}

// Check if ball contacts a player
function checkBallContact() {
    if (!ball || ball.withPlayer || !ball.isMoving) return;

    let closestPlayer = null;
    let closestDistance = Infinity;

    playersOnField.forEach(player => {
        if (player.hasBall) return;
        
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if ball is close enough to intercept
        const interceptDistance = 6 + (player.skill / 100) * 2;
        if (distance < interceptDistance && distance < closestDistance) {
            closestDistance = distance;
            closestPlayer = player;
        }
    });

    if (closestPlayer) {
        giveBallToPlayer(closestPlayer);
    }
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
    ballWithPlayer = player;
    player.hasBall = true;
    player.element.classList.add('has-ball');

    // Stop ball movement
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.x = player.x;
    ball.y = player.y - 3;
    ball.withPlayer = player;
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

    // Update AI state for all players
    updatePlayerAIStates();
}

// Move ball with player
function moveBallWithPlayer() {
    if (!ball.withPlayer) return;

    ball.x = ball.withPlayer.x;
    ball.y = ball.withPlayer.y - 3;
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
}

// Update all AI players - Main AI function
function updateAllAIPlayers() {
    if (!gameRunning) return;
    
    // Update each AI player
    playersOnField.forEach(player => {
        if (player.team === 'team-b') { // AI team
            updateAIPlayer(player);
        } else if (player.team === 'team-a' && !player.hasBall && ballWithPlayer && ballWithPlayer.team === 'team-b') {
            // User team players without ball should defend
            updateDefensivePosition(player);
        }
    });
}

// Update individual AI player
function updateAIPlayer(player) {
    if (!player) return;
    
    const currentTime = Date.now();
    if (lastUpdateTime && currentTime - lastUpdateTime < 100) return; // Limit updates
    
    lastUpdateTime = currentTime;
    
    // Determine AI behavior based on situation
    if (player.hasBall) {
        // Player has ball - decide what to do
        handleAIWithBall(player);
    } else {
        // Player doesn't have ball
        handleAIWithoutBall(player);
    }
}

// Handle AI player who has the ball
function handleAIWithBall(player) {
    if (!ballWithPlayer || ballWithPlayer !== player) return;
    
    // Calculate distances
    const distanceToGoal = player.team === 'team-b' ? 
        100 - player.x : // AI shooting at left goal
        player.x;        // AI shooting at right goal
    
    const nearestOpponent = findNearestOpponent(player);
    const pressureDistance = nearestOpponent ? 
        Math.sqrt(Math.pow(nearestOpponent.x - player.x, 2) + Math.pow(nearestOpponent.y - player.y, 2)) : 
        Infinity;
    
    // Decision making
    if (distanceToGoal < 30 && pressureDistance > 8 && Math.random() < 0.7) {
        // Good position to shoot
        aiShootBall(player);
    } else if (pressureDistance < 10 && Math.random() < 0.8) {
        // Under pressure - pass or dribble
        if (Math.random() < 0.6) {
            aiPassBall(player);
        } else {
            aiDribble(player);
        }
    } else if (Math.random() < 0.4) {
        // Regular play - pass or dribble
        if (Math.random() < 0.7) {
            aiPassBall(player);
        } else {
            aiDribble(player);
        }
    } else {
        // Move toward goal
        aiMoveTowardGoal(player);
    }
}

// Handle AI player without the ball
function handleAIWithoutBall(player) {
    if (ballWithPlayer) {
        if (ballWithPlayer.team === player.team) {
            // Teammate has ball - support or get open
            aiSupportTeammate(player);
        } else {
            // Opponent has ball - defend
            aiDefend(player);
        }
    } else if (ball.isMoving) {
        // Ball is loose - go toward it
        aiGoToBall(player);
    } else {
        // Return to position
        aiReturnToPosition(player);
    }
}

// AI Shoot
function aiShootBall(player) {
    if (!player.hasBall) return;
    
    let goalX, goalY;
    if (player.team === 'team-b') {
        goalX = 2; // Left goal
        goalY = 50 + (Math.random() - 0.5) * 15;
    } else {
        goalX = 98; // Right goal
        goalY = 50 + (Math.random() - 0.5) * 15;
    }
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const power = Math.min(10, Math.max(4, player.skill / 12 + Math.random() * 2));
    const accuracy = player.skill / 100;
    const randomX = (Math.random() - 0.5) * 4 * (1 - accuracy);
    const randomY = (Math.random() - 0.5) * 4 * (1 - accuracy);

    ball.velocityX = (dx / distance) * power + randomX;
    ball.velocityY = (dy / distance) * power + randomY;
    ball.withPlayer = null;
    ballWithPlayer = null;
    player.hasBall = false;
    player.element.classList.remove('has-ball');
    ball.isMoving = true;

    addEvent(`${player.name} shoots!`, 'pass');
    updateBallPosition();
}

// AI Pass
function aiPassBall(player) {
    if (!player.hasBall) return;
    
    const teammates = playersOnField.filter(p => 
        p.team === player.team && 
        p !== player &&
        !p.hasBall
    );
    
    if (teammates.length > 0) {
        // Find best teammate to pass to
        let bestTeammate = null;
        let bestScore = -Infinity;
        
        teammates.forEach(teammate => {
            const distanceToTeammate = Math.sqrt(
                Math.pow(teammate.x - player.x, 2) + 
                Math.pow(teammate.y - player.y, 2)
            );
            
            // Check if teammate is open
            const nearestOpponent = findNearestOpponent(teammate);
            const opponentDistance = nearestOpponent ? 
                Math.sqrt(Math.pow(neammate.x - nearestOpponent.x, 2) + Math.pow(teammate.y - nearestOpponent.y, 2)) : 
                100;
            
            // Calculate score based on position, openness, and skill
            const positionScore = (teammate.attack / 100) * (teammate.x / 100);
            const openScore = opponentDistance / 20;
            const distanceScore = 30 / (distanceToTeammate + 1);
            
            const totalScore = positionScore + openScore + distanceScore;
            
            if (totalScore > bestScore && distanceToTeammate < 50) {
                bestScore = totalScore;
                bestTeammate = teammate;
            }
        });
        
        if (bestTeammate) {
            const dx = bestTeammate.x - ball.x;
            const dy = bestTeammate.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const speed = Math.min(6, Math.max(2, player.skill / 20));
            const accuracy = player.skill / 100;
            const randomX = (Math.random() - 0.5) * 3 * (1 - accuracy);
            const randomY = (Math.random() - 0.5) * 3 * (1 - accuracy);

            ball.velocityX = (dx / distance) * speed + randomX;
            ball.velocityY = (dy / distance) * speed + randomY;
            ball.withPlayer = null;
            ballWithPlayer = null;
            player.hasBall = false;
            player.element.classList.remove('has-ball');
            ball.isMoving = true;

            addEvent(`${player.name} passes to ${bestTeammate.name}`, 'pass');
            updateBallPosition();
            return;
        }
    }
    
    // If no good pass, dribble instead
    aiDribble(player);
}

// AI Dribble
function aiDribble(player) {
    if (!player.hasBall) return;
    
    // Move toward goal with some randomness
    let moveX, moveY;
    
    if (player.team === 'team-b') {
        moveX = player.x - 1.5 - Math.random() * 0.5; // Move left toward goal
        moveY = player.y + (Math.random() - 0.5) * 3;
    } else {
        moveX = player.x + 1.5 + Math.random() * 0.5; // Move right toward goal
        moveY = player.y + (Math.random() - 0.5) * 3;
    }
    
    // Avoid opponents
    const nearestOpponent = findNearestOpponent(player);
    if (nearestOpponent) {
        const opponentDistance = Math.sqrt(
            Math.pow(nearestOpponent.x - player.x, 2) + 
            Math.pow(nearestOpponent.y - player.y, 2)
        );
        
        if (opponentDistance < 15) {
            // Evade opponent
            const evadeX = (player.x - nearestOpponent.x) / opponentDistance;
            const evadeY = (player.y - nearestOpponent.y) / opponentDistance;
            
            moveX += evadeX * 2;
            moveY += evadeY * 2;
        }
    }
    
    // Keep in bounds
    moveX = Math.max(5, Math.min(95, moveX));
    moveY = Math.max(10, Math.min(90, moveY));
    
    // Update position
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
    
    player.aiState = 'dribbling';
}

// AI Move toward goal
function aiMoveTowardGoal(player) {
    if (!player.hasBall) return;
    
    let targetX, targetY;
    if (player.team === 'team-b') {
        targetX = Math.max(10, player.x - 1.2); // Move left
        targetY = 50 + (Math.random() - 0.5) * 10;
    } else {
        targetX = Math.min(90, player.x + 1.2); // Move right
        targetY = 50 + (Math.random() - 0.5) * 10;
    }
    
    // Smooth movement
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0.5) {
        player.x += (dx / distance) * 1.0;
        player.y += (dy / distance) * 1.0;
        
        // Keep in bounds
        player.x = Math.max(5, Math.min(95, player.x));
        player.y = Math.max(10, Math.min(90, player.y));
        
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        
        // Move ball with player
        moveBallWithPlayer();
        
        // Add running animation
        player.element.classList.add('running');
        setTimeout(() => {
            player.element.classList.remove('running');
        }, 200);
    }
    
    player.aiState = 'attacking';
}

// AI Support teammate
function aiSupportTeammate(player) {
    if (ballWithPlayer && ballWithPlayer.team === player.team) {
        // Move to support position
        let targetX, targetY;
        
        // Find good support position
        if (player.position === "Goalkeeper") {
            targetX = player.originalPosition.x;
            targetY = player.originalPosition.y;
        } else if (player.position === "Defender") {
            targetX = ballWithPlayer.x - 15;
            targetY = ballWithPlayer.y + (Math.random() - 0.5) * 20;
        } else if (player.position === "Midfielder") {
            targetX = ballWithPlayer.x - 5;
            targetY = ballWithPlayer.y + (Math.random() - 0.5) * 15;
        } else { // Forward
            targetX = ballWithPlayer.x + 10;
            targetY = ballWithPlayer.y + (Math.random() - 0.5) * 10;
        }
        
        // Adjust for team side
        if (player.team === 'team-a') {
            targetX = Math.min(targetX, 70);
        } else {
            targetX = Math.max(targetX, 30);
        }
        
        // Move toward target
        movePlayerToPosition(player, targetX, targetY, 0.8);
        player.aiState = 'supporting';
    }
}

// AI Defend
function aiDefend(player) {
    if (!ballWithPlayer || ballWithPlayer.team === player.team) return;
    
    const opponent = ballWithPlayer;
    
    // Calculate defensive position
    let targetX, targetY;
    const goalX = player.team === 'team-a' ? 10 : 90;
    const goalY = 50;
    
    // Position between opponent and goal
    targetX = opponent.x + (goalX - opponent.x) * 0.3;
    targetY = opponent.y + (goalY - opponent.y) * 0.3;
    
    // Adjust based on position
    if (player.position === "Goalkeeper") {
        targetX = player.originalPosition.x;
        targetY = player.originalPosition.y;
    } else if (player.position === "Defender") {
        // Stay closer to goal
        targetX = opponent.x + (goalX - opponent.x) * 0.5;
    }
    
    // Move toward defensive position
    movePlayerToPosition(player, targetX, targetY, 0.9);
    player.aiState = 'defending';
}

// AI Go to ball
function aiGoToBall(player) {
    if (ballWithPlayer || !ball.isMoving) return;
    
    // Move toward ball
    movePlayerToPosition(player, ball.x, ball.y, 1.0);
    player.aiState = 'chasing';
}

// AI Return to position
function aiReturnToPosition(player) {
    const originalX = player.originalPosition.x;
    const originalY = player.originalPosition.y;
    const distance = Math.sqrt(
        Math.pow(player.x - originalX, 2) + 
        Math.pow(player.y - originalY, 2)
    );
    
    if (distance > 2) {
        movePlayerToPosition(player, originalX, originalY, 0.5);
    }
    player.aiState = 'positioning';
}

// Helper: Move player to position
function movePlayerToPosition(player, targetX, targetY, speed = 0.8) {
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0.5) {
        player.x += (dx / distance) * speed;
        player.y += (dy / distance) * speed;
        
        // Keep in bounds
        player.x = Math.max(5, Math.min(95, player.x));
        player.y = Math.max(10, Math.min(90, player.y));
        
        player.element.style.left = `${player.x}%`;
        player.element.style.top = `${player.y}%`;
        
        // Add running animation if moving fast enough
        if (speed > 0.6) {
            player.element.classList.add('running');
            setTimeout(() => {
                player.element.classList.remove('running');
            }, 200);
        }
    }
}

// Helper: Find nearest opponent
function findNearestOpponent(player) {
    let nearest = null;
    let minDistance = Infinity;
    
    playersOnField.forEach(opponent => {
        if (opponent.team !== player.team) {
            const distance = Math.sqrt(
                Math.pow(opponent.x - player.x, 2) + 
                Math.pow(opponent.y - player.y, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                nearest = opponent;
            }
        }
    });
    
    return nearest;
}

// Update user team defensive positions
function updateDefensivePosition(player) {
    if (player.hasBall || player === selectedPlayer) return;
    
    if (ballWithPlayer && ballWithPlayer.team === 'team-b') {
        // Opponent has ball - defend
        const opponent = ballWithPlayer;
        const goalX = player.team === 'team-a' ? 10 : 90;
        
        // Calculate defensive position
        let targetX = opponent.x + (goalX - opponent.x) * 0.4;
        let targetY = opponent.y + (50 - opponent.y) * 0.4;
        
        // Adjust based on original position
        const originalX = player.originalPosition.x;
        const dxToOriginal = Math.abs(originalX - targetX);
        
        if (dxToOriginal > 20) {
            // Too far from original position, move back
            targetX = originalX + (targetX - originalX) * 0.7;
        }
        
        // Move toward defensive position
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
            player.x += (dx / distance) * 0.5;
            player.y += (dy / distance) * 0.5;
            
            // Keep in bounds
            player.x = Math.max(5, Math.min(95, player.x));
            player.y = Math.max(10, Math.min(90, player.y));
            
            player.element.style.left = `${player.x}%`;
            player.element.style.top = `${player.y}%`;
        }
    } else if (!ball.isMoving) {
        // Return to original position
        const originalX = player.originalPosition.x;
        const originalY = player.originalPosition.y;
        const dx = originalX - player.x;
        const dy = originalY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            player.x += (dx / distance) * 0.3;
            player.y += (dy / distance) * 0.3;
            
            player.element.style.left = `${player.x}%`;
            player.element.style.top = `${player.y}%`;
        }
    }
}

// Update player AI states
function updatePlayerAIStates() {
    // This function sets the AI state for all players
    playersOnField.forEach(player => {
        if (player.team === 'team-b') {
            // AI team
            if (player.hasBall) {
                player.aiState = 'attacking';
            } else if (ballWithPlayer) {
                if (ballWithPlayer.team === 'team-b') {
                    player.aiState = 'supporting';
                } else {
                    player.aiState = 'defending';
                }
            } else {
                player.aiState = ball.isMoving ? 'chasing' : 'positioning';
            }
        }
    });
}

// Pass the ball (User)
function passBall() {
    if (!selectedPlayer || selectedPlayer !== ballWithPlayer) {
        addEvent("You don't have the ball!");
        return;
    }

    const teammates = playersOnField.filter(p => 
        p.team === selectedPlayer.team && 
        p !== selectedPlayer
    );

    if (teammates.length > 0) {
        const possibleTargets = teammates.filter(teammate => {
            const dx = teammate.x - selectedPlayer.x;
            const dy = teammate.y - selectedPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance < 40 && 
                   Math.random() > 0.2 &&
                   !teammate.hasBall;
        });

        if (possibleTargets.length > 0) {
            const target = possibleTargets.reduce((best, current) => {
                const bestDistance = Math.sqrt(
                    Math.pow(best.x - selectedPlayer.x, 2) + 
                    Math.pow(best.y - selectedPlayer.y, 2)
                );
                const currentDistance = Math.sqrt(
                    Math.pow(current.x - selectedPlayer.x, 2) + 
                    Math.pow(current.y - selectedPlayer.y, 2)
                );
                
                const bestScore = (best.skill / 100) * (40 / (bestDistance + 1));
                const currentScore = (current.skill / 100) * (40 / (currentDistance + 1));
                
                return currentScore > bestScore ? current : best;
            });

            const dx = target.x - ball.x;
            const dy = target.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const baseSpeed = selectedPlayer.skill / 25;
            const speed = Math.min(6, Math.max(2, baseSpeed * (distance / 20)));
            
            const accuracy = selectedPlayer.skill / 100;
            const randomX = (Math.random() - 0.5) * 3 * (1 - accuracy);
            const randomY = (Math.random() - 0.5) * 3 * (1 - accuracy);

            ball.velocityX = (dx / distance) * speed + randomX;
            ball.velocityY = (dy / distance) * speed + randomY;
            ball.withPlayer = null;
            ballWithPlayer = null;
            selectedPlayer.hasBall = false;
            selectedPlayer.element.classList.remove('has-ball');
            ball.isMoving = true;

            addEvent(`${selectedPlayer.name} passes to ${target.name}`, 'pass');
            updateBallPosition();
            updatePlayerAIStates();
        } else {
            addEvent("No open teammates to pass to!");
        }
    } else {
        addEvent("No teammates found!");
    }
}

// Shoot the ball (User)
function shootBall() {
    if (!selectedPlayer || selectedPlayer !== ballWithPlayer) {
        addEvent("You don't have the ball!");
        return;
    }

    let goalX, goalY;
    if (selectedPlayer.team === 'team-a') {
        goalX = 98;
        goalY = 50 + (Math.random() - 0.5) * 10;
    } else {
        goalX = 2;
        goalY = 50 + (Math.random() - 0.5) * 10;
    }
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const basePower = selectedPlayer.skill / 15;
    const power = Math.min(10, Math.max(3, basePower + Math.random() * 3));
    
    const accuracy = selectedPlayer.skill / 100;
    const randomX = (Math.random() - 0.5) * 5 * (1 - accuracy);
    const randomY = (Math.random() - 0.5) * 5 * (1 - accuracy);

    ball.velocityX = (dx / distance) * power + randomX;
    ball.velocityY = (dy / distance) * power + randomY;
    ball.withPlayer = null;
    ballWithPlayer = null;
    selectedPlayer.hasBall = false;
    selectedPlayer.element.classList.remove('has-ball');
    ball.isMoving = true;

    addEvent(`${selectedPlayer.name} shoots!`, 'pass');
    updateBallPosition();
    updatePlayerAIStates();
}

// Check for goals
function checkForGoal() {
    if (!ball || !ball.isMoving) return;

    const inLeftGoal = ball.x <= 5 && ball.y >= 40 && ball.y <= 60;
    const inRightGoal = ball.x >= 95 && ball.y >= 40 && ball.y <= 60;

    if (inLeftGoal && Math.abs(ball.velocityX) > 0.5) {
        teamBScore++;
        updateScoreboard();
        addEvent("GOAL! Team B scores!", 'goal');
        highlightGoal('left');
        resetBall();
        return;
    }
    
    if (inRightGoal && Math.abs(ball.velocityX) > 0.5) {
        teamAScore++;
        updateScoreboard();
        addEvent("GOAL! Team A scores!", 'goal');
        highlightGoal('right');
        resetBall();
        return;
    }
}

// Highlight goal animation
function highlightGoal(side) {
    const goalElement = side === 'left' ? 
        document.querySelector('.left-goal') : 
        document.querySelector('.right-goal');
    
    if (goalElement) {
        goalElement.style.backgroundColor = 'rgba(16, 185, 129, 0.7)';
        goalElement.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.8)';
        
        setTimeout(() => {
            goalElement.style.backgroundColor = '';
            goalElement.style.boxShadow = '';
        }, 1000);
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
        // Determine which team gets the ball based on who scored
        const scoringTeam = teamAScore > teamBScore ? 'team-b' : 'team-a';
        const playersToChoose = playersOnField.filter(p => p.team === scoringTeam);
        
        if (playersToChoose.length > 0) {
            const randomPlayer = playersToChoose[Math.floor(Math.random() * playersToChoose.length)];
            giveBallToPlayer(randomPlayer);
        }
    }, 1500);
}

// Select a player
function selectPlayer(player) {
    if (player.team !== 'team-a') return;

    // Deselect previous player
    if (selectedPlayer) {
        selectedPlayer.element.classList.remove('selected');
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

// Move selected player
function movePlayer(direction) {
    if (!selectedPlayer || !gameRunning) return;

    const speed = isSprinting ? 2.0 : 1.2;
    let newX = selectedPlayer.x;
    let newY = selectedPlayer.y;

    switch(direction) {
        case 'up': newY -= speed; break;
        case 'down': newY += speed; break;
        case 'left': newX -= speed; break;
        case 'right': newX += speed; break;
    }

    // Keep within bounds
    if (selectedPlayer.team === 'team-a') {
        // Blue team - avoid left goal area
        newX = Math.max(10, Math.min(95, newX));
    } else {
        // Red team - avoid right goal area
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
    setTimeout(() => {
        if (selectedPlayer) selectedPlayer.element.classList.remove('running');
    }, 200);

    // If player has ball, move ball with player
    if (selectedPlayer.hasBall) {
        moveBallWithPlayer();
    }

    // Check ball proximity if player doesn't have ball
    if (!selectedPlayer.hasBall && !ballWithPlayer) {
        checkBallContact();
    }
}

// Toggle sprint mode
function toggleSprint() {
    isSprinting = !isSprinting;
    const sprintBtn = document.getElementById('sprint-btn');
    
    if (isSprinting) {
        sprintBtn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
        sprintBtn.style.transform = 'scale(1.05)';
        addEvent("Sprinting!");
    } else {
        sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        sprintBtn.style.transform = 'scale(1)';
    }
}

// Update display functions
function updateScoreboard() {
    document.getElementById('team-a-score').textContent = teamAScore;
    document.getElementById('team-b-score').textContent = teamBScore;
    
    const scoreElement = document.querySelector('.score');
    scoreElement.style.transform = 'scale(1.2)';
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
        possession.teamA = Math.min(100, possession.teamA + 1.5);
        possession.teamB = Math.max(0, possession.teamB - 1.5);
    } else {
        possession.teamB = Math.min(100, possession.teamB + 1.5);
        possession.teamA = Math.max(0, possession.teamA - 1.5);
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
    
    // Start AI updates
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
    
    createPlayers();
    createBall();
    updateDisplay();
    
    document.getElementById('game-status').textContent = 'Ready';
    document.getElementById('game-status').style.color = '#fff';
    document.getElementById('selected-player').textContent = 'None';
    document.getElementById('sprint-btn').style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    document.getElementById('sprint-btn').style.transform = 'scale(1)';
    
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
    document.getElementById('move-up').addEventListener('click', () => movePlayer('up'));
    document.getElementById('move-down').addEventListener('click', () => movePlayer('down'));
    document.getElementById('move-left').addEventListener('click', () => movePlayer('left'));
    document.getElementById('move-right').addEventListener('click', () => movePlayer('right'));

    document.getElementById('pass-btn').addEventListener('click', passBall);
    document.getElementById('shoot-btn').addEventListener('click', shootBall);
    document.getElementById('sprint-btn').addEventListener('click', toggleSprint);
    document.getElementById('select-btn').addEventListener('click', selectNextPlayer);

    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
}

// Setup keyboard controls
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameRunning && e.key !== ' ') return;

        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                e.preventDefault();
                movePlayer('up');
                break;
            case 's':
            case 'arrowdown':
                e.preventDefault();
                movePlayer('down');
                break;
            case 'a':
            case 'arrowleft':
                e.preventDefault();
                movePlayer('left');
                break;
            case 'd':
            case 'arrowright':
                e.preventDefault();
                movePlayer('right');
                break;
            case ' ':
                if (!gameRunning) startGame();
                break;
            case 'p':
                e.preventDefault();
                passBall();
                break;
            case 's':
                if (e.key === 's') {
                    e.preventDefault();
                    shootBall();
                }
                break;
            case 'shift':
                toggleSprint();
                break;
            case 'c':
                selectNextPlayer();
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (selectedPlayer) {
                selectedPlayer.element.classList.remove('running');
            }
        }
        
        if (e.key === 'Shift') {
            isSprinting = false;
            document.getElementById('sprint-btn').style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
            document.getElementById('sprint-btn').style.transform = 'scale(1)';
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
