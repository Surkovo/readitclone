import {
  Entity as TOEntity, //have to rename this to not conflict with abstract Entity class
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

import User from './User';
import Entity from './Entity';
import Post from './Post';
import { Expose } from 'class-transformer';

@TOEntity('subs') //this the tables name
export default class Sub extends Entity {
  //Partial allows us to not include everything when creating a new Post. Important since some fields are create in the DB, not by us.
  constructor(sub: Partial<Sub>) {
    super(); // need this since it extends the BaseEnitity class
    Object.assign(this, sub);
  }

  @Index()
  @Column({ unique: true })
  name: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  imageUrn: string;

  @Column({ nullable: true, type: 'text' })
  bannerUrn: string;

  @Column()
  username: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'username', referencedColumnName: 'username' }) //see notes in users model for how to use.
  user: User;

  @OneToMany(() => Post, (post) => post.sub)
  posts: Post[];

  @Expose()
  get imageUrl(): string {
    return this.imageUrn
      ? `${process.env.APP_URL}/images/${this.imageUrn}`
      : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  }

  @Expose()
  get bannerUrl(): string | undefined {
    return this.bannerUrn
      ? `${process.env.APP_URL}/images/${this.bannerUrn}`
      : undefined;
  }
}
