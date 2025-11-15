const baseUrl = process.env.CIRCLE_API_BASE_URL;
const apiKey = process.env.CIRCLE_API_KEY;

interface CircleResponse<T> {
  data: T;
  [key: string]: unknown;
}

export async function circleRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) {
    throw new Error('Set CIRCLE_API_BASE_URL in your environment as described in the Circle docs.');
  }
  if (!apiKey) {
    throw new Error('Set CIRCLE_API_KEY in your environment before calling Circle APIs.');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers
    }
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Circle API error (${response.status}): ${payload}`);
  }

  const parsed = (await response.json()) as CircleResponse<T> | T;
  return 'data' in (parsed as CircleResponse<T>) ? (parsed as CircleResponse<T>).data : (parsed as T);
}
