const db = firebase.firestore();

const halls=[
{name:"Hall 5",start:5001,end:5078},
{name:"Hall 6",start:6001,end:6189},
{name:"Hall 7",start:7001,end:7185}
];

const floor=document.getElementById("floor");

function initFloor(){

floor.innerHTML="";

halls.forEach(h=>{

const hall=document.createElement("div");
hall.className="hall";

const header=document.createElement("div");
header.className="hallHeader";
header.innerText=h.name;

const grid=document.createElement("div");
grid.className="grid";

for(let i=h.start;i<=h.end;i++){

const booth=document.createElement("div");

booth.className="booth available";
booth.innerText=i;

booth.dataset.id=i;
booth.dataset.status="available";
booth.dataset.name="";

booth.setAttribute("data-id",i);
booth.setAttribute("data-name","");

booth.onclick=()=>openBoothPopup(booth);

grid.appendChild(booth);

}

hall.appendChild(header);
hall.appendChild(grid);

floor.appendChild(hall);

});

loadSavedBooths();

}

let currentBooth=null;

function openBoothPopup(booth){

currentBooth=booth;

document.getElementById("boothId").innerText=booth.dataset.id;
document.getElementById("boothStatus").value=booth.dataset.status;
document.getElementById("boothName").value=booth.dataset.name;

document.getElementById("boothModal").style.display="block";

}

function closeModal(){
document.getElementById("boothModal").style.display="none";
}

document.getElementById("saveBoothBtn").onclick=function(){

const status=document.getElementById("boothStatus").value;

let name=document.getElementById("boothName").value;

if(status==="available"){
name="";
}

currentBooth.dataset.status=status;
currentBooth.dataset.name=name;

currentBooth.className="booth "+status;

currentBooth.setAttribute("data-name",name);

saveBoothData(currentBooth);

closeModal();

};

function saveBoothData(booth){

db.collection("booths").doc(booth.dataset.id).set({

status:booth.dataset.status,
name:booth.dataset.name

});

}

function loadSavedBooths(){

db.collection("booths").get().then(snapshot=>{

snapshot.forEach(doc=>{

const booth=document.querySelector(`[data-id='${doc.id}']`);

if(!booth) return;

booth.dataset.status=doc.data().status;
booth.dataset.name=doc.data().name;

booth.className="booth "+doc.data().status;

booth.setAttribute("data-name",doc.data().name);

});

});

}

/* DRAG */

const floorContainer=document.getElementById("floorContainer");

let isDragging=false;
let startX,startY,scrollLeft,scrollTop;

floorContainer.addEventListener("mousedown",e=>{

isDragging=true;

startX=e.pageX-floorContainer.offsetLeft;
startY=e.pageY-floorContainer.offsetTop;

scrollLeft=floorContainer.scrollLeft;
scrollTop=floorContainer.scrollTop;

floorContainer.style.cursor="grabbing";

});

floorContainer.addEventListener("mouseup",()=>{

isDragging=false;
floorContainer.style.cursor="grab";

});

floorContainer.addEventListener("mouseleave",()=>{

isDragging=false;
floorContainer.style.cursor="grab";

});

floorContainer.addEventListener("mousemove",e=>{

if(!isDragging) return;

e.preventDefault();

const x=e.pageX-floorContainer.offsetLeft;
const y=e.pageY-floorContainer.offsetTop;

floorContainer.scrollLeft=scrollLeft-(x-startX);
floorContainer.scrollTop=scrollTop-(y-startY);

});

/* ZOOM */

let zoom=1;

document.getElementById("zoomIn").onclick=function(){

zoom+=0.1;

floor.style.transform=`scale(${zoom})`;

document.getElementById("zoomLevel").innerText=Math.round(zoom*100)+"%";

};

document.getElementById("zoomOut").onclick=function(){

zoom-=0.1;

floor.style.transform=`scale(${zoom})`;

document.getElementById("zoomLevel").innerText=Math.round(zoom*100)+"%";

};

/* EXPORT */

document.getElementById("exportBtn").onclick=function(){

const data=[];

document.querySelectorAll(".booth").forEach(b=>{

data.push({

Booth:b.dataset.id,
Status:b.dataset.status,
Exhibitor:b.dataset.name

});

});

const ws=XLSX.utils.json_to_sheet(data);

const wb=XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb,ws,"Booths");

XLSX.writeFile(wb,"booths.xlsx");

};

/* IMPORT */

document.getElementById("uploadBtn").onclick=function(){

document.getElementById("importFile").click();

};

document.getElementById("importFile").addEventListener("change",function(e){

const file=e.target.files[0];

const reader=new FileReader();

reader.onload=function(evt){

const wb=XLSX.read(evt.target.result,{type:"binary"});

const ws=wb.Sheets[wb.SheetNames[0]];

const data=XLSX.utils.sheet_to_json(ws);

data.forEach(row=>{

const booth=document.querySelector(`[data-id='${row.Booth}']`);

if(!booth) return;

booth.dataset.status=row.Status;
booth.dataset.name=row.Exhibitor;

booth.className="booth "+row.Status;

booth.setAttribute("data-name",row.Exhibitor);

saveBoothData(booth);

});

};

reader.readAsBinaryString(file);

});

initFloor();
