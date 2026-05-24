import { Router } from 'express';
import * as ctrl from './projects.controller';
import { stagesRouter } from '../stages/stages.routes';
import { teamsRouter } from '../teams/teams.routes';
import { stakeholdersRouter } from '../stakeholders/stakeholders.routes';
import { professionalsRouter } from '../professionals/professionals.routes';
import membersRouter from '../members/members.routes';
import costsRouter from '../costs/costs.routes';
import risksRouter from '../risks/risks.routes';
import milestonesRouter from '../milestones/milestones.routes';

export const projectsRouter = Router();

projectsRouter.get('/', ctrl.list);
projectsRouter.post('/', ctrl.create);
projectsRouter.get('/:id', ctrl.get);
projectsRouter.patch('/:id', ctrl.update);
projectsRouter.delete('/:id', ctrl.remove);
projectsRouter.post('/:id/recalculate', ctrl.recalculate);

// Nested resources
projectsRouter.use('/:projectId/stages', stagesRouter);
projectsRouter.use('/:projectId/teams', teamsRouter);
projectsRouter.use('/:projectId/stakeholders', stakeholdersRouter);
projectsRouter.use('/:projectId/professionals', professionalsRouter);
projectsRouter.use('/:projectId/members', membersRouter);
projectsRouter.use('/:projectId/costs', costsRouter);
projectsRouter.use('/:projectId/risks', risksRouter);
projectsRouter.use('/:projectId/milestones', milestonesRouter);
