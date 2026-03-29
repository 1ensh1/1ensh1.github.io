let currentFormative = null;
let allQuestions = {};
let answeredQuestions = {};
let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswer = '';
let userAnswers = [];
let score = 0;
let loadedFormatives = new Set();

// Matching state
let matchingSelected = null;
let matchingUserPairs = {};

// ─── Config ───────────────────────────────────────────────────────────────────
// type must be: 'formative' | 'summative' | 'final'
// To add/remove assessments, just edit this array. The UI builds itself.
const ASSESSMENTS = [
    { key: 'f1', label: 'Formative 1', file: 'data/formative1.json', icon: '📝', type: 'formative' },
    { key: 'f2', label: 'Formative 2', file: 'data/formative2.json', icon: '📝', type: 'formative' },
    { key: 'f3', label: 'Formative 3', file: 'data/formative3.json', icon: '📝', type: 'formative' },
    { key: 'f4', label: 'Formative 4', file: 'data/formative4.json', icon: '📝', type: 'formative' },
    { key: 'f5', label: 'Formative 5', file: 'data/formative5.json', icon: '📝', type: 'formative' },
    { key: 'f6', label: 'Formative 6', file: 'data/formative6.json', icon: '📝', type: 'formative' },
    { key: 'f7', label: 'Formative 7', file: 'data/formative7.json', icon: '📝', type: 'formative' },
    { key: 'f8', label: 'Formative 8', file: 'data/formative8.json', icon: '📝', type: 'formative' },
    { key: 's1', label: 'Summative 1', file: 'data/summative1.json', icon: '📋', type: 'summative' },
    { key: 's2', label: 'Summative 2', file: 'data/summative2.json', icon: '📋', type: 'summative' },
    { key: 's3', label: 'Summative 3', file: 'data/summative3.json', icon: '📋', type: 'summative' },
    { key: 's4', label: 'Summative 4', file: 'data/summative4.json', icon: '📋', type: 'summative' },
    { key: 'mt', label: 'Midterm Exam', file: 'data/midterm.json', icon: '📄', type: 'midterm' },
    { key: 'fe', label: 'Final Exam',  file: 'data/finalexam.json',  icon: '🏆', type: 'final'     },
];

// Section definitions — order and labels for the menu
const SECTIONS = [
    { type: 'formative', label: 'Formative Assessments', subtitle: 'Practice quizzes to check your understanding' },
    { type: 'summative', label: 'Summative Assessments', subtitle: 'Graded assessments to measure your learning' },
    { type: 'midterm',   label: 'Midterm Exam',          subtitle: 'Mid-course exam covering topics so far'       },
    { type: 'final',     label: 'Final Exam',            subtitle: 'Comprehensive exam covering all topics'       },
];

// ─── Init ─────────────────────────────────────────────────────────────────────
async function loadFormatives() {
    loadProgress();
    buildMenu();

    for (const assessment of ASSESSMENTS) {
        try {
            const response = await fetch(assessment.file);
            if (!response.ok) {
                updateFormativeDisplay(assessment.key, true);
                continue;
            }
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                updateFormativeDisplay(assessment.key, true);
                continue;
            }
            allQuestions[assessment.key] = data;
            loadedFormatives.add(assessment.key);
            updateFormativeDisplay(assessment.key);
        } catch (error) {
            console.error(`Error loading ${assessment.file}:`, error);
            updateFormativeDisplay(assessment.key, true);
        }
    }
}

