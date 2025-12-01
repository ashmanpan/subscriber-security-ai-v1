// Login Page Script

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.querySelector('.login-footer').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('signupFooter').style.display = 'block';
    document.querySelector('.login-header h1').textContent = 'Create Account';
}

function showLogin() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('signupFooter').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.login-footer').style.display = 'block';
    document.querySelector('.login-header h1').textContent = 'Subscriber Security AI';
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Simple demo authentication - in production, this would call a real auth API
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    const account = accounts.find(acc => acc.email === email && acc.password === password);

    if (account || true) { // Allow any login for demo
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        showNotification('Login successful! Welcome back.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }

    // Check if email already exists
    const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
    if (accounts.some(acc => acc.email === email)) {
        showNotification('Email already registered!', 'error');
        return;
    }

    // Create new account
    accounts.push({ name, email, password, createdAt: new Date().toISOString() });
    localStorage.setItem('accounts', JSON.stringify(accounts));

    showNotification('Account created successfully!');

    // Switch to login form and pre-fill email
    setTimeout(() => {
        showLogin();
        document.getElementById('email').value = email;
    }, 1500);
}

// Redirect to dashboard if already logged in
if (isAuthenticated()) {
    window.location.href = 'index.html';
}
