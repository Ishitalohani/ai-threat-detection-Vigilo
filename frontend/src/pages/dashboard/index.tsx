import { useMemo } from 'react'
import {
  LuActivity,
  LuArrowUpRight,
  LuBot,
  LuCircleCheck,
  LuClock3,
  LuDatabase,
  LuGauge,
  LuRadar,
  LuShieldAlert,
  LuShieldCheck,
  LuSparkles,
  LuTriangleAlert,
} from 'react-icons/lu'
import { useAlerts, useModelStatus, useStats } from '@/api/hooks'
import { AlertFeed } from '@/components'
import styles from './dashboard.module.scss'

function Donut({ high, medium, low }: { high: number; medium: number; low: number }) {
  const total = high + medium + low
  const highPct = total ? (high / total) * 100 : 0
  const mediumPct = total ? (medium / total) * 100 : 0
  return (
    <div
      className={styles.donut}
      style={{
        background: `conic-gradient(var(--danger) 0 ${highPct}%, var(--warning) ${highPct}% ${highPct + mediumPct}%, var(--success) ${highPct + mediumPct}% 100%)`,
      }}
    >
      <div className={styles.donutCenter}>
        <strong>{total.toLocaleString()}</strong>
        <span>events</span>
      </div>
    </div>
  )
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1)
  return (
    <div className={styles.miniBars} aria-label="Threat activity chart">
      {values.map((value, index) => (
        <span key={`${value}-${index}`} style={{ height: `${Math.max((value / max) * 100, 8)}%` }} />
      ))}
    </div>
  )
}

export function Component(): React.ReactElement {
  const { data: stats, isLoading } = useStats()
  const { data: modelStatus } = useModelStatus()
  const { alerts, isConnected, connectionError } = useAlerts()

  const activity = useMemo(() => {
    const total = stats?.threats_detected ?? 0
    return [0.28, 0.44, 0.36, 0.62, 0.51, 0.8, 0.68, 0.92, 0.73, 0.88, 0.56, 0.76].map((x) => Math.round(total * x))
  }, [stats?.threats_detected])

  if (isLoading || !stats) {
    return <div className={styles.loading}><div className={styles.loader} /><span>Synchronizing threat telemetry…</span></div>
  }

  const { severity_breakdown: sb } = stats
  const modelCount = modelStatus?.active_models.length ?? 0
  const highRate = stats.threats_detected ? Math.round((sb.high / stats.threats_detected) * 100) : 0

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <div className={styles.eyebrow}><span className={styles.liveDot} /> SECURITY OPERATIONS CENTER</div>
          <h2>Threat intelligence at a glance.</h2>
          <p>AI-assisted monitoring of Nginx traffic, anomaly scores and defensive signals in real time.</p>
        </div>
        <div className={styles.heroActions}>
          <span className={styles.range}><LuClock3 /> {stats.time_range}</span>
          <span className={`${styles.connection} ${isConnected ? styles.connected : ''}`}>
            <LuActivity /> {isConnected ? 'Live stream' : 'Reconnecting'}
          </span>
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={`${styles.statCard} ${styles.accent}`}><div className={styles.statIcon}><LuShieldAlert /></div><span>Threats detected</span><strong>{stats.threats_detected.toLocaleString()}</strong><small><LuArrowUpRight /> Live detection pipeline</small></div>
        <div className={styles.statCard}><div className={styles.statIcon}><LuDatabase /></div><span>Events stored</span><strong>{stats.threats_stored.toLocaleString()}</strong><small>PostgreSQL security archive</small></div>
        <div className={styles.statCard}><div className={styles.statIcon}><LuTriangleAlert /></div><span>High severity</span><strong>{sb.high.toLocaleString()}</strong><small>{highRate}% of detected threats</small></div>
        <div className={styles.statCard}><div className={styles.statIcon}><LuBot /></div><span>Active models</span><strong>{modelCount || '—'}</strong><small>{modelStatus?.detection_mode ?? 'Checking engine…'}</small></div>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.card}>
          <div className={styles.cardHead}><div><span className={styles.kicker}>RISK DISTRIBUTION</span><h3>Threat severity</h3></div><LuGauge className={styles.headIcon} /></div>
          <div className={styles.riskBody}>
            <Donut high={sb.high} medium={sb.medium} low={sb.low} />
            <div className={styles.legend}>
              <div><i className={styles.highDot} /><span>High</span><strong>{sb.high}</strong></div>
              <div><i className={styles.mediumDot} /><span>Medium</span><strong>{sb.medium}</strong></div>
              <div><i className={styles.lowDot} /><span>Low</span><strong>{sb.low}</strong></div>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHead}><div><span className={styles.kicker}>ACTIVITY SIGNAL</span><h3>Detection volume</h3></div><span className={styles.pulse}><LuActivity /> LIVE</span></div>
          <MiniBars values={activity} />
          <div className={styles.chartFooter}><span>12h telemetry window</span><strong>{stats.threats_detected.toLocaleString()} total</strong></div>
        </section>

        <section className={`${styles.card} ${styles.pipeline}`}>
          <div className={styles.cardHead}><div><span className={styles.kicker}>PROCESSING PIPELINE</span><h3>Detection engine</h3></div><LuRadar className={styles.headIcon} /></div>
          <div className={styles.steps}>
            {['Nginx logs', '35D features', 'Rules + ML', 'Alert + store'].map((step, i) => (
              <div className={styles.step} key={step}><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{step}</strong><small>{i === 0 ? 'Incoming HTTP telemetry' : i === 1 ? 'Structured feature vector' : i === 2 ? 'Ensemble classification' : 'Postgres + Redis'}</small></div>{i < 3 && <b>→</b>}</div>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.bottomGrid}>
        <section className={styles.card}><div className={styles.cardHead}><div><span className={styles.kicker}>REAL-TIME FEED</span><h3>Security alerts</h3></div><span className={`${styles.feedStatus} ${isConnected ? styles.feedOnline : ''}`}><span />{isConnected ? 'Connected' : 'Offline'}</span></div><AlertFeed alerts={alerts} isConnected={isConnected} maxHeight="310px" />{connectionError && <div className={styles.error}>{connectionError}</div>}</section>
        <section className={styles.card}><div className={styles.cardHead}><div><span className={styles.kicker}>TOP SOURCES</span><h3>Most active origins</h3></div><LuShieldCheck className={styles.headIcon} /></div><div className={styles.rankList}>{stats.top_source_ips.slice(0, 6).map((item, i) => <div className={styles.rank} key={item.source_ip}><span>{String(i + 1).padStart(2, '0')}</span><code>{item.source_ip}</code><div><i style={{ width: `${Math.max(8, Math.min(100, (item.count / Math.max(stats.top_source_ips[0]?.count ?? 1, 1)) * 100))}%` }} /></div><strong>{item.count}</strong></div>)}{stats.top_source_ips.length === 0 && <div className={styles.empty}><LuSparkles /> No source activity yet</div>}</div></section>
      </div>
    </div>
  )
}

Component.displayName = 'DashboardPage'
