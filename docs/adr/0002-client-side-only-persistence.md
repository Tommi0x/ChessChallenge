# No backend: Score and Best Score live only in the browser's localStorage

The constraint "I don't wanna pay for any service" ruled out a hosted backend. We considered a free-tier backend (Supabase/Firebase) to enable accounts and a global leaderboard, but rejected it for v1: it's a service dependency and real build effort for a feature (cross-device sync, public leaderboard) that wasn't asked for. Best Score is per-device only, with no accounts and no server. A global leaderboard remains a possible deliberate v2 addition, not something to back into.
