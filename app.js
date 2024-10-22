// Firebase Initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import {
	getAuth,
	signInWithEmailAndPassword,
	onAuthStateChanged,
	signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
	getDatabase,
	ref,
	set,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js';
import {
	getStorage,
	ref as storageRef,
	uploadBytes,
	getDownloadURL,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js';

const firebaseConfig = {
	apiKey: 'AIzaSyCRWH9mw1Cfxh2-batz6cXeUkT_vMi8la4',
	authDomain: 'wkmn-link-track.firebaseapp.com',
	databaseURL: 'https://wkmn-link-track-default-rtdb.firebaseio.com',
	projectId: 'wkmn-link-track',
	storageBucket: 'wkmn-link-track.appspot.com',
	messagingSenderId: '868512692736',
	appId: '1:868512692736:web:98882b62310bc7e444b6e5',
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Utility Functions
const selectElement = (id) => document.querySelector(id);

const toggleElementDisplay = (element, displayState) => {
	element.style.display = displayState;
};

const handleError = (error) => {
	alert(`${error.code}: ${error.message}`);
};

// DOM Elements
const userEmail = selectElement('#userEmail');
const userPassword = selectElement('#userPassword');
const authForm = selectElement('#authForm');
const secretContent = selectElement('#secretContent');
const shortView = selectElement('#shortView');
const signInButton = selectElement('#signInButton');
const signOutButton = selectElement('#signOutButton');
const longURL = selectElement('#longURL');
const createRedirxButton = selectElement('#createURLButton');
const fileUpload = selectElement('#fileUpload');
const uploadFileButton = selectElement('#uploadFileButton');
const orCreateFile = selectElement('#orCreateFile');
const fileUploadView = selectElement('#fileUploadView');
const shortURL = selectElement('#shortURL');
const refreshButton = selectElement('#refreshPage');

// Initial View Setup
toggleElementDisplay(secretContent, 'none');
toggleElementDisplay(shortView, 'none');
toggleElementDisplay(fileUploadView, 'none');

// Authentication Functions
async function userSignIn() {
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			userEmail.value,
			userPassword.value
		);
		console.log(userCredential.user);
	} catch (error) {
		handleError(error);
	}
}

async function userSignOut() {
	try {
		await signOut(auth);
	} catch (error) {
		handleError(error);
	}
}

// Auth State Change Listener
function checkAuthState() {
	onAuthStateChanged(auth, (user) => {
		if (user) {
			toggleElementDisplay(secretContent, 'block');
			toggleElementDisplay(authForm, 'none');
		} else {
			toggleElementDisplay(secretContent, 'none');
			toggleElementDisplay(authForm, 'block');
		}
	});
}

// Database Functions
async function createRedirxURL(longURLValue, type) {
	let prefix = '';
	type == undefined ? (prefix = '') : (prefix = type);
	const randomSixCharCode = prefix + Math.random().toString(36).substring(2, 8);
	const redirxData = {
		allowed_view: '0',
		url: longURLValue,
	};

	try {
		if (type == 'mf-') {
			await set(ref(database, 'link_track/' + randomSixCharCode), {
				images: longURLValue,
				url: 'https://rdrx.top/' + randomSixCharCode,
			});
			return randomSixCharCode;
		}
		await set(ref(database, 'link_track/' + randomSixCharCode), redirxData);
		return randomSixCharCode;
	} catch (error) {
		handleError(error);
	}
}

async function createCustomRedirxURL(longURLValue, shortCode) {
	const redirxData = {
		allowed_view: '0',
		url: longURLValue,
	};

	try {
		await set(ref(database, 'link_track/' + shortCode), redirxData);
		return shortCode;
	} catch (error) {
		handleError(error);
	}
}

async function createRedirx() {
	const longURLValue = longURL.value;
	const shortCode = await createRedirxURL(longURLValue);
	if (shortCode) {
		toggleElementDisplay(shortView, 'block');
		toggleElementDisplay(secretContent, 'none');
		shortURL.innerHTML = `https://rdrx.top/${shortCode}`;
		shortURL.href = `https://rdrx.top/${shortCode}`;
		selectElement(
			'#img'
		).src = `https://qr.redirx.top/?url=https://rdrx.top/${shortCode}`;
	}
}

function refreshPage() {
	window.location.reload();
}

// Firebase Storage Functions
async function uploadFileToFirebase(file) {
	const fileName = file.name;
	const storageReference = storageRef(storage, 'rdrx-file-upload/' + fileName);

	try {
		uploadFileButton.innerHTML = 'Uploading...';
		console.log('Trying to upload');
		const snapshot = await uploadBytes(storageReference, file);
		return await getDownloadURL(snapshot.ref);
	} catch (error) {
		handleError(error);
	}
}

async function createFileShortURL(downloadURL, existingShortCode) {
	if (existingShortCode) {
		await createCustomRedirxURL(downloadURL, existingShortCode);
		toggleElementDisplay(shortView, 'block');
		toggleElementDisplay(fileUploadView, 'none');
		shortURL.innerHTML = `https://rdrx.top/${existingShortCode}`;
		shortURL.href = `https://rdrx.top/${existingShortCode}`;
	}
	if (!existingShortCode) {
		const shortCode = await createRedirxURL(downloadURL, 'f-');
		if (shortCode) {
			toggleElementDisplay(shortView, 'block');
			toggleElementDisplay(fileUploadView, 'none');
			shortURL.innerHTML = `https://rdrx.top/${shortCode}`;
			shortURL.href = `https://rdrx.top/${shortCode}`;
		}
	}
}

// Event Listeners
signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);
createRedirxButton.addEventListener('click', createRedirx);
refreshButton.addEventListener('click', refreshPage);

orCreateFile.addEventListener('click', () => {
	toggleElementDisplay(fileUploadView, 'block');
	toggleElementDisplay(secretContent, 'none');
});

uploadFileButton.addEventListener('click', async (e) => {
	e.preventDefault();

	const files = fileUpload.files;
	if (files.length > 0) {
		const fileURLs = [];

		// Loop through each file and upload
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			const downloadURL = await uploadFileToFirebase(file);
			fileURLs.push(downloadURL);
		}

		// Once all files are uploaded, store the URLs as an array in Firebase
		if (fileURLs.length === files.length) {
			const shortCode = await createRedirxURL(fileURLs, 'mf-'); // Pass the array directly
			if (shortCode) {
				toggleElementDisplay(shortView, 'block');
				toggleElementDisplay(fileUploadView, 'none');
				shortURL.innerHTML = `https://rdrx.top/${shortCode}`;
				shortURL.href = `https://rdrx.top/${shortCode}`;
			}
		}
	} else {
		alert('No files selected!');
	}
});

// Initialize
checkAuthState();
