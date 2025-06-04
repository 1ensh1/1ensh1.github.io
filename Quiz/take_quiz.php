<?php 
include 'includes/config.php';
include 'includes/functions.php';

$subject_id = intval($_GET['subject_id'] ?? 0);
$formative_num = intval($_GET['formative'] ?? 0);

// Validate input
if ($subject_id < 1 || $formative_num < 1 || $formative_num > 4) {
    header("Location: quiz.php");
    exit();
}

$subject = getSubjectById($subject_id);
$formative = getFormative($subject_id, $formative_num);

if (!$subject || !$formative) {
    header("Location: quiz.php");
    exit();
}

// Get questions
$questions = getQuestions($subject_id, $formative_num);
$total_questions = count($questions);

// Handle quiz submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $score = 0;
    $answers = $_POST['answers'] ?? [];
    
    foreach ($answers as $q_id => $user_answer) {
        foreach ($questions as $q) {
            if ($q['id'] == $q_id && $q['correct_answer'] == $user_answer) {
                $score++;
                break;
            }
        }
    }
    
    // Save result to session
    session_start();
    $_SESSION['quiz_result'] = [
        'score' => $score,
        'total' => $total_questions,
        'subject' => $subject['name'],
        'formative' => $formative_num
    ];
    
    header("Location: quiz_result.php");
    exit();
}

// For display, shuffle questions and limit to 20
shuffle($questions);
$questions = array_slice($questions, 0, min(20, $total_questions));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($subject['name']) ?> - Formative <?= $formative_num ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container quiz-container">
        <h1 class="neon-text"><?= htmlspecialchars($subject['name']) ?> - Formative <?= $formative_num ?></h1>
        <div class="quiz-info">
            <span>Total Questions: <?= count($questions) ?></span>
        </div>
        
        <form action="take_quiz.php?subject_id=<?= $subject_id ?>&formative=<?= $formative_num ?>" method="POST">
            <div class="questions-container">
                <?php foreach ($questions as $index => $question): ?>
                    <div class="question-box" data-question-id="<?= $question['id'] ?>">
                        <div class="question-number">Question <?= $index + 1 ?></div>
                        <div class="question-text"><?= htmlspecialchars($question['question']) ?></div>
                        
                        <div class="options">
                            <?php foreach (['a', 'b', 'c', 'd'] as $option): ?>
                                <label class="option">
                                    <input type="radio" name="answers[<?= $question['id'] ?>]" value="<?= $option ?>" required>
                                    <span class="option-text"><?= htmlspecialchars($question['option_'.$option]) ?></span>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            
            <div class="quiz-actions">
                <button type="submit" class="neon-button submit-quiz">Submit Quiz</button>
            </div>
        </form>
    </div>
    <script src="assets/js/script.js"></script>
</body>
</html>