import { Request, Response, NextFunction } from 'express';
import { identifyContact } from '../services/identityService';

export const handleIdentify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phoneNumber } = req.body;

    if (email === undefined && phoneNumber === undefined) {
        return res.status(400).json({ error: 'Either email or phoneNumber must be provided in the request body.' });
    }
    // Ensure null if empty string, as DB might treat them differently
    const requestData = {
      email: email || null,
      phoneNumber: phoneNumber ? String(phoneNumber) : null, // Ensure phone is string or null
    };
    
    const result = await identifyContact(requestData);
    return res.status(200).json(result);
  } catch (error) {
    next(error); // Pass to global error handler
  }
};