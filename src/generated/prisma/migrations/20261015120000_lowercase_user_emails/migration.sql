-- Store every User.email trimmed and lowercased (code review 2026-10-15, item 7).
-- Registration used to keep the address as typed while sign-in looked it up
-- lowercased, so a mixed-case address could never sign in.
--
-- Stops without changing anything if two accounts differ only by capitals or
-- spaces: lowercasing both would break the unique index, and which one to keep
-- is a person's decision, not a migration's.
DO $$
DECLARE
  clash text;
BEGIN
  SELECT lower(btrim(email)) INTO clash
  FROM "User"
  WHERE email IS NOT NULL
  GROUP BY lower(btrim(email))
  HAVING count(*) > 1
  LIMIT 1;

  IF clash IS NOT NULL THEN
    RAISE EXCEPTION 'Two accounts share the address % once capitals and spaces are ignored. Merge or rename one by hand, then run this again.', clash;
  END IF;
END $$;

UPDATE "User"
SET email = lower(btrim(email))
WHERE email IS NOT NULL
  AND email <> lower(btrim(email));
