
const API_URL = "http://195.26.245.5:9505/api/products";
const STORAGE_KEY = "logoStoreCustomProducts";
const OVERRIDE_KEY = "logoStoreProductOverrides";
const HIDDEN_KEY = "logoStoreHiddenProducts";

let products = [];

const $ = id => document.getElementById(id);

function read(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[c]);
}

async function loadProducts() {
    const list = $("manageList");

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("API error");

        const apiProducts = await response.json();
        if (!Array.isArray(apiProducts)) throw new Error("Invalid data");

        const overrides = read(OVERRIDE_KEY, {});
        const hidden = read(HIDDEN_KEY, []);

        products = [
            ...apiProducts
                .filter(p => !hidden.includes(String(p.id)))
                .map(p => ({ ...p, ...(overrides[String(p.id)] || {}) })),
            ...read(STORAGE_KEY, [])
        ];

        render();
    } catch (error) {
        console.error(error);

        products = read(STORAGE_KEY, []);
        render();

        list.insertAdjacentHTML(
            "afterbegin",
            '<p class="muted">Сервер недоступен. Показаны только сохранённые здесь товары.</p>'
        );
    }
}

function render() {
    const list = $("manageList");

    if (!products.length) {
        list.innerHTML = "<p>Товаров пока нет.</p>";
        return;
    }

    list.innerHTML = products.map((p, index) => `
        <article class="card">
            ${p.imageUrl
                ? `<img class="card_img" src="${safe(p.imageUrl)}" alt="">`
                : ""}
            <h3 class="card_title">${safe(p.brand)} ${safe(p.model)}</h3>
            <p class="card_price">$${Number(p.price || 0).toFixed(2)}</p>
            <p>${safe(p.description || "Без описания")}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                <button type="button" data-edit="${index}">Изменить</button>
                <button type="button" data-delete="${index}"
                        class="secondary-btn">Удалить</button>
            </div>
        </article>
    `).join("");

    list.querySelectorAll("[data-edit]").forEach(button => {
        button.addEventListener("click", () => editProduct(+button.dataset.edit));
    });

    list.querySelectorAll("[data-delete]").forEach(button => {
        button.addEventListener("click", () => deleteProduct(+button.dataset.delete));
    });
}

function editProduct(index) {
    const p = products[index];
    if (!p) return;

    $("editId").value = p.id != null ? String(p.id) : `custom:${p._customId}`;
    $("brand").value = p.brand || "";
    $("model").value = p.model || "";
    $("price").value = p.price || 0;
    $("imageUrl").value = p.imageUrl || "";
    $("description").value = p.description || "";
    $("saveButton").textContent = "Сохранить изменения";

    $("productForm").scrollIntoView({ behavior: "smooth" });
}

$("productForm").addEventListener("submit", event => {
    event.preventDefault();

    const editId = $("editId").value;
    const product = {
        brand: $("brand").value.trim(),
        model: $("model").value.trim(),
        price: Number($("price").value),
        imageUrl: $("imageUrl").value.trim(),
        description: $("description").value.trim()
    };

    if (!product.brand || !product.model ||
        !Number.isFinite(product.price) || product.price < 0) {
        alert("Проверь название и цену товара.");
        return;
    }

    if (editId.startsWith("custom:")) {
        const customId = editId.slice(7);
        const customProducts = read(STORAGE_KEY, []);
        const index = customProducts.findIndex(
            p => String(p._customId) === customId
        );

        if (index !== -1) customProducts[index] = {
            ...customProducts[index], ...product
        };

        save(STORAGE_KEY, customProducts);
    } else if (editId) {
        const overrides = read(OVERRIDE_KEY, {});
        overrides[editId] = {
            ...(overrides[editId] || {}), ...product
        };
        save(OVERRIDE_KEY, overrides);
    } else {
        const customProducts = read(STORAGE_KEY, []);

        customProducts.push({
            ...product,
            id: `custom-${Date.now()}`,
            _customId: `${Date.now()}-${Math.random().toString(36).slice(2)}`
        });

        save(STORAGE_KEY, customProducts);
    }

    resetForm();
    loadProducts();
});

function deleteProduct(index) {
    const p = products[index];
    if (!p || !confirm(`Удалить «${p.brand} ${p.model}» из каталога этого браузера?`)) {
        return;
    }

    if (p._customId) {
        save(STORAGE_KEY, read(STORAGE_KEY, []).filter(
            item => item._customId !== p._customId
        ));
    } else {
        const hidden = read(HIDDEN_KEY, []);
        if (!hidden.includes(String(p.id))) hidden.push(String(p.id));
        save(HIDDEN_KEY, hidden);
    }

    loadProducts();
}

function resetForm() {
    $("productForm").reset();
    $("editId").value = "";
    $("saveButton").textContent = "Добавить товар";
}

$("cancelButton").addEventListener("click", resetForm);

loadProducts();
