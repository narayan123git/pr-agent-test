const { GoogleGenerativeAI } = require('@google/generative-ai');

async function generateAIReview(geminiKey, customRules, prTitle, prBody, diffText) {
    const userGenAI = new GoogleGenerativeAI(geminiKey);
    
    // 🎯 PRO TIP: Force Gemini to output JSON using responseMimeType
    const model = userGenAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
    You are a Senior Security & Software Engineer reviewing a GitHub Pull Request.
    
    PR TITLE: ${prTitle}
    PR DESCRIPTION: ${prBody}
    
    Analyze the following code diff. Consider the PR title and description to understand the context of these changes.
    ${customRules}
    
    You MUST return your response as a valid JSON object matching this exact structure:
    {
        "aiFeedback": "Your detailed code review in Markdown format. Mention bugs, optimizations, or LGTM.",
        "metrics": {
            "vulnerabilityCount": <number of security vulnerabilities found>,
            "bugsFound": <number of logical bugs found>,
            "performanceIssues": <number of performance bottlenecks found>
        },
        "securityStatus": "<Must be exactly 'Clean', 'Warning', or 'Critical'>"
    }

    Here is the code diff:
    ${diffText}
    `;

    const aiResponse = await model.generateContent(prompt);
    let rawText = aiResponse.response.text();

    // Strip markdown formatting if Gemini hallucinates it
    if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }

    let reviewData;
    try {
        reviewData = JSON.parse(rawText);
    } catch (parseError) {
        console.error("❌ CRITICAL: Gemini returned invalid JSON.", rawText);
        throw parseError; // Fast fail without crashing the Node process
    }

    return reviewData;
}

module.exports = {
    generateAIReview
};