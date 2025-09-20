from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import json

from app.routes.auth import get_current_user
from app.services.supabase_service import supabase_service
from app.services.claude_service import claude_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class LoanApplicationCreate(BaseModel):
    requested_amount: float
    purpose: str
    monthly_income: float
    employment_type: str
    employment_years: float
    age: int
    preferred_tenure: int
    income_sources: Optional[List[Dict[str, Any]]] = []
    additional_info: Optional[Dict[str, Any]] = {}

class LoanApplicationUpdate(BaseModel):
    monthly_income: Optional[float] = None
    employment_type: Optional[str] = None
    employment_years: Optional[float] = None
    preferred_tenure: Optional[int] = None
    additional_info: Optional[Dict[str, Any]] = {}

class DocumentUpload(BaseModel):
    document_type: str
    file_name: str
    file_size: int
    metadata: Optional[Dict[str, Any]] = {}

@router.post("/create")
async def create_application(
    application: LoanApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new loan application"""
    try:
        application_data = {
            "user_id": current_user["id"],
            "requested_amount": application.requested_amount,
            "purpose": application.purpose,
            "monthly_income": application.monthly_income,
            "employment_type": application.employment_type,
            "employment_years": application.employment_years,
            "age": application.age,
            "preferred_tenure": application.preferred_tenure,
            "income_sources": application.income_sources,
            "additional_info": application.additional_info,
            "status": "draft"
        }
        
        result = await supabase_service.create_loan_application(application_data)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"]
            )
        
        return {
            "success": True,
            "application": result["application"],
            "message": "Application created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create application"
        )

@router.get("/my-applications")
async def get_user_applications(current_user: dict = Depends(get_current_user)):
    """Get all applications for current user"""
    try:
        # This would need to be implemented in supabase_service
        # For now, return a placeholder
        return {
            "success": True,
            "applications": [],
            "message": "Feature coming soon"
        }
        
    except Exception as e:
        logger.error(f"Error getting user applications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve applications"
        )

@router.get("/{application_id}")
async def get_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific application details"""
    try:
        result = await supabase_service.get_loan_application(application_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        application = result["application"]
        
        # Check if user owns this application
        if application["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return {
            "success": True,
            "application": application
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve application"
        )

@router.put("/{application_id}")
async def update_application(
    application_id: str,
    updates: LoanApplicationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update loan application"""
    try:
        # First, verify the application exists and belongs to user
        app_result = await supabase_service.get_loan_application(application_id)
        if not app_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        if app_result["application"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Check if application can be updated (not in final status)
        current_status = app_result["application"]["status"]
        if current_status in ["approved", "rejected", "disbursed"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot update application in {current_status} status"
            )
        
        # Prepare update data
        update_data = {k: v for k, v in updates.dict(exclude_unset=True).items() if v is not None}
        
        result = await supabase_service.update_loan_application(application_id, update_data)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"]
            )
        
        return {
            "success": True,
            "application": result["application"],
            "message": "Application updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update application"
        )

@router.post("/{application_id}/documents")
async def upload_document(
    application_id: str,
    file: UploadFile = File(...),
    document_type: str = "income_proof",
    current_user: dict = Depends(get_current_user)
):
    """Upload document for loan application"""
    try:
        # Verify application ownership
        app_result = await supabase_service.get_loan_application(application_id)
        if not app_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        if app_result["application"]["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Validate file
        if file.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds 10MB limit"
            )
        
        allowed_types = ["image/jpeg", "image/png", "application/pdf"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only JPEG, PNG, and PDF are allowed"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Save document metadata
        document_data = {
            "application_id": application_id,
            "user_id": current_user["id"],
            "document_type": document_type,
            "file_name": file.filename,
            "file_size": file.size,
            "content_type": file.content_type,
            "status": "uploaded"
        }
        
        doc_result = await supabase_service.save_document(document_data)
        
        if not doc_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save document"
            )
        
        # Analyze document with Claude AI if it's income proof
        analysis_result = None
        if document_type == "income_proof":
            try:
                # Convert file content to document data for analysis
                doc_data = [{
                    "type": document_type,
                    "filename": file.filename,
                    "size": file.size,
                    "content_type": file.content_type
                }]
                
                analysis_result = await claude_service.analyze_income_documents(doc_data)
            except Exception as e:
                logger.warning(f"Document analysis failed: {e}")
        
        return {
            "success": True,
            "document": doc_result["document"],
            "analysis": analysis_result.get("analysis") if analysis_result and analysis_result["success"] else None,
            "message": "Document uploaded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )

@router.post("/{application_id}/submit")
async def submit_application(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Submit application for underwriting"""
    try:
        # Verify application ownership and status
        app_result = await supabase_service.get_loan_application(application_id)
        if not app_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        application = app_result["application"]
        
        if application["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        if application["status"] != "draft":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit application in {application['status']} status"
            )
        
        # Update status to submitted
        update_result = await supabase_service.update_loan_application(
            application_id, 
            {"status": "submitted"}
        )
        
        if not update_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit application"
            )
        
        return {
            "success": True,
            "application": update_result["application"],
            "message": "Application submitted successfully. You will receive updates on your registered phone number."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting application: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit application"
        )