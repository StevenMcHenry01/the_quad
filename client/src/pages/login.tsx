// 3rd party imports
import React from 'react'
import { Formik, Form } from 'formik'
import { Box, Button, Stack, Link, Flex } from '@chakra-ui/core'
import { useRouter } from 'next/router'

// My imports
import { MeDocument, MeQuery, useLoginMutation } from '../generated/graphql'
import { InputField } from '../components/InputField/InputField'
import { toErrorMap } from '../utils/toErrorMap'
import NextLink from 'next/link'
import { MainLayout } from '../components/MainLayout/MainLayout'
import { NextPage } from 'next'
import withApollo from '../utils/withApollo'

const Login: NextPage = () => {
  const router = useRouter()
  const [login] = useLoginMutation()
  return (
    <MainLayout variant='small'>
      <Formik
        initialValues={{ usernameOrEmail: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const res = await login({
            variables: values,
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: 'Query',
                  me: data?.login.user,
                },
              })
              cache.evict({ fieldName: 'posts' })
            },
          })
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

export default withApollo({ ssr: false })(Login)
