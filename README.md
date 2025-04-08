# Circom Merkle Tree

这是一个使用 Circom 2.1.7 实现的 Merkle Tree 包含证明电路。该电路可以证明某个叶子节点存在于 Merkle Tree 中，而无需暴露整棵树的内容。

## 功能特性

- 支持任意深度的 Merkle Tree
- 使用 Poseidon 哈希函数
- 生成零知识证明
- 完整的证明验证系统

## 环境要求

- Node.js >= 14.0.0
- Circom 2.1.7
- SnarkJS >= 0.5.0

## 安装

1. 克隆仓库：
```bash
git clone <repository-url>
cd circom_merkle_tree
```

2. 安装依赖：
```bash
npm install
```

3. 安装 Circom（如果尚未安装）：
```bash
npm install -g circom
```

## 使用方法

1. 编译电路：
```bash
circom circuits/merkle_tree.circom --r1cs --wasm --sym
```

2. 生成 Powers of Tau：
```bash
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

3. 生成证明密钥：
```bash
snarkjs plonk setup merkle_tree.r1cs pot12_final.ptau merkle_tree.zkey
```

4. 导出验证密钥：
```bash
snarkjs zkey export verificationkey merkle_tree.zkey verification_key.json
```

5. 生成和验证证明：
```bash
node scripts/generate_proof.js
```

## 目录结构

```
.
├── circuits/            # Circom 电路文件
│   └── merkle_tree.circom
├── scripts/            # 辅助脚本
│   └── generate_proof.js
├── test/              # 测试文件
│   └── merkle_tree_test.js
└── package.json
```

## 测试

运行测试：
```bash
node test/merkle_tree_test.js
```

## 实现细节

电路使用以下组件：
- Poseidon 哈希函数用于计算 Merkle Tree 节点
- DualMux 组件用于处理路径选择
- 线性约束用于验证 Merkle 路径

## 注意事项

- 确保输入的路径索引是 0 或 1
- Merkle Tree 的深度在编译时确定
- 生成的证明文件较大，注意存储空间


## 许可证

MIT License 