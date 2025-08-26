// Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// const db = firebase.database();
// const seatRef = db.ref("librarySeats/");

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
        newStatus[i] = { occupied: false, occupiedAt: null, totalTime: null }; // initializing as vacant object
      }
    }
    seatRef.set(newStatus);
  });
}

// Render seat buttons from DB with icon, text, timings (Admin view)
// Always attaches click handler
function renderSeats(seatStatus) {
  const seatsDiv = document.getElementById('seats');
  seatsDiv.innerHTML = '';

  Object.keys(seatStatus).forEach(i => {
    const seatData = seatStatus[i] || { occupied: false, occupiedAt: null, totalTime: null };
    const isOccupied = !!seatData.occupied;
    const iconSrc = isOccupied ? 'assets/occupied.png' : 'assets/vacant.png';
    const statusText = isOccupied ? 'Occupied' : 'Vacant';

    // Display elapsed time or total time consumed
    let infoText = '';
    if (isOccupied && seatData.occupiedAt) {
      const elapsedMins = Math.floor((Date.now() - seatData.occupiedAt) / 60000);
      infoText = `<small class="seat-info-text">Occupied for: ${elapsedMins} min</small>`;
    } else if (!isOccupied && seatData.totalTime != null) {
      infoText = `<small class="seat-info-text">Last Occupied: ${seatData.totalTime} min</small>`;
    }

    const seat = document.createElement('div');
    seat.classList.add('seat');
    if (isOccupied) seat.classList.add('occupied');

    seat.innerHTML = `
      <div>
        <img src="${iconSrc}" alt="${statusText}" class="seat-icon" />
        <span class="seat-number">Seat No-${i}</span>
        <span class="seat-status-text">${statusText}</span><br>
        ${infoText}
      </div>
    `;

    // Admin click handler: toggle occupancy, record timing
    seat.onclick = function() {
      const now = Date.now();
      const currentSeatData = seatStatus[i] || { occupied: false, occupiedAt: null, totalTime: null };

      if (!currentSeatData.occupied) {
        // Vacant → Occupied
        seatRef.child(i).set({
          occupied: true,
          occupiedAt: now,
          totalTime: null
        });
      } else {
        // Occupied → Vacant, record duration
        const occupiedAt = currentSeatData.occupiedAt;
        const totalTime = occupiedAt ? Math.round((now - occupiedAt) / 60000) : 0;
        seatRef.child(i).set({
          occupied: false,
          occupiedAt: null,
          totalTime: totalTime
        });
      }
    };

    seatsDiv.appendChild(seat);
  });
}

// Real-time seat DB updates
seatRef.on('value', snapshot => {
  const seatStatus = snapshot.val() || {};
  if (Object.keys(seatStatus).length) renderSeats(seatStatus);
});

// Reset all seats to vacant (for manual reset)
function resetSeats() {
  seatRef.once('value').then(snapshot => {
    const seatStatus = snapshot.val() || {};
    Object.keys(seatStatus).forEach(i => {
      seatRef.child(i).set({
        occupied: false,
        occupiedAt: null,
        totalTime: null
      });
    });
  });
}

// On page load: initialize seats
window.onload = function() {
  seatRef.once('value')
    .then(snapshot => {
      const seatStatus = snapshot.val() || {};
      const seatCount = Object.keys(seatStatus).length;
      document.getElementById('seatCount').value = seatCount || 10; // fallback to 10
      renderSeats(seatStatus);
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
          totalTime: null
        });
      }
    });
    console.log('Seat DB migrated to object structure');
  });
}
window.migrateSeatStatus = migrateSeatStatus; // Ensure global scope for button/call