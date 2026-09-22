-- 登录账号。历史用户留空，继续用邮箱登录；新成员由租户新增接口写入。
ALTER TABLE users ADD COLUMN IF NOT EXISTS account VARCHAR(20);

COMMENT ON COLUMN users.account IS '登录账号，仅字母和数字，全局唯一，历史用户可为空';

CREATE UNIQUE INDEX IF NOT EXISTS users_account_key ON users (account);
