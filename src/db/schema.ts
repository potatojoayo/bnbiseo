import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  integer,
  timestamp,
  date,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const propertyTypeEnum = pgEnum('property_type', [
  'apartment',
  'house',
  'studio',
  'villa',
  'other',
])

export const propertyStatusEnum = pgEnum('property_status', [
  'pending_activation',
  'active',
])

export const linenWashLocationEnum = pgEnum('linen_wash_location', [
  'in_house',
  'external',
])

export const cleaningPrepPhotoKindEnum = pgEnum('cleaning_prep_photo_kind', [
  'cleaning_closet',
  'extra_linen',
  'trash_disposal',
  'linen_wash_external',
])

export const fixtureCategoryEnum = pgEnum('fixture_category', [
  'lighting',
  'furniture',
  'bedding',
  'faucet',
  'boiler',
  'appliance',
  'lock',
  'ac',
  'washer',
  'dryer',
  'vent',
  'other',
])

export const propertySpaceCategoryEnum = pgEnum('property_space_category', [
  'living_room',
  'bedroom',
  'bathroom',
  'veranda',
  'exterior',
  'other',
])

export const cleaningStatusEnum = pgEnum('cleaning_status', [
  'pending_payment', // 결제 대기
  'pending',      // 요청 접수 (결제 완료)
  'confirmed',    // 매니저 배정 완료
  'in_progress',  // 청소 진행 중
  'completed',    // 청소 완료
  'cancelled',    // 취소
])

export const cleaningTypeEnum = pgEnum('cleaning_type', [
  'standard',     // 표준 청소
  'urgent',       // 긴급 청소 (당일)
])

export const cleaningPlanEnum = pgEnum('cleaning_plan', [
  'one_time', // 단건 (월 1·2번째 청소)
  'regular',  // 정기 (월 3번째 청소부터 자동 적용)
])

export const cleaningServiceTypeEnum = pgEnum('cleaning_service_type', [
  'general', // 일반 청소 (숙소 전체)
  'ac',      // 에어컨 청소 (선택한 에어컨만)
])

export const cleaningPhotoKindEnum = pgEnum('cleaning_photo_kind', [
  'before', // 청소 전 (게스트 사용 현황)
  'after',  // 청소 후
])

export const paymentMethodEnum = pgEnum('payment_method', [
  'card',          // 카드/간편 결제 (토스페이먼츠)
  'bank_transfer', // 무통장 입금
])

export const repairStatusEnum = pgEnum('repair_status', [
  'submitted',     // 호스트 요청 접수 (매니저 유선 협의 대기)
  'quoted',        // 매니저가 일정+견적 발송 (호스트 결제 대기)
  'confirmed',     // 호스트 결제 완료 (방문 일정 최종 확정)
  'in_progress',   // 매니저 현장 작업 시작
  'completed',     // 조치 보고서 작성 완료
  'cancelled',
])

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'manager'])

export const inspectionStatusEnum = pgEnum('inspection_status', [
  'normal',
  'caution',
  'defective',
])

