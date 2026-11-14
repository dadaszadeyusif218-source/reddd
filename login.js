const API_URL = "http://195.26.245.5:9505/api";

async function login(event) {
    event.preventDefault();
    const user = {
        username: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
    };

    try {
        const response = await fetch(`${API_URL}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(user)
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(result?.body?.message || result?.message || "Неверный логин или пароль.");
        }

        const token = result?.body?.token || result?.token;
        if (!token) throw new Error("Сервер не вернул JWT-токен.");

        localStorage.setItem("token", token);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Ошибка входа:", error);
        alert(error.message || "Не удалось войти. Проверьте подключение к серверу.");
    }
}