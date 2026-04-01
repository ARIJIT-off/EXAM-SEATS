# EXAM SEATS 

**Comprehensive Examination Seating System**

A modern, responsive, and client-side web application designed for efficient university examination seating management. This system handles the entire workflow—from student data ingestion to systematic room allocation and student-facing results.

---

###  Developer Credits
- **Developed by**: ARIJIT PAL
- **Enrollment ID**: 12024002037046
- **Department**: CSE (DATA SCIENCE)

---

##  Key Features

###  Multi-Role Access
- **Faculty Login**: Secure dashboard access for seat management using Teacher ID (6 digits).
- **Student Login**: Direct access to seating arrangements via Enrollment ID (14 digits).

###  Systematic Building & Room Management
- Supporting three distinct building structures (**B1, B2, B3**) with predefined floor and room capacities.
- **B1**: 4 Floors (including RRR Hall).
- **B2**: 4 Floors (40 Rooms).
- **B3**: 6 Floors (54 Rooms).

###  Seamless Workflow
1. **CSV Upload**: Drag-and-drop or browse student lists (powered by PapaParse).
2. **Room Selection**: Grid-based UI to select specific rooms for allocation.
3. **Auto Allocation**: Sequential, shuffled allocation logic to ensure fair distribution.
4. **Data Persistence**: All results are stored in `localStorage` for cross-session access.

### Results & Export
- **Student Lookup**: Clean, visual "Seat Card" for students to find their room and seat number.
- **CSV Export**: Faculty can download a full master report of all allocations.

---

##  Technology Stack
- **Structure**: HTML5 (Semantic elements)
- **Styling**: CSS3 (Flexbox/Grid, Glassmorphism, Responsive Design)
- **Logic**: Vanilla JavaScript (ES6+)
- **Library**: [PapaParse](https://www.papaparse.com/) (CSV Parsing via CDN)
- **Storage**: `localStorage` & `sessionStorage`

---

##  How to Run Locally

### Option 1: Python (Recommended)
Run the following command in your terminal inside the project directory:
```powershell
python -m http.server 5013
```
Then open: **[http://localhost:5013](http://localhost:5013)**

### Option 2: VS Code Live Server
- Open the folder in VS Code.
- Right-click `index.html` → **Open with Live Server**.

### Option 3: Node.js
```bash
npx serve .
```

---

## 📸 Assets Used
- `ss1.png` - UEM Building Exterior (Landing Page)
- `ss2.png` - Computer Lab (B1 Background)
- `ss3.png` - Students Studying (B2 Background)
- `ss4.png` - Empty Classroom (B3 Background)
- `ss5.png` - Group Photo (Dashboard Background)
- `ss6.png` - Library Corridor (Faculty Login)
- `ss7.png` - Digital Library (Student Login)

---

