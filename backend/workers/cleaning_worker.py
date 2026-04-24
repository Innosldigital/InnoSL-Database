"""
Innovation SL Nightly Data Cleaning Worker
Runs as a scheduled job (nightly at 2am WAT) on Railway.
Also callable on-demand via /api/workers/clean endpoint.
"""

import logging
import re
import unicodedata
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import phonenumbers
from dotenv import load_dotenv
from fuzzywuzzy import fuzz
from supabase_rest import select_rows, update_rows

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("isl.cleaner")

FEMALE_NAMES = {
    "fatmata", "mariama", "aminata", "hawa", "isatu", "kadiatu", "fanta", "zainab",
    "ramatu", "bintu", "adama", "sia", "jeneba", "musu", "kumba", "umu", "sallay",
    "francess", "patricia", "agnes", "mary", "victoria", "christiana", "josephine",
    "marian", "georgette", "sylvia", "ernestina", "esther", "rosaline", "edwarda",
    "latifatu", "rashidatu", "saffiatu", "hassanatu", "alliyah", "toluwani", "binta",
    "tairatu", "rahenatu", "nancy", "ajara", "eunice", "gifty", "emmanuella",
}


def normalise_phone(raw: str) -> Optional[str]:
    if not raw:
        return None
    try:
        parsed = phonenumbers.parse(raw, "SL")
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except Exception:
        pass

    digits = re.sub(r"\D", "", raw)
    if digits.startswith("232"):
        digits = digits[3:]
    if digits.startswith("0"):
        digits = digits[1:]
    if len(digits) >= 8:
        return f"+232{digits[-8:]}"
    return raw


def standardise_name(raw: str) -> str:
    if not raw:
        return ""
    name = unicodedata.normalize("NFC", raw.strip())
    name = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", name)
    name = re.sub(r"\s+", " ", name).strip()
    return " ".join(word.capitalize() for word in name.split())


def infer_gender(name: str) -> Optional[str]:
    first = name.split()[0].lower() if name else ""
    if first in FEMALE_NAMES:
        return "Female"
    return None


def classify_age(dob: Optional[str] = None, raw_age: Optional[str] = None) -> str:
    if dob:
        try:
            birth = datetime.strptime(dob[:10], "%Y-%m-%d").date()
            age = (date.today() - birth).days // 365
            if age < 18:
                return "Girl"
            if age < 36:
                return "Youth"
            if age < 60:
                return "Adult"
            return "Aged"
        except Exception:
            pass

    if raw_age:
        lower = raw_age.lower()
        if "below 18" in lower or "under 18" in lower:
            return "Girl"
        nums = [int(item) for item in re.findall(r"\d+", raw_age)]
        if nums:
            minimum = min(nums)
            if minimum < 18:
                return "Girl"
            if minimum < 36:
                return "Youth"
            if minimum < 60:
                return "Adult"
            return "Aged"
    return "Unknown"


def score_completeness(record: Dict[str, Any]) -> int:
    weights = [
        ("full_name", 20), ("gender", 15), ("email_primary", 10),
        ("phone_primary", 10), ("location", 10), ("age_group", 10),
        ("first_programme", 10), ("nationality", 5), ("date_of_birth", 5),
        ("district", 5),
    ]
    score = 0
    for field, weight in weights:
        value = record.get(field)
        if value and value not in ("Unknown", "", None):
            score += weight
    return min(score, 100)


def find_duplicate(
    email: Optional[str],
    phone: Optional[str],
    name: str,
    existing: List[Dict[str, Any]],
) -> Optional[Tuple[str, int, str]]:
    for record in existing:
        if email and record.get("email_primary") and email.lower() == record["email_primary"].lower():
            return (record["person_id"], 99, "Email exact")

        if phone and record.get("phone_primary"):
            first_phone = normalise_phone(phone)
            second_phone = normalise_phone(record["phone_primary"])
            if first_phone and second_phone and first_phone == second_phone:
                return (record["person_id"], 95, "Phone exact")

        ratio = fuzz.token_sort_ratio(name.lower(), record.get("full_name", "").lower())
        if ratio >= 85:
            return (record["person_id"], ratio, "Name fuzzy")
    return None


