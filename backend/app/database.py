from supabase import create_client, Client
from app.core.config import settings

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

# Service role client for admin operations
supabase_admin: Client = create_client(settings.supabase_url, settings.supabase_service_key)

def get_supabase() -> Client:
    """Get Supabase client instance"""
    return supabase

def get_supabase_admin() -> Client:
    """Get Supabase admin client instance"""
    return supabase_admin
