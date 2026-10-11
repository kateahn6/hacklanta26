# How we work on noted!

Read this once before your next commit. Two things in the repo changed recently
and will bite you if you don't know about them.

## 1. The Expo project moved to `app/`

There is no `package.json` at the repo root any more.

```
app/   the Expo app  <- you are almost always here
api/   Node + Express backend (deployed to Render)
sql/   Tiger Data schema, continuous aggregate and seed
```

```bash
cd app && npx expo start      # not from the repo root
```

If you see `ConfigError: The expected package.json path ... does not exist`,
you're in the wrong directory.

**What this means for your branches:** if you branched before the move, your
changes are against paths like `src/screens/foo.tsx` while the branch they
merge into has `app/src/screens/foo.tsx`. Git usually detects the rename and
handles it, but you'll get conflicts on any file you both touched. Rebasing on
the latest branch before you start is cheaper than fixing it after.

## 2. The app reads from a real backend now

Screens no longer read only `seedContent`. `useContent()` merges three sources:

1. the live API (`app/src/lib/api-content.ts` adapts it to our types)
2. anything created on this device (zustand)
3. the bundled seed — **fallback only**, used when the API returns nothing

So a screen can look fine on your machine (seed) and empty on someone else's
(live, not yet befriended). If you're changing a screen's data, change the
adapter, not the seed.

Still device-local: scrapbook creation, drafts.

---

## First-time setup

### What you need from whoever has them

| Value | Where it goes |
| --- | --- |
| Auth0 tenant domain | both `.env` files |
| Auth0 Native app client ID | `app/.env` |
| Tiger Data `DATABASE_URL` | `api/.env` only |
| Gemini API key | `api/.env` only |

Never put the database URL or Gemini key in `app/.env` — everything prefixed
`EXPO_PUBLIC_` is compiled into the JS bundle and shipped to the phone.

### Run the app only (no backend, no credentials)

Fastest way to work on UI:

```bash
cd app
cp .env.example .env
echo 'EXPO_PUBLIC_DEV_SKIP_AUTH=1' >> .env   # skips the login gate
npm install
npx expo start --tunnel
```

You get every screen on bundled seed content. Publishing and invites won't
work. **Delete that line before demoing** or you'll be showing fake data.

### Run against the real backend

```bash
cd app
cp .env.example .env     # fill in the four EXPO_PUBLIC_ values
npm install
npx expo start -c --tunnel
```

`EXPO_PUBLIC_API_URL` should be the Render URL. You do not need to run the API
locally unless you're changing it.

### Run the API locally (only if you're changing `api/`)

```bash
cd api
cp .env.example .env     # AUTH0_*, DATABASE_URL, GEMINI_API_KEY, DEMO_MODE
npm install
npm run dev              # http://localhost:8787
curl localhost:8787/health
```

A phone cannot reach `localhost`, so to test from Expo Go you need a tunnel on
port 8787 — and ngrok now requires a free account. Using the deployed Render
URL instead is usually less hassle.

---

## Things that will waste your time if nobody tells you

**`.env` changes need `npx expo start -c`.** `EXPO_PUBLIC_*` values are baked
into the bundle at build time. A plain reload keeps the old value, so you will
swear your change did nothing.

**The Auth0 callback URL changes every time the tunnel restarts.** Expo Go's
redirect URI looks like `exp://xxxx-8081.exp.direct/--/redirect` and the
subdomain is regenerated on each `--tunnel` start. When login fails with
*"Callback URL mismatch"*, copy the current URI — the login screen shows it
with a copy button — into Auth0 → Applications → (Native app) → **Allowed
Callback URLs**, and save.

**Render's free tier sleeps after ~15 minutes idle.** The first request then
takes ~30 seconds. Hit `/health` a minute before you demo.

**The SQL files must be run separately, in order.** A continuous aggregate
cannot be created inside a transaction, so never use `psql -1` and never paste
`aggregates.sql` into a GUI that wraps statements in `BEGIN`/`COMMIT`:

```bash
psql "$DATABASE_URL" -f sql/schema.sql
psql "$DATABASE_URL" -f sql/aggregates.sql
psql "$DATABASE_URL" -f sql/seed.sql
```

All three are re-runnable. `sql/reset.sql` drops everything.

**`unfold` still appears in identifiers and that's deliberate.** The Auth0
audience (`https://unfold-api`), the URI scheme and the SecureStore key prefix
keep the old name. Renaming them breaks the Auth0 callback and signs everyone
out. Only user-facing text says noted!.

---

## Before you push

```bash
cd app && npx tsc --noEmit && npx expo lint
cd ../api && npx tsc --noEmit
```

Both projects must be clean. A type error in `app/` will not show up in `api/`
and vice versa.

## Checking the backend is healthy

```bash
curl https://hacklanta26.onrender.com/health
```

| Response | Meaning |
| --- | --- |
| `"ok": true` with counts | everything is working |
| `"db": "relation \"places\" does not exist"` | schema never ran |
| `"db": "...password..."` | `DATABASE_URL` is wrong |
| `"issuer": null` | `AUTH0_DOMAIN` missing on Render |
| `401 "Invalid token"` on other routes | expected without a real login |

## Demo runbook

1. `curl .../health` to wake Render (~30s if asleep)
2. `cd app && npx expo start -c --tunnel`
3. Copy the redirect URI from the login screen into Auth0, save
4. Scan the QR, log in with Google
5. Discover → **Join demo map** → 15 Atlanta places appear
6. **They keep going back** → Hodgepodge Coffee, 20 return days
7. ＋ → pick a photo → *Let Gemini write it* → Publish
8. Open a postcard → the generated message
