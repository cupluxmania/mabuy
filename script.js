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

/* INIT FLOOR */
function initFloor() {
  halls.forEach(h => {
    const hall = document.createElement("div");
    hall.className = "hall";
    hall.dataset.name = h.name;

    const header = document.createElement("div");
    header.className = "hallHeader";
    header.innerText = h.name;

    const grid = document.createElement("div");
    grid.className = "grid";

    if (h.name === "Ambulance") {
      for (let i = 65; i <= 90; i++) {
        grid.appendChild(createBooth(String.fromCharCode(i)));
      }
    } else {
      let start = parseInt(h.start);
      let end = parseInt(h.end);
      const letter = h.end.replace(/\d+/,'');
      for (let i = start; i <= end; i++) {
        grid.appendChild(createBooth(i + (i===end?letter:'')));
      }
    }

    hall.appendChild(header);
    hall.appendChild(grid);
    floor.appendChild(hall);
  });

  loadData();
}

/* CREATE BOOTH */
function createBooth(id) {
  const b = document.createElement("div");
  b.className = "booth available";
  b.innerText = id;
  b.dataset.id = id;
  b.dataset.name = "";

  b.onclick = () => {
    document.getElementById("panelContent").innerHTML = `
      <b>Booth:</b> ${id}<br>
      <b>Status:</b> ${b.dataset.status}<br>
      <b>Exhibitor:</b> ${b.dataset.name || "-"}
    `;
  };

  return b;
}

/* LOAD DATA */
async function loadData() {
  const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`);
  const data = await res.json();

  const map = {};
  data.forEach(r => map[r.boothid] = r);

  let total = 0, booked = 0;
  const hallStats = {};

  document.querySelectorAll(".hall").forEach(h => {
    hallStats[h.dataset.name] = { total:0, booked:0 };
  });

  document.querySelectorAll(".booth").forEach(b => {
    const d = map[b.dataset.id];
    const hall = b.closest(".hall").dataset.name;

    total++;
    hallStats[hall].total++;

    if (d) {
      b.dataset.status = d.status;
      b.dataset.name = d.exhibitor || "";
      b.className = "booth " + d.status;

      if (d.status === "booked") {
        booked++;
        hallStats[hall].booked++;
      }
    }
  });

  setupPanels(total, booked, hallStats);
}

/* PANELS */
function setupPanels(total, booked, hallStats) {
  document.getElementById("filledBoothsBtn").onclick = () => {
    let html = "<h3>Filled Booths</h3>";
    document.querySelectorAll(".booth").forEach(b => {
      if (b.dataset.status === "booked") {
        html += `${b.dataset.id} - ${b.dataset.name}<br>`;
      }
    });
    document.getElementById("panelContent").innerHTML = html;
  };

  document.getElementById("analyticsBtn").onclick = () => {
    let html = `<h3>Analytics</h3>
    Total: ${total}<br>
    Booked: ${booked}<br>
    Rate: ${((booked/total)*100).toFixed(1)}%<hr>`;

    Object.entries(hallStats)
      .sort((a,b)=>b[1].booked-a[1].booked)
      .forEach(([name,stat])=>{
        const p = ((stat.booked/stat.total)*100).toFixed(0);
        html += `<b>${name}</b> ${stat.booked}/${stat.total} (${p}%)<br>`;
      });

    document.getElementById("panelContent").innerHTML = html;
  };
}

/* SEARCH + SUGGESTION */
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");

searchBox.addEventListener("input", function () {
  const k = this.value.toLowerCase();
  suggestions.innerHTML = "";

  if (!k) return;

  document.querySelectorAll(".booth").forEach(b => {
    const match = b.dataset.id.toLowerCase().includes(k) ||
                  (b.dataset.name || "").toLowerCase().includes(k);

    b.classList.toggle("dim", !match);
    b.classList.toggle("highlight", match);

    if (match) {
      const div = document.createElement("div");
      div.className = "suggestionItem";
      div.innerText = `${b.dataset.id} - ${b.dataset.name || "Available"}`;

      div.onclick = () => {
        b.scrollIntoView({ behavior:"smooth", block:"center" });
        suggestions.innerHTML = "";
      };

      suggestions.appendChild(div);
    }
  });
});

/* ZOOM */
let zoom = 1;
zoomIn.onclick=()=>{zoom+=0.1;applyZoom();}
zoomOut.onclick=()=>{zoom-=0.1;applyZoom();}

function applyZoom(){
  floor.style.transform=`scale(${zoom})`;
  zoomLevel.innerText=Math.round(zoom*100)+"%";
}

/* INIT */
initFloor();
setInterval(loadData,120000);
