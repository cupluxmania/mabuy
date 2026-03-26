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
    const res = await fetch(G_SCRIPT_URL);
    const raw = await res.json();

    allData = [];

    raw.forEach(r => {
        if (!r.boothid) return;

        r.boothid.split(",").forEach(id => {
            allData.push({
                boothid: id.trim(), // ✅ KEEP ORIGINAL FORMAT
                status: (r.status || "available").toLowerCase(),
                exhibitor: r.exhibitor || ""
            });
        });
    });

    renderFloor();
}

/* HALL */
const hallConfig = [
  {name:"Hall 5", start:5001, end:5078},
  {name:"Hall 6", start:6001, end:6189},
  {name:"Hall 7", start:7001, end:7196}
];

/* RENDER */
function renderFloor() {
    floor.innerHTML = "";

    hallConfig.forEach(hall => {
        const hallDiv = document.createElement("div");
        hallDiv.className = "hall";

        const title = document.createElement("h2");
        title.innerText = hall.name;
        hallDiv.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "grid";

        for (let i = hall.start; i <= hall.end; i++) {
            grid.appendChild(createBooth(String(i)));
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
        b.className = "booth " + d.status;
        b.dataset.tooltip = d.exhibitor || d.status;
        b.dataset.name = d.exhibitor;
    }

    b.onclick = () => {
        panel.classList.remove("hidden");
        panelContent.innerHTML = `
            <b>Booth:</b> ${id}<br>
            <b>Status:</b> ${b.className.replace("booth ","")}<br>
            <b>Exhibitor:</b> ${b.dataset.name || "-"}
        `;
    };

    return b;
}

/* SEARCH */
searchBox.addEventListener("click", (e) => {
    e.stopPropagation();
    showSuggestions(allData);
});

searchBox.addEventListener("input", () => {
    const val = searchBox.value.toLowerCase();

    showSuggestions(allData.filter(x =>
        x.boothid.toLowerCase().includes(val) ||
        x.exhibitor.toLowerCase().includes(val)
    ));
});

function showSuggestions(list) {
    suggestions.innerHTML = "";
    suggestions.style.display = "block";

    list.forEach(x => {
        const div = document.createElement("div");
        div.className = "suggestionItem";
        div.innerText = `${x.boothid} - ${x.exhibitor}`;

        div.onclick = (e) => {
            e.stopPropagation();

            const el = document.querySelector(`[data-id='${x.boothid}']`);

            if (el) {
                jumpTo(el);

                el.classList.add("highlight");

                setTimeout(() => {
                    el.classList.remove("highlight");
                }, 2000);

                el.click();
            }

            suggestions.style.display = "none";
        };

        suggestions.appendChild(div);
    });
}

/* JUMP */
function jumpTo(el) {
    const rect = el.getBoundingClientRect();
    const crect = container.getBoundingClientRect();

    container.scrollTo({
        left: container.scrollLeft + rect.left - crect.left - 200,
        top: container.scrollTop + rect.top - crect.top - 200,
        behavior: "smooth"
    });
}

/* ZOOM */
document.getElementById("zoomIn").onclick = () => {
    zoomLevel += 0.1;
    floor.style.transform = `scale(${zoomLevel})`;
};
document.getElementById("zoomOut").onclick = () => {
    zoomLevel -= 0.1;
    floor.style.transform = `scale(${zoomLevel})`;
};

/* CLOSE */
document.addEventListener("click", () => {
    suggestions.style.display = "none";
    panel.classList.add("hidden");
});

loadData();
