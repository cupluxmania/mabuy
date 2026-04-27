const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");

let allData = [];
let zoomLevel = 1;
let currentFilter = "all";

/* CLEAN */
function cleanText(val) {
    if (!val) return "";
    return String(val).replace(/\s+/g, " ").trim();
}

/* NORMALIZE */
function normalizeId(id) {
    return String(id || "").replace(/\s+/g, "").toUpperCase();
}

/* FORMAT */
function formatBoothId(id) {
    if (!id) return "";
    const clean = String(id).replace(/\s+/g, "").toUpperCase();
    const match = clean.match(/^(\d+)(?:-?([A-Z]))?$/);
    if (match) {
        return match[2] ? `${match[1]}-${match[2]}` : match[1];
    }
    return clean;
}

/* STATUS */
function getStatus(row) {
    const s = cleanText(row.status).toLowerCase();
    if (["available","sold","booked","agent"].includes(s)) return s;
    return "available";
}

/* LOAD DATA */
async function loadData() {
    try {
        const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`);
        const raw = await res.json();

        const expanded = [];

        raw.forEach(row => {
            if (!row.boothid) return;

            const booths = String(row.boothid)
                .split(",")
                .map(x => x.trim())
                .filter(Boolean);

            const size = parseFloat(row.size) || 0;
            const each = booths.length ? size / booths.length : 0;

            booths.forEach(id => {
                const formatted = formatBoothId(id);

                expanded.push({
                    boothid: normalizeId(formatted),
                    display: formatted,
                    exhibitor: cleanText(row.exhibitor),
                    status: getStatus(row),
                    sqm: each
                });
            });
        });

        allData = expanded;
        renderFloor();

    } catch (err) {
        console.error(err);
        alert("Data failed to load. Check Apps Script URL.");
    }
}

/* HALL CONFIG */
const hallConfig = [
  {name:"Hall 5", start:5001, end:5078},
  {name:"Hall 6", start:6001, end:6189},
  {name:"Hall 7", start:7001, end:7196},
  {name:"Hall 8", start:8001, end:8181},
  {name:"Hall 9", start:9001, end:9191},
  {name:"Hall 10", start:1001, end:1151},
  {name:"Ambulance", start:"A", end:"Z"}
];

/* CREATE BOOTH */
function createBooth(id) {
    const formatted = formatBoothId(id);
    const norm = normalizeId(formatted);

    let match = allData.find(x => x.boothid === norm);

    if (!match) {
        match = allData.find(x => x.boothid.startsWith(norm + "-"));
    }

    const b = document.createElement("div");
    b.className = "booth";
    b.dataset.id = norm;

    if (!match) {
        b.classList.add("available");
        b.innerText = formatted;
        return b;
    }

    b.classList.add(match.status);
    b.innerText = match.display;

    b.dataset.tooltip = match.exhibitor
        ? `${match.exhibitor} • ${match.sqm} Sqm`
        : `AVAILABLE • ${match.sqm} Sqm`;

    b.onclick = (e) => {
        e.stopPropagation();

        // clear old highlight
        document.querySelectorAll(".highlight, .blink")
            .forEach(x => x.classList.remove("highlight","blink"));

        b.classList.add("highlight","blink");
        setTimeout(()=>b.classList.remove("highlight","blink"),5000);

        // 🔥 PERFECT CENTERING
        const containerRect = container.getBoundingClientRect();
        const boothRect = b.getBoundingClientRect();

        const offsetX = boothRect.left - containerRect.left;
        const offsetY = boothRect.top - containerRect.top;

        const scrollX = offsetX - container.clientWidth / 2 + boothRect.width / 2;
        const scrollY = offsetY - container.clientHeight / 2 + boothRect.height / 2;

        container.scrollTo({
            left: container.scrollLeft + scrollX,
            top: container.scrollTop + scrollY,
            behavior: "smooth"
        });

        // panel
        panel.classList.remove("hidden");
        panelContent.innerHTML = `
            <b>Booth:</b> ${match.display}<br>
            <b>Size:</b> ${match.sqm} Sqm<br>
            <b>Status:</b> ${match.status.toUpperCase()}<br>
            <b>Exhibitor:</b> ${match.exhibitor || "-"}
        `;
    };

    return b;
}

/* RENDER */
function renderFloor() {
    floor.innerHTML = "";

    hallConfig.forEach(hall => {

        const hallDiv = document.createElement("div");
        hallDiv.className = "hall";

        const header = document.createElement("div");
        header.className = "hall-header";

        const title = document.createElement("h3");
        title.innerText = hall.name;

        const summary = document.createElement("div");
        summary.className = "hall-summary";

        const counts = {available:0,sold:0,booked:0,agent:0};

        const grid = document.createElement("div");
        grid.className = "grid";

        let ids = [];

        if (hall.name === "Ambulance") {
            for (let i=65;i<=90;i++) ids.push(String.fromCharCode(i));
        } else {
            for (let i=hall.start;i<=hall.end;i++) ids.push(String(i));
        }

        ids.forEach(id=>{
            const booth = createBooth(id);
            grid.appendChild(booth);

            const s = booth.classList[1];
            if(counts[s] !== undefined) counts[s]++;
        });

        ["available","sold","booked","agent"].forEach(s=>{
            const chip = document.createElement("div");
            chip.className="count-chip";
            chip.innerHTML=`<span class="dot ${s}"></span> <strong>${counts[s]}</strong>`;
            summary.appendChild(chip);
        });

        header.appendChild(title);
        header.appendChild(summary);
        hallDiv.appendChild(header);
        hallDiv.appendChild(grid);
        floor.appendChild(hallDiv);
    });
}

/* SEARCH */
searchBox.addEventListener("input", () => {
    const val = normalizeId(searchBox.value);
    suggestions.innerHTML="";

    const result = allData.filter(x =>
        x.boothid.includes(val) ||
        (x.exhibitor || "").toLowerCase().includes(searchBox.value.toLowerCase())
    );

    suggestions.style.display = result.length ? "block":"none";

    result.forEach(x=>{
        const div=document.createElement("div");
        div.className="suggestionItem";
        div.innerText=`${x.display} - ${x.exhibitor}`;

        div.onclick=()=>{
            const el=document.querySelector(`[data-id='${normalizeId(x.display)}']`);
            if(el){
                el.click(); // 🔥 centering handled inside click
            }
            suggestions.style.display="none";
        };

        suggestions.appendChild(div);
    });
});

/* DRAG */
let isDown=false,startX,startY,scrollLeft,scrollTop;

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
document.getElementById("zoomIn").onclick=()=>{
    zoomLevel+=0.1;
    floor.style.transform=`scale(${zoomLevel})`;
};
document.getElementById("zoomOut").onclick=()=>{
    zoomLevel=Math.max(0.3,zoomLevel-0.1);
    floor.style.transform=`scale(${zoomLevel})`;
};

/* LEGEND FILTER */
document.querySelectorAll(".legend-item").forEach(item=>{
    item.onclick=()=>{
        document.querySelectorAll(".legend-item").forEach(x=>x.classList.remove("active"));
        item.classList.add("active");

        currentFilter=item.dataset.filter;

        document.querySelectorAll(".booth").forEach(b=>{
            if(currentFilter==="all"){
                b.style.opacity=1;
                return;
            }
            b.style.opacity = b.classList.contains(currentFilter) ? 1 : 0.15;
        });
    };
});

/* CLOSE PANEL */
document.addEventListener("click",()=>{
    panel.classList.add("hidden");
    suggestions.style.display="none";
});

loadData();