function buildMenu() {
    const menuBody = document.getElementById('menu-body');
    menuBody.innerHTML = '';

    SECTIONS.forEach(section => {
        const sectionAssessments = ASSESSMENTS.filter(a => a.type === section.type);
        if (sectionAssessments.length === 0) return;

        const isFinal   = section.type === 'final';
        const isMidterm = section.type === 'midterm';
        const isCentered = isFinal || isMidterm;

        const sectionEl = document.createElement('div');
        sectionEl.className = `assessment-section${isCentered ? ' section-final' : ''}`;

        sectionEl.innerHTML = `
            <div class="section-header">
                <div class="section-title-group">
                    <h2 class="section-title">${section.label}</h2>
                    <p class="section-subtitle">${section.subtitle}</p>
                </div>
                <div class="section-line"></div>
            </div>
            <div class="formative-grid${isCentered ? ' grid-final' : ''}">
                ${sectionAssessments.map(a => {
                    if (!answeredQuestions[a.key]) answeredQuestions[a.key] = [];
                    return `
                        <div class="formative-card${isFinal ? ' card-final' : isMidterm ? ' card-midterm' : ''}" onclick="startQuiz('${a.key}')">
                            <div class="icon">${a.icon}</div>
                            <h2>${a.label}</h2>
                            <p id="${a.key}-count">Loading...</p>
                            <div id="${a.key}-status"></div>
                            <button id="${a.key}-reset" class="reset-btn hidden"
                                onclick="event.stopPropagation(); resetFormative('${a.key}')">Reset Quiz</button>
                            <button id="${a.key}-view" class="view-btn hidden"
                                onclick="event.stopPropagation(); viewAllQuestions('${a.key}')">View All Questions</button>
                        </div>`;
                }).join('')}
            </div>
        `;

        menuBody.appendChild(sectionEl);
    });
}

// ─── Display helpers ──────────────────────────────────────────────────────────
function updateFormativeDisplay(key, hasError = false) {
    const countEl  = document.getElementById(`${key}-count`);
    const statusEl = document.getElementById(`${key}-status`);
    const resetBtn = document.getElementById(`${key}-reset`);
    const viewBtn  = document.getElementById(`${key}-view`);

    if (hasError || !allQuestions[key]) {
        countEl.textContent   = 'Failed to load';
        countEl.style.color   = '#ef4444';
        statusEl.innerHTML    = '<span style="color:#ef4444;font-size:0.9rem;">Check if JSON file exists</span>';
        resetBtn.classList.add('hidden');
        viewBtn.classList.add('hidden');
        return;
    }

    const total      = allQuestions[key].length;
    const answered   = answeredQuestions[key].length;
    const unanswered = total - answered;

    if (unanswered === 0) {
        countEl.textContent = `All ${total} questions answered!`;
        countEl.style.color = '#ffffff';
        statusEl.innerHTML  = '<span class="completed-badge">✓ Completed</span>';
        resetBtn.classList.remove('hidden');
    } else {
        countEl.textContent = `${unanswered} question${unanswered !== 1 ? 's' : ''} available`;
        countEl.style.color = '#ffffff';
        statusEl.textContent = answered > 0 ? `(${answered} answered)` : '';
        statusEl.style.color = '#9ca3af';
        resetBtn.classList.add('hidden');
    }
    viewBtn.classList.remove('hidden');
}

// ─── Quiz flow ────────────────────────────────────────────────────────────────
function shuffleArray(array) {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startQuiz(key) {
    if (!loadedFormatives.has(key)) {
        const a = ASSESSMENTS.find(x => x.key === key);
        alert(`${a ? a.label : key} failed to load. Check if the JSON file exists in the data/ folder.`);
        return;
    }

    currentFormative = key;
    const all = allQuestions[key];
    const unanswered = all.filter((_, i) => !answeredQuestions[key].includes(i));

    if (unanswered.length === 0) {
        alert('You have answered all questions! Click "Reset Quiz" to start over.');
        return;
    }

    quizQuestions = shuffleArray(unanswered).slice(0, Math.min(20, unanswered.length));
    currentQuestionIndex = 0;
    score = 0;
    userAnswer = '';
    userAnswers = [];
    showScreen('quiz');
    displayQuestion();
}

function resetFormative(key) {
    const a = ASSESSMENTS.find(x => x.key === key);
    if (confirm(`Reset ${a ? a.label : key}? This will allow you to answer all questions again.`)) {
        answeredQuestions[key] = [];
        updateFormativeDisplay(key);
        saveProgress();
    }
}

function resetCurrentQuiz() {
    if (!currentFormative) return;
    const a = ASSESSMENTS.find(x => x.key === currentFormative);
    if (confirm(`Reset ${a ? a.label : currentFormative}? This will exit and clear all progress.`)) {
        answeredQuestions[currentFormative] = [];
        saveProgress();
        backToMenu();
    }
}

// ─── Question rendering ───────────────────────────────────────────────────────
function displayQuestion() {
    const question = quizQuestions[currentQuestionIndex];
    const a = ASSESSMENTS.find(x => x.key === currentFormative);

    document.getElementById('current-formative').textContent = a ? a.label : currentFormative;
    document.getElementById('current-question').textContent  = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent   = quizQuestions.length;
    document.getElementById('question-text').textContent     = question.q;

    // Image support
    const imgContainer = document.getElementById('question-image-container');
    if (question.img) {
        imgContainer.innerHTML = `<img src="assets/${question.img}" alt="Question diagram" class="question-image" />`;
        imgContainer.classList.remove('hidden');
    } else {
        imgContainer.innerHTML = '';
        imgContainer.classList.add('hidden');
    }

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    // Reset matching state
    matchingSelected  = null;
    matchingUserPairs = {};

    const submitBtn = document.getElementById('submit-btn');
    const nextBtn   = document.getElementById('next-btn');
    document.getElementById('feedback-container').innerHTML = '';
    submitBtn.classList.remove('hidden');
    nextBtn.classList.add('hidden');
    submitBtn.disabled = true;
    userAnswer  = '';
    userAnswers = [];

    if (question.type === 'tf') {
        renderTrueFalse(optionsContainer);
    } else if (question.type === 'mc') {
        renderMC(optionsContainer, question);
    } else if (question.type === 'multi') {
        renderMulti(optionsContainer, question);
    } else if (question.type === 'text') {
        renderText(optionsContainer);
    } else if (question.type === 'matching') {
        renderMatching(optionsContainer, question);
    }
}

function renderTrueFalse(container) {
    ['True', 'False'].forEach(opt => {
        const btn = document.createElement('button');
        btn.className   = 'option-btn';
        btn.textContent = opt;
        btn.onclick     = () => selectAnswer(opt, btn);
        container.appendChild(btn);
    });
}

function renderMC(container, question) {
    question.opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className   = 'option-btn';
        btn.textContent = opt;
        btn.onclick     = () => selectAnswer(opt, btn);
        container.appendChild(btn);
    });
}

