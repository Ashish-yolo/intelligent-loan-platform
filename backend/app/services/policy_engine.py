from typing import Dict, List, Optional, Any, Tuple
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class PolicyResult:
    decision: str  # "APPROVED", "REJECTED", "MANUAL_REVIEW"
    approved_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    conditions: List[str] = None
    reasons: List[str] = None
    foir: Optional[float] = None
    risk_scale_factor: Optional[float] = None

class PolicyEngine:
    """Exact credit policy implementation as per uploaded document"""
    
    # Policy constants as per the document
    MIN_INCOME_THRESHOLD = 25000
    MAX_FOIR = 0.55  # 55%
    MIN_CREDIT_SCORE = 650
    MAX_LOAN_AMOUNT = 2000000  # 20 Lakhs
    MIN_LOAN_AMOUNT = 50000    # 50k
    
    # Risk scale factors
    RISK_SCALE_FACTORS = {
        "EXCELLENT": 0.8,
        "GOOD": 0.9,
        "FAIR": 1.0,
        "POOR": 1.1
    }
    
    # Income prioritization multipliers
    INCOME_PRIORITY_MULTIPLIERS = {
        "salary": 1.0,
        "rental": 0.8,
        "business": 0.7,
        "pension": 0.9,
        "other": 0.6
    }
    
    # Employment type multipliers
    EMPLOYMENT_MULTIPLIERS = {
        "government": 1.0,
        "private_mnc": 0.95,
        "private_domestic": 0.9,
        "self_employed": 0.8,
        "business": 0.75
    }
    
    # Base interest rates by tenure
    BASE_INTEREST_RATES = {
        12: 11.5,   # 1 year
        24: 12.0,   # 2 years
        36: 12.5,   # 3 years
        48: 13.0,   # 4 years
        60: 13.5    # 5 years
    }

    def __init__(self):
        self.hard_reject_rules = [
            self._check_minimum_income,
            self._check_credit_score,
            self._check_age_eligibility,
            self._check_employment_stability,
            self._check_bureau_defaults,
            self._check_debt_velocity
        ]
        
        self.waterfall_checks = [
            self._calculate_foir,
            self._assess_credit_profile,
            self._determine_risk_scale,
            self._calculate_final_amount
        ]

    async def evaluate_application(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> PolicyResult:
        """Main policy evaluation function"""
        try:
            logger.info(f"Starting policy evaluation for application: {application_data.get('id', 'unknown')}")
            
            # Step 1: Hard reject checks
            hard_reject_result = await self._apply_hard_reject_rules(application_data, bureau_data)
            if hard_reject_result:
                return PolicyResult(
                    decision="REJECTED",
                    reasons=hard_reject_result
                )
            
            # Step 2: Waterfall policy evaluation
            waterfall_result = await self._apply_waterfall_policy(application_data, bureau_data)
            
            return waterfall_result
            
        except Exception as e:
            logger.error(f"Error in policy evaluation: {e}")
            return PolicyResult(
                decision="MANUAL_REVIEW",
                reasons=[f"Policy evaluation error: {str(e)}"]
            )

    async def _apply_hard_reject_rules(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Optional[List[str]]:
        """Apply hard reject rules - if any fail, immediate rejection"""
        reject_reasons = []
        
        for rule in self.hard_reject_rules:
            result = await rule(application_data, bureau_data)
            if result:
                reject_reasons.extend(result)
        
        return reject_reasons if reject_reasons else None

    async def _apply_waterfall_policy(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> PolicyResult:
        """Apply waterfall policy for approved applications"""
        try:
            # Calculate FOIR
            foir_result = await self._calculate_foir(application_data, bureau_data)
            if foir_result > self.MAX_FOIR:
                return PolicyResult(
                    decision="REJECTED",
                    foir=foir_result,
                    reasons=[f"FOIR {foir_result:.2%} exceeds maximum allowed {self.MAX_FOIR:.2%}"]
                )
            
            # Assess credit profile
            credit_assessment = await self._assess_credit_profile(application_data, bureau_data)
            
            # Determine risk scale factor
            risk_scale = await self._determine_risk_scale(credit_assessment, application_data)
            
            # Calculate final loan amount and terms
            loan_terms = await self._calculate_loan_terms(
                application_data, bureau_data, foir_result, risk_scale, credit_assessment
            )
            
            return PolicyResult(
                decision="APPROVED",
                approved_amount=loan_terms["amount"],
                interest_rate=loan_terms["interest_rate"],
                tenure_months=loan_terms["tenure"],
                foir=foir_result,
                risk_scale_factor=risk_scale,
                conditions=loan_terms.get("conditions", [])
            )
            
        except Exception as e:
            logger.error(f"Error in waterfall policy: {e}")
            return PolicyResult(
                decision="MANUAL_REVIEW",
                reasons=[f"Waterfall evaluation error: {str(e)}"]
            )

    # Hard reject rule implementations
    async def _check_minimum_income(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Optional[List[str]]:
        """Check minimum income requirement"""
        monthly_income = application_data.get("monthly_income", 0)
        if monthly_income < self.MIN_INCOME_THRESHOLD:
            return [f"Monthly income ₹{monthly_income} is below minimum threshold ₹{self.MIN_INCOME_THRESHOLD}"]
        return None

    async def _check_credit_score(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Optional[List[str]]:
        """Check minimum credit score"""
        credit_score = bureau_data.get("credit_score", 0)
        if credit_score < self.MIN_CREDIT_SCORE:
            return [f"Credit score {credit_score} is below minimum threshold {self.MIN_CREDIT_SCORE}"]
        return None

    async def _check_age_eligibility(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Optional[List[str]]:
        """Check age eligibility (21-65 years)"""
        age = application_data.get("age", 0)
        if age < 21 or age > 65:
            return [f"Age {age} is outside eligible range (21-65 years)"]
        return None

    async def _check_employment_stability(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Optional[List[str]]:
        """Check employment stability requirements"""
        employment_type = application_data.get("employment_type", "")
        employment_years = application_data.get("employment_years", 0)
        
        # Minimum employment requirements
        min_employment = {
            "government": 1,
            "private_mnc": 2,
            "private_domestic": 2,
            "self_employed": 3,
            "business": 3
        }
        
        required_years = min_employment.get(employment_type, 2)
        if employment_years < required_years:
            return [f"Employment duration {employment_years} years is below required {required_years} years for {employment_type}"]
        
        return None

    async def _check_bureau_defaults(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Optional[List[str]]:
        """Check for defaults and write-offs in bureau data"""
        reasons = []
        
        # Check for any defaults in last 24 months
        accounts = bureau_data.get("accounts", [])
        for account in accounts:
            if account.get("status") in ["default", "write_off", "settled"]:
                last_payment_date = account.get("last_payment_date")
                if last_payment_date:
                    # Check if within last 24 months
                    try:
                        payment_date = datetime.strptime(last_payment_date, "%Y-%m-%d")
                        if payment_date > datetime.now() - timedelta(days=730):
                            reasons.append(f"Recent default/write-off found in {account.get('account_type', 'account')}")
                    except:
                        reasons.append(f"Default/write-off found in {account.get('account_type', 'account')}")
        
        # Check enquiry pattern (more than 5 in last 3 months indicates credit hungry behavior)
        enquiries = bureau_data.get("enquiries", [])
        recent_enquiries = [e for e in enquiries if self._is_recent_date(e.get("date"), 90)]
        if len(recent_enquiries) > 5:
            reasons.append(f"Too many credit enquiries ({len(recent_enquiries)}) in last 3 months")
        
        return reasons if reasons else None

    async def _check_debt_velocity(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Optional[List[str]]:
        """Check debt velocity - rapid increase in credit utilization"""
        platform_data = bureau_data.get("platform_data", {})
        debt_velocity = platform_data.get("debt_velocity_12m", 0)
        
        # Reject if debt increased by more than 200% in last 12 months
        if debt_velocity > 2.0:
            return [f"High debt velocity: {debt_velocity:.1%} increase in last 12 months"]
        
        return None

    # Waterfall policy implementations
    async def _calculate_foir(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> float:
        """Calculate Fixed Obligation to Income Ratio"""
        monthly_income = self._calculate_adjusted_income(application_data)
        
        # Calculate total existing EMIs from bureau data
        total_emis = 0
        accounts = bureau_data.get("accounts", [])
        for account in accounts:
            if account.get("status") == "active" and account.get("account_type") in ["loan", "credit_card"]:
                emi = account.get("emi_amount", 0)
                total_emis += emi
        
        # Add proposed loan EMI
        requested_amount = application_data.get("requested_amount", 0)
        proposed_tenure = application_data.get("preferred_tenure", 24)
        estimated_rate = self.BASE_INTEREST_RATES.get(proposed_tenure, 12.0)
        
        # Simple EMI calculation
        monthly_rate = estimated_rate / 100 / 12
        proposed_emi = requested_amount * monthly_rate * (1 + monthly_rate)**proposed_tenure / ((1 + monthly_rate)**proposed_tenure - 1)
        
        total_obligations = total_emis + proposed_emi
        foir = total_obligations / monthly_income if monthly_income > 0 else 1.0
        
        return foir

    def _calculate_adjusted_income(self, application_data: Dict[str, Any]) -> float:
        """Calculate adjusted monthly income based on income types and employment"""
        base_income = application_data.get("monthly_income", 0)
        employment_type = application_data.get("employment_type", "private_domestic")
        
        # Apply employment multiplier
        employment_multiplier = self.EMPLOYMENT_MULTIPLIERS.get(employment_type, 0.9)
        
        # Apply income type adjustments if multiple income sources
        income_sources = application_data.get("income_sources", [])
        if income_sources:
            total_adjusted = 0
            for source in income_sources:
                amount = source.get("amount", 0)
                source_type = source.get("type", "other")
                multiplier = self.INCOME_PRIORITY_MULTIPLIERS.get(source_type, 0.6)
                total_adjusted += amount * multiplier
            return total_adjusted * employment_multiplier
        else:
            return base_income * employment_multiplier

    async def _assess_credit_profile(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assess overall credit profile"""
        credit_score = bureau_data.get("credit_score", 0)
        
        # Determine credit category
        if credit_score >= 750:
            category = "EXCELLENT"
        elif credit_score >= 700:
            category = "GOOD"
        elif credit_score >= 650:
            category = "FAIR"
        else:
            category = "POOR"
        
        # Additional factors
        account_mix = self._assess_account_mix(bureau_data)
        payment_history = self._assess_payment_history(bureau_data)
        credit_utilization = self._calculate_credit_utilization(bureau_data)
        
        return {
            "category": category,
            "credit_score": credit_score,
            "account_mix_score": account_mix,
            "payment_history_score": payment_history,
            "credit_utilization": credit_utilization
        }

    async def _determine_risk_scale(self, credit_assessment: Dict[str, Any], application_data: Dict[str, Any]) -> float:
        """Determine risk scale factor based on credit assessment"""
        base_factor = self.RISK_SCALE_FACTORS[credit_assessment["category"]]
        
        # Adjust based on additional factors
        adjustments = 0
        
        # Credit utilization adjustment
        utilization = credit_assessment.get("credit_utilization", 0)
        if utilization > 0.8:
            adjustments += 0.1
        elif utilization < 0.3:
            adjustments -= 0.05
        
        # Employment type adjustment
        employment = application_data.get("employment_type", "private_domestic")
        if employment == "government":
            adjustments -= 0.05
        elif employment in ["self_employed", "business"]:
            adjustments += 0.05
        
        return max(0.7, min(1.2, base_factor + adjustments))

    async def _calculate_loan_terms(self, application_data: Dict[str, Any], bureau_data: Dict[str, Any], 
                                  foir: float, risk_scale: float, credit_assessment: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate final loan amount, interest rate, and tenure"""
        requested_amount = application_data.get("requested_amount", 0)
        adjusted_income = self._calculate_adjusted_income(application_data)
        preferred_tenure = application_data.get("preferred_tenure", 24)
        
        # Calculate maximum affordable amount based on FOIR
        max_affordable_emi = adjusted_income * self.MAX_FOIR
        
        # Subtract existing EMIs
        existing_emis = sum(account.get("emi_amount", 0) for account in bureau_data.get("accounts", []) 
                          if account.get("status") == "active")
        
        available_emi = max(0, max_affordable_emi - existing_emis)
        
        # Calculate maximum loan amount based on available EMI
        base_rate = self.BASE_INTEREST_RATES.get(preferred_tenure, 12.0)
        adjusted_rate = base_rate * risk_scale
        
        monthly_rate = adjusted_rate / 100 / 12
        max_amount_by_emi = available_emi * ((1 + monthly_rate)**preferred_tenure - 1) / (monthly_rate * (1 + monthly_rate)**preferred_tenure)
        
        # Final approved amount is minimum of requested and calculated maximum
        approved_amount = min(requested_amount, max_amount_by_emi, self.MAX_LOAN_AMOUNT)
        approved_amount = max(approved_amount, self.MIN_LOAN_AMOUNT) if approved_amount >= self.MIN_LOAN_AMOUNT else 0
        
        if approved_amount < self.MIN_LOAN_AMOUNT:
            raise ValueError(f"Calculated loan amount {approved_amount} is below minimum {self.MIN_LOAN_AMOUNT}")
        
        conditions = []
        if approved_amount < requested_amount:
            conditions.append(f"Approved amount reduced from requested ₹{requested_amount:,.0f} to ₹{approved_amount:,.0f} based on affordability")
        
        return {
            "amount": approved_amount,
            "interest_rate": adjusted_rate,
            "tenure": preferred_tenure,
            "conditions": conditions
        }

    # Helper methods
    def _is_recent_date(self, date_str: str, days: int) -> bool:
        """Check if date is within specified number of days"""
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d")
            return date > datetime.now() - timedelta(days=days)
        except:
            return False

    def _assess_account_mix(self, bureau_data: Dict[str, Any]) -> float:
        """Assess account mix diversity (0-1 score)"""
        accounts = bureau_data.get("accounts", [])
        account_types = set(account.get("account_type") for account in accounts)
        
        # Good mix includes both credit cards and loans
        if "credit_card" in account_types and "loan" in account_types:
            return 1.0
        elif len(account_types) > 1:
            return 0.8
        else:
            return 0.6

    def _assess_payment_history(self, bureau_data: Dict[str, Any]) -> float:
        """Assess payment history (0-1 score)"""
        accounts = bureau_data.get("accounts", [])
        if not accounts:
            return 0.5
        
        total_score = 0
        for account in accounts:
            payment_history = account.get("payment_history", [])
            if payment_history:
                on_time_payments = sum(1 for p in payment_history if p == "0")  # "0" indicates on-time
                score = on_time_payments / len(payment_history)
                total_score += score
        
        return total_score / len(accounts) if accounts else 0.5

    def _calculate_credit_utilization(self, bureau_data: Dict[str, Any]) -> float:
        """Calculate overall credit utilization ratio"""
        credit_cards = [acc for acc in bureau_data.get("accounts", []) if acc.get("account_type") == "credit_card"]
        
        if not credit_cards:
            return 0.0
        
        total_limit = sum(card.get("credit_limit", 0) for card in credit_cards)
        total_balance = sum(card.get("current_balance", 0) for card in credit_cards)
        
        return total_balance / total_limit if total_limit > 0 else 0.0

# Global instance
policy_engine = PolicyEngine()