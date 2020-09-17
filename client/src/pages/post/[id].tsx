import { Box } from '@chakra-ui/core'
import { NextPage } from 'next'
import { withUrqlClient } from 'next-urql'
import React from 'react'
import { MainLayout } from '../../components/MainLayout/MainLayout'
import { useGetPostFromUrl } from '../../hooks/useGetPostFromUrl'
import { createUrqlClient } from '../../utils/createUrqlClient'

const Post: NextPage = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl()
  if (fetching) {
    return (
      <MainLayout>
        <div>loading...</div>
      </MainLayout>
    )
  }

  if (!data?.post) {
    return (
      <MainLayout>
        <Box>Could not find post</Box>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      {data.post.body} - {data.post.originalPoster?.username}
    </MainLayout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Post)
