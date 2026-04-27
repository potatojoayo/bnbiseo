// Alimtalk template configuration.
//
// Each entry maps a notification event to:
//   - templateId env var name (set to the KA01TP... id Solapi returned after approval)
//   - variable builder that returns the {placeholder: value} map
//   - fallback SMS text used when alimtalk delivery fails
//
// IMPORTANT: The placeholder keys (#{name}) and message body must EXACTLY
// match the Solapi-registered template body. See docs/alimtalk-templates.md
// for the canonical body text to register.

type TemplateConfig<TInput> = {
  envVar: string
  buildVariables: (input: TInput) => Record<string, string>
  buildFallbackText: (input: TInput) => string
}

// Solapi/Kakao requires the protocol (https://) to be fixed in the template
// itself; only the host+path can be templated. We build the link variable
// stripped of protocol so the registered button URL "https://#{link}"
// resolves correctly after variable substitution.
function linkBase() {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.bnbiseo.com'
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

// ─── Property ───────────────────────────────────────────────────────────────

export type PropertyActivatedInput = {
  propertyName: string
  propertyId: string
}

export const propertyActivatedTemplate: TemplateConfig<PropertyActivatedInput> = {
  envVar: 'SOLAPI_TEMPLATE_PROPERTY_ACTIVATED',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    link: `${linkBase()}/my/properties/${input.propertyId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 숙소 등록이 완료되었어요. 이제 청소·수리 요청을 할 수 있어요.`,
}

// ─── Cleaning ───────────────────────────────────────────────────────────────

export type CleaningAssignedHostInput = {
  propertyName: string
  managerName: string
  scheduledDate: string
  scheduledTime: string
  cleaningRequestId: string
}

export const cleaningAssignedHostTemplate: TemplateConfig<CleaningAssignedHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_CLEANING_ASSIGNED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    managerName: input.managerName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    link: `${linkBase()}/cleaning/${input.cleaningRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 청소에 ${input.managerName} 매니저가 배정되었어요. (${input.scheduledDate} ${input.scheduledTime})`,
}

export type CleaningAssignedManagerInput = {
  propertyName: string
  scheduledDate: string
  scheduledTime: string
  cleaningRequestId: string
}

export const cleaningAssignedManagerTemplate: TemplateConfig<CleaningAssignedManagerInput> = {
  envVar: 'SOLAPI_TEMPLATE_CLEANING_ASSIGNED_MANAGER',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    link: `${linkBase()}/manager/cleanings/${input.cleaningRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] 새 청소 일정이 배정되었어요. ${input.propertyName} ${input.scheduledDate} ${input.scheduledTime}`,
}

export type CleaningUrgentManagerInput = {
  propertyName: string
  scheduledDate: string
  scheduledTime: string
}

