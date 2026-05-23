import { Router } from 'express';
import * as ctrl from './professionals.controller';

export const professionalsRouter = Router({ mergeParams: true });

professionalsRouter.get('/', ctrl.list);
professionalsRouter.post('/', ctrl.create);
professionalsRouter.patch('/:id', ctrl.update);
professionalsRouter.delete('/:id', ctrl.remove);
