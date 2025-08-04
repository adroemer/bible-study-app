const { OpenAI } = require('openai');

module.exports = async function (context, req) {
    try {
        context.log('Azure Function triggered:', req.method, req.url);
        context.log('Request body:', JSON.stringify(req.body));
        
        // Set CORS headers
        context.res = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        };

        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            context.res.status = 200;
            return;
        }

        if (req.method !== 'POST') {
            context.res = {
                ...context.res,
                status: 405,
                body: { error: 'Method not allowed' }
            };
            return;
        }

        // Get environment variables (server-side only)
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const deployment = process.env.DEPLOYMENT_NAME || 'gpt-4o-mini';

        context.log('Environment check:', {
            hasApiKey: !!apiKey,
            hasEndpoint: !!endpoint,
            deployment: deployment
        });

        if (!apiKey || !endpoint) {
            context.res = {
                ...context.res,
                status: 500,
                body: { 
                    success: false,
                    error: 'Azure OpenAI configuration missing',
                    config: {
                        hasApiKey: !!apiKey,
                        hasEndpoint: !!endpoint,
                        deployment: deployment
                    }
                }
            };
            return;
        }

        const { prompt, type, maxTokens = 2000 } = req.body;

        if (!prompt || !type) {
            context.res = {
                ...context.res,
                status: 400,
                body: { error: 'Missing prompt or type parameter' }
            };
            return;
        }

        // Initialize OpenAI client (server-side, no dangerouslyAllowBrowser needed)
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: `${endpoint}openai/deployments/${deployment}`,
            defaultQuery: { 'api-version': '2025-01-01-preview' },
            defaultHeaders: {
                'api-key': apiKey,
            },
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
                context.res = {
                    ...context.res,
                    status: 400,
                    body: { error: 'Invalid type parameter' }
                };
                return;
        }

        context.log('Making OpenAI request...');

        const completion = await openai.chat.completions.create({
            model: deployment,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
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

        context.res = {
            ...context.res,
            status: 200,
            body: {
                success: true,
                response: responseText,
                usage: completion.usage
            }
        };

    } catch (error) {
        context.log.error('Azure OpenAI API Error:', error);
        
        let errorMessage = 'An error occurred while processing your request.';
        let statusCode = 500;

        if (error.code === 'insufficient_quota') {
            errorMessage = 'Azure OpenAI quota exceeded. Please check your usage limits.';
        } else if (error.status === 403) {
            errorMessage = 'Access denied. This could be due to: 1) Network/Firewall restrictions on your Azure OpenAI service, 2) API key permissions, or 3) Incorrect endpoint/deployment configuration.';
            statusCode = 403;
        } else if (error.status === 401) {
            errorMessage = 'Authentication failed. Please check your API key configuration.';
            statusCode = 401;
        } else if (error.status === 404) {
            errorMessage = 'Resource not found. Please check your endpoint URL and deployment name.';
            statusCode = 404;
        }

        context.res = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            status: statusCode,
            body: {
                success: false,
                error: errorMessage,
                details: error.message,
                statusCode: error.status,
                config: {
                    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                    deployment: process.env.DEPLOYMENT_NAME || 'gpt-4o-mini',
                    hasApiKey: !!process.env.AZURE_OPENAI_API_KEY
                }
            }
        };
    }
};