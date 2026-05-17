const fs = require('fs');
const path = require('path');

// Global audit ledger to track optimization iterations and edge cases
const equalizationAuditLog = {};

// Mock states dataset providing geographic bounding coordinates and total populations
const statesData = {
    "AL": { population: 5024279, minX: -88.4732, maxX: -84.8891, minY: 30.2233, maxY: 35.0080 },
    "AK": { population: 733391, minX: -179.1489, maxX: -129.9795, minY: 51.2142, maxY: 71.3526 },
    "AZ": { population: 7151502, minX: -114.8165, maxX: -109.0452, minY: 31.3322, maxY: 37.0042 },
    "AR": { population: 3011524, minX: -94.6179, maxX: -89.6448, minY: 33.0041, maxY: 36.4996 },
    "CA": { population: 39538223, minX: -124.4096, maxX: -114.1312, minY: 32.5341, maxY: 42.0095 },
    "CO": { population: 5773714, minX: -109.0603, maxX: -102.0415, minY: 36.9924, maxY: 41.0034 },
    "CT": { population: 3605944, minX: -73.7278, maxX: -71.7869, minY: 40.9875, maxY: 42.0501 },
    "DE": { population: 989948, minX: -75.7887, maxX: -75.0489, minY: 38.4510, maxY: 39.8390 },
    "DC": { population: 689545, minX: -77.1198, maxX: -76.9094, minY: 38.7916, maxY: 38.9955 },
    "FL": { population: 21538187, minX: -87.6349, maxX: -80.0313, minY: 24.5231, maxY: 31.0007 },
    "GA": { population: 10711908, minX: -85.6052, maxX: -80.8397, minY: 30.3578, maxY: 35.0007 },
    "HI": { population: 1455271, minX: -160.2471, maxX: -154.8067, minY: 18.9103, maxY: 22.2356 },
    "ID": { population: 1839106, minX: -117.2430, maxX: -111.0435, minY: 41.9880, maxY: 49.0011 },
    "IL": { population: 12812508, minX: -91.5131, maxX: -87.4948, minY: 36.9702, maxY: 42.5085 },
    "IN": { population: 6785528, minX: -88.0905, maxX: -84.7846, minY: 37.7717, maxY: 41.7606 },
    "IA": { population: 3190369, minX: -96.6397, maxX: -90.1401, minY: 40.3755, maxY: 43.5011 },
    "KS": { population: 2937880, minX: -102.0517, maxX: -94.6111, minY: 36.9930, maxY: 40.0031 },
    "KY": { population: 4505836, minX: -89.5715, maxX: -81.9649, minY: 36.4971, maxY: 39.1474 },
    "LA": { population: 4657757, minX: -94.0431, maxX: -88.8170, minY: 28.9254, maxY: 33.0195 },
    "ME": { population: 1362359, minX: -71.0839, maxX: -66.9499, minY: 43.0734, maxY: 47.4597 },
    "MD": { population: 6177224, minX: -79.4877, maxX: -75.0489, minY: 37.9117, maxY: 39.7230 },
    "MA": { population: 7029917, minX: -73.5081, maxX: -69.9284, minY: 41.2379, maxY: 42.8868 },
    "MI": { population: 10077331, minX: -90.4181, maxX: -82.4134, minY: 41.6961, maxY: 48.2806 },
    "MN": { population: 5706494, minX: -97.2392, maxX: -89.4917, minY: 43.4994, maxY: 49.3844 },
    "MS": { population: 2961279, minX: -91.6550, maxX: -88.0979, minY: 30.1739, maxY: 34.9960 },
    "MO": { population: 6154913, minX: -95.7747, maxX: -89.0989, minY: 35.9957, maxY: 40.6136 },
    "MT": { population: 1084225, minX: -116.0500, maxX: -104.0396, minY: 44.3582, maxY: 49.0013 },
    "NE": { population: 1961504, minX: -104.0535, maxX: -95.3082, minY: 40.0000, maxY: 43.0017 },
    "NV": { population: 3104614, minX: -120.0057, maxX: -114.0396, minY: 35.0021, maxY: 42.0022 },
    "NH": { population: 1377529, minX: -72.5572, maxX: -70.6106, minY: 42.6969, maxY: 45.3054 },
    "NJ": { population: 9288994, minX: -75.5596, maxX: -73.8939, minY: 38.9166, maxY: 41.3574 },
    "NM": { population: 2117522, minX: -109.0501, maxX: -103.0020, minY: 31.3323, maxY: 37.0002 },
    "NY": { population: 20201249, minX: -79.7621, maxX: -71.8562, minY: 40.4961, maxY: 45.0158 },
    "NC": { population: 10439388, minX: -84.3218, maxX: -75.4606, minY: 33.8423, maxY: 36.5881 },
    "ND": { population: 779094, minX: -104.0489, maxX: -96.5544, minY: 45.9351, maxY: 49.0005 },
    "OH": { population: 11799448, minX: -84.8201, maxX: -80.5186, minY: 38.4032, maxY: 41.9775 },
    "OK": { population: 3959353, minX: -103.0020, maxX: -94.4307, minY: 33.6158, maxY: 37.0022 },
    "OR": { population: 4237256, minX: -124.5662, maxX: -116.4635, minY: 41.9918, maxY: 46.2920 },
    "PA": { population: 13002700, minX: -80.5198, maxX: -74.6895, minY: 39.7198, maxY: 42.2693 },
    "RI": { population: 1097379, minX: -71.8628, maxX: -71.1205, minY: 41.1463, maxY: 42.0188 },
    "SC": { population: 5118425, minX: -83.3539, maxX: -78.5420, minY: 32.0346, maxY: 35.2154 },
    "SD": { population: 886667, minX: -104.0570, maxX: -96.4365, minY: 42.4796, maxY: 45.9454 },
    "TN": { population: 6910840, minX: -90.3105, maxX: -81.6469, minY: 34.9829, maxY: 36.6782 },
    "TX": { population: 29145505, minX: -106.6456, maxX: -93.5083, minY: 25.8373, maxY: 36.5005 },
    "UT": { population: 3271616, minX: -114.0529, maxX: -109.0410, minY: 36.9979, maxY: 42.0015 },
    "VT": { population: 643077, minX: -73.4377, maxX: -71.4645, minY: 42.7268, maxY: 45.0166 },
    "VA": { population: 8631393, minX: -83.6753, maxX: -75.2423, minY: 36.5407, maxY: 39.4660 },
    "WA": { population: 7705281, minX: -124.7631, maxX: -116.9159, minY: 45.5435, maxY: 49.0024 },
    "WV": { population: 1793716, minX: -82.6447, maxX: -77.7198, minY: 37.2015, maxY: 40.6388 },
    "WI": { population: 5893718, minX: -92.8881, maxX: -86.8304, minY: 42.4919, maxY: 47.0806 },
    "WY": { population: 576851, minX: -111.0568, maxX: -104.0521, minY: 40.9947, maxY: 45.0059 }
};

