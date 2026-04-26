-- ============================================================
--  INNOVATION SL — ANALYTICS VIEWS (Phase 2)
--  Run this ENTIRE file in Supabase SQL Editor
--  Paste all at once → Run
-- ============================================================

-- ── MODULE 1: PITCH PIPELINE ─────────────────────────────────

CREATE OR REPLACE VIEW v_pitch_funnel AS
SELECT
  e.event_id,
  e.isl_ref        AS event_ref,
  e.name           AS event_name,
  e.event_type,
  e.programme,
  e.edition_year   AS year,
  e.theme,
  e.date_start,
  e.funder,
  e.total_registered                                          AS applications_received,
  e.total_attended,
  e.female_count                                              AS attendees_female,
  e.male_count                                                AS attendees_male,
  COUNT(p.pitch_id)                                           AS total_pitched,
  COUNT(p.pitch_id) FILTER (WHERE per.is_woman = TRUE)        AS female_pitched,
  COUNT(p.pitch_id) FILTER (WHERE per.gender = 'Male')        AS male_pitched,
  COUNT(p.pitch_id) FILTER (WHERE p.winner_flag = TRUE)       AS winners,
  COUNT(p.pitch_id) FILTER (WHERE p.finalist_flag = TRUE)     AS finalists,
  COUNT(p.pitch_id) FILTER (WHERE p.first_female_flag = TRUE) AS first_female_wins,
  COUNT(p.pitch_id) FILTER (WHERE p.first_time_flag = TRUE)   AS first_time_pitchers,
  COUNT(p.pitch_id) FILTER (WHERE p.repeat_pitcher_flag = TRUE) AS repeat_pitchers,
  COALESCE(SUM(p.prize_amount), 0)                            AS total_prizes_usd,
  STRING_AGG(DISTINCT p.category, ', ' ORDER BY p.category)  AS categories,
  STRING_AGG(DISTINCT o.sector, ', ')                         AS sectors
FROM event e
LEFT JOIN pitch        p   ON p.event_id  = e.event_id
LEFT JOIN person       per ON p.person_id = per.person_id
LEFT JOIN organisation o   ON p.org_id   = o.org_id
GROUP BY e.event_id, e.isl_ref, e.name, e.event_type, e.programme,
         e.edition_year, e.theme, e.date_start, e.funder,
         e.total_registered, e.total_attended, e.female_count, e.male_count
ORDER BY e.date_start DESC;


CREATE OR REPLACE VIEW v_pitch_winners AS
SELECT
  p.pitch_id,
  e.event_type,
  e.programme,
  e.edition_year                            AS year,
  e.name                                    AS event_name,
  e.date_start,
  per.full_name                             AS winner_name,
  per.gender,
  per.is_woman,
  per.location,
  o.name                                    AS business_name,
  o.sector,
  p.category,
  p.prize_amount,
  p.prize_type,
  p.winner_flag,
  p.finalist_flag,
  p.first_female_flag,
  p.first_time_flag,
  p.repeat_pitcher_flag,
  p.idea_description
FROM pitch p
JOIN event  e   ON p.event_id  = e.event_id
JOIN person per ON p.person_id = per.person_id
LEFT JOIN organisation o ON p.org_id = o.org_id
WHERE p.winner_flag = TRUE OR p.finalist_flag = TRUE
ORDER BY e.date_start ASC;


-- ── MODULE 2: YEAR-ON-YEAR COMPARISON ────────────────────────

CREATE OR REPLACE VIEW v_annual_programme_summary AS
SELECT
  e.edition_year                                              AS year,
  e.event_type,
  e.programme,
  COUNT(DISTINCT e.event_id)                                  AS events_count,
  COALESCE(SUM(e.total_registered), 0)                        AS total_registered,
  COALESCE(SUM(e.total_attended), 0)                          AS total_attended,
  COALESCE(SUM(e.female_count), 0)                            AS female_attended,
  COALESCE(SUM(e.male_count), 0)                              AS male_attended,
  COUNT(DISTINCT p.pitch_id)                                  AS total_pitches,
  COUNT(DISTINCT p.pitch_id) FILTER (WHERE per.is_woman)      AS female_pitches,
  COUNT(DISTINCT p.pitch_id) FILTER (WHERE p.winner_flag)     AS winners,
  COALESCE(SUM(p.prize_amount), 0)                            AS prizes_usd,
  COUNT(DISTINCT a.person_id)                                 AS unique_beneficiaries,
  COUNT(DISTINCT a.person_id) FILTER (WHERE pers.is_woman)    AS unique_female_beneficiaries,
  COUNT(DISTINCT t.training_id)                               AS training_sessions,
  COALESCE(SUM(t.total_attended), 0)                          AS training_participants
