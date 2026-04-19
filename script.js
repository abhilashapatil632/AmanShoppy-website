(function () {
  "use strict";

  const PAGE = document.body.dataset.page || "index";

  const carouselSections = ["newArrivals", "bestSellers", "womensPerfumes"];

  const products = [
    { sectionId: "newArrivals", name: "Oud Aoa Arpay Spray", price: 1499, image: "images/oud.jpg", rating: 5 },
    { sectionId: "newArrivals", name: "Hawas", price: 1998, image: "images/hawas.jpeg", rating: 4 },
    { sectionId: "newArrivals", name: "BVLGARI AQVA Style", price: 1999, image: "images/Aqva.jpeg", rating: 5 },
    { sectionId: "newArrivals", name: "BLU", price: 2400, image: "images/blu.jpeg", rating: 4 },
    { sectionId: "newArrivals", name: "Aristocrat", price: 4000, image: "images/Aristocart.jpeg", rating: 5 },
    { sectionId: "newArrivals", name: "Blue by AHMED", price: 1899, image: "images/blueby.jpeg", rating: 4 },
    { sectionId: "bestSellers", name: "Hawas", price: 1998, image: "images/hawas.jpeg", rating: 5 },
    { sectionId: "bestSellers", name: "Aristocrat", price: 4000, image: "images/Aristocart.jpeg", rating: 5 },
    { sectionId: "bestSellers", name: "BELLAVITA WHITE", price: 500, image: "images/belavita.jpeg", rating: 4 },
    { sectionId: "bestSellers", name: "KISWAH", price: 2899, image: "images/kiswah.jpeg", rating: 4 },
    { sectionId: "bestSellers", name: "MISK RIJALI", price: 999, image: "images/misk-rijali.jpeg", rating: 5 },
    { sectionId: "bestSellers", name: "SILVER SHADE", price: 1100, image: "images/silverShade.jpeg", rating: 4 },
    { sectionId: "womensPerfumes", name: "4EVER", price: 899, image: "images/forever.jpeg", rating: 4 },
    { sectionId: "womensPerfumes", name: "MUSK ROSE", price: 800, image: "images/musk-rose.jpeg", rating: 5 },
    { sectionId: "womensPerfumes", name: "ISLAND", price: 2000, image: "images/island.jpeg", rating: 5 },
    { sectionId: "womensPerfumes", name: "AQUA", price: 1200, image: "images/aqua.jpeg", rating: 4 },
    { sectionId: "womensPerfumes", name: "SAPPHIRE", price: 1999, image: "images/Sapphira.jpeg", rating: 4 },
    { sectionId: "womensPerfumes", name: "TEMPEST", price: 600, image: "images/tempest.jpeg", rating: 5 }
  ].map((product, index) => ({
    ...product,
    id: `${product.sectionId}-${index}`
  }));

  let cart = [];
  let wishlist = new Set();
  let isLoggedIn = false;

  let heroSlides = [];
  let heroDotsWrap = null;
  let activeSlide = 0;
  let slideTimer = null;

  function loadPersistedState() {
    cart = JSON.parse(localStorage.getItem("amanCart") || "[]");
    wishlist = new Set(JSON.parse(localStorage.getItem("amanWishlist") || "[]"));
    isLoggedIn = localStorage.getItem("amanLoggedIn") === "true";
  }

  function saveState() {
    localStorage.setItem("amanCart", JSON.stringify(cart));
    localStorage.setItem("amanWishlist", JSON.stringify([...wishlist]));
  }

  function formatPrice(value) {
    return `Rs. ${value.toLocaleString("en-IN")}`;
  }

  function getOrders() {
    return JSON.parse(localStorage.getItem("amanOrders") || "[]");
  }

  function getUserProfile() {
    return JSON.parse(localStorage.getItem("amanUser") || "{}");
  }

  function saveUserProfile(profile) {
    localStorage.setItem("amanUser", JSON.stringify(profile));
  }

  function updateAuthLinks() {
    const loginL = document.getElementById("authLinkLogin");
    const accL = document.getElementById("authLinkAccount");
    const logoutB = document.getElementById("navLogoutBtn");
    if (loginL && accL && logoutB) {
      loginL.style.display = isLoggedIn ? "none" : "inline-block";
      accL.style.display = isLoggedIn ? "inline-block" : "none";
      logoutB.style.display = isLoggedIn ? "inline-block" : "none";
    }
  }

  function productTemplate(product) {
    const stars = "★".repeat(product.rating) + "☆".repeat(5 - product.rating);
    return `
      <article class="card" data-id="${product.id}" data-name="${product.name.toLowerCase()}">
        <button class="wish-btn ${wishlist.has(product.id) ? "active" : ""}" aria-label="Toggle wishlist for ${product.name}">♥</button>
        <div class="bottle">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <h3>${product.name}</h3>
        <p class="price">${formatPrice(product.price)}</p>
        <p class="rating" aria-label="${product.rating} star rating">${stars}</p>
        <button class="add-cart" aria-label="Add ${product.name} to cart">Add to Cart</button>
      </article>
    `;
  }

  function renderProducts() {
    carouselSections.forEach((sectionId) => {
      const track = document.getElementById(sectionId);
      if (!track) return;
      const list = products.filter((p) => p.sectionId === sectionId);
      track.innerHTML = list.map(productTemplate).join("");
    });
    bindProductEvents();
  }

  function bindProductEvents() {
    document.querySelectorAll(".wish-btn").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.closest(".card").dataset.id;
        if (wishlist.has(id)) wishlist.delete(id);
        else wishlist.add(id);
        btn.classList.toggle("active");
        updateWishlistCount();
        saveState();
        if (PAGE === "dashboard") refreshDashboardData();
      };
    });

    document.querySelectorAll(".add-cart").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.closest(".card").dataset.id;
        const item = cart.find((x) => x.id === id);
        if (item) item.qty += 1;
        else {
          const p = products.find((x) => x.id === id);
          cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
        }
        updateCartUI();
        saveState();
        if (PAGE === "dashboard") refreshDashboardData();
      };
    });
  }

  function updateWishlistCount() {
    const el = document.getElementById("wishCount");
    if (el) el.textContent = wishlist.size;
  }

  function updateOrdersBadge() {
    const badge = document.getElementById("ordersCount");
    if (!badge) return;
    badge.textContent = getOrders().length;
  }

  function renderOrders(filter = "all") {
    const ordersList = document.getElementById("ordersList");
    if (!ordersList) return;
    const orders = getOrders().slice().reverse();
    const filtered = filter === "all"
      ? orders
      : orders.filter((order) => (order.status || "placed") === filter);

    if (!filtered.length) {
      ordersList.innerHTML = `<div class="empty-orders">No orders yet. Start shopping!</div>`;
      return;
    }

    ordersList.innerHTML = filtered.map((order) => {
      const status = order.status || "placed";
      const statusClass = status === "delivered" ? "status-delivered" : "status-placed";
      const paymentMap = { cod: "Cash on Delivery", upi: "UPI", card: "Card Payment" };
      const paymentText = paymentMap[order.paymentMethod] || order.paymentMethod || "N/A";
      const dateText = new Date(order.date || order.createdAt || Date.now()).toLocaleString("en-IN");
      const addressText = order.address || `${order.customer?.address || ""}, ${order.customer?.city || ""} - ${order.customer?.pincode || ""}`;

      return `
        <article class="order-item" data-order-id="${order.id}">
          <div class="order-top">
            <strong style="color: var(--gold);">Order ID: ${order.id}</strong>
            <span class="status-pill ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div class="order-meta">
            <span>Date: ${dateText}</span>
            <span>Payment: ${paymentText}</span>
            <span>Total: ${formatPrice(order.total || order.totalAmount || 0)}</span>
            <span>Address: ${addressText}</span>
          </div>
          <ul class="order-items-list">
            ${(order.items || []).map((item) => `<li>${item.name} x ${item.qty}</li>`).join("")}
          </ul>
          <div class="order-actions">
            <button class="btn-outline" type="button" data-action="reorder" data-id="${order.id}">Reorder</button>
            <button class="btn-outline" type="button" data-action="delete-order" data-id="${order.id}">Delete</button>
          </div>
        </article>
      `;
    }).join("");
  }

  function updateDashboardOverview() {
    const totalOrders = getOrders().length;
    const totalWishlist = wishlist.size;
    const totalCart = cart.reduce((sum, item) => sum + item.qty, 0);
    const ordersNode = document.getElementById("dashTotalOrders");
    const wishNode = document.getElementById("dashTotalWishlist");
    const cartNode = document.getElementById("dashTotalCart");
    if (ordersNode) ordersNode.textContent = String(totalOrders);
    if (wishNode) wishNode.textContent = String(totalWishlist);
    if (cartNode) cartNode.textContent = String(totalCart);
  }

  function renderDashboardOrders() {
    const holder = document.getElementById("dashboardOrdersList");
    if (!holder) return;
    const orders = getOrders().slice().reverse();
    if (!orders.length) {
      holder.innerHTML = `<div class="empty-orders">No orders yet. Start shopping!</div>`;
      return;
    }

    holder.innerHTML = orders.map((order) => {
      const status = order.status || "placed";
      const statusClass = status === "delivered" ? "status-delivered" : "status-placed";
      const paymentMap = { cod: "Cash on Delivery", upi: "UPI", card: "Card Payment" };
      const paymentText = paymentMap[order.paymentMethod] || order.paymentMethod || "N/A";
      const dateText = new Date(order.date || order.createdAt || Date.now()).toLocaleString("en-IN");
      return `
        <article class="order-item">
          <div class="order-top">
            <strong style="color: var(--gold);">Order ID: ${order.id}</strong>
            <span class="status-pill ${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div class="order-meta">
            <span>Date: ${dateText}</span>
            <span>Total: ${formatPrice(order.total || order.totalAmount || 0)}</span>
            <span>Payment: ${paymentText}</span>
          </div>
          <ul class="order-items-list">
            ${(order.items || []).map((item) => `<li>${item.name} x ${item.qty}</li>`).join("")}
          </ul>
          <button class="btn-outline" type="button" data-dash-reorder="${order.id}">Reorder</button>
        </article>
      `;
    }).join("");
  }

  function renderDashboardWishlist() {
    const holder = document.getElementById("dashboardWishlistGrid");
    if (!holder) return;
    const wishProducts = products.filter((p) => wishlist.has(p.id));
    if (!wishProducts.length) {
      holder.innerHTML = `<div class="empty-orders">No wishlist items yet.</div>`;
      return;
    }

    holder.innerHTML = wishProducts.map((item) => `
      <article class="wish-dash-card">
        <div class="wish-dash-image"><img src="${item.image}" alt="${item.name}" loading="lazy"></div>
        <strong>${item.name}</strong>
        <span class="price">${formatPrice(item.price)}</span>
        <div style="display:flex; gap:8px; flex-wrap: wrap;">
          <button class="btn-gold" type="button" data-dash-add-cart="${item.id}">Add to Cart</button>
          <button class="btn-outline" type="button" data-dash-remove-wish="${item.id}">Remove</button>
        </div>
      </article>
    `).join("");
  }

  function fillProfileForm() {
    const user = getUserProfile();
    const fullName = document.getElementById("profileFullName");
    const email = document.getElementById("profileEmail");
    const phone = document.getElementById("profilePhone");
    const address = document.getElementById("profileAddress");
    if (!fullName || !email || !phone || !address) return;
    fullName.value = user.fullName || "";
    email.value = user.email || "";
    phone.value = user.phone || "";
    address.value = user.address || "";
  }

  function refreshDashboardData() {
    updateDashboardOverview();
    renderDashboardOrders();
    renderDashboardWishlist();
    fillProfileForm();
  }

  function updateCartUI() {
    const countEl = document.getElementById("cartCount");
    const totalEl = document.getElementById("cartTotal");
    const holder = document.getElementById("cartItems");
    if (!countEl || !totalEl || !holder) return;

    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    countEl.textContent = count;
    const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
    totalEl.textContent = formatPrice(total);

    if (!cart.length) {
      holder.innerHTML = `<p class="empty">Your cart is empty.<br>Start adding luxurious scents.</p>`;
      if (typeof updateCheckoutSummary === "function") updateCheckoutSummary();
      return;
    }

    holder.innerHTML = cart.map((item) => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong>
          <div>${formatPrice(item.price)}</div>
          <div class="qty" aria-label="Quantity controls for ${item.name}">
            <button data-action="minus" data-id="${item.id}" aria-label="Decrease quantity">-</button>
            <span>${item.qty}</span>
            <button data-action="plus" data-id="${item.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="icon-btn" style="width:30px;height:30px;" data-action="remove" data-id="${item.id}" aria-label="Remove ${item.name}">✕</button>
      </div>
    `).join("");

    holder.querySelectorAll("button[data-action]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const item = cart.find((x) => x.id === id);
        if (!item) return;
        if (action === "plus") item.qty += 1;
        if (action === "minus") item.qty -= 1;
        if (action === "remove" || item.qty <= 0) {
          const idx = cart.findIndex((x) => x.id === id);
          if (idx > -1) cart.splice(idx, 1);
        }
        updateCartUI();
        saveState();
        if (PAGE === "dashboard") refreshDashboardData();
      };
    });

    if (typeof updateCheckoutSummary === "function") updateCheckoutSummary();
  }

  function updateCheckoutSummary() {
    const summaryItems = document.getElementById("checkoutSummaryItems");
    const totalQtyNode = document.getElementById("checkoutTotalQty");
    const totalAmountNode = document.getElementById("checkoutTotalAmount");
    if (!summaryItems || !totalQtyNode || !totalAmountNode) return;

    if (!cart.length) {
      summaryItems.innerHTML = `<p class="empty" style="margin-top: 0;">No items in cart.</p>`;
      totalQtyNode.textContent = "0";
      totalAmountNode.textContent = "Rs. 0";
      return;
    }

    summaryItems.innerHTML = cart.map((item) => `
      <div class="summary-item">
        <span>${item.name} x ${item.qty}</span>
        <span>${formatPrice(item.price * item.qty)}</span>
      </div>
    `).join("");

    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
    totalQtyNode.textContent = String(totalQty);
    totalAmountNode.textContent = formatPrice(totalAmount);
  }

  function renderDots() {
    if (!heroDotsWrap || !heroSlides.length) return;
    heroDotsWrap.innerHTML = heroSlides.map((_, i) => `<button class="hero-dot ${i === activeSlide ? "active" : ""}" data-slide="${i}" aria-label="Go to slide ${i + 1}"></button>`).join("");
    heroDotsWrap.querySelectorAll(".hero-dot").forEach((dot) => {
      dot.onclick = () => {
        activeSlide = Number(dot.dataset.slide);
        showSlide(activeSlide);
        restartSlider();
      };
    });
  }

  function showSlide(index) {
    if (!heroSlides.length) return;
    heroSlides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    if (heroDotsWrap) {
      heroDotsWrap.querySelectorAll(".hero-dot").forEach((dot, i) => dot.classList.toggle("active", i === index));
    }
  }

  function nextSlide(step = 1) {
    if (!heroSlides.length) return;
    activeSlide = (activeSlide + step + heroSlides.length) % heroSlides.length;
    showSlide(activeSlide);
  }

  function restartSlider() {
    if (PAGE !== "index" || !heroSlides.length) return;
    clearInterval(slideTimer);
    slideTimer = setInterval(() => nextSlide(1), 4000);
  }

  function toggleOverlay(show) {
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.classList.toggle("show", show);
  }

  function filterProducts(term) {
    document.querySelectorAll(".card").forEach((card) => {
      card.style.display = card.dataset.name.includes(term) ? "grid" : "none";
    });
  }

  function setupReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    }, { threshold: 0.2 });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  }

  function bindCommerceAndCheckout() {
    const cartDrawer = document.getElementById("cartDrawer");
    const mobileDrawer = document.getElementById("mobileDrawer");
    const checkoutModal = document.getElementById("checkoutModal");
    const checkoutForm = document.getElementById("checkoutForm");
    const checkoutOpen = document.getElementById("checkoutOpen");
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    const paymentMethodInputs = document.querySelectorAll("input[name='paymentMethod']");
    const upiSection = document.getElementById("upiSection");
    const cardSection = document.getElementById("cardSection");

    if (!cartDrawer || !checkoutModal || !checkoutForm || !checkoutOpen || !placeOrderBtn) return;

    const closeCheckoutModal = () => {
      checkoutModal.classList.remove("open");
      checkoutModal.setAttribute("aria-hidden", "true");
    };

    const openCheckoutModal = () => {
      updateCheckoutSummary();
      checkoutModal.classList.add("open");
      checkoutModal.setAttribute("aria-hidden", "false");
      const fn = document.getElementById("fullName");
      if (fn) fn.focus();
    };

    const togglePaymentSections = () => {
      const selected = document.querySelector("input[name='paymentMethod']:checked")?.value || "cod";
      if (upiSection) upiSection.classList.toggle("active", selected === "upi");
      if (cardSection) cardSection.classList.toggle("active", selected === "card");
    };

    const clearCheckoutErrors = () => {
      ["nameError", "phoneError", "addressError", "cityError", "pincodeError", "upiError", "cardError", "expiryError", "cvvError"].forEach((id) => {
        const node = document.getElementById(id);
        if (node) node.textContent = "";
      });
    };

    const checkoutFormIsComplete = () => {
      const fullName = document.getElementById("fullName")?.value.trim() || "";
      const phone = document.getElementById("phoneNumber")?.value.trim() || "";
      const address = document.getElementById("address")?.value.trim() || "";
      const city = document.getElementById("city")?.value.trim() || "";
      const pin = document.getElementById("pincode")?.value.trim() || "";
      const method = document.querySelector("input[name='paymentMethod']:checked")?.value || "cod";
      if (!fullName || !phone || !address || !city || !pin) return false;
      if (method === "upi" && !(document.getElementById("upiId")?.value.trim())) return false;
      if (method === "card") {
        if (!document.getElementById("cardNumber")?.value.trim()) return false;
        if (!document.getElementById("expiryDate")?.value.trim()) return false;
        if (!document.getElementById("cvv")?.value.trim()) return false;
      }
      return true;
    };

    const updatePlaceOrderState = () => {
      placeOrderBtn.disabled = !checkoutFormIsComplete() || cart.length === 0;
    };

    const cartToggle = document.getElementById("cartToggle");
    if (cartToggle) {
      cartToggle.onclick = () => {
        const open = !cartDrawer.classList.contains("open");
        cartDrawer.classList.toggle("open", open);
        if (mobileDrawer) mobileDrawer.classList.remove("open");
        toggleOverlay(open);
      };
    }

    if (mobileDrawer) {
      const openMobile = document.getElementById("openMobile");
      const closeMobile = document.getElementById("closeMobile");
      if (openMobile) {
        openMobile.onclick = () => {
          const open = !mobileDrawer.classList.contains("open");
          mobileDrawer.classList.toggle("open", open);
          cartDrawer.classList.remove("open");
          toggleOverlay(open);
        };
      }
      if (closeMobile) {
        closeMobile.onclick = () => {
          mobileDrawer.classList.remove("open");
          toggleOverlay(false);
        };
      }
    }

    const overlay = document.getElementById("overlay");
    if (overlay) {
      overlay.onclick = () => {
        cartDrawer.classList.remove("open");
        if (mobileDrawer) mobileDrawer.classList.remove("open");
        toggleOverlay(false);
      };
    }

    if (checkoutOpen) {
      checkoutOpen.onclick = () => {
        if (!cart.length) {
          alert("Your cart is empty.");
          return;
        }
        openCheckoutModal();
        updatePlaceOrderState();
      };
    }

    const closeCh = document.getElementById("closeCheckout");
    const cancelCh = document.getElementById("cancelCheckout");
    if (closeCh) closeCh.onclick = closeCheckoutModal;
    if (cancelCh) cancelCh.onclick = closeCheckoutModal;

    checkoutModal.addEventListener("click", (event) => {
      if (event.target === checkoutModal) closeCheckoutModal();
    });

    paymentMethodInputs.forEach((input) => {
      input.addEventListener("change", () => {
        togglePaymentSections();
        clearCheckoutErrors();
        updatePlaceOrderState();
      });
    });

    checkoutForm.addEventListener("input", updatePlaceOrderState);

    placeOrderBtn.addEventListener("click", () => {
      clearCheckoutErrors();

      const fullName = document.getElementById("fullName").value.trim();
      const phone = document.getElementById("phoneNumber").value.trim();
      const address = document.getElementById("address").value.trim();
      const city = document.getElementById("city").value.trim();
      const pincode = document.getElementById("pincode").value.trim();
      const method = document.querySelector("input[name='paymentMethod']:checked")?.value || "cod";
      const upiId = document.getElementById("upiId").value.trim();
      const cardNumber = document.getElementById("cardNumber").value.trim().replace(/\s+/g, "");
      const expiryDate = document.getElementById("expiryDate").value.trim();
      const cvv = document.getElementById("cvv").value.trim();
      let valid = true;

      if (fullName.length < 2) { document.getElementById("nameError").textContent = "Enter your full name."; valid = false; }
      if (!/^\d{10}$/.test(phone)) { document.getElementById("phoneError").textContent = "Enter a valid 10-digit phone number."; valid = false; }
      if (address.length < 6) { document.getElementById("addressError").textContent = "Enter a complete address."; valid = false; }
      if (city.length < 2) { document.getElementById("cityError").textContent = "Enter a valid city."; valid = false; }
      if (!/^\d{6}$/.test(pincode)) { document.getElementById("pincodeError").textContent = "Pincode must be 6 digits."; valid = false; }

      if (method === "upi" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
        document.getElementById("upiError").textContent = "Enter a valid UPI ID.";
        valid = false;
      }

      if (method === "card") {
        if (!/^\d{16}$/.test(cardNumber)) { document.getElementById("cardError").textContent = "Card number must be 16 digits."; valid = false; }
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) { document.getElementById("expiryError").textContent = "Use MM/YY format."; valid = false; }
        if (!/^\d{3,4}$/.test(cvv)) { document.getElementById("cvvError").textContent = "Enter a valid CVV."; valid = false; }
      }

      if (!cart.length) valid = false;
      if (!valid) return;

      const orderTotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
      const orderQty = cart.reduce((sum, item) => sum + item.qty, 0);
      const orders = JSON.parse(localStorage.getItem("amanOrders") || "[]");
      orders.push({
        id: `ORD-${Date.now()}`,
        customer: { fullName, phone, address, city, pincode },
        paymentMethod: method,
        items: cart.map((item) => ({ ...item })),
        totalQty: orderQty,
        totalAmount: orderTotal,
        total: orderTotal,
        address: `${address}, ${city} - ${pincode}`,
        status: "placed",
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("amanOrders", JSON.stringify(orders));
      updateOrdersBadge();

      cart.splice(0, cart.length);
      saveState();
      updateCartUI();
      checkoutForm.reset();
      togglePaymentSections();
      updatePlaceOrderState();
      closeCheckoutModal();
      cartDrawer.classList.remove("open");
      toggleOverlay(false);
      alert("Order Placed Successfully");
    });

    togglePaymentSections();
    updatePlaceOrderState();
  }

  function setupIndexPage() {
    const searchWrap = document.getElementById("searchWrap");
    const searchInput = document.getElementById("searchInput");
    const ordersModal = document.getElementById("ordersModal");
    const ordersList = document.getElementById("ordersList");

    if (searchWrap && searchInput) {
      document.getElementById("searchToggle").onclick = () => {
        searchWrap.classList.add("open");
        searchInput.focus();
      };
      document.getElementById("closeSearch").onclick = () => {
        searchWrap.classList.remove("open");
        searchInput.value = "";
        filterProducts("");
      };
      document.getElementById("wishlistToggle").onclick = () => {
        searchWrap.classList.add("open");
        searchInput.focus();
      };
      searchInput.addEventListener("input", (e) => filterProducts(e.target.value.toLowerCase()));
    }

    if (ordersModal && ordersList) {
      const closeOrdersModal = () => {
        ordersModal.classList.remove("open");
        ordersModal.setAttribute("aria-hidden", "true");
      };

      const openOrdersModal = () => {
        renderOrders(document.querySelector(".order-filter-btn.active")?.dataset.filter || "all");
        ordersModal.classList.add("open");
        ordersModal.setAttribute("aria-hidden", "false");
      };

      const ordersToggle = document.getElementById("ordersToggle");
      if (ordersToggle) ordersToggle.onclick = () => openOrdersModal();

      const closeOrders = document.getElementById("closeOrders");
      if (closeOrders) closeOrders.onclick = closeOrdersModal;

      ordersModal.addEventListener("click", (event) => {
        if (event.target === ordersModal) closeOrdersModal();
      });

      document.querySelectorAll(".order-filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".order-filter-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          renderOrders(btn.dataset.filter);
        });
      });

      ordersList.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        const id = button.dataset.id;
        const orders = getOrders();
        const matchIndex = orders.findIndex((order) => order.id === id);
        if (matchIndex < 0) return;

        if (action === "delete-order") {
          orders.splice(matchIndex, 1);
          localStorage.setItem("amanOrders", JSON.stringify(orders));
          updateOrdersBadge();
          renderOrders(document.querySelector(".order-filter-btn.active")?.dataset.filter || "all");
        }

        if (action === "reorder") {
          const order = orders[matchIndex];
          (order.items || []).forEach((item) => {
            const existing = cart.find((c) => c.id === item.id);
            if (existing) existing.qty += item.qty;
            else cart.push({ id: item.id, name: item.name, price: item.price, qty: item.qty });
          });
          saveState();
          updateCartUI();
          closeOrdersModal();
          alert("Items added to cart.");
        }
      });
    }

    const navLogoutBtn = document.getElementById("navLogoutBtn");
    if (navLogoutBtn) {
      navLogoutBtn.onclick = () => {
        isLoggedIn = false;
        localStorage.setItem("amanLoggedIn", "false");
        updateAuthLinks();
        window.location.href = "index.html";
      };
    }

    const prevSlideBtn = document.getElementById("prevSlide");
    const nextSlideBtn = document.getElementById("nextSlide");
    if (prevSlideBtn && nextSlideBtn && heroSlides.length) {
      prevSlideBtn.onclick = () => { nextSlide(-1); restartSlider(); };
      nextSlideBtn.onclick = () => { nextSlide(1); restartSlider(); };
    }

    document.querySelectorAll(".section-arrow").forEach((btn) => {
      btn.onclick = () => {
        const track = document.getElementById(btn.dataset.track);
        const dir = Number(btn.dataset.dir);
        if (track) track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: "smooth" });
      };
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (searchWrap) searchWrap.classList.remove("open");
        const cartDrawer = document.getElementById("cartDrawer");
        const mobileDrawer = document.getElementById("mobileDrawer");
        if (cartDrawer) cartDrawer.classList.remove("open");
        if (mobileDrawer) mobileDrawer.classList.remove("open");
        const checkoutModal = document.getElementById("checkoutModal");
        if (checkoutModal) checkoutModal.classList.remove("open");
        const ordersModalEl = document.getElementById("ordersModal");
        if (ordersModalEl) {
          ordersModalEl.classList.remove("open");
          ordersModalEl.setAttribute("aria-hidden", "true");
        }
        toggleOverlay(false);
      }
    });

    updateOrdersBadge();
    renderOrders();
  }

  function setupDashboardPage() {
    const profileForm = document.getElementById("profileForm");
    const dashOrders = document.getElementById("dashboardOrdersList");
    const dashWish = document.getElementById("dashboardWishlistGrid");

    if (dashOrders) {
      dashOrders.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-dash-reorder]");
        if (!button) return;
        const orderId = button.dataset.dashReorder;
        const order = getOrders().find((o) => o.id === orderId);
        if (!order) return;
        (order.items || []).forEach((item) => {
          const existing = cart.find((c) => c.id === item.id);
          if (existing) existing.qty += item.qty;
          else cart.push({ id: item.id, name: item.name, price: item.price, qty: item.qty });
        });
        saveState();
        updateCartUI();
        refreshDashboardData();
        alert("Items added to cart.");
      });
    }

    if (dashWish) {
      dashWish.addEventListener("click", (event) => {
        const addButton = event.target.closest("button[data-dash-add-cart]");
        const removeButton = event.target.closest("button[data-dash-remove-wish]");

        if (addButton) {
          const id = addButton.dataset.dashAddCart;
          const product = products.find((p) => p.id === id);
          if (!product) return;
          const existing = cart.find((c) => c.id === id);
          if (existing) existing.qty += 1;
          else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
          saveState();
          updateCartUI();
          refreshDashboardData();
        }

        if (removeButton) {
          const id = removeButton.dataset.dashRemoveWish;
          wishlist.delete(id);
          saveState();
          updateWishlistCount();
          refreshDashboardData();
        }
      });
    }

    if (profileForm) {
      profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const fullName = document.getElementById("profileFullName").value.trim();
        const email = document.getElementById("profileEmail").value.trim();
        const phone = document.getElementById("profilePhone").value.trim();
        const address = document.getElementById("profileAddress").value.trim();
        if (!fullName || !email || !phone || !address) return;
        saveUserProfile({ fullName, email, phone, address });
        const msg = document.getElementById("profileMsg");
        if (msg) msg.textContent = "Profile Updated";
        setTimeout(() => { if (msg) msg.textContent = ""; }, 2200);
      });
    }

    document.querySelectorAll(".dash-nav-btn[data-dash-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.dashTab;
        document.querySelectorAll(".dash-nav-btn[data-dash-tab]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".dash-panel").forEach((panel) => panel.classList.remove("active"));
        const target = document.getElementById(`dash-${tab}`);
        if (target) target.classList.add("active");
        if (tab === "orders" || tab === "wishlist" || tab === "overview") refreshDashboardData();
      });
    });

    const logout = () => {
      isLoggedIn = false;
      localStorage.setItem("amanLoggedIn", "false");
      window.location.href = "index.html";
    };

    const navLogout = document.getElementById("navLogoutBtn");
    const dashLogout = document.getElementById("dashboardLogoutBtn");
    const mobileLogout = document.getElementById("mobileLogoutBtn");
    if (navLogout) navLogout.onclick = logout;
    if (dashLogout) dashLogout.onclick = logout;
    if (mobileLogout) mobileLogout.onclick = logout;

    const wishlistTabBtn = document.querySelector('.dash-nav-btn[data-dash-tab="wishlist"]');
    const wishlistToggleDash = document.getElementById("wishlistToggle");
    if (wishlistToggleDash && wishlistTabBtn) {
      wishlistToggleDash.onclick = () => wishlistTabBtn.click();
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const cartDrawer = document.getElementById("cartDrawer");
        const mobileDrawer = document.getElementById("mobileDrawer");
        if (cartDrawer) cartDrawer.classList.remove("open");
        if (mobileDrawer) mobileDrawer.classList.remove("open");
        const checkoutModal = document.getElementById("checkoutModal");
        if (checkoutModal) checkoutModal.classList.remove("open");
        toggleOverlay(false);
      }
    });
  }

  function initLoginPage() {
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const rememberInput = document.getElementById("rememberMe");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");

    if (!loginForm) return;

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      emailError.textContent = "";
      passwordError.textContent = "";

      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const passwordValid = password.length >= 6;

      if (!emailValid) emailError.textContent = "Please enter a valid email address.";
      if (!passwordValid) passwordError.textContent = "Password must be at least 6 characters.";
      if (!emailValid || !passwordValid) return;

      localStorage.setItem("amanLoggedIn", "true");
      localStorage.setItem("amanRememberMe", rememberInput.checked ? "true" : "false");
      const user = getUserProfile();
      saveUserProfile({ ...user, email });
      loginForm.reset();
      alert("Login Successful");
      window.location.href = "index.html";
    });
  }

  function initIndexPage() {
    loadPersistedState();
    heroSlides = [...document.querySelectorAll(".slide")];
    heroDotsWrap = document.getElementById("heroDots");

    renderProducts();
    renderDots();
    showSlide(activeSlide);
    restartSlider();

    bindCommerceAndCheckout();
    setupIndexPage();
    setupReveal();

    updateWishlistCount();
    updateCartUI();
    updateAuthLinks();
  }

  function initDashboardPage() {
    loadPersistedState();
    if (!isLoggedIn) {
      window.location.href = "login.html";
      return;
    }

    refreshDashboardData();
    bindCommerceAndCheckout();
    setupDashboardPage();

    updateWishlistCount();
    updateCartUI();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (PAGE === "login") {
      initLoginPage();
      return;
    }
    if (PAGE === "dashboard") {
      initDashboardPage();
      return;
    }
    initIndexPage();
  });
})();
