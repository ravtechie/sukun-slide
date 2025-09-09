-- Sukun Slide Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    university VARCHAR,
    phone VARCHAR,
    role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    icon VARCHAR,
    color VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    description TEXT,
    subject_id VARCHAR REFERENCES subjects(id),
    format VARCHAR NOT NULL CHECK (format IN ('pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx')),
    file_path VARCHAR NOT NULL,
    file_size BIGINT,
    author VARCHAR,
    tags TEXT[], -- Array of tags
    download_count INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads tracking
CREATE TABLE downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    document_id UUID REFERENCES documents(id),
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Favorites
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    document_id UUID REFERENCES documents(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, document_id)
);

-- Admin activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    key VARCHAR PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_documents_subject ON documents(subject_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_downloads_user_id ON downloads(user_id);
CREATE INDEX idx_downloads_document_id ON downloads(document_id);
CREATE INDEX idx_downloads_downloaded_at ON downloads(downloaded_at);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subjects
INSERT INTO subjects (id, name, description, icon, color) VALUES
('mathematics', 'Matematika', 'Matematik fanlar', 'fas fa-calculator', '#3b82f6'),
('physics', 'Fizika', 'Fizika fani', 'fas fa-atom', '#8b5cf6'),
('chemistry', 'Kimyo', 'Kimyo fani', 'fas fa-flask', '#10b981'),
('biology', 'Biologiya', 'Biologiya fani', 'fas fa-dna', '#f59e0b'),
('history', 'Tarix', 'Tarix fani', 'fas fa-landmark', '#ef4444'),
('geography', 'Geografiya', 'Geografiya fani', 'fas fa-globe', '#06b6d4'),
('literature', 'Adabiyot', 'Adabiyot fani', 'fas fa-book', '#ec4899'),
('english', 'Ingliz tili', 'Ingliz tili', 'fas fa-language', '#84cc16');

-- Insert default system settings
INSERT INTO system_settings (key, value) VALUES
('site_name', '"Sukun Slide"'),
('site_description', '"Ta''lim resurslari platformasi"'),
('max_file_size', '52428800'),
('allowed_formats', '["pdf", "ppt", "pptx", "doc", "docx", "xls", "xlsx"]'),
('auto_approve', 'false'),
('require_auth', 'true'),
('maintenance_mode', 'false');

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- Documents policies
CREATE POLICY "Anyone can view approved documents" ON documents FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can upload documents" ON documents FOR INSERT WITH CHECK (auth.uid()::text = uploaded_by::text);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid()::text = uploaded_by::text);
CREATE POLICY "Admins can manage all documents" ON documents FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- Downloads policies
CREATE POLICY "Users can view own downloads" ON downloads FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can record downloads" ON downloads FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Favorites policies
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid()::text = user_id::text);

-- Activity logs policies (admin only)
CREATE POLICY "Admins can view activity logs" ON activity_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- Subjects are public (read-only for users, full access for admins)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- System settings (admin only)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);
