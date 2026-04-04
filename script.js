const { createClient } = supabase;
const supabaseUrl = 'https://iynkabsrmxszglezxozr.supabase.co';
const supabaseKey = 'sb_publishable_qL4KS3fvZ4PVKyexbQ3Tkw_wU_eyIVZ';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Helper: Get merged data
async function getAllContentData() {
  const { data, error } = await supabaseClient
    .from('movies')
    .select('*')
    .order('uploadDate', { ascending: false });

  if (error) {
    console.error("Error fetching data:", error);
    return [];
  }
  return data || [];
}

async function getAllAdsData() {
  const { data, error } = await supabaseClient
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching ads:", error);
    return [];
  }
  return data || [];
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
async function initFrontend() {
  const allData = await getAllContentData();
  
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

  // 4. Setup Ads
  const adsData = await getAllAdsData();
  const activeAds = adsData.filter(ad => ad.isActive);
  
  // Banner & Video logic
  const bannerAd = activeAds.find(ad => ad.adType === 'banner' || !ad.adType);
  const videoAd = activeAds.find(ad => ad.adType === 'video');
  const displayAd = videoAd || bannerAd;
  
  const adContainer = document.getElementById('promotional-ad-container');
  if (displayAd && adContainer) {
    adContainer.style.display = 'block';
    if(displayAd.adType === 'video') {
      adContainer.innerHTML = `
        <a href="${displayAd.linkUrl || '#'}" target="_blank" style="display: block; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position:relative;">
          <span style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); color:white; padding:2px 8px; font-size:0.7rem; border-radius:4px; z-index:10;">Ad</span>
          <video src="${displayAd.videoUrl}" autoplay loop muted style="width: 100%; height: auto; max-height: 250px; object-fit: cover; display: block;"></video>
        </a>
      `;
    } else {
      adContainer.innerHTML = `
        <a href="${displayAd.linkUrl || '#'}" target="_blank" style="display: block; width: 100%; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transition: transform 0.3s ease; position:relative;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
          <span style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); color:white; padding:2px 8px; font-size:0.7rem; border-radius:4px; z-index:10;">Ad</span>
          <img src="${displayAd.imageUrl}" alt="Promotional Ad" style="width: 100%; height: auto; max-height: 250px; object-fit: cover; display: block;">
        </a>
      `;
    }
  }

  // Native Ads logic
  const nativeAds = activeAds.filter(ad => ad.adType === 'native');
  if (nativeAds.length > 0) {
    const latestRow = document.getElementById('uploads-row');
    if (latestRow) {
      nativeAds.forEach(nAd => {
        const adCard = document.createElement('div');
        adCard.className = 'thumbnail-card';
        adCard.innerHTML = `
          <img src="${nAd.imageUrl}" alt="Sponsor" loading="lazy">
          <div class="card-overlay" style="background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);"></div>
          <div style="position:absolute; top:8px; right:8px; background:var(--primary-color); color:white; padding:2px 6px; font-size:0.6rem; border-radius:4px; font-weight:bold; z-index:10;">SPONSORED</div>
          <div class="card-info" style="bottom: 0;">
            <div class="card-title" style="font-size:1.1rem; margin-bottom:5px;">${nAd.title || 'Sponsored Content'}</div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px; line-height:1.2;">${nAd.description || 'Check out this amazing offer.'}</div>
            <a href="${nAd.linkUrl || '#'}" target="_blank" class="btn-primary" style="display:block; text-align:center; padding:6px; font-size:0.8rem; border-radius:6px; text-decoration:none;">Learn More</a>
          </div>
        `;
        const insertPosition = Math.min(latestRow.children.length, Math.floor(Math.random() * 5));
        latestRow.insertBefore(adCard, latestRow.children[insertPosition]);
      });
    }
  }

  // Interstitial Ad Logic
  const interstitialAd = activeAds.find(ad => ad.adType === 'interstitial');
  if (interstitialAd && !sessionStorage.getItem('interstitial_shown')) {
    const overlay = document.getElementById('interstitial-ad');
    if (overlay) {
      overlay.innerHTML = `
        <div class="interstitial-content">
          <button class="interstitial-close" onclick="closeInterstitial()">✕</button>
          <a href="${interstitialAd.linkUrl || '#'}" target="_blank">
            <img class="interstitial-img" src="${interstitialAd.imageUrl}" alt="Ad">
          </a>
          <div class="interstitial-details">
            <h2 style="margin-bottom:10px; font-size:1.5rem;">${interstitialAd.title || 'Special Offer'}</h2>
            <p style="color:var(--text-muted); margin-bottom:20px; font-size:1rem;">${interstitialAd.description || 'Click the image above to learn more.'}</p>
            <a href="${interstitialAd.linkUrl || '#'}" target="_blank" class="btn-primary" style="display:inline-block; padding:10px 30px; font-size:1.1rem; text-decoration:none; border-radius:8px;">View Offer</a>
          </div>
        </div>
      `;
      setTimeout(() => {
        overlay.classList.add('active');
        sessionStorage.setItem('interstitial_shown', 'true');
      }, 2000);
    }
  }
}

