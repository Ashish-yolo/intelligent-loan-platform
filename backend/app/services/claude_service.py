from anthropic import Anthropic
from app.core.config import settings
from typing import Dict, List, Optional, Any
import logging
import json

logger = logging.getLogger(__name__)

class ClaudeService:
    def __init__(self):
        self.client: Optional[Anthropic] = None
    
    async def initialize(self):
        """Initialize Claude client"""
        try:
            self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            logger.info("Claude client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Claude client: {e}")
            raise

    async def analyze_application_risk(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze application risk using Claude AI"""
        try:
            prompt = f"""
            You are an expert credit risk analyst for a loan origination platform. Analyze this loan application and bureau data to provide intelligent insights.

            Application Data:
            {json.dumps(application_data, indent=2)}

            Bureau Data:
            {json.dumps(bureau_data, indent=2)}

            Please provide:
            1. Risk assessment (Low/Medium/High)
            2. Key risk factors
            3. Recommendations
            4. Confidence score (0-100)
            5. Suggested loan amount adjustments if any

            Respond in JSON format:
            {{
                "risk_level": "Low/Medium/High",
                "confidence_score": 85,
                "key_risk_factors": ["factor1", "factor2"],
                "recommendations": ["rec1", "rec2"],
                "suggested_adjustments": {{
                    "loan_amount": 500000,
                    "interest_rate": 12.5,
                    "tenure": 24
                }},
                "analysis_summary": "Brief summary of the analysis"
            }}
            """

            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse Claude's response
            analysis = json.loads(response.content[0].text)
            return {"success": True, "analysis": analysis}

        except Exception as e:
            logger.error(f"Error in Claude risk analysis: {e}")
            return {"success": False, "error": str(e)}

    async def make_final_underwriting_decision(self, 
                                               application_data: Dict[str, Any], 
                                               bureau_data: Dict[str, Any], 
                                               policy_result: Dict[str, Any],
                                               ai_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Make final underwriting decision combining policy and AI insights"""
        try:
            prompt = f"""
            You are the final decision maker for loan underwriting. Based on all available information, make the final decision.

            Policy Engine Result:
            {json.dumps(policy_result, indent=2)}

            AI Risk Analysis:
            {json.dumps(ai_analysis, indent=2)}

            Application Summary:
            - Requested Amount: {application_data.get('requested_amount', 'N/A')}
            - Monthly Income: {application_data.get('monthly_income', 'N/A')}
            - Employment Type: {application_data.get('employment_type', 'N/A')}

            Make the final decision considering:
            1. Policy engine recommendations
            2. AI risk assessment
            3. Overall risk profile
            4. Business objectives

            Respond in JSON format:
            {{
                "decision": "APPROVED/REJECTED/CONDITIONAL",
                "final_loan_amount": 500000,
                "interest_rate": 12.5,
                "tenure_months": 24,
                "conditions": ["condition1", "condition2"],
                "reason": "Detailed explanation of the decision",
                "confidence": 90
            }}
            """

            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}]
            )

            decision = json.loads(response.content[0].text)
            return {"success": True, "decision": decision}

        except Exception as e:
            logger.error(f"Error in final underwriting decision: {e}")
            return {"success": False, "error": str(e)}

    async def analyze_income_documents(self, document_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze income documents using Claude AI"""
        try:
            prompt = f"""
            Analyze these income documents and extract key financial information:

            Documents:
            {json.dumps(document_data, indent=2)}

            Extract and validate:
            1. Monthly income amount
            2. Income stability (consistent/variable)
            3. Employment details
            4. Any red flags or concerns
            5. Confidence in the extracted data

            Respond in JSON format:
            {{
                "extracted_income": 75000,
                "income_stability": "consistent",
                "employment_status": "salaried",
                "red_flags": ["flag1", "flag2"],
                "confidence": 95,
                "verification_needed": false,
                "notes": "Additional observations"
            }}
            """

            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}]
            )

            analysis = json.loads(response.content[0].text)
            return {"success": True, "analysis": analysis}

        except Exception as e:
            logger.error(f"Error in document analysis: {e}")
            return {"success": False, "error": str(e)}

    async def analyze_document(self, image_data: str, prompt: str, media_type: str = "image/jpeg") -> str:
        """Analyze document image using Claude Vision"""
        try:
            # Determine media type from data if not provided
            if image_data.startswith('/9j/') or image_data.startswith('iVBOR'):
                # JPEG or PNG
                if image_data.startswith('/9j/'):
                    media_type = "image/jpeg"
                elif image_data.startswith('iVBOR'):
                    media_type = "image/png"
            
            logger.info(f"Analyzing document with media type: {media_type}")
            
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1500,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_data
                                }
                            },
                            {
                                "type": "text", 
                                "text": prompt
                            }
                        ]
                    }
                ]
            )
            
            result = response.content[0].text
            logger.info(f"Claude response: {result[:200]}...")
            return result

        except Exception as e:
            logger.error(f"Error in document analysis: {e}")
            return json.dumps({
                "error": f"Document analysis failed: {str(e)}",
                "confidence": 0.0,
                "name": "Analysis Failed",
                "document_type": "Unknown"
            })

    async def generate_policy_explanation(self, policy_result: Dict[str, Any], application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate human-readable explanation of policy decision"""
        try:
            prompt = f"""
            Generate a clear, customer-friendly explanation of this loan policy decision:

            Policy Result:
            {json.dumps(policy_result, indent=2)}

            Application Details:
            {json.dumps(application_data, indent=2)}

            Create an explanation that:
            1. Is easy to understand
            2. Explains the reasoning
            3. Provides next steps if applicable
            4. Is professional but empathetic

            Respond in JSON format:
            {{
                "title": "Decision Summary",
                "explanation": "Detailed explanation in simple language",
                "next_steps": ["step1", "step2"],
                "contact_info": "How to reach us for questions"
            }}
            """

            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )

            explanation = json.loads(response.content[0].text)
            return {"success": True, "explanation": explanation}

        except Exception as e:
            logger.error(f"Error generating policy explanation: {e}")
            return {"success": False, "error": str(e)}

# Global instance
claude_service = ClaudeService()