export const notificationTypeEnum = pgEnum('notification_type', [
  'property_submitted',
  'property_activated',
  'cleaning_requested',
  'cleaning_urgent_requested',
  'cleaning_assigned',
  'cleaning_started',
  'cleaning_completed',
  'cleaning_cancelled_by_host',
  'cleaning_cancelled_by_admin',
  'cleaning_bank_transfer_requested',
  'cleaning_bank_transfer_confirmed',
  'repair_requested',
  'repair_quoted',
  'repair_confirmed',
  'repair_started',
  'repair_completed',
  'repair_cancelled_by_host',
  'repair_cancelled_by_manager',
])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // references auth.users
  email: text('email'),
  fullName: text('full_name'),
  phone: text('phone'),
  avatarStoragePath: text('avatar_storage_path'),
  avatarThumbnailStoragePath: text('avatar_thumbnail_storage_path'),
  role: userRoleEnum('role').default('user').notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  marketingOptInAt: timestamp('marketing_opt_in_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  hostId: uuid('host_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  status: propertyStatusEnum('status').default('pending_activation').notNull(),
  airbnbListingId: text('airbnb_listing_id'),
  name: text('name').notNull(),
  address: text('address').notNull(),
  addressDetail: text('address_detail'),
  propertyType: propertyTypeEnum('property_type').default('apartment').notNull(),
  description: text('description'),
  nearbyInfo: text('nearby_info'),
  checkinInfo: text('checkin_info'),
  entrancePassword: text('entrance_password'),
  doorLockPassword: text('door_lock_password'),
  wifiSsid: text('wifi_ssid'),
  wifiPassword: text('wifi_password'),
  cleaningClosetLocation: text('cleaning_closet_location'),
  extraLinenLocation: text('extra_linen_location'),
  trashDisposalLocation: text('trash_disposal_location'),
  linenWashLocation: linenWashLocationEnum('linen_wash_location'),
  linenWashExternalAddress: text('linen_wash_external_address'),
  linenWashExternalAddressDetail: text('linen_wash_external_address_detail'),
  qrToken: uuid('qr_token').defaultRandom().notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const managers = pgTable(
  'managers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    memo: text('memo'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('managers_profile_id_idx').on(t.profileId)],
)

export const cleaningRequests = pgTable('cleaning_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  hostId: uuid('host_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  managerId: uuid('manager_id')
    .references(() => managers.id, { onDelete: 'set null' }),
  serviceType: cleaningServiceTypeEnum('service_type').default('general').notNull(),
  cleaningType: cleaningTypeEnum('cleaning_type').default('standard').notNull(),
  cleaningPlan: cleaningPlanEnum('cleaning_plan').default('one_time').notNull(),
  status: cleaningStatusEnum('status').default('pending').notNull(),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  scheduledTime: text('scheduled_time').notNull(), // HH:MM
  memo: text('memo'),
  linenWash: boolean('linen_wash').default(false).notNull(),
  price: integer('price').notNull(), // 스냅샷 금액 (원)
  discount: integer('discount').default(0).notNull(), // 할인 금액
  finalPrice: integer('final_price').notNull(), // 최종 결제 금액
  orderId: text('order_id'), // 토스페이먼츠 주문번호
  paymentKey: text('payment_key'), // 토스페이먼츠 결제키
  paymentMethod: paymentMethodEnum('payment_method').default('card').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }), // 결제/입금 확인 시점
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
})

