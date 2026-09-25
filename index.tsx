import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LoginGate from './components/LoginGate';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LoginGate>{session => <App userEmail={session.user.email} />}</LoginGate>
  </React.StrictMode>
);