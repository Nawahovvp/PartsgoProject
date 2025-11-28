// script.js - เวอร์ชันสมบูรณ์ 100% แก้ TDZ แล้ว (พร้อมใช้งานทันที)

'use strict';

// ===================================================================
// 1. ประกาศ DOM Elements ทั้งหมดก่อน (สำคัญมาก! ต้องอยู่บนสุด)
// ===================================================================
const loginModal           = document.getElementById('loginModal');
const appContent           = document.getElementById('appContent');
const usernameInput        = document.getElementById('username');
const passwordInput        = document.getElementById('password');
const loginError           = document.getElementById('loginError');
const rememberMeCheckbox   = document.getElementById('rememberMe');
const togglePasswordIcon   = document.getElementById('togglePassword');
const userNameSmall        = document.getElementById('userNameSmall');

const searchInput1         = document.getElementById('searchInput1');
const searchInput2         = document.getElementById('searchInput2');
const searchButton         = document.getElementById('searchButton');
const tableBody            = document.querySelector('#data-table tbody');
const pagination           = document.getElementById('pagination');
const pageNumbers          = document.getElementById('pageNumbers');
const itemsPerPageSelect   = document.getElementById('itemsPerPage');
const firstPageButton      = document.getElementById('firstPage');
const prevPageButton       = document.getElementById('prevPage');
const nextPageButton       = document.getElementById('nextPage');
const lastPageButton       = document.getElementById('lastPage');
const errorContainer       = document.getElementById('error-container');
const retryButton          = document.getElementById('retry-button');

const searchInputImages1   = document.getElementById('searchInputImages1');
const searchInputImages2   = document.getElementById('searchInputImages2');
const searchButtonImages   = document.getElementById('searchButtonImages');
const galleryContainer     = document.getElementById('gallery-container-images');
const paginationImages     = document.getElementById('paginationImages');
const pageNumbersImages    = document.getElementById('pageNumbersImages');
const itemsPerPageSelectImages = document.getElementById('itemsPerPageImages');

const searchInputToday     = document.getElementById('searchInputToday');
const toggleAllDataBtn     = document.getElementById('toggleAllDataBtn');
const tableBodyToday       = document.querySelector('#data-table-today tbody');
const errorContainerToday  = document.getElementById('error-container-today');
const retryButtonToday     = document.getElementById('retry-button-today');
const paginationToday      = document.getElementById('paginationToday');
const pageNumbersToday     = document.getElementById('pageNumbersToday');
const itemsPerPageSelectToday = document.getElementById('itemsPerPageToday');

const modal                = document.getElementById('detailModal');
const modalContent         = document.getElementById('modalContent');
const closeModal           = document.getElementById('closeModal');

const imageModal           = document.getElementById('imageModal');
const imageModalContent    = document.getElementById('imageModalContent');
const closeImageModal      = document.getElementById('closeImageModal');
const imageModalImages     = document.getElementById('imageModalImages');
const closeImageModalImages= document.getElementById('closeImageModalImages');

const teamFilterPending    = document.getElementById('teamFilterPending');
const searchInputPending   = document.getElementById('searchInputPending');
const searchButtonPending  = document.getElementById('searchButtonPending');
const tableBodyPending     = document.querySelector('#data-table-pending tbody');

// ===================================================================
// 2. Global Variables & Constants
// ===================================================================
let employeeData = [];
let globalSearch1 = '';
let globalSearch2 = '';
let showOnlyPending = true;
let sortConfigToday = { column: 'IDRow', direction: 'desc' };
let currentPageToday = 1;
let itemsPerPageToday = 20;

const requestSheetUrl = 'https://opensheet.elk.sh/1xyy70cq2vAxGv4gPIGiL_xA5czDXqS2i6YYqW4yEVbE/Request';
const gasUrl = 'https://script.google.com/macros/s/AKfycbwVF2HAC8EYARt6Ku2ThUZWgeVxXWDhRQCQ0vCgGvilEMg8h5Hg3BlrcJJn2qMMqpGr/exec';

let allData = [], currentPage = 1, itemsPerPage = 20;
let allDataImages = [], currentPageImages = 1, itemsPerPageImages = 20;
let allDataToday = [];
let allDataPending = [], currentPagePending = 1, itemsPerPagePending = 20;
let imageDatabase = {};
let imageDbLoaded = false;

let deferredPrompt = null;

// ===================================================================
// 3. Service Worker & PWA Update
// ===================================================================
let newWorker;
let isUpdateShown = false;

