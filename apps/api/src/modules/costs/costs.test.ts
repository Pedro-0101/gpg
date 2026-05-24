import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('Costs API', () => {
  let projectId: string;
  let entryId: string;

  beforeAll(async () => {
    const project = await prisma.project.create({
      data: { name: 'Costs Test Project', startDate: new Date() }
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
  });

  it('should create a new cost entry', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/costs`)
      .send({
        description: 'Servidor Mensal',
        category: 'Infraestrutura',
        amount: 1500.50,
        date: new Date()
      });

    expect(response.status).toBe(201);
    expect(response.body.description).toBe('Servidor Mensal');
    expect(Number(response.body.amount)).toBe(1500.50);
    entryId = response.body.id;
  });

  it('should list all cost entries of a project', async () => {
    const response = await request(app).get(`/api/v1/projects/${projectId}/costs`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  it('should return a summary of costs', async () => {
    const response = await request(app).get(`/api/v1/projects/${projectId}/costs/summary`);
    expect(response.status).toBe(200);
    expect(response.body.totalSpent).toBe(1500.50);
    expect(response.body.byCategory['Infraestrutura']).toBe(1500.50);
  });

  it('should delete a cost entry', async () => {
    const response = await request(app).delete(`/api/v1/projects/${projectId}/costs/${entryId}`);
    expect(response.status).toBe(204);

    const check = await prisma.costEntry.findUnique({ where: { id: entryId } });
    expect(check).toBeNull();
  });
});
