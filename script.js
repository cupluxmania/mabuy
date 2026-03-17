const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const suggestions = document.getElementById("suggestions");
const searchBox = document.getElementById("searchBox");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");

let allData = [];
let isOpen = false;

/* LOAD DATA */
async function loadData(){
  const res = await fetch(G_SCRIPT_URL);
  allData = await res.json();

  renderBooths();
}

/* RENDER BOOTHS */
function renderBooths(){
  floor.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "grid";

  for(let i=5001;i<=7056;i++){
    const b = document.createElement("div");
    b.className = "booth available";
    b.innerText = i;
    b.dataset.id = i;

    const d = allData.find(x=>x.boothid==i);
    if(d){
      b.className = "booth " + d.status;
      b.dataset.name = d.exhibitor;
    }

    b.onclick = ()=>{
      panel.classList.remove("hidden");
      panelContent.innerHTML = `
        Booth: ${i}<br>
        Status: ${b.classList.contains("booked")?"booked":"available"}<br>
        Exhibitor: ${b.dataset.name || "-"}
      `;
    };

    grid.appendChild(b);
  }

  floor.appendChild(grid);
}

/* SEARCH */
searchBox.addEventListener("input", ()=>{
  const val = searchBox.value.toLowerCase();

  if(!val){
    suggestions.style.display="none";
    return;
  }

  const filtered = allData.filter(x =>
    x.status==="booked" &&
    (x.boothid.includes(val) ||
     x.exhibitor.toLowerCase().includes(val))
  );

  showSuggestions(filtered);
});

/* DOUBLE CLICK */
searchBox.addEventListener("dblclick", ()=>{
  isOpen = !isOpen;

  if(!isOpen){
    suggestions.style.display="none";
    return;
  }

  showSuggestions(allData.filter(x=>x.status==="booked"));
});

/* SHOW */
function showSuggestions(list){
  suggestions.innerHTML="";
  suggestions.style.display="block";

  list.forEach(x=>{
    const div = document.createElement("div");
    div.className="suggestionItem";
    div.innerText = `${x.boothid} - ${x.exhibitor}`;

    div.onclick = ()=>{
      const el = document.querySelector(`[data-id='${x.boothid}']`);
      if(el){
        el.scrollIntoView({behavior:"smooth",block:"center"});
        el.classList.add("highlight");
        setTimeout(()=>el.classList.remove("highlight"),2000);
      }
    };

    suggestions.appendChild(div);
  });
}

/* CLOSE OUTSIDE */
document.addEventListener("click",(e)=>{
  if(!searchBox.contains(e.target) && !suggestions.contains(e.target)){
    suggestions.style.display="none";
    isOpen=false;
  }
});

/* ANALYTICS BUTTON */
document.getElementById("analyticsBtn").onclick = ()=>{
  const total = allData.length;
  const booked = allData.filter(x=>x.status==="booked").length;

  alert(`Booked: ${booked}\nAvailable: ${total-booked}`);
};

/* INIT */
loadData();
