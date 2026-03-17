const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");

let allData = [];
let zoomLevel = 1;

const hallConfig = [
  {name:"Hall 5", start:5001, end:"5078A"},
  {name:"Hall 6", start:6001, end:"6189A"},
  {name:"Hall 7", start:7001, end:"7185A"},
  {name:"Hall 8", start:8001, end:"8181A"},
  {name:"Hall 9", start:9001, end:"9191A"},
  {name:"Hall 10", start:1001, end:"1151A"},
  {name:"Ambulance", start:"A", end:"Z"}
];

async function loadData() {
    try {
        const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`, { redirect: "follow" });
        const text = await res.text();
        allData = JSON.parse(text);
        renderFloor();
    } catch (e) {
        console.error("Load error:", e);
        renderFloor();
    }
}

function renderFloor() {
    floor.innerHTML = "";
    hallConfig.forEach(hall => {
        const hallDiv = document.createElement("div");
        hallDiv.className = "hall";
        hallDiv.innerHTML = `<h2>${hall.name}</h2>`;
        const grid = document.createElement("div");
        grid.className = "grid";

        if (hall.name === "Ambulance") {
            for (let i = 65; i <= 90; i++) {
                grid.appendChild(createBooth(String.fromCharCode(i)));
            }
        } else {
            let startNum = parseInt(hall.start);
            let endNum = parseInt(hall.end);
            let suffix = String(hall.end).replace(/[0-9]/g, '');
            for (let i = startNum; i <= endNum; i++) {
                let finalId = (i === endNum && suffix) ? i + suffix : String(i);
                grid.appendChild(createBooth(finalId));
            }
        }
        hallDiv.appendChild(grid);
        floor.appendChild(hallDiv);
    });
}

function createBooth(id) {
    const b = document.createElement("div");
    b.className = "booth available";
    b.innerText = id;
    b.dataset.id = id;
    b.dataset.name = "";
    b.dataset.tooltip = "Available";

    const d = allData.find(x => String(x.boothid).toLowerCase() === String(id).toLowerCase());
    if (d) {
        let name = (d.exhibitor || "").trim();
        let status = (d.status || "available").toLowerCase();
        if (name.length > 0 && name === name.toLowerCase()) status = "plotting";
        b.className = "booth " + status;
        b.dataset.name = name;
        b.dataset.tooltip = name || (status.charAt(0).toUpperCase() + status.slice(1));
    }

    b.onclick = (e) => {
        e.stopPropagation();
        const currentStatus = b.className.replace('booth ', '');
        const statusProper = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
        panel.classList.remove("hidden");
        panelContent.innerHTML = `
            <b>Booth:</b> ${id}<br>
            <b>Status:</b> ${statusProper}<br>
            <b>Exhibitor:</b> ${b.dataset.name || "-"}
        `;
    };
    return b;
}

/* IMPROVED SEARCH: SINGLE CLICK & AUTO-SCROLL */

// 1. Single click to show all booked/plotting exhibitors
searchBox.addEventListener("click", (e) => {
    e.stopPropagation();
    const val = searchBox.value.toLowerCase();
    if (!val) {
        const list = allData.filter(x => x.status !== "available");
        showSuggestions(list);
    }
});

searchBox.addEventListener("input", () => {
    const val = searchBox.value.toLowerCase();
    const filtered = allData.filter(x => 
        x.status !== "available" && 
        (String(x.boothid).toLowerCase().includes(val) || x.exhibitor.toLowerCase().includes(val))
    );
    showSuggestions(filtered);
});

function showSuggestions(list) {
    suggestions.innerHTML = "";
    if (list.length === 0) { suggestions.style.display = "none"; return; }
    suggestions.style.display = "block";

    list.forEach(x => {
        const div = document.createElement("div");
        div.className = "suggestionItem";
        div.innerText = `${x.boothid} - ${x.exhibitor}`;
        
        div.onclick = (e) => {
            e.stopPropagation();
            const el = document.querySelector(`[data-id='${x.boothid}']`);
            if (el) {
                // FIXED REDIRECT: Smoothly center the booth in the container
                el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                
                // Visual feedback
                el.classList.add("highlight");
                setTimeout(() => el.classList.remove("highlight"), 2000);
                
                // Auto-open the side panel for the found booth
                el.click(); 
            }
            suggestions.style.display = "none";
        };
        suggestions.appendChild(div);
    });
}

/* NAVIGATION & UI */

document.getElementById("zoomIn").onclick = () => { zoomLevel += 0.1; applyZoom(); };
document.getElementById("zoomOut").onclick = () => { zoomLevel = Math.max(0.3, zoomLevel - 0.1); applyZoom(); };

function applyZoom() { 
    floor.style.transform = `scale(${zoomLevel})`; 
    document.getElementById("zoomLevel").innerText = Math.round(zoomLevel * 100) + "%";
}

document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !e.target.classList.contains('booth')) {
        panel.classList.add("hidden");
    }
    if (!searchBox.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.style.display = "none";
    }
});

/* DRAGGING LOGIC */
let isDown = false, startX, startY, scrollLeft, scrollTop;
container.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - container.offsetLeft;
    startY = e.pageY - container.offsetTop;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
});
container.addEventListener("mouseleave", () => isDown = false);
container.addEventListener("mouseup", () => isDown = false);
container.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    container.scrollLeft = scrollLeft - (x - startX);
    container.scrollTop = scrollTop - (y - startY);
});

loadData();
