"""
Bank Statement Analysis Module for Claude Code
===========================================

This module processes password-protected bank statements, extracts salary information
from credit transactions, and validates against salary slip data.

Author: Claude Code
Version: 1.0.0
"""

import PyPDF2
import pandas as pd
import re
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BankStatementProcessor:
    """
    Main class for processing password-protected bank statements
    """
    
    def __init__(self):
        """Initialize the processor with salary detection keywords"""
        self.salary_keywords = [
            'salary', 'sal', 'payroll', 'wages', 'stipend', 'pay', 'income',
            'credit salary', 'salary credit', 'sal cr', 'sal credit',
            'monthly sal', 'basic sal', 'net sal', 'gross sal',
            'emp sal', 'employee sal', 'staff sal', 'compensation',
            'remuneration', 'earnings', 'monthly pay', 'basic pay'
        ]
        
        # Common bank transaction patterns
        self.credit_patterns = [
            r'cr\b', r'credit\b', r'deposit\b', r'neft.*cr', r'imps.*cr',
            r'rtgs.*cr', r'upi.*cr', r'online.*transfer.*cr'
        ]
        
        # Amount extraction patterns
        self.amount_patterns = [
            r'₹\s*([0-9,]+\.?\d*)',
            r'rs\.?\s*([0-9,]+\.?\d*)',
            r'inr\s*([0-9,]+\.?\d*)',
            r'([0-9,]+\.?\d*)\s*cr',
            r'([0-9,]+\.?\d*)\s*credit'
        ]

    def generate_bank_password(self, pan_data: Dict[str, str]) -> str:
        """
        Generate bank statement password from PAN card data
        
        Args:
            pan_data: Dictionary containing 'name' and 'date_of_birth' keys
            
        Returns:
            Generated password in format: First4LettersOfName + DDMM
            
        Example:
            Input: {"name": "RAJESH KUMAR SHARMA", "date_of_birth": "15/08/1985"}
            Output: "RAJE1508"
        """
        try:
            name = pan_data.get('name', '').strip().upper()
            dob = pan_data.get('date_of_birth', '').strip()
            
            if not name or not dob:
                raise ValueError("Name and date_of_birth are required")
            
            # Extract first 4 letters from name (ignoring spaces)
            name_letters = re.sub(r'[^A-Z]', '', name)[:4]
            if len(name_letters) < 4:
                # Pad with zeros if less than 4 letters
                name_letters = name_letters.ljust(4, '0')
            
            # Extract DD and MM from date of birth
            # Support formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
            date_match = re.search(r'(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})', dob)
            if not date_match:
                raise ValueError(f"Invalid date format: {dob}")
            
            day = date_match.group(1).zfill(2)
            month = date_match.group(2).zfill(2)
            
            password = f"{name_letters}{day}{month}"
            logger.info(f"Generated password: {password} (showing full password for debugging)")
            logger.info(f"Password components: name_letters='{name_letters}', day='{day}', month='{month}'")
            
            return password
            
        except Exception as e:
            logger.error(f"Error generating password: {str(e)}")
            raise

    def process_protected_pdf(self, file_content: bytes, password: str) -> str:
        """
        Open and extract text from password-protected PDF
        
        Args:
            file_content: PDF file content as bytes
            password: Password to unlock the PDF
            
        Returns:
            Extracted text content from the PDF
        """
        try:
            # Create a PDF reader object
            pdf_file = io.BytesIO(file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            # Check if PDF is encrypted
            if pdf_reader.is_encrypted:
                logger.info(f"PDF is encrypted, attempting to decrypt with password: {password}")
                decrypt_result = pdf_reader.decrypt(password)
                
                if not decrypt_result:
                    logger.warning(f"Primary password failed: {password}")
                    # Try alternative password formats
                    alt_passwords = [
                        password.lower(),
                        password.upper(),
                        password + '0',  # Some banks add trailing zero
                        '0' + password,   # Some banks add leading zero
                        password + '00',  # Double zero
                        password[:-2] + password[-2:].lower(),  # Mixed case (name upper, date lower)
                        password[:4].lower() + password[4:],    # Name lower, date upper
                        password + '1',   # Some banks add 1
                        password.replace('0', ''),  # Remove zeros
                        password[:4] + '/' + password[4:6] + '/' + password[6:],  # Add slashes to date
                        password[:4] + '-' + password[4:6] + '-' + password[6:],  # Add dashes to date
                        password[:4] + password[6:] + password[4:6],  # DDMM format instead of MMDD
                        # Try full date formats
                        password[:4] + password[4:6] + '/19' + password[6:],  # Add 19 for year
                        password[:4] + password[4:6] + '/20' + password[6:],  # Add 20 for year
                        password[:4] + password[4:6] + '19' + password[6:],   # Add 19 without slash
                        password[:4] + password[4:6] + '20' + password[6:],   # Add 20 without slash
                    ]
                    
                    logger.info(f"Trying alternative passwords: {alt_passwords}")
                    for alt_password in alt_passwords:
                        logger.info(f"Trying password: {alt_password}")
                        if pdf_reader.decrypt(alt_password):
                            logger.info(f"Successfully decrypted with alternative password: {alt_password}")
                            password = alt_password
                            break
                    else:
                        logger.error(f"Failed to decrypt PDF with any password. Tried: {[password] + alt_passwords}")
                        raise ValueError(f"Failed to decrypt PDF with provided password. Tried: {[password] + alt_passwords}")
                else:
                    logger.info(f"Successfully decrypted PDF with primary password: {password}")
            
            # Extract text from all pages
            text_content = ""
            try:
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        text_content += page_text + "\n"
                
                if not text_content.strip():
                    raise ValueError("No text content found in PDF")
                
                logger.info(f"Extracted {len(text_content)} characters from PDF")
                return text_content
            except Exception as e:
                logger.error(f"Error extracting text from PDF: {e}")
                raise ValueError(f"Failed to extract text from PDF: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            raise

    def parse_transactions(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Parse transaction data from PDF text content
        
        Args:
            raw_text: Raw text extracted from PDF
            
        Returns:
            List of transaction dictionaries
        """
        try:
            transactions = []
            lines = raw_text.split('\n')
            
            # Common date patterns in bank statements
            date_patterns = [
                r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',
                r'(\d{1,2}\s+\w{3}\s+\d{2,4})',  # 15 Aug 2024
                r'(\d{2}-\w{3}-\d{4})'  # 15-Aug-2024
            ]
            
            for line_num, line in enumerate(lines):
                line = line.strip()
                if not line:
                    continue
                
                # Look for lines containing dates (likely transaction lines)
                date_found = None
                for pattern in date_patterns:
                    date_match = re.search(pattern, line)
                    if date_match:
                        date_found = date_match.group(1)
                        break
                
                if date_found:
                    # Extract transaction details
                    transaction = self._parse_transaction_line(line, date_found)
                    if transaction:
                        transactions.append(transaction)
            
            logger.info(f"Parsed {len(transactions)} transactions")
            return transactions
            
        except Exception as e:
            logger.error(f"Error parsing transactions: {str(e)}")
            return []

    def _parse_transaction_line(self, line: str, date_str: str) -> Optional[Dict[str, Any]]:
        """
        Parse individual transaction line
        
        Args:
            line: Transaction line text
            date_str: Date string found in the line
            
        Returns:
            Transaction dictionary or None if parsing fails
        """
        try:
            # Extract amount using various patterns
            amount = self._extract_amount(line)
            if amount is None:
                return None
            
            # Determine transaction type (credit/debit)
            transaction_type = self._determine_transaction_type(line)
            
            # Extract description
            description = self._extract_description(line, date_str)
            
            # Parse date
            parsed_date = self._parse_date(date_str)
            
            transaction = {
                'date': parsed_date,
                'description': description,
                'amount': amount,
                'type': transaction_type,
                'raw_line': line
            }
            
            return transaction
            
        except Exception as e:
            logger.debug(f"Error parsing transaction line: {str(e)}")
            return None

    def _extract_amount(self, line: str) -> Optional[float]:
        """Extract amount from transaction line"""
        for pattern in self.amount_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '')
                try:
                    return float(amount_str)
                except ValueError:
                    continue
        return None

    def _determine_transaction_type(self, line: str) -> str:
        """Determine if transaction is credit or debit"""
        line_lower = line.lower()
        
        # Check for credit indicators
        for pattern in self.credit_patterns:
            if re.search(pattern, line_lower):
                return 'credit'
        
        # Check for debit indicators
        debit_patterns = [r'dr\b', r'debit\b', r'withdrawal\b', r'charge\b', r'fee\b']
        for pattern in debit_patterns:
            if re.search(pattern, line_lower):
                return 'debit'
        
        # Default to debit if unclear
        return 'debit'

    def _extract_description(self, line: str, date_str: str) -> str:
        """Extract transaction description"""
        # Remove date and amount from line to get description
        description = line
        description = re.sub(r'\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}', '', description)
        description = re.sub(r'₹\s*[0-9,]+\.?\d*', '', description, flags=re.IGNORECASE)
        description = re.sub(r'rs\.?\s*[0-9,]+\.?\d*', '', description, flags=re.IGNORECASE)
        description = re.sub(r'\b(cr|dr|credit|debit)\b', '', description, flags=re.IGNORECASE)
        description = re.sub(r'\s+', ' ', description).strip()
        
        return description

    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse date string to datetime object"""
        date_formats = [
            '%d/%m/%Y', '%d-%m-%Y', '%d.%m.%Y',
            '%d/%m/%y', '%d-%m-%y', '%d.%m.%y',
            '%d %b %Y', '%d-%b-%Y'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        logger.warning(f"Could not parse date: {date_str}")
        return None

    def filter_credit_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter for credit (incoming) transactions only
        
        Args:
            transactions: List of all transactions
            
        Returns:
            List of credit transactions only
        """
        credit_transactions = [t for t in transactions if t.get('type') == 'credit']
        logger.info(f"Found {len(credit_transactions)} credit transactions out of {len(transactions)} total")
        return credit_transactions

    def identify_salary_transactions(self, credit_transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identify salary-related transactions from credit transactions
        
        Args:
            credit_transactions: List of credit transactions
            
        Returns:
            List of salary transactions with enhanced metadata
        """
        salary_transactions = []
        
        for transaction in credit_transactions:
            description = transaction.get('description', '').lower()
            
            # Check for salary keywords
            salary_match = False
            matched_keywords = []
            
            for keyword in self.salary_keywords:
                if keyword in description:
                    salary_match = True
                    matched_keywords.append(keyword)
            
            if salary_match:
                # Enhance transaction with salary-specific metadata
                enhanced_transaction = transaction.copy()
                enhanced_transaction['matched_keywords'] = matched_keywords
                enhanced_transaction['confidence_score'] = self._calculate_salary_confidence(description)
                
                salary_transactions.append(enhanced_transaction)
        
        # Sort by confidence score (highest first)
        salary_transactions.sort(key=lambda x: x.get('confidence_score', 0), reverse=True)
        
        logger.info(f"Identified {len(salary_transactions)} salary transactions")
        return salary_transactions

    def _calculate_salary_confidence(self, description: str) -> float:
        """Calculate confidence score for salary transaction identification"""
        confidence = 0.0
        description_lower = description.lower()
        
        # High confidence keywords
        high_conf_keywords = ['salary', 'payroll', 'wages', 'sal credit']
        for keyword in high_conf_keywords:
            if keyword in description_lower:
                confidence += 0.3
        
        # Medium confidence keywords
        med_conf_keywords = ['sal', 'pay', 'compensation', 'earnings']
        for keyword in med_conf_keywords:
            if keyword in description_lower:
                confidence += 0.2
        
        # Patterns that increase confidence
        if re.search(r'monthly|recurring|regular', description_lower):
            confidence += 0.1
        
        if re.search(r'employee|emp|staff', description_lower):
            confidence += 0.1
        
        return min(confidence, 1.0)  # Cap at 1.0

    def validate_salary(self, bank_salary: float, slip_net_salary: float, tolerance: float = 0.1) -> Dict[str, Any]:
        """
        Validate bank statement salary against salary slip
        
        Args:
            bank_salary: Salary amount from bank statement
            slip_net_salary: Net salary from salary slip
            tolerance: Acceptable difference ratio (default 10%)
            
        Returns:
            Validation result dictionary
        """
        try:
            if bank_salary <= 0 or slip_net_salary <= 0:
                raise ValueError("Invalid salary amounts provided")
            
            # Calculate difference
            difference = abs(bank_salary - slip_net_salary)
            difference_percentage = (difference / max(bank_salary, slip_net_salary)) * 100
            
            # Determine validation result
            is_valid = difference_percentage <= (tolerance * 100)
            validated_salary = min(bank_salary, slip_net_salary)  # Use conservative approach
            
            validation_result = {
                'bank_salary': bank_salary,
                'slip_net_salary': slip_net_salary,
                'difference': difference,
                'difference_percentage': round(difference_percentage, 2),
                'is_valid': is_valid,
                'validated_salary': validated_salary,
                'validation_notes': self._generate_validation_notes(
                    bank_salary, slip_net_salary, difference_percentage, is_valid
                )
            }
            
            logger.info(f"Salary validation result: {validation_result}")
            return validation_result
            
        except Exception as e:
            logger.error(f"Error in salary validation: {str(e)}")
            raise

    def _generate_validation_notes(self, bank_salary: float, slip_salary: float, 
                                 diff_percentage: float, is_valid: bool) -> str:
        """Generate human-readable validation notes"""
        if is_valid:
            if bank_salary == slip_salary:
                return "Perfect match between bank statement and salary slip"
            elif bank_salary < slip_salary:
                return "Using bank statement amount (lower than slip) for conservative estimate"
            else:
                return "Using salary slip amount (lower than bank) for conservative estimate"
        else:
            return f"Significant discrepancy ({diff_percentage:.1f}%) between bank and slip amounts - manual review recommended"

    def process_bank_statement(self, file_content: bytes, pan_data: Dict[str, str], 
                             slip_net_salary: Optional[float] = None) -> Dict[str, Any]:
        """
        Main function to process bank statement end-to-end
        
        Args:
            file_content: PDF file content as bytes
            pan_data: PAN card data with name and date_of_birth
            slip_net_salary: Net salary from salary slip for validation
            
        Returns:
            Complete analysis result
        """
        try:
            logger.info("Starting bank statement processing...")
            
            # Step 1: Generate password
            password = self.generate_bank_password(pan_data)
            
            # Step 2: Extract PDF content
            raw_text = self.process_protected_pdf(file_content, password)
            
            # Step 3: Parse transactions
            all_transactions = self.parse_transactions(raw_text)
            
            # Step 4: Filter credit transactions
            credit_transactions = self.filter_credit_transactions(all_transactions)
            
            # Step 5: Identify salary transactions
            salary_transactions = self.identify_salary_transactions(credit_transactions)
            
            # Step 6: Calculate salary statistics
            salary_amounts = [t['amount'] for t in salary_transactions]
            average_salary = sum(salary_amounts) / len(salary_amounts) if salary_amounts else 0
            
            # Step 7: Validate against salary slip if provided
            validation_result = None
            validated_salary = average_salary
            
            if slip_net_salary and average_salary > 0:
                validation_result = self.validate_salary(average_salary, slip_net_salary)
                validated_salary = validation_result['validated_salary']
            
            # Compile final result
            result = {
                'password_used': password,
                'total_transactions': len(all_transactions),
                'total_credit_transactions': len(credit_transactions),
                'salary_transactions_found': len(salary_transactions),
                'salary_amounts': salary_amounts,
                'average_monthly_salary': round(average_salary, 2),
                'salary_slip_net': slip_net_salary,
                'validated_salary': round(validated_salary, 2),
                'validation_result': validation_result,
                'salary_transactions_details': salary_transactions[:5],  # Top 5 for review
                'processing_timestamp': datetime.now().isoformat(),
                'success': True
            }
            
            logger.info("Bank statement processing completed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error in bank statement processing: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'processing_timestamp': datetime.now().isoformat()
            }


def main():
    """
    Example usage of the BankStatementProcessor
    """
    # Sample PAN data
    pan_data = {
        'name': 'RAJESH KUMAR SHARMA',
        'date_of_birth': '15/08/1985'
    }
    
    # Sample salary slip net amount
    slip_net_salary = 48000.0
    
    # Initialize processor
    processor = BankStatementProcessor()
    
    # For demonstration - would normally read actual PDF file
    print("Bank Statement Processor initialized successfully")
    print(f"Generated password for {pan_data['name']}: {processor.generate_bank_password(pan_data)}")
    
    # Example result structure
    example_result = {
        "password_used": "RAJE1508",
        "total_transactions": 120,
        "total_credit_transactions": 45,
        "salary_transactions_found": 3,
        "salary_amounts": [50000, 50000, 49500],
        "average_monthly_salary": 49833.33,
        "salary_slip_net": 48000.0,
        "validated_salary": 48000.0,
        "validation_result": {
            "is_valid": True,
            "difference_percentage": 3.8,
            "validation_notes": "Using salary slip amount (lower) for conservative estimate"
        },
        "success": True
    }
    
    print("\nExample output structure:")
    print(json.dumps(example_result, indent=2))


if __name__ == "__main__":
    main()