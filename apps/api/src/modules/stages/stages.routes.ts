import { Router } from 'express';
import * as ctrl from './stages.controller';
import { topicsRouter } from '../topics/topics.routes';

export const stagesRouter = Router({ mergeParams: true });

stagesRouter.get('/', ctrl.list);
stagesRouter.post('/', ctrl.create);
stagesRouter.patch('/:id', ctrl.update);
stagesRouter.delete('/:id', ctrl.remove);

stagesRouter.use('/:stageId/topics', topicsRouter);
