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

  // --------------------------------------------------------------------------
  // 8. MULTIPLATFORM PWA CONTROLLER & KEYBOARD ACCESSIBILITY
  // --------------------------------------------------------------------------
  AppPwaModule.init();

  // Desktop Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Press '/' to search galleries when not focused on an input
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      const searchInput = document.getElementById('gal-search-input');
      if (searchInput) {
        searchInput.focus();
        if (window.NotificationCenter) NotificationCenter.info('Foco na busca de galerias (Atalho "/")', 'Navegação');
      }
    }
  });
});

// ==========================================================================
// PWA & CROSS-PLATFORM COMPONENT MODULE
// ==========================================================================
const AppPwaModule = (() => {
  let deferredPrompt = null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  function init() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((reg) => {
          console.log('[PicDrop PWA] Service Worker registrado com sucesso:', reg.scope);
        }).catch((err) => {
          console.warn('[PicDrop PWA] Falha ao registrar Service Worker:', err);
        });
      });
    }

    // 2. Capture install prompt (Chrome / Edge / Android / Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      console.log('[PicDrop PWA] Evento beforeinstallprompt capturado');
    });

    // 3. Track install success
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      closeInstallModal();
      if (window.NotificationCenter) {
        NotificationCenter.success('Aplicativo PicDrop instalado com sucesso no seu dispositivo!', 'Instalação Concluída');
      }
    });

    // 4. Update UI if already running as standalone app
    if (isStandalone) {
      document.body.classList.add('pwa-standalone-mode');
      document.querySelectorAll('.btn-install-pwa').forEach(btn => btn.style.display = 'none');
    }
  }

  function promptInstall() {
    const modal = document.getElementById('modal-pwa-install');
    const guideEl = document.getElementById('pwa-install-platform-guide');
    const btnDirect = document.getElementById('btn-pwa-direct-install');
    const btnText = document.getElementById('btn-pwa-install-text');

    if (!modal) return;

    if (isIOS) {
      if (guideEl) {
        guideEl.innerHTML = `
          <div style="display:flex; align-items:flex-start; gap:10px; margin-bottom:12px;">
            <span style="background:rgba(37,99,235,0.25); color:#60a5fa; font-weight:700; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">1</span>
            <span>No <strong>Safari do iPhone / iPad</strong>, toque no ícone de <strong>Compartilhar</strong> (quadrado com a seta para cima ⎋) na barra inferior.</span>
          </div>
          <div style="display:flex; align-items:flex-start; gap:10px;">
            <span style="background:rgba(37,99,235,0.25); color:#60a5fa; font-weight:700; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;">2</span>
            <span>Role a lista e toque em <strong>"Adicionar à Tela de Início"</strong> ➕ para criar o ícone nativo do PicDrop.</span>
          </div>
        `;
      }
      if (btnDirect) btnDirect.style.display = 'none';
    } else if (deferredPrompt) {
      if (guideEl) {
        guideEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.3rem;">📲</span>
            <span>Clique no botão abaixo para instalar o PicDrop diretamente na tela inicial do seu celular ou área de trabalho do computador.</span>
          </div>
        `;
      }
      if (btnDirect) {
        btnDirect.style.display = 'inline-flex';
        if (btnText) btnText.textContent = 'Instalar Agora';
      }
    } else {
      if (guideEl) {
        guideEl.innerHTML = `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.3rem;">💻</span>
            <span>No Chrome ou Edge, clique no ícone de <strong>Instalar</strong> no canto direito da barra de endereços (ou abra o menu do navegador e selecione <em>Instalar PicDrop</em>).</span>
          </div>
        `;
      }
      if (btnDirect) btnDirect.style.display = 'none';
    }

    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  function closeInstallModal() {
    const modal = document.getElementById('modal-pwa-install');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  function triggerInstallPrompt() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('[PicDrop PWA] Usuário aceitou a instalação');
        }
        deferredPrompt = null;
        closeInstallModal();
      });
    } else {
      closeInstallModal();
      if (window.NotificationCenter) {
        NotificationCenter.info('Abra o menu do navegador e selecione "Instalar PicDrop" ou "Adicionar à Tela Inicial".', 'Como Instalar');
      }
    }
  }

  function switchMobilePane(paneId) {
    // 1. Update active states on bottom nav
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-pane') === paneId);
    });

    // 2. Update sidebar active item
    document.querySelectorAll('.dash-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-pane') === paneId);
    });

    // 3. Switch pane view
    document.querySelectorAll('.dash-section-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const targetPane = document.getElementById(`pane-${paneId}`);
    if (targetPane) {
      targetPane.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (paneId === 'plans' && window.PlansModule) {
      PlansModule.renderBillingCentral();
    } else if (paneId === 'galleries' && window.GalleriesModule) {
      GalleriesModule.render();
    }
  }

  return {
    init,
    promptInstall,
    closeInstallModal,
    triggerInstallPrompt,
    switchMobilePane
  };
})();

if (typeof window !== 'undefined') {
  window.AppPwaModule = AppPwaModule;
}

