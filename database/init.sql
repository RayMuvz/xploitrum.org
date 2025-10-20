-- XploitRUM CTF Platform Database Initialization
-- This script sets up the initial database structure and data

-- Create database if it doesn't exist
-- CREATE DATABASE xploitrum;

-- Connect to the database
-- \c xploitrum;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_category AS ENUM ('web', 'crypto', 'pwn', 'reverse', 'forensics', 'osint', 'misc', 'ml', 'mobile', 'network');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_difficulty AS ENUM ('easy', 'medium', 'hard', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('draft', 'active', 'disabled', 'maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE instance_status AS ENUM ('starting', 'running', 'stopped', 'error', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM ('correct', 'incorrect', 'duplicate', 'invalid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_level AS ENUM ('debug', 'info', 'warning', 'error', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_event_type AS ENUM ('user_login', 'user_logout', 'user_register', 'challenge_deploy', 'challenge_stop', 'flag_submit', 'vpn_connect', 'vpn_disconnect', 'admin_action', 'system_event', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    role user_role DEFAULT 'user' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    country VARCHAR(100),
    university VARCHAR(255),
    github_username VARCHAR(100),
    linkedin_url VARCHAR(500),
    website_url VARCHAR(500),
    score INTEGER DEFAULT 0 NOT NULL,
    rank INTEGER,
    total_solves INTEGER DEFAULT 0 NOT NULL,
    total_attempts INTEGER DEFAULT 0 NOT NULL,
    vpn_profile_created BOOLEAN DEFAULT FALSE NOT NULL,
    vpn_profile_path VARCHAR(500),
    vpn_last_connected TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category challenge_category NOT NULL,
    difficulty challenge_difficulty NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    flag VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    docker_image VARCHAR(255),
    docker_compose_file TEXT,
    docker_ports JSONB,
    docker_environment JSONB,
    docker_volumes JSONB,
    max_instances INTEGER DEFAULT 10 NOT NULL,
    instance_timeout INTEGER DEFAULT 3600 NOT NULL,
    max_solves INTEGER,
    attachments JSONB,
    hints JSONB,
    tags JSONB,
    total_solves INTEGER DEFAULT 0 NOT NULL,
    total_attempts INTEGER DEFAULT 0 NOT NULL,
    solve_percentage INTEGER DEFAULT 0 NOT NULL,
    status challenge_status DEFAULT 'draft' NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE
);

-- Create instances table
CREATE TABLE IF NOT EXISTS instances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    container_id VARCHAR(255) UNIQUE,
    container_name VARCHAR(255),
    container_ip VARCHAR(45),
    container_ports JSONB,
    status instance_status DEFAULT 'starting' NOT NULL,
    instance_url VARCHAR(500),
    vpn_required BOOLEAN DEFAULT FALSE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    stopped_at TIMESTAMP WITH TIME ZONE,
    cpu_usage INTEGER DEFAULT 0 NOT NULL,
    memory_usage INTEGER DEFAULT 0 NOT NULL,
    network_traffic INTEGER DEFAULT 0 NOT NULL,
    logs TEXT,
    error_message TEXT,
    health_check_status VARCHAR(50),
    last_health_check TIMESTAMP WITH TIME ZONE,
    auto_cleanup BOOLEAN DEFAULT TRUE NOT NULL,
    cleanup_attempts INTEGER DEFAULT 0 NOT NULL
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    instance_id INTEGER REFERENCES instances(id) ON DELETE SET NULL,
    flag VARCHAR(500) NOT NULL,
    status submission_status NOT NULL,
    points_awarded INTEGER DEFAULT 0 NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    notes TEXT
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    event_type log_event_type NOT NULL,
    level log_level DEFAULT 'info' NOT NULL,
    message TEXT NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_score ON users(score DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON challenges(is_featured);
CREATE INDEX IF NOT EXISTS idx_challenges_premium ON challenges(is_premium);
CREATE INDEX IF NOT EXISTS idx_challenges_points ON challenges(points);

CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_challenge_id ON instances(challenge_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_container_id ON instances(container_id);
CREATE INDEX IF NOT EXISTS idx_instances_expires_at ON instances(expires_at);

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

CREATE INDEX IF NOT EXISTS idx_logs_event_type ON logs(event_type);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update user ranks
CREATE OR REPLACE FUNCTION update_user_ranks()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET rank = subquery.rank
    FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, total_solves DESC, created_at ASC) as rank
        FROM users
        WHERE status = 'active'
    ) AS subquery
    WHERE users.id = subquery.id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ranks when scores change
CREATE TRIGGER update_ranks_trigger 
    AFTER UPDATE OF score, total_solves ON users
    FOR EACH STATEMENT EXECUTE FUNCTION update_user_ranks();

-- Create function to update challenge solve percentage
CREATE OR REPLACE FUNCTION update_challenge_solve_percentage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE challenges 
    SET solve_percentage = CASE 
        WHEN total_attempts > 0 THEN ROUND((total_solves::DECIMAL / total_attempts) * 100)
        ELSE 0
    END
    WHERE id = COALESCE(NEW.challenge_id, OLD.challenge_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update solve percentage when submissions change
CREATE TRIGGER update_solve_percentage_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_challenge_solve_percentage();

-- Insert initial admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role, status, email_verified)
VALUES (
    'admin',
    'admin@xploitrum.org',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6VqQz8LQ3m', -- admin123
    'System Administrator',
    'admin',
    'active',
    true
) ON CONFLICT (username) DO NOTHING;

-- Insert sample challenges
INSERT INTO challenges (title, description, category, difficulty, points, flag, author, status, is_featured)
VALUES 
(
    'Welcome Challenge',
    'This is a simple welcome challenge to get you started. The flag is hidden in the description.',
    'misc',
    'easy',
    10,
    'XPLOITRUM{welcome_to_xploitrum_ctf_platform}',
    'XploitRUM Team',
    'active',
    true
),
(
    'Basic Web Challenge',
    'A simple web application with a vulnerability. Can you find the flag?',
    'web',
    'easy',
    50,
    'XPLOITRUM{basic_sql_injection_found}',
    'XploitRUM Team',
    'active',
    false
),
(
    'Crypto Puzzle',
    'Decrypt this message to find the flag: V1BMb0lUUlVNe2NyeXB0b19pc19mdW59',
    'crypto',
    'medium',
    100,
    'XPLOITRUM{crypto_is_fun}',
    'XploitRUM Team',
    'active',
    false
),
(
    'Binary Reversing',
    'Reverse engineer this binary to find the hidden flag.',
    'reverse',
    'hard',
    200,
    'XPLOITRUM{reverse_engineering_master}',
    'XploitRUM Team',
    'active',
    true
),
(
    'Network Forensics',
    'Analyze this network capture to find the suspicious activity and extract the flag.',
    'forensics',
    'medium',
    150,
    'XPLOITRUM{network_analysis_success}',
    'XploitRUM Team',
    'active',
    false
)
ON CONFLICT DO NOTHING;

-- Insert sample log entry
INSERT INTO logs (event_type, level, message, user_id)
VALUES (
    'system_event',
    'info',
    'Database initialized successfully',
    (SELECT id FROM users WHERE username = 'admin')
);

-- Create views for common queries
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    u.id,
    u.username,
    u.score,
    u.total_solves,
    u.country,
    u.created_at,
    ROW_NUMBER() OVER (ORDER BY u.score DESC, u.total_solves DESC, u.created_at ASC) as rank
FROM users u
WHERE u.status = 'active'
ORDER BY u.score DESC, u.total_solves DESC, u.created_at ASC;

CREATE OR REPLACE VIEW challenge_statistics AS
SELECT 
    c.id,
    c.title,
    c.category,
    c.difficulty,
    c.points,
    c.total_solves,
    c.total_attempts,
    c.solve_percentage,
    CASE 
        WHEN c.total_attempts > 0 THEN ROUND((c.total_solves::DECIMAL / c.total_attempts) * 100, 2)
        ELSE 0
    END as actual_solve_percentage
FROM challenges c
WHERE c.status = 'active';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO xploitrum;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO xploitrum;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO xploitrum;

COMMIT;
