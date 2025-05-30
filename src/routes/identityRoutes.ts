import { Router } from 'express';
import { handleIdentify } from '../controllers/identityController';

const router = Router();

router.post('/identify', handleIdentify);

export default router;