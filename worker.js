addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST') {
    return handlePostRequest(request)
  } else if (request.method === 'GET') {
    return handleGetRequest(request)
  } else {
    return new Response('Method not allowed', { status: 405 })
  }
}

async function handleGetRequest(request) {
  // Parse the SHORTCODE from the request URL
  const url = new URL(request.url)
  const shortcode = url.pathname.substring(1)

  // Fetch the data for the SHORTCODE from Firebase
  const firebaseUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}.json`
  const firebaseResponse = await fetch(firebaseUrl)
  const firebaseData = await firebaseResponse.json()

  // If the SHORTCODE is not found in Firebase, return a 404 response
  if (!firebaseData || !firebaseData.url) {
    return new Response('Not found', { status: 404 })
  }

  // Redirect to the URL associated with the SHORTCODE
  const redirectUrl = firebaseData.url
  return Response.redirect(redirectUrl)
}

async function handlePostRequest(request) {
  try {
    // Parse the JSON body from the POST request
    const body = await request.json()

    // Validate the incoming data
    const { url, api_key } = body
    if (!url || !api_key) {
      return new Response('Bad Request: Missing url or api_key', { status: 400 })
    }

    // Generate a unique shortcode (you can improve this with a more sophisticated algorithm)
    const shortcode = Math.random().toString(36).substr(2, 6)

    // Prepare the data to be stored
    const newLinkData = {
      url: url,
      created_at: new Date().toISOString(),
      views: [],
      api_key: api_key  // Include the API key in the stored data
    }

    // Save the data to Firebase
    const firebaseSaveUrl = `https://wkmn-link-track-default-rtdb.firebaseio.com/link_track/${shortcode}.json`
    const firebaseResponse = await fetch(firebaseSaveUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLinkData)
    })

    // Return the response from Firebase directly
    const responseData = await firebaseResponse.json()
	const returnData = {
		"shortcode": shortcode,
		"databaseResponse": responseData
	}
    return new Response(JSON.stringify(returnData), {
      status: firebaseResponse.status,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response('Internal Server Error', { status: 500 })
  }
}
