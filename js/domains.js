/* ==========================================================================
   PICDROP - DOMAIN MANAGEMENT & REGISTRATION MODULE
   Search, Buy and Connect Custom Domain to Photographer Portfolio
   ========================================================================== */

const DomainsModule = (() => {
  const STORAGE_KEY_DOMAIN = 'picdrop_connected_domain';

  const defaultDomain = {
    domainName: 'mariaclarkfoto.com.br',
    status: 'active', // active, pending, none
    connectedAt: '2026-08-15',
    sslActive: true,
    dnsVerified: true,
    aRecord: '185.199.108.153',
    cname: 'cname.picdrop.me'
  };

  function getConnectedDomain() {
    const data = localStorage.getItem(STORAGE_KEY_DOMAIN);
    return data ? JSON.parse(data) : defaultDomain;
  }

  function saveConnectedDomain(dom) {
    localStorage.setItem(STORAGE_KEY_DOMAIN, JSON.stringify(dom));
  }

  function searchDomainAvailability(query) {
    if (!query) return [];
    
    // Normalize input
    let clean = query.toLowerCase().trim().replace(/https?:\/\//, '').replace(/\/$/, '');
    clean = clean.split('.')[0]; // grab base keyword

    if (!clean) clean = 'seunomefoto';

    return [
      { domain: `${clean}.com.br`, price: 'R$ 49,90/ano', available: true, popular: true },
      { domain: `${clean}.com`, price: 'R$ 69,90/ano', available: true, popular: false },
      { domain: `${clean}.photography`, price: 'R$ 99,00/ano', available: true, popular: false },
      { domain: `${clean}.art`, price: 'R$ 79,00/ano', available: true, popular: false },
      { domain: `${clean}.studio`, price: 'R$ 84,00/ano', available: true, popular: false }
    ];
  }

  function renderSearchResults(query) {
    const resultsContainer = document.getElementById('domain-results-grid');
    if (!resultsContainer) return;

    const results = searchDomainAvailability(query);
    resultsContainer.innerHTML = '';
    NotificationCenter.info(`Consulta realizada: 5 extensões com apontamento DNS disponíveis.`, 'Registro de Domínio');

    results.forEach(item => {
      const card = document.createElement('div');
      card.className = 'domain-result-card';
      card.innerHTML = `
        <div>
          <div class="domain-name-tag">${item.domain}</div>
          <div class="domain-status-free">✓ Disponível para Registro Instantâneo</div>
        </div>
        <div style="text-align:right;">
          <div class="domain-price-tag"><strong>${item.price}</strong></div>
          <button class="btn-cta-primary btn-buy-domain" data-domain="${item.domain}" style="padding:8px 18px; font-size:0.85rem; margin-top:8px;">
            Comprar e Conectar
          </button>
        </div>
      `;
      resultsContainer.appendChild(card);
    });

    // Attach click listeners
    resultsContainer.querySelectorAll('.btn-buy-domain').forEach(btn => {
      btn.onclick = () => {
        const domainToBuy = btn.getAttribute('data-domain');
        attemptPurchaseDomain(domainToBuy);
      };
    });
  }

  function attemptPurchaseDomain(domainName) {
    const plan = PlansModule.getPlanConfig();

    // Enforce plan restriction: Domain requires Studio plan
    if (!plan.features.customDomain) {
      PlansModule.showUpgradeModal('Domínio Próprio (.com.br / .com)', 'studio');
      return;
    }

    // Studio plan includes custom domain registration
    const newDomain = {
      domainName: domainName,
      status: 'active',
      connectedAt: new Date().toISOString().split('T')[0],
      sslActive: true,
      dnsVerified: true,
      aRecord: '185.199.108.153',
      cname: 'cname.picdrop.me'
    };
    saveConnectedDomain(newDomain);
    updateDomainUI();
    window.showToast(`Domínio ${domainName} registrado e conectado com certificado SSL TLS 1.3 ativo.`, 'success', 'Domínio Ativado');
  }

  function updateDomainUI() {
    const current = getConnectedDomain();
    const activeDomainEl = document.getElementById('active-domain-name');
    const activeDomainLink = document.getElementById('active-domain-link');
    const sslStatusEl = document.getElementById('ssl-status-indicator');
    const dnsStatusEl = document.getElementById('dns-status-indicator');

    if (activeDomainEl) activeDomainEl.textContent = current.domainName;
    if (activeDomainLink) {
      activeDomainLink.href = `https://${current.domainName}`;
      activeDomainLink.textContent = `https://${current.domainName}`;
    }
    if (sslStatusEl) {
      sslStatusEl.innerHTML = current.sslActive 
        ? '<span style="color:var(--accent-green); font-weight:700;">🔒 SSL Ativo (Let\'s Encrypt 256-bit)</span>'
        : '<span style="color:var(--accent-red);">Emissao pendente</span>';
    }
    if (dnsStatusEl) {
      dnsStatusEl.innerHTML = current.dnsVerified 
        ? '<span style="color:var(--accent-green); font-weight:700;">✓ DNS Propagado e Apontado</span>'
        : '<span style="color:var(--accent-gold);">Aguardando propagação</span>';
    }
  }

  return {
    init: () => {
      updateDomainUI();

      const searchInput = document.getElementById('domain-search-input');
      const searchBtn = document.getElementById('btn-search-domain');

      if (searchInput && searchBtn) {
        searchBtn.onclick = () => renderSearchResults(searchInput.value || 'mariaclark');
        searchInput.onkeypress = (e) => {
          if (e.key === 'Enter') renderSearchResults(searchInput.value || 'mariaclark');
        };
      }
    },
    getConnectedDomain,
    updateDomainUI,
    attemptPurchaseDomain
  };
})();

if (typeof window !== 'undefined') {
  window.DomainsModule = DomainsModule;
}

