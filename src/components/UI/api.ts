export interface ApiOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	body?: unknown;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	try {
		const token = localStorage.getItem('app-token');
		if (token) headers['Authorization'] = `Bearer ${token}`;
	} catch {}
	const res = await fetch(path, {
		method: opts.method || 'GET',
		headers,
		body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
	});
	if (!res.ok) {
		let message = `Request failed with ${res.status}`;
		try {
			const data = await res.json();
			if (data && data.error) message = data.error;
		} catch {}
		const err: any = new Error(message);
		err.status = res.status;
		throw err;
	}
	return (await res.json()) as T;
}



