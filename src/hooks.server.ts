import type { Handle } from '@sveltejs/kit';
import app from '$lib/server';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/api')) {
    console.log()
		return app.fetch(event.request);
	}

	const response = await resolve(event);
	return response;
};