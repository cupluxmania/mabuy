// --- Data ---
const halls = [
  {name:"Hall 5", start:5001, end:"5078A"},
  {name:"Hall 6", start:6001, end:"6189A"},
  {name:"Hall 7", start:7001, end:"7185A"},
  {name:"Hall 8", start:8001, end:"8181A"},
  {name:"Hall 9", start:9001, end:"9191A"},
  {name:"Hall 10", start:1001, end:"1151A"},
  {name:"Ambulance", start:"A", end:"Z"}
];

let floor;
let currentBooth = null;

// --- Generate floor ---
function initFloor(){
  floor.innerHTML = "";

  halls.forEach(hall => {

    const hallDiv = document.createElement("div");
    hallDiv.className = "hall";

    const header = document.createElement("div");
    header.className = "hallHeader";
    header.innerHTML = `
      <span>${hall.name}</span>
      <span class="bubble available">0</span>
      <span class="bubble booked">0</span>
    `;

    const grid = document.createElement("div");
    grid.className = "grid";

    if(hall.name === "Ambulance"){

      for(let i=65;i<=90;i++){
        grid.appendChild(createBooth(String.fromCharCode(i), hallDiv));
      }

    } else {

      let start=parseInt(hall.start);
      let endNum=parseInt(hall.end);
      const endLetter = hall.end.toString().replace(/\d+/,"");

      for(let i=start;i<=endNum;i++){
        const boothID = i + (i===endNum ? endLetter : "");
        grid.appendChild(createBooth(boothID, hallDiv));
      }

    }

    hallDiv.appendChild(header);
    hallDiv.appendChild(grid);
    floor.appendChild(hallDiv);

    updateHallStats(hallDiv);

  });

  loadSavedBooths();
  updatePanels();
}


// --- Booth creation ---
function createBooth(id, hallDiv){

  const booth = document.createElement("div");

  booth.className = "booth available";
  booth.innerText = id;

  booth.dataset.status = "available";
  booth.dataset.name = "";
  booth.dataset.contractor = "";
  booth.dataset.id = id;
  booth.dataset.tooltip = "";

  booth.addEventListener("click", (e)=>{
    e.stopPropagation();
    openBoothPopup(booth, hallDiv);
  });

  return booth;
}


// --- Update hall stats ---
function updateHallStats(hallDiv){

  const booths = hallDiv.querySelectorAll(".booth");

  let available=0;
  let booked=0;

  booths.forEach(b=>{
    if(b.dataset.status==="available") available++;
    else booked++;
  });

  const bubbles = hallDiv.querySelectorAll(".bubble");

  bubbles[0].innerText = available;
  bubbles[1].innerText = booked;
}


// --- Booth modal ---
function openBoothPopup(booth, hallDiv){

  currentBooth={booth,hallDiv};

  document.getElementById("boothId").innerText = booth.innerText;
  document.getElementById("boothStatus").value = booth.dataset.status;
  document.getElementById("boothName").value = booth.dataset.name || "";
  document.getElementById("contractorName").value = booth.dataset.contractor || "";

  document.getElementById("boothModal").style.display="block";
}

function closeModal(){
  document.getElementById("boothModal").style.display="none";
}


// --- Save booth ---
function saveBooth(){

  const status = document.getElementById("boothStatus").value;
  const name = document.getElementById("boothName").value.trim();
  const contractor = document.getElementById("contractorName").value.trim();

  if(status==="booked" && name.length<4){
    alert("Exhibitor name must be at least 4 characters when booking!");
    return;
  }

  currentBooth.booth.dataset.status = status;
  currentBooth.booth.dataset.name = name;
  currentBooth.booth.dataset.contractor = contractor;

  currentBooth.booth.className = "booth "+status;
  currentBooth.booth.dataset.tooltip = name || "";

  saveBoothData(currentBooth.booth);

  updateHallStats(currentBooth.hallDiv);

  closeModal();

  updatePanels();
}


