from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Optional
import uuid
from datetime import datetime
from app.api.auth import get_current_user
from app.database import get_supabase
from app.core.storage import storage

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

@router.post("/documents/upload")
async def admin_upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    subject: str = Form(...),
    description: str = Form(None),
    author: str = Form(None),
    tags: str = Form(None),
    admin_user: dict = Depends(require_admin)
):
    """Admin document upload - directly approved"""
    supabase = get_supabase()
    
    # Validate file
    is_valid, message, file_ext = storage.validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Validate required fields
    if not title or not subject:
        raise HTTPException(status_code=400, detail="Title and subject are required")
    
    # Check if subject exists
    subject_check = supabase.table("subjects").select("id").eq("id", subject).execute()
    if not subject_check.data:
        raise HTTPException(status_code=400, detail="Invalid subject ID")
    
    try:
        # Generate unique filename
        filename = storage.generate_filename(file.filename, title)
        
        # Save file
        file_path = await storage.save_file(file, filename, supabase)
        
        # Get file size
        file_size = getattr(file, 'size', 0)
        if file_size == 0:
            # Try to get size from content
            content = await file.read()
            file_size = len(content)
            # Reset file pointer for re-reading
            await file.seek(0)
        
        # Prepare document data
        document_data = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "subject_id": subject,
            "format": file_ext,
            "file_path": file_path,
            "file_size": file_size,
            "author": author or "Admin",
            "tags": [tag.strip() for tag in tags.split(',')] if tags else [],
            "status": "approved",  # Admin uploads are auto-approved
            "uploaded_by": admin_user["id"],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Insert document record
        response = supabase.table("documents").insert(document_data).execute()
        
        if not response.data:
            # Clean up uploaded file if database insert failed
            await storage.delete_file(file_path, supabase)
            raise HTTPException(status_code=500, detail="Failed to save document record")
        
        # Log admin activity
        activity_log = {
            "user_id": admin_user["id"],
            "action": f"uploaded_document",
            "details": {
                "document_id": document_data["id"],
                "title": title,
                "subject": subject,
                "file_size": file_size,
                "format": file_ext
            }
        }
        
        try:
            supabase.table("activity_logs").insert(activity_log).execute()
        except Exception as e:
            print(f"Failed to log activity: {e}")
        
        return {
            "message": "Document uploaded successfully",
            "document_id": document_data["id"],
            "file_path": file_path,
            "status": "approved",
            "title": title,
            "subject": subject,
            "format": file_ext,
            "file_size": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.delete("/documents/{document_id}")
async def admin_delete_document(
    document_id: str,
    admin_user: dict = Depends(require_admin)
):
    """Delete a document (admin only)"""
    supabase = get_supabase()
    
    # Get document info first
    doc_response = supabase.table("documents").select("*").eq("id", document_id).execute()
    
    if not doc_response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document = doc_response.data[0]
    
    try:
        # Delete file from storage
        if document.get("file_path"):
            await storage.delete_file(document["file_path"], supabase)
        
        # Delete document record
        delete_response = supabase.table("documents").delete().eq("id", document_id).execute()
        
        if not delete_response.data:
            raise HTTPException(status_code=500, detail="Failed to delete document record")
        
        # Log admin activity
        activity_log = {
            "user_id": admin_user["id"],
            "action": "deleted_document",
            "details": {
                "document_id": document_id,
                "title": document.get("title"),
                "subject": document.get("subject_id")
            }
        }
        
        try:
            supabase.table("activity_logs").insert(activity_log).execute()
        except Exception as e:
            print(f"Failed to log activity: {e}")
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.put("/documents/{document_id}")
async def admin_update_document(
    document_id: str,
    title: str = Form(None),
    subject_id: str = Form(None),
    description: str = Form(None),
    author: str = Form(None),
    tags: str = Form(None),
    status: str = Form(None),
    admin_user: dict = Depends(require_admin)
):
    """Update document metadata (admin only)"""
    supabase = get_supabase()
    
    # Get current document
    doc_response = supabase.table("documents").select("*").eq("id", document_id).execute()
    
    if not doc_response.data:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Prepare update data
    update_data = {"updated_at": datetime.utcnow().isoformat()}
    
    if title:
        update_data["title"] = title
    if subject_id:
        # Validate subject exists
        subject_check = supabase.table("subjects").select("id").eq("id", subject_id).execute()
        if not subject_check.data:
            raise HTTPException(status_code=400, detail="Invalid subject ID")
        update_data["subject_id"] = subject_id
    if description is not None:
        update_data["description"] = description
    if author:
        update_data["author"] = author
    if tags is not None:
        update_data["tags"] = [tag.strip() for tag in tags.split(',')] if tags else []
    if status and status in ["pending", "approved", "rejected"]:
        update_data["status"] = status
    
    try:
        # Update document
        response = supabase.table("documents").update(update_data).eq("id", document_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update document")
        
        # Log admin activity
        activity_log = {
            "user_id": admin_user["id"],
            "action": "updated_document",
            "details": {
                "document_id": document_id,
                "changes": update_data
            }
        }
        
        try:
            supabase.table("activity_logs").insert(activity_log).execute()
        except Exception as e:
            print(f"Failed to log activity: {e}")
        
        return {
            "message": "Document updated successfully",
            "document": response.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")
