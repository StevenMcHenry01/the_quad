// 3rd party imports
import React from 'react'
import { Box, Link, Button, Flex } from '@chakra-ui/core'
import NextLink from 'next/link'
import { useMeQuery, useLogoutMutation } from '../../generated/graphql'
import { isServer } from '../../utils/isServer'
import { useRouter } from 'next/router'

// My imports

interface NavbarProps {}

export const Navbar: React.FC<NavbarProps> = ({ }) => {
  const router = useRouter()
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation()
  const [{ data, fetching }] = useMeQuery({
    pause: isServer()
  })
  let body = null

  // loading
  if (fetching) {
    body = null
  } else if (!data?.me) {
    // user not logged in
    body = (
      <>
        <NextLink href='/login'>
          <Link color='white' mx={3}>
            login
          </Link>
        </NextLink>
        <NextLink href='/register'>
          <Link color='white'>register</Link>
        </NextLink>
      </>
    )
  } else {
    // user logged in
    body = (
      <Flex>
        <Box mx={4}>{data?.me.username}</Box>
        <Button
          isLoading={logoutFetching}
          onClick={() => {
            logout()
            router.reload()
          }}
          variant='link'
        >
          logout
        </Button>
      </Flex>
    )
  }

  return (
    <Box
      p={4}
      bg='tomato'
      style={{ display: 'flex', justifyContent: 'flex-end' }}
    >
      {body}
    </Box>
  )
}
