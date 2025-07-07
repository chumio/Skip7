document.addEventListener('DOMContentLoaded', () => {

    // --- STATE VARIABLES ---
    let players = [];
    let allTimeWinners = [];
    let currentPlayerIndex = 0;
    let roundStartPlayerIndex = 0;
    let turnsThisRound = 0;
    let roundNumber = 1;
    const winningScore = 200;
    let gameOver = false;
    let currentTurnCards = [];
    let currentMultiplier = 1;   
    let currentBonusPoints = 0;   

    // --- ELEMENT REFERENCES ---
    const setupContainer = document.getElementById('setup-container');
    const playerNameInput = document.getElementById('player-name-input');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerList = document.getElementById('player-list');
    const startGameBtn = document.getElementById('start-game-btn');

    const gameContainer = document.getElementById('game-container');
    const turnIndicator = document.getElementById('turn-indicator');
    const roundCounter = document.getElementById('round-counter');
    const cardSelectionContainer = document.getElementById('card-selection-container');
    const actionCardContainer = document.getElementById('action-card-container');
    const currentHandTotal = document.getElementById('current-hand-total');
    const logScoreBtn = document.getElementById('log-score-btn');
    const scoreboard = document.getElementById('scoreboard');

    const winnerAnnouncement = document.getElementById('winner-announcement');
    const winnerText = document.getElementById('winner-text');
    const newGameBtn = document.getElementById('new-game-btn');
    const winnersList = document.getElementById('winners-list');
    const bonusSound = document.getElementById('bonus-sound');

    // --- INITIALIZATION ---
    initializeLeaderboard();
    
    // --- EVENT LISTENERS ---
    addPlayerBtn.addEventListener('click', addPlayer);
    startGameBtn.addEventListener('click', startGame);
    logScoreBtn.addEventListener('click', () => processTurn());
    newGameBtn.addEventListener('click', resetGame);
    playerNameInput.addEventListener('keyup', e => { if (e.key === 'Enter') addPlayer(); });
    

    // --- SETUP & LEADERBOARD FUNCTIONS ---
    function addPlayer() {
        const name = playerNameInput.value.trim();
        if (name) {
            players.push({ name, score: 0 });
            playerNameInput.value = '';
            renderPlayerList();
        }
    }

    function renderPlayerList() {
        playerList.innerHTML = '';
        players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            playerList.appendChild(li);
        });
    }

    // Tweak 4: Functions for the persistent leaderboard
    function initializeLeaderboard() {
        const storedWinners = localStorage.getItem('skipSevenWinners');
        if (storedWinners) {
            allTimeWinners = JSON.parse(storedWinners);
        }
        renderAllTimeLeaderboard();
    }
    
    function renderAllTimeLeaderboard() {
        winnersList.innerHTML = '';
        if (allTimeWinners.length === 0) {
            winnersList.innerHTML = '<li>No games won yet. Be the first!</li>';
            return;
        }
        allTimeWinners.forEach(winnerName => {
            const li = document.createElement('li');
            li.textContent = winnerName;
            winnersList.appendChild(li);
        });
    }
    
    function saveWinnersToStorage() {
        localStorage.setItem('skipSevenWinners', JSON.stringify(allTimeWinners));
    }

    function startGame() {
        if (players.length < 1) {
            alert('Please add at least one player.');
            return;
        }
        setupContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        createCardButtons();
        createActionCards();
        updateTurnUI();
    }

    // --- GAME LOGIC FUNCTIONS ---
    function triggerCelebration() {
    // Play the sound
    bonusSound.currentTime = 0; // Rewind to start in case it's played again quickly
    bonusSound.play();

    // Launch the fireworks!
    const duration = 1 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        // launch a few confetti from the left edge
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
        });
        // and launch a few from the right edge
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
        });

        // keep going until we are out of time
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}
    
 function calculateHandScore(cardsArray) {
        if (!cardsArray || cardsArray.length === 0) {
            return 0;
        }
        // Use reduce to sum up all the numbers in the array
        return cardsArray.reduce((sum, value) => sum + value, 0);
    }
    