// --- LocalStorage ---
function saveBoothData(booth){

  const saved = JSON.parse(localStorage.getItem("floorData") || "{}");

  saved[booth.dataset.id] = {
    status: booth.dataset.status,
    name: booth.dataset.name,
    contractor: booth.dataset.contractor || ""
  };

  localStorage.setItem("floorData", JSON.stringify(saved));
}


function loadSavedBooths(){

  const saved = JSON.parse(localStorage.getItem("floorData") || "{}");

  document.querySelectorAll(".hall").forEach(hallDiv=>{

    hallDiv.querySelectorAll(".booth").forEach(b=>{

      const id=b.dataset.id;

      if(saved[id]){

        b.dataset.status=saved[id].status;
        b.dataset.name=saved[id].name;
        b.dataset.contractor=saved[id].contractor || "";

        b.className="booth "+saved[id].status;
        b.dataset.tooltip=saved[id].name || "";

      }

    });

    updateHallStats(hallDiv);

  });

}


// --- Panels ---
let filledPanel;
let analyticsPanel;

function updatePanels(){

  const saved = JSON.parse(localStorage.getItem("floorData") || "{}");

  filledPanel.innerHTML="";

  for(const id in saved){

    if(saved[id].status==="booked"){

      const div=document.createElement("div");

      div.innerText=`${id}: ${saved[id].name} (${saved[id].contractor || '-'})`;

      div.addEventListener("click", ()=>{

        const booth=document.querySelector(`.booth[data-id='${id}']`);

        if(booth){

          booth.scrollIntoView({
            behavior:"smooth",
            block:"center",
            inline:"center"
          });

          booth.classList.add("selectedBooth");

          setTimeout(()=>{
            booth.classList.remove("selectedBooth");
          },1500);

        }

      });

      filledPanel.appendChild(div);

    }

  }


  let total=0;
  let booked=0;
  let available=0;

  document.querySelectorAll(".booth").forEach(b=>{
    total++;
    if(b.dataset.status==="booked") booked++;
    else available++;
  });

  analyticsPanel.innerHTML=
  `Total: ${total}<br>Booked: ${booked}<br>Available: ${available}`;

}


// --- Export XLSX ---
function exportExcel(){

  const saved = JSON.parse(localStorage.getItem("floorData") || "{}");

  const wb = XLSX.utils.book_new();

  const ws_data = [["Booth ID","Status","Exhibitor","Contractor"]];

  for(const id in saved){
    ws_data.push([
      id,
      saved[id].status,
      saved[id].name,
      saved[id].contractor
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  XLSX.utils.book_append_sheet(wb, ws, "Booths");

  XLSX.writeFile(wb,"ExpoBooths.xlsx");
}


// --- Import XLSX ---
function importExcel(e){

  const file = e.target.files[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = (evt)=>{

    const data = new Uint8Array(evt.target.result);

    const wb = XLSX.read(data,{type:'array'});

    const ws = wb.Sheets[wb.SheetNames[0]];

    const json = XLSX.utils.sheet_to_json(ws,{
      header:["id","status","name","contractor"],
      defval:""
    });

    json.slice(1).forEach(row=>{

      const booth=document.querySelector(`.booth[data-id='${row.id}']`);

      if(booth){

        booth.dataset.status=row.status;
        booth.dataset.name=row.name;
        booth.dataset.contractor=row.contractor;

        booth.className="booth "+row.status;

        booth.dataset.tooltip=row.name;

        saveBoothData(booth);

        updateHallStats(booth.closest(".hall"));

      }

    });

    updatePanels();

  };

  reader.readAsArrayBuffer(file);

}


// --- Initialize AFTER page loads ---
document.addEventListener("DOMContentLoaded", ()=>{

  floor = document.getElementById("floor");

  filledPanel = document.getElementById("filledPanel");
  analyticsPanel = document.getElementById("analyticsPanel");

  initFloor();

  document.getElementById("saveBoothBtn").addEventListener("click", saveBooth);

  document.getElementById("exportBtn").addEventListener("click", exportExcel);

  document.getElementById("uploadBtn").addEventListener("click", ()=>{
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile").addEventListener("change", importExcel);

});
