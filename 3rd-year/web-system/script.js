let currentFormative = null;
let allQuestions = {};
let answeredQuestions = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: []};
let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswer = '';
let userAnswers = [];
let score = 0;
let loadedFormatives = new Set();

async function loadFormatives() {
    // Load saved progress first
    loadProgress();
    
    for (let i = 1; i <= 8; i++) {
        try {
            const response = await fetch(`formative${i}.json`);
            
            if (!response.ok) {
                console.error(`Failed to load formative${i}.json: ${response.status} ${response.statusText}`);
                updateFormativeDisplay(i, true); // Show error state
                continue;
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                console.error(`Invalid data in formative${i}.json`);
                updateFormativeDisplay(i, true);
                continue;
            }
            
            allQuestions[i] = data;
            loadedFormatives.add(i);
            updateFormativeDisplay(i);
            
        } catch (error) {
            console.error(`Error loading formative${i}.json:`, error);
            updateFormativeDisplay(i, true);
        }
    }
}

function updateFormativeDisplay(formativeNum, hasError = false) {
    const countElement = document.getElementById(`f${formativeNum}-count`);
    const statusElement = document.getElementById(`f${formativeNum}-status`);
    const resetBtn = document.getElementById(`f${formativeNum}-reset`);
    const viewBtn = document.getElementById(`f${formativeNum}-view`);
    
    if (hasError || !allQuestions[formativeNum]) {
        countElement.textContent = 'Failed to load';
        countElement.style.color = '#ef4444';
        statusElement.innerHTML = '<span style="color: #ef4444; font-size: 0.9rem;">Check if JSON file exists</span>';
        resetBtn.classList.add('hidden');
        viewBtn.classList.add('hidden');
        return;
    }
    
    const totalQuestions = allQuestions[formativeNum].length;
    const answeredCount = answeredQuestions[formativeNum].length;
    const unansweredCount = totalQuestions - answeredCount;
    
    if (unansweredCount === 0) {
        countElement.textContent = `All ${totalQuestions} questions answered!`;
        countElement.style.color = '#ffffff';
        statusElement.innerHTML = '<span class="completed-badge">✓ Completed</span>';
        resetBtn.classList.remove('hidden');
    } else {
        countElement.textContent = `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} available`;
        countElement.style.color = '#ffffff';
        if (answeredCount > 0) {
            statusElement.textContent = `(${answeredCount} answered)`;
            statusElement.style.color = '#9ca3af';
        } else {
            statusElement.textContent = '';
        }
        resetBtn.classList.add('hidden');
    }
    
    viewBtn.classList.remove('hidden');
}

function resetFormative(formativeNum) {
    if (confirm(`Are you sure you want to reset Formative ${formativeNum}? This will allow you to answer all questions again.`)) {
        answeredQuestions[formativeNum] = [];
        updateFormativeDisplay(formativeNum);
        saveProgress();
    }
}

function resetCurrentQuiz() {
    if (currentFormative && confirm(`Are you sure you want to reset Formative ${currentFormative}? This will exit the current quiz and clear all progress for this formative.`)) {
        answeredQuestions[currentFormative] = [];
        saveProgress();
        backToMenu();
    }
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function startQuiz(formativeNum) {
    if (!loadedFormatives.has(formativeNum)) {
        alert(`Formative ${formativeNum} failed to load. Please check if formative${formativeNum}.json exists in the same folder as index.html`);
        return;
    }
    
    currentFormative = formativeNum;
    const allQuestionsForFormative = allQuestions[formativeNum];
    
    const unansweredQuestions = allQuestionsForFormative.filter((q, index) => {
        return !answeredQuestions[formativeNum].includes(index);
    });
    
    if (unansweredQuestions.length === 0) {
        alert('You have answered all questions in this formative! Click "Reset Quiz" to start over.');
        return;
    }
    
    const shuffled = shuffleArray(unansweredQuestions);
    const questionsToTake = Math.min(20, unansweredQuestions.length);
    quizQuestions = shuffled.slice(0, questionsToTake);
    
    currentQuestionIndex = 0;
    score = 0;
    userAnswer = '';
    userAnswers = [];
    showScreen('quiz');
    displayQuestion();
}

function displayQuestion() {
    const question = quizQuestions[currentQuestionIndex];
    document.getElementById('current-formative').textContent = currentFormative;
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = quizQuestions.length;
    document.getElementById('question-text').textContent = question.q;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    if (question.type === 'tf') {
        ['True', 'False'].forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => selectAnswer(opt, btn);
            optionsContainer.appendChild(btn);
        });
    } else if (question.type === 'mc') {
        question.opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.onclick = () => selectAnswer(opt, btn);
            optionsContainer.appendChild(btn);
        });
    } else if (question.type === 'multi') {
        const instruction = document.createElement('p');
        instruction.className = 'multi-instruction';
        instruction.textContent = '(Select all that apply)';
        optionsContainer.appendChild(instruction);
        
        question.opts.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'checkbox-option';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = opt;
            checkbox.onchange = () => selectMultipleAnswers(label, checkbox);
            
            const text = document.createElement('span');
            text.textContent = opt;
            
            label.appendChild(checkbox);
            label.appendChild(text);
            label.onclick = (e) => {
                if (e.target !== checkbox) {
                    checkbox.checked = !checkbox.checked;
                    selectMultipleAnswers(label, checkbox);
                }
            };
            optionsContainer.appendChild(label);
        });
    } else if (question.type === 'text') {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'text-input';
        input.placeholder = 'Type your answer...';
        input.oninput = (e) => {
            userAnswer = e.target.value;
            document.getElementById('submit-btn').disabled = !userAnswer.trim();
        };
        optionsContainer.appendChild(input);
    }
    
    document.getElementById('feedback-container').innerHTML = '';
    document.getElementById('submit-btn').classList.remove('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('submit-btn').disabled = true;
    userAnswer = '';
    userAnswers = [];
}

