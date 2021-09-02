import { IsEmail, Length } from 'class-validator';
import bcrypt from 'bcrypt';

import { Exclude } from 'class-transformer';
import {
  Entity as TOEntity, //have to rename thsi to not conflict with abstract Entity class
  Column,
  Index,
  BeforeInsert,
  OneToMany,
} from 'typeorm';

import Entity from './Entity';
import Post from './Post';
import Vote from './Vote';

@TOEntity('users') //this the tables name
export default class User extends Entity {
  //Partial allows us to not include everything when creating a new user. Important since some fields are create in the DB, not by us.
  constructor(user: Partial<User>) {
    super(); // need this since it extends the BaseEnitity class
    Object.assign(this, user);
  }

  @Index() //adds index for better preformance on reads
  @IsEmail(undefined, { message: 'Must be a valid email address' })
  @Length(3, 255, {
    message: 'Email is empty',
  })
  @Column({ unique: true })
  email: string;

  @Index()
  @Length(3, 255, {
    message: 'Must be 3 characters or greater in length',
  })
  @Column({ unique: true })
  username: string;

  @Exclude() //this excludes it from the response
  @Length(6, 255, {
    message: 'Must be 6 characters or greater in length',
  })
  @Column()
  password: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @BeforeInsert() //intercept the password before the save to the DB and run this function
  async hashPass() {
    this.password = await bcrypt.hash(this.password, 6);
  }
}
