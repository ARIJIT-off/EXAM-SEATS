/* ╔══════════════════════════════════════════════════════════════╗
   ║           EXAM SEATS — Main Application Logic               ║
   ║   All data: localStorage only. No backend, no database.     ║
   ╚══════════════════════════════════════════════════════════════╝ */

'use strict';

/* ════════════════════════════════════════
   1. BUILDING CONSTANTS
   ════════════════════════════════════════ */
const BUILDINGS = {
  B1: {
    name: 'B1 Building',
    bgImage: 'images/ss2.png',
    floors: (() => {
      const floors = [];
      // Floors 1–3: 10 rooms each, capacity 30
      for (let f = 1; f <= 3; f++) {
        const rooms = [];
        for (let r = 1; r <= 10; r++) {
          rooms.push({ name: `B1${f}.${r}`, capacity: 30, floor: f });
        }
        floors.push({ floor: f, rooms });
      }
      // Floor 4: 1 hall (RRR Hall) capacity 200
      floors.push({
        floor: 4,
        rooms: [{ name: 'B14.RRR', capacity: 200, floor: 4, isHall: true }]
      });
      return floors;
    })()
  },
  B2: {
    name: 'B2 Building',
    bgImage: 'images/ss3.png',
    floors: (() => {
      const floors = [];
      for (let f = 1; f <= 4; f++) {
        const rooms = [];
        for (let r = 1; r <= 10; r++) {
          rooms.push({ name: `B2${f}.${r}`, capacity: 30, floor: f });
        }
        floors.push({ floor: f, rooms });
      }
      return floors;
    })()
  },
  B3: {
    name: 'B3 Building',
    bgImage: 'images/ss4.png',
    floors: (() => {
      const floors = [];
      for (let f = 1; f <= 6; f++) {
        const rooms = [];
        for (let r = 1; r <= 9; r++) {
          rooms.push({ name: `B3${f}.${r}`, capacity: 35, floor: f });
        }
        floors.push({ floor: f, rooms });
      }
      return floors;
    })()
  }
};

/* Flatten all rooms of a building into a single array */
function getAllRooms(buildingKey) {
  return BUILDINGS[buildingKey].floors.flatMap(f => f.rooms);
}

/* ════════════════════════════════════════
   2. APP STATE
   ════════════════════════════════════════ */
const state = {
  role: null,             // 'faculty' | 'student'
  selectedBuilding: null, // 'B1' | 'B2' | 'B3'
  students: [],           // parsed CSV rows
  selectedRooms: new Set(),
  allocation: {},         // keyed by EnrollmentID
  currentStep: 1,
  loggedInEnrollment: null,
  allAllocationRows: []   // flat array for searching/download
};

/* ════════════════════════════════════════
   3. SCREEN NAVIGATION
   ════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) return;

  // Apply background if data-bg set
  const bg = target.getAttribute('data-bg');
  if (bg) target.style.backgroundImage = `url('${bg}')`;

  target.classList.add('active');
}

/* ════════════════════════════════════════
   4. FACULTY LOGIN
   ════════════════════════════════════════ */
function handleFacultyLogin(e) {
  e.preventDefault();
  const teacherId = document.getElementById('teacher-id').value.trim();
  const password  = document.getElementById('faculty-password').value.trim();
  const errEl     = document.getElementById('faculty-error');

  if (!/^\d{6}$/.test(teacherId)) {
    errEl.textContent = 'Teacher ID must be exactly 6 digits.';
    return;
  }
  if (!/^\d{4}$/.test(password)) {
    errEl.textContent = 'Password must be exactly 4 digits.';
    return;
  }

  errEl.textContent = '';
  state.role = 'faculty';
  sessionStorage.setItem('role', 'faculty');
  sessionStorage.setItem('teacherId', teacherId);

  showScreen('screen-faculty-dashboard');
  checkExistingData();
}

/* ════════════════════════════════════════
   5. STUDENT LOGIN
   ════════════════════════════════════════ */
