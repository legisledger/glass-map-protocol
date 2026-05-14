console.log("Glass Map Protocol UI Initialized.");

// NEW: Dynamic Gravity Renderer
const mapContainer = document.querySelector('.map-pane .pane-content');

// --- INTERACTIVE ROUTER ---
const fileSelector = document.getElementById('file-selector');

// Initialize the dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    loadProtocol('08055.yml');
});

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
    try {
        const response = await fetch(`../data/micro/${fileName}`);
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);

        // Update the Map with Gravity
        // Note: For now, we are passing the data + our neighbors mock
        // In the next step, we can move neighbor data into the YAML itself!
        renderGlassMap(data, (data.id === '08055' ? neighbors : phillyNeighbors));
        
        // Update Pane 3: The Ledger
        updateServiceLedger(data);
    } catch (err) {
        console.error("Failed to load protocol:", err);
    }
}

 /**
 * ADMINISTRATIVE GRAVITY ENGINE
 * Purpose: Accumulate neighboring population until the 60k threshold is reached.
 */
const GravityEngine = {
    TARGET_MASS: 60000,
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
    const result = GravityEngine.formCluster(anchorData, neighbors);
    const allPoints = [anchorData, ...neighbors];

    // FIND THE CENTER: This prevents the "Top Left Corner" huddle
    const minX = Math.min(...allPoints.map(p => p.x));
    const minY = Math.min(...allPoints.map(p => p.y));
    
    // SCALE: 80px per unit provides enough room for the bricks to breathe
    const scale = 80; 
    const offset = 50; // Padding from the edge

    let svgHtml = `<svg viewBox="0 0 600 600" class="w-full h-full">`;

    // DRAW LINES FIRST
    result.member_zips.forEach(zipId => {
        const zipData = allPoints.find(z => z.id === zipId);
        if (zipId !== anchorData.id) {
            svgHtml += `<line x1="${(anchorData.x - minX) * scale + offset + 30}" 
                             y1="${(anchorData.y - minY) * scale + offset + 30}" 
                             x2="${(zipData.x - minX) * scale + offset + 30}" 
                             y2="${(zipData.y - minY) * scale + offset + 30}" 
                             stroke="#3b82f6" stroke-width="2" stroke-dasharray="4" opacity="0.6" />`;
        }
    });

    // DRAW BRICKS
    allPoints.forEach(item => {
        const isMember = result.member_zips.includes(item.id);
        const isAnchor = item.id === anchorData.id;
        // Calculate relative position
        const posX = (item.x - minX) * scale + offset;
        const posY = (item.y - minY) * scale + offset;

        svgHtml += `
            <g class="zip-brick" transform="translate(${posX}, ${posY})">
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

    // UPDATED PROGRESS BAR (Fixed at the bottom)
    const progress = Math.min((result.total_population / 60000) * 100, 100);
    svgHtml += `
        <g transform="translate(50, 540)">
            <rect width="500" height="12" fill="#222" rx="6" />
            <rect width="${progress * 5}" height="12" fill="${result.is_stable ? '#10b981' : '#f59e0b'}" rx="6" />
            <text y="-10" fill="white" font-size="12" font-weight="bold">
                ${result.is_stable ? 'STABLE CLUSTER' : 'UNDER-SCALED'} | ${result.total_population.toLocaleString()} / 60,000
            </text>
        </g>
    </svg>`;
    
    // Add a checkmark if the cluster matches the Rulebook (cluster_schema.json)
    if (result.is_stable) {
        svgHtml += `
            <g transform="translate(450, 435)">
                <circle r="10" class="verif-circle" />
                <path d="M-4 0 L-1 3 L5 -3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" />
                <text x="16" y="4" class="verif-text">PROTOCOL VERIFIED</text>
            </g>`;
    }   
    
    mapContainer.innerHTML = svgHtml;
}

function updateServiceLedger(data) {
    const ledgerContent = document.querySelector('.pane-3 .pane-content');
    const auditConsole = document.querySelector('.audit-console');

    // Render Services
    ledgerContent.innerHTML = data.services.map(s => `
        <div class="service-card">
            <div class="service-card-header">
                <span class="service-type-${s.tier.toLowerCase().includes('micro') ? 'micro' : 'regional'}">
                    ${s.service.toUpperCase()}
                </span>
                <span>${s.tier}</span>
            </div>
            <p>Provider: ${s.provider}</p>
            <p class="text-muted" style="font-size: 0.65rem; margin-top: 5px;">${s.logic}</p>
        </div>
    `).join('');

    // Render Hypotheses (Legis Ledger)
    auditConsole.innerHTML = `
        <div class="pane-header" style="background:none; padding:0 0 10px 0;">Legis Ledger Audit</div>
        ${data.hypotheses.map(h => `
            <div class="hypothesis-entry">
                <div class="confidence-meter">P(${h.claim}) = ${h.probability}</div>
                <p style="font-size: 0.7rem;">${h.logic}</p>
            </div>
        `).join('')}
    `;
}
