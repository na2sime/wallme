-- WallMe Database Initialization Script

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) <= 500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert some sample data (optional, for testing)
-- You can remove this section in production
INSERT INTO users (id, email, password, created_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'demo@wallme.com', '$2b$10$Xq8mL7J5N7w.cQZ5H7M5EeY8Q5H7M5EeY8Q5H7M5EeY8Q5H7M5Ee', NOW())
ON CONFLICT (email) DO NOTHING;

-- Add comments to tables
COMMENT ON TABLE users IS 'Stores user authentication information';
COMMENT ON TABLE posts IS 'Stores wall posts from users';
COMMENT ON COLUMN posts.content IS 'Post content, max 500 characters';