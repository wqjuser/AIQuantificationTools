# Stage 6 使用双层验收

Stage 6 CI 在无交易所密钥环境中注入 CCXT 测试替身，确定性覆盖成功、拒绝、未知状态、部分失败、kill switch 和重启恢复；该替身不是产品适配器。Stage 6 退出还必须通过显式注入 Sandbox 密钥的 Binance Spot Testnet 提交、查询、撤单和最终对账，并生成完全脱敏的独立 manifest。无密钥 CI 通过不等于 Stage 6 完成。
