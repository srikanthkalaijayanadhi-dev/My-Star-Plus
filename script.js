const STORAGE_KEY = 'starplus_vanilla_uploads';

// Base content array matching user specifications
const defaultContentData = [
  {
    id: "m1",
    title: "Cosmic Odyssey",
    thumbnail: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=800&q=80",
    banner: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=2000&q=80",
    category: "latest",
    videoLink: "https://youtube.com",
    isLatest: true,
    views: 1250340,
    uploadDate: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: "m2",
    title: "Neon City Breakout",
    thumbnail: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=800&q=80",
    banner: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=2000&q=80",
    category: "latest",
    videoLink: "https://youtube.com",
    isLatest: true,
    views: 890500,
    uploadDate: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "m3",
    title: "Mountain Peak",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    banner: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
    category: "trending",
    videoLink: "https://youtube.com",
    isLatest: false,
    views: 2450000,
    uploadDate: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    id: "m4",
    title: "Desert Rose",
    thumbnail: "https://images.unsplash.com/photo-1461301214746-1e109215d6d3?auto=format&fit=crop&w=800&q=80",
    category: "trending",
    videoLink: "https://youtube.com",
    isLatest: false,
    views: 560230,
    uploadDate: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: "m5",
    title: "Ocean Deep",
    thumbnail: "https://images.unsplash.com/photo-1551244072-5d12891738f7?auto=format&fit=crop&w=800&q=80",
    category: "latest",
    videoLink: "https://youtube.com",
    isLatest: false,
    views: 12050,
    uploadDate: new Date(Date.now() - 86400000 * 20).toISOString()
  }
];

// Helper: Get merged data
function getAllContentData() {
  const uploads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  return [...uploads, ...defaultContentData];
}

// Helper: Format ISO Date into "Monday, April 3" style
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

/* =========================================
   Frontend Logic (index.html)
========================================= */

// --- Variables for auto-slider ---
let currentSlideIndex = 0;
let sliderInterval;
const SLIDE_DURATION = 4000;
let heroSlidesData = [];

// Initialize Index page
function initFrontend() {
  const allData = getAllContentData();
  
  // 1. Setup Hero Banner Slider
  heroSlidesData = allData.filter(item => item.isLatest === true);
  if(heroSlidesData.length > 0 && document.getElementById('hero-slider')) {
    buildHeroSlider();
  }

  // 2. Setup Rows (Latest Uploads & Trending)
  if(document.getElementById('uploads-row')) {
    const latestItems = [...allData].sort((a, b) => new Date(b.uploadDate || 0) - new Date(a.uploadDate || 0)); // The merged array inherently brings newest uploads first
    buildRow('uploads-row', latestItems);
  }
  if(document.getElementById('trending-row')) {
    const trendingItems = [...allData].sort((a, b) => (b.views || 0) - (a.views || 0));
    buildRow('trending-row', trendingItems); 
  }

  // 3. Setup Search
  if(document.getElementById('search-input')) {
    setupSearch(allData);
  }
}

function setupSearch(allData) {
  const searchInput = document.getElementById('search-input');
  const searchSection = document.getElementById('search-section');
  const searchRow = document.getElementById('search-row');
  const heroSlider = document.getElementById('hero-slider');
  const latestSection = document.getElementById('latest-section');
  const trendingSection = document.getElementById('trending-section');

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if(term.length > 0) {
      const results = allData.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.category.toLowerCase().includes(term)
      );
      buildRow('search-row', results);
      
      searchSection.style.display = 'block';
      if(heroSlider) heroSlider.style.display = 'none';
      if(latestSection) latestSection.style.display = 'none';
      if(trendingSection) trendingSection.style.display = 'none';
    } else {
      searchSection.style.display = 'none';
      if(heroSlider) heroSlider.style.display = 'block';
      if(latestSection) latestSection.style.display = 'block';
      if(trendingSection) trendingSection.style.display = 'block';
    }
  });
}

