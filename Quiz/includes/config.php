<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'quiz_db');

// Admin credentials
define('ADMIN_USERNAME', 'admin');
define('ADMIN_PASSWORD', 'Admin@123'); // You should change this

// Create connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Create tables if they don't exist
$sql = "CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

$conn->query($sql);

$sql = "CREATE TABLE IF NOT EXISTS formatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
)";

$conn->query($sql);

// Create data directory if it doesn't exist
if (!file_exists('data')) {
    mkdir('data', 0777, true);
}
?>