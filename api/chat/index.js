const { OpenAI } = require('openai');

module.exports = async function (context, req) {
    // Initialize the response object at the beginning
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    };

    try {
        context.log('Azure Function triggered:', req.method, req.url);

        // Handle preflight OPTIONS request for CORS
        if (req.method === 'OPTIONS') {
            context.res.status = 204; // 204 No Content is standard for preflight
            return;
        }

        // Only allow POST requests
        if (req.method !== 'POST') {
            context.res.status = 405;
            context.res.body = { success: false, error: 'Method Not Allowed' };
            return;
        }
        
        context.log('Request body:', JSON.stringify(req.body));

        // Get environment variables from Function App Configuration
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-mini';
        // BEST PRACTICE: Make the API version configurable as well
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview';

        context.log('Environment check:', {
            hasApiKey: !!apiKey,
            hasEndpoint: !!endpoint,
            deployment: deployment
        });

        // Check for missing configuration
        if (!apiKey || !endpoint) {
            context.log.error('Azure OpenAI configuration is missing from environment variables.');
            context.res.status = 500;
            context.res.body = {  
                success: false,
                error: 'Server configuration error: Azure OpenAI credentials are not set.',
            };
            return;
        }

        const { prompt, type, maxTokens = 2000 } = req.body;

        if (!prompt || !type) {
            context.res.status = 400;
            context.res.body = { success: false, error: 'Missing "prompt" or "type" in request body.' };
            return;
        }

        // ===================================================================
        // CRITICAL CORRECTION: Use the recommended client initialization for Azure
        // This is the most likely fix for your 403 error.
        // ===================================================================
        const openai = new OpenAI({
            azureEndpoint: endpoint,
            azureApiKey: apiKey,
            apiVersion: apiVersion,
        });

        let systemPrompt;
        let temperature = 0.7;

        // Configure based on request type
        switch (type) {
            case 'theological_insight':
                systemPrompt = 'You are a knowledgeable Christian theologian and Bible scholar. Provide thoughtful, well-researched responses about biblical and theological topics, drawing from various Christian traditions and scholarly sources.';
                break;
            case 'chapter_summary':
                systemPrompt = 'You are a Bible scholar. Provide clear, concise summaries of biblical passages.';
                temperature = 0.3;
                break;
            case 'commentary':
                systemPrompt = 'You are a skilled biblical commentator with deep knowledge of various Christian theological traditions.';
                temperature = 0.6;
                break;
            case 'chat':
                systemPrompt = 'You are a helpful and knowledgeable Bible assistant. Be helpful and informative.';
                break;
            default:
                context.res.status = 400;
                context.res.body = { success: false, error: 'Invalid "type" parameter.' };
                return;
        }
        
        // ENHANCED LOGGING: Log the parameters being sent to OpenAI
        context.log(`Making OpenAI request with type: "${type}", temp: ${temperature}`);

        const completion = await openai.chat.completions.create({
            model: deployment, // For Azure, the model is the deployment name
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
            top_p: 0.95,
            frequency_penalty: 0,
            presence_penalty: 0,
            stop: null,
            stream: false
        });

        const responseText = completion.choices[0]?.message?.content || "No response generated.";

        context.res.status = 200;
        context.res.body = {
            success: true,
            response: responseText,
            usage: completion.usage
        };

    } catch (error) {
        context.log.error('Azure OpenAI API Error:', error);
        
        let errorMessage = 'An error occurred while processing your request.';
        let statusCode = 500;
        
        // This detailed error handling will now send a much more useful response to your front-end
        if (error.status === 403) {
            errorMessage = 'Access Denied. This could be a Firewall or IAM Role issue on your Azure OpenAI resource. Check your Azure Function and Azure OpenAI networking and access control settings.';
            statusCode = 403;
        } else if (error.status === 401) {
            errorMessage = 'Authentication Failed. The API Key is likely invalid or expired.';
            statusCode = 401;
        } else if (error.status === 404) {
            errorMessage = 'Resource Not Found. Check if the Azure OpenAI endpoint or deployment name is correct.';
            statusCode = 404;
        } else if (error.code === 'insufficient_quota') {
            errorMessage = 'Azure OpenAI quota exceeded. Please check your usage limits.';
            statusCode = 429; // 429 is more appropriate for rate limits/quota
        }

        context.res.status = statusCode;
        context.res.body = {
            success: false,
            error: errorMessage,
            details: error.message, // The raw error from the SDK
            statusCode: error.status
        };
    }
};
