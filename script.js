const API = 'http://195.26.245.5:9505/api/products';
//Здесь сохраняется адрес сервера.
//Создаётся функция loadProducts. Она async, потому что внутри будет ожидание ответа от сервера.
async function loadProducts() {
    const box = document.getElementById('products') || document.getElementById('cataloq');

    if (!box) {
        console.warn('Контейнер товаров не найден.');
        return;
    }

    try {
        const response = await fetch(API);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const products = await response.json();

        if (!Array.isArray(products)) {
            box.innerHTML = '<p>Нет товаров</p>';
            return;
        }

        box.innerHTML = products.map(product => productCard(product)).join('');
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        box.innerHTML = '<p>Не удалось загрузить товары</p>';
    }
}

function productCard(product) {
    return `
        <div class="card">
            <img class="card_img" src="${product.imageUrl}">
            <h3 class="card_title">${product.brand} ${product.model}</h3>
            <p class="card_price">$${Number(product.price || 0).toFixed(2)}</p>
        </div>
    `;
}

loadProducts();
function searchProducts(){
    const text = document.getElementById("search").value.toLowerCase();
    const filtered = allProducts.filter(product=>{
        const name = product.brand + " " + product.model;
        return name.toLowerCase().includes(text);
    });
    showProducts(filtered)
}

function sortByPrice(){
    allProducts.sort((a,b)=>a.price-b.price);
    showProducts(allProducts);
}