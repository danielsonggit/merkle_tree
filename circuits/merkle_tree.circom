pragma circom 2.1.7;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/gates.circom";

template DualMux() {
    signal input in[2];  // 输入信号
    signal input s;      // 选择信号 (0 或 1)
    signal output out[2];
    
    // 如果 s = 0，返回 [in[0], in[1]]
    // 如果 s = 1，返回 [in[1], in[0]]
    out[0] <== (in[1] - in[0])*s + in[0];
    out[1] <== (in[0] - in[1])*s + in[1];
}

template MerkleTreeInclusionProof(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal input root;
    
    component hashers[depth];
    component muxers[depth];
    signal computedRoot;
    
    // 初始化第一个哈希器和选择器
    hashers[0] = Poseidon(2);
    muxers[0] = DualMux();
    
    // 第一层的哈希计算
    muxers[0].in[0] <== leaf;
    muxers[0].in[1] <== pathElements[0];
    muxers[0].s <== pathIndices[0];
    
    hashers[0].inputs[0] <== muxers[0].out[0];
    hashers[0].inputs[1] <== muxers[0].out[1];
    
    // 处理中间层
    for (var i = 1; i < depth; i++) {
        hashers[i] = Poseidon(2);
        muxers[i] = DualMux();
        
        muxers[i].in[0] <== hashers[i-1].out;
        muxers[i].in[1] <== pathElements[i];
        muxers[i].s <== pathIndices[i];
        
        hashers[i].inputs[0] <== muxers[i].out[0];
        hashers[i].inputs[1] <== muxers[i].out[1];
    }
    
    // 验证根节点
    computedRoot <== hashers[depth-1].out;
    root === computedRoot;
}

component main = MerkleTreeInclusionProof(3); // 3层深度对应8个叶子节点 