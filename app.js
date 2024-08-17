// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
// Replace with your firebase config
const firebaseConfig = {
	apiKey: 'X',
	authDomain: 'X',
	databaseURL: 'X',
	projectId: 'X',
	storageBucket: 'X',
	messagingSenderId: 'X',
	appId: 'X',
};
const app = initializeApp(firebaseConfig);
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
const database = getDatabase(app);
const auth = getAuth(app);

const userEmail = document.querySelector('#userEmail');
const userPassword = document.querySelector('#userPassword');
const authForm = document.querySelector('#authForm');
const secretContent = document.querySelector('#secretContent');
const shortView = document.querySelector('#shortView');
// const signUpButton = document.querySelector('#signUpButton');
const signInButton = document.querySelector('#signInButton');
const signOutButton = document.querySelector('#signOutButton');
const longURL = document.querySelector('#longURL');
const createRedirxButton = document.querySelector('#createURLButton');

secretContent.style.display = 'none';
shortView.style.display = 'none';

// async function userSignUp() {
// 	const userEmailValue = userEmail.value;
// 	const userPasswordValue = userPassword.value;
// 	try {
// 		const userCredential = await createUserWithEmailAndPassword(
// 			auth,
// 			userEmailValue,
// 			userPasswordValue
// 		);
// 		const user = userCredential.user;
// 		// checkAuthState();
// 		console.log(user);
// 	} catch (error) {
// 		alert(error.code + ': ' + error.message);
// 	}
// }
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
		).innerHTML = `https://YOUR-SHORT-URL/${randomSixCharCode}`;
		document.querySelector(
			'#shortURL'
		).href = `https://YOUR-SHORT-URL/${randomSixCharCode}`;
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
// signUpButton.addEventListener('click', userSignUp);
signInButton.addEventListener('click', userSignIn);
signOutButton.addEventListener('click', userSignOut);
createRedirxButton.addEventListener('click', createRedirx);