function handleStudentLogin(e) {
  e.preventDefault();
  const enrollId = document.getElementById('enrollment-id').value.trim();
  const password  = document.getElementById('student-password').value.trim();
  const errEl     = document.getElementById('student-error');

  if (!/^\d{14}$/.test(enrollId)) {
    errEl.textContent = 'Enrollment ID must be exactly 14 digits.';
    return;
  }
  if (!/^\d{4}$/.test(password)) {
    errEl.textContent = 'Password must be exactly 4 digits.';
    return;
  }

  // Check if student exists in stored CSV data
  const stored = localStorage.getItem('examSeatsData');
  if (!stored) {
    errEl.textContent = 'Student not found. No data has been uploaded yet.';
    return;
  }
  const students = JSON.parse(stored);
  const found = students.find(s => String(s.EnrollmentID).trim() === enrollId);
  if (!found) {
    errEl.textContent = 'Student not found. Please check your Enrollment ID.';
    return;
  }

  errEl.textContent = '';
  state.role = 'student';
  state.loggedInEnrollment = enrollId;
  sessionStorage.setItem('role', 'student');
  sessionStorage.setItem('enrollId', enrollId);

  showStudentResult(enrollId);
}

/* ════════════════════════════════════════
   6. LOGOUT
   ════════════════════════════════════════ */
function logout() {
  state.role = null;
  state.selectedBuilding = null;
  state.loggedInEnrollment = null;
  sessionStorage.clear();
  // Reset forms
  ['faculty-login-form','student-login-form'].forEach(id => {
    const f = document.getElementById(id);
    if (f) f.reset();
  });
  document.getElementById('faculty-error').textContent = '';
  document.getElementById('student-error').textContent = '';
  showScreen('screen-landing');
}

/* ════════════════════════════════════════
   7. EXISTING DATA CHECK (Faculty)
   ════════════════════════════════════════ */
function checkExistingData() {
  const notice = document.getElementById('existing-data-notice');
  const alloc  = localStorage.getItem('seatAllocation');
  if (alloc && Object.keys(JSON.parse(alloc)).length > 0) {
    notice.style.display = 'block';
  } else {
    notice.style.display = 'none';
  }
}

function dismissNotice() {
  document.getElementById('existing-data-notice').style.display = 'none';
}

/* ════════════════════════════════════════
   8. BUILDING SELECTION
   ════════════════════════════════════════ */
function selectBuilding(key) {
  state.selectedBuilding = key;
  state.selectedRooms.clear();
  state.students = [];
  state.currentStep = 1;

  const screen = document.getElementById('screen-building-workflow');
  screen.setAttribute('data-bg', BUILDINGS[key].bgImage);
  screen.style.backgroundImage = `url('${BUILDINGS[key].bgImage}')`;

  // Update step title
  document.getElementById('upload-title').textContent =
    `Upload Student Details — ${BUILDINGS[key].name}`;
  document.getElementById('room-selection-title').textContent =
    `Select Rooms — ${BUILDINGS[key].name}`;

  // Reset CSV preview
  document.getElementById('csv-preview').style.display = 'none';
  document.getElementById('upload-zone').style.display = 'block';
  document.getElementById('csv-file-input').value = '';

  // Reset allocate panel
  document.getElementById('allocate-ready').style.display = 'block';
  document.getElementById('allocate-loading').style.display = 'none';
  document.getElementById('allocate-results').style.display = 'none';

  goToStep(1);
  showScreen('screen-building-workflow');
}

/* ════════════════════════════════════════
   9. STEP NAVIGATION
   ════════════════════════════════════════ */
function goToStep(n) {
  state.currentStep = n;

  // Update steps UI
  document.querySelectorAll('.step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('active', s === n);
    el.classList.toggle('completed', s < n);
  });

  document.querySelectorAll('.workflow-step').forEach(el => el.classList.remove('active'));

  const stepMap = { 1: 'step-upload', 2: 'step-rooms', 3: 'step-allocate' };
  document.getElementById(stepMap[n]).classList.add('active');

  if (n === 2) renderRoomGrid();
  if (n === 3) updateAllocateSummary();
}

/* ════════════════════════════════════════
   10. CSV UPLOAD & PARSING
   ════════════════════════════════════════ */
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  processCSVFile(file);
}

