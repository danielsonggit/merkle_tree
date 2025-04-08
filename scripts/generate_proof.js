const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
    try {
        // 1. 读取输入文件
        console.log("Reading input file...");
        const input = JSON.parse(fs.readFileSync("input.json"));

        // 2. 生成证明
        console.log("Generating proof...");
        const { proof, publicSignals } = await snarkjs.plonk.fullProve(
            input,
            "merkle_tree_js/merkle_tree.wasm",
            "merkle_tree.zkey"
        );

        // 3. 保存证明和公共输入
        console.log("Saving proof and public signals...");
        fs.writeFileSync("proof.json", JSON.stringify(proof, null, 2));
        fs.writeFileSync("public.json", JSON.stringify(publicSignals, null, 2));

        console.log("Proof generated successfully!");

        // 4. 验证证明
        console.log("\nVerifying proof...");
        const vKey = JSON.parse(fs.readFileSync("verification_key.json"));
        const verified = await snarkjs.plonk.verify(vKey, publicSignals, proof);
        console.log("Verification result:", verified);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
    }
}

main().catch(console.error); 