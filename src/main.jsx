import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './styles/index.css';
import { MemberProfileProvider } from './context/MemberProfileContext.jsx';

// Order matters: the Router must wrap everything that uses <Link>/useNavigate,
// and AuthProvider must wrap everything that calls useAuth().
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MemberProfileProvider>
        <App />
        </MemberProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
