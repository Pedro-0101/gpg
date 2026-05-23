import { Request, Response, NextFunction } from 'express';
import * as membersService from './members.service';
import { createTeamMemberSchema, updateTeamMemberSchema } from '@gpg/shared';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const members = await membersService.findAll(projectId);
    res.json(members);
  } catch (error) {
    next(error);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, id } = req.params;
    const member = await membersService.findById(id, projectId);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const data = createTeamMemberSchema.parse(req.body);
    const member = await membersService.create(projectId, data);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, id } = req.params;
    const data = updateTeamMemberSchema.parse(req.body);
    const member = await membersService.update(id, projectId, data);
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, id } = req.params;
    await membersService.remove(id, projectId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function metrics(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const metricsData = await membersService.getMetrics(projectId);
    res.json(metricsData);
  } catch (error) {
    next(error);
  }
}
