/* ============================================================
   Product Catalog Management — Dashboard Logic (Vanilla JS)
   Talks to the REST API at /api/v1
   ============================================================ */

(() => {
  'use strict';

  const API_BASE = '/api/v1';
  const TOKEN_KEY = 'pcm_token';
  const USER_KEY = 'pcm_user';

  // ---------------------------------------------------------
  // State
  // ---------------------------------------------------------
  const state = {
    products: [],
    categories: new Set(),
    filters: { search: '', category: '', status: '', minPrice: '', maxPrice: '', sort: 'newest' },
    page: 1,
    limit: 12,
    totalPages: 1,
    total: 0,
    isAuthenticated: false,
    authMode: 'login', // or 'register'
    deleteTarget: null,
  };

  // ---------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------
  const $ = (id) => document.getElementById(id);

  const els = {
    // topbar
    authChip: $('authChip'),
    authDot: $('authDot'),
    authLabel: $('authLabel'),
    btnAuth: $('btnAuth'),
    // nav
    sideLinks: document.querySelectorAll('.side-link'),
    views: document.querySelectorAll('.view'),
    // products
    productsGrid: $('productsGrid'),
    emptyState: $('emptyState'),
    loadingState: $('loadingState'),
    pagination: $('pagination'),
    searchInput: $('searchInput'),
    filterCategory: $('filterCategory'),
    filterStatus: $('filterStatus'),
    minPrice: $('minPrice'),
    maxPrice: $('maxPrice'),
    sortSelect: $('sortSelect'),
    btnResetFilters: $('btnResetFilters'),
    btnAddProduct: $('btnAddProduct'),
    // product modal
    productModalOverlay: $('productModalOverlay'),
    productModalTitle: $('productModalTitle'),
    productForm: $('productForm'),
    closeProductModal: $('closeProductModal'),
    cancelProductForm: $('cancelProductForm'),
    formError: $('formError'),
    categoryList: $('categoryList'),
    productId: $('productId'),
    pName: $('pName'),
    pDescription: $('pDescription'),
    pCategory: $('pCategory'),
    pBrand: $('pBrand'),
    pPrice: $('pPrice'),
    pStock: $('pStock'),
    pSku: $('pSku'),
    pStatus: $('pStatus'),
    pImageUrl: $('pImageUrl'),
    // auth modal
    authModalOverlay: $('authModalOverlay'),
    authModalTitle: $('authModalTitle'),
    authForm: $('authForm'),
    authNameRow: $('authNameRow'),
    authName: $('authName'),
    authEmail: $('authEmail'),
    authPassword: $('authPassword'),
    authError: $('authError'),
    authSubmitBtn: $('authSubmitBtn'),
    toggleAuthMode: $('toggleAuthMode'),
    btnLogout: $('btnLogout'),
    closeAuthModal: $('closeAuthModal'),
    // delete modal
    deleteModalOverlay: $('deleteModalOverlay'),
    deleteProductName: $('deleteProductName'),
    closeDeleteModal: $('closeDeleteModal'),
    cancelDelete: $('cancelDelete'),
    confirmDelete: $('confirmDelete'),
    // analytics
    analyticsLocked: $('analyticsLocked'),
    analyticsContent: $('analyticsContent'),
    statTotal: $('statTotal'),
    statOOS: $('statOOS'),
    statAvg: $('statAvg'),
    statHigh: $('statHigh'),
    statLow: $('statLow'),
    categoryBars: $('categoryBars'),
    // toast
    toastContainer: $('toastContainer'),
  };

  // ---------------------------------------------------------
  // Auth helpers
  // ---------------------------------------------------------
  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch {
      return null;
    }
  };

  const setAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    state.isAuthenticated = true;
    updateAuthUI();
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    state.isAuthenticated = false;
    updateAuthUI();
  };

  const updateAuthUI = () => {
    const user = getUser();
    if (state.isAuthenticated && user) {
      els.authDot.classList.add('online');
      els.authLabel.textContent = user.name || user.email;
      els.btnAuth.textContent = 'Account';
      els.btnLogout.classList.remove('hidden');
    } else {
      els.authDot.classList.remove('online');
      els.authLabel.textContent = 'Not signed in';
      els.btnAuth.textContent = 'Sign in';
      els.btnLogout.classList.add('hidden');
    }
    renderAnalyticsGate();
  };

  // ---------------------------------------------------------
  // API helper
  // ---------------------------------------------------------
  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    let json;
    try {
      json = await res.json();
    } catch {
      json = {};
    }

    if (!res.ok) {
      if (res.status === 401) {
        clearAuth();
      }
      const message = json.message || 'Something went wrong. Please try again.';
      const details = Array.isArray(json.details) ? json.details.join(', ') : json.details;
      throw new Error(details ? `${message}: ${details}` : message);
    }
    return json;
  }

  // ---------------------------------------------------------
  // Toasts
  // ---------------------------------------------------------
  function showToast(message, type = 'default') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  // ---------------------------------------------------------
  // View navigation
  // ---------------------------------------------------------
  els.sideLinks.forEach((link) => {
    link.addEventListener('click', () => {
      els.sideLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      const target = link.dataset.view;
      els.views.forEach((v) => v.classList.remove('active'));
      $(`view-${target}`).classList.add('active');
      if (target === 'analytics') loadAnalytics();
    });
  });

  // ---------------------------------------------------------
  // Fetch & render products
  // ---------------------------------------------------------
  function buildQuery() {
    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('limit', state.limit);
    if (state.filters.search) params.set('search', state.filters.search);
    if (state.filters.category) params.set('category', state.filters.category);
    if (state.filters.status) params.set('status', state.filters.status);
    if (state.filters.minPrice) params.set('minPrice', state.filters.minPrice);
    if (state.filters.maxPrice) params.set('maxPrice', state.filters.maxPrice);
    if (state.filters.sort) params.set('sort', state.filters.sort);
    return params.toString();
  }

  async function loadProducts() {
    toggleLoading(true);
    try {
      const query = buildQuery();
      const json = await api(`/products?${query}`);
      state.products = json.data || [];
      state.total = json.meta?.total || 0;
      state.totalPages = json.meta?.totalPages || 1;

      state.products.forEach((p) => state.categories.add(p.category));
      refreshCategoryOptions();

      renderProducts();
      renderPagination();
    } catch (err) {
      showToast(err.message, 'error');
      state.products = [];
      renderProducts();
    } finally {
      toggleLoading(false);
    }
  }

  function toggleLoading(isLoading) {
    els.loadingState.classList.toggle('hidden', !isLoading);
    els.productsGrid.classList.toggle('hidden', isLoading);
    if (isLoading) els.emptyState.classList.add('hidden');
  }

  function refreshCategoryOptions() {
    const current = els.filterCategory.value;
    const sorted = Array.from(state.categories).sort((a, b) => a.localeCompare(b));

    els.filterCategory.innerHTML = '<option value="">All Categories</option>';
    els.categoryList.innerHTML = '';

    sorted.forEach((cat) => {
      const opt1 = document.createElement('option');
      opt1.value = cat;
      opt1.textContent = cat;
      els.filterCategory.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = cat;
      els.categoryList.appendChild(opt2);
    });

    if (sorted.includes(current)) els.filterCategory.value = current;
  }

  function renderProducts() {
    els.productsGrid.innerHTML = '';

    if (!state.products.length) {
      els.emptyState.classList.remove('hidden');
      els.productsGrid.classList.add('hidden');
      return;
    }
    els.emptyState.classList.add('hidden');
    els.productsGrid.classList.remove('hidden');

    state.products.forEach((product) => {
      els.productsGrid.appendChild(buildProductCard(product));
    });
  }

  function escapeHtml(str = '') {
    return str
      .toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const isAvailable = product.status === 'Available';
    const imageHtml = product.imageUrl
      ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" onerror="this.parentElement.innerHTML='<span class=\\'placeholder-icon\\'>🧩</span>'" />`
      : '<span class="placeholder-icon">🧩</span>';

    card.innerHTML = `
      <div class="product-thumb">
        ${imageHtml}
        <span class="status-badge ${isAvailable ? 'status-available' : 'status-oos'}">${escapeHtml(product.status)}</span>
      </div>
      <div class="product-body">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <span class="product-brand">${escapeHtml(product.brand)}</span>
        <div class="product-meta">
          <span class="product-price">₹${Number(product.price).toLocaleString('en-IN')}</span>
          <span class="product-stock">${product.stockQuantity} in stock</span>
        </div>
        <span class="product-sku">SKU: ${escapeHtml(product.sku)}</span>
        <div class="product-actions">
          <button class="btn btn-outline btn-edit">✏️ Edit</button>
          <button class="btn btn-outline btn-delete">🗑️ Delete</button>
        </div>
      </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => openProductModal(product));
    card.querySelector('.btn-delete').addEventListener('click', () => openDeleteModal(product));

    return card;
  }

  function renderPagination() {
    els.pagination.innerHTML = '';
    if (state.totalPages <= 1) return;

    const makeBtn = (label, page, opts = {}) => {
      const btn = document.createElement('button');
      btn.className = `page-btn${opts.active ? ' active' : ''}`;
      btn.textContent = label;
      btn.disabled = !!opts.disabled;
      btn.addEventListener('click', () => {
        state.page = page;
        loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      return btn;
    };

    els.pagination.appendChild(makeBtn('‹', state.page - 1, { disabled: state.page <= 1 }));

    const windowSize = 2;
    for (let i = 1; i <= state.totalPages; i++) {
      if (
        i === 1 ||
        i === state.totalPages ||
        (i >= state.page - windowSize && i <= state.page + windowSize)
      ) {
        els.pagination.appendChild(makeBtn(String(i), i, { active: i === state.page }));
      } else if (i === state.page - windowSize - 1 || i === state.page + windowSize + 1) {
        const dots = document.createElement('span');
        dots.textContent = '…';
        dots.style.color = 'var(--text-secondary)';
        dots.style.padding = '0 4px';
        els.pagination.appendChild(dots);
      }
    }

    els.pagination.appendChild(
      makeBtn('›', state.page + 1, { disabled: state.page >= state.totalPages })
    );
  }

  // ---------------------------------------------------------
  // Filters / search / sort
  // ---------------------------------------------------------
  let searchDebounce;
  els.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.filters.search = e.target.value.trim();
      state.page = 1;
      loadProducts();
    }, 350);
  });

  els.filterCategory.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    state.page = 1;
    loadProducts();
  });

  els.filterStatus.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.page = 1;
    loadProducts();
  });

  let priceDebounce;
  const onPriceChange = () => {
    clearTimeout(priceDebounce);
    priceDebounce = setTimeout(() => {
      state.filters.minPrice = els.minPrice.value;
      state.filters.maxPrice = els.maxPrice.value;
      state.page = 1;
      loadProducts();
    }, 350);
  };
  els.minPrice.addEventListener('input', onPriceChange);
  els.maxPrice.addEventListener('input', onPriceChange);

  els.sortSelect.addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    state.page = 1;
    loadProducts();
  });

  els.btnResetFilters.addEventListener('click', () => {
    state.filters = { search: '', category: '', status: '', minPrice: '', maxPrice: '', sort: 'newest' };
    state.page = 1;
    els.searchInput.value = '';
    els.filterCategory.value = '';
    els.filterStatus.value = '';
    els.minPrice.value = '';
    els.maxPrice.value = '';
    els.sortSelect.value = 'newest';
    loadProducts();
  });

  // ---------------------------------------------------------
  // Product modal (add / edit)
  // ---------------------------------------------------------
  function openProductModal(product = null) {
    if (!requireAuth()) return;

    els.formError.classList.add('hidden');
    els.productForm.reset();

    if (product) {
      els.productModalTitle.textContent = 'Edit Product';
      els.productId.value = product._id;
      els.pName.value = product.name;
      els.pDescription.value = product.description;
      els.pCategory.value = product.category;
      els.pBrand.value = product.brand;
      els.pPrice.value = product.price;
      els.pStock.value = product.stockQuantity;
      els.pSku.value = product.sku;
      els.pStatus.value = product.status;
      els.pImageUrl.value = product.imageUrl || '';
    } else {
      els.productModalTitle.textContent = 'Add Product';
      els.productId.value = '';
      els.pStatus.value = 'Available';
    }

    els.productModalOverlay.classList.remove('hidden');
  }

  function closeProductModalFn() {
    els.productModalOverlay.classList.add('hidden');
  }

  els.btnAddProduct.addEventListener('click', () => openProductModal());
  els.closeProductModal.addEventListener('click', closeProductModalFn);
  els.cancelProductForm.addEventListener('click', closeProductModalFn);
  els.productModalOverlay.addEventListener('click', (e) => {
    if (e.target === els.productModalOverlay) closeProductModalFn();
  });

  els.productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.formError.classList.add('hidden');

    const payload = {
      name: els.pName.value.trim(),
      description: els.pDescription.value.trim(),
      category: els.pCategory.value.trim(),
      brand: els.pBrand.value.trim(),
      price: Number(els.pPrice.value),
      stockQuantity: Number(els.pStock.value),
      status: els.pStatus.value,
      imageUrl: els.pImageUrl.value.trim(),
    };
    if (els.pSku.value.trim()) payload.sku = els.pSku.value.trim();

    const id = els.productId.value;
    const submitBtn = $('submitProductForm');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';

    try {
      if (id) {
        await api(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Product updated successfully', 'success');
      } else {
        await api('/products', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Product created successfully', 'success');
      }
      closeProductModalFn();
      loadProducts();
    } catch (err) {
      els.formError.textContent = err.message;
      els.formError.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Product';
    }
  });

  // ---------------------------------------------------------
  // Delete modal
  // ---------------------------------------------------------
  function openDeleteModal(product) {
    if (!requireAuth()) return;
    state.deleteTarget = product;
    els.deleteProductName.textContent = product.name;
    els.deleteModalOverlay.classList.remove('hidden');
  }

  function closeDeleteModalFn() {
    els.deleteModalOverlay.classList.add('hidden');
    state.deleteTarget = null;
  }

  els.closeDeleteModal.addEventListener('click', closeDeleteModalFn);
  els.cancelDelete.addEventListener('click', closeDeleteModalFn);
  els.deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === els.deleteModalOverlay) closeDeleteModalFn();
  });

  els.confirmDelete.addEventListener('click', async () => {
    if (!state.deleteTarget) return;
    try {
      await api(`/products/${state.deleteTarget._id}`, { method: 'DELETE' });
      showToast('Product deleted successfully', 'success');
      closeDeleteModalFn();
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // ---------------------------------------------------------
  // Auth modal
  // ---------------------------------------------------------
  function requireAuth() {
    if (!state.isAuthenticated) {
      showToast('Please sign in to manage products', 'error');
      openAuthModal();
      return false;
    }
    return true;
  }

  function openAuthModal() {
    els.authError.classList.add('hidden');
    els.authForm.reset();
    if (state.isAuthenticated) {
      // Show as an account panel (only logout is really actionable)
      els.authModalTitle.textContent = 'Account';
    } else {
      setAuthMode('login');
    }
    els.authModalOverlay.classList.remove('hidden');
  }

  function closeAuthModalFn() {
    els.authModalOverlay.classList.add('hidden');
  }

  function setAuthMode(mode) {
    state.authMode = mode;
    if (mode === 'login') {
      els.authModalTitle.textContent = 'Sign In';
      els.authNameRow.classList.add('hidden');
      els.authName.required = false;
      els.authSubmitBtn.textContent = 'Sign In';
      els.toggleAuthMode.textContent = 'Need an account? Register';
    } else {
      els.authModalTitle.textContent = 'Create Account';
      els.authNameRow.classList.remove('hidden');
      els.authName.required = true;
      els.authSubmitBtn.textContent = 'Register';
      els.toggleAuthMode.textContent = 'Already have an account? Sign In';
    }
  }

  els.btnAuth.addEventListener('click', openAuthModal);
  els.closeAuthModal.addEventListener('click', closeAuthModalFn);
  els.authModalOverlay.addEventListener('click', (e) => {
    if (e.target === els.authModalOverlay) closeAuthModalFn();
  });

  els.toggleAuthMode.addEventListener('click', () => {
    els.authError.classList.add('hidden');
    setAuthMode(state.authMode === 'login' ? 'register' : 'login');
  });

  els.btnLogout.addEventListener('click', () => {
    clearAuth();
    closeAuthModalFn();
    showToast('You have been signed out');
  });

  els.authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.authError.classList.add('hidden');

    const email = els.authEmail.value.trim();
    const password = els.authPassword.value;

    els.authSubmitBtn.disabled = true;

    try {
      let json;
      if (state.authMode === 'login') {
        json = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      } else {
        const name = els.authName.value.trim();
        json = await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        });
      }
      setAuth(json.data.token, json.data.user);
      closeAuthModalFn();
      showToast(`Welcome, ${json.data.user.name || json.data.user.email}!`, 'success');
    } catch (err) {
      els.authError.textContent = err.message;
      els.authError.classList.remove('hidden');
    } finally {
      els.authSubmitBtn.disabled = false;
    }
  });

  // ---------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------
  function renderAnalyticsGate() {
    els.analyticsLocked.classList.toggle('hidden', state.isAuthenticated);
    els.analyticsContent.classList.toggle('hidden', !state.isAuthenticated);
  }

  async function loadAnalytics() {
    renderAnalyticsGate();
    if (!state.isAuthenticated) return;

    try {
      const json = await api('/products/analytics/summary');
      const data = json.data;

      els.statTotal.textContent = data.totalProducts;
      els.statOOS.textContent = data.outOfStockCount;
      els.statAvg.textContent = `₹${Number(data.averagePrice).toLocaleString('en-IN')}`;
      els.statHigh.textContent = `₹${Number(data.highestPrice).toLocaleString('en-IN')}`;
      els.statLow.textContent = `₹${Number(data.lowestPrice).toLocaleString('en-IN')}`;

      els.categoryBars.innerHTML = '';
      const maxCount = Math.max(...data.productsPerCategory.map((c) => c.count), 1);

      data.productsPerCategory.forEach((cat) => {
        const row = document.createElement('div');
        row.className = 'category-bar-row';
        row.innerHTML = `
          <span class="category-bar-name">${escapeHtml(cat.category)}</span>
          <div class="category-bar-track">
            <div class="category-bar-fill" style="width:${(cat.count / maxCount) * 100}%"></div>
          </div>
          <span class="category-bar-count">${cat.count}</span>
        `;
        els.categoryBars.appendChild(row);
      });

      if (!data.productsPerCategory.length) {
        els.categoryBars.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;">No category data yet.</p>';
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // ---------------------------------------------------------
  // Init
  // ---------------------------------------------------------
  function init() {
    state.isAuthenticated = !!getToken();
    updateAuthUI();
    loadProducts();
  }

  init();
})();
