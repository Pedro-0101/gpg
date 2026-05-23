import { Request, Response, NextFunction } from 'express';
import { createTopicSchema, updateTopicSchema } from '@gpg/shared';
import * as service from './topics.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findAll(req.params.stageId));
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createTopicSchema.parse(req.body);
    res.status(201).json(await service.create(req.params.stageId, data));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateTopicSchema.parse(req.body);
    res.json(await service.update(req.params.id, req.params.stageId, data));
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.id, req.params.stageId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
