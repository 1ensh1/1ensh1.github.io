<?php
include '../includes/config.php';
include '../includes/auth.php';

if (!isLoggedIn()) {
    header("Location: login.php");
    exit();
}

$subject_id = intval($_GET['subject_id'] ?? 0);
$formative_num = intval($_GET['formative'] ?? 0);

// Validate inputs
if ($subject_id < 1 || $formative_num < 1 || $formative_num > 4) {
    header("Location: dashboard.php");
    exit();
}

$subject = getSubjectById($subject_id);
$formative = getFormative($subject_id, $formative_num);

if (!$subject || !$formative) {
    header("Location: dashboard.php");
    exit();
}

$questions = getQuestions($subject_id, $formative_num);

// Handle question deletion
if (isset($_GET['delete'])) {
    $question_id = intval($_GET['delete']);
    
    if (isset($questions[$question_id])) {
        unset($questions[$question_id]);
        saveQuestions($subject_id, $formative_num, $questions);
        $success = "Question deleted successfully";
    }
    
    // Redirect to avoid resubmission
    header("Location: manage_questions.php?subject_id=$subject_id&formative=$formative_num");
    exit();
}

// Handle question addition/editing
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $question_data = [
        'id' => uniqid(),
        'question' => trim($_POST['question'] ?? ''),
        'option_a' => trim($_POST['option_a'] ?? ''),
        'option_b' => trim($_POST['option_b'] ?? ''),
        'option_c' => trim($_POST['option_c'] ?? ''),
        'option_d' => trim($_POST['option_d'] ?? ''),
        'correct_answer' => strtolower(trim($_POST['correct_answer'] ?? ''))
    ];
    
    // Validate inputs
    $errors = [];
    if (empty($question_data['question'])) $errors[] = "Question text is required";
    if (empty($question_data['option_a'])) $errors[] = "Option A is required";
    if (empty($question_data['option_b'])) $errors[] = "Option B is required";
    if (empty($question_data['option_c'])) $errors[] = "Option C is required";
    if (empty($question_data['option_d'])) $errors[] = "Option D is required";
    if (!in_array($question_data['correct_answer'], ['a', 'b', 'c', 'd'])) $errors[] = "Please select a correct answer";
    
    if (empty($errors)) {
        if (isset($_POST['edit_id'])) {
            // Editing existing question
            $edit_id = $_POST['edit_id'];
            if (isset($questions[$edit_id])) {
                $questions[$edit_id] = $question_data;
                $success = "Question updated successfully";
            }
        } else {
            // Adding new question
            $questions[] = $question_data;
            $success = "Question added successfully";
        }
        
        saveQuestions($subject_id, $formative_num, $questions);
    } else {
        $error = implode("<br>", $errors);
    }
}

