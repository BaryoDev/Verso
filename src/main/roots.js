import fs from 'fs'
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

// The folders the person picked in the open dialog or created through the app.
// File and git requests from the page must stay inside one of them, so a script
// that gets into the page cannot read or write anywhere else on the machine.
// The list lives in the main process and is never taken from the page.
export function createRootStore(file) {
  let roots = []
  try {
    const saved = JSON.parse(fs.readFileSync(file, 'utf-8'))
    if (Array.isArray(saved)) {
      roots = saved
        .filter((r) => typeof r === 'string' && path.isAbsolute(r) && !touchesGitDir(r))
        .flatMap((r) => {
          try {
            return [realLocation(r)]
          } catch {
            return []
          }
        })
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

  return {
    allow(dir) {
      if (typeof dir !== 'string' || dir === '' || touchesGitDir(path.resolve(dir))) {
        throw new Error('invalid folder')
      }
      const real = realLocation(dir)
      if (touchesGitDir(real)) throw new Error('invalid folder')
      if (!roots.includes(real)) {
        roots.push(real)
        save()
      }
      return real
    },
    check(target) {
      if (typeof target !== 'string' || target === '') throw new Error(OUTSIDE)
      const real = realLocation(target)
      if (touchesGitDir(path.resolve(target)) || touchesGitDir(real)) throw new Error(OUTSIDE)
      const inside = roots.some(
        (root) => real === root || real.startsWith(root.endsWith(path.sep) ? root : root + path.sep)
      )
      if (!inside) throw new Error(OUTSIDE)
      return real
    }
  }
}

// A new project folder name must be a single plain name.
export function checkProjectName(name) {
  if (
    typeof name !== 'string' ||
    name.trim() === '' ||
    name === '.' ||
    name === '..' ||
    /[/\\]/.test(name) ||
    touchesGitDir(name)
  ) {
    throw new Error('invalid project name')
  }
  return name
}
