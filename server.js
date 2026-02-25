require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express'); // Notice we removed swagger-jsdoc
const cors = require('cors'); // 1. IMPORT CORS

// Route Imports
const authRoutes = require('./routes/authRoutes');
const sopRoutes = require('./routes/sopRoutes');
const userRoutes = require('./routes/userRoutes');


const app = express();
app.use(cors());
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
        },
        '/api/users': {
            get: {
                summary: 'Get all users (Admin only)',
                tags: ['Users'],
                responses: { '200': { description: 'List of users' } }
            },
            post: {
                summary: 'Create a new user (Admin only)',
                tags: ['Users'],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    username: { type: 'string' },
                                    password: { type: 'string' },
                                    system: { type: 'string', enum: ['STEM', 'SOP_Intelligence', 'Admin'] },
                                    role: { type: 'string', enum: ['Supervisor', 'Operator', 'Admin', 'QA'] }
                                }
                            }
                        }
                    }
                },
                responses: { '201': { description: 'User created successfully' } }
            }
        },
        '/api/users/{id}': {
            get: {
                summary: 'Get a single user by ID (Admin only)',
                tags: ['Users'],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { '200': { description: 'User data' } }
            },
            put: {
                summary: 'Update a user (Admin only)',
                tags: ['Users'],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    role: { type: 'string' },
                                    system: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: { '200': { description: 'User updated' } }
            },
            delete: {
                summary: 'Delete a user (Admin only)',
                tags: ['Users'],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { '200': { description: 'User deleted' } }
            }
        }

    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// ==========================================

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/sops', sopRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DMAC Layer running on port ${PORT}`));