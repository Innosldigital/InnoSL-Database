-- ============================================================
--  INNOVATION SL — ECOSYSTEM INTELLIGENCE PLATFORM
--  PostgreSQL 15 · Supabase · Complete Database Schema
--  Generated: April 2026 | CTO: Ngevao Sesay
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- fuzzy name matching for dedup

-- ============================================================
--  ENUMS
-- ============================================================

CREATE TYPE gender_type      AS ENUM ('Male','Female','Non-binary','Prefer not to say','Unknown');
CREATE TYPE age_group_type   AS ENUM ('Girl','Youth','Adult','Aged','Unknown');
CREATE TYPE event_type       AS ENUM ('FPN','FIW','GEW','OSVP','Dare2Aspire','EWC','SLEDP','NYEFF','Other');
CREATE TYPE role_at_event    AS ENUM ('Pitcher','Exhibitor','Speaker','Judge','Host','Panelist','Volunteer','VIP','Delegate','Participant','Staff');
CREATE TYPE vip_type         AS ENUM ('Investor','Diplomat','Government','Media','Corporate','Academic','Development_partner');
CREATE TYPE grant_type       AS ENUM ('Grant','Prize','Seed_capital','Loan','In-kind','Other');
CREATE TYPE diag_tool        AS ENUM ('ISL_Scorecard','SME_TA_Diagnosis','ILO_Acceleration','Lendability_Index','VIRAL_Assessment','Other');
CREATE TYPE record_status    AS ENUM ('Active','Inactive','Merged','Quarantined');
CREATE TYPE import_status    AS ENUM ('Staging','Clean','Approved','Rejected','Needs_review');

-- ============================================================
--  TABLE 1: PERSON  (master record — dedup key: email)
-- ============================================================

