---
name: Onboarding Page Patterns
description: 온보딩 위자드 레이아웃, 스텝 인디케이터, 폼 카드 패턴
type: project
---

## 레이아웃 구조
- `src/app/onboarding/layout.tsx` — auth 레이아웃과 동일한 구조 사용
  - 좌: 다크 브랜드 패널 (lg 이상) — 3단계 step guide 포함
  - 우: 스크롤 가능한 콘텐츠 패널 (max-w-[560px])
- `src/app/onboarding/onboarding-wizard.tsx` — 3단계 클라이언트 위자드

## 스텝 인디케이터
- 원형 숫자 버튼 (size-8) + 라벨 텍스트 (11px uppercase)
- 완료: `bg-[#D4421E]/15 text-[#D4421E]` + CheckIcon
- 현재: `bg-[#D4421E] text-white shadow-sm`
- 미완료: `bg-[#E8E3DC] text-[#8a8a82]`
- 연결선: `h-px w-14 sm:w-20 mx-2 mb-5`

## 스텝 헤딩 패턴
각 스텝마다 상단에 레이블 + 제목 + 설명 3단 구조:
```jsx
<div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#D4421E' }}>
  <Icon className="size-3.5" />
  섹션 레이블
</div>
<h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
  제목
</h2>
<p className="text-sm text-[#8a8a82] mt-2" style={{ fontFamily: 'var(--font-body)' }}>
  설명
</p>
```

## SectionCard 컴포넌트
폼 필드를 그룹핑하는 카드:
- `rounded-2xl border border-[#E8E3DC] bg-white p-5 sm:p-6`
- 내부 섹션 헤더: `text-[11px] font-semibold uppercase tracking-widest text-[#6b6b63] mb-4`

## Field 컴포넌트
- 라벨: `text-xs font-semibold tracking-wide uppercase text-[#6b6b63]`
- 필수 표시: `text-[#D4421E]`
- Input 높이: `h-10 text-sm`

## 버튼 패턴
- Primary CTA: 직접 inline style 사용 (`backgroundColor: '#D4421E'`, `boxShadow: '0 2px 12px rgba(212,66,30,0.25)'`)
- Secondary: `border border-[#E8E3DC] bg-white` outline 스타일
- 높이: `h-11`, `rounded-xl`, 양쪽 동일 `active:scale-[0.99]`

## 에러 메시지
- `bg-[#D4421E]/8 border border-[#D4421E]/20 px-4 py-3 rounded-xl`

## 다크 패널 스텝 인디케이터 (실제 구현)
- 패널 배경: `radial-gradient(ellipse at 80% 85%, #2d1208 0%, #1e1210 35%, #1a1a1a 60%)`
- 현재 스텝 번호 배경: `backgroundColor: '#D4421E'`, text-white
- 완료 스텝 배경: `rgba(255,255,255,0.18)`, ring: `0 0 0 1px rgba(255,255,255,0.25)`
- 미도달 스텝: `bg-white/[0.06] text-white/30`, opacity-40
- 완료 스텝 타이틀 옆 "수정" 배지: `text-[10px] border border-white/20 rounded px-1`
- 스텝 연결선: `w-px h-3 bg-white/30 (완료) / bg-white/[0.08] (미완료)`

## 모바일 스텝 헤더 (MobileStepHeader)
- `src/app/onboarding/mobile-step-header.tsx` — 별도 클라이언트 컴포넌트
- 로고 + 오른쪽에 pill 형태 프로그레스 바 + "N/3 스텝명" 텍스트
- 활성 pill: width 24px, `#D4421E`
- 완료 pill: width 8px, `#D4421E66`
- 미도달 pill: width 8px, `#E8E3DC`

## Complete 페이지 패턴
- 완료 아이콘: 레드(브랜드) 대신 초록 계열 사용 — `rgba(34,197,94,0.12)` 배경 + `#16a34a` 색상
- 성공 레이블: `text-xs font-semibold uppercase tracking-widest` + `#16a34a`
- 숙소 카드 최신 항목: 초록 border `rgba(34,197,94,0.35)` + "방금 등록" 뱃지로 강조
- 숙소 수 표시: 우측에 `rgba(34,197,94,0.1)` 배경 초록 pill 뱃지
- Primary 버튼 높이: h-12 (일반 h-11보다 한 단계 크게, 완료 페이지의 주요 CTA 강조)

## OnboardingPanel complete 모드
- complete 페이지에서 스텝 인디케이터 완전히 숨김
- 대신 "다음 기능 미리보기" 리스트 표시: 대시보드 / AI 챗봇 / 수리 요청
- 각 항목 우측에 `rgba(34,197,94,0.25)` 배경 초록 체크 아이콘
- mb-10 유지 (헤딩 아래 간격)

## MobileStepHeader complete 모드
- 스텝 인디케이터 대신 초록 완료 뱃지 표시
- `rgba(34,197,94,0.1)` 배경 + `#16a34a` 텍스트 + CheckIcon + "등록 완료" 텍스트

## localStorage 복원 배너
- 저장된 상태가 'ask'가 아닐 때 5초 후 자동 사라짐
- `bg-[#D4421E]/6 border border-[#D4421E]/20` 색상 + "닫기" 버튼
- `animate-fade-in-fast` 적용

## PrimaryButton
- `w-full`이 컴포넌트 자체에 포함됨 (감싸는 flex-1 div 불필요하지만 유지)

## 스텝 전환 애니메이션
- 각 스텝 루트 div에 `animate-fade-in-fast` 적용 (globals.css에 정의됨)

## Step 2 리스팅 카드
- 그리드: `grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto`
- 선택 상태: `border-[#D4421E] ring-2 ring-[#D4421E]/20` + 우상단 체크 뱃지
- hover: `hover:shadow-lg hover:border-[#D4421E]/40`

## Step 3 사진 갤러리
- 첫 번째 사진: `w-40 h-28`, 나머지: `w-24 h-28`
- 가로 스크롤: `flex gap-2 overflow-x-auto pb-1`

## Step 3 편의시설 배지
- shadcn Badge 대신 직접 span 사용
- `h-6 px-2.5 rounded-full text-xs font-medium bg-[#F6F4F0] border border-[#E8E3DC]`
