const rows = [
  { item: "수전 교체", before: "35,000 ~ 80,000", after: "15,000", save: "60%" },
  { item: "전구 교체", before: "25,000 ~ 50,000", after: "12,000", save: "65%" },
  { item: "보일러 점검", before: "50,000 ~ 100,000", after: "30,000", save: "55%" },
  { item: "잠금장치 수리", before: "40,000 ~ 90,000", after: "20,000", save: "60%" },
];

export default function CompareTable() {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl p-6 overflow-x-auto bg-white/[0.02] border border-white/[0.06]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-slate-500 text-xs font-semibold px-3 pb-3.5 border-b border-white/[0.06]">
                수리 항목
              </th>
              <th className="text-center text-slate-500 text-xs font-semibold px-3 pb-3.5 border-b border-white/[0.06]">
                일반 업체
              </th>
              <th className="text-center text-slate-500 text-xs font-semibold px-3 pb-3.5 border-b border-white/[0.06]">
                비앤비서
              </th>
              <th className="text-center text-slate-500 text-xs font-semibold px-3 pb-3.5 border-b border-white/[0.06]">
                절감율
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="text-left text-slate-200 font-semibold text-[13px] px-3 py-3.5 border-b border-white/[0.03]">
                  {r.item}
                </td>
                <td className="text-center text-slate-400 line-through opacity-70 text-[13px] px-3 py-3.5 border-b border-white/[0.03]">
                  {r.before}원
                </td>
                <td className="text-center text-blue-400 font-bold text-[13px] px-3 py-3.5 border-b border-white/[0.03]">
                  {r.after}원
                </td>
                <td className="text-center text-[13px] px-3 py-3.5 border-b border-white/[0.03]">
                  <span className="bg-green-500/[0.12] text-green-500 py-0.5 px-2.5 rounded-[10px] text-xs font-bold">
                    ▼ {r.save}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-slate-600 text-[11px] mt-2.5 text-center">
          * 부품+공임 포함, 구독 회원 기준 (출장비 무료)
        </div>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((r, i) => (
          <div
            key={i}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-white text-sm font-bold">{r.item}</span>
              <span className="bg-green-500/[0.12] text-green-500 py-0.5 px-2.5 rounded-[10px] text-xs font-bold">
                ▼ {r.save}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <div>
                <div className="text-slate-500 text-[11px] mb-1">일반 업체</div>
                <div className="text-slate-400 text-sm line-through opacity-70">
                  {r.before}원
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-500 text-[11px] mb-1">비앤비서</div>
                <div className="text-blue-400 text-sm font-bold">
                  {r.after}원
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="text-slate-600 text-[11px] mt-1 text-center">
          * 부품+공임 포함, 구독 회원 기준 (출장비 무료)
        </div>
      </div>
    </>
  );
}
