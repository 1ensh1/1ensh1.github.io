/* -----------------------------------------------------------
   QUIZ APPLICATION STATE & PERSISTENCE
----------------------------------------------------------- */
let currentFormative = null;
let allQuestionsRaw = {};    
let currentAttemptPool = []; 
let currentQuestionIndex = 0;
let currentAttemptAnswers = {}; 
let matchingSelection = null;   

let persistentProgress = JSON.parse(localStorage.getItem('quizProgress_V2')) || {
    correctQuestionHashes: { 1: [], 2: [], 3: [] }, 
    attempts: { 1: 0, 2: 0, 3: 0 }
};

// 1. Fetch data ONLY ONCE when the app first loads
async function loadFormatives() {
    // Only fetch if we haven't loaded the data yet
    if (Object.keys(allQuestionsRaw).length === 0) {
        for (let i = 1; i <= 3; i++) {
            try {
                const response = await fetch(`data/formative${i}.json`); 
                if (response.ok) {
                    const data = await response.json();
                    allQuestionsRaw[i] = data.map(q => ({
                        ...q,
                        uid: `${i}_${q.q.substring(0,20).replace(/\s/g, '_')}_${q.type}`
                    }));
                }
            } catch (error) {
                console.error(`Error loading formative${i}.json`, error);
            }
        }
    }
    // Draw the menu after data is loaded
    renderMenu();
}

// 2. Draw the menu using the data we already have
function renderMenu() {
    const grid = document.querySelector('.formative-grid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= 3; i++) {
        if (allQuestionsRaw[i]) {
            createMenuCard(i, grid);
        }
    }
}

function createMenuCard(num, grid) {
    const totalRaw = allQuestionsRaw[num].length;
    const masteredUIDs = persistentProgress.correctQuestionHashes[num] || [];
    const remainingQuestions = allQuestionsRaw[num].filter(q => !masteredUIDs.includes(q.uid));
    
    const card = document.createElement('div');
    card.className = 'formative-card';
    card.innerHTML = `
        <div class="icon">🖥️</div>
        <h2>Formative ${num}</h2>
        <p>Attempt ${persistentProgress.attempts[num] + 1}</p>
        <p>${remainingQuestions.length} of ${totalRaw} questions remaining.</p>
        <div class="card-buttons">
            <button class="btn btn-primary start-btn">Start Attempt</button>
            <button class="reset-link" onclick="resetFormative(${num}); event.stopPropagation();">Reset History</button>
        </div>
    `;

    if (remainingQuestions.length === 0) {
        card.querySelector('.start-btn').textContent = "Formative Mastered ✓";
        card.querySelector('.start-btn').disabled = true;
    } else {
        card.querySelector('.start-btn').onclick = () => startQuiz(num);
    }
    
    grid.appendChild(card);
}

function resetFormative(num) {
    if(!confirm(`Are you sure you want to reset history for Formative ${num}? This will bring back all questions you've previously mastered.`)) return;
    persistentProgress.correctQuestionHashes[num] = [];
    persistentProgress.attempts[num] = 0;
    savePersistentData();
    
    // Call renderMenu instead of loadFormatives to prevent fetch crashing
    renderMenu(); 
}

/* -----------------------------------------------------------
   QUIZ ENGINE
----------------------------------------------------------- */
function startQuiz(num) {
    currentFormative = num;
    const masteredUIDs = persistentProgress.correctQuestionHashes[num] || [];
    
    // 1. Get pool of remaining questions (NEVER answered correctly)
    let remainingPool = allQuestionsRaw[num].filter(q => !masteredUIDs.includes(q.uid));
    
    // 2. Shuffle remaining pool and slice to 20
    currentAttemptPool = shuffleArray([...remainingPool]).slice(0, 20);
    
    currentQuestionIndex = 0;
    currentAttemptAnswers = {}; // Reset for new session
    
    document.getElementById('current-formative').textContent = currentFormative;
    hideSidebar(); // We use the sidebar strictly for status display in linear mode
    renderSidebarGrid();
    displayQuestion();
    showScreen('quiz');
}

