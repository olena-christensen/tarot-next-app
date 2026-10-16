-- End other sign-ins after a password change (code review 2026-10-15, item 6).
-- Every existing account starts at 0, which is what sessions issued before this
-- change are treated as, so applying it signs no one out.
ALTER TABLE "User" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
