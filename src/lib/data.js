import csv from '../data/ncd.csv?raw'

export const TOTAL = 'รวม'

export const K = {
  visits: '1. จำนวนรับบริการในปีงบประมาณ',
  age: '2. อายุเฉลี่ย',
  dmCount: '8. จำนวนเบาหวาน',
  dmPct: '9. ร้อยละเบาหวาน',
  htCount: '10. จำนวนความดัน',
  htPct: '11. ร้อยละความดัน',
  dmBp: '19. ร้อยละ DM คุมความดันได้ดี',
  htBp: '20. ร้อยละ HT คุมความดันได้ดี',
  hba1cTest: '22. ร้อยละการตรวจ HbA1c',
  hba1c: '23. ร้อยละ HbA1c < 7',
  ldl: '25. ร้อยละ LDL < 100',
  eye: '46. ร้อยละ DM ตรวจตา',
  egfr60: '39. ร้อยละ eGFR Gr >60',
  eyeOk: '47. ร้อยละ DM ผลตรวจตาปกติ',
  foot: '49. ร้อยละ DM ตรวจเท้า',
  footOk: '50. ร้อยละ DM ผลตรวจเท้าเสี่ยงต่ำ',
  statin: '54. ร้อยละการใช้ Statin',
  statinGap: '55. ร้อยละ LDL มากกว่า 100 แต่ไม่ได้ใช้ Statin',
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { headers: [], rows: [] }
  const strip = (s) => s.trim().replace(/^[="']+|[="']+$/g, '').trim()
  const headers = lines[0].split(',').map(strip)
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const tokens = line.split(',')
    if (tokens.length < headers.length) continue
    const obj = {}
    headers.forEach((h, j) => {
      obj[h] = strip(tokens[j] ?? '')
    })
    rows.push(obj)
  }
  return { headers, rows }
}

let store = parseCSV(csv)
const listeners = new Set()

export const getData = () => store
export function setCsvText(text) {
  store = parseCSV(text)
  listeners.forEach((l) => l())
}
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const num = (v) => parseFloat(v) || 0
export const fmtInt = (v) => Number(num(v)).toLocaleString('en-US')
export const fmtPct = (v) => `${num(v).toFixed(2)}%`

const LEVELS = ['Level1', 'Level2', 'Level3', 'Level4', 'Level5']

/** Row for a path like ['คลินิกหลัก','อายุรกรรม'] (remaining levels = รวม) */
export function getRow(path = []) {
  const { rows } = store
  const found = rows.find((r) => LEVELS.every((lv, i) => r[lv] === (path[i] ?? TOTAL)))
  return found || rows.find((r) => r.Level1 === TOTAL) || rows[0] || {}
}

/** Direct children rows of path (one level deeper, aggregated rows only) */
export function getChildren(path = []) {
  const depth = path.length
  if (depth >= 5) return []
  return store.rows.filter((r) => {
    for (let i = 0; i < depth; i++) if (r[LEVELS[i]] !== path[i]) return false
    if (r[LEVELS[depth]] === TOTAL || !r[LEVELS[depth]]) return false
    for (let i = depth + 1; i < 5; i++) if (r[LEVELS[i]] && r[LEVELS[i]] !== TOTAL) return false
    return true
  })
}

/** Values of the Level-N column for children (sorted by visits desc) */
export function getChildOptions(path = []) {
  const key = LEVELS[path.length]
  return getChildren(path)
    .sort((a, b) => num(b[K.visits]) - num(a[K.visits]))
    .map((r) => r[key])
}

export const indicatorCategories = {
  'ภาพรวมและสิทธิ': {
    icon: 'bi-people-fill',
    items: ['1. จำนวนรับบริการในปีงบประมาณ', '2. อายุเฉลี่ย', '3. ร้อยละเพศชาย', '4. ร้อยละคนไทย', '5. ร้อยละบัตรทอง', '6. ร้อยละ ปกส.', '7. ร้อยละเบิกได้'],
  },
  'ภาระโรค NCD': {
    icon: 'bi-heart-pulse-fill',
    items: ['8. จำนวนเบาหวาน', '9. ร้อยละเบาหวาน', '10. จำนวนความดัน', '11. ร้อยละความดัน', '12. จำนวนเบาหวานและความดัน', '13. ร้อยละเบาหวานและความดัน'],
  },
  'ประเมินเสี่ยง & พฤติกรรม': {
    icon: 'bi-speedometer2',
    items: ['14. ร้อยละคนที่มีน้ำหนัก', '15. ร้อยละคนที่มีส่วนสูง', '16. ร้อยละคนที่มี BMI', '17. ร้อยละคนที่ BMI ปกติ', '18. ร้อยละการวัดความดัน', '21. ร้อยละ DM สูบบุหรี่', '43. ร้อยละ Thai CV risk', '44. ร้อยละ Thai CV risk ต่ำ', '45. ร้อยละ Thai CV risk <20%'],
  },
  'การคุมโรค & แล็บ': {
    icon: 'bi-eyedropper',
    items: ['19. ร้อยละ DM คุมความดันได้ดี', '20. ร้อยละ HT คุมความดันได้ดี', '22. ร้อยละการตรวจ HbA1c', '23. ร้อยละ HbA1c < 7', '24. ร้อยละการตรวจ LDL', '25. ร้อยละ LDL < 100', '26. ร้อยละการตรวจ Chol', '27. ร้อยละ Chol < 200', '28. ร้อยละการตรวจ TG', '29. ร้อยละ TG < 150', '30. ร้อยละการตรวจ HDL', '31. ร้อยละ HDL ปกติ', '32. ร้อยละการตรวจ Uric', '33. ร้อยละ Uric < 7'],
  },
  'คัดกรองแทรกซ้อน (ตา ฟัน เท้า ไต)': {
    icon: 'bi-eye-fill',
    items: ['46. ร้อยละ DM ตรวจตา', '47. ร้อยละ DM ผลตรวจตาปกติ', '48. ร้อยละ DM ตรวจฟัน', '49. ร้อยละ DM ตรวจเท้า', '50. ร้อยละ DM ผลตรวจเท้าเสี่ยงต่ำ', '34. ร้อยละการตรวจ MicroAlb', '35. ร้อยละ MicroAlb ปกติ', '36. ร้อยละการตรวจ Urine Protein', '37. ร้อยละ Urine Protein ปกติ', '38. ร้อยละการตรวจ eGFR', '39. ร้อยละ eGFR Gr >60', '40. ร้อยละ eGFR Gr 3', '41. ร้อยละ eGFR Gr 4', '42. ร้อยละ eGFR Gr 5'],
  },
  'การใช้ยา & Care Gap': {
    icon: 'bi-capsule-pill',
    items: ['51. ร้อยละการใช้ ASA', '52. ร้อยละการใช้ ACEI', '53. ร้อยละการใช้ ARB', '54. ร้อยละการใช้ Statin', '55. ร้อยละ LDL มากกว่า 100 แต่ไม่ได้ใช้ Statin'],
  },
  'ภาวะแทรกซ้อนรุนแรง': {
    icon: 'bi-exclamation-triangle-fill',
    items: ['56. ร้อยละ HT ที่เป็น IHD', '57. ร้อยละ HT ที่เป็น CVA', '58. ร้อยละ DM ที่ไตเสื่อม', '59. ร้อยละ HT ที่ไตเสื่อม', '60. ร้อยละ DM ที่ตัดเท้า'],
  },
}

/** Metrics where a LOWER value is better */
export const isRiskMetric = (k) =>
  ['สูบบุหรี่', 'ไม่ได้ใช้', 'ไตเสื่อม', 'ตัดเท้า', 'IHD', 'CVA', 'Gr 4', 'Gr 5'].some((w) => k.includes(w))

export const isPctMetric = (k) => k.includes('ร้อยละ') || k.includes('%')

/** Status color for a percentage metric */
export function statusColor(k, v) {
  if (isRiskMetric(k)) return v < 10 ? '#10b981' : v < 25 ? '#f59e0b' : '#ef4444'
  return v >= 70 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444'
}
