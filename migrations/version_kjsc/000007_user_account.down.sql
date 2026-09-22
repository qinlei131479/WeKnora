DROP INDEX IF EXISTS users_account_key;

ALTER TABLE users DROP COLUMN IF EXISTS account;
