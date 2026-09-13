/* ==========================================================================
   PICDROP - REFERRAL & INVOICE DISCOUNT MODULE
   Referral links, invite tracking, and automatic next invoice deductions
   ========================================================================== */

const ReferralModule = (() => {
  const STORAGE_KEY_REFERRAL = 'picdrop_referral_stats';

  const defaultStats = {
    code: 'MARIACLARK20',
    clicks: 48,
    registered: 6,
    activeSubscribers: 2, // 2 active paying referrals
    discountPerSubscriber: 20.00 // R$ 20,00 off next invoice per active subscriber
  };

  function getReferralData() {
    const data = localStorage.getItem(STORAGE_KEY_REFERRAL);
    return data ? JSON.parse(data) : defaultStats;
  }

  function saveReferralData(data) {
    localStorage.setItem(STORAGE_KEY_REFERRAL, JSON.stringify(data));
  }

  function simulateNewReferral() {
    const stats = getReferralData();
    stats.clicks += Math.floor(Math.random() * 5 + 3);
    stats.registered += 1;
    stats.activeSubscribers += 1;
    saveReferralData(stats);
    updateInvoiceUI();
    window.showToast('Novo assinante registrado via seu link. Crédito de +R$ 20,00 deduzido na próxima fatura.', 'success', 'Indicação Confirmada');
  }

  function updateInvoiceUI() {
    const stats = getReferralData();
    const plan = PlansModule.getPlanConfig();

    // Elements
    const linkInput = document.getElementById('referral-link-input');
    const clicksEl = document.getElementById('ref-clicks-count');
    const registeredEl = document.getElementById('ref-registered-count');
    const activeEl = document.getElementById('ref-active-count');
    const totalCreditEl = document.getElementById('ref-total-credit');

    if (linkInput) linkInput.value = `https://picdrop.me/r/${stats.code}`;
    if (clicksEl) clicksEl.textContent = stats.clicks;
    if (registeredEl) registeredEl.textContent = stats.registered;
    if (activeEl) activeEl.textContent = stats.activeSubscribers;

    // Financial Calculation for Next Invoice
    const basePrice = plan.priceMonthly;
    const totalDiscount = Math.min(basePrice, stats.activeSubscribers * stats.discountPerSubscriber);
    const finalInvoiceAmount = Math.max(0, basePrice - totalDiscount);

    if (totalCreditEl) {
      totalCreditEl.textContent = `R$ ${(stats.activeSubscribers * stats.discountPerSubscriber).toFixed(2).replace('.', ',')}`;
    }

    // Invoice Breakdown Rows
    const invoicePlanName = document.getElementById('invoice-plan-name');
    const invoiceBasePrice = document.getElementById('invoice-base-price');
    const invoiceDiscountRow = document.getElementById('invoice-discount-row');
    const invoiceDiscountVal = document.getElementById('invoice-discount-val');
    const invoiceTotalVal = document.getElementById('invoice-total-val');

    if (invoicePlanName) invoicePlanName.textContent = `Mensalidade ${plan.name}`;
    if (invoiceBasePrice) invoiceBasePrice.textContent = `R$ ${basePrice.toFixed(2).replace('.', ',')}`;

    if (invoiceDiscountRow && invoiceDiscountVal) {
      if (totalDiscount > 0) {
        invoiceDiscountRow.style.display = 'flex';
        invoiceDiscountVal.textContent = `- R$ ${totalDiscount.toFixed(2).replace('.', ',')}`;
      } else {
        invoiceDiscountRow.style.display = 'none';
      }
    }

    if (invoiceTotalVal) {
      invoiceTotalVal.textContent = `R$ ${finalInvoiceAmount.toFixed(2).replace('.', ',')}`;
    }
  }

  function copyReferralLink() {
    const linkInput = document.getElementById('referral-link-input');
    if (!linkInput) return;
    linkInput.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(linkInput.value).then(() => {
        window.showToast('Link de indicação copiado para a área de transferência.', 'info', 'Link Copiado');
      }).catch(() => {
        window.showToast('Link selecionado. Pressione Ctrl+C para copiar.', 'info', 'Copiar Link');
      });
    } else {
      document.execCommand('copy');
      window.showToast('Link de indicação copiado para a área de transferência.', 'info', 'Link Copiado');
    }
  }

  return {
    init: () => {
      updateInvoiceUI();

      const btnCopy = document.getElementById('btn-copy-referral');
      if (btnCopy) btnCopy.onclick = copyReferralLink;

      const btnSimulate = document.getElementById('btn-simulate-referral');
      if (btnSimulate) btnSimulate.onclick = simulateNewReferral;
    },
    getReferralData,
    updateInvoiceUI,
    simulateNewReferral
  };
})();

if (typeof window !== 'undefined') {
  window.ReferralModule = ReferralModule;
}

