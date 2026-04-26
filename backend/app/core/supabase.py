from __future__ import annotations

from typing import Any

import requests
from fastapi import HTTPException, status

from app.core.config import SUPABASE_PUBLISH_KEY, SUPABASE_URL


class SupabaseRestClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = f"{SUPABASE_URL}/rest/v1"

    @property
    def headers(self) -> dict[str, str]:
        return {
            "apikey": SUPABASE_PUBLISH_KEY,
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def get(self, table: str, params: dict[str, str] | None = None) -> Any:
        response = requests.get(
            f"{self.base_url}/{table}",
            headers=self.headers,
            params=params or {},
            timeout=15,
        )
        return self._json_or_error(response)

    def post(self, table: str, payload: dict[str, Any]) -> Any:
        response = requests.post(
            f"{self.base_url}/{table}",
            headers=self.headers,
            json=payload,
            timeout=15,
        )
        return self._json_or_error(response)

    def patch(self, table: str, params: dict[str, str], payload: dict[str, Any]) -> Any:
        response = requests.patch(
            f"{self.base_url}/{table}",
            headers=self.headers,
            params=params,
            json=payload,
            timeout=15,
        )
        return self._json_or_error(response)

    def delete(self, table: str, params: dict[str, str]) -> Any:
        response = requests.delete(
            f"{self.base_url}/{table}",
            headers=self.headers,
            params=params,
            timeout=15,
        )
        return self._json_or_error(response)

    @staticmethod
    def _json_or_error(response: requests.Response) -> Any:
        if response.ok:
            if not response.content:
                return []
            return response.json()

        try:
            detail = response.json()
        except ValueError:
            detail = response.text

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": "Supabase request failed", "supabase_error": detail},
        )
