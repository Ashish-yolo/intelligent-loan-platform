from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from app.routes.auth import get_current_user
from app.services.supabase_service import supabase_service
from app.services.claude_service import claude_service
from app.services.policy_engine import policy_engine
from app.services.mock_bureau_service import mock_bureau_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class UnderwritingRequest(BaseModel):
    application_id: str
    bureau_data_override: Optional[Dict[str, Any]] = None  # For testing with custom bureau data

class UnderwritingResult(BaseModel):
    application_id: str
    decision: str
    approved_amount: Optional[float]
    interest_rate: Optional[float]
    tenure_months: Optional[int]
    policy_result: Dict[str, Any]
    ai_analysis: Dict[str, Any]
    final_decision: Dict[str, Any]

@router.post("/process/{application_id}")
async def process_underwriting(
    application_id: str,
    request: Optional[UnderwritingRequest] = None,
    current_user: dict = Depends(get_current_user)
):
    """Process complete underwriting for an application"""
    try:
        # Get application details
        app_result = await supabase_service.get_loan_application(application_id)
        if not app_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        application = app_result["application"]
        
        # Check if user has access (for admin/underwriter role, skip this check)
        if application["user_id"] != current_user["id"]:
            # In a real system, check for underwriter role here
            pass
        
        # Step 1: Get bureau data (mock or provided)
        if request and request.bureau_data_override:
            bureau_data = request.bureau_data_override
        else:
            bureau_result = await mock_bureau_service.get_bureau_data(application)
            if not bureau_result["success"]:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to fetch bureau data"
                )
            bureau_data = bureau_result["data"]
        
        # Save bureau data
        bureau_save_result = await supabase_service.save_bureau_data({
            "application_id": application_id,
            "data": bureau_data,
            "source": "mock_bureau" if not (request and request.bureau_data_override) else "override"
        })
        
        # Step 2: Run policy engine
        policy_result = await policy_engine.evaluate_application(application, bureau_data)
        
        # Save policy decision
        policy_save_result = await supabase_service.save_policy_decision({
            "application_id": application_id,
            "decision": policy_result.decision,
            "approved_amount": policy_result.approved_amount,
            "interest_rate": policy_result.interest_rate,
            "tenure_months": policy_result.tenure_months,
            "foir": policy_result.foir,
            "risk_scale_factor": policy_result.risk_scale_factor,
            "conditions": policy_result.conditions or [],
            "reasons": policy_result.reasons or [],
            "policy_version": "1.0"
        })
        
        # Step 3: AI risk analysis (only if policy approved or needs review)
        ai_analysis = None
        if policy_result.decision in ["APPROVED", "MANUAL_REVIEW"]:
            ai_result = await claude_service.analyze_application_risk(application, bureau_data)
            if ai_result["success"]:
                ai_analysis = ai_result["analysis"]
        
        # Step 4: Final decision making
        final_decision = None
        final_status = policy_result.decision.lower()
        
        if policy_result.decision == "APPROVED" and ai_analysis:
            # Get AI-powered final decision
            final_result = await claude_service.make_final_underwriting_decision(
                application, bureau_data, policy_result.__dict__, ai_analysis
            )
            if final_result["success"]:
                final_decision = final_result["decision"]
                final_status = final_decision["decision"].lower()
        
        # Step 5: Update application status
        update_data = {
            "status": final_status,
            "underwriting_completed_at": "now()"
        }
        
        if final_decision:
            update_data.update({
                "approved_amount": final_decision.get("final_loan_amount"),
                "approved_interest_rate": final_decision.get("interest_rate"),
                "approved_tenure": final_decision.get("tenure_months")
            })
        elif policy_result.decision == "APPROVED":
            update_data.update({
                "approved_amount": policy_result.approved_amount,
                "approved_interest_rate": policy_result.interest_rate,
                "approved_tenure": policy_result.tenure_months
            })
        
        await supabase_service.update_loan_application(application_id, update_data)
        
        # Step 6: Log audit event
        await supabase_service.log_audit_event({
            "application_id": application_id,
            "event_type": "underwriting_completed",
            "user_id": current_user["id"],
            "details": {
                "policy_decision": policy_result.decision,
                "final_decision": final_decision["decision"] if final_decision else policy_result.decision,
                "ai_analysis_included": ai_analysis is not None
            }
        })
        
        return {
            "success": True,
            "application_id": application_id,
            "decision": final_decision["decision"] if final_decision else policy_result.decision,
            "approved_amount": final_decision.get("final_loan_amount") if final_decision else policy_result.approved_amount,
            "interest_rate": final_decision.get("interest_rate") if final_decision else policy_result.interest_rate,
            "tenure_months": final_decision.get("tenure_months") if final_decision else policy_result.tenure_months,
            "policy_result": {
                "decision": policy_result.decision,
                "foir": policy_result.foir,
                "risk_scale_factor": policy_result.risk_scale_factor,
                "conditions": policy_result.conditions,
                "reasons": policy_result.reasons
            },
            "ai_analysis": ai_analysis,
            "final_decision": final_decision,
            "message": "Underwriting completed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in underwriting process: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Underwriting failed: {str(e)}"
        )

@router.get("/status/{application_id}")
async def get_underwriting_status(
    application_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get underwriting status for an application"""
    try:
        # Get application
        app_result = await supabase_service.get_loan_application(application_id)
        if not app_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        application = app_result["application"]
        
        # Check access
        if application["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return {
            "success": True,
            "application_id": application_id,
            "status": application["status"],
            "approved_amount": application.get("approved_amount"),
            "approved_interest_rate": application.get("approved_interest_rate"),
            "approved_tenure": application.get("approved_tenure"),
            "underwriting_completed_at": application.get("underwriting_completed_at"),
            "message": f"Application status: {application['status']}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting underwriting status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get status"
        )

@router.post("/test-policy")
async def test_policy_engine(
    application_data: Dict[str, Any],
    bureau_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Test policy engine with custom data (for admin/testing)"""
    try:
        # Run policy evaluation
        policy_result = await policy_engine.evaluate_application(application_data, bureau_data)
        
        # Convert to dict for JSON response
        result_dict = {
            "decision": policy_result.decision,
            "approved_amount": policy_result.approved_amount,
            "interest_rate": policy_result.interest_rate,
            "tenure_months": policy_result.tenure_months,
            "conditions": policy_result.conditions,
            "reasons": policy_result.reasons,
            "foir": policy_result.foir,
            "risk_scale_factor": policy_result.risk_scale_factor
        }
        
        return {
            "success": True,
            "policy_result": result_dict,
            "message": "Policy test completed"
        }
        
    except Exception as e:
        logger.error(f"Error in policy test: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Policy test failed: {str(e)}"
        )