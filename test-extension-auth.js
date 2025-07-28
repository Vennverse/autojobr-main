// Simple test script to verify Chrome extension authentication
const API_BASE = 'http://40.160.50.128';

async function testExtensionAuth() {
    console.log('🧪 Testing Chrome Extension Authentication System');
    console.log('================================================');
    
    try {
        // Step 1: Test token generation
        console.log('1. Testing token generation...');
        const tokenResponse = await fetch(`${API_BASE}/api/auth/extension-token`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Token response status: ${tokenResponse.status}`);
        
        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            const token = tokenData.token;
            console.log(`   ✅ Token generated: ${token.substring(0, 16)}...`);
            
            // Step 2: Test extension user endpoint
            console.log('2. Testing extension user endpoint...');
            const userResponse = await fetch(`${API_BASE}/api/extension/user?token=${token}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Extension-Token': token
                }
            });

            console.log(`   User response status: ${userResponse.status}`);
            
            if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log(`   ✅ User authenticated: ${userData.email}`);
                console.log(`   📧 User data:`, userData);
                
                console.log('\n🎉 SUCCESS: Chrome Extension Authentication Working!');
                return true;
            } else {
                const errorText = await userResponse.text();
                console.log(`   ❌ User endpoint failed: ${errorText}`);
            }
        } else {
            const errorText = await tokenResponse.text();
            console.log(`   ❌ Token generation failed: ${errorText}`);
        }
        
    } catch (error) {
        console.log(`❌ Test failed with error: ${error.message}`);
    }
    
    return false;
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testExtensionAuth };
} else if (typeof window !== 'undefined') {
    window.testExtensionAuth = testExtensionAuth;
}

// Auto-run if in Node.js environment
if (typeof require !== 'undefined' && require.main === module) {
    testExtensionAuth();
}