// Build the Auto-Slider
function buildHeroSlider() {
  const sliderContainer = document.getElementById('hero-slider');
  sliderContainer.innerHTML = ''; // clear

  heroSlidesData.forEach((item, index) => {
    const slide = document.createElement('div');
    slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
    slide.dataset.index = index;

    // We use the 'banner' field, fallback to 'thumbnail'
    const bgUrl = item.banner || item.thumbnail;

    slide.innerHTML = `
      <div class="hero-bg">
        <img src="${bgUrl}" alt="${item.title}">
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badges">
          <span class="badge exclusive">Top Pick</span>
          <span class="badge quality">Latest</span>
        </div>
        <h1 class="hero-title">${item.title}</h1>
        <div class="hero-actions">
          <a href="${item.videoLink}" target="_blank" class="btn-primary" style="text-decoration:none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="black" stroke="black" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Watch Now
          </a>
          <button class="btn-secondary" onclick='openModal(${JSON.stringify(item)})'>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            More Info
          </button>
        </div>
      </div>
    `;
    sliderContainer.appendChild(slide);
  });

  startSlider();

  // Pause on hover
  sliderContainer.addEventListener('mouseenter', stopSlider);
  sliderContainer.addEventListener('mouseleave', startSlider);

  // Swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  sliderContainer.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
  sliderContainer.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    if(touchStartX - touchEndX > 50) nextSlide(); // swiped left
    if(touchEndX - touchStartX > 50) prevSlide(); // swiped right
  }, {passive: true});
}

function startSlider() {
  stopSlider();
  sliderInterval = setInterval(nextSlide, SLIDE_DURATION);
}

function stopSlider() {
  clearInterval(sliderInterval);
}

function nextSlide() {
  goToSlide(currentSlideIndex + 1);
}

function prevSlide() {
  goToSlide(currentSlideIndex - 1);
}

function goToSlide(n) {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length === 0) return;
  slides[currentSlideIndex].classList.remove('active');
  
  currentSlideIndex = (n + slides.length) % slides.length;
  slides[currentSlideIndex].classList.add('active');
}

// Build Content Rows
function buildRow(containerId, items) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  
  items.forEach(item => {
    container.appendChild(createThumbnailCard(item));
  });
}

function createThumbnailCard(item) {
  const card = document.createElement('div');
  card.className = 'thumbnail-card';
  // Attach full item JSON to dataset for modal popup
  card.dataset.item = JSON.stringify(item);

  card.innerHTML = `
    <img src="${item.thumbnail}" alt="${item.title}" loading="lazy">
    <div class="card-overlay"></div>
    <div class="card-play-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
    </div>
    <div class="card-info">
      <div class="card-category">${item.category}</div>
      <div class="card-title">${item.title}</div>
      ${item.uploadDate ? `<div class="card-date" style="font-size:0.6rem; color:var(--text-muted); margin-top:2px;">Added: ${formatDate(item.uploadDate)}</div>` : ''}
      <div class="card-views" style="font-size:0.6rem; color:var(--text-muted); margin-top:2px;">👁 ${(item.views || 0).toLocaleString()} Views</div>
    </div>
  `;

  card.addEventListener('click', () => {
    openModal(item);
  });

  return card;
}

// Carousel Horizontal Slider Arrow functionality
window.slideRow = function(id, amount) {
  const row = document.getElementById(id);
  if (row) {
    row.scrollBy({ left: amount, behavior: 'smooth' });
  }
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav && window.scrollY > 50) {
    nav.classList.add('scrolled');
  } else if (nav && window.scrollY <= 50) {
    if (!window.location.pathname.includes('admin.html')) nav.classList.remove('scrolled');
  }
});

