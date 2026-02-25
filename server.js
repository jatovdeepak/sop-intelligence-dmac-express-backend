require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express'); // Notice we removed swagger-jsdoc

// Route Imports
const authRoutes = require('./routes/authRoutes');
const sopRoutes = require('./routes/sopRoutes');

const app = express();
app.use(express.json());

// Connect Database
connectDB();

// ==========================================
// SWAGGER UI CONFIGURATION (Pure JavaScript)
// ==========================================
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'DMAC Gatekeeper API',
        version: '1.0.0',
        description: 'API Documentation for SOP Intelligence and STEM interaction',
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        '/api/sops': {
            get: {
                summary: 'Retrieve available SOPs',
                tags: ['SOPs'],
                responses: { '200': { description: 'A list of SOPs based on user role and system' } }
            },
            post: {
                summary: 'Create a new SOP with optional PDF upload',
                tags: ['SOPs'],
                requestBody: {
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string' },
                                    content: { type: 'string', description: 'Must be valid JSON string' },
                                    status: { type: 'string' },
                                    requiredRoles: { type: 'string', description: 'Enter a role (e.g., Manager)' },
                                    pdf: { type: 'string', format: 'binary' }
                                }
                            }
                        }
                    }
                },
                responses: { '201': { description: 'Created SOP' } }
            }
        },
        '/api/sops/{id}': {
            get: {
                summary: 'Get a specific SOP by ID',
                tags: ['SOPs'],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { '200': { description: 'SOP data' } }
            }
        },
        '/api/sops/{id}/pdf': {
            get: {
                summary: 'Download the SOP PDF',
                tags: ['SOPs'],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: {
                    '200': { description: 'The PDF file' },
                    '404': { description: 'No PDF found' }
                }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// ==========================================

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/sops', sopRoutes); // STEM requests hit this layer

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DMAC Layer running on port ${PORT}`));