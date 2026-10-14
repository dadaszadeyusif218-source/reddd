const BASE_URL = "https://YOUR_BASE_URL"; // из Swagger

const loader = document.getElementById("loader");
const content = document.getElementById("content");
const errorBox = document.getElementById("error");

function show(state) {
  loader.classList.toggle("hidden", state !== "loading");
  content.classList.toggle("hidden", state !== "success");
  errorBox.classList.toggle("hidden", state !== "error");
}

async function loadUser() {
  show("loading");
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      logout();
      return;
    }
    if (!res.ok) throw new Error(`Ошибка ${res.status}`);

    const user = await res.json();
    document.getElementById("name").textContent = user.name;
    document.getElementById("email").textContent = user.email;
    show("success");
  } catch (e) {
    document.getElementById("error-text").textContent = e.message;
    show("error");
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.replace("login.html"); // replace, чтобы «Назад» не вернул сюда
}

document.getElementById("retry").addEventListener("click", loadUser);
document.getElementById("logout").addEventListener("click", logout);

loadUser();