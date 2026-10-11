// Gerado por `npm run db:types` a partir do banco migrado (supabase/migrations).
// Não edite à mão: mude o SQL numa migração nova e gere de novo.
import { pgTable, foreignKey, uuid, timestamp, index, check, text, integer, unique, jsonb, date, uniqueIndex, char, boolean, bigint, smallint, primaryKey, customType, pgSchema } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Tipos que o drizzle-kit não reconhece sozinho.
const citext = customType<{ data: string }>({ dataType: () => "citext" });
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

// auth.users é do Supabase Auth; aqui só o que as chaves estrangeiras usam.
export const users = pgSchema("auth").table("users", { id: uuid().primaryKey() });



export const accounts = pgTable("accounts", {
	id: uuid().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "accounts_id_fkey"
		}).onDelete("cascade"),
]);

export const reservedUsernames = pgTable("reserved_usernames", {
	username: citext("username").primaryKey().notNull(),
});

export const collections = pgTable("collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	title: text().notNull(),
	position: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("collections_profile_idx").using("btree", table.profileId.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "collections_profile_id_fkey"
		}).onDelete("cascade"),
	check("collections_title_check", sql`(char_length(title) >= 1) AND (char_length(title) <= 60)`),
]);

export const socialLinks = pgTable("social_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	platform: text().notNull(),
	url: text().notNull(),
	position: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("social_links_profile_idx").using("btree", table.profileId.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "social_links_profile_id_fkey"
		}).onDelete("cascade"),
	unique("social_links_profile_id_platform_key").on(table.profileId, table.platform),
	check("social_links_url_check", sql`url ~ '^https?://[^\s]+$'::text`),
]);

export const appearances = pgTable("appearances", {
	profileId: uuid("profile_id").primaryKey().notNull(),
	theme: text().default('padrao').notNull(),
	custom: jsonb(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "appearances_profile_id_fkey"
		}).onDelete("cascade"),
]);

export const forms = pgTable("forms", {
	linkId: uuid("link_id").primaryKey().notNull(),
	fields: jsonb().default([{"type":"email","label":"Email","required":true}]).notNull(),
	successMessage: text("success_message"),
	consentText: text("consent_text").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.linkId],
			foreignColumns: [links.id],
			name: "forms_link_id_fkey"
		}).onDelete("cascade"),
	check("forms_success_message_check", sql`char_length(success_message) <= 200`),
]);

export const submissions = pgTable("submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	linkId: uuid("link_id"),
	email: citext("email").notNull(),
	name: text(),
	phone: text(),
	extra: jsonb().default({}).notNull(),
	consentText: text("consent_text").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("submissions_profile_idx").using("btree", table.profileId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.linkId],
			foreignColumns: [links.id],
			name: "submissions_link_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "submissions_profile_id_fkey"
		}).onDelete("cascade"),
	unique("submissions_profile_id_email_key").on(table.profileId, table.email),
	check("submissions_email_check", sql`email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'::citext`),
	check("submissions_name_check", sql`char_length(name) <= 100`),
	check("submissions_phone_check", sql`char_length(phone) <= 30`),
]);

export const analyticsSalts = pgTable("analytics_salts", {
	day: date().primaryKey().notNull(),
	salt: bytea("salt").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const dailyStats = pgTable("daily_stats", {
	profileId: uuid("profile_id").notNull(),
	day: date().notNull(),
	linkId: uuid("link_id"),
	views: integer().default(0).notNull(),
	uniqueViews: integer("unique_views").default(0).notNull(),
	clicks: integer().default(0).notNull(),
	uniqueClicks: integer("unique_clicks").default(0).notNull(),
	signups: integer().default(0).notNull(),
}, (table) => [
	uniqueIndex("daily_stats_key").using("btree", sql`profile_id`, sql`day`, sql`COALESCE(link_id, '00000000-0000-0000-0000-000000000000'::uuid)`),
	foreignKey({
			columns: [table.linkId],
			foreignColumns: [links.id],
			name: "daily_stats_link_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "daily_stats_profile_id_fkey"
		}).onDelete("cascade"),
]);

export const subscriptions = pgTable("subscriptions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	provider: text().default('asaas').notNull(),
	providerCustomerId: text("provider_customer_id").notNull(),
	providerSubscriptionId: text("provider_subscription_id"),
	plan: text().notNull(),
	billingType: text("billing_type").notNull(),
	status: text().default('pending').notNull(),
	priceCents: integer("price_cents").notNull(),
	currency: char({ length: 3 }).default('BRL').notNull(),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: 'string' }),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "subscriptions_account_id_fkey"
		}).onDelete("cascade"),
	unique("subscriptions_account_id_key").on(table.accountId),
	unique("subscriptions_provider_subscription_id_key").on(table.providerSubscriptionId),
	check("subscriptions_billing_type_check", sql`billing_type = ANY (ARRAY['pix'::text, 'card'::text, 'boleto'::text])`),
	check("subscriptions_plan_check", sql`plan = 'pro'::text`),
	check("subscriptions_price_cents_check", sql`price_cents > 0`),
	check("subscriptions_provider_check", sql`provider = 'asaas'::text`),
	check("subscriptions_status_check", sql`status = ANY (ARRAY['pending'::text, 'active'::text, 'past_due'::text, 'canceled'::text])`),
]);

