-- Intelligent Loan Platform Database Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loan applications table
CREATE TABLE loan_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requested_amount DECIMAL(12,2) NOT NULL,
    purpose VARCHAR(100) NOT NULL,
    monthly_income DECIMAL(10,2) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    employment_years DECIMAL(4,2) NOT NULL,
    age INTEGER NOT NULL,
    preferred_tenure INTEGER NOT NULL,
    income_sources JSONB DEFAULT '[]',
    additional_info JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    
    -- Approved terms (filled after underwriting)
    approved_amount DECIMAL(12,2),
    approved_interest_rate DECIMAL(5,2),
    approved_tenure INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    underwriting_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_amount CHECK (requested_amount > 0),
    CONSTRAINT valid_income CHECK (monthly_income > 0),
    CONSTRAINT valid_age CHECK (age >= 18 AND age <= 80),
    CONSTRAINT valid_tenure CHECK (preferred_tenure > 0 AND preferred_tenure <= 60),
    CONSTRAINT valid_employment_years CHECK (employment_years >= 0)
);

-- Policy decisions table
CREATE TABLE policy_decisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL,
    approved_amount DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    tenure_months INTEGER,
    foir DECIMAL(5,4),
    risk_scale_factor DECIMAL(5,3),
    conditions JSONB DEFAULT '[]',
    reasons JSONB DEFAULT '[]',
    policy_version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy documents/rules (for versioning)
CREATE TABLE policy_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Documents table (for uploaded files)
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100),
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'uploaded',
    analysis_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bureau data table
CREATE TABLE bureau_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID REFERENCES loan_applications(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI analysis table (for tracking AI decisions)
CREATE TABLE ai_analysis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    application_id UUID REFERENCES loan_applications(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    output_data JSONB NOT NULL,
    model_version VARCHAR(50),
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_created_at ON loan_applications(created_at);
CREATE INDEX idx_policy_decisions_application_id ON policy_decisions(application_id);
CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_bureau_data_application_id ON bureau_data(application_id);
CREATE INDEX idx_audit_logs_application_id ON audit_logs(application_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_ai_analysis_application_id ON ai_analysis(application_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bureau_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified for API access)
CREATE POLICY "Allow all operations for authenticated users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON loan_applications FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON policy_decisions FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON bureau_data FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON ai_analysis FOR ALL USING (true);
CREATE POLICY "Allow read access to policy documents" ON policy_documents FOR SELECT USING (true);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_applications_updated_at BEFORE UPDATE ON loan_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Analytics function for application metrics
CREATE OR REPLACE FUNCTION get_application_metrics(
    date_from DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    date_to DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_applications BIGINT,
    approved_applications BIGINT,
    rejected_applications BIGINT,
    pending_applications BIGINT,
    avg_processing_time INTERVAL,
    total_approved_amount DECIMAL(15,2),
    avg_approved_amount DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH app_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'approved') as approved,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
            COUNT(*) FILTER (WHERE status IN ('draft', 'submitted', 'under_review')) as pending,
            AVG(EXTRACT(EPOCH FROM (underwriting_completed_at - submitted_at)) * INTERVAL '1 second') 
                FILTER (WHERE underwriting_completed_at IS NOT NULL AND submitted_at IS NOT NULL) as avg_time,
            SUM(approved_amount) FILTER (WHERE status = 'approved') as total_amount,
            AVG(approved_amount) FILTER (WHERE status = 'approved') as avg_amount
        FROM loan_applications 
        WHERE created_at::date BETWEEN date_from AND date_to
    )
    SELECT 
        total::BIGINT,
        approved::BIGINT,
        rejected::BIGINT,
        pending::BIGINT,
        avg_time,
        COALESCE(total_amount, 0)::DECIMAL(15,2),
        COALESCE(avg_amount, 0)::DECIMAL(12,2)
    FROM app_stats;
END;
$$ LANGUAGE plpgsql;

-- Insert sample policy document
INSERT INTO policy_documents (version, document_type, content, is_active) VALUES 
(
    '1.0', 
    'credit_policy', 
    '{
        "hard_reject_rules": {
            "min_income": 25000,
            "min_credit_score": 650,
            "min_age": 21,
            "max_age": 65
        },
        "waterfall_policy": {
            "max_foir": 0.55,
            "risk_factors": {
                "excellent": 0.8,
                "good": 0.9,
                "fair": 1.0,
                "poor": 1.1
            }
        }
    }', 
    true
);

-- Success message
SELECT 'Intelligent Loan Platform Database Schema Created Successfully! 🎉' as message;