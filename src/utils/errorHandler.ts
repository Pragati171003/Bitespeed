import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error occurred:", err.stack); // Log the error stack for debugging

  // Handle Sequelize validation errors specifically if you want
  // if (err.name === 'SequelizeValidationError') {
  //   return res.status(400).json({
  //     error: 'Validation Error',
  //     details: err.errors.map((e: any) => e.message),
  //   });
  // }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong!',
  });
};