/* ----- Utility / state ----- */
let cart = [];


/* ----- Persistence ----- */
function loadCart() {
  try {
    const storedCart = localStorage.getItem("cart");
    cart = storedCart ? JSON.parse(storedCart) : [];
  } catch (e) {
    cart = [];
  }
}

function saveCart() {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (e) {
  }
}

function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  if (!countEl) return;

  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  countEl.textContent = totalQty.toString();

}

/* ----- Add item (WITH GROUPING) ----- */
function addItemToCart(product) {
  const existing = cart.find(item =>
    item.name === product.name &&
    item.price === product.price
  );

  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    product.quantity = 1;
    cart.push(product);
  }

  saveCart();
  updateCartCount();
  renderSidebarCart();
}

/* ----- Remove item (reduces quantity) ----- */
function removeItemFromCart(index) {
  const item = cart[index];
  if (!item) return;

  if ((item.quantity || 1) > 1) {
    item.quantity--;
  } else {
    cart.splice(index, 1);
  }

  saveCart();
  updateCartCount();
  renderSidebarCart();
  renderCartPage();
}

/* ----- Add-to-cart buttons ----- */
function setupAddToCartButtons() {
  const buttons = document.querySelectorAll(".add-to-cart");
  if (!buttons || buttons.length === 0) {
    return;
  }

  buttons.forEach(button => {
    if (!button._cartBound) {
      button._cartBound = true;
      button.addEventListener("click", () => {
        const name = button.dataset.name || "Unknown";
        const price = Number(button.dataset.price) || 0;
        const image = button.dataset.image || "";
        const thumbnail = button.dataset.thumb || image; // fallback

        addItemToCart({ name, price, image, thumbnail });
      });
    }
  });
}

/* ----- Sidebar rendering (FULLY FIXED) ----- */
function renderSidebarCart() {
  ensureSidebarExists();

  const itemsBox = document.getElementById("sidebar-items");
  const totalSpan = document.getElementById("sidebar-total");
  if (!itemsBox) return;

  itemsBox.innerHTML = "";

  if (!cart.length) {
    itemsBox.innerHTML = "<p>Your cart is empty.</p>";
    if (totalSpan) totalSpan.textContent = "0.00";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const qty = item.quantity || 1;
    const lineTotal = item.price * qty;
    total += lineTotal;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.marginBottom = "10px";

    row.innerHTML = `
      <img src="${escapeHtml(item.image || '')}"
           alt="${escapeHtml(item.name || '')}"
           style="width:56px;height:56px;object-fit:cover;margin-right:8px;">

      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;">
          ${escapeHtml(item.name)}
          ${qty > 1 ? `<span style="opacity:0.6">×${qty}</span>` : ""}
        </div>
        <div style="font-size:13px;">
          $${lineTotal.toFixed(2)}
        </div>
      </div>

      <button class="remove" data-index="${index}" style="margin-left:8px;">X</button>
    `;

    itemsBox.appendChild(row);
  });

  if (totalSpan) totalSpan.textContent = total.toFixed(2);

  itemsBox.querySelectorAll(".remove").forEach(btn => {
    if (!btn._bound) {
      btn._bound = true;
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.index);
        if (!Number.isNaN(i)) removeItemFromCart(i);
      });
    }
  });
}

/* ----- Sidebar open/close ----- */
function openSidebarCart() {
  ensureSidebarExists();
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");
  if (sidebar) sidebar.classList.add("show");
  if (overlay) overlay.classList.add("show");
  renderSidebarCart();
}

function closeSidebarCart() {
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");
  if (sidebar) sidebar.classList.remove("show");
  if (overlay) overlay.classList.remove("show");
}

