module.exports = async function (context, req) {
    context.log('Test function called');
    
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        status: 200,
        body: {
            success: true,
            message: 'API is working!',
            timestamp: new Date().toISOString(),
            environment: {
                hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
                hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
                hasDeployment: !!process.env.DEPLOYMENT_NAME
            }
        }
    };
};