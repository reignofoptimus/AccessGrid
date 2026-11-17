import { useState } from 'react'
import { enterDemo } from '../api/demo'
import DemoPicker from './DemoPicker'
import Icon from '../ui/Icon'
import { Brand, Button, Plate } from '../ui/shared'

export default function Login({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('admin')
  function submit(event) {
    event.preventDefault()
    onLogin(enterDemo(selectedRole))
  }

  return (
    <main id="main-content" className="login-page showcase-login">
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

        </div>

      </section>

      <section className="login-form-region">


        <div className="login-form-box">
          <div className="login-lock">
            <Icon name="lock" size={22} />
          </div>

          <h2>Welcome to AccessGrid</h2>
          <p className="login-subheading">Your campus workspace, one sign-in away.</p>
          <form className="signin-form" onSubmit={submit}>
            <label className="field" htmlFor="username">
              Username
              <div className="input-with-icon">
                <Icon name="user" size={16} />
                <input id="username" value={selectedRole} readOnly autoComplete="off" />
              </div>
            </label>
            <label className="field" htmlFor="password">
              Access key
              <div className="input-with-icon">
                <Icon name="lock" size={16} />
                <input id="password" type="password" value="showcase-access" readOnly autoComplete="off" />
              </div>
            </label>

            <Button
              type="submit"
              variant="primary"
              className="signin-button"
              icon="arrow"
            >
              Sign in to workspace
            </Button>
          </form>
          <div className="quick-access">
            <p>Quick workspace access</p>
            <DemoPicker selectedRole={selectedRole} onSelect={setSelectedRole} />
          </div>
        </div>

      </section>
    </main>
  )
}
