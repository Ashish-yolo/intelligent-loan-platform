from typing import Dict, List, Optional, Any
import logging
import random
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class MockBureauService:
    """Mock bureau service providing realistic credit bureau data for testing"""
    
    def __init__(self):
        self.templates = {
            "excellent_profile": self._excellent_profile_template(),
            "good_profile": self._good_profile_template(),
            "fair_profile": self._fair_profile_template(),
            "poor_profile": self._poor_profile_template(),
            "reject_profile": self._reject_profile_template()
        }

    async def get_bureau_data(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate mock bureau data based on application profile"""
        try:
            # Determine profile based on application data
            profile_type = self._determine_profile_type(application_data)
            
            # Get base template
            base_template = self.templates[profile_type].copy()
            
            # Customize based on application
            customized_data = self._customize_bureau_data(base_template, application_data)
            
            return {"success": True, "data": customized_data}
            
        except Exception as e:
            logger.error(f"Error generating bureau data: {e}")
            return {"success": False, "error": str(e)}

    def _determine_profile_type(self, application_data: Dict[str, Any]) -> str:
        """Determine which profile template to use based on application"""
        monthly_income = application_data.get("monthly_income", 0)
        employment_type = application_data.get("employment_type", "")
        employment_years = application_data.get("employment_years", 0)
        age = application_data.get("age", 25)
        
        # Score calculation for profile determination
        score = 0
        
        # Income scoring
        if monthly_income >= 100000:
            score += 25
        elif monthly_income >= 75000:
            score += 20
        elif monthly_income >= 50000:
            score += 15
        elif monthly_income >= 30000:
            score += 10
        else:
            score += 5
        
        # Employment scoring
        employment_scores = {
            "government": 25,
            "private_mnc": 20,
            "private_domestic": 15,
            "self_employed": 10,
            "business": 8
        }
        score += employment_scores.get(employment_type, 5)
        
        # Employment years scoring
        if employment_years >= 5:
            score += 20
        elif employment_years >= 3:
            score += 15
        elif employment_years >= 2:
            score += 10
        else:
            score += 5
        
        # Age scoring
        if 25 <= age <= 45:
            score += 15
        elif 21 <= age <= 60:
            score += 10
        else:
            score += 5
        
        # Add some randomness
        score += random.randint(-10, 10)
        
        # Determine profile
        if score >= 80:
            return "excellent_profile"
        elif score >= 65:
            return "good_profile"
        elif score >= 50:
            return "fair_profile"
        elif score >= 35:
            return "poor_profile"
        else:
            return "reject_profile"

    def _customize_bureau_data(self, base_data: Dict[str, Any], application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Customize bureau data based on application specifics"""
        # Adjust credit score based on income and employment
        monthly_income = application_data.get("monthly_income", 50000)
        employment_type = application_data.get("employment_type", "private_domestic")
        
        # Income-based adjustment
        if monthly_income >= 100000:
            base_data["credit_score"] = min(850, base_data["credit_score"] + random.randint(0, 30))
        elif monthly_income <= 30000:
            base_data["credit_score"] = max(600, base_data["credit_score"] - random.randint(0, 30))
        
        # Employment-based adjustment
        if employment_type == "government":
            base_data["credit_score"] = min(850, base_data["credit_score"] + random.randint(0, 20))
        
        return base_data

    def _excellent_profile_template(self) -> Dict[str, Any]:
        """Template for excellent credit profile"""
        return {
            "credit_score": random.randint(750, 830),
            "accounts": [
                {
                    "account_id": "CC001",
                    "account_type": "credit_card",
                    "bank": "HDFC Bank",
                    "status": "active",
                    "credit_limit": 500000,
                    "current_balance": 45000,
                    "emi_amount": 0,
                    "opening_date": "2020-03-15",
                    "last_payment_date": "2024-09-15",
                    "payment_history": ["0"] * 36  # 36 months of on-time payments
                },
                {
                    "account_id": "HL001",
                    "account_type": "loan",
                    "bank": "SBI",
                    "status": "active",
                    "sanctioned_amount": 3000000,
                    "current_balance": 2100000,
                    "emi_amount": 25000,
                    "opening_date": "2022-01-10",
                    "last_payment_date": "2024-09-10",
                    "payment_history": ["0"] * 30  # 30 months of on-time payments
                },
                {
                    "account_id": "CC002",
                    "account_type": "credit_card",
                    "bank": "ICICI Bank",
                    "status": "active",
                    "credit_limit": 300000,
                    "current_balance": 15000,
                    "emi_amount": 0,
                    "opening_date": "2019-08-20",
                    "last_payment_date": "2024-09-20",
                    "payment_history": ["0"] * 48  # 48 months of on-time payments
                }
            ],
            "enquiries": [
                {"date": "2024-06-15", "type": "credit_card", "bank": "Axis Bank"},
                {"date": "2024-01-10", "type": "personal_loan", "bank": "HDFC Bank"},
                {"date": "2023-09-05", "type": "credit_card", "bank": "ICICI Bank"}
            ],
            "platform_data": {
                "debt_velocity_12m": 0.15,  # 15% increase in debt
                "payment_regularity": 0.98,
                "account_diversity": 0.85,
                "credit_utilization_trend": "stable"
            },
            "employment_verification": {
                "verified": True,
                "employer": "Tech Corp Pvt Ltd",
                "designation": "Senior Software Engineer",
                "monthly_salary": 120000,
                "verification_date": "2024-09-01"
            }
        }

    def _good_profile_template(self) -> Dict[str, Any]:
        """Template for good credit profile"""
        return {
            "credit_score": random.randint(700, 749),
            "accounts": [
                {
                    "account_id": "CC003",
                    "account_type": "credit_card",
                    "bank": "HDFC Bank",
                    "status": "active",
                    "credit_limit": 200000,
                    "current_balance": 60000,
                    "emi_amount": 0,
                    "opening_date": "2021-05-20",
                    "last_payment_date": "2024-09-18",
                    "payment_history": ["0"] * 30 + ["1"] * 2 + ["0"] * 6  # Mostly on-time with 2 delays
                },
                {
                    "account_id": "PL001",
                    "account_type": "loan",
                    "bank": "ICICI Bank",
                    "status": "active",
                    "sanctioned_amount": 800000,
                    "current_balance": 400000,
                    "emi_amount": 18000,
                    "opening_date": "2022-11-01",
                    "last_payment_date": "2024-09-01",
                    "payment_history": ["0"] * 20 + ["1"] * 1 + ["0"] * 3  # One delay
                }
            ],
            "enquiries": [
                {"date": "2024-07-20", "type": "personal_loan", "bank": "SBI"},
                {"date": "2024-03-15", "type": "credit_card", "bank": "Axis Bank"},
                {"date": "2023-12-10", "type": "personal_loan", "bank": "HDFC Bank"},
                {"date": "2023-08-05", "type": "credit_card", "bank": "ICICI Bank"}
            ],
            "platform_data": {
                "debt_velocity_12m": 0.35,  # 35% increase in debt
                "payment_regularity": 0.92,
                "account_diversity": 0.70,
                "credit_utilization_trend": "increasing"
            },
            "employment_verification": {
                "verified": True,
                "employer": "ABC Consulting Ltd",
                "designation": "Consultant",
                "monthly_salary": 75000,
                "verification_date": "2024-08-15"
            }
        }

    def _fair_profile_template(self) -> Dict[str, Any]:
        """Template for fair credit profile"""
        return {
            "credit_score": random.randint(650, 699),
            "accounts": [
                {
                    "account_id": "CC004",
                    "account_type": "credit_card",
                    "bank": "SBI Cards",
                    "status": "active",
                    "credit_limit": 100000,
                    "current_balance": 85000,
                    "emi_amount": 0,
                    "opening_date": "2022-01-15",
                    "last_payment_date": "2024-09-10",
                    "payment_history": ["0"] * 20 + ["1"] * 3 + ["0"] * 8 + ["1"] * 2  # Multiple delays
                },
                {
                    "account_id": "PL002",
                    "account_type": "loan",
                    "bank": "HDFC Bank",
                    "status": "active",
                    "sanctioned_amount": 500000,
                    "current_balance": 350000,
                    "emi_amount": 15000,
                    "opening_date": "2023-03-01",
                    "last_payment_date": "2024-08-25",
                    "payment_history": ["0"] * 15 + ["1"] * 2 + ["0"] * 3  # Recent delays
                }
            ],
            "enquiries": [
                {"date": "2024-08-30", "type": "personal_loan", "bank": "ICICI Bank"},
                {"date": "2024-07-15", "type": "credit_card", "bank": "Axis Bank"},
                {"date": "2024-05-20", "type": "personal_loan", "bank": "SBI"},
                {"date": "2024-02-10", "type": "credit_card", "bank": "HDFC Bank"},
                {"date": "2024-01-05", "type": "personal_loan", "bank": "ICICI Bank"}
            ],
            "platform_data": {
                "debt_velocity_12m": 0.65,  # 65% increase in debt
                "payment_regularity": 0.85,
                "account_diversity": 0.60,
                "credit_utilization_trend": "high"
            },
            "employment_verification": {
                "verified": True,
                "employer": "Local Business Ltd",
                "designation": "Executive",
                "monthly_salary": 50000,
                "verification_date": "2024-08-01"
            }
        }

    def _poor_profile_template(self) -> Dict[str, Any]:
        """Template for poor credit profile"""
        return {
            "credit_score": random.randint(600, 649),
            "accounts": [
                {
                    "account_id": "CC005",
                    "account_type": "credit_card",
                    "bank": "ICICI Bank",
                    "status": "active",
                    "credit_limit": 50000,
                    "current_balance": 48000,
                    "emi_amount": 0,
                    "opening_date": "2023-06-01",
                    "last_payment_date": "2024-08-20",
                    "payment_history": ["0"] * 10 + ["1"] * 4 + ["0"] * 5 + ["1"] * 3  # Many delays
                }
            ],
            "enquiries": [
                {"date": "2024-09-10", "type": "personal_loan", "bank": "SBI"},
                {"date": "2024-08-25", "type": "credit_card", "bank": "Axis Bank"},
                {"date": "2024-07-15", "type": "personal_loan", "bank": "HDFC Bank"},
                {"date": "2024-06-20", "type": "credit_card", "bank": "ICICI Bank"},
                {"date": "2024-05-10", "type": "personal_loan", "bank": "SBI"},
                {"date": "2024-04-05", "type": "credit_card", "bank": "HDFC Bank"}
            ],
            "platform_data": {
                "debt_velocity_12m": 1.2,  # 120% increase in debt - concerning
                "payment_regularity": 0.75,
                "account_diversity": 0.40,
                "credit_utilization_trend": "very_high"
            },
            "employment_verification": {
                "verified": False,
                "employer": "Self Employed",
                "designation": "Business Owner",
                "monthly_salary": 35000,
                "verification_date": None
            }
        }

    def _reject_profile_template(self) -> Dict[str, Any]:
        """Template for reject profile with major red flags"""
        return {
            "credit_score": random.randint(500, 599),
            "accounts": [
                {
                    "account_id": "CC006",
                    "account_type": "credit_card",
                    "bank": "SBI Cards",
                    "status": "default",
                    "credit_limit": 30000,
                    "current_balance": 30000,
                    "emi_amount": 0,
                    "opening_date": "2023-01-15",
                    "last_payment_date": "2024-03-15",
                    "payment_history": ["0"] * 8 + ["1"] * 5 + ["2"] * 6 + ["3"] * 3  # Default pattern
                },
                {
                    "account_id": "PL003",
                    "account_type": "loan",
                    "bank": "Local NBFC",
                    "status": "write_off",
                    "sanctioned_amount": 200000,
                    "current_balance": 180000,
                    "emi_amount": 8000,
                    "opening_date": "2022-08-01",
                    "last_payment_date": "2023-12-01",
                    "payment_history": ["0"] * 12 + ["1"] * 3 + ["2"] * 4 + ["X"] * 6  # Write-off
                }
            ],
            "enquiries": [
                {"date": "2024-09-15", "type": "personal_loan", "bank": "NBFC1"},
                {"date": "2024-09-10", "type": "credit_card", "bank": "New Bank"},
                {"date": "2024-08-30", "type": "personal_loan", "bank": "NBFC2"},
                {"date": "2024-08-20", "type": "credit_card", "bank": "SBI"},
                {"date": "2024-08-15", "type": "personal_loan", "bank": "HDFC Bank"},
                {"date": "2024-08-10", "type": "credit_card", "bank": "ICICI Bank"},
                {"date": "2024-08-05", "type": "personal_loan", "bank": "Axis Bank"}
            ],
            "platform_data": {
                "debt_velocity_12m": 2.5,  # 250% increase - major red flag
                "payment_regularity": 0.45,
                "account_diversity": 0.30,
                "credit_utilization_trend": "maxed_out"
            },
            "employment_verification": {
                "verified": False,
                "employer": "Unemployed",
                "designation": None,
                "monthly_salary": 20000,
                "verification_date": None
            }
        }

    async def get_template_data(self, template_name: str) -> Dict[str, Any]:
        """Get specific template data for testing"""
        if template_name not in self.templates:
            return {"success": False, "error": "Template not found"}
        
        return {"success": True, "data": self.templates[template_name].copy()}

    def get_available_templates(self) -> List[str]:
        """Get list of available templates"""
        return list(self.templates.keys())

# Global instance
mock_bureau_service = MockBureauService()