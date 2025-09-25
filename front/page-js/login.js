// login.js — front-end avec compte demo local

(function() {
    const DEMO_USER = { username: 'demo', password: 'demo123' };
    const SESSION_KEY = 'ptp1_session';

    function showError(msg) {
        const el = document.getElementById('error');
        el.textContent = msg || '';
    }

    function setSession(username) {
        const token = btoa(JSON.stringify({ user: username, iat: Date.now() }));
        localStorage.setItem(SESSION_KEY, token);
    }

    // Remplir automatiquement les champs avec le compte demo
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'fill-demo') {
            document.getElementById('username').value = DEMO_USER.username;
            document.getElementById('password').value = DEMO_USER.password;
        }
    });

    // Form submission
    document.addEventListener('submit', (e) => {
        if (e.target && e.target.id === 'login-form') {
            e.preventDefault();
            showError('');

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showError('Veuillez remplir tous les champs.');
                return;
            }

            // Vérification demo uniquement
            if (username === DEMO_USER.username && password === DEMO_USER.password) {
                setSession(username);
                window.location.href = '/../index.html'; // redirection vers la page principale
                return;
            } else {
                showError('Identifiant ou mot de passe invalide.');
            }
        }
    });
})();
