
// ========================================
// RIDO TAXI - MANAGEMENT SYSTEM
// ========================================

// DATA STORAGE

let drivers = JSON.parse(localStorage.getItem("ridoDrivers")) || [];
let vehicles = JSON.parse(localStorage.getItem("ridoVehicles")) || [];
let bookings = JSON.parse(localStorage.getItem("ridoBookings")) || [];

function saveData() {
  localStorage.setItem("ridoDrivers", JSON.stringify(drivers));
  localStorage.setItem("ridoVehicles", JSON.stringify(vehicles));
  localStorage.setItem("ridoBookings", JSON.stringify(bookings));
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ========================================
// NAVIGATION
// ========================================

function showSection(id) {
  document.querySelectorAll(".section").forEach(section => {
    section.style.display = section.id === id ? "block" : "none";
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === "#" + id
    );
  });

  if (location.hash !== "#" + id) {
    history.replaceState(null, "", "#" + id);
  }

  window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showSection(link.getAttribute("href").slice(1));
  });
});

function syncNavigation() {
  const id = location.hash.slice(1);
  const validSections = ["dashboard", "drivers", "vehicles", "booking", "trips"];

  showSection(validSections.includes(id) ? id : "dashboard");
}

window.addEventListener("hashchange", syncNavigation);

// ========================================
// COIMBATORE LOCATIONS
// ========================================

const locations = [
  "Gandhipuram",
  "Coimbatore Railway Station",
  "Coimbatore Airport",
  "Ukkadam",
  "Singanallur",
  "Peelamedu",
  "RS Puram",
  "Vadavalli",
  "Perur",
  "Marudhamalai"
];

// Approximate sample route distances in KM.
// Verify and adjust these estimates against actual roads.

const distanceMatrix = [
  [0, 4, 11, 7, 9, 6, 3, 9, 12, 14],
  [4, 0, 10, 3, 8, 7, 5, 11, 9, 16],
  [11, 10, 0, 13, 6, 5, 14, 18, 18, 22],
  [7, 3, 13, 0, 10, 10, 8, 14, 7, 19],
  [9, 8, 6, 10, 0, 5, 12, 17, 17, 21],
  [6, 7, 5, 10, 5, 0, 9, 14, 16, 19],
  [3, 5, 14, 8, 12, 9, 0, 7, 13, 12],
  [9, 11, 18, 14, 17, 14, 7, 0, 12, 8],
  [12, 9, 18, 7, 17, 16, 13, 12, 0, 24],
  [14, 16, 22, 19, 21, 19, 12, 8, 24, 0]
];

const fromSelect = document.getElementById("fromLocation");
const toSelect = document.getElementById("toLocation");

locations.forEach((location, index) => {
  fromSelect.add(new Option(location, index));
  toSelect.add(new Option(location, index));
});

let currentDistance = 0;

// ========================================
// DISTANCE CALCULATION
// ========================================

function calculateDistance() {
  const from = fromSelect.value;
  const to = toSelect.value;

  currentDistance = 0;

  if (from === "" || to === "") {
    document.getElementById("distanceDisplay").textContent = "0 KM";
    document.getElementById("routeMessage").textContent =
      "Select both locations to calculate.";
    updateFare();
    return;
  }

  if (from === to) {
    document.getElementById("distanceDisplay").textContent = "0 KM";
    document.getElementById("routeMessage").textContent =
      "Pickup and destination cannot be the same.";
    updateFare();
    return;
  }

  currentDistance = distanceMatrix[Number(from)][Number(to)];

  document.getElementById("distanceDisplay").textContent =
    currentDistance + " KM";

  document.getElementById("routeMessage").textContent =
    locations[from] + " → " + locations[to];

  updateFare();
}

fromSelect.addEventListener("change", calculateDistance);
toSelect.addEventListener("change", calculateDistance);

// ========================================
// DRIVER REGISTRATION
// ========================================

