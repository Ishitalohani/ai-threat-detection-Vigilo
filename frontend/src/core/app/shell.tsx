import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { LuChevronLeft, LuChevronRight, LuCpu, LuLayoutDashboard, LuMenu, LuShield, LuCircleDot } from 'react-icons/lu'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/config'
import { useUIStore } from '@/core/lib'
import styles from './shell.module.scss'

const NAV_ITEMS = [
  { path: ROUTES.DASHBOARD, label: 'Overview', icon: LuLayoutDashboard },
  { path: ROUTES.THREATS, label: 'Threat events', icon: LuShield },
  { path: ROUTES.MODELS, label: 'ML models', icon: LuCpu },
]

function ShellErrorFallback({ error }: { error: unknown }): React.ReactElement { return <div className={styles.error}><h2>Something went wrong</h2><pre>{error instanceof Error ? error.message : String(error)}</pre></div> }
function ShellLoading(): React.ReactElement { return <div className={styles.loading}>Loading workspace…</div> }
function getPageTitle(pathname: string): string { return NAV_ITEMS.find((i) => i.path === pathname)?.label ?? 'Overview' }

export function Shell(): React.ReactElement {
  const location = useLocation()
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } = useUIStore()
  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}><div className={styles.brandMark}><LuShield /></div><div className={styles.brandText}><strong>Vigilo</strong><span>AI SECURITY</span></div><button type="button" className={styles.collapseBtn} onClick={toggleSidebarCollapsed}>{sidebarCollapsed ? <LuChevronRight/> : <LuChevronLeft/>}</button></div>
      <div className={styles.sectionLabel}>COMMAND CENTER</div>
      <nav className={styles.nav}>{NAV_ITEMS.map((item) => <NavLink key={item.path} to={item.path} className={({isActive}) => `${styles.navItem} ${isActive ? styles.active : ''}`} onClick={() => sidebarOpen && toggleSidebar()}><item.icon className={styles.navIcon}/><span>{item.label}</span><i/></NavLink>)}</nav>
      <div className={styles.sidebarBottom}><div className={styles.system}><LuCircleDot/><div><strong>Detection engine</strong><span>Operational</span></div></div><div className={styles.footerText}>DEFENSIVE MONITORING<br/>v1.0 · LOCAL ENVIRONMENT</div></div>
    </aside>
    {sidebarOpen && <button type="button" className={styles.overlay} onClick={toggleSidebar} aria-label="Close navigation"/>}
    <div className={`${styles.main} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <header className={styles.header}><div className={styles.headerLeft}><button type="button" className={styles.menuBtn} onClick={toggleSidebar}><LuMenu/></button><div><span className={styles.breadcrumb}>SECURITY /</span><h1>{getPageTitle(location.pathname)}</h1></div></div><div className={styles.headerRight}><span className={styles.secure}><LuCircleDot/> MONITORING ACTIVE</span><div className={styles.avatar}>V</div></div></header>
      <main className={styles.content}><ErrorBoundary FallbackComponent={ShellErrorFallback}><Suspense fallback={<ShellLoading/>}><Outlet/></Suspense></ErrorBoundary></main>
    </div>
  </div>
}