def process_staging_batch():
    log.info("Starting cleaning run...")

    try:
        staging = select_rows("staging_import", filters={"import_status": "Staging"})
        existing = select_rows("person", select="person_id,full_name,email_primary,phone_primary")
    except Exception as exc:
        log.error("Unable to reach Supabase for cleaning run: %s", exc)
        return {"cleaned": 0, "errors": 1}

    log.info("Found %s staging records", len(staging))

    cleaned_count = 0
    error_count = 0

    for row in staging:
        try:
            raw = row.get("raw_data", {})
            mapped = row.get("mapped_data", raw)

            errors = []
            warnings = []

            name = standardise_name(str(mapped.get("full_name", "")))
            if not name or len(name) < 3:
                errors.append({"field": "full_name", "message": "Name missing or too short", "severity": "error"})

            email = (mapped.get("email_primary") or "").strip().lower()
            if email and not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
                errors.append({"field": "email_primary", "message": f"Invalid email: {email}", "severity": "error"})
                email = None

            phone = normalise_phone(str(mapped.get("phone_primary") or ""))
            if phone and not phone.startswith("+232"):
                warnings.append({"field": "phone_primary", "message": f"Could not normalise to +232: {phone}", "severity": "warning"})

            gender = mapped.get("gender", "")
            gender_map = {
                "female": "Female", "f": "Female", "woman": "Female", "girl": "Female",
                "male": "Male", "m": "Male", "man": "Male",
            }
            gender = gender_map.get(str(gender).lower().strip(), None)
            if not gender and name:
                gender = infer_gender(name)
                if gender:
                    warnings.append({"field": "gender", "message": f"Gender inferred from name: {name}", "severity": "info"})
            if not gender:
                gender = "Unknown"
                warnings.append({"field": "gender", "message": "Gender unknown - review needed", "severity": "warning"})

            age_group = classify_age(mapped.get("date_of_birth"), mapped.get("age_raw"))

            is_woman = gender == "Female"
            is_girl = age_group == "Girl" and is_woman
            is_youth = age_group == "Youth"
            is_aged = age_group == "Aged"

            cleaned_record = {
                "full_name": name,
                "gender": gender,
                "email_primary": email or None,
                "phone_primary": phone or None,
                "location": mapped.get("location", "").strip() or None,
                "district": mapped.get("district", "").strip() or None,
                "nationality": mapped.get("nationality", "Sierra Leonean").strip(),
                "age_group": age_group,
                "is_woman": is_woman,
                "is_girl": is_girl,
                "is_youth": is_youth,
                "is_aged": is_aged,
            }
            score = score_completeness({**cleaned_record, "first_programme": mapped.get("programme")})

            duplicate = find_duplicate(email, phone, name, existing)
            duplicate_id = duplicate[0] if duplicate else None
            duplicate_confidence = duplicate[1] if duplicate else None
            duplicate_type = duplicate[2] if duplicate else None

            status = "Clean" if not errors else "Needs_review"
            if duplicate:
                status = "Needs_review"
                warnings.append({
                    "field": "person_id",
                    "message": f"Possible duplicate ({duplicate_type}, {duplicate_confidence}%): {duplicate_id}",
                    "severity": "warning",
                })

            update_rows(
                "staging_import",
                {
                    "mapped_data": cleaned_record,
                    "validation_errors": errors + warnings,
                    "import_status": status,
                    "duplicate_match_id": duplicate_id,
                    "duplicate_confidence": duplicate_confidence,
                    "notes": f"Completeness score: {score}",
                },
                filters={"staging_id": row["staging_id"]},
            )

            cleaned_count += 1
        except Exception as exc:
            log.error("Error processing staging_id=%s: %s", row.get("staging_id"), exc)
            error_count += 1

    log.info("Cleaning run complete: %s processed, %s errors", cleaned_count, error_count)
    return {"cleaned": cleaned_count, "errors": error_count}


if __name__ == "__main__":
    import schedule
    import time

    try:
        process_staging_batch()
    except Exception as exc:
        log.exception("Initial cleaning run failed: %s", exc)
    schedule.every().day.at("02:00").do(process_staging_batch)
    log.info("Cleaning worker scheduled - running every night at 02:00")
    while True:
        try:
            schedule.run_pending()
        except Exception as exc:
            log.exception("Scheduled cleaning loop failed: %s", exc)
        time.sleep(60)
