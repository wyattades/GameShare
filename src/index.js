import './styles/styles.scss';
import * as firebase from "firebase";

//initialize firebase
var config = {
	apiKey: "AIzaSyCamJZSmEMknQOm0lQHh4lPL7Derjeb9Zk",
    authDomain: "gameshare-7158b.firebaseapp.com",
    databaseURL: "https://gameshare-7158b.firebaseio.com",
    projectId: "gameshare-7158b",
    storageBucket: "gameshare-7158b.appspot.com"
};
firebase.initializeApp(config);
var database = firebase.database();
var provider = new firebase.auth.GoogleAuthProvider();
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
const googleSignIn = e => {
	//e.target.removeEventListener(e.type, googleSignIn);
	var u = firebase.auth().currentUser;
	if (u) {
		console.log("Signed in already");
	} else {
		firebase.auth().signInWithPopup(provider).then(function(result) {
			console.log("Sign in success");
		}, function(error) {
			var errorCode = error.code;
			var errorMessage = error.message;
		});
	}
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
			var exday = 1; //days until cookie expires
			var d = new Date();
			d.setTime(d.getTime() + (exday*24*60*60*1000));
			var expires = "expires="+ d.toUTCString();
			document.cookie = "FirebaseUID=" + user.uid + "; domain=NULL" + ";" + expires + ";path=/";
			firebase.database().ref('users/' + user.uid).set({
				username: user.displayName,
				email: user.email,
			});
			firebase.database().ref('users/' + user.uid).on('value',function(snapshot) {
				if (snapshot!=null) {
					console.log(snapshot.val());
				}
			});
		} else {

		}
	});
};
document.getElementById('google-sign-in').addEventListener('click', googleSignIn);

// TEMP
const logout = e => {
  // Logout of firebase:
  //e.target.removeEventListener(e.type, logout);
		firebase.auth().signOut().then(function() {
			// Sign-out successful.
			console.log("Signed out");
		}).catch(function(error) {
			// An error happened.
		});
};
document.getElementById('logout').addEventListener('click', logout);

