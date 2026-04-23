// ============================================================
// MONGODB MODELS FOR CANDIDATE PIPELINE & INTERVIEW SCHEDULING
// ============================================================
// Tech Stack: Node.js + Express + MongoDB + Mongoose
// Features:
// 1. Candidate Pipeline Management (Applied → Shortlisted → Interview → Offered → Hired)
// 2. Interview Scheduling Integration with Google Calendar API
// ============================================================

const mongoose = require('mongoose');

// ============= CANDIDATES SCHEMA =============
const candidateSchema = new mongoose.Schema(
    {
        company_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        job_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        // Basic Information
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phone: String,
        role: String,

        // Pipeline Status
        status: {
            type: String,
            enum: ['applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'],
            default: 'applied',
            index: true
        },

        // AI-Generated Metrics
        match_score: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
            index: true
        },

        // Files & URLs
        resume_url: String,
        linkedin_url: String,

        // Notes & Metadata
        notes: String,
        skills_matched: [String],
        skills_missing: [String],

        // Timestamps
        created_at: {
            type: Date,
            default: Date.now,
            index: { expires: '90d' } // Optional TTL index
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    },
    { collection: 'candidates' }
);

// Compound index for uniqueness
candidateSchema.index({ company_id: 1, email: 1, job_id: 1 }, { unique: true });
candidateSchema.index({ created_at: -1 });

// ============= INTERVIEWS SCHEMA =============
const interviewSchema = new mongoose.Schema(
    {
        candidate_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Candidate',
            required: true
        },

        // Scheduling Details
        scheduled_date: {
            type: Date,
            required: true
        },
        duration: {
            type: Number,
            default: 60 // minutes
        },

        // Interview Type
        type: {
            type: String,
            required: true
            // Valid values: 'Technical', 'HR Round', 'Final Round', 'Culture Fit', etc.
        },

        // Interview Medium
        medium: {
            type: String,
            required: true
            // Valid values: 'Google Meet', 'Zoom', 'On-site', 'Phone'
        },

        // Interviewers
        interviewers: [String], // Array of interviewer email addresses or IDs

        // Status & Confirmation
        status: {
            type: String,
            enum: ['scheduled', 'confirmed', 'completed', 'canceled'],
            default: 'scheduled'
        },
        confirmed: {
            type: Boolean,
            default: false
        },

        // Interview Results
        score: {
            type: Number,
            min: 0,
            max: 100
        },
        feedback: String,
        notes: String,

        // Google Calendar Integration
        google_calendar_event_id: String,
        google_meet_link: String,
        zoom_join_url: String,

        // ============= EVALUATION SCORING SYSTEM (Member 2, Feature 4) =============
        evaluation_criteria: [
            {
                criterion_id: String, // e.g., "technical_skills", "communication", "problem_solving"
                criterion_name: String, // e.g., "Technical Skills"
                description: String,
                weight: Number, // 0-1, represents importance (0.3 = 30%)
                max_score: {
                    type: Number,
                    default: 100
                }
            }
        ],
        evaluation_scores: [
            {
                criterion_id: String,
                score: Number, // 0-100
                comments: String,
                scored_at: Date
            }
        ],
        overall_score: {
            type: Number,
            min: 0,
            max: 100
        },
        evaluated_by: String, // Email of the evaluator/interviewer
        evaluation_date: Date,
        evaluation_completed: {
            type: Boolean,
            default: false
        },

        // Timestamps
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    },
    { collection: 'interviews' }
);

// Indexes for performance
interviewSchema.index({ candidate_id: 1 });
interviewSchema.index({ scheduled_date: 1 });
interviewSchema.index({ status: 1 });
interviewSchema.index({ evaluation_completed: 1 });

// ============= GOOGLE OAUTH TOKENS (External APIs) =============
const googleOAuthTokenSchema = new mongoose.Schema(
    {
        user_id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        access_token: String,
        refresh_token: String,
        scope: String,
        token_type: String,
        expiry_date: Number,
        updated_at: {
            type: Date,
            default: Date.now
        }
    },
    { collection: 'google_oauth_tokens' }
);

// ============= JOB POSTINGS SCHEMA (Member 2, Feature 3) =============
const jobPostingSchema = new mongoose.Schema(
    {
        company_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },

        // Basic Job Information
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        department: String,

        // ============= SKILL TAGGING =============
        required_skills: [
            {
                skill_name: String,
                proficiency_level: String, // 'Beginner', 'Intermediate', 'Advanced', 'Expert'
                years_required: Number
            }
        ],
        nice_to_have_skills: [
            {
                skill_name: String,
                proficiency_level: String
            }
        ],

        // Job Details
        employment_type: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'],
            default: 'Full-time'
        },
        location: String,
        remote_policy: {
            type: String,
            enum: ['On-site', 'Hybrid', 'Remote'],
            default: 'Hybrid'
        },

        // Compensation
        salary_min: Number,
        salary_max: Number,
        currency: {
            type: String,
            default: 'USD'
        },

        // Status
        status: {
            type: String,
            enum: ['draft', 'open', 'closed', 'on_hold'],
            default: 'draft',
            index: true
        },

        // Metadata
        created_by: String, // Email of creator
        updated_by: String, // Email of last updater
        external_link: String, // Link to job posting on career site

        // Timestamps
        created_at: {
            type: Date,
            default: Date.now,
            index: -1
        },
        updated_at: {
            type: Date,
            default: Date.now
        },
        published_at: Date,
        closed_at: Date
    },
    { collection: 'job_postings' }
);

// Indexes
jobPostingSchema.index({ company_id: 1, status: 1 });
jobPostingSchema.index({ title: 'text', description: 'text' }); // Full-text search
jobPostingSchema.index({ 'required_skills.skill_name': 1 });

// ============= COMPANY SCHEMA (Member 1 Integration) =============
const companySchema = new mongoose.Schema(
    {
        company_name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    },
    { collection: 'companies' }
);

// ============= APPLICATION SCHEMA (Member 1 Integration) =============
const applicationSchema = new mongoose.Schema(
    {
        company_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true
        },
        candidate_name: {
            type: String
        },
        job_title: {
            type: String
        },
        status: {
            type: String,
            enum: [
                'applied',
                'shortlisted',
                'interview',
                'offered',
                'hired',
                'rejected'
            ],
            default: 'applied'
        },
        hiring_cost: {
            type: Number,
            default: 0
        },
        applied_date: {
            type: Date,
            default: Date.now
        },
        hired_date: {
            type: Date,
            default: null
        },
        created_at: {
            type: Date,
            default: Date.now
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
    },
    { collection: 'applications' }
);

// ============= MODELS =============
const Candidate = mongoose.model('Candidate', candidateSchema);
const Interview = mongoose.model('Interview', interviewSchema);
const JobPosting = mongoose.model('JobPosting', jobPostingSchema);
const GoogleOAuthToken = mongoose.model('GoogleOAuthToken', googleOAuthTokenSchema);
const Company = mongoose.model('Company', companySchema);
const Application = mongoose.model('Application', applicationSchema);

module.exports = {
    Candidate,
    Interview,
    JobPosting,
    GoogleOAuthToken,
    Company,
    Application
};
