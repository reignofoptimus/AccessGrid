import { useEffect, useState } from 'react'
import { Brand, Button } from '../ui/shared'
import DemoPicker from './DemoPicker'

export default function StartupScreen({ failed, onRetry }) {
  const [waiting, setWaiting] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setWaiting(true), 8000)
    return () => clearTimeout(timer)
  }, [])

  return <main id="main-content" className={`startup-screen ${failed ? 'startup-failed' : ''}`}>
    <header><Brand /></header>
    <section className="startup-content">
      <div className="startup-gate" aria-hidden="true">
        <span className="startup-road" /><span className="startup-vehicle" /><span className="startup-barrier" />
      </div>
      <div role="status" aria-live="polite">
        <h1>{failed ? 'The campus is taking a little longer.' : waiting ? 'Waking up the campus.' : 'Opening AccessGrid.'}</h1>
        <p>{failed ? 'The server hasn’t responded yet. Try again, or explore a demo below.' : waiting ? 'The demo server rests between visits. It may take about a minute to start.' : 'Connecting to your campus workspace.'}</p>
      </div>
      {!failed && <div className="startup-track" aria-hidden="true"><span /></div>}
      {failed && <Button onClick={onRetry} icon="arrow">Try connection again</Button>}
      <div className="startup-demo">
        <p>Explore now. No account needed.</p>
        <DemoPicker />
        <small>Sample workspaces. Your changes reset on refresh.</small>
      </div>
    </section>
    <footer>Campus access, connected.</footer>
  </main>
}
