
const API = "http://195.26.245.5:9505/api/products";

let allProducts = [];

function readStore(key, fallback = []) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function escapeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[c]);
}

async function loadProducts() {
    const box = document.getElementById("products") ||
                document.getElementById("cataloq");

    if (!box) return;

    box.innerHTML = "<p>Загружаем товары...</p>";

    try {
        const response = await fetch(API);
        if (!response.ok) throw new Error("Ошибка API");

        const apiProducts = await response.json();
        const overrides = readStore("logoStoreProductOverrides", {});
        const hidden = readStore("logoStoreHiddenProducts", []);

        allProducts = [
            ...apiProducts
                .filter(p => !hidden.includes(String(p.id)))
                .map(p => ({ ...p, ...(overrides[String(p.id)] || {}) })),
            ...readStore("logoStoreCustomProducts", [])
        ];

        showProducts(allProducts);
    } catch (error) {
        console.error(error);

        allProducts = readStore("logoStoreCustomProducts", []);
        showProducts(allProducts);

        if (!allProducts.length) {
            box.innerHTML = "<p>Не удалось загрузить товары. Проверь сервер.</p>";
        }
    }
}

function showProducts(products) {
    const box = document.getElementById("products") ||
                document.getElementById("cataloq");

    if (!box) return;

    box.innerHTML = products.map(product => {
        const id = product.id;
        const detailsHref = `product.html?id=${encodeURIComponent(id)}`;

        return `
            <article class="card">
                ${product.imageUrl
                    ? `<img class="card_img"
                         src="${escapeText(product.imageUrl)}"
                         alt="${escapeText(product.brand)} ${escapeText(product.model)}">`
                    : ""}

                <h3 class="card_title">
                    ${escapeText(product.brand)} ${escapeText(product.model)}
                </h3>

                <p class="card_price">
                    $${Number(product.price || 0).toFixed(2)}
                </p>

                <a class="details-btn" href="${detailsHref}">
                    Подробнее <span>→</span>
                </a>
            </article>
        `;
    }).join("") || "<p>Товаров пока нет.</p>";
}

function searchProducts() {
    const input = document.getElementById("search");
    const query = (input?.value || "").toLowerCase().trim();

    showProducts(allProducts.filter(product =>
        `${product.brand || ""} ${product.model || ""}`
            .toLowerCase().includes(query)
    ));
}

function sortByPrice() {
    showProducts([...allProducts].sort(
        (a, b) => Number(a.price) - Number(b.price)
    ));
}

loadProducts();
