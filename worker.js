addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	// Parse the SHORTCODE from the request URL
	const url = new URL(request.url);
	const shortcode = url.pathname.substring(1);

	// Fetch the data for the SHORTCODE from Firebase
	const firebaseUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}.json`;
	const firebaseResponse = await fetch(firebaseUrl);
	const firebaseData = await firebaseResponse.json();

	// If the SHORTCODE is not found in Firebase, return a 404 response
	if (!firebaseData || !firebaseData.url) {
		return new Response('Not found', { status: 404 });
	}

	// Check if the view count is greater than the allowed view count
	const allowedViews = firebaseData.allowed_views || 0;
	const views = firebaseData.views ? firebaseData.views.length : 0;
	if (allowedViews > 0 && views >= allowedViews) {
		return new Response('Not found', { status: 404 });
	}

	// Redirect to the URL associated with the SHORTCODE
	const redirectUrl = firebaseData.url;
	const response = Response.redirect(redirectUrl);

	// Update the views for the SHORTCODE in Firebase
	const currentDate = new Date().toISOString();
	const newViews = firebaseData.views
		? [...firebaseData.views, currentDate]
		: [currentDate];
	const firebaseUpdate = { views: newViews };
	const firebaseUpdateResponse = await fetch(firebaseUrl, {
		method: 'PATCH',
		body: JSON.stringify(firebaseUpdate),
		headers: {
			'Content-Type': 'application/json',
		},
	});

	return response;
}