FROM event e
LEFT JOIN pitch            p   ON p.event_id  = e.event_id
LEFT JOIN person           per ON p.person_id = per.person_id
LEFT JOIN attendance       a   ON a.event_id  = e.event_id
LEFT JOIN person           pers ON a.person_id = pers.person_id
LEFT JOIN training_session t   ON t.event_id  = e.event_id
GROUP BY e.edition_year, e.event_type, e.programme
ORDER BY e.edition_year DESC, e.event_type;


CREATE OR REPLACE VIEW v_yearly_kpi_trend AS
SELECT
  year,
  SUM(unique_beneficiaries)             AS total_beneficiaries,
  SUM(unique_female_beneficiaries)      AS female_beneficiaries,
  SUM(total_pitches)                    AS pitches,
  SUM(female_pitches)                   AS female_pitches,
  SUM(events_count)                     AS events,
  SUM(prizes_usd)                       AS prizes_usd,
  SUM(training_participants)            AS training_participants,
  ROUND(
    100.0 * SUM(unique_female_beneficiaries)
    / NULLIF(SUM(unique_beneficiaries), 0), 1
  )                                     AS pct_female
FROM v_annual_programme_summary
GROUP BY year
ORDER BY year;


-- ── MODULE 3: BENEFICIARY JOURNEY ────────────────────────────

CREATE OR REPLACE VIEW v_beneficiary_journey AS
SELECT
  per.person_id,
  per.isl_ref,
  per.full_name,
  per.gender,
  per.is_woman,
  per.is_youth,
  per.is_girl,
  per.location,
  per.first_engagement_date,
  per.first_programme,
  per.total_events_attended,
  BOOL_OR(e.event_type IN ('FPN','OSVP','GEW','EWC','FIW','Dare2Aspire'))
                                        AS has_pitched,
  BOOL_OR(t.training_id IS NOT NULL)    AS has_trained,
  BOOL_OR(cm.cohort_id IS NOT NULL)     AS has_incubated,
  BOOL_OR(g.grant_id IS NOT NULL)       AS has_grant,
  BOOL_OR(d.diag_id IS NOT NULL)        AS has_diagnostic,
  COUNT(DISTINCT p.pitch_id)            AS pitch_count,
  COUNT(DISTINCT cm.cohort_id)          AS cohort_count,
  COUNT(DISTINCT g.grant_id)            AS grant_count,
  COALESCE(SUM(g.amount_usd), 0)        AS total_usd_received,
  (
    CASE WHEN BOOL_OR(e.event_type IN ('FPN','OSVP','GEW','EWC','FIW','Dare2Aspire'))
      THEN 1 ELSE 0 END +
    CASE WHEN BOOL_OR(t.training_id IS NOT NULL) THEN 1 ELSE 0 END +
    CASE WHEN BOOL_OR(cm.cohort_id IS NOT NULL)  THEN 1 ELSE 0 END +
    CASE WHEN BOOL_OR(g.grant_id IS NOT NULL)    THEN 1 ELSE 0 END +
    CASE WHEN BOOL_OR(d.diag_id IS NOT NULL)     THEN 1 ELSE 0 END
  )                                     AS journey_score,
  o.name                                AS business_name,
  o.sector,
  o.woman_led
FROM person per
LEFT JOIN attendance       a  ON a.person_id = per.person_id
LEFT JOIN event            e  ON a.event_id  = e.event_id
LEFT JOIN pitch            p  ON p.person_id = per.person_id
LEFT JOIN organisation     o  ON o.founder_person_id = per.person_id
LEFT JOIN cohort_member    cm ON cm.person_id = per.person_id
LEFT JOIN grant_capital    g  ON g.person_id = per.person_id
LEFT JOIN diagnostic       d  ON d.org_id    = o.org_id
LEFT JOIN training_session t  ON t.event_id  = e.event_id
WHERE per.record_status = 'Active'
GROUP BY per.person_id, per.isl_ref, per.full_name, per.gender,
         per.is_woman, per.is_youth, per.is_girl, per.location,
         per.first_engagement_date, per.first_programme,
         per.total_events_attended, o.name, o.sector, o.woman_led
