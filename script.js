document.addEventListener('DOMContentLoaded', () => {

    // --- STATE VARIABLES ---
    const version = "v1.7"; // Updated version to confirm the fix
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
    let isProcessingBonus = false;
    let isAudioInitialized = false; // The new, simple flag for sound unlocking

    // --- ELEMENT REFERENCES ---
    const versionInfo = document.getElementById('version-info');
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
    
    // Audio elements
    const bonusSound = document.getElementById('bonus-sound');
    const selectSound = document.getElementById('select-sound');
    const deselectSound = document.getElementById('deselect-sound');
    const nextTurnSound = document.getElementById('next-turn-sound');

    // --- INITIALIZATION ---
    versionInfo.textContent = version;
    initializeLeaderboard();
    
    // --- EVENT LISTENERS (Restored to their simple, working form) ---
    addPlayerBtn.addEventListener('click', addPlayer);
    startGameBtn.addEventListener('click', startGame);
    newGameBtn.addEventListener('click', resetGame);
    playerNameInput.addEventListener('keyup', e => { if (e.key === 'Enter') addPlayer(); });
    
    logScoreBtn.addEventListener('click', () => {
        if (isProcessingBonus) return;
        playSound(selectSound);
        processTurn();
    });

    // --- SOUND & SETUP FUNCTIONS ---
    function initAudio() {
        if (isAudioInitialized) return; // If already unlocked, do nothing
        selectSound.volume = 0;
        selectSound.play().catch(() => {});
        selectSound.volume = 1;
        isAudioInitialized = true; // Set the flag so this never runs again
        console.log("Audio context unlocked.");
    }
    
    function playSound(soundElement) {
        if (!isAudioInitialized) initAudio(); // Failsafe if user skips adding players
        soundElement.currentTime = 0;
        soundElement.play().catch(error => console.error(`Sound failed: ${error}`));
    }
    
    // --- UPDATED to include the sound unlock ---
    function addPlayer() {
        initAudio(); // Call the sound unlock function
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

    // --- UPDATED to include the sound unlock ---
    function startGame() {
        initAudio(); // Call the sound unlock function
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

    // --- GAME LOGIC FUNCTIONS (The rest of the file is the same) ---
    function createCardButtons() {
        cardSelectionContainer.innerHTML = '';
        for (let i = 0; i <= 12; i++) {
            const card = document.createElement('button');
            card.className = 'card-button';
            card.textContent = i;
            card.dataset.value = i;
            card.addEventListener('click', handleCardClick);
            cardSelectionContainer.appendChild(card);
        }
    }

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

    function handleCardClick(event) {
        if (isProcessingBonus) return;
        const cardButton = event.currentTarget;
        const cardValue = parseInt(cardButton.dataset.value, 10);
        const isSelected = cardButton.classList.toggle('selected');
        
        if (isSelected) {
            currentTurnCards.push(cardValue);
            playSound(selectSound);
        } else {
            currentTurnCards = currentTurnCards.filter(value => value !== cardValue);
            playSound(deselectSound);
        }

        if (currentTurnCards.length === 7) {
            isProcessingBonus = true;
            triggerCelebration();
            updateCurrentHandTotalDisplay(); 
            setTimeout(triggerSkip7Bonus, 1500);
        } else {
            updateCurrentHandTotalDisplay();
        }
    }

    function handleActionCardClick(event) {
        if (isProcessingBonus) return;
        const cardButton = event.currentTarget;
        const action = cardButton.dataset.action;

        if (action === 'freeze') {
            processTurn();
            return;
        }
        if (action === 'zero') {
            processTurn(0);
            return;
        }
        
        cardButton.classList.toggle('selected');
        if (cardButton.classList.contains('selected')) {
            playSound(selectSound);
        } else {
            playSound(deselectSound);
        }
        
        if (action === 'multiply') {
            currentMultiplier = cardButton.classList.contains('selected') ? 2 : 1;
        }
        if (action === 'add') {
            currentBonusPoints = cardButton.classList.contains('selected') ? 6 : 0;
        }
        
        updateCurrentHandTotalDisplay();
    }
    
    function processTurn(forcedScore = null, isSkip7Bonus = false) {
        if (gameOver) return;
        let roundScore;

        if (forcedScore !== null) {
            roundScore = forcedScore;
        } else {
            const baseScore = currentTurnCards.reduce((sum, value) => sum + value, 0);
            roundScore = (baseScore * currentMultiplier) + currentBonusPoints;
        }
        
        players[currentPlayerIndex].score += roundScore;
        
        if (isSkip7Bonus) {
            const turnsRemaining = players.length - turnsThisRound;
            turnsThisRound += turnsRemaining;
        } else {
            turnsThisRound++;
        }
        
        if (checkForWinner()) return;

        advanceToNextPlayer();
        updateTurnUI();
    }

    function advanceToNextPlayer() {
        if (turnsThisRound >= players.length) {
            roundNumber++;
            turnsThisRound = 0;
            roundStartPlayerIndex = (roundStartPlayerIndex + 1) % players.length;
        }
        currentPlayerIndex = (roundStartPlayerIndex + turnsThisRound) % players.length;
        resetTurnState();
    }

    function resetTurnState() {
        isProcessingBonus = false;
        currentTurnCards = [];
        currentMultiplier = 1;
        currentBonusPoints = 0;
        
        document.querySelectorAll('.card-button.selected, .action-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        updateCurrentHandTotalDisplay();
    }

    function triggerCelebration() {
        playSound(bonusSound);
        const duration = 1 * 1000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }

    function triggerSkip7Bonus() {
        const baseScore = currentTurnCards.reduce((sum, value) => sum + value, 0);
        const finalScore = (baseScore * currentMultiplier) + currentBonusPoints + 15;
        processTurn(finalScore, true);
    }

    function updateCurrentHandTotalDisplay() {
        const baseScore = currentTurnCards.reduce((sum, value) => sum + value, 0);
        let total = (baseScore * currentMultiplier) + currentBonusPoints;
        let displayText = `${total}`;

        if (currentMultiplier > 1 || currentBonusPoints > 0) {
            displayText = `(${baseScore} × ${currentMultiplier}) + ${total - currentBonusPoints}`;
        }
        
        if (currentTurnCards.length === 7) {
            total += 15;
            displayText = `SKIP 7 BONUS! ${total - 15} + 15 = ${total}`;
            currentHandTotal.classList.add('skip7-bonus');
        } else {
            currentHandTotal.classList.remove('skip7-bonus');
        }
        
        currentHandTotal.textContent = displayText;
    }

    function updateTurnUI() {
        if(gameOver) return;
        roundCounter.textContent = `Round: ${roundNumber}`;
        turnIndicator.textContent = `It's ${players[currentPlayerIndex].name}'s turn!`;
        renderScoreboard();
        
        if (roundNumber > 1 || turnsThisRound > 0) {
            playSound(nextTurnSound);
        }
    }

    function renderScoreboard() {
        scoreboard.innerHTML = '';
        players.forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'player-score-card';
            if (index === currentPlayerIndex && !gameOver) card.classList.add('active');
            
            const scoreNeeded = Math.max(0, winningScore + 1 - player.score);
            card.innerHTML = `
                <div class="name">${player.name}</div>
                <div class="score">${player.score}</div>
                <p class="score-needed">${scoreNeeded} to win</p>
            `;
            scoreboard.appendChild(card);
        });
    }

    // --- END GAME FUNCTIONS ---
    function checkForWinner() {
        const winner = players.find(p => p.score > winningScore);
        if (winner) {
            gameOver = true;
            winnerText.textContent = `🎉 ${winner.name} is the winner! 🎉`;
            allTimeWinners.push(winner.name);
            saveWinnersToStorage();
            renderAllTimeLeaderboard();
            
            gameContainer.classList.add('hidden');
            winnerAnnouncement.classList.remove('hidden');
            winnerAnnouncement.classList.add('animate-winner');
            
            renderScoreboard();
            return true;
        }
        return false;
    }
    
    function resetGame() {
        players = [];
        gameOver = false;
        isProcessingBonus = false; 
        currentPlayerIndex = 0;
        roundStartPlayerIndex = 0;
        turnsThisRound = 0;
        roundNumber = 1;
        resetTurnState();
        
        playerList.innerHTML = '';
        playerNameInput.value = '';
        
        winnerAnnouncement.classList.add('hidden');
        winnerAnnouncement.classList.remove('animate-winner');
        gameContainer.classList.add('hidden');
        setupContainer.classList.remove('hidden');
    }
});