function renderMulti(container, question) {
    const instr = document.createElement('p');
    instr.className   = 'multi-instruction';
    instr.textContent = '(Select all that apply)';
    container.appendChild(instr);

    question.opts.forEach(opt => {
        const label    = document.createElement('label');
        label.className = 'checkbox-option';

        const checkbox  = document.createElement('input');
        checkbox.type   = 'checkbox';
        checkbox.value  = opt;
        checkbox.onchange = () => selectMultipleAnswers(label, checkbox);

        const text      = document.createElement('span');
        text.textContent = opt;

        label.appendChild(checkbox);
        label.appendChild(text);
        label.onclick = (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                selectMultipleAnswers(label, checkbox);
            }
        };
        container.appendChild(label);
    });
}

function renderText(container) {
    const input       = document.createElement('input');
    input.type        = 'text';
    input.className   = 'text-input';
    input.placeholder = 'Type your answer...';
    input.oninput     = (e) => {
        userAnswer = e.target.value;
        document.getElementById('submit-btn').disabled = !userAnswer.trim();
    };
    container.appendChild(input);
}

// ─── Matching UI ──────────────────────────────────────────────────────────────
function renderMatching(container, question) {
    const shuffledMatches = shuffleArray(question.pairs.map(p => p.match));

    const wrapper = document.createElement('div');
    wrapper.className = 'matching-wrapper';
    wrapper.id        = 'matching-wrapper';

    // SVG layer for lines
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'matching-svg');
    svg.classList.add('matching-svg');
    wrapper.appendChild(svg);

    // Left column — terms
    const leftCol = document.createElement('div');
    leftCol.className = 'matching-col matching-col-left';

    question.pairs.forEach((pair, i) => {
        const item = document.createElement('div');
        item.className   = 'matching-item matching-term';
        item.textContent = pair.term;
        item.dataset.term = pair.term;
        item.dataset.index = i;
        item.onclick = () => selectMatchingTerm(item);
        leftCol.appendChild(item);
    });

    // Right column — definitions (shuffled)
    const rightCol = document.createElement('div');
    rightCol.className = 'matching-col matching-col-right';

    shuffledMatches.forEach((match, i) => {
        const item = document.createElement('div');
        item.className    = 'matching-item matching-def';
        item.textContent  = match;
        item.dataset.match = match;
        item.dataset.index = i;
        item.onclick = () => selectMatchingDef(item);
        rightCol.appendChild(item);
    });

    wrapper.appendChild(leftCol);
    wrapper.appendChild(rightCol);
    container.appendChild(wrapper);

    // Redraw lines on resize
    window.addEventListener('resize', redrawMatchingLines);
}

