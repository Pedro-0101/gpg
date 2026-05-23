import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('Members API', () => {
  let projectId: string;
  let memberId: string;

  beforeAll(async () => {
    // Criar um projeto para os testes
    const project = await prisma.project.create({
      data: {
        name: 'Test Project for Members',
        startDate: new Date(),
        status: 'active',
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
  });

  it('should create a new team member', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/members`)
      .send({
        name: 'John Doe',
        initials: 'JD',
        role: 'Developer',
        skills: ['Node.js', 'TypeScript'],
        avatarColor: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('John Doe');
    expect(response.body.projectId).toBe(projectId);
    memberId = response.body.id;
  });

  it('should list members of a project', async () => {
    const response = await request(app).get(`/api/v1/projects/${projectId}/members`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].name).toBe('John Doe');
  });

  it('should get a member by id', async () => {
    const response = await request(app).get(`/api/v1/projects/${projectId}/members/${memberId}`);
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(memberId);
  });

  it('should update a member', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${projectId}/members/${memberId}`)
      .send({
        role: 'Senior Developer',
      });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe('Senior Developer');
  });

  it('should return metrics (even if empty)', async () => {
    const response = await request(app).get(`/api/v1/projects/${projectId}/members/metrics`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].memberId).toBe(memberId);
  });

  it('should delete a member', async () => {
    const response = await request(app).delete(`/api/v1/projects/${projectId}/members/${memberId}`);
    expect(response.status).toBe(204);

    const check = await prisma.teamMember.findUnique({ where: { id: memberId } });
    expect(check).toBeNull();
  });
});