function processCSVFile(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const text = ev.target.result;
    parseCSV(text);
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  // Use PapaParse if available, else manual parse
  let rows = [];
  if (typeof Papa !== 'undefined') {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    rows = result.data;
    // Normalize headers (trim whitespace)
    rows = rows.map(row => {
      const clean = {};
      Object.keys(row).forEach(k => { clean[k.trim()] = (row[k] || '').trim(); });
      return clean;
    });
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map(h => h.trim());
    rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
      return obj;
    });
  }

  // Normalise: ensure EnrollmentID, StudentName, Department, ExamName
  const normalised = rows.map(r => ({
    EnrollmentID: r.EnrollmentID || r.enrollmentid || r['Enrollment ID'] || r['enrollment_id'] || '',
    StudentName:  r.StudentName  || r.studentname  || r['Student Name']  || r['student_name']  || '',
    Department:   r.Department   || r.department   || r['Dept']          || '',
    ExamName:     r.ExamName     || r.examname     || r['Exam Name']     || r['exam_name']     || ''
  })).filter(r => r.EnrollmentID !== '');

  if (normalised.length === 0) {
    alert('No valid student records found. Check CSV headers: EnrollmentID, StudentName, Department, ExamName');
    return;
  }

  state.students = normalised;
  localStorage.setItem('examSeatsData', JSON.stringify(normalised));
  showCSVPreview(normalised);
}

function showCSVPreview(data) {
  const tbody = document.getElementById('csv-preview-body');
  tbody.innerHTML = '';
  const preview = data.slice(0, 5);
  preview.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.EnrollmentID}</td><td>${row.StudentName}</td><td>${row.Department}</td><td>${row.ExamName}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('csv-count').textContent =
    `Total students loaded: ${data.length}${data.length > 5 ? ' (showing first 5)' : ''}`;
  document.getElementById('upload-zone').style.display = 'none';
  document.getElementById('csv-preview').style.display = 'block';
}

// Drag & drop
function initDragDrop() {
  const zone = document.getElementById('upload-zone');
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) processCSVFile(file);
  });
  zone.addEventListener('click', () => document.getElementById('csv-file-input').click());
}

/* ════════════════════════════════════════
   11. ROOM GRID
   ════════════════════════════════════════ */
function renderRoomGrid() {
  const grid = document.getElementById('room-grid');
  grid.innerHTML = '';
  const rooms = getAllRooms(state.selectedBuilding);
  rooms.forEach(room => {
    const div = document.createElement('div');
    div.className = 'room-item' + (state.selectedRooms.has(room.name) ? ' selected' : '');
    div.dataset.room = room.name;
    div.innerHTML = `
      <div class="room-check">${state.selectedRooms.has(room.name) ? '✓' : ''}</div>
      <div>
        <div>${room.name}</div>
        <div class="room-cap">${room.capacity} seats</div>
      </div>`;
    div.addEventListener('click', () => toggleRoom(room.name, div));
    grid.appendChild(div);
  });
  updateCapacityBar();
}

function toggleRoom(name, el) {
  if (state.selectedRooms.has(name)) {
    state.selectedRooms.delete(name);
    el.classList.remove('selected');
    el.querySelector('.room-check').textContent = '';
  } else {
    state.selectedRooms.add(name);
    el.classList.add('selected');
    el.querySelector('.room-check').textContent = '✓';
  }
  updateCapacityBar();
}

function selectAllRooms() {
  const rooms = getAllRooms(state.selectedBuilding);
  rooms.forEach(r => state.selectedRooms.add(r.name));
  renderRoomGrid();
}

function deselectAllRooms() {
  state.selectedRooms.clear();
  renderRoomGrid();
}

function updateCapacityBar() {
  const rooms = getAllRooms(state.selectedBuilding);
  const totalSelected = rooms.filter(r => state.selectedRooms.has(r.name))
    .reduce((s, r) => s + r.capacity, 0);
  const totalStudents = state.students.length;

  document.getElementById('selected-capacity').textContent = totalSelected;
  document.getElementById('total-students').textContent = totalStudents;

  const pct = totalStudents > 0 ? Math.min(100, (totalSelected / totalStudents) * 100) : 0;
  document.getElementById('capacity-progress').style.width = pct + '%';

  const warn = document.getElementById('capacity-warning');
  warn.style.display = (totalStudents > 0 && totalSelected < totalStudents) ? 'block' : 'none';

  const btnAllocate = document.getElementById('btn-to-allocate');
  btnAllocate.disabled = state.selectedRooms.size === 0;
}

/* ════════════════════════════════════════
   12. ALLOCATE SUMMARY (Step 3 preview)
   ════════════════════════════════════════ */
function updateAllocateSummary() {
  const rooms = getAllRooms(state.selectedBuilding).filter(r => state.selectedRooms.has(r.name));
  const totalSeats = rooms.reduce((s, r) => s + r.capacity, 0);
  document.getElementById('summary-students').textContent = state.students.length;
  document.getElementById('summary-rooms').textContent = rooms.length;
  document.getElementById('summary-seats').textContent = totalSeats;
}

