import React, { useState } from 'react'
import { Navbar } from '../components/Navbar/Navbar'
import { withUrqlClient } from 'next-urql'
import { createUrqlClient } from '../utils/createUrqlClient'
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from '../generated/graphql'
import { MainLayout } from '../components/MainLayout/MainLayout'
import NextLink from 'next/link'
import {
  Link,
  Stack,
  Box,
  Heading,
  Text,
  Flex,
  Button,
  IconButton,
} from '@chakra-ui/core'
import { NextPage } from 'next'
import { VotingRegion } from '../components/VotingRegion/VotingRegion'
import { isServer } from '../utils/isServer'

const Index: NextPage = () => {
  const [variables, setVariables] = useState({
    limit: 20,
    cursor: null as null | string,
  })
  const [{ data, fetching }] = usePostsQuery({
    variables,
  })

  const [{ data: meData, fetching: meFetching }] = useMeQuery({
    pause: isServer(),
  })

  const [, deletePost] = useDeletePostMutation()

  if (!fetching && !data) {
    return <div>Oops you got no posts</div>
  }

  return (
    <MainLayout>
      <NextLink href='/create-post'>
        <Link>create post</Link>
      </NextLink>
      <br />
      {!data && fetching ? (
        <p>Loading...</p>
      ) : (
        <Stack spacing={4}>
          {data!.posts.posts.map((p) =>
            !p ? null : ( // some posts will be null after deleting
              <Flex key={p.id} p={5} shadow='md' borderWidth='1px'>
                <VotingRegion
                  points={p.points}
                  id={p.id}
                  voteStatus={p.voteStatus}
                />
                <Box>
                  <NextLink href='/post/[id]' as={`/post/${p.id}`}>
                    <Link>
                      <Heading fontSize='xl'>{p.title}</Heading>
                    </Link>
                  </NextLink>
                  <Text>create by: {p.originalPoster?.username}</Text>
                  <Text>{p.bodySnippet}...</Text>
                  {p.originalPoster?.id === meData?.me?.id && (
                    <>
                      <IconButton
                        aria-label='delete post'
                        icon='delete'
                        onClick={() => {
                          deletePost({ id: p.id })
                        }}
                      />
                      <NextLink
                        href='/post/edit/[id]'
                        as={`/post/edit/${p.id}`}
                      >
                        <IconButton
                          as={Link}
                          aria-label='edit post'
                          icon='edit'
                        />
                      </NextLink>
                    </>
                  )}
                </Box>
              </Flex>
            )
          )}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button
            onClick={() => {
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }}
            isLoading={fetching}
            my={4}
            mx='auto'
          >
            Load More
          </Button>
        </Flex>
      )}
    </MainLayout>
  )
}

export default withUrqlClient(createUrqlClient, { ssr: true })(Index)
