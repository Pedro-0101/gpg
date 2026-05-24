import { Router } from 'express';
import * as costsController from './costs.controller';

const router = Router({ mergeParams: true });

router.get('/', costsController.list);
router.get('/summary', costsController.summary);
router.post('/', costsController.create);
router.delete('/:id', costsController.remove);

export default router;
