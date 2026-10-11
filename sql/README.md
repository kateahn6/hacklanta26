# noted! database

Run these **in order**, each as its own `psql` invocation. `psql -f` runs in
autocommit, which matters: a continuous aggregate cannot be created inside a
transaction block, so `aggregates.sql` must not be pasted into a GUI that wraps
statements in `BEGIN`/`COMMIT`.

```bash
export DATABASE_URL='postgres://...sslmode=require'   # from Tiger Data

psql "$DATABASE_URL" -f sql/schema.sql       # tables + visits hypertable
psql "$DATABASE_URL" -f sql/aggregates.sql   # continuous aggregate + policy
psql "$DATABASE_URL" -f sql/seed.sql         # demo city, 3 demo friends
```

Every file is re-runnable. `schema.sql` and `aggregates.sql` use
`IF NOT EXISTS`; `seed.sql` deletes the demo accounts first.

To start over completely:

```bash
psql "$DATABASE_URL" -f sql/reset.sql
```

Do **not** use `psql -1` / `--single-transaction` with `aggregates.sql`.
