import { isSafeExternalUrl, checkRevision, pathArgs } from './safety'

describe('isSafeExternalUrl', () => {
  it.each(['https://example.com/a', 'http://example.com', 'mailto:a@example.com'])('allows %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(true)
  })

  it.each([
    'file:///Applications/Calculator.app',
    'smb://host/share',
    'javascript:alert(1)',
    'vscode://file/etc/passwd',
    'not a url',
    ''
  ])('refuses %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(false)
  })
})

describe('checkRevision', () => {
  it.each(['HEAD', 'HEAD~1', 'main', 'feature/x', 'a1b2c3d', 'HEAD@{1}'])('accepts %s', (rev) => {
    expect(checkRevision(rev)).toBe(rev)
  })

  it.each(['--output=/tmp/x', '-p', '', 'HEAD x', 'HEAD:secret', null])('refuses %s', (rev) => {
    expect(() => checkRevision(rev)).toThrow('invalid revision')
  })
})

describe('pathArgs', () => {
  it('puts every path after the option terminator', () => {
    expect(pathArgs('--output=/tmp/x')).toEqual(['--', '--output=/tmp/x'])
    expect(pathArgs(['a.md', '-b.md'])).toEqual(['--', 'a.md', '-b.md'])
    expect(pathArgs('.')).toEqual(['--', '.'])
  })

  it.each([undefined, '', [], ['a.md', 3]])('refuses %s', (files) => {
    expect(() => pathArgs(files)).toThrow('invalid path')
  })
})
