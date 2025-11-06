// front/login.js
(function () {
  // Clé pour stocker le jeton d'authentification
  const AUTH_TOKEN_KEY = 'authToken'; 
  const SERVER_URL = "http://172.29.18.249:2864";

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

  // Fonction pour TESTER l'envoi du token au back-end
  const testTokenValidity = async (token) => {
    try {
      console.log("Tentative de validation du token sur la route protégée...");
      
      const response = await fetch(`${SERVER_URL}/api/user-status`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          // ENVOI DU TOKEN DANS L'EN-TÊTE 'Authorization'
          'Authorization': `Bearer ${token}` 
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log("✅ Le token est valide ! Réponse du serveur:", data);
        return true;
      } else {
        console.error(`❌ ÉCHEC DE LA VÉRIFICATION DU TOKEN (${response.status}):`, data.error || 'Erreur inconnue.');
        return false;
      }
    } catch (error) {
      console.error("Erreur de connexion lors du test du token:", error);
      return false;
    }
  };


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
        // Étape 1 : Envoi des identifiants au back-end (pour obtenir le token)
        const response = await fetch(`${SERVER_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: username, password })
        });

        const data = await response.json();

        if (response.ok) {
          
          if (data.token) {
            // Étape 2 : Stockage du token
            localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Étape 3 : TEST IMMÉDIAT DU TOKEN (Nouveau)
            const tokenValid = await testTokenValidity(data.token);

            if (tokenValid) {
              // Étape 4 : Redirection uniquement si le token est validé
              window.location.href = "../page-html/connexion.html";
            } else {
              showError('error', "Connexion échouée malgré la réception du token. Veuillez vérifier le back-end.");
              localStorage.removeItem(AUTH_TOKEN_KEY); // Nettoyer le token défectueux
            }
          } else {
            console.error("Connexion réussie mais token manquant dans la réponse.");
            showError('error', "Le serveur n'a pas renvoyé de jeton.");
          }
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