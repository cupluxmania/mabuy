const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");

let allData = [];
let zoomLevel = 1;

/* LOAD DATA */
async function loadData() {
    const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`);
    const raw = await res.json();

    allData = raw.map(r => ({
        boothid: String(r.boothid).trim(),
        status: (r.status || "available").toLowerCase(),
        exhibitor: (r.exhibitor || "").trim()
    }));

    renderFloor();
}

/* HALL CONFIG */
const hallConfig = [
  {name:"Hall 5", start:5001, end:5078},
  {name:"Hall 6", start:6001, end:6189},
  {name:"Hall 7", start:7001, end:7185},
  {name:"Hall 8", start:8001, end:8181},
  {name:"Hall 9", start:9001, end:9191},
  {name:"Hall 10", start:1001, end:1151}
];

/* CREATE BOOTH */
function createBooth(id) {
    const b = document.createElement("div");
    b.className = "booth available";
    b.innerText = id;

    const d = allData.find(x => x.boothid === id);

    if (d) {
        b.className = "booth " + d.status;
        b.dataset.tooltip = d.exhibitor;
    }

    b.onclick = e => {
        e.stopPropagation();
        panel.classList.remove("hidden");
        panelContent.innerHTML = `<b>${id}</b><br>${d?.exhibitor || "-"}`;
    };

    return b;
}

/* RENDER */
function renderFloor() {
    floor.innerHTML = "";

    hallConfig.forEach(hall => {
        const div = document.createElement("div");
        div.className = "hall";

        const h2 = document.createElement("h2");
        h2.innerText = hall.name;
        div.appendChild(h2);

        const grid = document.createElement("div");
        grid.className = "grid";

        for (let i = hall.start; i <= hall.end; i++) {
            const variants = allData.filter(x => x.boothid.startsWith(i + "-"));
            if (variants.length > 0) {
                variants.forEach(v => grid.appendChild(createBooth(v.boothid)));
            } else {
                grid.appendChild(createBooth(String(i)));
            }
        }

        div.appendChild(grid);
        floor.appendChild(div);
    });

    updateAnalytics();
}

/* SEARCH */
searchBox.onclick = e => {
    e.stopPropagation();
    showSuggestions(allData.filter(x => x.status !== "available"));
};

function showSuggestions(list) {
    suggestions.innerHTML = "";
    suggestions.style.display = "block";

    list.forEach(x => {
        const div = document.createElement("div");
        div.className = "suggestionItem";
        div.innerText = `${x.boothid} - ${x.exhibitor}`;

        div.onclick = e => {
            e.stopPropagation();
            const el = [...document.querySelectorAll(".booth")]
                .find(b => b.innerText === x.boothid);

            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("highlight");
                setTimeout(() => el.classList.remove("highlight"), 4000);
                el.click();
            }

            suggestions.style.display = "none";
        };

        suggestions.appendChild(div);
    });
}

/* DRAG */
let isDown=false,startX,startY,scrollLeft,scrollTop;
container.addEventListener("mousedown",e=>{
    isDown=true;
    startX=e.pageX-container.offsetLeft;
    startY=e.pageY-container.offsetTop;
    scrollLeft=container.scrollLeft;
    scrollTop=container.scrollTop;
});
container.addEventListener("mouseup",()=>isDown=false);
container.addEventListener("mousemove",e=>{
    if(!isDown)return;
    container.scrollLeft=scrollLeft-(e.pageX-startX);
    container.scrollTop=scrollTop-(e.pageY-startY);
});

/* ANALYTICS */
document.getElementById("analyticsBtn").onclick = () => {
    let result = "";

    hallConfig.forEach(h => {
        let booked=0,available=0;

        for(let i=h.start;i<=h.end;i++){
            const booths = allData.filter(x=>x.boothid.startsWith(i));
            if(booths.length){
                booths.forEach(b=> b.status==="booked"?booked++:available++);
            }else{
                available++;
            }
        }

        result += `<b>${h.name}</b><br>Booked: ${booked}<br>Available: ${available}<br><br>`;
    });

    panel.classList.remove("hidden");
    panelContent.innerHTML = result;
};

/* CLOSE */
document.addEventListener("click",()=>{
    panel.classList.add("hidden");
    suggestions.style.display="none";
});

/* INIT */
loadData();
