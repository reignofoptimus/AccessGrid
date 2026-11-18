import { useEffect, useState } from 'react'
import { Brand, Button } from '../ui/shared'

export default function StartupScreen({ failed, onRetry, onContinue }) {
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
        <h1>{failed ? 'Connection timed out.' : 'AccessGrid starting'}</h1>
        {waiting && !failed && <p>This may take a moment.</p>}
      </div>
      {!failed && <div className="startup-track" aria-hidden="true"><span /></div>}
      {failed && <Button onClick={onRetry} icon="arrow">Try again</Button>}
      {failed && <button className="startup-skip" onClick={onContinue}>Continue anyway</button>}
    </section>
  </main>
}
