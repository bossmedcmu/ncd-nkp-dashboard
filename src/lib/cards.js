import { K, num, fmtInt } from './data.js'

/** Six headline cards for a given aggregated row */
export function buildCards(row) {
  const hba1c = num(row[K.hba1c])
  const htBp = num(row[K.htBp])
  const eye = num(row[K.eye])
  const gap = num(row[K.statinGap])
  const ok = '#10b981'
  const warn = '#f59e0b'
  const bad = '#ef4444'
  return [
    { title: 'ผู้รับบริการทั้งหมด', value: fmtInt(row[K.visits]), sub: `อายุเฉลี่ย ${num(row[K.age]).toFixed(1)} ปี`, icon: 'bi-people-fill', color: '#0f766e' },
    { title: 'ผู้ป่วย DM / HT', value: `${fmtInt(row[K.dmCount])} / ${fmtInt(row[K.htCount])}`, sub: `DM ${num(row[K.dmPct]).toFixed(1)}% | HT ${num(row[K.htPct]).toFixed(1)}%`, icon: 'bi-hospital-fill', color: '#0284c7' },
    { title: 'DM คุม HbA1c < 7%', value: `${hba1c.toFixed(2)}%`, sub: `ตรวจ HbA1c: ${num(row[K.hba1cTest]).toFixed(2)}%`, icon: 'bi-droplet-half', color: hba1c >= 50 ? ok : warn },
    { title: 'HT คุมความดันได้ดี', value: `${htBp.toFixed(2)}%`, sub: `DM คุม BP ดี: ${num(row[K.dmBp]).toFixed(2)}%`, icon: 'bi-heart-pulse-fill', color: htBp >= 60 ? ok : warn },
    { title: 'คัดกรอง ตา / เท้า (DM)', value: `${eye.toFixed(1)}% / ${num(row[K.foot]).toFixed(1)}%`, sub: `ตาปกติ ${num(row[K.eyeOk]).toFixed(1)}% | เท้าเสี่ยงต่ำ ${num(row[K.footOk]).toFixed(1)}%`, icon: 'bi-eye-fill', color: eye >= 60 ? ok : warn },
    { title: 'Care Gap: LDL≥100 ขาด Statin', value: `${gap.toFixed(2)}%`, sub: `ใช้ Statin รวม: ${num(row[K.statin]).toFixed(2)}%`, icon: 'bi-exclamation-circle-fill', color: gap <= 15 ? ok : bad },
  ]
}

export const heat = (v, goodHigh = true) => {
  const good = goodHigh ? v >= 70 : v <= 10
  const mid = goodHigh ? v >= 50 : v <= 25
  return good ? 'heat-good' : mid ? 'heat-mid' : 'heat-bad'
}
