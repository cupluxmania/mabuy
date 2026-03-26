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
    try {
        const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`);
        const text = await res.text();

        const raw = JSON.parse(text);

        allData = [];

        raw.forEach(r => {
            if (!r.boothid) return;

            r.boothid.split(",").forEach(id => {
                allData.push({
                    boothid: id.trim(),
                    exhibitor: (r.exhibitor || "").trim(),
                    status: (r.status || "available").toLowerCase()
                });
            });
        });

        renderFloor();

    } catch (err) {
        console.error("LOAD ERROR:", err);
        alert("Failed loading data. Check console.");
    }
}

/* HALL CONFIG */
const hallConfig = [
  {name:"Hall 5", start:5001, end:5078},
  {name:"Hall 6", start:6001, end:6189},
  {name:"Hall 7", start:7001, end:7196},
  {name:"Hall 8", start:8001, end:8181},
  {name:"Hall 9", start:9001, end:9191},
  {name:"Hall 10", start:1001, end:1151}
];

/* RENDER FLOOR */
function renderFloor() {
    floor.innerHTML = "";

    hallConfig.forEach(h => {

        const hallDiv = document.createElement("div");
        hallDiv.className = "hall";

        const title = document.createElement("h2");
        title.innerText = h.name;
        hallDiv.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "grid";

        for (let i = h.start; i <= h.end; i++) {

            const baseId = String(i);

            const variants = allData.filter(x =>
                x.boothid.startsWith(baseId + "-")
            );

            if (variants.length > 0) {
                variants.forEach(v => {
                    grid.appendChild(createBooth(v.boothid));
                });
            } else {
                grid.appendChild(createBooth(baseId));
            }
        }

        hallDiv.appendChild(grid);
        floor.appendChild(hallDiv);
    });
}

/* CREATE BOOTH */
function createBooth(id) {
    const b = document.createElement("div");
    b.className = "booth available";
    b.innerText = id;

    const d = allData.find(x => x.boothid === id);

    if (d) {
        let status = d.status;
        let name = d.exhibitor;

        if (name && name === name.toLowerCase()) status = "plotting";

        b.className = "booth " + status;

        b.onclick = (e) => {
            e.stopPropagation();
            panel.classList.remove("hidden");

            panelContent.innerHTML = `
                <b>Booth:</b> ${id}<br>
                <b>Status:</b> ${status}<br>
                <b>Exhibitor:</b> ${name || "-"}
            `;
        };
    }

    return b;
}

/* SEARCH */
searchBox.addEventListener("input", () => {

    const val = searchBox.value.toLowerCase();

    const list = allData.filter(x =>
        x.boothid.toLowerCase().includes(val) ||
        x.exhibitor.toLowerCase().includes(val)
    );

    suggestions.innerHTML = "";

    list.forEach(x => {
        const div = document.createElement("div");
        div.className = "suggestionItem";
        div.innerText = `${x.boothid} - ${x.exhibitor}`;

        div.onclick = () => {
            const el = [...document.querySelectorAll(".booth")]
                .find(b => b.innerText === x.boothid);

            if (el) {
                el.scrollIntoView({behavior:"smooth", block:"center"});
                el.classList.add("highlight");

                setTimeout(() => el.classList.remove("highlight"), 5000);

                el.click();
            }

            suggestions.style.display = "none";
        };

        suggestions.appendChild(div);
    });

    suggestions.style.display = "block";
});

/* DRAG */
let isDown=false, startX, startY, scrollLeft, scrollTop;

container.addEventListener("mousedown", e=>{
    isDown=true;
    startX=e.pageX;
    startY=e.pageY;
    scrollLeft=container.scrollLeft;
    scrollTop=container.scrollTop;
});

container.addEventListener("mouseup", ()=> isDown=false);
container.addEventListener("mouseleave", ()=> isDown=false);

container.addEventListener("mousemove", e=>{
    if(!isDown) return;
    container.scrollLeft = scrollLeft - (e.pageX - startX);
    container.scrollTop = scrollTop - (e.pageY - startY);
});

/* ZOOM */
document.getElementById("zoomIn").onclick=()=>{
    zoomLevel+=0.1;
    floor.style.transform=`scale(${zoomLevel})`;
    document.getElementById("zoomLevel").innerText=Math.round(zoomLevel*100)+"%";
};

document.getElementById("zoomOut").onclick=()=>{
    zoomLevel=Math.max(0.3, zoomLevel-0.1);
    floor.style.transform=`scale(${zoomLevel})`;
    document.getElementById("zoomLevel").innerText=Math.round(zoomLevel*100)+"%";
};

/* ANALYTICS */
document.getElementById("analyticsBtn").onclick=()=>{
    let html = "";

    hallConfig.forEach(h=>{
        let booked=0, plotting=0, total=0;

        allData.forEach(x=>{
            let num = parseInt(x.boothid);
            if(num>=h.start && num<=h.end){
                total++;
                if(x.status==="booked") booked++;
                else if(x.status==="plotting") plotting++;
            }
        });

        html += `<b>${h.name}</b><br>
        Available: ${total-booked-plotting}<br>
        Booked: ${booked}<br>
        Plotting: ${plotting}<br><br>`;
    });

    panel.classList.remove("hidden");
    panelContent.innerHTML = html;
};

/* GLOBAL CLICK */
document.addEventListener("click", ()=>{
    panel.classList.add("hidden");
    suggestions.style.display="none";
});

/* INIT */
loadData();
