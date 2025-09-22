# Bank Statement Processor Documentation

## Overview

The Bank Statement Processor is a comprehensive Python module designed to analyze password-protected bank statements, extract salary information from credit transactions, and validate against salary slip data. This module provides advanced financial document processing capabilities for loan origination systems.

## Key Features

### 🔐 Password Protection Handling
- **Automatic Password Generation**: Creates passwords using PAN card data (First 4 letters + DDMM format)
- **Multiple Format Support**: Handles various date formats (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY)
- **Fallback Mechanisms**: Tries alternative password formats if initial attempt fails

### 📊 Transaction Analysis
- **Comprehensive Parsing**: Extracts all transactions from PDF text content
- **Smart Filtering**: Identifies credit vs debit transactions using pattern matching
- **Salary Detection**: Uses advanced keyword matching to identify salary-related transactions
- **Confidence Scoring**: Assigns confidence scores to salary transaction identification

### ✅ Validation & Verification
- **Cross-Reference Validation**: Compares bank statement salary with salary slip data
- **Conservative Approach**: Uses the lower amount for risk mitigation
- **Discrepancy Detection**: Flags significant differences for manual review
- **Detailed Reporting**: Provides comprehensive analysis reports

## Installation

### Prerequisites
```bash
pip install PyPDF2>=3.0.0
pip install pandas>=2.0.0
```

### Dependencies Already in Project
- fastapi
- logging
- datetime
- json
- re
- typing

## Usage

### Basic Usage

```python
from app.utils.bank_statement_processor import BankStatementProcessor

# Initialize processor
processor = BankStatementProcessor()

# Sample PAN data
pan_data = {
    'name': 'RAJESH KUMAR SHARMA',
    'date_of_birth': '15/08/1985'
}

# Process bank statement
with open('bank_statement.pdf', 'rb') as file:
    file_content = file.read()

result = processor.process_bank_statement(
    file_content=file_content,
    pan_data=pan_data,
    slip_net_salary=48000.0
)

print(result)
```

### API Integration

The processor is integrated into the FastAPI application with the following endpoints:

#### 1. Regular Bank Statement Processing
```http
POST /api/documents/extract-bank-statement
Content-Type: multipart/form-data

Parameters:
- bank_file: UploadFile (PDF/Image)
- user_id: str (optional)
```

#### 2. Protected Bank Statement Processing
```http
POST /api/documents/process-protected-bank-statement
Content-Type: multipart/form-data

Parameters:
- bank_file: UploadFile (PDF)
- user_id: str (optional)
- salary_slip_net: float (optional)
```

## Core Functions

### 1. Password Generation
```python
def generate_bank_password(pan_data: Dict[str, str]) -> str
```
- **Input**: PAN data with 'name' and 'date_of_birth'
- **Output**: Generated password (e.g., "RAJE1508")
- **Logic**: First 4 letters of name + DDMM from DOB

### 2. PDF Processing
```python
def process_protected_pdf(file_content: bytes, password: str) -> str
```
- **Input**: PDF file content and password
- **Output**: Extracted text content
- **Features**: Handles encryption, tries alternative passwords

### 3. Transaction Parsing
```python
def parse_transactions(raw_text: str) -> List[Dict[str, Any]]
```
- **Input**: Raw text from PDF
- **Output**: List of structured transaction dictionaries
- **Features**: Date recognition, amount extraction, type detection

### 4. Credit Filtering
```python
def filter_credit_transactions(transactions: List[Dict]) -> List[Dict]
```
- **Input**: All transactions
- **Output**: Credit transactions only
- **Logic**: Uses credit indicators (CR, CREDIT, DEPOSIT, etc.)

### 5. Salary Identification
```python
def identify_salary_transactions(credit_transactions: List[Dict]) -> List[Dict]
```
- **Input**: Credit transactions
- **Output**: Salary transactions with confidence scores
- **Features**: Keyword matching, confidence scoring

### 6. Salary Validation
```python
def validate_salary(bank_salary: float, slip_net_salary: float) -> Dict
```
- **Input**: Bank salary and slip salary amounts
- **Output**: Validation result with detailed analysis
- **Logic**: Compares amounts, calculates differences, provides recommendations

## Salary Detection Keywords

### High Confidence Keywords
- salary, payroll, wages, salary credit

### Medium Confidence Keywords
- sal, pay, compensation, earnings

### Pattern Enhancements
- monthly, recurring, regular, employee, staff

## Configuration

### Salary Keywords Customization
```python
processor.salary_keywords = [
    'salary', 'sal', 'payroll', 'wages', 'stipend', 'pay', 'income',
    'credit salary', 'salary credit', 'sal cr', 'sal credit',
    # Add custom keywords as needed
]
```

