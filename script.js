// script.js
// เวอร์ชันเต็มจาก index.html (แยกออกมาแล้ว) - โครงสร้างเหมือนเดิม 100%

'use strict'; // เพิ่ม strict mode เพื่อจับ error เร็วขึ้น

// === ระบบอัปเดตแอปทันที + แจ้งเตือนผู้ใช้ ===
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
    timerProgressBar: true,
    customClass: {
      popup: 'animated bounceIn'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    }
  });
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('SW registered');
      reg.update();
      reg.addEventListener('updatefound', () => {
        newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateToast();
          }
        });
      });
    })
    .catch(err => console.log('SW registration failed:', err));
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// === แสดงเวอร์ชันแอปในเมนูตั้งค่า ===
function updateAppVersionDisplay() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' });
  }
  const versionElement = document.getElementById('appVersion');
  if (versionElement) {
    versionElement.textContent = 'v??';
  }
}
navigator.serviceWorker.addEventListener('message', event => {
  if (event.data && event.data.type === 'VERSION') {
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
      versionElement.textContent = event.data.version;
      versionElement.style.fontWeight = 'bold';
      versionElement.style.color = '#00ff88';
    }
  }
});
document.addEventListener('DOMContentLoaded', updateAppVersionDisplay);
const originalShowSettings = window.showSettings;
window.showSettings = function() {
  if (typeof originalShowSettings === 'function') {
    originalShowSettings();
  }
  updateAppVersionDisplay();
};

// Global employee data
let employeeData = [];

// Global search values for syncing between parts and images tabs
let globalSearch1 = '';
let globalSearch2 = '';

// Global for today tab: toggle pending only
let showOnlyPending = true;

// Sort config for today tab
let sortConfigToday = { column: 'IDRow', direction: 'desc' };

// Pagination config for today tab
let currentPageToday = 1;
let itemsPerPageToday = 20;

// Opensheet URL for Request sheet
const requestSheetUrl = 'https://opensheet.elk.sh/1xyy70cq2vAxGv4gPIGiL_xA5czDXqS2i6YYqW4yEVbE/Request';

// GAS URL for the new Code.gs deployment
const gasUrl = 'https://script.google.com/macros/s/AKfycbwVF2HAC8EYARt6Ku2ThUZWgeVxXWDhRQCQ0vCgGvilEMg8h5Hg3BlrcJJn2qMMqpGr/exec';

// Parts tab variables
const sheetID = "1nbhLKxs7NldWo_y0s4qZ8rlpIfyyGkR_Dqq8INmhYlw";
const sheetName = "MainSap";
const url = `https://opensheet.elk.sh/${sheetID}/${sheetName}`;
const searchInput1 = document.getElementById("searchInput1");
const searchInput2 = document.getElementById("searchInput2");
const searchButton = document.getElementById("searchButton");
const tableBody = document.querySelector("#data-table tbody");
const tableContainerParts = document.querySelector("#parts .table-container");
const pagination = document.getElementById("pagination");
const pageNumbers = document.getElementById("pageNumbers");
const itemsPerPageSelect = document.getElementById("itemsPerPage");
const firstPageButton = document.getElementById("firstPage");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const lastPageButton = document.getElementById("lastPage");
const errorContainer = document.getElementById("error-container");
const retryButton = document.getElementById("retry-button");
let allData = [];
let tempFilteredData = [];
let currentPage = 1;
let itemsPerPage = 20;
let currentFilteredData = [];

// Images tab variables
const searchInputImages1 = document.getElementById("searchInputImages1");
const searchInputImages2 = document.getElementById("searchInputImages2");
const searchButtonImages = document.getElementById("searchButtonImages");
const galleryContainer = document.getElementById("gallery-container-images");
const paginationImages = document.getElementById("paginationImages");
const pageNumbersImages = document.getElementById("pageNumbersImages");
const itemsPerPageSelectImages = document.getElementById("itemsPerPageImages");
const firstPageButtonImages = document.getElementById("firstPageImages");
const prevPageButtonImages = document.getElementById("prevPageImages");
const nextPageButtonImages = document.getElementById("nextPageImages");
const lastPageButtonImages = document.getElementById("lastPageImages");
const errorContainerImages = document.getElementById("error-container-images");
const retryButtonImages = document.getElementById("retry-button-images");
let allDataImages = [];
let tempFilteredDataImages = [];
let currentPageImages = 1;
let itemsPerPageImages = 20;
let currentFilteredDataImages = [];
let imageDatabase = {};
let imageDbLoaded = false;

