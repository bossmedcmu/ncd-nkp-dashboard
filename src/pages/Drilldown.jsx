import { useMemo, useRef, useState } from 'react'
import { Form, Button } from 'react-bootstrap'
import { Bar } from 'react-chartjs-2'
import { Panel } from '../components/ui.jsx'
import { ChartDataLabels, palette } from '../lib/chart.js'
import { K, getData, getChildren, getRow, num, fmtInt, isPctMetric } from '../lib/data.js'

const LEVEL_NAMES = ['กลุ่มคลินิก', 'กลุ่มงาน', 'งาน/แผนก', 'คลินิกย่อย', 'ห้องตรวจ']

export default function Drilldown() {
  const { headers } = getData()
  const kpis = headers.slice(5)
  const [kpi, setKpi] = useState(K.visits)
  const [path, setPath] = useState([])
  const chartRef = useRef(null)

  const level = path.length // 0-based index of the level being shown
  const key = `Level${level + 1}`

  const rows = useMemo(
    () => getChildren(path).sort((a, b) => num(b[K.visits]) - num(a[K.visits])),
    [path],
  )
  const labels = rows.map((r) => r[key])
  const isPct = isPctMetric(kpi)
  const fmt = (v) => (isPct ? `${v.toFixed(2)}%` : v.toLocaleString('en-US', { maximumFractionDigits: 2 }))
  const canDrill = level < 4 && rows.length > 0

  const data = {
    labels,
    datasets: [{
      data: rows.map((r) => num(r[kpi])),
      backgroundColor: labels.map((_, i) => palette[i % palette.length]),
      borderRadius: 8,
      maxBarThickness: 64,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutQuart' },
    layout: { padding: { top: 28 } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#eef2f6' },
        title: { display: true, text: isPct ? 'ร้อยละ (%)' : 'จำนวน', font: { weight: 500 } },
      },
      x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0 } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${fmt(c.parsed.y)}` } },
      datalabels: { anchor: 'end', align: 'top', color: '#0f172a', font: { weight: 600, size: 12 }, formatter: (v) => (v === 0 ? '' : fmt(v)) },
    },
    onHover: (e, el) => {
      if (e.native?.target) e.native.target.style.cursor = el[0] && canDrill ? 'pointer' : 'default'
    },
    onClick: (_e, el) => {
      if (el.length && canDrill) setPath([...path, labels[el[0].index]])
    },
  }

  const cur = getRow(path)

  return (
    <>
      <Panel className="mb-3">
        <div className="filter-bar">
          <div className="flex-grow-1">
            <Form.Label htmlFor="kpiSelector" className="field-label">เลือกตัวชี้วัด</Form.Label>
            <Form.Select id="kpiSelector" value={kpi} onChange={(e) => setKpi(e.target.value)} className="field-select">
              {kpis.map((k) => <option key={k} value={k}>{k}</option>)}
            </Form.Select>
          </div>
          <Button id="backBtn" variant="warning" className="btn-back" disabled={!path.length} onClick={() => setPath(path.slice(0, -1))}>
            <i className="bi bi-arrow-left-circle-fill" /> ย้อนกลับ
          </Button>
        </div>

        <div className="crumbs">
          <button className="crumb" onClick={() => setPath([])}><i className="bi bi-geo-alt-fill" /> ภาพรวมโรงพยาบาล</button>
          {path.map((p, i) => (
            <span key={i} className="d-inline-flex align-items-center gap-2">
              <i className="bi bi-chevron-right text-muted" />
              <button className="crumb" onClick={() => setPath(path.slice(0, i + 1))}>{p}</button>
            </span>
          ))}
          <span className="level-badge ms-auto">ระดับ {level + 1}: {LEVEL_NAMES[level]}</span>
        </div>
      </Panel>

      <Panel
        title={kpi}
        icon="bi-bar-chart-line-fill"
        extra={
          <span className="hint">
            <i className="bi bi-cursor-fill" /> {canDrill ? 'คลิกที่แท่งกราฟเพื่อเจาะลึกลงไป' : 'ถึงระดับล่างสุดแล้ว'}
            {' · '}ค่ารวมของ “{path[path.length - 1] || 'ทั้งโรงพยาบาล'}”: <b>{fmt(num(cur[kpi]))}</b>
          </span>
        }
        className="mb-3"
      >
        {rows.length ? (
          <div className="chart-box" style={{ height: 460 }}>
            <Bar ref={chartRef} data={data} options={options} plugins={[ChartDataLabels]} />
          </div>
        ) : (
          <div className="empty-state"><i className="bi bi-inbox" /> ไม่มีหน่วยงานย่อยในระดับนี้</div>
        )}
      </Panel>

      {rows.length > 0 && (
        <Panel title="รายละเอียดเปรียบเทียบหน่วยงาน" icon="bi-table">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{LEVEL_NAMES[level]}</th><th>All (รวม)</th><th>DM (เบาหวาน)</th><th>HT (ความดัน)</th>
                  {![K.visits, K.dmCount, K.htCount].includes(kpi) && <th className="th-sel">ตัวชี้วัดที่เลือก</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r[key]} className={canDrill ? 'clickable' : ''} onClick={() => canDrill && setPath([...path, r[key]])}>
                    <td className="fw-semibold"><i className="dot me-2" style={{ background: palette[i % palette.length] }} />{r[key]}</td>
                    <td>{fmtInt(r[K.visits])}</td><td>{fmtInt(r[K.dmCount])}</td><td>{fmtInt(r[K.htCount])}</td>
                    {![K.visits, K.dmCount, K.htCount].includes(kpi) && <td className="td-sel">{fmt(num(r[kpi]))}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </>
  )
}
