import fs from 'fs'
import path from 'path'

// The folders the person picked in the open dialog or created through the app.
// File and git requests from the page must stay inside one of them, so a script
// that gets into the page cannot read or write anywhere else on the machine.
// The list lives in the main process and is never taken from the page.
export function createRootStore(file) {
  let roots = []
  try {
    const saved = JSON.parse(fs.readFileSync(file, 'utf-8'))
    if (Array.isArray(saved)) roots = saved.filter((r) => typeof r === 'string' && path.isAbsolute(r))
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
      const resolved = path.resolve(dir)
      if (!roots.includes(resolved)) {
        roots.push(resolved)
        save()
      }
      return resolved
    },
    check(target) {
      if (typeof target !== 'string' || target === '') throw new Error('path is outside the opened folders')
      const resolved = path.resolve(target)
      const inside = roots.some(
        (root) => resolved === root || resolved.startsWith(root.endsWith(path.sep) ? root : root + path.sep)
      )
      if (!inside) throw new Error('path is outside the opened folders')
      return resolved
    }
  }
}

// A new project folder name must be a single plain name.
export function checkProjectName(name) {
  if (typeof name !== 'string' || name.trim() === '' || name === '.' || name === '..' || /[/\\]/.test(name)) {
    throw new Error('invalid project name')
  }
  return name
}
