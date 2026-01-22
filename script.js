// Football Game JavaScript
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

// Player Data
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

// Create players on the field
function createPlayers() {
    const field = document.getElementById('football-field');
    
    // Clear existing players
    playersOnField.forEach(player => {
        if (player.element) player.element.remove();
    });
    playersOnField = [];
    players = [];

    // Team A (User) - Blue team positions
    const teamAPositions = [
        { x: 10, y: 50 },  // Goalkeeper
        { x: 25, y: 20 }, { x: 25, y: 35 }, { x: 25, y: 65 }, { x: 25, y: 80 }, // Defenders
        { x: 45, y: 15 }, { x: 45, y: 40 }, { x: 45, y: 60 }, { x: 45, y: 85 }, // Midfielders
        { x: 65, y: 35 }, { x: 65, y: 65 } // Forwards
    ];

    // Team B (AI) - Red team positions
    const teamBPositions = [
        { x: 90, y: 50 },  // Goalkeeper
        { x: 75, y: 20 }, { x: 75, y: 35 }, { x: 75, y: 65 }, { x: 75, y: 80 }, // Defenders
        { x: 60, y: 25 }, { x: 60, y: 50 }, { x: 60, y: 75 }, // Midfielders
        { x: 40, y: 25 }, { x: 40, y: 50 }, { x: 40, y: 75 } // Forwards
    ];

    // Create Team A players
    playerData.teamA.forEach((data, index) => {
        if (index < teamAPositions.length) {
            createPlayer(data, 'team-a', teamAPositions[index]);
        }
    });

    // Create Team B players
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
        hasBall: false
    };

    playersOnField.push(player);
    players.push(player);

    // Add click event for Team A players
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
        withPlayer: null
    };

    updateBallPosition();
}

// Update ball position
function updateBallPosition() {
    if (!ball) return;

    // Apply velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Bounce off walls
    if (ball.x <= 2 || ball.x >= 98) {
        ball.velocityX *= -0.8;
        ball.x = ball.x <= 2 ? 2 : 98;
        addEvent("Ball hits the wall!");
    }
    if (ball.y <= 2 || ball.y >= 98) {
        ball.velocityY *= -0.8;
        ball.y = ball.y <= 2 ? 2 : 98;
    }

    // Apply friction
    ball.velocityX *= 0.96;
    ball.velocityY *= 0.96;

    // Stop if very slow
    if (Math.abs(ball.velocityX) < 0.05 && Math.abs(ball.velocityY) < 0.05) {
        ball.velocityX = 0;
        ball.velocityY = 0;
    }

    // Update visual position
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;

    // Check for player contact
    checkBallContact();

    // Check for goals
    checkForGoal();

    // Continue animation if still moving
    if (ball.velocityX !== 0 || ball.velocityY !== 0) {
        requestAnimationFrame(updateBallPosition);
    }
}

// Check if ball contacts a player
function checkBallContact() {
    if (!ball || ball.withPlayer) return;

    let closestPlayer = null;
    let closestDistance = Infinity;

    playersOnField.forEach(player => {
        const dx = player.x - ball.x;
        const dy = player.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 8 && distance < closestDistance) {
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
    ball.y = player.y - 5;

    // Update display
    updateBallPossession();
    updatePossessionStats(player.team === 'team-a' ? 'teamA' : 'teamB');
    
    addEvent(`${player.name} gets the ball!`, 'pass');

    // If AI player gets the ball, make AI decision
    if (player.team === 'team-b' && gameRunning) {
        setTimeout(makeAIDecision, 1000);
    }
}

// Move ball with player
function moveBallWithPlayer() {
    if (!ball.withPlayer) return;

    ball.x = ball.withPlayer.x;
    ball.y = ball.withPlayer.y - 5;
    ball.element.style.left = `${ball.x}%`;
    ball.element.style.top = `${ball.y}%`;
}

// Pass the ball
function passBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }

    // Find a teammate
    const teammates = playersOnField.filter(p => 
        p.team === selectedPlayer.team && 
        p !== selectedPlayer &&
        Math.random() > 0.3 // 70% chance to find open teammate
    );

    if (teammates.length > 0) {
        const target = teammates[Math.floor(Math.random() * teammates.length)];
        
        // Calculate pass direction
        const dx = target.x - ball.x;
        const dy = target.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.min(5, (selectedPlayer.skill / 20));

        // Kick the ball
        ball.velocityX = (dx / distance) * speed;
        ball.velocityY = (dy / distance) * speed;
        ball.withPlayer = null;
        selectedPlayer.hasBall = false;
        selectedPlayer.element.classList.remove('has-ball');

        addEvent(`${selectedPlayer.name} passes to ${target.name}`, 'pass');
        updateBallPosition();
    } else {
        addEvent("No open teammates to pass to!");
    }
}

