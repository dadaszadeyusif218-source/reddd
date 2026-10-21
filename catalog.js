const API_URL = "http://195.26.245.5:9505/api";
let allproduct=[]
async function loadProducts() {

    const box = document.getElementById("products")
    const response = await fetch(API_URL + "/products")
    const products = await response.json();
    allproduct=products
    let html = "";
    for (const product of products) {
        html += productCard(product);
    }
    box.innerHTML = html
}
loadProducts()


async function showProducts(products) {
    const box = document.getElementById("products")
    if(products.length===0){
            box.innerHTML="<p> Нчиего не найдено</p>"
            return;
    }

   let html = "";
    for (const product of products) {
        html += productCard(product);
    }
        box.innerHTML = html

}

function productCard(product) {
    return `
<div class="card">
<img class="card_img" src="${product.imageUrl}"> 
<h3 class="card_title">${product.brand} ${product.model} </h3>
<p class="card_price">${product.price} </p>
<button onclick="openProduct(${product.id})">See Details</button>

`
}

function searchProducts(){
    const text =document.getElementById("search").value.toLowerCase();
    const filtered=allproduct.filter(product=>{
        const name=product.brand + " "+ product.model;
        return name.toLowerCase().includes(text)
    })
    showProducts(filtered)
}
function sortByPrice(){
    allproduct.sort((a,b)=>a.price-b.price);
    showProducts(allproduct)
}

async function loadCategories() {
    const box =document.getElementById("categories");
    const response=await fetch(API_URL +"/categories")
    const categories=await response.json()
    let html="";
    for(const category of categories){
html+=`<button onclick="filterByCategory(${category.id})">${category.name}</button>`
    }
    box.innerHTML=html
}
loadCategories()
function filterByCategory(categoryId){
    const filtered=allproduct.filter(product=>product.categoryId===categoryId)
    showProducts(filtered)

}
function openProduct(id){
location.href="product.html?id=" +id;
}
// Фильтры каталога
const filterSearch = document.getElementById("filterSearch");
const filterCategory = document.getElementById("filterCategory");
const minPrice = document.getElementById("minPrice");
const maxPrice = document.getElementById("maxPrice");
const sortProducts = document.getElementById("sortProducts");
const resetFilters = document.getElementById("resetFilters");
const filterCount = document.getElementById("filterCount");

function applyProductFilters() {
    // Используй массив products из своего существующего catalog.js
    if (!Array.isArray(products)) return;

    const search = filterSearch.value.trim().toLowerCase();
    const category = filterCategory.value;
    const min = minPrice.value === "" ? 0 : Number(minPrice.value);
    const max = maxPrice.value === "" ? Infinity : Number(maxPrice.value);
    const sort = sortProducts.value;

    let filtered = products.filter(product => {
        const name = `${product.brand || ""} ${product.model || ""} ${product.name || ""}`
            .toLowerCase();

        const price = Number(product.price) || 0;

        // Определяем категорию по названию товара
        const categoryText = `${product.category?.name || product.category || ""} ${name}`
            .toLowerCase();

        let matchesCategory = true;

        if (category === "computer") {
            matchesCategory = /computer|laptop|pc|ноутбук|компьютер|пк/i.test(categoryText);
        } else if (category === "phone") {
            matchesCategory = /phone|smartphone|mobile|телефон|смартфон/i.test(categoryText);
        } else if (category === "accessory") {
            matchesCategory = /accessory|аксессуар|headphone|наушник|keyboard|клавиатура|mouse|мышь/i.test(categoryText);
        }

        return name.includes(search)
            && matchesCategory
            && price >= min
            && price <= max;
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

    filterCount.textContent = `Найдено товаров: ${filtered.length}`;

    // Вызываем функцию отображения из твоего каталога.
    // Здесь renderProducts должна принимать массив товаров.
    renderProducts(filtered);
}

[
    filterSearch,
    filterCategory,
    minPrice,
    maxPrice,
    sortProducts
].forEach(element => {
    element.addEventListener("input", applyProductFilters);
    element.addEventListener("change", applyProductFilters);
});

resetFilters.addEventListener("click", () => {
    filterSearch.value = "";
    filterCategory.value = "";
    minPrice.value = "";
    maxPrice.value = "";
    sortProducts.value = "";
    applyProductFilters();
});