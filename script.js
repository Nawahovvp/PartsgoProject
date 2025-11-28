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

// === แสดงเวอร์ชันแอปในเมนูตั้งค่า (อัตโนมัติจาก sw.js) ===
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

'use strict';

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

const toggleAllDataBtn = document.getElementById('toggleAllDataBtn');

if (toggleAllDataBtn) {
  toggleAllDataBtn.addEventListener('click', () => {
    showOnlyPending = !showOnlyPending;
    if (showOnlyPending) {
      toggleAllDataBtn.innerHTML = '<i class="fas fa-clock"></i> <span>รอเบิก</span>';
      toggleAllDataBtn.title = 'กำลังแสดงเฉพาะรายการที่รอเบิก';
      toggleAllDataBtn.style.background = 'linear-gradient(135deg, #ccd3db, #e3e7ed)';
      toggleAllDataBtn.style.color = 'white';
    } else {
      toggleAllDataBtn.innerHTML = '<i class="fas fa-history"></i> <span>ประวัติเบิก</span>';
      toggleAllDataBtn.title = 'กำลังแสดงประวัติเบิกทั้งหมด';
      toggleAllDataBtn.style.background = 'linear-gradient(135deg, #ccd3db, #e3e7ed)';
      toggleAllDataBtn.style.color = 'white';
    }
    currentPageToday = 1;
    updateTableToday();
  });
}


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

// Image Modal Handling for #parts
const imageModal = document.getElementById('imageModal');
const imageModalContent = document.getElementById('imageModalContent');
const closeImageModal = document.getElementById('closeImageModal');
closeImageModal.onclick = () => {
  imageModal.style.display = 'none';
};

// Image Modal Handling for #images
const imageModalImages = document.getElementById('imageModalImages');
const imageModalContentImages = document.getElementById('imageModalContentImages');
const closeImageModalImages = document.getElementById('closeImageModalImages');
closeImageModalImages.onclick = () => {
  imageModalImages.style.display = 'none';
};

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
  if (event.target === imageModal) {
    imageModal.style.display = 'none';
  }
  if (event.target === imageModalImages) {
    imageModalImages.style.display = 'none';
  }
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
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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
    if (document.querySelector('.nav-btn.active')) {
      showTab('parts');
    }
  } else {
    loginModal.classList.add('active');
    appContent.classList.remove('logged-in');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userName');
    localStorage.removeItem('savedPassword');
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
  localStorage.removeItem('savedPassword');
  localStorage.removeItem('rememberMe');
  checkLoginStatus();
  document.getElementById('settingsModal').style.display = 'none';
}

passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
});

// showTab(tabId) เวอร์ชันสมบูรณ์ 100%
function showTab(tabId) {
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach(tab => tab.classList.remove("active"));
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add("active");
  } else {
    console.error("ไม่พบ tab:", tabId);
    return;
  }
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
      loadImageDatabase().then(() => {
        console.log("โหลดฐานข้อมูลรูปภาพเรียบร้อยสำหรับแท็บ Images");
        loadImagesData();
      }).catch(err => {
        console.error("โหลดฐานรูปภาพล้มเหลว:", err);
        loadImagesData();
      });
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
    default:
      console.warn("ไม่รู้จัก tabId:", tabId);
      hideLoading();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
}

