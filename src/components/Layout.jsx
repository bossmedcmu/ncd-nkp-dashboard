import { useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Button } from 'react-bootstrap'
import { setCsvText } from '../lib/data.js'

const NAV = [
  { to: '/', icon: 'bi-grid-1x2-fill', label: 'ภาพรวมผู้บริหาร', sub: 'Executive Overview', end: true },
  { to: '/drilldown', icon: 'bi-bar-chart-line-fill', label: 'ตัวชี้วัดรายข้อ', sub: 'Drill-down Analytics' },
  { to: '/executive', icon: 'bi-clipboard2-pulse-fill', label: 'ตัวชี้วัดรายคลินิก', sub: 'Clinic Scorecard' },
]

const TITLES = {
  '/': 'ภาพรวมผู้บริหาร',
  '/drilldown': 'ตัวชี้วัดรายข้อ',
  '/executive': 'ตัวชี้วัดรายคลินิก (60 ตัวชี้วัด)',
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const fileRef = useRef(null)
  const { pathname } = useLocation()

  const toggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      setOpen((prev) => !prev)
    } else {
      setCollapsed((prev) => {
        const next = !prev
        try {
          localStorage.setItem('sidebar_collapsed', String(next))
        } catch { }
        return next
      })
    }
  }

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('sidebar_collapsed', String(next))
      } catch { }
      return next
    })
  }

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setCsvText(ev.target.result)
    reader.readAsText(f, 'utf-8')
    e.target.value = ''
  }

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <div className="brand-main">
            <div className="brand-logo" title="NCD Dashboard โรงพยาบาลนครพิงค์">
              <img src={`${import.meta.env.BASE_URL}nkp-logo.jpg`} alt="NKP" />
            </div>
            <div className="brand-info">
              <div className="brand-title">NCD<br />Dashboard</div>
              <div className="brand-sub">โรงพยาบาลนครพิงค์</div>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn d-none d-lg-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'ขยายแถบข้าง' : 'ย่อแถบข้าง'}
            title={collapsed ? 'ขยายแถบข้าง (Sidebar)' : 'ย่อแถบข้าง (Sidebar)'}
          >
            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
          </button>
        </div>

        <div className="nav-caption">เมนูหลัก</div>
        <nav className="nav-list">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className="nav-item-x"
              onClick={() => setOpen(false)}
              title={collapsed ? `${n.label} (${n.sub})` : undefined}
            >
              <span className="nav-ico"><i className={`bi ${n.icon}`} /></span>
              <span className="nav-info">
                <span className="nav-label">{n.label}</span>
                <span className="nav-sub">{n.sub}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="foot-note">ผู้พัฒนาระบบ</div>
          <div className="foot-note">นพ.ฉันทวัฒน์ สุทธิพงษ์<br />คุณมณเฑียร ปุณวัตร์</div>
          <div className="foot-note"></div>
          <div className="fy-chip" title="ข้อมูลวันที่ 30 ก.ย. 69">
            <i className="bi bi-calendar-check" />
            <span className="fy-chip-text">ข้อมูล ณ 30 ก.ย. 69</span>
          </div>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <div className="main-col">
        <header className="topbar no-print">
          <div className="d-flex align-items-center gap-3">
            <button
              className="menu-btn"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'ขยายแถบข้าง' : 'ย่อแถบข้าง'}
              title={collapsed ? 'ขยายแถบข้าง (Sidebar)' : 'ย่อแถบข้าง (Sidebar)'}
              id="btnMenu"
            >
              <i className="bi bi-list d-lg-none" />
              <i className={`bi d-none d-lg-inline ${collapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`} />
            </button>
            <div>
              <div className="crumb-small">Executive NCD Performance</div>
              <h1 className="page-h1">{TITLES[pathname] || TITLES['/']}</h1>
            </div>
          </div>
          <div className="d-flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" hidden onChange={onFile} />
            <Button id="btnImport" variant="outline-primary" className="btn-soft" onClick={() => fileRef.current.click()}>
              <i className="bi bi-folder2-open" /> <span className="d-none d-md-inline">นำเข้า CSV</span>
            </Button>
            <Button id="btnPrint" variant="primary" className="btn-brand" onClick={() => window.print()}>
              <i className="bi bi-printer" /> <span className="d-none d-md-inline">พิมพ์รายงาน</span>
            </Button>
          </div>
        </header>

        <main className="content">{children}</main>

        <footer className="page-foot">
          คณะกรรมการพัฒนาระบบบริการสุขภาพกลุ่มโรคไม่ติดต่อเรื้อรัง (NCD) โรงพยาบาลนครพิงค์ &copy; 2569
        </footer>
      </div>
    </div>
  )
}
