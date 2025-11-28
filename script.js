/* script.js – PartsGo (optimized) */

'use strict';

/* ========= CONFIG ========= */

// Google Sheets (ผ่าน opensheet)
const SHEET_PARTS = 'https://opensheet.elk.sh/1nbhLKxs7NldWo_y0s4qZ8rlpIfyyGkR_Dqq8INmhYlw/MainSap';
const SHEET_PARTS_IMAGE = 'https://opensheet.elk.sh/1nbhLKxs7NldWo_y0s4qZ8rlpIfyyGkR_Dqq8INmhYlw/MainSapimage';
const SHEET_EMPLOYEE = 'https://opensheet.elk.sh/1eqVoLsZxGguEbRCC5rdI4iMVtQ7CK4T3uXRdx8zE3uw/Employee';
const SHEET_REQUEST = 'https://opensheet.elk.sh/1xyy70cq2vAxGv4gPIGiL_xA5czDXqS2i6YYqW4yEVbE/Request';
const SHEET_PENDING = 'https://opensheet.elk.sh/1dzE4Xjc7H0OtNUmne62u0jFQT-CiGsG2eBo-1v6mrZk/Call_Report';
// ถ้ามี sheet today/all แยกจะต่อยอดภายหลังได้

// GAS สำหรับบันทึกการเบิก
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwVF2HAC8EYARt6Ku2ThUZWgeVxXWDhRQCQ0vCgGvilEMg8h5Hg3BlrcJJn2qMMqpGr/exec';

/* ========= GLOBAL STATE ========= */

const state = {
  user: null,                  // { id, name, team }
  employeeData: [],
  partsData: [],
  partsFiltered: [],
  partsPage: 1,
  partsPerPage: 20,

  imageDb: {},                 // { Material: [id1,id2,...] }
  imageDbLoaded: false,

  imagesFiltered: [],
  imagesPage: 1,
  imagesPerPage: 20,

  todayData: [],
  todayFiltered: [],
  todayPage: 1,
  todayPerPage: 20,
  todayShowOnlyPending: true,

  allData: [],
  allFiltered: [],
  allPage: 1,
  allPerPage: 20,

  pendingData: [],
  pendingFiltered: [],
  pendingPage: 1,
  pendingPerPage: 20,

  // ฟิลเตอร์ค้นหา global (sync parts + images)
  globalSearch1: '',
  globalSearch2: '',

  loadingCount: 0
};

/* ========= UTIL ========= */

function $(id) {
  return document.getElementById(id);
}

function showGlobalLoading() {
  state.loadingCount++;
  const l = $('loading');
  if (l) l.style.display = 'flex';
}

function hideGlobalLoading() {
  state.loadingCount = Math.max(0, state.loadingCount - 1);
  if (state.loadingCount === 0) {
    const l = $('loading');
    if (l) l.style.display = 'none';
  }
}

async function safeFetchJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function numberOrZero(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function setBodyScrollLocked(locked) {
  document.body.style.overflow = locked ? 'hidden' : 'auto';
}

/* ========= THEME ========= */

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.body.classList.remove('dark-mode', 'light-mode');
  document.body.classList.add(`${theme}-mode`);
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  setTheme(saved);
  const select = $('themeSelect');
  if (select) {
    select.value = saved;
    select.addEventListener('change', e => setTheme(e.target.value));
  }
}

/* ========= LOGIN ========= */

async function loadEmployeeDataOnce() {
  if (state.employeeData.length) return;
  showGlobalLoading();
  try {
    const data = await safeFetchJson(SHEET_EMPLOYEE);
    state.employeeData = data || [];
  } catch (err) {
    console.error('loadEmployeeData error', err);
  } finally {
    hideGlobalLoading();
  }
}

function applyUserToUI() {
  const appContent = $('appContent');
  const loginModal = $('loginModal');
  if (!appContent || !loginModal) return;

  if (state.user) {
    loginModal.classList.remove('active');
    appContent.classList.add('logged-in');

    const nameLabel = $('userNameSmall');
    if (nameLabel) nameLabel.textContent = state.user.name || '';

    $('modalUserName').textContent = state.user.name || '-';
    $('modalUserID').textContent = state.user.id || '-';
    $('modalUserTeam').textContent = state.user.team || 'ไม่พบข้อมูลหน่วยงาน';

    // admin 7512411
    const adminSec = $('adminAnnouncementSection');
    if (adminSec) {
      adminSec.style.display = state.user.id === '7512411' ? 'block' : 'none';
    }
  } else {
    loginModal.classList.add('active');
    appContent.classList.remove('logged-in');
  }
}