function showQRCode() {
  Swal.fire({
    title: 'สแกน QR Code',
    html: `
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://request-nawanakorn.vercel.app/" alt="QR Code" class="swal2-qrcode" style="width: 150px; height: 150px;">
      <p>สแกนเพื่อเข้าสู่ระบบขอเบิกอะไหล่</p>
    `,
    confirmButtonText: 'ปิด',
    customClass: {
      popup: 'swal2-popup',
      title: 'swal2-title',
      confirmButton: 'swal2-confirm'
    }
  });
}
function showDetailModal(row, modalId, contentId) {
  const material = (row.Material || "").toString().trim();
  console.log("เปิด Modal รายละเอียด → Material:", material);
  let galleryHtml = '';
  let imageIds = [];
  // 1. ลำดับความสำคัญ: ดึงจากฐานใหม่ MainSapimage ก่อน
  if (imageDbLoaded && imageDatabase[material] && imageDatabase[material].length > 0) {
    imageIds = imageDatabase[material];
    console.log(`เจอ ${imageIds.length} รูปจาก MainSapimage`);
  }
  // 2. ถ้าไม่มี → ดึงจาก UrlWeb เดิม (fallback)
  else if (row.UrlWeb && typeof row.UrlWeb === 'string') {
    const match = row.UrlWeb.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
                  row.UrlWeb.match(/id=([a-zA-Z0-9-_]+)/) ||
                  row.UrlWeb.match(/uc\?id=([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      imageIds = [match[1]];
      console.log("ใช้รูปจาก UrlWeb เดิม (fallback):", imageIds[0]);
    }
  }
  // สร้าง Gallery ตามจำนวนรูป
  if (imageIds.length === 0) {
  galleryHtml = `
    <div style="width:380px;height:380px;background:#000;display:flex;align-items:center;justify-content:center;margin:0 auto;color:#ccc;font-size:20px;">
      ไม่มีรูปภาพในระบบ
    </div>`;
}
// กรณีมีรูป (ไม่ว่าจะ 1 หรือหลายรูป → ใช้โครงสร้างเดียวกัน)
else {
  galleryHtml = `
    <div class="image-swiper-container">
      <div class="image-swiper-wrapper" style="width:${imageIds.length * 100}%;">
        ${imageIds.map(id => `
          <div class="image-slide">
            <img src="https://drive.google.com/thumbnail?id=${id}&sz=w1000"
                 alt="รูปอะไหล่"
                 onerror="this.src='https://via.placeholder.com/380/111/fff?text=ไม่มีรูป';">
          </div>
        `).join('')}
      </div>
      <!-- ปุ่มลูกศร (แสดงเฉพาะตอนมีหลายรูป) -->
      ${imageIds.length > 1 ? `
        <button class="swiper-btn swiper-prev">‹</button>
        <button class="swiper-btn swiper-next">›</button>
        <div class="swiper-counter">1 / ${imageIds.length}</div>
      ` : ''}
    </div>`;
}
  // ส่วนข้อมูลด้านล่าง
  const infoHtml = `
    <div class="detail-info">
      <div class="detail-header-row">
        <h2>รายละเอียดอะไหล่</h2>
        <button class="requisition-button header-btn" onclick="showRequisitionDialog(${JSON.stringify(row).replace(/"/g, '&quot;')})">
          เบิกเลย
        </button>
      </div>
      <div class="detail-row"><span class="label">Material</span><span class="value">${material}</span></div>
      <div class="detail-row"><span class="label">Description</span><span class="value">${row.Description || '-'}</span></div>
      <div class="detail-row"><span class="label">วิภาวดี</span><span class="value">${row["วิภาวดี"] ? Number(row["วิภาวดี"]).toLocaleString() + ' ชิ้น' : '0 ชิ้น'}</span></div>
      <div class="detail-row"><span class="label">นวนคร</span><span class="value">${row["Unrestricted"] ? Number(row["Unrestricted"]).toLocaleString() + ' ชิ้น' : '0 ชิ้น'}</span></div>
      ${row["Rebuilt"] ? `<div class="detail-row"><span class="label">Rebuilt</span><span class="value rebuilt-text">${row["Rebuilt"]}</span></div>` : ''}
      ${row["Product"] ? `<div class="detail-row"><span class="label">Product</span><span class="value">${row["Product"]}</span></div>` : ''}
      ${row["OCRTAXT"] ? `<div class="detail-row"><span class="label">Spec</span><span class="value spec-text">${row["OCRTAXT"]}</span></div>` : ''}
      ${row["หมายเหตุ"] ? `<div class="detail-row"><span class="label" style="color:#e74c3c;font-weight:bold;">หมายเหตุ</span><span class="value" style="color:#e74c3c;font-weight:bold;">${row["หมายเหตุ"]}</span></div>` : ''}
    </div>
  `;
  // แสดง Modal
  const modal = document.getElementById(modalId);
  const content = document.getElementById(contentId);
  content.innerHTML = galleryHtml + infoHtml;
  modal.style.display = 'block';
  modal.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  // ถ้ามีหลายรูป → เริ่ม Swipe
 if (imageIds.length > 1) {
  setTimeout(() => initSwiper(modal, imageIds.length), 150); // เพิ่ม delay นิดนึงให้ DOM สร้างเสร็จ
}
}
// === ฟังก์ชัน Swipe (ต้องมีด้วย) ===
// ตัวแปรเก็บ index ปัจจุบันของแต่ละ Modal
let currentSwiperIndex = {};
// เริ่มระบบ Swipe เมื่อมีหลายรูป
function initSwiper(modal, totalSlides) {
  const container = modal.querySelector('.image-swiper-container');
  if (!container) return;
  const wrapper = container.querySelector('.image-swiper-wrapper');
  const prevBtn = container.querySelector('.swiper-prev');
  const nextBtn = container.querySelector('.swiper-next');
  const counter = container.querySelector('.swiper-counter');
  const modalId = modal.id;
  if (imageIds.length > 1) {
  setTimeout(() => initSwiper(modal, imageIds.length), 100);
}
  // เริ่มที่รูปแรก
  currentSwiperIndex[modalId] = currentSwiperIndex[modalId] || 0;
  const update = () => {
    const idx = currentSwiperIndex[modalId];
    wrapper.style.transform = `translateX(-${idx * 100}%)`;
    counter.textContent = `${idx + 1} / ${totalSlides}`;
  };
  prevBtn.onclick = () => {
    currentSwiperIndex[modalId] = currentSwiperIndex[modalId] > 0
      ? currentSwiperIndex[modalId] - 1
      : totalSlides - 1;
    update();
  };
  nextBtn.onclick = () => {
    currentSwiperIndex[modalId] = (currentSwiperIndex[modalId] + 1) % totalSlides;
    update();
  };
  // รองรับการปัดนิ้วบนมือถือ
  let startX = 0;
  container.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  container.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextBtn.click(); // ปัดซ้าย → ถัดไป
      else prevBtn.click(); // ปัดขวา → ย้อนกลับ
    }
  }, { passive: true });
  update(); // แสดงรูปแรก
}
function initSwiper(modal) {
  const container = modal.querySelector('.image-swiper-container');
  if (!container) return;
 
  const wrapper = container.querySelector('.image-swiper-wrapper');
  const prevBtn = container.querySelector('.swiper-prev');
  const nextBtn = container.querySelector('.swiper-next');
  const counter = container.querySelector('.swiper-counter');
  const modalId = modal.id;
 
  currentSwiperIndex[modalId] = 0;
  const totalSlides = wrapper.children.length;
 
  const updateSlide = () => {
    const idx = currentSwiperIndex[modalId];
    wrapper.style.transform = `translateX(-${idx * 100}%)`;
    counter.textContent = `${idx + 1} / ${totalSlides}`;
  };
 
  const goPrev = () => {
    let idx = currentSwiperIndex[modalId];
    idx = idx > 0 ? idx - 1 : totalSlides - 1;
    currentSwiperIndex[modalId] = idx;
    updateSlide();
  };
 
  const goNext = () => {
    let idx = currentSwiperIndex[modalId];
    idx = idx < totalSlides - 1 ? idx + 1 : 0;
    currentSwiperIndex[modalId] = idx;
    updateSlide();
  };
 
  // ลูกศร
  if (prevBtn) prevBtn.onclick = goPrev;
  if (nextBtn) nextBtn.onclick = goNext;
 
  // Touch Swipe
  let startX = 0;
  container.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  container.addEventListener('touchend', e => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) goNext(); // Swipe left
    if (endX - startX > 50) goPrev(); // Swipe right
  });
 
  // Keyboard (arrow keys)
  document.addEventListener('keydown', e => {
    if (modal.style.display !== 'block') return;
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  });
 
  updateSlide();
}
// Global handlers สำหรับปุ่มลูกศร (ถ้าต้องการเรียกจาก onclick)
window.handleSwiperPrev = function(btn) {
  const container = btn.closest('.image-swiper-container');
  const modalId = container.closest('.image-modal, .image-modal-images').id;
  const prevIdx = (currentSwiperIndex[modalId] || 0) - 1;
  currentSwiperIndex[modalId] = prevIdx < 0 ? container.querySelector('.image-swiper-wrapper').children.length - 1 : prevIdx;
  initSwiper(document.getElementById(modalId)); // Re-init to update
};
window.handleSwiperNext = function(btn) {
  const container = btn.closest('.image-swiper-container');
  const modalId = container.closest('.image-modal, .image-modal-images').id;
  const wrapper = container.querySelector('.image-swiper-wrapper');
  const total = wrapper.children.length;
  let nextIdx = (currentSwiperIndex[modalId] || 0) + 1;
  currentSwiperIndex[modalId] = nextIdx >= total ? 0 : nextIdx;
  initSwiper(document.getElementById(modalId)); // Re-init to update
};
// ปิด modal ทุกช่องทาง → ปลดล็อกพื้นหลังทันที
function closeAllImageModals() {
  document.getElementById('imageModal').style.display = 'none';
  document.getElementById('imageModalImages').style.display = 'none';
  document.body.style.overflow = 'auto'; // ปลดล็อกพื้นหลัง
  currentSwiperIndex = {};
}
// ปุ่ม X
document.querySelectorAll('.image-close, .image-close-images').forEach(btn => {
  btn.onclick = () => {
    closeAllImageModals();
  };
});
// คลิกพื้นหลัง
window.addEventListener('click', (e) => {
  if (e.target.id === 'imageModal' || e.target.id === 'imageModalImages') {
    closeAllImageModals();
  }
});
// เพิ่มปุ่ม ESC บนคีย์บอร์ดด้วย (สะดวกมาก)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllImageModals();
  }
});
      // Event listener for lightbox close on ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('lightbox').style.display === 'flex') {
          closeLightbox();
        }
      });
      // Parts tab functions (now after variables)
      itemsPerPageSelect.addEventListener("change", () => {
        itemsPerPage = parseInt(itemsPerPageSelect.value, 10);
        currentPage = 1;
        renderTableData();
        renderPagination(allData.length);
      });
      retryButton.addEventListener("click", () => {
        errorContainer.style.display = "none";
        loadData();
      });
     function renderTable(data) {
        if (!tableBody) {
          console.error("Table body for #data-table not found");
          Swal.fire({
            icon: "error",
            title: "ข้อผิดพลาด",
            text: "ไม่พบตารางข้อมูล กรุณาตรวจสอบโครงสร้างหน้าเว็บ",
            confirmButtonText: "ตกลง",
          });
          return;
        }
        tableBody.innerHTML = "";
        data.forEach((row) => {
          const tr = document.createElement("tr");
          const requisitionTd = document.createElement("td");
          const btn = document.createElement("button");
          btn.textContent = "เบิก";
          btn.className = "requisition-button";
          btn.onclick = () => showRequisitionDialog(row);
          requisitionTd.appendChild(btn);
          tr.appendChild(requisitionTd);
          const columns = [
            "UrlWeb",
            "Material",
            "Description",
            "วิภาวดี",
            "Unrestricted",
            "Rebuilt",
            "หมายเหตุ",
            "Product",
            "OCRTAXT"
          ];
          // Convert values to numbers for comparison
          const vibhavadiValue = parseFloat(row["วิภาวดี"]) || 0;
          const unrestrictedValue = parseFloat(row["Unrestricted"]) || 0;
          // Determine styling based on conditions
          let textColor = "";
          let fontWeight = "";
          if (vibhavadiValue > 0) {
            textColor = "#4caf50"; // Green
            fontWeight = "bold";
          } else if (vibhavadiValue === 0 && unrestrictedValue > 0) {
            textColor = "#2196f3"; // Blue
            fontWeight = "bold";
          }
          columns.forEach((col) => {
            const td = document.createElement("td");
            let value = row[col] || "";
            if (col === "วิภาวดี" || col === "Unrestricted") {
              if (value && !isNaN(value)) {
                value = Number(value).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                });
              } else if (value === "0" || value === 0) {
                value = "";
              }
            }
            if ((col === "หมายเหตุ" || col === "Rebuilt") && value) {
              td.style.color = "#d32f2f";
              td.style.fontWeight = "bold";
            }
            // Apply conditional styling to Material, Description, วิภาวดี, and Unrestricted
            if (
              col === "Material" ||
              col === "Description" ||
              col === "วิภาวดี" ||
              col === "Unrestricted"
            ) {
              if (textColor) td.style.color = textColor;
              if (fontWeight) td.style.fontWeight = fontWeight;
            }
            if (col === "UrlWeb" && value) {
              // Changed to button that opens modal instead of external link
              const imageBtn = document.createElement("button");
              imageBtn.innerHTML = '<i class="fas fa-image"></i>';
              imageBtn.className = "image-button";
              imageBtn.onclick = () => showDetailModal(row, 'imageModal', 'imageModalContent'); // Use unified function
              td.appendChild(imageBtn);
            } else {
              td.textContent = value;
            }
            tr.appendChild(td);
          });
          tableBody.appendChild(tr);
        });
      }
      async function showRequisitionDialog(row) {
  document.body.style.overflow = 'hidden';
  const history = {
    employeeCode: getFromLocalStorage('employeeCode'),
    team: getFromLocalStorage('team'),
    contact: getFromLocalStorage('contact'),
    callNumber: getFromLocalStorage('callNumber'),
    callType: getFromLocalStorage('callType'),
   
  };
  const vibhavadiValue = parseFloat(row["วิภาวดี"]) || 0;
  const unrestrictedValue = parseFloat(row["Unrestricted"]) || 0;
  const remark = row["หมายเหตุ"] || '';
  const hasStockVibha = vibhavadiValue > 0;
  let proceed = true;

  // ตรวจสอบเงื่อนไขใหม่: ถ้านวนคร = 0 และหมายเหตุไม่ว่าง
  if (unrestrictedValue === 0 && remark.trim() !== '') {
    const replacementWarning = await Swal.fire({
      title: '<strong style="font-size:24px; color:#f39c12;">คำเตือน!</strong>',
      iconColor: '#f39c12',
      width: window.innerWidth <= 480 ? '90%' : '560px',
      padding: '30px 20px',
      background: document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#ffffff',
      backdrop: 'rgba(0,0,0,0.85)',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-check"></i> ยืนยันเบิกต่อ',
      cancelButtonText: '<i class="fas fa-times"></i> ยกเลิก',
      reverseButtons: true,
      buttonsStyling: false,
      html: `
        <div style="text-align:center; margin:20px 0;">
          <i class="fas fa-exclamation-triangle" style="font-size:60px; color:#f39c12; margin-bottom:15px; opacity:0.9;"></i>
          <div style="font-size:18px; font-weight:600; color:#e67e22;">
            Material: ${row.Material || ''}
          </div>
          <div style="font-size:18px; font-weight:600; color:#e67e22; margin-top:10px;">
            ${row.Description || ''}
          </div>
          <div style="font-size:17px; color:#7f8c8d; margin:15px 0;">
            คลังนวนครไม่มีของเหลือแล้ว
          </div>
          <div style="margin-top:20px; padding:16px; background:#e8f5e8; border-left:6px solid #27ae60; border-radius:12px; font-size:15px; color:#27ae60;">
            <i class="fas fa-info-circle"></i>
            อาจมีอะไหล่ทดแทน: ${remark}
          </div>
        </div>
      `,
      didOpen: () => {
        const confirmBtn = document.querySelector('.swal2-confirm');
        const cancelBtn = document.querySelector('.swal2-cancel');
        confirmBtn.style.cssText = `
          background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
          color: white !important;
          padding: 14px 36px !important;
          border-radius: 30px !important;
          font-size: 17px !important;
          font-weight: bold !important;
          box-shadow: 0 6px 20px rgba(231,76,60,0.5) !important;
        `;
        cancelBtn.style.cssText = `
          background: linear-gradient(135deg, #95a5a6, #7f8c8d) !important;
          color: white !important;
          padding: 14px 36px !important;
          border-radius: 30px !important;
          font-size: 17px !important;
          font-weight: bold !important;
          box-shadow: 0 6px 20px rgba(127,140,141,0.5) !important;
        `;
      }
    });
    if (replacementWarning.isDismissed) {
      Swal.close();
      document.body.style.overflow = 'auto';
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
  }

  // ตรวจสอบเงื่อนไขเดิม: คลังวิภาวดีมีของ
  if (hasStockVibha) {
        const warningResult = await Swal.fire({
          title: '<strong style="font-size:24px; color:#f39c12;">คำเตือน!</strong>',
          iconColor: '#f39c12',
          width: window.innerWidth <= 480 ? '90%' : '560px',
          padding: '30px 20px',
          background: document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#ffffff',
          backdrop: 'rgba(0,0,0,0.85)',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-check"></i> ยืนยันเบิกต่อ',
          cancelButtonText: '<i class="fas fa-times"></i> ยกเลิก',
          reverseButtons: true,
          buttonsStyling: false,
          html: `
            <div style="text-align:center; margin:20px 0;">
              <i class="fas fa-exclamation-triangle" style="font-size:60px; color:#f39c12; margin-bottom:15px; opacity:0.9;"></i>
              <div style="font-size:18px; font-weight:600; color:#e67e22;">
                คลังวิภาวดีมีของอยู่
              </div>
              <div style="font-size:32px; font-weight:bold; color:#27ae60; margin:12px 0;">
                ${vibhavadiValue.toLocaleString()} ชิ้น
              </div>
              <div style="font-size:17px; color:#7f8c8d; margin:15px 0;">
                กรุณาตรวจสอบว่าจำเป็นต้องเบิกจากนวนครจริงหรือไม่
              </div>
              <div style="margin-top:20px; padding:16px; background:#e8f5e8; border-left:6px solid #27ae60; border-radius:12px; font-size:15px; color:#27ae60;">
                <i class="fas fa-info-circle"></i>
                หากยืนยัน ระบบจะดึงจากคลังนวนครแทน
              </div>
            </div>
          `,
          didOpen: () => {
            const confirmBtn = document.querySelector('.swal2-confirm');
            const cancelBtn = document.querySelector('.swal2-cancel');
            confirmBtn.style.cssText = `
              background: linear-gradient(135deg, #e74c3c, #c0392b) !important;
              color: white !important;
              padding: 14px 36px !important;
              border-radius: 30px !important;
              font-size: 17px !important;
              font-weight: bold !important;
              box-shadow: 0 6px 20px rgba(231,76,60,0.5) !important;
            `;
            cancelBtn.style.cssText = `
              background: linear-gradient(135deg, #95a5a6, #7f8c8d) !important;
              color: white !important;
              padding: 14px 36px !important;
              border-radius: 30px !important;
              font-size: 17px !important;
              font-weight: bold !important;
              box-shadow: 0 6px 20px rgba(127,140,141,0.5) !important;
            `;
          }
        });
        // ถ้ากดยกเลิก → ออกเลย
        if (warningResult.isDismissed) {
  Swal.close(); // ปิดหน้าต่างเบิกทั้งหมด (จริง ๆ ไม่ใส่ก็ได้ แต่ไม่เป็นไร)
  // ✅ รีเซ็ตสภาพหน้าจอให้กลับมาดู tab ค้นหาได้ปกติ
  document.body.style.overflow = 'auto'; // เผื่อ SweetAlert ล็อก scroll ไว้
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant' // หรือ 'smooth' ถ้าอยากให้เลื่อนนิ่ม ๆ
  });
  return; // หยุดทุกอย่าง
}
      }
  if (employeeData.length === 0) {
    employeeData = await loadEmployeeData();
  }
  // ตัวแปร selectedCallType ย้ายมาอยู่นอก didOpen เพื่อให้ preConfirm เข้าถึงได้
  let selectedCallType = '';
  Swal.fire({
    title: '📋 เบิกอะไหล่นวนคร',
    html: `
      <style>
        .autocomplete-items {
          position: absolute;
          border: 1px solid #ccc;
          border-top: none;
          z-index: 9999;
          background-color: white;
          width: 100%;
          max-height: 120px;
          overflow-y: auto;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          margin-top: 2px;
          border-radius: 6px;
        }
        .autocomplete-item {
          padding: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .autocomplete-item:hover {
          background-color: #f1f1f1;
        }
        .swal2-label {
          text-align: left !important;
          display: block !important;
          margin: 8px 0 4px !important;
          font-weight: bold !important;
          width: 100% !important;
        }
        .swal2-input, .swal2-select {
          width: 100% !important;
          margin: 4px 0 !important;
          padding: 6px !important;
          box-sizing: border-box !important;
          font-size: 14px !important;
          height: 36px !important;
        }
        .error-message {
          color: red !important;
          font-size: 12px !important;
          margin-top: 2px !important;
          display: block !important;
          text-align: left !important;
        }
        .invalid-input {
          border: 2px solid red !important;
          box-shadow: 0 0 5px rgba(255, 0, 0, 0.5) !important;
        }
        #swal-employee-name-display, #swal-team-display {
          color: #4caf50 !important;
          font-weight: bold !important;
          margin: 4px 0 !important;
          padding: 4px !important;
          background: #e8f5e8 !important;
          border-radius: 4px !important;
          text-align: left !important;
        }
        /* Canva-like Call Type buttons */
        .call-type-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 4px 0;
          justify-content: center;
        }
        .call-type-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 25px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
          min-width: 60px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .call-type-btn:not(.selected) {
          background: linear-gradient(135deg, #e0e0e0, #f5f5f5);
          color: #666;
        }
        .call-type-btn.selected {
          background: linear-gradient(135deg, #667eea, #764ba2);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
        }
        .call-type-btn:hover:not(.selected) {
          background: linear-gradient(135deg, #d0d0d0, #e5e5e5);
          transform: translateY(-1px);
        }
        body.dark-mode .call-type-btn:not(.selected) {
          background: linear-gradient(135deg, #555, #666);
          color: #ccc;
        }
        body.dark-mode .call-type-btn.selected {
          background: linear-gradient(135deg, #1abc9c, #16a085);
          box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);
        }
        body.dark-mode .call-type-btn:hover:not(.selected) {
          background: linear-gradient(135deg, #444, #555);
          transform: translateY(-1px);
        }
      </style>
      <div class="swal2-label">📦 Material: ${row.Material || ''}</div>
      <div class="swal2-label">📝 Description: ${row.Description || ''}</div>
      <label class="swal2-label">🔢 จำนวน</label>
      <input id="swal-quantity" class="swal2-input" type="number" value="1" min="1">
      <span id="swal-quantity-error" class="error-message"></span>
      <label class="swal2-label">🆔 รหัสพนักงาน</label>
      <input id="swal-employee-code" class="swal2-input" placeholder="7xxxxxx">
      <div id="employee-code-history" class="autocomplete-items" style="display:none;"></div>
      <span id="swal-employee-code-error" class="error-message"></span>
      <label class="swal2-label">👤 ชื่อพนักงาน</label>
      <div id="swal-employee-name-display"></div>
      <label class="swal2-label">👥 ทีม</label>
      <div id="swal-team-display"></div>
      <label class="swal2-label">📞 เบอร์ติดต่อ</label>
      <input id="swal-contact" class="swal2-input" placeholder="เช่น 08xxxxxxxx">
      <div id="contact-history" class="autocomplete-items" style="display:none;"></div>
      <span id="swal-contact-error" class="error-message"></span>
      <label class="swal2-label">📄 เลขที่ Call</label>
      <input id="swal-call-number" class="swal2-input" placeholder="2... หรือ ...">
      <div id="call-number-history" class="autocomplete-items" style="display:none;"></div>
      <span id="swal-call-number-error" class="error-message"></span>
      <label class="swal2-label">🗳️ Call Type</label>
      <div id="call-type-container" class="call-type-container">
        <button class="call-type-btn" data-value="I">I</button>
        <button class="call-type-btn" data-value="P">P</button>
        <button class="call-type-btn" data-value="Q">Q</button>
        <button class="call-type-btn" data-value="R">R</button>
      </div>
      <span id="swal-call-type-error" class="error-message"></span>
      <label class="swal2-label">🗒️ หมายเหตุ</label>
      <input id="swal-remark" class="swal2-input" placeholder="ไม่บังคับ">
      <span id="swal-remark-error" class="error-message"></span>
    `,
    focusConfirm: false,
    showCancelButton: true,
    showCloseButton: true,
    closeButtonHtml: '<i class="fas fa-times"></i>', // ไอคอน X สวย ๆ (ต้องมี Font Awesome)
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      // Force high z-index and ensure backdrop covers full screen
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '99998';
        swalContainer.style.position = 'fixed';
        swalContainer.style.top = '0';
        swalContainer.style.left = '0';
        swalContainer.style.width = '100vw';
        swalContainer.style.height = '100vh';
        swalContainer.style.display = 'flex';
        swalContainer.style.justifyContent = 'center';
        swalContainer.style.alignItems = 'center';
      }
      const swalBackdrop = document.querySelector('.swal2-backdrop');
      if (swalBackdrop) {
        swalBackdrop.style.zIndex = '99997';
        swalBackdrop.style.position = 'fixed';
        swalBackdrop.style.top = '0';
        swalBackdrop.style.left = '0';
        swalBackdrop.style.width = '100vw';
        swalBackdrop.style.height = '100vh';
        swalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        swalBackdrop.style.backdropFilter = 'blur(8px)';
      }
      const swalPopup = document.querySelector('.swal2-popup');
      if (swalPopup) {
        swalPopup.style.zIndex = '99999';
        swalPopup.style.position = 'relative';
        swalPopup.style.margin = '0';
        swalPopup.style.transform = 'none';
        swalPopup.style.maxHeight = '90vh';
        swalPopup.style.overflowY = 'auto';
        swalPopup.style.width = 'auto';
        swalPopup.style.maxWidth = '90vw';
        if (window.innerWidth <= 768) {
          swalPopup.style.width = '95vw';
          swalPopup.style.padding = '15px';
        }
      }
      const quantityInput = document.getElementById('swal-quantity');
      const employeeCodeInput = document.getElementById('swal-employee-code');
      const contactInput = document.getElementById('swal-contact');
      const callNumberInput = document.getElementById('swal-call-number');
      const remarkInput = document.getElementById('swal-remark');
      const confirmButton = document.querySelector('.swal2-confirm');
      confirmButton.disabled = true;
      // Handle Call Type button selection (Canva-like) - ใช้ selectedCallType จาก outer scope
      const callTypeButtons = document.querySelectorAll('.call-type-btn');
      callTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          callTypeButtons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedCallType = btn.dataset.value; // อัพเดทตัวแปรจาก outer scope
          console.log('Selected Call Type:', selectedCallType); // Debug: ดูใน console
          validateInputs();
        });
      });
      function setupAutocomplete(input, key, containerId) {
        input.addEventListener('input', () => {
          const container = document.getElementById(containerId);
          const val = input.value.toLowerCase();
          const items = getFromLocalStorage(key).filter(item => item.toLowerCase().includes(val));
          container.innerHTML = '';
          items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.textContent = item;
            div.onclick = () => {
              input.value = item;
              container.style.display = 'none';
              validateInputs();
            };
            container.appendChild(div);
          });
          container.style.display = items.length ? 'block' : 'none';
        });
        input.addEventListener('blur', () => {
          setTimeout(() => {
            const container = document.getElementById(containerId);
            container.style.display = 'none';
          }, 200);
        });
      }
      setupAutocomplete(contactInput, 'contact', 'contact-history');
      setupAutocomplete(callNumberInput, 'callNumber', 'call-number-history');
      const lastContact = getFromLocalStorage('contact')[0];
      if (lastContact) contactInput.value = lastContact;
      const inputs = [quantityInput, employeeCodeInput, contactInput, callNumberInput, remarkInput];
      function validateInputs() {
        const errors = {
          quantityError: document.getElementById('swal-quantity-error'),
          employeeCodeError: document.getElementById('swal-employee-code-error'),
          contactError: document.getElementById('swal-contact-error'),
          callNumberError: document.getElementById('swal-call-number-error'),
          callTypeError: document.getElementById('swal-call-type-error'),
          remarkError: document.getElementById('swal-remark-error')
        };
        inputs.forEach(input => input.classList.remove('invalid-input'));
        Object.values(errors).forEach(el => el.textContent = '');
        let isValid = true;
        if (!quantityInput.value || quantityInput.value < 1) {
          errors.quantityError.textContent = 'กรุณากรอกจำนวนที่มากกว่าหรือเท่ากับ 1';
          quantityInput.classList.add('invalid-input');
          isValid = false;
        }
        const employeeCode = employeeCodeInput.value.trim();
        if (!employeeCode || !/^\d{7}$/.test(employeeCode) || employeeCode[0] !== '7') {
          errors.employeeCodeError.textContent = 'รหัสพนักงานต้องเป็นตัวเลข 7 หลัก เริ่มด้วย 7 (เช่น 7512411)';
          employeeCodeInput.classList.add('invalid-input');
          document.getElementById('swal-employee-name-display').textContent = '';
          document.getElementById('swal-team-display').textContent = '';
          isValid = false;
        } else {
          const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === employeeCode);
          if (!employee || !employee.Name) {
            errors.employeeCodeError.textContent = 'ไม่พบรหัสพนักงานนี้ในระบบ';
            employeeCodeInput.classList.add('invalid-input');
            document.getElementById('swal-employee-name-display').textContent = '';
            document.getElementById('swal-team-display').textContent = '';
            isValid = false;
          } else {
            document.getElementById('swal-employee-name-display').textContent = `${employee.Name}`;
            document.getElementById('swal-team-display').textContent = `${employee.หน่วยงาน || ''}`;
            errors.employeeCodeError.textContent = '';
          }
        }
        if (!contactInput.value || !/^(0|\+66)[6-9][0-9]{7,8}$/.test(contactInput.value)) {
          errors.contactError.textContent = 'กรุณากรอกเบอร์ติดต่อที่ถูกต้อง (เช่น 08xxxxxxxx)';
          contactInput.classList.add('invalid-input');
          isValid = false;
        }
        const hasRemark = remarkInput.value.trim().length > 0;
        if (!hasRemark) {
          if (!callNumberInput.value) {
            errors.callNumberError.textContent = 'กรุณากรอกเลขที่ Call';
            callNumberInput.classList.add('invalid-input');
            isValid = false;
          } else if (
            (callNumberInput.value.startsWith('2') && callNumberInput.value.length !== 11) ||
            (!callNumberInput.value.startsWith('2') && callNumberInput.value.length !== 7)
          ) {
            errors.callNumberError.textContent = 'เลขที่ Call ต้องขึ้นต้นด้วย 2 (11 ตัวอักษร) หรือ (7 ตัวอักษร)';
            callNumberInput.classList.add('invalid-input');
            isValid = false;
          }
          if (!selectedCallType) {
            errors.callTypeError.textContent = 'กรุณาเลือก Call Type';
            isValid = false;
          }
        }
        confirmButton.disabled = !isValid;
      }
      quantityInput.addEventListener('input', validateInputs);
      employeeCodeInput.addEventListener('input', validateInputs);
      contactInput.addEventListener('input', validateInputs);
      callNumberInput.addEventListener('input', validateInputs);
      remarkInput.addEventListener('input', validateInputs);
      validateInputs();
      quantityInput.focus();
    },
    didClose: () => {
      document.body.style.overflow = 'auto';
    },
    preConfirm: () => {
      const quantityInput = document.getElementById('swal-quantity');
      const employeeCodeInput = document.getElementById('swal-employee-code');
      const contactInput = document.getElementById('swal-contact');
      const callNumberInput = document.getElementById('swal-call-number');
      const remarkInput = document.getElementById('swal-remark');
      const errors = {
        quantityError: document.getElementById('swal-quantity-error'),
        employeeCodeError: document.getElementById('swal-employee-code-error'),
        contactError: document.getElementById('swal-contact-error'),
        callNumberError: document.getElementById('swal-call-number-error'),
        callTypeError: document.getElementById('swal-call-type-error'),
        remarkError: document.getElementById('swal-remark-error')
      };
      [quantityInput, employeeCodeInput, contactInput, callNumberInput, remarkInput].forEach(input => {
        input.classList.remove('invalid-input');
      });
      Object.values(errors).forEach(el => el.textContent = '');
      let isValid = true;
      if (!quantityInput.value || quantityInput.value < 1) {
        errors.quantityError.textContent = 'กรุณากรอกจำนวนที่มากกว่าหรือเท่ากับ 1';
        quantityInput.classList.add('invalid-input');
        isValid = false;
      }
      const employeeCode = employeeCodeInput.value.trim();
      if (!employeeCode || !/^\d{7}$/.test(employeeCode) || employeeCode[0] !== '7') {
        errors.employeeCodeError.textContent = 'รหัสพนักงานต้องเป็นตัวเลข 7 หลัก เริ่มด้วย 7 (เช่น 7512411)';
        employeeCodeInput.classList.add('invalid-input');
        isValid = false;
      } else {
        const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === employeeCode);
        if (!employee || !employee.Name) {
          errors.employeeCodeError.textContent = 'ไม่พบรหัสพนักงานนี้ในระบบ';
          employeeCodeInput.classList.add('invalid-input');
          isValid = false;
        }
      }
      if (!contactInput.value || !/^(0|\+66)[6-9][0-9]{7,8}$/.test(contactInput.value)) {
        errors.contactError.textContent = 'กรุณากรอกเบอร์ติดต่อที่ถูกต้อง (เช่น 08xxxxxxxx)';
        contactInput.classList.add('invalid-input');
        isValid = false;
      }
      const hasRemark = remarkInput.value.trim().length > 0;
      if (!hasRemark) {
        if (!callNumberInput.value) {
          errors.callNumberError.textContent = 'กรุณากรอกเลขที่ Call';
          callNumberInput.classList.add('invalid-input');
          isValid = false;
        } else if (
          (callNumberInput.value.startsWith('2') && callNumberInput.value.length !== 11) ||
          (!callNumberInput.value.startsWith('2') && callNumberInput.value.length !== 7)
        ) {
          errors.callNumberError.textContent = 'เลขที่ Call ต้องขึ้นต้นด้วย 2 (11 ตัวอักษร) หรือ (7 ตัวอักษร)';
          callNumberInput.classList.add('invalid-input');
          isValid = false;
        }
        if (!selectedCallType) { // ตอนนี้เข้าถึง selectedCallType ได้แล้ว
          errors.callTypeError.textContent = 'กรุณาเลือก Call Type';
          isValid = false;
        }
      }
      if (isValid) {
        const employee = employeeData.find(e => e.IDRec && e.IDRec.toString().trim() === employeeCode);
        saveToLocalStorage('employeeCode', employeeCode);
        saveToLocalStorage('contact', contactInput.value);
        if (callNumberInput.value) {
          saveToLocalStorage('callNumber', callNumberInput.value);
        }
        if (selectedCallType) {
          saveToLocalStorage('callType', selectedCallType);
        }
        console.log('Final Call Type:', selectedCallType); // Debug: ดูว่าส่งไปถูกไหม
        return {
          quantity: quantityInput.value,
          employeeCode: employeeCode,
          employeeName: employee ? employee.Name : '',
          team: employee ? (employee.หน่วยงาน || '') : '',
          contact: contactInput.value,
          callNumber: callNumberInput.value,
          callType: selectedCallType,
          remark: remarkInput.value
        };
      }
      return false;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const formValues = result.value;
      const vibhavadiValue = parseFloat(row["วิภาวดี"]) || 0;
      const quantity = parseFloat(formValues.quantity) || 0;
    
            // Popup สรุปข้อมูลการเบิก – แก้ให้รูปแสดงแน่นอน 100%
      // รูปแสดงแน่นอน 100% (สำหรับกรณี UrlWeb = File ID ล้วน ๆ)
            // แสดงรูปในหน้าต่างสรุป – ใช้ thumbnail?id= แบบเดียวกับที่คุณใช้ใน modal (แสดงได้ 100%)
      let imageHtml = '';
      let imageIds = [];
      if (row.UrlWeb && row.UrlWeb.trim()) {
        // รองรับทุกแบบของ Google Drive link
        const match = row.UrlWeb.match(/\/d\/([a-zA-Z0-9-_]+)/) ||
                      row.UrlWeb.match(/id=([a-zA-Z0-9-_]+)/) ||
                      row.UrlWeb.match(/uc\?id=([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          imageIds = [match[1]];
        }
      }
      if (imageIds.length > 0) {
        const fileId = imageIds[0];
        imageHtml = `
          <img src="https://drive.google.com/thumbnail?id=${fileId}&sz=w500"
               alt="รูปอะไหล่"
               style="width:120px; height:120px; object-fit:cover; border-radius:20px;
                      border:5px solid #1877f2; box-shadow:0 10px 30px rgba(24,118,242,0.5);
                      margin-bottom:18px;"
               onerror="this.style.display='none'; this.nextSibling.style.display='block';">
          <div style="display:none; text-align:center; color:#e74c3c; font-size:14px; margin-top:10px;">โหลดรูปไม่สำเร็จ</div>
        `;
      } else {
        // ถ้าไม่มีรูปเลย → ไอคอนสวย ๆ
        imageHtml = `
          <div style="width:120px; height:120px; background:linear-gradient(135deg,#e3f2fd,#bbdefb);
                      border-radius:20px; display:flex; align-items:center; justify-content:center;
                      margin:0 auto 18px; box-shadow:0 8px 25px rgba(24,118,242,0.3);">
            <i class="fas fa-box-open" style="font-size:50px; color:#1877f2;"></i>
          </div>
        `;
      }
      const summaryResult = await Swal.fire({
        title: '<strong style="font-size:22px; color:#1877f2; font-family:\'Kanit\',sans-serif;">สรุปการขอเบิกอะไหล่</strong>',
        width: window.innerWidth <= 480 ? '95%' : '650px',
        padding: '20px',
        background: document.body.classList.contains('dark-mode') ? '#1e1e1e' : '#ffffff',
        backdrop: 'rgba(0,0,0,0.8)',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        confirmButtonText: '<i class="fas fa-check-circle"></i> ยืนยัน',
        cancelButtonText: '<i class="fas fa-edit"></i> แก้ไข',
        reverseButtons: true,
        buttonsStyling: false,
        html: `
          <div style="text-align:center;">
            ${imageHtml}
          </div>
          <div style="background:${document.body.classList.contains('dark-mode')?'#2d2d2d':'#f8fbff'}; border-radius:18px; padding:20px; margin:10px 0; box-shadow:0 6px 20px rgba(0,0,0,0.12);">
            <table style="width:100%; border-collapse:separate; border-spacing:0 14px; font-size:15.5px; line-height:1.5;">
              <tr><td style="color:#555; font-weight:600; width:40%;">Material</td>
                  <td style="font-weight:bold; text-align:right; color:#1a1a1a;">${row.Material || '-'}</td></tr>
              <tr><td style="color:#555; font-weight:600;">Description</td>
                  <td style="text-align:right;">${row.Description || '-'}</td></tr>
              <tr><td style="color:#555; font-weight:600;">จำนวนขอเบิก</td>
                  <td style="font-weight:bold; color:#e74c3c; font-size:20px; text-align:right;">${formValues.quantity} ชิ้น</td></tr>
              <tr><td style="color:#555; font-weight:600;">คลังวิภาวดีมี</td>
                  <td style="color:#27ae60; font-weight:bold; text-align:right;">${vibhavadiValue.toLocaleString()} ชิ้น</td></tr>
              <tr><td style="color:#555; font-weight:600;">รหัสพนักงาน</td>
                  <td style="text-align:right;">${formValues.employeeCode}</td></tr>
              <tr><td style="color:#555; font-weight:600;">ชื่อช่าง</td>
                  <td style="color:#2980b9; font-weight:bold; text-align:right;">${formValues.employeeName}</td></tr>
              <tr><td style="color:#555; font-weight:600;">ทีม / หน่วยงาน</td>
                  <td style="text-align:right;">${formValues.team || '-'}</td></tr>
              <tr><td style="color:#555; font-weight:600;">เบอร์ติดต่อ</td>
                  <td style="text-align:right;">${formValues.contact}</td></tr>
              <tr><td style="color:#555; font-weight:600;">เลขที่ Call</td>
                  <td style="text-align:right;">${formValues.callNumber || '<span style="color:#999;">ไม่มี</span>'}</td></tr>
              <tr><td style="color:#555; font-weight:600;">Call Type</td>
                  <td style="text-align:right;">
                    ${formValues.callType
                      ? `<span style="background:#667eea;color:white;padding:6px 18px;border-radius:30px;font-weight:bold;font-size:15px;">${formValues.callType}</span>`
                      : '<span style="color:#999;">ไม่มี</span>'}
                  </td></tr>
              ${formValues.remark ?
                `<tr><td style="color:#555; font-weight:600; vertical-align:top; padding-top:10px;">หมายเหตุ</td>
                 <td style="color:#e74c3c; font-weight:bold; text-align:right; padding-top:10px;">${formValues.remark}</td></tr>` : ''}
            </table>
          </div>
          <div style="margin-top:20px; padding:15px; background:#fff3cd; border-left:6px solid #f39c12; border-radius:12px; font-size:14.5px; color:#856404; text-align:center;">
            <i class="fas fa-exclamation-triangle" style="margin-right:8px; font-size:18px;"></i>
            กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนกดยืนยัน
          </div>
        `,
        didOpen: () => {
          const confirmBtn = document.querySelector('.swal2-confirm');
          const cancelBtn = document.querySelector('.swal2-cancel');
          confirmBtn.style.cssText = `
            background: linear-gradient(135deg, #27ae60, #2ecc71) !important;
            color: white !important;
            padding: 14px 34px !important;
            border-radius: 30px !important;
            font-size: 17px !important;
            font-weight: bold !important;
            box-shadow: 0 6px 20px rgba(39,174,96,0.5) !important;
          `;
          cancelBtn.style.cssText = `
            background: linear-gradient(135deg, #95a5a6, #7f8c8d) !important;
            color: white !important;
            padding: 14px 34px !important;
            border-radius: 30px !important;
            font-size: 17px !important;
            font-weight: bold !important;
            box-shadow: 0 6px 20px rgba(127,140,141,0.5) !important;
          `;
        }
      });
      if (summaryResult.isConfirmed) {
        // ปิด modal รายละเอียดทุกรูปแบบที่อาจเปิดค้างอยู่
        const detailModal = document.getElementById('imageModal');
        if (detailModal) detailModal.style.display = 'none';
        const imageModalImages = document.getElementById('imageModalImages');
        if (imageModalImages) imageModalImages.style.display = 'none';
        // สร้าง JSON payload
        const jsonPayload = {
          material: row.Material || '',
          description: row.Description || '',
          quantity: parseInt(formValues.quantity),
          contact: formValues.contact,
          employeeCode: formValues.employeeCode,
          team: formValues.team,
          employeeName: formValues.employeeName,
          callNumber: formValues.callNumber || '',
          callType: formValues.callType || '',
          remark: formValues.remark || '',
          vibhavadi: vibhavadiValue.toString()
        };
        // แสดง loading
        Swal.fire({
          title: 'กำลังบันทึกข้อมูล...',
          html: `
            <div class="swal2-spinner-container">
              <div class="swal2-spinner"></div>
              <p>กรุณารอสักครู่...</p>
            </div>
          `,
          showConfirmButton: false,
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            // Ensure full blur for loading popup
            const swalContainer = document.querySelector('.swal2-container');
            if (swalContainer) {
              swalContainer.style.zIndex = '99998';
              swalContainer.style.position = 'fixed';
              swalContainer.style.top = '0';
              swalContainer.style.left = '0';
              swalContainer.style.width = '100vw';
              swalContainer.style.height = '100vh';
              swalContainer.style.display = 'flex';
              swalContainer.style.justifyContent = 'center';
              swalContainer.style.alignItems = 'center';
            }
            const swalBackdrop = document.querySelector('.swal2-backdrop');
            if (swalBackdrop) {
              swalBackdrop.style.zIndex = '99997';
              swalBackdrop.style.position = 'fixed';
              swalBackdrop.style.top = '0';
              swalBackdrop.style.left = '0';
              swalBackdrop.style.width = '100vw';
              swalBackdrop.style.height = '100vh';
              swalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
              swalBackdrop.style.backdropFilter = 'blur(8px)';
            }
            const swalPopup = document.querySelector('.swal2-popup');
            if (swalPopup) {
              swalPopup.style.zIndex = '99999';
              swalPopup.style.position = 'relative';
              swalPopup.style.margin = '0';
              swalPopup.style.transform = 'none';
              swalPopup.style.maxHeight = '90vh';
              swalPopup.style.overflowY = 'auto';
              swalPopup.style.width = 'auto';
              swalPopup.style.maxWidth = '90vw';
              if (window.innerWidth <= 768) {
                swalPopup.style.width = '95vw';
                swalPopup.style.padding = '15px';
              }
            }
          }
        });
        try {
          const response = await fetch(gasUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `action=insertRequest&payload=${encodeURIComponent(JSON.stringify(jsonPayload))}`
          });
          const gasResult = await response.json();
          if (gasResult.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'ส่งข้อมูลสำเร็จ!',
              text: gasResult.data.message || 'ข้อมูลได้ถูกบันทึกเรียบร้อยแล้ว',
              confirmButtonText: 'OK'
            }).then((result) => {
              if (result.isConfirmed) {
                // ปิด Modal รายละเอียดอะไหล่ (ทั้ง #parts และ #images) ถ้าเปิดอยู่
                const imageModal = document.getElementById('imageModal');
                const imageModalImages = document.getElementById('imageModalImages');
                if (imageModal && imageModal.style.display === 'block') {
                  imageModal.style.display = 'none';
                }
                if (imageModalImages && imageModalImages.style.display === 'block') {
                  imageModalImages.style.display = 'none';
                }
                Swal.fire({
                  title: 'กำลังเปลี่ยนหน้า...',
                  html: `
                    <div class="swal2-spinner-container">
                      <div class="swal2-spinner"></div>
                      <p>กรุณารอสักครู่...</p>
                    </div>
                  `,
                  showConfirmButton: false,
                  allowOutsideClick: false,
                  allowEscapeKey: false,
                  didOpen: () => {
                    // Ensure full blur for redirect popup
                    const swalContainer = document.querySelector('.swal2-container');
                    if (swalContainer) {
                      swalContainer.style.zIndex = '99998';
                      swalContainer.style.position = 'fixed';
                      swalContainer.style.top = '0';
                      swalContainer.style.left = '0';
                      swalContainer.style.width = '100vw';
                      swalContainer.style.height = '100vh';
                      swalContainer.style.display = 'flex';
                      swalContainer.style.justifyContent = 'center';
                      swalContainer.style.alignItems = 'center';
                    }
                    const swalBackdrop = document.querySelector('.swal2-backdrop');
                    if (swalBackdrop) {
                      swalBackdrop.style.zIndex = '99997';
                      swalBackdrop.style.position = 'fixed';
                      swalBackdrop.style.top = '0';
                      swalBackdrop.style.left = '0';
                      swalBackdrop.style.width = '100vw';
                      swalBackdrop.style.height = '100vh';
                      swalBackdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                      swalBackdrop.style.backdropFilter = 'blur(8px)';
                    }
                    const swalPopup = document.querySelector('.swal2-popup');
                    if (swalPopup) {
                      swalPopup.style.zIndex = '99999';
                      swalPopup.style.position = 'relative';
                      swalPopup.style.margin = '0';
                      swalPopup.style.transform = 'none';
                      swalPopup.style.maxHeight = '90vh';
                      swalPopup.style.overflowY = 'auto';
                      swalPopup.style.width = 'auto';
                      swalPopup.style.maxWidth = '90vw';
                      if (window.innerWidth <= 768) {
                        swalPopup.style.width = '95vw';
                        swalPopup.style.padding = '15px';
                      }
                    }
                  }
                });
                setTimeout(() => {
                  Swal.close();
                  showTab('today');
                  // Fix for mobile scroll lock after tab switch
                  setTimeout(() => {
                    document.body.style.overflow = 'auto';
                    const searchInputToday = document.getElementById('searchInputToday');
                    if (searchInputToday) {
                      searchInputToday.focus();
                      searchInputToday.blur(); // Trigger a touch event to unlock scroll on mobile
                    }
                    // Simulate a touch event to unlock scroll
                    if ('ontouchstart' in window) {
                      const event = new Event('touchstart', { bubbles: true });
                      document.body.dispatchEvent(event);
                    }
                  }, 100);
                }, 4000); // เพิ่ม delay จาก 2000 เป็น 4000ms เพื่อให้ข้อมูลใหม่อัปเดตใน Sheet
              }
            });
          } else {
            throw new Error(gasResult.data || 'GAS return error');
          }
        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการส่งข้อมูลไป GAS:', error);
          Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: `ไม่สามารถบันทึกข้อมูลได้: ${error.message}. กรุณาลองใหม่หรือติดต่อ admin.`,
            confirmButtonText: 'ตกลง'
          });
        }
      }
    }
  });
}
      function saveToLocalStorage(key, value) {
        let items = JSON.parse(localStorage.getItem(key)) || [];
        if (!items.includes(value)) {
          items.unshift(value);
          if (items.length > 5) items.pop();
          localStorage.setItem(key, JSON.stringify(items));
        }
      }
      function getFromLocalStorage(key) {
        return JSON.parse(localStorage.getItem(key)) || [];
      }
      function renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        pageNumbers.innerHTML = "";
        if (totalPages === 0) {
          firstPageButton.disabled = true;
          prevPageButton.disabled = true;
          nextPageButton.disabled = true;
          lastPageButton.disabled = true;
          return;
        }
        // แสดงเฉพาะหน้าปัจจุบัน
        const button = document.createElement("button");
        button.textContent = currentPage;
        button.className = "active";
        button.disabled = true; // ไม่ให้คลิกได้เพราะเป็นหน้าปัจจุบัน
        pageNumbers.appendChild(button);
        firstPageButton.disabled = currentPage === 1;
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages;
        lastPageButton.disabled = currentPage === totalPages;
      }
      function changePage(page) {
        currentPage = page;
        renderTableData();
        renderPagination(currentFilteredData.length);
      }
      function renderTableData() {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        renderTable(currentFilteredData.slice(startIndex, endIndex));
      }
      function applyFilters() {
        const keyword1 = searchInput1.value.trim().toLowerCase();
        let filtered1 = allData;
        if (keyword1) {
          // ค้นหาในทุกคอลัมน์สำหรับ Filter 1
          filtered1 = allData.filter((row) => {
            const searchFields = ["Material", "Description", "Product", "OCRTAXT", "หมายเหตุ", "Rebuilt", "วิภาวดี", "Unrestricted"];
            return searchFields.some(field => (row[field] || "").toLowerCase().includes(keyword1));
          });
        }
        tempFilteredData = filtered1;
        const keyword2 = searchInput2.value.trim().toLowerCase();
        let filtered2 = tempFilteredData;
        if (keyword2) {
          // ค้นหาในทุกคอลัมน์สำหรับ Filter 2 (จาก tempFilteredData)
          filtered2 = tempFilteredData.filter((row) => {
            const searchFields = ["Material", "Description", "Product", "OCRTAXT", "หมายเหตุ", "Rebuilt", "วิภาวดี", "Unrestricted"];
            return searchFields.some(field => (row[field] || "").toLowerCase().includes(keyword2));
          });
        }
        currentFilteredData = filtered2;
        currentPage = 1;
        renderTableData();
        renderPagination(currentFilteredData.length);
      }
      searchInput1.addEventListener("input", (e) => {
        globalSearch1 = e.target.value;
        document.getElementById("searchInputImages1").value = globalSearch1;
        applyFilters();
      });
      searchInput2.addEventListener("input", (e) => {
        globalSearch2 = e.target.value;
        document.getElementById("searchInput2").value = globalSearch2;
        applyFilters();
      });
               // ปุ่มแว่นตาใกล้ searchInput2 -> เคลียร์เฉพาะช่องของแท็บอะไหล่
      searchButton.addEventListener("click", () => {
        // เคลียร์ช่องค้นหาแท็บอะไหล่
        searchInput1.value = "";
        searchInput2.value = "";
        // เคลียร์ตัวแปร global ของฝั่งอะไหล่
        globalSearch1 = "";
        globalSearch2 = "";
        // คำนวณใหม่ (จะแสดงข้อมูลทั้งหมดเพราะช่องว่าง)
        triggerFadeAndFilter(tableContainerParts, applyFilters);
      });
      searchInput1.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          applyFilters();
          searchInput1.blur();
        }
      });
      searchInput2.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          applyFilters();
          searchInput2.blur();
        }
      });
      firstPageButton.addEventListener("click", () => {
        currentPage = 1;
        renderTableData();
        renderPagination(currentFilteredData.length);
      });
      prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          renderTableData();
          renderPagination(currentFilteredData.length);
        }
      });
      nextPageButton.addEventListener("click", () => {
        const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
          currentPage++;
          renderTableData();
          renderPagination(currentFilteredData.length);
        }
      });
      lastPageButton.addEventListener("click", () => {
        const totalPages = Math.ceil(currentFilteredData.length / itemsPerPage);
        currentPage = totalPages;
        renderTableData();
        renderPagination(currentFilteredData.length);
      });
      async function loadData() {
        document.getElementById("loading").style.display = "flex";
        errorContainer.style.display = "none";
        console.log("Starting data load from:", url);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120000); // เพิ่ม timeout เป็น 30 วินาที
          const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors', // เพิ่ม mode: 'cors' เพื่อแก้ปัญหา CORS
            cache: 'no-cache' // เพิ่ม cache: 'no-cache' เพื่อให้ข้อมูลสดใหม่
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Data loaded successfully:", data);
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No data received or data is empty");
          }
          allData = data;
          tempFilteredData = [...data];
          currentFilteredData = [...data];
          applyFilters();
          document.getElementById("loading").style.display = "none";
        } catch (error) {
          console.error("Error loading data:", error);
          document.getElementById("loading").style.display = "none";
          errorContainer.style.display = "block";
          if (error.name === 'AbortError') {
            document.getElementById("error-message").textContent = "การโหลดข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่";
          } else if (error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')) {
            document.getElementById("error-message").textContent = "ไม่สามารถเข้าถึงข้อมูลได้ กรุณาตรวจสอบการแชร์ Google Sheets ให้เป็น Public (Anyone with the link can view)";
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            document.getElementById("error-message").textContent = "เกิดปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่";
          } else {
            document.getElementById("error-message").textContent = `ไม่สามารถโหลดข้อมูลได้: ${error.message}. กรุณาตรวจสอบ Sheet ID หรือชื่อ Sheet`;
          }
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถโหลดข้อมูล",
            text: error.name === 'AbortError'
              ? "การเชื่อมต่อช้าเกินไป กรุณาตรวจสอบเครือข่ายหรือลองใหม่"
              : error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')
              ? "Google Sheets ต้องแชร์เป็น Public (ดูได้โดยไม่ต้องล็อกอิน) กรุณาตรวจสอบการแชร์"
              : "ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบ Sheet ID, ชื่อ Sheet หรือการแชร์สาธารณะ",
            confirmButtonText: "ตกลง",
          });
        }
      }
      // Images tab functions (now after variables)
      itemsPerPageSelectImages.addEventListener("change", () => {
        itemsPerPageImages = parseInt(itemsPerPageSelectImages.value, 10);
        currentPageImages = 1;
        renderTableDataImages();
        renderPaginationImages(allDataImages.length);
      });
      retryButtonImages.addEventListener("click", () => {
        errorContainerImages.style.display = "none";
        loadImagesData();
      });
      // Updated render function for gallery
      function renderGalleryDataImages(data) {
        if (!galleryContainer) {
          console.error("Gallery container not found");
          Swal.fire({
            icon: "error",
            title: "ข้อผิดพลาด",
            text: "ไม่พบ container สำหรับแสดง gallery กรุณาตรวจสอบโครงสร้างหน้าเว็บ",
            confirmButtonText: "ตกลง",
          });
          return;
        }
        galleryContainer.innerHTML = "";
        data.forEach((row) => {
          const galleryItem = document.createElement("div");
          galleryItem.className = "gallery-item";
          // Convert values to numbers for comparison
          const vibhavadiValue = parseFloat(row["วิภาวดี"]) || 0;
          const unrestrictedValue = parseFloat(row["Unrestricted"]) || 0;
          // Determine styling based on conditions
          let textColor = "";
          let fontWeight = "";
          if (vibhavadiValue > 0) {
            textColor = "#4caf50"; // Green
            fontWeight = "bold";
          } else if (vibhavadiValue === 0 && unrestrictedValue > 0) {
            textColor = "#2196f3"; // Blue
            fontWeight = "bold";
          }
          const thumbnailSrc = row.id ? `https://drive.google.com/thumbnail?id=${row.id}&sz=w300-h300` : '';
          galleryItem.innerHTML = `
            <img src="${thumbnailSrc}" alt="${row.Description || 'Image'}" class="gallery-thumbnail"
              style="color: ${textColor}; font-weight: ${fontWeight};"
              onclick="showDetailModal(${JSON.stringify(row).replace(/"/g, '&quot;')}, 'imageModalImages', 'imageModalContentImages')" // Use unified function
              onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; this.onclick=null;">
            <div class="gallery-info">
              <div class="gallery-material" style="color: ${textColor}; font-weight: ${fontWeight};">${row.Material || ''}</div>
              <div class="gallery-description">${row.Description || ''}</div>
            </div>
          `;
          galleryContainer.appendChild(galleryItem);
        });
      }
      function renderPaginationImages(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPageImages);
        pageNumbersImages.innerHTML = "";
        if (totalPages === 0) {
          firstPageButtonImages.disabled = true;
          prevPageButtonImages.disabled = true;
          nextPageButtonImages.disabled = true;
          lastPageButtonImages.disabled = true;
          return;
        }
        // แสดงเฉพาะหน้าปัจจุบัน
        const button = document.createElement("button");
        button.textContent = currentPageImages;
        button.className = "active";
        button.disabled = true; // ไม่ให้คลิกได้เพราะเป็นหน้าปัจจุบัน
        pageNumbersImages.appendChild(button);
        firstPageButtonImages.disabled = currentPageImages === 1;
        prevPageButtonImages.disabled = currentPageImages === 1;
        nextPageButtonImages.disabled = currentPageImages === totalPages;
        lastPageButtonImages.disabled = currentPageImages === totalPages;
      }
      function changePageImages(page) {
        currentPageImages = page;
        renderTableDataImages();
        renderPaginationImages(currentFilteredDataImages.length);
      }
      function renderTableDataImages() {
        const startIndex = (currentPageImages - 1) * itemsPerPageImages;
        const endIndex = startIndex + itemsPerPageImages;
        renderGalleryDataImages(currentFilteredDataImages.slice(startIndex, endIndex));
      }
      function applyFiltersImages() {
        const keyword1 = searchInputImages1.value.trim().toLowerCase();
        let filtered1 = allDataImages;
        if (keyword1) {
          // ค้นหาในทุกคอลัมน์สำหรับ Filter 1
          filtered1 = allDataImages.filter((row) => {
            const searchFields = ["Material", "Description", "Product", "OCRTAXT", "หมายเหตุ", "Rebuilt", "วิภาวดี", "Unrestricted"];
            return searchFields.some(field => (row[field] || "").toLowerCase().includes(keyword1));
          });
        }
        tempFilteredDataImages = filtered1;
        const keyword2 = searchInputImages2.value.trim().toLowerCase();
        let filtered2 = tempFilteredDataImages;
        if (keyword2) {
          // ค้นหาในทุกคอลัมน์สำหรับ Filter 2 (จาก tempFilteredDataImages)
          filtered2 = tempFilteredDataImages.filter((row) => {
            const searchFields = ["Material", "Description", "Product", "OCRTAXT", "หมายเหตุ", "Rebuilt", "วิภาวดี", "Unrestricted"];
            return searchFields.some(field => (row[field] || "").toLowerCase().includes(keyword2));
          });
        }
        currentFilteredDataImages = filtered2;
        currentPageImages = 1;
        renderTableDataImages();
        renderPaginationImages(currentFilteredDataImages.length);
      }
      searchInputImages1.addEventListener("input", (e) => {
        globalSearch1 = e.target.value;
        document.getElementById("searchInput1").value = globalSearch1;
        applyFiltersImages();
      });
      searchInputImages2.addEventListener("input", (e) => {
        globalSearch2 = e.target.value;
        document.getElementById("searchInput2").value = globalSearch2;
        applyFiltersImages();
      });
     // ปุ่มแว่นตาใกล้ searchInputImages2 -> เคลียร์ทั้งคู่ + เคลียร์ฝั่งอะไหล่ด้วย ให้ค้นใหม่แบบว่าง
