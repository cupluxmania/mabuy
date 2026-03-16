// --- CONFIGURATION ---
const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyjA6wXxy4f38yVfF1KNrGb8YmRjl3cATZdYuxHuDHDKUEcWfsaz2uQvQMU0efkd0D_ng/exec";

const halls = [
  {name:"Hall 5", start:5001, end:"5078A"},
  {name:"Hall 6", start:6001, end:"6189A"},
  {name:"Hall 7", start:7001, end:"7185A"},
  {name:"Hall 8", start:8001, end:"8181A"},
  {name:"Hall 9", start:9001, end:"9191A"},
  {name:"Hall 10", start:1001, end:"1151A"},
  {name:"Ambulance", start:"A", end:"Z"}
];

const floor = document.getElementById("floor");
let currentBooth = null;

// --- 1. Data Sync Functions ---

async function loadFromGoogleSheets() {
  try {
    const response = await fetch(G_SCRIPT_URL);
    const remoteData = await response.json();
    
    // Create a map for fast lookup: { "5001": { status: "booked", ... } }
    const dataMap = {};
    remoteData.forEach(row => {
      // Logic maps to header names: "boothid", "status", "exhibitor", "contractor"
      dataMap[row.boothid] = row;
    });

    document.querySelectorAll(".booth").forEach(b => {
      const id = b.dataset.id;
      if (dataMap[id]) {
        const row = dataMap[id];
        b.dataset.status = row.status || "available";
        b.dataset.name = row.exhibitor || "";
        b.dataset.contractor = row.contractor || "";
        b.className = "booth " + b.dataset.status;
        b.dataset.tooltip = b.dataset.name || "";
      }
    });

    // Refresh counters and panels
    document.querySelectorAll(".hall").forEach(updateHallStats);
    updatePanels();
    console.log("Data synced from Google Sheets.");
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

async function saveToGoogleSheets(id, status, name, contractor) {
  const payload = { id, status, name, contractor };
  
  try {
    // Note: Google Script POST requires 'no-cors' for simple browser requests
    // but the update will still process on the server side.
    await fetch(G_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      cache: "no-cache",
      body: JSON.stringify(payload)
    });
    console.log(`Booth ${id} sync request sent.`);
  } catch (err) {
    console.error("Save error:", err);
  }
}

// --- 2. Floor Generation ---

function initFloor() {
  floor.innerHTML = "";
  halls.forEach(hall => {
    const hallDiv = document.createElement("div");
    hallDiv.className = "hall";

    const header = document.createElement("div");
    header.className = "hallHeader";
    header.innerHTML = `<span>${hall.name}</span>
      <span class="bubble available">0</span>
      <span class="bubble booked">0</span>`;

    const grid = document.createElement("div");
    grid.className = "grid";

    if (hall.name === "Ambulance") {
      for (let i = 65; i <= 90; i++) grid.appendChild(createBooth(String.fromCharCode(i), hallDiv));
    } else {
      let start = parseInt(hall.start);
      let endNum = parseInt(hall.end);
      const endLetter = hall.end.toString().replace(/\d+/, "");
      for (let i = start; i <= endNum; i++) {
        const boothID = i + (i === endNum ? endLetter : "");
        grid.appendChild(createBooth(boothID, hallDiv));
      }
    }

    hallDiv.appendChild(header);
    hallDiv.appendChild(grid);
    floor.appendChild(hallDiv);
    updateHallStats(hallDiv);
  });
  
  // Load data immediately after building the UI
  loadFromGoogleSheets();
}

function createBooth(id, hallDiv) {
  const booth = document.createElement("div");
  booth.className = "booth available";
  booth.innerText = id;
  booth.dataset.status = "available";
  booth.dataset.name = "";
  booth.dataset.contractor = "";
  booth.dataset.id = id;
  booth.dataset.tooltip = "";

  booth.addEventListener("click", (e) => {
    e.stopPropagation();
    openBoothPopup(booth, hallDiv);
  });
  return booth;
}

function updateHallStats(hallDiv) {
  const booths = hallDiv.querySelectorAll(".booth");
  let available = 0, booked = 0;
  booths.forEach(b => { if (b.dataset.status === "available") available++; else booked++; });
  const bubbles = hallDiv.querySelectorAll(".bubble");
  bubbles[0].innerText = available;
  bubbles[1].innerText = booked;
}

// --- 3. UI Interactions ---

function openBoothPopup(booth, hallDiv) {
  currentBooth = { booth, hallDiv };
  document.getElementById("boothId").innerText = booth.dataset.id;
  document.getElementById("boothStatus").value = booth.dataset.status;
  document.getElementById("boothName").value = booth.dataset.name || "";
  document.getElementById("contractorName").value = booth.dataset.contractor || "";
  document.getElementById("boothModal").style.display = "block";
}

function closeModal() { document.getElementById("boothModal").style.display = "none"; }

document.getElementById("saveBoothBtn").addEventListener("click", async () => {
  const status = document.getElementById("boothStatus").value;
  const name = document.getElementById("boothName").value.trim();
  const contractor = document.getElementById("contractorName").value.trim();
  const id = currentBooth.booth.dataset.id;

  if (status === "booked" && name.length < 4) {
    alert("Exhibitor name must be at least 4 characters!");
    return;
  }

  // Update Local UI Immediately
  currentBooth.booth.dataset.status = status;
  currentBooth.booth.dataset.name = name;
  currentBooth.booth.dataset.contractor = contractor;
  currentBooth.booth.className = "booth " + status;
  currentBooth.booth.dataset.tooltip = name || "";

  // Sync to Google Sheets
  await saveToGoogleSheets(id, status, name, contractor);

  updateHallStats(currentBooth.hallDiv);
  closeModal();
  updatePanels();
});

// --- 4. Navigation & Zoom ---

const floorContainer = document.getElementById("floorContainer");
let isDown = false, startX, startY, scrollLeft, scrollTop;

floorContainer.addEventListener("mousedown", (e) => {
  isDown = true;
  floorContainer.classList.add("active");
  startX = e.pageX - floorContainer.offsetLeft;
  startY = e.pageY - floorContainer.offsetTop;
  scrollLeft = floorContainer.scrollLeft;
  scrollTop = floorContainer.scrollTop;
});

floorContainer.addEventListener("mouseleave", () => { isDown = false; });
floorContainer.addEventListener("mouseup", () => { isDown = false; });
floorContainer.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - floorContainer.offsetLeft;
  const y = e.pageY - floorContainer.offsetTop;
  floorContainer.scrollLeft = scrollLeft - (x - startX) * 2;
  floorContainer.scrollTop = scrollTop - (y - startY) * 2;
});

