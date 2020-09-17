import { Entity, BaseEntity, ManyToOne, PrimaryColumn, Column } from "typeorm";
import { User } from "./User";
import { Post } from "./Post";

// m to n
// many to many
// several users can upvote the same post + users can also upvote many posts
// user <-> posts
// user -> join table <- posts
// user -> upvote <- posts

@Entity()
export class Upvote extends BaseEntity {
  @Column({ type: "int" })
  value: number;

  @PrimaryColumn()
  userId: number;

  // many upvotes can belong to one user
  @ManyToOne(() => User, (user) => user.upvotes)
  user: User;

  @PrimaryColumn()
  postId: number;

  // many upvotes can correlate to a post
  @ManyToOne(() => Post, (post) => post.upvotes, {
    onDelete: 'CASCADE'
  })
  post: Post;
}