function processTurn(forcedScore = null) {
    if (gameOver) return;

    let roundScore;
    if (forcedScore !== null) {
        // Used for the "No Score" card
        roundScore = forcedScore;
    } else {
        // Normal score calculation
        const baseScore = currentTurnCards.reduce((sum, value) => sum + value, 0);
        roundScore = (baseScore * currentMultiplier) + currentBonusPoints;
    }
    
    players[currentPlayerIndex].score += roundScore;
    turnsThisRound++;
    
    if (checkForWinner()) return;

    // Advance to the next player
    advanceToNextPlayer();
    updateTurnUI();
}

    function renderScoreboard() {
        scoreboard.innerHTML = '';
        let scores = players.map(p => p.score);
        let maxScore = -Infinity, minScore = Infinity;
        if (players.length > 1) {
            maxScore = Math.max(...scores);
            minScore = Math.min(...scores);
        }

        players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'player-score-card';
            if (index === currentPlayerIndex && !gameOver) card.classList.add('active');
            if (players.length > 1) {
                if (player.score === maxScore && maxScore > 0) card.classList.add('leader');
                if (player.score === minScore) card.classList.add('last-place');
            }
            // Tweak 3: Show score needed to win
            const scoreNeeded = Math.max(0, winningScore - player.score);
            card.innerHTML = `
                <div class="name">${player.name}</div>
                <div class="score">${player.score}</div>
                <p class="score-needed">${scoreNeeded} to win</p>
            `;
            scoreboard.appendChild(card);
        });
    }

    function updateTurnUI() {
        roundCounter.textContent = `Round: ${roundNumber}`;
        turnIndicator.textContent = `It's ${players[currentPlayerIndex].name}'s turn!`;
        renderScoreboard();
    }

    // --- END GAME FUNCTIONS ---
    function checkForWinner() {
        const winner = players.find(p => p.score >= winningScore);
        if (winner) {
            gameOver = true;
            // Tweak 5: Add winner to leaderboard and animate
            winnerText.textContent = `🎉 ${winner.name} is the winner! 🎉`;
            allTimeWinners.push(winner.name);
            saveWinnersToStorage();
            renderAllTimeLeaderboard();
            
            gameContainer.classList.add('hidden');
            winnerAnnouncement.classList.remove('hidden');
            winnerAnnouncement.classList.add('animate-winner'); // Trigger animation
            
            renderScoreboard(); // Final render to remove active state
            return true;
        }
        return false;
    }
    
    function resetGame() {
        players = [];
        currentPlayerIndex = 0;
        roundStartPlayerIndex = 0;
        turnsThisRound = 0;
        roundNumber = 1;
        gameOver = false;
        
        playerList.innerHTML = '';
        playerNameInput.value = '';
        
        winnerAnnouncement.classList.add('hidden');
        winnerAnnouncement.classList.remove('animate-winner'); // Reset animation
        gameContainer.classList.add('hidden');
        setupContainer.classList.remove('hidden');
    }


        function createCardButtons() {
        cardSelectionContainer.innerHTML = ''; // Clear any existing cards
        for (let i = 0; i <= 12; i++) {
            const card = document.createElement('button');
            card.className = 'card-button';
            card.textContent = i;
            card.dataset.value = i; // Store value in a data attribute
            card.addEventListener('click', handleCardClick);
            cardSelectionContainer.appendChild(card);
        }
    }

function handleCardClick(event) {
    const cardButton = event.currentTarget;
    const cardValue = parseInt(cardButton.dataset.value, 10);

    const isSelected = cardButton.classList.toggle('selected');

    if (isSelected) {
        currentTurnCards.push(cardValue);
    } else {
        currentTurnCards = currentTurnCards.filter(value => value !== cardValue);
    }

    // --- The new "Skip 7" bonus logic with celebration ---
    if (currentTurnCards.length === 7) {
        triggerCelebration(); // <-- TRIGGER THE EFFECTS!
        updateCurrentHandTotalDisplay(); 
        setTimeout(triggerSkip7Bonus, 1500); // Increased timeout to enjoy the show
    } else {
        updateCurrentHandTotalDisplay();
    }
}

    function updateCurrentHandTotalDisplay() {
    const baseScore = currentTurnCards.reduce((sum, value) => sum + value, 0);
    let total = (baseScore * currentMultiplier) + currentBonusPoints;
    let displayText = `${total}`;

    // Show the calculation details to the user for clarity
    if (currentMultiplier > 1 || currentBonusPoints > 0) {
        displayText = `(${baseScore} × ${currentMultiplier}) + ${currentBonusPoints} = ${total}`;
    }

    // Special check for Skip 7 bonus
    if (currentTurnCards.length === 7) {
        total += 15;
        displayText = `SKIP 7 BONUS! ${total - 15} + 15 = ${total}`;
        currentHandTotal.classList.add('skip7-bonus');
    } else {
        currentHandTotal.classList.remove('skip7-bonus');
    }
    
    currentHandTotal.textContent = displayText;
}


