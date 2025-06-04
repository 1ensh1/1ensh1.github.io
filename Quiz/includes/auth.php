<?php
session_start();

function isLoggedIn() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function login() {
    $_SESSION['admin_logged_in'] = true;
}

function logout() {
    session_unset();
    session_destroy();
}
?>