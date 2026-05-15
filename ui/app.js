/**
 * GLASS MAP PROTOCOL - CORE ENGINE
 * Standard: 1789 1st Senate (1:60,000)
 */

console.log("Glass Map Protocol UI Initialized.");

const PROTOCOL_STANDARD = 60000; // Locked Configuration

let mapCanvas;

window.onload = () => {
    // Assign it once the page is fully ready
    mapCanvas = document.querySelector('.map-pane .pane-content');
    loadProtocol('08055.yml');
};

const mapContainer = document.querySelector('.map-pane .pane-content');
const fileSelector = document.getElementById('file-selector');

fileSelector.addEventListener('click', async (e) => {
    const target = e.target.closest('.file-item');
    if (!target) return;

    // UI Feedback: Update active state
    document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
    target.classList.add('active');

    const fileName = target.getAttribute('data-file');
    await loadProtocol(fileName);
});

async function loadProtocol(fileName) {
    console.log(`Attempting to load: ${fileName}`); // Debug line
    try {
        const response = await fetch(`../data/micro/${fileName}`);
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        // Debugging the data structure
        console.log("YAML Data Loaded:", data);

        // CLEAR THE PANE before rendering
        if (mapCanvas) mapCanvas.innerHTML = ""; 
        
        // RENDER the new map
        renderGlassMap(data, data.neighbors || []);
        updateServiceLedger(data);

    } catch (err) {
        mapCanvas.innerHTML = `<p style="color:red; padding:20px;">Error loading ${fileName}: ${err.message}</p>`;
    }
}

 /**
 * ADMINISTRATIVE GRAVITY ENGINE
 * Purpose: Accumulate neighboring population until the maximum representative threshold is reached.
 */
