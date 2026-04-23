export default function PrivacyPage() {
  return (
    <div className="animate-fade-up-fast bg-white px-6 pt-8 pb-12 mx-auto max-w-[560px]">
      <h1 className="text-[22px] font-semibold text-ink mb-6">개인정보처리방침</h1>

      <div className="flex flex-col gap-6 text-[14px] text-ink leading-relaxed">
        <p className="text-ink-muted">
          실버백 가디언즈(이하 &quot;회사&quot;)는 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립합니다.
        </p>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">1. 수집하는 개인정보 항목</h2>
          <div className="text-ink-muted flex flex-col gap-2">
            <div>
              <p className="font-medium text-ink">필수 항목</p>
              <p>이메일 주소, 이름, 비밀번호</p>
            </div>
            <div>
              <p className="font-medium text-ink">선택 항목</p>
              <p>전화번호, 숙소 주소</p>
            </div>
            <div>
              <p className="font-medium text-ink">자동 수집 항목</p>
              <p>서비스 이용 기록, 접속 로그, 결제 기록</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">2. 개인정보의 수집 및 이용 목적</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>서비스 제공 및 계약 이행 (청소 예약, 결제, 리포트 전달)</li>
            <li>회원 관리 (본인 확인, 서비스 이용 문의 응대)</li>
            <li>서비스 개선 (이용 통계 분석, 신규 서비스 개발)</li>
            <li>마케팅 및 광고 (이벤트, 프로모션 안내 — 별도 동의 시)</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">3. 개인정보의 보유 및 이용 기간</h2>
          <div className="text-ink-muted flex flex-col gap-1">
            <p>회원 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
            <ul className="list-disc list-inside mt-2 flex flex-col gap-1">
              <li>계약 또는 청약철회 기록: 5년 (전자상거래법)</li>
              <li>대금결제 및 재화 공급 기록: 5년 (전자상거래법)</li>
              <li>소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)</li>
              <li>접속 로그: 3개월 (통신비밀보호법)</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">4. 개인정보의 제3자 제공</h2>
          <p className="text-ink-muted">
            회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 법률에 특별한 규정이 있는 경우와 결제 처리를 위해 토스페이먼츠에 최소한의 정보를 제공합니다.
          </p>
          <div className="rounded-lg bg-surface-soft px-4 py-3 mt-2 text-[13px] text-ink-muted">
            <p><span className="text-ink font-medium">제공받는 자:</span> 토스페이먼츠</p>
            <p><span className="text-ink font-medium">제공 항목:</span> 주문번호, 결제금액, 이메일</p>
            <p><span className="text-ink font-medium">제공 목적:</span> 결제 처리 및 결제 사기 방지</p>
            <p><span className="text-ink font-medium">보유 기간:</span> 결제 완료 후 5년</p>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">5. 개인정보의 파기 절차 및 방법</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>파기 절차: 이용 목적이 달성된 개인정보는 별도의 DB로 옮겨 일정 기간 저장 후 파기합니다.</li>
            <li>파기 방법: 전자적 파일은 복구 불가능한 방법으로 영구 삭제합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">6. 이용자의 권리와 행사 방법</h2>
          <p className="text-ink-muted">
            이용자는 언제든지 개인정보의 조회, 수정, 삭제, 처리 정지를 요청할 수 있습니다. 앱 내 &quot;내 정보 수정&quot; 메뉴 또는 고객센터를 통해 요청할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">7. 개인정보의 안전성 확보 조치</h2>
          <ol className="list-decimal list-inside text-ink-muted flex flex-col gap-1">
            <li>비밀번호 암호화 저장</li>
            <li>SSL/TLS 암호화 통신</li>
            <li>개인정보 접근 권한 최소화</li>
            <li>정기적인 보안 점검</li>
          </ol>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">8. 개인정보 보호책임자</h2>
          <div className="rounded-lg bg-surface-soft px-4 py-3 text-[13px] text-ink-muted">
            <p><span className="text-ink font-medium">상호:</span> 실버백 가디언즈</p>
            <p><span className="text-ink font-medium">성명:</span> 최정호</p>
            <p><span className="text-ink font-medium">사업자등록번호:</span> 267-28-01998</p>
            <p><span className="text-ink font-medium">주소:</span> 서울특별시 마포구 방울내로6길 14, 302호(망원동)</p>
            <p><span className="text-ink font-medium">전화:</span> 010-2960-4676</p>
            <p><span className="text-ink font-medium">이메일:</span> bohemiantoday4676@naver.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-semibold mb-2">9. 개인정보처리방침 변경</h2>
          <p className="text-ink-muted">
            본 방침은 시행일로부터 적용되며, 변경 사항이 있을 경우 서비스 공지를 통해 안내합니다.
          </p>
        </section>

        <p className="text-[13px] text-ink-faint mt-4">
          시행일: 2026년 4월 18일
        </p>
      </div>
    </div>
  )
}
