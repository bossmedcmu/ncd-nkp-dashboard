import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'

// Register once. Datalabels is opted-in per chart (plugins: [ChartDataLabels]).
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)
ChartJS.defaults.font.family = "'Prompt', sans-serif"
ChartJS.defaults.color = '#475569'

export { ChartDataLabels }

export const palette = [
  '#0f766e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e',
  '#6366f1', '#14b8a6', '#eab308', '#06b6d4', '#f97316', '#84cc16',
]
