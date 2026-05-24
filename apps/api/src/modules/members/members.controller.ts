import { Request, Response, NextFunction } from 'express';
import * as membersService from './members.service';
import { createProfessionalSchema, updateProfessionalSchema } from '@gpg/shared';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await membersService.findAll(req.params.projectId));
  } catch (error) { next(error); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await membersService.findById(req.params.id, req.params.projectId));
  } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createProfessionalSchema.parse(req.body);
    res.status(201).json(await membersService.create(req.params.projectId, data));
  } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfessionalSchema.parse(req.body);
    res.json(await membersService.update(req.params.id, req.params.projectId, data));
  } catch (error) { next(error); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await membersService.remove(req.params.id, req.params.projectId);
    res.status(204).send();
  } catch (error) { next(error); }
}

export async function metrics(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await membersService.getMetrics(req.params.projectId));
  } catch (error) { next(error); }
}
