// 3rd party imports
import React from 'react'
import { Wrapper } from '../Wrapper/Wrapper'
import { Navbar } from '../Navbar/Navbar'

// My imports

interface MainLayoutProps {
  variant?: 'small' | 'regular'
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  variant,
  children,
}) => {
  return (
    <>
      <Navbar />
      <Wrapper variant={variant}>{children}</Wrapper>
    </>
  )
}
