import 'reflect-metadata'
import { __prod__, COOKIE_NAME } from './constants'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { HelloResolver } from './resolvers/hello'
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import Redis from 'ioredis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import cors from 'cors'
import { createConnection } from 'typeorm'
import { Post } from './entities/Post'
import { User } from './entities/User'
import { SubForum } from './entities/SubForum'
import path from 'path'
import { Upvote } from './entities/Upvote'

const main = async () => {
  // ~ TypeOrm setup
  const connection = await createConnection({
    type: 'postgres',
    database: 'forum2',
    username: 'stevenmchenry',
    password: '291188',
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, User, SubForum, Upvote],
  })

  // await Post.delete({}) // delete all posts
  await connection.runMigrations()


  // ~ Express setup
  const app = express()

  // CORS 🤮
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  )

  // ~ Redis setup
  const RedisStore = connectRedis(session)
  const redis = new Redis()

  app.use(
    session({
      name: COOKIE_NAME, // what will show up in browser
      store: new RedisStore({
        client: redis, // telling express session we are using redis
        disableTouch: true, // Tells redis to keep session alive until we say otherwise
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 year cookie 💃
        httpOnly: true, // cannot access cookie via frontend js
        secure: __prod__, // only works with https
        sameSite: 'lax', // csrf
      },
      saveUninitialized: false,
      secret: 'BEEF',
      resave: false,
    })
  )

  // ~ Apollo server setup
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }), // allows to use em and session throughout app
  })

  apolloServer.applyMiddleware({ app, cors: false }) // cors is false due to setting up in express

  // ~ All Ears
  app.listen(4000, () => {
    console.log('server started on localhost:4000')
  })
}

main().catch((err) => {
  console.error(err)
})