/* ════════════════════════════════════════
   13. SEAT ALLOCATION ALGORITHM
   ════════════════════════════════════════ */
function runAllocation() {
  document.getElementById('allocate-ready').style.display = 'none';
  document.getElementById('allocate-loading').style.display = 'block';
  document.getElementById('allocate-results').style.display = 'none';

  // Simulate processing delay (1.8s)
  setTimeout(() => {
    const allocation = allocateSeats(state.students, state.selectedBuilding, state.selectedRooms);
    state.allocation = allocation.byEnrollment;
    state.allAllocationRows = allocation.rows;

    // Persist
    localStorage.setItem('seatAllocation', JSON.stringify(allocation.byEnrollment));
    localStorage.setItem('seatAllocationRows', JSON.stringify(allocation.rows));
    localStorage.setItem('seatAllocationBuilding', state.selectedBuilding);

    showAllocationResults(allocation);
  }, 1800);
}

function allocateSeats(students, buildingKey, selectedRoomNames) {
  // Shuffle students (Fisher-Yates)
  const shuffled = [...students];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const rooms = getAllRooms(buildingKey).filter(r => selectedRoomNames.has(r.name));
  const building = BUILDINGS[buildingKey];

  const byEnrollment = {};
  const rows = [];
  const roomSummary = [];

  let studentIdx = 0;
  rooms.forEach(room => {
    let seatNum = 1;
    const allocated = [];
    while (seatNum <= room.capacity && studentIdx < shuffled.length) {
      const student = shuffled[studentIdx++];
      const record = {
        EnrollmentID: student.EnrollmentID,
        StudentName: student.StudentName,
        Department: student.Department,
        ExamName: student.ExamName,
        Building: building.name,
        BuildingKey: buildingKey,
        Floor: room.floor,
        Room: room.name,
        SeatNo: seatNum
      };
      byEnrollment[student.EnrollmentID] = record;
      rows.push(record);
      allocated.push(record);
      seatNum++;
    }
    roomSummary.push({ room: room.name, count: allocated.length, capacity: room.capacity });
  });

  return { byEnrollment, rows, roomSummary, totalAllocated: rows.length, roomsUsed: rooms.length };
}

