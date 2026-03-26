const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");
const analyticsPanel = document.getElementById("analyticsPanel");

let allData = [];
let zoomLevel = 1;

/* NORMALIZE */
function normalizeId(id){
  return String(id).replace(/\s+/g,"").toLowerCase();
}

/* LOAD DATA */
async function loadData(){
  const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`);
  const raw = await res.json();

  const expanded=[];
  raw.forEach(r=>{
    if(!r.boothid) return;
    r.boothid.split(",").forEach(id=>{
      expanded.push({
        boothid:id.trim(),
        status:(r.status||"available").toLowerCase(),
        exhibitor:(r.exhibitor||"").trim()
      });
    });
  });

  allData=expanded;
  renderFloor();
}

/* HALL CONFIG */
const hallConfig=[
 {name:"Hall 5",start:5001,end:5078},
 {name:"Hall 6",start:6001,end:6189},
 {name:"Hall 7",start:7001,end:7196},
 {name:"Hall 8",start:8001,end:8181},
 {name:"Hall 9",start:9001,end:9191},
 {name:"Hall 10",start:1001,end:1151}
];

/* RENDER FLOOR */
function renderFloor(){
  floor.innerHTML="";

  hallConfig.forEach(h=>{
    const div=document.createElement("div");

    const grid=document.createElement("div");
    grid.className="grid";

    for(let i=h.start;i<=h.end;i++){
      grid.appendChild(createBooth(i));
    }

    div.appendChild(grid);
    floor.appendChild(div);
  });
}

/* CREATE BOOTH */
function createBooth(id){
  const b=document.createElement("div");
  b.className="booth available";
  b.innerText=id;

  const d=allData.find(x=>normalizeId(x.boothid)==normalizeId(id));

  if(d){
    b.className="booth "+d.status;
    b.dataset.tooltip=d.exhibitor||d.status;
  }

  b.onclick=()=>{
    panel.classList.remove("hidden");
    panelContent.innerHTML=`
      Booth: ${id}<br>
      Status: ${b.className}<br>
      Exhibitor: ${d?.exhibitor||"-"}
    `;
  };

  return b;
}

/* SEARCH */
searchBox.onclick=()=>{
  showSuggestions(allData.filter(x=>x.status!="available"));
};

searchBox.oninput=()=>{
  const v=searchBox.value.toLowerCase();
  showSuggestions(allData.filter(x=>
    x.status!="available" &&
    (x.boothid.toLowerCase().includes(v)||x.exhibitor.toLowerCase().includes(v))
  ));
};

function showSuggestions(list){
  suggestions.innerHTML="";
  suggestions.style.display="block";

  list.forEach(x=>{
    const div=document.createElement("div");
    div.className="suggestionItem";
    div.innerText=`${x.boothid} - ${x.exhibitor}`;

    div.onclick=()=>{
      const el=[...document.querySelectorAll(".booth")]
      .find(b=>b.innerText==x.boothid);

      if(el){
        el.scrollIntoView({behavior:"smooth",block:"center"});
        el.click();
      }

      suggestions.style.display="none";
    };

    suggestions.appendChild(div);
  });
}

/* ANALYTICS */
document.getElementById("analyticsBtn").onclick=()=>{
  const stats={};

  hallConfig.forEach(h=>{
    stats[h.name]={total:0,booked:0,plotting:0,available:0};
  });

  allData.forEach(x=>{
    const id=parseInt(x.boothid);
    let hall="Hall 10";

    if(id>=5000&&id<6000) hall="Hall 5";
    else if(id>=6000&&id<7000) hall="Hall 6";
    else if(id>=7000&&id<8000) hall="Hall 7";
    else if(id>=8000&&id<9000) hall="Hall 8";
    else if(id>=9000) hall="Hall 9";

    stats[hall].total++;
    stats[hall][x.status]++;
  });

  let html="<h3>Analytics</h3>";

  Object.keys(stats).forEach(h=>{
    const s=stats[h];
    html+=`${h}<br>
    Total:${s.total}<br>
    Booked:${s.booked}<br>
    Plotting:${s.plotting}<br>
    Available:${s.available}<br><br>`;
  });

  analyticsPanel.innerHTML=html;
  analyticsPanel.classList.toggle("hidden");
};

/* ZOOM */
document.getElementById("zoomIn").onclick=()=>{zoomLevel+=0.1;applyZoom();};
document.getElementById("zoomOut").onclick=()=>{zoomLevel-=0.1;applyZoom();};
function applyZoom(){
  floor.style.transform=`scale(${zoomLevel})`;
}

/* DRAG */
let isDown=false,startX,startY,scrollLeft,scrollTop;

container.addEventListener("mousedown",(e)=>{
  isDown=true;
  startX=e.pageX;
  startY=e.pageY;
  scrollLeft=container.scrollLeft;
  scrollTop=container.scrollTop;
});

container.addEventListener("mouseup",()=>isDown=false);

container.addEventListener("mousemove",(e)=>{
  if(!isDown)return;
  container.scrollLeft=scrollLeft-(e.pageX-startX);
  container.scrollTop=scrollTop-(e.pageY-startY);
});

/* INIT */
loadData();
