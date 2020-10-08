// 3rd party imports
import React, { useState } from 'react'
import { Formik, Form } from 'formik'
import { Stack, Button, Alert, AlertIcon } from '@chakra-ui/core'
import { InputField } from '../components/InputField/InputField'
import { useRouter } from 'next/router'
import { useForgotPasswordMutation } from '../generated/graphql'
import { MainLayout } from '../components/MainLayout/MainLayout'
import { NextPage } from 'next'
import withApollo from '../utils/withApollo'

// My imports

const ForgotPassword: NextPage = () => {
  const router = useRouter()
  const [emailSend, setEmailSent] = useState(false)
  const [fogotPassword] = useForgotPasswordMutation()
  return (
    <MainLayout variant='small'>
      <Formik
        initialValues={{ email: '' }}
        onSubmit={async (values) => {
          const res = await fogotPassword({ variables: values })
          setEmailSent(true)
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Stack spacing={4}>
              <InputField
                name='email'
                placeholder='email'
                label='Email associated with account'
                type='email'
              />
              {emailSend && (
                <Alert status='success'>
                  <AlertIcon />
                  Email sent!
                </Alert>
              )}
              <Button
                type='submit'
                isLoading={isSubmitting}
                variantColor='teal'
              >
                send reset link
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </MainLayout>
  )
}

export default withApollo({ssr: false})(ForgotPassword)
