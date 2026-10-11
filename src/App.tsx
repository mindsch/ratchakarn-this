import { AppProvider, useApp } from "./lib/app";
import { ChatPage } from "./pages/chat";
import { DraftPage } from "./pages/draft";
import { FormatPage } from "./pages/format";
import { PromptsPage } from "./pages/prompts";
import { FirstRunDialog, SettingsPage } from "./pages/settings";
import { NavBar } from "./ui/NavBar";

function Shell() {
  const { route } = useApp();
  return (
    <div className="app">
      <NavBar />
      <main>
        {route === "chat" && <ChatPage />}
        {route === "draft" && <DraftPage />}
        {route === "format" && <FormatPage />}
        {route === "prompts" && <PromptsPage />}
        {route === "settings" && <SettingsPage />}
      </main>
      <FirstRunDialog />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
