const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const halls = [
  {name:"Hall 5", start:5001, end:"5078A"}, {name:"Hall 6", start:6001, end:"6189A"},
  {name:"Hall 7", start:7001, end:"7185A"}, {name:"Hall 8", start:8001, end:"8181A"},
  {name:"Hall 9", start:9001, end:"9191A"}, {name:"Hall 10", start:1001, end:"1151A"},
  {name:"Ambulance", start:"A", end:"Z"}
];

const floor = document.getElementById("floor");

async function loadFromGoogleSheets() {
  try {
    const response = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${new Date().getTime()}`, { redirect: 'follow' });
    const remoteData = await response.json();
    const dataMap = {};
    remoteData.forEach(row => { dataMap[row.boothid] = row; });

    document.querySelectorAll(".booth").forEach(b => {
      const row = dataMap[b.dataset.id];
      if (row) {
        let name = (row.exhibitor || "").trim();
        let status = (row.status || "available").toLowerCase().trim();
        
        // Plotting logic: if name is all lowercase, mark as yellow plotting status
        if (name.length > 0 && name === name.toLowerCase()) status = "plotting";

        b.dataset.status = status;
        b.dataset.name = name;
        b.className = "booth " + status;
        b.dataset.tooltip = name;
      }
    });
    updatePanels();
  } catch (err) { console.error(err); }
}

function initFloor() {
  halls.forEach(hall => {
    const hallDiv = document.createElement("div");
    hallDiv.className = "hall";
    hallDiv.innerHTML = `<div class="hallHeader"><span>${hall.name}</span></div><div class="grid"></div>`;
    const grid = hallDiv.querySelector(".grid");
    // Generate booths... (Add back your original booth generation loop)
    floor.appendChild(hallDiv);
  });
  loadFromGoogleSheets();
}

function openBoothPopup(booth) {
  document.getElementById("boothId").innerText = booth.dataset.id;
  document.getElementById("boothStatus").value = booth.dataset.status;
  document.getElementById("boothName").value = booth.dataset.name;
  document.getElementById("boothModal").style.display = "block";
}

function closeModal() { document.getElementById("boothModal").style.display = "none"; }
// ... (Add your existing zoom and panel logic here)
initFloor();
