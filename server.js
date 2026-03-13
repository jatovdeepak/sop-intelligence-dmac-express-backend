require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express'); // Notice we removed swagger-jsdoc
const cors = require('cors'); // 1. IMPORT CORS

// Route Imports
const authRoutes = require('./routes/authRoutes');
const sopRoutes = require('./routes/sopRoutes');
const userRoutes = require('./routes/userRoutes');
const auditRoutes = require('./routes/auditRoutes');


const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

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
                                    sopId: { type: 'string', description: 'e.g., SOP-025' },
                                    title: { type: 'string', description: 'SOP Name' },
                                    type: { type: 'string', enum: ['Quality', 'Production', 'Safety'] },
                                    version: { type: 'string', description: 'e.g., v1.0' },
                                    description: { type: 'string' },
                                    references: { type: 'string', description: 'Stringified array of SOP IDs, e.g., ["SOP-001", "SOP-002"]' }, // NEW FIELD
                                    status: { type: 'string', description: 'Active | Draft | Archived' },
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
            },
            put: {
                summary: 'Update a specific SOP by ID',
                tags: ['SOPs'],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                requestBody: {
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    title: { type: 'string', description: 'SOP Name' },
                                    type: { type: 'string', enum: ['Quality', 'Production', 'Safety'] },
                                    version: { type: 'string', description: 'e.g., v1.1' },
                                    description: { type: 'string' },
                                    references: { type: 'string', description: 'Stringified array of SOP IDs' },
                                    status: { type: 'string', enum: ['Active', 'Draft', 'Archived'] },
                                    requiredRoles: { type: 'string', description: 'Enter a role (e.g., Manager)' },
                                    pdf: { type: 'string', format: 'binary', description: 'Optional new PDF file to replace the old one' }
                                }
                            }
                        }
                    }
                },
                responses: { 
                    '200': { description: 'SOP updated successfully' },
                    '400': { description: 'Validation error or duplicate ID' },
                    '403': { description: 'Access Denied: Role lacks permissions' },
                    '404': { description: 'SOP not found' }
                }
            },
            delete: {
                summary: 'Delete a specific SOP by ID',
                tags: ['SOPs'],
                parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
                responses: { 
                    '200': { description: 'SOP deleted successfully' },
                    '404': { description: 'SOP not found' },
                    '403': { description: 'Access Denied: Role lacks permissions' }
                }
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
        },
        '/api/audit': {
            get: {
                summary: 'Retrieve all system audit logs (Admin only)',
                tags: ['Audit'],
                responses: { '200': { description: 'A list of all actions logged by the system' } }
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
app.use('/api/audit', auditRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DMAC Layer running on port ${PORT}`));