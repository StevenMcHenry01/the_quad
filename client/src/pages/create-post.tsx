// 3rd party imports
import { Button, Stack } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React from 'react'
import { InputField } from '../components/InputField/InputField'
import { MainLayout } from '../components/MainLayout/MainLayout'
import { useCreatePostMutation } from '../generated/graphql'
import { useIsAuth } from '../hooks/useIsAuth'
import { createUrqlClient } from '../utils/createUrqlClient'
import { NextPage } from 'next'

// My imports

const CreatePost: NextPage = () => {
  const [, createPost] = useCreatePostMutation()
  const router = useRouter()

  // make sure logged in
  useIsAuth()

  return (
    <MainLayout variant='small'>
      <Formik
        initialValues={{ title: '', body: '' }}
        onSubmit={async (values, { setErrors }) => {
          const newValues = { ...values, subForumName: 'general' }
          const { error } = await createPost({ input: newValues })
          if (!error) router.push('/')
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Stack spacing={4}>
              <InputField name='title' placeholder='title' label='Title' />
              <InputField
                name='body'
                textarea
                placeholder='body text...'
                label='Body Text'
              />
              <Button
                type='submit'
                isLoading={isSubmitting}
                variantColor='teal'
              >
                create post
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </MainLayout>
  )
}

export default withUrqlClient(createUrqlClient)(CreatePost)
