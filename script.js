const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeXfwbFMaC8WH3th-aw5_PtMGTlz6UHMC5S5tWs9j1FW-G_Fszldy9QqiY5Zps-mFGQg/exec";

const floor = document.getElementById("floor");
const container = document.getElementById("floorContainer");
const searchBox = document.getElementById("searchBox");
const suggestions = document.getElementById("suggestions");
const panel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");

let allData = [];
let zoomLevel = 1;
let isOpen = false;

/* 1. LOAD DATA FROM GOOGLE SHEETS */
async function loadData() {
    try {
        const res = await fetch(`${G_SCRIPT_URL}?cmd=read&t=${Date.now()}`, { redirect: "follow" });
        const text = await res.text();
        allData = JSON.parse(text);
        renderBooths();
    } catch (e) {
        console.error("Error loading data:", e);
        renderBooths(); // Show empty floorplan if sync fails
    }
}

/* 2. RENDER THE FLOORPLAN */
function renderBooths() {
    floor.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "grid";

    // Loop through booth IDs 5001 to 5100 (Adjust range as needed)
    for (let i = 5001; i <= 5100; i++) {
        const b = document.createElement("div");
        b.className = "booth available";
        b.innerText = i;
        b.dataset.id = i;

        // Match data from Sheet
        const d = allData.find(x => String(x.boothid) === String(i));
        if (d) {
            let name = (d.exhibitor || "").trim();
            let status = (d.status || "available").toLowerCase();
            
            // PLOTTING LOGIC: If name is lowercase, color it yellow
            if (name.length > 0 && name === name.toLowerCase()) {
                status = "plotting";
            }

            b.className = "booth " + status;
            b.dataset.name = name;
        }

        b.onclick = (e) => {
            e.stopPropagation();
            panel.classList.remove("hidden");
            panelContent.innerHTML = `
                <p><strong>Booth:</strong> ${i}</p>
                <p><strong>Status:</strong> ${b.className.replace('booth ', '').toUpperCase()}</p>
                <p><strong>Exhibitor:</strong> ${b.dataset.name || "N/A"}</p>
            `;
        };
        grid.appendChild(b);
    }
    floor.appendChild(grid);
}

/* 3. SEARCH LOGIC */
searchBox.addEventListener("input", () => {
    const val = searchBox.value.toLowerCase();
    if (!val) { suggestions.style.display = "none"; return; }

    const filtered = allData.filter(x => 
        (x.status !== "available") && 
        (String(x.boothid).includes(val) || x.exhibitor.toLowerCase().includes(val))
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
        div.onclick = () => {
            const el = document.querySelector(`[data-id='${x.boothid}']`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("highlight");
                setTimeout(() => el.classList.remove("highlight"), 2000);
            }
            suggestions.style.display = "none";
        };
        suggestions.appendChild(div);
    });
}

/* 4. ZOOM & DRAG LOGIC */
document.getElementById("zoomIn").onclick = () => { zoomLevel += 0.1; applyZoom(); };
document.getElementById("zoomOut").onclick = () => { zoomLevel = Math.max(0.5, zoomLevel - 0.1); applyZoom(); };

function applyZoom() {
    floor.style.transform = `scale(${zoomLevel})`;
    document.getElementById("zoomLevel").innerText = Math.round(zoomLevel * 100) + "%";
}

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

/* 5. ANALYTICS */
document.getElementById("analyticsBtn").onclick = () => {
    const booked = allData.filter(x => x.status === "booked").length;
    const plotting = allData.filter(x => x.status === "plotting" || (x.exhibitor && x.exhibitor === x.exhibitor.toLowerCase())).length;
    alert(`Current Stats:\nBooked: ${booked}\nPlotting: ${plotting}`);
};

loadData();
