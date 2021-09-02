import { Exclude, Expose } from 'class-transformer';
import {
  Entity as TOEntity, //have to rename this to not conflict with abstract Entity class
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { makeid, slugify } from '../utils/helpers';
import Comment from './Comment';

import Entity from './Entity';
import Sub from './Sub';
import User from './User';
import Vote from './Vote';

@TOEntity('posts') //this the tables name
export default class Post extends Entity {
  //Partial allows us to not include everything when creating a new Post. Important since some fields are create in the DB, not by us.
  constructor(post: Partial<Post>) {
    super(); // need this since it extends the BaseEnitity class
    Object.assign(this, post);
  }

  @Index()
  @Column()
  identifier: string; //7 character ID for post

  @Column()
  title: string;

  @Index()
  @Column()
  slug: string;

  //this lets the body column be null and gives it a type of text in the postgres db
  @Column({ nullable: true, type: 'text' })
  body: string;

  @Column()
  subName: string;

  @Column()
  username: string; //even though we have it below, typeORM doesn't add it automatically with the below join. We have to add it manually like this

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'username', referencedColumnName: 'username' }) // 1) this creates a column named username in posts 2) it references a column names username in user. You only have to do this on the many side since it had one owner it is joined to. This field comes the 'user object we pass from the createPOst route'
  user: User;

  @ManyToOne(() => Sub, (sub) => sub.posts)
  @JoinColumn({ name: 'subName', referencedColumnName: 'name' }) //simlar to above. so creates a column called 'subname' based on the 'name' column in the sub model
  sub: Sub;

  @Exclude()
  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @Expose() get url(): string {
    return `/r/${this.subName}/${this.identifier}/${this.slug}`;
  }

  // protected url: string; //this is a virtual field in typeORM
  // @AfterLoad()
  // createFields() {
  //   this.url = `/r/${this.subName}/${this.identifier}/${this.slug}`;
  // }
  protected userVote: number;
  setUserVote(user: User) {
    const index = this.votes?.findIndex((v) => v.username === user.username); // find if the user has voted on this post. the user has a votes array in it's entity
    this.userVote = index > -1 ? this.votes[index].value : 0; // return the value of the vote or 0 if the user hasn't voted on it yet
  }

  @Exclude()
  @OneToMany(() => Vote, (vote) => vote.post)
  votes: Vote[];

  //add a virtual field for the vote countk
  @Expose() get commentCount(): number {
    return this.comments?.length;
  }

  @Expose() get voteScore(): number {
    return this.votes?.reduce((prev, curr) => prev + (curr.value || 0), 0);
  }

  @BeforeInsert()
  makeIdandSlug() {
    this.identifier = makeid(7);
    this.slug = slugify(this.title);
  }
}
