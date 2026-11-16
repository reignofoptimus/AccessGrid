import { useState } from 'react'
import { login } from '../api/api'
import { demoEnabled } from '../api/demo'
import Icon from '../ui/Icon'
import { Brand, Button, Notice, Plate } from '../ui/shared'

const ROLES = [
  { role: 'admin', label: 'Admin', icon: 'overview' },
  { role: 'security', label: 'Security', icon: 'shield' },
  { role: 'student', label: 'Student', icon: 'user' },
]

export default function Login({ onLogin }) {
  const [username, setUsername] = useState(demoEnabled ? 'admin' : '')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState(demoEnabled ? 'admin' : '')

  function chooseRole(r) {
    setSelectedRole(r.role)
    setUsername(r.role)
    setPassword('')
    setError('')
  }

  async function submit(event) {
    event.preventDefault()
    const cleanUser = username.trim()
    if (!cleanUser || (!demoEnabled && !password)) {
      setError('Enter your username and password to continue.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const { data } = await login(cleanUser, password)
      if (!['admin', 'security', 'student'].includes(data.role)) {
        throw new Error('Your account does not have a supported workspace role.')
      }
      onLogin(data)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || err.response?.status >= 500
          ? 'Campus server connection failed. Make sure the backend is running.'
          : err.message || 'Invalid username or password.')
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main-content" className="login-page">
      <section className="login-introduction" aria-label="About AccessGrid">
        <div className="login-brand-row">
          <Brand />
        </div>

        <div className="login-message">
          <h1>
            A clear way in.<br />
            <span>A smarter way<br /> to keep track.</span>
          </h1>

        </div>

        <div className="gate-scene" aria-label="Vehicle identification preview">
          <svg className="gate-route" viewBox="0 0 620 300" aria-hidden="true">
            <path d="M0 244h146c40 0 64-30 64-66V0M0 292h146c67 0 112-47 112-114V0M620 56H480c-48 0-74 35-74 76v168M620 8H480c-74 0-122 54-122 124v168" />
            <path className="route-dashes" d="M0 269h146c54 0 88-39 88-91V0M620 32H480c-61 0-98 43-98 100v168" />
          </svg>

          <div className="recognition-preview">
            <div className="recognition-top">
              <span className="recognition-icon">
                <Icon name="scan" size={18} />
              </span>
              <div>
                <strong>Vehicle identification</strong>
                <small>Illustrative preview</small>
              </div>
              <Icon name="check" size={16} />
            </div>

            <div className="recognition-plate">
              <span className="corner tl" />
              <span className="corner tr" />
              <span className="corner bl" />
              <span className="corner br" />
              <Plate large value="KL-07-AB-1234" />
            </div>

            <div className="recognition-footer">
              <span><i />Plate recognized</span>
              <span>Ready for verification</span>
            </div>
          </div>

          <div className="scene-marker">
            <Icon name="entry" size={14} />
            <span>Campus access</span>
          </div>
        </div>

        <div className="login-intro-footer">
          <span>Vehicle registration Â· Gate control Â· Parking</span>
          <span>AccessGrid</span>
        </div>
      </section>

      <section className="login-form-region">


        <div className="login-form-box">
          <div className="login-lock">
            <Icon name="lock" size={22} />
          </div>

          <h2>Welcome to AccessGrid</h2>
          <p className="login-subheading">{demoEnabled ? 'Choose a sample role. No password needed.' : 'Sign in to your campus workspace.'}</p>

          {demoEnabled && <div className="demo-account-picker" aria-label="Select demo role">
            {ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                className={selectedRole === r.role ? 'selected' : ''}
                onClick={() => chooseRole(r)}
              >
                <Icon name={r.icon} size={16} />
                <span>{r.label}</span>
              </button>
            ))}
          </div>}

          {error && <Notice error>{error}</Notice>}

          <form className="signin-form" onSubmit={submit}>
            <label className="field" htmlFor="username">
              Username
              <div className="input-with-icon">
                <Icon name="user" size={16} />
                <input
                  id="username"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setError('')
                  }}
                  required
                  maxLength={64}
                  disabled={busy}
                />
              </div>
            </label>

            {!demoEnabled && <label className="field" htmlFor="password">
              Password
              <div className="input-with-icon">
                <Icon name="lock" size={16} />
                <input
                  id="password"
                  type={visible ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  required
                  disabled={busy}
                />
                <button
                  type="button"
                  className="password-reveal"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? 'Hide password' : 'Show password'}
                >
                  <Icon name={visible ? 'eyeOff' : 'eye'} size={16} />
                </button>
              </div>
            </label>}

            <Button
              type="submit"
              variant="primary"
              className="signin-button"
              disabled={busy}
              icon={busy ? 'clock' : 'arrow'}
            >
              {busy ? 'Signing inâ€¦' : 'Sign in to workspace'}
            </Button>
          </form>
        </div>

        <div className="login-form-footer">
          <span>AccessGrid Â· FISAT campus</span>
          <span>Gate control system</span>
        </div>
      </section>
    </main>
  )
}
