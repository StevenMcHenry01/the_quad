import dynamic from 'next/dynamic'

export const TopProgressBar = dynamic(
  () => {
    return import('../components/TopProgressBar/TopProgressBar')
  },
  { ssr: false }
)