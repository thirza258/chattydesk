import React from 'react';
import NavBar from './components/NavBar';
import Chatbot from './components/Chatbot';
import Sidebar from './components/Sidebar';
import { useState } from 'react';
import services from '../services/services';
import './App.css';
import 'tailwindcss/tailwind.css';

function App() {
  const [selectedModel, setSelectedModel] = useState("GPT");
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    const response = await services.getHistory();
    setHistory(response.data);
  }

  React.useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="h-screen flex flex-col">
      <NavBar />
      <div className="flex flex-grow overflow-hidden">
      <Sidebar selectedModel={selectedModel} setSelectedModel={setSelectedModel} history={history} />
        <div className="flex-grow overflow-y-auto bg-white p-4">
        <Chatbot selectedModel={selectedModel} />
        </div>
      </div>
    </div>
  );
}
export default App;
