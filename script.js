const db = firebase.firestore();

const halls=[
{name:"Hall 5",start:5001,end:5020},
{name:"Hall 6",start:6001,end:6020}
];

const floor=document.getElementById("floor");

function initFloor(){

halls.forEach(h=>{

const hall=document.createElement("div");
hall.className="hall";

const title=document.createElement("h3");
title.innerText=h.name;

const grid=document.createElement("div");
grid.className="grid";

for(let i=h.start;i<=h.end;i++){

const booth=document.createElement("div");

booth.className="booth available";
booth.innerText=i;

booth.dataset.id=i;
booth.dataset.status="available";
booth.dataset.name="";

booth.onclick=()=>openBooth(booth);

grid.appendChild(booth);

}

hall.appendChild(title);
hall.appendChild(grid);

floor.appendChild(hall);

});

loadBooths();

}

let currentBooth=null;

function openBooth(booth){

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

db.collection("booths").doc(currentBooth.dataset.id).set({
status:status,
name:name
});

closeModal();

};

function loadBooths(){

db.collection("booths").get().then(snapshot=>{

snapshot.forEach(doc=>{

const booth=document.querySelector(`[data-id='${doc.id}']`);

if(!booth) return;

booth.dataset.status=doc.data().status;
booth.dataset.name=doc.data().name;

booth.className="booth "+doc.data().status;

});

});

}

/* DRAG */

const container=document.getElementById("floorContainer");

let isDown=false;
let startX,startY,scrollLeft,scrollTop;

container.addEventListener("mousedown",e=>{

isDown=true;

startX=e.pageX;
startY=e.pageY;

scrollLeft=container.scrollLeft;
scrollTop=container.scrollTop;

});

container.addEventListener("mouseup",()=>isDown=false);
container.addEventListener("mouseleave",()=>isDown=false);

container.addEventListener("mousemove",e=>{

if(!isDown) return;

container.scrollLeft=scrollLeft-(e.pageX-startX);
container.scrollTop=scrollTop-(e.pageY-startY);

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
Name:b.dataset.name
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
booth.dataset.name=row.Name;

booth.className="booth "+row.Status;

db.collection("booths").doc(row.Booth).set({
status:row.Status,
name:row.Name
});

});

};

reader.readAsBinaryString(file);

});

initFloor();
