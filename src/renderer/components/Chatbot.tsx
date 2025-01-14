import React, { useState } from "react";

function Chatbot() {
  const [messages, setMessages] = useState<{ text: string; user: string }[]>(
    []
  );
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() !== "") {
      setMessages([...messages, { text: input, user: "me" }]);
      setInput("");
      // Simulate bot response
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "This is a bot response", user: "bot" },
        ]);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${msg.user === "me" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block px-4 py-2 rounded ${
                msg.user === "me"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 flex p-4 bg-white shadow-md">
        <input
          type="text"
          className="flex-grow border rounded px-4 py-2 mr-4"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => (e.key === "Enter" ? sendMessage() : null)}
          placeholder="Type your message here"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
