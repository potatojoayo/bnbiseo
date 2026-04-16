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

export const fixtureCategoryEnum = pgEnum('fixture_category', [
  'lighting',
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

export const repairSourceEnum = pgEnum('repair_source', ['host', 'guest'])

export const repairPriorityEnum = pgEnum('repair_priority', [
  'low',
  'normal',
  'high',
  'urgent',
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

export const repairStatusEnum = pgEnum('repair_status', [
  'submitted',
  'reviewing',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
])

export const photoTypeEnum = pgEnum('photo_type', ['defect', 'before', 'after'])

export const uploadedByEnum = pgEnum('uploaded_by', ['host', 'guest'])

export const sessionTypeEnum = pgEnum('session_type', [
  'host_repair',
  'guest_guide',
  'guest_defect',
])

export const chatSessionStatusEnum = pgEnum('chat_session_status', [
  'active',
  'completed',
  'abandoned',
])

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'manager'])

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system'])

// ─── Tables ──────────────────────────────────────────────────────────────────

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(), // references auth.users
  email: text('email'),
  fullName: text('full_name'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('user').notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
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
  pyeong: smallint('pyeong'),
  bedrooms: smallint('bedrooms'),
  bathrooms: smallint('bathrooms'),
  propertyType: propertyTypeEnum('property_type').default('apartment').notNull(),
  description: text('description'),
  nearbyInfo: text('nearby_info'),
  checkinInfo: text('checkin_info'),
  wifiSsid: text('wifi_ssid'),
  wifiPassword: text('wifi_password'),
  qrToken: uuid('qr_token').defaultRandom().notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})

export const managers = pgTable('managers', {
  id: uuid('id').primaryKey().defaultRandom(),
  profileId: uuid('profile_id')
    .references(() => profiles.id, { onDelete: 'set null' }), // nullable, 나중에 매니저 회원가입 시 연결
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  memo: text('memo'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

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
  cleaningType: cleaningTypeEnum('cleaning_type').default('standard').notNull(),
  status: cleaningStatusEnum('status').default('pending').notNull(),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  scheduledTime: text('scheduled_time').notNull(), // HH:MM
  memo: text('memo'),
  price: integer('price').notNull(), // 스냅샷 금액 (원)
  discount: integer('discount').default(0).notNull(), // 할인 금액
  finalPrice: integer('final_price').notNull(), // 최종 결제 금액
  orderId: text('order_id'), // 토스페이먼츠 주문번호
  paymentKey: text('payment_key'), // 토스페이먼츠 결제키
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
})

export const propertyPhotos = pgTable('property_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  caption: text('caption'),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const fixtures = pgTable('fixtures', {
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

export const fixturePhotos = pgTable('fixture_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  fixtureId: uuid('fixture_id')
    .notNull()
    .references(() => fixtures.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  caption: text('caption'),
  sortOrder: smallint('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const guestSessions = pgTable(
  'guest_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    token: uuid('token').defaultRandom().notNull(),
    language: text('language').default('ko').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('guest_sessions_token_idx').on(t.token)],
)

export const repairRequests = pgTable('repair_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  fixtureId: uuid('fixture_id').references(() => fixtures.id, {
    onDelete: 'set null',
  }),
  source: repairSourceEnum('source').default('host').notNull(),
  guestSessionId: uuid('guest_session_id').references(
    () => guestSessions.id,
    { onDelete: 'set null' },
  ),
  // chat_session_id reference added after chat_sessions table (circular) — handled via migration
  chatSessionId: uuid('chat_session_id'),
  title: text('title').notNull(),
  description: text('description'),
  aiDiagnosis: text('ai_diagnosis'),
  aiPartsEstimate: jsonb('ai_parts_estimate'),
  aiCostEstimate: integer('ai_cost_estimate'),
  priority: repairPriorityEnum('priority').default('normal').notNull(),
  status: repairStatusEnum('status').default('submitted').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  assignedTo: text('assigned_to'),
  actualCost: integer('actual_cost'),
  completionNotes: text('completion_notes'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  sessionType: sessionTypeEnum('session_type').notNull(),
  hostId: uuid('host_id').references(() => profiles.id, {
    onDelete: 'cascade',
  }),
  guestSessionId: uuid('guest_session_id').references(
    () => guestSessions.id,
    { onDelete: 'cascade' },
  ),
  title: text('title'),
  status: chatSessionStatusEnum('status').default('active').notNull(),
  repairRequestId: uuid('repair_request_id').references(
    () => repairRequests.id,
    { onDelete: 'set null' },
  ),
  contextSnapshot: jsonb('context_snapshot'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatSessionId: uuid('chat_session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: chatRoleEnum('role').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const repairPhotos = pgTable('repair_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairRequestId: uuid('repair_request_id')
    .notNull()
    .references(() => repairRequests.id, { onDelete: 'cascade' }),
  storagePath: text('storage_path').notNull(),
  photoType: photoTypeEnum('photo_type').notNull(),
  caption: text('caption'),
  uploadedBy: uploadedByEnum('uploaded_by').default('host').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const repairParts = pgTable('repair_parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  repairRequestId: uuid('repair_request_id')
    .notNull()
    .references(() => repairRequests.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  brand: text('brand'),
  modelNumber: text('model_number'),
  quantity: smallint('quantity').default(1).notNull(),
  unitPrice: integer('unit_price').notNull(),
  purchaseSource: text('purchase_source'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

// ─── Relations ───────────────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ many }) => ({
  properties: many(properties),
  cleaningRequests: many(cleaningRequests),
  chatSessions: many(chatSessions),
}))

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  host: one(profiles, { fields: [properties.hostId], references: [profiles.id] }),
  photos: many(propertyPhotos),
  fixtures: many(fixtures),
  cleaningRequests: many(cleaningRequests),
  repairRequests: many(repairRequests),
  guestSessions: many(guestSessions),
  chatSessions: many(chatSessions),
}))

export const managersRelations = relations(managers, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [managers.profileId],
    references: [profiles.id],
  }),
  cleaningRequests: many(cleaningRequests),
}))