ORDER BY journey_score DESC, per.total_events_attended DESC;


CREATE OR REPLACE VIEW v_full_journey_alumni AS
SELECT * FROM v_beneficiary_journey
WHERE journey_score >= 4
ORDER BY journey_score DESC, total_usd_received DESC;


-- ── MODULE 4: INCUBATION ANALYTICS ───────────────────────────

CREATE OR REPLACE VIEW v_cohort_analytics AS
SELECT
  c.cohort_id,
  c.isl_ref,
  c.programme_name,
  c.funder,
  c.cohort_number,
  c.year,
  c.start_date,
  c.end_date,
  CASE
    WHEN c.start_date IS NOT NULL AND c.end_date IS NOT NULL
    THEN ROUND(EXTRACT(EPOCH FROM (c.end_date - c.start_date)) / 2592000.0, 1)
    ELSE NULL
  END                                   AS duration_months,
  c.sector_focus,
  c.stage_focus,
  c.total_startups,
  c.female_led_count,
  c.youth_led_count,
  c.graduated_count,
  c.jobs_created,
  c.eso_trained_flag,
  ROUND(100.0 * c.graduated_count / NULLIF(c.total_startups, 0), 1)
                                        AS graduation_rate_pct,
  ROUND(100.0 * c.female_led_count / NULLIF(c.total_startups, 0), 1)
                                        AS female_led_pct,
  COALESCE(SUM(g.amount_usd), 0)        AS capital_deployed_usd,
  COALESCE(SUM(g.amount_usd) FILTER (WHERE g.woman_led_business), 0)
                                        AS capital_to_women_usd,
  COUNT(DISTINCT cm.org_id)             AS member_orgs,
  STRING_AGG(DISTINCT org.name, ' · ') AS member_names,
  STRING_AGG(DISTINCT org.sector, ', ') AS member_sectors
FROM cohort c
LEFT JOIN cohort_member  cm  ON cm.cohort_id = c.cohort_id
LEFT JOIN organisation   org ON cm.org_id    = org.org_id
LEFT JOIN grant_capital  g   ON g.org_id     = cm.org_id
GROUP BY c.cohort_id, c.isl_ref, c.programme_name, c.funder,
         c.cohort_number, c.year, c.start_date, c.end_date,
         c.sector_focus, c.stage_focus, c.total_startups,
         c.female_led_count, c.youth_led_count, c.graduated_count,
         c.jobs_created, c.eso_trained_flag
ORDER BY c.start_date DESC;


-- ── MODULE 5: DONOR INTELLIGENCE ─────────────────────────────

CREATE OR REPLACE VIEW v_donor_roi AS
SELECT
  g.funder,
  g.grant_type,
  COUNT(*)                              AS disbursements,
  COALESCE(SUM(g.amount_usd), 0)        AS total_usd_in,
  COALESCE(SUM(g.outcome_jobs), 0)      AS jobs_created,
  COALESCE(SUM(g.outcome_revenue), 0)   AS revenue_generated,
  COUNT(*) FILTER (WHERE g.woman_led_business)
                                        AS women_led_recipients,
  COALESCE(SUM(g.amount_usd) FILTER (WHERE g.woman_led_business), 0)
                                        AS usd_to_women,
  ROUND(100.0 * COUNT(*) FILTER (WHERE g.woman_led_business)
    / NULLIF(COUNT(*), 0), 1)           AS pct_to_women,
  CASE WHEN COALESCE(SUM(g.outcome_jobs),0) > 0
    THEN ROUND(SUM(g.amount_usd) / SUM(g.outcome_jobs), 0)
    ELSE NULL
  END                                   AS cost_per_job_usd,
  MIN(g.disbursement_date)              AS first_disbursement,
  MAX(g.disbursement_date)              AS last_disbursement
FROM grant_capital g
GROUP BY g.funder, g.grant_type
ORDER BY total_usd_in DESC;


