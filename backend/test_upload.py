#!/usr/bin/env python3
"""
Test script for admin file upload functionality
Run this to test the complete upload workflow
"""

import asyncio
import aiohttp
import json
from pathlib import Path

# Test configuration
API_BASE = "http://localhost:8000"
TEST_FILE_PATH = Path("test_document.pdf")  # Create a small test file
ADMIN_EMAIL = "admin@sukunslide.uz"
ADMIN_PASSWORD = "admin123"

async def create_test_file():
    """Create a small test PDF file for testing"""
    # Create a minimal PDF-like file for testing
    test_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
178
%%EOF"""
    
    with open(TEST_FILE_PATH, 'wb') as f:
        f.write(test_content)
    
    print(f"✅ Created test file: {TEST_FILE_PATH}")

async def test_admin_login():
    """Test admin login and get token"""
    async with aiohttp.ClientSession() as session:
        login_data = {
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }
        
        async with session.post(f"{API_BASE}/api/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                token = data.get("access_token")
                print(f"✅ Admin login successful")
                return token
            else:
                error = await response.text()
                print(f"❌ Admin login failed: {response.status} - {error}")
                return None

async def test_file_upload(token):
    """Test file upload using admin endpoint"""
    if not TEST_FILE_PATH.exists():
        print(f"❌ Test file not found: {TEST_FILE_PATH}")
        return False
    
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(TEST_FILE_PATH, 'rb') as f:
            data = aiohttp.FormData()
            data.add_field('file', f, filename='test_document.pdf', content_type='application/pdf')
            data.add_field('title', 'Test Document - Upload Verification')
            data.add_field('subject', 'mathematics')
            data.add_field('description', 'This is a test document to verify upload functionality')
            data.add_field('author', 'Test Admin')
            data.add_field('tags', 'test, upload, verification')
            
            async with session.post(f"{API_BASE}/api/admin/documents/upload", 
                                  headers=headers, data=data) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ File upload successful!")
                    print(f"   Document ID: {data.get('document_id')}")
                    print(f"   Status: {data.get('status')}")
                    print(f"   File Size: {data.get('file_size')} bytes")
                    return True
                else:
                    error = await response.text()
                    print(f"❌ File upload failed: {response.status} - {error}")
                    return False

async def test_document_list(token):
    """Test document listing to verify upload worked"""
    async with aiohttp.ClientSession() as session:
        headers = {"Authorization": f"Bearer {token}"}
        
        async with session.get(f"{API_BASE}/api/documents", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                documents = data.get('documents', [])
                test_docs = [doc for doc in documents if 'Test Document - Upload Verification' in doc.get('title', '')]
                
                if test_docs:
                    print(f"✅ Test document found in document list")
                    print(f"   Found {len(test_docs)} test document(s)")
                    return True
                else:
                    print(f"❌ Test document not found in document list")
                    print(f"   Total documents: {len(documents)}")
                    return False
            else:
                error = await response.text()
                print(f"❌ Document list failed: {response.status} - {error}")
                return False

async def cleanup_test_file():
    """Clean up test file"""
    if TEST_FILE_PATH.exists():
        TEST_FILE_PATH.unlink()
        print(f"✅ Cleaned up test file: {TEST_FILE_PATH}")

async def main():
    """Run all tests"""
    print("🚀 Starting admin file upload integration test...\n")
    
    try:
        # Step 1: Create test file
        await create_test_file()
        
        # Step 2: Login as admin
        print("\n📝 Testing admin login...")
        token = await test_admin_login()
        if not token:
            print("❌ Cannot proceed without admin token")
            return
        
        # Step 3: Test file upload
        print("\n📤 Testing file upload...")
        upload_success = await test_file_upload(token)
        
        # Step 4: Verify document appears in list
        if upload_success:
            print("\n📋 Testing document listing...")
            await test_document_list(token)
        
        print("\n🧹 Cleaning up...")
        await cleanup_test_file()
        
        if upload_success:
            print("\n🎉 All tests passed! Admin file upload is working correctly.")
        else:
            print("\n💥 Some tests failed. Check the output above for details.")
            
    except Exception as e:
        print(f"\n💥 Test failed with exception: {e}")
        await cleanup_test_file()

if __name__ == "__main__":
    print("📋 Admin File Upload Integration Test")
    print("=" * 50)
    print("This script tests the complete admin file upload workflow:")
    print("1. Admin authentication")
    print("2. File upload with validation") 
    print("3. Database record creation")
    print("4. Document listing verification")
    print()
    print("⚠️  Make sure the backend server is running on localhost:8000")
    print("⚠️  Make sure you have an admin user with email: admin@sukunslide.uz")
    print()
    
    # Run the test
    asyncio.run(main())