function selectMatchingTerm(item) {
    // If already matched, allow re-selection to change
    const allTerms = document.querySelectorAll('.matching-term');
    const allDefs  = document.querySelectorAll('.matching-def');

    // Deselect all terms first
    allTerms.forEach(t => t.classList.remove('matching-active'));

    // If clicking an already-selected term, deselect
    if (matchingSelected && matchingSelected === item) {
        matchingSelected = null;
        return;
    }

    matchingSelected = item;
    item.classList.add('matching-active');

    // If a def is already highlighted (user clicked def first), complete the pair
    const activeDef = document.querySelector('.matching-def.matching-active');
    if (activeDef) {
        completePair(item, activeDef);
    }
}

function selectMatchingDef(item) {
    if (matchingSelected) {
        // A term is already selected — complete the pair
        completePair(matchingSelected, item);
    } else {
        // No term selected yet — highlight this def
        document.querySelectorAll('.matching-def').forEach(d => d.classList.remove('matching-active'));
        item.classList.toggle('matching-active');
    }
}

function completePair(termEl, defEl) {
    const term  = termEl.dataset.term;
    const match = defEl.dataset.match;

    // Remove any previous pairing for this term
    if (matchingUserPairs[term]) {
        const oldMatch = matchingUserPairs[term];
        document.querySelectorAll('.matching-def').forEach(d => {
            if (d.dataset.match === oldMatch) {
                d.classList.remove('matching-paired');
            }
        });
    }

    // Remove any previous pairing pointing to this def
    Object.keys(matchingUserPairs).forEach(t => {
        if (matchingUserPairs[t] === match && t !== term) {
            delete matchingUserPairs[t];
            document.querySelectorAll('.matching-term').forEach(el => {
                if (el.dataset.term === t) el.classList.remove('matching-paired');
            });
        }
    });

    matchingUserPairs[term] = match;

    // Visual feedback
    termEl.classList.remove('matching-active');
    termEl.classList.add('matching-paired');
    defEl.classList.remove('matching-active');
    defEl.classList.add('matching-paired');

    matchingSelected = null;
    document.querySelectorAll('.matching-term').forEach(t => t.classList.remove('matching-active'));
    document.querySelectorAll('.matching-def').forEach(d => d.classList.remove('matching-active'));

    redrawMatchingLines();

    // Enable submit if all pairs are matched
    const question = quizQuestions[currentQuestionIndex];
    document.getElementById('submit-btn').disabled =
        Object.keys(matchingUserPairs).length < question.pairs.length;
}

