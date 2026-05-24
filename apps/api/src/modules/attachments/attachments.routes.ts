import { Router } from 'express';
import * as ctrl from './attachments.controller';

const attachmentsRouter = Router({ mergeParams: true });

attachmentsRouter.get('/', ctrl.list);
attachmentsRouter.post('/', ctrl.create);
attachmentsRouter.delete('/:id', ctrl.remove);

export default attachmentsRouter;
