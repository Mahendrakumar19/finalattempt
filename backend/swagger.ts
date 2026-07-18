import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Final Attempt API Docs',
      version: '1.0.0',
      description: 'Backend REST API swagger UI endpoint mapping documentation details sheet.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          summary: 'Register a new BPSC/UPSC student',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fullName', 'email', 'mobile', 'password'],
                  properties: {
                    fullName: { type: 'string', example: 'Mahendra Kumar' },
                    email: { type: 'string', example: 'mahendra@gmail.com' },
                    mobile: { type: 'string', example: '9876543210' },
                    password: { type: 'string', example: 'Password123' },
                    targetExam: { type: 'string', example: 'BPSC Foundation Batch' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Registration Successful.' }
          }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Log in with email & password',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'mahendra.mk174@gmail.com' },
                    password: { type: 'string', example: 'Mahendra@10' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Successful login (returns accessToken & refreshToken cookie)' }
          }
        }
      },
      '/api/auth/send-otp': {
        post: {
          summary: 'Send Verification or Login OTP',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['identifier', 'type', 'purpose'],
                  properties: {
                    identifier: { type: 'string', example: 'mahendra.mk174@gmail.com' },
                    type: { type: 'string', enum: ['email', 'mobile'], example: 'email' },
                    purpose: { type: 'string', enum: ['login', 'register', 'reset', 'verify'], example: 'login' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'OTP sent' }
          }
        }
      },
      '/api/auth/verify-otp': {
        post: {
          summary: 'Verify OTP code',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['identifier', 'type', 'otp', 'purpose'],
                  properties: {
                    identifier: { type: 'string', example: 'mahendra.mk174@gmail.com' },
                    type: { type: 'string', enum: ['email', 'mobile'], example: 'email' },
                    otp: { type: 'string', example: '123456' },
                    purpose: { type: 'string', enum: ['login', 'register', 'reset', 'verify'], example: 'login' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'OTP verified successfully' }
          }
        }
      },
      '/api/auth/refresh': {
        post: {
          summary: 'Refresh JWT Access Token using HTTP-only Refresh Token cookie',
          tags: ['Authentication'],
          responses: {
            200: { description: 'Rotated Access Token generated' }
          }
        }
      },
      '/api/auth/logout': {
        post: {
          summary: 'Log out current session',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Logged out successfully' }
          }
        }
      },
      '/api/auth/me': {
        get: {
          summary: 'Get active logged-in user profile detail',
          tags: ['Authentication'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Returns authenticated user info' }
          }
        }
      },
      '/api/lms/courses': {
        get: {
          summary: 'List all published courses',
          tags: ['LMS Curriculum'],
          responses: {
            200: { description: 'Returns list of courses' }
          }
        },
        post: {
          summary: 'Create a new course',
          tags: ['LMS Curriculum'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['id', 'title', 'slug', 'category', 'description', 'fee'],
                  properties: {
                    id: { type: 'string', example: 'test-course-swagger' },
                    title: { type: 'string', example: 'Swagger BPSC Test' },
                    slug: { type: 'string', example: 'swagger-bpsc-test' },
                    category: { type: 'string', example: 'BPSC' },
                    description: { type: 'string', example: 'Course created from swagger interface' },
                    fee: { type: 'number', example: 4999 },
                    isPublished: { type: 'boolean', example: true }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Course created successfully' }
          }
        }
      },
      '/api/lms/courses/{id}': {
        get: {
          summary: 'Get single course details',
          tags: ['LMS Curriculum'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Returns course detail' }
          }
        }
      },
      '/api/lms/courses/{id}/sections': {
        get: {
          summary: 'Get course curriculum sections & lessons',
          tags: ['LMS Curriculum'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Returns sections list with locked/unlocked lesson URLs' }
          }
        }
      },
      '/api/lms/enrollments/me': {
        get: {
          summary: 'Get my enrolled courses',
          tags: ['LMS Curriculum'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Returns enrollments details list' }
          }
        }
      },
      '/api/lms/enrollments': {
        post: {
          summary: 'Directly enroll student in a course (for payment hook or manual addition)',
          tags: ['LMS Curriculum'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['courseId'],
                  properties: {
                    courseId: { type: 'string', example: 'bpsc-foundation' },
                    paymentOrderId: { type: 'string', example: 'seeding_order_123' },
                    amountPaid: { type: 'number', example: 500000 }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Enrolled successfully' }
          }
        }
      },
      '/api/lms/progress': {
        post: {
          summary: 'Save student progress tracking positions',
          tags: ['LMS Curriculum'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['courseId', 'lessonId'],
                  properties: {
                    courseId: { type: 'string', example: 'bpsc-foundation' },
                    lessonId: { type: 'string', example: 'les-bpsc-foundation-1-1' },
                    completed: { type: 'boolean', example: true },
                    watchedSeconds: { type: 'number', example: 500 },
                    totalSeconds: { type: 'number', example: 1800 },
                    lastPosition: { type: 'number', example: 500 }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Progress saved successfully' }
          }
        }
      },
      '/api/lms/analytics/me': {
        get: {
          summary: 'Get dynamic aggregated performance stats',
          tags: ['LMS Curriculum'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Returns dynamic course completion & accuracy array' }
          }
        }
      },
      '/api/quizzes/{quizId}': {
        get: {
          summary: 'Get details of a quiz',
          tags: ['Quizzes Engine'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Returns quiz metadata' }
          }
        }
      },
      '/api/quizzes/{quizId}/start': {
        get: {
          summary: 'Start quiz (fetch cheat-protected questions)',
          tags: ['Quizzes Engine'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Returns quiz with clean questions' }
          }
        }
      },
      '/api/quizzes/{quizId}/submit': {
        post: {
          summary: 'Submit mock test answers',
          tags: ['Quizzes Engine'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['answers'],
                  properties: {
                    answers: {
                      type: 'object',
                      example: { 'q-bpsc-foundation-1-1': 'A', 'q-bpsc-foundation-1-2': 'C' }
                    },
                    timeTakenSecs: { type: 'number', example: 120 }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Returns attempt calculation results' }
          }
        }
      },
      '/api/quizzes/{quizId}/leaderboard': {
        get: {
          summary: 'Get quiz attempts leaderboard ranking',
          tags: ['Quizzes Engine'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'quizId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Returns ranking list' }
          }
        }
      },
      '/api/payments/create-order': {
        post: {
          summary: 'Initiate Razorpay payment checkout order',
          tags: ['Razorpay Payments'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['courseId'],
                  properties: {
                    courseId: { type: 'string', example: 'bpsc-foundation' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Returns Razorpay payload parameters' }
          }
        }
      },
      '/api/payments/verify': {
        post: {
          summary: 'Verify transaction signature and complete enrollment',
          tags: ['Razorpay Payments'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['razorpayPaymentId', 'razorpayOrderId', 'razorpaySignature', 'courseId'],
                  properties: {
                    razorpayPaymentId: { type: 'string', example: 'pay_Nj83921jns' },
                    razorpayOrderId: { type: 'string', example: 'order_Kj9381knsd' },
                    razorpaySignature: { type: 'string', example: '9a8b7c6d5e...' },
                    courseId: { type: 'string', example: 'bpsc-foundation' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Payment verified & enrollment activated' }
          }
        }
      }
    }
  },
  apis: [],
};

export default swaggerJsdoc(options);