document.getElementById("driverForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("driverName").value.trim();
  const phone = document.getElementById("driverPhone").value.trim();
  const license = document.getElementById("driverLicense").value.trim();

  if (drivers.some(d => d.phone === phone)) {
    alert("Phone number already registered!");
    return;
  }

  if (drivers.some(d => d.license.toLowerCase() === license.toLowerCase())) {
    alert("Driving licence already registered!");
    return;
  }

  const driver = {
    id: "D" + Date.now().toString().slice(-8),
    name,
    phone,
    license
  };

  drivers.push(driver);

  saveData();
  this.reset();
  renderAll();

  alert("Welcome to RIDO TAXI! Driver registered successfully.");
});

// ========================================
// VEHICLE REGISTRATION
// ========================================

document.getElementById("vehicleForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const number = document.getElementById("vehicleNumber")
    .value.trim().toUpperCase();

  const model = document.getElementById("vehicleModel").value.trim();
  const category = document.getElementById("vehicleCategory").value;
  const rate = Number(document.getElementById("vehicleRate").value);

  if (vehicles.some(v => v.number === number)) {
    alert("Vehicle number already registered!");
    return;
  }

  if (!Number.isFinite(rate) || rate <= 0) {
    alert("Enter a valid vehicle rate.");
    return;
  }

  vehicles.push({
    id: "V" + Date.now().toString().slice(-8),
    number,
    model,
    category,
    rate
  });

  saveData();
  this.reset();
  renderAll();

  alert("Vehicle successfully added to RIDO TAXI!");
});

// ========================================
// DELETE DRIVER
// ========================================

function deleteDriver(id) {
  const active = bookings.some(
    b => b.driverId === id && b.status === "Booked"
  );

  if (active) {
    alert("Driver has an active booking. Complete or cancel it first.");
    return;
  }

  if (!confirm("Delete this driver?")) return;

  drivers = drivers.filter(d => d.id !== id);

  saveData();
  renderAll();
}

// ========================================
// DELETE VEHICLE
// ========================================

function deleteVehicle(id) {
  const active = bookings.some(
    b => b.vehicleId === id && b.status === "Booked"
  );

  if (active) {
    alert("Vehicle has an active booking. Complete or cancel it first.");
    return;
  }

  if (!confirm("Delete this vehicle?")) return;

  vehicles = vehicles.filter(v => v.id !== id);

  saveData();
  renderAll();
}

// ========================================
// DRIVER & VEHICLE ALLOCATION
// ========================================

function renderAllocation() {
  const driverSelect = document.getElementById("assignDriver");
  const vehicleSelect = document.getElementById("assignVehicle");

  const oldDriver = driverSelect.value;
  const oldVehicle = vehicleSelect.value;

  driverSelect.innerHTML = '<option value="">Select Driver</option>';
  vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';

  const busyDrivers = bookings
    .filter(b => b.status === "Booked")
    .map(b => b.driverId);

  const busyVehicles = bookings
    .filter(b => b.status === "Booked")
    .map(b => b.vehicleId);

  drivers.filter(d => !busyDrivers.includes(d.id)).forEach(d => {
    driverSelect.add(
      new Option(d.name + " (" + d.id + ")", d.id)
    );
  });

  vehicles.filter(v => !busyVehicles.includes(v.id)).forEach(v => {
    vehicleSelect.add(
      new Option(v.model + " - " + v.number, v.id)
    );
  });

  if ([...driverSelect.options].some(o => o.value === oldDriver)) {
    driverSelect.value = oldDriver;
  }

  if ([...vehicleSelect.options].some(o => o.value === oldVehicle)) {
    vehicleSelect.value = oldVehicle;
  }

  updateFare();
}

// ========================================
// FARE CALCULATION
// ========================================

