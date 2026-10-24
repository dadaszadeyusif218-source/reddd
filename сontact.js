
const API = "http://195.26.245.5:9505/api";
document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.getElementById("contactForm");
    const formStatus = document.getElementById("formStatus");
    const submitBtn = document.getElementById("submitBtn");

    if (!contactForm) {
        console.error(
            "Не найдена форма #contactForm. Проверь contact.html."
        );
        return;
    }

    function showStatus(message, type) {
        if (!formStatus) {
            alert(message);
            return;
        }

        formStatus.textContent = message;
        formStatus.className = type;
    }

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const subject = document.getElementById("subject")?.value;
        const message = document.getElementById("message")?.value.trim();

        if (!name || name.length < 2) {
            showStatus("Введите имя (минимум 2 символа).", "error");
            return;
        }

        if (!email || !subject || !message || message.length < 10) {
            showStatus(
                "Заполните все поля. Сообщение должно содержать минимум 10 символов.",
                "error"
            );
            return;
        }

        const contactMessage = {
            name,
            email,
            subject,
            message
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Отправка...";
        }

        try {
            // Endpoint /contact должен существовать на сервере.
            const response = await fetch(`${API}/contact`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(contactMessage)
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            showStatus("Сообщение успешно отправлено!", "success");
            contactForm.reset();

        } catch (error) {
            console.error("Ошибка отправки контакта:", error);

            showStatus(
                "Не удалось отправить сообщение. Проверь API и подключение к серверу.",
                "error"
            );
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Отправить сообщение →";
            }
        }
    });
});
