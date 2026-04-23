require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const backendRoutes = require('./backend-routes');
const externalAPIsRoutes = require('./externalAPIsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// ============= DATABASE CONNECTION =============
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recruitment_db';
        console.log('Connecting to MongoDB...');

        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    }
};

// Connect to database before starting server
connectDB();

// Use Helmet for security headers and Compression for gzip payloads
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend from the backend public folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('TalentFlow API is running');
});

// API routes
app.use('/api', backendRoutes);

// External APIs routes (Google Calendar, Meet, Zoom)
app.use('/api/external', externalAPIsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// Fallback for SPA: serve index.html for any non-API, non-static route
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 TalentFlow backend running at http://localhost:${PORT}`);
});
