import { useState } from 'react'
import { Row, Col, Form } from 'react-bootstrap'
import { Doughnut } from 'react-chartjs-2'
import { ChartDataLabels, palette } from '../lib/chart.js'
import { KpiCard, Panel } from '../components/ui.jsx'
import { buildCards } from '../lib/cards.js'
import {
  K, TOTAL, getRow, getChildren, getChildOptions, num, fmtInt, fmtPct,
  indicatorCategories, isPctMetric, statusColor,
} from '../lib/data.js'

const LEVELS = [
  { label: 'Level 1 (กลุ่มคลินิก)', all: 'ภาพรวมทั้งโรงพยาบาล' },
  { label: 'Level 2 (กลุ่มงาน)', all: 'รวมทุกกลุ่มงาน' },
  { label: 'Level 3 (งาน/แผนก)', all: 'รวมทุกงาน/แผนก' },
  { label: 'Level 4 (คลินิกย่อย)', all: 'รวมทุกคลินิก' },
  { label: 'Level 5 (รหัสห้องตรวจ)', all: 'รวมทุกห้องตรวจ' },
]
const DEPTH_BADGE = ['ระดับ 1: ภาพรวมโรงพยาบาล', 'ระดับ 1: กลุ่มคลินิก', 'ระดับ 2: กลุ่มงาน', 'ระดับ 3: งาน/แผนก', 'ระดับ 4: คลินิกย่อย', 'ระดับ 5: ห้องตรวจย่อย']

// Per-tab layout: pie = metrics drawn only in the doughnut (no boxes),
// left = boxes beside the pie, cols = box counts per column (filled top-to-bottom, then left-to-right)
const TAB_LAYOUT = {
  'ภาพรวมและสิทธิ': { pie: ['5. ร้อยละบัตรทอง', '6. ร้อยละ ปกส.', '7. ร้อยละเบิกได้'], left: 'rest' },
  'ภาระโรค NCD': { cols: [2, 2, 2] },
  'ประเมินเสี่ยง & พฤติกรรม': { cols: [2, 4, 3] },
  'การคุมโรค & แล็บ': { cols: [4, 4, 6] },
  'คัดกรองแทรกซ้อน (ตา ฟัน เท้า ไต)': {
    pie: ['39. ร้อยละ eGFR Gr >60', '40. ร้อยละ eGFR Gr 3', '41. ร้อยละ eGFR Gr 4', '42. ร้อยละ eGFR Gr 5'],
    left: ['38. ร้อยละการตรวจ eGFR'],
    cols: [3, 2, 4],
  },
  'การใช้ยา & Care Gap': { cols: [1, 2, 2] },
  'ภาวะแทรกซ้อนรุนแรง': { cols: [2, 2, 1] },
}

const nameOf = (m) => m.split('. ').slice(1).join('. ')

function Columns({ items, sizes, row }) {
  let i = 0
  return (
    <div className="metric-cols">
      {sizes.map((n, ci) => {
        const chunk = items.slice(i, i + n)
        i += n
        return (
          <div key={ci} className="metrics-grid">
            {chunk.map((m) => <MetricCard key={m} metric={m} row={row} />)}
          </div>
        )
      })}
    </div>
  )
}

function TabBody({ tab, row }) {
  const cfg = TAB_LAYOUT[tab] || {}
  const pie = cfg.pie || []
  const rest = indicatorCategories[tab].items.filter((m) => !pie.includes(m))
  const left = cfg.left === 'rest' ? rest : cfg.left || []
  const others = cfg.left === 'rest' ? [] : rest.filter((m) => !left.includes(m))
  return (
    <>
      {pie.length > 0 && <PieGroup metrics={pie} left={left} row={row} />}
      {others.length > 0 && <Columns items={others} sizes={cfg.cols || [others.length]} row={row} />}
    </>
  )
}

function PieGroup({ metrics, left, row }) {
  const values = metrics.map((m) => num(row[m]))
  const data = {
    labels: metrics.map(nameOf),
    datasets: [{ data: values, backgroundColor: metrics.map((_, i) => palette[i % palette.length]), borderColor: '#fff', borderWidth: 2 }],
  }
  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      datalabels: { color: '#fff', font: { weight: 600 }, formatter: (v) => `${v.toFixed(1)}%`, display: (ctx) => ctx.dataset.data[ctx.dataIndex] > 0 },
      tooltip: { callbacks: { label: (c) => `${c.label}: ${c.parsed.toFixed(2)}%` } },
    },
  }
  return (
    <Row className="g-3 mb-4 align-items-center">
      <Col md={6} lg={5}>
        <div className="metrics-grid">
          {left.map((m) => <MetricCard key={m} metric={m} row={row} />)}
        </div>
      </Col>
      <Col md={6} lg={7}>
        <div style={{ height: 320 }}>
          <Doughnut data={data} options={options} plugins={[ChartDataLabels]} />
        </div>
      </Col>
    </Row>
  )
}

function MetricCard({ metric, row }) {
  const raw = row[metric]
  const v = num(raw)
  const pct = isPctMetric(metric)
  const color = pct ? statusColor(metric, v) : '#0f766e'
  let shown = raw
  if (pct) shown = `${v.toFixed(2)}%`
  else if (metric.includes('จำนวน')) shown = fmtInt(raw)
  else if (metric.includes('อายุ')) shown = `${v.toFixed(2)} ปี`
  return (
    <div className="metric-card">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div className="metric-name">{nameOf(metric)}</div>
        </div>
        <div className="metric-val" style={{ color }}>{shown}</div>
      </div>
      {pct && (
        <div className="bar-bg"><div className="bar-fill" style={{ width: `${Math.min(Math.max(v, 0), 100)}%`, background: color }} /></div>
      )}
    </div>
  )
}

