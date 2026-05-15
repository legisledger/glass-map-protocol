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

async function loadProtocol(zipId) {
    // 1. Strip both the namespace AND any accidental double extensions
    const cleanZip = zipId.replace("gm:micro:", "").replace(".yml", "");
    console.log(`Analyzing Protocol for Zip: ${cleanZip}`);
    
    try {
        const [registryResponse, localResponse] = await Promise.all([
            fetch('../data/zip_registry.json'),
            fetch(`../data/micro/${cleanZip}.yml`) // This will now correctly evaluate to exactly '08055.yml'
        ]);

        // 2. HTTP GUARD: Catch the 404 before it hits the YAML parser
        if (!localResponse.ok) {
            throw new Error(`HTTP ${localResponse.status} - Could not locate micro-district file for '${cleanZip}.yml'`);
        }
        if (!registryResponse.ok) {
            throw new Error(`HTTP ${registryResponse.status} - Master Registry JSON missing.`);
        }

        const masterRegistry = await registryResponse.json();
        const yamlText = await localResponse.text();
        const localData = jsyaml.load(yamlText);

        const clusterResult = GravityEngine.calculateCluster(cleanZip, masterRegistry);

        if (!clusterResult) {
            throw new Error(`Zip ID ${cleanZip} could not be resolved in the Master Registry.`);
        }

        renderGlassMap(localData, clusterResult.neighbors, clusterResult);
        updateServiceLedger(localData);

    } catch (err) {
        console.error("Protocol Analysis Failure:", err);
        const mapCanvas = document.querySelector('.map-pane .pane-content');
        if (mapCanvas) {
            mapCanvas.innerHTML = `<p style="color:#ef4444; padding:20px; font-size:0.7rem; font-family:monospace;">Protocol Breach: ${err.message}</p>`;
        }
    }
}

 /**
 * ADMINISTRATIVE GRAVITY ENGINE
 * Purpose: Accumulate neighboring population until the 1789 Standard is reached 
 * balancing geographic distance and infrastructure alignment.
 */
const GravityEngine = {
    TARGET_MASS: PROTOCOL_STANDARD, // 60,000 (1789 Standard)
    TOLERANCE: 5000,

    // NEW: Dynamic Multi-Constraint Cluster Calculation
    calculateCluster: function(anchorId, masterRegistry) {
        const anchor = masterRegistry.find(z => z.id === anchorId);
        if (!anchor) return null;

        // 1. Calculate weighted distances to all other nodes
        const candidates = masterRegistry
            .filter(z => z.id !== anchorId)
            .map(node => {
                // Geometric Euclidean Distance
                const dx = node.x - anchor.x;
                const dy = node.y - anchor.y;
                const rawDistance = Math.sqrt(dx * dx + dy * dy);

                // Infrastructure Alignment Check
                const sharesAquifer = anchor.infrastructure?.aquifer !== "None" && 
                                      anchor.infrastructure?.aquifer === node.infrastructure?.aquifer;

                // Weighted Distance: Reduce effective distance by 35% if they share infrastructure
                const weightMultiplier = sharesAquifer ? 0.65 : 1.0;
                const weightedDistance = rawDistance * weightMultiplier;

                return { ...node, rawDistance, weightedDistance };
            });

        // 2. Sort candidates by closest weighted distance
        candidates.sort((a, b) => a.weightedDistance - b.weightedDistance);

        // 3. Accumulate mass until the 1789 Constitutional Standard is met
        let totalPopulation = anchor.population;
        const memberZips = [anchor.id];
        const dynamicNeighbors = [];

        for (const candidate of candidates) {
            if (totalPopulation >= this.TARGET_MASS) break;
            
            totalPopulation += candidate.population;
            memberZips.push(candidate.id);
            dynamicNeighbors.push({
                id: candidate.id,
                population: candidate.population,
                // Keep the relative geometric position for drawing
                x: candidate.x - anchor.x,
                y: candidate.y - anchor.y
            });
        }

        const isStable = totalPopulation >= (this.TARGET_MASS - this.TOLERANCE);

        return {
            anchor_id: anchorId,
            total_population: totalPopulation,
            member_zips: memberZips,
            is_stable: isStable,
            neighbors: dynamicNeighbors
        };
    }
};