function updateFare() {
  const vehicleId = document.getElementById("assignVehicle").value;

  const vehicle = vehicles.find(v => v.id === vehicleId);

  const rate = vehicle ? Number(vehicle.rate) : 0;

  const extra = Math.max(
    0,
    Number(document.getElementById("extraCharge").value) || 0
  );

  const baseFare = currentDistance * rate;
  const total = baseFare + extra;

  document.getElementById("fareDistance").textContent =
    currentDistance + " KM";

  document.getElementById("fareRate").textContent =
    money(rate) + " / KM";

  document.getElementById("distanceFare").textContent =
    money(baseFare);

  document.getElementById("extraDisplay").textContent =
    money(extra);

  document.getElementById("totalFare").textContent =
    money(total);
}

document.getElementById("assignVehicle")
  .addEventListener("change", updateFare);

document.getElementById("extraCharge")
  .addEventListener("input", updateFare);

// ========================================
// CUSTOMER BOOKING
// ========================================

document.getElementById("bookingForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();

  const driverId = document.getElementById("assignDriver").value;
  const vehicleId = document.getElementById("assignVehicle").value;

  if (!currentDistance) {
    alert("Please select two different Coimbatore locations.");
    return;
  }

  const driver = drivers.find(d => d.id === driverId);
  const vehicle = vehicles.find(v => v.id === vehicleId);

  if (!driver || !vehicle) {
    alert("Please select an available driver and vehicle.");
    return;
  }

  if (bookings.some(b =>
    b.status === "Booked" &&
    (b.driverId === driverId || b.vehicleId === vehicleId)
  )) {
    alert("Selected driver or vehicle is no longer available.");
    renderAllocation();
    return;
  }

  const extra = Math.max(
    0,
    Number(document.getElementById("extraCharge").value) || 0
  );

  const fare = currentDistance * Number(vehicle.rate) + extra;

  const booking = {
    id: "B" + Date.now().toString().slice(-8),
    customer: name,
    phone,
    from: locations[Number(fromSelect.value)],
    to: locations[Number(toSelect.value)],
    distance: currentDistance,
    driverId,
    vehicleId,
    fare,
    extra,
    status: "Booked",
    date: new Date().toLocaleString("en-IN")
  };

  bookings.unshift(booking);

  saveData();

  this.reset();

  currentDistance = 0;

  document.getElementById("distanceDisplay").textContent = "0 KM";
  document.getElementById("routeMessage").textContent =
    "Select both locations to calculate.";

  renderAll();
  showSection("trips");

  alert("RIDO TAXI booking confirmed! Booking ID: " + booking.id);
});

// ========================================
// TRIP STATUS
// ========================================

function updateBooking(id, newStatus) {
  const booking = bookings.find(b => b.id === id);

  if (!booking || booking.status !== "Booked") return;

  const message = newStatus === "Completed"
    ? "Mark this trip as completed?"
    : "Cancel this booking?";

  if (!confirm(message)) return;

  booking.status = newStatus;

  saveData();
  renderAll();
}

function deleteBooking(id) {
  if (!confirm("Permanently delete this booking record?")) return;

  bookings = bookings.filter(b => b.id !== id);

  saveData();
  renderAll();
}

// ========================================
// DRIVER TABLE
// ========================================

