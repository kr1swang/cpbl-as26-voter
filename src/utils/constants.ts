import type { Item } from '../types.js'

export const formatStr: string = 'yyyy/MM/dd HH:mm:ss'

export const targetHours: number[] = [1, 7, 13, 19]

export const expectedPositions: Item['position'][] = [
  { code: 'P1', label: '先發投手' },
  { code: 'P2', label: '中繼投手' },
  { code: 'P3', label: '救援投手' },
  { code: 'C', label: '捕手' },
  { code: '1B', label: '一壘手' },
  { code: '2B', label: '二壘手' },
  { code: '3B', label: '三壘手' },
  { code: 'SS', label: '游擊手' },
  { code: 'CF', label: '外野手' },
  { code: 'CF', label: '外野手' },
  { code: 'CF', label: '外野手' },
  { code: 'DH', label: '指定打擊' },
  { code: 'HR', label: '全壘打大賽' },
  { code: 'HR', label: '全壘打大賽' },
  { code: 'HR', label: '全壘打大賽' },
  { code: 'HR', label: '全壘打大賽' },
]