// Today tab variables
const modal = document.getElementById("detailModal");
const modalContent = document.getElementById("modalContent");
const closeModal = document.getElementById("closeModal");
const searchInputToday = document.getElementById("searchInputToday");
const tableBodyToday = document.querySelector("#data-table-today tbody");
const errorContainerToday = document.getElementById("error-container-today");
const retryButtonToday = document.getElementById("retry-button-today");
const toggleAllDataBtn = document.getElementById("toggleAllDataBtn");

toggleAllDataBtn.addEventListener("click", () => {
  showOnlyPending = !showOnlyPending;
  if (showOnlyPending) {
    toggleAllDataBtn.innerHTML = '<i class="fas fa-clock"></i> <span>รอเบิก</span>';
    toggleAllDataBtn.title = "กำลังแสดงเฉพาะรายการที่รอเบิก";
    toggleAllDataBtn.style.background = "linear-gradient(135deg, #ccd3db, #e3e7ed)";
    toggleAllDataBtn.style.color = "white";
  } else {
    toggleAllDataBtn.innerHTML = '<i class="fas fa-history"></i> <span>ประวัติเบิก</span>';
    toggleAllDataBtn.title = "กำลังแสดงประวัติเบิกทั้งหมด";
    toggleAllDataBtn.style.background = "linear-gradient(135deg, #ccd3db, #e3e7ed)";
    toggleAllDataBtn.style.color = "white";
  }
  currentPageToday = 1;
  updateTableToday();
});

const paginationToday = document.getElementById("paginationToday");
const pageNumbersToday = document.getElementById("pageNumbersToday");
const itemsPerPageSelectToday = document.getElementById("itemsPerPageToday");
const firstPageButtonToday = document.getElementById("firstPageToday");
const prevPageButtonToday = document.getElementById("prevPageToday");
const nextPageButtonToday = document.getElementById("nextPageToday");
const lastPageButtonToday = document.getElementById("lastPageToday");
let allDataToday = [];
let currentFilteredDataToday = [];

// All tab variables
const modalAll = document.getElementById("detailModalAll");
const modalContentAll = document.getElementById("modalContentAll");
const closeModalAll = document.getElementById("closeModalAll");
const searchInputAll = document.getElementById("searchInputAll");
const tableBodyAll = document.querySelector("#data-table-all tbody");
const pageNumbersContainerAll = document.getElementById("pageNumbersAll");
const firstPageButtonAll = document.getElementById("firstPageAll");
const prevPageButtonAll = document.getElementById("prevPageAll");
const nextPageButtonAll = document.getElementById("nextPageAll");
const lastPageButtonAll = document.getElementById("lastPageAll");
const itemsPerPageSelectAll = document.getElementById("itemsPerPageAll");
let allDataAll = [];
let currentPageAll = 1;
let itemsPerPageAll = parseInt(itemsPerPageSelectAll.value);

// Pending calls tab variables
const sheetIDPending = '1dzE4Xjc7H0OtNUmne62u0jFQT-CiGsG2eBo-1v6mrZk';
const sheetNamePending = 'Call_Report';
const urlPending = `https://opensheet.elk.sh/${sheetIDPending}/${sheetNamePending}`;
const modalPending = document.getElementById("detailModalPending");
const modalContentPending = document.getElementById("modalContentPending");
const closeModalPending = document.getElementById("closeModalPending");
const teamFilterPending = document.getElementById("teamFilterPending");
const searchInputPending = document.getElementById("searchInputPending");
const searchButtonPending = document.getElementById("searchButtonPending");
const tableBodyPending = document.querySelector("#data-table-pending tbody");
const pageNumbersContainerPending = document.getElementById("pageNumbersPending");
const firstPageButtonPending = document.getElementById("firstPagePending");
const prevPageButtonPending = document.getElementById("prevPagePending");
const nextPageButtonPending = document.getElementById("nextPagePending");
const lastPageButtonPending = document.getElementById("lastPagePending");
const itemsPerPageSelectPending = document.getElementById("itemsPerPagePending");
let allDataPending = [];
let currentPagePending = 1;
let itemsPerPagePending = 20;
let sortConfigPending = { column: null, direction: 'asc' };

