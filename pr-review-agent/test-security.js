// test-security.js

async function runSecurityTests() {
    // We can test locally, no need to spam the Pinggy tunnel
    const targetUrl = 'http://localhost:3000/webhook';

    console.log("🛡️  Starting Automated Security Audit...\n");

    // --- TEST 1: HELMET (Header Inspection) ---
    console.log("--- TEST 1: Inspecting Helmet Headers ---");
    try {
        const headerRes = await fetch(targetUrl, { method: 'POST' });
        
        // Express normally broadcasts that it is running Express. Helmet removes this.
        const poweredBy = headerRes.headers.get('x-powered-by');
        // Helmet adds strict security policies. Let's check for one.
        const dnsPrefetch = headerRes.headers.get('x-dns-prefetch-control');

        if (poweredBy === null && dnsPrefetch === 'off') {
            console.log("✅ Helmet is WORKING: Server identity hidden and security headers injected.\n");
        } else {
            console.log("❌ Helmet failed: Headers are exposing server details.\n");
        }
    } catch (error) {
        console.log("Error connecting to server for Test 1.");
    }

    // --- TEST 2: RATE LIMITING (DDoS Simulation) ---
    console.log("--- TEST 2: Simulating DDoS (Rate Limiter Test) ---");
    console.log("Sending 7 rapid requests (Our limit is 5)...\n");

    for (let i = 1; i <= 7; i++) {
        try {
            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // We simulate a GitHub event header so the server tries to process it
                    'x-github-event': 'ping' 
                },
                body: JSON.stringify({ action: "opened" }) 
            });

            if (res.status === 429) {
                console.log(`Request ${i}: 🛑 BLOCKED by Rate Limiter! (429 Too Many Requests)`);
            } else if (res.status === 200) {
                console.log(`Request ${i}: ✅ Passed (200 OK)`);
            } else {
                console.log(`Request ${i}: ⚠️ Unexpected Status (${res.status})`);
            }
        } catch (error) {
            console.error(`Request ${i}: Failed to connect.`);
        }
    }
    
    console.log("\n🏁 Security Audit Complete.");
}

runSecurityTests();