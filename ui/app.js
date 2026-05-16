/**
 * GLASS MAP PROTOCOL - CORE ENGINE
 * Standard: 1789 1st Senate (1:60,000)
 */

console.log("Glass Map Protocol UI Initialized.");

const PROTOCOL_STANDARD = 60000; // Locked Configuration

let mapCanvas;

// =========================================================================
// GLOBAL STATE MATRIX (Unified Control Framework)
// =========================================================================
const AppState = {
    activeAnchor: null,   // Holds the current anchor ZIP object data
    neighbors: [],        // Holds the array of adjacent ZIP data
    activeCluster: null,  // Holds the active backend computed cluster layout
    layers: {
        borders: false,   // Tracks toggle status of Jurisdictional Borders
        aquifer: false    // Tracks toggle status of Aquifer Spatial Overlay
    }
};

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

function renderGlassMap(cleanZip, masterRegistry, clusterResult) {
    if (!mapCanvas) {
        mapCanvas = document.querySelector('.map-pane .pane-content');
    }
    if (!mapCanvas) return;
    mapCanvas.innerHTML = ""; 

    // ─── 1. EXTRACT PROPERTY STRUCTURES WITH IMMUTABLE COPIES ──────────────
    const rawAnchor = masterRegistry && Array.isArray(masterRegistry)
        ? masterRegistry.find(item => item && item.id === cleanZip)
        : null;
    const anchorData = rawAnchor ? { ...rawAnchor } : null;

    const neighborsToDraw = (clusterResult && clusterResult.member_zips || []).map(zip => {
        if (!masterRegistry || !Array.isArray(masterRegistry)) return null;
        const match = masterRegistry.find(item => item && item.id === zip);
        return match ? { ...match } : null;
    }).filter(p => p !== null);

    // ─── 2. PERSIST DATA IN GLOBAL APP STATE CACHE ───────────────────────────
    if (cleanZip && masterRegistry && clusterResult) {
        AppState.activeAnchor = anchorData;
        AppState.neighbors = neighborsToDraw;
        AppState.activeCluster = clusterResult;
    }

    // ─── 3. RESILIENT FALLBACKS FOR LAYER BUTTON REPAINTS ────────────────────
    const finalAnchor = anchorData || AppState.activeAnchor;
    const finalNeighbors = neighborsToDraw.length ? neighborsToDraw : AppState.neighbors;
    const finalCluster = clusterResult || AppState.activeCluster;
    const result = finalCluster; 

    if (!finalAnchor || !finalCluster) {
        console.log("Map Canvas resting: Initializing baseline spatial vectors...");
        return;
    }

    let svgHtml = "";

    // ─── 4. DYNAMIC AUTO-BOUNDING BOX CALCULATION ───────────────────────────
    const padding = 70;  
    const width = 600;   
    const height = 500;  

    // CRITICAL MATH FIX: Compile the list of points BEFORE resetting anchor coordinates to 0,0
    const allPoints = [ { ...finalAnchor }, ...finalNeighbors ];

    // Find the exact mathematical boundaries using the true database coordinates
    const xValues = allPoints.map(p => p.x);
    const yValues = allPoints.map(p => p.y);
    
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const deltaX = (maxX - minX) || 1;
    const deltaY = (maxY - minY) || 1;

    // Calculate the absolute optimal scale to fit everything perfectly
    const scaleX = (width - padding * 2) / deltaX;
    const scaleY = (height - padding * 2) / deltaY;
    const scale = Math.min(scaleX, scaleY, 120); 

    // Dynamically calculate the center point to align the entire matrix perfectly
    const centerX = width / 2 - ((minX + maxX) / 2) * scale;
    const centerY = height / 2 - ((minY + maxY) / 2) * scale;

    // =========================================================================
    // 5. SVG COORDINATE SYSTEM DEFINITION & CANVAS BACKGROUND
    // =========================================================================
    svgHtml = `<svg viewBox="0 0 ${width} 600" class="w-full h-full" style="background:#000;">`;

    // ─── LAYER OVERLAYS: JURISDICTIONAL BORDERS (Neon Cyan Matrix) ───────────
    if (AppState.layers.borders) {
        svgHtml += `
            <g class="layer-borders">
                <rect x="15" y="15" width="${width - 30}" height="570" 
                      fill="none" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.85"/>
                <text x="30" y="35" fill="#06b6d4" font-size="10" font-family="monospace" letter-spacing="1">JURISDICTIONAL BOUNDARY ACTIVE</text>
            </g>
        `;
    }

    // ─── LAYER OVERLAYS: AQUIFER VECTOR OVERLAY (Emerald Cyber Wave) ─────────
    if (AppState.layers.aquifer && finalAnchor.infrastructure?.aquifer) {
        svgHtml += `
            <g class="layer-aquifer">
                <path d="M 30 450 Q 150 390 300 450 T 570 450" 
                      fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="6 3" opacity="0.75"/>
                <text x="30" y="430" fill="#10b981" font-size="10" font-family="monospace" letter-spacing="1">SYSTEMIC OVERLAY: ${finalAnchor.infrastructure.aquifer.toUpperCase()}</text>
            </g>
        `;
    }

    // ─── 6. DRAW GRAVITY BONDS (Lines) ───────────────────────────────────────
    result.member_zips.forEach(zipId => {
        const cleanZipId = zipId.replace("gm:micro:", "");
        const cleanAnchorId = finalAnchor.id.replace("gm:micro:", "");
        const zipData = allPoints.find(z => z.id.replace("gm:micro:", "") === cleanZipId);
        
        if (zipData && cleanZipId !== cleanAnchorId) {
            svgHtml += `
                <line x1="${finalAnchor.x * scale + centerX}" y1="${finalAnchor.y * scale + centerY}" 
                      x2="${zipData.x * scale + centerX}" y2="${zipData.y * scale + centerY}" 
                      stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4" opacity="0.6" />`;
        }
    });

    // ─── 7. DRAW ZIP BRICKS ──────────────────────────────────────────────────
    allPoints.forEach(item => {
        const cleanItemId = item.id.replace("gm:micro:", "");
        const cleanAnchorId = finalAnchor.id.replace("gm:micro:", "");
        
        const isMember = result.member_zips.map(id => id.replace("gm:micro:", "")).includes(cleanItemId);
        const isAnchor = cleanItemId === cleanAnchorId;
        
        const posX = item.x * scale + centerX - 30; 
        const posY = item.y * scale + centerY - 30;

        svgHtml += `
            <g class="zip-brick" style="cursor:pointer;" transform="translate(${posX}, ${posY})">
                <rect width="60" height="60" rx="4"
                      fill="${isAnchor ? '#1e40af' : (isMember ? '#1e3a8a' : '#111')}" 
                      stroke="${isAnchor ? '#60a5fa' : (isMember ? '#3b82f6' : '#333')}" 
                      stroke-width="${isAnchor ? '2.5' : '1'}" />
                <text x="30" y="25" fill="white" font-size="11" font-family="monospace" font-weight="bold" text-anchor="middle">${cleanItemId}</text>
                <text x="30" y="43" fill="${isMember ? '#93c5fd' : '#666'}" font-size="9" font-family="monospace" text-anchor="middle">
                    ${(item.population / 1000).toFixed(1)}k
                </text>
            </g>`;
    });
    
    // ─── 8. DRAW THE 1789 STANDARD PROGRESS BAR ──────────────────────────────
    const progress = Math.min((result.total_population / PROTOCOL_STANDARD) * 100, 100);
    const barColor = result.is_stable ? '#10b981' : '#f59e0b';

    svgHtml += `
        <g transform="translate(50, 520)">
            <text y="-15" fill="white" font-size="11" font-family="monospace" font-weight="bold" style="letter-spacing:0.05em;">
                ${result.is_stable ? 'STABLE MICRO-DISTRICT' : 'UNDER-SCALED'} 
                | ${result.total_population.toLocaleString()} / ${PROTOCOL_STANDARD.toLocaleString()}
            </text>
            <rect width="500" height="8" fill="#222" rx="4" />
            <rect width="${progress * 5}" height="8" fill="${barColor}" rx="4" style="transition: width 0.5s ease;" />
        </g>`;

    // ─── 9. THE PROTOCOL VERIFIED BADGE ──────────────────────────────────────
    if (result.is_stable) {
        svgHtml += `
            <g transform="translate(430, 485)">
                <circle r="6" fill="#10b981" />
                <path d="M-2.5 0 L-1 1.5 L3.5 -2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" />
                <text x="12" y="3" fill="#10b981" font-size="9" font-family="monospace" font-weight="bold" style="letter-spacing:0.05em;">1789 STANDARD VERIFIED</text>
            </g>`;
    }

    svgHtml += `</svg>`;
    
    // Final Commit to Viewport
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

// =========================================================================
// LAYER CONTROL EVENT LISTENERS (IOC Milestone Feature)
// =========================================================================
function initializeLayerControls() {
    const borderBtn = document.getElementById('btn-borders');
    const aquiferBtn = document.getElementById('btn-aquifer');

    // Helper function to explicitly paint the border button's visual state
    function updateBorderButtonVisual() {
        if (!borderBtn) return;
        if (AppState.layers.borders) {
            // Active State: Illuminated Cyan Border & Subtle Fill
            borderBtn.style.border = "1.5px solid #06b6d4";
            borderBtn.style.color = "#06b6d4";
            borderBtn.style.background = "rgba(6, 182, 212, 0.15)";
            borderBtn.innerHTML = "Borders: ACTIVE";
        } else {
            // Default State: Muted Gray Framework
            borderBtn.style.border = "1px solid #333";
            borderBtn.style.color = "#999";
            borderBtn.style.background = "transparent";
            borderBtn.innerHTML = "Borders";
        }
    }

    // Helper function to explicitly paint the aquifer button's visual state
    function updateAquiferButtonVisual() {
        if (!aquiferBtn) return;
        if (AppState.layers.aquifer) {
            // Active State: Illuminated Emerald Border & Subtle Fill
            aquiferBtn.style.border = "1.5px solid #10b981";
            aquiferBtn.style.color = "#10b981";
            aquiferBtn.style.background = "rgba(16, 185, 129, 0.15)";
            aquiferBtn.innerHTML = "Aquifer: ACTIVE";
        } else {
            // Default State: Muted Gray Framework
            aquiferBtn.style.border = "1px solid #333";
            aquiferBtn.style.color = "#999";
            aquiferBtn.style.background = "transparent";
            aquiferBtn.innerHTML = "Aquifer";
        }
    }

    if (borderBtn) {
        updateBorderButtonVisual(); // Synchronize on initial render
        borderBtn.addEventListener('click', () => {
            AppState.layers.borders = !AppState.layers.borders;
            renderGlassMap();          // Repaint the SVG canvas
            updateBorderButtonVisual(); // Lock in the button UI appearance
        });
    }

    if (aquiferBtn) {
        updateAquiferButtonVisual(); // Synchronize on initial render
        aquiferBtn.addEventListener('click', () => {
            AppState.layers.aquifer = !AppState.layers.aquifer;
            renderGlassMap();          // Repaint the SVG canvas
            updateAquiferButtonVisual(); // Lock in the button UI appearance
        });
    }
}

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

        // Then your existing render execution fires exactly as it did before:
        renderGlassMap(cleanZip, masterRegistry, clusterResult);
        updateServiceLedger(localData);

    } catch (err) {
        console.error("Protocol Analysis Failure:", err);
        const mapCanvas = document.querySelector('.map-pane .pane-content');
        if (mapCanvas) {
            mapCanvas.innerHTML = `<p style="color:#ef4444; padding:20px; font-size:0.7rem; font-family:monospace;">Protocol Breach: ${err.message}</p>`;
        }
    }
}

window.onload = () => {
    // 1. Assign global canvas element safely now that the DOM is fully constructed
    mapCanvas = document.querySelector('.map-pane .pane-content');
    
    // 2. Bind the layer control button clicks safely
    initializeLayerControls();
    
    // 3. Bind your file-switching sidebar safely
    const fileSelector = document.getElementById('file-selector');
    if (fileSelector) {
        fileSelector.addEventListener('click', async (e) => {
            const target = e.target.closest('.file-item');
            if (!target) return;

            // UI Feedback: Update active state
            document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
            target.classList.add('active');

            const fileName = target.getAttribute('data-file');
            await loadProtocol(fileName);
        });
    }
    
    // 4. Boot up your initial default district view
    loadProtocol('08055.yml');
};
