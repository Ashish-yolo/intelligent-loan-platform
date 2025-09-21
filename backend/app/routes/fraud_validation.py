from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
import json
import logging
from datetime import datetime

from app.services.claude_service import claude_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/validate-document")
async def validate_document_fraud(
    document_id: str,
    document_type: str,
    extracted_data: Dict[str, Any]
):
    """
    Comprehensive fraud validation for uploaded documents
    Returns fraud risk assessment and recommendations
    """
    try:
        logger.info(f"Starting fraud validation for document {document_id} of type {document_type}")
        
        # Extract fraud analysis from document data
        fraud_analysis = extracted_data.get("fraud_analysis", {})
        
        if not fraud_analysis:
            # Legacy document without fraud analysis
            return {
                "document_id": document_id,
                "fraud_validation": {
                    "status": "no_analysis",
                    "risk_level": "unknown",
                    "recommendation": "manual_review",
                    "message": "Document processed without fraud analysis"
                }
            }
        
        # Comprehensive fraud score calculation
        risk_level = fraud_analysis.get("risk_level", "unknown")
        authenticity_score = fraud_analysis.get("authenticity_score", 0.5)
        fraud_indicators = fraud_analysis.get("fraud_indicators", [])
        confidence_score = fraud_analysis.get("confidence_score", 0.5)
        
        # Calculate overall fraud score (0-100, higher is better)
        fraud_score = int((authenticity_score * confidence_score) * 100)
        
        # Determine validation status
        if risk_level == "critical" or fraud_score < 30:
            validation_status = "rejected"
            recommendation = "reject"
            message = "Document shows critical fraud indicators - application rejected"
        elif risk_level == "high" or fraud_score < 50:
            validation_status = "flagged"
            recommendation = "manual_review"
            message = "Document flagged for manual review due to fraud concerns"
        elif risk_level == "medium" or fraud_score < 70:
            validation_status = "warning"
            recommendation = "proceed_with_caution"
            message = "Document shows minor inconsistencies - proceed with caution"
        else:
            validation_status = "approved"
            recommendation = "proceed"
            message = "Document passed fraud validation checks"
        
        # Store fraud validation results
        fraud_validation_result = {
            "document_id": document_id,
            "document_type": document_type,
            "validation_timestamp": datetime.utcnow().isoformat(),
            "fraud_validation": {
                "status": validation_status,
                "risk_level": risk_level,
                "fraud_score": fraud_score,
                "authenticity_score": authenticity_score,
                "confidence_score": confidence_score,
                "fraud_indicators": fraud_indicators,
                "recommendation": recommendation,
                "message": message,
                "detailed_analysis": fraud_analysis
            }
        }
        
        # Store in database
        try:
            await supabase_service.client.table("fraud_validations").insert({
                "document_id": document_id,
                "document_type": document_type,
                "validation_result": fraud_validation_result,
                "risk_level": risk_level,
                "fraud_score": fraud_score,
                "recommendation": recommendation,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as db_error:
            logger.warning(f"Failed to store fraud validation: {db_error}")
        
        return fraud_validation_result
        
    except Exception as e:
        logger.error(f"Error in fraud validation: {e}")
        raise HTTPException(status_code=500, detail=f"Fraud validation failed: {str(e)}")

@router.post("/cross-validate")
async def cross_validate_documents(application_id: str):
    """
    Cross-validate all documents for consistency
    Check if PAN name matches Aadhaar name
    Verify salary slip employer matches bank statement credits
    """
    try:
        logger.info(f"Starting cross-validation for application {application_id}")
        
        # Retrieve all documents for this application
        app_docs = await supabase_service.client.table("ai_analysis")\
            .select("*")\
            .eq("application_id", application_id)\
            .execute()
        
        if not app_docs.data:
            raise HTTPException(status_code=404, detail="No documents found for application")
        
        # Parse document data
        pan_data = None
        aadhaar_data = None
        salary_data = None
        bank_data = None
        
        for doc in app_docs.data:
            analysis_type = doc.get("analysis_type", "")
            output_data = doc.get("output_data", {})
            
            if "pan" in analysis_type.lower():
                pan_data = output_data.get("pan", {})
            elif "aadhaar" in analysis_type.lower():
                aadhaar_data = output_data.get("aadhaar", {})
            elif "salary" in analysis_type.lower():
                salary_data = output_data
            elif "bank" in analysis_type.lower():
                bank_data = output_data
        
        # Cross-validation checks
        validation_results = {
            "application_id": application_id,
            "cross_validation_timestamp": datetime.utcnow().isoformat(),
            "checks": [],
            "overall_status": "passed",
            "risk_factors": [],
            "recommendation": "proceed"
        }
        
        # Check 1: PAN vs Aadhaar name consistency
        if pan_data and aadhaar_data:
            pan_name = pan_data.get("name", "").upper().strip()
            aadhaar_name = aadhaar_data.get("name", "").upper().strip()
            
            if pan_name and aadhaar_name:
                # Basic name matching (allowing for minor variations)
                name_match_score = calculate_name_similarity(pan_name, aadhaar_name)
                name_check = {
                    "check_type": "name_consistency",
                    "status": "passed" if name_match_score > 0.8 else "failed",
                    "details": f"PAN: {pan_name}, Aadhaar: {aadhaar_name}",
                    "similarity_score": name_match_score
                }
                validation_results["checks"].append(name_check)
                
                if name_match_score <= 0.8:
                    validation_results["overall_status"] = "flagged"
                    validation_results["risk_factors"].append("Name mismatch between PAN and Aadhaar")
        
        # Check 2: DOB consistency across documents
        dob_sources = []
        if pan_data and pan_data.get("dob"):
            dob_sources.append(("PAN", pan_data["dob"]))
        if aadhaar_data and aadhaar_data.get("dob"):
            dob_sources.append(("Aadhaar", aadhaar_data["dob"]))
        
        if len(dob_sources) > 1:
            unique_dobs = set([dob for _, dob in dob_sources])
            dob_check = {
                "check_type": "dob_consistency",
                "status": "passed" if len(unique_dobs) == 1 else "failed",
                "details": f"DOB sources: {dict(dob_sources)}"
            }
            validation_results["checks"].append(dob_check)
            
            if len(unique_dobs) > 1:
                validation_results["overall_status"] = "flagged"
                validation_results["risk_factors"].append("Date of birth mismatch across documents")
        
        # Check 3: Salary slip vs bank statement consistency
        if salary_data and bank_data:
            salary_amount = salary_data.get("monthly_income") or salary_data.get("net_salary")
            bank_salary = bank_data.get("average_monthly_income") or bank_data.get("monthly_income")
            
            if salary_amount and bank_salary:
                income_variance = abs(salary_amount - bank_salary) / max(salary_amount, bank_salary)
                income_check = {
                    "check_type": "income_consistency",
                    "status": "passed" if income_variance < 0.2 else "review_required",
                    "details": f"Salary slip: ₹{salary_amount}, Bank: ₹{bank_salary}",
                    "variance_percentage": round(income_variance * 100, 2)
                }
                validation_results["checks"].append(income_check)
                
                if income_variance >= 0.2:
                    validation_results["overall_status"] = "review_required"
                    validation_results["risk_factors"].append("Significant income variance between documents")
        
        # Determine final recommendation
        if validation_results["overall_status"] == "flagged":
            validation_results["recommendation"] = "manual_review"
        elif validation_results["overall_status"] == "review_required":
            validation_results["recommendation"] = "detailed_review"
        else:
            validation_results["recommendation"] = "proceed"
        
        # Store cross-validation results
        try:
            await supabase_service.client.table("cross_validations").insert({
                "application_id": application_id,
                "validation_result": validation_results,
                "overall_status": validation_results["overall_status"],
                "recommendation": validation_results["recommendation"],
                "created_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as db_error:
            logger.warning(f"Failed to store cross-validation: {db_error}")
        
        return validation_results
        
    except Exception as e:
        logger.error(f"Error in cross-validation: {e}")
        raise HTTPException(status_code=500, detail=f"Cross-validation failed: {str(e)}")

@router.get("/fraud-statistics")
async def get_fraud_statistics():
    """
    Get fraud detection statistics and trends
    """
    try:
        # Get fraud validation stats from database
        fraud_stats = await supabase_service.client.table("fraud_validations")\
            .select("risk_level, recommendation, fraud_score, created_at")\
            .execute()
        
        if not fraud_stats.data:
            return {
                "total_validations": 0,
                "risk_distribution": {},
                "average_fraud_score": 0,
                "recommendations": {}
            }
        
        validations = fraud_stats.data
        total_validations = len(validations)
        
        # Calculate risk distribution
        risk_distribution = {}
        recommendations = {}
        fraud_scores = []
        
        for validation in validations:
            risk_level = validation.get("risk_level", "unknown")
            recommendation = validation.get("recommendation", "unknown")
            score = validation.get("fraud_score", 0)
            
            risk_distribution[risk_level] = risk_distribution.get(risk_level, 0) + 1
            recommendations[recommendation] = recommendations.get(recommendation, 0) + 1
            
            if score:
                fraud_scores.append(score)
        
        average_fraud_score = sum(fraud_scores) / len(fraud_scores) if fraud_scores else 0
        
        return {
            "total_validations": total_validations,
            "risk_distribution": risk_distribution,
            "average_fraud_score": round(average_fraud_score, 2),
            "recommendations": recommendations,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting fraud statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get fraud statistics: {str(e)}")

def calculate_name_similarity(name1: str, name2: str) -> float:
    """
    Calculate similarity between two names (simple implementation)
    Returns value between 0 and 1 (1 = exact match)
    """
    if not name1 or not name2:
        return 0.0
    
    # Remove common prefixes/suffixes and normalize
    def normalize_name(name):
        name = name.upper().strip()
        # Remove common prefixes
        prefixes = ["MR.", "MRS.", "MS.", "DR.", "PROF."]
        for prefix in prefixes:
            if name.startswith(prefix):
                name = name[len(prefix):].strip()
        return name
    
    norm_name1 = normalize_name(name1)
    norm_name2 = normalize_name(name2)
    
    # Exact match
    if norm_name1 == norm_name2:
        return 1.0
    
    # Split into words and check overlap
    words1 = set(norm_name1.split())
    words2 = set(norm_name2.split())
    
    if not words1 or not words2:
        return 0.0
    
    # Calculate Jaccard similarity
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0