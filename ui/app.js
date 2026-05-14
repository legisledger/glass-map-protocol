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
    
    // Run gravity engine...
    const result = GravityEngine.formCluster(anchorData, neighbors);
    
    // Add a checkmark if the cluster matches the Rulebook (cluster_schema.json)
    if (result.is_stable) {
        svgHtml += `
            <g transform="translate(450, 435)">
                <circle r="10" class="verif-circle" />
                <path d="M-4 0 L-1 3 L5 -3" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" />
                <text x="16" y="4" class="verif-text">PROTOCOL VERIFIED</text>
            </g>`;
    }   
    
    if (mapCanvas) mapCanvas.innerHTML = svgHtml;
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