// --- NEW LOGIC FUNCTIONS ---

function createActionCards() {
    actionCardContainer.innerHTML = '';
    const actions = [
        { id: 'freeze', icon: '❄️', label: 'FREEZE' },
        { id: 'multiply', icon: '×2', label: 'MULTIPLY' },
        { id: 'add', icon: '+6', label: 'BONUS' },
        { id: 'zero', icon: '❌', label: 'NO SCORE' }
    ];

    actions.forEach(action => {
        const card = document.createElement('button');
        card.className = 'action-card';
        card.dataset.action = action.id;
        card.innerHTML = `<div class="icon">${action.icon}</div><div class="label">${action.label}</div>`;
        card.addEventListener('click', handleActionCardClick);
        actionCardContainer.appendChild(card);
    });
}

function handleActionCardClick(event) {
    const cardButton = event.currentTarget;
    const action = cardButton.dataset.action;

    switch (action) {
        case 'freeze':
            // Immediately ends the current player's turn and logs their score
            processTurn();
            break;
        case 'multiply':
            // Toggles the multiplier
            cardButton.classList.toggle('selected');
            currentMultiplier = (currentMultiplier === 1) ? 2 : 1;
            break;
        case 'add':
            // Toggles the bonus points
            cardButton.classList.toggle('selected');
            currentBonusPoints = (currentBonusPoints === 0) ? 6 : 0;
            break;
        case 'zero':
            // Immediately ends turn with a score of 0
            processTurn(0); // Pass a forcedScore of 0
            break;
    }
    // Update the display unless it was a turn-ending action
    if (action !== 'freeze' && action !== 'zero') {
        updateCurrentHandTotalDisplay();
    }
}

function triggerSkip7Bonus() {
    // Calculate the final score with the 15-point bonus
    const baseScore = currentTurnCards.reduce((sum, value) => sum + value, 0);
    const finalScore = (baseScore * currentMultiplier) + currentBonusPoints + 15;
    
    // Award score to the current player
    players[currentPlayerIndex].score += finalScore;

    // IMPORTANT: The round ends for everyone. Others in the round score 0.
    // We can simulate this by fast-forwarding turns until a new round starts.
    const turnsRemainingInRound = players.length - turnsThisRound - 1;
    turnsThisRound += turnsRemainingInRound;

    if (checkForWinner()) return;
    
    // Advance to the next ROUND
    advanceToNextPlayer();
    updateTurnUI();
}

function advanceToNextPlayer() {
    resetTurnState(); // Reset cards and modifiers for the next player

    if (turnsThisRound >= players.length) {
        // Start a new round
        roundNumber++;
        turnsThisRound = 0;
        roundStartPlayerIndex = (roundStartPlayerIndex + 1) % players.length;
        currentPlayerIndex = roundStartPlayerIndex;
    } else {
        // Go to the next player in the current round
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    }
}

function resetTurnState() {
    // Reset all temporary turn variables
    currentTurnCards = [];
    currentMultiplier = 1;
    currentBonusPoints = 0;
    
    // Clear visual selection from all cards
    document.querySelectorAll('.card-button.selected, .action-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    
    updateCurrentHandTotalDisplay(); // Reset display to 0
}

// We need to slightly modify updateTurnUI to call resetTurnState
// This ensures that when a new game starts, the state is clean.
function updateTurnUI() {
    // If it's the very first turn of the game, reset everything.
    if (roundNumber === 1 && turnsThisRound === 0) {
        resetTurnState();
    }
    roundCounter.textContent = `Round: ${roundNumber}`;
    turnIndicator.textContent = `It's ${players[currentPlayerIndex].name}'s turn!`;
    renderScoreboard();
}    
});
