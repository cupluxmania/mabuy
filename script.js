const db=firebase.firestore();

const halls=[
{name:"Hall 5",start:5001,end:"5078A"},
{name:"Hall 6",start:6001,end:"6189A"},
{name:"Hall 7",start:7001,end:"7185A"},
{name:"Hall 8",start:8001,end:"8181A"},
{name:"Hall 9",start:9001,end:"9191A"},
{name:"Hall 10",start:1001,end:"1151A"},
{name:"Ambulance",start:"A",end:"Z"}
];

const floor=document.getElementById("floor");
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
let endNum=parseInt(hall.end);
const endLetter=hall.end.toString().replace(/\d+/,"");

for(let i=start;i<=endNum;i++){

const boothID=i+(i===endNum?endLetter:"");

grid.appendChild(createBooth(boothID,hallDiv));

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

function createBooth(id,hallDiv){

const booth=document.createElement("div");

booth.className="booth available";
booth.innerText=id;

booth.dataset.status="available";
booth.dataset.name="";
booth.dataset.contractor="";
booth.dataset.id=id;

booth.setAttribute("data-id",id);
booth.setAttribute("data-name","");

booth.addEventListener("click",(e)=>{
e.stopPropagation();
openBoothPopup(booth,hallDiv);
});

return booth;

}

function updateHallStats(hallDiv){

const booths=hallDiv.querySelectorAll(".booth");

let available=0;
let booked=0;

booths.forEach(b=>{
if(b.dataset.status==="available")available++;
else booked++;
});

const bubbles=hallDiv.querySelectorAll(".bubble");

bubbles[0].innerText=available;
bubbles[1].innerText=booked;

}

function openBoothPopup(booth,hallDiv){

currentBooth={booth,hallDiv};

document.getElementById("boothId").innerText=booth.innerText;
document.getElementById("boothStatus").value=booth.dataset.status;
document.getElementById("boothName").value=booth.dataset.name||"";
document.getElementById("contractorName").value=booth.dataset.contractor||"";

document.getElementById("boothModal").style.display="block";

}

function closeModal(){
document.getElementById("boothModal").style.display="none";
}

document.getElementById("saveBoothBtn").addEventListener("click",()=>{

let status=document.getElementById("boothStatus").value;
let name=document.getElementById("boothName").value.trim();
let contractor=document.getElementById("contractorName").value.trim();

if(status==="available"){
name="";
contractor="";
}

if(status==="booked" && name.length<4){
alert("Exhibitor name must be at least 4 characters!");
return;
}

const booth=currentBooth.booth;

booth.dataset.status=status;
booth.dataset.name=name;
booth.dataset.contractor=contractor;

booth.setAttribute("data-name",name);

booth.className="booth "+status;

saveBoothData(booth);

updateHallStats(currentBooth.hallDiv);

closeModal();

updatePanels();

});

function saveBoothData(booth){

const saved=JSON.parse(localStorage.getItem("floorData")||"{}");

saved[booth.dataset.id]={
status:booth.dataset.status,
name:booth.dataset.name,
contractor:booth.dataset.contractor
};

localStorage.setItem("floorData",JSON.stringify(saved));

db.collection("booths").doc(booth.dataset.id).set(saved[booth.dataset.id]);

}

function loadSavedBooths(){

db.collection("booths").onSnapshot((snapshot)=>{

const saved={};

snapshot.forEach(doc=>{
saved[doc.id]=doc.data();
});

localStorage.setItem("floorData",JSON.stringify(saved));

document.querySelectorAll(".booth").forEach(b=>{

const id=b.dataset.id;

if(saved[id]){

b.dataset.status=saved[id].status;
b.dataset.name=saved[id].name;
b.dataset.contractor=saved[id].contractor;

b.className="booth "+saved[id].status;

b.setAttribute("data-name",saved[id].name);

}

});

document.querySelectorAll(".hall").forEach(updateHallStats);

updatePanels();

});

}

/* Floating Panels */

const filledPanel=document.getElementById("filledPanel");
const analyticsPanel=document.getElementById("analyticsPanel");

const filledBtn=document.getElementById("filledBoothsBtn");
const analyticsBtn=document.getElementById("analyticsBtn");

filledBtn.addEventListener("click",()=>{

const rect=filledBtn.getBoundingClientRect();

filledPanel.style.top=(rect.bottom+window.scrollY)+"px";
filledPanel.style.left=(rect.left+window.scrollX)+"px";

filledPanel.style.display=filledPanel.style.display==="block"?"none":"block";

analyticsPanel.style.display="none";

});

analyticsBtn.addEventListener("click",()=>{

const rect=analyticsBtn.getBoundingClientRect();

analyticsPanel.style.top=(rect.bottom+window.scrollY)+"px";
analyticsPanel.style.left=(rect.left+window.scrollX)+"px";

analyticsPanel.style.display=analyticsPanel.style.display==="block"?"none":"block";

filledPanel.style.display="none";

});

/* Panels data */

function updatePanels(){

const saved=JSON.parse(localStorage.getItem("floorData")||"{}");

filledPanel.innerHTML="";

for(const id in saved){

if(saved[id].status==="booked"){

const div=document.createElement("div");

div.innerText=`${id}: ${saved[id].name}`;

div.onclick=()=>{

const booth=document.querySelector(`.booth[data-id='${id}']`);

booth.scrollIntoView({behavior:"smooth",block:"center",inline:"center"});

booth.classList.add("selectedBooth");

setTimeout(()=>booth.classList.remove("selectedBooth"),1500);

filledPanel.style.display="none";

};

filledPanel.appendChild(div);

}

}

let total=0,booked=0;

document.querySelectorAll(".booth").forEach(b=>{

total++;

if(b.dataset.status==="booked")booked++;

});

analyticsPanel.innerHTML=`
Total booths: ${total}<br>
Booked booths: ${booked}<br>
Available booths: ${total-booked}
`;

}

/* Close panels */

document.addEventListener("click",(e)=>{

if(!filledPanel.contains(e.target)&&e.target!==filledBtn){
filledPanel.style.display="none";
}

if(!analyticsPanel.contains(e.target)&&e.target!==analyticsBtn){
analyticsPanel.style.display="none";
}

});

/* Initialize */

initFloor();
updatePanels();
