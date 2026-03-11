// --- INIT DATA ---
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
let zoomLevel = 1;
const container = document.getElementById("floorContainer");
const filledPanel = document.getElementById("filledPanel");
const analyticsPanel = document.getElementById("analyticsPanel");
const importFile = document.getElementById("importFile");

// --- INIT FLOOR ---
function initFloor() {
  floor.innerHTML = "";
  halls.forEach(hall=>{
    const hallDiv = document.createElement("div");
    hallDiv.className = "hall";

    const header = document.createElement("div");
    header.className = "hallHeader";

    header.innerHTML = `<h3>${hall.name}</h3>
      <div>
        <span class="availableBadge availableCount">0</span>
        <span class="bookedBadge bookedCount">0</span>
      </div>`;

    const grid = document.createElement("div");
    grid.className = "grid";

    if(hall.name==="Ambulance") {
      for(let i=65;i<=90;i++) grid.appendChild(createBooth(String.fromCharCode(i), hallDiv));
    } else {
      let start=parseInt(hall.start), endNum=parseInt(hall.end), endLetter=hall.end.toString().replace(/\d+/,"");
      for(let i=start;i<=endNum;i++){
        let id = i + (i===endNum?endLetter:"");
        grid.appendChild(createBooth(id, hallDiv));
      }
    }

    hallDiv.appendChild(header);
    hallDiv.appendChild(grid);
    floor.appendChild(hallDiv);
    updateHallStats(hallDiv);
  });
}

// --- CREATE BOOTH ---
function createBooth(id, hallDiv){
  const booth = document.createElement("div");
  booth.className = "booth available";
  booth.innerText = id;
  booth.dataset.id = id;
  booth.dataset.status = "available";
  booth.dataset.name = "";
  booth.dataset.contractor = "";

  booth.addEventListener("click", e=>{
    e.stopPropagation();
    openBoothPopup(booth, hallDiv);
  });

  return booth;
}

// --- STATS ---
function updateHallStats(hallDiv){
  const booths = hallDiv.querySelectorAll(".booth");
  let available=0, booked=0;
  booths.forEach(b=>b.dataset.status==="available"?available++:booked++);
  hallDiv.querySelector(".availableCount").innerText = available;
  hallDiv.querySelector(".bookedCount").innerText = booked;
}

// --- MODAL ---
function openBoothPopup(booth,hallDiv){
  currentBooth={booth,hallDiv};
  document.getElementById("boothId").innerText = booth.dataset.id;
  document.getElementById("boothStatus").value = booth.dataset.status;
  document.getElementById("boothName").value = booth.dataset.name;
  document.getElementById("contractorName").value = booth.dataset.contractor;
  document.getElementById("boothModal").style.display="block";
}
function closeModal(){ document.getElementById("boothModal").style.display="none"; }

// --- SAVE BOOTH (4-CHAR VALIDATION) ---
function saveBooth(){
  const status = document.getElementById("boothStatus").value;
  const name = document.getElementById("boothName").value.trim();
  const contractor = document.getElementById("contractorName").value.trim();

  if(status === "booked" && name.length < 4){
    alert("Exhibitor name must be at least 4 characters when booking!");
    return;
  }

  currentBooth.booth.dataset.status = status;
  currentBooth.booth.dataset.name = name;
  currentBooth.booth.dataset.contractor = contractor;
  currentBooth.booth.className = "booth " + status;

  saveBoothData(currentBooth.booth);
  updateHallStats(currentBooth.hallDiv);
  closeModal();
}

// --- STORAGE ---
function saveBoothData(booth){
  let saved = JSON.parse(localStorage.getItem("floorData")||"{}");
  saved[booth.dataset.id] = {status:booth.dataset.status,name:booth.dataset.name,contractor:booth.dataset.contractor};
  localStorage.setItem("floorData",JSON.stringify(saved));
}
function loadSavedBooths(){
  let saved = JSON.parse(localStorage.getItem("floorData")||"{}");
  document.querySelectorAll(".booth").forEach(b=>{
    if(saved[b.dataset.id]){
      b.dataset.status = saved[b.dataset.id].status;
      b.dataset.name = saved[b.dataset.id].name;
      b.dataset.contractor = saved[b.dataset.id].contractor;
      b.className = "booth "+saved[b.dataset.id].status;
    }
  });
  document.querySelectorAll(".hall").forEach(updateHallStats);
}