CREATE TABLE person (                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
    person_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,                          -- e.g. ISL-P-00083
    full_name            TEXT NOT NULL,
    preferred_name       TEXT,
    gender               gender_type DEFAULT 'Unknown',
    date_of_birth        DATE,
    age_group            age_group_type DEFAULT 'Unknown',
    nationality          TEXT DEFAULT 'Sierra Leonean',
    nin                  TEXT,                                 -- National ID Number (encrypted)
    phone_primary        TEXT,
    phone_secondary      TEXT,
    email_primary        TEXT UNIQUE,
    email_secondary      TEXT,
    location             TEXT,
    district             TEXT,
    region               TEXT,

    -- Equity intelligence flags (auto-computed by cleaning engine)
    is_woman             BOOLEAN DEFAULT FALSE,
    is_girl              BOOLEAN DEFAULT FALSE,               -- under 18
    is_youth             BOOLEAN DEFAULT FALSE,               -- 15–35
    is_aged              BOOLEAN DEFAULT FALSE,               -- 60+
    is_pwd               BOOLEAN DEFAULT FALSE,               -- person with disability
    is_repeat_beneficiary BOOLEAN DEFAULT FALSE,
    is_outside_freetown  BOOLEAN DEFAULT FALSE,

    -- Engagement summary (updated by trigger)
    first_engagement_date DATE,
    first_programme      TEXT,
    total_events_attended INT DEFAULT 0,
    total_programmes     INT DEFAULT 0,

    -- Data quality
    completeness_score   SMALLINT DEFAULT 0 CHECK (completeness_score BETWEEN 0 AND 100),
    record_status        record_status DEFAULT 'Active',
    import_status        import_status DEFAULT 'Approved',
    data_sources         TEXT[],                              -- which files this record was built from
    merged_from          UUID[],                              -- person_ids merged into this record
    notes                TEXT,

    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Indexes for dedup and search
CREATE INDEX idx_person_email      ON person(email_primary);
CREATE INDEX idx_person_phone      ON person(phone_primary);
CREATE INDEX idx_person_name_trgm  ON person USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_person_gender     ON person(gender);
CREATE INDEX idx_person_is_woman   ON person(is_woman) WHERE is_woman = TRUE;
CREATE INDEX idx_person_is_youth   ON person(is_youth) WHERE is_youth = TRUE;
CREATE INDEX idx_person_district   ON person(district);

-- ============================================================
--  TABLE 2: ORGANISATION
-- ============================================================

CREATE TABLE organisation (
    org_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,                          -- e.g. ISL-O-00021
    founder_person_id    UUID REFERENCES person(person_id),
    name                 TEXT NOT NULL,
    sector               TEXT,
    sub_sector           TEXT,
    stage                TEXT,                                 -- Idea, MVP, Pre-seed, Seed, Series A, Established
    org_type             TEXT,                                 -- Startup, SME, Cooperative, NGO, Social Enterprise
    reg_number           TEXT,
    founded_date         DATE,
    location             TEXT,
    district             TEXT,
    website              TEXT,
    description          TEXT,

    -- Equity flags
    woman_led            BOOLEAN DEFAULT FALSE,
    youth_led            BOOLEAN DEFAULT FALSE,
    diaspora_led         BOOLEAN DEFAULT FALSE,

    -- Status
    active               BOOLEAN DEFAULT TRUE,
    record_status        record_status DEFAULT 'Active',
    completeness_score   SMALLINT DEFAULT 0,

    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_org_sector    ON organisation(sector);
CREATE INDEX idx_org_woman_led ON organisation(woman_led) WHERE woman_led = TRUE;

-- ============================================================
--  TABLE 3: EVENT / PROGRAMME
-- ============================================================

CREATE TABLE event (
    event_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,                          -- e.g. ISL-E-FPN-2024-003
    name                 TEXT NOT NULL,
    event_type           event_type NOT NULL,
    programme            TEXT,                                 -- parent programme e.g. "Freetown Pitch Night"
    edition_year         SMALLINT,
    edition_number       SMALLINT,
    theme                TEXT,
    date_start           DATE,
    date_end             DATE,
    venue                TEXT,
    city                 TEXT DEFAULT 'Freetown',
    funder               TEXT,
    partner_organisations TEXT[],

    -- Attendance counts (computed by trigger from attendance table)
    total_registered     INT DEFAULT 0,
    total_attended       INT DEFAULT 0,
    vip_count            INT DEFAULT 0,
    female_count         INT DEFAULT 0,
    male_count           INT DEFAULT 0,
    youth_count          INT DEFAULT 0,
    aged_count           INT DEFAULT 0,

    -- Linked documents
    report_doc_link      TEXT,
    registration_form_id TEXT,                                 -- Google Form ID
    drive_folder_link    TEXT,

    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_event_type  ON event(event_type);
CREATE INDEX idx_event_year  ON event(edition_year);
CREATE INDEX idx_event_prog  ON event(programme);

-- ============================================================
--  TABLE 4: ATTENDANCE  (person × event junction)
-- ============================================================

CREATE TABLE attendance (
    attendance_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id            UUID NOT NULL REFERENCES person(person_id) ON DELETE RESTRICT,
    event_id             UUID NOT NULL REFERENCES event(event_id)  ON DELETE RESTRICT,
    role_at_event        role_at_event DEFAULT 'Participant',
    registered           BOOLEAN DEFAULT TRUE,
    attended             BOOLEAN DEFAULT FALSE,
    day_number           SMALLINT,                             -- for multi-day events
    source_form          TEXT,                                 -- which Google Form row
    import_batch         TEXT,                                 -- which import run
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    UNIQUE(person_id, event_id, role_at_event)
);

CREATE INDEX idx_att_person ON attendance(person_id);
CREATE INDEX idx_att_event  ON attendance(event_id);

-- ============================================================
--  TABLE 5: EVENT_ROLE  (judges, speakers, hosts, VIPs, exhibitors)
-- ============================================================

CREATE TABLE event_role (
    role_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id            UUID NOT NULL REFERENCES person(person_id),
    event_id             UUID NOT NULL REFERENCES event(event_id),
    org_id               UUID REFERENCES organisation(org_id),
    role_type            role_at_event NOT NULL,
    topic                TEXT,
    session_title        TEXT,
    is_vip               BOOLEAN DEFAULT FALSE,
    is_keynote           BOOLEAN DEFAULT FALSE,
    bio_doc_link         TEXT,
    headshot_link        TEXT,
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    UNIQUE(person_id, event_id, role_type)
);

CREATE INDEX idx_erole_person ON event_role(person_id);
CREATE INDEX idx_erole_event  ON event_role(event_id);
CREATE INDEX idx_erole_type   ON event_role(role_type);

-- ============================================================
--  TABLE 6: PITCH  (competition entries)
-- ============================================================

CREATE TABLE pitch (
    pitch_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,                          -- e.g. ISL-P-OSVP-2021-047
    event_id             UUID NOT NULL REFERENCES event(event_id),
    person_id            UUID NOT NULL REFERENCES person(person_id),
    org_id               UUID REFERENCES organisation(org_id),
    application_code     TEXT,                                 -- e.g. OSVP2021_47 (coded submissions)
    theme                TEXT,
    category             TEXT,                                 -- Grand Prix, Women's Prize, Tech Queen, Jr Pitchers
    idea_description     TEXT,
    pitch_stage          TEXT,                                 -- Ideation, MVP, Revenue

    -- Scoring
    score                NUMERIC(5,2),
    rank                 SMALLINT,
    judge_ids            UUID[],

    -- Outcome
    winner_flag          BOOLEAN DEFAULT FALSE,
    finalist_flag        BOOLEAN DEFAULT FALSE,
    prize_amount         NUMERIC(12,2),
    prize_currency       TEXT DEFAULT 'USD',
    prize_type           grant_type,

    -- Historical flags
    first_female_flag    BOOLEAN DEFAULT FALSE,               -- was this person the first female winner at this event type?
    first_time_flag      BOOLEAN DEFAULT FALSE,
    repeat_pitcher_flag  BOOLEAN DEFAULT FALSE,

    -- Documents
    pitch_deck_link      TEXT,
    feedback_doc_link    TEXT,

    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pitch_event   ON pitch(event_id);
CREATE INDEX idx_pitch_person  ON pitch(person_id);
CREATE INDEX idx_pitch_winner  ON pitch(winner_flag) WHERE winner_flag = TRUE;
CREATE INDEX idx_pitch_female  ON pitch(first_female_flag) WHERE first_female_flag = TRUE;

-- ============================================================
--  TABLE 7: TRAINING_SESSION
-- ============================================================

CREATE TABLE training_session (
    training_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id             UUID REFERENCES event(event_id),
    programme_funder     TEXT,                                 -- ITC, ILO, UNDP, Orange, etc.
    session_type         TEXT,                                 -- Workshop, Coaching, Bootcamp, Webinar
    topic                TEXT NOT NULL,
    facilitator          TEXT,
    facilitator_person_id UUID REFERENCES person(person_id),
    session_date         DATE,
    duration_hours       NUMERIC(4,1),
    format               TEXT DEFAULT 'In-person',            -- In-person, Virtual, Hybrid

    -- Participants
    total_registered     INT DEFAULT 0,
    total_attended       INT DEFAULT 0,
    female_count         INT DEFAULT 0,
    male_count           INT DEFAULT 0,
    youth_count          INT DEFAULT 0,

    -- Outcomes
    satisfaction_score   NUMERIC(4,1),
    pre_score            NUMERIC(4,1),
    post_score           NUMERIC(4,1),

    -- Documents
    report_doc_link      TEXT,
    materials_link       TEXT,

    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE 8: COHORT  (incubation / acceleration programmes)
-- ============================================================

CREATE TABLE cohort (
    cohort_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,
    programme_name       TEXT NOT NULL,
    funder               TEXT,
    cohort_number        SMALLINT,
    year                 SMALLINT,
    start_date           DATE,
    end_date             DATE,
    sector_focus         TEXT,
    stage_focus          TEXT,

    -- Participant counts
    total_startups       INT DEFAULT 0,
    female_led_count     INT DEFAULT 0,
    youth_led_count      INT DEFAULT 0,
    regional_count       INT DEFAULT 0,                       -- outside Freetown

    -- Outcomes
    graduated_count      INT DEFAULT 0,
    jobs_created         INT DEFAULT 0,
    revenue_post         NUMERIC(14,2),
    eso_trained_flag     BOOLEAN DEFAULT FALSE,

    -- Documents
    report_doc_link      TEXT,
    drive_folder_link    TEXT,

    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- Junction: which organisations were in which cohort
CREATE TABLE cohort_member (
    cohort_id            UUID REFERENCES cohort(cohort_id),
    org_id               UUID REFERENCES organisation(org_id),
    person_id            UUID REFERENCES person(person_id),
    graduated            BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(cohort_id, org_id)
);

-- ============================================================
--  TABLE 9: GRANT_CAPITAL
-- ============================================================

CREATE TABLE grant_capital (
    grant_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,
    org_id               UUID REFERENCES organisation(org_id),
    person_id            UUID REFERENCES person(person_id),
    cohort_id            UUID REFERENCES cohort(cohort_id),
    funder               TEXT NOT NULL,
    programme            TEXT,
    grant_type           grant_type NOT NULL,
    amount_local         NUMERIC(14,2),
    amount_usd           NUMERIC(14,2),
    currency             TEXT DEFAULT 'SLE',
    disbursement_date    DATE,
    conditions           TEXT,

    -- Equity dimensions
    recipient_gender     gender_type,
    recipient_youth      BOOLEAN DEFAULT FALSE,
    recipient_sector     TEXT,
    woman_led_business   BOOLEAN DEFAULT FALSE,

    -- Outcomes
    milestone_1          TEXT,
    milestone_2          TEXT,
    milestone_3          TEXT,
    outcome_jobs         INT,
    outcome_revenue      NUMERIC(14,2),
    repayment_status     TEXT,                                 -- N/A, On-track, Overdue, Completed

    -- Documents
    agreement_doc_link   TEXT,
    mel_report_id        UUID,

    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_grant_org       ON grant_capital(org_id);
CREATE INDEX idx_grant_person    ON grant_capital(person_id);
CREATE INDEX idx_grant_woman_led ON grant_capital(woman_led_business) WHERE woman_led_business = TRUE;

-- ============================================================
--  TABLE 10: DIAGNOSTIC
-- ============================================================

CREATE TABLE diagnostic (
    diag_id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,
    org_id               UUID NOT NULL REFERENCES organisation(org_id),
    assessor             TEXT,
    assessor_person_id   UUID REFERENCES person(person_id),
    diag_date            DATE NOT NULL,
    tool_used            diag_tool NOT NULL,
    cohort_id            UUID REFERENCES cohort(cohort_id),

    -- ISL / SME TA Diagnosis scores
    strategic_score      NUMERIC(5,2),
    process_score        NUMERIC(5,2),
    support_score        NUMERIC(5,2),
    overall_score        NUMERIC(5,2),
    tier                 TEXT,                                 -- TA Tier 0–3, or Low/High Priority Gap

    -- ILO Acceleration Scorecard
    market_expansion_score  NUMERIC(5,2),
    production_score        NUMERIC(5,2),
    financial_mgmt_score    NUMERIC(5,2),
    operations_score        NUMERIC(5,2),
    social_impact_score     NUMERIC(5,2),

    -- Lendability Index
    lendability_score    NUMERIC(5,2),

    gap_priority         TEXT,
    ta_recommended       TEXT,
    ta_delivered         TEXT,
    follow_up_date       DATE,

    -- Equity flags
    woman_led_flag       BOOLEAN DEFAULT FALSE,
    youth_led_flag       BOOLEAN DEFAULT FALSE,

    -- Documents
    scorecard_doc_link   TEXT,
    raw_responses_link   TEXT,

    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE 11: MEL_REPORT  (Monitoring, Evaluation & Learning)
-- ============================================================

CREATE TABLE mel_report (
    report_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    isl_ref              TEXT UNIQUE,
    period               TEXT NOT NULL,                        -- e.g. "Jan–Mar 2026"
    period_start         DATE,
    period_end           DATE,
    programme            TEXT NOT NULL,
    funder               TEXT,
    report_type          TEXT DEFAULT 'Quarterly',

    -- KPI data (one row per indicator per period)
    kpi_name             TEXT,
    baseline             NUMERIC(10,2),
    target               NUMERIC(10,2),
    actual               NUMERIC(10,2),
    status               TEXT,                                 -- Exceeded, On Track, Below Target

    -- Equity disaggregation
    female_beneficiaries    INT DEFAULT 0,
    male_beneficiaries      INT DEFAULT 0,
    youth_beneficiaries     INT DEFAULT 0,
    aged_beneficiaries      INT DEFAULT 0,
    pwd_beneficiaries       INT DEFAULT 0,
    regional_beneficiaries  INT DEFAULT 0,
    jobs_created_female     INT DEFAULT 0,
    jobs_created_male       INT DEFAULT 0,
    revenue_generated       NUMERIC(14,2),
    satisfaction            NUMERIC(4,1),

    -- Documents
    report_doc_link      TEXT,
    raw_data_link        TEXT,

    prepared_by          TEXT,
    approved_by          TEXT,
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE 12: ESO_PARTNER
-- ============================================================

CREATE TABLE eso_partner (
    eso_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                 TEXT NOT NULL,
    eso_type             TEXT,                                 -- Incubator, Accelerator, BDS, Funder, Govt
    country              TEXT DEFAULT 'Sierra Leone',
    city                 TEXT,
    focus_sectors        TEXT[],
    trained_by_isl       BOOLEAN DEFAULT FALSE,
    training_date        DATE,
    active_partner       BOOLEAN DEFAULT TRUE,
    funder               TEXT,
    contact_person       TEXT,
    contact_person_id    UUID REFERENCES person(person_id),
    website              TEXT,
    programmes_collab    TEXT[],
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE 13: VIP_CONTACT
-- ============================================================

CREATE TABLE vip_contact (
    contact_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id            UUID NOT NULL REFERENCES person(person_id),
    title                TEXT,
    organisation         TEXT,
    contact_type         vip_type NOT NULL,
    country              TEXT,
    events_attended      INT DEFAULT 0,
    last_engaged         DATE,
    relationship_owner   TEXT,                                 -- ISL staff member managing this relationship
    engagement_notes     TEXT,
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
--  TABLE 14: AUDIT_LOG  (every insert/update tracked)
-- ============================================================

CREATE TABLE audit_log (
    log_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name           TEXT NOT NULL,
    record_id            UUID NOT NULL,
    action               TEXT NOT NULL,                        -- INSERT, UPDATE, DELETE, MERGE, APPROVE, REJECT
    old_values           JSONB,
    new_values           JSONB,
    changed_fields       TEXT[],
    performed_by         TEXT NOT NULL,                        -- staff email or 'system'
    import_batch         TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_table  ON audit_log(table_name);
CREATE INDEX idx_audit_record ON audit_log(record_id);
CREATE INDEX idx_audit_ts     ON audit_log(created_at DESC);

-- ============================================================
--  STAGING TABLE  (holding area before approval)
-- ============================================================

CREATE TABLE staging_import (
    staging_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name          TEXT NOT NULL,
    source_file          TEXT,
    import_batch         TEXT NOT NULL,
    target_table         TEXT NOT NULL,
    raw_data             JSONB NOT NULL,
    mapped_data          JSONB,
    validation_errors    JSONB,
    duplicate_match_id   UUID,
    duplicate_confidence NUMERIC(4,1),
    import_status        import_status DEFAULT 'Staging',
    reviewed_by          TEXT,
    reviewed_at          TIMESTAMPTZ,
    notes                TEXT,
    created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_staging_batch  ON staging_import(import_batch);
CREATE INDEX idx_staging_status ON staging_import(import_status);

-- ============================================================
--  TRIGGERS
-- ============================================================

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_person_updated_at       BEFORE UPDATE ON person        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_org_updated_at          BEFORE UPDATE ON organisation   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_event_updated_at        BEFORE UPDATE ON event          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pitch_updated_at        BEFORE UPDATE ON pitch          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_grant_updated_at        BEFORE UPDATE ON grant_capital  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vip_updated_at          BEFORE UPDATE ON vip_contact    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-compute equity flags when a person row is inserted/updated
CREATE OR REPLACE FUNCTION compute_equity_flags()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_woman  := NEW.gender = 'Female';
  NEW.is_girl   := NEW.gender = 'Female' AND NEW.age_group = 'Girl';
  NEW.is_youth  := NEW.age_group = 'Youth';
  NEW.is_aged   := NEW.age_group = 'Aged';
  IF NEW.date_of_birth IS NOT NULL THEN
    NEW.age_group := CASE
      WHEN EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) < 18  THEN 'Girl'
      WHEN EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) < 36  THEN 'Youth'
      WHEN EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) < 60  THEN 'Adult'
      ELSE 'Aged'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_equity_flags
  BEFORE INSERT OR UPDATE ON person
  FOR EACH ROW EXECUTE FUNCTION compute_equity_flags();

-- Auto-update person.total_events_attended when attendance row added
CREATE OR REPLACE FUNCTION update_person_event_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE person
  SET total_events_attended = (
    SELECT COUNT(*) FROM attendance
    WHERE person_id = NEW.person_id AND attended = TRUE
  ),
  total_programmes = (
    SELECT COUNT(DISTINCT e.event_type) FROM attendance a
    JOIN event e ON a.event_id = e.event_id
    WHERE a.person_id = NEW.person_id AND a.attended = TRUE
  ),
  is_repeat_beneficiary = (
    SELECT COUNT(*) > 1 FROM attendance
    WHERE person_id = NEW.person_id AND attended = TRUE
  )
  WHERE person_id = NEW.person_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attendance_count
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_person_event_count();

-- ============================================================
--  ROW-LEVEL SECURITY (Supabase RLS)
-- ============================================================

ALTER TABLE person          ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation     ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_capital    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log        ENABLE ROW LEVEL SECURITY;

-- Public role: aggregate stats only, no PII
CREATE POLICY "public_no_pii" ON person
  FOR SELECT USING (FALSE);                                   -- block all direct reads

-- Staff role: full read, insert, update (no delete)
CREATE POLICY "staff_read_write" ON person
  FOR ALL USING (auth.role() IN ('staff','management','admin','superadmin'));

-- Superadmin only: audit log access
CREATE POLICY "superadmin_audit" ON audit_log
  FOR SELECT USING (auth.role() = 'superadmin');

-- ============================================================
--  KEY ANALYTICAL VIEWS
-- ============================================================

-- View: first female winner per event type (answers the "historic first" question)
CREATE VIEW v_first_female_winners AS
SELECT
  e.event_type,
  e.programme,
  p.full_name,
  p.location,
  o.name AS business_name,
  o.sector,
  pi.prize_amount,
  pi.prize_type,
  e.date_start AS event_date,
  e.edition_year
FROM pitch pi
JOIN person p ON pi.person_id = p.person_id
JOIN event  e ON pi.event_id  = e.event_id
LEFT JOIN organisation o ON pi.org_id = o.org_id
WHERE pi.winner_flag = TRUE AND p.is_woman = TRUE
ORDER BY e.date_start ASC;

-- View: repeat beneficiaries with full event history
CREATE VIEW v_repeat_beneficiaries AS
SELECT
  p.person_id, p.full_name, p.gender, p.age_group,
  p.total_events_attended, p.total_programmes,
  p.first_engagement_date, p.first_programme,
  p.is_woman, p.is_youth, p.is_outside_freetown,
  ARRAY_AGG(DISTINCT e.programme ORDER BY e.programme) AS programmes_attended,
  ARRAY_AGG(DISTINCT e.edition_year ORDER BY e.edition_year) AS years_active
FROM person p
JOIN attendance a ON p.person_id = a.person_id
JOIN event e ON a.event_id = e.event_id
WHERE a.attended = TRUE
GROUP BY p.person_id, p.full_name, p.gender, p.age_group,
         p.total_events_attended, p.total_programmes,
         p.first_engagement_date, p.first_programme,
         p.is_woman, p.is_youth, p.is_outside_freetown
HAVING COUNT(DISTINCT e.event_id) > 1
ORDER BY COUNT(DISTINCT e.event_id) DESC;

-- View: equity dashboard (used by analytics dashboard live widgets)
CREATE VIEW v_equity_dashboard AS
SELECT
  COUNT(*)                                         AS total_beneficiaries,
  COUNT(*) FILTER (WHERE is_woman = TRUE)          AS female_beneficiaries,
  COUNT(*) FILTER (WHERE is_girl = TRUE)           AS girls_under_18,
  COUNT(*) FILTER (WHERE is_youth = TRUE)          AS youth_beneficiaries,
  COUNT(*) FILTER (WHERE is_aged = TRUE)           AS aged_beneficiaries,
  COUNT(*) FILTER (WHERE is_pwd = TRUE)            AS pwd_beneficiaries,
  COUNT(*) FILTER (WHERE is_outside_freetown=TRUE) AS regional_beneficiaries,
  COUNT(*) FILTER (WHERE is_repeat_beneficiary=TRUE) AS repeat_beneficiaries,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_woman=TRUE) / NULLIF(COUNT(*),0), 1) AS pct_female
FROM person
WHERE record_status = 'Active';

-- View: beneficiary growth by year
CREATE VIEW v_beneficiaries_by_year AS
SELECT
  e.edition_year                                    AS year,
  COUNT(DISTINCT a.person_id)                       AS total,
  COUNT(DISTINCT a.person_id) FILTER
    (WHERE p.is_woman = TRUE)                        AS female,
  COUNT(DISTINCT a.person_id) FILTER
    (WHERE p.is_woman = FALSE OR p.gender = 'Male')  AS male,
  COUNT(DISTINCT a.person_id) FILTER
    (WHERE p.is_youth = TRUE)                        AS youth
FROM attendance a
JOIN event  e ON a.event_id  = e.event_id
JOIN person p ON a.person_id = p.person_id
WHERE a.attended = TRUE
GROUP BY e.edition_year
ORDER BY e.edition_year;

-- View: capital deployed (for grants dashboard)
CREATE VIEW v_capital_summary AS
SELECT
  funder,
  grant_type,
  COUNT(*)                                  AS disbursements,
  SUM(amount_usd)                           AS total_usd,
  COUNT(*) FILTER (WHERE woman_led_business) AS to_women_led,
  SUM(amount_usd) FILTER
    (WHERE woman_led_business = TRUE)        AS usd_to_women
FROM grant_capital
GROUP BY funder, grant_type
ORDER BY total_usd DESC;

-- ============================================================
--  SEED DATA: EVENT TYPES REFERENCE
-- ============================================================

INSERT INTO event (name, event_type, programme, edition_year, city) VALUES
  ('Freetown Pitch Night — Feb 2018',   'FPN',        'Freetown Pitch Night',          2018, 'Freetown'),
  ('Global Entrepreneurship Week 2018', 'GEW',        'Global Entrepreneurship Week',  2018, 'Freetown'),
  ('Dare2Aspire 2018 — Women',          'Dare2Aspire','Dare2Aspire',                   2018, 'Freetown'),
  ('OSVP 2019 — Orange Social Venture', 'OSVP',       'Orange Social Venture Prize',   2019, 'Freetown'),
  ('Dare2Aspire 2019 — Women',          'Dare2Aspire','Dare2Aspire',                   2019, 'Freetown'),
  ('Global Entrepreneurship Week 2019', 'GEW',        'Global Entrepreneurship Week',  2019, 'Freetown'),
  ('OSVP 2020 — Orange Social Venture', 'OSVP',       'Orange Social Venture Prize',   2020, 'Freetown'),
  ('OSVP 2021 — Orange Social Venture', 'OSVP',       'Orange Social Venture Prize',   2021, 'Freetown'),
  ('GEW Dare2Aspire 2022',              'Dare2Aspire','Dare2Aspire',                   2022, 'Freetown'),
  ('FIW 2023 — Freetown Innovation Wk', 'FIW',        'Freetown Innovation Week',      2023, 'Freetown'),
  ('Dare2Aspire 2023 — GEW',            'Dare2Aspire','Dare2Aspire',                   2023, 'Freetown'),
  ('Global Entrepreneurship Week 2024', 'GEW',        'Global Entrepreneurship Week',  2024, 'Freetown'),
  ('OSVP 2024 — Orange Social Venture', 'OSVP',       'Orange Social Venture Prize',   2024, 'Freetown'),
  ('EWC Pitch Competition 2024',        'EWC',        'EWC',                           2024, 'Freetown'),
  ('FIW 2025 — Freetown Innovation Wk', 'FIW',        'Freetown Innovation Week',      2025, 'Freetown'),
  ('Global Entrepreneurship Week 2025', 'GEW',        'Global Entrepreneurship Week',  2025, 'Freetown'),
  ('GEW Pitchers 2025',                 'GEW',        'Global Entrepreneurship Week',  2025, 'Freetown'),
  ('FIW 2026 — Freetown Innovation Wk', 'FIW',        'Freetown Innovation Week',      2026, 'Freetown');

-- ============================================================
--  END OF SCHEMA
--  Next steps:
--  1. Run in Supabase SQL editor
--  2. Enable Supabase Auth + set up JWT roles
--  3. Run Python cleaning worker (see data_pipeline/cleaner.py)
--  4. Deploy Next.js frontend (see /frontend)
--  5. Configure Google Forms webhooks in Supabase Edge Functions
-- ============================================================