// Modal Logic
window.openModal = function(itemData) {
  const modal = document.getElementById('movie-modal');
  if (!modal) return;
  
  const imgUrl = itemData.banner || itemData.thumbnail;
  const dateStr = itemData.uploadDate ? formatDate(itemData.uploadDate) : '';
  const viewsStr = (itemData.views || 0).toLocaleString();
  
  document.getElementById('modal-title').textContent = itemData.title;
  document.getElementById('modal-category').innerHTML = `${itemData.category} <span style="color:var(--text-muted); font-size:0.7rem; margin-left:10px;">📅 ${dateStr}</span> <span style="color:var(--text-muted); font-size:0.7rem; margin-left:10px;">👁 ${viewsStr} Views</span>`;
  document.getElementById('modal-img').src = imgUrl;
  document.getElementById('modal-link').href = itemData.videoLink;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Blur bg automatically handled via CSS backdrop-filter if applied to a wrapper, but we'll apply it to the main content
  document.querySelector('.main-content')?.classList.add('blurred');
  document.querySelector('#hero-slider')?.classList.add('blurred');
}

window.closeModal = function(e) {
  if (e.target.id === 'movie-modal') {
    forceCloseModal();
  }
}

window.forceCloseModal = function() {
  const modal = document.getElementById('movie-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.querySelector('.main-content')?.classList.remove('blurred');
    document.querySelector('#hero-slider')?.classList.remove('blurred');
  }
}

/* =========================================
   Admin Logic (admin.html)
========================================= */

window.checkAdminPassword = function() {
  const input = document.getElementById('admin-pwd-input').value;
  if(input === '113003') {
    document.getElementById('admin-login-overlay').style.display = 'none';
  } else {
    document.getElementById('admin-pwd-error').style.display = 'block';
  }
}

function initAdmin() {
  const form = document.getElementById('upload-form');
  if (!form) return;

  renderAdminList();

  // Allow enter key mapping to custom login prompt button since it's an overlay
  const pwdInput = document.getElementById('admin-pwd-input');
  if(pwdInput) {
    pwdInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        checkAdminPassword();
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('upload-title').value;
    const category = document.getElementById('upload-category').value;
    const thumbnail = document.getElementById('upload-thumb').value;
    const banner = document.getElementById('upload-banner').value;
    const videoLink = document.getElementById('upload-video').value;
    const views = parseInt(document.getElementById('upload-views').value) || 0;
    const isLatest = document.getElementById('upload-isLatest').checked;

    const newItem = {
      id: Date.now().toString(),
      title,
      category,
      thumbnail,
      banner,
      videoLink,
      views,
      isLatest,
      uploadDate: new Date().toISOString()
    };

    let uploads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    uploads.unshift(newItem); // put it at start
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));

    form.reset();
    renderAdminList();
  });
}

function renderAdminList() {
  const listCont = document.getElementById('uploads-list');
  if (!listCont) return;

  const uploads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  listCont.innerHTML = '';

  if (uploads.length === 0) {
    listCont.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 40px 0;">No content uploaded yet.</p>`;
    return;
  }

  uploads.forEach(item => {
    const div = document.createElement('div');
    div.className = 'upload-item';
    div.innerHTML = `
      <img src="${item.thumbnail}" alt="">
      <div class="upload-info">
        <span style="font-size: 0.7rem; color: var(--secondary-color); font-weight: bold; text-transform: uppercase;">
          ${item.category} ${item.isLatest ? ' <span style="background:var(--primary-color);color:white;padding:2px 4px;border-radius:4px;font-size:0.6rem;">Feature</span>' : ''}
        </span>
        <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">${item.title}</h4>
        <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:4px;">${item.uploadDate ? formatDate(item.uploadDate) : ''} • 👁 ${(item.views || 0).toLocaleString()} Views</div>
        <a href="${item.videoLink}" target="_blank" style="font-size: 0.8rem; color: #3b82f6;">${item.videoLink}</a>
      </div>
      <button class="btn-delete" onclick="deleteUpload('${item.id}')">✕</button>
    `;
    listCont.appendChild(div);
  });
}

window.deleteUpload = function(id) {
  let uploads = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  uploads = uploads.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
  renderAdminList();
};

document.addEventListener('DOMContentLoaded', () => {
  initFrontend();
  initAdmin();
});
