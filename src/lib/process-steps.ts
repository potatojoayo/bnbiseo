export const CLEANING_PROCESS_STEPS = [
  { num: 1, title: '청소 요청 및 결제', desc: '숙소와 희망 일시를 선택하고 청소를 요청해요.' },
  { num: 2, title: '매니저 배정', desc: '비앤비서 전문 매니저가 배정되면 알림을 보내드려요.' },
  { num: 3, title: '호텔식 청소 + 시설 점검', desc: '호텔식 침구 세팅과 15항목 시설 점검을 진행해요.' },
  { num: 4, title: '점검 리포트 수신', desc: '청소 완료 후 사진과 함께 시설 점검 리포트를 받아요.' },
] as const

export const PROPERTY_REGISTRATION_STEPS = [
  { num: 1, title: '숙소 등록 접수', desc: '호스트가 입력한 숙소 정보를 먼저 확인해요.' },
  { num: 2, title: '현장 방문', desc: '48시간 이내에 직접 방문해 숙소 상태를 살펴봐요.' },
  { num: 3, title: '숙소 정보 수집', desc: '숙소 및 시설 정보를 꼼꼼히 기록해 둘게요.' },
  { num: 4, title: '등록 완료', desc: '등록이 끝나면 바로 청소를 요청할 수 있어요.' },
] as const

export const REPAIR_PROCESS_STEPS = [
  { num: 1, title: '수리 요청', desc: '증상과 희망 일시, 관련 시설물을 입력해 요청해요.' },
  { num: 2, title: '일정·견적 협의', desc: '매니저가 유선으로 연락해 정확한 일정과 견적을 조율해요.' },
  { num: 3, title: '견적 확인 및 결제', desc: '발송된 견적서를 확인한 후 결제하면 방문이 확정됩니다.' },
  { num: 4, title: '방문 수리', desc: '확정 일정에 매니저가 방문해 수리 작업을 진행해요.' },
  { num: 5, title: '조치 보고서 수신', desc: '작업 완료 후 사진과 조치 내용을 담은 보고서를 받아요.' },
] as const
