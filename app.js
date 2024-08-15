// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
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
import {
	getAuth,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	onAuthStateChanged,
	signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
	getDatabase,
	ref,
	set,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js';
const database = getDatabase(app);
const auth = getAuth(app);

const userEmail = document.querySelector('#userEmail');
const userPassword = document.querySelector('#userPassword');
const authForm = document.querySelector('#authForm');
const secretContent = document.querySelector('#secretContent');
const shortView = document.querySelector('#shortView');
const signUpButton = document.querySelector('#signUpButton');
const signInButton = document.querySelector('#signInButton');
const signOutButton = document.querySelector('#signOutButton');
const longURL = document.querySelector('#longURL');
const createRedirxButton = document.querySelector('#createURLButton');

secretContent.style.display = 'none';
shortView.style.display = 'none';

async function userSignUp() {
	const userEmailValue = userEmail.value;
	const userPasswordValue = userPassword.value;
	try {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			userEmailValue,
			userPasswordValue
		);
		const user = userCredential.user;
		// checkAuthState();
		console.log(user);
	} catch (error) {
		alert(error.code + ': ' + error.message);
	}
}
async function userSignIn() {
	const userEmailValue = userEmail.value;
	const userPasswordValue = userPassword.value;
	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			userEmailValue,
			userPasswordValue
		);
		const user = userCredential.user;

		console.log(user);
	} catch (error) {
		alert(error.code + ': ' + error.message);
	}
}
async function userSignOut() {
	try {
		await signOut(auth);
	} catch (error) {
		alert(error.code + ': ' + error.message);
	}
}
async function createRedirx() {
	//  in rtdb create randomSixCharCode>allowed_view: "", url: "longURL" and return the randomSixCharCode
	const longURLValue = longURL.value;
	const randomSixCharCode = Math.random().toString(36).substring(2, 8);
	const allowed_view = '0';
	const redirxData = {
		allowed_view: allowed_view,
		url: longURLValue,
	};
	try {
		await set(ref(database, 'link_track/' + randomSixCharCode), redirxData);
		console.log(randomSixCharCode);
		shortView.style.display = 'block';
		secretContent.style.display = 'none';
		document.querySelector(
			'#shortURL'
		).innerHTML = `https://redirx.top/${randomSixCharCode}`;
		document.querySelector(
			'#shortURL'
		).href = `https://redirx.top/${randomSixCharCode}`;
	} catch (error) {
		alert(error.code + ': ' + error.message);
	}
}
async function checkAuthState() {
	onAuthStateChanged(auth, (user) => {
		if (user) {
			secretContent.style.display = 'block';
			authForm.style.display = 'none';
		} else {
			secretContent.style.display = 'none';
			authForm.style.display = 'block';
		}
	});
}
checkAuthState();
signUpButton.addEventListener('click', userSignUp);
signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);
createRedirxButton.addEventListener('click', createRedirx);
