const { buildPoseidon } = require("circomlibjs");
const { wasm } = require("circom_tester");
const path = require("path");
const fs = require("fs");

// 简单的 Merkle Tree 实现
class SimpleMerkleTree {
    constructor(leaves, hashFn) {
        this.leaves = leaves;
        this.hashFn = hashFn;
        this.layers = [leaves];
        this.buildTree();
    }

    buildTree() {
        let layer = this.leaves;
        while (layer.length > 1) {
            const nextLayer = [];
            for (let i = 0; i < layer.length; i += 2) {
                const left = layer[i];
                const right = i + 1 < layer.length ? layer[i + 1] : "0";
                nextLayer.push(this.hashFn(left, right));
            }
            this.layers.push(nextLayer);
            layer = nextLayer;
        }
    }

    get root() {
        return this.layers[this.layers.length - 1][0];
    }

    getProof(index) {
        const proof = {
            pathElements: [],
            pathIndices: []
        };

        for (let i = 0; i < this.layers.length - 1; i++) {
            const layer = this.layers[i];
            const isRightNode = index % 2;
            const siblingIndex = isRightNode ? index - 1 : index + 1;
            const sibling = siblingIndex < layer.length ? layer[siblingIndex] : "0";

            proof.pathElements.push(sibling);
            proof.pathIndices.push(isRightNode);

            index = Math.floor(index / 2);
        }

        return proof;
    }

    verify(proof, leaf, root) {
        let computedHash = leaf;
        for (let i = 0; i < proof.pathElements.length; i++) {
            const sibling = proof.pathElements[i];
            const isRightNode = proof.pathIndices[i];

            if (isRightNode) {
                computedHash = this.hashFn(sibling, computedHash);
            } else {
                computedHash = this.hashFn(computedHash, sibling);
            }
        }

        return computedHash === root;
    }
}

async function main() {
    // 初始化 Poseidon 哈希函数
    const poseidon = await buildPoseidon();

    // 创建测试数据
    const leaves = [];
    for (let i = 1; i <= 8; i++) {
        const leaf = poseidon.F.toString(poseidon([BigInt(i)]));
        leaves.push(leaf);
        console.log(`Leaf ${i}:`, leaf);
    }

    // 手动构建 Merkle Tree
    console.log("\n计算第一层哈希：");
    const level1 = [];
    for (let i = 0; i < 8; i += 2) {
        const left = leaves[i];
        const right = leaves[i + 1];
        const hash = poseidon.F.toString(poseidon([BigInt(left), BigInt(right)]));
        level1.push(hash);
        console.log(`Hash(${i},${i + 1}):`, hash);
        console.log(`  Left: ${left}`);
        console.log(`  Right: ${right}`);
    }

    console.log("\n计算第二层哈希：");
    const level2 = [];
    for (let i = 0; i < 4; i += 2) {
        const left = level1[i];
        const right = level1[i + 1];
        const hash = poseidon.F.toString(poseidon([BigInt(left), BigInt(right)]));
        level2.push(hash);
        console.log(`Hash(${i},${i + 1}):`, hash);
        console.log(`  Left: ${left}`);
        console.log(`  Right: ${right}`);
    }

    console.log("\n计算根节点：");
    const left = level2[0];
    const right = level2[1];
    const root = poseidon.F.toString(poseidon([BigInt(left), BigInt(right)]));
    console.log("Root:", root);
    console.log(`  Left: ${left}`);
    console.log(`  Right: ${right}`);

    // 为第三个叶子节点（索引2）生成证明
    const proof = {
        leaf: leaves[2],
        pathElements: [
            leaves[3],      // 兄弟节点
            level1[0],      // 另一对的哈希
            level2[1]       // 另一分支的哈希
        ],
        pathIndices: [0, 1, 0], // 表示目标节点在每一层的位置
        root: root
    };

    // 验证路径
    console.log("\n验证路径：");
    let currentHash = proof.leaf;
    for (let i = 0; i < proof.pathElements.length; i++) {
        const sibling = proof.pathElements[i];
        const isRight = proof.pathIndices[i];

        console.log(`\n第 ${i + 1} 层：`);
        console.log(`当前哈希: ${currentHash}`);
        console.log(`兄弟节点: ${sibling}`);
        console.log(`方向: ${isRight ? '右' : '左'}`);

        if (isRight) {
            currentHash = poseidon.F.toString(poseidon([BigInt(sibling), BigInt(currentHash)]));
        } else {
            currentHash = poseidon.F.toString(poseidon([BigInt(currentHash), BigInt(sibling)]));
        }
        console.log(`计算结果: ${currentHash}`);
    }

    console.log("\n验证结果：");
    console.log("计算得到的根：", currentHash);
    console.log("期望的根：", root);
    console.log("验证", currentHash === root ? "成功" : "失败");

    console.log("\n生成的证明：");
    console.log(JSON.stringify(proof, null, 2));

    // 保存到文件
    fs.writeFileSync("input.json", JSON.stringify(proof, null, 2));
    console.log("\n证明已保存到 input.json");

    // 创建 Merkle Tree
    const tree = new SimpleMerkleTree(leaves, (left, right) => {
        return poseidon.F.toString(poseidon([left, right]));
    });

    // 获取根节点
    const treeRoot = tree.root;
    console.log("Merkle Tree Root:", treeRoot);

    // 验证证明
    const isValid = tree.verify(proof, leaves[2], treeRoot);
    console.log("Proof is valid:", isValid);

    // 准备电路输入
    const circuitInput = {
        leaf: leaves[2],
        pathElements: proof.pathElements,
        pathIndices: proof.pathIndices,
        root: treeRoot
    };

    // 测试电路
    const circuit = await wasm(path.join(__dirname, "../circuits/merkle_tree.circom"));
    const witness = await circuit.calculateWitness(circuitInput);
    await circuit.checkConstraints(witness);
    console.log("Circuit verification passed!");
}

main().catch(console.error); 