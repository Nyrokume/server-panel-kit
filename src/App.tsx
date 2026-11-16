import { Routes, Route } from 'react-router'
import { AppShell } from './components/app/shell'
import Overview from './pages/Overview'
import System from './pages/System'
import Machines from './pages/Machines'
import MachineDetail from './pages/MachineDetail'
import Alerts from './pages/Alerts'
import PowerShell from './pages/PowerShell'
import Screen from './pages/Screen'
import Processes from './pages/Processes'
import Disks from './pages/Disks'
import Users from './pages/Users'
import Experiments from './pages/Experiments'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Overview />} />
        <Route path="/system" element={<System />} />
        <Route path="/machines" element={<Machines />} />
        <Route path="/machines/:id" element={<MachineDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/powershell" element={<PowerShell />} />
        <Route path="/screen" element={<Screen />} />
        <Route path="/processes" element={<Processes />} />
        <Route path="/disks" element={<Disks />} />
        <Route path="/users" element={<Users />} />
        <Route path="/experiments" element={<Experiments />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