// --- DRAG H+V ---
let isDown=false, startX, startY, originX=0, originY=0;
container.addEventListener("mousedown", e=>{
  if(e.target.classList.contains("booth")) return;
  isDown=true;
  startX=e.clientX;
  startY=e.clientY;
  originX=container.scrollLeft;
  originY=container.scrollTop;
  container.style.cursor="grabbing";
});
document.addEventListener("mouseup", ()=>{isDown=false; container.style.cursor="grab";});
document.addEventListener("mousemove", e=>{
  if(!isDown) return;
  container.scrollLeft = originX - (e.clientX-startX);
  container.scrollTop = originY - (e.clientY-startY);
});

// --- ZOOM ---
function applyZoom(){
  floor.style.transform = `scale(${zoomLevel})`;
  floor.style.transformOrigin = "center center";
  document.getElementById("zoomLevel").innerText = Math.round(zoomLevel*100)+"%";
}
document.getElementById("zoomIn").onclick = ()=>{ zoomLevel+=0.1; applyZoom(); };
document.getElementById("zoomOut").onclick = ()=>{ zoomLevel=Math.max(0.2,zoomLevel-0.1); applyZoom(); };

// --- FILLED PANEL ---
document.getElementById("filledBoothsBtn").onclick = ()=>{
  if(filledPanel.style.display==="block"){filledPanel.style.display="none"; return;}
  let html="<h3>Booked Booths</h3>";
  document.querySelectorAll(".booth").forEach(b=>{
    if(b.dataset.status==="booked") {
      html+=`<div class="panelItem" data-id="${b.dataset.id}">
               <strong>${b.dataset.id}</strong> - ${b.dataset.name}<br>
               <span style="font-size:16px;color:#555;">Contractor: ${b.dataset.contractor || "N/A"}</span>
             </div>`;
    }
  });
  filledPanel.innerHTML=html;
  filledPanel.style.display="block";

  filledPanel.querySelectorAll(".panelItem").forEach(link=>{
    link.onclick=function(){
      const booth=document.querySelector(`.booth[data-id="${this.dataset.id}"]`);
      booth.scrollIntoView({behavior:"smooth",block:"center",inline:"center"});
      booth.style.outline="4px solid #facc15";
      setTimeout(()=>booth.style.outline="",2000);
    }
  });
};

// --- ANALYTICS PANEL ---
document.getElementById("analyticsBtn").onclick = ()=>{
  if(analyticsPanel.style.display==="block"){analyticsPanel.style.display="none"; return;}
  const booths = document.querySelectorAll(".booth");
  const total=booths.length;
  const booked=[...booths].filter(b=>b.dataset.status==="booked").length;
  const available = total - booked;
  analyticsPanel.innerHTML=`
    <h3>Analytics</h3>
    <div class="panelItem">Total Booths: ${total}</div>
    <div class="panelItem availableBadge">Available: ${available}</div>
    <div class="panelItem bookedBadge">Booked: ${booked}</div>
    <div class="panelItem">Occupancy: ${Math.round(booked/total*100)}%</div>
  `;
  analyticsPanel.style.display="block";
};

// --- CLICK OUTSIDE TO CLOSE PANELS ---
document.addEventListener("click", e=>{
  if(!filledPanel.contains(e.target) && e.target.id!=="filledBoothsBtn") filledPanel.style.display="none";
  if(!analyticsPanel.contains(e.target) && e.target.id!=="analyticsBtn") analyticsPanel.style.display="none";
});

// --- EXPORT ---
document.getElementById("exportBtn").onclick = ()=>{
  const data=[["Booth","Exhibitor","Contractor"]];
  document.querySelectorAll(".booth").forEach(b=>{
    if(b.dataset.status==="booked") data.push([b.dataset.id,b.dataset.name,b.dataset.contractor]);
  });
  const ws=XLSX.utils.aoa_to_sheet(data);
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Exhibitors");
  XLSX.writeFile(wb,"expo_exhibitors.xlsx");
};

// --- UPLOAD ---
document.getElementById("uploadBtn").onclick = ()=>{ importFile.click(); };
importFile.addEventListener("change", e=>{
  const file=e.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=evt=>{
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data,{type:"array"});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet,{header:1});
    rows.slice(1).forEach(row=>{
      const b = document.querySelector(`.booth[data-id="${row[0]}"]`);
      if(b){ 
        b.dataset.status="booked"; 
        b.dataset.name=row[1]||""; 
        b.dataset.contractor=row[2]||""; 
        b.className="booth booked"; 
        saveBoothData(b); 
        updateHallStats(b.closest(".hall"));
      }
    });
  };
  reader.readAsArrayBuffer(file);
});

// --- MODAL CLOSE ON BACKGROUND ---
document.getElementById("boothModal").addEventListener("click", e=>{
  if(e.target.id==="boothModal") closeModal();
});

// --- INIT ---
initFloor();
loadSavedBooths();