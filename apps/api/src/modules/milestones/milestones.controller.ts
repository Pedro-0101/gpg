import { Request, Response, NextFunction } from 'express';
import * as milestonesService from './milestones.service';
import { createMilestoneSchema, updateMilestoneSchema } from '@gpg/shared';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await milestonesService.findAll(req.params.projectId));
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMilestoneSchema.parse(req.body);
    res.status(201).json(await milestonesService.create(req.params.projectId, data));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateMilestoneSchema.parse(req.body);
    res.json(await milestonesService.update(req.params.id, req.params.projectId, data));
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await milestonesService.remove(req.params.id, req.params.projectId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
