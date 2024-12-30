// Save token to localStorage
export function saveToken(token) {
    localStorage.setItem('token', token);
}

// Get token from localStorage
export function getToken() {
    return localStorage.getItem('token');
}

// Remove token from localStorage (logout)
export function removeToken() {
    localStorage.removeItem('token');
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!getToken(); // Returns true if a token exists
}
