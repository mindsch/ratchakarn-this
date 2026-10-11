// Calm note, never retro chrome: disclaimers (especially court drafts) must not change with โหมด XP replica.
export function Disclaimer({ legal = false }: { legal?: boolean }) {
  return (
    <p className="note" role="note">
      {legal ? (
        <>
          <strong>ร่างเบื้องต้นเท่านั้น ไม่ใช่คำปรึกษากฎหมาย</strong> โปรดอ่านทบทวนและปรึกษาทนายความ (หรือสอบถามศาลแรงงาน) ก่อนยื่นจริง
          ผู้ใช้เป็นผู้รับผิดชอบผลของการใช้ทั้งหมด
        </>
      ) : (
        <>ผลลัพธ์จาก AI อาจผิดพลาด โปรดตรวจทานก่อนใช้ ผู้ใช้เป็นผู้รับผิดชอบต่อผลของการนำไปใช้ทั้งหมด โครงการไม่รับรองว่าหน่วยงานหรือศาลใดจะยอมรับเอกสาร</>
      )}
    </p>
  );
}
