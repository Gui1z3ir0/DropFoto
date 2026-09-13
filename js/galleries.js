/* ==========================================================================
   PICDROP - CLIENT GALLERIES & HIGH-END DELIVERY CONTROL PLANE
   Manage client galleries, interactive category filtering, live search,
   client preview lightbox with favoriting, Lightroom export, PIN codes,
   and plan quota enforcement (Free: 5 max, Pro/Studio: unlimited).
   ========================================================================== */

const GalleriesModule = (() => {
  const STORAGE_KEY_GALLERIES = 'picdrop_client_galleries_v2';

  const defaultGalleries = [
    {
      id: 'gal-1',
      title: 'Ensaio Casamento Bruno & Camila',
      category: 'casamento',
      client: 'Camila Alcantara',
      clientEmail: 'camila.alcantara@gmail.com',
      date: '10/09/2026',
      photosCount: 240,
      selectedCount: 142,
      quotaTarget: 150,
      sizeMB: 1850,
      thumb: 'assets/images/wedding_hands.jpg',
      status: 'active',
      statusLabel: 'Em Seleção',
      pin: '4892',
      lightroomReady: true,
      viewsCount: 1420,
      downloadsCount: 38,
      samplePhotos: [
        { src: 'assets/images/wedding_hands.jpg', name: 'DSC_8901.CR3', favorited: true },
        { src: 'assets/images/portfolio_camera.jpg', name: 'DSC_8904.CR3', favorited: true },
        { src: 'assets/images/editorial_cover.jpg', name: 'DSC_8912.CR3', favorited: false },
        { src: 'assets/images/family_sunset.jpg', name: 'DSC_8928.CR3', favorited: true },
        { src: 'assets/images/maternity_golden_hour.jpg', name: 'DSC_8935.CR3', favorited: false },
        { src: 'assets/images/architecture_interior.jpg', name: 'DSC_8940.CR3', favorited: true }
      ]
    },
    {
      id: 'gal-2',
      title: 'Família Silveira • Golden Hour',
      category: 'familia',
      client: 'Juliana Silveira',
      clientEmail: 'juliana.silveira@outlook.com',
      date: '02/09/2026',
      photosCount: 95,
      selectedCount: 88,
      quotaTarget: 80,
      sizeMB: 720,
      thumb: 'assets/images/family_sunset.jpg',
      status: 'approved',
      statusLabel: 'Aprovada',
      pin: '7104',
      lightroomReady: true,
      viewsCount: 512,
      downloadsCount: 64,
      samplePhotos: [
        { src: 'assets/images/family_sunset.jpg', name: 'FAM_1001.CR3', favorited: true },
        { src: 'assets/images/maternity_golden_hour.jpg', name: 'FAM_1008.CR3', favorited: true },
        { src: 'assets/images/wedding_hands.jpg', name: 'FAM_1015.CR3', favorited: false },
        { src: 'assets/images/editorial_cover.jpg', name: 'FAM_1022.CR3', favorited: true }
      ]
    },
    {
      id: 'gal-3',
      title: 'Editorial Haute Couture Lumina',
      category: 'editorial',
      client: 'Revista Lumina',
      clientEmail: 'editorial@revistalumina.com',
      date: '28/08/2026',
      photosCount: 140,
      selectedCount: 140,
      quotaTarget: 140,
      sizeMB: 1200,
      thumb: 'assets/images/editorial_cover.jpg',
      status: 'completed',
      statusLabel: 'Finalizada',
      pin: '9321',
      lightroomReady: true,
      viewsCount: 2840,
      downloadsCount: 140,
      samplePhotos: [
        { src: 'assets/images/editorial_cover.jpg', name: 'MODA_501.CR3', favorited: true },
        { src: 'assets/images/maria_clark.jpg', name: 'MODA_505.CR3', favorited: true },
        { src: 'assets/images/architecture_interior.jpg', name: 'MODA_512.CR3', favorited: true },
        { src: 'assets/images/portfolio_camera.jpg', name: 'MODA_519.CR3', favorited: true }
      ]
    },
    {
      id: 'gal-4',
      title: 'Ensaio Maternidade & Espera • Laura',
      category: 'familia',
      client: 'Laura Meneses',
      clientEmail: 'laura.meneses@gmail.com',
      date: '22/08/2026',
      photosCount: 115,
      selectedCount: 64,
      quotaTarget: 70,
      sizeMB: 890,
      thumb: 'assets/images/maternity_golden_hour.jpg',
      status: 'active',
      statusLabel: 'Em Seleção',
      pin: '5519',
      lightroomReady: true,
      viewsCount: 790,
      downloadsCount: 12,
      samplePhotos: [
        { src: 'assets/images/maternity_golden_hour.jpg', name: 'MAT_201.CR3', favorited: true },
        { src: 'assets/images/family_sunset.jpg', name: 'MAT_208.CR3', favorited: true },
        { src: 'assets/images/wedding_hands.jpg', name: 'MAT_215.CR3', favorited: false },
        { src: 'assets/images/editorial_cover.jpg', name: 'MAT_222.CR3', favorited: false }
      ]
    },
    {
      id: 'gal-5',
      title: 'Arquitetura Contemporânea & Design',
      category: 'arquitetura',
      client: 'Studio V Arquitetura',
      clientEmail: 'contato@studiov.arq.br',
      date: '15/08/2026',
      photosCount: 85,
      selectedCount: 85,
      quotaTarget: 85,
      sizeMB: 640,
      thumb: 'assets/images/architecture_interior.jpg',
      status: 'completed',
      statusLabel: 'Entregue',
      pin: '2288',
      lightroomReady: true,
      viewsCount: 1680,
      downloadsCount: 85,
      samplePhotos: [
        { src: 'assets/images/architecture_interior.jpg', name: 'ARQ_901.CR3', favorited: true },
        { src: 'assets/images/portfolio_camera.jpg', name: 'ARQ_905.CR3', favorited: true },
        { src: 'assets/images/editorial_cover.jpg', name: 'ARQ_912.CR3', favorited: true }
      ]
    }
  ];

  let currentCategory = 'all';
  let currentSearch = '';
  let currentSort = 'recent';
  let activePreviewGalId = null;

  function getGalleries() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_GALLERIES);
      if (data) {
        return JSON.parse(data);
      }
    } catch(e) {
      console.warn('Erro ao ler galerias do localStorage:', e);
    }
    return defaultGalleries;
  }

  function saveGalleries(list) {
    try {
      localStorage.setItem(STORAGE_KEY_GALLERIES, JSON.stringify(list));
    } catch(e) {
      console.warn('Erro ao salvar galerias:', e);
    }
  }

  function filterByCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.gal-cat-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-cat') === cat);
    });
    render();
  }

  function search(query) {
    currentSearch = (query || '').toLowerCase().trim();
    render();
  }

  function sort(sortBy) {
    currentSort = sortBy;
    render();
  }

  function render() {
    const rawList = getGalleries();
    const plan = (window.PlansModule && typeof PlansModule.getPlanConfig === 'function')
      ? PlansModule.getPlanConfig()
      : { name: 'Studio', galleryLimit: Infinity, features: { lightroomExport: true, downloadPin: true } };

    // Update global stat counters
    const statGalleriesVal = document.getElementById('stat-galleries-count');
    const quotaGalleriesMax = document.getElementById('quota-galleries-max');
    if (statGalleriesVal) statGalleriesVal.textContent = rawList.length;
    if (quotaGalleriesMax) {
      quotaGalleriesMax.textContent = plan.galleryLimit === Infinity 
        ? 'Capacidade Ilimitada (Studio)' 
        : `${rawList.length} de ${plan.galleryLimit} galerias máx`;
    }

    // Update category pill counters
    const countAll = rawList.length;
    const countCas = rawList.filter(g => g.category === 'casamento').length;
    const countFam = rawList.filter(g => g.category === 'familia').length;
    const countEd = rawList.filter(g => g.category === 'editorial').length;
    const countArq = rawList.filter(g => g.category === 'arquitetura').length;

    const elCountAll = document.getElementById('cat-count-all');
    const elCountCas = document.getElementById('cat-count-casamento');
    const elCountFam = document.getElementById('cat-count-familia');
    const elCountEd = document.getElementById('cat-count-editorial');
    const elCountArq = document.getElementById('cat-count-arquitetura');

    if (elCountAll) elCountAll.textContent = countAll;
    if (elCountCas) elCountCas.textContent = countCas;
    if (elCountFam) elCountFam.textContent = countFam;
    if (elCountEd) elCountEd.textContent = countEd;
    if (elCountArq) elCountArq.textContent = countArq;

    // Filter by Category and Search
    let filtered = rawList.filter(gal => {
      const matchCat = currentCategory === 'all' || gal.category === currentCategory;
      const matchSearch = !currentSearch || 
        gal.title.toLowerCase().includes(currentSearch) || 
        gal.client.toLowerCase().includes(currentSearch) ||
        gal.date.includes(currentSearch);
      return matchCat && matchSearch;
    });

    // Sort
    if (currentSort === 'photos') {
      filtered.sort((a, b) => b.photosCount - a.photosCount);
    } else if (currentSort === 'selection') {
      filtered.sort((a, b) => (b.selectedCount / b.photosCount) - (a.selectedCount / a.photosCount));
    }

    // Render across all gallery grid containers
    const grids = document.querySelectorAll('#galleries-grid-display, #landing-galleries-grid, .galleries-grid-display');
    grids.forEach(grid => {
      grid.innerHTML = '';

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 48px 24px; text-align:center; background:#0d111a; border:1px solid var(--border-card); border-radius:12px;">
            <div style="font-size:2rem; margin-bottom:12px;">📷</div>
            <h3 style="color:#fff; font-size:1.1rem; margin-bottom:6px;">Nenhuma galeria encontrada</h3>
            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:18px;">Tente ajustar o termo de pesquisa ou a categoria selecionada.</p>
            <button type="button" class="btn-cta-secondary" onclick="GalleriesModule.filterByCategory('all'); const input = document.getElementById('gal-search-input'); if(input) input.value='';" style="padding:6px 16px; font-size:0.8rem;">
              Limpar Filtros
            </button>
          </div>
        `;
        return;
      }

      filtered.forEach(gal => {
        const card = document.createElement('div');
        card.className = 'gallery-card-item';
        card.setAttribute('data-id', gal.id);

        const pct = Math.min(100, Math.round((gal.selectedCount / gal.photosCount) * 100));
        const lightroomLocked = !plan.features?.lightroomExport;
        const pinLocked = !plan.features?.downloadPin;

        const categoryLabels = {
          'casamento': 'Casamento',
          'familia': 'Família & Gestante',
          'editorial': 'Moda & Editorial',
          'arquitetura': 'Arquitetura & Design'
        };
        const catLabel = categoryLabels[gal.category] || 'Ensaio';

        card.innerHTML = `
          <div class="gallery-card-cover-wrap" onclick="GalleriesModule.openClientPreviewModal('${gal.id}')" style="cursor:pointer;">
            <img class="gallery-card-thumb" src="${gal.thumb}" alt="${gal.title}" loading="lazy" />
            <span class="gallery-card-overlay-badge">${catLabel}</span>
            <span class="gallery-card-status-badge ${gal.status}">
              <span>●</span> ${gal.statusLabel}
            </span>
            <div class="gallery-card-hover-action">
              <button type="button" class="btn-open-client-view" onclick="event.stopPropagation(); GalleriesModule.openClientPreviewModal('${gal.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Visualizar Galeria</span>
              </button>
            </div>
          </div>


          <div class="gallery-card-info">
            <h3 class="gallery-card-title">${gal.title}</h3>
            
            <div class="gallery-card-client-row">
              <div class="client-avatar-mini">${gal.client.charAt(0)}</div>
              <span>Cliente: <strong style="color:#ffffff;">${gal.client}</strong></span>
              <span style="margin-left:auto; font-size:0.75rem; color:var(--text-dimmed);">${gal.date}</span>
            </div>

            <div class="gallery-card-stats-pills">
              <span>📷 ${gal.photosCount} fotos</span>
              <span>💾 ${(gal.sizeMB / 1024).toFixed(1)} GB (RAW)</span>
              <span>👁️ ${gal.viewsCount} acessos</span>
            </div>

            <div class="gallery-selection-progress-box">
              <div class="selection-progress-label">
                <span>Seleção do Cliente</span>
                <span style="color:#34d399; font-family:var(--font-mono);">${gal.selectedCount} / ${gal.photosCount} (${pct}%)</span>
              </div>
              <div class="selection-progress-bar">
                <div class="selection-progress-fill" style="width: ${pct}%;"></div>
              </div>
            </div>

            <div class="gallery-card-actions">
              <button type="button" class="btn-gal-tool" onclick="GalleriesModule.openClientPreviewModal('${gal.id}')" title="Visualizar interface de entrega do cliente">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Ver</span>
              </button>

              <button type="button" class="btn-gal-tool ${lightroomLocked ? 'locked' : ''}" onclick="GalleriesModule.openLightroomModal('${gal.id}')" title="Exportar seleção para Adobe Lightroom Classic">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10v10H7z"/></svg>
                <span>Lightroom</span>
                ${lightroomLocked ? '<span class="badge-locked">PRO</span>' : ''}
              </button>

              <button type="button" class="btn-gal-tool ${pinLocked ? 'locked' : ''}" onclick="GalleriesModule.openPinModal('${gal.id}')" title="Código PIN para download original">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>PIN: ${gal.pin}</span>
                ${pinLocked ? '<span class="badge-locked">PRO</span>' : ''}
              </button>

              <button type="button" class="btn-gal-tool" onclick="GalleriesModule.shareGallery('${gal.id}')" title="Copiar link direto de entrega">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                <span>Link</span>
              </button>

              <button type="button" class="btn-gal-tool danger" onclick="GalleriesModule.deleteGallery('${gal.id}')" title="Excluir galeria">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    });
  }

  // --- CLIENT PREVIEW LIGHTBOX MODAL ---
  function openClientPreviewModal(galId, silent = false) {
    const list = getGalleries();
    const gal = list.find(g => g.id === galId) || list[0];
    if (!gal) return;

    activePreviewGalId = gal.id;
    const modal = document.getElementById('modal-gallery-preview');
    if (!modal) return;

    // Fill hero banner
    const heroHeader = document.getElementById('preview-modal-hero');
    if (heroHeader) {
      heroHeader.style.backgroundImage = `url('${gal.thumb}')`;
    }

    const titleEl = document.getElementById('preview-modal-title');
    const subtitleEl = document.getElementById('preview-modal-subtitle');
    const badgeEl = document.getElementById('preview-modal-badge');
    const pinBadge = document.getElementById('preview-modal-pin');

    if (titleEl) titleEl.textContent = gal.title;
    if (subtitleEl) subtitleEl.textContent = `Ensaio Fotográfico por Maria Clark • Cliente: ${gal.client} • ${gal.date}`;
    if (badgeEl) badgeEl.textContent = `${gal.photosCount} fotos em alta resolução`;
    if (pinBadge) pinBadge.textContent = `PIN: ${gal.pin}`;

    // Fill photos grid
    const photosGrid = document.getElementById('preview-modal-photos');
    if (photosGrid) {
      photosGrid.innerHTML = '';
      const photos = gal.samplePhotos || [
        { src: gal.thumb, name: 'IMG_01.CR3', favorited: true }
      ];

      photos.forEach((photo, idx) => {
        const tile = document.createElement('div');
        tile.className = 'preview-photo-tile';
        tile.setAttribute('title', 'Clique para ampliar ou clique no coração para aprovar');
        tile.innerHTML = `
          <img src="${photo.src}" alt="${photo.name}" loading="lazy" onclick="GalleriesModule.openPhotoZoom('${photo.src}', '${photo.name}')" style="cursor:pointer;" />
          <button type="button" class="preview-photo-favorite-btn ${photo.favorited ? 'favorited' : ''}" onclick="event.stopPropagation(); GalleriesModule.togglePhotoLike('${gal.id}', ${idx})" title="${photo.favorited ? 'Remover dos favoritos' : 'Favoritar foto para o álbum'}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="${photo.favorited ? '#ffffff' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <div style="position:absolute; bottom:6px; left:8px; font-size:0.68rem; font-family:var(--font-mono); color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.8); pointer-events:none;">
            ${photo.name}
          </div>
        `;
        photosGrid.appendChild(tile);
      });
    }

    modal.style.display = 'flex';
    modal.classList.add('active');

    if (!silent && window.NotificationCenter && typeof NotificationCenter.info === 'function') {
      NotificationCenter.info(`Visualizando galeria "${gal.title}" no modo cliente.`, 'Vitrine do Cliente');
    }
  }

  function closeClientPreviewModal() {
    const modal = document.getElementById('modal-gallery-preview');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  }

  function togglePhotoLike(galId, photoIdx) {
    const list = getGalleries();
    const gal = list.find(g => g.id === galId);
    if (!gal || !gal.samplePhotos || !gal.samplePhotos[photoIdx]) return;

    const photo = gal.samplePhotos[photoIdx];
    photo.favorited = !photo.favorited;

    if (photo.favorited) {
      gal.selectedCount = Math.min(gal.photosCount, gal.selectedCount + 1);
      if (window.NotificationCenter && typeof NotificationCenter.success === 'function') {
        NotificationCenter.success(`Foto ${photo.name} aprovada pelo cliente para o álbum!`, 'Seleção Atualizada');
      }
    } else {
      gal.selectedCount = Math.max(0, gal.selectedCount - 1);
      if (window.NotificationCenter && typeof NotificationCenter.info === 'function') {
        NotificationCenter.info(`Foto ${photo.name} desmarcada.`, 'Seleção Atualizada');
      }
    }

    saveGalleries(list);
    render();
    openClientPreviewModal(galId, true);
  }

  function openPhotoZoom(src, name) {
    let zoomModal = document.getElementById('modal-photo-zoom');
    if (!zoomModal) {
      zoomModal = document.createElement('div');
      zoomModal.className = 'modal-overlay';
      zoomModal.id = 'modal-photo-zoom';
      zoomModal.style.zIndex = '10000';
      zoomModal.style.background = 'rgba(2, 4, 8, 0.96)';
      zoomModal.innerHTML = `
        <button class="modal-close-btn" style="position:absolute; top:20px; right:24px; color:#fff; font-size:2rem; z-index:10; background:rgba(0,0,0,0.5); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center;" onclick="GalleriesModule.closePhotoZoom()">&times;</button>
        <div style="max-width:92vw; max-height:90vh; display:flex; flex-direction:column; align-items:center;">
          <img id="photo-zoom-img" src="" alt="" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:10px; box-shadow:0 24px 60px rgba(0,0,0,0.9); border:1px solid rgba(255,255,255,0.12);" />
          <div id="photo-zoom-caption" style="margin-top:14px; color:#e2e8f0; font-family:var(--font-mono); font-size:0.88rem; text-align:center;"></div>
        </div>
      `;
      document.body.appendChild(zoomModal);
    }

    const img = zoomModal.querySelector('#photo-zoom-img');
    const cap = zoomModal.querySelector('#photo-zoom-caption');
    if (img) img.src = src;
    if (cap) cap.textContent = `${name} • Resolução Nativa RAW/CR3 (6000 x 4000 px)`;

    zoomModal.style.display = 'flex';
    zoomModal.classList.add('active');
  }

  function closePhotoZoom() {
    const zoomModal = document.getElementById('modal-photo-zoom');
    if (zoomModal) {
      zoomModal.style.display = 'none';
      zoomModal.classList.remove('active');
    }
  }

  function simulateDownloadZip() {
    const list = getGalleries();
    const gal = list.find(g => g.id === activePreviewGalId) || list[0];

    const pin = gal ? gal.pin : '4892';

    if (window.NotificationCenter && typeof NotificationCenter.success === 'function') {
      NotificationCenter.success(`PIN ${pin} validado com sucesso. Pacote ZIP (alta resolução) iniciado para download.`, 'Download Autorizado', 'ZIP DOWNLOAD');
    }
  }

  // --- SHARE GALLERY ---
  function shareGallery(galId) {
    const list = getGalleries();
    const gal = list.find(g => g.id === galId) || list[0];
    const url = `https://mariaclarkfoto.com.br/g/${gal.id}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        if (window.NotificationCenter && typeof NotificationCenter.success === 'function') {
          NotificationCenter.success(`Link seguro da galeria copiado: ${url}`, 'Link de Entrega');
        } else if (window.showToast) {
          window.showToast('Link da galeria copiado para a área de transferência.', 'success', 'Compartilhamento');
        }
      });
    } else {
      if (window.NotificationCenter && typeof NotificationCenter.info === 'function') {
        NotificationCenter.info(`Link da galeria: ${url}`, 'Link de Entrega');
      }
    }
  }

  // --- DELETE GALLERY ---
  function deleteGallery(galId) {
    const list = getGalleries();
    const gal = list.find(g => g.id === galId);
    if (!gal) return;

    if (list.length <= 1) {
      if (window.NotificationCenter && typeof NotificationCenter.warning === 'function') {
        NotificationCenter.warning('Você precisa manter pelo menos 1 galeria de portfólio ativa.', 'Aviso de Governança');
      }
      return;
    }

    const updated = list.filter(g => g.id !== galId);
    saveGalleries(updated);
    render();

    if (window.NotificationCenter && typeof NotificationCenter.error === 'function') {
      NotificationCenter.error(`Galeria "${gal.title}" removida do portfólio.`, 'Galeria Excluída');
    } else if (window.showToast) {
      window.showToast(`Galeria "${gal.title}" removida com sucesso.`, 'info');
    }
  }

  // --- NEW GALLERY MODAL METHODS ---
  function openNewGalleryModal() {
    const plan = (window.PlansModule && typeof PlansModule.getPlanConfig === 'function')
      ? PlansModule.getPlanConfig()
      : { galleryLimit: Infinity };

    const currentList = getGalleries();
    if (currentList.length >= plan.galleryLimit) {
      if (window.PlansModule && typeof PlansModule.showUpgradeModal === 'function') {
        PlansModule.showUpgradeModal(`Limite de ${plan.galleryLimit} Galerias Atingido (Plano Free)`, 'pro');
      }
      return;
    }

    const titleInput = document.getElementById('new-gal-title');
    const clientInput = document.getElementById('new-gal-client');
    const clientEmail = document.getElementById('new-gal-email');
    if (titleInput) titleInput.value = '';
    if (clientInput) clientInput.value = '';
    if (clientEmail) clientEmail.value = '';

    const modal = document.getElementById('modal-new-gallery');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
      setTimeout(() => {
        if (titleInput) titleInput.focus();
      }, 80);
    }
  }

  function closeNewGalleryModal() {
    const modal = document.getElementById('modal-new-gallery');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  }

  function handleCreateGallerySubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    const titleInput = document.getElementById('new-gal-title');
    const clientInput = document.getElementById('new-gal-client');
    const categorySelect = document.getElementById('new-gal-category');
    const selectedCoverRadio = document.querySelector('input[name="cover-choice"]:checked');

    const title = titleInput ? titleInput.value.trim() : '';
    const client = clientInput ? clientInput.value.trim() : 'Cliente PicDrop';
    const category = categorySelect ? categorySelect.value : 'casamento';
    const cover = selectedCoverRadio ? selectedCoverRadio.value : 'assets/images/wedding_hands.jpg';

    if (!title) {
      if (window.NotificationCenter && typeof NotificationCenter.warning === 'function') {
        NotificationCenter.warning('Por favor, informe o título da galeria antes de publicar.', 'Campo Obrigatório');
      }
      return;
    }

    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    const randomPhotos = Math.floor(Math.random() * 90 + 60);

    const currentList = getGalleries();
    const newGal = {
      id: 'gal-' + Date.now(),
      title: title,
      category: category,
      client: client,
      clientEmail: `${client.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      date: new Date().toLocaleDateString('pt-BR'),
      photosCount: randomPhotos,
      selectedCount: Math.floor(randomPhotos * 0.4),
      quotaTarget: Math.floor(randomPhotos * 0.5),
      sizeMB: Math.floor(Math.random() * 800 + 600),
      thumb: cover,
      status: 'active',
      statusLabel: 'Em Seleção',
      pin: randomPin,
      lightroomReady: true,
      viewsCount: 1,
      downloadsCount: 0,
      samplePhotos: [
        { src: cover, name: 'DSC_0001.CR3', favorited: true },
        { src: 'assets/images/portfolio_camera.jpg', name: 'DSC_0002.CR3', favorited: true },
        { src: 'assets/images/family_sunset.jpg', name: 'DSC_0003.CR3', favorited: false },
        { src: 'assets/images/wedding_hands.jpg', name: 'DSC_0004.CR3', favorited: false }
      ]
    };

    currentList.unshift(newGal);
    saveGalleries(currentList);
    render();
    closeNewGalleryModal();

    if (window.NotificationCenter && typeof NotificationCenter.success === 'function') {
      NotificationCenter.success(`Galeria "${title}" criada com sucesso! PIN de entrega gerado: ${randomPin}.`, 'Galeria Publicada', 'NOVA GALERIA');
    }
  }

  // --- LIGHTROOM MODAL METHODS ---
  function openLightroomModal(galId) {
    const list = getGalleries();
    const gal = list.find(g => g.id === galId) || list[0];
    const plan = (window.PlansModule && typeof PlansModule.getPlanConfig === 'function')
      ? PlansModule.getPlanConfig()
      : { features: { lightroomExport: true } };

    if (!plan.features?.lightroomExport) {
      if (window.PlansModule && typeof PlansModule.showUpgradeModal === 'function') {
        PlansModule.showUpgradeModal('Exportação Direta para Adobe Lightroom', 'pro');
      }
      return;
    }

    const textarea = document.getElementById('lightroom-filenames-textarea');
    if (textarea && gal) {
      if (gal.samplePhotos && gal.samplePhotos.length > 0) {
        const approved = gal.samplePhotos.filter(p => p.favorited);
        const listToExport = approved.length > 0 ? approved : gal.samplePhotos;
        textarea.value = listToExport.map(p => p.name).join(', ');
      } else {
        textarea.value = `DSC_8901.CR3, DSC_8904.CR3, DSC_8912.CR3, DSC_8928.CR3, DSC_8935.CR3, DSC_8940.CR3`;
      }
    }

    const modal = document.getElementById('modal-lightroom');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function closeLightroomModal() {
    const modal = document.getElementById('modal-lightroom');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  }

  function copyLightroomList() {
    const textarea = document.getElementById('lightroom-filenames-textarea');
    if (textarea) {
      textarea.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value).then(() => {
          if (window.NotificationCenter && typeof NotificationCenter.success === 'function') {
            const count = textarea.value.split(',').length;
            NotificationCenter.success(`Lista de ${count} fotos copiada para colagem direta no Adobe Lightroom Classic.`, 'Seleção Exportada');
          }
        });
      } else {
        document.execCommand('copy');
      }
    }
  }

  // --- PIN MODAL METHODS ---
  function openPinModal(galId) {
    const list = getGalleries();
    const gal = list.find(g => g.id === galId) || list[0];
    const pin = gal ? gal.pin : '4892';

    const digits = document.querySelectorAll('.pin-display-card .pin-number-digit');
    if (digits && digits.length === 4) {
      digits[0].textContent = pin.charAt(0);
      digits[1].textContent = pin.charAt(1);
      digits[2].textContent = pin.charAt(2);
      digits[3].textContent = pin.charAt(3);
    }

    const modal = document.getElementById('modal-pin-view');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  }

  function closePinModal() {
    const modal = document.getElementById('modal-pin-view');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  }

  function copyPinCode() {
    const digits = Array.from(document.querySelectorAll('.pin-display-card .pin-number-digit')).map(d => d.textContent).join('') || '4892';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(digits).then(() => {
        if (window.NotificationCenter && typeof NotificationCenter.success === 'function') {
          NotificationCenter.success(`PIN de download (${digits}) copiado para a área de transferência.`, 'PIN Copiado');
        }
      });
    }
  }

  return {
    init: () => {
      render();
      document.querySelectorAll('#btn-new-gallery, .btn-new-gallery').forEach(btn => {
        btn.onclick = openNewGalleryModal;
      });
    },
    getGalleries,
    render,
    filterByCategory,
    search,
    sort,
    attemptCreateNewGallery: openNewGalleryModal,
    openNewGalleryModal,
    closeNewGalleryModal,
    handleCreateGallerySubmit,
    openClientPreviewModal,
    closeClientPreviewModal,
    togglePhotoLike,
    openPhotoZoom,
    closePhotoZoom,
    simulateDownloadZip,
    shareGallery,
    deleteGallery,
    openLightroomModal,
    closeLightroomModal,
    copyLightroomList,
    openPinModal,
    closePinModal,
    copyPinCode
  };
})();

// Explicitly assign to window for universal access across inline HTML & scripts
if (typeof window !== 'undefined') {
  window.GalleriesModule = GalleriesModule;
}

