// Debug script to test registration endpoint
// Run this in the browser console or as a Node.js script

const API_BASE_URL = 'http://localhost:8000';

async function debugRegistration() {
  console.log('🔍 Debugging registration endpoint...');
  
  const testData = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'testpassword123'
  };
  
  console.log('📤 Sending data:', testData);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ Error:', errorData);
      
      // Log detailed validation errors
      if (errorData.detail) {
        console.log('🔍 Validation errors:');
        errorData.detail.forEach((error, index) => {
          console.log(`  ${index + 1}. Field: ${error.loc.join('.')}`);
          console.log(`     Type: ${error.type}`);
          console.log(`     Message: ${error.msg}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Network error:', error);
  }
}

// Run the debug
debugRegistration(); 