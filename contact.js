const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", event => {
    event.preventDefault();

    const recipient = document.getElementById("contactRecipient").value.trim();
    const name = document.getElementById("contactName").value.trim();
    const sender = document.getElementById("contactEmail").value.trim();
    const topic = document.getElementById("contactTopic").value;
    const message = document.getElementById("contactMessage").value.trim();
    const subject = encodeURIComponent(`[LOGO STORE] ${topic}`);
    const body = encodeURIComponent(
        `Имя: ${name}\nEmail для ответа: ${sender}\n\n${message}`
    );

    document.getElementById("contactStatus").textContent =
        "Открываем почтовое приложение с подготовленным письмом.";
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${subject}&body=${body}`;
});
