import { ObjectType, Field, Int } from 'type-graphql'
import {
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
  OneToMany,
} from 'typeorm'
import { Post } from './Post'
import { Upvote } from './Upvote'

@ObjectType()
@Entity()
// extend allows base sql commands link find() and insert()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number

  @Field(() => String)
  @CreateDateColumn()
  createdAt = new Date()

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date()

  @Field()
  @Column({ unique: true })
  username!: string

  @Field()
  @Column({ unique: true })
  email!: string

  @Field()
  @Column({ type: 'int', default: 0 })
  totalPoints!: number

  @OneToMany(() => Post, (post) => post.originalPoster)
  posts: Post[]

  // one user can have many upvotes
  @OneToMany(() => Upvote, (upvote) => upvote.user)
  upvotes: Upvote[];

  // no field property so it cannot be accessed with gql query
  @Column()
  password!: string
}