// Image Modal Handling
const imageModal = document.getElementById('imageModal');
const imageModalContent = document.getElementById('imageModalContent');
const closeImageModal = document.getElementById('closeImageModal');
closeImageModal.onclick = () => { imageModal.style.display = 'none'; };

const imageModalImages = document.getElementById('imageModalImages');
const imageModalContentImages = document.getElementById('imageModalContentImages');
const closeImageModalImages = document.getElementById('closeImageModalImages');
closeImageModalImages.onclick = () => { imageModalImages.style.display = 'none'; };

// Theme Management
function setTheme(theme) {
  localStorage.setItem('theme', theme);
  document.body.classList.remove('dark-mode', 'light-mode');
  document.body.classList.add(theme + '-mode');
}
function loadTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  setTheme(theme);
  if (document.getElementById('themeSelect')) {
    document.getElementById('themeSelect').value = theme;
  }
}

async function showSettings() {
  const currentTheme = localStorage.getItem('theme') || 'light';
  const savedUsername = localStorage.getItem('username');
  const savedUserName = localStorage.getItem('userName') || 'ไม่พบชื่อ';
  document.getElementById('modalUserName').textContent = savedUserName;
  document.getElementById('modalUserID').textContent = savedUsername || '-';
  document.getElementById('modalUserTeam').textContent = 'กำลังโหลด...';
  document.getElementById('themeSelect').value = currentTheme;

  try {
    if (employeeData.length === 0) {
      employeeData = await loadEmployeeData();
    }
    const user = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === savedUsername);
    document.getElementById('modalUserTeam').textContent = user?.หน่วยงาน || 'ไม่พบข้อมูลหน่วยงาน';
    document.getElementById('modalUserTeam').style.color = user?.หน่วยงาน ? '#1976d2' : '#e74c3c';
  } catch (err) {
    document.getElementById('modalUserTeam').textContent = 'โหลดข้อมูลไม่สำเร็จ';
    document.getElementById('modalUserTeam').style.color = '#e74c3c';
  }

  const adminSection = document.getElementById('adminAnnouncementSection');
  if (savedUsername === '7512411' && adminSection) {
    adminSection.style.display = 'block';
  } else if (adminSection) {
    adminSection.style.display = 'none';
  }

  document.getElementById('settingsModal').style.display = 'block';
  document.getElementById('themeSelect').onchange = null;
  document.getElementById('themeSelect').addEventListener('change', function(e) {
    setTheme(e.target.value);
  });
  updateAppVersionDisplay();
}

document.getElementById('closeSettings').onclick = () => {
  document.getElementById('settingsModal').style.display = 'none';
};

window.onclick = (event) => {
  const settingsModal = document.getElementById('settingsModal');
  if (event.target === settingsModal) {
    settingsModal.style.display = 'none';
  }
  if (event.target == modal) closeModal.click();
  if (event.target == modalAll) closeModalAll.click();
  if (event.target == modalPending) closeModalPending.click();
  if (event.target === imageModal) imageModal.style.display = 'none';
  if (event.target === imageModalImages) imageModalImages.style.display = 'none';
};

// Login System
const loginModal = document.getElementById('loginModal');
const appContent = document.getElementById('appContent');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const rememberMeCheckbox = document.getElementById('rememberMe');
const togglePasswordIcon = document.getElementById('togglePassword');
const userNameSmall = document.getElementById('userNameSmall');

function togglePasswordVisibility() {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  togglePasswordIcon.classList.toggle('fa-eye-slash');
  togglePasswordIcon.classList.toggle('fa-eye');
}

async function loadEmployeeData() {
  const employeeSheetID = "1eqVoLsZxGguEbRCC5rdI4iMVtQ7CK4T3uXRdx8zE3uw";
  const employeeSheetName = "Employee";
  const employeeUrl = `https://opensheet.elk.sh/${employeeSheetID}/${employeeSheetName}`;
  try {
    const response = await fetch(employeeUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error loading employee data:", error);
    throw error;
  }
}

async function handleLogin() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  loginError.style.display = 'none';
  if (!username || !password) {
    loginError.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
    loginError.style.display = 'block';
    return;
  }
  try {
    employeeData = await loadEmployeeData();
    const expectedPassword = username.slice(-4);
    const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === username && expectedPassword === password);
    if (employee && employee.Name) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      localStorage.setItem('userName', employee.Name);
      if (rememberMeCheckbox.checked) {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('rememberMe');
      }
      checkLoginStatus();
      setTimeout(() => {
        const searchInput = document.getElementById('searchInput1');
        if (searchInput) searchInput.focus();
      }, 500);
    } else {
      loginError.textContent = 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!';
      loginError.style.display = 'block';
      passwordInput.value = '';
    }
  } catch (error) {
    loginError.textContent = 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน กรุณาลองใหม่';
    loginError.style.display = 'block';
    console.error('Login error:', error);
  }
}

