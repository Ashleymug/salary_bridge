"""
Supabase client factory.
Uses the SERVICE ROLE key so the backend can read/write any row
regardless of Row Level Security policies.
"""
from functools import lru_cache
from supabase import create_client, Client
from app.config import get_settings


@lru_cache()
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)
