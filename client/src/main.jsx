import { Buffer } from "buffer";
window.Buffer = Buffer;


import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import process from "process";
import global from "global";

import './index.css'
import App from './App.jsx'
import "./auth.css";

window.global = global;
window.process = process;



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
