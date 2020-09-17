// 3rd party imports
import { ThemeProvider, CSSReset } from '@chakra-ui/core'
import 'nprogress/nprogress.css'

// my imports
import '../styles/base.scss'
import theme from '../styles/theme'
import { Navbar } from '../components/Navbar/Navbar'
import { TopProgressBar } from '../utils/TopProgressBarImport'

function MyApp({ Component, pageProps }: any) {
  return (
    <ThemeProvider theme={theme}>
      <CSSReset />
      <TopProgressBar />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
