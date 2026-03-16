const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const halls = [
  {name:"Hall 5", start:5001, end:5078}, {name:"Hall 6", start:6001, end:6189},
  {name:"Hall 7", start:7001, end:7185}, {name:"Hall 8", start:8001, end:8181},
  {name:"Hall 9", start:9001, end:9191}, {name:"Hall 10", start:1001, end:1151}
];

async function loadFromGoogleSheets() {
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

function createBooth(id) {
  const booth = document.createElement("div");
  booth.className = "booth available";
  booth.innerText = id;
  booth.dataset.id = id;
  booth.addEventListener("click", () => openBoothPopup(booth));
  return booth;
}

function initFloor() {
  const floor = document.getElementById("floor");
  halls.forEach(hall => {
    const hallDiv = document.createElement("div");
    hallDiv.className = "hall";
    hallDiv.innerHTML = `<div class="hallHeader">${hall.name}</div><div class="grid"></div>`;
    const grid = hallDiv.querySelector(".grid");
    for (let i = hall.start; i <= hall.end; i++) grid.appendChild(createBooth(i.toString()));
    floor.appendChild(hallDiv);
  });
  loadFromGoogleSheets();
}

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
  if (!filledPanel) return;
  filledPanel.innerHTML = "<h4>Filled Booths</h4>";
  document.querySelectorAll(".booth").forEach(b => {
    if (b.dataset.status === "booked" || b.dataset.status === "plotting") {
      const div = document.createElement("div");
      div.innerText = `${b.dataset.id}: ${b.dataset.name}`;
      filledPanel.appendChild(div);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFloor();
  // Dragging logic
  const container = document.getElementById("floorContainer");
  let isDown = false, startX, scrollLeft;
  container.addEventListener("mousedown", (e) => { isDown = true; startX = e.pageX - container.offsetLeft; scrollLeft = container.scrollLeft; });
  container.addEventListener("mouseleave", () => isDown = false);
  container.addEventListener("mouseup", () => isDown = false);
  container.addEventListener("mousemove", (e) => {
    if(!isDown) return;
    container.scrollLeft = scrollLeft - (e.pageX - container.offsetLeft - startX);
  });
  
  document.getElementById("filledBoothsBtn")?.addEventListener("click", () => { 
    const p = document.getElementById("filledPanel"); 
    p.style.display = p.style.display === "block" ? "none" : "block"; 
  });
});
