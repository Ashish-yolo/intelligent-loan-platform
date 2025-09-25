"""
Loan Approval Letter Generation Service
=====================================

This service analyzes the complete loan application journey and generates
comprehensive loan approval letters in PDF format.

Author: Claude Code
Version: 1.0.0
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path
# import jinja2  # Not needed for current implementation
from reportlab.lib.pagesizes import A4, letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
import base64
import io

logger = logging.getLogger(__name__)

class LoanApprovalLetterService:
    """Service for generating comprehensive loan approval letters"""
    
    def __init__(self):
        self.company_name = "Intelligent Loan Platform"
        self.company_address = "123 Financial District, Mumbai, Maharashtra 400001"
        self.company_phone = "+91 1800-XXX-XXXX"
        self.company_email = "support@intelligentloan.com"
        self.company_website = "www.intelligentloan.com"
        self.license_number = "NBFC-MFI-12345/2024"
        
    def collect_application_data(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Collect and structure all loan application data from various sources
        
        Args:
            application_data: Raw application data from frontend
            
        Returns:
            Structured data for approval letter generation
        """
        try:
            # Extract customer information
            customer_info = self._extract_customer_info(application_data)
            
            # Extract loan details
            loan_details = self._extract_loan_details(application_data)
            
            # Generate approval timeline
            approval_timeline = self._generate_approval_timeline()
            
            # Calculate final terms
            final_terms = self._calculate_final_terms(loan_details)
            
            # Generate reference numbers
            references = self._generate_reference_numbers()
            
            # Compile complete data structure
            complete_data = {
                "application_date": datetime.now().strftime("%d %B %Y"),
                "approval_date": datetime.now().strftime("%d %B %Y"),
                "letter_date": datetime.now().strftime("%d %B %Y"),
                "customer_info": customer_info,
                "loan_details": loan_details,
                "final_terms": final_terms,
                "approval_timeline": approval_timeline,
                "references": references,
                "conditions": self._get_loan_conditions(),
                "next_steps": self._get_next_steps(),
                "company_info": self._get_company_info()
            }
            
            logger.info(f"Application data collected successfully for customer: {customer_info.get('name', 'Unknown')}")
            return complete_data
            
        except Exception as e:
            logger.error(f"Error collecting application data: {str(e)}")
            raise
    
    def _format_full_address(self, verification_data: Dict[str, Any], aadhaar_data: Dict[str, Any]) -> str:
        """Format complete address from verification and Aadhaar data"""
        
        # Try to get address from verification data first
        addr = verification_data.get('address', {})
        
        # Build address components
        address_parts = []
        
        # Address lines
        if addr.get('line1') and addr['line1'] != 'NOT_EXTRACTED':
            address_parts.append(addr['line1'])
        elif aadhaar_data.get('address') and aadhaar_data['address'] != 'NOT_EXTRACTED':
            address_parts.append(aadhaar_data['address'])
        
        if addr.get('line2') and addr['line2'] != 'NOT_EXTRACTED':
            address_parts.append(addr['line2'])
        
        # City, State, Pincode
        location_parts = []
        if addr.get('city') and addr['city'] != 'NOT_EXTRACTED':
            location_parts.append(addr['city'])
        if addr.get('state') and addr['state'] != 'NOT_EXTRACTED':
            location_parts.append(addr['state'])
        if addr.get('pincode') and addr['pincode'] != 'NOT_EXTRACTED':
            location_parts.append(f"- {addr['pincode']}")
        
        if location_parts:
            address_parts.append(", ".join(location_parts))
        
        # Return formatted address or fallback
        if address_parts:
            return ", ".join(address_parts)
        else:
            return "NOT_EXTRACTED"
    
    def _extract_customer_info(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract customer information from application data"""
        
        # Get PAN data
        pan_data = data.get('extractedData', {}).get('pan', {})
        
        # Get Aadhaar data
        aadhaar_data = data.get('extractedData', {}).get('aadhaar', {})
        
        # Get verification data
        verification_data = data.get('verificationData', {})
        
        return {
            "name": pan_data.get('name', verification_data.get('name', 'NOT_EXTRACTED')),
            "pan": pan_data.get('pan', 'NOT_EXTRACTED'),
            "date_of_birth": pan_data.get('dob', 'NOT_EXTRACTED'),
            "father_name": pan_data.get('father_name', 'NOT_EXTRACTED'),
            "address": {
                "full_address": self._format_full_address(verification_data, aadhaar_data),
                "city": verification_data.get('address', {}).get('city', 'NOT_EXTRACTED'),
                "state": verification_data.get('address', {}).get('state', 'NOT_EXTRACTED'),
                "pincode": verification_data.get('address', {}).get('pincode', 'NOT_EXTRACTED')
            },
            "contact": {
                "phone": verification_data.get('phone', 'NOT_EXTRACTED'),
                "email": verification_data.get('email', 'NOT_EXTRACTED')
            },
            "employment": {
                "company": data.get('salaryData', {}).get('company', 'NOT_EXTRACTED'),
                "designation": data.get('salaryData', {}).get('designation', 'NOT_EXTRACTED'),
                "monthly_income": data.get('salaryData', {}).get('net_salary', 0),
                "experience": data.get('salaryData', {}).get('experience', 'NOT_EXTRACTED')
            }
        }
    
    def _extract_loan_details(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract loan details from application data"""
        
        loan_requirements = data.get('loanRequirements', {})
        selected_offer = data.get('finalLoanTerms', {}).get('selectedOffer', {})
        
        return {
            "requested_amount": loan_requirements.get('amount', 0),
            "approved_amount": selected_offer.get('loanAmount', loan_requirements.get('amount', 0)),
            "tenure": loan_requirements.get('tenure', 0),
            "purpose": loan_requirements.get('purpose', 'Personal Use'),
            "bank_name": selected_offer.get('bankName', 'HDFC Bank'),
            "application_channel": "Online Platform"
        }
    
    def _calculate_final_terms(self, loan_details: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate final loan terms"""
        
        amount = loan_details.get('approved_amount', 0)
        tenure = loan_details.get('tenure', 12)
        interest_rate = 10.5  # Default rate
        
        # Calculate EMI
        monthly_rate = interest_rate / 100 / 12
        emi = (amount * monthly_rate * (1 + monthly_rate)**tenure) / ((1 + monthly_rate)**tenure - 1)
        
        processing_fee = amount * 0.015  # 1.5% processing fee
        total_amount = emi * tenure
        total_interest = total_amount - amount
        
        return {
            "approved_amount": amount,
            "interest_rate": interest_rate,
            "interest_type": "Reducing Balance",
            "tenure": tenure,
            "monthly_emi": round(emi, 2),
            "processing_fee": round(processing_fee, 2),
            "total_amount": round(total_amount, 2),
            "total_interest": round(total_interest, 2),
            "first_emi_date": (datetime.now() + timedelta(days=30)).strftime("%d %B %Y"),
            "maturity_date": (datetime.now() + timedelta(days=30*tenure)).strftime("%d %B %Y")
        }
    
    def _generate_approval_timeline(self) -> List[Dict[str, str]]:
        """Generate approval process timeline"""
        
        base_date = datetime.now()
        
        return [
            {
                "step": "Application Received",
                "date": base_date.strftime("%d %B %Y"),
                "status": "Completed",
                "description": "Online application submitted with all required documents"
            },
            {
                "step": "Document Verification",
                "date": base_date.strftime("%d %B %Y"),
                "status": "Completed", 
                "description": "PAN, Aadhaar, Income documents verified using AI technology"
            },
            {
                "step": "Credit Assessment",
                "date": base_date.strftime("%d %B %Y"),
                "status": "Completed",
                "description": "Bank statements analyzed and income verification completed"
            },
            {
                "step": "Risk Analysis",
                "date": base_date.strftime("%d %B %Y"),
                "status": "Completed",
                "description": "Fraud detection and risk scoring completed"
            },
            {
                "step": "Final Approval",
                "date": base_date.strftime("%d %B %Y"),
                "status": "Completed",
                "description": "Loan approved by automated decisioning system"
            },
            {
                "step": "Documentation",
                "date": base_date.strftime("%d %B %Y"),
                "status": "In Progress",
                "description": "Loan agreement and approval letter generation"
            },
            {
                "step": "Fund Disbursement",
                "date": (base_date + timedelta(days=1)).strftime("%d %B %Y"),
                "status": "Scheduled",
                "description": "Funds to be transferred to customer account"
            }
        ]
    
    def _generate_reference_numbers(self) -> Dict[str, str]:
        """Generate various reference numbers"""
        
        timestamp = int(datetime.now().timestamp())
        
        return {
            "application_number": f"ILP{timestamp % 1000000}",
            "approval_reference": f"APR{timestamp % 1000000}",
            "loan_account_number": f"LA{timestamp % 10000000}",
            "processing_officer": "AI-AUTO-001",
            "approval_authority": "AUTO-APPROVAL-SYSTEM"
        }
    
    def _get_loan_conditions(self) -> List[str]:
        """Get standard loan conditions"""
        
        return [
            "This approval is valid for 30 days from the date of this letter",
            "Loan disbursement is subject to verification of all submitted documents",
            "First EMI will be auto-debited 30 days from disbursement date",
            "Processing fee will be deducted from loan amount at disbursement",
            "Customer must maintain minimum balance as per bank requirements",
            "Any change in employment or income must be immediately reported",
            "Loan is subject to the terms and conditions of the loan agreement",
            "Interest rate is subject to change as per bank policy",
            "Prepayment charges may apply as per loan agreement terms",
            "Customer has the right to receive loan statements regularly"
        ]
    
    def _get_next_steps(self) -> List[Dict[str, str]]:
        """Get next steps for customer"""
        
        return [
            {
                "step": "Sign Loan Agreement",
                "description": "Review and digitally sign the loan agreement document",
                "timeline": "Within 7 days"
            },
            {
                "step": "Account Setup",
                "description": "Provide bank account details for EMI auto-debit setup",
                "timeline": "Before disbursement"
            },
            {
                "step": "Insurance (Optional)",
                "description": "Consider loan protection insurance for additional security",
                "timeline": "Before disbursement"
            },
            {
                "step": "Fund Disbursement",
                "description": "Loan amount will be transferred to your account",
                "timeline": "Within 24 hours of agreement signing"
            }
        ]
    
    def _get_company_info(self) -> Dict[str, str]:
        """Get company information"""
        
        return {
            "name": self.company_name,
            "address": self.company_address,
            "phone": self.company_phone,
            "email": self.company_email,
            "website": self.company_website,
            "license": self.license_number
        }
    
    def generate_approval_letter_pdf(self, application_data: Dict[str, Any]) -> bytes:
        """
        Generate a professional PDF approval letter
        
        Args:
            application_data: Complete application data
            
        Returns:
            PDF content as bytes
        """
        try:
            # Collect and structure data
            data = self.collect_application_data(application_data)
            
            # Create PDF buffer
            buffer = io.BytesIO()
            
            # Create PDF document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=18
            )
            
            # Build content
            content = []
            
            # Header
            content.extend(self._build_header())
            content.append(Spacer(1, 12))
            
            # Customer details
            content.extend(self._build_customer_section(data))
            content.append(Spacer(1, 12))
            
            # Approval message
            content.extend(self._build_approval_message(data))
            content.append(Spacer(1, 12))
            
            # Loan terms table
            content.extend(self._build_loan_terms_table(data))
            content.append(Spacer(1, 12))
            
            # Timeline
            content.extend(self._build_timeline_section(data))
            content.append(Spacer(1, 12))
            
            # Conditions
            content.extend(self._build_conditions_section(data))
            content.append(Spacer(1, 12))
            
            # Next steps
            content.extend(self._build_next_steps_section(data))
            content.append(Spacer(1, 12))
            
            # Footer
            content.extend(self._build_footer(data))
            
            # Build PDF
            doc.build(content)
            
            # Get PDF bytes
            pdf_bytes = buffer.getvalue()
            buffer.close()
            
            logger.info(f"PDF approval letter generated successfully, size: {len(pdf_bytes)} bytes")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating PDF approval letter: {str(e)}")
            raise
    
    def _build_header(self) -> List:
        """Build PDF header section"""
        styles = getSampleStyleSheet()
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.darkblue,
            alignment=TA_CENTER,
            spaceAfter=6
        )
        
        subheader_style = ParagraphStyle(
            'CustomSubHeader',
            parent=styles['Normal'],
            fontSize=12,
            alignment=TA_CENTER,
            textColor=colors.grey,
            spaceAfter=12
        )
        
        return [
            Paragraph(self.company_name, header_style),
            Paragraph(f"{self.company_address}", subheader_style),
            Paragraph(f"Phone: {self.company_phone} | Email: {self.company_email}", subheader_style),
            Paragraph(f"License: {self.license_number}", subheader_style),
        ]
    
    def _build_customer_section(self, data: Dict[str, Any]) -> List:
        """Build customer details section"""
        styles = getSampleStyleSheet()
        
        customer = data['customer_info']
        date = data['letter_date']
        ref_num = data['references']['approval_reference']
        
        content = [
            Paragraph(f"<b>Date:</b> {date}", styles['Normal']),
            Paragraph(f"<b>Approval Reference:</b> {ref_num}", styles['Normal']),
            Spacer(1, 12),
            Paragraph(f"<b>To,</b>", styles['Normal']),
            Paragraph(f"<b>{customer['name']}</b>", styles['Normal']),
        ]
        
        # Add address if available
        if customer['address']['full_address'] != 'NOT_EXTRACTED':
            content.append(Paragraph(f"{customer['address']['full_address']}", styles['Normal']))
        else:
            # Fallback to separate city, state, pincode
            location_parts = []
            if customer['address']['city'] != 'NOT_EXTRACTED':
                location_parts.append(customer['address']['city'])
            if customer['address']['state'] != 'NOT_EXTRACTED':
                location_parts.append(customer['address']['state'])
            if customer['address']['pincode'] != 'NOT_EXTRACTED':
                location_parts.append(customer['address']['pincode'])
            
            if location_parts:
                content.append(Paragraph(f"{', '.join(location_parts)}", styles['Normal']))
        
        return content
    
    def _build_approval_message(self, data: Dict[str, Any]) -> List:
        """Build loan approval message"""
        styles = getSampleStyleSheet()
        
        approval_style = ParagraphStyle(
            'ApprovalStyle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.darkgreen,
            alignment=TA_CENTER,
            spaceAfter=12,
            spaceBefore=12
        )
        
        customer_name = data['customer_info']['name']
        amount = data['final_terms']['approved_amount']
        
        return [
            Paragraph("🎉 LOAN APPROVAL LETTER 🎉", approval_style),
            Paragraph(f"Dear {customer_name},", styles['Normal']),
            Spacer(1, 6),
            Paragraph(f"We are pleased to inform you that your loan application has been <b>APPROVED</b>. After careful review of your application and supporting documents, we have approved your personal loan request for <b>₹{amount:,.2f}</b>.", styles['Normal']),
            Spacer(1, 6),
            Paragraph("This approval is based on the strength of your profile, income verification, and credit assessment conducted through our advanced AI-powered evaluation system.", styles['Normal']),
        ]
    
    def _build_loan_terms_table(self, data: Dict[str, Any]) -> List:
        """Build loan terms table"""
        styles = getSampleStyleSheet()
        terms = data['final_terms']
        
        table_data = [
            ['Loan Details', 'Terms'],
            ['Approved Loan Amount', f"₹{terms['approved_amount']:,.2f}"],
            ['Interest Rate', f"{terms['interest_rate']}% p.a. ({terms['interest_type']})"],
            ['Loan Tenure', f"{terms['tenure']} months"],
            ['Monthly EMI', f"₹{terms['monthly_emi']:,.2f}"],
            ['Processing Fee', f"₹{terms['processing_fee']:,.2f}"],
            ['Total Interest', f"₹{terms['total_interest']:,.2f}"],
            ['Total Amount Payable', f"₹{terms['total_amount']:,.2f}"],
            ['First EMI Date', terms['first_emi_date']],
            ['Loan Maturity Date', terms['maturity_date']],
        ]
        
        table = Table(table_data, colWidths=[3*inch, 2.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        
        return [
            Paragraph("<b>Loan Terms & Conditions:</b>", styles['Heading3']),
            Spacer(1, 6),
            table
        ]
    
    def _build_timeline_section(self, data: Dict[str, Any]) -> List:
        """Build approval timeline section"""
        styles = getSampleStyleSheet()
        timeline = data['approval_timeline']
        
        content = [
            Paragraph("<b>Application Processing Timeline:</b>", styles['Heading3']),
            Spacer(1, 6)
        ]
        
        for item in timeline:
            status_color = colors.green if item['status'] == 'Completed' else colors.orange if item['status'] == 'In Progress' else colors.grey
            content.extend([
                Paragraph(f"<b>{item['step']}</b> - {item['date']} - <font color='{status_color}'>{item['status']}</font>", styles['Normal']),
                Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{item['description']}", styles['Normal']),
                Spacer(1, 3)
            ])
        
        return content
    
    def _build_conditions_section(self, data: Dict[str, Any]) -> List:
        """Build loan conditions section"""
        styles = getSampleStyleSheet()
        conditions = data['conditions']
        
        content = [
            Paragraph("<b>Terms & Conditions:</b>", styles['Heading3']),
            Spacer(1, 6)
        ]
        
        for i, condition in enumerate(conditions, 1):
            content.append(Paragraph(f"{i}. {condition}", styles['Normal']))
            content.append(Spacer(1, 3))
        
        return content
    
    def _build_next_steps_section(self, data: Dict[str, Any]) -> List:
        """Build next steps section"""
        styles = getSampleStyleSheet()
        steps = data['next_steps']
        
        content = [
            Paragraph("<b>Next Steps:</b>", styles['Heading3']),
            Spacer(1, 6)
        ]
        
        for i, step in enumerate(steps, 1):
            content.extend([
                Paragraph(f"{i}. <b>{step['step']}</b> ({step['timeline']})", styles['Normal']),
                Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{step['description']}", styles['Normal']),
                Spacer(1, 3)
            ])
        
        return content
    
    def _build_footer(self, data: Dict[str, Any]) -> List:
        """Build PDF footer"""
        styles = getSampleStyleSheet()
        company = data['company_info']
        
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=colors.grey
        )
        
        return [
            Spacer(1, 24),
            Paragraph("Thank you for choosing our services. We look forward to serving you.", styles['Normal']),
            Spacer(1, 12),
            Paragraph("Best regards,<br/><b>Customer Service Team</b><br/>Intelligent Loan Platform", styles['Normal']),
            Spacer(1, 24),
            Paragraph(f"This is a system-generated document. For queries, contact {company['phone']} or {company['email']}", footer_style),
            Paragraph(f"Generated on {datetime.now().strftime('%d %B %Y at %H:%M:%S')}", footer_style)
        ]

    def generate_summary_csv(self, application_data: Dict[str, Any]) -> str:
        """Generate a summary CSV with key loan details"""
        try:
            data = self.collect_application_data(application_data)
            
            csv_content = "Field,Value\n"
            csv_content += f"Customer Name,{data['customer_info']['name']}\n"
            csv_content += f"PAN Number,{data['customer_info']['pan']}\n"
            csv_content += f"Application Date,{data['application_date']}\n"
            csv_content += f"Approval Date,{data['approval_date']}\n"
            csv_content += f"Loan Amount,{data['final_terms']['approved_amount']}\n"
            csv_content += f"Interest Rate,{data['final_terms']['interest_rate']}%\n"
            csv_content += f"Tenure,{data['final_terms']['tenure']} months\n"
            csv_content += f"Monthly EMI,{data['final_terms']['monthly_emi']}\n"
            csv_content += f"Processing Fee,{data['final_terms']['processing_fee']}\n"
            csv_content += f"Total Amount,{data['final_terms']['total_amount']}\n"
            csv_content += f"Application Reference,{data['references']['application_number']}\n"
            csv_content += f"Approval Reference,{data['references']['approval_reference']}\n"
            
            return csv_content
            
        except Exception as e:
            logger.error(f"Error generating summary CSV: {str(e)}")
            raise


# Initialize service instance
approval_service = LoanApprovalLetterService()