const API_URL = "http://195.26.245.5:9505/api";
const PRODUCTS_URL = `${API_URL}/products`;
const PAGE_SIZE = 10;

let products = [];
let currentPage = 0;
let totalPages = 1;
let hasNextPage = false;

const $ = id => document.getElementById(id);

function safe(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[c]);
}

function authHeaders(json = false) {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
    if (json) headers["Content-Type"] = "application/json";
    return headers;
}

async function readResponse(response) {
    const result = await response.json().catch(() => null);
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        throw new Error("Сессия завершилась. Войдите снова.");
    }
    if (!response.ok) {
        throw new Error(result?.message || `Ошибка сервера: ${response.status}`);
    }
    return result?.body ?? result?.data ?? result;
}

async function loadCategories() {
    const response = await fetch(`${API_URL}/categories`, {
        headers: authHeaders()
    });
    const result = await readResponse(response);
    const categories = Array.isArray(result) ? result : result?.content || [];
    $("categoryId").innerHTML = '<option value="">Выберите категорию</option>' +
        categories.map(category => `
            <option value="${safe(category.id)}">${safe(category.name)}</option>
        `).join("");
}

async function loadProducts() {
    const list = $("manageList");
    if (!localStorage.getItem("token")) {
        list.innerHTML = '<p class="muted">Войдите в аккаунт, чтобы увидеть свои товары.</p>';
        window.location.href = "login.html";
        return;
    }

    list.innerHTML = "<p>Загрузка товаров...</p>";

    try {
        await loadCategories();
        const query = new URLSearchParams({ page: String(currentPage), size: String(PAGE_SIZE) });
        const response = await fetch(`${PRODUCTS_URL}/myProducts?${query}`, {
            headers: authHeaders()
        });
        const page = await readResponse(response);
        const pageData = page?.page && typeof page.page === "object" ? page.page : page;

        products = Array.isArray(pageData)
            ? pageData
            : pageData?.content || pageData?.items || pageData?.products || [];
        totalPages = Number(pageData?.totalPages ?? page?.totalPages ?? 1);
        hasNextPage = Boolean(pageData?.hasNext ?? page?.hasNext ?? (
            products.length === PAGE_SIZE && currentPage + 1 < totalPages
        ));
        $("pageIndicator").textContent = `Страница ${currentPage + 1}${totalPages > 1 ? ` из ${totalPages}` : ""}`;
        render();
    } catch (error) {
        console.error(error);
        list.innerHTML = `<p class="muted">${safe(error.message || "Не удалось загрузить товары.")}</p>`;
    }
}

function render() {
    const list = $("manageList");
    if (!products.length) {
        list.innerHTML = "<p>На этой странице пока нет товаров.</p>";
    } else {
        list.innerHTML = products.map((product, index) => `
            <article class="card">
                ${product.imageUrl
                    ? `<img class="card_img" src="${safe(product.imageUrl)}" alt="">`
                    : ""}
                <h3 class="card_title">${safe(product.brand)} ${safe(product.model)}</h3>
                <p class="card_price">$${Number(product.price || 0).toFixed(2)}</p>
                <p>${safe(product.description || "Без описания")}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
                    <button type="button" data-edit="${index}">Изменить</button>
                    <button type="button" data-delete="${index}" class="secondary-btn">Удалить</button>
                </div>
            </article>
        `).join("");
    }

    $("previousPage").disabled = currentPage === 0;
    $("nextPage").disabled = !hasNextPage;
    list.querySelectorAll("[data-edit]").forEach(button => {
        button.addEventListener("click", () => editProduct(Number(button.dataset.edit)));
    });
    list.querySelectorAll("[data-delete]").forEach(button => {
        button.addEventListener("click", () => deleteProduct(Number(button.dataset.delete)));
    });
}

function editProduct(index) {
    const product = products[index];
    if (!product) return;

    $("editId").value = String(product.id);
    $("brand").value = product.brand || "";
    $("model").value = product.model || "";
    $("price").value = product.price ?? "";
    $("imageUrl").value = product.imageUrl || "";
    $("description").value = product.description || "";
    $("categoryId").value = String(product.categoryId || "");
    $("saveButton").textContent = "Сохранить изменения";
    $("productForm").scrollIntoView({ behavior: "smooth" });
}

$("productForm").addEventListener("submit", async event => {
    event.preventDefault();
    const editId = $("editId").value;
    const categoryId = Number($("categoryId").value);
    const product = {
        brand: $("brand").value.trim(),
        model: $("model").value.trim(),
        description: $("description").value.trim(),
        imageUrl: $("imageUrl").value.trim(),
        price: Number($("price").value),
        categoryId
    };

    if (!product.brand || !product.model || !Number.isFinite(product.price) ||
        product.price < 0 || !Number.isInteger(categoryId)) {
        $("formMessage").textContent = "Заполните название, цену и категорию товара.";
        return;
    }

    const isEdit = Boolean(editId);
    $("formMessage").textContent = "Сохранение...";
    try {
        const response = await fetch(PRODUCTS_URL, {
            method: isEdit ? "PUT" : "POST",
            headers: authHeaders(true),
            body: JSON.stringify(isEdit ? { ...product, id: Number(editId) } : product)
        });
        await readResponse(response);
        resetForm();
        currentPage = 0;
        await loadProducts();
        $("formMessage").textContent = isEdit ? "Изменения сохранены." : "Товар добавлен.";
    } catch (error) {
        $("formMessage").textContent = error.message || "Не удалось сохранить товар.";
    }
});

async function deleteProduct(index) {
    const product = products[index];
    if (!product || !confirm(`Удалить «${product.brand} ${product.model}»?`)) return;

    try {
        const response = await fetch(
            `${PRODUCTS_URL}/delete/${encodeURIComponent(product.id)}`,
            { method: "DELETE", headers: authHeaders() }
        );
        await readResponse(response);
        await loadProducts();
    } catch (error) {
        alert(error.message || "Не удалось удалить товар.");
    }
}

function resetForm() {
    $("productForm").reset();
    $("editId").value = "";
    $("saveButton").textContent = "Добавить товар";
    $("formMessage").textContent = "";
}

$("cancelButton").addEventListener("click", resetForm);
$("previousPage").addEventListener("click", () => {
    if (currentPage > 0) {
        currentPage--;
        loadProducts();
    }
});
$("nextPage").addEventListener("click", () => {
    if (hasNextPage) {
        currentPage++;
        loadProducts();
    }
});

loadProducts();