searchButtonImages.addEventListener("click", () => {
  // เคลียร์ช่องค้นหาแท็บรูปภาพ
  searchInputImages1.value = "";
  searchInputImages2.value = "";
  // เคลียร์ค่าที่ sync ไปแท็บอะไหล่ด้วย (ให้สองแท็บตรงกัน)
  searchInput1.value = "";
  searchInput2.value = "";
  // เคลียร์ตัวแปร global
  globalSearch1 = "";
  globalSearch2 = "";
  // เรียก filter อีกรอบ (จะกลายเป็นแสดงข้อมูลทั้งหมด เพราะช่องค้นหาว่าง)
  triggerFadeAndFilter(galleryContainer, applyFiltersImages);
});
      searchInputImages1.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          applyFiltersImages();
          searchInputImages1.blur();
        }
      });
      searchInputImages2.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          applyFiltersImages();
          searchInputImages2.blur();
        }
      });
      firstPageButtonImages.addEventListener("click", () => {
        currentPageImages = 1;
        renderTableDataImages();
        renderPaginationImages(currentFilteredDataImages.length);
      });
      prevPageButtonImages.addEventListener("click", () => {
        if (currentPageImages > 1) {
          currentPageImages--;
          renderTableDataImages();
          renderPaginationImages(currentFilteredDataImages.length);
        }
      });
      nextPageButtonImages.addEventListener("click", () => {
        const totalPages = Math.ceil(currentFilteredDataImages.length / itemsPerPageImages);
        if (currentPageImages < totalPages) {
          currentPageImages++;
          renderTableDataImages();
          renderPaginationImages(currentFilteredDataImages.length);
        }
      });
      lastPageButtonImages.addEventListener("click", () => {
        const totalPages = Math.ceil(currentFilteredDataImages.length / itemsPerPageImages);
        currentPageImages = totalPages;
        renderTableDataImages();
        renderPaginationImages(currentFilteredDataImages.length);
      });
      async function loadImagesData() {
        document.getElementById("loading").style.display = "flex";
        errorContainerImages.style.display = "none";
        console.log("Starting data load for images from:", url);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // เพิ่ม timeout เป็น 30 วินาที
          const response = await fetch(url, {
            signal: controller.signal,
            mode: 'cors', // เพิ่ม mode: 'cors' เพื่อแก้ปัญหา CORS
            cache: 'no-cache' // เพิ่ม cache: 'no-cache' เพื่อให้ข้อมูลสดใหม่
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Images data loaded successfully:", data);
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No data received or data is empty");
          }
          allDataImages = data.filter(row => row.id); // Filter only rows with 'id' data
          tempFilteredDataImages = [...allDataImages];
          currentFilteredDataImages = [...allDataImages];
          applyFiltersImages();
          document.getElementById("loading").style.display = "none";
        } catch (error) {
          console.error("Error loading images data:", error);
          document.getElementById("loading").style.display = "none";
          errorContainerImages.style.display = "block";
          if (error.name === 'AbortError') {
            document.getElementById("error-message-images").textContent = "การโหลดข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่";
          } else if (error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')) {
            document.getElementById("error-message-images").textContent = "ไม่สามารถเข้าถึงข้อมูลได้ กรุณาตรวจสอบการแชร์ Google Sheets ให้เป็น Public (Anyone with the link can view)";
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            document.getElementById("error-message-images").textContent = "เกิดปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่";
          } else {
            document.getElementById("error-message-images").textContent = `ไม่สามารถโหลดข้อมูลได้: ${error.message}. กรุณาตรวจสอบ Sheet ID หรือชื่อ Sheet`;
          }
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถโหลดข้อมูล",
            text: error.name === 'AbortError'
              ? "การเชื่อมต่อช้าเกินไป กรุณาตรวจสอบเครือข่ายหรือลองใหม่"
              : error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')
              ? "Google Sheets ต้องแชร์เป็น Public (ดูได้โดยไม่ต้องล็อกอิน) กรุณาตรวจสอบการแชร์"
              : "ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบ Sheet ID, ชื่อ Sheet หรือการแชร์สาธารณะ",
            confirmButtonText: "ตกลง",
          });
        }
      }
      // โหลดข้อมูลรูปจาก Sheet ใหม่: MainSapimage
