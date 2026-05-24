import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('Milestones API', () => {
  let projectId: string;
  let milestoneId: string;

  beforeAll(async () => {
    const project = await prisma.project.create({
      data: { name: 'Milestones Test Project', startDate: new Date() }
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
  });

  it('should create a new milestone', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/milestones`)
      .send({
        name: 'Entrega do MVP',
        date: new Date(),
        status: 'pending'
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Entrega do MVP');
    milestoneId = response.body.id;
  });

  it('should list all milestones of a project', async () => {
    const response = await request(app).get(`/api/v1/projects/${projectId}/milestones`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  it('should update a milestone', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${projectId}/milestones/${milestoneId}`)
      .send({ status: 'reached' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('reached');
  });

  it('should delete a milestone', async () => {
    const response = await request(app).delete(`/api/v1/projects/${projectId}/milestones/${milestoneId}`);
    expect(response.status).toBe(204);

    const check = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    expect(check).toBeNull();
  });
});
