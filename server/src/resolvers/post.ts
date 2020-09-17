import {
  Resolver,
  Query,
  Ctx,
  Arg,
  Mutation,
  InputType,
  Field,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType,
} from 'type-graphql'
import { Post } from '../entities/Post'
import { MyContext } from '../types'
import { isAuth } from '../middleware/isAuth'
import { getConnection, createQueryBuilder } from 'typeorm'
import { User } from '../entities/User'
import { SubForum } from '../entities/SubForum'
import { Upvote } from '../entities/Upvote'

@InputType()
class PostInput {
  @Field()
  title: string
  @Field()
  body: string
  @Field()
  subForumName: string
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[]
  @Field()
  hasMore: boolean
}

@Resolver(Post)
export class PostResolver {
  // ~ FIELD RESOLVER - allows to query only the snippet
  @FieldResolver(() => String)
  bodySnippet(@Root() root: Post) {
    return root.body.slice(0, 50)
  }

  // ~ VOTE
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ): Promise<Post | undefined> {
    const isUpvote = value !== -1
    const realValue = isUpvote ? 1 : -1
    const { userId } = req.session as any

    // check if user has made a vote for this post
    const upvote = await Upvote.findOne({ where: { postId, userId } })

    // they have but want to change it
    if (upvote && upvote.value !== realValue) {
      upvote.value = realValue
      await upvote.save()
      // increment or decrement post points by 2
      // think you are taking away AND adding or viceversa
      await getConnection()
        .createQueryBuilder()
        .update('Post')
        .set({ points: () => `points + ${realValue * 2}` })
        .where('id = :id', { id: postId })
        .execute()
    } else if (!upvote) {
      // never voted on post
      await Upvote.insert({
        userId,
        postId,
        value: realValue,
      })
      // increment or decrement post points
      await getConnection()
        .createQueryBuilder()
        .update('Post')
        .set({ points: () => `points + ${realValue}` })
        .where('id = :id', { id: postId })
        .execute()
    }

    const post = await Post.findOne(postId)

    return post
  }

  // ~ GET ALL POSTS
  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit) // cap limit at 50
    const realLimitPlusOne = realLimit + 1

    const replacements: any[] = [realLimitPlusOne]

    if (req.session?.userId) {
      replacements.push(req.session?.userId)
    }

    let cursorIdx = 3
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)))
      cursorIdx = replacements.length
    }

    const posts = await getConnection().query(
      `
      select p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u."createdAt",
        'updatedAt', u."updatedAt"
        ) "originalPoster",
      ${
        req.session?.userId
          ? '(select value from upvote where "userId" = $2 and "postId" = p.id) "voteStatus"'
          : 'null as "voteStatus"'
      }
      from post p
      inner join public.user u on u.id = p."opId"
      ${cursor ? `where p."createdAt" < $${cursorIdx}` : ''}
      order by p."createdAt" DESC
      limit $1
    `,
      replacements
    )

    // console.log('posts: ', posts)

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne, // will return false if the plusOne surpasses last post
    }
  }

  // ~ GET POST
  @Query(() => Post, { nullable: true })
  async post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
    // const post: any = await createQueryBuilder('Post')
    //   .leftJoinAndSelect('Post.originalPoster', 'originalPoster')
    //   .where('Post.id = :id', { id: id })
    //   .getOne()
    // console.log(post)
    return Post.findOne(id, { relations: ['originalPoster'] })
  }

  // ~ CREATE POST
  @Mutation(() => Post)
  @UseMiddleware(isAuth) // guarded resolver
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    const user = await User.findOne(parseInt(req.session?.userId))
    const sub = await SubForum.findOne({ name: input.subForumName })
    return Post.create({
      title: input.title,
      body: input.body,
      originalPoster: user,
      subId: 1,
      opId: req.session?.userId,
    }).save()
  }

  // ~ UPDATE POST
  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id', () => Int) id: number,
    @Arg('title') title: string,
    @Arg('body') body: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | undefined> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, body })
      .where('id = :id and "opId" = :opId', { id, opId: req.session?.userId })
      .returning('*')
      .execute()

    return result.raw[0]
  }

  // ~ DELETE POST
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await Post.delete({ id, opId: req.session?.userId }) // can only delete if op is in context
    return true
  }
}
