import os
import uuid
import shutil
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
}


class StorageService:
    def __init__(self, base_dir: str = settings.UPLOAD_STORAGE_DIR):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def validate_file(self, file: UploadFile) -> None:
        """Validate file MIME type and size."""
        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{file.content_type}'. Allowed formats: PDF, JPG, JPEG, PNG."
            )
        
        # Check size if available
        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_BYTES / (1024*1024):.1f} MB."
            )

    def save_file(self, file: UploadFile, subfolder: str = "") -> Tuple[str, str, int]:
        """
        Save uploaded file securely with UUID filename.
        Returns (original_filename, stored_filename, file_size_bytes)
        """
        self.validate_file(file)
        
        target_dir = os.path.join(self.base_dir, subfolder) if subfolder else self.base_dir
        os.makedirs(target_dir, exist_ok=True)
        
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        stored_filename = f"{uuid.uuid4().hex}{ext}"
        target_path = os.path.join(target_dir, stored_filename)
        
        file.file.seek(0)
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(target_path)
        return file.filename or "file", stored_filename, file_size

    def get_file_path(self, stored_filename: str, subfolder: str = "") -> str:
        """Retrieve full absolute path for a stored file."""
        target_dir = os.path.join(self.base_dir, subfolder) if subfolder else self.base_dir
        full_path = os.path.abspath(os.path.join(target_dir, stored_filename))
        
        # Security check against directory traversal
        if not full_path.startswith(self.base_dir):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to requested file path."
            )
            
        if not os.path.exists(full_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found on storage server."
            )
            
        return full_path


storage_service = StorageService()
