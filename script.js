const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");
const minimapView = document.getElementById("minimapView");

let allData = [];
let zoomLevel = 1;

/* =========================
   NORMALIZE
========================= */
function normalizeId(id) {
    return String(id).replace(/\s+/g, "").toLowerCase();
}

/* =========================
   GET HALL FROM BOOTH
========================= */
function getHall(boothId) {
    const num = parseInt(boothId);
    if (num >= 5000 && num < 6000) return "Hall 5";
    if (num >= 6000 && num < 7000) return "Hall 6";
    if (num >= 7000 && num < 8000) return "Hall 7";
    if (num >= 8000 && num < 9000) return "Hall 8";
    if (num >= 9000 && num < 10000) return "Hall 9";
    if (num >= 1000 && num < 2000) return "Hall 10";
    return "Other";
}

/* =========================
   LOAD DATA (KEEP ALL IDs)
========================= */
async function loadData() {
    const res = await fetch(`${G_SCRIPT_URL}?t=${Date.now()}`);
    const raw = await res.json();

    allData = [];

    raw.forEach(row => {
        if (!row.boothid) return;

        row.boothid.split(",").forEach(id => {
            allData.push({
                boothid: id.trim(),
                status: (row.status || "available").toLowerCase(),
                exhibitor: (row.exhibitor || "").trim()
            });
        });
    });

    renderFloor();
}

/* =========================
   RENDER FLOOR (DATA BASED)
========================= */
function renderFloor() {
    floor.innerHTML = "";

    // GROUP BY HALL
    const grouped = {};

    allData.forEach(d => {
        const hall = getHall(d.boothid);
        if (!grouped[hall]) grouped[hall] = [];
        grouped[hall].push(d);
    });

    Object.keys(grouped).forEach(hallName => {
        const hallDiv = document.createElement("div");
        hallDiv.className = "hall";

        const title = document.createElement("h2");
        title.innerText = hallName;
        hallDiv.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "grid";

        // SORT NATURAL (IMPORTANT)
        grouped[hallName].sort((a, b) =>
            a.boothid.localeCompare(b.boothid, undefined, { numeric: true })
        );

        grouped[hallName].forEach(d => {
            grid.appendChild(createBooth(d));
        });

        hallDiv.appendChild(grid);
        floor.appendChild(hallDiv);
    });
}

/* =========================
   CREATE BOOTH
========================= */
function createBooth(data) {
    const b = document.createElement("div");

    let status = data.status;
    if (data.exhibitor && data.exhibitor === data.exhibitor.toLowerCase()) {
        status = "plotting";
    }

    b.className = "booth " + status;
    b.innerText = data.boothid;

    b.onclick = (e) => {
        e.stopPropagation();

        panel.classList.remove("hidden");
        panelContent.innerHTML = `
            <b>Booth:</b> ${data.boothid}<br>
            <b>Status:</b> ${status}<br>
            <b>Exhibitor:</b> ${data.exhibitor || "-"}
        `;
    };

    return b;
}

/* =========================
   SEARCH (PRIORITY FIX)
========================= */
searchBox.addEventListener("input", () => {
    const val = searchBox.value.toLowerCase();

    const list = allData.filter(x =>
        normalizeId(x.boothid).includes(normalizeId(val)) ||
        (x.exhibitor || "").toLowerCase().includes(val)
    );

    suggestions.innerHTML = "";
    suggestions.style.display = "block";

    list.forEach(x => {
        const div = document.createElement("div");
        div.className = "suggestionItem";
        div.innerText = `${x.boothid} - ${x.exhibitor}`;

        div.onclick = (e) => {
            e.stopPropagation();

            const el = [...document.querySelectorAll(".booth")]
                .find(b => b.innerText === x.boothid);

            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });

                el.classList.add("highlight");
                setTimeout(() => el.classList.remove("highlight"), 5000);

                el.click();
            }

            suggestions.style.display = "none";
        };

        suggestions.appendChild(div);
    });
});

/* =========================
   DRAG (SMOOTH)
========================= */
let isDown = false, startX, startY, scrollLeft, scrollTop;

container.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX;
    startY = e.pageY;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
});

container.addEventListener("mousemove", (e) => {
    if (!isDown) return;

    container.scrollLeft = scrollLeft - (e.pageX - startX);
    container.scrollTop = scrollTop - (e.pageY - startY);

    updateMinimap();
});

container.addEventListener("mouseup", () => isDown = false);
container.addEventListener("mouseleave", () => isDown = false);

/* =========================
   AUTO HIDE PANEL
========================= */
document.addEventListener("click", () => {
    panel.classList.add("hidden");
    suggestions.style.display = "none";
});

/* =========================
   ZOOM
========================= */
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
    document.getElementById("zoomLevel").innerText =
        Math.round(zoomLevel * 100) + "%";
}

/* =========================
   MINIMAP
========================= */
function updateMinimap() {
    const ratioX = container.clientWidth / floor.scrollWidth;
    const ratioY = container.clientHeight / floor.scrollHeight;

    minimapView.style.width = (180 * ratioX) + "px";
    minimapView.style.height = (120 * ratioY) + "px";

    minimapView.style.left =
        (container.scrollLeft / floor.scrollWidth) * 180 + "px";

    minimapView.style.top =
        (container.scrollTop / floor.scrollHeight) * 120 + "px";
}

container.addEventListener("scroll", updateMinimap);

/* =========================
   ANALYTICS (PER HALL)
========================= */
document.getElementById("analyticsBtn").onclick = () => {

    let result = {};

    allData.forEach(d => {
        const hall = getHall(d.boothid);

        if (!result[hall]) {
            result[hall] = { available:0, booked:0, plotting:0 };
        }

        result[hall][d.status] =
            (result[hall][d.status] || 0) + 1;
    });

    let html = "<h3>📊 Hall Analytics</h3>";

    Object.keys(result).forEach(h => {
        const r = result[h];
        const total = r.available + r.booked + r.plotting;

        html += `
            <b>${h}</b><br>
            Available: ${r.available}<br>
            Booked: ${r.booked}<br>
            Plotting: ${r.plotting}<br>
            Total: ${total}<br><br>
        `;
    });

    panel.classList.remove("hidden");
    panelContent.innerHTML = html;
};

/* INIT */
loadData();
