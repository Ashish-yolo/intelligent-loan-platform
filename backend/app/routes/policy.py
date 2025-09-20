from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging

from app.routes.auth import get_current_user
from app.services.policy_engine import policy_engine
from app.services.mock_bureau_service import mock_bureau_service
from app.services.claude_service import claude_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class PolicyTestRequest(BaseModel):
    application_data: Dict[str, Any]
    bureau_data: Optional[Dict[str, Any]] = None
    template_name: Optional[str] = None

class PolicyTestResult(BaseModel):
    success: bool
    policy_result: Optional[Dict[str, Any]] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    explanation: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.post("/test", response_model=PolicyTestResult)
async def test_policy(
    request: PolicyTestRequest,
    current_user: dict = Depends(get_current_user)
):
    """Test policy engine with provided or template data"""
    try:
        application_data = request.application_data
        
        # Get bureau data (from request, template, or generate)
        if request.bureau_data:
            bureau_data = request.bureau_data
        elif request.template_name:
            template_result = await mock_bureau_service.get_template_data(request.template_name)
            if not template_result["success"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid template: {request.template_name}"
                )
            bureau_data = template_result["data"]
        else:
            # Generate bureau data based on application
            bureau_result = await mock_bureau_service.get_bureau_data(application_data)
            if not bureau_result["success"]:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate bureau data"
                )
            bureau_data = bureau_result["data"]
        
        # Run policy evaluation
        policy_result = await policy_engine.evaluate_application(application_data, bureau_data)
        
        # Convert policy result to dict
        policy_dict = {
            "decision": policy_result.decision,
            "approved_amount": policy_result.approved_amount,
            "interest_rate": policy_result.interest_rate,
            "tenure_months": policy_result.tenure_months,
            "conditions": policy_result.conditions,
            "reasons": policy_result.reasons,
            "foir": policy_result.foir,
            "risk_scale_factor": policy_result.risk_scale_factor
        }
        
        # Get AI analysis if approved
        ai_analysis = None
        if policy_result.decision in ["APPROVED", "MANUAL_REVIEW"]:
            try:
                ai_result = await claude_service.analyze_application_risk(application_data, bureau_data)
                if ai_result["success"]:
                    ai_analysis = ai_result["analysis"]
            except Exception as e:
                logger.warning(f"AI analysis failed: {e}")
        
        # Generate explanation
        explanation = None
        try:
            exp_result = await claude_service.generate_policy_explanation(policy_dict, application_data)
            if exp_result["success"]:
                explanation = exp_result["explanation"]
        except Exception as e:
            logger.warning(f"Explanation generation failed: {e}")
        
        return PolicyTestResult(
            success=True,
            policy_result=policy_dict,
            ai_analysis=ai_analysis,
            explanation=explanation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in policy test: {e}")
        return PolicyTestResult(
            success=False,
            error=str(e)
        )

@router.get("/templates")
async def get_bureau_templates(current_user: dict = Depends(get_current_user)):
    """Get list of available bureau data templates"""
    try:
        templates = mock_bureau_service.get_available_templates()
        
        # Get sample data for each template
        template_details = {}
        for template in templates:
            result = await mock_bureau_service.get_template_data(template)
            if result["success"]:
                data = result["data"]
                template_details[template] = {
                    "credit_score": data.get("credit_score"),
                    "account_count": len(data.get("accounts", [])),
                    "enquiry_count": len(data.get("enquiries", [])),
                    "profile_type": template.replace("_", " ").title()
                }
        
        return {
            "success": True,
            "templates": template_details,
            "message": f"Found {len(templates)} templates"
        }
        
    except Exception as e:
        logger.error(f"Error getting templates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get templates"
        )

@router.get("/template/{template_name}")
async def get_template_data(
    template_name: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific template data"""
    try:
        result = await mock_bureau_service.get_template_data(template_name)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template '{template_name}' not found"
            )
        
        return {
            "success": True,
            "template_name": template_name,
            "data": result["data"],
            "message": f"Template '{template_name}' retrieved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get template data"
        )

@router.post("/explain")
async def explain_policy_decision(
    policy_result: Dict[str, Any],
    application_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Generate human-readable explanation of policy decision"""
    try:
        result = await claude_service.generate_policy_explanation(policy_result, application_data)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"]
            )
        
        return {
            "success": True,
            "explanation": result["explanation"],
            "message": "Explanation generated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating explanation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate explanation"
        )

@router.get("/rules")
async def get_policy_rules(current_user: dict = Depends(get_current_user)):
    """Get current policy rules and thresholds"""
    try:
        rules = {
            "hard_reject_rules": {
                "minimum_income": policy_engine.MIN_INCOME_THRESHOLD,
                "minimum_credit_score": policy_engine.MIN_CREDIT_SCORE,
                "age_range": {"min": 21, "max": 65},
                "employment_stability": {
                    "government": 1,
                    "private_mnc": 2,
                    "private_domestic": 2,
                    "self_employed": 3,
                    "business": 3
                }
            },
            "waterfall_policy": {
                "max_foir": policy_engine.MAX_FOIR,
                "loan_amount_range": {
                    "min": policy_engine.MIN_LOAN_AMOUNT,
                    "max": policy_engine.MAX_LOAN_AMOUNT
                },
                "risk_scale_factors": policy_engine.RISK_SCALE_FACTORS,
                "base_interest_rates": policy_engine.BASE_INTEREST_RATES,
                "employment_multipliers": policy_engine.EMPLOYMENT_MULTIPLIERS,
                "income_priority_multipliers": policy_engine.INCOME_PRIORITY_MULTIPLIERS
            }
        }
        
        return {
            "success": True,
            "rules": rules,
            "message": "Policy rules retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"Error getting policy rules: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get policy rules"
        )