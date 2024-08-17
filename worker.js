addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});
const firebaseURL = `https://YOUR-FIREBASEIO-URL/link_track/${shortcode}.json`;

async function handleRequest(request) {
	const handlers = {
		POST: handlePostRequest,
		GET: handleGetRequest,
	};

	const handler = handlers[request.method] || handleMethodNotAllowed;
	return handler(request);
}

async function handleGetRequest(request) {
	const shortcode = new URL(request.url).pathname.substring(1);
	const firebaseData = await fetchFirebaseData(shortcode);

	if (!firebaseData || !firebaseData.url) {
		return new Response('Not found', { status: 404 });
	}

	return Response.redirect(firebaseData.url);
}

async function handlePostRequest(request) {
	try {
		const { url, api_key } = await request.json();

		if (!url || !api_key) {
			return new Response('Bad Request: Missing url or api_key', {
				status: 400,
			});
		}

		const shortcode = generateShortcode();
		const newLinkData = {
			url,
			created_at: new Date().toISOString(),
			views: [],
			api_key,
		};
		const responseData = await saveToFirebase(shortcode, newLinkData);

		return new Response(
			JSON.stringify({ shortcode, databaseResponse: responseData }),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		return new Response('Internal Server Error', { status: 500 });
	}
}

async function fetchFirebaseData(shortcode) {
	const firebaseResponse = await fetch(firebaseURL);
	return await firebaseResponse.json();
}

async function saveToFirebase(shortcode, data) {
	const firebaseResponse = await fetch(firebaseURL, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
	return await firebaseResponse.json();
}

function generateShortcode() {
	return Math.random().toString(36).substr(2, 6);
}

function handleMethodNotAllowed() {
	return new Response('Method not allowed', { status: 405 });
}
