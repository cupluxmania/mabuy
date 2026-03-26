const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");
const miniMap = document.getElementById("miniMap");

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
        console.error(err);
        alert("Load failed");
    }
}

/* HALL */
const hallConfig = [
{ name:"Hall 5", start:5001, end:5078 },
{ name:"Hall 6", start:6001, end:6189 },
{ name:"Hall 7", start:7001, end:7196 },
{ name:"Hall 8", start:8001, end:8181 },
{ name:"Hall 9", start:9001, end:9191 },
{ name:"Hall 10", start:1001, end:1151 }
];

/* RENDER */
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

            const base = String(i);

            const variants = allData.filter(x =>
                x.boothid.startsWith(base + "-")
            );

            if (variants.length > 0) {
                variants.forEach(v => grid.appendChild(createBooth(v.boothid)));
            } else {
                grid.appendChild(createBooth(base));
            }
        }

        hallDiv.appendChild(grid);
        floor.appendChild(hallDiv);
    });

    drawMiniMap();
}

/* BOOTH */
function createBooth(id) {
    const b = document.createElement("div");
    b.className = "booth available";
    b.innerText = id;
    b.dataset.tooltip = "Available";

    const d = allData.find(x => x.boothid === id);

    if (d) {
        let status = d.status;
        let name = d.exhibitor;

        if (name && name === name.toLowerCase()) status = "plotting";

        b.className = "booth " + status;
        b.dataset.tooltip = name || status;

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

        div.onclick = (e) => {
            e.stopPropagation();

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

    suggestions.style.display = list.length ? "block" : "none";
});

/* ANALYTICS */
document.getElementById("analyticsBtn").onclick = () => {

    let html = "<h3>📊 Analytics</h3>";

    hallConfig.forEach(h => {

        let booked=0, plotting=0, available=0;

        document.querySelectorAll(".booth").forEach(b => {
            const num = parseInt(b.innerText);

            if (num >= h.start && num <= h.end) {
                if (b.classList.contains("booked")) booked++;
                else if (b.classList.contains("plotting")) plotting++;
                else available++;
            }
        });

        html += `<b>${h.name}</b><br>
        Available: ${available}<br>
        Booked: ${booked}<br>
        Plotting: ${plotting}<br><br>`;
    });

    panel.classList.remove("hidden");
    panelContent.innerHTML = html;
};

/* MINI MAP */
function drawMiniMap() {
    miniMap.innerHTML = "";

    const scaleX = miniMap.clientWidth / floor.scrollWidth;
    const scaleY = miniMap.clientHeight / floor.scrollHeight;

    document.querySelectorAll(".booth").forEach(b => {

        const dot = document.createElement("div");

        dot.style.position = "absolute";
        dot.style.width = "4px";
        dot.style.height = "4px";

        if (b.classList.contains("booked")) dot.style.background = "red";
        else if (b.classList.contains("plotting")) dot.style.background = "yellow";
        else dot.style.background = "blue";

        dot.style.left = (b.offsetLeft * scaleX) + "px";
        dot.style.top = (b.offsetTop * scaleY) + "px";

        miniMap.appendChild(dot);
    });
}

miniMap.onclick = (e) => {

    const rect = miniMap.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = floor.scrollWidth / miniMap.clientWidth;
    const scaleY = floor.scrollHeight / miniMap.clientHeight;

    container.scrollTo({
        left: x * scaleX,
        top: y * scaleY,
        behavior: "smooth"
    });
};

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

/* GLOBAL CLICK */
document.addEventListener("click", ()=>{
    panel.classList.add("hidden");
    suggestions.style.display="none";
});

/* INIT */
loadData();
