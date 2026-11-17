import Icon from '../ui/Icon'

const roles = [
  { role: 'admin', label: 'Admin', icon: 'overview' },
  { role: 'security', label: 'Security', icon: 'shield' },
  { role: 'student', label: 'Student', icon: 'user' },
]

export default function DemoPicker({ selectedRole, onSelect }) {
  return <div className="demo-account-picker" role="group" aria-label="Quick workspace access">
    {roles.map(({ role, label, icon }) => <button key={role} type="button" onClick={() => onSelect(role)} aria-pressed={selectedRole === role} className={selectedRole === role ? 'selected' : ''}>
      <Icon name={icon} size={18} /><span>{label}</span>
    </button>)}
  </div>
}
