import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

SUPABASE_PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_PUBLISH_KEY = os.getenv("SUPABASE_PUBLISH_KEY", "").strip()
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").strip()

if not SUPABASE_URL or not SUPABASE_PUBLISH_KEY:
    raise ValueError("Missing Supabase Env Variables")
