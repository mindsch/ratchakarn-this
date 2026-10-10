import { useState } from "react";
import { Chat } from "./components/Chat";
import { CopyPrompt } from "./components/CopyPrompt";
import { Export } from "./components/Export";
import { SettingsPanel } from "./components/SettingsPanel";
import { SAMPLES } from "./lib/doc/samples";
import { DEFAULT_TYPE } from "./lib/doc/types";
import { useSettings } from "./lib/settings";

type Tab = "chat" | "export" | "prompt";

export default function App() {
  const [tab, setTab] = useState<Tab>("chat");
  const [settings, update] = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [raw, setRaw] = useState(SAMPLES[DEFAULT_TYPE]);

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo" aria-hidden>
            ๛
          </span>
          <div>
            <h1>ราชการนี้</h1>
            <span className="sub">Ratchakarn-this · เขียนภาษาราชการ ร่างหนังสือราชการ ออกเป็น DOCX/PDF</span>
          </div>
        </div>
        <nav>
          <button className={tab === "chat" ? "on" : ""} onClick={() => setTab("chat")}>
            แชต
          </button>
          <button className={tab === "export" ? "on" : ""} onClick={() => setTab("export")}>
            ออกเอกสาร
          </button>
          <button className={tab === "prompt" ? "on" : ""} onClick={() => setTab("prompt")}>
            พรอมต์
          </button>
        </nav>
      </header>
      <main>
        {tab === "chat" && (
          <Chat
            settings={settings}
            openSettings={() => setShowSettings(true)}
            sendToExport={(text) => {
              setRaw(text);
              setTab("export");
            }}
          />
        )}
        {tab === "export" && <Export raw={raw} setRaw={setRaw} />}
        {tab === "prompt" && <CopyPrompt />}
      </main>
      <footer>
        โอเพนซอร์ส (MIT) · คีย์ของคุณอยู่ในเบราว์เซอร์นี้เท่านั้น · ผลลัพธ์เป็นร่างเบื้องต้น ผู้ใช้เป็นผู้รับผิดชอบต่อผลของการใช้ · งานด้านกฎหมายโปรดปรึกษาทนายความ
      </footer>
      {showSettings && <SettingsPanel settings={settings} update={update} onClose={() => setShowSettings(false)} />}
    </div>
  );
}
