# 카카오 알림톡 템플릿 등록 가이드

Solapi 카카오 비즈메시지 콘솔(https://console.solapi.com)에서 아래 템플릿들을 등록한 뒤, 카카오 검수 승인이 완료되면 발급되는 `templateId`(KA01TP...)를 환경변수에 매핑하면 됩니다.

## 공통 환경변수

| 변수 | 설명 |
|---|---|
| `SOLAPI_API_KEY` | Solapi API 키 |
| `SOLAPI_API_SECRET` | Solapi API 시크릿 |
| `SOLAPI_SENDER_PHONE` | SMS 폴백용 발신번호 (사전 등록 필수) |
| `SOLAPI_KAKAO_PF_ID` | 알림톡 발송 채널의 plus friend id (`KA01PF...`) |
| `RESEND_API_KEY` | Resend (관리자 이메일) API 키 |
| `RESEND_FROM` | Resend 발신 주소 (예: `BnBiseo <noreply@bnbiseo.com>`) |
| `ADMIN_NOTIFICATION_EMAILS` | 콤마(,)로 구분한 관리자 이메일 수신자 |
| `NEXT_PUBLIC_APP_URL` | 알림톡 링크 빌드용 베이스 URL |

## 변수 표기 규칙

- 알림톡 본문에는 변수 자리를 `#{variableName}` 형태로 둡니다.
- 본 문서의 변수 표를 그대로 카카오 검수에 제출하면 되고, 코드의 `buildVariables`가 동일한 키로 채워줍니다.
- 메시지 길이는 1,000자 이내, 광고 표기 없음(정보성).
- 모든 템플릿에 "비엔비서(BnBiseo)" 문구를 포함해 발신처를 명시합니다.

### 버튼 링크 규칙 (중요)

Solapi/카카오는 **버튼 URL의 프로토콜(`http://` / `https://`)을 템플릿에 고정값으로 등록해야 하고, 변수로 치환할 수 없습니다**.

- 모든 알림톡 버튼은 종류 **웹링크(WL)** 로 등록합니다.
- Mobile URL (필수) / PC URL (선택, 동일하게 사용 가능)
- URL 등록 형식: `https://#{link}` (예: `https://#{link}`, `https://#{url}`, `https://nurigo.net` 모두 가능. 프로토콜 부분은 변수로 치환 불가)
- 코드의 `link` 변수는 프로토콜이 빠진 `bnbiseo.com/cleaning/abc-...` 형태로 빌드됩니다.
- `NEXT_PUBLIC_APP_URL` 이 `https://`로 시작해도 자동으로 제거됩니다.
- 버튼 클릭 시 카카오톡 인앱 브라우저에서 해당 URL이 열립니다.

각 템플릿의 본문 마지막 `▶ ...` 라인이 버튼 표시명입니다. 모든 버튼은 위 규칙에 따라 동일하게 `https://#{link}` 로 등록합니다.

---

## 1. 숙소 등록 완료 (호스트)

- **이벤트**: `property_activated`
- **수신자**: 호스트
- **env 매핑**: `SOLAPI_TEMPLATE_PROPERTY_ACTIVATED`

### 본문

```
[BnBiseo] 숙소 등록이 완료되었어요

#{propertyName} 숙소 등록이 완료되어 이제 청소·수리 요청을 보낼 수 있어요.

▶ 숙소 보기
```

### 변수

| 변수 | 예시 | 비고 |
|---|---|---|
| `propertyName` | "망원동 워크숍" | 숙소 이름 |
| `link` | `bnbiseo.com/my/properties/abc-...` | 버튼 링크용 (프로토콜 제외) |

### 버튼

- 종류: 웹링크(WL)
- 이름: "숙소 보기"
- Mobile URL (필수): `https://#{link}`
- PC URL (선택): `https://#{link}`

---

## 2. 매니저 배정 완료 (호스트)

- **이벤트**: `cleaning_assigned`
- **수신자**: 호스트 (비엔비서를 통해 청소를 요청한 회원)
- **발송 트리거**: 호스트가 비엔비서에서 청소를 요청한 뒤, 운영팀이 매니저를 배정 완료한 시점
- **env 매핑**: `SOLAPI_TEMPLATE_CLEANING_ASSIGNED_HOST`

### 본문

```
[비엔비서] 매니저 배정이 완료되었어요

회원님께서 요청하신 #{propertyName} 청소에 #{managerName} 매니저가 배정되었어요.
방문 일정: #{scheduledDate} #{scheduledTime}

당일 출입과 도어락 정보가 등록되어 있는지 확인해주세요.

▶ 청소 상세 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `managerName` | "김매니저" |
| `scheduledDate` | "2026-04-30" |
| `scheduledTime` | "11:00" |
| `link` | `bnbiseo.com/cleaning/abc-...` |

---

## 3. 매니저 — 새 청소 일정 배정 (매니저)

- **이벤트**: `cleaning_assigned`
- **수신자**: 비엔비서와 업무 계약을 맺은 청소 매니저 (사내 업무용)
- **발송 트리거**: 운영팀이 해당 매니저를 청소 일정에 배정한 시점
- **env 매핑**: `SOLAPI_TEMPLATE_CLEANING_ASSIGNED_MANAGER`

### 본문

```
[비엔비서] 새 청소 일정이 배정되었어요
[사내 업무용 메시지]

매니저님, 새로운 청소 일정이 배정되었어요.

숙소: #{propertyName}
방문 일정: #{scheduledDate} #{scheduledTime}

▶ 일정 확인
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `scheduledDate` | "2026-04-30" |
| `scheduledTime` | "11:00" |
| `link` | `bnbiseo.com/manager/cleanings/abc-...` |

---

## 4. 긴급 청소 요청 (매니저)

- **이벤트**: `cleaning_urgent_requested`
- **수신자**: 활성화된 모든 매니저 (broadcast)
- **env 매핑**: `SOLAPI_TEMPLATE_CLEANING_URGENT_MANAGER`

### 본문

```
[BnBiseo] 긴급 청소 요청이 들어왔어요

#{propertyName}
#{scheduledDate} #{scheduledTime}

먼저 배정받는 매니저가 작업을 진행해요.

▶ 요청 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `scheduledDate` | "2026-04-30" |
| `scheduledTime` | "11:00" |
| `link` | `bnbiseo.com/manager/cleanings` |

---

## 5. 청소 시작 (호스트)

- **이벤트**: `cleaning_started`
- **수신자**: 호스트 (비엔비서를 통해 청소를 요청한 회원)
- **발송 트리거**: 호스트가 요청한 청소에 매니저가 현장 도착해 작업을 시작한 시점
- **env 매핑**: `SOLAPI_TEMPLATE_CLEANING_STARTED_HOST`

### 본문

```
[비엔비서] 청소가 시작되었어요

회원님께서 요청하신 #{propertyName} 청소가 시작되었어요.
작업 완료 후 점검 리포트를 보내드릴게요.

▶ 진행 상황 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `link` | `bnbiseo.com/cleaning/abc-...` |

---

## 6. 청소 완료 (호스트)

- **이벤트**: `cleaning_completed`
- **수신자**: 호스트 (비엔비서를 통해 청소를 요청한 회원)
- **발송 트리거**: 호스트가 요청한 청소를 매니저가 완료하고 점검 리포트를 등록한 시점
- **env 매핑**: `SOLAPI_TEMPLATE_CLEANING_COMPLETED_HOST`

### 본문

```
[비엔비서] 청소가 완료되었어요

회원님께서 요청하신 #{propertyName} 청소가 완료되었어요.
시설 점검 리포트를 확인하시고 다음 게스트를 맞이할 준비를 시작해보세요.

▶ 리포트 확인
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `link` | `bnbiseo.com/cleaning/abc-...` |

---

## 7. 청소 취소 — 호스트에게 (운영 취소 시)

- **이벤트**: `cleaning_cancelled_by_admin`
- **수신자**: 호스트 (비엔비서를 통해 청소를 요청한 회원)
- **발송 트리거**: 호스트가 요청한 청소 일정이 운영 사유로 취소된 시점
- **env 매핑**: `SOLAPI_TEMPLATE_CLEANING_CANCELLED_HOST`

### 본문

```
[비엔비서] 청소 일정이 취소되었어요

회원님께서 요청하신 #{propertyName} 청소 일정이 운영 사유로 취소되었어요.
결제 금액은 영업일 3일 이내에 환불 처리됩니다.

문의가 필요하면 고객센터로 연락 주세요.

▶ 취소 내역 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `link` | `bnbiseo.com/cleaning/abc-.../cancelled` |

---

## 8. 청소 취소 — 매니저에게

- **이벤트**: `cleaning_cancelled_by_host` / `cleaning_cancelled_by_admin`
- **수신자**: 비엔비서와 업무 계약을 맺은 청소 매니저 (사내 업무용)
- **발송 트리거**: 해당 매니저에게 배정되어 있던 청소 일정이 호스트 또는 운영 사유로 취소된 시점
- **env 매핑**: `SOLAPI_TEMPLATE_CLEANING_CANCELLED_MANAGER`

### 본문

```
[비엔비서] 담당 청소 일정이 취소되었어요
[사내 업무용 메시지]

매니저님, 배정받으신 청소 일정이 취소되었어요.

숙소: #{propertyName}
방문 일정: #{scheduledDate} #{scheduledTime}

해당 일정은 더 이상 진행되지 않아요.

▶ 일정 확인
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `scheduledDate` | "2026-04-30" |
| `scheduledTime` | "11:00" |
| `link` | `bnbiseo.com/manager/cleanings` |

---

## 9. 새 수리 요청 (매니저)

- **이벤트**: `repair_requested`
- **수신자**: 활성화된 모든 매니저 (broadcast)
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_REQUESTED_MANAGER`

### 본문

```
[BnBiseo] 새 수리 요청이 들어왔어요

#{propertyName}
희망 일정: #{preferredDate} #{preferredTime}

먼저 배정받은 매니저가 견적을 작성해 호스트에게 발송합니다.

▶ 요청 확인
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `preferredDate` | "2026-05-02" |
| `preferredTime` | "10:00" |
| `link` | `bnbiseo.com/manager/repairs/xyz-...` |

---

## 10. 수리 견적 도착 (호스트)

- **이벤트**: `repair_quoted`
- **수신자**: 호스트 (비엔비서를 통해 수리를 요청한 회원)
- **발송 트리거**: 호스트가 요청한 수리 건에 대해 매니저가 견적을 등록한 시점
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_QUOTED_HOST`

> ⚠️ **카카오 반려 이력**: 본문에 결제 유도 문구가 포함되면 PG/에스크로 등록 증빙이 요구됨. 본 템플릿은 결제 유도 문구를 제거하고, 견적 내용 안내까지만 다룸. 실제 결제는 앱/웹 상세 페이지에서 진행.

### 본문

```
[비엔비서] 수리 견적이 도착했어요

회원님께서 요청하신 #{propertyName} 수리 견적이 도착했어요.
견적 금액: #{quotedCost}원
방문 예정: #{scheduledDate} #{scheduledTime}

상세 페이지에서 견적 내용을 확인해주세요.

▶ 견적 확인
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `quotedCost` | "120,000" (toLocaleString 적용) |
| `scheduledDate` | "2026-05-02" |
| `scheduledTime` | "10:00" |
| `link` | `bnbiseo.com/repair/xyz-...` |

---

## 11. 수리 일정 확정 — 호스트

- **이벤트**: `repair_confirmed`
- **수신자**: 호스트
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_CONFIRMED_HOST`

### 본문

```
[BnBiseo] 수리 일정이 확정되었어요

#{propertyName} 수리 결제가 완료되었어요.
#{managerName} 매니저가 #{scheduledDate} #{scheduledTime}에 방문해요.

당일 출입 정보가 등록되어 있는지 한번 더 확인해주세요.

▶ 수리 상세 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `managerName` | "김매니저" |
| `scheduledDate` | "2026-05-02" |
| `scheduledTime` | "10:00" |
| `link` | `bnbiseo.com/repair/xyz-...` |

---

## 12. 수리 일정 확정 — 매니저

- **이벤트**: `repair_confirmed`
- **수신자**: 매니저
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_CONFIRMED_MANAGER`

### 본문

```
[BnBiseo] 수리 일정이 확정되었어요

호스트 결제가 완료되어 방문 일정이 확정되었어요.
#{propertyName}
#{scheduledDate} #{scheduledTime}

▶ 일정 확인
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `scheduledDate` | "2026-05-02" |
| `scheduledTime` | "10:00" |
| `link` | `bnbiseo.com/manager/repairs/xyz-...` |

---

## 13. 수리 작업 시작 (호스트)

- **이벤트**: `repair_started`
- **수신자**: 호스트
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_STARTED_HOST`

### 본문

```
[BnBiseo] 수리 작업이 시작되었어요

#{propertyName} 수리 작업이 시작되었어요. 완료 후 조치 보고서를 보내드릴게요.

▶ 진행 상황 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `link` | `bnbiseo.com/repair/xyz-...` |

---

## 14. 수리 완료 (호스트)

- **이벤트**: `repair_completed`
- **수신자**: 호스트 (비엔비서를 통해 수리를 요청한 회원)
- **발송 트리거**: 호스트가 요청한 수리 작업을 매니저가 완료하고 조치 보고서를 등록한 시점
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_COMPLETED_HOST`

### 본문

```
[비엔비서] 수리가 완료되었어요

회원님께서 요청하신 #{propertyName} 수리가 완료되었어요.
조치 내용과 사진이 담긴 보고서를 확인해주세요.

▶ 조치 보고서 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `link` | `bnbiseo.com/repair/xyz-...` |

---

## 15. 수리 취소 — 호스트에게 (매니저/운영 취소 시)

- **이벤트**: `repair_cancelled_by_manager`
- **수신자**: 호스트 (비엔비서를 통해 수리를 요청한 회원)
- **발송 트리거**: 호스트가 요청한 수리 일정이 매니저/운영 사유로 취소된 시점
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_CANCELLED_HOST`

### 본문

```
[비엔비서] 수리 일정이 취소되었어요

회원님께서 요청하신 #{propertyName} 수리 일정이 운영 사유로 취소되었어요.
결제 금액은 영업일 3일 이내에 환불 처리됩니다.

▶ 취소 내역 보기
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `link` | `bnbiseo.com/repair/xyz-.../cancelled` |

---

## 16. 수리 취소 — 매니저에게 (호스트 취소 시)

- **이벤트**: `repair_cancelled_by_host`
- **수신자**: 매니저
- **env 매핑**: `SOLAPI_TEMPLATE_REPAIR_CANCELLED_MANAGER`

### 본문

```
[BnBiseo] 담당 수리 일정이 취소되었어요

#{propertyName}
#{scheduledDate} #{scheduledTime}

해당 일정은 더 이상 진행되지 않아요.

▶ 일정 확인
```

### 변수

| 변수 | 예시 |
|---|---|
| `propertyName` | "망원동 워크숍" |
| `scheduledDate` | "2026-05-02" |
| `scheduledTime` | "10:00" |
| `link` | `bnbiseo.com/manager/repairs` |

---

## 관리자 이메일 (참고)

알림톡이 아닌 **이메일**로 발송되는 항목:

| 이벤트 | 수신자 | 내용 |
|---|---|---|
| `property_submitted` | `ADMIN_NOTIFICATION_EMAILS` | 새 숙소 등록 요청 (호스트, 숙소 이름 포함) |

향후 매출 일일 요약, 미배정 알림 등도 이메일 채널로 추가 가능합니다.

---

## 발송 실패 처리

- 알림톡 발송은 `disableSms: false` 옵션으로 카카오 검수 승인 메시지 미친 등으로 실패 시 SMS 폴백.
- SMS 폴백 본문은 `buildFallbackText`에서 생성 — 카카오 본문과 비슷하지만 변수가 그대로 텍스트로 들어가도록 작성됨.
- Solapi/Resend 호출 실패는 `console.error`만 남기고 in-app 알림은 항상 정상 생성되도록 설계됨 (`notification-dispatch.ts`).
