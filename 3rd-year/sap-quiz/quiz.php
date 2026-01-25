<?php
session_start();
include 'includes/functions.php';

// Check if quiz parameter is set
if (!isset($_GET['quiz']) || !in_array($_GET['quiz'], ['formative1', 'formative2', 'formative3', 'formative4', 'formative5'])) {
    header('Location: index.php');
    exit();
}

$quiz = $_GET['quiz'];
$all_questions = include "questions/$quiz.php";

// Initialize session array if not exists
if (!isset($_SESSION['answered_questions'])) {
    $_SESSION['answered_questions'] = array();
}

// Initialize or reset session variables if starting a new quiz
if (!isset($_SESSION['quiz']) || $_SESSION['quiz'] !== $quiz || !isset($_SESSION['current_quiz_questions'])) {
    $_SESSION['quiz'] = $quiz;
    $_SESSION['score'] = 0;
    $_SESSION['answers'] = array();
    
    // Get all question indices not yet answered
    $available_questions = array();
    foreach ($all_questions as $index => $question) {
        if (!in_array($index, $_SESSION['answered_questions'])) {
            $available_questions[$index] = $question;
        }
    }
    
    // Select 20 random questions (or fewer if not enough available)
    $questions_to_ask = min(20, count($available_questions));
    if ($questions_to_ask > 0) {
        $selected_indices = array_rand($available_questions, $questions_to_ask);
        if (!is_array($selected_indices)) {
            $selected_indices = array($selected_indices);
        }
        
        // Store the selected questions and their indices
        $_SESSION['current_quiz_questions'] = array();
        $_SESSION['current_quiz_indices'] = array();
        
        foreach ($selected_indices as $index) {
            $_SESSION['current_quiz_questions'][] = $all_questions[$index];
            $_SESSION['current_quiz_indices'][] = $index;
        }
    } else {
        // No questions left
        $_SESSION['current_quiz_questions'] = array();
        $_SESSION['current_quiz_indices'] = array();
    }
    
    $_SESSION['current_question'] = 0;
}

// Handle case when no questions are available
if (empty($_SESSION['current_quiz_questions'])) {
    $_SESSION['quiz_complete'] = true;
    header('Location: results.php?quiz='.$quiz);
    exit();
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['answer'])) {
    // Check if answer is correct
    $current_question_index = $_SESSION['current_question'];
    $selected_answer = $_POST['answer'];
    $correct_answer = $_SESSION['current_quiz_questions'][$current_question_index]['correct_answer'];
    
    // Store user's answer with feedback
    $_SESSION['answers'][$current_question_index] = [
        'selected' => $selected_answer,
        'correct' => $correct_answer,
        'is_correct' => ($selected_answer === $correct_answer)
    ];
    
    // Update score if correct
    if ($selected_answer === $correct_answer) {
        $_SESSION['score']++;
    }
    
    // Mark this question as answered
    $question_index = $_SESSION['current_quiz_indices'][$current_question_index];
    if (!in_array($question_index, $_SESSION['answered_questions'])) {
        $_SESSION['answered_questions'][] = $question_index;
    }
    
    // Move to next question or show results
    $_SESSION['current_question']++;
    
    if ($_SESSION['current_question'] >= count($_SESSION['current_quiz_questions'])) {
        $_SESSION['quiz_complete'] = true;
        header('Location: results.php?quiz='.$quiz);
        exit();
    }
}

// Get current question data
$current_question_index = $_SESSION['current_question'];
$current_question = $_SESSION['current_quiz_questions'][$current_question_index];
$total_questions = count($_SESSION['current_quiz_questions']);
$progress = round(($current_question_index + 1) / $total_questions * 100);

// Check if we should show feedback for previous answer
$show_feedback = false;
$feedback_message = '';
$feedback_class = '';

if ($current_question_index > 0 && isset($_SESSION['answers'][$current_question_index - 1])) {
    $show_feedback = true;
    $previous_answer = $_SESSION['answers'][$current_question_index - 1];
    
    if ($previous_answer['is_correct']) {
        $feedback_message = 'Correct!';
        $feedback_class = 'correct';
    } else {
        $feedback_message = 'Incorrect. The correct answer was: ' . $previous_answer['correct'];
        $feedback_class = 'incorrect';
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo ucfirst(str_replace('formative', 'Formative ', $quiz)); ?> Quiz</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1><?php echo ucfirst(str_replace('formative', 'Formative ', $quiz)); ?> Quiz</h1>
        
        <div class="progress-bar">
            <div class="progress" style="width: <?php echo $progress; ?>%"></div>
        </div>
        <p class="progress-text">Question <?php echo $current_question_index + 1; ?> of <?php echo $total_questions; ?></p>
        
        <?php if ($show_feedback): ?>
            <div class="feedback <?php echo $feedback_class; ?>">
                <?php echo $feedback_message; ?>
            </div>
        <?php endif; ?>
        
        <div class="quiz-container">
            <form method="post" action="quiz.php?quiz=<?php echo $quiz; ?>">
                <div class="question">
                    <div class="question-text"><?php echo $current_question['question']; ?></div>
                    
                    <div class="options">
                        <?php foreach ($current_question['options'] as $option): ?>
                            <div class="option">
                                <input type="radio" name="answer" id="option<?php echo sanitize($option); ?>" value="<?php echo sanitize($option); ?>" required>
                                <label for="option<?php echo sanitize($option); ?>"><?php echo $option; ?></label>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <button type="submit" class="submit-btn">Next Question</button>
            </form>
        </div>
    </div>
</body>
</html>