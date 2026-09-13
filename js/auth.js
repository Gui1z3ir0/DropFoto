/* ==========================================================================
   PICDROP - AUTHENTICATION MODULE
   Supports Login with E-mail OR Username, 2FA Challenge & Session Management
   ========================================================================== */

const AuthModule = (() => {
  const STORAGE_KEY_USERS = 'picdrop_registered_users';
  const STORAGE_KEY_SESSION = 'picdrop_current_user_session';

  // Seed default demo user: Maria Clark
  const defaultUsers = [
    {
      id: 'usr-1',
      name: 'Maria Clark',
      username: 'mariaclark',
      email: 'maria@clark.com',
      password: '123456',
      plan: 'studio',
      twoFactorEnabled: true,
      avatar: 'assets/images/maria_clark.jpg'
    },
    {
      id: 'usr-2',
      name: 'Matheus Dahsan',
      username: 'matheusyah',
      email: 'matheus@dahsan.com',
      password: '123456',
      plan: 'pro',
      twoFactorEnabled: false,
      avatar: 'assets/images/matheus_dahsan.jpg'
    },
    {
      id: 'usr-3',
      name: 'Roberto Melo',
      username: 'robertomelo',
      email: 'roberto.melo.photo@gmail.com',
      password: '123456',
      plan: 'pro',
      twoFactorEnabled: false,
      avatar: 'assets/images/roberto_melo.jpg'
    }
  ];

  let pending2FAUser = null;

  function getUsers() {
    const data = localStorage.getItem(STORAGE_KEY_USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(data);
  }

  function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  function getSession() {
    const data = localStorage.getItem(STORAGE_KEY_SESSION);
    return data ? JSON.parse(data) : null;
  }

  function setSession(user) {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
    PlansModule.setPlan(user.plan || 'studio');
    updateAppView();
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY_SESSION);
    updateAppView();
  }

  function handleLoginSubmit(identifier, password) {
    const users = getUsers();
    const cleanId = identifier.trim().toLowerCase().replace(/^@/, '');

    // Search by Email OR Username!
    const user = users.find(u => 
      (u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId) &&
      u.password === password
    );

    if (!user) {
      SecurityModule.recordLogin(identifier, identifier, 'failed', false);
      window.showToast('Credenciais não autorizadas. Verifique o identificador e senha digitados.', 'error', 'Falha no Login');
      return false;
    }

    // Check if 2FA is active
    const is2FA = SecurityModule.is2FAEnabled();
    if (is2FA) {
      pending2FAUser = user;
      show2FAStep(user);
      return true;
    }

    // Direct Login without 2FA
    completeLogin(user, false);
    return true;
  }

  function show2FAStep(user) {
    const step1 = document.getElementById('auth-step-credentials');
    const step2 = document.getElementById('auth-step-2fa');
    if (step1 && step2) {
      step1.style.display = 'none';
      step2.style.display = 'block';
    }
    const user2faBadge = document.getElementById('auth-2fa-user-hint');
    if (user2faBadge) {
      user2faBadge.textContent = `${user.name} (@${user.username})`;
    }
  }

  function verify2FACode(code) {
    if (!pending2FAUser) return;
    
    // Accept valid 6 digit code or simulation
    if (code && code.length >= 4) {
      completeLogin(pending2FAUser, true);
      pending2FAUser = null;
    } else {
      window.showToast('Código de autenticação de dois fatores inválido. Verifique o app autenticador.', 'error', 'Código 2FA Inválido');
    }
  }

  function completeLogin(user, is2faVerified) {
    SecurityModule.recordLogin(user.username, `@${user.username}`, 'success', is2faVerified);
    setSession(user);
    closeAuthModal();
    window.showToast(`Sessão iniciada com sucesso. Bem-vindo(a), ${user.name}.`, 'success', 'Acesso Autorizado');
  }

  function handleRegisterSubmit(name, username, email, password, chosenPlan = 'pro') {
    const users = getUsers();
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    const cleanEmail = email.trim().toLowerCase();

    // Check collision
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      window.showToast('Este identificador de usuário já está em uso. Por favor, escolha outro.', 'warning', 'Username Indisponível');
      return false;
    }
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      window.showToast('Este endereço de e-mail já está cadastrado. Tente realizar o acesso com suas credenciais.', 'warning', 'E-mail Já Cadastrado');
      return false;
    }

    const newUser = {
      id: 'usr-' + Date.now(),
      name: name,
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      plan: chosenPlan,
      twoFactorEnabled: false,
      avatar: 'assets/images/editorial_cover.jpg'
    };

    users.push(newUser);
    saveUsers(users);

    // Auto login
    SecurityModule.recordLogin(cleanUsername, `@${cleanUsername}`, 'success', false);
    setSession(newUser);
    closeAuthModal();
    window.showToast(`Estúdio configurado com sucesso. Bem-vindo(a) ao PicDrop, ${name}.`, 'success', 'Conta Criada');
    return true;
  }

  function updateAppView() {
    const session = getSession();
    const landingView = document.getElementById('landing-view');
    const dashboardView = document.getElementById('dashboard-view');
    const navLoginBtn = document.getElementById('btn-nav-login');

    if (session) {
      // User is logged in
      if (landingView) landingView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'block';

      // Update user info in header
      const nameEl = document.getElementById('dash-user-name');
      const avatarEl = document.getElementById('dash-user-avatar');
      if (nameEl) nameEl.textContent = session.name;
      if (avatarEl && session.avatar) avatarEl.src = session.avatar;

      // Sync plan
      PlansModule.setPlan(session.plan || 'studio');
    } else {
      // User is logged out
      if (landingView) landingView.style.display = 'block';
      if (dashboardView) dashboardView.style.display = 'none';
      if (navLoginBtn) navLoginBtn.innerHTML = '<span>Entrar</span> <span>➔</span>';
    }
  }

  function openAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;

    // Reset steps
    const step1 = document.getElementById('auth-step-credentials');
    const step2 = document.getElementById('auth-step-2fa');
    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';

    switchAuthTab(mode);
    modal.classList.add('active');
  }

  function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('active');
  }

  function switchAuthTab(tab) {
    const tabLoginBtn = document.getElementById('tab-btn-login');
    const tabRegisterBtn = document.getElementById('tab-btn-register');
    const formLogin = document.getElementById('form-login-pane');
    const formRegister = document.getElementById('form-register-pane');

    if (tab === 'login') {
      tabLoginBtn?.classList.add('active');
      tabRegisterBtn?.classList.remove('active');
      if (formLogin) formLogin.style.display = 'block';
      if (formRegister) formRegister.style.display = 'none';
    } else {
      tabLoginBtn?.classList.remove('active');
      tabRegisterBtn?.classList.add('active');
      if (formLogin) formLogin.style.display = 'none';
      if (formRegister) formRegister.style.display = 'block';
    }
  }

  let socialAuthMode = 'login';

  function openGoogleModal(mode = 'login') {
    socialAuthMode = mode;
    const modal = document.getElementById('google-sso-modal');
    const selector = document.getElementById('google-accounts-selector');
    const loading = document.getElementById('google-sso-loading');
    if (selector) selector.style.display = 'flex';
    if (loading) loading.style.display = 'none';
    if (modal) modal.classList.add('active');
  }

  function closeGoogleModal() {
    const modal = document.getElementById('google-sso-modal');
    if (modal) modal.classList.remove('active');
  }

  function authenticateGoogleAccount(accountKey) {
    const selector = document.getElementById('google-accounts-selector');
    const loading = document.getElementById('google-sso-loading');
    if (selector) selector.style.display = 'none';
    if (loading) loading.style.display = 'block';

    const users = getUsers();
    let targetUser = null;

    if (accountKey === 'maria') {
      targetUser = users.find(u => u.username === 'mariaclark') || users[0];
    } else if (accountKey === 'roberto') {
      targetUser = users.find(u => u.username === 'robertomelo') || users[2] || users[0];
    } else {
      targetUser = {
        id: 'usr-google-' + Date.now(),
        name: 'Fotógrafo(a) Google Studio',
        username: 'fotografo_gmail',
        email: 'fotografo.estudio@gmail.com',
        password: 'sso_google',
        plan: 'studio',
        twoFactorEnabled: false,
        avatar: 'assets/images/editorial_cover.jpg'
      };
      if (!users.some(u => u.username === targetUser.username)) {
        users.push(targetUser);
        saveUsers(users);
      }
    }

    setTimeout(() => {
      closeGoogleModal();
      closeAuthModal();
      SecurityModule.recordLogin('Google Identity (Gmail)', targetUser.email, 'success', false);
      setSession(targetUser);
      if (socialAuthMode === 'register') {
        NotificationCenter.success(`Estúdio cadastrado com sucesso via Google (Gmail). Bem-vindo(a), ${targetUser.name}!`, 'Cadastro Realizado', 'GOOGLE OAUTH');
      } else {
        NotificationCenter.success(`Autenticação Google Identity concluída. Bem-vindo(a), ${targetUser.name}.`, 'Acesso Autorizado', 'GOOGLE SSO');
      }
    }, 450);
  }

  function authenticateFacebookAccount(mode = 'register') {
    NotificationCenter.info('Conectando ao Facebook Login (Meta Identity Platform)...', 'Facebook OAuth');

    setTimeout(() => {
      closeAuthModal();
      const users = getUsers();
      let fbUser = users.find(u => u.username === 'fotografo_fb');

      if (!fbUser) {
        fbUser = {
          id: 'usr-fb-' + Date.now(),
          name: 'Fotógrafo(a) Meta Studio',
          username: 'fotografo_fb',
          email: 'contato.estudio@facebook.com',
          password: 'sso_facebook',
          plan: 'studio',
          twoFactorEnabled: false,
          avatar: 'assets/images/editorial_cover.jpg'
        };
        users.push(fbUser);
        saveUsers(users);
      }

      SecurityModule.recordLogin('Facebook OAuth 2.0', fbUser.email, 'success', false);
      setSession(fbUser);

      if (mode === 'register') {
        NotificationCenter.success('Estúdio cadastrado com sucesso via Facebook! Bem-vindo(a) ao PicDrop Studio.', 'Cadastro Concluído', 'FACEBOOK');
      } else {
        NotificationCenter.success(`Sessão iniciada com sucesso via Facebook. Bem-vindo(a), ${fbUser.name}.`, 'Acesso Autorizado', 'FACEBOOK SSO');
      }
    }, 550);
  }

  function quickLogin(username) {
    const users = getUsers();
    let target = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!target && username === 'robertomelo') {
      target = {
        id: 'usr-3',
        name: 'Roberto Melo',
        username: 'robertomelo',
        email: 'roberto.melo.photo@gmail.com',
        password: 'sso',
        plan: 'pro',
        twoFactorEnabled: false,
        avatar: 'assets/images/roberto_melo.jpg'
      };
    }

    if (target) {
      SecurityModule.recordLogin('Login Rápido (1-Clique)', `@${target.username}`, 'success', false);
      setSession(target);
      closeAuthModal();
      NotificationCenter.info(`Sessão autorizada como ${target.name} (Nível ${target.plan.toUpperCase()}).`, 'Acesso Rápido');
    }
  }

  return {
    init: () => {
      // Default session initialization with Maria Clark if none exists
      if (!getSession()) {
        const defaultUser = getUsers()[0];
        setSession(defaultUser);
      } else {
        updateAppView();
      }
    },
    getSession,
    handleLoginSubmit,
    verify2FACode,
    handleRegisterSubmit,
    clearSession,
    openAuthModal,
    closeAuthModal,
    switchAuthTab,
    openGoogleModal,
    closeGoogleModal,
    authenticateGoogleAccount,
    authenticateFacebookAccount,
    quickLogin,
    updateAppView
  };
})();

window.AuthModule = AuthModule;

