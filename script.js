const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");

let allData = [];
let zoomLevel = 1;

/* ========================= */
function normalizeId(id) {
    return String(id).replace(/\s+/g, "").toLowerCase();
}

function getBaseId(id) {
    return String(id).split("-")[0];
}

function getGroupedBooths() {
    const groups = {};
    allData.forEach(x => {
        const base = getBaseId(x.boothid);
        if (!groups[base]) groups[base] = [];
        groups[base].push(x);
    });
    return groups;
}

/* ========================= */
async function loadData() {
    try {
        const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`);
        const raw = await res.json();

        const expanded = [];

        raw.forEach(row => {
            if (!row.boothid) return;

            const booths = String(row.boothid).split(",");

            booths.forEach(id => {
                expanded.push({
                    boothid: id.trim(),
                    status: (row.status || "available").toLowerCase(),
                    exhibitor: (row.exhibitor || "").trim()
                });
            });
        });

        allData = expanded;
        renderFloor();

    } catch (e) {
        console.error("Load error:", e);
        renderFloor();
    }
}

/* ========================= */
const hallConfig = [
  {name:"Hall 5", start:5001, end:"5078A"},
  {name:"Hall 6", start:6001, end:"6189A"},
  {name:"Hall 7", start:7001, end:"7185A"},
  {name:"Hall 8", start:8001, end:"8181A"},
  {name:"Hall 9", start:9001, end:"9191A"},
  {name:"Hall 10", start:1001, end:"1151A"},
  {name:"Ambulance", start:"A", end:"Z"}
];

/* ========================= */
function renderFloor() {
    floor.innerHTML = "";

    const grouped = getGroupedBooths();

    hallConfig.forEach(hall => {
        const hallDiv = document.createElement("div");
        hallDiv.className = "hall";

        const h2 = document.createElement("h2");
        h2.innerText = hall.name;
        h2.onclick = () => jumpToElement(hallDiv);
        hallDiv.appendChild(h2);

        const grid = document.createElement("div");
        grid.className = "grid";

        if (hall.name === "Ambulance") {
            for (let i = 65; i <= 90; i++) {
                grid.appendChild(createBooth(String.fromCharCode(i)));
            }
        } else {
            let startNum = parseInt(hall.start);
            let endNum = parseInt(hall.end);

            const rendered = new Set();

            for (let i = startNum; i <= endNum; i++) {
                const baseId = String(i);
                if (rendered.has(baseId)) continue;

                if (grouped[baseId]) {
                    const group = grouped[baseId];

                    if (group.length > 1 || group[0].boothid.includes("-")) {
                        grid.appendChild(createMergedBooth(baseId, group));
                        rendered.add(baseId);
                        continue;
                    }
                }

                grid.appendChild(createBooth(baseId));
            }
        }

        hallDiv.appendChild(grid);
        floor.appendChild(hallDiv);
    });
}

/* ========================= */
function createMergedBooth(baseId, group) {
    const b = document.createElement("div");
    const size = group.length;

    b.className = "booth merged";
    b.innerText = baseId;
    b.dataset.id = baseId;

    // 🔥 SPAN WIDTH
    b.style.gridColumn = `span ${size}`;

    const names = group.map(x => x.exhibitor).filter(x => x);
    b.dataset.tooltip = names.join(", ") || "Grouped Booth";

    let status = "available";
    if (group.some(x => x.status === "booked")) status = "booked";
    if (group.some(x => x.status === "plotting")) status = "plotting";

    b.classList.add(status);

    b.onclick = (e) => {
        e.stopPropagation();

        panel.classList.remove("hidden");
        panelContent.innerHTML = `
            <b>Booth Group:</b> ${baseId}<br>
            <b>Total Units:</b> ${size}<br>
            <b>Status:</b> ${status}<br><br>
            ${group.map(x => `${x.boothid} - ${x.exhibitor || "-"}`).join("<br>")}
        `;
    };

    return b;
}

/* ========================= */
function createBooth(id) {
    const b = document.createElement("div");
    b.className = "booth available";
    b.innerText = id;
    b.dataset.id = id;
    b.dataset.tooltip = "Available";

    const d = allData.find(x => normalizeId(x.boothid) === normalizeId(id));

    if (d) {
        b.className = "booth " + d.status;
        b.dataset.tooltip = d.exhibitor || d.status;
    }

    b.onclick = (e) => {
        e.stopPropagation();
        panel.classList.remove("hidden");
        panelContent.innerHTML = `
            <b>Booth:</b> ${id}<br>
            <b>Status:</b> ${b.classList[1]}<br>
            <b>Exhibitor:</b> ${b.dataset.tooltip || "-"}
        `;
    };

    return b;
}

/* ========================= */
function jumpToElement(el) {
    const elRect = el.getBoundingClientRect();
    const conRect = container.getBoundingClientRect();

    const scrollX = container.scrollLeft + (elRect.left - conRect.left) - (conRect.width / 2);
    const scrollY = container.scrollTop + (elRect.top - conRect.top) - (conRect.height / 2);

    container.scrollTo({ left: scrollX, top: scrollY, behavior: "smooth" });
}

/* ========================= SEARCH */
searchBox.addEventListener("input", () => {
    const val = searchBox.value.toLowerCase();

    const list = allData.filter(x =>
        x.status !== "available" &&
        (
            normalizeId(x.boothid).includes(val) ||
            x.exhibitor.toLowerCase().includes(val)
        )
    );

    suggestions.innerHTML = "";
    suggestions.style.display = list.length ? "block" : "none";

    list.forEach(x => {
        const div = document.createElement("div");
        div.className = "suggestionItem";
        div.innerText = `${x.boothid} - ${x.exhibitor}`;

        div.onclick = (e) => {
            e.stopPropagation();

            const base = getBaseId(x.boothid);
            const el = document.querySelector(`[data-id='${base}']`);

            if (el) {
                jumpToElement(el);
                el.classList.add("highlight");
                setTimeout(() => el.classList.remove("highlight"), 2000);
                el.click();
            }

            suggestions.style.display = "none";
        };

        suggestions.appendChild(div);
    });
});

/* ========================= ZOOM */
document.getElementById("zoomIn").onclick = () => {
    zoomLevel += 0.1;
    applyZoom();
};

document.getElementById("zoomOut").onclick = () => {
    zoomLevel = Math.max(0.3, zoomLevel - 0.1);
    applyZoom();
};

function applyZoom() {
    floor.style.transform = `scale(${zoomLevel})`;
    document.getElementById("zoomLevel").innerText = Math.round(zoomLevel * 100) + "%";
}

/* ========================= DRAG */
let isDown = false, startX, startY, scrollLeft, scrollTop;

container.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX;
    startY = e.pageY;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
});

container.addEventListener("mouseup", () => isDown = false);
container.addEventListener("mouseleave", () => isDown = false);

container.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();

    container.scrollLeft = scrollLeft - (e.pageX - startX);
    container.scrollTop = scrollTop - (e.pageY - startY);
});

/* ========================= */
document.addEventListener("click", () => {
    panel.classList.add("hidden");
    suggestions.style.display = "none";
});

loadData();
