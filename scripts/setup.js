const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
    try {
        // 1. 生成 powers of tau
        console.log("Generating powers of tau...");
        await snarkjs.powersOfTau.new(12, "pot12_0000.ptau", "blake2b");
        await snarkjs.powersOfTau.contribute("pot12_0000.ptau", "pot12_0001.ptau", "First contribution", "entropy1");
        await snarkjs.powersOfTau.preparePhase2("pot12_0001.ptau", "pot12_final.ptau");

        // 2. 生成 proving key
        console.log("Generating proving key...");
        await snarkjs.plonk.setup("merkle_tree.r1cs", "pot12_final.ptau", "merkle_tree.zkey");

        // 3. 导出验证 key
        console.log("Exporting verification key...");
        const vKey = await snarkjs.zKey.exportVerificationKey("merkle_tree.zkey");
        fs.writeFileSync("verification_key.json", JSON.stringify(vKey, null, 2));

        console.log("Setup completed successfully!");
    } catch (error) {
        console.error("Error:", error.message);
        if (error.message.includes("Cannot find module")) {
            console.log("\nTip: Make sure the r1cs file exists at merkle_tree.r1cs");
        }
    }
}

main().catch(console.error); 