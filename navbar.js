(function () {
    const header = document.getElementById("siteHeader");
    if (!header) return;

    const links = [
        ["index.html", "Главная"],
        ["catalog.html", "Каталог"],
        ["about.html", "О нас"],
        ["contact.html", "Контакты"],
        ["manage-products.html", "Управление товарами"]
    ];
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    function renderNavbar() {
        const loggedIn = Boolean(localStorage.getItem("token"));
        const cart = readCart();
        const cartCount = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
        const pageLinks = links.map(([href, label]) => `
            <a class="site-nav__link${currentPage === href ? " is-active" : ""}"
               href="${href}"${currentPage === href ? ' aria-current="page"' : ""}>${label}</a>
        `).join("");
        const accountLinks = loggedIn
            ? `<a class="site-nav__action" href="account.html">Аккаунт</a>
               <button class="site-nav__action site-nav__logout" type="button" data-logout>Выйти</button>`
            : `<a class="site-nav__action" href="login.html">Войти</a>
               <a class="site-nav__action site-nav__register" href="register.html">Регистрация</a>`;

        header.innerHTML = `
            <div class="site-nav__inner">
                <a class="site-nav__brand" href="index.html">LOGO<span>.</span></a>
                <nav class="site-nav__links" aria-label="Основная навигация">${pageLinks}</nav>
                <div class="site-nav__actions">
                    <a class="site-nav__action site-nav__cart" href="cart.html">
                        Корзина <span class="site-nav__cart-count" data-cart-count>${cartCount}</span>
                    </a>
                    ${accountLinks}
                </div>
            </div>
        `;

        const logoutButton = header.querySelector("[data-logout]");
        if (logoutButton) {
            logoutButton.addEventListener("click", () => {
                localStorage.removeItem("token");
                renderNavbar();
            });
        }
    }

    function readCart() {
        try {
            const cart = JSON.parse(localStorage.getItem("logoStoreCart") || "[]");
            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    }

    renderNavbar();
    window.addEventListener("cart:updated", () => {
        const count = readCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
        const badge = header.querySelector("[data-cart-count]");
        if (badge) badge.textContent = String(count);
    });
    window.addEventListener("storage", renderNavbar);
})();