// === แทนที่ฟังก์ชัน loadImageDatabase ด้วยเวอร์ชันนี้ ===
async function loadImageDatabase() {
  if (imageDbLoaded) {
    console.log("รูปภาพโหลดแล้ว (ใช้ cache)");
    return;
  }
  const imageSheetID = "1nbhLKxs7NldWo_y0s4qZ8rlpIfyyGkR_Dqq8INmhYlw";
  const imageSheetName = "MainSapimage";
  const imageUrl = `https://opensheet.elk.sh/${imageSheetID}/${imageSheetName}?_=${Date.now()}`;
  try {
    console.log("กำลังดึงรูปจาก MainSapimage...");
    const response = await fetch(imageUrl);
    const data = await response.json();
    imageDatabase = {};
    let count = 0;
    data.forEach(row => {
      const material = (row.Material || "").toString().trim();
     
      // รองรับทุกการสะกดของ idchack
      const fileId = (
        row.idchack ||
        row.Idchack ||
        row.IDchack ||
        row.idChack ||
        row.IdChack ||
        ""
      ).toString().trim();
      if (material && fileId && fileId.length > 20) { // File ID ต้องยาวพอ
        if (!imageDatabase[material]) imageDatabase[material] = [];
        if (!imageDatabase[material].includes(fileId)) {
          imageDatabase[material].push(fileId);
          count++;
        }
      }
    });
    console.log("โหลดรูปภาพสำเร็จ!", Object.keys(imageDatabase).length + " Material มีรูป");
    console.log("ตัวอย่าง Material ที่มีรูป:", Object.keys(imageDatabase).slice(0, 5));
    imageDbLoaded = true;
  } catch (err) {
    console.error("โหลด MainSapimage ไม่ได้:", err);
    imageDbLoaded = false;
  }
}
      // Function to sort data by column (for sortable headers)
      // แก้ไขใน sortByColumn (ในส่วน if (column === 'Timestamp')) เพื่อ parse ถูกต้อง
