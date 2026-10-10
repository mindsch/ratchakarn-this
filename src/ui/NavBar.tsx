import { useApp, type Route } from "../lib/app";
import { GearIcon, LogoMark, Sparkle } from "./index";

const TOOLS: { route: Route; label: string }[] = [
  { route: "chat", label: "แชท" },
  { route: "draft", label: "ร่างเอกสาร" },
  { route: "format", label: "จัดรูปแบบ" },
];

/** Figma NavBar 29:215: logo | tagline, tools centred (TH AI Passport-style pill), prompts + settings on the right. */
export function NavBar() {
  const { route, go } = useApp();
  const tools = TOOLS.map((t) => (
    <button key={t.route} type="button" className={`nav-item${route === t.route ? " on" : ""}`} aria-current={route === t.route ? "page" : undefined} onClick={() => go(t.route)}>
      {t.label}
    </button>
  ));
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-left">
          <button type="button" className="logo" onClick={() => go("chat")} aria-label="แปลเป็นราชการ หน้าแรก">
            <LogoMark />
            <span className="logo-word">แปลเป็นราชการ</span>
          </button>
          <span className="nav-divider" />
          <span className="nav-tagline">ผู้ช่วยเขียนหนังสือราชการ</span>
        </div>
        <nav className="nav-modes" aria-label="เครื่องมือ">
          {tools}
        </nav>
        <div className="nav-right">
          <button type="button" className={`pill outline${route === "prompts" ? " on" : ""}`} onClick={() => go("prompts")}>
            <Sparkle />
            <span className="hide-mobile">พรอมต์ใช้กับ AI อื่น</span>
            <span className="show-mobile">พรอมต์</span>
          </button>
          <button type="button" className="pill solid hide-mobile" onClick={() => go("settings")}>
            ตั้งค่า / ใส่คีย์ AI
          </button>
          <button type="button" className="btn ghost show-mobile" onClick={() => go("settings")} aria-label="ตั้งค่า">
            <GearIcon />
          </button>
        </div>
      </div>
      <nav className="nav-mobile-tools" aria-label="เครื่องมือ">
        {tools}
      </nav>
    </header>
  );
}