let zoomLevel = 1;
document.getElementById("zoomIn").addEventListener("click", () => { zoomLevel += 0.1; applyZoom(); });
document.getElementById("zoomOut").addEventListener("click", () => { zoomLevel = Math.max(0.1, zoomLevel - 0.1); applyZoom(); });

function applyZoom() {
  floor.style.transform = `scale(${zoomLevel})`;
  document.getElementById("zoomLevel").innerText = `${Math.round(zoomLevel * 100)}%`;
}

// --- 5. Panels & Analytics ---

function updatePanels() {
  const filledPanel = document.getElementById("filledPanel");
  const analyticsPanel = document.getElementById("analyticsPanel");
  
  filledPanel.innerHTML = "<h4>Filled Booths</h4>";
  let total = 0, booked = 0;

  document.querySelectorAll(".booth").forEach(b => {
    total++;
    if (b.dataset.status === "booked") {
      booked++;
      const div = document.createElement("div");
      div.innerText = `${b.dataset.id}: ${b.dataset.name}`;
      div.onclick = () => {
        b.scrollIntoView({ behavior: "smooth", block: "center" });
        b.classList.add("selectedBooth");
        setTimeout(() => b.classList.remove("selectedBooth"), 1500);
      };
      filledPanel.appendChild(div);
    }
  });

  analyticsPanel.innerHTML = `<h4>Analytics</h4>Total: ${total}<br>Booked: ${booked}<br>Available: ${total - booked}`;
}

document.getElementById("filledBoothsBtn").addEventListener("click", () => {
  const p = document.getElementById("filledPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
});

document.getElementById("analyticsBtn").addEventListener("click", () => {
  const p = document.getElementById("analyticsPanel");
  p.style.display = p.style.display === "block" ? "none" : "block";
});

// --- Initialize ---
initFloor();

// Auto-refresh from sheet every 60 seconds
setInterval(loadFromGoogleSheets, 60000);