function renderSidebarGrid() {
    const grid = document.getElementById('question-nav-grid');
    grid.innerHTML = '';
    
    currentAttemptPool.forEach((_, index) => {
        const div = document.createElement('div');
        div.className = 'nav-item status-only'; // Click is disabled in linear flow
        div.textContent = index + 1;
        grid.appendChild(div);
    });
    updateSidebarStatus();
}

function updateSidebarStatus() {
    const items = document.querySelectorAll('.nav-item');
    let answeredCount = 0;
    
    items.forEach((item, index) => {
        item.classList.remove('active', 'answered');
        if (index === currentQuestionIndex) item.classList.add('active');
        if (currentAttemptAnswers[index] !== undefined) {
            item.classList.add('answered');
            answeredCount++;
        }
    });
    
    document.getElementById('answered-status').textContent = `${answeredCount} / ${currentAttemptPool.length} Answered`;
}

function displayQuestion() {
    const question = currentAttemptPool[currentQuestionIndex];
    if (!question) return; // Should not happen in linear flow

    document.getElementById('current-question').textContent = `${currentQuestionIndex + 1} of ${currentAttemptPool.length}`;
    document.getElementById('question-text').textContent = question.q;
    
    // Handle optional images
    const imgContainer = document.getElementById('image-container');
    imgContainer.innerHTML = '';
    if (question.img) {
        const img = document.createElement('img');
        img.src = `assets/${question.img}`; // Ensure images are in /assets/ folder
        img.className = 'question-image';
        imgContainer.appendChild(img);
    }
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Canvas functionality: Retrieve previously saved answer if re-rendering this question
    const existingAnswer = currentAttemptAnswers[currentQuestionIndex];

    if (question.type === 'mc' || question.type === 'tf') {
        const opts = question.type === 'tf' ? ['True', 'False'] : question.opts;
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = `option-btn ${existingAnswer === opt ? 'selected' : ''}`;
            btn.textContent = opt;
            btn.onclick = () => saveAnswer(opt);
            optionsContainer.appendChild(btn);
        });
    } else if (question.type === 'multi') {
        question.opts.forEach(opt => {
            const label = document.createElement('label');
            const isChecked = existingAnswer && existingAnswer.includes(opt);
            label.className = `checkbox-option ${isChecked ? 'selected' : ''}`;
            label.innerHTML = `<input type="checkbox" value="${opt}" ${isChecked ? 'checked' : ''}> <span>${opt}</span>`;
            
            label.querySelector('input').onchange = (e) => {
                let current = currentAttemptAnswers[currentQuestionIndex] || [];
                if (e.target.checked) current.push(opt);
                else current = current.filter(item => item !== opt);
                saveAnswer(current);
                displayQuestion(); // Re-render multi-select to update classes
            };
            optionsContainer.appendChild(label);
        });
    } else if (question.type === 'matching') {
        renderMatchingQuestion(question, optionsContainer, existingAnswer);
    }

    updateNavigationButtons();
    updateSidebarStatus();
}

function saveAnswer(answer) {
    currentAttemptAnswers[currentQuestionIndex] = answer;
    
    // Visual update logic
    const question = currentAttemptPool[currentQuestionIndex];
    if (question.type === 'mc' || question.type === 'tf') {
        // Find existing selected buttons, deselect them, and select the new one
        const btns = document.querySelectorAll('#options-container .option-btn');
        btns.forEach(btn => btn.classList.remove('selected'));
        // We re-render full MC/TF for simplicity to update classes unless performance is poor
        displayQuestion();
    }
    // Matching and Multi handle their own logic within renderers/onchanges

    updateNavigationButtons(); // Unlocks Next
    updateSidebarStatus();
}

