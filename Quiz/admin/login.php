<?php
include '../includes/config.php';
include '../includes/auth.php';

if (isLoggedIn()) {
    header("Location: dashboard.php");
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
        login();
        header("Location: dashboard.php");
        exit();
    } else {
        $error = "Invalid username or password";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>
    <div class="container admin-login">
        <h1 class="neon-text">Admin Login</h1>
        
        <?php if (isset($error)): ?>
            <div class="error-message"><?= $error ?></div>
        <?php endif; ?>
        
        <form action="login.php" method="POST">
            <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="neon-button">Login</button>
        </form>
    </div>
    <script src="../assets/js/script.js"></script>
</body>
</html>