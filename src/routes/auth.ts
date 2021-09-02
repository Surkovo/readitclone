import dotenv from 'dotenv';
import { Request, Response, Router } from 'express';
import { validate, isEmpty } from 'class-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookie from 'cookie';
import auth from '../middleware/auth';
import user from '../middleware/user';
import User from '../entities/User';

dotenv.config();

const mapErrors = (errors: Object[]) => {
  //this another way to perform this function

  // let mappedErrors: any = {};
  // errors.forEach((e: any) => {
  //   const key = e.property;
  //   const value = Object.entries(e.constraints)[0][1];
  //   mappedErrors[key] = value;
  // });
  // return mappedErrors;
  return errors.reduce((prev: any, err: any) => {
    prev[err.property] = Object.entries(err.constraints)[0][1];
    return prev;
  }, {});
};

const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  try {
    // Validate data
    let errors: any = {};

    const emailUser = await User.findOne({ email });
    const usernameUser = await User.findOne({ username });

    if (emailUser) errors.email = 'Email is already taken';
    if (usernameUser) errors.username = 'Username is already taken';
    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }

    // Create user
    const user = new User({ email, username, password });

    errors = await validate(user);
    if (errors.length > 0) {
      console.log(mapErrors(errors));
      return res.status(400).json(mapErrors(errors));
    }
    await user.save();
    //Return user
    console.log(user);
    return res.json(user);
  } catch (err) {
    return res.status(500).json(err);
  }
};

const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const errors: any = {};
    if (isEmpty(username)) errors.username = 'Username can not be empty';
    if (isEmpty(password)) errors.password = 'Password can not be empty';

    if (Object.keys(errors).length > 0) res.status(400).json(errors);

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ username: 'user not found' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password); //compares the db hashed password to whats entered in the req.body
    if (!passwordMatches) {
      return res.status(401).json({ password: 'Password is incorrect' });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET); //payload and the secret for my server
    res.set(
      'Set-Cookie',
      cookie.serialize('token', token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600,
        path: '/',
      })
    ); //this set method sets headers in  a response. The options in the serialize method are the name of the varible, the varibale and some options.

    console.log(user);
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.json({ error: 'something went wrong' });
  }
};

const me = (_: Request, res: Response) => {
  return res.json(res.locals.user);
};

const logout = (_: Request, res: Response) => {
  //this will reset a new cookie token that expires immediately
  res.set(
    'Set-Cookie',
    cookie.serialize('token', '', {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    })
  );

  return res.status(200).json({ success: true });
};

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', user, auth, me);
router.get('/logout', user, auth, logout);

export default router;
