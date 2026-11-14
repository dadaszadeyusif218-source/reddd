const CART_KEY = "logoStoreCart";

function readCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cart:updated"));
}

function escapeCartText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatItemCount(count) {
    const remainder = count % 100;
    if (remainder >= 11 && remainder <= 14) return `${count} товаров`;
    if (count % 10 === 1) return `${count} товар`;
    if (count % 10 >= 2 && count % 10 <= 4) return `${count} товара`;
    return `${count} товаров`;
}

function addToCart(product) {
    if (!product || product.id == null) return;

    const cart = readCart();
    const existing = cart.find(item => String(item.id) === String(product.id));
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            brand: product.brand || "",
            model: product.model || product.name || "Товар",
            price: Number(product.price) || 0,
            imageUrl: product.imageUrl || "",
            quantity: 1
        });
    }

    saveCart(cart);
}

function renderCart() {
    const list = document.getElementById("cartItems");
    if (!list) return;

    const cart = readCart();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countLabel = document.getElementById("cartItemCount");
    const totalLabel = document.getElementById("cartTotal");
    const checkout = document.getElementById("cartCheckout");

    countLabel.textContent = formatItemCount(count);
    totalLabel.textContent = `$${total.toFixed(2)}`;
    checkout.disabled = cart.length === 0;

    if (!cart.length) {
        list.innerHTML = `
            <div class="cart-empty">
                <h2>Корзина пока пуста</h2>
                <p>Добавьте товары из каталога, чтобы увидеть их здесь.</p>
                <a class="details-btn" href="catalog.html">Перейти в каталог</a>
            </div>
        `;
        return;
    }

    list.innerHTML = cart.map(item => `
        <article class="cart-item">
            ${item.imageUrl
                ? `<img src="${escapeCartText(item.imageUrl)}" alt="${escapeCartText(item.brand)} ${escapeCartText(item.model)}">`
                : '<div class="cart-item__placeholder" aria-hidden="true">LOGO</div>'}
            <div class="cart-item__details">
                <h2>${escapeCartText(item.brand)} ${escapeCartText(item.model)}</h2>
                <p>$${item.price.toFixed(2)} за шт.</p>
            </div>
            <div class="cart-item__controls" aria-label="Количество">
                <button type="button" data-quantity="-1" data-id="${escapeCartText(item.id)}" aria-label="Уменьшить количество">−</button>
                <span>${item.quantity}</span>
                <button type="button" data-quantity="1" data-id="${escapeCartText(item.id)}" aria-label="Увеличить количество">+</button>
            </div>
            <strong class="cart-item__subtotal">$${(item.price * item.quantity).toFixed(2)}</strong>
            <button class="cart-item__remove" type="button" data-remove="${escapeCartText(item.id)}">Удалить</button>
        </article>
    `).join("");
}

function updateCartItem(id, change) {
    const cart = readCart();
    const item = cart.find(product => String(product.id) === String(id));
    if (!item) return;

    item.quantity += change;
    saveCart(cart.filter(product => product.quantity > 0));
    renderCart();
}

function removeCartItem(id) {
    saveCart(readCart().filter(item => String(item.id) !== String(id)));
    renderCart();
}

document.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) {
        try {
            addToCart(JSON.parse(addButton.dataset.addCart));
            addButton.textContent = "Добавлено";
            window.setTimeout(() => {
                if (addButton.isConnected) addButton.textContent = "В корзину";
            }, 1200);
        } catch (error) {
            console.error("Не удалось добавить товар в корзину:", error);
        }
        return;
    }

    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) {
        updateCartItem(quantityButton.dataset.id, Number(quantityButton.dataset.quantity));
        return;
    }

    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) removeCartItem(removeButton.dataset.remove);
});

document.getElementById("clearCart")?.addEventListener("click", () => {
    saveCart([]);
    renderCart();
});

document.getElementById("cartCheckout")?.addEventListener("click", () => {
    const message = document.getElementById("checkoutMessage");
    message.textContent = "Оформление заказа пока не подключено: сервер требует данные оплаты, а безопасный платёжный сервис не настроен.";
});

window.addEventListener("cart:updated", renderCart);
renderCart();
