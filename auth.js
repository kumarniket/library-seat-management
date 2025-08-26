    
// ---- AUTH LOGIC ----
function showSeatUI(user) {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('logged-in-section').style.display = '';
    document.getElementById('welcomeMsg').textContent = "Welcome, " + user.email;
    // Now display seats (call your renderSeats here if needed)
  }
  
  function hideSeatUI() {
    document.getElementById('auth-section').style.display = '';
    document.getElementById('logged-in-section').style.display = 'none';
    document.getElementById('welcomeMsg').textContent = '';
  }
  
  function login() {
    const email = document.getElementById('userEmail').value;
    const pass = document.getElementById('userPassword').value;
    firebase.auth().signInWithEmailAndPassword(email, pass)
      .catch(error => { document.getElementById('authError').textContent = error.message; });
  }
  
//   function register() {
//     const email = document.getElementById('userEmail').value;
//     const pass = document.getElementById('userPassword').value;
//     firebase.auth().createUserWithEmailAndPassword(email, pass)
//       .catch(error => { document.getElementById('authError').textContent = error.message; });
//   }
    function register() {
        const email = document.getElementById('userEmail').value;
        const pass = document.getElementById('userPassword').value;
        const name = document.getElementById('userName').value;
        firebase.auth().createUserWithEmailAndPassword(email, pass)
        .then(userCredential => {
            // Save student name in separate node with uid as key
            return firebase.database().ref('students/' + userCredential.user.uid).set({
            name: name,
            email: email
            });
        })
        .catch(error => {
            document.getElementById('authError').textContent = error.message;
        });
    }
  
  function logout() {
    firebase.auth().signOut();
  }
  
  // Listen to auth state (runs on every page load)
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      showSeatUI(user);
    //   seatRef.once('value', snapshot => {
    //     const seatStatus = snapshot.val() || {};
    //     renderSeats(seatStatus); // Call your existing render function
    //   });
    window.seatListner = setRef.on('value', snapshot => {
        const seatStatus = snapshot.val() || {};
        renderSeats(seatStatus); // Call your existing render function
      });
    } else {
      hideSeatUI();
      if(window.seatListner)
      seatRef.off('value');
    }
  });