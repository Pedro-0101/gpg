import { Router } from 'express';
import * as risksController from './risks.controller';

const router = Router({ mergeParams: true });

router.get('/', risksController.list);
router.post('/', risksController.create);
router.put('/:id', risksController.update);
router.delete('/:id', risksController.remove);

export default router;
