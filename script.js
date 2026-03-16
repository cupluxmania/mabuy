const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

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
  } catch (err) { console.error("Sync Error:", err); }
}

function initFloor() {
  const floor = document.getElementById("floor");
  // Simplified generation: Loop for halls and booths as per your logic
  // ... [Keep your existing booth generation logic here] ...
  
  document.getElementById("filledBoothsBtn")?.addEventListener("click", () => {
    const p = document.getElementById("filledPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
  });
  
  document.getElementById("analyticsBtn")?.addEventListener("click", () => {
    const p = document.getElementById("analyticsPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
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

initFloor();
