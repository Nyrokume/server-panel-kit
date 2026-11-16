const p = require('/workspace/design-research/kefirgames/node_modules/puppeteer-core')
const B = 'http://127.0.0.1:4999/server-panel-kit/'
const sl = (t) => new Promise((r) => setTimeout(r, t))
;(async () => {
  const errs = []
  const b = await p.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] })
  const pg = await b.newPage()
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  pg.on('pageerror', (e) => errs.push(e.message))
  for (const h of ['', '#/machines', '#/disks', '#/experiments']) {
    await pg.goto(B + h, { waitUntil: 'networkidle0' }); await sl(1500)
    const title = await pg.evaluate(() => document.querySelector('h1')?.textContent || '(no h1)')
    console.log(h || '#/', '->', title)
  }
  console.log('console errors:', errs.length); errs.slice(0,10).forEach((e)=>console.log('  ',e))
  await b.close()
})()
