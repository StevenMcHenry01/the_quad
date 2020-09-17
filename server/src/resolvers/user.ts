import {
  Resolver,
  Query,
  Mutation,
  Field,
  Arg,
  Ctx,
  ObjectType,
  FieldResolver,
  Root,
} from 'type-graphql'
import { MyContext } from '../types'
import { User } from '../entities/User'
import argon2 from 'argon2'
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from '../constants'
import { UsernamePasswordInput } from '../types/UsernamePasswordInput'
import { validateRegister } from '../utils/validateRegister'
import { sendEmail } from '../utils/sendEmail'
import { v4 } from 'uuid'
import { getConnection } from 'typeorm'

@ObjectType()
class FieldError {
  @Field()
  field: string
  @Field()
  message: string
}

@ObjectType() // can return
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver(User)
export class UserResolver {
  // ~ Hide others email field resolver
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user so we can show email
    if (req.session?.userId === user.id) {
      return user.email
    }

    console.log("helere")

    // current user wants to see someone else's email
    return ""
  }

  // ~ CHANGE PASSWORD
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    // check for password length
    if (newPassword.length <= 5) {
      return {
        errors: [
          {
            field: 'newPassword',
            message: 'new password must be longer than 5 characters',
          },
        ],
      }
    }

    const userId = await redis.get(FORGOT_PASSWORD_PREFIX + token)
    if (!userId) {
      return {
        errors: [
          {
            field: 'token',
            message: 'token expired.',
          },
        ],
      }
    }

    const userIdParsed = parseInt(userId)

    // user sent good token so get user
    const user = await User.findOne(userIdParsed)

    if (!user) {
      return {
        errors: [
          {
            field: 'token',
            message: 'user no longer exists.',
          },
        ],
      }
    }

    // hash new password
    const hashedPassword = await argon2.hash(newPassword)

    // save updated user password in db
    User.update({ id: userIdParsed }, { password: hashedPassword })

    // deactivate key
    redis.del(FORGOT_PASSWORD_PREFIX + token)

    // log in user after changed password
    if (req && req.session) {
      req.session.userId = user.id
    }

    return { user }
  }

  // ~ FORGOT PASSWORD EMAIL SEND
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } })
    if (!user) {
      // the email is not in the db but best not to let them know
      return true
    }

    // unique token for user email reset
    const token = v4()

    // store token in redis
    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      'ex',
      1000 * 60 * 60 * 24 * 3
    ) // three day token

    const html = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`

    await sendEmail(email, html)

    return true
  }

  // ~ ME
  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // user is not logged in
    if (!req.session!.userId) {
      return null
    }

    // user is logged in so return the user
    return User.findOne(req.session?.userId)
  }

  // ~ REGISTER
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options)
    if (errors) {
      return { errors }
    }

    const hashedPassword = await argon2.hash(options.password)
    let user
    try {
      // User.create({
      //   username: options.username,
      //   email: options.email,
      //   password: hashedPassword,
      // }).save()
      // equivalent vvvvvvvvvvvvvv
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning('*')
        .execute()
      user = result.raw[0]
    } catch (err) {
      // check if user already exists
      if (err.detail?.includes('already exists')) {
        return {
          errors: [
            { field: 'username', message: 'username or email has already been taken.' },
            { field: 'email', message: 'username or email has already been taken.' },
          ],
        }
      }
    }

    // auto login user by setting cookie in session
    req.session!.userId = user.id

    return { user }
  }

  // ~ LOGIN
  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes('@')
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    )
    if (!user) {
      return {
        errors: [
          {
            field: 'usernameOrEmail',
            message: "that username doesn't exist",
          },
        ],
      }
    }
    const vaildatedPassword = await argon2.verify(user.password, password)
    if (!vaildatedPassword) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      }
    }

    req.session!.userId = user.id // store user id in session

    return {
      user,
    }
  }

  // ~ LOGOUT
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session?.destroy((err) => {
        res.clearCookie(COOKIE_NAME) // clear frontend cookie
        if (err) {
          console.error(err)
          resolve(false)
          return
        }
        resolve(true)
      })
    )
  }
}
