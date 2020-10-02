import 'reflect-metadata'
import 'dotenv-safe/config'
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
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: false,
    migrations: [path.join(__dirname, './migrations/*')],
    entities: [Post, User, SubForum, Upvote]
  })

  // await Post.delete({}) // delete all posts
  await connection.runMigrations()

  // ~ Express setup
  const app = express()

  // needed for nginx proxy and cookies
  app.set('trust proxy', 1)

  // CORS 🤮
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  )

  // ~ Redis setup
  const RedisStore = connectRedis(session)
  const redis = new Redis(process.env.REDIS_URL)

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
        domain: __prod__ ? '.thequad.site' : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSSION_SECRET,
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
  app.listen(parseInt(process.env.PORT), () => {
    console.log(`server started on localhost:${process.env.PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
})