// User Requirement: Handle matching off-centered and add arrow indication
function renderMatchingQuestion(question, container, existingAnswer) {
    const pairs = existingAnswer || []; 
    matchingSelection = null; 

    const matchingArea = document.createElement('div');
    matchingArea.className = 'matching-area';
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.className = 'matching-svg-overlay';
    // Define the Arrow Marker with the new class
    svg.innerHTML = `<defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" class="arrow-marker" />
        </marker>
    </defs>`;
    
    const grid = document.createElement('div');
    grid.className = 'matching-grid';
    
    const termsCol = document.createElement('div');
    termsCol.className = 'match-col terms';
    
    const matchCol = document.createElement('div');
    matchCol.className = 'match-col matches';

    const shuffledTerms = shuffleArray(question.pairs.map(p => p.term));
    const shuffledMatches = shuffleArray(question.pairs.map(p => p.match));

    shuffledTerms.forEach(term => {
        const div = document.createElement('div');
        div.className = `match-item term ${pairs.find(p => p.term === term) ? 'connected' : ''}`;
        div.textContent = term;
        div.dataset.value = term; 
        div.onclick = () => handleMatchClick('term', term, div, matchingArea);
        termsCol.appendChild(div);
    });

    shuffledMatches.forEach(match => {
        const div = document.createElement('div');
        div.className = `match-item match ${pairs.find(p => p.match === match) ? 'connected' : ''}`;
        div.textContent = match;
        div.dataset.value = match;
        div.onclick = () => handleMatchClick('match', match, div, matchingArea);
        matchCol.appendChild(div);
    });

    grid.appendChild(termsCol);
    grid.appendChild(matchCol);
    matchingArea.appendChild(svg);
    matchingArea.appendChild(grid);
    container.appendChild(matchingArea);

    // Increased timeout to guarantee DOM is fully painted before calculating line math
    setTimeout(() => drawMatchingLines(matchingArea, pairs), 150);
}

function handleMatchClick(type, value, element, area) {
    let currentPairs = currentAttemptAnswers[currentQuestionIndex] || [];

    if (type === 'term') {
        document.querySelectorAll('.term').forEach(el => el.classList.remove('selected'));
        element.classList.add('selected');
        matchingSelection = value;
    } else if (type === 'match' && matchingSelection) {
        // User requirements met: Handle click left -> right connection

        // Remove existing connections for this term OR this match (ensure unique mapping)
        currentPairs = currentPairs.filter(p => p.term !== matchingSelection && p.match !== value);
        
        // Add new connection
        currentPairs.push({ term: matchingSelection, match: value });
        
        saveAnswer(currentPairs);
        displayQuestion(); // Re-render question to update lines and classes
    }
}

function drawMatchingLines(area, pairs) {
    const svg = area.querySelector('svg');
    if (!svg) return;

    // Safely clear old lines, but keep the arrow definition
    Array.from(svg.children).forEach(child => {
        if (child.tagName !== 'defs') child.remove();
    });
    
    const areaRect = area.getBoundingClientRect();

    pairs.forEach(pair => {
        const termEl = area.querySelector(`.term[data-value="${pair.term}"]`);
        const matchEl = area.querySelector(`.match[data-value="${pair.match}"]`);
        
        if (termEl && matchEl) {
            const tRect = termEl.getBoundingClientRect();
            const mRect = matchEl.getBoundingClientRect();

            const x1 = tRect.right - areaRect.left;
            const y1 = tRect.top + (tRect.height / 2) - areaRect.top;
            const x2 = mRect.left - areaRect.left;
            const y2 = mRect.top + (mRect.height / 2) - areaRect.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2 - 4); // Pull back slightly so arrow tip isn't buried
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#10b981'); // Bright green line
            line.setAttribute('stroke-width', '4');
            line.setAttribute('marker-end', 'url(#arrowhead)'); 
            svg.appendChild(line);
        }
    });
}

// Ensure lines redraw correctly if window changes
window.addEventListener('resize', () => {
    if (document.getElementById('quiz-screen').classList.contains('hidden') === false) {
        const question = currentAttemptPool[currentQuestionIndex];
        if (question && question.type === 'matching') {
            displayQuestion(); 
        }
    }
});

/* -----------------------------------------------------------
   NAVIGATION & SUBMISSION LOGIC (Strict linear)
----------------------------------------------------------- */
function updateNavigationButtons() {
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-quiz-btn');
    
    // User requirement: Cannot click next without answering
    const isAnswered = currentAttemptAnswers[currentQuestionIndex] !== undefined;
    
    const isLastQuestion = currentQuestionIndex === currentAttemptPool.length - 1;

    // Handle linear flow navigation visibility
    if (isLastQuestion) {
        nextBtn.classList.add('hidden');
        if (isAnswered) {
            // Unlock submit if final question is done
            submitBtn.classList.remove('hidden');
            submitBtn.disabled = false;
        } else {
            submitBtn.classList.add('hidden');
        }
    } else {
        // Normal progression
        nextBtn.classList.remove('hidden');
        nextBtn.disabled = !isAnswered; // Locked if not answered
        submitBtn.classList.add('hidden');
    }
}

