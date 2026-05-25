import { Request, Response, NextFunction } from 'express';
import { createProjectSchema, updateProjectSchema } from '@gpg/shared';
import * as service from './projects.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findAll());
  } catch (e) {
    next(e);
  }
}

export async function summaries(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSummaries());
  } catch (e) {
    next(e);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findById(req.params.id));
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createProjectSchema.parse(req.body);
    res.status(201).json(await service.create(data));
  } catch (e) {
    next(e);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProjectSchema.parse(req.body);
    res.json(await service.update(req.params.id, data));
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function recalculate(req: Request, res: Response, next: NextFunction) {
  try {
    await service.recalculateSchedule(req.params.id);
    res.json({ message: 'Cronograma recalculado' });
  } catch (e) {
    next(e);
  }
}
