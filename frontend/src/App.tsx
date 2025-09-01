import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Chat } from './pages/Chat';
import { Rooms } from './pages/Rooms';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/rooms" element={<Rooms />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;