export const cleaningRequestPhotos = pgTable('cleaning_request_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  cleaningRequestId: uuid('cleaning_request_id')
    .notNull()
    .references(() => cleaningRequests.id, { onDelete: 'cascade' }),
  propertySpaceId: uuid('property_space_id').references(() => propertySpaces.id, { onDelete: 'set null' }),
  propertyAssetId: uuid('property_asset_id').references(() => propertyAssets.id, { onDelete: 'set null' }),
  kind: cleaningPhotoKindEnum('kind').default('after').notNull(),
  storagePath: text('storage_path').notNull(),
  thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const cleaningRequestAssets = pgTable(
  'cleaning_request_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cleaningRequestId: uuid('cleaning_request_id')
      .notNull()
      .references(() => cleaningRequests.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => propertyAssets.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('cleaning_request_assets_request_asset_idx').on(t.cleaningRequestId, t.assetId)],
)

export const propertyAssets = pgTable('property_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  category: fixtureCategoryEnum('category').default('other').notNull(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  brand: text('brand'),
  modelNumber: text('model_number'),
  specNotes: text('spec_notes'),
  installedAt: date('installed_at'),
  lastInspectedAt: date('last_inspected_at'),
  nextInspectionDue: date('next_inspection_due'),
  purchaseUrl: text('purchase_url'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const propertyAssetPhotos = pgTable('property_asset_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  fixtureId: uuid('property_asset_id')
    .notNull()
    .references(() => propertyAssets.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
  caption: text('caption'),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const propertySpaces = pgTable('property_spaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  category: propertySpaceCategoryEnum('category').notNull(),
  name: text('name').notNull(),
  pyeong: smallint('pyeong').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const propertySpacePhotos = pgTable('property_space_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertySpaceId: uuid('property_space_id')
    .notNull()
    .references(() => propertySpaces.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
  caption: text('caption'),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const propertyCleaningPrepPhotos = pgTable('property_cleaning_prep_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  kind: cleaningPrepPhotoKindEnum('kind').notNull(),
  storagePath: text('storage_path').notNull(),
  thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const propertyCleaningManualSteps = pgTable(
  'property_cleaning_manual_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('property_cleaning_manual_steps_property_idx').on(t.propertyId, t.sortOrder)],
)

export const propertyCleaningManualStepPhotos = pgTable(
  'property_cleaning_manual_step_photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    stepId: uuid('step_id')
      .notNull()
      .references(() => propertyCleaningManualSteps.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
    sortOrder: smallint('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('property_cleaning_manual_step_photos_step_idx').on(t.stepId, t.sortOrder)],
)

export const cleaningManualStepChecks = pgTable(
  'cleaning_manual_step_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cleaningRequestId: uuid('cleaning_request_id')
      .notNull()
      .references(() => cleaningRequests.id, { onDelete: 'cascade' }),
    stepId: uuid('step_id')
      .notNull()
      .references(() => propertyCleaningManualSteps.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('cleaning_manual_step_checks_request_step_idx').on(t.cleaningRequestId, t.stepId),
  ],
)

export const repairRequests = pgTable('repair_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  hostId: uuid('host_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  managerId: uuid('manager_id').references(() => managers.id, {
    onDelete: 'set null',
  }),
  status: repairStatusEnum('status').default('submitted').notNull(),
  description: text('description').notNull(),
  preferredScheduledDate: text('preferred_scheduled_date').notNull(), // YYYY-MM-DD
  preferredScheduledTime: text('preferred_scheduled_time').notNull(), // HH:MM
  scheduledDate: text('scheduled_date'), // 매니저가 확정한 방문 날짜
  scheduledTime: text('scheduled_time'),
  quotedCost: integer('quoted_cost'), // 견적 금액 (원)
  quoteNote: text('quote_note'),      // 견적서 부가 설명
  orderId: text('order_id'),          // 토스페이먼츠 주문번호
  paymentKey: text('payment_key'),
  quotedAt: timestamp('quoted_at', { withTimezone: true }),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const repairRequestPhotos = pgTable('repair_request_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairRequestId: uuid('repair_request_id')
    .notNull()
    .references(() => repairRequests.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const repairRequestAssets = pgTable(
  'repair_request_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repairRequestId: uuid('repair_request_id')
      .notNull()
      .references(() => repairRequests.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => propertyAssets.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('repair_request_assets_request_asset_idx').on(t.repairRequestId, t.assetId)],
)

export const repairCompletionReports = pgTable(
  'repair_completion_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    repairRequestId: uuid('repair_request_id')
      .notNull()
      .references(() => repairRequests.id, { onDelete: 'cascade' }),
    actionNotes: text('action_notes').notNull(),       // 조치 내용 (필수)
    additionalNotes: text('additional_notes'),          // 추가 메모 (선택)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('repair_completion_reports_repair_request_id_idx').on(t.repairRequestId)],
)

export const repairCompletionPhotos = pgTable('repair_completion_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  completionReportId: uuid('completion_report_id')
    .notNull()
    .references(() => repairCompletionReports.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const cleaningInspectionReports = pgTable(
  'cleaning_inspection_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cleaningRequestId: uuid('cleaning_request_id')
      .notNull()
      .references(() => cleaningRequests.id, { onDelete: 'cascade' }),
    summaryMemo: text('summary_memo'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('cleaning_inspection_reports_cleaning_request_id_idx').on(t.cleaningRequestId)],
)

export const cleaningInspectionAssetReports = pgTable(
  'cleaning_inspection_asset_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => cleaningInspectionReports.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => propertyAssets.id, { onDelete: 'cascade' }),
    status: inspectionStatusEnum('status'),
    memo: text('memo'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('cleaning_inspection_asset_reports_report_asset_idx').on(t.reportId, t.assetId)],
)

export const cleaningInspectionAssetPhotos = pgTable('cleaning_inspection_asset_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetReportId: uuid('asset_report_id')
    .notNull()
    .references(() => cleaningInspectionAssetReports.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  thumbnailStoragePath: text('thumbnail_storage_path').notNull(),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    targetPath: text('target_path').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    payload: jsonb('payload'),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('notifications_profile_created_at_idx').on(t.profileId, t.createdAt),
    index('notifications_profile_is_read_idx').on(t.profileId, t.isRead),
  ],
)

// ─── Relations ───────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  properties: many(properties),
  cleaningRequests: many(cleaningRequests),
  repairRequests: many(repairRequests),
  notifications: many(notifications),
}))

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  host: one(profiles, { fields: [properties.hostId], references: [profiles.id] }),
  spaces: many(propertySpaces),
  fixtures: many(propertyAssets),
  cleaningRequests: many(cleaningRequests),
  repairRequests: many(repairRequests),
}))

export const managersRelations = relations(managers, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [managers.profileId],
    references: [profiles.id],
  }),
  cleaningRequests: many(cleaningRequests),
  repairRequests: many(repairRequests),
}))

export const cleaningRequestsRelations = relations(cleaningRequests, ({ one, many }) => ({
  property: one(properties, {
    fields: [cleaningRequests.propertyId],
    references: [properties.id],
  }),
  host: one(profiles, {
    fields: [cleaningRequests.hostId],
    references: [profiles.id],
  }),
  manager: one(managers, {
    fields: [cleaningRequests.managerId],
    references: [managers.id],
  }),
  inspectionReport: one(cleaningInspectionReports, {
    fields: [cleaningRequests.id],
    references: [cleaningInspectionReports.cleaningRequestId],
  }),
  photos: many(cleaningRequestPhotos),
}))

export const cleaningRequestPhotosRelations = relations(cleaningRequestPhotos, ({ one }) => ({
  cleaningRequest: one(cleaningRequests, {
    fields: [cleaningRequestPhotos.cleaningRequestId],
    references: [cleaningRequests.id],
  }),
}))

export const propertyAssetsRelations = relations(propertyAssets, ({ one, many }) => ({
  property: one(properties, {
    fields: [propertyAssets.propertyId],
    references: [properties.id],
  }),
  photos: many(propertyAssetPhotos),
  repairRequestAssets: many(repairRequestAssets),
  inspectionReports: many(cleaningInspectionAssetReports),
}))

export const propertyAssetPhotosRelations = relations(propertyAssetPhotos, ({ one }) => ({
  fixture: one(propertyAssets, {
    fields: [propertyAssetPhotos.fixtureId],
    references: [propertyAssets.id],
  }),
}))

export const propertySpacesRelations = relations(propertySpaces, ({ one, many }) => ({
  property: one(properties, {
    fields: [propertySpaces.propertyId],
    references: [properties.id],
  }),
  photos: many(propertySpacePhotos),
}))

export const propertySpacePhotosRelations = relations(propertySpacePhotos, ({ one }) => ({
  propertySpace: one(propertySpaces, {
    fields: [propertySpacePhotos.propertySpaceId],
    references: [propertySpaces.id],
  }),
}))

export const repairRequestsRelations = relations(repairRequests, ({ one, many }) => ({
  property: one(properties, {
    fields: [repairRequests.propertyId],
    references: [properties.id],
  }),
  host: one(profiles, {
    fields: [repairRequests.hostId],
    references: [profiles.id],
  }),
  manager: one(managers, {
    fields: [repairRequests.managerId],
    references: [managers.id],
  }),
  photos: many(repairRequestPhotos),
  assets: many(repairRequestAssets),
  completionReport: one(repairCompletionReports, {
    fields: [repairRequests.id],
    references: [repairCompletionReports.repairRequestId],
  }),
}))

export const repairRequestPhotosRelations = relations(repairRequestPhotos, ({ one }) => ({
  repairRequest: one(repairRequests, {
    fields: [repairRequestPhotos.repairRequestId],
    references: [repairRequests.id],
  }),
}))

export const repairRequestAssetsRelations = relations(repairRequestAssets, ({ one }) => ({
  repairRequest: one(repairRequests, {
    fields: [repairRequestAssets.repairRequestId],
    references: [repairRequests.id],
  }),
  asset: one(propertyAssets, {
    fields: [repairRequestAssets.assetId],
    references: [propertyAssets.id],
  }),
}))

export const repairCompletionReportsRelations = relations(repairCompletionReports, ({ one, many }) => ({
  repairRequest: one(repairRequests, {
    fields: [repairCompletionReports.repairRequestId],
    references: [repairRequests.id],
  }),
  photos: many(repairCompletionPhotos),
}))

export const repairCompletionPhotosRelations = relations(repairCompletionPhotos, ({ one }) => ({
  completionReport: one(repairCompletionReports, {
    fields: [repairCompletionPhotos.completionReportId],
    references: [repairCompletionReports.id],
  }),
}))

export const cleaningInspectionReportsRelations = relations(cleaningInspectionReports, ({ one, many }) => ({
  cleaningRequest: one(cleaningRequests, {
    fields: [cleaningInspectionReports.cleaningRequestId],
    references: [cleaningRequests.id],
  }),
  assetReports: many(cleaningInspectionAssetReports),
}))

export const cleaningInspectionAssetReportsRelations = relations(cleaningInspectionAssetReports, ({ one, many }) => ({
  report: one(cleaningInspectionReports, {
    fields: [cleaningInspectionAssetReports.reportId],
    references: [cleaningInspectionReports.id],
  }),
  asset: one(propertyAssets, {
    fields: [cleaningInspectionAssetReports.assetId],
    references: [propertyAssets.id],
  }),
  photos: many(cleaningInspectionAssetPhotos),
}))

export const cleaningInspectionAssetPhotosRelations = relations(cleaningInspectionAssetPhotos, ({ one }) => ({
  assetReport: one(cleaningInspectionAssetReports, {
    fields: [cleaningInspectionAssetPhotos.assetReportId],
    references: [cleaningInspectionAssetReports.id],
  }),
}))
