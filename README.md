# noted!

Community discovery through scrapbook entries instead of ratings. Friends share
real places, Gemini writes the page from the photos, and the ranking is built on
one signal only: who keeps coming back.

    Expo app (Expo Go)  ->  Express on Render  ->  Tiger Data + Gemini
                                   ^
                            Auth0 access tokens
                         verified with jose + JWKS

```
app/   Expo (SDK 57, TypeScript) — runs in Expo Go
api/   Node + Express + TypeScript API
sql/   Tiger Data (Postgres/TimescaleDB) schema, aggregate and seed
```

## 1. Database (Tiger Data)

Each file as its own `psql` run — a continuous aggregate cannot be created
inside a transaction. See [sql/README.md](sql/README.md).

```bash
export DATABASE_URL='postgres://...sslmode=require'
psql "$DATABASE_URL" -f sql/schema.sql
psql "$DATABASE_URL" -f sql/aggregates.sql
psql "$DATABASE_URL" -f sql/seed.sql
```

## 2. API

```bash
cd api
cp .env.example .env     # AUTH0_DOMAIN, AUTH0_AUDIENCE, DATABASE_URL, GEMINI_API_KEY, DEMO_MODE
npm install
npm run dev              # listens on PORT (default 8787)
curl localhost:8787/health
```

The phone cannot reach `localhost`, so for local dev expose the port:

```bash
ngrok http 8787
```

### Deploying to Render

`render.yaml` is a blueprint; the equivalent manual setup is a **Web Service**
with:

| Setting | Value |
| --- | --- |
| Root Directory | `api` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Render injects `PORT` and the server binds `0.0.0.0`, so nothing else is
needed. Set `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`, `DATABASE_URL`, `GEMINI_API_KEY`
and `DEMO_MODE=1` as environment variables in the dashboard — the repo has only
`.env.example`. Once it is live, `EXPO_PUBLIC_API_URL` becomes the Render URL
and ngrok is no longer in the loop.

On the free plan the service sleeps when idle, so the first request after a
pause takes ~30s. **Hit `/health` a minute before demoing** to warm it up.

## 3. Auth0

One **API** (identifier = `AUTH0_AUDIENCE`, e.g. `https://unfold-api`, with
Allow Offline Access on) and one **Native application** using Authorization
Code + PKCE, with Google as a social connection. The app prints its redirect
URI to the Expo terminal and shows it on the login screen — paste that into
Allowed Callback URLs. In Expo Go it looks like
`exp://192.168.1.20:8081/--/redirect` and changes with your network; with
`--tunnel` it becomes an `exp://....exp.direct/--/redirect` host that changes
on every tunnel restart.

## 4. App

```bash
cd app                   # the Expo project is here, not the repo root
cp .env.example .env     # EXPO_PUBLIC_AUTH0_*, EXPO_PUBLIC_API_URL=<tunnel or Render URL>
npm install
npx expo start -c        # -c after any .env change; add --tunnel if the Wi-Fi blocks phone->laptop
```

## Demo path

Log in with Google → Profile → **Join the demo map** (befriends the three
seeded Atlanta accounts) → postcards appear across Explore, Discover and the
map → **＋ → New postcard** → pick a photo → *Let Gemini write it* → Publish →
back on Explore, **They keep going back** ranks by return visits → open a
postcard to see the generated message.

## How the two halves fit together

The frontend is a 13-screen app with its own domain model (places, postcards,
scrapbooks, users) that originally ran entirely on bundled seed content. The
API speaks a smaller schema: places, each holding entries.

`app/src/lib/api-content.ts` adapts between them — one entry becomes one
postcard, and a place several friends have written about becomes a scrapbook
whose stops are those entries. `useContent()` merges that adapter with
device-local state, so every screen reads live data through the hook it already
used. When the API is unreachable the bundled seed takes over so no screen is
blank, and the two never mix.

Still on device-local state only: **Ask** (Gemini recommendations), scrapbook
creation, and **Saved**.

## Choices worth knowing

- **Photos are base64 JPEG data URLs**, resized to ~1024px on the phone and
  stored in `entries.photo_urls`. No blob store to configure; swap for Vercel
  Blob if payload size becomes a problem.
- **`DEMO_MODE=1`** makes `/api/analyze` return a canned scrapbook page if
  Gemini fails or takes longer than 8 seconds. The UI says when it did.
- **Friendships are symmetric**, written in both directions on accept, so every
  read is a plain equality join.
- **The friendship join stays out of the continuous aggregate** —
  `daily_place_visits` buckets visits by place, person and day, and
  `GET /api/returning` joins `friendships` on top of it.
- **`unfold` survives in identifiers** — the Auth0 audience, the URI scheme and
  the SecureStore keys. Renaming those breaks the Auth0 callback and signs
  everyone out, so only the user-facing name changed to noted!.
