export function PilotNotice() {
  return (
    <section
      data-testid="public-pilot-notice"
      className="no-print border-b border-amber-200 bg-amber-50/90 px-3 py-2.5 text-slate-800 sm:px-6"
      aria-label="ข้อมูล Public Pilot"
    >
      <div className="mx-auto max-w-7xl">
        <details className="group">
          <summary className="cursor-pointer list-none text-xs font-semibold sm:text-sm">
            <span className="mr-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950">
              Public Pilot
            </span>
            ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้ — ยังไม่มี Cloud Backup
            <span className="ml-1 text-amber-800 group-open:hidden">ดูข้อควรรู้</span>
          </summary>

          <div className="mt-3 grid gap-3 text-xs leading-relaxed text-slate-700 md:grid-cols-2">
            <div>
              <h2 className="font-bold text-slate-900">ข้อมูลและความเป็นส่วนตัว</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>เอกสารและรูปที่เพิ่มจะเก็บใน Browser Storage ของอุปกรณ์นี้เท่านั้น</li>
                <li>หากล้างข้อมูลเว็บไซต์ เปลี่ยนเบราว์เซอร์ หรือเครื่องเสีย ข้อมูลอาจสูญหายได้</li>
                <li>Public Pilot รอบนี้ไม่ส่ง analytics หรือ telemetry ออกจากเบราว์เซอร์</li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-slate-900">ข้อจำกัดของ Pilot</h2>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>PromptPay QR เป็นคำสั่งชำระเงินบนเอกสาร ไม่ได้ยืนยันว่าได้รับเงินจริงแล้ว</li>
                <li>ผลการพิมพ์อาจต่างกันเล็กน้อยตาม Browser, OS และเครื่องพิมพ์</li>
                <li>DocCraft ไม่ใช่ระบบบัญชีหรือคำปรึกษาด้านภาษี โปรดตรวจเอกสารสำคัญก่อนใช้งานจริง</li>
              </ul>
            </div>

            <p className="md:col-span-2">
              แจ้งปัญหา Public Pilot แบบ best-effort (ไม่มี SLA):{' '}
              <a
                href="https://github.com/Gutumrod/doccraft/issues"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
              >
                DocCraft GitHub Issues
              </a>
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
