// http://195.26.245.5:9505/api/products/{id}

const API_URL = "http://195.26.245.5:9505/api";
const id = new URLSearchParams(location.search).get("id");

async function loadProduct() {
    const box = document.getElementById("product");
    const response = await fetch(API_URL + "/products/" + id);
    const product = await response.json();

    box.innerHTML = `
        <img class="product_img" src="${product.imageUrl}" alt="">
        <h1>${product.brand} ${product.model}</h1>
        <p>${product.price}</p>
        <p>${product.description}</p>
    `;
}

loadProduct();