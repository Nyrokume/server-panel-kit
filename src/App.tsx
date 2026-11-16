import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router'
import { AppShell } from './components/app/shell'
import Overview from './pages/Overview'
import { Spinner } from './kit'

const System = lazy(() => import('./pages/System'))
const Machines = lazy(() => import('./pages/Machines'))
const MachineDetail = lazy(() => import('./pages/MachineDetail'))
const Alerts = lazy(() => import('./pages/Alerts'))
const PowerShell = lazy(() => import('./pages/PowerShell'))
const Screen = lazy(() => import('./pages/Screen'))
const Processes = lazy(() => import('./pages/Processes'))
const Disks = lazy(() => import('./pages/Disks'))
const Users = lazy(() => import('./pages/Users'))
const Experiments = lazy(() => import('./pages/Experiments'))
const Settings = lazy(() => import('./pages/Settings'))
const Kit = lazy(() => import('./pages/Kit'))

function Loading() {
  return <div className="flex min-h-[40vh] items-center justify-center text-muted"><Spinner /></div>
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Overview />} />
        <Route path="/system" element={<Suspense fallback={<Loading />}><System /></Suspense>} />
        <Route path="/machines" element={<Suspense fallback={<Loading />}><Machines /></Suspense>} />
        <Route path="/machines/:id" element={<Suspense fallback={<Loading />}><MachineDetail /></Suspense>} />
        <Route path="/alerts" element={<Suspense fallback={<Loading />}><Alerts /></Suspense>} />
        <Route path="/powershell" element={<Suspense fallback={<Loading />}><PowerShell /></Suspense>} />
        <Route path="/screen" element={<Suspense fallback={<Loading />}><Screen /></Suspense>} />
        <Route path="/processes" element={<Suspense fallback={<Loading />}><Processes /></Suspense>} />
        <Route path="/disks" element={<Suspense fallback={<Loading />}><Disks /></Suspense>} />
        <Route path="/users" element={<Suspense fallback={<Loading />}><Users /></Suspense>} />
        <Route path="/experiments" element={<Suspense fallback={<Loading />}><Experiments /></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<Loading />}><Settings /></Suspense>} />
        <Route path="/kit" element={<Suspense fallback={<Loading />}><Kit /></Suspense>} />
      </Route>
    </Routes>
  )
}
