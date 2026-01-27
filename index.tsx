
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("🚀 Iniciando Fila Livre...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ Erro fatal: Elemento 'root' não encontrado no HTML.");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("✅ App montado com sucesso.");
} catch (error) {
  console.error("❌ Erro ao renderizar o App:", error);
  rootElement.innerHTML = `
    <div style="background: #050810; color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="color: #2dd4bf;">Erro de Carregamento</h1>
        <p>Ocorreu um problema ao iniciar o aplicativo.</p>
        <pre style="background: #1e293b; padding: 10px; border-radius: 8px; font-size: 10px; margin-top: 20px;">${error}</pre>
        <button onclick="window.location.reload()" style="background: #2dd4bf; color: #050810; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px;">Tentar Novamente</button>
      </div>
    </div>
  `;
}
