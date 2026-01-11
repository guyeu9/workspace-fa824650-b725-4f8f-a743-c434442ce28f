-- 数据库索引优化脚本
-- 用于提升查询性能

-- Game表索引
CREATE INDEX IF NOT EXISTS "Game_authorId_createdAt_idx" ON "Game" ("authorId", "createdAt");
CREATE INDEX IF NOT EXISTS "Game_createdAt_idx" ON "Game" ("createdAt");
CREATE INDEX IF NOT EXISTS "Game_title_idx" ON "Game" ("title");
CREATE INDEX IF NOT EXISTS "Game_updatedAt_idx" ON "Game" ("updatedAt");

-- Vote表索引
CREATE INDEX IF NOT EXISTS "Vote_gameId_type_idx" ON "Vote" ("gameId", "type");
CREATE INDEX IF NOT EXISTS "Vote_userId_gameId_idx" ON "Vote" ("userId", "gameId");
CREATE INDEX IF NOT EXISTS "Vote_createdAt_idx" ON "Vote" ("createdAt");

-- Comment表索引
CREATE INDEX IF NOT EXISTS "Comment_gameId_createdAt_idx" ON "Comment" ("gameId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_userId_idx" ON "Comment" ("userId");
CREATE INDEX IF NOT EXISTS "Comment_createdAt_idx" ON "Comment" ("createdAt");
CREATE INDEX IF NOT EXISTS "Comment_isDeleted_idx" ON "Comment" ("isDeleted");

-- User表索引
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User" ("role");
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User" ("isActive");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User" ("createdAt");

-- LoginRecord表索引
CREATE INDEX IF NOT EXISTS "LoginRecord_userId_createdAt_idx" ON "LoginRecord" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LoginRecord_createdAt_idx" ON "LoginRecord" ("createdAt");

-- OnlineStats表索引
CREATE INDEX IF NOT EXISTS "OnlineStats_userId_idx" ON "OnlineStats" ("userId");
CREATE INDEX IF NOT EXISTS "OnlineStats_lastLoginAt_idx" ON "OnlineStats" ("lastLoginAt");

-- Account表索引
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account" ("userId");
CREATE INDEX IF NOT EXISTS "Account_provider_providerAccountId_idx" ON "Account" ("provider", "providerAccountId");

-- Session表索引
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session" ("userId");
CREATE INDEX IF NOT EXISTS "Session_sessionToken_idx" ON "Session" ("sessionToken");

-- VerificationToken表索引
CREATE INDEX IF NOT EXISTS "VerificationToken_identifier_idx" ON "VerificationToken" ("identifier");
CREATE INDEX IF NOT EXISTS "VerificationToken_token_idx" ON "VerificationToken" ("token");

-- 分析查询
-- 以下查询用于分析索引使用情况

-- 查看最慢的查询
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- 查看表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看索引使用情况
SELECT 
  t.tablename,
  indexname,
  c.reltuples::BIGINT AS num_rows,
  pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_index i ON i.indrelid = c.oid
LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.indexrelid
WHERE t.schemaname = 'public'
ORDER BY c.reltuples DESC;