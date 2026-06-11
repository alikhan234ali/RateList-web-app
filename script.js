const STORAGE_KEY = "rateListProducts";

let products = [];
let editId = null;

const productForm = document.getElementById("productForm");
const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productCategory = document.getElementById("productCategory");
const submitBtn = document.getElementById("submitBtn");
const submitText = document.getElementById("submitText");
const productTable = document.getElementById("productTable");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const statCount = document.getElementById("statCount");
const statTotal = document.getElementById("statTotal");
const statAvg = document.getElementById("statAvg");
const printBtn = document.getElementById("printBtn");
const rateTable = document.querySelector(".rate-table");

const editIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const deleteIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatPrice(amount) {
  return "Rs. " + amount.toLocaleString("en-PK");
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function loadProducts() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    products = JSON.parse(stored);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getDisplayList() {
  let list = [...products];
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const sort = sortSelect.value;

  if (query) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  if (category !== "all") {
    list = list.filter((p) => p.category === category);
  }

  list.sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    if (sort === "name-desc") return b.name.localeCompare(a.name);
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    return 0;
  });

  return list;
}

function updateStats() {
  const count = products.length;
  const total = products.reduce((sum, p) => sum + p.price, 0);
  const avg = count === 0 ? 0 : Math.round(total / count);

  statCount.textContent = count;
  statTotal.textContent = formatPrice(total);
  statAvg.textContent = formatPrice(avg);
}

function setSubmitMode(editing) {
  submitText.textContent = editing ? "Update Product" : "Add Product";
  submitBtn.classList.toggle("editing", editing);
}

function updateUI() {
  const displayList = getDisplayList();
  productTable.innerHTML = "";

  displayList.forEach((product, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="col-num">${index + 1}</td>
      <td class="col-name">${escapeHtml(product.name)}</td>
      <td><span class="col-category">${escapeHtml(product.category)}</span></td>
      <td class="col-price">${formatPrice(product.price)}</td>
      <td>
        <div class="col-actions">
          <button type="button" class="icon-btn btn-edit" title="Edit">${editIcon}</button>
          <button type="button" class="icon-btn btn-delete" title="Delete">${deleteIcon}</button>
        </div>
      </td>
    `;

    tr.querySelector(".btn-edit").addEventListener("click", () => startEdit(product.id));
    tr.querySelector(".btn-delete").addEventListener("click", () => deleteProduct(product.id));

    productTable.appendChild(tr);
  });

  const hasProducts = products.length > 0;
  const hasFiltered = displayList.length > 0;

  rateTable.classList.toggle("has-data", hasFiltered);
  emptyState.classList.toggle("hidden", hasFiltered);

  if (!hasFiltered) {
    emptyState.querySelector("h3").textContent = hasProducts
      ? "No matching products"
      : "No products yet";
    emptyState.querySelector("p").textContent = hasProducts
      ? "Try a different search or filter."
      : "Add your first product using the form above.";
  }

  updateStats();
}

function addOrUpdateProduct() {
  const name = productName.value.trim();
  const price = parseFloat(productPrice.value);
  const category = productCategory.value;

  if (!name) {
    productName.focus();
    return;
  }

  if (isNaN(price) || price <= 0) {
    productPrice.focus();
    return;
  }

  if (editId) {
    const product = products.find((p) => p.id === editId);
    if (product) {
      product.name = name;
      product.price = price;
      product.category = category;
    }
    editId = null;
    setSubmitMode(false);
  } else {
    products.unshift({ id: generateId(), name, price, category });
  }

  saveProducts();
  updateUI();
  clearForm();
}

function startEdit(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  editId = id;
  productName.value = product.name;
  productPrice.value = product.price;
  productCategory.value = product.category;
  productName.focus();
  setSubmitMode(true);
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  products = products.filter((p) => p.id !== id);

  if (editId === id) {
    editId = null;
    clearForm();
    setSubmitMode(false);
  }

  saveProducts();
  updateUI();
}

function clearForm() {
  productName.value = "";
  productPrice.value = "";
  productCategory.value = "General";
}

productForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addOrUpdateProduct();
});

searchInput.addEventListener("input", updateUI);
categoryFilter.addEventListener("change", updateUI);
sortSelect.addEventListener("change", updateUI);
printBtn.addEventListener("click", () => window.print());

loadProducts();
updateUI();
