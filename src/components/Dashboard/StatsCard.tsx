import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  iconLarge: ReactNode
  label: string
  value: string | number
  sub?: string
  gradient: string
  shadow: string
  dark?: boolean
  accentColor?: string
}

export default function StatsCard({ icon, iconLarge, label, value, sub, gradient, shadow, dark, accentColor }: Props) {
  const txt      = dark ? (accentColor ?? '#1e1b4b')         : '#fff'
  const txtLabel = dark ? (accentColor ?? '#1e1b4b') + 'b3'  : 'rgba(255,255,255,0.80)'
  const txtSub   = dark ? '#64748b'                           : 'rgba(255,255,255,0.52)'
  const badgeBg  = dark ? (accentColor ?? '#6d28d9') + '22'  : 'rgba(255,255,255,0.22)'
  const badgeIcon = dark ? (accentColor ?? '#6d28d9')         : '#fff'
  const mark     = dark ? 'rgba(0,0,0,0.06)'                 : 'rgba(255,255,255,0.10)'

  return (
    <div className="card-hover relative overflow-hidden"
      style={{
        height: 152,
        borderRadius: 22,
        cursor: 'default',
        boxShadow: shadow,
        background: gradient,
      }}>

      {/* Watermark icon */}
      <div style={{
        position: 'absolute', right: -10, top: -6,
        color: mark,
        transform: 'rotate(12deg)',
        lineHeight: 1,
        pointerEvents: 'none',
      }}>
        {iconLarge}
      </div>

      <div style={{
        padding: '18px 20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}>
        {/* Icon badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: badgeBg,
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: badgeIcon, display: 'flex' }}>{icon}</span>
        </div>

        {/* Number + label */}
        <div>
          <p style={{
            fontSize: '2.6rem', fontWeight: 900, lineHeight: 1,
            letterSpacing: '-0.03em', color: txt,
          }}>
            {value}
          </p>
          <p style={{
            marginTop: 5, fontSize: 11, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.09em', color: txtLabel,
          }}>
            {label}
          </p>
          {sub && (
            <p style={{
              marginTop: 2, fontSize: 11, color: txtSub,
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            }}>
              {sub}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
