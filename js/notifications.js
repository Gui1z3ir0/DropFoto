/* ==========================================================================
   PICDROP — ENTERPRISE NOTIFICATION CENTER & TOAST ENGINE
   Replaces all native browser dialogs (alert, confirm, prompt) with
   ultra-high-end, accessible, hardware-accelerated toast notifications.
   ========================================================================== */

const NotificationCenter = (() => {
  let container = null;
  const activeToasts = new Set();

  function getOrCreateContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.getElementById('system-notification-center');
      if (!container) {
        container = document.createElement('div');
        container.id = 'system-notification-center';
        container.className = 'studio-toast-center';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
      }
    }
    return container;
  }

  // Soft executive audio feedback via Web Audio API (completely silent if blocked/error)
  function playHapticSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      osc.type = 'sine';

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.08); // A5
      } else if (type === 'error') {
        osc.frequency.setValueAtTime(349.23, now); // F4
        osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.09); // C4
      } else if (type === 'warning') {
        osc.frequency.setValueAtTime(440.00, now); // A4
        osc.frequency.exponentialRampToValueAtTime(493.88, now + 0.08); // B4
      } else {
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.07); // A5
      }

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      // Audio autoplay policy or not supported - silently ignored
    }
  }

  function getCategoryMeta(type) {
    switch (type) {
      case 'success':
        return {
          badge: 'CONFIRMADO',
          titleFallback: 'Operação Concluída',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        };
      case 'error':
        return {
          badge: 'FALHA DE ACESSO',
          titleFallback: 'Atenção Requerida',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
        };
      case 'warning':
        return {
          badge: 'GOVERNANÇA',
          titleFallback: 'Aviso do Sistema',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
        };
      case 'studio':
        return {
          badge: 'ESTÚDIO PRO',
          titleFallback: 'Recurso Studio',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>'
        };
      case 'info':
      default:
        return {
          badge: 'SISTEMA',
          titleFallback: 'Notificação PicDrop',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
    }
  }

  function show(options) {
    if (typeof options === 'string') {
      options = { message: options };
    }

    const {
      message = '',
      type = 'info',
      title = '',
      badge = '',
      duration = 4200
    } = options;

    const host = getOrCreateContainer();
    const meta = getCategoryMeta(type);
    const finalTitle = title || meta.titleFallback;
    const finalBadge = badge || meta.badge;

    // Build Toast Node
    const toast = document.createElement('div');
    toast.className = `studio-toast studio-toast-${type}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
      <div class="toast-indicator-strip"></div>
      <div class="toast-body">
        <div class="toast-header-row">
          <div class="toast-badge-group">
            <span class="toast-icon-wrapper">${meta.icon}</span>
            <span class="toast-badge-pill">${finalBadge}</span>
          </div>
          <div class="toast-meta-group">
            <span class="toast-timestamp">Agora</span>
            <button class="toast-dismiss-btn" aria-label="Fechar Notificação" title="Dispensar">&times;</button>
          </div>
        </div>
        <div class="toast-content-box">
          <h4 class="toast-title">${finalTitle}</h4>
          <p class="toast-description">${message}</p>
        </div>
      </div>
      <div class="toast-progress-track">
        <div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div>
      </div>
    `;

    // Audio chime
    playHapticSound(type);

    // Add to container
    host.appendChild(toast);
    activeToasts.add(toast);

    // Animation trigger
    requestAnimationFrame(() => {
      toast.classList.add('is-active');
    });

    let dismissTimeout = null;
    let startTime = Date.now();
    let remainingTime = duration;
    let isPaused = false;

    const startTimer = (ms) => {
      clearTimeout(dismissTimeout);
      dismissTimeout = setTimeout(dismiss, ms);
    };

    const pauseTimer = () => {
      if (isPaused) return;
      isPaused = true;
      clearTimeout(dismissTimeout);
      remainingTime -= Date.now() - startTime;
      const bar = toast.querySelector('.toast-progress-bar');
      if (bar) bar.style.animationPlayState = 'paused';
    };

    const resumeTimer = () => {
      if (!isPaused) return;
      isPaused = false;
      startTime = Date.now();
      const bar = toast.querySelector('.toast-progress-bar');
      if (bar) bar.style.animationPlayState = 'running';
      startTimer(Math.max(remainingTime, 1000));
    };

    const dismiss = () => {
      clearTimeout(dismissTimeout);
      if (!toast.parentElement) return;

      toast.classList.remove('is-active');
      toast.classList.add('is-leaving');

      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
        activeToasts.delete(toast);
      }, 300);
    };

    // Event Handlers
    const closeBtn = toast.querySelector('.toast-dismiss-btn');
    if (closeBtn) closeBtn.onclick = (e) => {
      e.stopPropagation();
      dismiss();
    };

    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', resumeTimer);
    toast.addEventListener('click', (e) => {
      if (!e.target.closest('.toast-dismiss-btn')) {
        // Optional quick dismiss on double click or simple close
      }
    });

    startTimer(duration);

    return {
      element: toast,
      dismiss
    };
  }

  // Clear all
  function clearAll() {
    activeToasts.forEach(t => {
      if (t.parentElement) t.parentElement.removeChild(t);
    });
    activeToasts.clear();
  }

  return {
    show,
    success: (msg, title, badge) => show({ message: msg, type: 'success', title, badge }),
    info: (msg, title, badge) => show({ message: msg, type: 'info', title, badge }),
    warning: (msg, title, badge) => show({ message: msg, type: 'warning', title, badge }),
    error: (msg, title, badge) => show({ message: msg, type: 'error', title, badge }),
    studio: (msg, title, badge) => show({ message: msg, type: 'studio', title, badge }),
    clearAll
  };
})();

// Global Binding
window.NotificationCenter = NotificationCenter;
window.showToast = function(message, type = 'info', title = '', badge = '') {
  return NotificationCenter.show({ message, type, title, badge });
};
window.showPrecisionToast = function(message, type = 'info') {
  return NotificationCenter.show({ message, type });
};

// Global Browser Alert Override: Guarantee zero raw browser alert dialogs anywhere
window.alert = function(msg) {
  let cleanMsg = String(msg || '').trim();
  let type = 'info';
  let title = 'Notificação PicDrop';

  if (/sucesso|ativo|parabéns|atualizou|confirmad|registrad/i.test(cleanMsg)) {
    type = 'success';
    title = 'Operação Confirmada';
  } else if (/inválid|erro|falha|bloquead/i.test(cleanMsg)) {
    type = 'error';
    title = 'Atenção';
  } else if (/atenção|uso|cadastrado|desativad|limite/i.test(cleanMsg)) {
    type = 'warning';
    title = 'Aviso de Governança';
  }

  // Strip informal emojis
  cleanMsg = cleanMsg.replace(/[🎉⚠️👋⚡🔒🔓✨🔑🔗✅•]/g, '').trim();
  NotificationCenter.show({ message: cleanMsg, type, title });
};