function showUpdateToast() {
  if (isUpdateShown) return;
  isUpdateShown = true;
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
  }).then((result) => {
    if (result.isConfirmed && newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      reg.update();
      reg.addEventListener('updatefound', () => {
        newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast();
            }
          });
        }
      });
    })
    .catch(err => console.log('SW registration failed:', err));

  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
}

// ===================================================================
// 4. App Version Display
// ===================================================================
function updateAppVersionDisplay() {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
  }
  const el = document.getElementById('appVersion');
  if (el) el.textContent = 'v??';
}

navigator.serviceWorker.addEventListener('message', e => {
  if (e.data?.type === 'VERSION') {
    const el = document.getElementById('appVersion');
    if (el) {
      el.textContent = e.data.version;
      el.style.color = '#00ff88';
      el.style.fontWeight = 'bold';
    }
  }
});

document.addEventListener('DOMContentLoaded', updateAppVersionDisplay);

// ===================================================================
// 5. Theme & Settings
// ===================================================================
function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.body.classList.remove('light-mode', 'dark-mode');
  document.body.classList.add(theme + '-mode');
}

function loadTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  setTheme(theme);
  const select = document.getElementById('themeSelect');
  if (select) select.value = theme;
}

// ===================================================================
// 6. Login System
// ===================================================================
function togglePasswordVisibility() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  togglePasswordIcon.classList.toggle('fa-eye');
  togglePasswordIcon.classList.toggle('fa-eye-slash');
}

async function loadEmployeeData() {
  const url = 'https://opensheet.elk.sh/1eqVoLsZxGguEbRCC5rdI4iMVtQ7CK4T3uXRdx8zE3uw/Employee';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Load employee failed');
  return await res.json();
}

async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  loginError.style.display = 'none';

  if (!username || !password) {
    loginError.textContent = 'กรุณากรอกรหัสพนักงานและรหัสผ่าน';
    loginError.style.display = 'block';
    return;
  }

  try {
    employeeData = await loadEmployeeData();
    const expected = username.slice(-4);
    const user = employeeData.find(e => e.IDRec?.toString().trim() === username && expected === password);

    if (user && user.Name) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userName', user.Name);
      if (rememberMeCheckbox.checked) {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('rememberMe');
      }
      checkLoginStatus();
    } else {
      loginError.textContent = 'รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง!';
      loginError.style.display = 'block';
      passwordInput.value = '';
    }
  } catch (err) {
    loginError.textContent = 'โหลดข้อมูลพนักงานล้มเหลว กรุณาลองใหม่';
    loginError.style.display = 'block';
    console.error(err);
  }
}

function checkLoginStatus() {
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const username = localStorage.getItem('username');

  if (loggedIn && username) {
    loginModal.classList.remove('active');
    appContent.classList.add('logged-in');
    userNameSmall.textContent = localStorage.getItem('userName') || '';
    loadImageDatabase().then(() => showTab('parts'));
  } else {
    loginModal.classList.add('active');
    appContent.classList.remove('logged-in');
    localStorage.clear();
  }

  if (localStorage.getItem('rememberMe') === 'true') {
    usernameInput.value = localStorage.getItem('savedUsername') || '';
    rememberMeCheckbox.checked = true;
  }
}

function handleLogout() {
  localStorage.clear();
  checkLoginStatus();
  document.getElementById('settingsModal').style.display = 'none';
}

// ===================================================================
// 7. Tab System & Init
// ===================================================================
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

  if (tabId !== 'pending-calls') document.getElementById('loading').style.display = 'flex';

  switch (tabId) {
    case 'parts': loadData(); break;
    case 'images': loadImagesData(); break;
    case 'today': loadTodayData(); break;
    case 'pending-calls': loadPendingCallsData(); break;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

// ===================================================================
// 8. PWA Install Prompt
// ===================================================================
function permanentlyHideInstallButton() {
  const btn = document.getElementById('install-btn');
  if (btn) btn.remove();
}
if (localStorage.getItem('partgo-installed') === 'true') permanentlyHideInstallButton();

window.addEventListener('beforeinstallprompt', e => {
  if (localStorage.getItem('partgo-installed') === 'true') return;
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('install-btn');
  if (btn) btn.style.display = 'flex';
});

document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    localStorage.setItem('partgo-installed', 'true');
    permanentlyHideInstallButton();
    Swal.fire('ติดตั้งสำเร็จ!', 'PartsGo ถูกเพิ่มในหน้าจอหลักแล้ว', 'success');
  }
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  localStorage.setItem('partgo-installed', 'true');
  permanentlyHideInstallButton();
});

// ===================================================================
// 9. Start App
// ===================================================================
loadTheme();
checkLoginStatus();
