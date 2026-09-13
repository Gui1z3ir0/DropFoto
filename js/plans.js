/* ==========================================================================
   PICDROP - ENTERPRISE PLANS, BILLING & CHECKOUT ENGINE MODULE
   Commercial SaaS standard for Brazilian Photography Studios
   Features: PIX Instantâneo, Cartão de Crédito 12x, Boleto, NFS-e & Faturas PDF
   ========================================================================== */

const PlansModule = (() => {
  const STORAGE_KEY_PLAN = 'picdrop_current_plan';
  const STORAGE_KEY_INVOICES = 'picdrop_billing_invoices';
  const STORAGE_KEY_CYCLE = 'picdrop_billing_cycle';

  const PLAN_DEFINITIONS = {
    free: {
      id: 'free',
      name: 'Free (Gratuito)',
      badgeName: 'Plano Free',
      badgeClass: 'free',
      galleryLimit: 5,
      storageLimitGB: 5,
      priceMonthly: 0,
      priceYearly: 0,
      features: {
        unlimitedGalleries: false,
        lightroomExport: false,
        downloadPin: false,
        photoSales: false,
        facialRecognition: false,
        customDomain: false,
        blog: false,
        aiTools: false
      }
    },
    pro: {
      id: 'pro',
      name: 'Galerias Pro',
      badgeName: 'Plano Pro',
      badgeClass: 'pro',
      galleryLimit: Infinity,
      storageLimitGB: 100,
      priceMonthly: 54.90,
      priceYearly: 35.68,
      features: {
        unlimitedGalleries: true,
        lightroomExport: true,
        downloadPin: true,
        photoSales: true,
        facialRecognition: true,
        customDomain: false,
        blog: false,
        aiTools: false
      }
    },
    studio: {
      id: 'studio',
      name: 'Site + Galerias (Studio)',
      badgeName: 'Plano Studio',
      badgeClass: 'studio',
      galleryLimit: Infinity,
      storageLimitGB: 500,
      priceMonthly: 89.90,
      priceYearly: 58.43,
      features: {
        unlimitedGalleries: true,
        lightroomExport: true,
        downloadPin: true,
        photoSales: true,
        facialRecognition: true,
        customDomain: true,
        blog: true,
        aiTools: true
      }
    }
  };

  // State
  let activeCheckoutPlan = 'studio';
  let activeCheckoutCycle = 'yearly';
  let activePaymentTab = 'pix';
  let activeCoupon = null;
  let pixTimerInterval = null;

  // Initial Seed Invoices
  const DEFAULT_INVOICES = [
    {
      id: 'TX-2026-8912',
      date: '13/09/2026',
      competence: '09/2026',
      planId: 'studio',
      planName: 'Site + Galerias Studio (Anual)',
      amountFormatted: 'R$ 701,16',
      subtotalFormatted: 'R$ 1.078,80',
      discountFormatted: '- R$ 377,64',
      method: 'Cartão de Crédito Mastercard •••• 4821 (12x)',
      status: 'PAGO',
      clientName: 'Maria Clark Fotografia ME',
      clientDoc: '48.921.340/0001-82',
      clientEmail: 'contato@mariaclark.com.br',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'TX-2025-7841',
      date: '13/09/2025',
      competence: '09/2025',
      planId: 'studio',
      planName: 'Site + Galerias Studio (Anual)',
      amountFormatted: 'R$ 701,16',
      subtotalFormatted: 'R$ 1.078,80',
      discountFormatted: '- R$ 377,64',
      method: 'PIX Instantâneo Banco Central',
      status: 'PAGO',
      clientName: 'Maria Clark Fotografia ME',
      clientDoc: '48.921.340/0001-82',
      clientEmail: 'contato@mariaclark.com.br',
      hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'
    },
    {
      id: 'TX-2024-6210',
      date: '13/09/2024',
      competence: '09/2024',
      planId: 'pro',
      planName: 'Galerias Pro (Anual)',
      amountFormatted: 'R$ 428,16',
      subtotalFormatted: 'R$ 658,80',
      discountFormatted: '- R$ 230,64',
      method: 'Cartão de Crédito Mastercard •••• 4821 (12x)',
      status: 'PAGO',
      clientName: 'Maria Clark Fotografia ME',
      clientDoc: '48.921.340/0001-82',
      clientEmail: 'contato@mariaclark.com.br',
      hash: '6a3507f3107a31f40078ad7045da013b60a4cc14b107da7d32d48857409fe1e4'
    }
  ];

  function getInvoices() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_INVOICES);
      return stored ? JSON.parse(stored) : DEFAULT_INVOICES;
    } catch(e) {
      return DEFAULT_INVOICES;
    }
  }

  function saveInvoices(invoices) {
    try {
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    } catch(e) {}
  }

  function getCurrentPlanId() {
    return localStorage.getItem(STORAGE_KEY_PLAN) || 'studio';
  }

  function getPlanConfig(planId = getCurrentPlanId()) {
    return PLAN_DEFINITIONS[planId] || PLAN_DEFINITIONS.studio;
  }

  function setPlan(planId) {
    if (!PLAN_DEFINITIONS[planId]) return;
    localStorage.setItem(STORAGE_KEY_PLAN, planId);
    applyPlanUI();
    renderBillingCentral();
    
    // Refresh modules that depend on plan
    if (window.GalleriesModule) GalleriesModule.render();
    if (window.ReferralModule) ReferralModule.updateInvoiceUI();
    if (window.DomainsModule) DomainsModule.updateDomainUI();
  }

  function applyPlanUI() {
    const plan = getPlanConfig();

    // Update topbar badges & active commercial pill
    const userPlanBadge = document.getElementById('user-plan-badge');
    if (userPlanBadge) {
      userPlanBadge.textContent = plan.badgeName;
    }

    const topbarPlanLabel = document.getElementById('topbar-plan-label');
    if (topbarPlanLabel) {
      if (plan.id === 'studio') {
        topbarPlanLabel.textContent = 'Assinatura Studio Ativa';
      } else if (plan.id === 'pro') {
        topbarPlanLabel.textContent = 'Assinatura Pro Ativa';
      } else {
        topbarPlanLabel.textContent = 'Conta Free (Básica)';
      }
    }

    // Update quota widgets in sidebar and galleries pane
    const quotaUsedStorageGB = plan.id === 'free' ? 3.8 : (plan.id === 'pro' ? 28.5 : 142.0);
    const quotaPercent = Math.min(100, Math.round((quotaUsedStorageGB / plan.storageLimitGB) * 100));

    const quotaSidebarFill = document.getElementById('sidebar-quota-fill');
    const quotaSidebarText = document.getElementById('sidebar-quota-text');
    const quotaSidebarPct = document.getElementById('quota-sidebar-pct');

    if (quotaSidebarFill) {
      quotaSidebarFill.style.width = quotaPercent + '%';
      quotaSidebarFill.className = 'quota-fill ' + (quotaPercent > 85 ? 'danger' : (quotaPercent > 65 ? 'warning' : ''));
    }
    if (quotaSidebarText) {
      quotaSidebarText.textContent = `${quotaUsedStorageGB} GB de ${plan.storageLimitGB} GB`;
    }
    if (quotaSidebarPct) {
      quotaSidebarPct.textContent = `${quotaPercent}%`;
    }

    // Update galleries limit text
    const quotaGalleriesMax = document.getElementById('quota-galleries-max');
    if (quotaGalleriesMax) {
      quotaGalleriesMax.textContent = plan.galleryLimit === Infinity ? 'Ilimitadas no ' + plan.name.split(' ')[0] : `Máx ${plan.galleryLimit} galerias`;
    }

    // Feature lock alerts across dashboard
    updateFeatureLocks(plan);
  }

  function updateFeatureLocks(plan) {
    const domainLockNotice = document.getElementById('domain-plan-lock-notice');
    const domainActions = document.getElementById('domain-actions-container');
    if (domainLockNotice && domainActions) {
      if (plan.features.customDomain) {
        domainLockNotice.style.display = 'none';
        domainActions.style.opacity = '1';
        domainActions.style.pointerEvents = 'all';
      } else {
        domainLockNotice.style.display = 'block';
        domainActions.style.opacity = '0.65';
        domainActions.style.pointerEvents = 'none';
      }
    }
  }

  // --------------------------------------------------------------------------
  // CENTRAL DE FATURAMENTO & ASSINATURA (#pane-plans)
  // --------------------------------------------------------------------------
  function openBillingPortal() {
    // Navigate to pane-plans
    document.querySelectorAll('.dash-nav-item').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector('.dash-nav-item[data-pane="plans"]');
    if (navBtn) navBtn.classList.add('active');

    document.querySelectorAll('.dash-section-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('pane-plans');
    if (pane) pane.classList.add('active');

    renderBillingCentral();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.NotificationCenter) {
      NotificationCenter.info('Acessando Central de Faturamento e Faturas Fiscais.', 'Faturamento PicDrop');
    }
  }

  function renderBillingCentral() {
    const plan = getPlanConfig();
    const isYearly = localStorage.getItem(STORAGE_KEY_CYCLE) !== 'monthly';

    // Status Card Elements
    const titleEl = document.getElementById('billing-current-plan-name');
    const descEl = document.getElementById('billing-current-plan-features');
    const cycleBadgeEl = document.getElementById('billing-current-cycle-badge');
    const recurringValEl = document.getElementById('billing-recurring-val');
    const nextDateEl = document.getElementById('billing-next-date');

    if (titleEl) titleEl.textContent = plan.name;
    if (descEl) {
      descEl.textContent = plan.id === 'studio'
        ? '500 GB de Armazenamento Dedicado • Galerias Ilimitadas • Domínio Próprio Incluso (mariaclark.com.br) • Exportação Lightroom Classic & PIN Seguro'
        : (plan.id === 'pro'
          ? '100 GB de Armazenamento de Alta Performance • Galerias Ilimitadas • Exportação Lightroom Classic & PIN Seguro'
          : '5 GB de Armazenamento • Limite de até 5 galerias ativas • Sem domínio próprio');
    }

    if (cycleBadgeEl) {
      cycleBadgeEl.textContent = isYearly ? 'CICLO ANUAL (35% DE DESCONTO APLICADO)' : 'CICLO MENSAL';
    }

    if (recurringValEl) {
      if (plan.id === 'studio') {
        recurringValEl.textContent = isYearly ? 'R$ 58,43 / mês (R$ 701,16 faturado anualmente)' : 'R$ 89,90 / mês';
      } else if (plan.id === 'pro') {
        recurringValEl.textContent = isYearly ? 'R$ 35,68 / mês (R$ 428,16 faturado anualmente)' : 'R$ 54,90 / mês';
      } else {
        recurringValEl.textContent = 'Gratuito (R$ 0,00)';
      }
    }

    if (nextDateEl) {
      nextDateEl.textContent = plan.id === 'free' ? 'Não aplicável (Conta Free)' : '13 de Outubro de 2026';
    }

    // Update Catalog Card Active State
    ['free', 'pro', 'studio'].forEach(pId => {
      const card = document.getElementById(`catalog-card-${pId}`);
      const btn = document.getElementById(`btn-catalog-${pId}`);
      if (card && btn) {
        if (pId === plan.id) {
          card.classList.add('current-active-plan');
          btn.textContent = 'Plano Atual em Uso';
          btn.classList.add('btn-current-plan');
        } else {
          card.classList.remove('current-active-plan');
          btn.classList.remove('btn-current-plan');
          if (pId === 'free') btn.textContent = 'Mudar para Free';
          if (pId === 'pro') btn.textContent = 'Assinar Plano Pro';
          if (pId === 'studio') btn.textContent = 'Fazer Upgrade Studio';
        }
      }
    });

    renderInvoicesTable();
  }

  function renderInvoicesTable() {
    const tbody = document.getElementById('billing-invoices-tbody');
    const countTag = document.getElementById('invoices-count-tag');
    if (!tbody) return;

    const invoices = getInvoices();
    if (countTag) countTag.textContent = `${invoices.length} faturas conciliadas`;

    tbody.innerHTML = invoices.map(inv => `
      <tr>
        <td>
          <div style="font-family:var(--font-mono); font-weight:700; color:#fff; font-size:0.86rem;">
            #${inv.id}
          </div>
          <div style="font-size:0.72rem; color:var(--text-dimmed);">Autenticado SHA-256</div>
        </td>
        <td style="color:var(--text-light); font-size:0.84rem;">
          ${inv.date}
        </td>
        <td>
          <div style="font-weight:600; color:#fff; font-size:0.84rem;">${inv.planName}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Competência: ${inv.competence}</div>
        </td>
        <td style="font-size:0.82rem; color:var(--text-light);">
          ${inv.method.includes('PIX') ? '<span style="color:#38bdf8; font-weight:600;">PIX Instantâneo</span>' : '<span style="color:#a78bfa; font-weight:600;">Cartão de Crédito</span>'}
        </td>
        <td style="font-family:var(--font-mono); font-weight:700; color:#10b981; font-size:0.92rem;">
          ${inv.amountFormatted}
        </td>
        <td>
          <span class="badge-status-pill success">
            <span class="dot">●</span> LIQUIDADO
          </span>
        </td>
        <td style="text-align:right;">
          <button type="button" class="btn-download-receipt" onclick="PlansModule.openReceiptModal('${inv.id}')" title="Baixar comprovante e recibo fiscal digital">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Baixar Recibo PDF</span>
          </button>
        </td>
      </tr>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // CHECKOUT ENGINE & MODAL (#modal-checkout)
  // --------------------------------------------------------------------------
  function openCheckoutModal(planId = 'studio', cycle = 'yearly') {
    activeCheckoutPlan = planId === 'free' ? 'pro' : planId;
    activeCheckoutCycle = cycle;
    activePaymentTab = 'pix';
    activeCoupon = null;

    const modal = document.getElementById('modal-checkout');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.classList.add('active');

    // Update cycle buttons
    const btnAnnual = document.getElementById('chk-cycle-annual');
    const btnMonthly = document.getElementById('chk-cycle-monthly');
    if (btnAnnual && btnMonthly) {
      btnAnnual.classList.toggle('active', activeCheckoutCycle === 'yearly');
      btnMonthly.classList.toggle('active', activeCheckoutCycle === 'monthly');
    }

    // Set default payment tab
    selectPaymentTab('pix');

    // Update order breakdown
    updateCheckoutCalculations();

    // Start 15-minute countdown for PIX
    startPixTimer(15 * 60);

    if (window.NotificationCenter) {
      NotificationCenter.info('Ambiente de Checkout Criptografado TLS 1.3 aberto.', 'Checkout Seguro');
    }
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('modal-checkout');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    if (pixTimerInterval) {
      clearInterval(pixTimerInterval);
      pixTimerInterval = null;
    }
  }

  function setCheckoutCycle(cycle) {
    activeCheckoutCycle = cycle;
    localStorage.setItem(STORAGE_KEY_CYCLE, cycle);

    const btnAnnual = document.getElementById('chk-cycle-annual');
    const btnMonthly = document.getElementById('chk-cycle-monthly');
    if (btnAnnual && btnMonthly) {
      btnAnnual.classList.toggle('active', activeCheckoutCycle === 'yearly');
      btnMonthly.classList.toggle('active', activeCheckoutCycle === 'monthly');
    }

    updateCheckoutCalculations();

    if (window.NotificationCenter) {
      if (cycle === 'yearly') {
        NotificationCenter.success('Desconto de 35% aplicado no ciclo anual.', 'Economia Ativada');
      } else {
        NotificationCenter.info('Ciclo mensal selecionado.', 'Faturamento');
      }
    }
  }

  function updateCheckoutCalculations() {
    const planConfig = getPlanConfig(activeCheckoutPlan);
    const isYearly = activeCheckoutCycle === 'yearly';

    // Plan Title & Badge
    const badgeEl = document.getElementById('checkout-selected-plan-badge');
    const nameEl = document.getElementById('checkout-selected-plan-name');
    const descEl = document.getElementById('checkout-selected-plan-desc');

    if (badgeEl) badgeEl.textContent = planConfig.id.toUpperCase();
    if (nameEl) nameEl.textContent = planConfig.name;
    if (descEl) {
      descEl.textContent = planConfig.id === 'studio'
        ? '500 GB dedicados, domínio próprio (.com.br) incluso, inteligência artificial e galerias ilimitadas com entrega 4K.'
        : '100 GB de armazenamento de alta velocidade, galerias ilimitadas, exportação para Lightroom Classic e proteção por PIN.';
    }

    // Calculations
    const monthlyBase = planConfig.priceMonthly;
    const yearlyRawTotal = monthlyBase * 12;
    const yearlyDiscountedTotal = planConfig.priceYearly * 12;
    const cycleDiscount = yearlyRawTotal - yearlyDiscountedTotal;

    let subtotal = isYearly ? yearlyRawTotal : monthlyBase;
    let discount = isYearly ? cycleDiscount : 0;

    let couponDiscount = 0;
    if (activeCoupon) {
      couponDiscount = subtotal * activeCoupon.percent;
      discount += couponDiscount;
    }

    const finalTotal = Math.max(0, subtotal - discount);

    // Update Breakdown Elements
    const planLabelEl = document.getElementById('chk-breakdown-plan-label');
    const subtotalEl = document.getElementById('chk-breakdown-subtotal');
    const cycleDiscountRow = document.getElementById('chk-breakdown-cycle-discount-row');
    const cycleDiscountEl = document.getElementById('chk-breakdown-cycle-discount');
    const couponRow = document.getElementById('chk-breakdown-coupon-row');
    const couponDiscountEl = document.getElementById('chk-breakdown-coupon-discount');
    const totalEl = document.getElementById('chk-breakdown-total');
    const periodTextEl = document.getElementById('chk-breakdown-period-text');

    if (planLabelEl) {
      planLabelEl.textContent = `${planConfig.name} (${isYearly ? 'Anual' : 'Mensal'})`;
    }
    if (subtotalEl) {
      subtotalEl.textContent = formatCurrency(subtotal);
    }
    if (cycleDiscountRow) {
      cycleDiscountRow.style.display = isYearly ? 'flex' : 'none';
    }
    if (cycleDiscountEl) {
      cycleDiscountEl.textContent = `- ${formatCurrency(cycleDiscount)}`;
    }
    if (couponRow) {
      couponRow.style.display = activeCoupon ? 'flex' : 'none';
    }
    if (couponDiscountEl) {
      couponDiscountEl.textContent = `- ${formatCurrency(couponDiscount)}`;
    }
    if (totalEl) {
      totalEl.textContent = formatCurrency(finalTotal);
    }
    if (periodTextEl) {
      if (isYearly) {
        periodTextEl.textContent = `equivalente a ${formatCurrency(finalTotal / 12)}/mês`;
      } else {
        periodTextEl.textContent = 'cobrança mensal recorrente';
      }
    }

    // Update Installments Select
    const installmentsSelect = document.getElementById('chk-card-installments');
    if (installmentsSelect) {
      if (isYearly) {
        installmentsSelect.innerHTML = `
          <option value="1">1x de ${formatCurrency(finalTotal)} à vista sem juros</option>
          <option value="2">2x de ${formatCurrency(finalTotal / 2)} sem juros</option>
          <option value="3">3x de ${formatCurrency(finalTotal / 3)} sem juros</option>
          <option value="6">6x de ${formatCurrency(finalTotal / 6)} sem juros</option>
          <option value="12" selected>12x de ${formatCurrency(finalTotal / 12)} sem juros</option>
        `;
      } else {
        installmentsSelect.innerHTML = `
          <option value="1" selected>1x de ${formatCurrency(finalTotal)} (Débito mensal recorrente)</option>
        `;
      }
    }

    // Update PIX payload
    const pixPayloadEl = document.getElementById('chk-pix-payload');
    if (pixPayloadEl) {
      const cents = Math.round(finalTotal * 100);
      pixPayloadEl.value = `00020126580014br.gov.bcb.pix0136picdrop-f${Math.floor(1000+Math.random()*9000)}@picdrop.com.br520400005303986540${cents}5802BR5925PICDROP SAAS BRASIL LTDA6009SAO PAULO62070503***6304E8A2`;
    }

    // Update Boleto Digits
    const boletoDigitsEl = document.getElementById('chk-boleto-digits');
    if (boletoDigitsEl) {
      boletoDigitsEl.textContent = `34191.79001 01043.510047 91020.150008 5 ${Math.floor(80000000000000 + finalTotal * 100)}`;
    }
  }

  function formatCurrency(val) {
    return 'R$ ' + Number(val).toFixed(2).replace('.', ',');
  }

  function applyCheckoutCoupon() {
    const input = document.getElementById('chk-coupon-input');
    const feedback = document.getElementById('chk-coupon-feedback');
    if (!input || !feedback) return;

    const code = input.value.trim().toUpperCase();
    if (!code) {
      feedback.style.display = 'block';
      feedback.className = 'coupon-feedback-msg error';
      feedback.textContent = 'Por favor, digite o código do cupom.';
      return;
    }

    if (code === 'FOTOGRAFO10' || code === 'VIP2026' || code === 'ESTUDIO15') {
      const pct = code === 'ESTUDIO15' ? 0.15 : 0.10;
      activeCoupon = { code, percent: pct };
      feedback.style.display = 'block';
      feedback.className = 'coupon-feedback-msg success';
      feedback.textContent = `✓ Cupom ${code} aplicado com sucesso (${Math.round(pct * 100)}% OFF adicional)!`;
      updateCheckoutCalculations();
      if (window.NotificationCenter) {
        NotificationCenter.success(`Cupom ${code} validado! Desconto adicional aplicado.`, 'Cupom Promocional');
      }
    } else {
      feedback.style.display = 'block';
      feedback.className = 'coupon-feedback-msg error';
      feedback.textContent = `Cupom "${code}" inválido ou expirado. Tente "FOTOGRAFO10".`;
      if (window.NotificationCenter) {
        NotificationCenter.warning(`Cupom "${code}" não reconhecido.`, 'Cupom Inválido');
      }
    }
  }

  function selectPaymentTab(tab) {
    activePaymentTab = tab;
    ['pix', 'card', 'boleto'].forEach(t => {
      const btn = document.getElementById(`tab-btn-${t}`);
      const content = document.getElementById(`tab-content-${t}`);
      if (btn) btn.classList.toggle('active', t === tab);
      if (content) content.classList.toggle('active', t === tab);
    });
  }

  function startPixTimer(durationSeconds) {
    if (pixTimerInterval) clearInterval(pixTimerInterval);
    let timeLeft = durationSeconds;
    const timerEl = document.getElementById('pix-timer-count');

    function update() {
      if (!timerEl) return;
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      if (timeLeft <= 0) {
        clearInterval(pixTimerInterval);
        timerEl.textContent = 'Expirado';
      }
      timeLeft--;
    }

    update();
    pixTimerInterval = setInterval(update, 1000);
  }

  function copyPixKey() {
    const input = document.getElementById('chk-pix-payload');
    if (!input) return;

    input.select();
    input.setSelectionRange(0, 99999);
    try {
      navigator.clipboard.writeText(input.value);
    } catch(e) {
      document.execCommand('copy');
    }

    if (window.NotificationCenter) {
      NotificationCenter.success('Código PIX Copia-e-Cola copiado para a área de transferência! Cole no aplicativo do seu banco.', 'PIX Pronto para Pagar');
    }
  }

  // --------------------------------------------------------------------------
  // PAYMENT COMPLETION (PIX, CARTÃO, BOLETO)
  // --------------------------------------------------------------------------
  function processPixPayment() {
    const confirmBtn = document.getElementById('btn-pix-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-inline"></span> Sincronizando com Banco Central...';
    }

    setTimeout(() => {
      completePaymentTransaction('PIX');
    }, 1200);
  }

  function processCardPayment() {
    const numberInput = document.getElementById('chk-card-number');
    const nameInput = document.getElementById('chk-card-name');
    const expInput = document.getElementById('chk-card-exp');
    const cvvInput = document.getElementById('chk-card-cvv');
    const submitBtn = document.getElementById('btn-card-submit');
    const submitText = document.getElementById('btn-card-submit-text');

    if (!numberInput || !nameInput || !expInput || !cvvInput) return;

    if (numberInput.value.replace(/\s+/g, '').length < 15) {
      if (window.NotificationCenter) NotificationCenter.warning('Por favor, informe o número completo do cartão.', 'Dados Incompletos');
      numberInput.focus();
      return;
    }

    if (!nameInput.value.trim()) {
      if (window.NotificationCenter) NotificationCenter.warning('Informe o nome do titular impresso no cartão.', 'Dados Incompletos');
      nameInput.focus();
      return;
    }

    if (submitBtn && submitText) {
      submitBtn.disabled = true;
      submitText.textContent = 'Processando com Criptografia 3D-Secure...';
    }

    setTimeout(() => {
      const last4 = numberInput.value.replace(/\s+/g, '').slice(-4) || '4821';
      completePaymentTransaction(`Cartão de Crédito Mastercard •••• ${last4}`);
    }, 1400);
  }

  function processBoletoPayment() {
    completePaymentTransaction('Boleto Bancário Registrado (Compensação em 24h)');
  }

  function completePaymentTransaction(methodString) {
    const planConfig = getPlanConfig(activeCheckoutPlan);
    const isYearly = activeCheckoutCycle === 'yearly';

    const customerName = document.getElementById('chk-customer-name')?.value || 'Maria Clark';
    const customerDoc = document.getElementById('chk-customer-doc')?.value || '48.921.340/0001-82';
    const customerEmail = document.getElementById('chk-customer-email')?.value || 'contato@mariaclark.com.br';

    // Calculate final amount
    const monthlyBase = planConfig.priceMonthly;
    const rawSubtotal = isYearly ? monthlyBase * 12 : monthlyBase;
    const cycleDiscount = isYearly ? (monthlyBase - planConfig.priceYearly) * 12 : 0;
    const couponDiscount = activeCoupon ? rawSubtotal * activeCoupon.percent : 0;
    const finalAmount = Math.max(0, rawSubtotal - cycleDiscount - couponDiscount);

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const competence = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const txId = `TX-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice = {
      id: txId,
      date: dateFormatted,
      competence: competence,
      planId: planConfig.id,
      planName: `${planConfig.name} (${isYearly ? 'Anual' : 'Mensal'})`,
      amountFormatted: formatCurrency(finalAmount),
      subtotalFormatted: formatCurrency(rawSubtotal),
      discountFormatted: `- ${formatCurrency(cycleDiscount + couponDiscount)}`,
      method: methodString,
      status: 'PAGO',
      clientName: customerName,
      clientDoc: customerDoc,
      clientEmail: customerEmail,
      hash: generatePseudoHash(txId + finalAmount)
    };

    // Save invoice to history
    const invoices = getInvoices();
    invoices.unshift(newInvoice);
    saveInvoices(invoices);

    // Activate the new plan!
    setPlan(planConfig.id);

    // Close checkout modal
    closeCheckoutModal();

    // Reset button states
    const pixBtn = document.getElementById('btn-pix-confirm');
    if (pixBtn) {
      pixBtn.disabled = false;
      pixBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> <span>Já fiz o PIX! Confirmar Pagamento Imediato</span>';
    }

    const cardBtn = document.getElementById('btn-card-submit');
    const cardText = document.getElementById('btn-card-submit-text');
    if (cardBtn && cardText) {
      cardBtn.disabled = false;
      cardText.textContent = 'Pagar com Cartão & Ativar Licença';
    }

    // Celebration feedback
    if (window.NotificationCenter) {
      NotificationCenter.studio(
        `Parabéns! Sua assinatura do ${planConfig.name} está ativa e confirmada sob a Fatura #${txId}.`,
        'Assinatura Comercial Ativada'
      );
    }

    // Automatically display official fiscal receipt
    setTimeout(() => {
      openReceiptModal(txId);
    }, 400);
  }

  function generatePseudoHash(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16) + 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    return hex.slice(0, 64);
  }

  // --------------------------------------------------------------------------
  // OFFICIAL FISCAL RECEIPT MODAL (#modal-receipt)
  // --------------------------------------------------------------------------
  function openReceiptModal(invoiceId) {
    const invoices = getInvoices();
    const invoice = invoices.find(i => i.id === invoiceId) || invoices[0];
    if (!invoice) return;

    const modal = document.getElementById('modal-receipt');
    if (!modal) return;

    const planConfig = getPlanConfig(invoice.planId);

    // Populate Receipt
    const txNumEl = document.getElementById('receipt-tx-number');
    const txDateEl = document.getElementById('receipt-tx-date');
    const clientNameEl = document.getElementById('rc-client-name');
    const clientDocEl = document.getElementById('rc-client-doc');
    const clientEmailEl = document.getElementById('rc-client-email');
    const serviceTitleEl = document.getElementById('rc-service-title');
    const serviceDescEl = document.getElementById('rc-service-desc');
    const serviceCompetenceEl = document.getElementById('rc-service-competence');
    const serviceCycleEl = document.getElementById('rc-service-cycle');
    const serviceValEl = document.getElementById('rc-service-val');
    const subtotalEl = document.getElementById('rc-subtotal');
    const discountEl = document.getElementById('rc-discount');
    const totalEl = document.getElementById('rc-total');
    const paymentMethodEl = document.getElementById('rc-payment-method');
    const hashEl = document.getElementById('rc-hash-code');

    if (txNumEl) txNumEl.textContent = `RECIBO FISCAL #${invoice.id}`;
    if (txDateEl) txDateEl.textContent = `Data de Liquidação: ${invoice.date}`;
    if (clientNameEl) clientNameEl.textContent = invoice.clientName;
    if (clientDocEl) clientDocEl.textContent = invoice.clientDoc;
    if (clientEmailEl) clientEmailEl.textContent = invoice.clientEmail;

    if (serviceTitleEl) serviceTitleEl.textContent = `Licença de Software SaaS — ${invoice.planName}`;
    if (serviceDescEl) {
      serviceDescEl.textContent = invoice.planId === 'studio'
        ? 'Armazenamento em Nuvem Dedicado 500GB, Galerias Ilimitadas, Domínio Próprio e Exportação Lightroom Classic'
        : 'Armazenamento de Alta Performance 100GB, Galerias Ilimitadas e PIN de Download Seguro';
    }
    if (serviceCompetenceEl) serviceCompetenceEl.textContent = invoice.competence;
    if (serviceCycleEl) serviceCycleEl.textContent = invoice.planName.includes('Anual') ? 'Anual' : 'Mensal';
    if (serviceValEl) serviceValEl.textContent = invoice.amountFormatted;

    if (subtotalEl) subtotalEl.textContent = invoice.subtotalFormatted || invoice.amountFormatted;
    if (discountEl) discountEl.textContent = invoice.discountFormatted || '- R$ 0,00';
    if (totalEl) totalEl.textContent = invoice.amountFormatted;
    if (paymentMethodEl) paymentMethodEl.textContent = `Forma de Liquidação: ${invoice.method}`;
    if (hashEl) hashEl.textContent = invoice.hash;

    modal.style.display = 'flex';
    modal.classList.add('active');
  }

  function closeReceiptModal() {
    const modal = document.getElementById('modal-receipt');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  }

  function printReceipt() {
    if (window.NotificationCenter) {
      NotificationCenter.info('Preparando documento fiscal para impressão ou exportação em PDF.', 'Recibo PicDrop');
    }
    window.print();
  }

  // --------------------------------------------------------------------------
  // INPUT MASKS & CARD PREVIEW HELPERS
  // --------------------------------------------------------------------------
  function formatCardNumber(input) {
    let val = input.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    const sections = val.match(/.{1,4}/g);
    input.value = sections ? sections.join(' ') : val;

    // Update Virtual Card Preview
    const previewNum = document.getElementById('card-preview-number');
    if (previewNum) {
      const padded = val.padEnd(16, '•');
      const paddedSections = padded.match(/.{1,4}/g);
      previewNum.textContent = paddedSections ? paddedSections.join(' ') : '•••• •••• •••• 4821';
    }

    // Detect Brand
    const brandText = document.getElementById('card-input-brand-text');
    let brand = 'Mastercard';
    if (val.startsWith('4')) brand = 'Visa';
    else if (val.startsWith('5')) brand = 'Mastercard';
    else if (val.startsWith('3')) brand = 'Amex';
    else if (val.startsWith('6')) brand = 'Elo';

    if (brandText) brandText.textContent = brand;
  }

  function updateCardHolder(val) {
    const previewHolder = document.getElementById('card-preview-holder');
    if (previewHolder) {
      previewHolder.textContent = val.toUpperCase() || 'MARIA CLARK';
    }
  }

  function formatCardExp(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    input.value = val.substring(0, 5);

    const previewExp = document.getElementById('card-preview-exp');
    if (previewExp) {
      previewExp.textContent = input.value || '09/29';
    }
  }

  function formatDocumentMask(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length <= 11) {
      // CPF: 000.000.000-00
      val = val.replace(/(\d{3})(\d)/, '$1.$2');
      val = val.replace(/(\d{3})(\d)/, '$1.$2');
      val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      val = val.substring(0, 14);
      val = val.replace(/^(\d{2})(\d)/, '$1.$2');
      val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2');
      val = val.replace(/\.(\d{3})(\d)/, '.$1/$2');
      val = val.replace(/(\d{4})(\d)/, '$1-$2');
    }
    input.value = val;
  }

  function formatPhoneMask(input) {
    let val = input.value.replace(/\D/g, '');
    val = val.substring(0, 11);
    if (val.length > 2) {
      val = `(${val.substring(0, 2)}) ` + val.substring(2);
    }
    if (val.length > 9) {
      val = val.substring(0, 10) + '-' + val.substring(10);
    }
    input.value = val;
  }

  // Commercial upgrade modal trigger
  function showUpgradeModal(requiredFeatureName = 'Recurso Avançado', recommendedPlan = 'studio') {
    openCheckoutModal(recommendedPlan);
  }

  function closeUpgradeModal() {
    closeCheckoutModal();
  }

  return {
    init: () => {
      applyPlanUI();
      renderBillingCentral();
    },
    getCurrentPlanId,
    getPlanConfig,
    setPlan,
    applyPlanUI,
    openBillingPortal,
    renderBillingCentral,
    renderInvoicesTable,
    openCheckoutModal,
    closeCheckoutModal,
    setCheckoutCycle,
    selectPaymentTab,
    applyCheckoutCoupon,
    copyPixKey,
    processPixPayment,
    processCardPayment,
    processBoletoPayment,
    openReceiptModal,
    closeReceiptModal,
    printReceipt,
    formatCardNumber,
    updateCardHolder,
    formatCardExp,
    formatDocumentMask,
    formatPhoneMask,
    showUpgradeModal,
    closeUpgradeModal
  };
})();

if (typeof window !== 'undefined') {
  window.PlansModule = PlansModule;
}
