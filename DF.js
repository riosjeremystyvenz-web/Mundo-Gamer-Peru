// ==========================================
// BASE DE DATOS MAESTRA DE HARDWARE (MUNDO GAMER)
// ==========================================
const MASTER_PRODUCTS = [
    { id: 201, name: "Laptop Gamer ASUS ROG Strix G16 (2026)", category: "Laptops", price: 5899.00, stock: 4, brand: "Asus", img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500" },
    { id: 202, name: "Teclado Mecánico Custom Logitech G Pro X TKL", category: "Teclados", price: 549.00, stock: 15, brand: "Logitech", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500" },
    { id: 203, name: "Tarjeta de Video NVIDIA RTX 4080 Super Asus ROG", category: "Componentes", price: 4950.00, stock: 2, brand: "Asus", img: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500" },
    { id: 204, name: "Mouse Óptico Gamer Logitech G502 X Lightforce", category: "Teclados", price: 389.00, stock: 0, brand: "Logitech", img: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500" }, // HU003: Sin Stock
    { id: 205, name: "Procesador AMD Ryzen 9 9950X Zen 5", category: "Componentes", price: 2850.00, stock: 7, brand: "AMD", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500" },
    { id: 206, name: "Auriculares Inalámbricos Logitech G733 RGB", category: "Teclados", price: 629.00, stock: 10, brand: "Logitech", img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500" }
];

// UBIGEO PERÚ DATA SCRIPT (HU011)
const LOGISTIC_MAP = {
    "Lima": ["Lima Metropolitana", "Callao", "Cañete", "Huaral", "Barranca"],
    "Arequipa": ["Arequipa", "Camaná", "Caylloma", "Islay"],
    "La Libertad": ["Trujillo", "Ascope", "Chepén", "Pacasmayo"]
};

// ESTADO GLOBAL DE LA SPA
let appState = {
    cart: JSON.parse(localStorage.getItem('mg_cart_storage')) || [],
    wishlist: [],
    auth: { isLogged: false, username: null, attempts: 0, blockedUntil: null },
    discountRate: 0,
    activeCategory: "Todos",
    currentPaymentMethod: "tarjeta"
};

// INITIALIZER
window.addEventListener('DOMContentLoaded', () => {
    renderMainCatalog(MASTER_PRODUCTS);
    refreshCategoryCounters();
    syncCartInterface();
});

// ==========================================
// CORE DE RENDERIZADO Y FLUJO SPA
// ==========================================
function renderMainCatalog(productsList) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = "";

    productsList.forEach(prod => {
        const isOut = prod.stock === 0;
        const isInWish = appState.wishlist.includes(prod.id);
        
        const card = document.createElement('div');
        card.className = "product-card";
        card.innerHTML = `
            <div class="image-frame">
                ${isOut ? `<span class="out-stock-label">SIN STOCK</span>` : ''}
                <img src="${prod.img}" alt="${prod.name}" loading="lazy">
                <button class="favorite-toggle-btn ${isInWish ? 'bookmarked' : ''}" onclick="handleWishlistToggle(${prod.id})">
                    <i class="fa-solid fa-heart"></i>
                </button>
            </div>
            <div class="info-frame">
                <h4 onclick="triggerDetailModal(${prod.id})">${prod.name}</h4>
                <div class="price-tag">S/ ${prod.price.toFixed(2)}</div>
                <button class="btn-cyber-primary" ${isOut ? 'disabled' : ''} onclick="addItemToCart(${prod.id})">
                    ${isOut ? 'PRODUCTO AGOTADO' : 'AÑADIR AL CONFIGURADOR'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.page-view-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Control visual del Hero Banner para limpieza de UI
    const hero = document.getElementById('hero-banner-area');
    if (sectionId !== 'catalogo-sec') hero.classList.add('hidden');
    else hero.classList.remove('hidden');
}

// HU004: FILTROS DE CATEGORÍA
function filterCategory(category, element) {
    appState.activeCategory = category;
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    if (category === "Todos") {
        renderMainCatalog(MASTER_PRODUCTS);
    } else {
        const filtered = MASTER_PRODUCTS.filter(p => p.category === category);
        renderMainCatalog(filtered);
    }
}

function refreshCategoryCounters() {
    document.getElementById('count-Todos').innerText = MASTER_PRODUCTS.length;
    document.getElementById('count-Laptops').innerText = MASTER_PRODUCTS.filter(p=>p.category==='Laptops').length;
    document.getElementById('count-Teclados').innerText = MASTER_PRODUCTS.filter(p=>p.category==='Teclados').length;
    document.getElementById('count-Componentes').innerText = MASTER_PRODUCTS.filter(p=>p.category==='Componentes').length;
}

// ==========================================
// HU005: MOTOR DE BÚSQUEDA INTELIGENTE
// ==========================================
document.getElementById('searchInput').addEventListener('input', (e) => {
    const criteria = e.target.value.toLowerCase().trim();
    const dropdown = document.getElementById('searchSuggestions');
    dropdown.innerHTML = "";

    if (criteria.length < 3) {
        dropdown.classList.add('hidden');
        return;
    }

    // Tolerancia básica ortográfica y mapeo de marca
    const hits = MASTER_PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(criteria) || p.brand.toLowerCase().includes(criteria)
    );

    if (hits.length > 0) {
        dropdown.classList.remove('hidden');
        hits.forEach(prod => {
            const row = document.createElement('div');
            row.className = "suggestion-row";
            row.innerHTML = `<span>${prod.name}</span><strong>S/ ${prod.price}</strong>`;
            row.onclick = () => {
                triggerDetailModal(prod.id);
                dropdown.classList.add('hidden');
            };
            dropdown.appendChild(row);
        });
    } else {
        dropdown.classList.remove('hidden');
        const emptyRow = document.createElement('div');
        emptyRow.className = "suggestion-row text-muted";
        emptyRow.innerText = "No hay coincidencias directas. Ver laptops sugeridas...";
        emptyRow.onclick = () => {
            renderMainCatalog(MASTER_PRODUCTS.filter(p => p.category === 'Laptops'));
            dropdown.classList.add('hidden');
        };
        dropdown.appendChild(emptyRow);
    }
});

// ==========================================
// HU006: GALERÍA DE DETALLE CON ZOOM
// ==========================================
function triggerDetailModal(productId) {
    const target = MASTER_PRODUCTS.find(p => p.id === productId);
    const wrapper = document.getElementById('product-detail-body');
    
    wrapper.innerHTML = `
        <div class="detail-modal-layout" style="display: flex; gap: 30px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 280px; background: #000; padding: 20px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                <img src="${target.img}" id="lens-zoom-target" style="max-width: 100%; transition: transform 0.2s ease-out;" onmousemove="onImageZoomMove(event)" onmouseleave="onImageZoomReset()">
            </div>
            <div style="flex: 1; min-width: 280px;">
                <h2 class="neon-cyan-txt" style="margin-bottom: 15px;">${target.name}</h2>
                <div style="font-size: 26px; font-weight: 800; margin-bottom: 20px;">S/ ${target.price.toFixed(2)}</div>
                <p style="margin-bottom: 10px;">Garantía oficial certificada: <strong>24 Meses en todo el Perú</strong></p>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Disponibilidad inmediata en almacén.</p>
                
                <details open style="background: rgba(255,255,255,0.02); padding: 15px; border-radius: 4px;">
                    <summary style="cursor: pointer; color: var(--neon-pink); font-weight: bold;">Especificaciones de Ingeniería</summary>
                    <p style="font-size: 13px; color: var(--text-muted); margin-top: 10px;">
                        Componente de alto rendimiento optimizado para arquitectura eSports de baja latencia. Compatible con perfiles XMP y configuraciones PCI Express avanzadas de 2026.
                    </p>
                </details>
            </div>
        </div>
    `;
    document.getElementById('detailModal').style.display = "flex";
}

function onImageZoomMove(e) {
    const img = document.getElementById('lens-zoom-target');
    img.style.transform = "scale(1.6)";
    img.style.transformOrigin = `${e.offsetX}px ${e.offsetY}px`;
}
function onImageZoomReset() {
    const img = document.getElementById('lens-zoom-target');
    img.style.transform = "scale(1)";
}
function closeDetailModal() { document.getElementById('detailModal').style.display = "none"; }

// ==========================================
// HU001 Y HU002: CONTROL DE ACCESO (SISTEMA DE SEGURIDAD)
// ==========================================
function openLoginModal() { document.getElementById('loginModal').style.display = "flex"; }
function closeLoginModal() { document.getElementById('loginModal').style.display = "none"; }

function processLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const alertBox = document.getElementById('login-error-msg');

    if (appState.auth.blockedUntil && new Date() < appState.auth.blockedUntil) {
        alertBox.innerText = "Acceso revocado temporalmente. Espere a que expire la penalización.";
        alertBox.classList.remove('hidden');
        return;
    }

    if (user === "admin" && pass === "1234") {
        authorizeUser("Administrador Gamer");
    } else {
        appState.auth.attempts++;
        alertBox.classList.remove('hidden');
        if (appState.auth.attempts >= 3) {
            appState.auth.blockedUntil = new Date(new Date().getTime() + 5 * 60000); // Bloqueo de 5 min
            alertBox.innerText = "Cuenta Bloqueada por seguridad durante 5 minutos debido a reintentos.";
        } else {
            alertBox.innerText = `Credenciales incorrectas. Intento ${appState.auth.attempts} de 3.`;
        }
    }
}

function loginWithGoogle() { authorizeUser("Gamer Google Player"); }

function authorizeUser(name) {
    appState.auth.isLogged = true;
    appState.auth.username = name;
    document.getElementById('user-nav-text').innerText = name;
    document.getElementById('login-form-view').classList.add('hidden');
    document.getElementById('welcome-logged-view').classList.remove('hidden');
    showToast("¡Sesión sincronizada exitosamente!");
    setTimeout(closeLoginModal, 1200);
}

function logout() {
    appState.auth.isLogged = false;
    document.getElementById('user-nav-text').innerText = "Ingresar";
    document.getElementById('login-form-view').classList.remove('hidden');
    document.getElementById('welcome-logged-view').classList.add('hidden');
}

// ==========================================
// HU007: WISHLIST (FAVORITOS)
// ==========================================
function handleWishlistToggle(id) {
    if (!appState.wishlist.includes(id)) {
        appState.wishlist.push(id);
        showToast("Elemento enviado a tus Favoritos. ❤️");
    } else {
        appState.wishlist = appState.wishlist.filter(x => x !== id);
    }
    renderMainCatalog(MASTER_PRODUCTS);
    refreshWishlistUI();
}

function refreshWishlistUI() {
    const grid = document.getElementById('wishlist-grid');
    const empty = document.getElementById('wishlist-empty');
    grid.innerHTML = "";
    
    const favorites = MASTER_PRODUCTS.filter(p => appState.wishlist.includes(p.id));
    if(favorites.length === 0) {
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        favorites.forEach(p => {
            const div = document.createElement('div');
            div.className = "product-card";
            div.innerHTML = `<div class="info-frame"><h4>${p.name}</h4><div class="price-tag">S/ ${p.price}</div></div>`;
            grid.appendChild(div);
        });
    }
}

// ==========================================
// HU008, HU009 Y HU010: GESTOR DE CARRITO (PERSISTENCIA)
// ==========================================
function addItemToCart(id) {
    const target = MASTER_PRODUCTS.find(p => p.id === id);
    const match = appState.cart.find(item => item.id === id);

    if (match) {
        if (match.qty >= target.stock) {
            alert(`Acción denegada: Has alcanzado el límite de stock de la tienda (${target.stock} unidades).`);
            return;
        }
        match.qty++;
    } else {
        appState.cart.push({ id: target.id, name: target.name, price: target.price, qty: 1, max: target.stock });
    }
    showToast(`Agregado al carrito de compras.`);
    saveCartState();
}

function updateItemQty(id, delta) {
    const match = appState.cart.find(i => i.id === id);
    if (match) {
        if (delta === 1 && match.qty >= match.max) {
            alert("No quedan unidades disponibles en almacén.");
            return;
        }
        match.qty += delta;
        if (match.qty <= 0) appState.cart = appState.cart.filter(i => i.id !== id);
        saveCartState();
    }
}

function removeCartItem(id) {
    appState.cart = appState.cart.filter(i => i.id !== id);
    saveCartState();
}

function saveCartState() {
    localStorage.setItem('mg_cart_storage', JSON.stringify(appState.cart));
    syncCartInterface();
}

function syncCartInterface() {
    const countBadge = document.getElementById('cart-count');
    const listWrapper = document.getElementById('cart-items-list');
    
    const totalItems = appState.cart.reduce((acc, obj) => acc + obj.qty, 0);
    countBadge.innerText = totalItems;

    listWrapper.innerHTML = "";
    let calculatedSubtotal = 0;

    appState.cart.forEach(item => {
        calculatedSubtotal += item.price * item.qty;
        const row = document.createElement('div');
        row.className = "cart-item-row";
        row.innerHTML = `
            <div>
                <h5>${item.name}</h5>
                <small>S/ ${item.price.toFixed(2)}</small>
            </div>
            <div class="qty-counter">
                <button class="qty-btn" onclick="updateItemQty(${item.id}, -1)">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="updateItemQty(${item.id}, 1)">+</button>
            </div>
            <button class="clear-search-btn" onclick="removeCartItem(${item.id})"><i class="fa-solid fa-trash-can"></i></button>
        `;
        listWrapper.appendChild(row);
    });

    document.getElementById('cart-subtotal').innerText = `S/ ${calculatedSubtotal.toFixed(2)}`;
    executeAccountingMath(calculatedSubtotal);
}

// ==========================================
// HU011, HU012 Y HU013: MÓDULO LOGÍSTICO (PERÚ)
// ==========================================
function handleDeliveryMethodChange() {
    const val = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const ubigeoBlock = document.getElementById('ubigeo-block');
    const storeBlock = document.getElementById('store-block');

    if(val === 'store') {
        ubigeoBlock.classList.add('hidden');
        storeBlock.classList.remove('hidden');
    } else {
        ubigeoBlock.classList.remove('hidden');
        storeBlock.classList.add('hidden');
    }
    syncCartInterface();
}

function onDepartamentoChange() {
    const dep = document.getElementById('depSelect').value;
    const provSelect = document.getElementById('provSelect');
    
    provSelect.innerHTML = '<option value="">Seleccione Ubicación</option>';
    if (dep && LOGISTIC_MAP[dep]) {
        provSelect.disabled = false;
        LOGISTIC_MAP[dep].forEach(p => {
            const op = document.createElement('option');
            op.value = p; op.innerText = p;
            provSelect.appendChild(op);
        });
    } else {
        provSelect.disabled = true;
    }
    syncCartInterface();
}

function executeAccountingMath(subtotal) {
    const method = document.querySelector('input[name="deliveryMethod"]:checked').value;
    const dep = document.getElementById('depSelect').value;
    const timerBox = document.getElementById('delivery-timer-box');
    let courierCost = 0;

    if (method === 'delivery') {
        if (dep === "Lima") {
            courierCost = 15.00; // Tarifa plana Lima Metropolitana
            timerBox.innerHTML = `<i class="fa-solid fa-bolt"></i> Llega en un plazo de 24 a 48 horas máximo.`;
            timerBox.classList.remove('hidden');
        } else if (dep !== "") {
            courierCost = 35.00; // Tarifa Provincias
            timerBox.innerHTML = `<i class="fa-solid fa-truck-moving"></i> Envío vía Olva Courier. Tiempo de tránsito: 72 horas.`;
            timerBox.classList.remove('hidden');
        } else {
            timerBox.classList.add('hidden');
        }
    } else {
        courierCost = 0; // Recojo en Cyberplaza gratis
        timerBox.classList.add('hidden');
    }

    document.getElementById('delivery-cost').innerText = `S/ ${courierCost.toFixed(2)}`;
    
    // Aplicación del cupón (HU016)
    let discountVal = subtotal * appState.discountRate;
    let finalGrossTotal = (subtotal - discountVal) + courierCost;

    document.getElementById('cart-total').innerText = `S/ ${Math.max(0, finalGrossTotal).toFixed(2)}`;
}

// HU016: VALIDACIÓN DE CUPONES
function applyPromoCoupon() {
    const couponStr = document.getElementById('couponInput').value.trim().toUpperCase();
    const lbl = document.getElementById('coupon-msg');

    if(couponStr === "GAMER2026") {
        appState.discountRate = 0.15; // 15% Descuento total
        lbl.style.color = "var(--neon-green)";
        lbl.innerText = "¡Cupón GAMER2026 validado! Descuento del 15% imputado.";
    } else {
        appState.discountRate = 0;
        lbl.style.color = "var(--alert-danger)";
        lbl.innerText = "El cupón ingresado no existe o ha expirado.";
    }
    syncCartInterface();
}

// CHECKOUT NAVIGATION BAN
function proceedToPaymentGateway() {
    if(appState.cart.length === 0) { alert("Su carro de compras está vacío."); return; }
    
    const method = document.querySelector('input[name="deliveryMethod"]:checked').value;
    if(method === 'delivery') {
        const dep = document.getElementById('depSelect').value;
        const address = document.getElementById('addressInput').value.trim();
        if(!dep || !address) {
            alert("Error Logístico: Debe rellenar el departamento y la dirección física.");
            return;
        }
    }
    showSection('payment-sec');
}

// ==========================================
// HU014, HU015 Y HU017: PASARELA DE LIQUIDACIÓN
// ==========================================
function selectPaymentMethod(type) {
    appState.currentPaymentMethod = type;
    document.querySelectorAll('.pay-tab-btn').forEach(b => b.classList.remove('active'));
    
    if(type === 'tarjeta') {
        document.getElementById('tab-tarjeta').classList.add('active');
        document.getElementById('payment-card-form').classList.remove('hidden');
        document.getElementById('payment-qr-form').classList.add('hidden');
    } else {
        document.getElementById('tab-yape').classList.add('active');
        document.getElementById('payment-card-form').classList.add('hidden');
        document.getElementById('payment-qr-form').classList.remove('hidden');
    }
}

function handleInvoiceTypeChange() {
    const type = document.getElementById('invoiceType').value;
    document.getElementById('docLabel').innerText = type === 'boleta' ? 'Número de Documento de Identidad' : 'Número de RUC Comercial';
}
function handleInvoiceTypeChangeQR() {
    const type = document.getElementById('invoiceTypeQR').value;
    document.getElementById('docLabelQR').innerText = type === 'boleta' ? 'Número de DNI' : 'Número de RUC';
}

// LIQUIDACIÓN FINAL
function submitCardPayment() {
    const card = document.getElementById('cardNum').value.trim();
    const exp = document.getElementById('cardExp').value.trim();
    const cvv = document.getElementById('cardCvv').value.trim();
    const err = document.getElementById('card-errors-container');
    const doc = document.getElementById('invoiceDoc').value.trim();
    const inv = document.getElementById('invoiceType').value;

    if (card.length < 16 || exp.length < 5 || cvv.length < 3) {
        err.innerText = "Transacción Denegada por Niubiz: Verifique parámetros de tarjeta, CVV o fecha de expiración.";
        err.classList.remove('hidden');
        return;
    }
    if (inv === 'factura' && doc.length !== 11) {
        alert("La SUNAT exige un número de RUC válido de exactamente 11 dígitos.");
        return;
    }
    executeCheckoutSuccess();
}

function submitQRPayment() {
    const code = document.getElementById('yapeOperation').value.trim();
    if(code.length !== 8) {
        alert("El código de operación de Yape/Plin debe constar de 8 dígitos.");
        return;
    }
    executeCheckoutSuccess();
}

function executeCheckoutSuccess() {
    alert("¡Pago validado y procesado de forma conforme! Tu Boleta/Factura Electrónica en PDF está siendo procesada por SUNAT y llegará a tu buzón en menos de 15 minutos.");
    
    appState.cart = [];
    saveCartState();

    // Generar código de tracking dinámico
    const internalTrack = "MG-" + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('track-code-txt').innerText = internalTrack;

    showSection('tracking-sec');

    // Cambiar dinámicamente estado de tracking con temporizador
    setTimeout(() => { document.getElementById('step-cam').classList.add('active'); }, 5000);
}

// UTILS: TOAST SYSTEM
function showToast(text) {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = "toast";
    t.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--neon-green)"></i> ${text}`;
    container.appendChild(t);
    setTimeout(() => { t.remove(); }, 3500);
}