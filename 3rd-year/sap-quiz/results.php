<?php
session_start();

// Check if quiz is set in URL
if (!isset($_GET['quiz'])) {
    header('Location: index.php');
    exit();
}

$quiz = $_GET['quiz'];

// Redirect if quiz not started properly
if (!isset($_SESSION['quiz_complete']) || $_SESSION['quiz'] !== $quiz) {
    header('Location: index.php');
    exit();
}

$total_questions = isset($_SESSION['current_quiz_questions']) ? count($_SESSION['current_quiz_questions']) : 0;
$score = isset($_SESSION['score']) ? $_SESSION['score'] : 0;
$percentage = $total_questions > 0 ? round(($score / $total_questions) * 100) : 0;

// Determine performance message
if ($total_questions === 0) {
    $performance = "No questions available!";
} elseif ($percentage >= 80) {
    $performance = "Excellent!";
} elseif ($percentage >= 60) {
    $performance = "Good job!";
} elseif ($percentage >= 40) {
    $performance = "Not bad!";
} else {
    $performance = "Keep practicing!";
}

// Clear session data
unset($_SESSION['quiz_complete']);
unset($_SESSION['quiz']);
unset($_SESSION['current_question']);
unset($_SESSION['score']);
unset($_SESSION['answers']);
unset($_SESSION['current_quiz_questions']);
unset($_SESSION['current_quiz_indices']);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz Results</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Quiz Results</h1>
        
        <div class="results-container">
            <?php if ($total_questions > 0): ?>
                <div class="score">Your Score: <?php echo $score; ?>/<?php echo $total_questions; ?> (<?php echo $percentage; ?>%)</div>
            <?php endif; ?>
            <p><?php echo $performance; ?></p>
            
            <div class="question-pool-status">
                <?php 
                $all_questions = include "questions/$quiz.php";
                $total_available = count($all_questions) - count($_SESSION['answered_questions']);
                echo "Questions remaining in pool: " . max(0, $total_available);
                ?>
            </div>
            
            <a href="quiz.php?quiz=<?php echo $quiz; ?>" class="restart-btn">Take Quiz Again</a>
            <a href="index.php" class="restart-btn">Choose Another Quiz</a>
        </div>
    </div>
</body>
</html>