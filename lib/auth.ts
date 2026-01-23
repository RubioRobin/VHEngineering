/**
 * Simple admin authentication
 * Checks if provided code matches environment variable
 */
export function isValidAdminCode(code: string): boolean {
    const adminCode = process.env.ADMIN_CODE || 'VH_BroodBaas';
    return code === adminCode;
}

/**
 * Middleware helper to check admin authentication from request headers
 */
export function checkAdminAuth(authHeader: string | null): boolean {
    if (!authHeader) {
        return false;
    }

    // Expected format: "Bearer <admin_code>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return false;
    }

    return isValidAdminCode(parts[1]);
}
