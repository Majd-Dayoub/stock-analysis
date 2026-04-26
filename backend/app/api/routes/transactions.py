from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    rows = user.db.get(
        "transactions",
        {
            "select": "id",
            "id": f"eq.{transaction_id}",
            "user_id": f"eq.{user.id}",
            "limit": "1",
        },
    )
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    user.db.delete("transactions", {"id": f"eq.{transaction_id}", "user_id": f"eq.{user.id}"})
    return None
