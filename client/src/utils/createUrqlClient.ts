import {
  dedupExchange,
  fetchExchange,
  Exchange,
  stringifyVariables,
} from 'urql'
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  DeletePostMutationVariables,
} from '../generated/graphql'
import { betterUpdateQuery } from './betterUpdateQuery'
import { cacheExchange, Resolver } from '@urql/exchange-graphcache'
import Router from 'next/router'
import { pipe, tap } from 'wonka'
import { isServer } from './isServer'

// handle global auth errors
const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error?.message.includes('not authenticated')) {
        Router.replace('/login')
      }
    })
  )
}

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info
    const allFields = cache.inspectFields(entityKey)
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName)
    const size = fieldInfos.length
    if (size === 0) {
      return undefined
    }

    const isInCache = cache.resolve(
      cache.resolveFieldByKey(
        entityKey,
        `${fieldName}(${stringifyVariables(fieldArgs)})`
      ) as string,
      'posts'
    )
    info.partial = !isInCache
    let hasMore = true

    const results: string[] = []
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string
      const data = cache.resolve(key, 'posts') as string[]
      const _hasMore = cache.resolve(key, 'hasMore')
      if (!_hasMore) {
        hasMore = _hasMore as boolean
      }
      results.push(...data)
    })

    return {
      __typename: 'PaginatedPosts',
      hasMore,
      posts: results,
    }
  }
}

const invalidateAllPosts = (cache: any) => {
  const allFields = cache.inspectFields('Query')
  const fieldInfos = allFields.filter((info: any) => info.fieldName === 'posts')
  fieldInfos.forEach((fi: any) => {
    cache.invalidate('Query', 'posts', fi.arguments || {})
  })
}

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = ''
  if (isServer()) {
    // needed for ssr weirdness on first request
    cookie = ctx?.req?.headers?.cookie
  }
  return {
    url: process.env.NEXT_PUBLIC_API_URL as string,
    fetchOptions: {
      credentials: 'include' as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    // custom cache updates so that we know if you are logged in for sure
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(), // matches frontend posts query
          },
        },
        updates: {
          Mutation: {
            updatePost: (_result, args, cache, info) => {
              invalidateAllPosts(cache)
            },
            deletePost: (_result, args, cache, info) => {
              cache.invalidate({
                __typename: 'Post',
                id: (args as DeletePostMutationVariables).id,
              })
            },
            createPost: (_result, args, cache, info) => {
              invalidateAllPosts(cache)
            },
            logout: (_result, args, cache, info) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null }) // just sets me query to null
              )
            },
            login: (_result, args, cache, info) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                {
                  query: MeDocument,
                },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query
                  } else {
                    return {
                      me: result.login.user,
                    }
                  }
                }
              )
              invalidateAllPosts(cache)
            },
            register: (_result, args, cache, info) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                {
                  query: MeDocument,
                },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query
                  } else {
                    return {
                      me: result.register.user,
                    }
                  }
                }
              )
            },
          },
        },
      }),
      errorExchange, // handle global auth errors
      ssrExchange,
      fetchExchange,
    ],
  }
}
