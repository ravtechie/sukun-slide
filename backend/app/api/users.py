from fastapi import APIRouter, HTTPException, Depends
from app.api.auth import get_current_user
from app.database import get_supabase
from app.schemas.user import UserUpdate, UserResponse

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse(**current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    supabase = get_supabase()
    
    # Update user data
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    
    if update_data:
        response = supabase.table("users").update(update_data).eq("id", current_user["id"]).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to update profile")
        
        return UserResponse(**response.data[0])
    
    return UserResponse(**current_user)

@router.get("/downloads")
async def get_user_downloads(current_user: dict = Depends(get_current_user)):
    """Get user's download history"""
    supabase = get_supabase()
    
    response = supabase.table("downloads")\
        .select("*, documents(*)")\
        .eq("user_id", current_user["id"])\
        .order("downloaded_at", desc=True)\
        .execute()
    
    return {"downloads": response.data}

@router.get("/favorites")
async def get_user_favorites(current_user: dict = Depends(get_current_user)):
    """Get user's favorite documents"""
    supabase = get_supabase()
    
    response = supabase.table("favorites")\
        .select("*, documents(*)")\
        .eq("user_id", current_user["id"])\
        .execute()
    
    return {"favorites": response.data}

@router.post("/favorites/{document_id}")
async def add_to_favorites(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Add document to favorites"""
    supabase = get_supabase()
    
    favorite_data = {
        "user_id": current_user["id"],
        "document_id": document_id
    }
    
    response = supabase.table("favorites").insert(favorite_data).execute()
    
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to add to favorites")
    
    return {"message": "Added to favorites"}

@router.delete("/favorites/{document_id}")
async def remove_from_favorites(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove document from favorites"""
    supabase = get_supabase()
    
    response = supabase.table("favorites")\
        .delete()\
        .eq("user_id", current_user["id"])\
        .eq("document_id", document_id)\
        .execute()
    
    return {"message": "Removed from favorites"}
