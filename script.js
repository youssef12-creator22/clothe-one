
/* CLOTHE-ONE - JAVASCRIPT */

const ADMIN_PASSWORD = "CO2026";

let products = JSON.parse(localStorage.getItem("co_products") || "[]");
let orders = JSON.parse(localStorage.getItem("co_orders") || "[]");
let cart = [];
let isAdmin = false;

// SAFE TEXT
function safe(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// STORAGE
function saveProducts() {
    localStorage.setItem("co_products", JSON.stringify(products));
}

function saveOrders() {
    localStorage.setItem("co_orders", JSON.stringify(orders));
}

// DISPLAY PRODUCTS
function displayProducts() {
    const container = document.getElementById("products");

    if (products.length === 0) {
        container.innerHTML = `
            <p style="text-align:center;grid-column:1/-1">
                Les produits seront bientôt disponibles.
            </p>`;
        return;
    }

    container.innerHTML = products.map((p, i) => `
        <div class="product-card">
            <img class="product-image"
                 src="${p.image}"
                 alt="${safe(p.name)}">

            <div class="product-info">
                <h3>${safe(p.name)}</h3>
                <p class="product-size">Taille : ${safe(p.size)}</p>
                <p class="product-price">${Number(p.price).toFixed(2)} DT</p>

                ${p.sold
                    ? `<div class="sold-badge">VENDUE</div>`
                    : `<button class="main-btn"
                        onclick="addToCart(${i})">
                        Ajouter au panier
                      </button>`
                }
            </div>
        </div>
    `).join("");
}

// CART
function addToCart(index) {
    const product = products[index];

    if (!product || product.sold) {
        alert("Cet article n'est plus disponible.");
        return;
    }

    const existing = cart.find(item => item.index === index);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ index, qty: 1 });
    }

    updateCartCount();
    alert("Produit ajouté au panier !");
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cartCount").textContent = count;
}

function openCart() {
    document.getElementById("cartModal").classList.remove("hidden");
    displayCart();
}

function closeCart() {
    document.getElementById("cartModal").classList.add("hidden");
}

function displayCart() {
    const container = document.getElementById("cartItems");
    let total = 0;

    container.innerHTML = cart.map((item, i) => {
        const product = products[item.index];

        if (!product) return "";

        total += Number(product.price) * item.qty;

        return `
            <div class="cart-item">
                <h3>${safe(product.name)}</h3>
                <p>${Number(product.price).toFixed(2)} DT</p>
                <p>Quantité : ${item.qty}</p>

                <button onclick="changeQuantity(${i},-1)">−</button>
                <button onclick="changeQuantity(${i},1)">+</button>
                <button onclick="removeFromCart(${i})">Supprimer</button>
            </div>
        `;
    }).join("");

    document.getElementById("cartTotal").textContent =
        total.toFixed(2);
}

function changeQuantity(index, amount) {
    const item = cart[index];

    if (!item) return;

    if (amount > 0 && products[item.index].sold) {
        alert("Cet article est vendu.");
        return;
    }

    item.qty += amount;

    if (item.qty <= 0) {
        cart.splice(index, 1);
    }

    updateCartCount();
    displayCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    displayCart();
}

// CHECKOUT
function showCheckout() {
    if (cart.length === 0) {
        alert("Votre panier est vide.");
        return;
    }

    document.getElementById("checkoutModal").classList.remove("hidden");
}

function closeCheckout() {
    document.getElementById("checkoutModal").classList.add("hidden");
}

document.getElementById("checkoutForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (cart.length === 0) {
        alert("Votre panier est vide.");
        return;
    }

    // Verify availability again
    for (const item of cart) {
        if (!products[item.index] || products[item.index].sold) {
            alert("Un produit de votre panier n'est plus disponible.");
            return;
        }
    }

    const items = cart.map(item => {
        const product = products[item.index];

        return {
            name: product.name,
            price: Number(product.price),
            size: product.size,
            qty: item.qty,
            productIndex: item.index
        };
    });

    const total = items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0
    );

    const order = {
        id: Date.now(),
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        city: document.getElementById("city").value.trim(),
        address: document.getElementById("address").value.trim(),
        items,
        total,
        status: "En attente"
    };

    orders.push(order);
    saveOrders();

    cart = [];
    updateCartCount();

    this.reset();

    closeCart();
    closeCheckout();

    alert("Commande enregistrée ! Merci ❤️");

    if (isAdmin) {
        displayOrders();
    }
});

// ADMIN LOGIN
function adminLogin() {
    const password = document.getElementById("adminPassword").value;

    if (password === ADMIN_PASSWORD) {
        isAdmin = true;

        document.getElementById("adminDashboard")
            .classList.remove("hidden");

        document.querySelector(".admin-login")
            .classList.add("hidden");

        displayManageProducts();
        displayOrders();
        updateStats();

        alert("Bienvenue dans Admin Panel !");
    } else {
        alert("Mot de passe incorrect !");
    }
}

function adminLogout() {
    isAdmin = false;

    document.getElementById("adminDashboard")
        .classList.add("hidden");

    document.querySelector(".admin-login")
        .classList.remove("hidden");

    document.getElementById("adminPassword").value = "";
}

