
const API_URL = "http://195.26.245.5:9505/api";
const id = new URLSearchParams(location.search).get("id");

const productBox = document.getElementById("product");
const reviewsBox = document.getElementById("reviews");

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
                ${product.averageRating != null
                    ? `<p>Рейтинг: ${Number(product.averageRating).toFixed(1)} / 5</p>`
                    : ""}
                <p>${escapeHTML(product.description || "Описание пока отсутствует.")}</p>
                <button class="add-cart-btn" id="addProductToCart" type="button">В корзину</button>
            </div>
        `;

        document.getElementById("addProductToCart").addEventListener("click", event => {
            if (typeof window.addToCart === "function") {
                window.addToCart(product);
                event.currentTarget.textContent = "Добавлено";
            }
        });

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
    const token = localStorage.getItem("token");
    if (!token) {
        reviewsBox.innerHTML = '<p><a href="login.html">Войдите</a>, чтобы просматривать и оставлять отзывы.</p>';
        return;
    }

    loadReviews(token);
}

async function loadReviews(token) {
    reviewsBox.innerHTML = "<p>Загружаем отзывы...</p>";
    try {
        const query = new URLSearchParams({ page: "0", size: "20" });
        const response = await fetch(
            `${API_URL}/reviews/product/${encodeURIComponent(id)}?${query}`,
            { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
        );
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            reviewsBox.innerHTML = '<p>Сессия завершилась. <a href="login.html">Войдите снова</a>, чтобы просматривать отзывы.</p>';
            return;
        }
        if (!response.ok) throw new Error(`Ошибка загрузки отзывов: ${response.status}`);

        const result = await response.json();
        const page = result?.body ?? result?.data ?? result;
        const reviews = Array.isArray(page) ? page : page?.content || page?.items || [];
        renderReviewContent(reviews, token);
    } catch (error) {
        console.error(error);
        reviewsBox.innerHTML = `<p>${escapeHTML(error.message || "Не удалось загрузить отзывы.")}</p>`;
    }
}

function renderReviewContent(reviews, token) {
    reviewsBox.innerHTML = `
        <div class="review-form">
            <h3>Оставить отзыв</h3>
            <form id="reviewForm">
                <label for="reviewTitle">Заголовок</label>
                <input id="reviewTitle" maxlength="120" required>

                <label for="reviewComment">Текст отзыва</label>
                <textarea id="reviewComment" maxlength="1000" required></textarea>

                <label for="reviewRating">Оценка</label>
                <select id="reviewRating" required>
                    <option value="5">★★★★★ — Отлично</option>
                    <option value="4">★★★★☆ — Хорошо</option>
                    <option value="3">★★★☆☆ — Нормально</option>
                    <option value="2">★★☆☆☆ — Плохо</option>
                    <option value="1">★☆☆☆☆ — Очень плохо</option>
                </select>

                <button type="submit">Опубликовать отзыв</button>
                <p id="reviewMessage" role="status"></p>
            </form>
        </div>

        <div class="reviews-list">
            <h3>Отзывы (${reviews.length})</h3>
            ${reviews.length ? reviews.map(review => `
                <article class="review-card">
                    <strong>${escapeHTML(review.title || "Отзыв")}</strong>
                    <p>${escapeHTML(review.comment)}</p>
                </article>
            `).join("") : "<p>Пока отзывов нет.</p>"}
        </div>
    `;

    document.getElementById("reviewForm").addEventListener("submit", async event => {
        event.preventDefault();
        const message = document.getElementById("reviewMessage");
        const title = document.getElementById("reviewTitle").value.trim();
        const comment = document.getElementById("reviewComment").value.trim();
        const rating = Number(document.getElementById("reviewRating").value);
        if (!title || !comment) return;

        message.textContent = "Отправка...";
        try {
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            };
            const response = await fetch(`${API_URL}/reviews`, {
                method: "POST",
                headers,
                body: JSON.stringify({ title, comment, productId: Number(id) })
            });
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                throw new Error("Сессия завершилась. Войдите снова.");
            }
            if (!response.ok) throw new Error(`Ошибка публикации: ${response.status}`);

            let ratingSaved = true;
            try {
                const ratingResponse = await fetch(`${API_URL}/ratings`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ rating, productId: Number(id) })
                });
                ratingSaved = ratingResponse.ok;
            } catch {
                ratingSaved = false;
            }

            await loadReviews(token);
            if (!ratingSaved) {
                message.textContent = "Отзыв опубликован, но оценку сохранить не удалось.";
            }
        } catch (error) {
            message.textContent = error.message || "Не удалось опубликовать отзыв.";
        }
    });
}

loadProduct();
