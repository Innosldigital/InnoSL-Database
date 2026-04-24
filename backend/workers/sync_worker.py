"""
Innovation SL Google Drive Sync Worker
Polls the ISL Drive folder for new Google Form responses
and pushes raw rows to the staging_import table.
"""

import io
import logging
import os
from datetime import datetime, timedelta, timezone

import pandas as pd
from dotenv import load_dotenv
from google.auth.exceptions import RefreshError
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from supabase_rest import insert_rows

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("isl.drive_sync")

DRIVE_ROOT = os.environ.get("DRIVE_ROOT_FOLDER_ID", "")


def get_drive_service():
    creds = Credentials(
        token=None,
        refresh_token=os.environ["GOOGLE_REFRESH_TOKEN"],
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        token_uri="https://oauth2.googleapis.com/token",
    )
    return build("drive", "v3", credentials=creds)


def list_new_spreadsheets(drive, since: str) -> list:
    query = (
        f"'{DRIVE_ROOT}' in parents"
        f" and mimeType='application/vnd.google-apps.spreadsheet'"
        f" and modifiedTime > '{since}'"
    )
    result = drive.files().list(
        q=query,
        fields="files(id,name,modifiedTime)",
        orderBy="modifiedTime desc",
    ).execute()
    return result.get("files", [])


def export_sheet_as_csv(drive, file_id: str) -> pd.DataFrame:
    request = drive.files().export_media(fileId=file_id, mimeType="text/csv")
    content = request.execute()
    return pd.read_csv(io.BytesIO(content), dtype=str).fillna("")


def push_to_staging(df: pd.DataFrame, source_name: str, batch_id: str) -> int:
    rows = df.to_dict(orient="records")
    staged = 0
    for row in rows:
        try:
            insert_rows("staging_import", {
                "source_name": source_name,
                "import_batch": batch_id,
                "target_table": "person",
                "raw_data": row,
                "import_status": "Staging",
            })
            staged += 1
        except Exception as exc:
            log.warning("Failed to stage row: %s", exc)
    return staged


def run_sync():
    log.info("Starting Drive sync...")
    try:
        drive = get_drive_service()
    except KeyError as exc:
        log.error("Missing required Google env var: %s", exc)
        return 0

    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    try:
        files = list_new_spreadsheets(drive, since)
    except RefreshError as exc:
        log.error("Google token refresh failed. Reconnect Google credentials in backend/.env: %s", exc)
        return 0
    except Exception as exc:
        log.error("Unable to list Drive spreadsheets: %s", exc)
        return 0
    log.info("Found %s updated spreadsheet(s)", len(files))

    total_staged = 0
    for file_info in files:
        try:
            log.info("Processing: %s (%s)", file_info["name"], file_info["id"])
            dataframe = export_sheet_as_csv(drive, file_info["id"])
            batch_id = f"DRIVE-{file_info['id'][:8]}-{datetime.now().strftime('%Y%m%d%H%M')}"
            staged_count = push_to_staging(dataframe, file_info["name"], batch_id)
            total_staged += staged_count
            log.info("  -> Staged %s rows from %s", staged_count, file_info["name"])
        except Exception as exc:
            log.error("Failed to process %s: %s", file_info["name"], exc)

    log.info("Drive sync complete. Total staged: %s", total_staged)
    return total_staged


if __name__ == "__main__":
    import schedule
    import time

    try:
        run_sync()
    except Exception as exc:
        log.exception("Initial sync run failed: %s", exc)
    schedule.every(6).hours.do(run_sync)
    while True:
        try:
            schedule.run_pending()
        except Exception as exc:
            log.exception("Scheduled sync loop failed: %s", exc)
        time.sleep(300)