// ADD PRODUCT
document.getElementById("productForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!isAdmin) return;

    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const size = document.getElementById("productSize").value.trim();
    const file = document.getElementById("productImage").files[0];

    if (!name || !size || !file || price < 0 || !Number.isFinite(price)) {
        alert("Vérifiez les informations du produit.");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Veuillez choisir une image.");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Image trop grande. Maximum 2 MB.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function() {
        products.push({
            id: Date.now(),
            name,
            price,
            size,
            image: reader.result,
            sold: false
        });

        try {
            saveProducts();
        } catch (error) {
            products.pop();
            alert("Stockage insuffisant. Utilisez une image plus petite.");
            return;
        }

        displayProducts();
        displayManageProducts();
        updateStats();

        document.getElementById("productForm").reset();

        alert("Produit ajouté avec succès !");
    };

    reader.readAsDataURL(file);
});

// PRODUCT MANAGEMENT
function displayManageProducts() {
    const container = document.getElementById("manageProducts");

    if (products.length === 0) {
        container.innerHTML = "<p>Aucun produit.</p>";
        return;
    }

    container.innerHTML = products.map((p, i) => `
        <div class="manage-item">
            <img src="${p.image}" alt="${safe(p.name)}">
            <strong>${safe(p.name)}</strong>
            <p>${Number(p.price).toFixed(2)} DT — ${safe(p.size)}</p>
            <p>${p.sold ? "VENDUE" : "Disponible"}</p>

            <button onclick="editPrice(${i})">Prix</button>
            <button onclick="editProductName(${i})">Nom</button>
            <button onclick="toggleSold(${i})">
                ${p.sold ? "Disponible" : "VENDUE"}
            </button>
            <button onclick="deleteProduct(${i})">Supprimer</button>
        </div>
    `).join("");
}

function editPrice(index) {
    if (!isAdmin) return;

    const price = prompt("Nouveau prix DT:", products[index].price);

    if (price === null || price.trim() === "") return;

    const value = Number(price);

    if (!Number.isFinite(value) || value < 0) {
        alert("Prix invalide.");
        return;
    }

    products[index].price = value;

    saveProducts();
    displayProducts();
    displayManageProducts();
}

function editProductName(index) {
    if (!isAdmin) return;

    const name = prompt("Nouveau nom:", products[index].name);

    if (name && name.trim()) {
        products[index].name = name.trim();

        saveProducts();
        displayProducts();
        displayManageProducts();
    }
}

function toggleSold(index) {
    if (!isAdmin) return;

    products[index].sold = !products[index].sold;

    saveProducts();
    displayProducts();
    displayManageProducts();
}

function deleteProduct(index) {
    if (!isAdmin) return;

    if (confirm("Supprimer ce produit ?")) {
        products.splice(index, 1);

        // Remove deleted product from the current cart
        cart = cart.filter(item => item.index !== index);

        // Update indices after deletion
        cart.forEach(item => {
            if (item.index > index) item.index--;
        });

        saveProducts();
        updateCartCount();
        displayProducts();
        displayManageProducts();
        updateStats();
    }
}

// ORDER MANAGEMENT
function displayOrders() {
    const container = document.getElementById("manageOrders");

    if (orders.length === 0) {
        container.innerHTML = "<p>Aucune commande pour le moment.</p>";
        return;
    }

    container.innerHTML = orders.map((order, i) => `
        <div class="manage-item">
            <h3>Commande #${i + 1}</h3>

            <p>Client : ${safe(order.firstName)} ${safe(order.lastName)}</p>
            <p>Téléphone : ${safe(order.phone)}</p>
            <p>Ville : ${safe(order.city)}</p>
            <p>Adresse : ${safe(order.address)}</p>

            <p>Articles :</p>
            ${order.items.map(item => `
                <p>${safe(item.name)} × ${item.qty} — ${item.price} DT</p>
            `).join("")}

            <strong>Total : ${Number(order.total).toFixed(2)} DT</strong>

            <p class="status">Statut : ${safe(order.status)}</p>

            <button onclick="changeOrderStatus(${i},'Validée')">
                Valider
            </button>

            <button onclick="changeOrderStatus(${i},'Refusée')">
                Refuser
            </button>

            <button onclick="changeOrderStatus(${i},'En livraison')">
                En livraison
            </button>

            <button onclick="changeOrderStatus(${i},'Livrée')">
                Livrée
            </button>

            <button onclick="deleteOrder(${i})">
                Supprimer
            </button>
        </div>
    `).join("");
}

function changeOrderStatus(index, status) {
    if (!isAdmin) return;

    orders[index].status = status;

    saveOrders();
    displayOrders();
}

function deleteOrder(index) {
    if (!isAdmin) return;

    if (confirm("Supprimer cette commande ?")) {
        orders.splice(index, 1);

        saveOrders();
        displayOrders();
        updateStats();
    }
}

// DASHBOARD STATS
function updateStats() {
    document.getElementById("productCount").textContent =
        products.length;

    document.getElementById("orderCount").textContent =
        orders.length;
}

// INITIALIZE
displayProducts();
updateCartCount();
