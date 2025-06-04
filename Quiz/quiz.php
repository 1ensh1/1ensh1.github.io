<?php 
include 'includes/config.php';
include 'includes/functions.php';

$subjects = getSubjects();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Select Subject</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container">
        <h1 class="neon-text">Select a Subject</h1>
        <div class="subject-list">
            <?php if (empty($subjects)): ?>
                <p class="no-subjects">No subjects available yet.</p>
            <?php else: ?>
                <?php foreach ($subjects as $subject): ?>
                    <a href="formative.php?subject_id=<?= $subject['id'] ?>" class="neon-button subject-button">
                        <?= htmlspecialchars($subject['name']) ?>
                    </a>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        <a href="index.php" class="back-button">Back to Home</a>
    </div>
    <script src="assets/js/script.js"></script>
</body>
</html>