### Amount Patterns Customization
```python
processor.amount_patterns = [
    r'₹\s*([0-9,]+\.?\d*)',
    r'rs\.?\s*([0-9,]+\.?\d*)',
    # Add custom patterns as needed
]
```

## Output Format

### Standard Output
```json
{
    "password_used": "RAJE1508",
    "total_transactions": 120,
    "total_credit_transactions": 45,
    "salary_transactions_found": 3,
    "salary_amounts": [50000, 50000, 49500],
    "average_monthly_salary": 49833.33,
    "salary_slip_net": 48000.0,
    "validated_salary": 48000.0,
    "validation_result": {
        "bank_salary": 49833.33,
        "slip_net_salary": 48000.0,
        "difference": 1833.33,
        "difference_percentage": 3.8,
        "is_valid": true,
        "validated_salary": 48000.0,
        "validation_notes": "Using salary slip amount (lower) for conservative estimate"
    },
    "success": true,
    "processing_timestamp": "2024-01-15T10:30:00"
}
```

### Error Output
```json
{
    "success": false,
    "error": "Failed to decrypt PDF with provided password",
    "processing_timestamp": "2024-01-15T10:30:00"
}
```

## Error Handling

### Password Issues
- **Wrong Password**: Tries alternative formats (upper/lower case, with prefixes/suffixes)
- **No Password Needed**: Handles non-encrypted PDFs gracefully
- **Corruption**: Provides meaningful error messages

### PDF Processing Issues
- **Unreadable Content**: Handles corrupted or image-based PDFs
- **No Text**: Detects and reports PDFs without extractable text
- **Format Variations**: Adapts to different bank statement layouts

### Transaction Parsing Issues
- **Missing Dates**: Continues processing with available data
- **Amount Extraction**: Handles various currency formats and notations
- **Description Parsing**: Robust text cleaning and extraction

## Testing

### Run Test Suite
```bash
cd backend
python test_bank_processor.py
```

### Test Coverage
- ✅ Password generation (various formats)
- ✅ Transaction parsing (multiple layouts)
- ✅ Credit filtering (pattern matching)
- ✅ Salary identification (keyword matching)
- ✅ Validation logic (comparison algorithms)
- ✅ Error handling (edge cases)

## Security Considerations

### Password Handling
- Passwords are generated deterministically but not stored
- Only first 4 characters logged for debugging
- Memory is cleared after processing

### Data Privacy
- No persistent storage of bank statement content
- Processing happens in memory only
- User data anonymized in logs

## Performance Optimization

### Memory Management
- Streams large PDFs instead of loading entirely
- Clears variables after processing
- Uses generators for large transaction lists

### Processing Speed
- Optimized regex patterns for faster matching
- Early termination for obviously non-salary transactions
- Cached keyword lookups

## Integration Examples

### With Existing Document Flow
```python
# In document_processing.py
@router.post("/comprehensive-income-analysis")
async def comprehensive_income_analysis(
    bank_file: UploadFile,
    salary_file: UploadFile,
    pan_data: dict
):
    # Process salary slip first
    salary_result = await process_salary_slip(salary_file)
    
    # Process bank statement with salary validation
    bank_result = processor.process_bank_statement(
        file_content=await bank_file.read(),
        pan_data=pan_data,
        slip_net_salary=salary_result['net_salary']
    )
    
    return {
        "salary_slip": salary_result,
        "bank_statement": bank_result,
        "final_income": bank_result['validated_salary']
    }
```

### With Risk Assessment
```python
def assess_income_risk(bank_result):
    validation = bank_result.get('validation_result', {})
    
    if not validation.get('is_valid'):
        return "HIGH_RISK"
    elif validation.get('difference_percentage', 0) > 5:
        return "MEDIUM_RISK"
    else:
        return "LOW_RISK"
```

## Troubleshooting

### Common Issues

1. **"Failed to decrypt PDF"**
   - Check PAN data format
   - Verify date format in DOB
   - Ensure PDF is actually password-protected

2. **"No transactions found"**
   - PDF might be image-based (need OCR)
   - Bank statement format not recognized
   - Text extraction failed

3. **"No salary transactions identified"**
   - Bank uses non-standard salary descriptions
   - Add custom keywords to processor
   - Check transaction descriptions manually

### Debug Mode
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Processor will now output detailed debug information
processor = BankStatementProcessor()
```

## Future Enhancements

### Planned Features
- OCR integration for image-based PDFs
- Machine learning for improved salary detection
- Support for multiple bank formats
- Real-time fraud detection
- Integration with bank APIs

### Customization Points
- Bank-specific parsing rules
- Industry-specific salary patterns
- Regional keyword variations
- Multi-language support

## Support

For issues, questions, or feature requests:
1. Check the test suite for examples
2. Enable debug logging for detailed information
3. Review error messages for specific guidance
4. Consult integration examples above

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Author**: Claude Code Team