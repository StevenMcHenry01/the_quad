import React from 'react'
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
import withApollo from '../utils/withApollo'

const Index: NextPage = () => {
  const { data, error, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 20,
      cursor: null as null | string,
    },
    notifyOnNetworkStatusChange: true, // allows for button loading state
  })

  const { data: meData } = useMeQuery({
    skip: isServer(),
  })

  const [deletePost] = useDeletePostMutation()

  if (!loading && !data) {
    return <div>Oops you got no posts</div>
  }

  return (
    <MainLayout>
      <NextLink href='/create-post'>
        <Link>create post</Link>
      </NextLink>
      <br />
      {!data && loading ? (
        <p>Loading...</p>
      ) : (
        <Stack spacing={4}>
          {data!.posts.posts.map((p) => {
            return !p ? null : ( // some posts will be null after deleting
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
                          deletePost({
                            variables: { id: p.id },
                            update: (cache) => {
                              cache.evict({ id: 'Post:' + p.id })
                            },
                          })
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
          })}
        </Stack>
      )}
      {data && data.posts.hasMore && (
        <Flex>
          <Button
            onClick={() => {
              fetchMore({
                variables: {
                  limit: variables?.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt,
                },
              })
            }}
            isLoading={loading}
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

export default withApollo({ ssr: true })(Index)
