
"use strict";

const WHATSAPP_NUMBER = "254716397341";
const products = window.RASHLY_PRODUCTS || [];
const CART_KEY = "rashly_kicks_cart";

const $ = id => document.getElementById(id);
const money = amount => `KSh ${Number(amount).toLocaleString("en-KE")}`;

let cart = [];

try {
  cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch {
  cart = [];
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getProduct(id) {
  return products.find(product => product.id === Number(id));
}

function renderProducts(filter = "All") {
  const grid = $("product-grid");
  if (!grid) return;

  const visible = filter === "All"
    ? products
    : products.filter(product => product.brand === filter);

  const count = $("catalogue-count");
  if (count) count.textContent = `${visible.length} styles available`;

  if (!visible.length) {
    grid.innerHTML = "<p>No products found in this category.</p>";
    return;
  }

  grid.innerHTML = visible.map(product => `
    <article class="product-card">
      <a class="product-card-link" href="product.html?id=${product.id}">
        <div class="product-image">
          <span class="product-tag">RASHLY KICKS</span>
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <p class="product-category">${product.brand}</p>
          <h3>${product.name}</h3>
          <p class="product-price">${money(product.price)}</p>
          <span class="view-product">VIEW DETAILS ↗</span>
        </div>
      </a>
    </article>
  `).join("");
}

function renderProductDetail() {
  const container = $("product-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const product = getProduct(params.get("id"));

  if (!product) {
    container.innerHTML = `
      <h1>Product not found</h1>
      <p>Please return to our sneaker collection.</p>
      <a class="primary-button" href="shoes.html">SHOP SHOES ↗</a>
    `;
    return;
  }

  document.title = `${product.name} | RASHLY KICKS`;

  container.innerHTML = `
    <div class="product-detail-layout">
      <div class="product-detail-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-detail-info">
        <p class="eyebrow">${product.brand.toUpperCase()}</p>
        <h1>${product.name}</h1>
        <p class="detail-price">${money(product.price)}</p>
        <p class="detail-description">${product.description}</p>
        <label class="size-label" for="shoe-size">SELECT YOUR SHOE SIZE</label>
        <select id="shoe-size" class="size-select" required>
          <option value="">Choose size</option>
          ${product.sizes.map(size => `<option value="${size}">${size}</option>`).join("")}
        </select>
        <button id="detail-add" class="detail-add-button">ADD TO BAG +</button>
        <p class="detail-note">Sizes 39–45. Please confirm availability with our shop.</p>
      </div>
    </div>
  `;

  $("detail-add").addEventListener("click", () => {
    const size = $("shoe-size").value;

    if (!size) {
      alert("Please select your shoe size first.");
      $("shoe-size").focus();
      return;
    }

    addToCart(product.id, Number(size));
  });
}

function addToCart(id, size) {
  const product = getProduct(id);
  if (!product) return;

  const existing = cart.find(item => item.id === product.id && item.size === size);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: product.id, size, quantity: 1 });
  }

  saveCart();
  renderCart();
  openCart();
}

function changeQuantity(index, amount) {
  const item = cart[index];
  if (!item) return;

  item.quantity += amount;
  if (item.quantity <= 0) cart.splice(index, 1);

  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function renderCart() {
  const itemsContainer = $("cart-items");
  const countElement = $("cart-count");
  const totalElement = $("cart-total");

  if (!itemsContainer || !countElement || !totalElement) return;

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  countElement.textContent = count;
  totalElement.textContent = money(total);

  if (!cart.length) {
    itemsContainer.innerHTML = `<p class="empty-cart">Your bag is waiting for something fresh.</p>`;
    return;
  }

  itemsContainer.innerHTML = cart.map((item, index) => {
    const product = getProduct(item.id);
    if (!product) return "";

    return `
      <div class="cart-item">
        <img src="${product.image}" alt="${product.name}">
        <div class="cart-item-details">
          <h4>${product.name}</h4>
          <p>${money(product.price)}</p>
          <p class="cart-item-size">Shoe size: ${item.size}</p>
          <div class="cart-quantity">
            <button data-action="minus" data-index="${index}">−</button>
            <span>${item.quantity}</span>
            <button data-action="plus" data-index="${index}">+</button>
          </div>
          <button data-action="remove" data-index="${index}" class="remove-item">Remove</button>
        </div>
      </div>
    `;
  }).join("");
}

function openCart() {
  $("cart-panel")?.classList.add("open");
  $("cart-overlay")?.classList.add("open");
}

function closeCart() {
  $("cart-panel")?.classList.remove("open");
  $("cart-overlay")?.classList.remove("open");
}

function checkout() {
  if (!cart.length) {
    alert("Your shopping bag is empty.");
    return;
  }

  const lines = cart.map((item, index) => {
    const product = getProduct(item.id);
    return `${index + 1}. ${product.name}\n   Size: ${item.size} | Quantity: ${item.quantity}\n   Subtotal: ${money(product.price * item.quantity)}`;
  });

  const total = cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + product.price * item.quantity;
  }, 0);

  const message =
    `Hello RASHLY KICKS!\n\nI would like to order:\n\n${lines.join("\n\n")}` +
    `\n\nEstimated total: ${money(total)}` +
    `\n\nPlease confirm availability and delivery details.\nThank you!`;

  window.open(
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

$("cart-toggle")?.addEventListener("click", openCart);
$("cart-close")?.addEventListener("click", closeCart);
$("cart-overlay")?.addEventListener("click", closeCart);
$("checkout")?.addEventListener("click", checkout);

$("cart-items")?.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (action === "plus") changeQuantity(index, 1);
  if (action === "minus") changeQuantity(index, -1);
  if (action === "remove") removeItem(index);
});

$("brand-filter")?.addEventListener("change", event => {
  renderProducts(event.target.value);
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderProducts(button.dataset.filter);
  });
});

renderProducts();
renderProductDetail();
renderCart();

console.log("RASHLY KICKS store ready:", products.length, "products");
