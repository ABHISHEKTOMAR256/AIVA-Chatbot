-- =============================================================================
-- AIVA — PostgreSQL Initial Schema & Vector Extension Migration
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID NOT NULL, 
    email VARCHAR(255) NOT NULL, 
    full_name VARCHAR(255), 
    avatar_url VARCHAR(1024), 
    role VARCHAR(50) DEFAULT 'user' NOT NULL, 
    telegram_id BIGINT, 
    telegram_username VARCHAR(255), 
    telegram_link_code VARCHAR(32), 
    telegram_link_expires TIMESTAMP WITH TIME ZONE, 
    is_active BOOLEAN DEFAULT 'true' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (email), 
    UNIQUE (telegram_id)
);

CREATE INDEX IF NOT EXISTS ix_profiles_email ON profiles (email);
CREATE INDEX IF NOT EXISTS ix_profiles_telegram_id ON profiles (telegram_id);

-- 2. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    platform VARCHAR(50) DEFAULT 'web' NOT NULL, 
    platform_conversation_id VARCHAR(255), 
    title VARCHAR(255), 
    status VARCHAR(50) DEFAULT 'active' NOT NULL, 
    handling_mode VARCHAR(50) DEFAULT 'ai' NOT NULL, 
    assigned_staff_id UUID, 
    message_count INTEGER DEFAULT '0' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES profiles (id) ON DELETE CASCADE, 
    FOREIGN KEY(assigned_staff_id) REFERENCES profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_conversations_user_id ON conversations (user_id);
CREATE INDEX IF NOT EXISTS ix_conversations_platform ON conversations (platform, platform_conversation_id);

-- 3. Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id UUID NOT NULL, 
    reference_number VARCHAR(64) NOT NULL, 
    user_id UUID NOT NULL, 
    conversation_id UUID, 
    category VARCHAR(50) NOT NULL, 
    title VARCHAR(255) NOT NULL, 
    description TEXT NOT NULL, 
    location VARCHAR(255), 
    room_number VARCHAR(50), 
    status VARCHAR(50) DEFAULT 'submitted' NOT NULL, 
    priority VARCHAR(50) DEFAULT 'medium' NOT NULL, 
    assigned_staff_id UUID, 
    internal_notes TEXT, 
    staff_reply TEXT, 
    resolved_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (reference_number), 
    FOREIGN KEY(user_id) REFERENCES profiles (id) ON DELETE CASCADE, 
    FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE SET NULL, 
    FOREIGN KEY(assigned_staff_id) REFERENCES profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_complaints_reference_number ON complaints (reference_number);
CREATE INDEX IF NOT EXISTS ix_complaints_user_id ON complaints (user_id);
CREATE INDEX IF NOT EXISTS ix_complaints_status ON complaints (status);
CREATE INDEX IF NOT EXISTS ix_complaints_category ON complaints (category);

-- 4. Lost & Found Items
CREATE TABLE IF NOT EXISTS lost_found_items (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    item_type VARCHAR(20) NOT NULL, 
    title VARCHAR(255) NOT NULL, 
    description TEXT NOT NULL, 
    location VARCHAR(255) NOT NULL, 
    date_occurred DATE NOT NULL, 
    category VARCHAR(50) NOT NULL, 
    status VARCHAR(50) DEFAULT 'open' NOT NULL, 
    contact_method VARCHAR(50) DEFAULT 'chat' NOT NULL, 
    is_anonymous BOOLEAN DEFAULT 'false' NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_lost_found_status ON lost_found_items (status);
CREATE INDEX IF NOT EXISTS ix_lost_found_item_type ON lost_found_items (item_type);
CREATE INDEX IF NOT EXISTS ix_lost_found_category ON lost_found_items (category);

-- 5. Media Files
CREATE TABLE IF NOT EXISTS media_files (
    id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    filename VARCHAR(255) NOT NULL, 
    stored_filename VARCHAR(255) NOT NULL, 
    mime_type VARCHAR(100) NOT NULL, 
    file_size INTEGER NOT NULL, 
    storage_path VARCHAR(1024) NOT NULL, 
    bucket_name VARCHAR(100) DEFAULT 'aiva-media' NOT NULL, 
    complaint_id UUID, 
    lost_found_item_id UUID, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES profiles (id) ON DELETE CASCADE, 
    FOREIGN KEY(complaint_id) REFERENCES complaints (id) ON DELETE SET NULL, 
    FOREIGN KEY(lost_found_item_id) REFERENCES lost_found_items (id) ON DELETE SET NULL
);

-- 6. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID NOT NULL, 
    conversation_id UUID NOT NULL, 
    sender_type VARCHAR(50) NOT NULL, 
    content TEXT NOT NULL, 
    message_type VARCHAR(50) DEFAULT 'text' NOT NULL, 
    attachment_id UUID, 
    ai_model VARCHAR(100), 
    response_time_ms INTEGER, 
    processing_status VARCHAR(50) DEFAULT 'processed' NOT NULL, 
    telegram_message_id BIGINT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, 
    FOREIGN KEY(attachment_id) REFERENCES media_files (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_messages_conversation_id ON messages (conversation_id);
CREATE INDEX IF NOT EXISTS ix_messages_telegram_msg_id ON messages (telegram_message_id);

-- 7. Handover Requests
CREATE TABLE IF NOT EXISTS handover_requests (
    id UUID NOT NULL, 
    conversation_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    reason TEXT NOT NULL, 
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, 
    claimed_by UUID, 
    claimed_at TIMESTAMP WITH TIME ZONE, 
    resolved_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (conversation_id), 
    FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, 
    FOREIGN KEY(user_id) REFERENCES profiles (id) ON DELETE CASCADE, 
    FOREIGN KEY(claimed_by) REFERENCES profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_handover_status ON handover_requests (status);

-- 8. Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID NOT NULL, 
    conversation_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    rating INTEGER NOT NULL, 
    comment TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE CASCADE, 
    FOREIGN KEY(user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- 9. Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID NOT NULL, 
    event_type VARCHAR(100) NOT NULL, 
    user_id UUID, 
    conversation_id UUID, 
    metadata_json JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES profiles (id) ON DELETE SET NULL, 
    FOREIGN KEY(conversation_id) REFERENCES conversations (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_analytics_event_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS ix_analytics_created_at ON analytics_events (created_at);

-- 10. Knowledge Documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID NOT NULL, 
    title VARCHAR(512) NOT NULL, 
    content TEXT NOT NULL, 
    category VARCHAR(100) NOT NULL, 
    chunk_index INTEGER DEFAULT '0' NOT NULL, 
    embedding VECTOR(384), 
    is_active BOOLEAN DEFAULT 'true' NOT NULL, 
    uploaded_by UUID, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(uploaded_by) REFERENCES profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_knowledge_category ON knowledge_documents (category);

-- Mark migration as applied in alembic
INSERT INTO alembic_version (version_num) 
SELECT '001_initial_schema'
WHERE NOT EXISTS (SELECT 1 FROM alembic_version WHERE version_num = '001_initial_schema');

COMMIT;