function navigateQuestion(direction) {
    if (direction === 1 && currentAttemptAnswers[currentQuestionIndex] === undefined) return; // double check safeguard

    currentQuestionIndex += direction;
    displayQuestion();
}

function submitQuiz() {
    // Basic final safeguard, though UI should prevent it
    if (currentAttemptAnswers[currentQuestionIndex] === undefined) {
        alert("Please answer the final question before submitting.");
        return;
    }

    if (!confirm('Are you sure you want to submit?')) return;

    let score = 0;
    const questionsCorrectUIDs = [];

    // Score based on original logic provided, adding UID tracking
    currentAttemptPool.forEach((q, index) => {
        const userAns = currentAttemptAnswers[index];
        if (!userAns) return;

        let isCorrect = false;

        if (q.type === 'mc' || q.type === 'tf') {
            if (userAns === q.a) isCorrect = true;
        } else if (q.type === 'multi') {
            // Original logic from provided script.js
            const correctSorted = [...q.a].sort();
            const userSorted = [...userAns].sort();
            if (JSON.stringify(correctSorted) === JSON.stringify(userSorted)) isCorrect = true;
        } else if (q.type === 'matching') {
            // Check if all pairs are correct
            let correctPairsCount = 0;
            userAns.forEach(ua => {
                const matchFound = q.pairs.some(p => p.term === ua.term && p.match === ua.match);
                if (matchFound) correctPairsCount++;
            });
            if (correctPairsCount === q.pairs.length && userAns.length === q.pairs.length) isCorrect = true; 
        }

        if (isCorrect) {
            score++;
            questionsCorrectUIDs.push(q.uid); // Track unique ID for mastery pool
        }
    });

    // Update Persistent Mastery Progress
    let currentMastered = persistentProgress.correctQuestionHashes[currentFormative] || [];
    
    // Combine old mastered UIDs with new ones from this attempt (deduplicated via Set)
    const newMasterySet = new Set([...currentMastered, ...questionsCorrectUIDs]);
    persistentProgress.correctQuestionHashes[currentFormative] = Array.from(newMasterySet);
    
    // Increment attempts count
    persistentProgress.attempts[currentFormative]++;
    
    savePersistentData();

    // Render Results
    document.getElementById('results-score').textContent = `${score} / ${currentAttemptPool.length}`;
    
    // Decide on retake prompt
    const masteredUIDs = persistentProgress.correctQuestionHashes[currentFormative];
    const remainingInFullPool = allQuestionsRaw[currentFormative].filter(q => !masteredUIDs.includes(q.uid));
    
    const retakeBtn = document.getElementById('results-retake-btn');
    if (remainingInFullPool.length > 0) {
        retakeBtn.classList.remove('hidden');
        retakeBtn.textContent = `Take Quiz Again (${remainingInFullPool.length} questions remaining)`;
    } else {
        retakeBtn.classList.add('hidden'); // Formative Mastered
    }

    showScreen('results');
}

function handleRetakeRequest() {
    startQuiz(currentFormative);
}

/* -----------------------------------------------------------
   HELPER UTILITIES
----------------------------------------------------------- */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function backToMenu() {
    loadFormatives(); // Refresh menu with new stats
    showScreen('menu');
}

function hideSidebar() {
    // You have the option to hide the sidebar completely for strict linear, 
    // or keep it to show progress status without clicking.
    // document.getElementById('quiz-screen').classList.add('no-sidebar'); 
}

function showScreen(screen) {
    const screens = ['menu', 'quiz', 'results'];
    screens.forEach(s => document.getElementById(`${s}-screen`).classList.add('hidden'));
    document.getElementById(`${screen}-screen`).classList.remove('hidden');
}

function savePersistentData() { 
    localStorage.setItem('quizProgress_V2', JSON.stringify(persistentProgress)); 
}

// Entry Point
loadFormatives();