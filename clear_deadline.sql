-- Clear any stale deadline setting
DELETE FROM "GlobalSetting" WHERE "key" = 'orderDeadline';
