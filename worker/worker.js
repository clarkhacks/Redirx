addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

const apiKey = API_KEY;
const umamiWebsiteId = 'de88c98a-5bb1-4cb4-afa0-4cfd0d6b46a5'; // Your Umami website ID
const umamiHostUrl = 'https://umami.weckmann.me/api/send'; // Umami tracking endpoint
const umamiAuthUrl = 'https://umami.weckmann.me/api/auth/login'; // Umami auth endpoint
const umamiUsername = 'admin'; // Replace with your Umami username
const umamiPassword = 'JvbH4Ww21$'; // Replace with your Umami password

let authToken = null; // This will store the authentication token

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
	if (shortcode.startsWith('mf-')) {
		const firebaseUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}/images.json`;
		const firebaseResponse = await fetch(firebaseUrl);
		const firebaseData = await firebaseResponse.json();
		const images = firebaseData;
		console.log(JSON.stringify(firebaseData));
		// render the images
		let imageHtml = '';
		for (const image of images) {
			imageHtml += `
	<div class="mx-auto max-w-sm bg-white shadow-lg rounded-lg overflow-hidden">
		<img src="${image}" alt="Image" class="w-full object-cover max-h-96 cursor-pointer"
			 onclick="window.open('${image}', '_blank')">
		<div class="p-4">
			<button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
				<a href="${image}" download="${image}">Download</a>
			</button>
		</div>
	</div>
	`;
		}
		// return the html
		let returnedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>RdRx Image Gallery</title>
	<meta name="description" content="Image gallery hosted on RdRx">
	<meta name="robots" content="noindex, nofollow">
	<meta property="og:image" content="${images[0]}">
	<meta property="og:title" content="RdRx Image Gallery">
	<meta property="og:description" content="Image gallery hosted on RdRx">
	<meta property="og:url" content="https://my.redirx.top/${shortcode}">
	<meta property="og:type" content="website">
	<meta property="og:site_name" content="RdRx Image Gallery">
	<meta name="twitter:image" content="${images[0]}">
	<link rel="apple-touch-icon" sizes="57x57" href="https://my.redirx.top/worker/apple-icon-57x57.png">
<link rel="apple-touch-icon" sizes="60x60" href="https://my.redirx.top/worker/apple-icon-60x60.png">
<link rel="apple-touch-icon" sizes="72x72" href="https://my.redirx.top/worker/apple-icon-72x72.png">
<link rel="apple-touch-icon" sizes="76x76" href="https://my.redirx.top/worker/apple-icon-76x76.png">
<link rel="apple-touch-icon" sizes="114x114" href="https://my.redirx.top/worker/apple-icon-114x114.png">
<link rel="apple-touch-icon" sizes="120x120" href="https://my.redirx.top/worker/apple-icon-120x120.png">
<link rel="apple-touch-icon" sizes="144x144" href="https://my.redirx.top/worker/apple-icon-144x144.png">
<link rel="apple-touch-icon" sizes="152x152" href="https://my.redirx.top/worker/apple-icon-152x152.png">
<link rel="apple-touch-icon" sizes="180x180" href="https://my.redirx.top/worker/apple-icon-180x180.png">
<link rel="icon" type="image/png" sizes="192x192"  href="https://my.redirx.top/worker/android-icon-192x192.png">
<link rel="icon" type="image/png" sizes="32x32" href="https://my.redirx.top/worker/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="https://my.redirx.top/worker/favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="https://my.redirx.top/worker/favicon-16x16.png">
<meta name="msapplication-TileColor" content="#ffffff">
<meta name="msapplication-TileImage" content="https://my.redirx.top/worke/ms-icon-144x144.png">
<meta name="theme-color" content="#ffffff">
	<meta 
	<link rel="stylesheet" href="https://my.redirx.top/mf.css">
</head>
<body>
	<div class="w-full mx-auto p-4">
		<div class="grid gap-6 w-full">
			${imageHtml}
		</div>
	</div>
</body>
</html>`;

		return new Response(returnedHtml, {
			headers: { 'Content-Type': 'text/html' },
		});
	}
	if (
		shortcode.endsWith('.png') ||
		shortcode.endsWith('.jpg') ||
		shortcode.endsWith('.jpeg') ||
		shortcode.endsWith('.gif') ||
		shortcode.endsWith('.webp')
	) {
		const firebaseUrl = `https://firebasestorage.googleapis.com/v0/b/wkmn-link-track.appspot.com/o/rdrx-file-upload%2F${shortcode}?alt=media`;
		// don't redirect, just return the image with a cache of 1 year
		const imageResponse = await fetch(firebaseUrl);
		const headers = new Headers(imageResponse.headers);
		headers.set('Cache-Control', 'public, max-age=31536000, immutable');
		return new Response(imageResponse.body, { headers });
	}
	const redirectUrl = await fetchShortcodeUrl(shortcode);

	// If shortcode not found, return a 404
	if (!redirectUrl) {
		return fetchNotFoundPage();
	}

	const viewData = generateViewData(request);

	// Ensure we are authenticated before tracking
	if (!authToken) {
		await authenticateUmami();
	}

	// Track the view in Umami
	await umamiTrack(request.url, viewData, redirectUrl);

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

// Umami Authentication
async function authenticateUmami() {
	const credentials = {
		username: umamiUsername,
		password: umamiPassword,
	};

	const response = await fetch(umamiAuthUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(credentials),
	});

	if (!response.ok) {
		throw new Error('Failed to authenticate with Umami');
	}

	const data = await response.json();
	authToken = data.token;
}

// Umami tracking for the new /api/send endpoint
async function umamiTrack(url, viewData, redirectUrl) {
	const payload = {
		payload: {
			hostname: 'redirx.top',
			language: viewData.language || 'en-US',
			referrer: viewData.referrer || '',
			screen: `${viewData.screenWidth || 1920}x${
				viewData.screenHeight || 1080
			}`,
			title: 'URL Redirect',
			url: redirectUrl,
			website: umamiWebsiteId,
			data: {
				ip: viewData.ip,
				userAgent: viewData.userAgent,
			},
		},
		type: 'event',
	};

	await fetch(umamiHostUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${authToken}`,
			'User-Agent': viewData.userAgent,
		},
		body: JSON.stringify(payload),
	}).then((response) => console.log(JSON.stringify(response)));
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
		api_key: apiKey,
		screenWidth: request.headers.get('Screen-Width') || 1920,
		screenHeight: request.headers.get('Screen-Height') || 1080,
		language: request.headers.get('Accept-Language') || 'en-US',
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
