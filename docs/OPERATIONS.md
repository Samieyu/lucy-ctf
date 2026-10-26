# Lucy CTF - Operations Manual

## 1. Running an Event
1. **Event Window**: Navigate to `/admin/event` and set:
   - `startsAt`: Exact start time
   - `endsAt`: Exact closing time
   - `freezeLeaderboardAt`: Optional time to freeze public scoreboard (e.g., 1 hour before endsAt).
2. **Emergency Pause**: Toggle `isPaused` to immediately reject all flag submissions.

## 2. Managing Teams & Scores
- View all teams and competitors at `/admin/teams` and `/admin/users`.
- Reset a team's score: `/admin/teams` &rarr; click `Reset Score`.
- Delete a team: reassigns competitors to free agents.

## 3. Automated Backups & Restore
Nightly backups are stored in `./backups` via `db-backup` service.

### Manual Backup:
```bash
docker compose exec db pg_dump -U lucyctf lucyctf > manual_backup.sql
```

### Restore Database:
```bash
docker compose down -v # CAUTION: stops containers
docker compose up -d db
cat manual_backup.sql | docker compose exec -T db psql -U lucyctf -d lucyctf
docker compose up -d
```

## 4. Incident Response Checklist
1. **Flag Leak**:
   - Change the challenge flag immediately in `/admin/challenges`.
   - Update flag hash.
2. **Denial of Service / Brute Force**:
   - Check `/admin/audit` for `SUSPICIOUS_BRUTE_FORCE` signals.
   - Ban abusive accounts in `/admin/users`.
   - Rate limiting automatically caps abuse at 10 submissions/minute.
