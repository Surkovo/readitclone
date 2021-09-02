import { NextFunction, Request, response, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { isEmpty } from 'class-validator';
import { getRepository, TreeParent } from 'typeorm';
import multer, { FileFilterCallback } from 'multer';
import User from '../entities/User';
import Sub from '../entities/Sub';
import auth from '../middleware/auth';
import user from '../middleware/user';
import Post from '../entities/Post';
import { makeid } from '../utils/helpers';

const createSub = async (req: Request, res: Response) => {
  const { name, title, description } = req.body;
  const user: User = res.locals.user;
  try {
    let errors: any = {};

    if (isEmpty(name)) errors.name = 'Name must not be empty';
    if (isEmpty(title)) errors.title = 'Title must not be empty';

    const sub = await getRepository(Sub)
      .createQueryBuilder('sub') //alis
      .where('lower(sub.name) = :name', { name: name.toLowerCase() }) //compare sub in db with the sub name from the req.body
      .getOne();
    if (sub) errors.name = 'sub already exists';

    if (Object.keys(errors).length > 0) {
      throw errors;
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json(err);
  }

  try {
    const sub = new Sub({ name, description, title, user });
    await sub.save();
    return res.json(sub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'something went wrong' });
  }
};

const getSub = async (req: Request, res: Response) => {
  const name = req.params.name;
  try {
    const sub = await Sub.findOneOrFail({ name });
    const posts = await Post.find({
      where: { sub },
      order: { createdAt: 'DESC' },
      relations: ['comments', 'votes'],
    });
    sub.posts = posts;
    if (res.locals.user) {
      sub.posts.forEach((p) => p.setUserVote(res.locals.user));
    }

    return res.json(sub);
  } catch (err) {
    console.log(err);
    return res.status(404).json({ sub: 'sub not found' });
  }
};
const upload = multer({
  storage: multer.diskStorage({
    destination: 'public/images',
    filename: (_, file, callback) => {
      const name = makeid(15);
      callback(null, name + path.extname(file.originalname)); // e.g. asdjfasdf + .png
    },
  }),
  fileFilter: (_, file: any, callback: FileFilterCallback) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
      callback(null, true); // upload the file
    } else {
      callback(new Error('Not correct file type')); // do not upload file. need to new a type of error, so we created a new error
    }
  },
});
const ownSub = async (req: Request, res: Response, next: NextFunction) => {
  const user: User = res.locals.user;
  try {
    const sub = await Sub.findOneOrFail({ where: { name: req.params.name } });
    if (sub.username !== user.username)
      return res.status(403).json({ error: 'you do not own this sub' });
    res.locals.sub = sub;
    return next();
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: 'something went wron getting user ownership' });
  }
};
const uploadSubImage = async (req: Request, res: Response) => {
  const sub: Sub = res.locals.sub;
  try {
    const type = req.body.type;
    console.log(req.file.path);
    if (type !== 'image' && type !== 'banner') {
      fs.unlinkSync(req.file.path); // this deletes the file that was just uploaded if file type is not right
      return res.status(400).json({ error: 'invalid type' });
    }
    let oldUrn: string = '';
    //multer adds the form to the body of req.
    if (type === 'image') {
      oldUrn = sub.imageUrn || '';
      sub.imageUrn = req.file.filename;
    }
    if (type === 'banner') {
      oldUrn = sub.bannerUrn || '';
      sub.bannerUrn = req.file.filename;
    }

    await sub.save();

    if (oldUrn !== '') {
      fs.unlinkSync(`public/images/${oldUrn}`); //  use backslashes instead of forward slashes. MS-dos vs unix thing. Glad I found this lol
    }

    return res.json(sub);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'something happed' });
  }
};

const searchSubs = async (req: Request, res: Response) => {
  try {
    const name = req.params.name;

    if (isEmpty(name))
      res.status(400).json({ error: 'Name must not be empty' });

    const subs = await getRepository(Sub)
      .createQueryBuilder()
      .where('LOWER(name) LIKE :name', {
        name: `${name.toLowerCase().trim()}%`,
      })
      .getMany(); // the name in the obj is equal to the :name is where clause. you can use %% like a SQL statement to find like string

    return res.json(subs);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: 'something went wrong looking up a searchSub' });
  }
};

const router = Router();

router.post('/', user, auth, createSub);
router.get('/:name', user, getSub);
router.get('/search/:name', searchSubs);
router.post(
  '/:name/image',
  user,
  auth,
  ownSub,
  upload.single('file'),
  uploadSubImage
);
export default router;
