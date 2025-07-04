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

    // --- ELEMENT REFERENCES ---
    const setupContainer = document.getElementById('setup-container');
    const playerNameInput = document.getElementById('player-name-input');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerList = document.getElementById('player-list');
    const startGameBtn = document.getElementById('start-game-btn');

    const gameContainer = document.getElementById('game-container');
    const turnIndicator = document.getElementById('turn-indicator');
    const roundCounter = document.getElementById('round-counter');
    const cardsInput = document.getElementById('cards-input');
    const logScoreBtn = document.getElementById('log-score-btn');
    const scoreboard = document.getElementById('scoreboard');

    const winnerAnnouncement = document.getElementById('winner-announcement');
    const winnerText = document.getElementById('winner-text');
    const newGameBtn = document.getElementById('new-game-btn');
    
    const winnersList = document.getElementById('winners-list');

    // --- INITIALIZATION ---
    initializeLeaderboard();
    
    // --- EVENT LISTENERS ---
    addPlayerBtn.addEventListener('click', addPlayer);
    startGameBtn.addEventListener('click', startGame);
    logScoreBtn.addEventListener('click', processTurn);
    newGameBtn.addEventListener('click', resetGame);
    playerNameInput.addEventListener('keyup', e => { if (e.key === 'Enter') addPlayer(); });
    cardsInput.addEventListener('keyup', e => { if (e.key === 'Enter') processTurn(); });

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
        updateTurnUI();
    }

    // --- GAME LOGIC FUNCTIONS ---
    function calculateHandScore(cardsString) {
        let sum = 0;
        let multiplier = 1;
        if (cardsString.includes('*')) {
            const parts = cardsString.split('*');
            cardsString = parts[0];
            const potentialMultiplier = parseInt(parts[1], 10);
            if (!isNaN(potentialMultiplier)) multiplier = potentialMultiplier;
        }
        const cards = cardsString.split('.').map(card => card.trim());
        for (const card of cards) {
            if (card === '') continue;
            const numValue = parseInt(card, 10);
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 12) {
                sum += numValue;
            }
        }
        return sum * multiplier;
    }
    
    function processTurn() {
        if (gameOver) return;
        const roundScore = calculateHandScore(cardsInput.value);
        players[currentPlayerIndex].score += roundScore;
        cardsInput.value = '';
        turnsThisRound++;
        
        if (checkForWinner()) return; // Stop if winner is found
        
        if (turnsThisRound >= players.length) {
            roundNumber++;
            turnsThisRound = 0;
            roundStartPlayerIndex = (roundStartPlayerIndex + 1) % players.length;
            currentPlayerIndex = roundStartPlayerIndex;
        } else {
            currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        }
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
});