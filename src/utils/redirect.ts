/**
 * Valida que um destino de redirect pós-login é um caminho interno,
 * bloqueando redirects para origens externas (`//host`, `https://host`).
 */
export function isSafeRedirect(path: unknown): path is string {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//') &&
    !path.includes('://') &&
    // Browsers treat '\' as '/' and drop tab/newline, so '/\evil.com' and '/\t/evil.com' resolve to //evil.com
    !/[\\\s]/.test(path)
  )
}
