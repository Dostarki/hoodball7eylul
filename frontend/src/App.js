import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { UsernameDialog } from './components/WalletGate';
import Home from './pages/Home';
import League from './pages/League';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';

const Layout = () => {
  const loc = useLocation();
  const inGame = loc.pathname.startsWith('/play');
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/league" element={<League />} />
        <Route path="/play" element={<Game />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
      {!inGame && <Footer />}
      <UsernameDialog />
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