function sortByColumn(a, b, column, direction) {
  let valueA = a[column] || "";
  let valueB = b[column] || "";
  if (column === 'IDRow' || column === 'Timestamp') {
    // Custom sort for IDRow (descending by default) and Timestamp
    const parseDateOrId = (value) => {
      if (!value) return 0;
      if (column === 'IDRow') {
        return parseInt(value, 10) || 0;
      }
      // For Timestamp (assume input is MM/DD/YYYY HH:MM:SS)
      const [datePart, timePart] = value.split(' ');
      const parts = datePart.split('/'); // ['MM', 'DD', 'YYYY']
      const month = parseInt(parts[0]) - 1; // 0-based
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      if (!timePart) return new Date(year, month, day).getTime();
      const [hour, minute, second] = timePart.split(':').map(Number);
      return new Date(year, month, day, hour || 0, minute || 0, second || 0).getTime();
    };
    const numA = parseDateOrId(valueA);
    const numB = parseDateOrId(valueB);
    return direction === 'asc' ? numA - numB : numB - numA;
  } else {
    // Default string/numeric sort
    if (!isNaN(valueA) && !isNaN(valueB)) {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    }
    valueA = valueA.toString().toLowerCase();
    valueB = valueB.toString().toLowerCase();
    return direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
  }
}
      // Add sort listeners for today tab
      function addSortListenersToday() {
        const sortableHeaders = document.querySelectorAll("#today th.sortable");
        sortableHeaders.forEach(header => {
          header.addEventListener("click", () => {
            const column = header.getAttribute("data-column");
            if (sortConfigToday.column === column) {
              sortConfigToday.direction = sortConfigToday.direction === 'asc' ? 'desc' : 'asc';
            } else {
              sortConfigToday.column = column;
              sortConfigToday.direction = column === 'IDRow' ? 'desc' : 'asc'; // Default descending for IDRow
            }
            updateSortArrowsToday();
            updateTableToday();
          });
        });
      }
      function updateSortArrowsToday() {
        const sortableHeaders = document.querySelectorAll("#today th.sortable");
        sortableHeaders.forEach(header => {
          const arrow = header.querySelector(".today-arrow");
          const column = header.getAttribute("data-column");
          if (column === sortConfigToday.column) {
            arrow.textContent = sortConfigToday.direction === 'asc' ? '↑' : '↓';
          } else {
            arrow.textContent = '';
          }
        });
      }
      // Initial call to add listeners after load
      document.addEventListener('DOMContentLoaded', () => {
        addSortListenersToday();
      });
                // ฟังก์ชัน fade-out ก่อน refresh
      function triggerFadeAndFilter(container, filterFn) {
        if (!container) {
          filterFn();
          return;
        }
        container.classList.add("fade-out");
        setTimeout(() => {
          filterFn();
          container.classList.remove("fade-out");
        }, 200);
      }
     function filterByStatus(data) {
  let filtered = data;
  if (currentFilter === 'pending') {
    filtered = data.filter(row => row["status"] === "รอเบิก");
  } else if (currentFilter === 'history') {
    filtered = data;
  }
  // Apply sort based on config
  if (sortConfigToday.column) {
    filtered.sort((a, b) => sortByColumn(a, b, sortConfigToday.column, sortConfigToday.direction));
  }
  return filtered;
}
     // ฟังก์ชันกรองข้อมูลตามโหมด + คำค้นหา + การเรียงลำดับ
