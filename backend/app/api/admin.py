from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.api.auth import get_current_user
from app.database import get_supabase

router = APIRouter()

def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency to require admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/users")
async def get_all_users(admin_user: dict = Depends(require_admin)):
    """Get all users (admin only)"""
    supabase = get_supabase()
    
    response = supabase.table("users").select("id, email, first_name, last_name, university, role, status, created_at").execute()
    
    return {"users": response.data}

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: str,
    admin_user: dict = Depends(require_admin)
):
    """Update user status (admin only)"""
    if status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    supabase = get_supabase()
    
    response = supabase.table("users").update({"status": status}).eq("id", user_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User status updated to {status}"}

@router.get("/documents/pending")
async def get_pending_documents(admin_user: dict = Depends(require_admin)):
    """Get pending documents for approval"""
    supabase = get_supabase()
    
    response = supabase.table("documents")\
        .select("*, users(first_name, last_name, email)")\
        .eq("status", "pending")\
        .execute()
    
    return {"documents": response.data}

@router.put("/documents/{document_id}/approve")
async def approve_document(
    document_id: str,
    admin_user: dict = Depends(require_admin)
):
    """Approve a pending document"""
    supabase = get_supabase()
    
    response = supabase.table("documents").update({"status": "approved"}).eq("id", document_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document approved"}

@router.put("/documents/{document_id}/reject")
async def reject_document(
    document_id: str,
    admin_user: dict = Depends(require_admin)
):
    """Reject a pending document"""
    supabase = get_supabase()
    
    response = supabase.table("documents").update({"status": "rejected"}).eq("id", document_id).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document rejected"}

@router.get("/analytics/overview")
async def get_analytics_overview(admin_user: dict = Depends(require_admin)):
    """Get analytics overview"""
    supabase = get_supabase()
    
    # Get counts
    users_count = supabase.table("users").select("id", count="exact").execute()
    documents_count = supabase.table("documents").select("id", count="exact").execute()
    downloads_count = supabase.table("downloads").select("id", count="exact").execute()
    
    return {
        "total_users": users_count.count,
        "total_documents": documents_count.count,
        "total_downloads": downloads_count.count
    }

@router.get("/activity-logs")
async def get_activity_logs(admin_user: dict = Depends(require_admin)):
    """Get recent activity logs"""
    supabase = get_supabase()
    
    response = supabase.table("activity_logs")\
        .select("*, users(first_name, last_name)")\
        .order("created_at", desc=True)\
        .limit(50)\
        .execute()
    
    return {"activities": response.data}