CREATE OR REPLACE VIEW v_ecosystem_strength AS
SELECT
  COUNT(*)                              AS total_eso_partners,
  COUNT(*) FILTER (WHERE trained_by_isl)   AS esos_isl_trained,
  COUNT(*) FILTER (WHERE active_partner)   AS active_partnerships,
  COUNT(DISTINCT country)              AS countries_reached,
  COUNT(DISTINCT eso_type)             AS partner_types,
  STRING_AGG(DISTINCT country, ', ' ORDER BY country)    AS countries,
  STRING_AGG(DISTINCT eso_type, ', ' ORDER BY eso_type)  AS partner_type_list
FROM eso_partner;


-- ── MODULE 6: SDG ALIGNMENT ──────────────────────────────────

CREATE OR REPLACE VIEW v_sdg_contributions AS
WITH metrics AS (
  SELECT
    COALESCE(SUM(jobs_created), 0)::TEXT                                          AS jobs_total,
    (SELECT COUNT(*)::TEXT FROM organisation
     WHERE sector ILIKE '%agri%' OR sector ILIKE '%food%')                        AS agri_orgs,
    COALESCE(SUM(total_startups), 0)::TEXT                                        AS startups_total
  FROM cohort
),
people AS (
  SELECT
    COUNT(*)::TEXT                                                                 AS female_total,
    (SELECT COUNT(*)::TEXT FROM person WHERE is_outside_freetown = TRUE
     AND record_status = 'Active')                                                 AS regional_total
  FROM person
  WHERE is_woman = TRUE AND record_status = 'Active'
),
trained AS (
  SELECT COALESCE(SUM(total_attended), 0)::TEXT AS trained_total
  FROM training_session
),
ev AS (
  SELECT COUNT(*)::TEXT AS events_total FROM event
),
eso AS (
  SELECT COUNT(*)::TEXT AS partners_total FROM eso_partner WHERE active_partner = TRUE
)
SELECT 'SDG 1'  AS sdg_code, 'No Poverty'        AS sdg_title, '#E5243B' AS sdg_color,
  m.jobs_total     AS primary_metric,
  'jobs created via supported businesses'                                          AS metric_label,
  'Micro and small businesses supported across all programmes reduce household poverty.' AS evidence_text
FROM metrics m
UNION ALL
SELECT 'SDG 2', 'Zero Hunger', '#DDA63A',
  m.agri_orgs,
  'agri/food businesses supported',
  'AgriFood is the largest sector (37%). Women farmers in Bombali District through Farmerette Salone.'
FROM metrics m
UNION ALL
SELECT 'SDG 4', 'Quality Education', '#4C9F38',
  t.trained_total,
  'people trained across all sessions',
  'Business skills, investment readiness, digital onboarding — 10 confirmed training sessions.'
FROM trained t
UNION ALL
SELECT 'SDG 5', 'Gender Equality', '#FF3A21',
  p.female_total,
  'female beneficiaries',
  'Women-led prize, HarassWatch SL GBV platform finalist, 49% female beneficiary rate overall.'
FROM people p
UNION ALL
SELECT 'SDG 8', 'Decent Work', '#A21942',
  m.startups_total,
  'startups in incubation/acceleration',
  '221 startups supported, 113 direct jobs, $105K+ capital deployed to growing businesses.'
FROM metrics m
UNION ALL
SELECT 'SDG 9', 'Innovation', '#FD6925',
  e.events_total,
  'innovation & entrepreneurship events',
  '29 events 2018-2026, lendability index, digital informal sector platform with 178 vendors.'
FROM ev e
UNION ALL
SELECT 'SDG 10', 'Reduced Inequalities', '#DD1367',
  p.regional_total,
  'beneficiaries outside Freetown',
  'Programmes reaching Bo, Makeni, Bombali districts. Regional expansion a stated objective.'
FROM people p
UNION ALL
SELECT 'SDG 17', 'Partnerships', '#19486A',
  es.partners_total,
  'active ecosystem partners',
  'ILO, ITC, UNDP, Orange, UBA, ABAN, GIZ, KOICA, AfDB, RAIN, British Council, Embassy of Ireland.'
FROM eso es;


-- ── MODULE 7: DATA QUALITY ────────────────────────────────────