function selectMultipleAnswers(label, checkbox) {
    if (checkbox.checked) {
        label.classList.add('selected');
    } else {
        label.classList.remove('selected');
    }
    
    const checkboxes = document.querySelectorAll('#options-container input[type="checkbox"]');
    userAnswers = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    document.getElementById('submit-btn').disabled = userAnswers.length === 0;
}

function selectAnswer(answer, btn) {
    userAnswer = answer;
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('submit-btn').disabled = false;
}

function checkAnswer() {
    const question = quizQuestions[currentQuestionIndex];
    let isCorrect = false;
    
    if (question.type === 'multi') {
        const correctAnswers = [...question.a].sort();
        const userSorted = [...userAnswers].sort();
        isCorrect = JSON.stringify(correctAnswers) === JSON.stringify(userSorted);
    } else {
        isCorrect = userAnswer.trim() === question.a;
    }
    
    if (isCorrect) score++;
    
    // Find the original index of this question in the formative
    const originalIndex = allQuestions[currentFormative].findIndex(q => q.q === question.q);
    
    // Only add to answered questions if not already there
    if (originalIndex !== -1 && !answeredQuestions[currentFormative].includes(originalIndex)) {
        answeredQuestions[currentFormative].push(originalIndex);
        saveProgress();
    }
    
    const feedbackContainer = document.getElementById('feedback-container');
    let feedbackHTML = `
        <div class="feedback ${isCorrect ? 'correct' : 'incorrect'}">
            <div class="feedback-header">
                <span class="feedback-icon">${isCorrect ? '✓' : '✗'}</span>
                <span class="feedback-title">${isCorrect ? 'Correct!' : 'Incorrect'}</span>
            </div>
    `;
    
    if (!isCorrect) {
        if (question.type === 'multi') {
            feedbackHTML += `
                <div class="feedback-text">
                    <p>Your answer: <span class="feedback-answer">${userAnswers.length > 0 ? userAnswers.join(', ') : '(no answer)'}</span></p>
                    <p>Correct answer: <span class="feedback-answer">${question.a.join(', ')}</span></p>
                </div>
            `;
        } else {
            feedbackHTML += `
                <div class="feedback-text">
                    <p>Your answer: <span class="feedback-answer">${userAnswer || '(no answer)'}</span></p>
                    <p>Correct answer: <span class="feedback-answer">${question.a}</span></p>
                </div>
            `;
        }
    }
    
    feedbackHTML += '</div>';
    feedbackContainer.innerHTML = feedbackHTML;
    
    document.getElementById('submit-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
    
    if (currentQuestionIndex === quizQuestions.length - 1) {
        document.getElementById('next-btn').textContent = 'View Results';
    }
}

function nextQuestion() {
    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const percentage = (score / quizQuestions.length) * 100;
    let icon = '📚';
    let message = 'Keep studying and try again!';
    
    if (percentage >= 90) {
        icon = '🎉';
        message = 'Outstanding! You really know your stuff!';
    } else if (percentage >= 75) {
        icon = '👍';
        message = 'Great job! You\'re doing well!';
    } else if (percentage >= 50) {
        icon = '👏';
        message = 'Good effort! Keep practicing.';
    }
    
    document.getElementById('results-icon').textContent = icon;
    document.getElementById('results-score').textContent = `${score} / ${quizQuestions.length}`;
    document.getElementById('results-message').textContent = message;
    showScreen('results');
    
    updateFormativeDisplay(currentFormative);
}

function retakeQuiz() {
    startQuiz(currentFormative);
}

function backToMenu() {
    showScreen('menu');
    if (currentFormative) {
        updateFormativeDisplay(currentFormative);
    }
    currentFormative = null;
}

function saveProgress() {
    try {
        localStorage.setItem('quizProgress', JSON.stringify(answeredQuestions));
    } catch (error) {
        console.error('Failed to save progress:', error);
    }
}

function loadProgress() {
    try {
        const saved = localStorage.getItem('quizProgress');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure all formatives have arrays
            for (let i = 1; i <= 8; i++) {
                if (Array.isArray(parsed[i])) {
                    answeredQuestions[i] = parsed[i];
                }
            }
        }
    } catch (error) {
        console.error('Failed to load progress:', error);
        answeredQuestions = {1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: []};
    }
}

function showScreen(screen) {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById('view-questions-screen').classList.add('hidden');
    document.getElementById(`${screen}-screen`).classList.remove('hidden');
}

function viewAllQuestions(formativeNum) {
    if (!loadedFormatives.has(formativeNum)) {
        alert(`Formative ${formativeNum} failed to load. Please check if formative${formativeNum}.json exists.`);
        return;
    }
    
    currentFormative = formativeNum;
    const questions = allQuestions[formativeNum];
    
    document.getElementById('view-formative-number').textContent = formativeNum;
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        
        let answerHTML = '';
        
        if (question.type === 'tf' || question.type === 'text') {
            answerHTML = `
                <div class="answer-section">
                    <span class="answer-label">Correct Answer:</span>
                    <div class="answer-text">${question.a}</div>
                </div>
            `;
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
                </div>
            `;
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
                </div>
            `;
        }
        
        questionItem.innerHTML = `
            <div class="question-header">
                <div class="question-number">Q${index + 1}</div>
                <div class="question-text-view">${question.q}</div>
            </div>
            ${answerHTML}
        `;
        
        questionsList.appendChild(questionItem);
    });
    
    showScreen('view-questions');
}

// Initialize on page load
loadFormatives();