import { Exclude, Expose } from 'class-transformer';
import {
  ManyToOne,
  JoinColumn,
  Column,
  Entity as TOEntity,
  BeforeInsert,
  Index,
  OneToMany,
} from 'typeorm';
import { makeid } from '../utils/helpers';
import Entity from './Entity';
import Post from './Post';
import User from './User';

import Vote from './Vote';
@TOEntity('comments')
export default class Comment extends Entity {
  constructor(comment: Partial<Comment>) {
    super();
    Object.assign(this, comment);
  }

  @Index()
  @Column()
  identifier: string;
  @Column()
  body: string;

  @Column()
  username: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @ManyToOne(() => Post, (post) => post.comments, { nullable: false }) //we can omit the the @joincolumn since manytoone defaults to joining on the id column. quirk
  post: Post;

  @Exclude()
  @OneToMany(() => Vote, (vote) => vote.comment)
  votes: Vote[];

  protected userVote: number;
  setUserVote(user: User) {
    const index = this.votes?.findIndex((v) => v.username === user.username); // find if the user has voted on this post. the user has a votes array in it's entity
    this.userVote = index > -1 ? this.votes[index].value : 0; // return the value of the vote or 0 if the user hasn't voted on it yet
  }

  @Expose() get voteScore(): number {
    return this.votes?.reduce((prev, curr) => prev + (curr.value || 0), 0);
  }

  @BeforeInsert()
  makeIdandSlug() {
    this.identifier = makeid(8);
  }
}