export const cleaningUrgentManagerTemplate: TemplateConfig<CleaningUrgentManagerInput> = {
  envVar: 'SOLAPI_TEMPLATE_CLEANING_URGENT_MANAGER',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    link: `${linkBase()}/manager/cleanings`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] 긴급 청소 요청이 들어왔어요. ${input.propertyName} ${input.scheduledDate} ${input.scheduledTime}`,
}

export type CleaningStartedHostInput = {
  propertyName: string
  cleaningRequestId: string
}

export const cleaningStartedHostTemplate: TemplateConfig<CleaningStartedHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_CLEANING_STARTED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    link: `${linkBase()}/cleaning/${input.cleaningRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 청소가 시작되었어요.`,
}

export type CleaningCompletedHostInput = {
  propertyName: string
  cleaningRequestId: string
}

export const cleaningCompletedHostTemplate: TemplateConfig<CleaningCompletedHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_CLEANING_COMPLETED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    link: `${linkBase()}/cleaning/${input.cleaningRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 청소가 완료되었어요. 점검 리포트를 확인해보세요.`,
}

export type CleaningCancelledHostInput = {
  propertyName: string
  cleaningRequestId: string
}

export const cleaningCancelledHostTemplate: TemplateConfig<CleaningCancelledHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_CLEANING_CANCELLED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    link: `${linkBase()}/cleaning/${input.cleaningRequestId}/cancelled`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 청소 일정이 취소되었어요. 결제 금액은 환불 처리됩니다.`,
}

export type CleaningCancelledManagerInput = {
  propertyName: string
  scheduledDate: string
  scheduledTime: string
}

export const cleaningCancelledManagerTemplate: TemplateConfig<CleaningCancelledManagerInput> = {
  envVar: 'SOLAPI_TEMPLATE_CLEANING_CANCELLED_MANAGER',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    link: `${linkBase()}/manager/cleanings`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] 담당 청소 일정이 취소되었어요. ${input.propertyName} ${input.scheduledDate} ${input.scheduledTime}`,
}

// ─── Repair ─────────────────────────────────────────────────────────────────

export type RepairRequestedManagerInput = {
  propertyName: string
  preferredScheduledDate: string
  preferredScheduledTime: string
  repairRequestId: string
}

export const repairRequestedManagerTemplate: TemplateConfig<RepairRequestedManagerInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_REQUESTED_MANAGER',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    preferredDate: input.preferredScheduledDate,
    preferredTime: input.preferredScheduledTime,
    link: `${linkBase()}/manager/repairs/${input.repairRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] 새 수리 요청이 들어왔어요. ${input.propertyName} 희망 ${input.preferredScheduledDate} ${input.preferredScheduledTime}`,
}

export type RepairQuotedHostInput = {
  propertyName: string
  quotedCost: number
  scheduledDate: string
  scheduledTime: string
  repairRequestId: string
}

export const repairQuotedHostTemplate: TemplateConfig<RepairQuotedHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_QUOTED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    quotedCost: input.quotedCost.toLocaleString(),
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    link: `${linkBase()}/repair/${input.repairRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 수리 견적이 도착했어요. 견적 ${input.quotedCost.toLocaleString()}원, 방문 예정 ${input.scheduledDate} ${input.scheduledTime}. 결제 후 진행됩니다.`,
}

export type RepairConfirmedHostInput = {
  propertyName: string
  scheduledDate: string
  scheduledTime: string
  managerName: string
  repairRequestId: string
}

export const repairConfirmedHostTemplate: TemplateConfig<RepairConfirmedHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_CONFIRMED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    managerName: input.managerName,
    link: `${linkBase()}/repair/${input.repairRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 수리 결제가 완료되었어요. ${input.managerName} 매니저가 ${input.scheduledDate} ${input.scheduledTime}에 방문합니다.`,
}

export type RepairConfirmedManagerInput = {
  propertyName: string
  scheduledDate: string
  scheduledTime: string
  repairRequestId: string
}

export const repairConfirmedManagerTemplate: TemplateConfig<RepairConfirmedManagerInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_CONFIRMED_MANAGER',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    link: `${linkBase()}/manager/repairs/${input.repairRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] 수리 일정이 확정되었어요. ${input.propertyName} ${input.scheduledDate} ${input.scheduledTime}`,
}

export type RepairStartedHostInput = {
  propertyName: string
  repairRequestId: string
}

export const repairStartedHostTemplate: TemplateConfig<RepairStartedHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_STARTED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    link: `${linkBase()}/repair/${input.repairRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 수리 작업이 시작되었어요.`,
}

export type RepairCompletedHostInput = {
  propertyName: string
  repairRequestId: string
}

export const repairCompletedHostTemplate: TemplateConfig<RepairCompletedHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_COMPLETED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    link: `${linkBase()}/repair/${input.repairRequestId}`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 수리가 완료되었어요. 조치 보고서를 확인해보세요.`,
}

export type RepairCancelledHostInput = {
  propertyName: string
  repairRequestId: string
}

export const repairCancelledHostTemplate: TemplateConfig<RepairCancelledHostInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_CANCELLED_HOST',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    link: `${linkBase()}/repair/${input.repairRequestId}/cancelled`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] ${input.propertyName} 수리 요청이 취소되었어요. 결제 금액은 환불 처리됩니다.`,
}

export type RepairCancelledManagerInput = {
  propertyName: string
  scheduledDate: string
  scheduledTime: string
}

export const repairCancelledManagerTemplate: TemplateConfig<RepairCancelledManagerInput> = {
  envVar: 'SOLAPI_TEMPLATE_REPAIR_CANCELLED_MANAGER',
  buildVariables: (input) => ({
    propertyName: input.propertyName,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    link: `${linkBase()}/manager/repairs`,
  }),
  buildFallbackText: (input) =>
    `[BnBiseo] 담당 수리 일정이 취소되었어요. ${input.propertyName} ${input.scheduledDate} ${input.scheduledTime}`,
}