export const cleaningRequestsRelations = relations(cleaningRequests, ({ one }) => ({
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
}))

export const propertyPhotosRelations = relations(propertyPhotos, ({ one }) => ({
  property: one(properties, {
    fields: [propertyPhotos.propertyId],
    references: [properties.id],
  }),
}))

export const fixturesRelations = relations(fixtures, ({ one, many }) => ({
  property: one(properties, {
    fields: [fixtures.propertyId],
    references: [properties.id],
  }),
  photos: many(fixturePhotos),
  repairRequests: many(repairRequests),
}))

export const fixturePhotosRelations = relations(fixturePhotos, ({ one }) => ({
  fixture: one(fixtures, {
    fields: [fixturePhotos.fixtureId],
    references: [fixtures.id],
  }),
}))

export const guestSessionsRelations = relations(guestSessions, ({ one, many }) => ({
  property: one(properties, {
    fields: [guestSessions.propertyId],
    references: [properties.id],
  }),
  repairRequests: many(repairRequests),
  chatSessions: many(chatSessions),
}))

export const repairRequestsRelations = relations(repairRequests, ({ one, many }) => ({
  property: one(properties, {
    fields: [repairRequests.propertyId],
    references: [properties.id],
  }),
  fixture: one(fixtures, {
    fields: [repairRequests.fixtureId],
    references: [fixtures.id],
  }),
  guestSession: one(guestSessions, {
    fields: [repairRequests.guestSessionId],
    references: [guestSessions.id],
  }),
  chatSession: one(chatSessions, {
    fields: [repairRequests.chatSessionId],
    references: [chatSessions.id],
  }),
  photos: many(repairPhotos),
  parts: many(repairParts),
}))

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  property: one(properties, {
    fields: [chatSessions.propertyId],
    references: [properties.id],
  }),
  host: one(profiles, {
    fields: [chatSessions.hostId],
    references: [profiles.id],
  }),
  guestSession: one(guestSessions, {
    fields: [chatSessions.guestSessionId],
    references: [guestSessions.id],
  }),
  repairRequest: one(repairRequests, {
    fields: [chatSessions.repairRequestId],
    references: [repairRequests.id],
  }),
  messages: many(chatMessages),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chatSession: one(chatSessions, {
    fields: [chatMessages.chatSessionId],
    references: [chatSessions.id],
  }),
}))

export const repairPhotosRelations = relations(repairPhotos, ({ one }) => ({
  repairRequest: one(repairRequests, {
    fields: [repairPhotos.repairRequestId],
    references: [repairRequests.id],
  }),
}))

export const repairPartsRelations = relations(repairParts, ({ one }) => ({
  repairRequest: one(repairRequests, {
    fields: [repairParts.repairRequestId],
    references: [repairRequests.id],
  }),
}))
