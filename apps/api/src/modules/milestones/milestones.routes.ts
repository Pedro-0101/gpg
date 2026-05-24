import { Router } from 'express';
import * as milestonesController from './milestones.controller';

const router = Router({ mergeParams: true });

router.get('/', milestonesController.list);
router.post('/', milestonesController.create);
router.put('/:id', milestonesController.update);
router.delete('/:id', milestonesController.remove);

export default router;
