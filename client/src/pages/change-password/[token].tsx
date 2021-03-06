// 3rd party imports
import React, { useState } from 'react'
import { NextPage } from 'next'
import { Wrapper } from '../../components/Wrapper/Wrapper'
import { Formik, Form } from 'formik'
import { toErrorMap } from '../../utils/toErrorMap'
import { InputField } from '../../components/InputField/InputField'
import { Box, Button, Alert, AlertIcon, Link, Stack } from '@chakra-ui/core'
import {
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
} from '../../generated/graphql'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import withApollo from '../../utils/withApollo'

// My imports

const ChangePassword: NextPage = () => {
  const [changePassword] = useChangePasswordMutation()
  const router = useRouter()
  const [tokenError, setTokenError] = useState('')

  return (
    <Wrapper variant='small'>
      <Formik
        initialValues={{ newPassword: '', newPasswordConfirm: '' }}
        onSubmit={async (values, { setErrors }) => {
          // make sure passwords match
          if (values.newPassword !== values.newPasswordConfirm) {
            setErrors({
              newPassword: 'not the same',
              newPasswordConfirm: 'not the same',
            })
          }

          const res = await changePassword({
            variables: {
              token:
                // query param name comes from name of file
                typeof router.query.token === 'string'
                  ? router.query.token
                  : '',
              newPassword: values.newPassword,
            },
            update: (cache, { data }) => {
              cache.writeQuery<MeQuery>({
                query: MeDocument,
                data: {
                  __typename: 'Query',
                  me: data?.changePassword.user,
                },
              })
              cache.evict({ fieldName: 'posts' })
            },
          })
          if (res.data?.changePassword.errors) {
            const errorMap = toErrorMap(res.data.changePassword.errors)
            if ('token' in errorMap) {
              setTokenError(errorMap.token)
            }
            setErrors(toErrorMap(res.data.changePassword.errors))
          } else if (res.data?.changePassword.user) {
            // worked so send to home page
            router.push('/')
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Stack spacing={4}>
              <InputField
                name='newPassword'
                placeholder='new password'
                label='New Password'
                type='password'
              />
              <Box>
                <InputField
                  name='newPasswordConfirm'
                  placeholder='new password'
                  label='Confirm New Password'
                  type='password'
                />
              </Box>
              {tokenError && (
                <Box>
                  <Alert status='warning'>
                    <AlertIcon />
                    {tokenError}
                  </Alert>
                  <NextLink href='/forgot-password'>
                    <Link>resend reset link</Link>
                  </NextLink>
                </Box>
              )}
              <Button
                type='submit'
                isLoading={isSubmitting}
                variantColor='teal'
              >
                change password
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </Wrapper>
  )
}

export default withApollo({ ssr: false })(ChangePassword)
