import { Request, Response, NextFunction } from 'express';
import * as commentsService from './comments.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await commentsService.findAll(req.params.subtopicId));
  } catch (e) {
    next(e);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { authorName, content } = req.body;
    res.status(201).json(await commentsService.create(req.params.subtopicId, { authorName, content }));
  } catch (e) {
    next(e);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await commentsService.remove(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
