let currentFormative = null;
let allQuestions = {};
let answeredQuestions = {1: [], 2: [], 3: [], 4: [], 'midterms': []};
let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswer = '';
let userAnswers = [];
let score = 0;

async function loadFormatives() {
    try {
        // Load saved progress first
        loadProgress();
        
        // Load formative quizzes
        for (let i = 1; i <= 4; i++) {
            const response = await fetch(`formative${i}.json`);
            const data = await response.json();
            allQuestions[i] = data;
            updateFormativeDisplay(i);
        }
        
        // Load midterms quiz
        const midtermsResponse = await fetch(`midterms.json`);
        const midtermsData = await midtermsResponse.json();
        allQuestions['midterms'] = midtermsData;
        updateFormativeDisplay('midterms');
        
    } catch (error) {
        console.error('Error loading formatives:', error);
        alert('Error loading quiz data. Please make sure all JSON files are in the same folder as index.html');
    }
}

function updateFormativeDisplay(formativeNum) {
    const totalQuestions = allQuestions[formativeNum].length;
    const answeredCount = answeredQuestions[formativeNum].length;
    const unansweredCount = totalQuestions - answeredCount;
    
    const countElement = document.getElementById(`${getFormativeId(formativeNum)}-count`);
    const statusElement = document.getElementById(`${getFormativeId(formativeNum)}-status`);
    const resetBtn = document.getElementById(`${getFormativeId(formativeNum)}-reset`);
    
    if (unansweredCount === 0) {
        countElement.textContent = `All ${totalQuestions} questions answered!`;
        statusElement.innerHTML = '<span class="completed-badge">✓ Completed</span>';
        resetBtn.classList.remove('hidden');
    } else {
        countElement.textContent = `${unansweredCount} question${unansweredCount !== 1 ? 's' : ''} available`;
        if (answeredCount > 0) {
            statusElement.textContent = `(${answeredCount} answered)`;
            statusElement.style.color = '#9ca3af';
        } else {
            statusElement.textContent = '';
        }
        resetBtn.classList.add('hidden');
    }
}

function getFormativeId(formativeNum) {
    return typeof formativeNum === 'number' ? `f${formativeNum}` : formativeNum;
}

function resetFormative(formativeNum) {
    const quizName = typeof formativeNum === 'number' ? `Formative ${formativeNum}` : 'Midterms';
    if (confirm(`Are you sure you want to reset ${quizName}? This will allow you to answer all questions again.`)) {
        answeredQuestions[formativeNum] = [];
        updateFormativeDisplay(formativeNum);
        saveProgress();
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
    currentFormative = formativeNum;
    const allQuestionsForFormative = allQuestions[formativeNum];
    
    const unansweredQuestions = allQuestionsForFormative.filter((q, index) => {
        return !answeredQuestions[formativeNum].includes(index);
    });
    
    if (unansweredQuestions.length === 0) {
        const quizName = typeof formativeNum === 'number' ? `Formative ${formativeNum}` : 'Midterms';
        alert(`You have answered all questions in ${quizName}! Click "Reset All" to start over.`);
        showScreen('menu');
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
    
    // Set quiz name display
    const quizName = typeof currentFormative === 'number' ? `Formative ${currentFormative}` : 'Midterms';
    document.getElementById('current-quiz-name').textContent = quizName;
    
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('total-questions').textContent = quizQuestions.length;
    document.getElementById('question-text').textContent = question.q;
    
    // Add image if available
    const questionTextElement = document.getElementById('question-text');
    if (question.image) {
        const img = document.createElement('img');
        img.src = question.image;
        img.alt = 'Question diagram';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.marginTop = '1rem';
        img.style.borderRadius = '0.5rem';
        questionTextElement.appendChild(img);
    }
    
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
        const textarea = document.createElement('textarea');
        textarea.className = 'textarea-input';
        textarea.placeholder = 'Type your answer... (Press Enter for new lines)';
        textarea.rows = 6; // Set initial rows to make it taller
        textarea.style.resize = 'vertical'; // Allow user to resize
        textarea.oninput = (e) => {
            userAnswer = e.target.value;
            document.getElementById('submit-btn').disabled = !userAnswer.trim();
        };
        optionsContainer.appendChild(textarea);
        
        // Auto-focus the textarea
        setTimeout(() => textarea.focus(), 100);
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
        
        // Save to localStorage to persist across page refreshes
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

function resetCurrentQuizSession() {
    if (confirm('Are you sure you want to reset this quiz session? You\'ll start over with the same set of questions, but your overall progress will be preserved.')) {
        // Just restart the current quiz without affecting saved progress
        currentQuestionIndex = 0;
        score = 0;
        userAnswer = '';
        userAnswers = [];
        displayQuestion();
        alert('Quiz session reset! Starting over with the same questions...');
    }
}

function resetEntireFormative() {
    const quizName = typeof currentFormative === 'number' ? `Formative ${currentFormative}` : 'Midterms';
    if (confirm(`Are you sure you want to reset ALL progress for ${quizName}? This will clear all answered questions and you'll start completely fresh with new random questions.`)) {
        answeredQuestions[currentFormative] = [];
        
        saveProgress();
        
        updateFormativeDisplay(currentFormative);
        
        startQuiz(currentFormative);
        alert(`${quizName} has been completely reset! Starting with new questions...`);
    }
}

function showResults() {
    const percentage = (score / quizQuestions.length) * 100;
    let icon = '📚';
    let message = 'Keep studying and try again!';
    
    if (percentage >= 90) {
        icon = '🎉';
        message = 'Outstanding!';
    } else if (percentage >= 75) {
        icon = '👍';
        message = 'Great job!';
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
    const allQuestionsForFormative = allQuestions[currentFormative];
    const unansweredQuestions = allQuestionsForFormative.filter((q, index) => {
        return !answeredQuestions[currentFormative].includes(index);
    });
    
    if (unansweredQuestions.length === 0) {
        const quizName = typeof currentFormative === 'number' ? `Formative ${currentFormative}` : 'Midterms';
        const choice = confirm(`You have answered all ${allQuestionsForFormative.length} questions in ${quizName}!\n\nClick OK to reset ALL progress and start fresh\nClick Cancel to go back to menu`);
        
        if (choice) {
            answeredQuestions[currentFormative] = [];
            saveProgress();
            updateFormativeDisplay(currentFormative);
            startQuiz(currentFormative);
        } else {
            backToMenu();
        }
    } else {
        startQuiz(currentFormative);
    }
}

function backToMenu() {
    showScreen('menu');
    if (currentFormative) {
        updateFormativeDisplay(currentFormative);
    }
    currentFormative = null;
}

function saveProgress() {
    localStorage.setItem('quizProgress', JSON.stringify(answeredQuestions));
}

function loadProgress() {
    const saved = localStorage.getItem('quizProgress');
    if (saved) {
        answeredQuestions = JSON.parse(saved);
    }
}

function showScreen(screen) {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');
    document.getElementById(`${screen}-screen`).classList.remove('hidden');
}

loadFormatives();