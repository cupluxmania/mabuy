const SHEET_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTOcl25DHFV_jFSifudNzweglzM3SoGGfwgRZ-ENWd7dsfaqGUkUy08iBQLyGjY5Fj2RUMsrpiQ204K/pub?gid=0&single=true&output=csv";

const halls = [
{ name:"Hall 5", start:5001, end:"5078A" },
{ name:"Hall 6", start:6001, end:"6189A" },
{ name:"Hall 7", start:7001, end:"7185A" },
{ name:"Hall 8", start:8001, end:"8181A" },
{ name:"Hall 9", start:9001, end:"9191A" },
{ name:"Hall 10", start:1001, end:"1151A" },
{ name:"Ambulance", start:"A", end:"Z" }
];

const floor = document.getElementById("floor");

let currentBooth=null;

function initFloor(){

floor.innerHTML="";

halls.forEach(hall=>{

const hallDiv=document.createElement("div");
hallDiv.className="hall";

const header=document.createElement("div");
header.className="hallHeader";

header.innerHTML=`
<span>${hall.name}</span>
<span class="bubble available">0</span>
<span class="bubble booked">0</span>
`;

const grid=document.createElement("div");
grid.className="grid";

if(hall.name==="Ambulance"){

for(let i=65;i<=90;i++){

grid.appendChild(createBooth(String.fromCharCode(i),hallDiv));

}

}else{

let start=parseInt(hall.start);
let end=parseInt(hall.end);
let letter=hall.end.toString().replace(/\d+/,"");

for(let i=start;i<=end;i++){

let id=i+(i===end?letter:"");

grid.appendChild(createBooth(id,hallDiv));

}

}

hallDiv.appendChild(header);
hallDiv.appendChild(grid);

floor.appendChild(hallDiv);

});

}

function createBooth(id,hallDiv){

const booth=document.createElement("div");

booth.className="booth available";

booth.innerText=id;

booth.dataset.id=id;
booth.dataset.status="available";
booth.dataset.name="";
booth.dataset.contractor="";

booth.addEventListener("click",(e)=>{

e.stopPropagation();

openBoothPopup(booth,hallDiv);

});

return booth;

}

async function loadFromGoogleSheet(){

const res=await fetch(SHEET_URL);
const csv=await res.text();

const rows=csv.split("\n").slice(1);

rows.forEach(row=>{

const cols=row.split(",");

const id=cols[0];
const status=cols[1];
const name=cols[2];
const contractor=cols[3];

const booth=document.querySelector(`.booth[data-id='${id}']`);

if(booth){

booth.dataset.status=status;
booth.dataset.name=name;
booth.dataset.contractor=contractor;

booth.className="booth "+status;

booth.dataset.tooltip=name;

}

});

updateHallStatsAll();
updatePanels();

}

function updateHallStats(hall){

const booths=hall.querySelectorAll(".booth");

let available=0;
let booked=0;

booths.forEach(b=>{

if(b.dataset.status==="booked") booked++;
else available++;

});

const bubbles=hall.querySelectorAll(".bubble");

bubbles[0].innerText=available;
bubbles[1].innerText=booked;

}

function updateHallStatsAll(){

document.querySelectorAll(".hall").forEach(h=>updateHallStats(h));

}

function openBoothPopup(booth,hall){

currentBooth={booth,hall};

document.getElementById("boothId").innerText=booth.dataset.id;

document.getElementById("boothStatus").value=booth.dataset.status;
document.getElementById("boothName").value=booth.dataset.name;
document.getElementById("contractorName").value=booth.dataset.contractor;

document.getElementById("boothModal").style.display="block";

}

function closeModal(){

document.getElementById("boothModal").style.display="none";

}

document.getElementById("saveBoothBtn").addEventListener("click",()=>{

const status=document.getElementById("boothStatus").value;
const name=document.getElementById("boothName").value;
const contractor=document.getElementById("contractorName").value;

currentBooth.booth.dataset.status=status;
currentBooth.booth.dataset.name=name;
currentBooth.booth.dataset.contractor=contractor;

currentBooth.booth.className="booth "+status;

updateHallStats(currentBooth.hall);

closeModal();

});

const filledPanel=document.getElementById("filledPanel");
const analyticsPanel=document.getElementById("analyticsPanel");

function updatePanels(){

filledPanel.innerHTML="";

document.querySelectorAll(".booth").forEach(b=>{

if(b.dataset.status==="booked"){

const div=document.createElement("div");

div.innerText=`${b.dataset.id}: ${b.dataset.name}`;

filledPanel.appendChild(div);

}

});

let total=0,booked=0,available=0;

document.querySelectorAll(".booth").forEach(b=>{

total++;

if(b.dataset.status==="booked") booked++;
else available++;

});

analyticsPanel.innerHTML=`
Total: ${total}<br>
Booked: ${booked}<br>
Available: ${available}
`;

}

let zoomLevel=1;

const zoomIn=document.getElementById("zoomIn");
const zoomOut=document.getElementById("zoomOut");
const zoomLevelText=document.getElementById("zoomLevel");

zoomIn.onclick=()=>{

zoomLevel+=0.1;
applyZoom();

};

zoomOut.onclick=()=>{

zoomLevel=Math.max(0.2,zoomLevel-0.1);
applyZoom();

};

function applyZoom(){

floor.style.transform=`scale(${zoomLevel})`;
zoomLevelText.innerText=Math.round(zoomLevel*100)+"%";

}

document.getElementById("exportBtn").addEventListener("click",()=>{

const wb=XLSX.utils.book_new();

const ws_data=[["Booth","Status","Name","Contractor"]];

document.querySelectorAll(".booth").forEach(b=>{

ws_data.push([
b.dataset.id,
b.dataset.status,
b.dataset.name,
b.dataset.contractor
]);

});

const ws=XLSX.utils.aoa_to_sheet(ws_data);

XLSX.utils.book_append_sheet(wb,ws,"Booths");

XLSX.writeFile(wb,"ExpoBooths.xlsx");

});

initFloor();

loadFromGoogleSheet();

setInterval(loadFromGoogleSheet,30000);