CREATE OR REPLACE VIEW v_data_health_summary AS
SELECT
  'person'     AS entity,
  COUNT(*)     AS total,
  COUNT(*) FILTER (WHERE gender = 'Unknown')              AS missing_gender,
  COUNT(*) FILTER (WHERE phone_primary IS NULL)            AS missing_phone,
  COUNT(*) FILTER (WHERE email_primary IS NULL
    OR email_primary LIKE '%placeholder%')                 AS missing_real_email,
  COUNT(*) FILTER (WHERE completeness_score < 60)          AS low_completeness,
  ROUND(AVG(completeness_score), 1)                        AS avg_score
FROM person WHERE record_status = 'Active'
UNION ALL
SELECT 'event', COUNT(*),
  COUNT(*) FILTER (WHERE total_attended = 0 OR total_attended IS NULL),
  COUNT(*) FILTER (WHERE female_count   = 0 OR female_count   IS NULL),
  COUNT(*) FILTER (WHERE venue IS NULL),
  COUNT(*) FILTER (WHERE funder IS NULL), 0
FROM event
UNION ALL
SELECT 'pitch', COUNT(*),
  COUNT(*) FILTER (WHERE winner_flag AND prize_amount IS NULL),
  COUNT(*) FILTER (WHERE idea_description IS NULL OR idea_description = ''),
  COUNT(*) FILTER (WHERE category IS NULL),
  COUNT(*) FILTER (WHERE score IS NULL), 0
FROM pitch
UNION ALL
SELECT 'grant_capital', COUNT(*),
  COUNT(*) FILTER (WHERE outcome_jobs IS NULL),
  COUNT(*) FILTER (WHERE outcome_revenue IS NULL),
  COUNT(*) FILTER (WHERE amount_usd IS NULL OR amount_usd = 0),
  COUNT(*) FILTER (WHERE disbursement_date IS NULL), 0
FROM grant_capital;


-- ── DONOR BRIEFING MASTER VIEW ────────────────────────────────

CREATE OR REPLACE VIEW v_donor_briefing AS
SELECT
  'Innovation Sierra Leone'             AS org_name,
  'Freetown, Sierra Leone'              AS location,
  2017                                  AS founded_year,
  (SELECT COUNT(*) FROM person WHERE record_status = 'Active')
                                        AS total_beneficiaries,
  (SELECT COUNT(*) FROM person WHERE is_woman AND record_status = 'Active')
                                        AS female_beneficiaries,
  (SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE is_woman) / NULLIF(COUNT(*),0), 1)
   FROM person WHERE record_status = 'Active')
                                        AS pct_female,
  (SELECT COUNT(*) FROM event)          AS total_events,
  (SELECT COUNT(DISTINCT edition_year) FROM event)
                                        AS years_active,
  (SELECT COUNT(*) FROM cohort)         AS cohort_programmes,
  (SELECT COALESCE(SUM(total_startups), 0) FROM cohort)
                                        AS startups_supported,
  (SELECT COALESCE(SUM(jobs_created), 0) FROM cohort)
                                        AS jobs_created,
  (SELECT COALESCE(SUM(amount_usd), 0) FROM grant_capital)
                                        AS capital_deployed_usd,
  (SELECT COALESCE(SUM(amount_usd), 0) FROM grant_capital WHERE woman_led_business)
                                        AS capital_to_women_usd,
  (SELECT COUNT(*) FROM eso_partner WHERE active_partner)
                                        AS active_eso_partners,
  (SELECT COUNT(*) FROM training_session)
                                        AS training_sessions,
  (SELECT COALESCE(SUM(total_attended), 0) FROM training_session)
                                        AS people_trained,
  (SELECT COALESCE(SUM(female_count), 0) FROM training_session)
                                        AS women_trained,
  (SELECT MIN(edition_year) FROM event) AS first_year,
  (SELECT MAX(edition_year) FROM event) AS latest_year,
  'SDG 5, SDG 8, SDG 9'                AS primary_sdgs,
  'First female FPN pitcher: Nancy Steven (Feb 2018). First female OSVP finalist: HarassWatch SL (Fatmata Binta Jalloh, 2021). 49% of all beneficiaries are women or girls.'
                                        AS gender_flagship_story;
