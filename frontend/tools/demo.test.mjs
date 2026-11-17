import { test } from 'node:test'
import assert from 'node:assert/strict'

let load = 0
async function openDemo(role) {
  globalThis.window = { location: { search: `?demo=${encodeURIComponent(role)}` } }
  return import(`../src/api/demo.js?test=${++load}`)
}

test('only the three public sample roles enter demo mode', async () => {
  for (const role of ['admin', 'security', 'student']) {
    const demo = await openDemo(role)
    assert.equal(demo.demoEnabled, true)
    assert.equal(demo.demoUser.role, role)
    assert.equal(demo.demoUser.password, undefined)
    const response = await demo.demoAdapter({ url: '/vehicles', method: 'get' })
    assert.equal(response.data.length, 5)
    if (role === 'student') assert.equal(response.data.filter(v => v.ownerId === demo.demoUser.id).length, 1)
  }
  for (const role of ['', 'root', 'faculty', '<script>']) {
    const demo = await openDemo(role)
    assert.equal(demo.demoEnabled, false)
    assert.equal(demo.demoUser, null)
  }
})

test('demo gate actions update sample data and a fresh visit resets it', async () => {
  const demo = await openDemo('security')
  await demo.demoAdapter({ url: '/gate/exit', method: 'post', data: { plate: 'KL-07-AB-1234' } })
  const vehicles = await demo.demoAdapter({ url: '/vehicles', method: 'get' })
  assert.equal(vehicles.data[0].isInside, false)
  const logs = await demo.demoAdapter({ url: '/gate/logs', method: 'get' })
  assert.equal(logs.data[0].action, 'exit')
  // Returned records are copies, so callers cannot silently mutate the store.
  vehicles.data[0].owner = 'Changed outside adapter'
  const fresh = await openDemo('security')
  const reset = await fresh.demoAdapter({ url: '/vehicles', method: 'get' })
  assert.equal(reset.data[0].isInside, true)
  assert.equal(reset.data[0].owner, 'Sample Administrator')
})

test('sign-in and sign-out switch sample mode without navigation or server credentials', async () => {
  const demo = await openDemo('')
  assert.equal(demo.demoEnabled, false)
  for (const role of ['admin', 'security', 'student']) {
    const account = demo.enterDemo(role)
    assert.equal(account.role, role)
    assert.equal(demo.demoEnabled, true)
    assert.equal(demo.demoUser, account)
    demo.leaveDemo()
    assert.equal(demo.demoEnabled, false)
    assert.equal(demo.demoUser, null)
  }
  assert.throws(() => demo.enterDemo('root'))
})
