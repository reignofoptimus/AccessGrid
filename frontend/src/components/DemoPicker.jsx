import Icon from '../ui/Icon'

const roles = [
  { role: 'admin', label: 'Admin', icon: 'overview' },
  { role: 'security', label: 'Security', icon: 'shield' },
  { role: 'student', label: 'Student', icon: 'user' },
]

export default function DemoPicker() {
  return <nav className="demo-account-picker" aria-label="Explore a demo workspace">
    {roles.map(({ role, label, icon }) => <a key={role} href={`?demo=${role}`} aria-label={`Explore ${label} demo`}>
      <Icon name={icon} size={19} /><span>{label}</span><Icon name="arrow" size={14} />
    </a>)}
  </nav>
}
