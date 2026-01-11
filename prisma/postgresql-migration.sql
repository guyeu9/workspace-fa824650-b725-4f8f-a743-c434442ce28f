-- PostgreSQL迁移脚本
-- 从SQLite迁移到PostgreSQL

-- 创建数据库
CREATE DATABASE text_adventure_game;

-- 使用数据库
\c text_adventure_game;

-- 创建用户表
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'USER',
    isActive BOOLEAN NOT NULL DEFAULT true,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建账户表
CREATE TABLE "Account" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, providerAccountId)
);

-- 创建会话表
CREATE TABLE "Session" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sessionToken TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建验证令牌表
CREATE TABLE "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(identifier, token)
);

-- 创建游戏表
CREATE TABLE "Game" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    coverUrl TEXT,
    jsonData JSONB NOT NULL,
    authorId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建投票表
CREATE TABLE "Vote" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL CHECK (type IN ('UP', 'DOWN')),
    userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    gameId TEXT NOT NULL REFERENCES "Game"(id) ON DELETE CASCADE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, gameId)
);

-- 创建评论表
CREATE TABLE "Comment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    content TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    gameId TEXT NOT NULL REFERENCES "Game"(id) ON DELETE CASCADE,
    isDeleted BOOLEAN NOT NULL DEFAULT false,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建登录记录表
CREATE TABLE "LoginRecord" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userId TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    ipAddress INET,
    userAgent TEXT,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建在线统计表
CREATE TABLE "OnlineStats" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    userId TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    totalOnlineTime INTEGER NOT NULL DEFAULT 0,
    lastLoginAt TIMESTAMP,
    lastLogoutAt TIMESTAMP,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Account_provider_providerAccountId_idx" ON "Account"("provider", "providerAccountId");

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

CREATE INDEX "VerificationToken_identifier_idx" ON "VerificationToken"("identifier");
CREATE INDEX "VerificationToken_token_idx" ON "VerificationToken"("token");

CREATE INDEX "Game_authorId_createdAt_idx" ON "Game"("authorId", "createdAt");
CREATE INDEX "Game_createdAt_idx" ON "Game"("createdAt");
CREATE INDEX "Game_title_idx" ON "Game"("title");
CREATE INDEX "Game_updatedAt_idx" ON "Game"("updatedAt");

CREATE INDEX "Vote_gameId_type_idx" ON "Vote"("gameId", "type");
CREATE INDEX "Vote_userId_gameId_idx" ON "Vote"("userId", "gameId");
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt");

CREATE INDEX "Comment_gameId_createdAt_idx" ON "Comment"("gameId", "createdAt");
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");
CREATE INDEX "Comment_isDeleted_idx" ON "Comment"("isDeleted");

CREATE INDEX "LoginRecord_userId_createdAt_idx" ON "LoginRecord"("userId", "createdAt");
CREATE INDEX "LoginRecord_createdAt_idx" ON "LoginRecord"("createdAt");

CREATE INDEX "OnlineStats_userId_idx" ON "OnlineStats"("userId");
CREATE INDEX "OnlineStats_lastLoginAt_idx" ON "OnlineStats"("lastLoginAt");

-- 创建全文搜索索引
CREATE INDEX "Game_title_fts_idx" ON "Game" USING gin(to_tsvector('english', "title"));
CREATE INDEX "Game_description_fts_idx" ON "Game" USING gin(to_tsvector('english', "description"));
CREATE INDEX "Comment_content_fts_idx" ON "Comment" USING gin(to_tsvector('english', "content"));

-- 创建触发器更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_updated_at BEFORE UPDATE ON "Account"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_updated_at BEFORE UPDATE ON "Session"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_updated_at BEFORE UPDATE ON "Game"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comment_updated_at BEFORE UPDATE ON "Comment"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_online_stats_updated_at BEFORE UPDATE ON "OnlineStats"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建性能监控函数
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE(
    query TEXT,
    calls BIGINT,
    total_time DOUBLE PRECISION,
    mean_time DOUBLE PRECISION,
    rows BIGINT,
    hit_percent DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
    FROM pg_stat_statements
    WHERE mean_time > 100 -- 超过100ms的查询
    ORDER BY mean_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 创建数据库大小监控函数
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS TABLE(
    table_name TEXT,
    size_bytes BIGINT,
    size_pretty TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename,
        pg_total_relation_size(schemaname || '.' || tablename),
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- 创建用户活动统计函数
CREATE OR REPLACE FUNCTION get_user_activity_stats()
RETURNS TABLE(
    user_id TEXT,
    user_name TEXT,
    games_created BIGINT,
    comments_made BIGINT,
    votes_cast BIGINT,
    last_activity TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        COUNT(DISTINCT g.id) as games_created,
        COUNT(DISTINCT c.id) as comments_made,
        COUNT(DISTINCT v.id) as votes_cast,
        GREATEST(
            MAX(g.createdAt),
            MAX(c.createdAt),
            MAX(v.createdAt),
            MAX(lr.createdAt)
        ) as last_activity
    FROM "User" u
    LEFT JOIN "Game" g ON u.id = g."authorId"
    LEFT JOIN "Comment" c ON u.id = c."userId"
    LEFT JOIN "Vote" v ON u.id = v."userId"
    LEFT JOIN "LoginRecord" lr ON u.id = lr."userId"
    GROUP BY u.id, u.name
    ORDER BY last_activity DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 创建数据库维护函数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- 删除超过90天的登录记录
    DELETE FROM "LoginRecord" 
    WHERE "createdAt" < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- 删除超过30天的已删除评论
    DELETE FROM "Comment" 
    WHERE "isDeleted" = true 
    AND "createdAt" < CURRENT_TIMESTAMP - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建角色和权限
CREATE ROLE app_user LOGIN PASSWORD 'your_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- 创建只读角色用于报表
CREATE ROLE app_reader LOGIN PASSWORD 'your_readonly_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;