export default function Executive() {
  const [path, setPath] = useState([]) // chosen values for Level1..5
  const [tab, setTab] = useState(Object.keys(indicatorCategories)[0])

  const setLevel = (i, value) => {
    const next = path.slice(0, i)
    if (value !== TOTAL) next.push(value)
    setPath(next)
  }

  const row = getRow(path)
  const children = getChildren(path).sort((a, b) => num(b[K.visits]) - num(a[K.visits]))
  const childKey = `Level${path.length + 1}`
  const cats = Object.entries(indicatorCategories)

  return (
    <>
      <Panel title="เลือกระดับหน่วยงาน (Level 1 - Level 5)" icon="bi-diagram-3-fill" className="mb-3">
        <Row className="g-3">
          {LEVELS.map((lv, i) => {
            const enabled = i <= path.length
            const options = enabled ? getChildOptions(path.slice(0, i)) : []
            return (
              <Col key={lv.label} md={6} xl>
                <Form.Label htmlFor={`selLevel${i + 1}`} className="field-label">{lv.label}</Form.Label>
                <Form.Select
                  id={`selLevel${i + 1}`} className="field-select" disabled={!enabled || options.length === 0}
                  value={path[i] ?? TOTAL} onChange={(e) => setLevel(i, e.target.value)}
                >
                  <option value={TOTAL}>{i === 0 ? lv.all : path[i - 1] ? `${lv.all}ใน ${path[i - 1]}` : lv.all}</option>
                  {options.map((o) => <option key={o} value={o}>{i === 4 ? `ห้องตรวจ ${o}` : o}</option>)}
                </Form.Select>
              </Col>
            )
          })}
        </Row>
        <div className="banner">
          <div className="crumbs mb-0">
            <span className="fw-bold text-brand"><i className="bi bi-geo-alt-fill" /> ตำแหน่ง:</span>
            {path.length === 0 && <span>ภาพรวมทั้งโรงพยาบาล</span>}
            {path.map((p, i) => (
              <span key={i} className="d-inline-flex align-items-center gap-2">
                {i > 0 && <i className="bi bi-chevron-right text-muted" />}
                <button className="crumb" onClick={() => setPath(path.slice(0, i + 1))}>{i === 4 ? `ห้อง ${p}` : p}</button>
              </span>
            ))}
          </div>
          <span className="level-badge">{DEPTH_BADGE[path.length === 0 ? 0 : path.length]}</span>
        </div>
      </Panel>

      <Row className="g-3 mb-4">
        {buildCards(row).map((c) => (
          <Col key={c.title} xs={12} sm={6} xl={4} xxl={2}><KpiCard {...c} /></Col>
        ))}
      </Row>

      <Panel title="ตัวชี้วัดแยกตามหมวด" icon="bi-ui-checks-grid" className="mb-4">
        <div className="tab-strip">
          {cats.map(([name, c]) => (
            <button key={name} className={`tab-pill ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}>
              <i className={`bi ${c.icon}`} /> {name} <span className="count">{c.items.length}</span>
            </button>
          ))}
        </div>
        <TabBody tab={tab} row={row} />
      </Panel>

      <Panel title={`เปรียบเทียบหน่วยงานย่อย (${children.length} หน่วยงาน)`} icon="bi-bar-chart-fill">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>หน่วยงาน</th><th>รับบริการ (คน)</th><th>เบาหวาน (คน)</th><th>ความดัน (คน)</th>
                <th>DM คุม BP ดี</th><th>HT คุม BP ดี</th><th>HbA1c &lt; 7%</th><th>LDL &lt; 100</th>
                <th>ร้อยละ eGFR Gr &gt;60</th><th>DM ตรวจตา</th><th>DM ตรวจเท้า</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-total">
                <td>★ ค่ารวม ({path[path.length - 1] || 'ทั้งโรงพยาบาล'})</td>
                <td>{fmtInt(row[K.visits])}</td><td>{fmtInt(row[K.dmCount])}</td><td>{fmtInt(row[K.htCount])}</td>
                <td>{fmtPct(row[K.dmBp])}</td><td>{fmtPct(row[K.htBp])}</td><td>{fmtPct(row[K.hba1c])}</td>
                <td>{fmtPct(row[K.ldl])}</td><td>{fmtPct(row[K.egfr60])}</td><td>{fmtPct(row[K.eye])}</td><td>{fmtPct(row[K.foot])}</td>
              </tr>
              {children.length === 0 ? (
                <tr><td colSpan={11} className="text-center text-muted py-4">สิ้นสุดที่ระดับห้องตรวจย่อย (Level 5)</td></tr>
              ) : (
                children.map((c) => (
                  <tr key={c[childKey]} className="clickable" onClick={() => setPath([...path, c[childKey]])}>
                    <td className="fw-semibold">{c[childKey]}</td>
                    <td>{fmtInt(c[K.visits])}</td><td>{fmtInt(c[K.dmCount])}</td><td>{fmtInt(c[K.htCount])}</td>
                    <td>{fmtPct(c[K.dmBp])}</td><td>{fmtPct(c[K.htBp])}</td><td>{fmtPct(c[K.hba1c])}</td>
                    <td>{fmtPct(c[K.ldl])}</td><td>{fmtPct(c[K.egfr60])}</td><td>{fmtPct(c[K.eye])}</td><td>{fmtPct(c[K.foot])}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
