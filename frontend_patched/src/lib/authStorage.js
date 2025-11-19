export function loadPatchedSession() {
  try {
    const raw = localStorage.getItem('so_session_patched');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user && typeof parsed.expiresAt === 'number' && Date.now() < parsed.expiresAt) {
      return parsed.user;
    }
    localStorage.removeItem('so_session_patched');
    return null;
  } catch {
    return null;
  }
}

export function savePatchedSession(user) {
  try {
    const session = { user, expiresAt: Date.now() + 60 * 60 * 1000 };
    localStorage.setItem('so_session_patched', JSON.stringify(session));
  } catch {}
}

export function clearPatchedSession() {
  try { localStorage.removeItem('so_session_patched'); } catch {}
}
