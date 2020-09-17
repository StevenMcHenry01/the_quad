// 3rd party imports
import React, { useState } from 'react'
import { Flex, IconButton } from '@chakra-ui/core'
import { useVoteMutation } from '../../generated/graphql'

// My imports

interface VotingRegionProps {
  points: number
  id: number
  voteStatus: number | null | undefined
}

export const VotingRegion: React.FC<VotingRegionProps> = ({ points, id, voteStatus }) => {
  const [, vote] = useVoteMutation()
  const [hasUpvote, setHasUpvote] = useState(voteStatus === 1 ? true : false)
  const [hasDownVote, setHasDownvote] = useState(voteStatus === -1 ? true : false)
  const [loadingState, setLoadingState] = useState<
    'upvote-loading' | 'downvote-loading' | 'not-loading'
    >('not-loading')
  return (
    <Flex direction='column' justifyContent='center' alignItems='center' mr={4}>
      <IconButton
        icon='chevron-up'
        aria-label='upvote post'
        variantColor={hasUpvote ? 'green' : undefined}
        isLoading={loadingState === 'upvote-loading'}
        onClick={async () => {
          if (hasUpvote) {
            return
          }
          setHasUpvote(true)
          setHasDownvote(false)
          setLoadingState('upvote-loading')
          const post = await vote({
            postId: id,
            value: 1,
          })
          setLoadingState('not-loading')
        }}
      />
      {points}
      <IconButton
        icon='chevron-down'
        aria-label='downvote post'
        variantColor={hasDownVote ? 'red' : undefined}
        isLoading={loadingState === 'downvote-loading'}
        onClick={async () => {
          if (hasDownVote) {
            return
          }
          setHasDownvote(true)
          setHasUpvote(false)
          setLoadingState('downvote-loading')
          await vote({
            postId: id,
            value: -1,
          })
          setLoadingState('not-loading')
        }}
      />
    </Flex>
  )
}
