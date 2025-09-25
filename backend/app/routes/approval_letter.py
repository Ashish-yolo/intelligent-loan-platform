"""
Loan Approval Letter API Routes
==============================

API endpoints for generating and downloading loan approval letters.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from io import StringIO
from typing import Dict, Any, List
import json
import logging
import io
from datetime import datetime

from app.services.loan_approval_service import approval_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/test")
async def test_approval_api():
    """Test endpoint to verify approval letter API is working"""
    return {
        "status": "working",
        "message": "Approval letter API is operational",
        "endpoints": [
            "/generate-approval-letter",
            "/download-approval-pdf",
            "/generate-summary-csv"
        ],
        "version": "v1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/generate-approval-letter")
async def generate_approval_letter(application_data: Dict[str, Any]):
    """
    Generate a comprehensive loan approval letter
    
    Args:
        application_data: Complete loan application data from frontend
        
    Returns:
        PDF file as downloadable response
    """
    try:
        logger.info("Starting approval letter generation...")
        
        # Validate required data
        if not application_data:
            raise HTTPException(status_code=400, detail="Application data is required")
        
        # Generate PDF approval letter
        pdf_bytes = approval_service.generate_approval_letter_pdf(application_data)
        
        # Create streaming response for PDF download
        pdf_stream = io.BytesIO(pdf_bytes)
        
        # Generate filename with customer name and timestamp
        customer_name = application_data.get('extractedData', {}).get('pan', {}).get('name', 'Customer')
        customer_name = ''.join(c for c in customer_name if c.isalnum() or c in (' ', '-', '_')).strip()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Loan_Approval_Letter_{customer_name}_{timestamp}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(pdf_bytes))
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating approval letter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate approval letter: {str(e)}")

@router.post("/download-approval-pdf")  
async def download_approval_pdf(application_data: Dict[str, Any]):
    """
    Generate and download approval letter as PDF
    
    Args:
        application_data: Complete loan application data
        
    Returns:
        PDF file download
    """
    try:
        logger.info("Generating PDF approval letter for download...")
        
        # Generate PDF
        pdf_bytes = approval_service.generate_approval_letter_pdf(application_data)
        
        # Create filename
        customer_name = application_data.get('extractedData', {}).get('pan', {}).get('name', 'Customer')
        safe_name = ''.join(c for c in customer_name if c.isalnum() or c in (' ', '-', '_')).strip()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Loan_Approval_{safe_name}_{timestamp}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
        
    except Exception as e:
        logger.error(f"Error downloading approval PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")

@router.post("/generate-summary-csv")
async def generate_summary_csv(application_data: Dict[str, Any]):
    """
    Generate summary CSV with key loan details
    
    Args:
        application_data: Complete loan application data
        
    Returns:
        CSV file download
    """
    try:
        logger.info("Generating summary CSV...")
        
        # Generate CSV content
        csv_content = approval_service.generate_summary_csv(application_data)
        
        # Create filename
        customer_name = application_data.get('extractedData', {}).get('pan', {}).get('name', 'Customer')
        safe_name = ''.join(c for c in customer_name if c.isalnum() or c in (' ', '-', '_')).strip()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"Loan_Summary_{safe_name}_{timestamp}.csv"
        
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
        
    except Exception as e:
        logger.error(f"Error generating summary CSV: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate CSV")

@router.post("/analyze-application")
async def analyze_application(application_data: Dict[str, Any]):
    """
    Analyze loan application and return structured data for review
    
    Args:
        application_data: Raw application data
        
    Returns:
        Structured application analysis
    """
    try:
        logger.info("Analyzing loan application data...")
        
        # Collect and structure application data
        structured_data = approval_service.collect_application_data(application_data)
        
        return {
            "success": True,
            "data": structured_data,
            "analysis": {
                "completeness_score": _calculate_completeness_score(structured_data),
                "missing_fields": _identify_missing_fields(structured_data),
                "data_quality": _assess_data_quality(structured_data)
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing application: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze application")

def _calculate_completeness_score(data: Dict[str, Any]) -> float:
    """Calculate data completeness score"""
    total_fields = 0
    completed_fields = 0
    
    # Check customer info completeness
    customer = data['customer_info']
    customer_fields = ['name', 'pan', 'date_of_birth']
    for field in customer_fields:
        total_fields += 1
        if customer.get(field) and customer[field] != 'NOT_EXTRACTED':
            completed_fields += 1
    
    # Check address completeness
    address = customer['address']
    address_fields = ['line1', 'city', 'state', 'pincode']
    for field in address_fields:
        total_fields += 1
        if address.get(field) and address[field] != 'NOT_EXTRACTED':
            completed_fields += 1
    
    # Check contact completeness
    contact = customer['contact'] 
    contact_fields = ['phone', 'email']
    for field in contact_fields:
        total_fields += 1
        if contact.get(field) and contact[field] != 'NOT_EXTRACTED':
            completed_fields += 1
    
    # Check employment completeness
    employment = customer['employment']
    employment_fields = ['company', 'monthly_income']
    for field in employment_fields:
        total_fields += 1
        if employment.get(field) and employment[field] not in ['NOT_EXTRACTED', 0]:
            completed_fields += 1
    
    return round(completed_fields / total_fields, 2) if total_fields > 0 else 0.0

def _identify_missing_fields(data: Dict[str, Any]) -> List[str]:
    """Identify missing or incomplete fields"""
    missing = []
    
    customer = data['customer_info']
    
    if not customer.get('name') or customer['name'] == 'NOT_EXTRACTED':
        missing.append('Customer Name')
    
    if not customer.get('pan') or customer['pan'] == 'NOT_EXTRACTED':
        missing.append('PAN Number')
    
    if not customer.get('date_of_birth') or customer['date_of_birth'] == 'NOT_EXTRACTED':
        missing.append('Date of Birth')
    
    if not customer['address'].get('line1') or customer['address']['line1'] == 'NOT_EXTRACTED':
        missing.append('Address')
    
    if not customer['contact'].get('phone') or customer['contact']['phone'] == 'NOT_EXTRACTED':
        missing.append('Phone Number')
    
    if not customer['employment'].get('company') or customer['employment']['company'] == 'NOT_EXTRACTED':
        missing.append('Employer Information')
    
    if not customer['employment'].get('monthly_income') or customer['employment']['monthly_income'] == 0:
        missing.append('Income Information')
    
    return missing

def _assess_data_quality(data: Dict[str, Any]) -> Dict[str, Any]:
    """Assess overall data quality"""
    customer = data['customer_info']
    
    quality_score = 0.0
    quality_issues = []
    
    # Check PAN format
    pan = customer.get('pan', '')
    if pan and pan != 'NOT_EXTRACTED':
        if len(pan) == 10 and pan[:5].isalpha() and pan[5:9].isdigit() and pan[9].isalpha():
            quality_score += 0.2
        else:
            quality_issues.append('Invalid PAN format')
    
    # Check phone format
    phone = customer['contact'].get('phone', '')
    if phone and phone != 'NOT_EXTRACTED':
        if len(phone) >= 10:
            quality_score += 0.2
        else:
            quality_issues.append('Invalid phone number')
    
    # Check income reasonableness
    income = customer['employment'].get('monthly_income', 0)
    if income > 0:
        if 10000 <= income <= 1000000:  # Reasonable income range
            quality_score += 0.2
        else:
            quality_issues.append('Income outside reasonable range')
    
    # Check address completeness
    address = customer['address']
    if address.get('pincode') and address['pincode'] != 'NOT_EXTRACTED':
        if len(address['pincode']) == 6 and address['pincode'].isdigit():
            quality_score += 0.2
        else:
            quality_issues.append('Invalid pincode format')
    
    # Check name validity
    name = customer.get('name', '')
    if name and name != 'NOT_EXTRACTED':
        if len(name.split()) >= 2:  # At least first and last name
            quality_score += 0.2
    
    return {
        "quality_score": round(quality_score, 2),
        "quality_issues": quality_issues,
        "overall_rating": "Excellent" if quality_score >= 0.8 else "Good" if quality_score >= 0.6 else "Fair" if quality_score >= 0.4 else "Poor"
    }