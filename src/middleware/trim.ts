import { NextFunction, Request, Response } from 'express';

export default (req: Request, _: Response, next: NextFunction) => {
  const exceptions = ['password']; //we don't want to trim whitespace in the password

  Object.keys(req.body).forEach((key) => {
    //this checks if the value of the property is a string and then trims the excess whitespace
    if (!exceptions.includes(key) && typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].trim();
    }
  });

  next();
};
