import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Merhaba! Size nasıl yardımcı olabilirim?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // 🔽 Chat her mesajdan sonra aşağı kayar
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // 🔥 Mesaj gönderme
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chatbot", {
        message: userMsg.text,
      });

      const botMsg = { sender: "bot", text: res.data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Bir hata oluştu, tekrar deneyin." },
      ]);
    }

    setLoading(false);
  };

  // 🔥 Enter tuşu = Gönder
  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="d-flex flex-column" style={{ height: "85vh" }}>
      {/* SAYFA BAŞLIĞI */}
      <h3 className="text-center py-3 mb-2 border-bottom shadow-sm">
        🤖 Kampüs Asistanı
      </h3>

      {/* MESAJLAR */}
      <div
        className="flex-grow-1 p-3"
        style={{
          overflowY: "auto",
          background: "#f7f9fc",
          borderRadius: "10px",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`d-flex mb-3 ${
              msg.sender === "user" ? "justify-content-end" : "justify-content-start"
            }`}
          >
            {/* Avatar */}
            {msg.sender === "bot" && (
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#0d6efd",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  fontWeight: "bold",
                }}
              >
                🤖
              </div>
            )}

            {/* Mesaj kutusu */}
            <div
              style={{
                maxWidth: "65%",
                padding: "10px 16px",
                borderRadius: "18px",
                background:
                  msg.sender === "user" ? "#0d6efd" : "#e9ecef",
                color: msg.sender === "user" ? "white" : "black",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text}
            </div>

            {msg.sender === "user" && (
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: "#6c757d",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 8,
                  fontWeight: "bold",
                }}
              >
                🧑
              </div>
            )}
          </div>
        ))}

        {/* BOT TYPING */}
        {loading && (
          <div className="d-flex mb-3">
            <div
              style={{
                width: 40,
                height: 40,
                background: "#0d6efd",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
            >
              🤖
            </div>
            <div
              style={{
                background: "#e9ecef",
                padding: "10px 16px",
                borderRadius: "18px",
                fontStyle: "italic",
                color: "#555",
              }}
            >
              Yazıyor...
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      {/* INPUT + BUTTON */}
      <div className="d-flex gap-2 mt-3">
        <input
          className="form-control"
          type="text"
          placeholder="Mesaj yazın..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary px-4" onClick={sendMessage}>
          Gönder
        </button>
      </div>
    </div>
  );
}
