# Attachments stay on the device in v1

In v1 only application records sync. Attachment files stay in the browser's IndexedDB, as they do today, and the record carries only the file's metadata. Other devices show the attachment as held on another device. With $0 hosting, the 512 MB free Atlas database would fill after about 50 full-size CVs, and proper object storage adds a second provider, uploads that go straight from the browser to storage, and download permissions. Accounts plus record sync is a complete milestone without all that, so attachment sync is v2.

## Consequences

- **Separate storage per account:** each account gets its own IndexedDB database (`vc-application-tracker:<accountId>`). This matters because orphan cleanup deletes every file the loaded records don't point to, so with a shared store, logging into a demo account would delete the real account's CVs.
- **When cleanup runs:** only after the applications have loaded from the server. Run before that, it would see zero records and delete everything.
- **Leaving a device:** logging out keeps the files on the device. Deleting the account clears only the current device's copy.
