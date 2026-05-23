import { Router } from 'express';
import * as ctrl from './teams.controller';

export const teamsRouter = Router({ mergeParams: true });

teamsRouter.get('/', ctrl.list);
teamsRouter.get('/:id', ctrl.get);
teamsRouter.post('/', ctrl.create);
teamsRouter.patch('/:id', ctrl.update);
teamsRouter.delete('/:id', ctrl.remove);