function filterDataToday(data) {
  let filtered = data;
  // 1. กรองตามโหมดปุ่ม (รอเบิก หรือ ทั้งหมด)
  if (showOnlyPending) {
    filtered = data.filter(row =>
      row["status"] && row["status"].trim() === "รอเบิก"
    );
  }
  // ถ้าเป็น false → แสดงทั้งหมด (ไม่กรอง)
  // 2. กรองตามคำค้นหา
  const keyword = searchInputToday.value.trim().toLowerCase();
  if (keyword) {
    filtered = filtered.filter(row => {
      return (
        (row["IDRow"] || "").toString().toLowerCase().includes(keyword) ||
        (row["material"] || "").toString().toLowerCase().includes(keyword) ||
        (row["description"] || "").toString().toLowerCase().includes(keyword) ||
        (row["employeeName"] || "").toString().toLowerCase().includes(keyword) ||
        (row["team"] || "").toString().toLowerCase().includes(keyword) ||
        (row["CallNumber"] || "").toString().toLowerCase().includes(keyword) ||
        (row["CallType"] || "").toString().toLowerCase().includes(keyword)
      );
    });
  }
  // 3. เรียงลำดับตามที่ผู้ใช้กดหัวคอลัมน์
  if (sortConfigToday.column) {
    filtered.sort((a, b) =>
      sortByColumn(a, b, sortConfigToday.column, sortConfigToday.direction)
    );
  }
  return filtered;
}
// อัปเดตตาราง (เรียกใช้ทุกครั้งที่มีการเปลี่ยนแปลง)
function updateTableToday() {
  const filteredData = filterDataToday(allDataToday);
  currentFilteredDataToday = filteredData;
  const startIndex = (currentPageToday - 1) * itemsPerPageToday;
  const endIndex = startIndex + itemsPerPageToday;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  renderTableToday(paginatedData);
  renderPaginationToday(filteredData.length);
}
      function renderTableToday(data) {
        tableBodyToday.innerHTML = "";
        data.forEach((row) => {
          const tr = document.createElement("tr");
          const statusTd = document.createElement("td");
          const status = row["status"] || "";
          statusTd.textContent = status;
          statusTd.className = status === "สั่งเบิกแล้ว" ? "status-green" : "status-red";
          tr.appendChild(statusTd);
          // Add IDRow column
          const idRowTd = document.createElement("td");
          idRowTd.textContent = row["IDRow"] || "";
          tr.appendChild(idRowTd);
          const columns = [
            "Timestamp",
            "material",
            "description",
            "quantity",
            "vibhavadi",
            "employeeName",
            "team",
            "CallNumber",
            "CallType",
            "remark",
          ];
          columns.forEach((col) => {
  const td = document.createElement("td");
  let value = row[col] || "";
  if (col === "Timestamp") {
    value = formatTimestamp(value); // เพิ่มบรรทัดนี้
  }
  if (col === "quantity" || col === "vibhavadi") {
    if (value && !isNaN(value)) {
      value = Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
    } else if (value === "0" || value === 0) {
      value = "";
    }
  }
  if (col === "remark" && value) {
    td.style.color = "#d32f2f";
    td.style.fontWeight = "bold";
  }
            if (col === "material" && (row["remark"] || "").trim() !== "") {
              td.style.color = "#d32f2f";
              td.style.fontWeight = "bold";
            }
            if (col === "description" && (row["remark"] || "").trim() !== "") {
              td.style.color = "#d32f2f";
              td.style.fontWeight = "bold";
            }
            if (col === "Timestamp" && (row["remark"] || "").trim() !== "") {
              td.style.color = "#d32f2f";
              td.style.fontWeight = "bold";
            }
            if (col === "vibhavadi" && value) {
              td.style.color = "#4caf50"; // Green color
              td.style.fontWeight = "bold";
            }
            td.textContent = value;
            tr.appendChild(td);
          });
          const detailTd = document.createElement("td");
          const btn = document.createElement("button");
          btn.textContent = "ดูรายละเอียด";
          btn.className = "detail-button";
          btn.onclick = () => {
            modalContent.innerHTML = ["IDRow", ...columns]
  .map((col) => {
    let label = "";
    switch (col) {
      case "IDRow": label = "🆔 ลำดับ"; break;
      case "Timestamp": label = "📅 วันเวลา"; break;
                  case "material": label = "🔢 Material"; break;
                  case "description": label = "🛠️ Description"; break;
                  case "quantity": label = "🔢 จำนวน"; break;
                  case "employeeName": label = "👷‍♂️ ชื่อช่าง"; break;
                  case "team": label = "🏢 หน่วยงาน"; break;
                  case "CallNumber": label = "📄 Call"; break;
                  case "CallType": label = "🗳️ CallType"; break;
                  case "vibhavadi": label = "📦 คลังวิภาวดี"; break;
                  case "remark": label = "📝 หมายเหตุ"; break;
                  default: label = col;
    }
    let value = row[col] || "";
    if (col === "Timestamp") {
      value = formatTimestamp(value); // เพิ่มบรรทัดนี้
    }
    const valueHtml = col === "remark" && value
      ? `<span class='value' style='color:#d32f2f'>${value}</span>`
      : `<span class='value'>${value}</span>`;
    return `<div><span class='label'>${label}:</span> ${valueHtml}</div>`;
  })
  .join("");
            modal.style.display = "block";
            setTimeout(() => {
              modal.style.opacity = "1";
              modal.style.transform = "scale(1)";
            }, 10);
          };
          detailTd.appendChild(btn);
          tr.appendChild(detailTd);
          tableBodyToday.appendChild(tr);
        });
      }
      function renderPaginationToday(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPageToday);
        pageNumbersToday.innerHTML = "";
        if (totalPages === 0) {
          firstPageButtonToday.disabled = true;
          prevPageButtonToday.disabled = true;
          nextPageButtonToday.disabled = true;
          lastPageButtonToday.disabled = true;
          return;
        }
        // แสดงเฉพาะหน้าปัจจุบัน
        const button = document.createElement("button");
        button.textContent = currentPageToday;
        button.className = "active";
        button.disabled = true; // ไม่ให้คลิกได้เพราะเป็นหน้าปัจจุบัน
        pageNumbersToday.appendChild(button);
        firstPageButtonToday.disabled = currentPageToday === 1;
        prevPageButtonToday.disabled = currentPageToday === 1;
        nextPageButtonToday.disabled = currentPageToday === totalPages;
        lastPageButtonToday.disabled = currentPageToday === totalPages;
      }
      searchInputToday.addEventListener("input", () => {
        currentPageToday = 1; // Reset page on search
        updateTableToday();
        showOnlyPending = true;
toggleAllDataBtn.innerHTML = '<i class="fas fa-clock"></i> <span>รอเบิก</span>';
toggleAllDataBtn.style.background = "linear-gradient(135deg, #e74c3c, #c0392b)";
      });
      async function loadTodayData() {
        document.getElementById("loading").style.display = "flex";
        document.getElementById("loadingToday").style.display = "block";
        errorContainerToday.style.display = "none";
        console.log("Starting data load from Opensheet:", requestSheetUrl);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // เพิ่ม timeout เป็น 30 วินาที
          // เพิ่ม cache busting เพื่อให้ข้อมูลใหม่แสดงทันที
          const cacheBustUrl = `${requestSheetUrl}?_t=${Date.now()}`;
          const response = await fetch(cacheBustUrl, {
            signal: controller.signal,
            mode: 'cors', // เพิ่ม mode: 'cors' เพื่อแก้ปัญหา CORS
            cache: 'no-cache' // เพิ่ม cache: 'no-cache' เพื่อให้ข้อมูลสดใหม่
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Today data loaded successfully:", data);
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No data received or data is empty");
          }
          allDataToday = data;
          currentPageToday = 1; // Reset page on load
          updateTableToday();
          document.getElementById("loading").style.display = "none";
          document.getElementById("loadingToday").style.display = "none";
          document.getElementById("data-table-today").style.display = "table";
          // Fix for mobile scroll after loading
          setTimeout(() => {
            document.body.style.overflow = 'auto';
            if ('ontouchstart' in window) {
              const event = new Event('touchstart', { bubbles: true });
              document.body.dispatchEvent(event);
            }
          }, 100);
        } catch (error) {
          console.error("Error loading today data:", error);
          document.getElementById("loading").style.display = "none";
          document.getElementById("loadingToday").style.display = "none";
          errorContainerToday.style.display = "block";
          if (error.name === 'AbortError') {
            document.getElementById("error-message-today").textContent = "การโหลดข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่";
          } else if (error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')) {
            document.getElementById("error-message-today").textContent = "ไม่สามารถเข้าถึงข้อมูลได้ กรุณาตรวจสอบการแชร์ Google Sheets ให้เป็น Public (Anyone with the link can view)";
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            document.getElementById("error-message-today").textContent = "เกิดปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่";
          } else {
            document.getElementById("error-message-today").textContent = `ไม่สามารถโหลดข้อมูลได้: ${error.message}. กรุณาตรวจสอบ Sheet ID หรือชื่อ Sheet`;
          }
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถโหลดข้อมูล",
            text: error.name === 'AbortError'
              ? "การเชื่อมต่อช้าเกินไป กรุณาตรวจสอบเครือข่ายหรือลองใหม่"
              : error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')
              ? "Google Sheets ต้องแชร์เป็น Public (ดูได้โดยไม่ต้องล็อกอิน) กรุณาตรวจสอบการแชร์"
              : "ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบ Sheet ID, ชื่อ Sheet หรือการแชร์สาธารณะ",
            confirmButtonText: "ตกลง",
          });
        }
      }
      // All tab functions (now after variables)
      closeModalAll.onclick = () => modalAll.style.display = "none";
      window.onclick = event => {
        if (event.target == modalAll) modalAll.style.display = "none";
      };
      itemsPerPageSelectAll.addEventListener("change", (e) => {
        itemsPerPageAll = parseInt(e.target.value);
        currentPageAll = 1;
        renderTableAll(allDataAll);
      });
      function renderTableAll(data) {
        tableBodyAll.innerHTML = '';
        const startIdx = (currentPageAll - 1) * itemsPerPageAll;
        const endIdx = startIdx + itemsPerPageAll;
        const paginatedData = data.slice(startIdx, endIdx);
        paginatedData.forEach((row, i) => {
          const tr = document.createElement("tr");
          tr.style.animationDelay = `${i * 0.05}s`; // Fade-in ทีละแถว
            const status = row["status"] || "";
            const statusTd = document.createElement("td");
            statusTd.textContent = status;
            statusTd.className = status === "สั่งเบิกแล้ว" ? "status-green" : "status-red";
            tr.appendChild(statusTd);
            const columns = ["timestamp", "material", "description", "quantity", "employeeName", "team","callNumber","callType", "remark"];
            columns.forEach(col => {
              const td = document.createElement("td");
              td.textContent = row[col] || "";
              tr.appendChild(td);
            });
            const detailTd = document.createElement("td");
            const btn = document.createElement("button");
            btn.textContent = "ดูรายละเอียด";
            btn.className = "detail-button";
            btn.onclick = () => {
              modalContentAll.innerHTML = columns.map(col => {
                const label = col === "timestamp" ? "วันเวลา" : col;
                return `<div><span class='label'>${label}:</span> <span class='value'>${row[col] || ''}</span></div>`;
              }).join('');
              modalAll.style.display = "block";
            };
            detailTd.appendChild(btn);
            tr.appendChild(detailTd);
            tableBodyAll.appendChild(tr);
        });
        updatePaginationAll(data);
      }
      function updatePaginationAll(data) {
        const totalPages = Math.ceil(data.length / itemsPerPageAll);
        pageNumbersContainerAll.innerHTML = '';
        if (totalPages === 0) {
          firstPageButtonAll.disabled = true;
          prevPageButtonAll.disabled = true;
          nextPageButtonAll.disabled = true;
          lastPageButtonAll.disabled = true;
          return;
        }
        // แสดงเฉพาะหน้าปัจจุบัน
        const pageNumberButton = document.createElement("button");
        pageNumberButton.className = `all-page-number active`;
        pageNumberButton.textContent = currentPageAll;
        pageNumberButton.disabled = true; // ไม่ให้คลิกได้เพราะเป็นหน้าปัจจุบัน
        pageNumbersContainerAll.appendChild(pageNumberButton);
        firstPageButtonAll.disabled = currentPageAll === 1;
        prevPageButtonAll.disabled = currentPageAll === 1;
        nextPageButtonAll.disabled = currentPageAll === totalPages;
        lastPageButtonAll.disabled = currentPageAll === totalPages;
      }
      // ปุ่มเลื่อนไปหน้าแรก
      firstPageButtonAll.onclick = () => {
        currentPageAll = 1;
        renderTableAll(allDataAll);
      };
      // ปุ่มย้อนกลับ
      prevPageButtonAll.onclick = () => {
        if (currentPageAll > 1) {
          currentPageAll--;
          renderTableAll(allDataAll);
        }
      };
      // ปุ่มไปหน้า next
      nextPageButtonAll.onclick = () => {
        const totalPages = Math.ceil(allDataAll.length / itemsPerPageAll);
        if (currentPageAll < totalPages) {
          currentPageAll++;
          renderTableAll(allDataAll);
        }
      };
      // ปุ่มไปหน้าสุดท้าย
      lastPageButtonAll.onclick = () => {
        currentPageAll = Math.ceil(allDataAll.length / itemsPerPageAll);
        renderTableAll(allDataAll);
      };
      searchInputAll.addEventListener("input", e => {
        const keyword = e.target.value.toLowerCase();
        const filtered = allDataAll.filter(row => {
          return (
            (row["material"] || "").toLowerCase().includes(keyword) ||
            (row["description"] || "").toLowerCase().includes(keyword) ||
            (row["employeeName"] || "").toLowerCase().includes(keyword) ||
            (row["team"] || "").toLowerCase().includes(keyword) ||
            (row["remark"] || "").toLowerCase().includes(keyword)
          );
        });
        renderTableAll(filtered);
      });
      async function loadAllData() {
        try {
          const response = await fetch(`${gasUrl}?action=getRequests`);
          const res = await response.json();
          if (res.status === 'success') {
            allDataAll = res.data;
            renderTableAll(allDataAll);
          } else {
            throw new Error(res.data || 'GAS error');
          }
        } catch (error) {
          console.error("ไม่สามารถโหลดข้อมูลได้:", error);
          tableBodyAll.innerHTML = '<tr><td colspan="11">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
        }
      }
      // Pending-calls tab functions (now after variables)
      closeModalPending.onclick = () => modalPending.style.display = "none";
      window.onclick = event => {
        if (event.target == modalPending) modalPending.style.display = "none";
      };
      itemsPerPageSelectPending.addEventListener("change", (e) => {
        itemsPerPagePending = parseInt(e.target.value);
        currentPagePending = 1; // รีเซ็ตหน้าเมื่อเปลี่ยนจำนวนรายการต่อหน้า
        filterAndRenderTablePending();
      });
      searchInputPending.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          currentPagePending = 1; // รีเซ็ตหน้าเมื่อค้นหาใหม่
          filterAndRenderTablePending();
        }
      });
      searchButtonPending.addEventListener("click", () => {
        currentPagePending = 1; // รีเซ็ตหน้าเมื่อค้นหาใหม่
        filterAndRenderTablePending();
      });
      function populateTeamFilterPending(data) {
        const filteredData = data.filter(row => {
          const vipa = Number(row["Vipa"] || 0);
          const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
          return vipa > 0 &&
                 !pendingDept.includes("stock วิภาวดี 62") &&
                 !pendingDept.includes("nec_ยกเลิกผลิต");
        });
        const teams = [...new Set(filteredData.map(row => row["Team"]).filter(team => team && team.trim() !== ""))].sort();
        teamFilterPending.innerHTML = '<option value="">ทั้งหมด</option>';
        if (teams.length === 0) {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "ไม่มีทีมที่ตรงตามเงื่อนไข";
          option.disabled = true;
          teamFilterPending.appendChild(option);
        } else {
          teams.forEach(team => {
            const option = document.createElement("option");
            option.value = team;
            option.textContent = team;
            teamFilterPending.appendChild(option);
          });
        }
      }
      function addSortListenersPending() {
        const sortableHeaders = document.querySelectorAll("#pending-calls th.sortable");
        sortableHeaders.forEach(header => {
          header.addEventListener("click", () => {
            const column = header.getAttribute("data-column");
            if (sortConfigPending.column === column) {
              sortConfigPending.direction = sortConfigPending.direction === 'asc' ? 'desc' : 'asc';
            } else {
              sortConfigPending.column = column;
              sortConfigPending.direction = 'asc';
            }
            updateSortArrowsPending();
            filterAndRenderTablePending();
          });
        });
      }
      function updateSortArrowsPending() {
        const sortableHeaders = document.querySelectorAll("#pending-calls th.sortable");
        sortableHeaders.forEach(header => {
          const arrow = header.querySelector(".pending-arrow");
          const column = header.getAttribute("data-column");
          if (column === sortConfigPending.column) {
            arrow.textContent = sortConfigPending.direction === 'asc' ? '↑' : '↓';
          } else {
            arrow.textContent = '';
          }
        });
      }
      function filterAndRenderTablePending() {
        const selectedTeam = teamFilterPending.value;
        const keyword = searchInputPending.value.toLowerCase().trim();
        let filteredData = allDataPending.filter(row => {
          const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
          return Number(row["Vipa"] || 0) > 0 &&
                 !pendingDept.includes("stock วิภาวดี 62") &&
                 !pendingDept.includes("nec_ยกเลิกผลิต") &&
                 (!selectedTeam || row["Team"] === selectedTeam) &&
                 (!keyword ||
                  (row["DateTime"] || "").toLowerCase().includes(keyword) ||
                  (row["Ticket Number"] || "").toLowerCase().includes(keyword) ||
                  (row["Team"] || "").toLowerCase().includes(keyword) ||
                  (row["Brand"] || "").toLowerCase().includes(keyword) ||
                  (row["ค้างหน่วยงาน"] || "").toLowerCase().includes(keyword) ||
                  (row["Material"] || "").toLowerCase().includes(keyword) ||
                  (row["Description"] || "").toLowerCase().includes(keyword) ||
                  (row["Vipa"] || "").toLowerCase().includes(keyword) ||
                  (row["DayRepair"] || "").toLowerCase().includes(keyword)
                 );
        });
        if (sortConfigPending.column) {
          filteredData.sort((a, b) => {
            let valueA = a[sortConfigPending.column] || "";
            let valueB = b[sortConfigPending.column] || "";
            if (sortConfigPending.column === 'DayRepair' || sortConfigPending.column === 'Vipa') {
              valueA = Number(valueA) || 0;
              valueB = Number(valueB) || 0;
              return sortConfigPending.direction === 'asc' ? valueA - valueB : valueB - valueA;
            } else {
              valueA = valueA.toString().toLowerCase();
              valueB = valueB.toString().toLowerCase();
              return sortConfigPending.direction === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            }
          });
        }
        // ตรวจสอบว่า currentPage อยู่ในช่วงที่ถูกต้อง
        const totalPages = Math.ceil(filteredData.length / itemsPerPagePending);
        if (currentPagePending > totalPages) {
          currentPagePending = totalPages || 1;
        }
        renderTablePending(filteredData);
        updateCallCountPending(filteredData);
      }
      teamFilterPending.addEventListener("change", () => {
        currentPagePending = 1; // รีเซ็ตหน้าเมื่อเปลี่ยนทีม
        filterAndRenderTablePending();
      });
      function updateCallCountPending(data) {
        const uniqueTickets = [...new Set(data.map(row => row["Ticket Number"]))];
        const count = uniqueTickets.length;
        const callCountValue = document.getElementById("callCountValuePending");
        callCountValue.textContent = count;
      }
      function formatDateTimePending(dateTime) {
        if (!dateTime) return "";
        const datePart = dateTime.split(" ")[0];
        return datePart;
      }
      function renderTablePending(data) {
        tableBodyPending.innerHTML = '';
        const startIdx = (currentPagePending - 1) * itemsPerPagePending;
        const endIdx = startIdx + itemsPerPagePending;
        const paginatedData = data.slice(startIdx, endIdx);
        if (paginatedData.length === 0) {
          tableBodyPending.innerHTML = '<tr><td colspan="10" class="pending-text-center">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>';
          updatePaginationPending(data);
          return;
        }
        const ticketGroups = {};
        data.forEach(row => {
          const ticket = row["Ticket Number"];
          if (!ticketGroups[ticket]) {
            ticketGroups[ticket] = [];
          }
          ticketGroups[ticket].push(row);
        });
        const uniqueTickets = Object.keys(ticketGroups).sort();
        const colorMap = {};
        uniqueTickets.forEach((ticket, index) => {
          if (ticket === "24103102058") {
            colorMap[ticket] = "pending-yellow-light";
          } else if (ticket === "25011101274") {
            colorMap[ticket] = "pending-pink-pastel";
          } else {
            colorMap[ticket] = index % 2 === 0 ? "pending-yellow-light" : "pending-pink-pastel";
          }
        });
        paginatedData.forEach((row, i) => {
          const tr = document.createElement("tr");
          tr.style.animationDelay = `${i * 0.05}s`;
          const ticket = row["Ticket Number"];
          tr.className = colorMap[ticket];
          const columns = ["DateTime", "Ticket Number", "Team", "Brand", "ค้างหน่วยงาน", "Material", "Description", "Vipa", "DayRepair"];
          columns.forEach(col => {
            const td = document.createElement("td");
            let cellValue = row[col] || "";
            if (col === "DateTime") {
              cellValue = formatDateTimePending(cellValue);
            } else if (col === "DayRepair" || col === "Vipa") {
              const numValue = Number(cellValue);
              cellValue = isNaN(numValue) ? "" : numValue.toString();
            }
            td.textContent = cellValue;
            if (col === "Description") {
              td.classList.add("pending-text-left");
            } else if (col === "Vipa" || col === "DayRepair") {
              td.classList.add("pending-text-center");
            }
            if ((col === "Material" || col === "Description") && row["Description"] === "Code ผิด") {
              td.className = "pending-highlight-red";
            }
            tr.appendChild(td);
          });
          const detailTd = document.createElement("td");
          const btn = document.createElement("button");
          btn.textContent = "ดูรายละเอียด";
          btn.className = "pending-detail-button";
          btn.onclick = () => {
            modalContentPending.innerHTML = columns.map(col => {
              let value = row[col] || "";
              if (col === "DateTime") {
                value = formatDateTimePending(value);
              } else if (col === "DayRepair" || col === "Vipa") {
                const numValue = Number(value);
                value = isNaN(numValue) ? "" : numValue.toString();
              }
              let valueClass = (col === "Material" || col === "Description") && row["Description"] === "Code ผิด" ? "pending-highlight-red" : "value";
              return `<div><span class='label'>${col}:</span> <span class='${valueClass}'>${value}</span></div>`;
            }).join('');
            modalPending.style.display = "block";
          };
          detailTd.appendChild(btn);
          tr.appendChild(detailTd);
          tableBodyPending.appendChild(tr);
        });
        updatePaginationPending(data);
      }
      function updatePaginationPending(data) {
        const totalPages = Math.ceil(data.length / itemsPerPagePending);
        pageNumbersContainerPending.innerHTML = '';
        if (totalPages === 0) {
          firstPageButtonPending.disabled = true;
          prevPageButtonPending.disabled = true;
          nextPageButtonPending.disabled = true;
          lastPageButtonPending.disabled = true;
          return;
        }
        // แสดงเฉพาะหน้าปัจจุบัน
        const pageNumberButton = document.createElement("button");
        pageNumberButton.className = `pending-page-number active`;
        pageNumberButton.textContent = currentPagePending;
        pageNumberButton.disabled = true; // ไม่ให้คลิกได้เพราะเป็นหน้าปัจจุบัน
        pageNumbersContainerPending.appendChild(pageNumberButton);
        firstPageButtonPending.disabled = currentPagePending === 1;
        prevPageButtonPending.disabled = currentPagePending === 1;
        nextPageButtonPending.disabled = currentPagePending === totalPages;
        lastPageButtonPending.disabled = currentPagePending === totalPages;
      }
      firstPageButtonPending.onclick = () => {
        currentPagePending = 1;
        filterAndRenderTablePending();
      };
      prevPageButtonPending.onclick = () => {
        if (currentPagePending > 1) {
          currentPagePending--;
          filterAndRenderTablePending();
        }
      };
      nextPageButtonPending.onclick = () => {
        const totalPages = Math.ceil(allDataPending.filter(row => {
          const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
          return Number(row["Vipa"] || 0) > 0 &&
                 !pendingDept.includes("stock วิภาวดี 62") &&
                 !pendingDept.includes("nec_ยกเลิกผลิต");
        }).length / itemsPerPagePending);
        if (currentPagePending < totalPages) {
          currentPagePending++;
          filterAndRenderTablePending();
        }
      };
      lastPageButtonPending.onclick = () => {
        currentPagePending = Math.ceil(allDataPending.filter(row => {
          const pendingDept = (row["ค้างหน่วยงาน"] || "").toLowerCase();
          return Number(row["Vipa"] || 0) > 0 &&
                 !pendingDept.includes("stock วิภาวดี 62") &&
                 !pendingDept.includes("nec_ยกเลิกผลิต");
        }).length / itemsPerPagePending);
        filterAndRenderTablePending();
      };
      async function loadPendingCallsData() {
        console.log("Starting data load for pending calls from:", urlPending);
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // เพิ่ม timeout เป็น 30 วินาที
          const response = await fetch(urlPending, {
            signal: controller.signal,
            mode: 'cors', // เพิ่ม mode: 'cors' เพื่อแก้ปัญหา CORS
            cache: 'no-cache' // เพิ่ม cache: 'no-cache' เพื่อให้ข้อมูลสดใหม่
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log("Pending calls data loaded successfully:", data);
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No data received or data is empty");
          }
          allDataPending = data;
          populateTeamFilterPending(allDataPending);
          addSortListenersPending();
          filterAndRenderTablePending();
        } catch (error) {
          console.error("Error loading pending calls data:", error);
          if (error.name === 'AbortError') {
            tableBodyPending.innerHTML = '<tr><td colspan="10" class="pending-text-center">การโหลดข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือลองใหม่</td></tr>';
          } else if (error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')) {
            tableBodyPending.innerHTML = '<tr><td colspan="10" class="pending-text-center">ไม่สามารถเข้าถึงข้อมูลได้ กรุณาตรวจสอบการแชร์ Google Sheets ให้เป็น Public (Anyone with the link can view)</td></tr>';
          } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            tableBodyPending.innerHTML = '<tr><td colspan="10" class="pending-text-center">เกิดปัญหาการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ตและลองใหม่</td></tr>';
          } else {
            tableBodyPending.innerHTML = `<tr><td colspan="10" class="pending-text-center">เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</td></tr>`;
          }
          Swal.fire({
            icon: "error",
            title: "ไม่สามารถโหลดข้อมูล",
            text: error.name === 'AbortError'
              ? "การเชื่อมต่อช้าเกินไป กรุณาตรวจสอบเครือข่ายหรือลองใหม่"
              : error.message.includes('HTTP error! status: 403') || error.message.includes('CORS')
              ? "Google Sheets ต้องแชร์เป็น Public (ดูได้โดยไม่ต้องล็อกอิน) กรุณาตรวจสอบการแชร์"
              : "ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบ Sheet ID, ชื่อ Sheet หรือการแชร์สาธารณะ",
            confirmButtonText: "ตกลง",
          });
        }
      }
      // Add sort listeners for pending calls
      document.addEventListener('DOMContentLoaded', () => {
        addSortListenersPending();
      });
      // Initial calls (now safe after all variables defined)
      loadTheme();
      checkLoginStatus();
      // Auto-load default data if logged in
      if (appContent.classList.contains('logged-in')) {
        loadData();
      }
     // เพิ่มฟังก์ชัน formatTimestamp หลังจากตัวแปร global (เช่น หลัง let sortConfigToday = { ... };)