function renderGlassMap(anchorData, neighbors, computedCluster) {
    if (!mapCanvas) return;
    mapCanvas.innerHTML = ""; 
    
    let svgHtml = "";
    const neighborsToDraw = neighbors || [];

    // 1. USE THE COMPUTED BACKEND CLUSTER DIRECTLY
    const result = computedCluster; 
    
    // 2. SCALE SPATIAL COORDINATES FOR THE SCREEN
    // Scale up the dynamic x/y offsets from the registry for visual clarity
    neighborsToDraw.forEach(zip => {
        zip.x = zip.x * 1.5; 
        zip.y = zip.y * 1.5;
    });

    // Anchor is always at the screen center origin before scaling
    anchorData.x = 0;
    anchorData.y = 0;

    const allPoints = [anchorData, ...neighborsToDraw];
    const scale = 100; 
    const centerX = 300;
    const centerY = 250;

    // 3. SVG COORDINATE SYSTEM DEFINITION
    svgHtml = `<svg viewBox="0 0 600 600" class="w-full h-full" style="background:#000;">`;

    // 4. DRAW GRAVITY BONDS (Lines)
    result.member_zips.forEach(zipId => {
        // Clean the incoming ID so it matches our registry style formatting
        const cleanZipId = zipId.replace("gm:micro:", "");
        const cleanAnchorId = anchorData.id.replace("gm:micro:", "");

        // Find the coordinates in our compiled points list
        const zipData = allPoints.find(z => z.id.replace("gm:micro:", "") === cleanZipId);
        
        // Only draw a bond line if it exists and isn't the central anchor itself
        if (zipData && cleanZipId !== cleanAnchorId) {
            svgHtml += `
                <line x1="${centerX}" y1="${centerY}" 
                      x2="${zipData.x * scale + centerX}" y2="${zipData.y * scale + centerY}" 
                      stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4" opacity="0.6" />`;
        }
    });

    // 5. DRAW ZIP BRICKS
    allPoints.forEach(item => {
        const cleanItemId = item.id.replace("gm:micro:", "");
        const cleanAnchorId = anchorData.id.replace("gm:micro:", "");
        
        // Determine membership status safely using cleaned string matching
        const isMember = result.member_zips.map(id => id.replace("gm:micro:", "")).includes(cleanItemId);
        const isAnchor = cleanItemId === cleanAnchorId;
        
        const posX = item.x * scale + centerX - 30; 
        const posY = item.y * scale + centerY - 30;

        svgHtml += `
            <g class="zip-brick" style="cursor:pointer;" transform="translate(${posX}, ${posY})">
                <rect width="60" height="60" rx="4"
                      fill="${isAnchor ? '#1e40af' : (isMember ? '#1e3a8a' : '#111')}" 
                      stroke="${isMember ? '#3b82f6' : '#333'}" 
                      stroke-width="${isAnchor ? '3' : '1'}" />
                <text x="30" y="25" fill="white" font-size="12" font-weight="bold" text-anchor="middle">${cleanItemId}</text>
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

    let infraHtml = "";
    if (data.infrastructure && data.infrastructure.aquifer) {
        const aq = data.infrastructure.aquifer;
        infraHtml = `
            <div class="infra-card" style="margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                <div style="font-size:0.6rem; color:#888; text-transform:uppercase;">Infrastructure Anchor</div>
                <div style="color:#10b981; font-weight:bold; font-size:0.8rem;">${aq.name} Aquifer</div>
                <div style="font-size:0.65rem; color:#aaa;">Type: ${aq.type} | Status: ${aq.status}</div>
            </div>
        `;
    }
    
    // Render Services
    ledgerContent.innerHTML = infraHtml + data.services.map(s => `
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