function showAllocationResults(allocation) {
  document.getElementById('allocate-loading').style.display = 'none';
  document.getElementById('allocate-results').style.display = 'block';

  document.getElementById('allocation-summary-text').textContent =
    `${allocation.totalAllocated} students allocated across ${allocation.roomsUsed} rooms`;

  const tbody = document.getElementById('room-summary-body');
  tbody.innerHTML = '';
  allocation.roomSummary.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.room}</td><td>${r.count}</td><td>${r.capacity}</td>`;
    tbody.appendChild(tr);
  });
}

/* ════════════════════════════════════════
   14. VIEW ALL ALLOCATIONS
   ════════════════════════════════════════ */
function viewAllAllocations() {
  const stored = localStorage.getItem('seatAllocationRows');
  if (!stored) { alert('No allocation data found.'); return; }
  const rows = JSON.parse(stored);
  state.allAllocationRows = rows;
  renderAllAllocationsTable(rows);
  showScreen('screen-all-allocations');
}

function renderAllAllocationsTable(rows) {
  const tbody = document.getElementById('all-allocations-body');
  tbody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.EnrollmentID}</td><td>${r.StudentName}</td><td>${r.Department}</td>
      <td>${r.Building}</td><td>Floor ${r.Floor}</td><td>${r.Room}</td><td>${r.SeatNo}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removeStudentAllocation('${r.EnrollmentID}')">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}

/* ════════════════════════════════════════
   15. MANUAL EDITS Logic
   ════════════════════════════════════════ */
function toggleManualAddForm() {
  const card = document.getElementById('manual-add-card');
  const isHidden = card.style.display === 'none';
  card.style.display = isHidden ? 'block' : 'none';

  if (isHidden) {
    // Populate room dropdown
    const roomSelect = document.getElementById('m-room');
    roomSelect.innerHTML = '<option value="">Select Room</option>';
    const buildingKey = state.selectedBuilding || localStorage.getItem('seatAllocationBuilding') || 'B1';
    const rooms = getAllRooms(buildingKey);
    rooms.forEach(rm => {
      const opt = document.createElement('option');
      opt.value = rm.name;
      opt.textContent = `${rm.name} (${rm.capacity} seats)`;
      roomSelect.appendChild(opt);
    });
  }
}

function updateManualSeats() {
  const roomName = document.getElementById('m-room').value;
  const buildingKey = state.selectedBuilding || localStorage.getItem('seatAllocationBuilding') || 'B1';
  const rooms = getAllRooms(buildingKey);
  const roomObj = rooms.find(r => r.name === roomName);
  if (roomObj) {
    const seatInput = document.getElementById('m-seat');
    seatInput.max = roomObj.capacity;
    seatInput.placeholder = `1 - ${roomObj.capacity}`;
  }
}

function handleManualAdd(e) {
  e.preventDefault();
  const enrollId = document.getElementById('m-enrollment').value.trim();
  const name = document.getElementById('m-name').value.trim();
  const dept = document.getElementById('m-dept').value.trim();
  const exam = document.getElementById('m-exam').value.trim();
  const roomName = document.getElementById('m-room').value;
  const seatNo = parseInt(document.getElementById('m-seat').value);

  if (!enrollId || !name || !dept || !exam || !roomName || !seatNo) {
    alert('Please fill all fields');
    return;
  }

  const buildingKey = state.selectedBuilding || localStorage.getItem('seatAllocationBuilding') || 'B1';
  const building = BUILDINGS[buildingKey];
  const rooms = getAllRooms(buildingKey);
  const roomObj = rooms.find(r => r.name === roomName);

  if (seatNo > roomObj.capacity) {
    alert(`Seat number cannot exceed room capacity (${roomObj.capacity})`);
    return;
  }

  // Check if seat already occupied
  const existing = state.allAllocationRows.find(r => r.Room === roomName && parseInt(r.SeatNo) === seatNo);
  if (existing) {
    alert(`Seat ${seatNo} in Room ${roomName} is already occupied by ${existing.StudentName}`);
    return;
  }

  const record = {
    EnrollmentID: enrollId,
    StudentName: name,
    Department: dept,
    ExamName: exam,
    Building: building.name,
    BuildingKey: buildingKey,
    Floor: roomObj.floor,
    Room: roomObj.name,
    SeatNo: seatNo
  };

  state.allAllocationRows.push(record);
  state.allocation[enrollId] = record;

  // Re-render
  renderAllAllocationsTable(state.allAllocationRows);
  document.getElementById('manual-add-form').reset();
  toggleManualAddForm();
  alert('Student added successfully!');
}

function removeStudentAllocation(enrollId) {
  if (!confirm('Are you sure you want to remove this student?')) return;

  state.allAllocationRows = state.allAllocationRows.filter(r => r.EnrollmentID !== enrollId);
  delete state.allocation[enrollId];

  renderAllAllocationsTable(state.allAllocationRows);
}

function finalizeAllocation() {
  if (state.allAllocationRows.length === 0) {
    alert('No allocations to finalize.');
    return;
  }

  localStorage.setItem('seatAllocation', JSON.stringify(state.allocation));
  localStorage.setItem('seatAllocationRows', JSON.stringify(state.allAllocationRows));
  localStorage.setItem('seatAllocationBuilding', state.selectedBuilding || localStorage.getItem('seatAllocationBuilding'));

  alert('Allocation Finalized Successfully! Data saved.');
  showScreen('screen-faculty-dashboard');
}

function filterAllocations() {
  const q = document.getElementById('allocation-search').value.toLowerCase();
  const filtered = state.allAllocationRows.filter(r =>
    r.EnrollmentID.toLowerCase().includes(q) ||
    r.StudentName.toLowerCase().includes(q) ||
    r.Room.toLowerCase().includes(q) ||
    r.Department.toLowerCase().includes(q)
  );
  renderAllAllocationsTable(filtered);
}

/* ════════════════════════════════════════
   15. DOWNLOAD CSV
   ════════════════════════════════════════ */
function downloadAllocationCSV() {
  const rows = JSON.parse(localStorage.getItem('seatAllocationRows') || '[]');
  if (rows.length === 0) { alert('No allocation data to download.'); return; }

  const headers = ['EnrollmentID','StudentName','Department','ExamName','Building','Floor','Room','SeatNo'];
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${r[h] || ''}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exam_seat_allocation.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════
   16. STUDENT RESULT SCREEN
   ════════════════════════════════════════ */
function showStudentResult(enrollId) {
  const alloc = JSON.parse(localStorage.getItem('seatAllocation') || '{}');
  const record = alloc[enrollId];

  const card = document.getElementById('student-result-card');
  const screen = document.getElementById('screen-student-result');

  if (record) {
    // Set background based on building
    const bgKey = record.BuildingKey || guessBuilding(record.Building);
    const bg = bgKey ? BUILDINGS[bgKey]?.bgImage : 'images/ss2.png';
    screen.style.backgroundImage = `url('${bg || 'images/ss2.png'}')`;
    screen.setAttribute('data-bg', bg);

    card.innerHTML = `
      <h2 class="result-card-title">Your Exam Seating Arrangement</h2>
      <div class="result-item">
        <div>
          <div class="result-item-label">Student Name</div>
          <div class="result-item-value">${record.StudentName}</div>
        </div>
      </div>
      <div class="result-item">
        <div>
          <div class="result-item-label">Building</div>
          <div class="result-item-value">${record.Building}</div>
        </div>
      </div>
      <div class="result-item">
        <div>
          <div class="result-item-label">Floor</div>
          <div class="result-item-value">Floor ${record.Floor}</div>
        </div>
      </div>
      <div class="result-item">
        <div>
          <div class="result-item-label">Room</div>
          <div class="result-item-value">${record.Room}</div>
        </div>
      </div>
      <div class="result-item">
        <div>
          <div class="result-item-label">Seat Number</div>
          <div class="result-item-value">${record.SeatNo}</div>
        </div>
      </div>`;
  } else {
    // No allocation found — use a neutral bg
    screen.style.backgroundImage = `url('images/ss7.png')`;
    card.innerHTML = `
      <div class="result-not-found">
        <h3>Seat Not Yet Assigned</h3>
        <p>Your seat has not been allocated yet.<br>Please check back later or contact your faculty.</p>
      </div>`;
  }

  showScreen('screen-student-result');
}

function guessBuilding(name) {
  if (!name) return null;
  if (name.includes('B1')) return 'B1';
  if (name.includes('B2')) return 'B2';
  if (name.includes('B3')) return 'B3';
  return null;
}

/* ════════════════════════════════════════
   17. SESSION RESTORE
   ════════════════════════════════════════ */
function restoreSession() {
  const role = sessionStorage.getItem('role');
  if (role === 'faculty') {
    state.role = 'faculty';
    showScreen('screen-faculty-dashboard');
    checkExistingData();
    return true;
  }
  if (role === 'student') {
    const enrollId = sessionStorage.getItem('enrollId');
    if (enrollId) {
      state.role = 'student';
      state.loggedInEnrollment = enrollId;
      showStudentResult(enrollId);
      return true;
    }
  }
  return false;
}

/* ════════════════════════════════════════
   18. INPUT DIGIT-ONLY ENFORCEMENT
   ════════════════════════════════════════ */
function enforcedigits(el) {
  el.addEventListener('input', () => {
    el.value = el.value.replace(/\D/g, '');
  });
}

/* ════════════════════════════════════════
   19. INIT
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Set landing background
  const landing = document.getElementById('screen-landing');
  landing.style.backgroundImage = `url('images/ss1.png')`;

  // Set faculty login background
  const facLogin = document.getElementById('screen-faculty-login');
  facLogin.style.backgroundImage = `url('images/ss6.png')`;

  // Set student login background
  const stuLogin = document.getElementById('screen-student-login');
  stuLogin.style.backgroundImage = `url('images/ss7.png')`;

  // Set dashboard background
  const dash = document.getElementById('screen-faculty-dashboard');
  dash.style.backgroundImage = `url('images/ss5.png')`;

  // Set all-allocations background
  const allAlloc = document.getElementById('screen-all-allocations');
  allAlloc.style.backgroundImage = `url('images/ss5.png')`;

  // Digit-only inputs
  enforcedigits(document.getElementById('teacher-id'));
  enforcedigits(document.getElementById('faculty-password'));
  enforcedigits(document.getElementById('enrollment-id'));
  enforcedigits(document.getElementById('student-password'));
  enforcedigits(document.getElementById('m-enrollment'));
  enforcedigits(document.getElementById('m-seat'));

  // Drag & drop upload
  initDragDrop();

  // Try restore session; otherwise show landing
  if (!restoreSession()) {
    showScreen('screen-landing');
  }
});