// Shoot the ball
function shootBall() {
    if (!selectedPlayer || selectedPlayer !== ball.withPlayer) {
        addEvent("You don't have the ball!");
        return;
    }

    // Calculate shot direction (toward opponent's goal)
    const goalX = selectedPlayer.team === 'team-a' ? 98 : 2;
    const goalY = 50;
    
    const dx = goalX - ball.x;
    const dy = goalY - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(8, (selectedPlayer.skill / 15) + Math.random() * 2);

    // Kick the ball
    ball.velocityX = (dx / distance) * power;
    ball.velocityY = (dy / distance) * power;
    ball.withPlayer = null;
    selectedPlayer.hasBall = false;
    selectedPlayer.element.classList.remove('has-ball');

    addEvent(`${selectedPlayer.name} shoots!`, 'pass');
    updateBallPosition();
}

// Check for goals
function checkForGoal() {
    if (!ball) return;

    // Left goal (Team B scores)
    if (ball.x <= 2 && ball.y >= 40 && ball.y <= 60) {
        teamBScore++;
        updateScoreboard();
        addEvent("GOAL! Team B scores!", 'goal');
        resetBall();
    }
    
    // Right goal (Team A scores)
    if (ball.x >= 98 && ball.y >= 40 && ball.y <= 60) {
        teamAScore++;
        updateScoreboard();
        addEvent("GOAL! Team A scores!", 'goal');
        resetBall();
    }
}

// Reset ball position
function resetBall() {
    if (ball.withPlayer) {
        ball.withPlayer.hasBall = false;
        ball.withPlayer.element.classList.remove('has-ball');
        ball.withPlayer = null;
    }

    ball.x = 50;
    ball.y = 50;
    ball.velocityX = 0;
    ball.velocityY = 0;
    ball.element.style.left = '50%';
    ball.element.style.top = '50%';

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

    const speed = isSprinting ? 1.5 : 0.8;
    let newX = selectedPlayer.x;
    let newY = selectedPlayer.y;

    switch(direction) {
        case 'up': newY -= speed; break;
        case 'down': newY += speed; break;
        case 'left': newX -= speed; break;
        case 'right': newX += speed; break;
    }

    // Keep within bounds
    newX = Math.max(5, Math.min(95, newX));
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

    // Check ball proximity
    checkBallContact();
}

// Toggle sprint mode
function toggleSprint() {
    isSprinting = !isSprinting;
    const sprintBtn = document.getElementById('sprint-btn');
    
    if (isSprinting) {
        sprintBtn.style.background = 'linear-gradient(135deg, #d97706, #b45309)';
        addEvent("Sprinting!");
    } else {
        sprintBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    }
}

