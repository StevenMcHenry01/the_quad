// 3rd party imports
import React from 'react'
import { Formik, Form } from 'formik'
import { Box, Button } from '@chakra-ui/core'
import { useRouter } from 'next/router'
import { NextPage } from 'next'

// My imports
import { useRegisterMutation } from '../generated/graphql'
import { InputField } from '../components/InputField/InputField'
import { toErrorMap } from '../utils/toErrorMap'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient'
import { MainLayout } from '../components/MainLayout/MainLayout'

const Register: NextPage = ({}) => {
  const router = useRouter()
  const [, register] = useRegisterMutation()
  return (
    <MainLayout variant='small'>
      <Formik
        initialValues={{ email: '', username: '', password: '' }}
        onSubmit={async (values, { setErrors }) => {
          const res = await register({ options: values })
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

export default withUrqlClient(createUrqlClient)(Register)
