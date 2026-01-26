// Football Game JavaScript - Fixed Version
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

// Player Data (same as before)
const playerData = {
    teamA: [
        { id: 1, name: "Alex GK", position: "Goalkeeper", number: 1, skill: 85, speed: 70 },
        { id: 2, name: "Ben", position: "Defender", number: 4, skill: 78, speed: 75 },
        { id: 3, name: "Chris", position: "Defender", number: 5, skill: 82, speed: 72 },
        { id: 4, name: "David", position: "Defender", number: 3, skill: 80, speed: 78 },
        { id: 5, name: "Ethan", position: "Defender", number: 2, skill: 79, speed: 76 },
        { id: 6, name: "Finn", position: "Midfielder", number: 8, skill: 84, speed: 82 },
        { id: 7, name: "Greg", position: "Midfielder", number: 10, skill: 86, speed: 85 },
        { id: 8, name: "Harry", position: "Midfielder", number: 6, skill: 83, speed: 80 },
        { id: 9, name: "Ian", position: "Midfielder", number: 7, skill: 81, speed: 79 },
        { id: 10, name: "Jack", position: "Forward", number: 9, skill: 88, speed: 90 },
        { id: 11, name: "Kyle", position: "Forward", number: 11, skill: 85, speed: 88 }
    ],
    teamB: [
        { id: 12, name: "AI GK", position: "Goalkeeper", number: 1, skill: 82, speed: 70 },
        { id: 13, name: "AI Def 1", position: "Defender", number: 4, skill: 76, speed: 78 },
        { id: 14, name: "AI Def 2", position: "Defender", number: 5, skill: 79, speed: 80 },
        { id: 15, name: "AI Def 3", position: "Defender", number: 3, skill: 78, speed: 79 },
        { id: 16, name: "AI Def 4", position: "Defender", number: 2, skill: 80, speed: 81 },
        { id: 17, name: "AI Mid 1", position: "Midfielder", number: 8, skill: 84, speed: 85 },
        { id: 18, name: "AI Mid 2", position: "Midfielder", number: 10, skill: 87, speed: 88 },
        { id: 19, name: "AI Mid 3", position: "Midfielder", number: 6, skill: 83, speed: 86 },
        { id: 20, name: "AI For 1", position: "Forward", number: 9, skill: 89, speed: 93 },
        { id: 21, name: "AI For 2", position: "Forward", number: 11, skill: 85, speed: 90 },
        { id: 22, name: "AI For 3", position: "Forward", number: 7, skill: 87, speed: 89 }
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
}

// Create players on the field (same as before)
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

// Create a single player (same as before)
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
        hasBall: false
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

// Update ball position - FIXED VERSION
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

    // Bounce off walls with better physics
    if (ball.x <= 2) {
        ball.velocityX *= -0.7;
        ball.x = 2.1; // Slightly offset to prevent sticking
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

// Check if ball contacts a player - IMPROVED VERSION
function checkBallContact() {
    if (!ball || ball.withPlayer) return;

    let closestPlayer = null;
    let closestDistance = Infinity;

    playersOnField.forEach(player => {
        // Calculate distance between ball and player
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If player is close enough and closer than previous closest player
        if (distance < 6 && distance < closestDistance) {
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
    ball.withPlayer = player;
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

    // If AI player gets the ball, make AI decision
    if (player.team === 'team-b' && gameRunning) {
        setTimeout(makeAIDecision, 800 + Math.random() * 400);
    }
}

// Move ball with player
function moveBallWithPlayer() {
    if (!ball.withPlayer) return;

    ball.x = ball.withPlayer.x;
    ball.y = ball.withPlayer.y - 3; // Slightly above player
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
}

// Pass the ball - IMPROVED VERSION
function passBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }

    // Find all teammates
    const teammates = playersOnField.filter(p => 
        p.team === selectedPlayer.team && 
        p !== selectedPlayer
    );

    if (teammates.length > 0) {
        // Filter teammates by proximity and skill
        const possibleTargets = teammates.filter(teammate => {
            const dx = teammate.x - selectedPlayer.x;
            const dy = teammate.y - selectedPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if teammate is in reasonable passing range
            return distance < 40 && 
                   Math.random() > 0.2 && // 80% chance teammate is available
                   !teammate.hasBall;
        });

        if (possibleTargets.length > 0) {
            // Choose the best target based on skill and position
            const target = possibleTargets.reduce((best, current) => {
                const bestDistance = Math.sqrt(
                    Math.pow(best.x - selectedPlayer.x, 2) + 
                    Math.pow(best.y - selectedPlayer.y, 2)
                );
                const currentDistance = Math.sqrt(
                    Math.pow(current.x - selectedPlayer.x, 2) + 
                    Math.pow(current.y - selectedPlayer.y, 2)
                );
                
                // Prefer closer targets with higher skill
                const bestScore = (best.skill / 100) * (40 / (bestDistance + 1));
                const currentScore = (current.skill / 100) * (40 / (currentDistance + 1));
                
                return currentScore > bestScore ? current : best;
            });

            // Calculate pass direction
            const dx = target.x - ball.x;
            const dy = target.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Adjust speed based on player skill and distance
            const baseSpeed = selectedPlayer.skill / 25;
            const speed = Math.min(6, Math.max(2, baseSpeed * (distance / 20)));
            
            // Add some randomness to the pass
            const accuracy = selectedPlayer.skill / 100;
            const randomX = (Math.random() - 0.5) * 3 * (1 - accuracy);
            const randomY = (Math.random() - 0.5) * 3 * (1 - accuracy);

            // Kick the ball
            ball.velocityX = (dx / distance) * speed + randomX;
            ball.velocityY = (dy / distance) * speed + randomY;
            ball.withPlayer = null;
            selectedPlayer.hasBall = false;
            selectedPlayer.element.classList.remove('has-ball');
            ball.isMoving = true;

            addEvent(`${selectedPlayer.name} passes to ${target.name}`, 'pass');
            updateBallPosition(); // Start ball animation
        } else {
            addEvent("No open teammates to pass to!");
        }
    } else {
        addEvent("No teammates found!");
    }
}

// Shoot the ball - IMPROVED VERSION
function shootBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }

    // Determine which goal to shoot at
    let goalX, goalY;
    if (selectedPlayer.team === 'team-a') {
        // Shooting at right goal
        goalX = 98;
        goalY = 50 + (Math.random() - 0.5) * 10; // Some randomness in aim
    } else {
        // Shooting at left goal
        goalX = 2;
        goalY = 50 + (Math.random() - 0.5) * 10; // Some randomness in aim
    }
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Power based on player skill with randomness
    const basePower = selectedPlayer.skill / 15;
    const power = Math.min(10, Math.max(3, basePower + Math.random() * 3));
    
    // Accuracy based on player skill
    const accuracy = selectedPlayer.skill / 100;
    const randomX = (Math.random() - 0.5) * 5 * (1 - accuracy);
    const randomY = (Math.random() - 0.5) * 5 * (1 - accuracy);

    // Kick the ball
    ball.velocityX = (dx / distance) * power + randomX;
    ball.velocityY = (dy / distance) * power + randomY;
    ball.withPlayer = null;
    selectedPlayer.hasBall = false;
    selectedPlayer.element.classList.remove('has-ball');
    ball.isMoving = true;

    addEvent(`${selectedPlayer.name} shoots!`, 'pass');
    updateBallPosition(); // Start ball animation
}

// Check for goals - IMPROVED VERSION
function checkForGoal() {
    if (!ball || ball.isMoving === false) return;

    // Check if ball is in goal area with better detection
    const inLeftGoal = ball.x <= 5 && ball.y >= 40 && ball.y <= 60;
    const inRightGoal = ball.x >= 95 && ball.y >= 40 && ball.y <= 60;

    if (inLeftGoal && Math.abs(ball.velocityX) > 0.5) {
        // Ball entered left goal (Team A's goal, Team B scores)
        teamBScore++;
        updateScoreboard();
        addEvent("GOAL! Team B scores!", 'goal');
        highlightGoal('left');
        resetBall();
        return;
    }
    
    if (inRightGoal && Math.abs(ball.velocityX) > 0.5) {
        // Ball entered right goal (Team B's goal, Team A scores)
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

    if (ball.withPlayer) {
        ball.withPlayer.hasBall = false;
        ball.withPlayer.element.classList.remove('has-ball');
        ball.withPlayer = null;
    }

    ball.x = 50;
    ball.y = 50;
    ball.velocityX = 0;
    ball.velocityY = 0;
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

// Move selected player - IMPROVED VERSION
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

    // Keep within bounds (avoid goals)
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
    if (!selectedPlayer.hasBall && !ball.withPlayer) {
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

// AI Decision making - IMPROVED VERSION
function makeAIDecision() {
    if (!gameRunning || !ballWithPlayer || ballWithPlayer.team !== 'team-b') return;

    const aiPlayer = ballWithPlayer;
    const decision = Math.random();

    if (decision < 0.5) {
        // Pass to teammate
        const teammates = playersOnField.filter(p => 
            p.team === 'team-b' && 
            p !== aiPlayer &&
            !p.hasBall
        );
        
        if (teammates.length > 0) {
            // Choose best teammate (closest with good position)
            const target = teammates.reduce((best, current) => {
                const bestDistance = Math.sqrt(
                    Math.pow(best.x - aiPlayer.x, 2) + 
                    Math.pow(best.y - aiPlayer.y, 2)
                );
                const currentDistance = Math.sqrt(
                    Math.pow(current.x - aiPlayer.x, 2) + 
                    Math.pow(current.y - aiPlayer.y, 2)
                );
                
                // Prefer teammates closer to opponent's goal
                const bestScore = bestDistance + (100 - best.x);
                const currentScore = currentDistance + (100 - current.x);
                
                return currentScore < bestScore ? current : best;
            });
            
            // Calculate pass
            const dx = target.x - ball.x;
            const dy = target.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = Math.min(5, (aiPlayer.skill / 20));

            ball.velocityX = (dx / distance) * speed;
            ball.velocityY = (dy / distance) * speed;
            ball.withPlayer = null;
            aiPlayer.hasBall = false;
            aiPlayer.element.classList.remove('has-ball');
            ball.isMoving = true;

            addEvent(`${aiPlayer.name} passes to ${target.name}`, 'pass');
            updateBallPosition();
        }
    } else if (decision < 0.85) {
        // Shoot if in good position (close to goal)
        const distanceToGoal = 100 - aiPlayer.x; // Distance to right goal
        
        if (distanceToGoal < 40 && Math.abs(aiPlayer.y - 50) < 30) {
            // Good position to shoot
            const goalX = 2; // Team B shoots at left goal
            const goalY = 50 + (Math.random() - 0.5) * 15;
            
            const dx = goalX - ball.x;
            const dy = goalY - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const power = Math.min(8, (aiPlayer.skill / 15) + Math.random() * 2);

            ball.velocityX = (dx / distance) * power;
            ball.velocityY = (dy / distance) * power;
            ball.withPlayer = null;
            aiPlayer.hasBall = false;
            aiPlayer.element.classList.remove('has-ball');
            ball.isMoving = true;

            addEvent(`${aiPlayer.name} shoots!`, 'pass');
            updateBallPosition();
        } else {
            // Dribble toward goal
            const moveX = aiPlayer.x - 1.5; // Move left toward goal
            const moveY = aiPlayer.y + (Math.random() - 0.5) * 4;
            
            aiPlayer.x = Math.max(5, Math.min(95, moveX));
            aiPlayer.y = Math.max(10, Math.min(90, moveY));
            aiPlayer.element.style.left = `${aiPlayer.x}%`;
            aiPlayer.element.style.top = `${aiPlayer.y}%`;
            
            moveBallWithPlayer();
            addEvent(`${aiPlayer.name} dribbles toward goal`);
            
            // Make another decision soon
            setTimeout(makeAIDecision, 500);
        }
    } else {
        // Dribble (move with ball)
        const moveX = aiPlayer.x - 2 + Math.random() * 4;
        const moveY = aiPlayer.y - 2 + Math.random() * 4;
        
        aiPlayer.x = Math.max(5, Math.min(95, moveX));
        aiPlayer.y = Math.max(10, Math.min(90, moveY));
        aiPlayer.element.style.left = `${aiPlayer.x}%`;
        aiPlayer.element.style.top = `${aiPlayer.y}%`;
        
        moveBallWithPlayer();
        addEvent(`${aiPlayer.name} dribbles`);
        
        // Make another decision soon
        setTimeout(makeAIDecision, 800);
    }
}

// Update display functions (keep the same)
function updateScoreboard() {
    document.getElementById('team-a-score').textContent = teamAScore;
    document.getElementById('team-b-score').textContent = teamBScore;
    
    // Animate score update
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

// Event logging (keep the same)
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

// Game control functions (keep the same)
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
    } else {
        document.getElementById('game-status').textContent = 'Paused';
        document.getElementById('game-status').style.color = '#f59e0b';
        addEvent("Game paused");
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

// Setup event listeners (keep the same)
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

// Setup keyboard controls (keep the same)
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

// Field click for player movement (keep the same)
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
