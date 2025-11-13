'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, addDays } from 'date-fns'

interface ModelMetrics {
  id: number
  model_name: string
  rmse: number
  r2_score: number
  mae: number
  training_samples: number
  trained_at: string
}

interface SalesData {
  fecha: string
  total_ventas: number
  num_ordenes: number
}

interface CategorySales {
  categoria_nombre: string
  total_ventas: number
  cantidad_vendida: number
}

interface Prediction {
  prediction_date: string
  predicted_amount: number
  categoria_nombre: string
  confidence_interval_lower: number
  confidence_interval_upper: number
}

export default function PrediccionesDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Model status
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null)
  const [hasModel, setHasModel] = useState(false)

  // Historical data
  const [historicalSales, setHistoricalSales] = useState<SalesData[]>([])
  const [categorySales, setCategorySales] = useState<CategorySales[]>([])

  // Predictions
  const [predictions, setPredictions] = useState<Prediction[]>([])

  // Filters
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [daysToShow, setDaysToShow] = useState(30)
  const [predictionDays, setPredictionDays] = useState(30)

  // Training state
  const [training, setTraining] = useState(false)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      // Load model status
      await loadModelStatus()

      // Load historical sales
      await loadHistoricalSales()

      // Load category sales
      await loadCategorySales()

      // Load predictions (if model exists)
      await loadPredictions()

    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('Error al cargar el dashboard')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, daysToShow, predictionDays])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const loadModelStatus = async () => {
    try {
      console.log('🔍 Loading model status...')
      const res = await fetch('/api/analytics/model/status', {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        console.log('✅ Model status:', {
          has_model: data.has_model,
          model_exists_on_disk: data.model_exists_on_disk,
          predictions_count: data.predictions_count,
          metrics: data.model_metrics
        })
        setHasModel(data.has_model)
        if (data.model_metrics) {
          setModelMetrics(data.model_metrics)
        }
      } else {
        console.error('❌ Failed to load model status:', res.status)
      }
    } catch (err) {
      console.error('❌ Error loading model status:', err)
    }
  }

  const loadHistoricalSales = async () => {
    try {
      const endDate = new Date()
      const startDate = subDays(endDate, daysToShow)

      const params = new URLSearchParams({
        period: period,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      })

      const res = await fetch(`/api/analytics/sales/by-period?${params}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setHistoricalSales(data.data || [])
      }
    } catch (err) {
      console.error('Error loading historical sales:', err)
    }
  }

  const loadCategorySales = async () => {
    try {
      const endDate = new Date()
      const startDate = subDays(endDate, daysToShow)

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      })

      const res = await fetch(`/api/analytics/sales/by-category?${params}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        setCategorySales(data.data || [])
      }
    } catch (err) {
      console.error('Error loading category sales:', err)
    }
  }

  const loadPredictions = async () => {
    if (!hasModel) {
      console.log('⚠️ No model found, skipping predictions load')
      return
    }

    try {
      const startDate = new Date() // Desde hoy, no desde mañana
      const endDate = addDays(new Date(), predictionDays)

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      })

      const url = `/api/analytics/predictions?${params}`
      console.log('📡 Fetching predictions from:', url)
      console.log('  Start date:', startDate.toISOString().split('T')[0])
      console.log('  End date:', endDate.toISOString().split('T')[0])

      const res = await fetch(url, {
        credentials: 'include',
      })

      console.log('📡 Response status:', res.status, res.statusText)

      if (res.ok) {
        const data = await res.json()
        console.log('✅ Predictions received:', {
          success: data.success,
          count: data.count,
          dataLength: data.data?.length || 0,
          sample: data.data?.slice(0, 2)
        })
        setPredictions(data.data || [])
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('❌ Failed to load predictions:', res.status, errorData)
      }
    } catch (err) {
      console.error('❌ Error loading predictions:', err)
    }
  }

  const handleTrainModel = async () => {
    if (training) return

    setTraining(true)
    setError('')

    try {
      const res = await fetch('/api/analytics/model/train', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()

      if (res.ok && data.success) {
        alert('Modelo entrenado exitosamente!')
        await loadDashboardData()
      } else {
        setError(data.message || 'Error al entrenar el modelo')
      }
    } catch (err) {
      console.error('Error training model:', err)
      setError('Error al entrenar el modelo')
    } finally {
      setTraining(false)
    }
  }

  // Calculate summary metrics
  const totalSales = historicalSales.reduce((sum, item) => sum + item.total_ventas, 0)
  const avgSales = historicalSales.length > 0 ? totalSales / historicalSales.length : 0
  const totalOrders = historicalSales.reduce((sum, item) => sum + item.num_ordenes, 0)

  // Aggregate predictions by date
  const predictionsByDate = predictions.reduce((acc, pred) => {
    const date = pred.prediction_date
    if (!acc[date]) {
      acc[date] = { fecha: date, total_predicho: 0, count: 0 }
    }
    acc[date].total_predicho += parseFloat(String(pred.predicted_amount))
    acc[date].count += 1
    return acc
  }, {} as Record<string, { fecha: string; total_predicho: number; count: number }>)

  const predictionsChartData = Object.values(predictionsByDate).map(item => ({
    fecha: item.fecha,
    total_predicho: item.total_predicho,
  }))

  // Calculate projected totals and growth rate
  // Sum the daily totals (already aggregated by date above)
  const totalPredicted = predictionsChartData.reduce((sum, item) => sum + item.total_predicho, 0)
  const avgPredicted = predictionsChartData.length > 0 ? totalPredicted / predictionsChartData.length : 0

  // Calculate growth rate based on average daily sales comparison
  // This compares the average predicted daily sales vs average historical daily sales
  const growthRate = avgSales > 0 ? ((avgPredicted / avgSales) - 1) * 100 : 0

  // Debug logging
  console.log('📊 Dashboard Metrics:', {
    historicalDays: daysToShow,
    predictionDays: predictionDays,
    totalSales,
    avgSales,
    totalOrders,
    predictionsCount: predictions.length,
    predictionsByDateCount: predictionsChartData.length,
    totalPredicted,
    avgPredicted,
    growthRate: `${growthRate.toFixed(1)}%`
  })

  // Aggregate predictions by category
  const predictionsByCategory = predictions.reduce((acc, pred) => {
    const cat = pred.categoria_nombre
    if (!acc[cat]) {
      acc[cat] = { categoria_nombre: cat, total_predicho: 0 }
    }
    acc[cat].total_predicho += parseFloat(String(pred.predicted_amount))
    return acc
  }, {} as Record<string, { categoria_nombre: string; total_predicho: number }>)

  const categoryPredictions = Object.values(predictionsByCategory)

  if (loading && !modelMetrics) {
    return (
      <div className="p-8">
        <div className="text-center">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard de Predicciones de Ventas</h1>
          <p className="text-gray-600 mt-1">Análisis histórico y proyecciones futuras</p>
        </div>

        <button
          onClick={handleTrainModel}
          disabled={training}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            training
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {training ? 'Entrenando...' : 'Reentrenar Modelo'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Model Status */}
      {hasModel && modelMetrics && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Estado del Modelo</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">R² Score</p>
              <p className="text-2xl font-bold text-gray-900">{modelMetrics.r2_score.toFixed(3)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RMSE</p>
              <p className="text-2xl font-bold text-gray-900">${modelMetrics.rmse.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Muestras</p>
              <p className="text-2xl font-bold text-gray-900">{modelMetrics.training_samples}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Entrenado</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(modelMetrics.trained_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasModel && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          No hay modelo entrenado. Haz clic en &quot;Reentrenar Modelo&quot; para crear uno.
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Ventas Totales ({daysToShow}d)</p>
          <p className="text-3xl font-bold text-gray-900">${totalSales.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">{totalOrders} órdenes</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Promedio Diario</p>
          <p className="text-3xl font-bold text-gray-900">${avgSales.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">ventas/día histórico</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Proyección ({predictionDays}d)</p>
          <p className="text-3xl font-bold text-blue-600">${totalPredicted.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {predictionsChartData.length > 0
              ? `≈ $${avgPredicted.toFixed(2)}/día estimado`
              : 'Sin predicciones disponibles'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Crecimiento Esperado</p>
          <p className={`text-3xl font-bold ${
            predictionsChartData.length === 0
              ? 'text-gray-400'
              : growthRate >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {predictionsChartData.length === 0
              ? '-'
              : `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {predictionsChartData.length > 0
              ? 'vs promedio diario histórico'
              : 'Entrena el modelo primero'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agrupación
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Por Día</option>
              <option value="week">Por Semana</option>
              <option value="month">Por Mes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días Históricos
            </label>
            <select
              value={daysToShow}
              onChange={(e) => setDaysToShow(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días de Predicción
            </label>
            <select
              value={predictionDays}
              onChange={(e) => setPredictionDays(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 días</option>
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
            </select>
          </div>
        </div>
      </div>

      {/* Historical Sales Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Ventas Históricas (Últimos {daysToShow} días)
        </h2>
        {historicalSales.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalSales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="fecha"
                tickFormatter={(value) => {
                  try {
                    return format(new Date(value), 'dd/MM')
                  } catch {
                    return value
                  }
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(label) => {
                  try {
                    return format(new Date(label), 'dd/MM/yyyy')
                  } catch {
                    return label
                  }
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="total_ventas"
                stroke="#3b82f6"
                fill="#93c5fd"
                name="Ventas ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">No hay datos históricos disponibles</p>
        )}
      </div>

      {/* Predictions Chart */}
      {hasModel && predictionsChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Predicciones de Ventas (Próximos {predictionDays} días)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={predictionsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="fecha"
                tickFormatter={(value) => {
                  try {
                    return format(new Date(value), 'dd/MM')
                  } catch {
                    return value
                  }
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(label) => {
                  try {
                    return format(new Date(label), 'dd/MM/yyyy')
                  } catch {
                    return label
                  }
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_predicho"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Predicción ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Sales Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Historical by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Ventas por Categoría (Histórico)
          </h2>
          {categorySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categorySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria_nombre" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="total_ventas" fill="#3b82f6" name="Ventas ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay datos disponibles</p>
          )}
        </div>

        {/* Predictions by Category */}
        {hasModel && categoryPredictions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Predicciones por Categoría
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryPredictions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria_nombre" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="total_predicho" fill="#10b981" name="Predicción ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
