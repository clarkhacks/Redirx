addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	switch (request.method) {
		case 'POST':
			return handlePostRequest(request);
		case 'GET':
			return handleGetRequest(request);
		default:
			return new Response('Method not allowed', { status: 405 });
	}
}

// Handle GET request
async function handleGetRequest(request) {
	const shortcode = getShortcodeFromRequest(request);

	// If no shortcode, return the default page
	if (!shortcode) {
		return fetchDefaultPage();
	}

	const redirectUrl = await fetchShortcodeUrl(shortcode);

	// If shortcode not found, return a 404
	if (!redirectUrl) {
		return fetchNotFoundPage();
	}

	const viewData = generateViewData(request);
	await logViewData(shortcode, viewData);

	// Redirect to the found URL
	return Response.redirect(redirectUrl);
}

// Handle POST request
async function handlePostRequest(request) {
	try {
		const body = await request.json();
		const { url, api_key, custom, custom_code } = body;

		if (!url || !api_key) {
			return new Response('Bad Request: Missing url or api_key', {
				status: 400,
			});
		}

		const shortcode = custom && custom_code ? custom_code : generateShortcode();
		const newLinkData = createLinkData(url, api_key);

		const firebaseResponse = await saveToFirebase(shortcode, newLinkData);
		const responseData = await firebaseResponse.json();

		return new Response(
			JSON.stringify({ shortcode, databaseResponse: responseData }),
			{
				status: firebaseResponse.status,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (error) {
		return new Response('Internal Server Error', { status: 500 });
	}
}

// Utility: Parse shortcode from request
function getShortcodeFromRequest(request) {
	const url = new URL(request.url);
	const shortcode = url.pathname.substring(1);
	return shortcode && shortcode.length >= 2 ? shortcode : null;
}

// Utility: Fetch default page
async function fetchDefaultPage() {
	const generalPageUrl = 'https://www.clark.today/general-purpose-domain/';
	let pageContent = await fetchPageContent(generalPageUrl);

	return new Response(pageContent, {
		headers: { 'Content-Type': 'text/html' },
	});
}

// Utility: Fetch 404 not found page
async function fetchNotFoundPage() {
	const notFoundPageUrl = 'https://my.redirx.top/+not-found';
	let pageContent = await fetchPageContent(notFoundPageUrl);

	return new Response(pageContent, {
		headers: { 'Content-Type': 'text/html' },
		status: 404,
	});
}

// Utility: Fetch page content and correct asset paths
async function fetchPageContent(url) {
	let response = await fetch(url);
	let pageContent = await response.text();
	pageContent = pageContent
		.replace(/src="\//g, 'src="https://www.clark.today/')
		.replace(/href="\//g, 'href="https://www.clark.today/');
	return pageContent;
}

// Utility: Fetch URL associated with shortcode from Firebase
async function fetchShortcodeUrl(shortcode) {
	const firebaseUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}/url.json`;
	const firebaseResponse = await fetch(firebaseUrl);
	return firebaseResponse.json();
}

// Utility: Log view data to Firebase
async function logViewData(shortcode, viewData) {
	const firebaseUpdateUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}/views.json`;
	await fetch(firebaseUpdateUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(viewData),
	});
}

// Utility: Generate shortcode
function generateShortcode() {
	return Math.random().toString(36).substr(2, 6);
}

// Utility: Create link data for Firebase
function createLinkData(url, api_key) {
	return {
		url,
		created_at: new Date().toISOString(),
		views: [],
		api_key,
	};
}

// Utility: Save link data to Firebase
async function saveToFirebase(shortcode, data) {
	const firebaseSaveUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}.json`;
	return fetch(firebaseSaveUrl, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	});
}

// Utility: Generate view data for analytics
function generateViewData(request) {
	const chicagoTime = new Date().toLocaleString('en-US', {
		timeZone: 'America/Chicago',
	});

	const visitorIP =
		request.headers.get('CF-Connecting-IP') ||
		request.headers.get('X-Forwarded-For') ||
		request.headers.get('Remote-Addr');

	const viewData = {
		timestamp: chicagoTime,
		ip: visitorIP,
		userAgent: request.headers.get('User-Agent'),
		referrer: request.headers.get('Referer'),
	};

	if (request.cf) {
		viewData.location = {
			country: request.cf.country,
			city: request.cf.city,
			region: request.cf.region,
			latitude: request.cf.latitude,
			longitude: request.cf.longitude,
			postalCode: request.cf.postalCode,
			timezone: request.cf.timezone,
		};
	}

	return viewData;
}
