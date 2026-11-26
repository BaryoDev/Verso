import fs from 'fs'
import os from 'os'
import path from 'path'

const OUTSIDE = 'path is outside the opened folders'

// A .git entry anywhere in the path. Writing there plants hooks or config that
// run code on the next git command, so page code never reaches it. Covers other
// spellings that land on the same folder: .GIT, ".git." and the Windows short
// name git~1.
function touchesGitDir(p) {
  return p.split(/[\\/]/).some((part) => {
    const name = part.toLowerCase().split(':')[0].replace(/[. ]+$/, '')
    return name === '.git' || /^git~\d+$/.test(name)
  })
}

// Where a path really is, after following every link. A path that does not
// exist yet resolves through its nearest existing parent. A link that points at
// nothing is refused, because writing through it would create its target.
function realLocation(target) {
  let current = path.resolve(target)
  const rest = []
  for (;;) {
    try {
      return path.join(fs.realpathSync.native(current), ...rest)
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error
      let isLink = false
      try {
        isLink = fs.lstatSync(current).isSymbolicLink()
      } catch {
        isLink = false
      }
      if (isLink) throw new Error(OUTSIDE)
      const parent = path.dirname(current)
      if (parent === current) return path.join(current, ...rest)
      rest.unshift(path.basename(current))
      current = parent
    }
  }
}

function isWithin(child, parent) {
  return child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : parent + path.sep)
}

// The folders the person picked in the open dialog or created through the app.
// File and git requests from the page must stay inside one of them, so a script
// that gets into the page cannot read or write anywhere else on the machine.
// The list lives in the main process and is never taken from the page.
//
// A folder that holds the home folder is never one of them: the page could then
// write the git config or login items, which run programs. Neither is a folder
// that holds this list or sits inside it, or the page could add any folder.
export function createRootStore(file, { home = os.homedir() } = {}) {
  const homeReal = realLocation(home)
  const ownFolder = realLocation(path.dirname(file))
  const tooWide = (real) => isWithin(homeReal, real) || isWithin(ownFolder, real) || isWithin(real, ownFolder)
  const usable = (real) => !touchesGitDir(real) && !tooWide(real)
  let roots = []
  try {
    const saved = JSON.parse(fs.readFileSync(file, 'utf-8'))
    if (Array.isArray(saved)) {
      roots = saved
        .filter((r) => typeof r === 'string' && path.isAbsolute(r))
        .flatMap((r) => {
          try {
            return [realLocation(r)]
          } catch {
            return []
          }
        })
        .filter(usable)
    }
  } catch {
    roots = []
  }

  function save() {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, JSON.stringify(roots), 'utf-8')
    } catch (error) {
      console.error('could not save the opened folders', error)
    }
  }

  // Where a folder would land if it were allowed, or an error if it never can be.
  function vet(dir) {
    if (typeof dir !== 'string' || dir === '' || touchesGitDir(path.resolve(dir))) {
      throw new Error('invalid folder')
    }
    const real = realLocation(dir)
    if (!usable(real)) throw new Error('invalid folder')
    return real
  }

  function check(target) {
    if (typeof target !== 'string' || target === '') throw new Error(OUTSIDE)
    const asked = path.resolve(target)
    if (touchesGitDir(asked)) throw new Error(OUTSIDE)
    let real
    try {
      real = realLocation(target)
    } catch (error) {
      // A folder that cannot be read (no permission, a link loop) gives the same
      // answer as any other outside path, so the page cannot use the error to
      // learn which folders exist outside or who may read them.
      if (error.message !== OUTSIDE && roots.some((root) => isWithin(asked, root))) {
        throw new Error('cannot read this folder')
      }
      throw new Error(OUTSIDE)
    }
    if (touchesGitDir(real)) throw new Error(OUTSIDE)
    if (!roots.some((root) => isWithin(real, root))) throw new Error(OUTSIDE)
    return real
  }

  return {
    vet,
    check,
    allow(dir) {
      const real = vet(dir)
      if (!roots.includes(real)) {
        roots.push(real)
        save()
      }
      return real
    },
    // An opened folder itself, not a folder inside one. Git works only here, so
    // a repository the person keeps inside an opened folder is never touched.
    checkRoot(target) {
      const real = check(target)
      if (!roots.includes(real)) throw new Error('not an opened folder')
      return real
    }
  }
}

// Folders that run what is in them when they sit in the home or Documents
// folder: PowerShell profiles, macOS launch agents, Linux autostart and the
// Windows Startup folder. Hidden names (.ssh, .config) are refused separately.
const RUNS_FILES = new Set(['powershell', 'windowspowershell', 'launchagents', 'launchdaemons', 'autostart', 'startup'])

// A new project folder name must be a single plain name. The page picks it, so
// it is never hidden and never a folder the system runs files from, or a
// person who chose their home folder would hand the page ~/.ssh.
export function checkProjectName(name) {
  if (typeof name !== 'string' || name.trim() === '' || /[/\\:]/.test(name) || name.startsWith('.')) {
    throw new Error('invalid project name')
  }
  // Windows drops trailing dots and spaces, so "PowerShell." is PowerShell.
  if (RUNS_FILES.has(name.toLowerCase().replace(/[. ]+$/, '')) || touchesGitDir(name)) {
    throw new Error('invalid project name')
  }
  return name
}
