import { Request, Response, NextFunction } from 'express';
import * as service from './attachments.service';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().default('application/octet-stream'),
  size: z.number().int().min(0).default(0),
  isExternal: z.boolean().default(true),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.findAll(req.params.subtopicId));
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    res.status(201).json(await service.create(req.params.subtopicId, data));
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.remove(req.params.id, req.params.subtopicId);
    res.status(204).send();
  } catch (e) { next(e); }
}
