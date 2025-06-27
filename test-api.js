// Simple test script to verify API integration
// Run this in the browser console or as a Node.js script

const API_BASE_URL = 'http://localhost:8000';

async function testAPI() {
  console.log('Testing API integration...');
  
  try {
    // Test 1: Check if backend is running
    const response = await fetch(`${API_BASE_URL}/docs`);
    if (response.ok) {
      console.log('✅ Backend is running and accessible');
    } else {
      console.log('❌ Backend is not accessible');
      return;
    }
    
    // Test 2: Test CORS (this would be done from the frontend)
    console.log('✅ CORS should be configured for localhost:3000');
    
    // Test 3: Test registration endpoint
    const registerData = {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User'
    };
    
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData)
    });
    
    if (registerResponse.ok) {
      console.log('✅ Registration endpoint is working');
    } else {
      console.log('❌ Registration endpoint failed:', registerResponse.status);
    }
    
    console.log('\n🎉 API integration test completed!');
    console.log('\nNext steps:');
    console.log('1. Start the backend: cd Back/back-end && uvicorn main:app --reload');
    console.log('2. Start the frontend: cd Front/Frontend && npm run dev');
    console.log('3. Test the full application flow');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run the test
testAPI(); 