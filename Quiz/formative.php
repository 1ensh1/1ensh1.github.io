<?php 
include 'includes/config.php';
include 'includes/functions.php';

$subject_id = intval($_GET['subject_id'] ?? 0);
$subject = getSubjectById($subject_id);

if (!$subject) {
    header("Location: quiz.php");
    exit();
}

$formatives = getFormativesBySubject($subject_id);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Select Formative</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container">
        <h1 class="neon-text">Select Formative for <?= htmlspecialchars($subject['name']) ?></h1>
        <div class="formative-list">
            <?php for ($i = 1; $i <= 4; $i++): ?>
                <?php 
                $formativeExists = false;
                foreach ($formatives as $formative) {
                    if ($formative['number'] == $i) {
                        $formativeExists = true;
                        break;
                    }
                }
                ?>
                <a href="<?= $formativeExists ? "take_quiz.php?subject_id=$subject_id&formative=$i" : '#' ?>" 
                   class="neon-button <?= !$formativeExists ? 'disabled' : '' ?>">
                    Formative <?= $i ?>
                    <?php if (!$formativeExists): ?>
                        <span class="tooltip">Not available yet</span>
                    <?php endif; ?>
                </a>
            <?php endfor; ?>
        </div>
        <a href="quiz.php" class="back-button">Back to Subjects</a>
    </div>
    <script src="assets/js/script.js"></script>
</body>
</html>