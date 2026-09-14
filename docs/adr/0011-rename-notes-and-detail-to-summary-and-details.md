# Rename `notes` / `detail` to `summary` / `details`

Before accounts, the one-line text the UI labels **Summary** was stored as `notes`, and the markdown the UI labels **Notes** was stored as `detail`. The server schema uses `summary` and `details`, with the UI labels to match, and restoring an older backup converts `notes` to `summary` and `detail` to `details`.

## Considered Options

- **Rename to `summary` / `notes` instead:** rejected. `notes` would keep its name but change meaning, so any old backup or missed line of code would silently put the one-line summary into the markdown field. With the chosen names, every old field name either converts or goes away.
- **Keep the old field names:** rejected. The database schema is being written now, and this is the cheapest time to fix the mismatch.
