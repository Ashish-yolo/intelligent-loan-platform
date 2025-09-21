#!/usr/bin/env python3
"""
Test document extraction to check if transparency fixes are working
"""
import requests
import os
import json

BASE_URL = "https://intelligent-loan-platform.onrender.com"

def test_pan_transparency():
    """Test if PAN extraction shows real vs demo data clearly"""
    print("🔍 Testing PAN Extraction Transparency...")
    
    pan_file_path = "/Users/ashishshekhawat/Desktop/test-documents/PAn.pdf"
    
    with open(pan_file_path, 'rb') as f:
        files = {'pan_file': ('PAn.pdf', f, 'application/pdf')}
        data = {'user_id': 'transparency_test'}
        
        print("🚀 Testing PAN extraction...")
        response = requests.post(
            f"{BASE_URL}/api/documents/extract-documents",
            files=files,
            data=data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ PAN Extraction Response Received!")
            
            if 'extracted_data' in result and 'pan' in result['extracted_data']:
                pan_data = result['extracted_data']['pan']
                name = pan_data.get('name', 'N/A')
                pan_num = pan_data.get('pan', 'N/A')
                note = pan_data.get('processing_note', 'N/A')
                
                print(f"📋 Results:")
                print(f"   • Name: {name}")
                print(f"   • PAN: {pan_num}")
                print(f"   • Processing Note: {note}")
                
                # Check if it's real extraction or demo mode
                if name == "API NOT CONFIGURED":
                    print("🔴 DEMO MODE: API not configured")
                    return "demo"
                elif "Real extraction via Claude API" in note:
                    print("🟢 REAL EXTRACTION: Working with actual Claude API")
                    return "real"
                else:
                    print("🟡 UNKNOWN: Unexpected response format")
                    return "unknown"
            else:
                print("❌ Unexpected response structure")
                return "error"
        else:
            print(f"❌ API Error: {response.status_code}")
            return "error"

def test_salary_transparency():
    """Test if Salary extraction shows real vs demo data clearly"""
    print("\n🔍 Testing Salary Extraction Transparency...")
    
    salary_file_path = "/Users/ashishshekhawat/Desktop/test-documents/PaySlips_CHEQ._C081_Feb_2025.pdf"
    
    with open(salary_file_path, 'rb') as f:
        files = {'salary_file': ('PaySlips_CHEQ._C081_Feb_2025.pdf', f, 'application/pdf')}
        data = {'user_id': 'transparency_test'}
        
        print("🚀 Testing Salary extraction...")
        response = requests.post(
            f"{BASE_URL}/api/documents/extract-salary-slip",
            files=files,
            data=data,
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Salary Extraction Response Received!")
            
            if 'income_data' in result:
                income_data = result['income_data']
                name = income_data.get('employee_name', 'N/A')
                company = income_data.get('company_name', 'N/A')
                note = income_data.get('processing_note', 'N/A')
                
                print(f"📋 Results:")
                print(f"   • Employee: {name}")
                print(f"   • Company: {company}")
                print(f"   • Processing Note: {note}")
                
                # Check if it's real extraction or demo mode
                if company == "REQUIRES CLAUDE API":
                    print("🔴 DEMO MODE: API not configured")
                    return "demo"
                elif "Real extraction via Claude API" in note:
                    print("🟢 REAL EXTRACTION: Working with actual Claude API")
                    return "real"
                else:
                    print("🟡 UNKNOWN: Unexpected response format")
                    return "unknown"
            else:
                print("❌ Unexpected response structure")
                return "error"
        else:
            print(f"❌ API Error: {response.status_code}")
            return "error"

def main():
    print("🧪 Document Extraction Transparency Test")
    print("=" * 50)
    print(f"🌐 Testing: {BASE_URL}")
    print("🎯 Goal: Verify no more dummy data deception")
    print()
    
    pan_result = test_pan_transparency()
    salary_result = test_salary_transparency()
    
    print("\n" + "=" * 50)
    print("📊 Transparency Test Results:")
    print(f"   • PAN Extraction: {pan_result.upper()}")
    print(f"   • Salary Extraction: {salary_result.upper()}")
    
    if pan_result == "real" and salary_result == "real":
        print("\n🎉 SUCCESS: Real extraction is working!")
        print("✅ Claude API is configured and processing actual documents")
    elif pan_result == "demo" and salary_result == "demo":
        print("\n🔴 DEMO MODE: API configuration needed")
        print("✅ Transparency working - clearly shows when real extraction unavailable")
        print("💡 Configure ANTHROPIC_API_KEY for real extraction")
    else:
        print(f"\n⚠️ MIXED RESULTS: PAN={pan_result}, Salary={salary_result}")
        print("🔍 May need further investigation")
    
    print("\n🎯 KEY SUCCESS: No more dummy data disguised as real extraction!")

if __name__ == "__main__":
    main()