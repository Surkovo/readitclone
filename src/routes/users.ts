import { Request, Response, Router } from 'express';
import Comment from '../entities/Comment';
import Post from '../entities/Post';
import User from '../entities/User';
import user from '../middleware/user';

const getUserSubmissions = async (req: Request, res: Response) => {
  try {
    //the select statement returns selected fields.
    const user = await User.findOneOrFail({
      where: { username: req.params.username },
      select: ['username', 'createdAt'],
    });

    const posts = await Post.find({
      where: { user },
      relations: ['comments', 'votes', 'sub'],
    });

    const comments = await Comment.find({
      where: { user },
      relations: ['post'],
    });

    if (res.locals.user) {
      posts.forEach((p) => p.setUserVote(res.locals.user));
      comments.forEach((c) => c.setUserVote(res.locals.user));
    }
    //adding all posts, votes and comments into an array response for the user
    let submissions: any[] = [];

    posts.forEach((p) => submissions.push({ type: 'Post', ...p.toJSON() })); // the post contain other data, such as the model, so we need to spread all the keys and values and convert it JSON to get just the data
    comments.forEach((c) =>
      submissions.push({ type: 'Comment', ...c.toJSON() })
    );

    submissions.sort((a, b) => {
      if (b.createdAt > a.createdAt) return 1;
      if (b.createdAt < a.createdAt) return -1;
      return 0;
    });
    return res.json({ user, submissions });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: 'something went wrong in the user route' });
  }
};

const router = Router();

router.get('/:username/', user, getUserSubmissions); // user is used to detect if the current user has interacted with the user being displayed on the curreny page

export default router;
