// 3rd party imports
import React from 'react'
import { Formik, Form } from 'formik'
import { Box, Button, Stack, Text, Link, Flex } from '@chakra-ui/core'
import { useRouter } from 'next/router'

// My imports
import { useLoginMutation } from '../generated/graphql'
import { Wrapper } from '../components/Wrapper/Wrapper'
import { InputField } from '../components/InputField/InputField'
import { toErrorMap } from '../utils/toErrorMap'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient'
import NextLink from 'next/link'
import { MainLayout } from '../components/MainLayout/MainLayout'
import { NextPage } from 'next'

const Login: NextPage = () => {
  const router = useRouter()
  const [, login] = useLoginMutation()
  return (
    <MainLayout variant='small'>
      <Formik
        initialValues={{ usernameOrEmail: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const res = await login(values)
          if (res.data?.login.errors) {
            setErrors(toErrorMap(res.data.login.errors))
          } else if (res.data?.login.user) {
            // if sent from isAuth, then send to their previous page
            if (typeof router.query.next === 'string') {
              router.push(router.query.next)
            } else {
              // otherwise just send to home
              router.push('/')
            }
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Stack spacing={4}>
              <InputField
                name='usernameOrEmail'
                placeholder='username or email'
                label='Username or Email'
              />
              <Box>
                <InputField
                  name='password'
                  placeholder='password'
                  label='Password'
                  type='password'
                />
                <Flex mt={2}>
                  <NextLink href='/forgot-password'>
                    <Link ml='auto'>fogot password?</Link>
                  </NextLink>
                </Flex>
              </Box>
              <Button
                type='submit'
                isLoading={isSubmitting}
                variantColor='teal'
              >
                login
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </MainLayout>
  )
}

export default withUrqlClient(createUrqlClient)(Login)