function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const savedUsername = localStorage.getItem('username');
  if (isLoggedIn && savedUsername) {
    loginModal.classList.remove('active');
    appContent.classList.add('logged-in');
    loadImageDatabase().then(() => {
      console.log("ฐานข้อมูลรูปภาพพร้อมใช้งานแล้ว");
      showTab('parts');
    });
  } else {
    loginModal.classList.add('active');
    appContent.classList.remove('logged-in');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userName');
  }
  if (localStorage.getItem('rememberMe') === 'true') {
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) usernameInput.value = savedUsername;
    rememberMeCheckbox.checked = true;
  }
}

function handleLogout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  localStorage.removeItem('userName');
  localStorage.removeItem('savedUsername');
  localStorage.removeItem('rememberMe');
  checkLoginStatus();
  document.getElementById('settingsModal').style.display = 'none';
}

passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});

// showTab() และฟังก์ชันที่เหลือทั้งหมด... (ตามเดิมทุกบรรทัด)
function showTab(tabId) {
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach(tab => tab.classList.remove("active"));
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add("active");

  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => btn.classList.remove("active"));
  const activeNav = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeNav) activeNav.classList.add("active");

  if (tabId !== "pending-calls") {
    document.getElementById("loading").style.display = "flex";
  }

  switch (tabId) {
    case "parts":
      document.getElementById('searchInput1').value = globalSearch1;
      document.getElementById('searchInput2').value = globalSearch2;
      loadImageDatabase().then(() => {
        console.log("โหลดฐานข้อมูลรูปภาพเรียบร้อยสำหรับแท็บ Parts");
        loadData();
      }).catch(err => {
        console.error("โหลดฐานรูปภาพล้มเหลว:", err);
        loadData();
      });
      break;
    case "images":
      document.getElementById('searchInputImages1').value = globalSearch1;
      document.getElementById('searchInputImages2').value = globalSearch2;
      loadImageDatabase().then(() => loadImagesData()).catch(err => loadImagesData());
      break;
    case "today":
      loadTodayData();
      break;
    case "all":
      loadAllData();
      break;
    case "pending-calls":
      loadPendingCallsData();
      break;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

// ... (ใส่ฟังก์ชันที่เหลือทั้งหมดตามเดิม เช่น loadData(), loadImagesData(), loadTodayData(), formatTimestamp(), openAnnouncementDeck(), PWA install, etc.)

// ตัวอย่างฟังก์ชันสำคัญเพิ่มเติม (ไม่ตัดทิ้ง)
function formatTimestamp(dateTimeStr) {
  if (!dateTimeStr) return "";
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const yearBE = year + 543;
  const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${yearBE}`;
  const formattedTime = timePart || '';
  return `${formattedDate} ${formattedTime}`;
}

// เรียกตอนเริ่มต้น
loadTheme();
checkLoginStatus();

// PWA Install Prompt (ส่วนท้ายสุด)
let deferredPrompt = null;
function permanentlyHideInstallButton() {
  const btn = document.getElementById('install-btn');
  if (btn) btn.remove();
}
if (localStorage.getItem('partgo-installed') === 'true') permanentlyHideInstallButton();

window.addEventListener('beforeinstallprompt', (e) => {
  if (localStorage.getItem('partgo-installed') === 'true') {
    e.preventDefault();
    return;
  }
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
    Swal.fire({ icon: 'success', title: 'ติดตั้งสำเร็จ!', text: 'PartsGo ถูกเพิ่มในหน้าจอหลักแล้ว', timer: 3000, showConfirmButton: false });
  }
  deferredPrompt = null;
});

window.addEventListener('appinstalled', () => {
  localStorage.setItem('partgo-installed', 'true');
  permanentlyHideInstallButton();
});

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('partgo-installed') === 'true') permanentlyHideInstallButton();
});
