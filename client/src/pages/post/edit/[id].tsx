import { Button, Stack } from '@chakra-ui/core'
import { Form, Formik } from 'formik'
import { NextPage } from 'next'
import React from 'react'
import { InputField } from '../../../components/InputField/InputField'
import { MainLayout } from '../../../components/MainLayout/MainLayout'
import { useUpdatePostMutation } from '../../../generated/graphql'
import { useGetPostFromUrl } from '../../../hooks/useGetPostFromUrl'
import { useGetIntId } from '../../../hooks/useGetIntId'
import { useRouter } from 'next/router'
import withApollo from '../../../utils/withApollo'

const EditPost: NextPage = ({}) => {
  const router = useRouter()
  const { data, error, loading } = useGetPostFromUrl()
  const intId = useGetIntId()
  const [updatePost] = useUpdatePostMutation()

  if (loading) {
    return (
      <MainLayout>
        <div>Loading...</div>
      </MainLayout>
    )
  }

  if (!data?.post) {
    return (
      <MainLayout>
        <div>No Post found</div>
      </MainLayout>
    )
  }

  return (
    <MainLayout variant='small'>
      <Formik
        initialValues={{
          title: data.post.title,
          body: data.post.body,
        }}
        onSubmit={async (values, { setErrors }) => {
          await updatePost({ variables: { id: intId, ...values } })
          router.back()
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
                update post
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </MainLayout>
  )
}

export default withApollo({ssr: false})(EditPost)
