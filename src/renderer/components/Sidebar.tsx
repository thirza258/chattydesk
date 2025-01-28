import React from 'react';
import ReactMarkdown from "react-markdown";

interface SidebarProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  history: {
    prompt: string;
    response: string;
    model_name: string;
    created_at: string;
    updated_at: string;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ selectedModel, setSelectedModel, history }) => {
  return (
    <div className="w-1/4 bg-gray-200 h-full p-4 border-r-2 border-white z-10 shadow-lg flex-shrink-0">
      <ul>
        <li className="mb-4">About</li>
        <h2 className="mb-4 text-xl">Models</h2>
        <li className="mb-4">
          <a
            href="#"
            className={`${selectedModel === "GPT" ? "font-bold" : ""}`}
            onClick={() => setSelectedModel("GPT")}
          >
            OpenAI GPT
          </a>
        </li>
        <li className="mb-4">
          <a
            href="#"
            className={`${selectedModel === "Mistral" ? "font-bold" : ""}`}
            onClick={() => setSelectedModel("Mistral")}
          >
            Mistral
          </a>
        </li>
        <li className="mb-4">
          <a
            href="#"
            className={`${selectedModel === "Claude" ? "font-bold" : ""}`}
            onClick={() => setSelectedModel("Claude")}
          >
            Claude
          </a>
        </li>
        <li className="mb-4">
          <a
            href="#"
            className={`${selectedModel === "Gemini" ? "font-bold" : ""}`}
            onClick={() => setSelectedModel("Gemini")}
          >
            Gemini
          </a>
        </li>
        <hr className="my-4 border-t-2 border-gray-600" />
        <h2 className="mb-4 text-xl">History</h2>
        <div className="overflow-y-auto max-h-[50vh]">
          {history.map((entry, index) => (
            <div
              key={index}
              className="mb-4 p-4 bg-white shadow rounded-lg border border-gray-300"
            >
              <h3 className="font-bold text-lg mb-2">{entry.model_name}</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Prompt:</strong> {entry.prompt}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Response:</strong> <ReactMarkdown>{entry.response}</ReactMarkdown>
              </p>
              <p className="text-xs text-gray-500">
                <strong>Created At:</strong> {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-gray-500 text-sm">No history available.</p>
          )}
        </div>
      </ul>
    </div>
  );
};

export default Sidebar;
