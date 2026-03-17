const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");
const suggestions = document.getElementById("suggestions");
const searchBox = document.getElementById("searchBox");

let allData = [];
let suggestionOpen = false;

/* CREATE BOOTH */
function createBooth(id){
  const b=document.createElement("div");
  b.className="booth available";
  b.innerText=id;
  b.dataset.id=id;

  b.onclick=()=>{
    panel.classList.remove("hidden");
    panelContent.innerHTML=`
      <b>Booth:</b> ${id}<br>
      <b>Status:</b> ${b.dataset.status}<br>
      <b>Exhibitor:</b> ${b.dataset.name||"-"}
    `;
    setTimeout(()=>panel.classList.add("hidden"),5000);
  };

  return b;
}

/* INIT SIMPLE GRID */
for(let i=5001;i<=5056;i++){
  floor.appendChild(createBooth(i));
}

/* LOAD DATA */
async function loadData(){
  const res=await fetch(G_SCRIPT_URL);
  const data=await res.json();
  allData=data;

  const map={};
  data.forEach(r=>map[r.boothid]=r);

  document.querySelectorAll(".booth").forEach(b=>{
    const d=map[b.dataset.id];
    if(d){
      b.dataset.status=d.status;
      b.dataset.name=d.exhibitor||"";
      b.className="booth "+d.status;
    }
  });
}

/* SHOW SUGGESTION */
function showSuggestions(list){
  suggestions.innerHTML="";
  suggestions.style.display="block";

  list.forEach(r=>{
    const div=document.createElement("div");
    div.className="suggestionItem";
    div.innerText=`${r.boothid} - ${r.exhibitor}`;

    div.onclick=()=>{
      const target=document.querySelector(`[data-id="${r.boothid}"]`);
      if(target){
        target.scrollIntoView({behavior:"smooth",block:"center"});
        target.classList.add("highlight");
        setTimeout(()=>target.classList.remove("highlight"),2000);
      }
    };

    suggestions.appendChild(div);
  });
}

/* SEARCH INPUT */
searchBox.addEventListener("input",()=>{
  const k=searchBox.value.toLowerCase();

  if(!k){
    suggestions.style.display="none";
    return;
  }

  const filtered=allData.filter(r=>
    r.status==="booked" &&
    (r.boothid.toLowerCase().includes(k) ||
     (r.exhibitor||"").toLowerCase().includes(k))
  );

  showSuggestions(filtered);
});

/* DOUBLE CLICK TOGGLE */
searchBox.addEventListener("dblclick",()=>{
  suggestionOpen=!suggestionOpen;

  if(!suggestionOpen){
    suggestions.style.display="none";
    return;
  }

  showSuggestions(allData.filter(r=>r.status==="booked"));
});

/* CLICK OUTSIDE CLOSE */
document.addEventListener("click",(e)=>{
  if(!searchBox.contains(e.target) && !suggestions.contains(e.target)){
    suggestions.style.display="none";
    suggestionOpen=false;
  }
});

/* INIT */
loadData();
