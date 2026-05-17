/**
 * Glass Map Protocol (GM-P) - Multi-File Modular QA Suite
 * File: test/pipeline.test.js
 */
const fs = require('fs');
const path = require('path');

function runModularValidation() {
    console.log("🚀 Initializing GM-P State-by-State Verification Engine...");
    const statesDir = path.join(__dirname, '../data/micro/states');

    if (!fs.existsSync(statesDir)) {
        console.error("❌ Test Failure: Target states directory does not exist. Run generation first.");
        process.exit(1);
    }

    const files = fs.readdirSync(statesDir).filter(f => f.endsWith('_registry.json'));
    console.log(`📂 Found ${files.length} state micro-registries for auditing.\n`);

    let globalFailures = 0;
    let totalGlobalNodes = 0;

    files.forEach(file => {
        const stateCode = file.split('_')[0].toUpperCase();
        const registry = JSON.parse(fs.readFileSync(path.join(statesDir, file), 'utf8'));
        totalGlobalNodes += registry.length;

        const districtPopulations = {};
        const districtBounds = {};
        let stateViolations = 0;

        registry.forEach(node => {
            // State boundary checking (Cross-contamination sanity test)
            if (node.state !== stateCode) stateViolations++;

            // Population mapping
            if (!districtPopulations[node.microDistrictId]) districtPopulations[node.microDistrictId] = 0;
            districtPopulations[node.microDistrictId] += node.population;

            // Geometry bounds mapping
            if (!districtBounds[node.microDistrictId]) {
                districtBounds[node.microDistrictId] = { minX: node.x, maxX: node.x, minY: node.y, maxY: node.y };
            } else {
                const b = districtBounds[node.microDistrictId];
                if (node.x < b.minX) b.minX = node.x;
                if (node.x > b.maxX) b.maxX = node.x;
                if (node.y < b.minY) b.minY = node.y;
                if (node.y > b.maxY) b.maxY = node.y;
            }
        });

        // Evaluate constraints for this isolated state block
        let popErrors = 0, shapeErrors = 0;
        
        Object.entries(districtPopulations).forEach(([id, pop]) => {
            if (pop < 30000 || pop > 60000) popErrors++;
        });

        Object.entries(districtBounds).forEach(([id, b]) => {
            const diameter = Math.sqrt(Math.pow(b.maxX - b.minX, 2) + Math.pow(b.maxY - b.minY, 2));
            if (diameter > 250.0) shapeErrors++;
        });

        if (stateViolations === 0 && popErrors === 0 && shapeErrors === 0) {
            console.log(`  ✅ [${stateCode}] Passed -> Verified ${registry.length} nodes.`);
        } else {
            console.error(`  ❌ [${stateCode}] FAILED Validation Audit -> Leakages: ${stateViolations}, Pop Errors: ${popErrors}, Compactness Errors: ${shapeErrors}`);
            globalFailures++;
        }
    });

    console.log("\n--------------------------------------------------");
    if (globalFailures === 0) {
        console.log(`🎉 Success! All ${files.length} states successfully verified (${totalGlobalNodes.toLocaleString()} total nodes). Matrix is green!`);
        process.exit(0);
    } else {
        console.error(`💥 Pipeline Rejected: ${globalFailures} state modules failed compliance requirements.`);
        process.exit(1);
    }
}

runModularValidation();