async function handleLogin() {
  const username = $('username').value.trim();
  const password = $('password').value.trim();
  const loginError = $('loginError');

  if (loginError) loginError.style.display = 'none';

  if (!username || !password) {
    if (loginError) {
      loginError.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
      loginError.style.display = 'block';
    }
    return;
  }

  await loadEmployeeDataOnce();

  const expectedPassword = username.slice(-4);
  const emp = state.employeeData.find(
    e => (e.IDRec || '').toString().trim() === username && expectedPassword === password
  );

  if (!emp || !emp.Name) {
    if (loginError) {
      loginError.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!';
      loginError.style.display = 'block';
    }
    $('password').value = '';
    return;
  }

  const user = {
    id: username,
    name: emp.Name,
    team: emp.หน่วยงาน || ''
  };
  state.user = user;

  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('username', user.id);
  localStorage.setItem('userName', user.name);

  const remember = $('rememberMe');
  if (remember && remember.checked) {
    localStorage.setItem('rememberMe', 'true');
    localStorage.setItem('savedUsername', user.id);
  } else {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('savedUsername');
  }

  applyUserToUI();

  // โฟกัสค้นหาอะไหล่
  setTimeout(() => {
    const si = $('searchInput1');
    if (si) si.focus();
  }, 300);

  // โหลดข้อมูลเริ่มต้น (ครั้งแรก)
  initDataAfterLogin();
}

function handleLogout() {
  state.user = null;
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('userName');
  localStorage.removeItem('savedUsername');
  localStorage.removeItem('rememberMe');

  applyUserToUI();
  closeSettingsModal();
}

async function checkLoginStatusOnLoad() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const username = localStorage.getItem('username');
  const userName = localStorage.getItem('userName');

  if (localStorage.getItem('rememberMe') === 'true') {
    const u = localStorage.getItem('savedUsername');
    if (u) $('username').value = u;
    $('rememberMe').checked = true;
  }

  if (isLoggedIn && username && userName) {
    await loadEmployeeDataOnce();
    const emp = state.employeeData.find(
      e => (e.IDRec || '').toString().trim() === username
    );
    state.user = {
      id: username,
      name: userName,
      team: emp?.หน่วยงาน || ''
    };
  }

  applyUserToUI();

  if (state.user) {
    initDataAfterLogin();
  }
}

/* ========= SETTINGS / QR / ANNOUNCEMENT ========= */

function openSettingsModal() {
  const modal = $('settingsModal');
  if (!modal) return;
  modal.style.display = 'block';
  setBodyScrollLocked(true);

  // sync theme select
  const themeSelect = $('themeSelect');
  if (themeSelect) {
    const saved = localStorage.getItem('theme') || 'light';
    themeSelect.value = saved;
  }

  // update app version from SW
  requestSwVersion();
}

function closeSettingsModal() {
  const modal = $('settingsModal');
  if (!modal) return;
  modal.style.display = 'none';
  setBodyScrollLocked(false);
}

function showQRCode() {
  Swal.fire({
    title: '📷 สแกน QR Code',
    html: `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://request-nawanakorn.vercel.app/" 
           alt="QR Code" 
           style="width:150px;height:150px;">
      <p>สแกนเพื่อเข้าสู่ระบบขอเบิกอะไหล่</p>
    `,
    confirmButtonText: 'ปิด'
  });
}

// placeholder ระบบประกาศ – สามารถต่อยอดให้ดึงจาก Sheet /information ได้ภายหลัง
function openAnnouncementDeck() {
  Swal.fire({
    icon: 'info',
    title: 'ประกาศจากคลัง',
    html: 'ฟีเจอร์ประกาศสามารถเชื่อมต่อ Google Sheet (/information) ต่อได้ภายหลัง',
    confirmButtonText: 'ปิด'
  });
}

/* ========= SERVICE WORKER VERSION ========= */

