const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

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
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");

/* INIT */
function initFloor() {
  halls.forEach(h => {
    const hall = document.createElement("div");
    hall.className = "hall";
    hall.dataset.name = h.name;

    const grid = document.createElement("div");
    grid.className = "grid";

    if (h.name === "Ambulance") {
      for (let i = 65; i <= 90; i++) grid.appendChild(createBooth(String.fromCharCode(i)));
    } else {
      let start = parseInt(h.start);
      let end = parseInt(h.end);
      const letter = h.end.replace(/\d+/,'');
      for (let i = start; i <= end; i++) {
        grid.appendChild(createBooth(i + (i===end?letter:'')));
      }
    }

    hall.appendChild(grid);
    floor.appendChild(hall);
  });

  loadData();
}

/* BOOTH */
function createBooth(id) {
  const b = document.createElement("div");
  b.className = "booth available";
  b.innerText = id;
  b.dataset.id = id;

  b.onclick = () => {
    panel.classList.remove("hidden");
    panelContent.innerHTML = `
      <b>Booth:</b> ${id}<br>
      <b>Status:</b> ${b.dataset.status}<br>
      <b>Exhibitor:</b> ${b.dataset.name || "-"}
    `;

    setTimeout(()=>panel.classList.add("hidden"),5000);
  };

  return b;
}

/* LOAD DATA */
async function loadData() {
  const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`);
  const data = await res.json();

  const map = {};
  data.forEach(r => map[r.boothid] = r);

  document.querySelectorAll(".booth").forEach(b => {
    const d = map[b.dataset.id];
    if (d) {
      b.dataset.status = d.status;
      b.dataset.name = d.exhibitor || "";
      b.className = "booth " + d.status;
    }
  });
}

/* SEARCH */
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");

searchBox.addEventListener("input", function () {
  const k = this.value.toLowerCase();
  suggestions.innerHTML = "";

  document.querySelectorAll(".booth").forEach(b => {
    const match = b.dataset.id.toLowerCase().includes(k) ||
                  (b.dataset.name||"").toLowerCase().includes(k);

    b.classList.toggle("dim", k && !match);
    b.classList.toggle("highlight", match);

    if (match && k) {
      const div = document.createElement("div");
      div.className = "suggestionItem";
      div.innerText = `${b.dataset.id} - ${b.dataset.name || "Available"}`;

      div.onclick = () => {
        b.scrollIntoView({behavior:"smooth",block:"center"});
        suggestions.innerHTML="";
      };

      suggestions.appendChild(div);
    }
  });
});

/* DRAG FIX */
const container = document.getElementById("floorContainer");
let isDown=false,startX,startY,scrollLeft,scrollTop;

container.addEventListener("mousedown", e=>{
  isDown=true;
  container.style.cursor="grabbing";
  startX=e.pageX;
  startY=e.pageY;
  scrollLeft=container.scrollLeft;
  scrollTop=container.scrollTop;
});

container.addEventListener("mouseup", ()=>{isDown=false;container.style.cursor="grab";});
container.addEventListener("mouseleave", ()=>isDown=false);

container.addEventListener("mousemove", e=>{
  if(!isDown)return;
  e.preventDefault();
  container.scrollLeft = scrollLeft - (e.pageX - startX);
  container.scrollTop = scrollTop - (e.pageY - startY);
});

/* ZOOM */
let zoom=1;
zoomIn.onclick=()=>{zoom+=0.1;applyZoom();}
zoomOut.onclick=()=>{zoom-=0.1;applyZoom();}
function applyZoom(){
  floor.style.transform=`scale(${zoom})`;
  zoomLevel.innerText=Math.round(zoom*100)+"%";
}

/* INIT */
initFloor();
setInterval(loadData,120000);
