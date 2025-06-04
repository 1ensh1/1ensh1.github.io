<?php
include '../includes/config.php';
include '../includes/auth.php';

if (!isLoggedIn()) {
    header("Location: login.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $subject_name = trim($_POST['subject_name'] ?? '');
    
    if (empty($subject_name)) {
        $error = "Subject name cannot be empty";
    } else {
        // Check if subject already exists
        $stmt = $conn->prepare("SELECT id FROM subjects WHERE name = ?");
        $stmt->bind_param("s", $subject_name);
        $stmt->execute();
        $stmt->store_result();
        
        if ($stmt->num_rows > 0) {
            $error = "Subject already exists";
        } else {
            $stmt = $conn->prepare("INSERT INTO subjects (name) VALUES (?)");
            $stmt->bind_param("s", $subject_name);
            
            if ($stmt->execute()) {
                $success = "Subject created successfully";
            } else {
                $error = "Error creating subject: " . $conn->error;
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create Subject</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="container admin-form">
        <h1 class="neon-text">Create New Subject</h1>
        
        <?php if (isset($error)): ?>
            <div class="error-message"><?= $error ?></div>
        <?php endif; ?>
        
        <?php if (isset($success)): ?>
            <div class="success-message"><?= $success ?></div>
        <?php endif; ?>
        
        <form action="create_subject.php" method="POST">
            <div class="form-group">
                <label for="subject_name">Subject Name</label>
                <input type="text" id="subject_name" name="subject_name" required>
            </div>
            
            <button type="submit" class="neon-button">Create Subject</button>
        </form>
        
        <a href="dashboard.php" class="back-button">Back to Dashboard</a>
    </div>
    <script src="../assets/js/script.js"></script>
</body>
</html>