// Get question for editing if requested
$edit_question = null;
if (isset($_GET['edit'])) {
    $edit_id = $_GET['edit'];
    if (isset($questions[$edit_id])) {
        $edit_question = $questions[$edit_id];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Questions</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="container admin-form">
        <h1 class="neon-text">Manage Questions</h1>
        <h2 class="subject-title"><?= htmlspecialchars($subject['name']) ?> - Formative <?= $formative_num ?></h2>
        
        <?php if (isset($error)): ?>
            <div class="error-message"><?= $error ?></div>
        <?php endif; ?>
        
        <?php if (isset($success)): ?>
            <div class="success-message"><?= $success ?></div>
        <?php endif; ?>
        
        <!-- Question Form -->
        <div class="question-form">
            <h3><?= $edit_question ? 'Edit Question' : 'Add New Question' ?></h3>
            <form action="manage_questions.php?subject_id=<?= $subject_id ?>&formative=<?= $formative_num ?>" method="POST">
                <?php if ($edit_question): ?>
                    <input type="hidden" name="edit_id" value="<?= $_GET['edit'] ?>">
                <?php endif; ?>
                
                <div class="form-group">
                    <label for="question">Question Text</label>
                    <textarea id="question" name="question" required><?= $edit_question ? htmlspecialchars($edit_question['question']) : '' ?></textarea>
                </div>
                
                <div class="form-group">
                    <label for="option_a">Option A</label>
                    <input type="text" id="option_a" name="option_a" value="<?= $edit_question ? htmlspecialchars($edit_question['option_a']) : '' ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="option_b">Option B</label>
                    <input type="text" id="option_b" name="option_b" value="<?= $edit_question ? htmlspecialchars($edit_question['option_b']) : '' ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="option_c">Option C</label>
                    <input type="text" id="option_c" name="option_c" value="<?= $edit_question ? htmlspecialchars($edit_question['option_c']) : '' ?>" required>
                </div>
                
                <div class="form-group">
                    <label for="option_d">Option D</label>
                    <input type="text" id="option_d" name="option_d" value="<?= $edit_question ? htmlspecialchars($edit_question['option_d']) : '' ?>" required>
                </div>
                
                <div class="form-group">
                    <label>Correct Answer</label>
                    <div class="correct-answer-options">
                        <label><input type="radio" name="correct_answer" value="a" <?= $edit_question && $edit_question['correct_answer'] == 'a' ? 'checked' : '' ?> required> A</label>
                        <label><input type="radio" name="correct_answer" value="b" <?= $edit_question && $edit_question['correct_answer'] == 'b' ? 'checked' : '' ?>> B</label>
                        <label><input type="radio" name="correct_answer" value="c" <?= $edit_question && $edit_question['correct_answer'] == 'c' ? 'checked' : '' ?>> C</label>
                        <label><input type="radio" name="correct_answer" value="d" <?= $edit_question && $edit_question['correct_answer'] == 'd' ? 'checked' : '' ?>> D</label>
                    </div>
                </div>
                
                <button type="submit" class="neon-button"><?= $edit_question ? 'Update Question' : 'Add Question' ?></button>
                
                <?php if ($edit_question): ?>
                    <a href="manage_questions.php?subject_id=<?= $subject_id ?>&formative=<?= $formative_num ?>" class="neon-button cancel-edit">Cancel Edit</a>
                <?php endif; ?>
            </form>
        </div>
        
        <!-- Questions List -->
        <div class="questions-list">
            <h3>Existing Questions (<?= count($questions) ?>)</h3>
            
            <?php if (empty($questions)): ?>
                <p class="no-questions">No questions yet. Add your first question above.</p>
            <?php else: ?>
                <div class="question-items">
                    <?php foreach ($questions as $index => $question): ?>
                        <div class="question-item">
                            <div class="question-header">
                                <span class="question-number">Q<?= $index + 1 ?></span>
                                <span class="correct-answer">Correct: <?= strtoupper($question['correct_answer']) ?></span>
                                <div class="question-actions">
                                    <a href="manage_questions.php?subject_id=<?= $subject_id ?>&formative=<?= $formative_num ?>&edit=<?= $index ?>" class="edit-btn">Edit</a>
                                    <a href="manage_questions.php?subject_id=<?= $subject_id ?>&formative=<?= $formative_num ?>&delete=<?= $index ?>" class="delete-btn" onclick="return confirm('Are you sure you want to delete this question?')">Delete</a>
                                </div>
                            </div>
                            <div class="question-text"><?= htmlspecialchars($question['question']) ?></div>
                            <div class="question-options">
                                <div class="option <?= $question['correct_answer'] == 'a' ? 'correct' : '' ?>">A. <?= htmlspecialchars($question['option_a']) ?></div>
                                <div class="option <?= $question['correct_answer'] == 'b' ? 'correct' : '' ?>">B. <?= htmlspecialchars($question['option_b']) ?></div>
                                <div class="option <?= $question['correct_answer'] == 'c' ? 'correct' : '' ?>">C. <?= htmlspecialchars($question['option_c']) ?></div>
                                <div class="option <?= $question['correct_answer'] == 'd' ? 'correct' : '' ?>">D. <?= htmlspecialchars($question['option_d']) ?></div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        
        <a href="dashboard.php" class="back-button">Back to Dashboard</a>
    </div>
    <script src="../assets/js/script.js"></script>
</body>
</html>