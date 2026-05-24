import { Router } from 'express';
import * as ctrl from './decisions.controller';

const decisionsRouter = Router({ mergeParams: true });

decisionsRouter.get('/', ctrl.list);
decisionsRouter.post('/', ctrl.create);
decisionsRouter.get('/:id', ctrl.get);
decisionsRouter.patch('/:id', ctrl.update);
decisionsRouter.delete('/:id', ctrl.remove);

export default decisionsRouter;
