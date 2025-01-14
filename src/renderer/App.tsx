import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState } from 'react';
import './App.css';
import 'tailwindcss/tailwind.css';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';


export default function App() {
  return (
    <Router>
      <div className="h-screen flex flex-col">
        <NavBar />
        <div className="flex flex-grow overflow-hidden">
          <Sidebar />
          <div className="flex-grow overflow-y-auto bg-white p-4">
            <Chatbot />
          </div>
        </div>
      </div>

    </Router>
  );
}
