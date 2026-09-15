// Holds the account's applications, the one copy App derives everything from
// (ADR-0006), and keeps the server in step with them. State changes straight
// away and the server hears about it in the background:
// - an application's changed fields go out once it has had no edits for
//   SAVE_DELAY_MS, and only those fields (ADR-0008);
// - its first save is a PUT that creates it, so one that is added and never
//   typed into leaves nothing behind (ADR-0007);
// - deletes go out immediately.

import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';

const SAVE_DELAY_MS = 600;

function applicationPath(id) {
  return `/applications/${encodeURIComponent(id)}`;
}

// `onSaveRejected(error)` is told when the server refuses a change outright,
// such as an invalid value, which sending again can't fix.
export function useApplicationsSync({ onSaveRejected } = {}) {
  // null until the first load finishes.
  const [applications, setApplications] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  // 'saving', 'saved' or 'failed'.
  const [saveStatus, setSaveStatus] = useState('saved');

  // Changed fields not sent yet, by application ID.
  const unsent = useRef(new Map());
  const timers = useRef(new Map());
  // Fields whose save failed, by application ID. The next save of that
  // application sends them too.
  const failedFields = useRef(new Map());
  // The request on its way for each application. An application's requests
  // go out one at a time, so a PATCH can't overtake the PUT that creates it.
  const inFlight = useRef(new Map());
  // Applications the server has, which are saved with PATCH rather than PUT.
  const onServer = useRef(new Set());
  // Applications a PUT has gone out for, whether or not its answer arrived.
  // Any of these may be on the server, so deleting one has to tell it.
  const sentPut = useRef(new Set());
  // The latest list and callback, for requests that settle after the render
  // that started them.
  const latest = useRef({ applications, onSaveRejected });
  latest.current = { applications, onSaveRejected };

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    api('GET', '/applications')
      .then((loaded) => {
        if (cancelled) return;
        onServer.current = new Set(loaded.map((application) => application.id));
        setApplications(loaded);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [loadAttempt]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  function refreshStatus() {
    if (failedFields.current.size > 0) setSaveStatus('failed');
    else if (unsent.current.size > 0 || inFlight.current.size > 0) setSaveStatus('saving');
    else setSaveStatus('saved');
  }

  function cancelTimer(id) {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }

  function forget(id) {
    onServer.current.delete(id);
    sentPut.current.delete(id);
  }

  // Runs `send` once any earlier request for the same application has
  // settled, and keeps the indicator in step. Resolves or rejects with it.
  function enqueue(id, send) {
    const previous = inFlight.current.get(id) ?? Promise.resolve();
    const request = previous.then(send);
    const settled = request
      .catch(() => {})
      .finally(() => {
        if (inFlight.current.get(id) === settled) inFlight.current.delete(id);
        refreshStatus();
      });
    inFlight.current.set(id, settled);
    refreshStatus();
    return request;
  }

  // Sends the application's waiting fields. Resolves once the save has
  // settled, whether or not it worked.
  function save(id) {
    cancelTimer(id);

    return enqueue(id, () => {
      // Read when the request goes out, so edits made while an earlier one
      // was on its way are included. Newer edits win over failed ones.
      const fields = { ...failedFields.current.get(id), ...unsent.current.get(id) };
      failedFields.current.delete(id);
      unsent.current.delete(id);
      if (Object.keys(fields).length === 0) return undefined;

      const method = onServer.current.has(id) ? 'PATCH' : 'PUT';
      if (method === 'PUT') sentPut.current.add(id);

      return api(method, applicationPath(id), fields).then(
        () => {
          onServer.current.add(id);
        },
        (error) => {
          if (error.kind === 'validation') {
            // The server will never take these values, so they aren't kept
            // for another try.
            latest.current.onSaveRejected?.(error);
            return;
          }
          if (error.kind === 'not-found') {
            // Deleted on another device. The application is still open here,
            // so saving again puts all of it back with PUT, not just the
            // fields that changed.
            forget(id);
            const current = latest.current.applications?.find(
              (application) => application.id === id,
            );
            if (!current) return;
            const { id: _id, ...everyField } = current;
            failedFields.current.set(id, everyField);
            return;
          }
          failedFields.current.set(id, fields);
        },
      );
    });
  }

  function update(id, patch) {
    setApplications((previous) =>
      previous.map((application) =>
        application.id === id ? { ...application, ...patch } : application,
      ),
    );
    unsent.current.set(id, { ...unsent.current.get(id), ...patch });
    cancelTimer(id);
    timers.current.set(
      id,
      setTimeout(() => save(id), SAVE_DELAY_MS),
    );
    refreshStatus();
  }

  // Nothing reaches the server until the first edit.
  function add(application) {
    setApplications((previous) => [application, ...previous]);
  }

  // Resolves once the server has deleted it, or rejects after putting it
  // back in the list with its unsaved edits.
  function remove(id) {
    const removed = applications.find((application) => application.id === id);
    const unsaved = { ...failedFields.current.get(id), ...unsent.current.get(id) };
    cancelTimer(id);
    unsent.current.delete(id);
    failedFields.current.delete(id);
    setApplications((previous) => previous.filter((application) => application.id !== id));
    refreshStatus();

    return enqueue(id, () => {
      // Checked once any save still on its way has settled.
      if (!onServer.current.has(id) && !sentPut.current.has(id)) return undefined;

      return api('DELETE', applicationPath(id)).then(
        () => forget(id),
        (error) => {
          if (error.kind === 'not-found') {
            forget(id);
            return;
          }
          if (removed) {
            setApplications((previous) => [removed, ...previous]);
            if (Object.keys(unsaved).length > 0) failedFields.current.set(id, unsaved);
          }
          throw error;
        },
      );
    });
  }

  // Sends every failed save again straight away.
  function retry() {
    [...failedFields.current.keys()].forEach(save);
  }

  // Sends everything waiting now and resolves once every request has
  // settled, with whether all of it reached the server. Logging out waits
  // for this, since it ends the session the saves go out with.
  async function saveEverything() {
    new Set([...unsent.current.keys(), ...failedFields.current.keys()]).forEach(save);
    await Promise.all(inFlight.current.values());
    return unsent.current.size === 0 && failedFields.current.size === 0;
  }

  return {
    applications,
    loadError,
    reload: () => setLoadAttempt((count) => count + 1),
    saveStatus,
    retry,
    saveEverything,
    add,
    update,
    remove,
  };
}
