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
            # Direct salary keywords
            'salary', 'sal', 'payroll', 'wages', 'stipend', 'pay', 'income',
            'credit salary', 'salary credit', 'sal cr', 'sal credit',
            'monthly sal', 'basic sal', 'net sal', 'gross sal',
            'emp sal', 'employee sal', 'staff sal', 'compensation',
            'remuneration', 'earnings', 'monthly pay', 'basic pay',
            
            # Transfer method keywords
            'neft', 'imps', 'rtgs', 'fund transfer', 'online transfer',
            'monthly credit', 'regular credit', 'recurring credit',
            'company credit', 'employer credit', 'corporate credit',
            
            # Common company types and suffixes
            'ltd', 'limited', 'pvt ltd', 'private limited', 'private', 'corp', 'corporation',
            'inc', 'incorporated', 'llp', 'llc', 'co', 'company',
            'technologies', 'tech', 'systems', 'solutions', 'services',
            'consulting', 'consultancy', 'software', 'infotech', 'info',
            
            # IT/Tech company patterns
            'tcs', 'infosys', 'wipro', 'cognizant', 'hcl', 'tech mahindra',
            'capgemini', 'accenture', 'ibm', 'microsoft', 'google', 'amazon',
            'oracle', 'sap', 'cisco', 'dell', 'hp', 'intel', 'adobe',
            'salesforce', 'vmware', 'citrix', 'nvidia', 'qualcomm',
            
            # Banking/Finance company patterns
            'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'yes bank', 'indusind',
            'bajaj', 'reliance', 'aditya birla', 'tata', 'mahindra',
            'jpmorgan', 'goldman sachs', 'morgan stanley', 'barclays',
            'deutsche bank', 'standard chartered', 'citi', 'hsbc',
            
            # Consulting/Services company patterns  
            'deloitte', 'pwc', 'kpmg', 'ey', 'mckinsey', 'bcg', 'bain',
            'ernst young', 'pricewaterhouse', 'coopers', 'arthur andersen',
            
            # Manufacturing/Industrial company patterns
            'maruti', 'hyundai', 'honda', 'toyota', 'ford', 'general motors',
            'bajaj auto', 'hero motocorp', 'tvs', 'royal enfield',
            'larsen toubro', 'bhel', 'ongc', 'ntpc', 'coal india',
            
            # Pharma/Healthcare company patterns
            'sun pharma', 'dr reddy', 'cipla', 'lupin', 'biocon',
            'aurobindo', 'cadila', 'glenmark', 'torrent pharma',
            'pfizer', 'novartis', 'roche', 'johnson johnson',
            
            # E-commerce/Startups
            'flipkart', 'amazon india', 'paytm', 'ola', 'uber', 'swiggy',
            'zomato', 'byju', 'unacademy', 'phonepe', 'razorpay',
            'freshworks', 'zoho', 'chargebee', 'clevertap',
            
            # Government/PSU patterns
            'government', 'govt', 'public sector', 'psu', 'railway',
            'indian oil', 'bharat petroleum', 'hindustan petroleum',
            'air india', 'bsnl', 'mtnl', 'sail', 'gail',
            
            # Common employer abbreviations
            'pvt', 'ltd', 'llp', 'inc', 'corp', 'co', 'grp', 'group',
            
            # Generic employment indicators
            'employer', 'organization', 'office', 'workplace', 'job',
            'employment', 'work', 'professional', 'career'
        ]
        
        # Common bank transaction patterns
        self.credit_patterns = [
            r'cr\b', r'credit\b', r'deposit\b', r'neft.*cr', r'imps.*cr',
            r'rtgs.*cr', r'upi.*cr', r'online.*transfer.*cr'
        ]
        
        # Enhanced amount extraction patterns for various bank formats
        self.amount_patterns = [
            # Traditional patterns
            r'₹\s*([0-9,]+\.?\d*)',
            r'rs\.?\s*([0-9,]+\.?\d*)',
            r'inr\s*([0-9,]+\.?\d*)',
            r'([0-9,]+\.?\d*)\s*cr',
            r'([0-9,]+\.?\d*)\s*credit',
            # Enhanced patterns for spaced amounts
            r'([0-9,]+\.?\d*)\s+([0-9,]+\.?\d*)\s*$',  # Columnar amounts at end of line
            r'([0-9]+,\s*[0-9]+\.?\d*)',  # Spaced comma amounts like "5,71, 126.22"
            r'([0-9,\s]+\.\d{2})',  # Any amount with decimal at end
            r'([0-9,\s]+)',  # Any number sequence (fallback)
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
            # Handle both 'date_of_birth' and 'dob' field names
            dob = pan_data.get('date_of_birth', '') or pan_data.get('dob', '')
            dob = dob.strip() if dob else ''
            
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
            
            # Generate lowercase password as primary (most common format)
            password = f"{name_letters.lower()}{day}{month}"
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
                        password.upper(),  # Try uppercase version
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
                logger.info(f"PDF has {len(pdf_reader.pages)} pages")
                
                if len(pdf_reader.pages) == 0:
                    raise ValueError("PDF has no pages")
                
                for page_num in range(len(pdf_reader.pages)):
                    logger.info(f"Processing page {page_num + 1}")
                    try:
                        page = pdf_reader.pages[page_num]
                        page_text = page.extract_text()
                        if page_text:
                            text_content += page_text + "\n"
                            logger.info(f"Extracted {len(page_text)} characters from page {page_num + 1}")
                        else:
                            logger.warning(f"No text found on page {page_num + 1}")
                    except Exception as page_error:
                        logger.error(f"Error processing page {page_num + 1}: {page_error}")
                        continue
                
                if not text_content.strip():
                    raise ValueError("No text content found in PDF")
                
                logger.info(f"Total extracted {len(text_content)} characters from PDF")
                return text_content
            except Exception as e:
                logger.error(f"Error extracting text from PDF: {e}")
                raise ValueError(f"Failed to extract text from PDF: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            raise

    def parse_transactions(self, raw_text: str) -> List[Dict[str, Any]]:
        """
        Parse transaction data from PDF text content with enhanced multi-line support
        
        Args:
            raw_text: Raw text extracted from PDF
            
        Returns:
            List of transaction dictionaries
        """
        try:
            transactions = []
            
            # Preprocess text to handle OCR spacing issues
            processed_text = self._preprocess_text(raw_text)
            lines = processed_text.split('\n')
            
            # Enhanced date patterns for various bank statement formats
            date_patterns = [
                r'(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})',  # DD/MM/YYYY, DD-MM-YYYY
                r'(\d{1,2}\s+\w{3}\s+\d{2,4})',  # 15 Aug 2024
                r'(\d{2}-\w{3}-\d{4})',  # 15-Aug-2024
                r'(\d{2}-\d{2}-\d{4})'   # DD-MM-YYYY
            ]
            
            i = 0
            while i < len(lines):
                line = lines[i].strip()
                if not line:
                    i += 1
                    continue
                
                # Look for lines containing dates (likely transaction lines)
                date_found = None
                for pattern in date_patterns:
                    date_match = re.search(pattern, line)
                    if date_match:
                        date_found = date_match.group(1)
                        break
                
                if date_found:
                    # Check for multi-line transactions
                    full_transaction_text = line
                    
                    # Look ahead for continuation lines (like PRIVATE/amount pattern)
                    j = i + 1
                    while j < len(lines) and j < i + 3:  # Check next 2 lines max
                        next_line = lines[j].strip()
                        if not next_line:
                            j += 1
                            continue
                            
                        # If next line starts with common continuation patterns or has amount
                        if (re.search(r'^(PRIVATE|LIMITED|LTD|CORP|BANK)', next_line) or 
                            re.search(r'^\w+\/[\d,]+\.?\d*', next_line) or
                            re.search(r'^[\d,]+\.?\d+\s+[\d,]+\.?\d+$', next_line)):
                            full_transaction_text += " " + next_line
                            j += 1
                        else:
                            break
                    
                    # Extract transaction details from combined text
                    transaction = self._parse_transaction_line(full_transaction_text, date_found)
                    if transaction:
                        transactions.append(transaction)
                    
                    # Skip the processed continuation lines
                    i = j
                else:
                    i += 1
            
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

    def _preprocess_text(self, raw_text: str) -> str:
        """Preprocess OCR text to handle spacing issues"""
        try:
            # Fix common OCR spacing issues
            text = raw_text
            
            # Fix spaced numbers in amounts
            text = re.sub(r'(\d+),\s+(\d+)', r'\1,\2', text)  # "5,71, 126.22" -> "5,71,126.22"
            text = re.sub(r'(\d+)\s+\.(\d+)', r'\1.\2', text)  # "126 .22" -> "126.22"
            
            # Fix common spaced words
            common_words = {
                'ACCOU NT': 'ACCOUNT',
                'BALANC E': 'BALANCE', 
                'WITHDR AWAL': 'WITHDRAWAL',
                'DEPO SIT': 'DEPOSIT',
                'AIRTE L': 'AIRTEL',
                'PAYM ENT': 'PAYMENT',
                'TRANSF ER': 'TRANSFER',
                'SALA RY': 'SALARY',
                'SAL ARY': 'SALARY',
                'CREDI T': 'CREDIT',
                'DEBI T': 'DEBIT'
            }
            
            for spaced, correct in common_words.items():
                text = text.replace(spaced, correct)
            
            return text
            
        except Exception as e:
            logger.warning(f"Text preprocessing failed: {e}")
            return raw_text

    def _extract_amount(self, line: str) -> Optional[float]:
        """Extract transaction amount from bank statement line (enhanced for deposits)"""
        try:
            # Skip lines that are clearly not transactions
            if any(keyword in line.upper() for keyword in ['B/F', 'C/F', 'BALANCE FORWARD', 'BALANCE CARRIED']):
                return None
            
            # Enhanced patterns for different deposit types
            
            # 1. Multi-line NET BANKING deposits: "PRIVATE/3,83,269. 00  5,70,922.15"
            private_deposit_match = re.search(r'PRIVATE/([0-9,]+\.?\d*)\s+\d+\s+([0-9,]+\.[0-9]{2})$', line)
            if private_deposit_match:
                deposit_amt = private_deposit_match.group(1).replace(',', '')
                try:
                    amount = float(deposit_amt)
                    if amount >= 1000:  # Reasonable deposit amount
                        return amount
                except ValueError:
                    pass
            
            # 2. UPI Credits with "V" indicator: "V5,000. 00  5,66,778.22"
            upi_credit_match = re.search(r'V([0-9,]+\.?\d*)\s+\d+\s+([0-9,]+\.[0-9]{2})$', line)
            if upi_credit_match:
                credit_amt = upi_credit_match.group(1).replace(',', '')
                try:
                    amount = float(credit_amt)
                    if 100 <= amount <= 1000000:  # Reasonable UPI credit range
                        return amount
                except ValueError:
                    pass
            
            # 3. UPI Credits with different format: "10110,000. 00  5,76,778.22"
            large_upi_match = re.search(r'(\d{3,}[0-9,]*\.?\d*)\s+\d+\s+([0-9,]+\.[0-9]{2})$', line)
            if large_upi_match:
                amount_str = large_upi_match.group(1).replace(',', '')
                try:
                    amount = float(amount_str)
                    if 1000 <= amount <= 100000:  # Filter for reasonable transaction amounts
                        return amount
                except ValueError:
                    pass
            
            # 4. Standard credit card pattern: "2,400.0 0 3,88,075.70"
            transaction_balance_match = re.search(r'([0-9,]+\.?\d*)\s+\d+\s+([0-9,]+\.[0-9]{2})$', line)
            if transaction_balance_match:
                transaction_amt = transaction_balance_match.group(1).replace(',', '')
                try:
                    amount = float(transaction_amt)
                    if 1 <= amount <= 500000:  # Reasonable transaction range
                        return amount
                except ValueError:
                    pass
            
            # 5. Standard amount patterns with enhanced detection
            amount_patterns = [
                r'([0-9,]+\.[0-9]{1,2})\s*(CR|DR|CREDIT|DEBIT)?',  # Decimal amounts
                r'([0-9,]+)\s*(CR|DR|CREDIT|DEBIT)',  # Integer amounts with indicators
                r'₹\s*([0-9,]+\.?\d*)',  # Amounts with rupee symbol
                r'RS\.?\s*([0-9,]+\.?\d*)',  # Amounts with RS
                # Enhanced pattern for multi-line deposits
                r'/([0-9,]+\.?\d*)\s+\d+',  # Amount after slash (deposit format)
            ]
            
            all_amounts = []
            
            for pattern in amount_patterns:
                matches = re.findall(pattern, line, re.IGNORECASE)
                for match in matches:
                    amount_str = match[0] if isinstance(match, tuple) else match
                    try:
                        clean_amount = amount_str.replace(',', '').strip()
                        if clean_amount and clean_amount.replace('.', '').isdigit():
                            amount = float(clean_amount)
                            # Filter reasonable transaction amounts (expanded range for deposits)
                            if 1 <= amount <= 10000000:  # Up to 1 crore for large deposits
                                all_amounts.append(amount)
                    except (ValueError, IndexError):
                        continue
            
            if not all_amounts:
                return None
            
            # Remove duplicates and sort
            unique_amounts = sorted(set(all_amounts))
            
            # If single amount, return it
            if len(unique_amounts) == 1:
                return unique_amounts[0]
            
            # Multiple amounts: enhanced logic for deposits
            # Large amounts (>1L) could be legitimate deposits, not just balances
            large_amounts = [amt for amt in unique_amounts if amt >= 100000]
            medium_amounts = [amt for amt in unique_amounts if 1000 <= amt < 100000]
            small_amounts = [amt for amt in unique_amounts if amt < 1000]
            
            # Priority: medium amounts (1K-1L) are most likely transactions
            if medium_amounts:
                return max(medium_amounts)
            
            # For large amounts, if it's in a deposit context, it could be valid
            if large_amounts and any(keyword in line.upper() for keyword in ['PRIVATE', 'NET BANKING', 'DEPOSIT', 'CREDIT']):
                # Return the smallest large amount (more likely to be transaction vs balance)
                return min(large_amounts)
            
            # Fallback to small amounts
            if small_amounts:
                return max(small_amounts)
            
            return None
            
        except Exception as e:
            logger.debug(f"Error extracting amount from line '{line}': {e}")
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
        
        # Very high confidence keywords (direct salary indicators)
        very_high_conf = ['salary', 'payroll', 'wages', 'sal credit', 'salary credit']
        for keyword in very_high_conf:
            if keyword in description_lower:
                confidence += 0.4
        
        # High confidence keywords (company names - major employers)
        major_companies = [
            'tcs', 'infosys', 'wipro', 'cognizant', 'hcl', 'tech mahindra',
            'accenture', 'capgemini', 'deloitte', 'pwc', 'kpmg', 'ey',
            'hdfc', 'icici', 'sbi', 'axis', 'kotak', 'microsoft', 'google',
            'amazon', 'oracle', 'ibm', 'adobe', 'salesforce'
        ]
        for company in major_companies:
            if company in description_lower:
                confidence += 0.35
        
        # Medium-high confidence (company types and other major brands)
        med_high_conf = [
            'ltd', 'limited', 'pvt ltd', 'private limited', 'corp', 'corporation',
            'technologies', 'consulting', 'systems', 'solutions', 'services',
            'tata', 'reliance', 'bajaj', 'mahindra', 'aditya birla'
        ]
        for keyword in med_high_conf:
            if keyword in description_lower:
                confidence += 0.25
        
        # Medium confidence keywords
        med_conf_keywords = ['sal', 'pay', 'compensation', 'earnings', 'income']
        for keyword in med_conf_keywords:
            if keyword in description_lower:
                confidence += 0.2
        
        # Low-medium confidence (transfer methods with employment context)
        transfer_methods = ['neft', 'imps', 'rtgs', 'fund transfer']
        for method in transfer_methods:
            if method in description_lower:
                # Higher confidence if combined with other employment indicators
                if any(term in description_lower for term in ['employee', 'emp', 'staff', 'employer']):
                    confidence += 0.3
                else:
                    confidence += 0.15
        
        # Bonus patterns that increase confidence
        if re.search(r'monthly|recurring|regular', description_lower):
            confidence += 0.1
        
        if re.search(r'employee|emp|staff|employer', description_lower):
            confidence += 0.1
            
        if re.search(r'office|workplace|organization', description_lower):
            confidence += 0.1
        
        # Company suffix patterns
        if re.search(r'\b(pvt|ltd|llp|inc|corp|co)\b', description_lower):
            confidence += 0.15
        
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