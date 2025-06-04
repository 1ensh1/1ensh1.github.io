<?php
include '../includes/config.php';
include '../includes/auth.php';

if (!isLoggedIn()) {
    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="container admin-dashboard">
        <h1 class="neon-text">Admin Dashboard</h1>
        
        <div class="admin-nav">
            <a href="create_subject.php" class="neon-button">Create Subject</a>
            <a href="create_formative.php" class="neon-button">Create Formative</a>
            <a href="manage_questions.php" class="neon-button">Manage Questions</a>
            <a href="logout.php" class="neon-button">Logout</a>
        </div>
        
        <div class="admin-stats">
            <div class="stat-card">
                <h3>Subjects</h3>
                <p><?= count(getSubjects()) ?></p>
            </div>
            
            <div class="stat-card">
                <h3>Total Questions</h3>
                <p><?= countAllQuestions() ?></p>
            </div>
        </div>
    </div>
    <script src="../assets/js/script.js"></script>
</body>
</html>