function redrawMatchingLines() {
    const svg     = document.getElementById('matching-svg');
    const wrapper = document.getElementById('matching-wrapper');
    if (!svg || !wrapper) return;

    const wRect = wrapper.getBoundingClientRect();
    svg.setAttribute('width',  wRect.width);
    svg.setAttribute('height', wRect.height);
    svg.innerHTML = '';

    const colors = ['#667eea', '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fb923c'];
    let colorIndex = 0;

    Object.keys(matchingUserPairs).forEach(term => {
        const match   = matchingUserPairs[term];
        const termEl  = document.querySelector(`.matching-term[data-term="${CSS.escape(term)}"]`);
        const defEl   = document.querySelector(`.matching-def[data-match="${CSS.escape(match)}"]`);
        if (!termEl || !defEl) return;

        const tRect   = termEl.getBoundingClientRect();
        const dRect   = defEl.getBoundingClientRect();

        const x1 = tRect.right  - wRect.left;
        const y1 = tRect.top    + tRect.height / 2 - wRect.top;
        const x2 = dRect.left   - wRect.left;
        const y2 = dRect.top    + dRect.height / 2 - wRect.top;

        const cx1 = x1 + (x2 - x1) * 0.4;
        const cx2 = x2 - (x2 - x1) * 0.4;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`);
        path.setAttribute('stroke', colors[colorIndex % colors.length]);
        path.setAttribute('stroke-width', '2.5');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        path.style.filter = `drop-shadow(0 0 4px ${colors[colorIndex % colors.length]}80)`;
        svg.appendChild(path);
        colorIndex++;
    });
}

// ─── Answer selection ─────────────────────────────────────────────────────────
function selectAnswer(answer, btn) {
    userAnswer = answer;
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('submit-btn').disabled = false;
}

function selectMultipleAnswers(label, checkbox) {
    label.classList.toggle('selected', checkbox.checked);
    const checkboxes = document.querySelectorAll('#options-container input[type="checkbox"]');
    userAnswers = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    document.getElementById('submit-btn').disabled = userAnswers.length === 0;
}

// ─── Answer checking ──────────────────────────────────────────────────────────
function checkAnswer() {
    const question  = quizQuestions[currentQuestionIndex];
    let isCorrect   = false;
    let feedbackExtra = '';

    if (question.type === 'multi') {
        const correct = [...question.a].sort();
        isCorrect = JSON.stringify(correct) === JSON.stringify([...userAnswers].sort());
    } else if (question.type === 'matching') {
        isCorrect = question.pairs.every(p => matchingUserPairs[p.term] === p.match);

        // Build pair-by-pair feedback
        feedbackExtra = '<div class="matching-feedback-pairs">';
        question.pairs.forEach(p => {
            const userMatch = matchingUserPairs[p.term] || '(not matched)';
            const pairOk    = userMatch === p.match;
            feedbackExtra += `
                <div class="matching-feedback-row ${pairOk ? 'pair-correct' : 'pair-wrong'}">
                    <span class="pair-icon">${pairOk ? '✓' : '✗'}</span>
                    <span class="pair-term">${p.term}</span>
                    <span class="pair-arrow">→</span>
                    <span class="pair-answer">${pairOk ? p.match : `<span class="pair-user">${userMatch}</span> <span class="pair-correct-ans">(correct: ${p.match})</span>`}</span>
                </div>`;
        });
        feedbackExtra += '</div>';
    } else {
        isCorrect = userAnswer.trim() === question.a;
    }

    if (isCorrect) score++;

    // Mark as answered
    const originalIndex = allQuestions[currentFormative].findIndex(q => q.q === question.q);
    if (originalIndex !== -1 && !answeredQuestions[currentFormative].includes(originalIndex)) {
        answeredQuestions[currentFormative].push(originalIndex);
        saveProgress();
    }

    // Disable matching items
    if (question.type === 'matching') {
        document.querySelectorAll('.matching-item').forEach(el => {
            el.style.pointerEvents = 'none';
        });
    }

    // Build feedback HTML
    let feedbackHTML = `
        <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="feedback-header">
                <span class="feedback-icon">${isCorrect ? '✓' : '✗'}</span>
                <span class="feedback-title">${isCorrect ? 'Correct!' : 'Incorrect'}</span>
            </div>`;

    if (!isCorrect && question.type !== 'matching') {
        if (question.type === 'multi') {
            feedbackHTML += `
                <div class="feedback-text">
                    <p>Your answer: <span class="feedback-answer">${userAnswers.length > 0 ? userAnswers.join(', ') : '(no answer)'}</span></p>
                    <p>Correct answer: <span class="feedback-answer">${question.a.join(', ')}</span></p>
                </div>`;
        } else {
            feedbackHTML += `
                <div class="feedback-text">
                    <p>Your answer: <span class="feedback-answer">${userAnswer || '(no answer)'}</span></p>
                    <p>Correct answer: <span class="feedback-answer">${question.a}</span></p>
                </div>`;
        }
    }

    if (question.type === 'matching') {
        feedbackHTML += feedbackExtra;
    }

    feedbackHTML += '</div>';
    document.getElementById('feedback-container').innerHTML = feedbackHTML;

    document.getElementById('submit-btn').classList.add('hidden');
    const nextBtn = document.getElementById('next-btn');
    nextBtn.classList.remove('hidden');
    if (currentQuestionIndex === quizQuestions.length - 1) {
        nextBtn.textContent = 'View Results';
    }
}

function nextQuestion() {
    window.removeEventListener('resize', redrawMatchingLines);
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        showResults();
    }
}

// ─── Results ──────────────────────────────────────────────────────────────────
function showResults() {
    const pct = (score / quizQuestions.length) * 100;
    let icon = '📚', message = 'Keep studying and try again!';
    if (pct >= 90) { icon = '🎉'; message = 'Outstanding! You really know your stuff!'; }
    else if (pct >= 75) { icon = '👍'; message = "Great job! You're doing well!"; }
    else if (pct >= 50) { icon = '👏'; message = 'Good effort! Keep practicing.'; }

    document.getElementById('results-icon').textContent    = icon;
    document.getElementById('results-score').textContent   = `${score} / ${quizQuestions.length}`;
    document.getElementById('results-message').textContent = message;
    showScreen('results');
    updateFormativeDisplay(currentFormative);
}

function retakeQuiz() { startQuiz(currentFormative); }

function backToMenu() {
    window.removeEventListener('resize', redrawMatchingLines);
    showScreen('menu');
    if (currentFormative) updateFormativeDisplay(currentFormative);
    currentFormative = null;
}

// ─── View all questions ───────────────────────────────────────────────────────
function viewAllQuestions(key) {
    if (!loadedFormatives.has(key)) {
        alert('Failed to load. Check if the JSON file exists in the data/ folder.');
        return;
    }

    currentFormative = key;
    const questions  = allQuestions[key];
    const a          = ASSESSMENTS.find(x => x.key === key);

    document.getElementById('view-formative-number').textContent = a ? a.label : key;
    const list = document.getElementById('questions-list');
    list.innerHTML = '';

    questions.forEach((question, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';

        let imgHTML    = '';
        let answerHTML = '';

        if (question.img) {
            imgHTML = `<img src="assets/${question.img}" alt="Question image" class="question-image-view" />`;
        }

        if (question.type === 'tf' || question.type === 'text') {
            answerHTML = `
                <div class="answer-section">
                    <span class="answer-label">Correct Answer:</span>
                    <div class="answer-text">${question.a}</div>
                </div>`;
        } else if (question.type === 'mc') {
            answerHTML = `
                <div class="answer-section">
                    <span class="answer-label">Correct Answer:</span>
                    <div class="answer-text">${question.a}</div>
                    <div class="options-list">
                        ${question.opts.map(opt =>
                            `<div class="option-item ${opt === question.a ? 'correct-option' : ''}">${opt}</div>`
                        ).join('')}
                    </div>
                </div>`;
        } else if (question.type === 'multi') {
            answerHTML = `
                <div class="answer-section">
                    <span class="answer-label">Correct Answers:</span>
                    <div class="answer-text">${question.a.join(', ')}</div>
                    <div class="options-list">
                        ${question.opts.map(opt =>
                            `<div class="option-item ${question.a.includes(opt) ? 'correct-option' : ''}">${opt}</div>`
                        ).join('')}
                    </div>
                </div>`;
        } else if (question.type === 'matching') {
            answerHTML = `
                <div class="answer-section">
                    <span class="answer-label">Correct Pairs:</span>
                    <div class="matching-view-pairs">
                        ${question.pairs.map(p => `
                            <div class="matching-view-row">
                                <span class="matching-view-term">${p.term}</span>
                                <span class="matching-view-arrow">→</span>
                                <span class="matching-view-def">${p.match}</span>
                            </div>`).join('')}
                    </div>
                </div>`;
        }

        item.innerHTML = `
            <div class="question-header">
                <div class="question-number">Q${index + 1}</div>
                <div class="question-text-view">${question.q}</div>
            </div>
            ${imgHTML}
            ${answerHTML}
        `;
        list.appendChild(item);
    });

    showScreen('view-questions');
}

// ─── Persistence ──────────────────────────────────────────────────────────────
function saveProgress() {
    try { localStorage.setItem('quizProgress_v2', JSON.stringify(answeredQuestions)); }
    catch (e) { console.error('Failed to save progress:', e); }
}

function loadProgress() {
    try {
        const saved = localStorage.getItem('quizProgress_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            ASSESSMENTS.forEach(a => {
                answeredQuestions[a.key] = Array.isArray(parsed[a.key]) ? parsed[a.key] : [];
            });
        } else {
            ASSESSMENTS.forEach(a => { answeredQuestions[a.key] = []; });
        }
    } catch (e) {
        console.error('Failed to load progress:', e);
        ASSESSMENTS.forEach(a => { answeredQuestions[a.key] = []; });
    }
}

// ─── Screen management ────────────────────────────────────────────────────────
function showScreen(screen) {
    ['menu', 'quiz', 'results', 'view-questions'].forEach(s =>
        document.getElementById(`${s}-screen`).classList.add('hidden')
    );
    document.getElementById(`${screen}-screen`).classList.remove('hidden');
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
loadFormatives();