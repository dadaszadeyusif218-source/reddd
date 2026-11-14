
const API = "http://195.26.245.5:9505/api/products";

let allProducts = [];
let categoryNamesById = new Map();

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
        if (document.getElementById("filterCategory")) {
            await loadCategoryNames();
        }

        const response = await fetch(API);
        if (!response.ok) throw new Error("Ошибка API");

        const apiProducts = await response.json();
        if (!Array.isArray(apiProducts)) throw new Error("Некорректный ответ API");
        allProducts = apiProducts;

        applyCatalogFilters();
    } catch (error) {
        console.error(error);

        allProducts = [];
        box.innerHTML = "<p>Не удалось загрузить товары. Проверь сервер.</p>";
    }
}

async function loadCategoryNames() {
    try {
        const response = await fetch(API.replace("/products", "/categories"));
        if (!response.ok) return;

        const categories = await response.json();
        if (Array.isArray(categories)) {
            categoryNamesById = new Map(
                categories.map(category => [String(category.id), category.name || ""])
            );
        }
    } catch (error) {
        console.warn("Не удалось загрузить категории", error);
    }
}

function showProducts(products) {
    const box = document.getElementById("products") ||
                document.getElementById("cataloq");

    if (!box) return;

    box.innerHTML = products.map(product => {
        const id = product.id;
        const detailsHref = `product.html?id=${encodeURIComponent(id)}`;
        const cartProduct = escapeText(JSON.stringify({
            id,
            brand: product.brand,
            model: product.model,
            price: product.price,
            imageUrl: product.imageUrl
        }));

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
                <button class="add-cart-btn" type="button" data-add-cart="${cartProduct}">
                    В корзину
                </button>
            </article>
        `;
    }).join("") || "<p>Товаров пока нет.</p>";
}

function applyCatalogFilters() {
    const searchInput = document.getElementById("filterSearch");
    if (!searchInput) {
        showProducts(allProducts);
        return;
    }

    const category = document.getElementById("filterCategory").value;
    const minInput = document.getElementById("minPrice").value;
    const maxInput = document.getElementById("maxPrice").value;
    const sort = document.getElementById("sortProducts").value;
    const query = searchInput.value.trim().toLowerCase();
    const minPrice = minInput === "" ? 0 : Number(minInput);
    const maxPrice = maxInput === "" ? Infinity : Number(maxInput);

    const filtered = allProducts.filter(product => {
        const name = `${product.brand || ""} ${product.model || ""} ${product.name || ""}`
            .toLowerCase();
        const categoryName = String(
            categoryNamesById.get(String(product.categoryId))
                || product.category?.name
                || product.categoryName
                || product.category
                || ""
        ).toLowerCase();
        const searchableText = `${name} ${categoryName}`;
        const price = Number(product.price) || 0;
        let matchesCategory = true;

        if (category === "computer") {
            matchesCategory = /computer|laptop|pc|ноутбук|компьютер|пк|macbook|xps|gaming/i.test(searchableText);
        } else if (category === "phone") {
            matchesCategory = /phone|smartphone|mobile|iphone|android|телефон|смартфон|galaxy|\bs\d{1,2}\b|honor|xiaomi/i.test(searchableText);
        } else if (category === "accessory") {
            matchesCategory = /accessor|аксессуар|headphones?|наушник|keyboard|клавиатура|mouse|мышь|quietcomfort|wh-\d+/i.test(searchableText);
        }

        return searchableText.includes(query)
            && matchesCategory
            && price >= minPrice
            && price <= maxPrice;
    });

    if (sort === "cheap") {
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "expensive") {
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "name") {
        filtered.sort((a, b) =>
            `${a.brand || ""} ${a.model || a.name || ""}`.localeCompare(
                `${b.brand || ""} ${b.model || b.name || ""}`
            )
        );
    }

    document.getElementById("filterCount").textContent = `Найдено товаров: ${filtered.length}`;
    showProducts(filtered);
}

function bindCatalogFilters() {
    const controls = [
        "filterSearch",
        "filterCategory",
        "minPrice",
        "maxPrice",
        "sortProducts"
    ].map(id => document.getElementById(id)).filter(Boolean);

    controls.forEach(control => {
        control.addEventListener("input", applyCatalogFilters);
        control.addEventListener("change", applyCatalogFilters);
    });

    const resetButton = document.getElementById("resetFilters");
    if (resetButton) {
        resetButton.addEventListener("click", () => {
            controls.forEach(control => {
                control.value = "";
            });
            applyCatalogFilters();
        });
    }
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

bindCatalogFilters();
loadProducts();
