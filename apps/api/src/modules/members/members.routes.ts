import { Router } from 'express';
import * as membersController from './members.controller';

const router = Router({ mergeParams: true });

router.get('/', membersController.list);
router.get('/metrics', membersController.metrics);
router.get('/:id', membersController.get);
router.post('/', membersController.create);
router.put('/:id', membersController.update);
router.delete('/:id', membersController.remove);

export default router;
