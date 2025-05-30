import { Request, Response, NextFunction } from 'express';
import { identifyContact } from '../services/identityService';

export const handleIdentify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phoneNumber } = req.body;

    if (email === undefined && phoneNumber === undefined) {
        return res.status(400).json({ error: 'Either email or phoneNumber must be provided in the request body.' });
    }

    const requestData = {
      email: email || null,
      phoneNumber: phoneNumber ? String(phoneNumber) : null, 
    };
    
    const result = await identifyContact(requestData);
    return res.status(200).json(result);
  } catch (error) {
    next(error); 
  }
};