from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from app.api.auth import get_current_user
from app.database import get_supabase

router = APIRouter()

@router.get("/")
async def get_documents(
    subject: Optional[str] = None,
    format: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get list of approved documents"""
    supabase = get_supabase()
    
    query = supabase.table("documents").select("*").eq("status", "approved")
    
    if subject:
        query = query.eq("subject_id", subject)
    if format:
        query = query.eq("format", format)
    if search:
        query = query.ilike("title", f"%{search}%")
    
    response = query.execute()
    return {"documents": response.data}

@router.post("/")
async def upload_document(
    file: UploadFile = File(...),
    title: str = None,
    subject_id: str = None,
    description: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Upload a new document"""
    # Basic implementation - file upload would need proper storage handling
    return {
        "message": "Document upload endpoint - implementation needed",
        "filename": file.filename,
        "title": title
    }

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific document details"""
    supabase = get_supabase()
    
    response = supabase.table("documents").select("*").eq("id", document_id).eq("status", "approved").execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"document": response.data[0]}

@router.post("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Record document download and return download URL"""
    supabase = get_supabase()
    
    # Record download
    download_record = {
        "user_id": current_user["id"],
        "document_id": document_id,
        "ip_address": "127.0.0.1",  # Would get real IP in production
        "user_agent": "API Request"
    }
    
    supabase.table("downloads").insert(download_record).execute()
    
    # Increment download count
    supabase.rpc("increment_download_count", {"document_id": document_id}).execute()
    
    return {"message": "Download recorded", "download_url": f"/files/{document_id}"}