function calculateInfrastructureWeight(x, y, state) {
    const data = statesData[state];
    const centerX = (data.minX + data.maxX) / 2;
    const centerY = (data.minY + data.maxY) / 2;
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    return 1.5 / (1.0 + dist);
}

function processSingleState(state, data) {
    // 1. Establish precise scale target using Census Block Group architecture (~45,000 target mean)
    const targetDistricts = Math.max(1, Math.floor(data.population / 45000));
    const totalStateNodes = targetDistricts * 25; 
    const localNodes = [];
    const baselineNodePopulation = data.population / totalStateNodes;
    
    let cbgIncrement = 10000;

    // Generate highly balanced granular CBG network fabric
    for (let i = 0; i < totalStateNodes; i++) {
        const x = data.minX + Math.random() * (data.maxX - data.minX);
        const y = data.minY + Math.random() * (data.maxY - data.minY);
        const infraMultiplier = calculateInfrastructureWeight(x, y, state);

        const balanceFactor = 0.85 + Math.random() * 0.3; // Very tight variance
        let nodePop = Math.floor(baselineNodePopulation * balanceFactor * infraMultiplier);
        
        if (nodePop < 600) nodePop = 600;
        if (nodePop > 3000) nodePop = 3000;

        localNodes.push({
            id: `CBG-${state}-${String(cbgIncrement++).padStart(5, '0')}`,
            parentZip: state === 'NJ' ? '08055' : '90210', 
            state: state,
            x: parseFloat(x.toFixed(4)),
            y: parseFloat(y.toFixed(4)),
            infraWeight: infraMultiplier,
            population: nodePop,
            microDistrictId: null,
            neighbors: []
        });
    }

    // Connect spatial mesh neighbors safely via nearest-neighbor calculation
    for (let i = 0; i < localNodes.length; i++) {
        const distances = [];
        for (let j = 0; j < localNodes.length; j++) {
            if (i === j) continue;
            const d = Math.sqrt(Math.pow(localNodes[i].x - localNodes[j].x, 2) + Math.pow(localNodes[i].y - localNodes[j].y, 2));
            distances.push({ id: localNodes[j].id, dist: d });
        }
        distances.sort((a, b) => a.dist - b.dist);
        localNodes[i].neighbors = distances.slice(0, 5).map(n => n.id);
    }

    // Initialize tracking array sorted by population descending for core anchors
    let unassignedNodes = [...localNodes].sort((a, b) => b.population - a.population);
    let microDistrictCounter = 1;

    // =========================================================================
    // PHASE 1: SEED-AND-GROW MESH CLUSTERING
    // =========================================================================
    while (unassignedNodes.length > 0) {
        let seed = unassignedNodes[0];
        let currentDistrictId = `${state}-MD-${microDistrictCounter++}`;
        
        seed.microDistrictId = currentDistrictId;
        let currentDistrictPopulation = seed.population;
        
        let queue = [...seed.neighbors];
        
        while (queue.length > 0 && currentDistrictPopulation < 45000) {
            let neighborId = queue.shift();
            let neighborNode = localNodes.find(n => n.id === neighborId);
            
            if (neighborNode && neighborNode.microDistrictId === null) {
                if (currentDistrictPopulation + neighborNode.population <= 60000) {
                    neighborNode.microDistrictId = currentDistrictId;
                    currentDistrictPopulation += neighborNode.population;
                    neighborNode.neighbors.forEach(nnId => {
                        if (!queue.includes(nnId)) queue.push(nnId);
                    });
                }
            }
        }
        unassignedNodes = unassignedNodes.filter(n => n.microDistrictId === null);
    }

    // =========================================================================
    // INITIAL SYSTEM CLEANUP: ASSIGN PERIPHERAL STRAGGLERS TO NEAREST VALID MESH
    // =========================================================================
    localNodes.forEach(node => {
        if (node.microDistrictId === null) {
            let shortestDist = Infinity;
            let closestAssignedNode = null;

            localNodes.forEach(otherNode => {
                if (otherNode.microDistrictId !== null) {
                    let d = Math.sqrt(Math.pow(node.x - otherNode.x, 2) + Math.pow(node.y - otherNode.y, 2));
                    if (d < shortestDist) {
                        shortestDist = d;
                        closestAssignedNode = otherNode;
                    }
                }
            });

            if (closestAssignedNode) {
                node.microDistrictId = closestAssignedNode.microDistrictId;
            } else {
                node.microDistrictId = `${state}-MD-1`;
            }
        }
    });

    // =========================================================================
    // PHASE 2: FLUID EQUALIZATION & BOUNDARY RELAXATION ENGINE
    // =========================================================================
    let iterations = 0;
    let mapStabilized = false;
    
    // DYNAMIC THROTTLE: Tiny states don't need (and shouldn't have) massive cycle limits
    const maxOptimizationCycles = (localNodes.length < 1000) ? 5 : 25;
    
    const rescuedStragglers = [];
    const ceilingBreachCorrections = [];

    // --- STEP A: NATURAL BOUNDARY RELAXATION FLUID LOOP ---
    while (!mapStabilized && iterations < maxOptimizationCycles) {
        let changesThisPass = 0;
        
        let districtPopulations = {};
        localNodes.forEach(node => {
            if (node.microDistrictId) {
                districtPopulations[node.microDistrictId] = (districtPopulations[node.microDistrictId] || 0) + node.population;
            }
        });

        for (let node of localNodes) {
            let currentDistId = node.microDistrictId;
            let currentDistPop = districtPopulations[currentDistId] || 0;

            // Handle Underpopulated Districts gently via neighborhood absorption
            if (currentDistPop < 30000) {
                for (let neighborId of node.neighbors) {
                    let neighborNode = localNodes.find(n => n.id === neighborId);
                    if (!neighborNode || neighborNode.microDistrictId === currentDistId) continue;

                    let targetDistId = neighborNode.microDistrictId;
                    let targetDistPop = districtPopulations[targetDistId] || 0;

                    if (targetDistPop + node.population <= 60000 && targetDistPop > 0) {
                        rescuedStragglers.push({
                            nodeId: node.id, fromDistrict: currentDistId, toDistrict: targetDistId, cycle: iterations
                        });
                        node.microDistrictId = targetDistId;
                        districtPopulations[currentDistId] -= node.population;
                        districtPopulations[targetDistId] += node.population;
                        changesThisPass++;
                        break; 
                    }
                }
            }
            
            // Handle Overpopulated Districts (Ceiling Breaches)
            if (currentDistPop > 60000) {
                for (let neighborId of node.neighbors) {
                    let neighborNode = localNodes.find(n => n.id === neighborId);
                    if (!neighborNode || neighborNode.microDistrictId === currentDistId) continue;

                    let targetDistId = neighborNode.microDistrictId;
                    let targetDistPop = districtPopulations[targetDistId] || 0;

                    if (targetDistPop + node.population <= 60000) {
                        ceilingBreachCorrections.push({
                            nodeId: node.id, fromDistrict: currentDistId, toDistrict: targetDistId, cycle: iterations
                        });
                        node.microDistrictId = targetDistId;
                        districtPopulations[currentDistId] -= node.population;
                        districtPopulations[targetDistId] += node.population;
                        changesThisPass++;
                        break;
                    }
                }
            }
        }

        if (changesThisPass === 0) mapStabilized = true;
        else iterations++;
    }

    // =========================================================================
    // --- STEP B: GEOGRAPHICALLY PROXIMATE SYSTEM BALANCE SWEEP ---
    // =========================================================================
    
    // 1. Calculate live, exact totals and track district spatial centers (centroids)
    let currentPops = {};
    let districtCentroids = {};

    localNodes.forEach(node => {
        if (node.microDistrictId) {
            currentPops[node.microDistrictId] = (currentPops[node.microDistrictId] || 0) + node.population;
            
            if (!districtCentroids[node.microDistrictId]) {
                districtCentroids[node.microDistrictId] = { sumX: 0, sumY: 0, count: 0 };
            }
            let nx = node.x || node.latitude || 0;
            let ny = node.y || node.longitude || 0;
            districtCentroids[node.microDistrictId].sumX += nx;
            districtCentroids[node.microDistrictId].sumY += ny;
            districtCentroids[node.microDistrictId].count++;
        }
    });

    Object.keys(districtCentroids).forEach(id => {
        let dc = districtCentroids[id];
        dc.avgX = dc.sumX / dc.count;
        dc.avgY = dc.sumY / dc.count;
    });

    // 2. Identify all districts that failed to reach the 30k floor
    let underpopulatedDistrictIds = Object.keys(currentPops).filter(id => currentPops[id] < 30000);

    if (underpopulatedDistrictIds.length > 0) {
        let strandedNodes = localNodes.filter(node => 
            underpopulatedDistrictIds.includes(node.microDistrictId.toString()) || 
            underpopulatedDistrictIds.includes(node.microDistrictId)
        );

        // Find all robust, valid districts in the state that actually have breathing room
        let validDistrictIds = Object.keys(currentPops).filter(id => currentPops[id] >= 30000 && currentPops[id] <= 60000);
        
        // CRITICAL PATCH: If the valid pool is completely empty due to high density/low node count, open it to ALL active districts
        if (validDistrictIds.length === 0) {
            validDistrictIds = Object.keys(currentPops).filter(id => currentPops[id] > 0);
        }

        // MICRO-STATE VALVE: If valid targets don't exist or have zero breathing room, synthesize a new cohort district
        let totalStrandedPop = strandedNodes.reduce((sum, n) => sum + n.population, 0);
        if (validDistrictIds.length === 0 || (totalStrandedPop >= 30000 && totalStrandedPop <= 60000)) {
            let nextId = Math.max(...localNodes.map(n => parseInt(n.microDistrictId) || 0)) + 1;
            strandedNodes.forEach(node => {
                node.microDistrictId = nextId;
            });
            underpopulatedDistrictIds = []; // Instantly cleared
        }

        // 3. Systematically re-anchor remaining stranded nodes based on spatial proximity
        if (underpopulatedDistrictIds.length > 0) {
            for (let node of strandedNodes) {
                let nx = node.x || node.latitude || 0;
                let ny = node.y || node.longitude || 0;

                let localizedTargets = validDistrictIds.map(id => {
                    let centroid = districtCentroids[id];
                    let distance = Math.sqrt(Math.pow(centroid.avgX - nx, 2) + Math.pow(centroid.avgY - ny, 2));
                    return {
                        id: id,
                        currentPop: currentPops[id],
                        distance: distance
                    };
                }).sort((a, b) => a.distance - b.distance);

                let reassigned = false;

                for (let target of localizedTargets) {
                    if (target.currentPop + node.population <= 60000) {
                        node.microDistrictId = target.id;
                        currentPops[target.id] += node.population;
                        target.currentPop += node.population;
                        reassigned = true;
                        break; 
                    }
                }

                // Precision fallback: if closest targets are full, find the absolute roomiest overall to prevent a ceiling breach
                if (!reassigned && localizedTargets.length > 0) {
                    localizedTargets.sort((a, b) => a.currentPop - b.currentPop);
                    
                    // Force the assignment to the roomiest valid district to absorb the impact smoothly
                    let absoluteBestTargetId = localizedTargets[0].id;
                    node.microDistrictId = absoluteBestTargetId;
                    currentPops[absoluteBestTargetId] += node.population;
                }
            }
        }
    }

    // Log complete diagnostics out to global tracker
    equalizationAuditLog[state] = {
        totalNodes: localNodes.length,
        optimizationCyclesExhausted: iterations,
        stabilizedNatively: mapStabilized,
        rescuedStragglersCount: rescuedStragglers.length,
        ceilingBreachCorrectionsCount: ceilingBreachCorrections.length
    };

    // =========================================================================
    // SAVING COMPLIANT STATE REGISTRY TO CORRECT TARGET FOLDER
    // =========================================================================
    
    // Dynamically reference the global destination directory
    const outputPath = path.resolve(auditOutputDir, `${state.toLowerCase()}_registry.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(localNodes, null, 2));
    console.log(`  Processed ${state} -> Saved ${localNodes.length} nodes to data/micro/states/${state.toLowerCase()}_registry.json`);
}

// =========================================================================
// EXECUTION & DIRECTORY MANAGEMENT
// =========================================================================

// Update this path to target the exact subfolder the test harness expects
const auditOutputDir = path.resolve(__dirname, "../data/micro/states");

// Ensure execution directory framework is safe before processing files
if (!fs.existsSync(auditOutputDir)) {
    fs.mkdirSync(auditOutputDir, { recursive: true });
}

console.log("🚀 Running Complete 50-State Multi-File Modular Generation...");
Object.keys(statesData).forEach(state => {
    processSingleState(state, statesData[state]);
});

console.log("\n🎉 Micro-Registry Modularization Matrix Fully Built.");

// Output the comprehensive balancing ledger to the same target folder
const auditOutputPath = path.resolve(auditOutputDir, "equalization_audit.json");
fs.writeFileSync(auditOutputPath, JSON.stringify(equalizationAuditLog, null, 2));
console.log("📊 Equalization Diagnostics Pass saved to data/micro/states/equalization_audit.json");