function renderDrivers() {
  const table = document.getElementById("driverTable");

  if (!drivers.length) {
    table.innerHTML =
      '<tr><td colspan="5" class="empty">No drivers registered.</td></tr>';
    return;
  }

  table.innerHTML = drivers.map(d => `
    <tr>
      <td>${escapeHTML(d.id)}</td>
      <td>${escapeHTML(d.name)}</td>
      <td>${escapeHTML(d.phone)}</td>
      <td>${escapeHTML(d.license)}</td>
      <td>
        <button class="action-btn delete"
          onclick="deleteDriver('${d.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

// ========================================
// VEHICLE TABLE
// ========================================

function renderVehicles() {
  const table = document.getElementById("vehicleTable");

  if (!vehicles.length) {
    table.innerHTML =
      '<tr><td colspan="6" class="empty">No vehicles registered.</td></tr>';
    return;
  }

  table.innerHTML = vehicles.map(v => `
    <tr>
      <td>${escapeHTML(v.id)}</td>
      <td>${escapeHTML(v.number)}</td>
      <td>${escapeHTML(v.model)}</td>
      <td>${escapeHTML(v.category)}</td>
      <td>${money(v.rate)}</td>
      <td>
        <button class="action-btn delete"
          onclick="deleteVehicle('${v.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

// ========================================
// TRIP HISTORY
// ========================================

function renderTrips() {
  const table = document.getElementById("tripTable");

  if (!bookings.length) {
    table.innerHTML =
      '<tr><td colspan="9" class="empty">No trip records available.</td></tr>';
    return;
  }

  table.innerHTML = bookings.map(b => {
    const driver = drivers.find(d => d.id === b.driverId);
    const vehicle = vehicles.find(v => v.id === b.vehicleId);

    return `
      <tr>
        <td>${escapeHTML(b.id)}</td>
        <td>${escapeHTML(b.customer)}</td>
        <td>${escapeHTML(b.from)}</td>
        <td>${escapeHTML(b.to)}</td>
        <td>${b.distance} KM</td>
        <td>${escapeHTML(driver ? driver.name : "Deleted")}</td>
        <td>${escapeHTML(vehicle ? vehicle.number : "Deleted")}</td>
        <td>${money(b.fare)}</td>
        <td>
          <span class="status ${b.status}">${b.status}</span>

          ${b.status === "Booked" ? `
            <button class="action-btn complete"
              onclick="updateBooking('${b.id}','Completed')">
              Complete
            </button>

            <button class="action-btn cancel"
              onclick="updateBooking('${b.id}','Cancelled')">
              Cancel
            </button>
          ` : ""}

          <button class="action-btn delete"
            onclick="deleteBooking('${b.id}')">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// ========================================
// DRIVER-WISE REPORT
// ========================================

function renderDriverSummary() {
  const table = document.getElementById("driverSummary");

  if (!drivers.length) {
    table.innerHTML =
      '<tr><td colspan="4" class="empty">No driver information.</td></tr>';
    return;
  }

  table.innerHTML = drivers.map(d => {

    const completed = bookings.filter(
      b => b.driverId === d.id && b.status === "Completed"
    );

    const revenue = completed.reduce(
      (sum, b) => sum + Number(b.fare), 0
    );

    return `
      <tr>
        <td>${escapeHTML(d.id)}</td>
        <td>${escapeHTML(d.name)}</td>
        <td>${completed.length}</td>
        <td>${money(revenue)}</td>
      </tr>
    `;

  }).join("");
}

// ========================================
// DASHBOARD STATISTICS
// ========================================

function renderDashboard() {

  const completed = bookings.filter(
    b => b.status === "Completed"
  );

  const revenue = completed.reduce(
    (sum, b) => sum + Number(b.fare), 0
  );

  document.getElementById("totalBookings").textContent = bookings.length;
  document.getElementById("totalDrivers").textContent = drivers.length;
  document.getElementById("totalVehicles").textContent = vehicles.length;
  document.getElementById("completedTrips").textContent = completed.length;
  document.getElementById("totalRevenue").textContent = money(revenue);

  const recent = document.getElementById("recentBookings");

  if (!bookings.length) {
    recent.innerHTML =
      '<tr><td colspan="6" class="empty">No bookings yet.</td></tr>';
    return;
  }

  recent.innerHTML = bookings.slice(0, 5).map(b => `
    <tr>
      <td>${escapeHTML(b.id)}</td>
      <td>${escapeHTML(b.customer)}</td>
      <td>${escapeHTML(b.from)}</td>
      <td>${escapeHTML(b.to)}</td>
      <td>${b.distance} KM</td>
      <td>
        <span class="status ${b.status}">${b.status}</span>
      </td>
    </tr>
  `).join("");
}

// ========================================
// RENDER ALL DATA
// ========================================

function renderAll() {
  renderDrivers();
  renderVehicles();
  renderAllocation();
  renderTrips();
  renderDriverSummary();
  renderDashboard();
}

// ========================================
// START RIDO TAXI WEBSITE
// ========================================

renderAll();
syncNavigation();