function setupSidebarControls() {
  const cartButton = document.getElementById("cart-btn");
  const closeBtn = document.getElementById("sidebar-close");
  const overlay = document.getElementById("cart-overlay");

  if (cartButton && !cartButton._bound) {
    cartButton._bound = true;
    cartButton.style.cursor = "pointer";
    cartButton.addEventListener("click", openSidebarCart);
  }

  if (closeBtn && !closeBtn._bound) {
    closeBtn._bound = true;
    closeBtn.addEventListener("click", closeSidebarCart);
  }

  if (overlay && !overlay._bound) {
    overlay._bound = true;
    overlay.addEventListener("click", closeSidebarCart);
  }
}

function renderCartPage() {
  const cartContainer = document.getElementById("cart-items");
  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  if (!cart.length) {
    cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    const totalSpan = document.getElementById("cart-total");
    if (totalSpan) totalSpan.textContent = "0.00";
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const qty = item.quantity || 1;
    const lineTotal = item.price * qty;
    total += lineTotal;

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.marginBottom = "12px";

    row.innerHTML = `
      <img src="${escapeHtml(item.image || '')}"
           alt="${escapeHtml(item.name || '')}"
           style="width:72px;height:72px;object-fit:cover;margin-right:12px;">

      <div style="flex:1">
        <h3 style="margin:0;font-size:16px;">
          ${escapeHtml(item.name)}
          ${qty > 1 ? `<span style="opacity:0.6;">×${qty}</span>` : ""}
        </h3>
        <p style="margin:4px 0;">
          $${lineTotal.toFixed(2)}
        </p>
      </div>

      <button style="box-shadow: 0 0 6px #ffff00; font-family: 'Tale'; background-color: #c6c600; font-size:16px; cursor:pointer;" class="remove" data-index="${index}">Remove</button>
    `;

    cartContainer.appendChild(row);
  });

  const totalSpan = document.getElementById("cart-total");
  if (totalSpan) totalSpan.textContent = total.toFixed(2);

  cartContainer.querySelectorAll(".remove").forEach(btn => {
    if (!btn._bound) {
      btn._bound = true;
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.index);
        if (!Number.isNaN(i)) removeItemFromCart(i);
      });
    }
  });
}

/* ----- Helpers ----- */
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, s => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[s];
  });
}

/* ----- Sidebar creation (unchanged) ----- */
function ensureSidebarExists() {
  if (document.getElementById("cart-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "cart-sidebar";
  sidebar.className = "cart-sidebar";
  sidebar.style.position = "fixed";
  sidebar.style.top = "0";
  sidebar.style.right = "-400px";
  sidebar.style.width = "350px";
  sidebar.style.height = "100%";
  sidebar.style.background = "rgb(17, 18, 2)";
  sidebar.style.boxShadow = "-4px 0 12px rgba(255, 255, 255, 0.2)";
  sidebar.style.transition = "right 0.25s ease";
  sidebar.style.zIndex = "9999";
  sidebar.style.display = "flex";
  sidebar.style.flexDirection = "column";
  sidebar.style.padding = "12px";

  sidebar.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <button id="sidebar-close" aria-label="Close" style="font-size:18px">X</button>
    </div>
    <a style="color: white;" href="cart.html">Cart</a>
    <div id="sidebar-items" style="overflow:auto;flex:1;padding-right:6px"></div>
    <div style="border-top:1px solid #ddd;padding-top:10px;margin-top:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>Total:</div>
        <div>$<span id="sidebar-total">0.00</span></div>
      </div>
      <div style="margin-top:8px;text-align:right;">
      </div>
    </div>
  `;

  const overlay = document.createElement("div");
  overlay.id = "cart-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.4)";
  overlay.style.zIndex = "9998";
  overlay.style.display = "none";

  document.body.appendChild(sidebar);
  document.body.appendChild(overlay);

  const style = document.createElement("style");
  style.textContent = `
    .cart-sidebar.show { right: 0 !important; }
    #cart-overlay.show { display: block !important; }
  `;
  document.body.appendChild(sidebar);
  document.body.appendChild(overlay);
  document.head.appendChild(style);

  setupSidebarControls();
}

/* ----- Init ----- */
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  updateCartCount();
  setupAddToCartButtons();
  setupSidebarControls();
  renderSidebarCart();
  renderCartPage();
});
