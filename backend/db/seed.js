/* Seeds demo data: 1 owner, a manager, a few employees, a project and tasks. */
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const store = require('./store');

async function seed() {
  store.reset();

  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = {
    id: uuidv4(),
    tenantId: 'default',
    name: 'Satyam Owner',
    email: 'owner@company.com',
    passwordHash,
    role: 'owner',
    department: 'Executive',
    createdAt: new Date().toISOString(),
  };
  const manager = {
    id: uuidv4(),
    tenantId: 'default',
    name: 'Priya Manager',
    email: 'manager@company.com',
    passwordHash,
    role: 'manager',
    department: 'Engineering',
    createdAt: new Date().toISOString(),
  };
  const emp1User = {
    id: uuidv4(),
    tenantId: 'default',
    name: 'Rahul Dev',
    email: 'rahul@company.com',
    passwordHash,
    role: 'employee',
    department: 'Engineering',
    createdAt: new Date().toISOString(),
  };
  store.insert('users', owner);
  store.insert('users', manager);
  store.insert('users', emp1User);

  const empOwner = store.insert('employees', {
    id: uuidv4(),
    tenantId: 'default',
    userId: owner.id,
    name: owner.name,
    email: owner.email,
    role: 'owner',
    department: 'Executive',
    skills: ['leadership', 'strategy'],
    grade: 'C-level',
    managerId: null,
    status: 'active',
    joiningDate: '2023-01-01',
    createdAt: new Date().toISOString(),
  });
  const empManager = store.insert('employees', {
    id: uuidv4(),
    tenantId: 'default',
    userId: manager.id,
    name: manager.name,
    email: manager.email,
    role: 'manager',
    department: 'Engineering',
    skills: ['project-management', 'javascript'],
    grade: 'Senior',
    managerId: empOwner.id,
    status: 'active',
    joiningDate: '2023-06-01',
    createdAt: new Date().toISOString(),
  });
  const empDev = store.insert('employees', {
    id: uuidv4(),
    tenantId: 'default',
    userId: emp1User.id,
    name: emp1User.name,
    email: emp1User.email,
    role: 'employee',
    department: 'Engineering',
    skills: ['react', 'node', 'sql'],
    grade: 'Junior',
    managerId: empManager.id,
    status: 'active',
    joiningDate: '2024-02-15',
    createdAt: new Date().toISOString(),
  });

  const project = store.insert('projects', {
    id: uuidv4(),
    tenantId: 'default',
    name: 'Company Management App MVP',
    description: 'Build and launch the internal MVP',
    department: 'Engineering',
    managerId: empManager.id,
    startDate: '2026-07-01',
    endDate: '2026-09-15',
    budget: 500000,
    actualCost: 120000,
    status: 'in_progress',
    createdBy: owner.id,
    createdAt: new Date().toISOString(),
  });

  store.insert('tasks', {
    id: uuidv4(),
    tenantId: 'default',
    projectId: project.id,
    title: 'Design database schema',
    description: 'Finalize ERD for employees, tasks, projects',
    assignees: [empDev.id],
    priority: 'high',
    status: 'done',
    dueDate: '2026-07-10',
    estimateHours: 8,
    actualHours: 6,
    createdBy: manager.id,
    createdAt: new Date().toISOString(),
  });
  store.insert('tasks', {
    id: uuidv4(),
    tenantId: 'default',
    projectId: project.id,
    title: 'Build authentication API',
    description: 'JWT auth, roles, register/login',
    assignees: [empDev.id],
    priority: 'high',
    status: 'in_progress',
    dueDate: '2026-07-20',
    estimateHours: 12,
    actualHours: 5,
    createdBy: manager.id,
    createdAt: new Date().toISOString(),
  });
  store.insert('tasks', {
    id: uuidv4(),
    tenantId: 'default',
    projectId: project.id,
    title: 'Design dashboard UI',
    description: 'Owner dashboard wireframes and React components',
    assignees: [empManager.id],
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-07-25',
    estimateHours: 10,
    actualHours: 0,
    createdBy: manager.id,
    createdAt: new Date().toISOString(),
  });

  store.insert('attendance', {
    id: uuidv4(),
    employeeId: empDev.id,
    date: new Date().toISOString().slice(0, 10),
    checkIn: new Date().toISOString(),
    checkOut: null,
    status: 'present',
    leaveType: null,
  });

  store.insert('company', {
    id: 'default',
    name: 'Acme India Pvt Ltd',
    logoUrl: null,
    locations: ['Mumbai, India'],
    history: [
      { title: 'Company founded', date: '2023-01-01', description: 'Started operations in Mumbai' },
    ],
  });

  console.log('Seed complete. Demo accounts (password: password123):');
  console.log('  Owner:   owner@company.com');
  console.log('  Manager: manager@company.com');
  console.log('  Employee: rahul@company.com');
}

seed();
