import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { StrictMode } from "react";
import GlobalStylesheet from "./Components/GlobalStylesheet";
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(<StrictMode><App /><GlobalStylesheet /></StrictMode>, document.getElementById("root"));