export const billingEvents = pgTable("billing_events", {
	providerEventId: text("provider_event_id").primaryKey().notNull(),
	type: text().notNull(),
	payload: jsonb().notNull(),
	receivedAt: timestamp("received_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	processedAt: timestamp("processed_at", { withTimezone: true, mode: 'string' }),
});

export const dataRequests = pgTable("data_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id"),
	requesterEmail: citext("requester_email").notNull(),
	kind: text().notNull(),
	requestedAt: timestamp("requested_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	notes: text(),
}, (table) => [
	index("data_requests_open_idx").using("btree", table.requestedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(completed_at IS NULL)`),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "data_requests_account_id_fkey"
		}).onDelete("set null"),
	check("data_requests_kind_check", sql`kind = ANY (ARRAY['access'::text, 'export'::text, 'correct'::text, 'delete'::text, 'revoke'::text, 'other'::text])`),
]);

export const jobRuns = pgTable("job_runs", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "job_runs_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	job: text().notNull(),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
	attempts: smallint().default(1).notNull(),
	ok: boolean(),
	error: text(),
	result: jsonb(),
}, (table) => [
	index("job_runs_falhas_idx").using("btree", table.startedAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(ok IS FALSE)`),
	index("job_runs_job_idx").using("btree", table.job.asc().nullsLast().op("text_ops"), table.startedAt.desc().nullsFirst().op("text_ops")),
]);

export const links = pgTable("links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	profileId: uuid("profile_id").notNull(),
	collectionId: uuid("collection_id"),
	kind: text().default('link').notNull(),
	title: text().notNull(),
	url: text(),
	thumbnailPath: text("thumbnail_path"),
	position: integer().notNull(),
	enabled: boolean().default(true).notNull(),
	startsAt: timestamp("starts_at", { withTimezone: true, mode: 'string' }),
	endsAt: timestamp("ends_at", { withTimezone: true, mode: 'string' }),
	lock: text().default('none').notNull(),
	lockMinAge: smallint("lock_min_age"),
	highlight: text().default('none').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	scheduleTz: text("schedule_tz"),
}, (table) => [
	index("links_collection_idx").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("links_profile_idx").using("btree", table.profileId.asc().nullsLast().op("int4_ops"), table.position.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [collections.id],
			name: "links_collection_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "links_profile_id_fkey"
		}).onDelete("cascade"),
	check("links_age_lock", sql`(lock = 'age'::text) = (lock_min_age IS NOT NULL)`),
	check("links_highlight_check", sql`highlight = ANY (ARRAY['none'::text, 'animate'::text, 'spotlight'::text])`),
	check("links_kind_check", sql`kind = ANY (ARRAY['link'::text, 'header'::text, 'video'::text, 'form'::text])`),
	check("links_lock_check", sql`lock = ANY (ARRAY['none'::text, 'sensitive'::text, 'age'::text])`),
	check("links_lock_min_age_check", sql`lock_min_age = ANY (ARRAY[18, 21, 25])`),
	check("links_schedule_tz_check", sql`(schedule_tz IS NULL) OR ((char_length(schedule_tz) >= 1) AND (char_length(schedule_tz) <= 64))`),
	check("links_title_check", sql`(char_length(title) >= 1) AND (char_length(title) <= 100)`),
	check("links_url_check", sql`(url IS NULL) OR (url ~ '^https?://[^\s]+$'::text)`),
	check("links_url_needed", sql`(kind <> ALL (ARRAY['link'::text, 'video'::text])) OR (url IS NOT NULL)`),
	check("links_window", sql`(ends_at IS NULL) OR (starts_at IS NULL) OR (ends_at > starts_at)`),
]);

