// Chrome copy, Standard vs โหมด XP replica (handoff §6). Jokes live only here: banners, pop-ups, loading.
// Generated documents never change with the mode.
export const CHROME_COPY = {
  loading: ["กำลังตรวจเอกสาร…", "กำลังเสนอเรื่องผ่านหัวหน้างาน…"],
  missingAt: ["ยังไม่มีเลขที่หนังสือ", "ไม่พบเลขที่หนังสือ กรุณาอย่าตกใจ"],
  exportDone: ["ส่งออกเรียบร้อย", "ประทับตราเรียบร้อย"],
  exportError: ["ส่งออกไม่สำเร็จ ลองอีกครั้ง", "ส่งออกไม่สำเร็จ หัวหน้าไม่อนุมัติ ลองใหม่อีกครั้ง"],
  saved: ["บันทึกการตั้งค่าแล้ว", "บันทึกการตั้งค่าแล้ว ผ่านความเห็นชอบตามลำดับชั้น"],
} as const;

export type ChromeKey = keyof typeof CHROME_COPY;
export const chrome = (key: ChromeKey, xp: boolean) => CHROME_COPY[key][xp ? 1 : 0];
