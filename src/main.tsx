import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

registerSW({
  onNeedRefresh() {
    if (confirm("Доступно обновление. Обновить приложение?")) {
      window.location.reload();
    }
  },
});

createRoot(document.getElementById("root")!).render(<App />);
