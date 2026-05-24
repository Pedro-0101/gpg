import { Request, Response, NextFunction } from 'express';
import * as costsService from './costs.service';
import { createCostEntrySchema } from '@gpg/shared';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const entries = await costsService.findAll(projectId);
    res.json(entries);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const data = createCostEntrySchema.parse(req.body);
    const entry = await costsService.create(projectId, data);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, id } = req.params;
    await costsService.remove(id, projectId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function summary(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const data = await costsService.getSummary(projectId);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
