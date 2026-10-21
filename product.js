
const API_URL = "http://195.26.245.5:9505/api";
const id = new URLSearchParams(location.search).get("id");

const reviewsKey = "logoStoreReviews";
const productBox = document.getElementById("product");
const reviewsBox = document.getElementById("reviews");

function getReviews() {
    try {
        return JSON.parse(localStorage.getItem(reviewsKey) || "{}");
    } catch {
        return {};
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function loadProduct() {
    if (!id || !productBox) {
        if (productBox) productBox.innerHTML = "<p>Товар не найден.</p>";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/products/${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error("Не удалось загрузить товар");

        const product = await response.json();

        productBox.innerHTML = `
            <img class="product_img"
                 src="${escapeHTML(product.imageUrl)}"
                 alt="${escapeHTML(product.brand)} ${escapeHTML(product.model)}">

            <div class="product-info">
                <p class="muted">Информация о товаре</p>
                <h1>${escapeHTML(product.brand)} ${escapeHTML(product.model)}</h1>
                <p class="price">$${Number(product.price || 0).toFixed(2)}</p>
                <p>${escapeHTML(product.description || "Описание пока отсутствует.")}</p>
            </div>
        `;

        const breadcrumb = document.getElementById("breadcrumbProduct");
        if (breadcrumb) breadcrumb.textContent = `${product.brand || ""} ${product.model || ""}`;

        renderReviews();
    } catch (error) {
        console.error(error);
        productBox.innerHTML = "<p>Не удалось загрузить товар. Проверь подключение к серверу.</p>";
        renderReviews();
    }
}

function renderReviews() {
    if (!reviewsBox) return;

    const allReviews = getReviews();
    const reviews = allReviews[String(id)] || [];

    reviewsBox.innerHTML = `
        <div class="review-form">
            <h3>Оставить отзыв</h3>
            <form id="reviewForm">
                <label for="reviewName">Твоё имя</label>
                <input id="reviewName" maxlength="50"
                       placeholder="Например, Alex" required>

                <label for="reviewRating">Оценка</label>
                <select id="reviewRating" required>
                    <option value="5">★★★★★ — Отлично</option>
                    <option value="4">★★★★☆ — Хорошо</option>
                    <option value="3">★★★☆☆ — Нормально</option>
                    <option value="2">★★☆☆☆ — Плохо</option>
                    <option value="1">★☆☆☆☆ — Очень плохо</option>
                </select>

                <label for="reviewText">Твой отзыв</label>
                <textarea id="reviewText" maxlength="1000"
                          placeholder="Расскажи о товаре..." required></textarea>

                <button type="submit">Опубликовать отзыв</button>
            </form>
        </div>

        <div class="reviews-list">
            <h3>Отзывы (${reviews.length})</h3>
            ${reviews.length ? reviews.slice().reverse().map(review => `
                <article class="review-card">
                    <div class="review-heading">
                        <strong>${escapeHTML(review.name)}</strong>
                        <span class="review-stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
                    </div>
                    <p>${escapeHTML(review.text)}</p>
                    <small>${escapeHTML(review.date)}</small>
                </article>
            `).join("") : "<p>Пока нет отзывов. Будь первым!</p>"}
        </div>
    `;

    document.getElementById("reviewForm").addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById("reviewName").value.trim();
        const text = document.getElementById("reviewText").value.trim();
        const rating = Number(document.getElementById("reviewRating").value);

        if (!name || !text || rating < 1 || rating > 5) return;

        const data = getReviews();
        if (!Array.isArray(data[String(id)])) data[String(id)] = [];

        data[String(id)].push({
            name,
            text,
            rating,
            date: new Date().toLocaleDateString("ru-RU")
        });

        localStorage.setItem(reviewsKey, JSON.stringify(data));
        renderReviews();
    });
}

loadProduct();
