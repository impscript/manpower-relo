import { getDashboardData } from '@/lib/analytics'
import { getLeavingReasons } from '@/lib/actions'
import { TrendChart } from '@/components/TrendChart'
import { GenPyramid } from '@/components/GenPyramid'
import { ReasonDonut } from '@/components/ReasonDonut'
import { AttritionTable } from '@/components/AttritionTable'
import { ServiceYearsChart } from '@/components/ServiceYearsChart'
import { TrendingUp, Users, UserMinus, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const [{ employees, movements }, leavingReasons] = await Promise.all([
    getDashboardData(),
    getLeavingReasons()
  ])

  // Map reason codes to names
  const reasonMap = new Map<string, string>()
  leavingReasons.forEach(r => {
    if (r.code) reasonMap.set(r.code, r.name)
  })

  // 1. KPI Calculations
  const totalHeadcount = employees.length

  // Count Resignations (Voluntary + Involuntary)
  const resignations = movements.filter(m => m.movement_type.includes('Resignation')).length
  const newHires = movements.filter(m => m.movement_type === 'New Hired').length

  // Turnover Rate (Simple Calc: Resignations / Current Headcount) - strictly speaking should be average headcount but this is fine for snapshot
  const turnoverRate = totalHeadcount > 0 ? ((resignations / totalHeadcount) * 100).toFixed(1) : '0.0'

  // Hire vs Exit Ratio
  const hireExitRatio = resignations > 0 ? (newHires / resignations).toFixed(2) : newHires.toString()

  // 2. Trend Data Preparation
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const trendMap = new Map<number, { name: string; hired: number; left: number }>()

  // Initialize all months
  monthNames.forEach((name, index) => {
    trendMap.set(index, { name, hired: 0, left: 0 })
  })

  movements.forEach(m => {
    const date = new Date(m.effective_date)
    const month = date.getMonth()
    const entry = trendMap.get(month)

    if (entry) {
      if (m.movement_type === 'New Hired') {
        entry.hired += 1
      } else if (m.movement_type.includes('Resignation') || m.movement_type.includes('Transfer-Out')) {
        entry.left += 1
      }
    }
  })

  const trendData = Array.from(trendMap.values())

  // 3. Demographics (Gen Pyramid)
  const genCounts: Record<string, number> = { 'Gen Z': 0, 'Gen Y': 0, 'Gen X': 0, 'Baby Boomer': 0 }
  employees.forEach(e => {
    const gen = e.generation || 'Unknown'
    if (genCounts[gen] !== undefined) genCounts[gen]++
  })

  const genData = Object.entries(genCounts).map(([name, value]) => ({ name, value }))

  // 4. Reasons for Leaving
  const reasonCounts: Record<string, number> = {}
  console.log(`Total movements: ${movements.length}`)

  movements.filter(m => m.reason_code).forEach(m => {
    // Use Reason Detail or mapped name or code
    let label = m.reason_detail
    if (!label && m.reason_code) {
      label = reasonMap.get(m.reason_code) || m.reason_code
    }
    label = label || 'Unknown'
    reasonCounts[label] = (reasonCounts[label] || 0) + 1
  })
  console.log('Reason Counts:', reasonCounts)

  // Sort and take top 5
  const reasonData = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  // 4.5 Service Years Distribution
  const tenureBuckets = {
    '< 120 Days': 0,
    '120d - 1yr': 0,
    '1 - 3 yrs': 0,
    '3 - 6 yrs': 0,
    '6 - 10 yrs': 0,
    '10 - 20 yrs': 0,
    '> 20 yrs': 0
  }

  employees.forEach(e => {
    if (!e.onboard_date) return
    const start = new Date(e.onboard_date)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffYears = diffDays / 365.25

    if (diffDays < 120) tenureBuckets['< 120 Days']++
    else if (diffDays < 365) tenureBuckets['120d - 1yr']++
    else if (diffYears < 3) tenureBuckets['1 - 3 yrs']++
    else if (diffYears < 6) tenureBuckets['3 - 6 yrs']++
    else if (diffYears < 10) tenureBuckets['6 - 10 yrs']++
    else if (diffYears < 20) tenureBuckets['10 - 20 yrs']++
    else tenureBuckets['> 20 yrs']++
  })

  const tenureData = Object.entries(tenureBuckets).map(([name, value]) => ({ name, value }))

  // 5. Attrition Risk List
  // Filter for Probation Fail or just plain short tenure who left
  const attritionData = movements
    .filter(m => (m.is_probation_fail || m.service_year < 1.0) && (m.movement_type.includes('Resignation') || m.movement_type.includes('Terminated')))
    .map(m => ({
      id: m.employee_id,
      name: `${m.employee.first_name} ${m.employee.last_name}`,
      type: m.movement_type,
      tenure: `${m.service_days} days`,
      reason: m.reason_detail || 'N/A',
      is_probation_fail: m.is_probation_fail
    }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Executive Summary</h2>
          <p className="text-gray-500 mt-1">Real-time manpower insights and retention analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Live Data</span>
          <span className="text-sm text-gray-400">Last updated: Today</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard title="Total Headcount" value={totalHeadcount.toString()} sub="Active Employees" icon={<Users className="text-blue-500" />} />
        <KPICard title="Turnover Rate (YTD)" value={`${turnoverRate}%`} sub="Annualized Projection" icon={<UserMinus className="text-red-500" />} />
        <KPICard title="Hire Ratio" value={hireExitRatio} sub="Hires per Departure" icon={<Activity className="text-purple-500" />} />
        <KPICard title="New Hires" value={newHires.toString()} sub="Year to Date" icon={<TrendingUp className="text-green-500" />} />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart data={trendData} />
        <GenPyramid data={genData} />
        <ReasonDonut data={reasonData} />
        <ServiceYearsChart data={tenureData} />
      </div>

      <AttritionTable data={attritionData} />
    </div>
  )
}

function KPICard({ title, value, sub, icon }: { title: string, value: string, sub: string, icon: any }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">{value}</h3>
          <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  )
}
