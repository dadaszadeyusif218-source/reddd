const API_URL = "http://195.26.245.5:9505/api";

const loader = document.getElementById("loader");
const content = document.getElementById("content");
const errorBox = document.getElementById("error");
const errorText = document.getElementById("error-text");
const retryButton = document.getElementById("retry");
const logoutButton = document.getElementById("logout");

function showError(message) {
    loader.classList.add("hidden");
    content.classList.add("hidden");
    errorBox.classList.remove("hidden");
    errorText.textContent = message;
}

function showValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent =
            value == null || value === "" ? "—" : String(value);
    }
}

async function loadProfile() {
    const token = localStorage.getItem("token");

    errorBox.classList.add("hidden");
    content.classList.add("hidden");
    loader.classList.remove("hidden");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/clients/get-details`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            }
        );

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");

            showError(
                "Сессия завершилась. Войдите в аккаунт заново."
            );

            return;
        }

        if (!response.ok) {
            throw new Error(
                `Ошибка сервера: ${response.status}`
            );
        }

        const result = await response.json();
        const user = result?.body ?? result?.user ?? result;

        showValue("name", user.name);
        showValue("surname", user.surname);
        showValue("email", user.email);
        showValue("username", user.username);

        loader.classList.add("hidden");
        errorBox.classList.add("hidden");
        content.classList.remove("hidden");

    } catch (error) {
        console.error("Ошибка загрузки профиля:", error);

        showError(
            "Не удалось загрузить профиль. " +
            (error.message || "Проверьте соединение с сервером.")
        );
    }
}

retryButton.addEventListener("click", loadProfile);

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "login.html";
});

loadProfile();