// Holds the account's applications, the one copy App derives everything from
// (ADR-0006), and keeps the server in step with them. State changes straight
// away and the server hears about it in the background:
// - an application's changed fields go out once it has had no edits for
//   SAVE_DELAY_MS, and only those fields (ADR-0008);
// - its first save is a PUT that creates it, so one that is added and never
//   typed into leaves nothing behind (ADR-0007);
// - deletes go out immediately.
// Once a request finds the session has ended, nothing more goes out and edits
// are held until `resume()`, after logging back in to the same account.

import { useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../utils/api';

const SAVE_DELAY_MS = 600;

function applicationPath(id) {
  return `/applications/${encodeURIComponent(id)}`;
}

// `onSaveRejected(error)` is told when the server refuses a change outright,
// such as an invalid value, which sending again can't fix.
// `onSessionEnded()` is told when the server says the session is over (it
// expired, or was ended elsewhere), and again whenever a held save is asked
// for.
// `accountId` is the account the edits belong to, and every request names
// it, so none is ever saved to another account logged in from another tab.
export function useApplicationsSync({ accountId, onSaveRejected, onSessionEnded }) {
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
  // The latest list and callbacks, for requests that settle after the render
  // that started them.
  const latest = useRef({ applications, onSaveRejected, onSessionEnded });
  latest.current = { applications, onSaveRejected, onSessionEnded };
  // True from the session ending until resume(). Requests are refused here
  // rather than sent, since a cookie from someone logging in to another
  // account on this page would go with them.
  const held = useRef(false);
  // Counts resume()s, so a 401 for a request sent before logging back in
  // isn't mistaken for the new session ending.
  const logins = useRef(0);
  // A request still queued when the tracker closes, such as after switching
  // accounts, is refused the same way.
  const unmounted = useRef(false);

  // Declared before the load, so a remount clears it before loading again.
  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    callServer('GET', '/applications')
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

  function askForLogin() {
    latest.current.onSessionEnded?.();
  }

  // Every request to the server goes through here. Rejects like a 401
  // without sending while edits are held, so every caller's existing 401
  // handling keeps what didn't go out, and a real 401 starts holding them.
  function callServer(method, path, body) {
    if (held.current || unmounted.current) {
      return Promise.reject(new ApiError(401, 'Not logged in.'));
    }
    const sentAfterLogin = logins.current;
    return api(method, path, body, { accountId }).catch((error) => {
      if (error.kind !== 'unauthenticated') throw error;
      // Sent on the old session and answered after logging back in, so it
      // goes again on the new one.
      if (sentAfterLogin !== logins.current) return callServer(method, path, body);
      if (!held.current) {
        held.current = true;
        askForLogin();
      }
      throw error;
    });
  }

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

      return callServer(method, applicationPath(id), fields).then(
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

      return callServer('DELETE', applicationPath(id)).then(
        () => forget(id),
        (error) => {
          if (error.kind === 'not-found') {
            forget(id);
            return;
          }
          // Deleting is asked for by hand, so it asks for a login even when
          // the dialog was closed.
          if (error.kind === 'unauthenticated') askForLogin();
          if (removed) {
            setApplications((previous) => [removed, ...previous]);
            if (Object.keys(unsaved).length > 0) failedFields.current.set(id, unsaved);
          }
          throw error;
        },
      );
    });
  }

  // Sends every failed save again straight away, or asks for a login first
  // when they're held.
  function retry() {
    if (held.current) {
      askForLogin();
      return;
    }
    [...failedFields.current.keys()].forEach(save);
  }

  // Loads the list again, or asks for a login first when the session is over.
  function reload() {
    if (held.current) {
      askForLogin();
      return;
    }
    setLoadAttempt((count) => count + 1);
  }

  // Sends everything waiting now and resolves once every request has
  // settled, with whether all of it reached the server. Logging out waits
  // for this, since it ends the session the saves go out with.
  async function saveEverything() {
    new Set([...unsent.current.keys(), ...failedFields.current.keys()]).forEach(save);
    await Promise.all(inFlight.current.values());
    const allSaved = unsent.current.size === 0 && failedFields.current.size === 0;
    if (!allSaved && held.current) askForLogin();
    return allSaved;
  }

  // Picks up after logging back in to the same account: the held edits go
  // out, or the load runs again if it was the load that found the session
  // over.
  function resume() {
    held.current = false;
    logins.current += 1;
    if (latest.current.applications === null) reload();
    else saveEverything();
  }

  return {
    applications,
    loadError,
    reload,
    saveStatus,
    retry,
    saveEverything,
    resume,
    add,
    update,
    remove,
  };
}
