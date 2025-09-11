# File Storage Configuration for Sukun Slide
import os
import uuid
import mimetypes
from pathlib import Path
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
import aiofiles
from supabase import Client

# Storage configuration
UPLOAD_DIR = Path("uploads")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

class FileStorage:
    def __init__(self, use_supabase: bool = True):
        self.use_supabase = use_supabase
        self.local_upload_dir = UPLOAD_DIR
        
        # Create upload directory if it doesn't exist
        if not self.use_supabase:
            self.local_upload_dir.mkdir(exist_ok=True)
    
    def validate_file(self, file: UploadFile) -> Tuple[bool, str, str]:
        """Validate file type, size, and security"""
        
        # Check file size
        if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
            return False, f"File size ({file.size} bytes) exceeds maximum allowed size ({MAX_FILE_SIZE} bytes)", ""
        
        # Get file extension
        if not file.filename:
            return False, "No filename provided", ""
        
        file_ext = file.filename.lower().split('.')[-1]
        
        # Check allowed extensions
        if file_ext not in ALLOWED_EXTENSIONS:
            allowed_exts = ', '.join(ALLOWED_EXTENSIONS.keys())
            return False, f"File type '{file_ext}' not allowed. Allowed types: {allowed_exts}", ""
        
        # Verify MIME type
        expected_mime = ALLOWED_EXTENSIONS[file_ext]
        actual_mime = file.content_type
        
        # Some browsers might send different MIME types, so we'll be flexible
        if actual_mime and not self._is_mime_compatible(actual_mime, expected_mime):
            print(f"Warning: MIME type mismatch. Expected: {expected_mime}, Got: {actual_mime}")
        
        return True, "Valid file", file_ext
    
    def _is_mime_compatible(self, actual: str, expected: str) -> bool:
        """Check if MIME types are compatible"""
        # Some common variations
        compatible_types = {
            'application/vnd.ms-powerpoint': [
                'application/vnd.ms-powerpoint',
                'application/powerpoint',
                'application/mspowerpoint'
            ],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/pptx'
            ],
            'application/pdf': ['application/pdf'],
            'application/msword': ['application/msword', 'application/doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/docx'
            ]
        }
        
        return actual in compatible_types.get(expected, [expected])
    
    def generate_filename(self, original_filename: str, title: str) -> str:
        """Generate unique filename"""
        file_ext = original_filename.lower().split('.')[-1]
        
        # Clean title for filename
        clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_title = clean_title.replace(' ', '-').lower()
        
        # Generate unique filename
        unique_id = str(uuid.uuid4())[:8]
        filename = f"{clean_title}-{unique_id}.{file_ext}"
        
        return filename
    
    async def save_file_local(self, file: UploadFile, filename: str) -> str:
        """Save file to local storage"""
        file_path = self.local_upload_dir / filename
        
        try:
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            return str(file_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    async def save_file_supabase(self, file: UploadFile, filename: str, supabase: Client) -> str:
        """Save file to Supabase Storage"""
        try:
            # Read file content
            content = await file.read()
            
            # Upload to Supabase Storage
            bucket_name = "documents"
            
            # Create bucket if it doesn't exist
            try:
                supabase.storage.create_bucket(bucket_name, {"public": False})
            except:
                pass  # Bucket might already exist
            
            # Upload file
            result = supabase.storage.from_(bucket_name).upload(filename, content)
            
            if hasattr(result, 'error') and result.error:
                raise HTTPException(status_code=500, detail=f"Supabase upload failed: {result.error}")
            
            # Get file URL
            file_url = supabase.storage.from_(bucket_name).get_public_url(filename)
            
            return file_url
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload to Supabase: {str(e)}")
    
    async def save_file(self, file: UploadFile, filename: str, supabase: Optional[Client] = None) -> str:
        """Save file using configured storage method"""
        if self.use_supabase and supabase:
            return await self.save_file_supabase(file, filename, supabase)
        else:
            return await self.save_file_local(file, filename)
    
    async def delete_file_local(self, file_path: str) -> bool:
        """Delete file from local storage"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            return True
        except Exception as e:
            print(f"Failed to delete local file {file_path}: {e}")
            return False
    
    async def delete_file_supabase(self, filename: str, supabase: Client) -> bool:
        """Delete file from Supabase Storage"""
        try:
            bucket_name = "documents"
            result = supabase.storage.from_(bucket_name).remove([filename])
            return not (hasattr(result, 'error') and result.error)
        except Exception as e:
            print(f"Failed to delete Supabase file {filename}: {e}")
            return False
    
    async def delete_file(self, file_path: str, supabase: Optional[Client] = None) -> bool:
        """Delete file using configured storage method"""
        if self.use_supabase and supabase:
            # Extract filename from URL
            filename = file_path.split('/')[-1]
            return await self.delete_file_supabase(filename, supabase)
        else:
            return await self.delete_file_local(file_path)

# Global storage instance
storage = FileStorage(use_supabase=True)
