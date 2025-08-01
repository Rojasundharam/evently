-- Create file_metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    path TEXT NOT NULL UNIQUE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    tags TEXT[],
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_by ON file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_metadata_category ON file_metadata(category);
CREATE INDEX IF NOT EXISTS idx_file_metadata_is_public ON file_metadata(is_public);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_metadata_tags ON file_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_file_metadata_search ON file_metadata USING GIN(to_tsvector('english', original_name || ' ' || COALESCE(description, '')));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_file_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_file_metadata_updated_at();

-- Create file_access_permissions table for fine-grained access control
CREATE TABLE IF NOT EXISTS file_access_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'delete')),
    granted_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(file_id, user_id, permission_type),
    UNIQUE(file_id, role_id, permission_type),
    CHECK ((user_id IS NOT NULL AND role_id IS NULL) OR (user_id IS NULL AND role_id IS NOT NULL))
);

-- Create indexes for file access permissions
CREATE INDEX IF NOT EXISTS idx_file_access_permissions_file_id ON file_access_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_permissions_user_id ON file_access_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_permissions_role_id ON file_access_permissions(role_id);

-- Create file_download_logs table for tracking downloads
CREATE TABLE IF NOT EXISTS file_download_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
    downloaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for download logs
CREATE INDEX IF NOT EXISTS idx_file_download_logs_file_id ON file_download_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_download_logs_downloaded_by ON file_download_logs(downloaded_by);
CREATE INDEX IF NOT EXISTS idx_file_download_logs_downloaded_at ON file_download_logs(downloaded_at DESC);

-- Enable Row Level Security
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_download_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_metadata

-- Users can view their own files or public files
CREATE POLICY "Users can view own files or public files" ON file_metadata
    FOR SELECT USING (
        is_public = true 
        OR uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM file_access_permissions fap
            WHERE fap.file_id = id 
            AND (
                (fap.user_id = auth.uid() AND fap.permission_type = 'read')
                OR (
                    fap.role_id IN (
                        SELECT role_id FROM user_roles WHERE user_id = auth.uid()
                    ) AND fap.permission_type = 'read'
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Users can upload files
CREATE POLICY "Users can upload files" ON file_metadata
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Users can update their own files or files they have write access to
CREATE POLICY "Users can update own files or with write access" ON file_metadata
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM file_access_permissions fap
            WHERE fap.file_id = id 
            AND (
                (fap.user_id = auth.uid() AND fap.permission_type = 'write')
                OR (
                    fap.role_id IN (
                        SELECT role_id FROM user_roles WHERE user_id = auth.uid()
                    ) AND fap.permission_type = 'write'
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Users can delete their own files or files they have delete access to
CREATE POLICY "Users can delete own files or with delete access" ON file_metadata
    FOR DELETE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM file_access_permissions fap
            WHERE fap.file_id = id 
            AND (
                (fap.user_id = auth.uid() AND fap.permission_type = 'delete')
                OR (
                    fap.role_id IN (
                        SELECT role_id FROM user_roles WHERE user_id = auth.uid()
                    ) AND fap.permission_type = 'delete'
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- RLS Policies for file_access_permissions

-- Only file owners and admins can manage permissions
CREATE POLICY "File owners and admins can manage permissions" ON file_access_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM file_metadata fm
            WHERE fm.id = file_id AND fm.uploaded_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Users can view permissions for files they have access to
CREATE POLICY "Users can view relevant permissions" ON file_access_permissions
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM file_metadata fm
            WHERE fm.id = file_id AND fm.uploaded_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- RLS Policies for file_download_logs

-- Users can view their own download logs, file owners can view all logs for their files
CREATE POLICY "Users can view relevant download logs" ON file_download_logs
    FOR SELECT USING (
        downloaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM file_metadata fm
            WHERE fm.id = file_id AND fm.uploaded_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- System can insert download logs
CREATE POLICY "System can insert download logs" ON file_download_logs
    FOR INSERT WITH CHECK (true);

-- Create storage bucket for documents (this would typically be done via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage policies (would be set via Supabase dashboard or API)
-- These are example policies that would need to be created through the Supabase interface

-- Helper functions for file management

-- Function to check if user can access file
CREATE OR REPLACE FUNCTION can_user_access_file(file_uuid UUID, user_uuid UUID, access_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if file is public and access type is read
    IF access_type = 'read' AND EXISTS (
        SELECT 1 FROM file_metadata WHERE id = file_uuid AND is_public = true
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user is the file owner
    IF EXISTS (
        SELECT 1 FROM file_metadata WHERE id = file_uuid AND uploaded_by = user_uuid
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user has explicit permission
    IF EXISTS (
        SELECT 1 FROM file_access_permissions 
        WHERE file_id = file_uuid 
        AND user_id = user_uuid 
        AND permission_type = access_type
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user has role-based permission
    IF EXISTS (
        SELECT 1 FROM file_access_permissions fap
        JOIN user_roles ur ON fap.role_id = ur.role_id
        WHERE fap.file_id = file_uuid 
        AND ur.user_id = user_uuid 
        AND fap.permission_type = access_type
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user is admin
    IF EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_uuid AND r.name = 'admin'
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log file download
CREATE OR REPLACE FUNCTION log_file_download(
    file_uuid UUID,
    user_uuid UUID DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_str TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO file_download_logs (file_id, downloaded_by, ip_address, user_agent)
    VALUES (file_uuid, user_uuid, ip_addr, user_agent_str)
    RETURNING id INTO log_id;
    
    -- Update download count
    UPDATE file_metadata 
    SET download_count = download_count + 1
    WHERE id = file_uuid;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get file storage statistics
CREATE OR REPLACE FUNCTION get_file_storage_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_files', COUNT(*),
        'total_size', COALESCE(SUM(size), 0),
        'public_files', COUNT(*) FILTER (WHERE is_public = true),
        'private_files', COUNT(*) FILTER (WHERE is_public = false),
        'files_by_category', (
            SELECT json_object_agg(
                COALESCE(category, 'uncategorized'), 
                count
            )
            FROM (
                SELECT COALESCE(category, 'uncategorized') as category, COUNT(*) as count
                FROM file_metadata
                GROUP BY COALESCE(category, 'uncategorized')
            ) t
        ),
        'files_by_type', (
            SELECT json_object_agg(mime_type, count)
            FROM (
                SELECT mime_type, COUNT(*) as count
                FROM file_metadata
                GROUP BY mime_type
            ) t
        ),
        'top_downloaded', (
            SELECT json_agg(
                json_build_object(
                    'id', id,
                    'filename', original_name,
                    'download_count', download_count
                )
            )
            FROM (
                SELECT id, original_name, download_count
                FROM file_metadata
                WHERE download_count > 0
                ORDER BY download_count DESC
                LIMIT 10
            ) t
        )
    )
    FROM file_metadata
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance on JSON queries
CREATE INDEX IF NOT EXISTS idx_file_metadata_category_gin ON file_metadata USING GIN ((COALESCE(category, 'uncategorized')));

COMMENT ON TABLE file_metadata IS 'Stores metadata for uploaded files';
COMMENT ON TABLE file_access_permissions IS 'Fine-grained access control for files';
COMMENT ON TABLE file_download_logs IS 'Logs file download activities';
COMMENT ON FUNCTION can_user_access_file IS 'Checks if a user can access a file with specified permission';
COMMENT ON FUNCTION log_file_download IS 'Logs a file download and updates download count';
COMMENT ON FUNCTION get_file_storage_stats IS 'Returns comprehensive file storage statistics'; 