import { compareSync } from 'bcrypt';
import { Router, Request, Response } from 'express';
import Comment from '../entities/Comment';

import Post from '../entities/Post';
import Sub from '../entities/Sub';
import auth from '../middleware/auth';
import user from '../middleware/user';
const createPost = async (req: Request, res: Response) => {
  const { title, body, sub } = req.body;

  //we can get the current user thanks to the auth middleware
  const user = res.locals.user;

  if (title.trim() === '') {
    res.status(400).json({ title: 'title cant be blank' });
  }

  try {
    const subRecord = await Sub.findOneOrFail({ name: sub });

    const post = new Post({ title, body, user, sub: subRecord }); // typeorm is smart enough to know if yo pass the user it will persist the username in the post model. see the join column in the entity

    await post.save();
    return res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'something went wrong' });
  }
};

const getPosts = async (req: Request, res: Response) => {
  const currentPage: number = (req.query.page || 0) as number; // cast as number in case it's a string
  const postsPerPage: number = (req.query.page || 8) as number; // cast as number in case it's a string
  try {
    const posts = await Post.find({
      order: { createdAt: 'DESC' },
      relations: ['sub', 'comments', 'votes'],
      skip: currentPage * postsPerPage,
      take: postsPerPage,
    }); // we can give the find some options such as order.
    //if there is a user logged in then, add their votes to each post
    if (res.locals.user) {
      posts.forEach((p) => p.setUserVote(res.locals.user));
    }
    return res.json(posts);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: 'something went wrong with get all posts' });
  }
};
const getPost = async (req: Request, res: Response) => {
  const { identifier, slug } = req.params;

  try {
    const post = await Post.findOneOrFail(
      { identifier, slug },
      { relations: ['sub', 'votes', 'comments'] }
    );

    if (res.locals.user) {
      post.setUserVote(res.locals.user);
    }

    return res.json(post);
  } catch (err) {
    console.log(err);
    return res.status(404).json({ error: 'post not found' });
  }
};

const commentOnPost = async (req: Request, res: Response) => {
  const { identifier, slug } = req.params;
  const body = req.body.body;
  const user = res.locals.user;
  try {
    const post = await Post.findOneOrFail({ identifier, slug });
    const comment = new Comment({ user, body, post });
    await comment.save();
    return res.json(comment);
  } catch (err) {
    console.log(err);
    return res.status(404).json({ error: 'post on post not found' });
  }
};

// const getPostComments = async (req: Request, res: Response) => {
//   const { identifier, slug } = req.params;
//   try {
//     const post = await Post.findOneOrFail({ identifier, slug });
//     const comments = await Comment.find({
//       where: { post },
//       order: { createdAt: 'DESC' },
//       relations: ['votes'],
//     });
//     if (res.locals.user) {
//       comments.forEach((c) => {
//         c.setUserVote(res.locals.user);
//       });
//     }
//     console.log(' from the comments' + comments);
//     return res.json(comments);
//   } catch (err) {
//     console.log(err);
//     return res.status(500).json({ error: 'server did not get comment' });
//   }
// };

const getPostComments = async (req: Request, res: Response) => {
  const { identifier, slug } = req.params;
  try {
    const post = await Post.findOneOrFail({ identifier, slug });

    const comments = await Comment.find({
      where: { post },
      order: { createdAt: 'DESC' },
      relations: ['votes'],
    });

    if (res.locals.user) {
      comments.forEach((c) => c.setUserVote(res.locals.user));
    }

    return res.json(comments);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

const router = Router();
router.post('/', user, auth, createPost);
router.get('/', user, getPosts);
router.get('/:identifier/:slug', user, getPost);
router.post('/:identifier/:slug/comments', user, auth, commentOnPost);
router.get('/:identifier/:slug/comments', user, getPostComments);

export default router;
