import Icon from './Icon'

export function Brand() { return <div className="brand"><span>Access<span className="brand-grid">Grid</span></span></div> }
export function Button({children, icon, variant='secondary', className='', ...props}) { return <button className={`button button-${variant} ${className}`} {...props}>{icon && <Icon name={icon}/>}<span>{children}</span></button> }
export function Panel({title, description, action, children, className=''}) {return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>{children}</section>}
export function Badge({children, tone='neutral'}) {return <span className={`badge badge-${tone}`}><i/>{children}</span>}
export function Notice({children, error=false, onClose}) {return <div className={`notice ${error?'notice-error':''}`} role={error?'alert':'status'}><Icon name={error?'help':'check'}/><span>{children}</span>{onClose && <button className="icon-button" aria-label="Dismiss message" onClick={onClose}><Icon name="close"/></button>}</div>}
export function Empty({title='Nothing here yet', children}) {return <div className="empty"><Icon name="car" size={28}/><h3>{title}</h3><p>{children}</p></div>}
export function Plate({value, large=false}) {return <span className={`plate ${large?'plate-large':''}`}><span className="plate-region">IND</span><span>{value || '—'}</span></span>}
export function Metrics({items}) {return <dl className="metrics">{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}<span>{item.unit}</span></dd><p>{item.note}</p></div>)}</dl>}
