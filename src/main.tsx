import { createRoot } from "react-dom/client";
import App from "./App-Working.tsx"; // Use the working version
import { AuthProvider } from "./hooks/useAuth";
import { LanguageProvider } from "./hooks/useLanguage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </AuthProvider>,
);
