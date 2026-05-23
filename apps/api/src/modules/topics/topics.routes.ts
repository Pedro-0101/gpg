import { Router } from 'express';
import * as ctrl from './topics.controller';
import { subtopicsRouter } from '../subtopics/subtopics.routes';

export const topicsRouter = Router({ mergeParams: true });

topicsRouter.get('/', ctrl.list);
topicsRouter.post('/', ctrl.create);
topicsRouter.patch('/:id', ctrl.update);
topicsRouter.delete('/:id', ctrl.remove);

topicsRouter.use('/:topicId/subtopics', subtopicsRouter);
