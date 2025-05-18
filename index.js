document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("messageForm");
  const nameInput = document.getElementById("name");
  const messageInput = document.getElementById("message");
  const messagesList = document.getElementById("messagesList");

  const createToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const loadMessages = async () => {
    try {
      const res = await fetch("/messages");
      const messages = await res.json();
      messagesList.innerHTML = "";
      messages.forEach((msg) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${msg.name}</strong>: ${msg.message} <br/><small>(${new Date(msg.timestamp).toLocaleString()})</small>`;
        li.classList.add("fade-in");
        messagesList.appendChild(li);
      });
    } catch (err) {
      createToast("Failed to load messages", "error");
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
      createToast("Both fields are required!", "error");
      return;
    }

    try {
      const res = await fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (res.ok) {
        nameInput.value = "";
        messageInput.value = "";
        createToast("Message sent successfully!");
        loadMessages();
      } else {
        createToast("Failed to send message", "error");
      }
    } catch (err) {
      createToast("Something went wrong", "error");
    }
  });

  loadMessages();
});
