(function () {
  "use strict";

  const CART_KEY = "tanvicrafts-cart";

  const state = {
    store: { name: "Tanvi Crafts", whatsappNumber: "" },
    products: [],
    category: "All",
    cart: loadCart(), // { [productId]: quantity }
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    grid: $("productGrid"),
    filters: $("filters"),
    cartButton: $("cartButton"),
    cartCount: $("cartCount"),
    drawer: $("cartDrawer"),
    overlay: $("overlay"),
    closeCart: $("closeCart"),
    cartItems: $("cartItems"),
    checkoutForm: $("checkoutForm"),
    checkoutBtn: $("checkoutBtn"),
    clearCart: $("clearCart"),
    toast: $("toast"),
    lightbox: $("lightbox"),
    lightboxStage: $("lightboxStage"),
    lightboxImg: $("lightboxImg"),
    lightboxTitle: $("lightboxTitle"),
    lightboxAdd: $("lightboxAdd"),
    lightboxClose: $("lightboxClose"),
  };

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
    } catch (e) {
      /* storage unavailable — cart lives for this page view only */
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  function whatsappUrl(text) {
    const number = String(state.store.whatsappNumber).replace(/\D/g, "");
    const query = text ? "?text=" + encodeURIComponent(text) : "";
    return "https://wa.me/" + number + query;
  }

  function findProduct(id) {
    return state.products.find((p) => p.id === id);
  }

  // ---------- Analytics ----------
  // No-ops when gtag is blocked or still loading, so the shop never breaks.

  function track(name, params) {
    if (typeof window.gtag === "function") window.gtag("event", name, params || {});
  }

  function itemOf(p, qty) {
    return {
      item_id: p.id,
      item_name: p.name,
      item_category: p.category || "",
      quantity: qty || 1,
    };
  }

  // ---------- Products ----------

  function renderFilters() {
    const categories = ["All", ...new Set(state.products.map((p) => p.category).filter(Boolean))];
    if (categories.length <= 2) {
      els.filters.hidden = true;
      return;
    }
    els.filters.innerHTML = categories
      .map((c) => `<button class="chip" role="tab" data-category="${escapeHtml(c)}" aria-selected="${c === state.category}">${escapeHtml(c)}</button>`)
      .join("");
  }

  function renderProducts() {
    const list = state.category === "All"
      ? state.products
      : state.products.filter((p) => p.category === state.category);

    if (!list.length) {
      els.grid.innerHTML = '<p class="status">No products here yet.</p>';
      return;
    }

    els.grid.innerHTML = list.map((p) => {
      const inStock = p.inStock !== false;
      return `
        <article class="card">
          <div class="card-img">
            <button type="button" class="card-zoom" data-view="${escapeHtml(p.id)}" aria-label="View larger photo of ${escapeHtml(p.name)}">
              <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
            </button>
            ${inStock
              ? (p.category ? `<span class="badge">${escapeHtml(p.category)}</span>` : "")
              : '<span class="badge out">Sold out</span>'}
          </div>
          <div class="card-body">
            <h3>${escapeHtml(p.name)}</h3>
            <p>${escapeHtml(p.description || "")}</p>
            <div class="card-foot">
              <button class="btn" data-add="${escapeHtml(p.id)}" ${inStock ? "" : "disabled"}>
                ${inStock ? "Add to enquiry" : "Sold out"}
              </button>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  // ---------- Photo viewer ----------

  function openLightbox(id) {
    const p = findProduct(id);
    if (!p) return;
    const inStock = p.inStock !== false;
    els.lightboxImg.src = p.image;
    els.lightboxImg.alt = p.name;
    els.lightboxTitle.textContent = p.name;
    els.lightboxAdd.dataset.add = p.id;
    els.lightboxAdd.disabled = !inStock;
    els.lightboxAdd.textContent = inStock ? "Add to enquiry" : "Sold out";
    els.lightboxStage.classList.remove("zoomed");
    els.lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    els.lightboxClose.focus();
    track("view_item", { items: [itemOf(p)] });
  }

  function closeLightbox() {
    els.lightbox.hidden = true;
    els.lightboxStage.classList.remove("zoomed");
    document.body.style.overflow = "";
  }

  // Zoom towards the pointer, and pan by moving the mouse or dragging a finger.
  function setZoomOrigin(e) {
    const r = els.lightboxStage.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    els.lightboxImg.style.transformOrigin = `${x}% ${y}%`;
  }

  // ---------- Cart ----------

  function cartLines() {
    return Object.entries(state.cart)
      .map(([id, qty]) => ({ product: findProduct(id), qty }))
      .filter((line) => line.product && line.qty > 0);
  }

  function renderCart() {
    const lines = cartLines();
    const count = lines.reduce((n, l) => n + l.qty, 0);

    els.cartCount.textContent = count;
    els.checkoutBtn.disabled = lines.length === 0;
    els.clearCart.hidden = lines.length === 0;

    if (!lines.length) {
      els.cartItems.innerHTML = '<p class="cart-empty">Your enquiry list is empty.<br>Add something handmade!</p>';
      return;
    }

    els.cartItems.innerHTML = lines.map(({ product: p, qty }) => `
      <div class="cart-item">
        <img src="${escapeHtml(p.image)}" alt="">
        <div>
          <h4>${escapeHtml(p.name)}</h4>
          <div class="qty">
            <button type="button" data-dec="${escapeHtml(p.id)}" aria-label="Decrease quantity">−</button>
            <span>${qty}</span>
            <button type="button" data-inc="${escapeHtml(p.id)}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button type="button" class="remove" data-remove="${escapeHtml(p.id)}">Remove</button>
      </div>`).join("");
  }

  function setQty(id, qty) {
    if (qty <= 0) delete state.cart[id];
    else state.cart[id] = qty;
    saveCart();
    renderCart();
  }

  function addToCart(id) {
    const product = findProduct(id);
    if (!product) return;
    setQty(id, (state.cart[id] || 0) + 1);
    els.cartCount.classList.remove("bump");
    void els.cartCount.offsetWidth; // restart animation
    els.cartCount.classList.add("bump");
    showToast(`Added “${product.name}” to enquiry`);
    track("add_to_cart", { items: [itemOf(product)] });
  }

  function openCart() {
    els.drawer.classList.add("open");
    els.drawer.setAttribute("aria-hidden", "false");
    els.overlay.hidden = false;
  }

  function closeCart() {
    els.drawer.classList.remove("open");
    els.drawer.setAttribute("aria-hidden", "true");
    els.overlay.hidden = true;
  }

  let toastTimer;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  function buildOrderMessage(name, notes) {
    const lines = cartLines();
    const parts = [`Hello ${state.store.name}! I'd like to enquire about:`, ""];
    lines.forEach((l, i) => {
      parts.push(`${i + 1}. ${l.product.name} × ${l.qty}`);
    });
    parts.push("", "Could you share price and availability?");
    if (name) parts.push("", `Name: ${name}`);
    if (notes) parts.push(`Message: ${notes}`);
    return parts.join("\n");
  }

  function checkout(event) {
    event.preventDefault();
    const lines = cartLines();
    if (!lines.length) return;
    const data = new FormData(els.checkoutForm);
    const message = buildOrderMessage(
      String(data.get("name") || "").trim(),
      String(data.get("notes") || "").trim()
    );
    track("begin_checkout", {
      items: lines.map((l) => itemOf(l.product, l.qty)),
      item_count: lines.reduce((n, l) => n + l.qty, 0),
    });
    window.open(whatsappUrl(message), "_blank", "noopener");
  }

  // ---------- Events ----------

  function bindEvents() {
    els.grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (btn) addToCart(btn.dataset.add);
      const view = e.target.closest("[data-view]");
      if (view) openLightbox(view.dataset.view);
    });

    els.lightboxClose.addEventListener("click", closeLightbox);
    els.lightboxAdd.addEventListener("click", () => addToCart(els.lightboxAdd.dataset.add));
    els.lightboxStage.addEventListener("click", (e) => {
      setZoomOrigin(e);
      els.lightboxStage.classList.toggle("zoomed");
    });
    els.lightboxStage.addEventListener("pointermove", (e) => {
      if (els.lightboxStage.classList.contains("zoomed")) setZoomOrigin(e);
    });

    els.filters.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-category]");
      if (!chip) return;
      state.category = chip.dataset.category;
      renderFilters();
      renderProducts();
    });

    els.cartItems.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const { inc, dec, remove } = t.dataset;
      if (inc) setQty(inc, (state.cart[inc] || 0) + 1);
      if (dec) setQty(dec, (state.cart[dec] || 0) - 1);
      if (remove) {
        const p = findProduct(remove);
        if (p) track("remove_from_cart", { items: [itemOf(p, state.cart[remove])] });
        setQty(remove, 0);
      }
    });

    els.cartButton.addEventListener("click", openCart);
    els.closeCart.addEventListener("click", closeCart);
    els.overlay.addEventListener("click", closeCart);
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!els.lightbox.hidden) closeLightbox();
      else closeCart();
    });
    els.checkoutForm.addEventListener("submit", checkout);
    els.clearCart.addEventListener("click", () => {
      state.cart = {};
      saveCart();
      renderCart();
    });
  }

  // ---------- Init ----------

  function init() {
    $("year").textContent = new Date().getFullYear();
    bindEvents();

    const data = window.STORE_DATA;
    if (!data) {
      els.grid.innerHTML = '<p class="status">Could not load products. Please try again later.</p>';
      console.error("products.js is missing or has a syntax error");
      renderCart();
      return;
    }
    state.store = { ...state.store, ...(data.store || {}) };
    state.products = data.products || [];

    const chatLink = whatsappUrl(`Hi ${state.store.name}! I have a question.`);
    [$("whatsappFab"), $("footerWhatsapp")].forEach((a) => {
      a.href = chatLink;
      a.addEventListener("click", () => track("contact_whatsapp", { link_id: a.id }));
    });

    // Drop cart entries for products that no longer exist.
    Object.keys(state.cart).forEach((id) => { if (!findProduct(id)) delete state.cart[id]; });
    saveCart();

    renderFilters();
    renderProducts();
    renderCart();
  }

  init();
})();
