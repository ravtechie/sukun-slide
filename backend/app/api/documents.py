from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
import uuid
from datetime import datetime
from app.api.auth import get_current_user
from app.database import get_supabase
from app.core.storage import storage

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
    title: str = Form(...),
    subject_id: str = Form(...),
    description: str = Form(None),
    author: str = Form(None),
    tags: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload a new document (regular users - goes to pending)"""
    supabase = get_supabase()
    
    # Validate file
    is_valid, message, file_ext = storage.validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Validate required fields
    if not title or not subject_id:
        raise HTTPException(status_code=400, detail="Title and subject are required")
    
    # Check if subject exists
    subject_check = supabase.table("subjects").select("id").eq("id", subject_id).execute()
    if not subject_check.data:
        raise HTTPException(status_code=400, detail="Invalid subject ID")
    
    try:
        # Generate unique filename
        filename = storage.generate_filename(file.filename, title)
        
        # Save file
        file_path = await storage.save_file(file, filename, supabase)
        
        # Prepare document data
        document_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "subject_id": subject_id,
            "format": file_ext,
            "file_path": file_path,
            "file_size": getattr(file, 'size', 0),
            "author": author or f"{current_user.get('first_name', '')} {current_user.get('last_name', '')}".strip(),
            "tags": [tag.strip() for tag in tags.split(',')] if tags else [],
            "status": "pending",  # Regular users upload to pending
            "uploaded_by": current_user["id"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert document record
        response = supabase.table("documents").insert(document_data).execute()
        
        if not response.data:
            # Clean up uploaded file if database insert failed
            await storage.delete_file(file_path, supabase)
            raise HTTPException(status_code=500, detail="Failed to save document record")
        
        return {
            "message": "Document uploaded successfully and pending approval",
            "document_id": document_data["id"],
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

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
