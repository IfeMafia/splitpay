import { Response, NextFunction } from 'express';
import * as projectService from './service';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.createProject(req.user!.id, req.body);
    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
}

export async function getProjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await projectService.getUserProjects(req.user!.id);
    res.status(200).json({ data: projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.getProjectById(req.user!.id, req.params.id as string);
    res.status(200).json({ data: project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.updateProject(req.user!.id, req.params.id as string, req.body);
    res.status(200).json({ data: project });
  } catch (err) {
    next(err);
  }
}