const GravityEngine = {
    TARGET_MASS: PROTOCOL_STANDARD,
    TOLERANCE: 5000,

    // The 'Pull' function
    formCluster: function(anchorZip, availableZips) {
        // 1. Start with the anchor
        let cluster = [anchorZip];
        let currentMass = anchorZip.population;

        // 2. Sort available neighbors by 'Gravity' (Inverse Square of Distance)
        // We prioritize Zips that are physically closest to the anchor
        let candidates = availableZips
            .filter(z => z.id !== anchorZip.id)
            .sort((a, b) => this.calculateGravity(anchorZip, a) - this.calculateGravity(anchorZip, b));

        // 3. Accumulate Mass
        for (let zip of candidates) {
            if (currentMass < (this.TARGET_MASS - this.TOLERANCE)) {
                cluster.push(zip);
                currentMass += zip.population;
                console.log(`Pulling ${zip.id} into orbit. Current Mass: ${currentMass}`);
            } else {
                break;
            }
        }

        return {
            cluster_id: `GM-${anchorZip.id}-STABLE`,
            anchor_zip: anchorZip.id,
            total_population: currentMass,
            member_zips: cluster.map(z => z.id),
            is_stable: currentMass >= (this.TARGET_MASS - this.TOLERANCE)
        };
    },

    calculateGravity: function(origin, target) {
        // Administrative Gravity = Pop / Distance^2
        // For simplicity in MVP: we just return pure distance (Lower is better)
        const dx = origin.x - target.x;
        const dy = origin.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
};

function renderGlassMap(anchorData, neighbors) {
    if (!mapCanvas) return;
    mapCanvas.innerHTML = ""; // Clear the deck
    
    let svgHtml = "";
    const neighborsToDraw = neighbors || [];

    // 1. TOPOLOGICAL POSITIONING
    // Anchor always starts at the relative origin
    anchorData.x = 0;
    anchorData.y = 0;

    // Orbit the neighbors dynamically
    neighborsToDraw.forEach((zip, index) => {
        const angle = (index / neighborsToDraw.length) * 2 * Math.PI;
        // Radius of 1.5 units provides clean spacing for the bricks
        const radius = 1.5; 
        zip.x = Math.cos(angle) * radius;
        zip.y = Math.sin(angle) * radius;
    });

    // 2. CALCULATE GRAVITY
    const result = GravityEngine.formCluster(anchorData, neighborsToDraw);
    const allPoints = [anchorData, ...neighborsToDraw];

    // 3. SVG COORDINATE NORMALIZATION
    // We scale the relative x,y (0, 1.5, etc) to screen pixels (300, 450, etc)
    const scale = 120; 
    const centerX = 300;
    const centerY = 250;

    svgHtml = `<svg viewBox="0 0 600 600" class="w-full h-full" style="background:#000;">`;

    // 4. DRAW GRAVITY BONDS (Lines)
    result.member_zips.forEach(zipId => {
        const zipData = allPoints.find(z => z.id === zipId);
        if (zipId !== anchorData.id) {
            svgHtml += `
                <line x1="${centerX}" y1="${centerY}" 
                      x2="${zipData.x * scale + centerX}" y2="${zipData.y * scale + centerY}" 
                      stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4" opacity="0.6" />`;
        }
    });

    // 5. DRAW ZIP BRICKS
    allPoints.forEach(item => {
        const isMember = result.member_zips.includes(item.id);
        const isAnchor = item.id === anchorData.id;
        const posX = item.x * scale + centerX - 30; // -30 to center the 60px rect
        const posY = item.y * scale + centerY - 30;

        svgHtml += `
            <g class="zip-brick" style="cursor:pointer;" transform="translate(${posX}, ${posY})">
                <rect width="60" height="60" rx="4"
                      fill="${isAnchor ? '#1e40af' : (isMember ? '#1e3a8a' : '#111')}" 
                      stroke="${isMember ? '#3b82f6' : '#333'}" 
                      stroke-width="${isAnchor ? '3' : '1'}" />
                <text x="30" y="25" fill="white" font-size="12" font-weight="bold" text-anchor="middle">${item.id}</text>
                <text x="30" y="45" fill="${isMember ? '#60a5fa' : '#666'}" font-size="10" text-anchor="middle">
                    ${(item.population / 1000).toFixed(1)}k
                </text>
            </g>`;
    });

    // 6. DRAW THE 1789 STANDARD PROGRESS BAR
    const progress = Math.min((result.total_population / PROTOCOL_STANDARD) * 100, 100);
    const barColor = result.is_stable ? '#10b981' : '#f59e0b';

    svgHtml += `
        <g transform="translate(50, 520)">
            <text y="-15" fill="white" font-size="12" font-weight="bold" style="letter-spacing:0.05em;">
                ${result.is_stable ? 'STABLE MICRO-DISTRICT' : 'UNDER-SCALED'} 
                | ${result.total_population.toLocaleString()} / ${PROTOCOL_STANDARD.toLocaleString()}
            </text>
            <rect width="500" height="8" fill="#222" rx="4" />
            <rect width="${progress * 5}" height="8" fill="${barColor}" rx="4" style="transition: width 0.5s ease;" />
        </g>`;

    // 7. THE PROTOCOL VERIFIED BADGE (1789 Standard)
    if (result.is_stable) {
        svgHtml += `
            <g transform="translate(430, 485)">
                <circle r="8" fill="#10b981" />
                <path d="M-3 0 L-1 2 L4 -2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" transform="translate(0,0)" />
                <text x="15" y="4" fill="#10b981" font-size="9" font-weight="bold" style="letter-spacing:0.1em;">1789 STANDARD VERIFIED</text>
            </g>`;
    }

    svgHtml += `</svg>`;
    mapCanvas.innerHTML = svgHtml;
}

function updateServiceLedger(data) {
    // We target Pane 3 specifically by its class
    const ledgerContent = document.querySelector('.pane-3 .pane-content');
    const auditConsole = document.querySelector('.audit-console');

    // SAFETY GUARD: If the DOM isn't ready, exit early to prevent the crash
    if (!ledgerContent || !data.services) {
        console.warn("Ledger content or services data missing.");
        return;
    }

    // Render Services
    ledgerContent.innerHTML = data.services.map(s => `
        <div class="service-card" style="border-left: 2px solid #3b82f6; padding: 10px; margin-bottom: 10px; background: rgba(255,255,255,0.02);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: bold; color: #60a5fa; font-size: 0.7rem;">${s.service.toUpperCase()}</span>
                <span style="font-size: 0.6rem; color: #888;">${s.tier}</span>
            </div>
            <p style="margin: 0; font-size: 0.7rem;">Provider: ${s.provider}</p>
            <p style="margin: 5px 0 0 0; font-size: 0.6rem; color: #aaa; line-height: 1.2;">${s.logic}</p>
        </div>
    `).join('');

    // Render Hypotheses (Legis Ledger) - Check if auditConsole exists first
    if (auditConsole && data.hypotheses) {
        auditConsole.innerHTML = `
            <div style="font-size: 0.7rem; font-weight: bold; color: #888; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px;">LEGIS LEDGER AUDIT</div>
            ${data.hypotheses.map(h => `
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 0.65rem; color: #10b981;">P(${h.claim}) = ${h.probability}</div>
                    <p style="font-size: 0.6rem; color: #888; margin: 2px 0;">${h.logic}</p>
                </div>
            `).join('')}
        `;
    }
}