function requestSwVersion() {
  if (!('serviceWorker' in navigator)) return;
  if (!navigator.serviceWorker.controller) {
    $('appVersion').textContent = 'v??';
    return;
  }
  navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .register('/sw.js')
    .then(reg => {
      console.log('SW registered', reg);

      // เช็คอัปเดตทันที
      reg.update();

      let newWorker = null;
      let toastShown = false;

      function showUpdateToast() {
        if (toastShown) return;
        toastShown = true;
        Swal.fire({
          title: 'มีอัปเดตใหม่!',
          html: 'แอปได้รับการปรับปรุงแล้ว<br><small>กดรีเฟรชเพื่อใช้งานเวอร์ชันล่าสุด</small>',
          icon: 'info',
          confirmButtonText: 'รีเฟรชเลย',
          cancelButtonText: 'ภายหลัง',
          showCancelButton: true,
          allowOutsideClick: false,
          timer: 20000,
          timerProgressBar: true
        }).then(result => {
          if (result.isConfirmed && newWorker) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }

      reg.addEventListener('updatefound', () => {
        newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            showUpdateToast();
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    })
    .catch(err => {
      console.error('SW registration failed:', err);
    });

  navigator.serviceWorker.addEventListener('message', evt => {
    if (evt.data?.type === 'VERSION') {
      const span = $('appVersion');
      if (span) span.textContent = evt.data.version;
    }
  });
}

/* ========= TABS ========= */

function showTab(tabId) {
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(c => c.classList.remove('active'));
  const target = $(tabId);
  if (target) target.classList.add('active');

  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(b => b.classList.remove('active'));
  const nav = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
  if (nav) nav.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // lazy load แยกตามแท็บ
  switch (tabId) {
    case 'parts':
      ensurePartsLoaded();
      break;
    case 'images':
      ensureImagesDataReady();
      break;
    case 'today':
      ensureTodayLoaded();
      break;
    case 'pending-calls':
      ensurePendingLoaded();
      break;
    case 'all':
      ensureAllLoaded();
      break;
  }
}

/* ========= PARTS + IMAGE DATABASE ========= */

async function loadImageDatabaseOnce() {
  if (state.imageDbLoaded) return;
  showGlobalLoading();
  try {
    const rows = await safeFetchJson(SHEET_PARTS_IMAGE);
    const db = {};
    (rows || []).forEach(r => {
      const material = (r.Material || '').toString().trim();
      if (!material) return;
      const ids = (r.ImageIDs || r.ImageId || '').toString().split(',').map(s => s.trim()).filter(Boolean);
      if (!ids.length) return;
      db[material] = ids;
    });
    state.imageDb = db;
    state.imageDbLoaded = true;
    console.log('Image DB loaded', Object.keys(db).length);
  } catch (err) {
    console.error('loadImageDatabaseOnce error', err);
  } finally {
    hideGlobalLoading();
  }
}

async function loadPartsOnce() {
  if (state.partsData.length) return;
  showGlobalLoading();
  try {
    const data = await safeFetchJson(SHEET_PARTS);
    state.partsData = data || [];
    state.partsFiltered = state.partsData.slice();
  } catch (err) {
    console.error('loadPartsOnce error', err);
    const errBox = $('error-container');
    if (errBox) errBox.style.display = 'block';
  } finally {
    hideGlobalLoading();
  }
}

async function ensurePartsLoaded() {
  await Promise.all([loadPartsOnce(), loadImageDatabaseOnce()]);
  renderParts();
}

/* ---- Parts render & filter ---- */

function filterParts() {
  const q1 = $('searchInput1').value.trim().toLowerCase();
  const q2 = $('searchInput2').value.trim().toLowerCase();
  state.globalSearch1 = q1;
  state.globalSearch2 = q2;

  state.partsFiltered = state.partsData.filter(r => {
    const text = (r.Material || '') + ' ' + (r.Description || '') + ' ' + (r.Product || '') + ' ' + (r.OCRTAXT || '');
    const t = text.toLowerCase();
    if (q1 && !t.includes(q1)) return false;
    if (q2 && !t.includes(q2)) return false;
    return true;
  });

  state.partsPage = 1;
  renderParts();
}

function renderPartsPagination(total) {
  const pageContainer = $('pageNumbers');
  if (!pageContainer) return;
  const totalPages = Math.max(1, Math.ceil(total / state.partsPerPage));
  pageContainer.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === state.partsPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.partsPage = i;
      renderParts();
    });
    pageContainer.appendChild(btn);
  }
}

function renderParts() {
  const tbody = document.querySelector('#data-table tbody');
  if (!tbody) return;

  const total = state.partsFiltered.length;
  const start = (state.partsPage - 1) * state.partsPerPage;
  const end = start + state.partsPerPage;
  const rows = state.partsFiltered.slice(start, end);

  tbody.innerHTML = '';

  rows.forEach(row => {
    const tr = document.createElement('tr');

    // ปุ่มเบิก
    const tdReq = document.createElement('td');
    const btnReq = document.createElement('button');
    btnReq.textContent = 'เบิก';
    btnReq.className = 'requisition-button';
    btnReq.addEventListener('click', () => showRequisitionDialog(row));
    tdReq.appendChild(btnReq);
    tr.appendChild(tdReq);

    // รูป
    const tdImg = document.createElement('td');
    const mat = (row.Material || '').toString().trim();
    if ((state.imageDb[mat] && state.imageDb[mat].length) || row.UrlWeb) {
      const btnImg = document.createElement('button');
      btnImg.className = 'image-button';
      btnImg.innerHTML = '<i class="fas fa-image"></i>';
      btnImg.addEventListener('click', () => openPartImageModal(row));
      tdImg.appendChild(btnImg);
    }
    tr.appendChild(tdImg);

    const cols = ['Material','Description','วิภาวดี','Unrestricted','Rebuilt','หมายเหตุ','Product','OCRTAXT'];
    const vib = numberOrZero(row['วิภาวดี']);
    const navanakorn = numberOrZero(row['Unrestricted']);

    let textColor = '';
    let fontWeight = '';
    if (vib > 0) {
      textColor = '#4caf50';
      fontWeight = 'bold';
    } else if (vib === 0 && navanakorn > 0) {
      textColor = '#2196f3';
      fontWeight = 'bold';
    }

    cols.forEach(key => {
      const td = document.createElement('td');
      let val = row[key] || '';

      if (key === 'วิภาวดี' || key === 'Unrestricted') {
        const num = numberOrZero(val);
        val = num ? num.toLocaleString('en-US') : '';
      }

      // เน้นสีหมายเหตุ / rebuilt
      if ((key === 'หมายเหตุ' || key === 'Rebuilt') && val) {
        td.style.color = '#d32f2f';
        td.style.fontWeight = 'bold';
      }

      if (['Material','Description','วิภาวดี','Unrestricted'].includes(key)) {
        if (textColor) td.style.color = textColor;
        if (fontWeight) td.style.fontWeight = fontWeight;
      }

      td.textContent = val;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  renderPartsPagination(total);
}

/* ---- Part Image Modal & Swiper ---- */

let currentSwiperIndex = 0;

function buildImageHtmlForMaterial(material, fallbackUrlWeb) {
  const ids = state.imageDb[material] || [];
  const imgIds = [...ids];

  if (!imgIds.length && fallbackUrlWeb) {
    const m =
      fallbackUrlWeb.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
      fallbackUrlWeb.match(/id=([a-zA-Z0-9-_]+)/) ||
      fallbackUrlWeb.match(/uc\?id=([a-zA-Z0-9-_]+)/);
    if (m && m[1]) imgIds.push(m[1]);
  }

  if (!imgIds.length) {
    return `
      <div style="width:340px;height:340px;background:#000;display:flex;align-items:center;justify-content:center;margin:0 auto;color:#ccc;font-size:18px;">
        ไม่มีรูปภาพในระบบ
      </div>
    `;
  }

  const slides = imgIds
    .map(
      id => `
    <div class="image-slide">
      <img 
        loading="lazy"
        src="https://drive.google.com/thumbnail?id=${id}&sz=w600"
        alt="รูปอะไหล่"
        onerror="this.src='https://via.placeholder.com/340/111/fff?text=ไม่มีรูป';"
      >
    </div>`
    )
    .join('');

  const arrows =
    imgIds.length > 1
      ? `
      <button class="swiper-btn swiper-prev">&lsaquo;</button>
      <button class="swiper-btn swiper-next">&rsaquo;</button>
      <div class="swiper-counter">1 / ${imgIds.length}</div>
    `
      : '';

  return `
    <div class="image-swiper-container">
      <div class="image-swiper-wrapper" style="width:${imgIds.length * 100}%;">
        ${slides}
      </div>
      ${arrows}
    </div>
  `;
}

function initSwiper(modal) {
  const container = modal.querySelector('.image-swiper-container');
  if (!container) return;
  const wrapper = container.querySelector('.image-swiper-wrapper');
  const prevBtn = container.querySelector('.swiper-prev');
  const nextBtn = container.querySelector('.swiper-next');
  const counter = container.querySelector('.swiper-counter');
  const total = wrapper ? wrapper.children.length : 0;
  if (!wrapper || !total) return;

  currentSwiperIndex = 0;

  const update = () => {
    wrapper.style.transform = `translateX(-${currentSwiperIndex * 100}%)`;
    if (counter) counter.textContent = `${currentSwiperIndex + 1} / ${total}`;
  };

  const goPrev = () => {
    currentSwiperIndex = currentSwiperIndex > 0 ? currentSwiperIndex - 1 : total - 1;
    update();
  };
  const goNext = () => {
    currentSwiperIndex = currentSwiperIndex < total - 1 ? currentSwiperIndex + 1 : 0;
    update();
  };

  if (prevBtn) prevBtn.onclick = goPrev;
  if (nextBtn) nextBtn.onclick = goNext;

  // touch
  let startX = 0;
  container.addEventListener(
    'touchstart',
    e => {
      startX = e.touches[0].clientX;
    },
    { passive: true }
  );
  container.addEventListener(
    'touchend',
    e => {
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) goNext();
        else goPrev();
      }
    },
    { passive: true }
  );

  // keyboard
  const keyHandler = e => {
    if (modal.style.display !== 'block') return;
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'Escape') closeAllImageModals();
  };
  document.addEventListener('keydown', keyHandler, { once: true });

  update();
}

function openPartImageModal(row) {
  const modal = $('imageModal');
  const content = $('imageModalContent');
  if (!modal || !content) return;

  const material = (row.Material || '').toString().trim();
  const galleryHtml = buildImageHtmlForMaterial(material, row.UrlWeb);

  const infoHtml = `
    <div class="detail-info">
      <div class="detail-header-row">
        <h2>รายละเอียดอะไหล่</h2>
        <button class="requisition-button header-btn">
          เบิกเลย
        </button>
      </div>
      <div class="detail-row">
        <span class="label">Material</span>
        <span class="value">${material || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="label">Description</span>
        <span class="value">${row.Description || '-'}</span>
      </div>
      <div class="detail-row">
        <span class="label">วิภาวดี</span>
        <span class="value">${numberOrZero(row['วิภาวดี']).toLocaleString()} ชิ้น</span>
      </div>
      <div class="detail-row">
        <span class="label">นวนคร</span>
        <span class="value">${numberOrZero(row['Unrestricted']).toLocaleString()} ชิ้น</span>
      </div>
      ${row.Rebuilt ? `
        <div class="detail-row">
          <span class="label">Rebuilt</span>
          <span class="value rebuilt-text">${row.Rebuilt}</span>
        </div>` : ''}
      ${row.Product ? `
        <div class="detail-row">
          <span class="label">Product</span>
          <span class="value">${row.Product}</span>
        </div>` : ''}
      ${row.OCRTAXT ? `
        <div class="detail-row">
          <span class="label">Spec</span>
          <span class="value spec-text">${row.OCRTAXT}</span>
        </div>` : ''}
      ${row['หมายเหตุ'] ? `
        <div class="detail-row">
          <span class="label" style="color:#e74c3c;font-weight:bold;">หมายเหตุ</span>
          <span class="value" style="color:#e74c3c;font-weight:bold;">${row['หมายเหตุ']}</span>
        </div>` : ''}
    </div>
  `;

  content.innerHTML = galleryHtml + infoHtml;

  modal.style.display = 'block';
  setBodyScrollLocked(true);

  const headerBtn = content.querySelector('.header-btn');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => showRequisitionDialog(row));
  }

  // init swiper ถ้ามีหลายรูป
  setTimeout(() => initSwiper(modal), 100);
}

