/* ==========================================================================
   PICDROP - SECURITY & 2FA & LOGIN HISTORY MODULE
   ========================================================================== */

const SecurityModule = (() => {
  const STORAGE_KEY_2FA = 'picdrop_2fa_config';
  const STORAGE_KEY_HISTORY = 'picdrop_login_history';

  // Initial mock history entries
  const defaultHistory = [
    {
      id: 'sess-01',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      device: 'Windows 11 • Chrome 128',
      ip: '187.54.210.33',
      location: 'São Paulo, Brasil',
      method: 'Username (@mariaclark)',
      status: 'success',
      is2fa: true,
      current: true
    },
    {
      id: 'sess-02',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      device: 'iPhone 15 Pro • Safari Mobile',
      ip: '187.54.210.33',
      location: 'São Paulo, Brasil',
      method: 'E-mail (maria@clark.com)',
      status: 'success',
      is2fa: true,
      current: false
    },
    {
      id: 'sess-03',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      device: 'macOS Sonoma • Safari 17',
      ip: '201.86.114.92',
      location: 'Rio de Janeiro, Brasil',
      method: 'Username (@mariaclark)',
      status: 'failed',
      is2fa: false,
      current: false
    }
  ];

  function getHistory() {
    const data = localStorage.getItem(STORAGE_KEY_HISTORY);
    return data ? JSON.parse(data) : defaultHistory;
  }

  function saveHistory(list) {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(list));
  }

  function recordLogin(method, userIdentifier, status = 'success', is2fa = false) {
    const list = getHistory();
    // Mark previous current session as not current
    list.forEach(item => item.current = false);

    // Detect browser/OS
    const userAgent = navigator.userAgent;
    let deviceName = 'Desktop • Navegador Moderno';
    if (userAgent.includes('Windows')) deviceName = 'Windows 11 • Chrome 128';
    else if (userAgent.includes('Macintosh')) deviceName = 'macOS • Safari';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceName = 'iOS • Safari Mobile';
    else if (userAgent.includes('Android')) deviceName = 'Android • Chrome Mobile';

    const newEntry = {
      id: 'sess-' + Date.now(),
      timestamp: new Date().toISOString(),
      device: deviceName,
      ip: '187.54.210.' + Math.floor(Math.random() * 80 + 10),
      location: 'São Paulo, Brasil',
      method: method.includes('@') && !method.startsWith('@') ? `E-mail (${userIdentifier})` : `Username (${userIdentifier})`,
      status: status,
      is2fa: is2fa,
      current: status === 'success'
    };

    list.unshift(newEntry);
    if (list.length > 20) list.pop();
    saveHistory(list);
    renderHistoryTable();
  }

  function renderHistoryTable() {
    const tbody = document.getElementById('login-history-tbody');
    if (!tbody) return;

    const history = getHistory();
    tbody.innerHTML = '';

    if (history.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-dimmed);">Nenhum histórico registrado ainda.</td></tr>`;
      return;
    }

    history.forEach(item => {
      const dateObj = new Date(item.timestamp);
      const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' às ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight:600; color:#fff;">${dateStr}</div>
          ${item.current ? '<span style="font-size:0.7rem; color:var(--accent-green); font-weight:800;">(SESSÃO ATUAL)</span>' : ''}
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <span>${item.device}</span>
          </div>
        </td>
        <td><code>${item.ip}</code></td>
        <td>${item.location}</td>
        <td>
          <div>${item.method}</div>
          ${item.is2fa ? '<span style="font-size:0.68rem; background:rgba(6,182,212,0.15); color:var(--accent-cyan); padding:2px 6px; border-radius:4px; font-weight:700;">2FA ATIVO</span>' : ''}
        </td>
        <td>
          ${item.status === 'success' 
            ? '<span class="badge-status success">● Sucesso</span>' 
            : '<span class="badge-status failed">✕ Bloqueado</span>'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function terminateOtherSessions() {
    const list = getHistory();
    const active = list.filter(item => item.current);
    saveHistory(active);
    renderHistoryTable();
    window.showToast('Todas as outras sessões ativas foram revogadas com sucesso.', 'success', 'Sessões Revogadas');
  }

  // 2FA state management
  function is2FAEnabled() {
    const cfg = localStorage.getItem(STORAGE_KEY_2FA);
    if (!cfg) return true; // Enabled by default for rich demo
    return JSON.parse(cfg).enabled;
  }

  function set2FAState(enabled) {
    localStorage.setItem(STORAGE_KEY_2FA, JSON.stringify({
      enabled: enabled,
      secret: 'JBSWY3DPEHPK3PXP',
      backupCodes: ['48291034', '91028374', '55192834', '77218392']
    }));
    update2FAUI();
  }

  function update2FAUI() {
    const toggleInput = document.getElementById('2fa-toggle-switch');
    const statusText = document.getElementById('2fa-status-text');
    const qrContainer = document.getElementById('2fa-setup-details');

    const enabled = is2FAEnabled();
    if (toggleInput) toggleInput.checked = enabled;
    if (statusText) {
      statusText.innerHTML = enabled 
        ? '<span style="color:var(--accent-green); font-weight:700;">● Ativado (Protegido por aplicativo autenticador)</span>'
        : '<span style="color:var(--text-muted);">Desativado (Recomendamos ativar para proteção da sua conta)</span>';
    }
    if (qrContainer) {
      qrContainer.style.display = enabled ? 'block' : 'none';
    }
  }

  return {
    init: () => {
      renderHistoryTable();
      update2FAUI();
    },
    recordLogin,
    getHistory,
    renderHistoryTable,
    terminateOtherSessions,
    is2FAEnabled,
    set2FAState,
    update2FAUI
  };
})();

if (typeof window !== 'undefined') {
  window.SecurityModule = SecurityModule;
}

