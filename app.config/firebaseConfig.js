// --- ADD YOUR FIREBASE CONFIG HERE ---
// Go to Firebase console, create project, enable 'Realtime Database', copy config
var firebaseConfig = {
    apiKey: "AIzaSyCsj6scL5tC202ef_NzTmdM6L-1HCu1VKE",
    authDomain: "libraryseatmanagement-23d01.firebaseapp.com",
    databaseURL: "https://libraryseatmanagement-23d01-default-rtdb.firebaseio.com",
    projectId: "libraryseatmanagement-23d01",
    storageBucket: "libraryseatmanagement-23d01.firebasestorage.app",
    messagingSenderId: "432279031998",
    appId: "1:432279031998:web:5859d6f2d07da563788eef",
    measurementId: "G-PMKQ5P24T6"
  };

  if(!firebase.apps.length){
    firebase.initializeApp(firebaseConfig);
  }

window.db = firebase.database();
window.seatRef = window.db.ref("librarySeats/");

// export default firebaseConfig;