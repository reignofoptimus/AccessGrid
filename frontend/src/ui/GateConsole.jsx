import { useState } from 'react'
import { getVehicleByPlate, recordEntry, recordExit, detectPlate } from '../api/api'
import { demoEnabled } from '../api/demo'
import { Badge, Button, Notice, Plate } from './shared'
import Icon from './Icon'
import { normalizePlate } from './format'

export default function GateConsole({onRecorded}) {
  const [plate,setPlate]=useState('')
  const [result,setResult]=useState(null)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [message,setMessage]=useState('')
  const [visitor,setVisitor]=useState('')
  const [gate,setGate]=useState('Main Gate')
  async function lookup(event) {
    event.preventDefault();setError('');setMessage('');setResult(null)
    if (normalizePlate(plate).length<6) {setError('Enter a complete vehicle plate number.');return}
    setBusy(true)
    try {setResult({...((await getVehicleByPlate(plate)).data),registered:true})}
    catch(err) {if(err.response?.status===404) setResult({plate:plate.trim().toUpperCase(),registered:false,isInside:false});else setError('Could not check the registry. Try again when the connection is available.')}
    finally{setBusy(false)}
  }
  async function upload(event) {
    const file=event.target.files[0];if(!file)return
    setError('');setMessage('');setResult(null)
    if(!['image/jpeg','image/png'].includes(file.type)||file.size>16*1024*1024){setError('Choose a JPG or PNG image smaller than 16 MB.');return}
    setBusy(true)
    try {const detected=await detectPlate(file);if(!detected)throw new Error('No plate was detected. Enter the plate manually.');setPlate(detected);setMessage('Plate detected. Check the number, then look up the vehicle.')}
    catch(err){setError(err.response?.data?.error || err.message || 'Image recognition failed. Enter the plate manually.')}
    finally{setBusy(false);event.target.value=''}
  }
  async function record() {
    if(!result.registered&&!visitor.trim()){setError('Enter the visitor’s name before allowing entry.');return}
    setBusy(true);setError('')
    try {
      const data={plate:result.plate,gate,manual:true,type:result.type||'Visitor',owner:result.owner||visitor.trim()}
      if(result.isInside)await recordExit(data);else await recordEntry(data)
      setMessage(`${result.isInside?'Exit':'Entry'} recorded for ${result.plate}`);setResult(null);setPlate('');setVisitor('');await onRecorded()
    }catch(err){setError(err.response?.data?.error||'The movement was not saved. Please try again.')}
    finally{setBusy(false)}
  }
  return <div className="gate-console">
    <div className="gate-console-title"><span className="scanner-symbol"><Icon name="scan" size={26}/></span><div><h2>Check. Verify. Let through.</h2><p>Look up a vehicle before recording its movement</p></div><Badge>Operator control</Badge></div>
    <form onSubmit={lookup} className="gate-search-form"><label htmlFor="gate-plate">Vehicle plate number</label><div className="gate-input-row"><div className="plate-input"><Icon name="car"/><input id="gate-plate" disabled={busy} value={plate} onChange={e=>{setPlate(e.target.value.toUpperCase());setResult(null);setError('')}} placeholder="KL-07-AB-1234" maxLength={20} autoComplete="off" spellCheck="false" required/></div><Button variant="primary" type="submit" disabled={busy} icon="search">{busy?'Checking…':'Look up vehicle'}</Button></div><div className="gate-input-footer"><span>Indian registration plates · Spaces and hyphens accepted</span><label className={`upload-control ${busy?'disabled':''}`}><Icon name="upload" size={15}/><span>Upload plate image</span><input type="file" accept="image/png,image/jpeg" disabled={busy} onChange={upload}/></label></div></form>
    {error&&<Notice error onClose={()=>setError('')}>{error}</Notice>}{message&&<Notice onClose={()=>setMessage('')}>{message}</Notice>}
    {result?<div className="lookup-result" key={result.plate}><div className="result-summary"><Badge tone={result.registered?'positive':'warning'}>{result.registered?'Registered vehicle':'Unregistered vehicle'}</Badge><Plate value={result.plate}/></div><div className="result-fields"><div><span>Owner</span><strong>{result.owner||'Visitor details required'}</strong></div><div><span>Current location</span><strong>{result.isInside?'Inside campus':'Outside campus'}</strong></div><div><span>Category</span><strong>{result.type||'Visitor'}</strong></div></div>{!result.registered&&<label className="field">Visitor name<input value={visitor} onChange={e=>setVisitor(e.target.value)} placeholder="Full name" maxLength={64}/></label>}<div className="gate-decision"><label className="field">Gate<select value={gate} onChange={e=>setGate(e.target.value)}><option>Main Gate</option><option>North Gate</option></select></label><Button variant="primary" icon={result.isInside?'exit':'entry'} disabled={busy||result.status==='inactive'} onClick={record}>{busy?'Saving…':result.isInside?'Record exit':'Allow entry'}</Button><Button disabled={busy} onClick={()=>{setResult(null);setPlate('');setMessage('No movement recorded')}}>Dismiss</Button></div>{result.status==='inactive'&&<p className="field-help">This registration is inactive. Contact the administrator.</p>}</div>:<div className="scan-idle"><div className="scan-reticle"><span/><span/><span/><span/><Icon name="car" size={40}/></div><div><h3>Ready for the next vehicle</h3><p>{demoEnabled?'Try KL-07-AB-1234 to preview a registered vehicle':'Enter a plate or upload an image to begin verification'}</p></div></div>}
  </div>
}
