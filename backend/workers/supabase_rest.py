import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests


def _base_url() -> str:
    return os.environ["SUPABASE_URL"].rstrip("/")


def _headers() -> Dict[str, str]:
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


@dataclass
class RestResponse:
    data: Any
    status_code: int


def _session() -> requests.Session:
    session = requests.Session()
    # Local Windows proxy settings in this environment can point to dead ports.
    # Default to bypassing env proxies for direct Supabase REST calls.
    session.trust_env = os.environ.get("SUPABASE_USE_ENV_PROXY", "").lower() in {"1", "true", "yes"}
    return session


def _query_params(
    select: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None,
) -> Dict[str, str]:
    params: Dict[str, str] = {}
    if select:
        params["select"] = select
    for key, value in (filters or {}).items():
        params[key] = f"eq.{value}"
    return params


def select_rows(table: str, select: str = "*", filters: Optional[Dict[str, Any]] = None) -> list[dict]:
    response = _session().get(
        f"{_base_url()}/rest/v1/{table}",
        headers=_headers(),
        params=_query_params(select=select, filters=filters),
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def insert_rows(table: str, payload: dict | list[dict]) -> RestResponse:
    response = _session().post(
        f"{_base_url()}/rest/v1/{table}",
        headers={**_headers(), "Prefer": "return=representation"},
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    return RestResponse(data=response.json(), status_code=response.status_code)


def update_rows(table: str, payload: dict, filters: Dict[str, Any]) -> RestResponse:
    response = _session().patch(
        f"{_base_url()}/rest/v1/{table}",
        headers={**_headers(), "Prefer": "return=representation"},
        params=_query_params(filters=filters),
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    return RestResponse(data=response.json(), status_code=response.status_code)
