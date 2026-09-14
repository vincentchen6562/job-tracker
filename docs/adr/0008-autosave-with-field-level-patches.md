# Autosave with field-level patches; the last write wins per field

Edits update React state immediately, as they do today. Once a record has had no edits for about 600 ms, the browser sends a `PATCH` containing only the fields that changed. There is no save button and no version check. So when two devices edit the same application, the later write wins, **per field**: edits to different fields both survive, and for the same field the last one wins. We accept this over version numbers and conflict prompts because this is one person's tracker, and two devices editing the same field within seconds is rare.

## Considered Options

- **A save button per application:** rejected because it changes how editing feels today.
- **Save when a field loses focus:** rejected because edits made just before closing the tab could be lost.
