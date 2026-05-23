import { Router } from 'express';
import * as ctrl from './stakeholders.controller';

export const stakeholdersRouter = Router({ mergeParams: true });

stakeholdersRouter.get('/', ctrl.list);
stakeholdersRouter.post('/', ctrl.create);
stakeholdersRouter.patch('/:id', ctrl.update);
stakeholdersRouter.delete('/:id', ctrl.remove);
