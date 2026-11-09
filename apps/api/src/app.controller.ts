import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'operational',
      service: 'Mastera Core API',
      version: '3.4.0',
      adminPortalUrl: 'http://localhost:3001',
      message:
        'Mastera Backend API is live. For the Admin Web Portal, open http://localhost:3001 in your browser.',
      endpoints: {
        adminPortal: 'http://localhost:3001',
        catalogCourses: '/catalog/courses',
        catalogUniversities: '/catalog/universities',
        catalogPrograms: '/catalog/programs',
        studentsDirectory: '/students',
        ordersPayments: '/orders/payments',
        chapters: '/content/chapters',
        examSets: '/assessments/exam-sets',
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
