import { Request, Response, Router } from 'express';
import { getConnection } from 'typeorm';
import Comment from '../entities/Comment';
import Post from '../entities/Post';
import User from '../entities/User';
import Vote from '../entities/Vote';
import Sub from '../entities/Sub';
import auth from '../middleware/auth';
import user from '../middleware/user';

const vote = async (req: Request, res: Response) => {
  const { identifier, slug, commentIdentifier, value } = req.body;
  console.log(req.body);
  //Validate vote value
  if (![1, 0, -1].includes(value)) {
    return res.status(400).json({ value: 'Value must be 1, 0, or -1' });
  }
  try {
    const user: User = res.locals.user; //since we have the auth middleware this user will be available at res.locals
    // console.log(user);
    let post = await Post.findOneOrFail({ identifier, slug });
    // console.log(post);
    let vote: Vote | undefined;
    let comment: Comment | undefined;

    if (commentIdentifier) {
      //if there is a commentIdentifer, find vote by comment
      comment = await Comment.findOneOrFail({ identifier: commentIdentifier });
      console.log(comment);
      vote = await Vote.findOne({ user, comment }); //make sure this is findOne not findOneOrFail
    } else {
      //else find vote by post
      vote = await Vote.findOne({ user, post });
      console.log(vote);
    }

    if (!vote && value === 0) {
      //if no vote and value is 0 return error. since you can't vote with a value of 0 if you don't have a vote
      return res.status(404).json({ error: 'Vote not found' });
    } else if (!vote) {
      //if no vote found above, create it. if you found a comment, vote on that comment, else its a post, so vote on that
      vote = new Vote({ user, value });
      if (comment) vote.comment = comment;
      else vote.post = post;
      await vote.save();
    } else if (value === 0) {
      //if vote exists and value is 0, remove that vote from the DB
      await vote.remove();
    } else if (vote.value !== value) {
      //if vote and value have changed, update that vote to new value
      vote.value = value;
      await vote.save();
    }

    post = await Post.findOneOrFail(
      { identifier, slug },
      { relations: ['comments', 'comments.votes', 'votes', 'sub'] }
    );
    post.setUserVote(user);
    post.comments.forEach((c) => c.setUserVote(user));

    return res.json(post);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'something went wrong' });
  }
};

/**
 * SELECT s.title, s.name,
 * COALESCE('http://localhost:5000/images/' || s."imageUrn" , 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y') as imageUrl,
 * count(p.id) as "postCount"
 * FROM subs s
 * LEFT JOIN posts p ON s.name = p."subName"
 * GROUP BY s.title, s.name, imageUrl
 * ORDER BY "postCount" DESC
 * LIMIT 5;
 */
const imageUrlExp = `COALESCE('${process.env.APP_URL}/images/' || s."imageUrn" , 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')`;

const topSubs = async (_: Request, res: Response) => {
  try {
    // use "" for capitals in select expression
    // you can use the table or the Entity name like we did here, s is the alias
    const subs = await getConnection()
      .createQueryBuilder()
      .select(
        `s.title, s.name, ${imageUrlExp} as "imageUrl", count(p.id) as "postCount"`
      )
      .from(Sub, 's')
      .leftJoin(Post, 'p', `s.name = p."subName"`)
      .groupBy(`s.title, s.name, "imageUrl"`)
      .orderBy(`"postCount"`, 'DESC')
      .limit(5)
      .execute();
    return res.json(subs);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'cannot find top reddit subs' });
  }
};

const router = Router();

router.post('/vote', user, auth, vote);
router.get('/top-subs', topSubs);

export default router;