window.closeInterstitial = function() {
  const overlay = document.getElementById('interstitial-ad');
  if(overlay) overlay.classList.remove('active');
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
      
      const mainContent = document.getElementById('main-content-area');
      if (mainContent) mainContent.classList.add('search-active');
    } else {
      searchSection.style.display = 'none';
      if(heroSlider) heroSlider.style.display = 'block';
      if(latestSection) latestSection.style.display = 'block';
      if(trendingSection) trendingSection.style.display = 'block';

      const mainContent = document.getElementById('main-content-area');
      if (mainContent) mainContent.classList.remove('search-active');
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
          <button class="btn-primary" onclick='handleWatchClick(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="text-decoration:none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="black" stroke="black" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Watch Now
          </button>
          <button class="btn-secondary" onclick='openModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>
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
  
  const watchBtn = document.getElementById('modal-link');
  if(watchBtn) {
    watchBtn.onclick = function(e) {
      e.preventDefault();
      forceCloseModal();
      handleWatchClick(itemData);
    };
  }
  
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
   Watch Overlay Logic 
========================================= */
let currentWatchItem = null;

window.handleWatchClick = function(item) {
  if (item.embedCode && item.embedCode.trim() !== '') {
    openWatchOverlay(item);
  } else if (item.videoLink && item.videoLink.trim() !== '') {
    window.open(item.videoLink, '_blank');
  } else {
    alert('No content available');
  }
}

window.openWatchOverlay = function(item) {
  currentWatchItem = item;
  
  const overlay = document.getElementById('watch-overlay');
  if(!overlay) return;
  
  document.getElementById('watch-video-container').innerHTML = item.embedCode;
  document.getElementById('watch-title').textContent = item.title;
  document.getElementById('watch-views').textContent = (item.views || 0).toLocaleString() + ' views';
  document.getElementById('watch-date').textContent = item.uploadDate ? formatDate(item.uploadDate) : 'Unknown Date';
  document.getElementById('watch-desc').innerHTML = (item.description || '').replace(/\n/g, '<br>');
  
  updateEngagementUI();
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

window.closeWatchOverlay = function() {
  const overlay = document.getElementById('watch-overlay');
  if(overlay) {
    overlay.classList.remove('active');
    document.getElementById('watch-video-container').innerHTML = ''; // clear iframe to stop playing
    document.body.style.overflow = 'auto';
    currentWatchItem = null;
  }
}

// User Engagement Logic
function updateEngagementUI() {
  if(!currentWatchItem) return;
  
  const likes = currentWatchItem.likes || 0;
  const dislikes = currentWatchItem.dislikes || 0;
  const reactions = currentWatchItem.reactions || {};
  
  document.getElementById('watch-like-count').textContent = likes.toLocaleString();
  document.getElementById('watch-dislike-count').textContent = dislikes.toLocaleString();
  
  document.getElementById('react-heart').textContent = (reactions.heart || 0).toLocaleString();
  document.getElementById('react-laugh').textContent = (reactions.laugh || 0).toLocaleString();
  document.getElementById('react-wow').textContent = (reactions.wow || 0).toLocaleString();
  
  // Update Active States Based on LocalStorage
  const userActions = JSON.parse(localStorage.getItem('userActions_' + currentWatchItem.id) || '{}');
  
  const likeBtn = document.getElementById('btn-like');
  const dislikeBtn = document.getElementById('btn-dislike');
  
  likeBtn.classList.toggle('active', userActions.liked === true);
  dislikeBtn.classList.toggle('active', userActions.disliked === true);
}

async function saveEngagement(updates) {
  if(!currentWatchItem) return;
  
  // Update remote DB
  const { error } = await supabaseClient
    .from('movies')
    .update(updates)
    .eq('id', currentWatchItem.id);
    
  if (error) console.error("Error updating engagement:", error);
}

window.handleLike = function() {
  if(!currentWatchItem) return;
  const userActions = JSON.parse(localStorage.getItem('userActions_' + currentWatchItem.id) || '{}');
  
  let likes = currentWatchItem.likes || 0;
  let dislikes = currentWatchItem.dislikes || 0;
  
  if (userActions.liked) {
    // Remove like
    likes = Math.max(0, likes - 1);
    userActions.liked = false;
  } else {
    // Add like
    likes += 1;
    userActions.liked = true;
    if (userActions.disliked) {
      dislikes = Math.max(0, dislikes - 1);
      userActions.disliked = false;
    }
  }
  
  currentWatchItem.likes = likes;
  currentWatchItem.dislikes = dislikes;
  localStorage.setItem('userActions_' + currentWatchItem.id, JSON.stringify(userActions));
  updateEngagementUI();
  saveEngagement({ likes, dislikes });
}

window.handleDislike = function() {
  if(!currentWatchItem) return;
  const userActions = JSON.parse(localStorage.getItem('userActions_' + currentWatchItem.id) || '{}');
  
  let likes = currentWatchItem.likes || 0;
  let dislikes = currentWatchItem.dislikes || 0;
  
  if (userActions.disliked) {
    // Remove dislike
    dislikes = Math.max(0, dislikes - 1);
    userActions.disliked = false;
  } else {
    // Add dislike
    dislikes += 1;
    userActions.disliked = true;
    if (userActions.liked) {
      likes = Math.max(0, likes - 1);
      userActions.liked = false;
    }
  }
  
  currentWatchItem.likes = likes;
  currentWatchItem.dislikes = dislikes;
  localStorage.setItem('userActions_' + currentWatchItem.id, JSON.stringify(userActions));
  updateEngagementUI();
  saveEngagement({ likes, dislikes });
}

window.toggleReactionMenu = function() {
  const menu = document.getElementById('reaction-menu');
  if(menu) menu.classList.toggle('show');
}

window.handleReaction = function(type) {
  if(!currentWatchItem) return;
  
  const userActions = JSON.parse(localStorage.getItem('userActions_' + currentWatchItem.id) || '{}');
  let reactions = currentWatchItem.reactions || {};
  if (typeof reactions === 'string') {
    try { reactions = JSON.parse(reactions); } catch(e) { reactions = {}; }
  }
  
  // Can react once per type
  const reactedTypes = userActions.reactions || {};
  
  if (reactedTypes[type]) {
    // Remove reaction
    reactions[type] = Math.max(0, (reactions[type] || 1) - 1);
    reactedTypes[type] = false;
  } else {
    // Add reaction
    reactions[type] = (reactions[type] || 0) + 1;
    reactedTypes[type] = true;
  }
  
  userActions.reactions = reactedTypes;
  currentWatchItem.reactions = reactions;
  localStorage.setItem('userActions_' + currentWatchItem.id, JSON.stringify(userActions));
  
  updateEngagementUI();
  saveEngagement({ reactions });
  window.toggleReactionMenu();
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

async function initAdmin() {
  const form = document.getElementById('upload-form');
  if (!form) return;

  await renderAdminList();

  // Allow enter key mapping to custom login prompt button since it's an overlay
  const pwdInput = document.getElementById('admin-pwd-input');
  if(pwdInput) {
    pwdInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        checkAdminPassword();
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('upload-title').value;
    const desc = document.getElementById('upload-desc').value;
    const category = document.getElementById('upload-category').value;
    const thumbnail = document.getElementById('upload-thumb').value;
    const banner = document.getElementById('upload-banner').value;
    const videoLink = document.getElementById('upload-video').value;
    const embedCode = document.getElementById('upload-embed').value;
    const views = parseInt(document.getElementById('upload-views').value) || 0;
    const isLatest = document.getElementById('upload-isLatest').checked;

    const btnSubmit = form.querySelector('.btn-submit');
    const ogText = btnSubmit.textContent;
    btnSubmit.textContent = window.editingId ? 'Updating...' : 'Uploading...';
    btnSubmit.disabled = true;

    const payload = {
      title,
      description: desc,
      category,
      thumbnail,
      banner,
      videoLink,
      embedCode,
      views,
      isLatest,
      uploadDate: new Date().toISOString() // Updates to current date and day
    };

    let query = supabaseClient.from('movies');
    if (window.editingId) {
      query = query.update(payload).eq('id', window.editingId);
    } else {
      payload.likes = 0;
      payload.dislikes = 0;
      payload.reactions = {};
      query = query.insert([payload]);
    }

    const { data, error } = await query;

    btnSubmit.disabled = false;

    if (error) {
      alert("Error saving: " + error.message);
      btnSubmit.textContent = ogText;
      return;
    }

    form.reset();
    window.editingId = null;
    
    const formTitle = document.querySelector('.admin-glass-panel h2');
    if (formTitle) formTitle.textContent = "Add New Title";
    btnSubmit.textContent = "Publish Content";

    await renderAdminList();
  });
}

async function renderAdminList() {
  const listCont = document.getElementById('uploads-list');
  if (!listCont) return;

  const uploads = await getAllContentData();
  window.currentUploads = uploads; // store for editing
  listCont.innerHTML = '';

  if (uploads.length === 0) {
    listCont.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 40px 0;">No content uploaded yet.</p>`;
    return;
  }

  uploads.forEach(item => {
    const div = document.createElement('div');
    div.className = 'upload-item';
    div.style.position = 'relative'; // Ensure absolute positioning context for buttons
    div.innerHTML = `
      <img src="${item.thumbnail}" alt="">
      <div class="upload-info" style="padding-right: 80px;">
        <span style="font-size: 0.7rem; color: var(--secondary-color); font-weight: bold; text-transform: uppercase;">
          ${item.category} ${item.isLatest ? ' <span style="background:var(--primary-color);color:white;padding:2px 4px;border-radius:4px;font-size:0.6rem;">Feature</span>' : ''}
        </span>
        <h4 style="font-weight: 700; font-size: 1.1rem; margin-bottom: 4px;">${item.title}</h4>
        <div style="font-size:0.6rem; color:var(--text-muted); margin-bottom:4px;">${item.uploadDate ? formatDate(item.uploadDate) : ''} • 👁 ${(item.views || 0).toLocaleString()} Views</div>
        <a href="${item.videoLink}" target="_blank" style="font-size: 0.8rem; color: #3b82f6;">${item.videoLink}</a>
      </div>
      <div style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); display: flex; gap: 8px;">
        <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="editUpload('${item.id}')">Edit</button>
        <button class="btn-delete" style="position: relative; right: auto; top: auto; transform: none;" onclick="deleteUpload('${item.id}')">✕</button>
      </div>
    `;
    listCont.appendChild(div);
  });
}

window.editUpload = function(id) {
  const item = window.currentUploads.find(i => i.id === id);
  if(!item) return;

  document.getElementById('upload-title').value = item.title;
  document.getElementById('upload-desc').value = item.description || '';
  document.getElementById('upload-category').value = item.category;
  document.getElementById('upload-thumb').value = item.thumbnail;
  document.getElementById('upload-banner').value = item.banner;
  document.getElementById('upload-video').value = item.videoLink || '';
  document.getElementById('upload-embed').value = item.embedCode || '';
  document.getElementById('upload-views').value = item.views || 0;
  document.getElementById('upload-isLatest').checked = Boolean(item.isLatest);
  
  window.editingId = item.id;
  
  const formTitle = document.querySelector('.admin-glass-panel h2');
  if (formTitle) formTitle.textContent = "Edit Title";
  
  const btnSubmit = document.querySelector('#upload-form .btn-submit');
  if (btnSubmit) btnSubmit.textContent = "Update Content";
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteUpload = async function(id) {
  const { error } = await supabaseClient
    .from('movies')
    .delete()
    .eq('id', id);

  if(error) {
    alert("Error deleting: " + error.message);
    return;
  }
  await renderAdminList();
};

/* =========================================
   Ad Management Logic
========================================= */

async function initAdminAds() {
  const adForm = document.getElementById('ad-upload-form');
  if (!adForm) return;

  await renderAdminAdsList();

  adForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const adType = document.getElementById('ad-type').value;
    const imageUrl = document.getElementById('ad-image').value;
    const videoUrl = document.getElementById('ad-video').value;
    const title = document.getElementById('ad-title').value;
    const description = document.getElementById('ad-desc').value;
    const linkUrl = document.getElementById('ad-link').value;
    const isActive = document.getElementById('ad-isActive').checked;

    const btnSubmit = adForm.querySelector('.btn-submit');
    const ogText = btnSubmit.textContent;
    btnSubmit.textContent = window.editingAdId ? 'Updating Ad...' : 'Publishing Ad...';
    btnSubmit.disabled = true;

    const payload = { adType, imageUrl, videoUrl, title, description, linkUrl, isActive };

    let query = supabaseClient.from('banners');
    if (window.editingAdId) {
      query = query.update(payload).eq('id', window.editingAdId);
    } else {
      query = query.insert([payload]);
    }

    const { error } = await query;

    btnSubmit.disabled = false;

    if (error) {
      alert("Error saving ad: " + error.message);
      btnSubmit.textContent = ogText;
      return;
    }

    adForm.reset();
    window.editingAdId = null;
    btnSubmit.textContent = "Publish Ad";
    
    const formTitle = document.querySelector('#ad-upload-form').previousElementSibling;
    if (formTitle) formTitle.textContent = "Add New Ad Banner";

    await renderAdminAdsList();
  });
}

async function renderAdminAdsList() {
  const listCont = document.getElementById('ads-list');
  if (!listCont) return;

  const ads = await getAllAdsData();
  window.currentAds = ads;
  listCont.innerHTML = '';

  if (ads.length === 0) {
    listCont.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 40px 0;">No ads created yet.</p>`;
    return;
  }

  ads.forEach(item => {
    const div = document.createElement('div');
    div.className = 'upload-item';
    div.style.position = 'relative'; 
    const badgeColor = item.adType === 'interstitial' ? '#eab308' : (item.adType === 'video' ? '#ef4444' : (item.adType === 'native' ? '#a855f7' : '#3b82f6'));
    
    div.innerHTML = `
      ${item.adType === 'video' ? `<video src="${item.videoUrl}" style="width:80px;height:120px;object-fit:cover;border-radius:8px;" muted></video>` : `<img src="${item.imageUrl}" alt="" style="object-fit: cover;">`}
      <div class="upload-info" style="padding-right: 80px;">
        <div style="display:flex; gap:10px; align-items:center;">
          <span style="font-size: 0.7rem; color: ${item.isActive ? 'var(--primary-color)' : 'var(--text-muted)'}; font-weight: bold; text-transform: uppercase;">
            ${item.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <span style="font-size: 0.6rem; background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">
            ${item.adType || 'banner'}
          </span>
        </div>
        <h4 style="font-weight: 700; font-size: 1.1rem; margin: 4px 0;">${item.title || 'Ad Campaign'}</h4>
        <a href="${item.linkUrl || '#'}" target="_blank" style="font-size: 0.8rem; color: #3b82f6; display:block; margin-top:4px;">${item.linkUrl || 'No link'}</a>
      </div>
      <div style="position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); display: flex; gap: 8px;">
        <button class="btn-secondary" style="padding: 6px 12px; font-size: 0.85rem;" onclick="editAd('${item.id}')">Edit</button>
        <button class="btn-delete" style="position: relative; right: auto; top: auto; transform: none;" onclick="deleteAd('${item.id}')">✕</button>
      </div>
    `;
    listCont.appendChild(div);
  });
}

window.editAd = function(id) {
  const item = window.currentAds.find(i => i.id === id);
  if(!item) return;

  document.getElementById('ad-type').value = item.adType || 'banner';
  document.getElementById('ad-title').value = item.title || '';
  document.getElementById('ad-desc').value = item.description || '';
  document.getElementById('ad-image').value = item.imageUrl || '';
  document.getElementById('ad-video').value = item.videoUrl || '';
  document.getElementById('ad-link').value = item.linkUrl || '';
  document.getElementById('ad-isActive').checked = item.isActive;
  if(typeof toggleAdFields === 'function') toggleAdFields();
  
  window.editingAdId = item.id;
  
  const formTitle = document.querySelector('#ad-upload-form').previousElementSibling;
  if (formTitle) formTitle.textContent = "Edit Ad Banner";
  
  const btnSubmit = document.querySelector('#ad-upload-form .btn-submit');
  if (btnSubmit) btnSubmit.textContent = "Update Ad";
  
  // Scroll down to the ads section
  document.querySelector('#ad-upload-form').scrollIntoView({ behavior: 'smooth' });
};

window.deleteAd = async function(id) {
  const { error } = await supabaseClient
    .from('banners')
    .delete()
    .eq('id', id);

  if(error) {
    alert("Error deleting ad: " + error.message);
    return;
  }
  await renderAdminAdsList();
};

document.addEventListener('DOMContentLoaded', async () => {
  await initFrontend();
  await initAdmin();
  await initAdminAds();

  // User Dropdown toggle
  const userBtn = document.getElementById('user-menu-btn');
  const userDropdown = document.getElementById('user-dropdown');
  
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!userBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }
});
