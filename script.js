// --- CONFIGURATION ---
const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const halls = [
  {name:"Hall 5", start:5001, end:"5078A"}, {name:"Hall 6", start:6001, end:"6189A"},
  {name:"Hall 7", start:7001, end:"7185A"}, {name:"Hall 8", start:8001, end:"8181A"},
  {name:"Hall 9", start:9001, end:"9191A"}, {name:"Hall 10", start:1001, end:"1151A"},
  {name:"Ambulance", start:"A", end:"Z"}
];

// --- 1. DATA SYNC (GOOGLE SHEETS) ---
async function loadFromGoogleSheets() {
  console.log("Syncing with Google Sheets...");
  try {
    const response = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`, { redirect: 'follow' });
    const data = await response.json();
    const dataMap = {};
    data.forEach(row => { dataMap[row.boothid] = row; });

    document.querySelectorAll(".booth").forEach(b => {
      const row = dataMap[b.dataset.id];
      if (row) {
        let name = (row.exhibitor || "").trim();
        let status = (row.status || "available").toLowerCase().trim();
        
        // Plotting Logic: If name contains only lowercase, status = plotting (yellow)
        if (name.length > 0 && name === name.toLowerCase()) status = "plotting";

        b.className = "booth " + status;
        b.dataset.status = status;
        b.dataset.name = name;
        b.dataset.contractor = row.contractor || "";
      }
    });
    updatePanels();
  } catch (err) { console.error("Sync Error:", err); }
}

// --- 2. FLOOR GENERATION ---
function initFloor() {
  const floor = document.getElementById("floor");
  halls.forEach(hall => {
    const hallDiv = document.createElement("div");
    hallDiv.className = "hall";
    hallDiv.innerHTML = `<div class="hallHeader"><span>${hall.name}</span></div><div class="grid"></div>`;
    const grid = hallDiv.querySelector(".grid");
    
    // Booth Generation Logic
    if (hall.name === "Ambulance") {
      for (let i = 65; i <= 90; i++) grid.appendChild(createBooth(String.fromCharCode(i)));
    } else {
      let start = parseInt(hall.start), endNum = parseInt(hall.end);
      const endLetter = hall.end.toString().replace(/\d+/, "");
      for (let i = start; i <= endNum; i++) grid.appendChild(createBooth(i + (i === endNum ? endLetter : "")));
    }
    floor.appendChild(hallDiv);
  });
  
  loadFromGoogleSheets();
}

function createBooth(id) {
  const booth = document.createElement("div");
  booth.className = "booth available";
  booth.innerText = id;
  booth.dataset.id = id;
  booth.addEventListener("click", () => openBoothPopup(booth));
  return booth;
}

// --- 3. UI, MODALS & PANELS ---
function openBoothPopup(booth) {
  document.getElementById("boothId").innerText = booth.dataset.id;
  document.getElementById("boothStatus").value = booth.dataset.status;
  document.getElementById("boothName").value = booth.dataset.name;
  document.getElementById("boothContractor").value = booth.dataset.contractor;
  document.getElementById("boothModal").style.display = "block";
}

function closeModal() { document.getElementById("boothModal").style.display = "none"; }

function updatePanels() {
  const filledPanel = document.getElementById("filledPanel");
  const analyticsPanel = document.getElementById("analyticsPanel");
  if (!filledPanel || !analyticsPanel) return;

  filledPanel.innerHTML = "<h4>Filled Booths</h4>";
  let total = 0, booked = 0, plotting = 0;

  document.querySelectorAll(".booth").forEach(b => {
    total++;
    if (b.dataset.status === "booked" || b.dataset.status === "plotting") {
      if (b.dataset.status === "booked") booked++;
      if (b.dataset.status === "plotting") plotting++;
      const div = document.createElement("div");
      div.innerText = `${b.dataset.id}: ${b.dataset.name}`;
      filledPanel.appendChild(div);
    }
  });

  analyticsPanel.innerHTML = `<h4>Analytics</h4>Total: ${total}<br>Booked: ${booked}<br>Plotting: ${plotting}<br>Available: ${total - booked - plotting}`;
}

// --- 4. INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  initFloor();
  document.getElementById("filledBoothsBtn")?.addEventListener("click", () => {
    const p = document.getElementById("filledPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
  });
  document.getElementById("analyticsBtn")?.addEventListener("click", () => {
    const p = document.getElementById("analyticsPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
  });
  // Zoom logic
  let zoom = 1;
  document.getElementById("zoomIn")?.addEventListener("click", () => { zoom += 0.1; document.getElementById("floor").style.transform = `scale(${zoom})`; document.getElementById("zoomLevel").innerText = Math.round(zoom*100) + "%"; });
  document.getElementById("zoomOut")?.addEventListener("click", () => { zoom = Math.max(0.1, zoom - 0.1); document.getElementById("floor").style.transform = `scale(${zoom})`; document.getElementById("zoomLevel").innerText = Math.round(zoom*100) + "%"; });
});
