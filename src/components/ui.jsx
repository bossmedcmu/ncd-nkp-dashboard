import { Link } from 'react-router-dom'

/** Executive KPI tile */
export function KpiCard({ title, value, sub, icon, color = '#0f766e' }) {
  return (
    <div className="kpi-card" style={{ '--accent': color }}>
      <div className="kpi-head">
        <span className="kpi-title">{title}</span>
        <span className="kpi-ico" style={{ background: `${color}1f`, color }}>
          <i className={`bi ${icon}`} />
        </span>
      </div>
      <div className="kpi-val" style={{ color }}>{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}

/** Card wrapper with title row */
export function Panel({ title, icon, extra, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {(title || extra) && (
        <div className="panel-head">
          <div className="panel-title">
            {icon && <i className={`bi ${icon}`} />} {title}
          </div>
          {extra}
        </div>
      )}
      {children}
    </section>
  )
}

export function NavTile({ to, icon, title, desc, tone }) {
  return (
    <Link to={to} className={`nav-tile tone-${tone}`}>
      <span className="nt-ico"><i className={`bi ${icon}`} /></span>
      <span className="nt-body">
        <span className="nt-title">{title}</span>
        <span className="nt-desc">{desc}</span>
      </span>
      <span className="nt-go"><i className="bi bi-arrow-right-circle-fill" /></span>
    </Link>
  )
}
