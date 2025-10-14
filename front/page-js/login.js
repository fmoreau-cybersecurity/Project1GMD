// front/login.js
(function () {
  // Clé pour stocker le jeton d'authentification
  const AUTH_TOKEN_KEY = 'authToken'; 

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg || '';
  }

  // Toggle password
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'toggle-password') {
      const pwd = document.getElementById('password');
      pwd.type = pwd.type === 'password' ? 'text' : 'password';
    }
  });


  // Switch login/register
  document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-form').classList.add('d-none');
    document.getElementById('register-form').classList.remove('d-none');
  });

  document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('register-form').classList.add('d-none');
    document.getElementById('login-form').classList.remove('d-none');
  });

  // Login form submit
  document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'login-form') {
      e.preventDefault();
      showError('error', '');
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      if (!username || !password) {
        return showError('error', 'Veuillez remplir tous les champs.');
      }

      try {
        // Envoi des identifiants au back-end
        const response = await fetch("http://172.29.18.249:2864/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: username, password })
        });

        const data = await response.json();

        if (response.ok) {
          
          if (data.token) {
            // 1. Stocke le jeton d'authentification reçu du serveur
            localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          } else {
            console.error("Connexion réussie mais token manquant dans la réponse.");
          }
          
          // 2. Stocke les informations utilisateur
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
          
          // 3. Redirection
          window.location.href = "../page-html/connexion.html";
          
        } else {
          showError('error', data.error);
        }
      } catch (err) {
        showError('error', "Erreur de connexion au serveur. Vérifiez l'adresse ou le statut du serveur.");
      }
    }

    // Register form submit
    if (e.target && e.target.id === 'register-form') {
      e.preventDefault();
      showError('reg-error', '');

      const nom = document.getElementById('nom').value.trim();
      const prenom = document.getElementById('prenom').value.trim();
      const mail = document.getElementById('mail').value.trim();
      const login = document.getElementById('reg-login').value.trim();
      const password = document.getElementById('reg-password').value;

      if (!nom || !prenom || !mail || !login || !password) {
        return showError('reg-error', 'Veuillez remplir tous les champs.');
      }

      try {
        const res = await fetch("http://172.29.18.249:2864/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom, prenom, mail, login, password })
        });

        const data = await res.json();

        if (!res.ok) {
          return showError('reg-error', data.error || 'Erreur lors de l’inscription.');
        }

        alert('Compte créé avec succès ! Vous pouvez vous connecter.');
        document.getElementById('show-login').click();
      } catch (err) {
        showError('reg-error', "Impossible de contacter le serveur.");
      }
    }
  });
})();