function formatTimestamp(dateTimeStr) {
  if (!dateTimeStr) return "";
  const [datePart, timePart] = dateTimeStr.split(' ');
  const [month, day, year] = datePart.split('/').map(Number);
  const yearBE = year + 543;
  const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${yearBE}`;
  const formattedTime = timePart || '';
  return `${formattedDate} ${formattedTime}`;
}
      // Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
 // ดึงประกาศล่าสุด ๆ มาแสดงใน Deck
async function openAnnouncementDeck() {
  Swal.fire({
    title: 'กำลังโหลดประกาศ...',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });
  try {
    const res = await fetch(`https://opensheet.elk.sh/1aeGgka5ZQs3SLASOs6mOZdPJ2XotxxMbeb1-qotDZ2o/information?_=${Date.now()}`);
    const data = await res.json();
    if (!data || data.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'ยังไม่มีประกาศ',
        text: 'คลังวิภาวดี 62 ยังไม่ได้ส่งประกาศล่าสุด',
        confirmButtonText: 'ปิด',
        width: '380px'
      });
      return;
    }
    // เรียงจากใหม่สุด → เก่าสุด (ล่าสุดอยู่บนสุด)
    const sorted = data
      .filter(r => r.message && r.message.trim())
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')) : new Date(0);
        const dateB = b.updatedAt ? new Date(b.updatedAt.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')) : new Date(0);
        return dateB - dateA; // ใหม่สุดขึ้นก่อน
      });
    let html = '<div style="max-height:70vh;overflow-y:auto;padding:4px;">';
    sorted.forEach((item, idx) => {
      const subject = (item.subject || "ประกาศ").trim();
      const message = (item.message || "").trim().replace(/\n/g, '<br>');
      const rawDate = item.updatedAt || "";
      const by = item.updatedBy || "Admin";
      // แปลงวันที่ให้สวย: 01/04/2568 → 1 เม.ย. 2568
      let niceDate = "ไม่ระบุวันที่";
      if (rawDate) {
        const [d, m, y] = rawDate.split('/');
        const months = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        niceDate = `${parseInt(d)} ${months[parseInt(m)]} ${parseInt(y)}`;
      }
      const isNew = idx === 0 && rawDate && (new Date() - new Date(rawDate.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2'))) / 86400000 <= 2;
      html += `
        <div style="background:#fff;border-radius:16px;margin:12px 0;overflow:hidden;
                    box-shadow:0 6px 20px rgba(0,0,0,0.1);border-left:6px solid ${isNew?'#e74c3c':'#3498db'};cursor:pointer;
                    transition:transform 0.2s;"
             onclick="this.querySelector('.ann-body').style.display=this.querySelector('.ann-body').style.display==='block'?'none':'block';">
         
          <div style="padding:16px;background:${isNew?'linear-gradient(135deg,#e74c3c,#c0392b)':'linear-gradient(135deg,#3498db,#2980b9)'};
                      color:white;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:16px;max-width:75%;">${subject}</span>
            ${isNew ? '<span style="background:#fff;color:#e74c3c;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold;">ใหม่</span>' : ''}
          </div>
         
          <div style="padding:0 16px 16px;font-size:15px;color:#2c3e50;line-height:1.8;">
            <div style="color:#7f8c8d;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
              <i class="fas fa-calendar-day" style="color:#e74c3c;"></i> ${niceDate}
              ${by !== "Admin" ? ` • โดย ${by}` : ''}
            </div>
            <div class="ann-body" style="display:none;margin-top:12px;padding-top:12px;border-top:1px dashed #ddd;">
              ${message}
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
    Swal.fire({
      title: '<div style="font-size:21px;color:#e74c3c;"><i class="fas fa-bullhorn"></i> ประกาศจากคลังวิภาวดี 62</div>',
      html: html,
      width: '440px',
      showConfirmButton: false,
      allowOutsideClick: true,
      customClass: { popup: 'animated fadeInDown faster' },
      didOpen: () => {
        // แสดงจุดแดงที่กระดิ่งถ้ามีประกาศใหม่
        const badge = document.getElementById('notificationBadge');
        if (sorted.length > 0 && badge) {
          const latestDate = new Date(sorted[0].updatedAt?.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2'));
          if ((new Date() - latestDate) / 86400000 <= 2) {
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }
      }
    });
  } catch (err) {
    console.error("โหลดประกาศล้มเหลว:", err);
    Swal.fire({
      icon: 'error',
      title: 'โหลดประกาศไม่สำเร็จ',
      text: 'กรุณาลองใหม่ในภายหลัง',
      width: '380px'
    });
  }
}
// ===== PWA ติดตั้ง – เวอร์ชันแก้หายขาด 100% (2025) =====
let deferredPrompt = null;
// ฟังก์ชันเช็ค + ลบปุ่มทิ้งถาวร
function permanentlyHideInstallButton() {
  const btn = document.getElementById('install-btn');
  if (btn) {
    btn.remove(); // ลบออกจาก DOM เลย
    console.log('ปุ่มติดตั้งถูกลบถาวร');
  }
}
// 1. เช็คทันทีตอนโหลดหน้า
if (localStorage.getItem('partgo-installed') === 'true') {
  permanentlyHideInstallButton();
}
// 2. ดัก beforeinstallprompt – ป้องกันไม่ให้โผล่ถ้าติดตั้งแล้ว
window.addEventListener('beforeinstallprompt', (e) => {
  // ถ้าเคยติดตั้งแล้ว → บล็อกเหตุการณ์นี้ทันที
  if (localStorage.getItem('partgo-installed') === 'true') {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  deferredPrompt = e;
  // แสดงปุ่ม (เฉพาะครั้งแรก)
  const btn = document.getElementById('install-btn');
  if (btn) {
    btn.style.display = 'flex';
  }
});
// 3. เมื่อผู้ใช้กดปุ่มติดตั้ง
document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    localStorage.setItem('partgo-installed', 'true');
    permanentlyHideInstallButton();
    Swal.fire({
      icon: 'success',
      title: 'ติดตั้งสำเร็จ!',
      text: 'PartsGo ถูกเพิ่มในหน้าจอหลักแล้ว',
      timer: 3000,
      showConfirmButton: false
    });
  }
  deferredPrompt = null;
});
// 4. ดักเหตุการณ์เมื่อติดตั้งจริง ๆ (Chrome ยิง event นี้)
window.addEventListener('appinstalled', () => {
  localStorage.setItem('partgo-installed', 'true');
  permanentlyHideInstallButton();
  console.log('PWA ติดตั้งสำเร็จโดยสมบูรณ์');
});
// 5. ป้องกันกรณีรีเฟรชเร็ว / เปิดแท็บใหม่
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('partgo-installed') === 'true') {
    permanentlyHideInstallButton();
  }
});
// สำรองเผื่อ Chrome โหลดช้า
setTimeout(() => {
  if (localStorage.getItem('partgo-installed') === 'true') {
    permanentlyHideInstallButton();
  }
}, 500);
  // ฟังก์ชันเปิดหน้าต่างแก้ไขประกาศ (เฉพาะ 7512411)
function openAnnouncementEditor() {
  Swal.fire({
    title: '<i class="fas fa-bullhorn"></i> ตั้งค่าประกาศถึงพนักงาน',
    html: `
      <!-- ช่องกรอกหัวเรื่อง -->
      <div style="text-align:left; margin-bottom:8px;">
        <label style="font-weight:bold; color:#333; font-size:16px;">
          <i class="fas fa-tag"></i> หัวเรื่องประกาศ <span style="color:red;">*</span>
        </label>
      </div>
      <input
        id="announcementSubject"
        class="swal2-input"
        placeholder="เช่น: ตัดรอบเบิก 14:50 น., ระบบปิดปรับปรุง, หยุดทำการพรุ่งนี้"
        maxlength="120"
        style="font-size:16px; padding:12px;"
      >
      <!-- ช่องกรอกข้อความ -->
      <div style="text-align:left; margin:16px 0 8px;">
        <label style="font-weight:bold; color:#333; font-size:16px;">
          <i class="fas fa-align-left"></i> ข้อความประกาศ <span style="color:red;">*</span>
        </label>
      </div>
      <textarea
        id="announcementText"
        class="swal2-textarea"
        rows="6"
        placeholder="พิมพ์รายละเอียดประกาศที่นี่...&#10;(กด Enter เพื่อขึ้นบรรทัดใหม่)"
        style="font-size:16px; resize:vertical; min-height:160px;"
      ></textarea>
      <!-- ข้อความแจ้ง -->
      <div style="margin-top:16px; padding:14px; background:#e3f2fd; border-radius:12px; font-size:14px; color:#1565c0; text-align:center;">
        <i class="fas fa-info-circle"></i>
        ประกาศจะแสดงให้ทุกคนเห็นทันทีที่เปิดแอป และซ่อนอัตโนมัติหลัง 2 วัน
      </div>
    `,
    width: '700px',
    padding: '20px',
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-paper-plane"></i> บันทึกประกาศ',
    cancelButtonText: 'ยกเลิก',
    allowOutsideClick: false,
    allowEscapeKey: false,
    focusConfirm: false,
    customClass: {
      confirmButton: 'swal2-confirm-btn'
    },
    preConfirm: () => {
      const subject = document.getElementById('announcementSubject').value.trim();
      const message = document.getElementById('announcementText').value.trim();
      if (!subject) {
        Swal.showValidationMessage('<i class="fas fa-exclamation-triangle"></i> กรุณากรอกหัวเรื่องประกาศ');
        return false;
      }
      if (!message) {
        Swal.showValidationMessage('<i class="fas fa-exclamation-triangle"></i> กรุณากรอกข้อความประกาศ');
        return false;
      }
      return { subject, message };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const { subject, message } = result.value;
      // แสดง Loading
      Swal.fire({
        title: 'กำลังบันทึกประกาศ...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      // ส่งไป GAS (เปลี่ยน URL เป็นของคุณ)
      fetch('https://script.google.com/macros/s/AKfycbxnMuSOihH3dotoqP7w5ty6bghdbPEkJYbbUDNTSSfkLthY-YChHHD7_QW5-W-BA46K/exec', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'action': 'updateAnnouncement',
          'subject': subject,
          'message': message
        })
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'บันทึกประกาศสำเร็จ!',
          html: `
            <div style="text-align:center;">
              <h3 style="color:#27ae60; margin:10px 0;">${subject}</h3>
              <p style="font-size:17px; color:#333;">ทุกคนจะเห็นประกาศนี้ทันทีที่เปิดแอป</p>
            </div>
          `,
          confirmButtonText: 'เสร็จสิ้น',
          timer: 4000,
          timerProgressBar: true
        });
      })
      .catch(err => {
        console.error('บันทึกประกาศล้มเหลว:', err);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถบันทึกได้ กรุณาลองใหม่',
          confirmButtonText: 'ตกลง'
        });
      });
    }
  });
}
 // ลบปุ่มออกจาก DOM ถาวรทันทีที่ติดตั้ง
window.addEventListener('appinstalled', () => {
  localStorage.setItem('partgo-installed', 'true');
  const btn = document.getElementById('install-btn');
  if (btn) {
    btn.remove(); // ลบออกเลย ไม่มีทางกลับมา
  }
  deferredPrompt = null;
});
// ป้องกันรีเฟรชแล้วปุ่มกลับมา
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('partgo-installed') === 'true') {
    const btn = document.getElementById('install-btn');
    if (btn) btn.remove();
  }
});
