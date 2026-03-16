const CSV_URL="https://docs.google.com/spreadsheets/d/e/2PACX-1vTOcl25DHFV_jFSifudNzweglzM3SoGGfwgRZ-ENWd7dsfaqGUkUy08iBQLyGjY5Fj2RUMsrpiQ204K/pub?gid=0&single=true&output=csv"

const API_URL="https://script.google.com/macros/s/AKfycbxmvCfcd1iYeXqtNik0EUZTWE1ThehIY-q0J7og8_DXmwOY4VV9PmU9vQKbGRPqSVSB_g/exec"

const floor=document.getElementById("floor")
const floorContainer=document.getElementById("floorContainer")

const filledPanel=document.getElementById("filledPanel")
const analyticsPanel=document.getElementById("analyticsPanel")

const modal=document.getElementById("boothModal")

let selectedBooth=null

let zoom=1

function createBooth(id){

const div=document.createElement("div")

div.className="booth available"

div.innerText=id

div.dataset.id=id
div.dataset.status="available"
div.dataset.name=""
div.dataset.contractor=""

div.onclick=(e)=>{

e.stopPropagation()

openModal(div)

}

return div

}

function generateFloor(){

for(let i=5001;i<=5078;i++){

floor.appendChild(createBooth(i))

}

}

async function loadSheet(){

const res=await fetch(CSV_URL)

const text=await res.text()

const rows=text.split("\n").slice(1)

rows.forEach(r=>{

const c=r.split(",")

const id=c[0]
const status=c[1]
const name=c[2]
const contractor=c[3]

const booth=document.querySelector(`[data-id='${id}']`)

if(!booth) return

booth.dataset.status=status
booth.dataset.name=name
booth.dataset.contractor=contractor

booth.className="booth "+status

})

updatePanels()

}

async function saveBooth(data){

await fetch(API_URL,{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify(data)
})

}

function openModal(booth){

selectedBooth=booth

document.getElementById("modalBoothId").innerText=booth.dataset.id

document.getElementById("modalStatus").value=booth.dataset.status
document.getElementById("modalName").value=booth.dataset.name
document.getElementById("modalContractor").value=booth.dataset.contractor

modal.style.display="flex"

}

function closeModal(){

modal.style.display="none"

}

document.getElementById("saveBtn").onclick=async()=>{

const id=selectedBooth.dataset.id

const status=document.getElementById("modalStatus").value
const name=document.getElementById("modalName").value
const contractor=document.getElementById("modalContractor").value

await saveBooth({id,status,name,contractor})

await loadSheet()

closeModal()

}

document.getElementById("cancelBtn").onclick=closeModal

function updatePanels(){

filledPanel.innerHTML=""

let total=0
let booked=0

document.querySelectorAll(".booth").forEach(b=>{

total++

if(b.dataset.status==="booked"){

booked++

const item=document.createElement("div")

item.innerText=b.dataset.id+" "+b.dataset.name

item.onclick=()=>{

b.scrollIntoView({behavior:"smooth",block:"center"})

}

filledPanel.appendChild(item)

}

})

analyticsPanel.innerHTML=

"Total Booths: "+total+"<br>"+
"Booked: "+booked+"<br>"+
"Available: "+(total-booked)

}

document.getElementById("filledBtn").onclick=()=>{

filledPanel.style.display="block"
analyticsPanel.style.display="none"

}

document.getElementById("analyticsBtn").onclick=()=>{

analyticsPanel.style.display="block"
filledPanel.style.display="none"

}

document.body.onclick=()=>{

filledPanel.style.display="none"
analyticsPanel.style.display="none"

}

document.getElementById("exportBtn").onclick=()=>{

const rows=[["Booth","Status","Name","Contractor"]]

document.querySelectorAll(".booth").forEach(b=>{

rows.push([
b.dataset.id,
b.dataset.status,
b.dataset.name,
b.dataset.contractor
])

})

const wb=XLSX.utils.book_new()

const ws=XLSX.utils.aoa_to_sheet(rows)

XLSX.utils.book_append_sheet(wb,ws,"Booths")

XLSX.writeFile(wb,"booths.xlsx")

}

document.getElementById("zoomIn").onclick=()=>{

zoom+=0.1
applyZoom()

}

document.getElementById("zoomOut").onclick=()=>{

zoom-=0.1
applyZoom()

}

function applyZoom(){

floor.style.transform=`scale(${zoom})`

document.getElementById("zoomText").innerText=Math.round(zoom*100)+"%"

}

let dragging=false
let startX
let startY
let scrollX
let scrollY

floorContainer.onmousedown=(e)=>{

dragging=true

startX=e.pageX
startY=e.pageY

scrollX=floorContainer.scrollLeft
scrollY=floorContainer.scrollTop

}

floorContainer.onmouseup=()=>dragging=false
floorContainer.onmouseleave=()=>dragging=false

floorContainer.onmousemove=(e)=>{

if(!dragging) return

floorContainer.scrollLeft=scrollX-(e.pageX-startX)
floorContainer.scrollTop=scrollY-(e.pageY-startY)

}

generateFloor()

loadSheet()

setInterval(loadSheet,15000)
