addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	if (request.method === 'POST') {
		return handlePostRequest(request);
	} else if (request.method === 'GET') {
		return handleGetRequest(request);
	} else {
		return new Response('Method not allowed', { status: 405 });
	}
}

async function handleGetRequest(request) {
	// Parse the SHORTCODE from the request URL
	const url = new URL(request.url);
	const shortcode = url.pathname.substring(1);

	// If the path is empty or doesn't contain a valid shortcode, fetch the default page
	if (!shortcode || shortcode.length < 2) {
		const generalPageUrl = 'https://www.clark.today/general-purpose-domain/';

		// Fetch the general-purpose domain page content
		let response = await fetch(generalPageUrl);
		let pageContent = await response.text();

		// Replace assets starting with '/' to load correctly
		pageContent = pageContent.replace(
			/src="\//g,
			'src="https://www.clark.today/'
		);
		pageContent = pageContent.replace(
			/href="\//g,
			'href="https://www.clark.today/'
		);

		return new Response(pageContent, {
			headers: { 'Content-Type': 'text/html' },
		});
	}

	// Fetch the URL for the SHORTCODE from Firebase (only the url field)
	const firebaseUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}/url.json`;
	const firebaseResponse = await fetch(firebaseUrl);
	const redirectUrl = await firebaseResponse.json();

	// If the SHORTCODE is not found in Firebase, return a 404 response
	if (!redirectUrl) {
		const generalPageUrl = 'https://my.redirx.top/+not-found/';

		// Fetch the general-purpose domain page content
		let response = await fetch(generalPageUrl);
		let pageContent = await response.text();

		return new Response(pageContent, {
			headers: { 'Content-Type': 'text/html' },
			status: 404,
		});
	}

	// Convert the current time to Chicago time and format it
	const chicagoTime = new Date().toLocaleString('en-US', {
		timeZone: 'America/Chicago',
	});

	// Extract the visitor's IP address
	const visitorIP =
		request.headers.get('CF-Connecting-IP') ||
		request.headers.get('X-Forwarded-For') ||
		request.headers.get('Remote-Addr');

	// Prepare the view data with additional details
	const viewData = {
		timestamp: chicagoTime,
		ip: visitorIP,
		userAgent: request.headers.get('User-Agent'),
		referrer: request.headers.get('Referer'),
	};

	// If Cloudflare provides additional geo-location data, use it
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

	// Update the views array in Firebase by adding the new viewData object
	const firebaseUpdateUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}/views.json`;
	await fetch(firebaseUpdateUrl, {
		method: 'POST', // Use POST to add a new entry to the views array
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(viewData),
	});

	// Redirect to the URL associated with the SHORTCODE
	return Response.redirect(redirectUrl);
}

async function handlePostRequest(request) {
	try {
		// Parse the JSON body from the POST request
		const body = await request.json();

		// Validate the incoming data
		const { url, api_key, custom, custom_code } = body;
		if (!url || !api_key) {
			return new Response('Bad Request: Missing url or api_key', {
				status: 400,
			});
		}

		// Determine the shortcode to use
		let shortcode;
		if (custom && custom_code) {
			shortcode = custom_code;
		} else {
			shortcode = Math.random().toString(36).substr(2, 6);
		}

		// Prepare the data to be stored
		const newLinkData = {
			url: url,
			created_at: new Date().toISOString(),
			views: [],
			api_key: api_key, // Include the API key in the stored data
		};

		// Save the data to Firebase
		const firebaseSaveUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}.json`;
		const firebaseResponse = await fetch(firebaseSaveUrl, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newLinkData),
		});

		// Return the response from Firebase directly
		const responseData = await firebaseResponse.json();
		const returnData = {
			shortcode: shortcode,
			databaseResponse: responseData,
		};

		return new Response(JSON.stringify(returnData), {
			status: firebaseResponse.status,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		return new Response('Internal Server Error', { status: 500 });
	}
}
