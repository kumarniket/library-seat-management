
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DB Reference for seats
const seatRef = db.ref("librarySeats/");

// Setup or update number of seats
function setSeats() {
  const n = parseInt(document.getElementById('seatCount').value);
  seatRef.once('value').then(snapshot => {
    const seatStatus = snapshot.val() || {};
    const newStatus = {};
    for (let i = 1; i <= n; i++)
      newStatus[i] = seatStatus[i] === true ? true : false;
    seatRef.set(newStatus);
  });
}

// Render seat buttons from DB
function renderSeats(seatStatus) {
  const seatsDiv = document.getElementById('seats');
  seatsDiv.innerHTML = '';

  // Object.keys(seatStatus).forEach(i => {
  //   const seat = document.createElement('div');
  //   seat.classList.add('seat');
  //   if (seatStatus[i]) seat.classList.add('occupied');
  //   seat.innerHTML = `<span class="seat-number">${i}</span>`;
  //   seat.onclick = function() {
  //     seatRef.child(i).set(!seatStatus[i]);
  //   };
  //   seatsDiv.appendChild(seat);
  // });

  Object.keys(seatStatus).forEach(i => {
    const seat = document.createElement('div');
    seat.classList.add('seat');
    if (seatStatus[i]) seat.classList.add('occupied');

    // Determine icon and text based on status
    const isOccupied = !!seatStatus[i];
    const iconSrc = isOccupied ? 'assets/occupied.png' : 'assets/vacant.png';
    const statusText = isOccupied ? 'Occupied' : 'Vacant';

    // Seat HTML structure
    
    seat.innerHTML = `
    <div>
      <img src="${iconSrc}" alt="${statusText}" class="seat-icon" />
      <span class="seat-number">Seat-${i}</span>
      <span class="seat-status-text">${statusText}</span>
    </div>
`;


    // For admin page (index.html), make seats clickable to toggle status
    // For seat.html (student view), omit click handler or disable click
    if (typeof seat.onclick !== 'undefined') {
      seat.onclick = function() {
        // toggle seat occupied/vacant state
        seatRef.child(i).set(!seatStatus[i]);
      };
    }
    seatsDiv.appendChild(seat);
  });
}

// Listen for seat updates, real-time
seatRef.on('value', snapshot => {
  const seatStatus = snapshot.val() || {};
  if(Object.keys(seatStatus).length) renderSeats(seatStatus);
});

// Reset all seats to vacant
function resetSeats() {
  seatRef.once('value').then(snapshot => {
    const seatStatus = snapshot.val() || {};
    Object.keys(seatStatus).forEach(i => {
      seatRef.child(i).set(false);
    });
  });
}

// On page load: initialize seats
window.onload = function() {
  seatRef.once('value')
    .then(snapshot => {
      const seatStatus = snapshot.val() || {};
      const seatCount = Object.keys(seatStatus).length;
      document.getElementById('seatCount').value = seatCount || 10; // fallback to 10 if DB empty
      renderSeats(seatStatus);
    })
    .catch(error => {
      console.error('Error loading seat data:', error);
      document.getElementById('seatCount').value = 10;
    });
};

