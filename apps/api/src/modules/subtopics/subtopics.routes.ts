import { Router } from 'express';
import * as ctrl from './subtopics.controller';
import commentsRouter from '../comments/comments.routes';

export const subtopicsRouter = Router({ mergeParams: true });

subtopicsRouter.get('/', ctrl.list);
subtopicsRouter.post('/', ctrl.create);
subtopicsRouter.get('/:id', ctrl.get);
subtopicsRouter.patch('/:id', ctrl.update);
subtopicsRouter.delete('/:id', ctrl.remove);

// Assignments
subtopicsRouter.post('/:id/assignments', ctrl.assignMember);
subtopicsRouter.delete('/:id/assignments/:memberId', ctrl.unassignMember);

// Comments
subtopicsRouter.use('/:subtopicId/comments', commentsRouter);
