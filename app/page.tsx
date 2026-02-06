import { getDashboardData } from '@/lib/analytics'
import { getLeavingReasons } from '@/lib/actions'
import { TrendChart } from '@/components/TrendChart'
import { GenPyramid } from '@/components/GenPyramid'
import { ReasonDonut } from '@/components/ReasonDonut'
import { ServiceYearsChart } from '@/components/ServiceYearsChart'
import { GenderPieChart } from '@/components/GenderPieChart'
import { MovementSummaryChart } from '@/components/MovementSummaryChart'
import { PositionLevelPieChart } from '@/components/PositionLevelPieChart'
import { Users, TrendingDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const [{ employees, movements, positionLevels }, leavingReasons] = await Promise.all([
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

  // Count Movements by Type
  const movementCounts: Record<string, number> = {}
  movements.forEach(m => {
    const type = m.movement_type
    movementCounts[type] = (movementCounts[type] || 0) + 1
  })

  const totalMovements = movements.length
  const movementData = Object.entries(movementCounts).map(([name, value]) => ({
    name,
    value,
    percent: totalMovements > 0 ? parseFloat(((value / totalMovements) * 100).toFixed(0)) : 0
  }))

  // Resignations count
  const resignations = movements.filter(m => m.movement_type.includes('Resignation')).length

  // Turnover Rate (Simple Calc: Resignations / Current Headcount)
  const turnoverRate = totalHeadcount > 0 ? ((resignations / totalHeadcount) * 100).toFixed(1) : '0.0'

  // 2. Gender Distribution
  const genderCounts: Record<string, number> = { 'Male': 0, 'Female': 0 }
  employees.forEach(e => {
    const gender = e.gender || 'Unknown'
    if (gender === 'Male' || gender === 'Female') {
      genderCounts[gender]++
    }
  })
  const genderData = Object.entries(genderCounts).map(([name, value]) => ({ name, value }))

  // 3. Trend Data Preparation
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

  // 4. Demographics (Gen Pyramid)
  const genCounts: Record<string, number> = { 'Gen Z': 0, 'Gen Y': 0, 'Gen X': 0, 'Baby Boomer': 0 }
  employees.forEach(e => {
    const gen = e.generation || 'Unknown'
    if (genCounts[gen] !== undefined) genCounts[gen]++
  })

  const genData = Object.entries(genCounts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  // 5. Position Level Distribution
  const positionCounts: Record<number, number> = {}
  employees.forEach(e => {
    if (e.position_level_id) {
      positionCounts[e.position_level_id] = (positionCounts[e.position_level_id] || 0) + 1
    }
  })

  const positionData = positionLevels
    .filter(pl => positionCounts[pl.id])
    .map(pl => ({
      name: pl.level_name,
      value: positionCounts[pl.id] || 0
    }))

  // 6. Reasons for Leaving
  const reasonCounts: Record<string, number> = {}

  movements.filter(m => m.reason_code).forEach(m => {
    // Use Reason Detail or mapped name or code
    let label = m.reason_detail
    if (!label && m.reason_code) {
      label = reasonMap.get(m.reason_code) || m.reason_code
    }
    label = label || 'Unknown'
    reasonCounts[label] = (reasonCounts[label] || 0) + 1
  })

  // Sort and take top 5
  const reasonData = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  // 7. Service Years Distribution
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

  const tenureData = Object.entries(tenureBuckets)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  // 8. Attrition Risk List
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manpower Dashboard</h2>
          <p className="text-gray-500 mt-1">Real-time manpower insights and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Live Data</span>
          <span className="text-sm text-gray-400">Year 2026</span>
        </div>
      </div>

      {/* Top Section: KPI + Gender + Movement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Headcount KPI Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Headcount</p>
              <h3 className="text-4xl font-bold text-gray-800 mt-2">{totalHeadcount}</h3>
              <p className="text-xs text-gray-400 mt-1">Active Employees</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="text-blue-500 w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-500 font-medium">{turnoverRate}%</span>
            <span className="text-xs text-gray-400">Turnover Rate</span>
          </div>
        </div>

        {/* Gender Distribution */}
        <GenderPieChart data={genderData} />

        {/* Movement Summary - spans 2 columns */}
        <div className="md:col-span-2 xl:col-span-2">
          <MovementSummaryChart data={movementData} />
        </div>
      </div>

      {/* Middle Section: 3 Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ServiceYearsChart data={tenureData} />
        <PositionLevelPieChart data={positionData} />
        <GenPyramid data={genData} />
      </div>

      {/* Bottom Section: Reasons + Trend */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ReasonDonut data={reasonData} />
        <TrendChart data={trendData} />
      </div>
    </div>
  )
}