function closeAllImageModals() {
  const m1 = $('imageModal');
  const m2 = $('imageModalImages');
  if (m1) m1.style.display = 'none';
  if (m2) m2.style.display = 'none';
  setBodyScrollLocked(false);
}

/* ========= REQUISITION ========= */

async function showRequisitionDialog(row) {
  if (!state.user) {
    Swal.fire({
      icon: 'warning',
      title: 'ยังไม่ได้เข้าสู่ระบบ',
      text: 'กรุณาเข้าสู่ระบบก่อนทำการเบิกอะไหล่'
    });
    return;
  }

  const vib = numberOrZero(row['วิภาวดี']);
  const nvn = numberOrZero(row['Unrestricted']);
  const remark = (row['หมายเหตุ'] || '').trim();

  // เคส: นวนคร = 0 แต่มีหมายเหตุ (อะไหล่ทดแทน)
  if (nvn === 0 && remark) {
    const res = await Swal.fire({
      title: 'คำเตือน!',
      html: `
        <p>คลังนวนครไม่มีของเหลือแล้ว</p>
        <p style="color:#27ae60;">อาจมีอะไหล่ทดแทน: ${remark}</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันเบิกต่อ',
      cancelButtonText: 'ยกเลิก'
    });
    if (!res.isConfirmed) return;
  }

  // เคส: วิภาวดีมีของ
  if (vib > 0) {
    const res = await Swal.fire({
      title: 'คำเตือน!',
      html: `
        <p>คลังวิภาวดีมีสต็อกอยู่แล้ว</p>
        <p style="font-size:13px;color:#666;">ควรเบิกจากวิภาวดีก่อนหรือไม่?</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันเบิกจากนวนคร',
      cancelButtonText: 'ยกเลิก'
    });
    if (!res.isConfirmed) return;
  }

  const { value: formValues } = await Swal.fire({
    title: 'เบิกอะไหล่',
    html: `
      <div style="text-align:left;font-size:13px;">
        <div style="margin-bottom:6px;">
          <strong>Material:</strong> ${(row.Material || '')}
        </div>
        <div style="margin-bottom:10px;">
          <strong>Description:</strong> ${(row.Description || '')}
        </div>
        <label>จำนวนที่ต้องการ:</label>
        <input id="swal-qty" type="number" min="1" value="1"
               class="swal2-input" style="width:100%;box-sizing:border-box;">
        <label>เลขที่ Call (ถ้ามี):</label>
        <input id="swal-call" class="swal2-input" style="width:100%;box-sizing:border-box;">
        <label>หมายเหตุเพิ่มเติม:</label>
        <textarea id="swal-remark" class="swal2-textarea" style="width:100%;box-sizing:border-box;"></textarea>
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const qty = document.getElementById('swal-qty').value;
      if (!qty || Number(qty) <= 0) {
        Swal.showValidationMessage('กรุณาระบุจำนวนให้ถูกต้อง');
        return false;
      }
      return {
        qty: Number(qty),
        call: document.getElementById('swal-call').value.trim(),
        remark: document.getElementById('swal-remark').value.trim()
      };
    },
    confirmButtonText: 'ส่งคำขอเบิก',
    cancelButtonText: 'ยกเลิก',
    showCancelButton: true
  });

  if (!formValues) return;

  // ส่งไป GAS
  showGlobalLoading();
  try {
    const payload = {
      mode: 'create',
      employeeId: state.user.id,
      employeeName: state.user.name,
      employeeTeam: state.user.team,
      material: row.Material || '',
      description: row.Description || '',
      qty: formValues.qty,
      call: formValues.call,
      remark: formValues.remark
    };

    const res = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('GAS error: ' + res.status);

    Swal.fire({
      icon: 'success',
      title: 'ส่งคำขอเบิกแล้ว',
      text: 'กรุณารอคลังอนุมัติ / จ่ายของ'
    });
  } catch (err) {
    console.error('requisition error', err);
    Swal.fire({
      icon: 'error',
      title: 'ส่งคำขอไม่สำเร็จ',
      text: 'กรุณาลองใหม่ หรือแจ้งคลัง'
    });
  } finally {
    hideGlobalLoading();
  }
}

/* ========= IMAGES TAB ========= */

async function ensureImagesDataReady() {
  await ensurePartsLoaded(); // ใช้ partsData เดียวกัน
  state.imagesFiltered = state.partsFiltered.slice(); // sync filter
  renderImages();
}

function filterImages() {
  const q1 = $('searchInputImages1').value.trim().toLowerCase();
  const q2 = $('searchInputImages2').value
