import { ObjectType, Field, Int } from 'type-graphql'
import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
} from 'typeorm'
import { User } from './User'
import { SubForum } from './SubForum'
import { Upvote } from './Upvote'

@ObjectType()
@Entity()
// extend allows base sql commands link find() and insert()
export class Post extends BaseEntity {
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
  @Column()
  title!: string

  @Field()
  @Column()
  body!: string

  @Field()
  @Column({ type: 'int', default: 0 })
  points!: number

  @Field({nullable: true})
  @Column({ type: 'int', default: 0 })
  voteStatus: number

  @Field()
  @Column()
  opId: number

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.posts)
  originalPoster: User

  @Field()
  @Column()
  subId: number

  @Field(() => SubForum, { nullable: true })
  @ManyToOne(() => SubForum, (sub) => sub.posts)
  subForum: SubForum

  // one post can have many upvotes
  @OneToMany(() => Upvote, (upvote) => upvote.user)
  upvotes: Upvote[]
}
