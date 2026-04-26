from __future__ import annotations

from dataclasses import dataclass

import requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import SUPABASE_PUBLISH_KEY, SUPABASE_URL
from app.core.supabase import SupabaseRestClient

security = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None
    access_token: str

    @property
    def db(self) -> SupabaseRestClient:
        return SupabaseRestClient(self.access_token)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = credentials.credentials
    response = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_PUBLISH_KEY,
            "Authorization": f"Bearer {token}",
        },
        timeout=15,
    )

    if not response.ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Supabase session",
        )

    user = response.json()
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase session did not include a user id",
        )

    return CurrentUser(
        id=user_id,
        email=user.get("email"),
        access_token=token,
    )
