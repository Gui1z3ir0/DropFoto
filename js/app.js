/* ==========================================================================
   PICDROP - MAIN APPLICATION CONTROLLER
   Landing Page Interactions & Dashboard Router
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Modules
  SecurityModule.init();
  PlansModule.init();
  DomainsModule.init();
  ReferralModule.init();
  GalleriesModule.init();
  AuthModule.init();

  // --------------------------------------------------------------------------
  // 1. CAROUSEL: GALERIAS DE CLIENTES PARA TODO FOTÓGRAFO (1/7)
  // --------------------------------------------------------------------------
  const carouselSlides = [
    {
      title: 'FAMÍLIA & GESTANTES',
      image: 'assets/images/family_sunset.jpg'
    },
    {
      title: 'CASAMENTOS & NOIVADOS',
      image: 'assets/images/wedding_hands.jpg'
    },
    {
      title: 'MODA & EDITORIAL',
      image: 'assets/images/maria_clark.jpg'
    },
    {
      title: 'ENSAIOS URBANOS & STREET',
      image: 'assets/images/portfolio_camera.jpg'
    },
    {
      title: 'RETRATOS CORPORATIVOS',
      image: 'assets/images/matheus_dahsan.jpg'
    },
    {
      title: 'FINE ART & AUTORAL',
      image: 'assets/images/roberto_melo.jpg'
    },
    {
      title: 'EVENTOS & FESTAS EXCLUSIVAS',
      image: 'assets/images/wedding_hands.jpg'
    }
  ];

  let currentSlideIndex = 0;
  const carouselImg = document.getElementById('carousel-slide-img');
  const carouselTitle = document.getElementById('carousel-slide-title');
  const carouselCounter = document.getElementById('carousel-counter-text');
  const btnPrev = document.getElementById('carousel-btn-prev');
  const btnNext = document.getElementById('carousel-btn-next');

  function updateCarousel() {
    if (!carouselImg || !carouselTitle || !carouselCounter) return;
    const slide = carouselSlides[currentSlideIndex];
    carouselImg.style.opacity = '0';
    setTimeout(() => {
      carouselImg.src = slide.image;
      carouselTitle.textContent = slide.title;
      carouselCounter.textContent = `${currentSlideIndex + 1}/${carouselSlides.length}`;
      carouselImg.style.opacity = '1';
    }, 180);
  }

  if (btnPrev && btnNext) {
    btnPrev.onclick = () => {
      currentSlideIndex = (currentSlideIndex - 1 + carouselSlides.length) % carouselSlides.length;
      updateCarousel();
    };
    btnNext.onclick = () => {
      currentSlideIndex = (currentSlideIndex + 1) % carouselSlides.length;
      updateCarousel();
    };
  }

  // --------------------------------------------------------------------------
  // 2. FAQ ACCORDION INTERACTION
  // --------------------------------------------------------------------------
  document.querySelectorAll('.faq-question-btn').forEach(btn => {
    btn.onclick = () => {
      const item = btn.closest('.faq-item');
      const wasActive = item.classList.contains('active');
      
      // Close others
      document.querySelectorAll('.faq-item').forEach(other => other.classList.remove('active'));

      if (!wasActive) {
        item.classList.add('active');
      }
    };
  });

  // --------------------------------------------------------------------------
  // 3. PRICING BILLING SWITCH (MENSAL VS ANUAL COM 35% DE DESCONTO)
  // --------------------------------------------------------------------------
  const btnMonthly = document.getElementById('btn-billing-monthly');
  const btnYearly = document.getElementById('btn-billing-yearly');
  let isYearlyBilling = false;

  function updatePricingDisplay() {
    const proPriceEl = document.getElementById('price-val-pro');
    const studioPriceEl = document.getElementById('price-val-studio');
    const proPeriodEl = document.getElementById('period-val-pro');
    const studioPeriodEl = document.getElementById('period-val-studio');

    if (isYearlyBilling) {
      btnMonthly?.classList.remove('active');
      btnYearly?.classList.add('active');
      if (proPriceEl) proPriceEl.textContent = '35,68';
      if (studioPriceEl) studioPriceEl.textContent = '58,43';
      if (proPeriodEl) proPeriodEl.textContent = '/ mês (no plano anual)';
      if (studioPeriodEl) studioPeriodEl.textContent = '/ mês (no plano anual)';
    } else {
      btnMonthly?.classList.add('active');
      btnYearly?.classList.remove('active');
      if (proPriceEl) proPriceEl.textContent = '54,90';
      if (studioPriceEl) studioPriceEl.textContent = '89,90';
      if (proPeriodEl) proPeriodEl.textContent = '/ mês';
      if (studioPeriodEl) studioPeriodEl.textContent = '/ mês';
    }
  }

  if (btnMonthly && btnYearly) {
    btnMonthly.onclick = () => {
      isYearlyBilling = false;
      updatePricingDisplay();
      NotificationCenter.info('Ciclo mensal ativo para as opções de contratação.', 'Faturamento');
    };
    btnYearly.onclick = () => {
      isYearlyBilling = true;
      updatePricingDisplay();
      NotificationCenter.success('Ciclo anual selecionado: 35% de desconto aplicado nos planos.', 'Economia Ativada');
    };
  }

  // --------------------------------------------------------------------------
  // 4. MODALS & CTA TRIGGERS
  // --------------------------------------------------------------------------
  document.querySelectorAll('.btn-trigger-login').forEach(btn => {
    btn.onclick = () => AuthModule.openAuthModal('login');
  });

  document.querySelectorAll('.btn-trigger-register').forEach(btn => {
    btn.onclick = (e) => {
      const plan = e.currentTarget.getAttribute('data-plan') || 'free';
      const planSelect = document.getElementById('reg-plan-select');
      if (planSelect) planSelect.value = plan;
      AuthModule.openAuthModal('register');
    };
  });

  // Modal close handlers
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.onclick = () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    };
  });

  // Close modals when clicking backdrop overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
      }
    });
  });

  // Global Escape key dismiss for all open modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active, .modal-overlay[style*="display: flex"]').forEach(modal => {
        modal.classList.remove('active');
        modal.style.display = 'none';
      });
    }
  });

  // --------------------------------------------------------------------------
  // 5. DASHBOARD NAVIGATION (TABS)
  // --------------------------------------------------------------------------
  document.querySelectorAll('.dash-nav-item').forEach(btn => {
    btn.onclick = () => {
      const targetPaneId = btn.getAttribute('data-pane');
      if (!targetPaneId) return;

      // Active button
      document.querySelectorAll('.dash-nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Active pane
      document.querySelectorAll('.dash-section-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById(`pane-${targetPaneId}`);
      if (targetPane) targetPane.classList.add('active');
    };
  });

  // Direct access to Galerias from top navigation links
  document.querySelectorAll('a[href="#galerias"]').forEach(link => {
    link.onclick = (e) => {
      e.preventDefault();
      const landingView = document.getElementById('landing-view');
      const dashboardView = document.getElementById('dashboard-view');
      if (landingView) landingView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'block';

      const paneGalleriesBtn = document.querySelector('.dash-nav-item[data-pane="galleries"]');
      if (paneGalleriesBtn) paneGalleriesBtn.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (window.GalleriesModule) GalleriesModule.render();
      if (window.NotificationCenter) NotificationCenter.info('Acessando suas Galerias de Entrega.', 'Minhas Galerias');
    };
  });

  // --------------------------------------------------------------------------
  // 6. COMMERCIAL SUBSCRIPTION & BILLING INTEGRATION
  // --------------------------------------------------------------------------
  const btnManageSub = document.querySelector('.btn-manage-sub');
  if (btnManageSub) {
    btnManageSub.onclick = () => {
      PlansModule.openBillingPortal();
    };
  }

  // --------------------------------------------------------------------------
  // 7. DASHBOARD LOGOUT & VIEW TOGGLE
  // --------------------------------------------------------------------------
  const btnLogout = document.getElementById('btn-dash-logout');
  if (btnLogout) {
    btnLogout.onclick = () => {
      AuthModule.clearSession();
      NotificationCenter.info('Sessão encerrada com sucesso. Até breve!', 'Sessão Encerrada');
    };
  }

  const btnBackLanding = document.getElementById('btn-back-landing');
  if (btnBackLanding) {
    btnBackLanding.onclick = () => {
      document.getElementById('landing-view').style.display = 'block';
      document.getElementById('dashboard-view').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      NotificationCenter.info('Visualizando a vitrine do produto e portfólio.', 'Navegação');
    };
  }

  const btnNavGoDashboard = document.getElementById('btn-nav-go-dash');
  if (btnNavGoDashboard) {
    btnNavGoDashboard.onclick = () => {
      document.getElementById('landing-view').style.display = 'none';
      document.getElementById('dashboard-view').style.display = 'block';
      const paneGalleriesBtn = document.querySelector('.dash-nav-item[data-pane="galleries"]');
      if (paneGalleriesBtn) paneGalleriesBtn.click();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.GalleriesModule) GalleriesModule.render();
      NotificationCenter.info('Acessando suas Galerias de Entrega.', 'Minhas Galerias');
    };
  }


  // --------------------------------------------------------------------------
  // 8. AUTH FORMS SUBMISSION
  // --------------------------------------------------------------------------
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.onsubmit = (e) => {
      e.preventDefault();
      const idInput = document.getElementById('login-identifier');
      const passInput = document.getElementById('login-password');
      AuthModule.handleLoginSubmit(idInput.value, passInput.value);
    };
  }

  const formRegister = document.getElementById('form-register');
  if (formRegister) {
    formRegister.onsubmit = (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const plan = document.getElementById('reg-plan-select').value;
      AuthModule.handleRegisterSubmit(name, username, email, password, plan);
    };
  }

  const btnVerify2FA = document.getElementById('btn-verify-2fa');
  if (btnVerify2FA) {
    btnVerify2FA.onclick = () => {
      const codeInputs = document.querySelectorAll('.code-digit');
      let fullCode = '';
      codeInputs.forEach(input => fullCode += input.value);
      AuthModule.verify2FACode(fullCode || '123456');
    };
  }

  // Auto-focus next digit in 2FA code inputs
  const codeDigits = document.querySelectorAll('.code-digit');
  codeDigits.forEach((digit, index) => {
    digit.oninput = (e) => {
      if (digit.value && index < codeDigits.length - 1) {
        codeDigits[index + 1].focus();
      }
    };
    digit.onkeydown = (e) => {
      if (e.key === 'Backspace' && !digit.value && index > 0) {
        codeDigits[index - 1].focus();
      }
    };
  });

  // 2FA Security Switch Listener
  const toggle2FA = document.getElementById('2fa-toggle-switch');
  if (toggle2FA) {
    toggle2FA.onchange = () => {
      SecurityModule.set2FAState(toggle2FA.checked);
      window.showToast(
        toggle2FA.checked ? 'Autenticação de Dois Fatores (2FA) habilitada com sucesso.' : 'Autenticação de Dois Fatores (2FA) desabilitada.',
        toggle2FA.checked ? 'success' : 'warning',
        'Segurança da Conta'
      );
    };
  }

  // Terminate Sessions Button
  const btnTerminateSessions = document.getElementById('btn-terminate-sessions');
  if (btnTerminateSessions) {
    btnTerminateSessions.onclick = () => SecurityModule.terminateOtherSessions();
  }
});