// AI Decision making
function makeAIDecision() {
    if (!gameRunning || !ball.withPlayer || ball.withPlayer.team !== 'team-b') return;

    const aiPlayer = ball.withPlayer;
    const decision = Math.random();

    if (decision < 0.4) {
        // Pass to teammate
        const teammates = playersOnField.filter(p => 
            p.team === 'team-b' && p !== aiPlayer
        );
        
        if (teammates.length > 0) {
            const target = teammates[Math.floor(Math.random() * teammates.length)];
            
            // Calculate pass
            const dx = target.x - ball.x;
            const dy = target.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = Math.min(4, (aiPlayer.skill / 25));

            ball.velocityX = (dx / distance) * speed;
            ball.velocityY = (dy / distance) * speed;
            ball.withPlayer = null;
            aiPlayer.hasBall = false;
            aiPlayer.element.classList.remove('has-ball');

            addEvent(`${aiPlayer.name} passes`, 'pass');
            updateBallPosition();
        }
    } else if (decision < 0.8) {
        // Shoot
        const goalX = 2; // Team B shoots at left goal
        const goalY = 50;
        
        const dx = goalX - ball.x;
        const dy = goalY - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(6, (aiPlayer.skill / 20));

        ball.velocityX = (dx / distance) * power;
        ball.velocityY = (dy / distance) * power;
        ball.withPlayer = null;
        aiPlayer.hasBall = false;
        aiPlayer.element.classList.remove('has-ball');

        addEvent(`${aiPlayer.name} shoots!`, 'pass');
        updateBallPosition();
    } else {
        // Dribble (move with ball)
        const moveX = aiPlayer.x - 3 + Math.random() * 6;
        const moveY = aiPlayer.y - 3 + Math.random() * 6;
        
        aiPlayer.x = Math.max(5, Math.min(95, moveX));
        aiPlayer.y = Math.max(10, Math.min(90, moveY));
        aiPlayer.element.style.left = `${aiPlayer.x}%`;
        aiPlayer.element.style.top = `${aiPlayer.y}%`;
        
        moveBallWithPlayer();
        addEvent(`${aiPlayer.name} dribbles`);
    }
}

// Update display functions
function updateScoreboard() {
    document.getElementById('team-a-score').textContent = teamAScore;
    document.getElementById('team-b-score').textContent = teamBScore;
}

function updateBallPossession() {
    const possessionElement = document.getElementById('ball-possession');
    if (ball.withPlayer) {
        possessionElement.textContent = ball.withPlayer.name;
        possessionElement.style.color = ball.withPlayer.team === 'team-a' ? '#3b82f6' : '#ef4444';
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
        
        // End game after 3 minutes
        if (matchTime >= 180) { // 3 minutes
            endGame();
        }
    }, 1000);
    
    addEvent("Game started!");
    
    // Select first player if none selected
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
    
    matchTime = 0;
    teamAScore = 0;
    teamBScore = 0;
    possession = { teamA: 50, teamB: 50 };
    isSprinting = false;
    selectedPlayer = null;
    
    createPlayers();
    createBall();
    updateDisplay();
    
    document.getElementById('game-status').textContent = 'Ready';
    document.getElementById('game-status').style.color = '#fff';
    document.getElementById('selected-player').textContent = 'None';
    document.getElementById('sprint-btn').style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    
    addEvent("Game reset");
}

function endGame() {
    gameRunning = false;
    if (matchInterval) {
        clearInterval(matchInterval);
        matchInterval = null;
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

// Setup event listeners
function setupEventListeners() {
    // Movement buttons
    document.getElementById('move-up').addEventListener('click', () => movePlayer('up'));
    document.getElementById('move-down').addEventListener('click', () => movePlayer('down'));
    document.getElementById('move-left').addEventListener('click', () => movePlayer('left'));
    document.getElementById('move-right').addEventListener('click', () => movePlayer('right'));

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
        if (!gameRunning && e.key !== ' ') return; // Only allow space to start

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

    // Remove running animation when keys are released
    document.addEventListener('keyup', (e) => {
        if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            if (selectedPlayer) {
                selectedPlayer.element.classList.remove('running');
            }
        }
        
        if (e.key === 'Shift') {
            isSprinting = false;
            document.getElementById('sprint-btn').style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
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
    
    // Move player to clicked position
    selectedPlayer.x = Math.max(5, Math.min(95, x));
    selectedPlayer.y = Math.max(10, Math.min(90, y));
    selectedPlayer.element.style.left = `${selectedPlayer.x}%`;
    selectedPlayer.element.style.top = `${selectedPlayer.y}%`;
    
    // If player has ball, move ball with player
    if (selectedPlayer.hasBall) {
        moveBallWithPlayer();
    }
    
    addEvent(`${selectedPlayer.name} moves to new position`);
});

// Export functions for debugging (optional)
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
        possession
    })
};