from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import Optional, Dict, Any
import json
import base64
from datetime import datetime

from app.services.claude_service import claude_service
from app.services.supabase_service import supabase_service

router = APIRouter()

@router.post("/extract-documents")
async def extract_documents(
    pan_file: Optional[UploadFile] = File(None),
    aadhaar_file: Optional[UploadFile] = File(None),
    user_id: str = None
):
    """Extract data from PAN and Aadhaar documents using Anthropic Claude"""
    try:
        extracted_data = {}
        
        # Process PAN card
        if pan_file:
            pan_content = await pan_file.read()
            pan_base64 = base64.b64encode(pan_content).decode()
            
            pan_extraction_prompt = """
            Extract the following information from this PAN card image:
            - Full name (exactly as written)
            - PAN number 
            - Date of birth (if visible)
            - Father's name (if visible)
            
            Return as JSON format:
            {
                "name": "exact name from document",
                "pan": "PAN number",
                "dob": "DD/MM/YYYY or null",
                "father_name": "father's name or null",
                "confidence": 0.95,
                "document_type": "PAN"
            }
            """
            
            pan_result = await claude_service.analyze_document(
                image_data=pan_base64,
                prompt=pan_extraction_prompt
            )
            
            try:
                extracted_data["pan"] = json.loads(pan_result)
            except json.JSONDecodeError:
                # Fallback if Claude doesn't return valid JSON
                extracted_data["pan"] = {
                    "name": "Unable to extract",
                    "pan": "Unable to extract", 
                    "confidence": 0.0,
                    "document_type": "PAN"
                }
        
        # Process Aadhaar card
        if aadhaar_file:
            aadhaar_content = await aadhaar_file.read()
            aadhaar_base64 = base64.b64encode(aadhaar_content).decode()
            
            aadhaar_extraction_prompt = """
            Extract the following information from this Aadhaar card image:
            - Full name (exactly as written)
            - Date of birth
            - Gender
            - Complete address
            - Aadhaar number (last 4 digits only for privacy)
            
            Return as JSON format:
            {
                "name": "exact name from document",
                "dob": "DD/MM/YYYY",
                "gender": "Male/Female",
                "address": "complete address as single string",
                "aadhaar_last4": "last 4 digits only",
                "confidence": 0.92,
                "document_type": "Aadhaar"
            }
            """
            
            aadhaar_result = await claude_service.analyze_document(
                image_data=aadhaar_base64,
                prompt=aadhaar_extraction_prompt
            )
            
            try:
                extracted_data["aadhaar"] = json.loads(aadhaar_result)
            except json.JSONDecodeError:
                # Fallback if Claude doesn't return valid JSON
                extracted_data["aadhaar"] = {
                    "name": "Unable to extract",
                    "dob": "Unable to extract",
                    "confidence": 0.0,
                    "document_type": "Aadhaar"
                }
        
        # Calculate mock bureau score based on extracted data quality
        bureau_score = calculate_mock_bureau_score(extracted_data)
        extracted_data["bureau_score"] = bureau_score
        
        # Store extraction results
        if user_id:
            await store_extraction_results(user_id, extracted_data)
        
        return {
            "success": True,
            "extracted_data": extracted_data,
            "bureau_score": bureau_score,
            "income_collection_method": "input" if bureau_score >= 780 else "upload"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document extraction failed: {str(e)}")

@router.post("/extract-salary-slip")
async def extract_salary_slip(
    salary_file: UploadFile = File(...),
    user_id: str = None
):
    """Extract income data from salary slip using Anthropic Claude"""
    try:
        salary_content = await salary_file.read()
        salary_base64 = base64.b64encode(salary_content).decode()
        
        salary_extraction_prompt = """
        Extract the following salary information from this salary slip/payslip:
        - Employee name
        - Company name
        - Month/Year of salary
        - Gross salary amount
        - Net salary amount (take home)
        - Basic salary component
        - Any allowances
        - Deductions (PF, TDS, etc.)
        
        Return as JSON format:
        {
            "employee_name": "name from slip",
            "company_name": "company name",
            "salary_month": "MM/YYYY",
            "gross_salary": 85000,
            "net_salary": 72000,
            "basic_salary": 45000,
            "allowances": 25000,
            "deductions": 13000,
            "confidence": 0.88,
            "document_type": "Salary Slip",
            "monthly_income": 72000
        }
        """
        
        salary_result = await claude_service.analyze_document(
            image_data=salary_base64,
            prompt=salary_extraction_prompt
        )
        
        try:
            income_data = json.loads(salary_result)
        except json.JSONDecodeError:
            # Fallback
            income_data = {
                "monthly_income": 0,
                "confidence": 0.0,
                "document_type": "Salary Slip",
                "error": "Could not extract salary information"
            }
        
        # Store income data
        if user_id:
            await store_income_data(user_id, income_data, "salary_slip")
        
        return {
            "success": True,
            "income_data": income_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Salary slip extraction failed: {str(e)}")

@router.post("/extract-bank-statement")
async def extract_bank_statement(
    bank_file: UploadFile = File(...),
    user_id: str = None
):
    """Extract income data from bank statement using Anthropic Claude"""
    try:
        bank_content = await bank_file.read()
        bank_base64 = base64.b64encode(bank_content).decode()
        
        bank_extraction_prompt = """
        Analyze this bank statement and extract salary/income information:
        - Look for regular salary credits
        - Identify monthly income pattern
        - Calculate average monthly income from last 3 months
        - Identify the account holder name
        - Find the bank name
        
        Return as JSON format:
        {
            "account_holder": "name from statement",
            "bank_name": "bank name",
            "statement_period": "MM/YYYY to MM/YYYY",
            "salary_credits": [
                {"date": "DD/MM/YYYY", "amount": 75000, "description": "SAL CREDIT"},
                {"date": "DD/MM/YYYY", "amount": 75000, "description": "SAL CREDIT"}
            ],
            "average_monthly_income": 75000,
            "confidence": 0.90,
            "document_type": "Bank Statement",
            "monthly_income": 75000
        }
        """
        
        bank_result = await claude_service.analyze_document(
            image_data=bank_base64,
            prompt=bank_extraction_prompt
        )
        
        try:
            income_data = json.loads(bank_result)
        except json.JSONDecodeError:
            # Fallback
            income_data = {
                "monthly_income": 0,
                "confidence": 0.0,
                "document_type": "Bank Statement",
                "error": "Could not extract income information"
            }
        
        # Store income data
        if user_id:
            await store_income_data(user_id, income_data, "bank_statement")
        
        return {
            "success": True,
            "income_data": income_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bank statement extraction failed: {str(e)}")

def calculate_mock_bureau_score(extracted_data: Dict[str, Any]) -> int:
    """Calculate a mock bureau score based on data extraction quality"""
    base_score = 720
    
    # Boost score based on PAN data quality
    if "pan" in extracted_data:
        pan_confidence = extracted_data["pan"].get("confidence", 0)
        if pan_confidence > 0.9:
            base_score += 60
        elif pan_confidence > 0.8:
            base_score += 40
        elif pan_confidence > 0.6:
            base_score += 20
    
    # Boost score based on Aadhaar data quality
    if "aadhaar" in extracted_data:
        aadhaar_confidence = extracted_data["aadhaar"].get("confidence", 0)
        if aadhaar_confidence > 0.9:
            base_score += 50
        elif aadhaar_confidence > 0.8:
            base_score += 30
        elif aadhaar_confidence > 0.6:
            base_score += 15
    
    # Ensure score is within realistic range
    return min(max(base_score, 650), 850)

async def store_extraction_results(user_id: str, extracted_data: Dict[str, Any]):
    """Store document extraction results in database"""
    try:
        # Store in ai_analysis table
        await supabase_service.client.table("ai_analysis").insert({
            "application_id": None,  # Will be linked later when application is created
            "analysis_type": "document_extraction",
            "input_data": {"user_id": user_id},
            "output_data": extracted_data,
            "model_version": "claude-3",
            "confidence_score": extracted_data.get("pan", {}).get("confidence", 0) * 100,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Error storing extraction results: {e}")

async def store_income_data(user_id: str, income_data: Dict[str, Any], source_type: str):
    """Store income extraction results in database"""
    try:
        await supabase_service.client.table("ai_analysis").insert({
            "application_id": None,
            "analysis_type": f"income_extraction_{source_type}",
            "input_data": {"user_id": user_id, "source": source_type},
            "output_data": income_data,
            "model_version": "claude-3",
            "confidence_score": income_data.get("confidence", 0) * 100,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Error storing income data: {e}")