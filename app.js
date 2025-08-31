// Assumes Firebase is initialized and seatRef is globally available (from firebaseConfig.js)

// Set up or update number of seats
function setSeats() {
  const n = parseInt(document.getElementById('seatCount').value);
  seatRef.once('value').then(snapshot => {
    const seatStatus = snapshot.val() || {};
    const newStatus = {};
    for (let i = 1; i <= n; i++) {
      const s = seatStatus[i];
      if (s && typeof s === 'object') {
        newStatus[i] = s; // keep previous object seat data if exists
      } else {
        newStatus[i] = { occupied: false, occupiedAt: null, totalTime: null, student: null }; // init vacant
      }
    }
    seatRef.set(newStatus).then(populateSeatOptions); // Refresh admin seat dropdown
  });
}

// Render seat buttons from DB (Admin + Student view)
function renderSeats(seatStatus) {
  const seatsDiv = document.getElementById('seats');
  seatsDiv.innerHTML = '';
  Object.keys(seatStatus).forEach(i => {
    const seatData = seatStatus[i] || { occupied: false, occupiedAt: null, totalTime: null };
    const isOccupied = !!seatData.occupied;
    const iconSrc = isOccupied ? 'assets/occupied.png' : 'assets/vacant.png';
    const statusText = isOccupied ? 'Occupied' : 'Vacant';
    let infoText = '';
    if (isOccupied && seatData.occupiedAt)
      infoText = `<small class="seat-info-text">Occupied for: ${Math.floor((Date.now() - seatData.occupiedAt) / 60000)} min</small>`;
    else if (!isOccupied && seatData.totalTime != null)
      infoText = `<small class="seat-info-text">Last Occupied: ${seatData.totalTime} min</small>`;
    let occupantText = '';
    if (isOccupied && seatData.student && typeof seatData.student === "object" && typeof seatData.student.name === "string")
      occupantText = `<small class="seat-occupant">By: ${seatData.student.name}</small>`;
    const seat = document.createElement('div');
    seat.classList.add('seat');
    if (isOccupied) seat.classList.add('occupied');
    seat.innerHTML = `
      <div>
        <img src="${iconSrc}" alt="${statusText}" class="seat-icon" />
        <span class="seat-number">Seat No-${i}</span>
        <span class="seat-status-text">${statusText}</span><br>
        ${infoText}
        ${occupantText}
      </div>
    `;
    
    seat.onclick = function() {
      const user = firebase.auth().currentUser;
      if (!user) return;
    
      // Prevent one student from booking multiple seats
      seatRef.once('value').then(allSeatsSnap => {
        const allSeats = allSeatsSnap.val() || {};
        let alreadyOccupied = false;
        let occupiedSeatId = null;
    
        Object.keys(allSeats).forEach(seatId => {
          const checkSeat = allSeats[seatId];
          if (
            checkSeat.occupied &&
            checkSeat.student &&
            checkSeat.student.uid === user.uid
          ) {
            alreadyOccupied = true;
            occupiedSeatId = seatId;
          }
        });
    
        // If student already has a seat
        if (!seatData.occupied && alreadyOccupied) {
          alert(`You have already occupied Seat No-${occupiedSeatId}. Please vacate it before booking another.`);
          return; // Do not allow booking another
        }
    
        // Proceed to occupy or vacate as before
        firebase.database().ref('students/' + user.uid).once('value').then(snapshot => {
          const studentName = snapshot.val() ? snapshot.val().name : user.email;
          if (!seatData.occupied) {
            seatRef.child(i).set({
              occupied: true,
              occupiedAt: Date.now(),
              totalTime: null,
              student: { uid: user.uid, name: studentName }
            });
          } else if (seatData.occupied && seatData.student && seatData.student.uid === user.uid) {
            const occupiedAt = seatData.occupiedAt;
            const totalTime = occupiedAt ? Math.round((Date.now() - occupiedAt) / 60000) : 0;
            seatRef.child(i).set({
              occupied: false,
              occupiedAt: null,
              totalTime: totalTime,
              student: null
            });
          }
        });
      });
    };

    seatsDiv.appendChild(seat);
  });
}

