import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import League from './pages/League';
import Game from './pages/Game';

const Layout = () => {
  const loc = useLocation();
  const inGame = loc.pathname.startsWith('/oyun');
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lig" element={<League />} />
        <Route path="/oyun" element={<Game />} />
      </Routes>
      {!inGame && <Footer />}
    </>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </div>
  );
}

export default App;
