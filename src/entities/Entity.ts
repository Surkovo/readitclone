import { classToPlain, Exclude } from 'class-transformer';
import {
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

//Entity is the name of the abstract class
export default abstract class Entity extends BaseEntity {
  @Exclude()
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  toJSON() {
    return classToPlain(this); //this overwritten to json method has class transformer go through exlude any column with the exclude decorator on it from the response
  }
}
