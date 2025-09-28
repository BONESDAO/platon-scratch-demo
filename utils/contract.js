export const CONTRACT = process.env.NEXT_PUBLIC_CONTRACT
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID)
export const RPC = process.env.NEXT_PUBLIC_RPC

// 匹配新合约 V2 的接口
export const ABI = [
  'function play() external payable',
  'function played(address) view returns (uint8)',
  'function prizes(uint8) view returns (uint256 amount,uint16 left,uint16 total,uint16 probability)', // ← 新增 total
  'event Play(address indexed player, uint8 prizeTier, uint256 amount, bytes32 txHashUsed)',
];