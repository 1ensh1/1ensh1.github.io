<?php
include '../includes/config.php';
include '../includes/auth.php';

if (!isLoggedIn()) {
    header("Location: login.php");
    exit();
}

$subjects = getSubjects();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $subject_id = intval($_POST['subject_id'] ?? 0);
    $formative_num = intval($_POST['formative_num'] ?? 0);
    
    // Validate inputs
    if ($subject_id < 1 || $formative_num < 1 || $formative_num > 4) {
        $error = "Invalid subject or formative number";
    } else {
        // Check if formative already exists
        $stmt = $conn->prepare("SELECT id FROM formatives WHERE subject_id = ? AND number = ?");
        $stmt->bind_param("ii", $subject_id, $formative_num);
        $stmt->execute();
        $stmt->store_result();
        
        if ($stmt->num_rows > 0) {
            $error = "This formative already exists for the selected subject";
        } else {
            $stmt = $conn->prepare("INSERT INTO formatives (subject_id, number) VALUES (?, ?)");
            $stmt->bind_param("ii", $subject_id, $formative_num);
            
            if ($stmt->execute()) {
                // Create empty questions file
                $filename = "../data/subject_{$subject_id}_formative_{$formative_num}.txt";
                if (!file_exists($filename)) {
                    file_put_contents($filename, serialize([]));
                }
                
                $success = "Formative created successfully! You can now add questions.";
                header("Location: manage_questions.php?subject_id=$subject_id&formative=$formative_num");
                exit();
            } else {
                $error = "Error creating formative: " . $conn->error;
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
    <title>Create Formative</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="container admin-form">
        <h1 class="neon-text">Create New Formative</h1>
        
        <?php if (isset($error)): ?>
            <div class="error-message"><?= $error ?></div>
        <?php endif; ?>
        
        <?php if (isset($success)): ?>
            <div class="success-message"><?= $success ?></div>
        <?php endif; ?>
        
        <form action="create_formative.php" method="POST">
            <div class="form-group">
                <label for="subject_id">Subject</label>
                <select id="subject_id" name="subject_id" required>
                    <option value="">Select a subject</option>
                    <?php foreach ($subjects as $subject): ?>
                        <option value="<?= $subject['id'] ?>" <?= isset($_POST['subject_id']) && $_POST['subject_id'] == $subject['id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($subject['name']) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="formative_num">Formative Number</label>
                <select id="formative_num" name="formative_num" required>
                    <option value="">Select formative number</option>
                    <option value="1" <?= isset($_POST['formative_num']) && $_POST['formative_num'] == 1 ? 'selected' : '' ?>>Formative 1</option>
                    <option value="2" <?= isset($_POST['formative_num']) && $_POST['formative_num'] == 2 ? 'selected' : '' ?>>Formative 2</option>
                    <option value="3" <?= isset($_POST['formative_num']) && $_POST['formative_num'] == 3 ? 'selected' : '' ?>>Formative 3</option>
                    <option value="4" <?= isset($_POST['formative_num']) && $_POST['formative_num'] == 4 ? 'selected' : '' ?>>Formative 4</option>
                </select>
            </div>
            
            <button type="submit" class="neon-button">Create Formative</button>
        </form>
        
        <a href="dashboard.php" class="back-button">Back to Dashboard</a>
    </div>
    <script src="../assets/js/script.js"></script>
</body>
</html>