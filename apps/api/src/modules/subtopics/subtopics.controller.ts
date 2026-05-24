import { Request, Response, NextFunction } from 'express';
import { createSubtopicSchema, updateSubtopicSchema } from '@gpg/shared';
import * as service from './subtopics.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findAll(req.params.topicId));
  } catch (e) {
    next(e);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findById(req.params.id, req.params.topicId));
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSubtopicSchema.parse(req.body);
    res.status(201).json(await service.create(req.params.topicId, data));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateSubtopicSchema.parse(req.body);
    res.json(await service.update(req.params.id, req.params.topicId, data));
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.id, req.params.topicId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