// Populate seat assignment dropdown in admin form
function populateSeatOptions() {
  seatRef.once('value').then(snapshot => {
    const seatsDB = snapshot.val() || {};
    const seatSelect = document.getElementById('adminAssignSeat');
    seatSelect.innerHTML = '<option value="">Select Seat</option>';
    Object.keys(seatsDB).forEach(seatNum => {
      const data = seatsDB[seatNum];
      if (!data.occupied)
        seatSelect.innerHTML += `<option value="${seatNum}">Seat No-${seatNum}</option>`;
    });
  });
}

// Real-time seat DB updates
seatRef.on('value', snapshot => {
  const seatStatus = snapshot.val() || {};
  if (Object.keys(seatStatus).length) renderSeats(seatStatus);
  populateSeatOptions(); // Keep dropdown up-to-date
});

// Admin registration and seat assignment
function adminRegisterAndAssign() {
  const name = document.getElementById('adminStudentName').value;
  const email = document.getElementById('adminStudentEmail').value;
  const password = document.getElementById('adminStudentPassword').value;
  const seatNo = document.getElementById('adminAssignSeat').value;
  document.getElementById('adminStudentMessage').textContent = "";
  if (!name || !email || !password || !seatNo) {
    document.getElementById('adminStudentMessage').textContent = "Please fill all fields and select a seat.";
    return;
  }
  //Register student (will auto-login so immediately sign out after assigning seat)
  firebase.auth().signOut().then(() => {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        const uid = userCredential.user.uid;
        firebase.database().ref('students/' + uid).set({ name: name, email: email });
        return firebase.database().ref('librarySeats/' + seatNo).set({
          occupied: true,
          occupiedAt: Date.now(),
          totalTime: null,
          student: { uid: uid, name: name }
        });
      })
      .then(() => {
        document.getElementById('adminStudentMessage').textContent = "Student registered and seat assigned!";
        populateSeatOptions();
        firebase.auth().signOut();
        //optionally, reload page to force login screen for admin 
        //window.location.reload();
      })
      .catch(error => {
        document.getElementById('adminStudentMessage').textContent = "Error: " + error.message;
        populateSeatOptions();
      });
  });
}

// Reset all seats to vacant
function resetSeats() {
  seatRef.once('value').then(snapshot => {
    const seatStatus = snapshot.val() || {};
    Object.keys(seatStatus).forEach(i => {
      seatRef.child(i).set({
        occupied: false,
        occupiedAt: null,
        totalTime: null,
        student: null
      });
    });
    populateSeatOptions();
  });
}

// On page load: initialize seats and seat dropdown
window.onload = function() {
  seatRef.once('value').then(snapshot => {
      const seatStatus = snapshot.val() || {};
      const seatCount = Object.keys(seatStatus).length;
      document.getElementById('seatCount').value = seatCount || 10;
      renderSeats(seatStatus);
      populateSeatOptions();
    })
    .catch(error => {
      console.error('Error loading seat data:', error);
      document.getElementById('seatCount').value = 10;
    });
};

// Migration function: update boolean seats to object
function migrateSeatStatus() {
  seatRef.once('value').then(snapshot => {
    const seatStatus = snapshot.val() || {};
    Object.keys(seatStatus).forEach(i => {
      const oldValue = seatStatus[i];
      if (typeof oldValue === 'boolean') {
        seatRef.child(i).set({
          occupied: oldValue,
          occupiedAt: null,
          totalTime: null,
          student: null
        });
      }
    });
    console.log('Seat DB migrated to object structure');
    populateSeatOptions();
  });
}
window.migrateSeatStatus = migrateSeatStatus;