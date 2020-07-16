import { TestingModule, Test } from '@nestjs/testing';
import { createMock } from '@golevelup/nestjs-testing';
import { Client, Issuer } from 'openid-client';
import { JWKS } from 'jose';
import { JwtService } from '@nestjs/jwt';
import { OidcModule } from './oidc.module';
import { OidcHelpers } from './utils';
import {
  MOCK_OIDC_MODULE_OPTIONS,
  MOCK_CLIENT_INSTANCE,
  MOCK_ISSUER_INSTANCE,
} from './mocks';
import { MiddlewareConsumer } from '@nestjs/common';

const keyStore = new JWKS.KeyStore([]);
const MockOidcHelpers = new OidcHelpers(
  keyStore,
  MOCK_CLIENT_INSTANCE,
  MOCK_OIDC_MODULE_OPTIONS,
);

describe('OidcModule', () => {
  describe('register sync', () => {
    let module: TestingModule;

    beforeEach(async () => {
      const IssuerMock = MOCK_ISSUER_INSTANCE;
      IssuerMock.keystore = jest.fn();
      jest
        .spyOn(Issuer, 'discover')
        .mockImplementation(() => Promise.resolve(IssuerMock));
      module = await Test.createTestingModule({
        imports: [OidcModule.forRoot(MOCK_OIDC_MODULE_OPTIONS)],
      }).compile();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('register async', () => {
    let module: TestingModule;

    beforeEach(async () => {
      const IssuerMock = MOCK_ISSUER_INSTANCE;
      IssuerMock.keystore = jest.fn();
      jest
        .spyOn(Issuer, 'discover')
        .mockImplementation(() => Promise.resolve(IssuerMock));
      module = await Test.createTestingModule({
        imports: [
          OidcModule.forRootAsync({
            useFactory: async () => MOCK_OIDC_MODULE_OPTIONS,
          }),
        ],
      }).compile();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('register async with useClass', () => {
    let module: TestingModule;

    class oidcModuleOptions {
      createModuleConfig() {
        MOCK_OIDC_MODULE_OPTIONS.defaultHttpOptions = {
          timeout: 10000,
        };
        MOCK_OIDC_MODULE_OPTIONS.authParams.nonce = 'true';
        return MOCK_OIDC_MODULE_OPTIONS;
      }
    }

    beforeEach(async () => {
      const IssuerMock = MOCK_ISSUER_INSTANCE;
      IssuerMock.keystore = jest.fn();
      jest
        .spyOn(Issuer, 'discover')
        .mockImplementation(() => Promise.resolve(IssuerMock));
      module = await Test.createTestingModule({
        imports: [
          OidcModule.forRootAsync({
            useClass: oidcModuleOptions,
          }),
        ],
      }).compile();
    });

    it('should be defined', () => {
      expect(module).toBeDefined();
    });
  });

  describe('simulate error fetching issuer', () => {
    let module: TestingModule;
    let mockExit;

    class oidcModuleOptions {
      createModuleConfig() {
        return MOCK_OIDC_MODULE_OPTIONS;
      }
    }

    beforeEach(async () => {
      const IssuerMock = MOCK_ISSUER_INSTANCE;
      IssuerMock.keystore = jest.fn();
      jest.spyOn(Issuer, 'discover').mockImplementation(() => Promise.reject());

      mockExit = jest
        .spyOn(process, 'exit')
        .mockImplementation((code?: number): never => {
          return undefined as never;
        });

      module = await Test.createTestingModule({
        imports: [
          OidcModule.forRootAsync({
            useClass: oidcModuleOptions,
          }),
        ],
      }).compile();
    });

    it('should terminate process', () => {
      expect(mockExit).toHaveBeenCalled();
    });
  });

  describe('configure middleware', () => {
    it('should be able to configure', () => {
      const module = new OidcModule();
      const consumer = createMock<MiddlewareConsumer>();
      module.configure(consumer);
      expect(module).toBeTruthy();
    });
  });
});