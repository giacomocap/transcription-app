import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Your API Title',
            version: '1.0.0',
            description: 'Your API description',
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
            },
        ],
    },
    apis: ['./src/routes.ts'], // Adjust path as needed
};

let specs: object;
try {
    specs = swaggerJsdoc(options);
} catch (error) {
    console.error('Error generating Swagger specs:', error);
    specs = {}; // Fallback if generation fails
}

export default specs;
