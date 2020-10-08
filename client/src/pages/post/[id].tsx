import { Box } from '@chakra-ui/core'
import { NextPage } from 'next'
import React from 'react'
import { MainLayout } from '../../components/MainLayout/MainLayout'
import { useGetPostFromUrl } from '../../hooks/useGetPostFromUrl'
import withApollo from '../../utils/withApollo'

const Post: NextPage = ({}) => {
  const { data, error, loading } = useGetPostFromUrl()
  if (loading) {
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

export default withApollo({ssr: true})(Post)
