const EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:'])

// Links from page content open in the system browser only for web and mail
// addresses. Other schemes (file:, smb:, app handlers) can start programs.
export function isSafeExternalUrl(url) {
  try {
    return EXTERNAL_PROTOCOLS.has(new URL(url).protocol)
  } catch {
    return false
  }
}

// A revision that starts with a dash would be read by git as an option.
export function checkRevision(revision) {
  if (typeof revision !== 'string' || !/^[A-Za-z0-9_][A-Za-z0-9_./~^@{}-]*$/.test(revision)) {
    throw new Error('invalid revision')
  }
  return revision
}

// Paths go after "--" so git never reads one as an option.
export function pathArgs(files) {
  return ['--', ...[].concat(files)]
}
