import { useMemo, useState } from 'react'
import { Row, Col, ButtonGroup, ToggleButton } from 'react-bootstrap'
import { Bar, Doughnut } from 'react-chartjs-2'
import { KpiCard, Panel, NavTile } from '../components/ui.jsx'
import { ChartDataLabels, palette } from '../lib/chart.js'
import { K, getRow, getChildren, num, fmtInt, TOTAL } from '../lib/data.js'
import { buildCards, heat } from '../lib/cards.js'

const METRICS = [
  { key: K.hba1c, label: 'HbA1c < 7%', goodHigh: true },
  { key: K.htBp, label: 'HT คุมความดันดี', goodHigh: true },
  { key: K.dmBp, label: 'DM คุมความดันดี', goodHigh: true },
  { key: K.eye, label: 'DM ตรวจตา', goodHigh: true },
  { key: K.foot, label: 'DM ตรวจเท้า', goodHigh: true },
  { key: K.statinGap, label: 'Care Gap Statin', goodHigh: false },
]

export default function Overview() {
  const [metric, setMetric] = useState(METRICS[0].key)
  const total = getRow([])

  // Level-2 units across both clinic groups (Level1 != รวม, Level2 != รวม, Level3 = รวม)
  const units = useMemo(() => {
    const out = []
    getChildren([]).forEach((l1) => {
      getChildren([l1.Level1]).forEach((l2) => out.push({ ...l2, group: l1.Level1, name: l2.Level2 }))
    })
    return out.sort((a, b) => num(b[K.visits]) - num(a[K.visits]))
  }, [])

  const m = METRICS.find((x) => x.key === metric)
  const byMetric = [...units].sort((a, b) => (m.goodHigh ? num(b[m.key]) - num(a[m.key]) : num(a[m.key]) - num(b[m.key])))
  const fmt = (v) => `${v.toFixed(2)}%`

  const barData = {
    labels: byMetric.map((u) => u.name),
    datasets: [{
      data: byMetric.map((u) => num(u[m.key])),
      backgroundColor: byMetric.map((u) => {
        const v = num(u[m.key])
        const good = m.goodHigh ? v >= 70 : v <= 10
        const mid = m.goodHigh ? v >= 50 : v <= 25
        return good ? '#10b981' : mid ? '#f59e0b' : '#ef4444'
      }),
      borderRadius: 8,
      maxBarThickness: 34,
    }],
  }
  const barOpts = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 56 } },
    scales: {
      x: { beginAtZero: true, max: 100, grid: { color: '#eef2f6' }, ticks: { callback: (v) => `${v}%` } },
      y: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${fmt(c.parsed.x)}` } },
      datalabels: { anchor: 'end', align: 'end', color: '#0f172a', font: { weight: 600 }, formatter: (v) => fmt(v) },
    },
  }

  const donutData = {
    labels: units.map((u) => u.name),
    datasets: [{ data: units.map((u) => num(u[K.visits])), backgroundColor: palette, borderWidth: 2, borderColor: '#fff' }],
  }
  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, font: { size: 11 } } },
      datalabels: { display: false },
      tooltip: { callbacks: { label: (c) => ` ${fmtInt(c.parsed)} คน (${((c.parsed / num(total[K.visits])) * 100).toFixed(1)}%)` } },
    },
  }

  const cell = (u, key, goodHigh = true) => (
    <td><span className={`heat ${heat(num(u[key]), goodHigh)}`}>{fmt(num(u[key]))}</span></td>
  )

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="hero-chip"><i className="bi bi-activity" /> ปีงบประมาณ 2569 · ข้อมูล ณ 30 ก.ย. 2569</span>
          <h2>ระบบติดตามผลการดำเนินงานโรคไม่ติดต่อเรื้อรัง (NCD)</h2>
          <p>ภาพรวมคุณภาพบริการ DM / HT ของโรงพยาบาลนครพิงค์ — เลือกเมนูด้านข้างหรือการ์ดด้านล่างเพื่อเจาะลึกรายหน่วยงาน</p>
        </div>
        <div className="hero-stats">
          <div><b>{fmtInt(total[K.visits])}</b><span>ผู้รับบริการทั้งหมด</span></div>
          <div><b>{units.length}</b><span>กลุ่มงานที่ติดตาม</span></div>
          <div><b>60</b><span>ตัวชี้วัด</span></div>
        </div>
      </section>

      <Row className="g-3 mb-4">
        {buildCards(total).map((c) => (
          <Col key={c.title} xs={12} sm={6} xl={4} xxl={2}><KpiCard {...c} /></Col>
        ))}
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={7}>
          <Panel
            title="เปรียบเทียบผลลัพธ์รายกลุ่มงาน"
            icon="bi-bar-chart-steps"
            extra={
              <ButtonGroup size="sm" className="metric-toggle">
                {METRICS.map((x) => (
                  <ToggleButton key={x.key} id={`mt-${x.key}`} type="radio" variant="outline-primary" name="metric"
                    value={x.key} checked={metric === x.key} onChange={() => setMetric(x.key)}>
                    {x.label}
                  </ToggleButton>
                ))}
              </ButtonGroup>
            }
          >
            <div className="chart-box" style={{ height: 420 }}><Bar data={barData} options={barOpts} plugins={[ChartDataLabels]} /></div>
            <div className="legend-row">
              <span><i className="dot" style={{ background: '#10b981' }} /> ผ่านเกณฑ์</span>
              <span><i className="dot" style={{ background: '#f59e0b' }} /> ควรเฝ้าระวัง</span>
              <span><i className="dot" style={{ background: '#ef4444' }} /> ต้องปรับปรุง</span>
            </div>
          </Panel>
        </Col>
        <Col lg={5}>
          <Panel title="สัดส่วนผู้รับบริการรายกลุ่มงาน" icon="bi-pie-chart-fill">
            <div className="chart-box" style={{ height: 420 }}><Doughnut data={donutData} options={donutOpts} /></div>
          </Panel>
        </Col>
      </Row>

      <Panel title="ตารางสรุปรายกลุ่มงาน (Scorecard)" icon="bi-table" className="mb-4">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>กลุ่มงาน</th><th>กลุ่มคลินิก</th><th>รับบริการ</th><th>DM</th><th>HT</th>
                <th>HbA1c&lt;7</th><th>HT คุม BP</th><th>DM ตรวจตา</th><th>DM ตรวจเท้า</th><th>ขาด Statin</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.group + u.name}>
                  <td className="fw-semibold">{u.name}</td>
                  <td className="text-muted">{u.group}</td>
                  <td>{fmtInt(u[K.visits])}</td><td>{fmtInt(u[K.dmCount])}</td><td>{fmtInt(u[K.htCount])}</td>
                  {cell(u, K.hba1c)}{cell(u, K.htBp)}{cell(u, K.eye)}{cell(u, K.foot)}{cell(u, K.statinGap, false)}
                </tr>
              ))}
              <tr className="row-total">
                <td>★ รวมทั้งโรงพยาบาล</td><td>{TOTAL}</td>
                <td>{fmtInt(total[K.visits])}</td><td>{fmtInt(total[K.dmCount])}</td><td>{fmtInt(total[K.htCount])}</td>
                {cell(total, K.hba1c)}{cell(total, K.htBp)}{cell(total, K.eye)}{cell(total, K.foot)}{cell(total, K.statinGap, false)}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="section-label">เจาะลึกข้อมูล</div>
      <Row className="g-3">
        <Col md={6}>
          <NavTile to="/drilldown" tone="teal" icon="bi-bar-chart-line-fill" title="วิเคราะห์เจาะลึกรายหน่วย"
            desc="คลิกแท่งกราฟเพื่อเจาะจากกลุ่มคลินิก → กลุ่มงาน → งาน → คลินิก → ห้องตรวจ เลือกตัวชี้วัดได้ทั้ง 60 ข้อ" />
        </Col>
        <Col md={6}>
          <NavTile to="/executive" tone="blue" icon="bi-clipboard2-pulse-fill" title="ตัวชี้วัดรายคลินิก"
            desc="Scorecard 7 หมวดตัวชี้วัด พร้อมสีสถานะ และตารางเปรียบเทียบหน่วยงานย่อย" />
        </Col>
      </Row>
    </>
  )
}
