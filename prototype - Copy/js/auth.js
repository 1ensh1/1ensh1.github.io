// Registration Functionality
function initRegistration() {
    const registrationForm = document.getElementById('registrationForm');
    const playerIdDisplay = document.getElementById('playerIdDisplay');
    
    // Generate random player ID
    function generatePlayerId() {
        let id = '';
        for (let i = 0; i < 3; i++) {
            id += Math.floor(1000 + Math.random() * 9000);
            if (i < 2) id += ' ';
        }
        return id;
    }
    
    // Display generated player ID
    const playerId = generatePlayerId();
    playerIdDisplay.textContent = `Your Team Rocket ID: ${playerId}`;
    
    // Form submission
    registrationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            alert("Passwords don't match!");
            return;
        }
        
        // Create user object
        const user = {
            email: document.getElementById('email').value,
            password: password,
            ign: document.getElementById('ign').value,
            playerId: playerId,
            birthday: document.getElementById('birthday').value,
            gender: document.querySelector('input[name="gender"]:checked')?.value || 'not specified',
            joinDate: new Date().toLocaleDateString(),
            lastLogin: new Date().toISOString(),
            stats: {
                pokemonCaught: 0,
                gymsDefended: 0,
                itemsPurchased: 0,
                totalSpent: 0
            }
        };
        
        // Save user to localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Save to users list
        let users = JSON.parse(localStorage.getItem('users')) || [];
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Update UI and redirect
        updateAuthUI();
        alert('Registration successful! Welcome to Team Rocket!');
        window.location.href = 'profile.html';
    });
}

// Login Functionality
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    
    // Remove any existing listeners to prevent duplicates
    loginForm.removeEventListener('submit', loginForm._submitHandler);
    
    // Create new handler
    loginForm._submitHandler = function(e) {
        e.preventDefault();
        
        const ign = document.getElementById('loginIgn').value;
        const password = document.getElementById('loginPassword').value;
        const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
        
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        // Find matching user
        const user = users.find(u => u.ign === ign && u.password === password);
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            
            // Set as current user
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Update users list
            const userIndex = users.findIndex(u => u.ign === user.ign);
            if (userIndex !== -1) {
                users[userIndex] = user;
                localStorage.setItem('users', JSON.stringify(users));
            }
            
            // Update UI and redirect
            updateAuthUI();
            alert(`Welcome back, ${user.ign}! Prepare for trouble!`);
            window.location.href = redirectUrl;
        } else {
            alert('Invalid IGN or password! Make it double!');
        }
    };
    
    // Add the new listener
    loginForm.addEventListener('submit', loginForm._submitHandler);
}


// Logout Functionality
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        // Remove any existing listeners to prevent duplicates
        logoutBtn.removeEventListener('click', logoutBtn._clickHandler);
        
        // Create new handler
        logoutBtn._clickHandler = function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to log out?')) {
                localStorage.removeItem('currentUser');
                updateAuthUI();
                alert('Logged out successfully! We\'ll be waiting for your return!');
                window.location.href = 'index.html';
            }
        };
        
        // Add the new listener
        logoutBtn.addEventListener('click', logoutBtn._clickHandler);
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const isLoggedIn = !!localStorage.getItem('currentUser');
    
    // Update navigation links
    document.querySelectorAll('.login-link').forEach(el => {
        el.style.display = isLoggedIn ? 'none' : 'block';
    });
    document.querySelectorAll('.profile-link').forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });
    document.querySelectorAll('.logout-link').forEach(el => {
        el.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    // Update main nav login/logout button
    const mainNavLogin = document.querySelector('.nav-links a[href="login.html"]');
    if (mainNavLogin) {
        // Remove any existing listeners
        mainNavLogin.removeEventListener('click', mainNavLogin._clickHandler);
        
        if (isLoggedIn) {
            mainNavLogin.textContent = 'Logout';
            mainNavLogin.href = '#';
            
            // Create new handler
            mainNavLogin._clickHandler = function(e) {
                e.preventDefault();
                if (confirm('Are you sure you want to log out?')) {
                    localStorage.removeItem('currentUser');
                    updateAuthUI();
                    window.location.href = 'index.html';
                }
            };
            
            // Add the new listener
            mainNavLogin.addEventListener('click', mainNavLogin._clickHandler);
        } else {
            mainNavLogin.textContent = 'Login';
            mainNavLogin.href = 'login.html';
        }
    }
    
    // Update purchase buttons
    document.querySelectorAll('.purchase-btn').forEach(btn => {
        btn.disabled = !isLoggedIn;
        btn.title = isLoggedIn ? '' : 'Please log in to purchase';
    });
}

// Check auth state on page load
function checkAuth() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Check session expiration (30 days)
    if (currentUser) {
        const lastLogin = new Date(currentUser.lastLogin);
        const daysSinceLogin = (new Date() - lastLogin) / (1000 * 60 * 60 * 24);
        if (daysSinceLogin > 30) {
            localStorage.removeItem('currentUser');
            updateAuthUI();
            return null;
        }
    }
    
    updateAuthUI();
    return currentUser;
}

// Protect protected pages
function protectPage() {
    const currentUser = checkAuth();
    const protectedPages = ['profile.html', 'transactions.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        if (!currentUser) {
            if (confirm('You need to log in first to access this page. Go to login page?')) {
                window.location.href = `login.html?redirect=${currentPage}`;
            } else {
                window.location.href = 'index.html';
            }
        }
    }
}

// Initialize auth modules
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    protectPage();
    
    if (document.getElementById('registrationForm')) initRegistration();
    if (document.getElementById('loginForm')) initLogin();
    if (document.getElementById('logoutBtn')) initLogout();
    
    // Protect purchase buttons
    document.querySelectorAll('.purchase-btn').forEach(btn => {
        // Remove any existing listeners
        btn.removeEventListener('click', btn._clickHandler);
        
        // Create new handler
        btn._clickHandler = function(e) {
            if (!localStorage.getItem('currentUser')) {
                e.preventDefault();
                if (confirm('You need to log in first to make purchases. Go to login page?')) {
                    window.location.href = `login.html?redirect=${window.location.pathname.split('/').pop()}`;
                }
            }
        };
        
        // Add the new listener
        btn.addEventListener('click', btn._clickHandler);
    });
});