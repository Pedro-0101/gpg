import { Request, Response, NextFunction } from 'express';
import * as risksService from './risks.service';
import { createRiskSchema, updateRiskSchema } from '@gpg/shared';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await risksService.findAll(req.params.projectId));
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRiskSchema.parse(req.body);
    res.status(201).json(await risksService.create(req.params.projectId, data));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateRiskSchema.parse(req.body);
    res.json(await risksService.update(req.params.id, req.params.projectId, data));
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await risksService.remove(req.params.id, req.params.projectId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
