import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { AppShell } from './components/app/shell'
import Overview from './pages/Overview'
import { Spinner } from './kit'
import { useAppState } from './lib/app-state'
import { fleetFor, preferredMachine } from './lib/live'

const Machines = lazy(() => import('./pages/Machines'))
const MachineDetail = lazy(() => import('./pages/MachineDetail'))
const Alerts = lazy(() => import('./pages/Alerts'))
const PowerShell = lazy(() => import('./pages/PowerShell'))
const Screen = lazy(() => import('./pages/Screen'))
const Users = lazy(() => import('./pages/Users'))
const Settings = lazy(() => import('./pages/Settings'))
const Kit = lazy(() => import('./pages/Kit'))
const Architecture = lazy(() => import('./pages/Architecture'))

function Loading() {
  return <div className="flex min-h-[40vh] items-center justify-center text-muted"><Spinner /></div>
}

/** Old /system, /processes, /disks URLs open the matching machine-card tab. */
function ToMachineTab({ tab }: { tab?: string }) {
  const { tenant, lastMachineId } = useAppState()
  const m = preferredMachine(fleetFor(tenant), lastMachineId)
  if (!m) return <Navigate to="/machines" replace />
  const to = tab ? `/machines/${m.id}?tab=${tab}` : `/machines/${m.id}`
  return <Navigate to={to} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Overview />} />
        <Route path="/system" element={<ToMachineTab />} />
        <Route path="/machines" element={<Suspense fallback={<Loading />}><Machines /></Suspense>} />
        <Route path="/machines/:id" element={<Suspense fallback={<Loading />}><MachineDetail /></Suspense>} />
        <Route path="/alerts" element={<Suspense fallback={<Loading />}><Alerts /></Suspense>} />
        <Route path="/powershell" element={<Suspense fallback={<Loading />}><PowerShell /></Suspense>} />
        <Route path="/screen" element={<Suspense fallback={<Loading />}><Screen /></Suspense>} />
        <Route path="/processes" element={<ToMachineTab tab="processes" />} />
        <Route path="/disks" element={<ToMachineTab tab="disks" />} />
        <Route path="/users" element={<Suspense fallback={<Loading />}><Users /></Suspense>} />
        <Route path="/experiments" element={<Navigate to="/" replace />} />
        <Route path="/settings" element={<Suspense fallback={<Loading />}><Settings /></Suspense>} />
        <Route path="/architecture" element={<Suspense fallback={<Loading />}><Architecture /></Suspense>} />
        <Route path="/kit" element={<Suspense fallback={<Loading />}><Kit /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
