let selectedSheets = [];

function toggleSheet(value) {
  const index = selectedSheets.indexOf(value);
  const buttons = document.querySelectorAll("#sheet-buttons button");

  if (index === -1) {
    selectedSheets.push(value);
  } else {
    selectedSheets.splice(index, 1);
  }

  buttons.forEach(btn => {
    if (btn.textContent.replace(/\s/g, '') === value) {
      btn.classList.toggle("selected");
    }
  });

  document.getElementById("selected-sheets").value = selectedSheets.join(",");
}

function addPieceRow() {
  const container = document.getElementById("piece-rows");
  const div = document.createElement("div");
  div.classList.add("piece-row");
  div.innerHTML = `
    <input class="piece-length" type="number" placeholder="Length (e.g. 24)" />
    <input class="piece-breadth" type="number" placeholder="Breadth (e.g. 48)" />
    <input class="piece-qty" type="number" placeholder="Qty (e.g. 5)" />
  `;
  container.appendChild(div);
}

function sendData() {
  if (selectedSheets.length === 0) {
    alert("Please select at least one stock sheet size.");
    return;
  }

  const lengths = document.querySelectorAll(".piece-length");
  const breadths = document.querySelectorAll(".piece-breadth");
  const qtys = document.querySelectorAll(".piece-qty");

  let pieces = [];

  for (let i = 0; i < lengths.length; i++) {
    const length = parseInt(lengths[i].value.trim());
    const breadth = parseInt(breadths[i].value.trim());
    const qty = parseInt(qtys[i].value.trim());

    if (!isNaN(length) && !isNaN(breadth) && !isNaN(qty)) {
      pieces.push({ length, breadth, quantity: qty });
    }
  }

  if (pieces.length === 0) {
    alert("Please enter at least one valid piece.");
    return;
  }

  fetch('/optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pieces, sheets: selectedSheets })
  })
    .then(res => res.json())
    .then(data => showOutput(data))
    .catch(err => {
      console.error("Error:", err);
      alert("Something went wrong.");
    });
}

const colorMap = {};
function getColorForSize(size) {
  if (colorMap[size]) return colorMap[size];
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
  colorMap[size] = color;
  return color;
}

function showOutput(results) {
  const output = document.getElementById("output");
  output.innerHTML = "<h2>Optimized Sheet Layout</h2>";

  results.forEach((sheet, index) => {
    const rawWidth = sheet.size[1]; // breadth
    const rawHeight = sheet.size[0]; // length
    const scale = 2;

    // Landscape switch: Now length = width, breadth = height (rotate visually)
    const width = rawHeight;
    const height = rawWidth;

    let html = `<div class="sheet-block">
      <h3>Sheet #${index + 1} (${rawHeight}in × ${rawWidth}in)</h3>
      <div class="sheet-visual" style="width:${width * scale}px; height:${height * scale}px;">`;

    sheet.pieces.forEach(p => {
      const displayX = p.y;
      const displayY = p.x;
      const displayW = p.height;
      const displayH = p.width;

      const color = getColorForSize(`${displayW}x${displayH}`);
      const topLabel = `<div class="edge-label top-label">${displayW}in</div>`;
      const leftLabel = `<div class="edge-label left-label">${displayH}in</div>`;

      html += `<div class="piece-block" style="
        width:${displayW * scale}px;
        height:${displayH * scale}px;
        left:${displayX * scale}px;
        top:${displayY * scale}px;
        background-color:${color};">
        ${topLabel}
        ${leftLabel}
        <div class="piece-text">${displayH} × ${displayW}</div>
      </div>`;
    });

    html += `</div></div>`;
    output.innerHTML += html;
  });
}
