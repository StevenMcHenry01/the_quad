// 3rd party imports
import React from 'react'
import { Formik, Form } from 'formik'
import { Box, Button } from '@chakra-ui/core'
import { useRouter } from 'next/router'
import { NextPage } from 'next'

// My imports
import { MeDocument, MeQuery, useRegisterMutation } from '../generated/graphql'
import { InputField } from '../components/InputField/InputField'
import { toErrorMap } from '../utils/toErrorMap'
import { MainLayout } from '../components/MainLayout/MainLayout'
import withApollo from '../utils/withApollo'

const Register: NextPage = ({}) => {
  const router = useRouter()
  const [register] = useRegisterMutation()
  return (
    <MainLayout variant='small'>
      <Formik
        initialValues={{ email: '', username: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const res = await register({
            variables: { options: values },
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: 'Query',
                  me: data?.register.user,
                },
              })
            },
          })
          if (res.data?.register.errors) {
            setErrors(toErrorMap(res.data.register.errors))
          } else if (res.data?.register.user) {
            // worked so send to home page
            router.push('/')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name='username'
              placeholder='username'
              label='Username'
            />
            <Box mt={4}>
              <InputField name='email' placeholder='email' label='Email' />
            </Box>
            <Box mt={4}>
              <InputField
                name='password'
                placeholder='password'
                label='Password'
                type='password'
              />
            </Box>
            <Button
              mt={4}
              type='submit'
              isLoading={isSubmitting}
              variantColor='teal'
            >
              register
            </Button>
          </Form>
        )}
      </Formik>
    </MainLayout>
  )
}

export default withApollo({ ssr: false })(Register)
