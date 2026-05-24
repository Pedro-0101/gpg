import { Router } from 'express';
import * as ctrl from './subtopics.controller';
import commentsRouter from '../comments/comments.routes';
import attachmentsRouter from '../attachments/attachments.routes';

export const subtopicsRouter = Router({ mergeParams: true });

subtopicsRouter.get('/', ctrl.list);
subtopicsRouter.post('/', ctrl.create);
subtopicsRouter.get('/:id', ctrl.get);
subtopicsRouter.patch('/:id', ctrl.update);
subtopicsRouter.delete('/:id', ctrl.remove);

// Comments
subtopicsRouter.use('/:subtopicId/comments', commentsRouter);

// Attachments
subtopicsRouter.use('/:subtopicId/attachments', attachmentsRouter);
