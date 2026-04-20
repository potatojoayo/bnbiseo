export default function TermsPage() {
  return (
    <div className="min-h-[100dvh] bg-white px-6 pt-8 pb-12 mx-auto max-w-[560px]">
      <h1 className="text-[22px] font-semibold text-ink mb-6">이용약관</h1>

      <div className="flex flex-col gap-6 text-[14px] text-ink leading-relaxed">
        <section>
          <h2 className="text-[16px] font-semibold mb-2">제1조 (목적)</h2>
          <p className="text-ink-muted">
            본 약관은 실버백 가디언즈(이하 &quot;회사&quot;)가 제공하는 숙소 청소 및 시설관리 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제2조 (정의)</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>&quot;서비스&quot;란 회사가 제공하는 숙소 청소, 시설 점검, 점검 리포트 등 관련 일체의 서비스를 말합니다.</li>
            <li>&quot;이용자&quot;란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
            <li>&quot;숙소&quot;란 이용자가 등록한 에어비앤비 등 단기 임대 숙박시설을 말합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>본 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 7일 전 공지합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제4조 (서비스의 내용)</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>숙소 청소 서비스 (표준 청소, 긴급 청소)</li>
            <li>호텔식 침구 세팅</li>
            <li>15항목 시설 점검 및 리포트 제공</li>
            <li>기타 회사가 정하는 부가 서비스</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제5조 (서비스 이용료 및 결제)</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>서비스 이용료는 숙소 면적, 방 수, 욕실 수 등을 기준으로 산정됩니다.</li>
            <li>결제는 토스페이먼츠를 통해 진행되며, 카드 결제를 지원합니다.</li>
            <li>당일 청소 요청 시 긴급 할증(50%)이 적용됩니다.</li>
            <li>최소 청소 요금은 35,000원입니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제6조 (취소 및 환불)</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>매니저 배정 전: 전액 환불</li>
            <li>매니저 배정 후, 청소 예정일 24시간 이전: 전액 환불</li>
            <li>청소 예정일 24시간 이내: 환불 불가</li>
            <li>청소 진행 중 또는 완료 후: 환불 불가</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제7조 (이용자의 의무)</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>이용자는 정확한 숙소 정보를 등록해야 합니다.</li>
            <li>이용자는 청소 일시에 매니저가 숙소에 출입할 수 있도록 해야 합니다.</li>
            <li>이용자는 타인의 정보를 부정하게 사용해서는 안 됩니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제8조 (회사의 의무)</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>회사는 안정적인 서비스 제공을 위해 최선을 다합니다.</li>
            <li>회사는 이용자의 개인정보를 관련 법령에 따라 보호합니다.</li>
            <li>회사는 청소 완료 후 시설 점검 리포트를 제공합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제9조 (면책)</h2>
          <p className="text-ink-muted">
            회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">제10조 (분쟁 해결)</h2>
          <p className="text-ink-muted">
            서비스 이용과 관련한 분쟁은 대한민국 법을 적용하며, 관할 법원은 회사 소재지를 관할하는 법원으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">사업자 정보</h2>
          <div className="rounded-lg bg-surface-soft px-4 py-3 text-[13px] text-ink-muted">
            <p><span className="text-ink font-medium">상호:</span> 실버백 가디언즈</p>
            <p><span className="text-ink font-medium">대표자:</span> 최정호</p>
            <p><span className="text-ink font-medium">사업자등록번호:</span> 267-28-01998</p>
            <p><span className="text-ink font-medium">사업장 소재지:</span> 서울특별시 마포구 방울내로6길 14, 302호(망원동)</p>
            <p><span className="text-ink font-medium">이메일:</span> bohemiantoday4676@naver.com</p>
            <p><span className="text-ink font-medium">전화:</span> 010-2960-4676</p>
          </div>
        </section>

        <p className="text-[13px] text-ink-faint mt-4">
          시행일: 2026년 4월 18일
        </p>
      </div>
    </div>
  )
}