export const profiles = pgTable("profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id"),
	username: citext("username").notNull(),
	usernameChangedAt: timestamp("username_changed_at", { withTimezone: true, mode: 'string' }),
	title: text(),
	bio: text(),
	avatarPath: text("avatar_path"),
	headerLayout: text("header_layout").default('classic').notNull(),
	socialPosition: text("social_position").default('top').notNull(),
	sensitiveLabel: text("sensitive_label").default('none').notNull(),
	timezone: text().default('America/Sao_Paulo').notNull(),
	category: text(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	movedTo: uuid("moved_to"),
}, (table) => [
	index("profiles_account_idx").using("btree", table.accountId.asc().nullsLast().op("uuid_ops")),
	index("profiles_deleted_idx").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")).where(sql`(deleted_at IS NOT NULL)`),
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [accounts.id],
			name: "profiles_account_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.movedTo],
			foreignColumns: [table.id],
			name: "profiles_moved_to_fkey"
		}).onDelete("set null"),
	unique("profiles_username_key").on(table.username),
	check("profiles_bio_check", sql`char_length(bio) <= 160`),
	check("profiles_header_layout_check", sql`header_layout = ANY (ARRAY['classic'::text, 'hero'::text])`),
	check("profiles_moved_to_so_excluido", sql`(moved_to IS NULL) OR (deleted_at IS NOT NULL)`),
	check("profiles_sem_dono_so_excluido", sql`(account_id IS NOT NULL) OR (deleted_at IS NOT NULL)`),
	check("profiles_sensitive_label_check", sql`sensitive_label = ANY (ARRAY['none'::text, 'sensitive'::text, '18'::text, '21'::text, '25'::text])`),
	check("profiles_social_position_check", sql`social_position = ANY (ARRAY['top'::text, 'bottom'::text])`),
	check("profiles_title_check", sql`char_length(title) <= 60`),
	check("profiles_username_check", sql`(username ~ '^[a-z0-9._]{3,30}$'::citext) AND (username !~ '^[._]|[._]$'::citext)`),
]);

export const events = pgTable("events", {
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity({ name: "events_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 9223372036854775807, cache: 1 }),
	profileId: uuid("profile_id").notNull(),
	linkId: uuid("link_id"),
	type: text().notNull(),
	occurredAt: timestamp("occurred_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	visitorHash: bytea("visitor_hash").notNull(),
	country: char({ length: 2 }),
	city: text(),
	source: text().default('direct').notNull(),
	device: text().default('mobile').notNull(),
}, (table) => [
	index("events_link_idx").using("btree", table.linkId.asc().nullsLast().op("timestamptz_ops"), table.occurredAt.asc().nullsLast().op("uuid_ops")),
	index("events_profile_idx").using("btree", table.profileId.asc().nullsLast().op("uuid_ops"), table.occurredAt.asc().nullsLast().op("uuid_ops")),
	index("events_time_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.linkId],
			foreignColumns: [links.id],
			name: "events_link_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "events_profile_id_fkey"
		}).onDelete("cascade"),
	check("events_device_check", sql`device = ANY (ARRAY['mobile'::text, 'desktop'::text, 'tablet'::text])`),
	check("events_source_check", sql`source = ANY (ARRAY['instagram'::text, 'tiktok'::text, 'whatsapp'::text, 'youtube'::text, 'x'::text, 'facebook'::text, 'search'::text, 'qr'::text, 'direct'::text, 'other'::text])`),
	check("events_type_check", sql`type = ANY (ARRAY['view'::text, 'click'::text, 'signup'::text])`),
]);

export const rateLimits = pgTable("rate_limits", {
	key: text().notNull(),
	windowStart: timestamp("window_start", { withTimezone: true, mode: 'string' }).notNull(),
	count: integer().default(1).notNull(),
}, (table) => [
	primaryKey({ columns: [table.key, table.windowStart], name: "rate_limits_pkey"}),
]);

export const dailyBreakdowns = pgTable("daily_breakdowns", {
	profileId: uuid("profile_id").notNull(),
	day: date().notNull(),
	dimension: text().notNull(),
	value: text().notNull(),
	views: integer().default(0).notNull(),
	clicks: integer().default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.profileId],
			foreignColumns: [profiles.id],
			name: "daily_breakdowns_profile_id_fkey"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.profileId, table.day, table.dimension, table.value], name: "daily_breakdowns_pkey"}),
	check("daily_breakdowns_dimension_check", sql`dimension = ANY (ARRAY['source'::text, 'country'::text, 'city'::text, 'device'::text])`),
]);
