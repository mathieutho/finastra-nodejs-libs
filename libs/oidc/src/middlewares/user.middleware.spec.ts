import { JWT } from 'jose';
import { UserMiddleware } from './user.middleware';
import { createMock } from '@golevelup/nestjs-testing';
import { Request, Response } from 'express';
import { MOCK_OIDC_MODULE_OPTIONS, MockOidcService } from '../mocks';
import { TestingModule, Test } from '@nestjs/testing';
import { OidcService } from '../services';
import { JWKS } from 'jose';
const utils = require('../utils');

describe('User Middleware', () => {
  let middleware: UserMiddleware;
  let service;

  describe('no token store', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserMiddleware,
          {
            provide: OidcService,
            useValue: MockOidcService,
          },
        ],
      }).compile();

      middleware = module.get<UserMiddleware>(UserMiddleware);
      service = module.get<OidcService>(OidcService);
    });

    it('should add channel in user in request when there is no token store if channel in url with tenant and channel b2c ', async () => {
      const req = createMock<Request>();
      req['params'] = {
        0: 'tenant/b2c',
      };
      const res = createMock<Response>();
      const next = jest.fn();
      jest.spyOn(JWT, 'verify').mockReturnValue({
        username: 'John Doe',
      } as any);

      service.options = MOCK_OIDC_MODULE_OPTIONS;

      utils.authenticateExternalIdps = jest
        .fn()
        .mockReturnValue(service.options.externalIdps);

      jest.spyOn(service, 'createStrategy').mockImplementation(() => {
        service.tokenStores = {
          'tenant.b2c': new JWKS.KeyStore([]),
        };
        return Promise.resolve({});
      });

      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      req.headers.authorization = `Bearer ${token}`;
      await middleware.use(req, res, next);
      expect(req.user['userinfo'].channel).toEqual('b2c');
      expect(req.user['userinfo']).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('config with external idp', () => {
    beforeEach(async () => {
      const mockOidcService = {
        ...MockOidcService,
        tokenStores: {
          'tenant.b2c': new JWKS.KeyStore([]),
        },
      };
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserMiddleware,
          {
            provide: OidcService,
            useValue: mockOidcService,
          },
        ],
      }).compile();

      middleware = module.get<UserMiddleware>(UserMiddleware);
      service = module.get<OidcService>(OidcService);
    });

    it('should not do anything if no bearer', () => {
      const req = createMock<Request>();
      const res = createMock<Response>();
      const next = jest.fn();
      middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should add user in request', async () => {
      const req = createMock<Request>();
      const res = createMock<Response>();
      const next = jest.fn();
      jest.spyOn(JWT, 'verify').mockReturnValue({
        username: 'John Doe',
      } as any);

      service.options = MOCK_OIDC_MODULE_OPTIONS;

      utils.authenticateExternalIdps = jest
        .fn()
        .mockReturnValue(service.options.externalIdps);

      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      req.headers.authorization = `Bearer ${token}`;

      await middleware.use(req, res, next);
      expect(req.user['authTokens']).toBe(service.options.externalIdps);
      expect(req.user['userinfo']).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('no external idp', () => {
    const moduleOptions = { ...MOCK_OIDC_MODULE_OPTIONS };
    delete moduleOptions.externalIdps;
    const mockOidcServiceWithoutExtIdp = {
      ...MockOidcService,
      options: moduleOptions,
      tokenStores: {
        'tenant.b2c': new JWKS.KeyStore([]),
      },
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UserMiddleware,
          {
            provide: OidcService,
            useValue: mockOidcServiceWithoutExtIdp,
          },
        ],
      }).compile();
      middleware = module.get<UserMiddleware>(UserMiddleware);
    });

    it('should add user in request', async () => {
      const req = createMock<Request>();
      const res = createMock<Response>();
      const next = jest.fn();
      jest.spyOn(JWT, 'verify').mockReturnValue({
        username: 'John Doe',
      } as any);

      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      req.headers.authorization = `Bearer ${token}`;
      await middleware.use(req, res, next);
      expect(req.user['userinfo']).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });

    it('should add user in request', async () => {
      const req = createMock<Request>();
      req['params'] = {
        0: 'tenant/test',
      };
      const res = createMock<Response>();
      const next = jest.fn();
      jest.spyOn(JWT, 'verify').mockReturnValue({
        username: 'John Doe',
      } as any);
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      req.headers.authorization = `Bearer ${token}`;
      await middleware.use(req, res, next);
      expect(req.user['userinfo']).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });

    it('should add channel in user in request if channel in url with tenant and channel b2e', async () => {
      const req = createMock<Request>();
      req['params'] = {
        0: 'tenant/b2e',
      };
      const res = createMock<Response>();
      const next = jest.fn();
      jest.spyOn(JWT, 'verify').mockReturnValue({
        username: 'John Doe',
      } as any);
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      req.headers.authorization = `Bearer ${token}`;
      await middleware.use(req, res, next);
      expect(req.user['userinfo'].channel).toEqual('b2e');
      expect(req.user['userinfo']).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });

    it('should add channel in user in request if channel in url with tenant and channel b2c', async () => {
      const req = createMock<Request>();
      req['params'] = {
        0: 'tenant/b2c',
      };
      const res = createMock<Response>();
      const next = jest.fn();
      jest.spyOn(JWT, 'verify').mockReturnValue({
        username: 'John Doe',
      } as any);
      const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
      req.headers.authorization = `Bearer ${token}`;
      await middleware.use(req, res, next);
      expect(req.user['userinfo'].channel).toEqual('b2c');
      expect(req.user['userinfo']).toBeTruthy();
      expect(next).toHaveBeenCalled();
    });
  });
});
