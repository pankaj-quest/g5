import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/index.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    color?: string
  }>
  title?: string
}

const DARK_COLORS = ['#ffffff', '#888888', '#555555', '#aaaaaa', '#666666']
const LIGHT_COLORS = ['#111111', '#666666', '#999999', '#444444', '#888888']

export function LineChart({ labels, datasets, title }: Props) {
  const theme = useSelector((s: RootState) => s.theme.theme)
  const isDark = theme === 'dark'
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  return (
    <Line
      data={{
        labels,
        datasets: datasets.map((d, i) => {
          const color = d.color || colors[i % colors.length]
          return {
            label: d.label,
            data: d.data,
            borderColor: color,
            backgroundColor: color + '08',
            tension: 0.4,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 1.5,
            pointBackgroundColor: color,
            pointBorderColor: 'transparent',
          }
        }),
      }}
      options={{
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: isDark ? '#666666' : '#999999',
              boxWidth: 8,
              boxHeight: 8,
              borderRadius: 2,
              useBorderRadius: true,
              font: { size: 11, family: 'Inter' },
              padding: 16,
            },
          },
          title: {
            display: !!title,
            text: title,
            color: isDark ? '#ededed' : '#111111',
            font: { size: 13, family: 'Inter' },
            padding: { bottom: 16 },
          },
          tooltip: {
            backgroundColor: isDark ? '#1c1c1c' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            titleColor: isDark ? '#ededed' : '#111111',
            bodyColor: isDark ? '#a0a0a0' : '#555555',
            padding: 12,
            cornerRadius: 10,
            titleFont: { size: 12, family: 'Inter' },
            bodyFont: { size: 11, family: 'Inter' },
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' },
            ticks: { color: isDark ? '#444444' : '#aaaaaa', font: { size: 11, family: 'Inter' }, padding: 8 },
            border: { display: false },
          },
          y: {
            beginAtZero: true,
            grid: { color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)' },
            ticks: { color: isDark ? '#444444' : '#aaaaaa', font: { size: 11, family: 'Inter' }, padding: 8 },
            border: { display: false },
          },
        },
      }}
    />
  )
}
