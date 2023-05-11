import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import User from "./pages/User";
import Categories from "./pages/Categories";
import News from "./pages/News";
import Settings from "./pages/Settings";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import React from 'react';
import './App.css';

function App() {
  return (
    <Router>
    <div className="App">

      <Routes>
      <Route exact path="/" element={ <Login/> } />

      <Route exact path="/Dashboard" element={ <Dashboard/> } />
      <Route exact path="/User" element={ <User/> } />
      <Route exact path="/Categories" element={ <Categories/> } />
      <Route exact path="/News" element={ <News/> } />
      <Route exact path="/Settings" element={ <Settings/> } />
      </Routes>
    </div>
    </Router>
  );
}

export default App;
