// 3rd party imports
import { ThemeProvider, CSSReset } from '@chakra-ui/core'
import 'nprogress/nprogress.css'

// my imports
import '../styles/base.scss'
import theme from '../styles/theme'

function MyApp({ Component, pageProps }: any) {
  return (
    <ThemeProvider theme={theme}>
      <CSSReset />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp
