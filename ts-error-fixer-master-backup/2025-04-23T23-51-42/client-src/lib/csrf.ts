
export async function fetchCsrfToken() {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  return data.csrfToken;
}

export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  const csrfToken = await fetchCsrfToken();
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });
}
