jest.mock('./../../../src/infrastructure/config', () => require('./../../utils').configMockFactory());
jest.mock('./../../../src/infrastructure/logger', () => require('./../../utils').loggerMockFactory());
jest.mock('./../../../src/app/services/utils');
jest.mock('./../../../src/infrastructure/access', () => {
  return {
    updateUserService: jest.fn(),
    updateInvitationService: jest.fn(),
    listRolesOfService: jest.fn(),
  };
});

jest.mock('./../../../src/infrastructure/applications', () => {
  return {
    getServiceById: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/organisations', () => {
  return {
    getOrganisationByIdV2: jest.fn(),
  };
});

const logger = require('./../../../src/infrastructure/logger');
const { getRequestMock, getResponseMock } = require('./../../utils');
const { updateInvitationService, updateUserService } = require('./../../../src/infrastructure/access');
const { listRolesOfService } = require('./../../../src/infrastructure/access');
const { getOrganisationByIdV2 } = require('./../../../src/infrastructure/organisations');
const { getUserDetails } = require('./../../../src/app/services/utils');
const { getServiceById } = require('./../../../src/infrastructure/applications');
const res = getResponseMock();

describe('when editing a service for a user', () => {

  let req;

  let postConfirmEditService;

  beforeEach(() => {
    req = getRequestMock({
      params: {
        uid: 'user1',
        oid: 'org1',
        sid: 'service1',
      },
      session: {
        service: {
          roles: ['role_id']
        },
      },
    });


    getServiceById.mockReset();
    getServiceById.mockReturnValue({
      id: 'service1',
      dateActivated: '10/10/2018',
      name: 'service name',
      status: 'active',
    });

    listRolesOfService.mockReset();
    listRolesOfService.mockReturnValue([{
      code: 'role_code',
      id: 'role_id',
      name: 'role_name',
      status: {
        id: 'status_id'
      },
    }]);

    getUserDetails.mockReset();
    getUserDetails.mockReturnValue({
      id: 'user1',
    });

    getOrganisationByIdV2.mockReset();
    getOrganisationByIdV2.mockReturnValue({
      id: 'org1',
      name: 'org name',
    });

    updateUserService.mockReset();
    updateInvitationService.mockReset();

    res.mockResetAll();

    postConfirmEditService = require('./../../../src/app/services/confirmEditService').post;
  });

  it('then it should edit service for invitation if request for invitation', async () => {
    req.params.uid = 'inv-invite1';

    await postConfirmEditService(req, res);

    expect(updateInvitationService.mock.calls).toHaveLength(1);
    expect(updateInvitationService.mock.calls[0][0]).toBe('invite1');
    expect(updateInvitationService.mock.calls[0][1]).toBe('service1');
    expect(updateInvitationService.mock.calls[0][2]).toBe('org1');
    expect(updateInvitationService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(updateInvitationService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should edit service for user if request for user', async () => {

    await postConfirmEditService(req, res);

    expect(updateUserService.mock.calls).toHaveLength(1);
    expect(updateUserService.mock.calls[0][0]).toBe('user1');
    expect(updateUserService.mock.calls[0][1]).toBe('service1');
    expect(updateUserService.mock.calls[0][2]).toBe('org1');
    expect(updateUserService.mock.calls[0][3]).toEqual(["role_id"]);
    expect(updateUserService.mock.calls[0][4]).toBe('correlationId');
  });

  it('then it should should audit service being edited', async () => {
    await postConfirmEditService(req, res);

    expect(logger.audit.mock.calls).toHaveLength(1);
    expect(logger.audit.mock.calls[0][0]).toBe('user@unit.test (id: user1) updated service service name for organisation org name (id: org1) for user undefined (id: user1)');
    expect(logger.audit.mock.calls[0][1]).toMatchObject({
      type: 'manage',
      subType: 'user-service-updated',
      userId: 'user1',
      userEmail: 'user@unit.test',
      editedUser: 'user1',
      editedFields: [
        {
          name: 'update_service',
          newValue: ['role_id'],
        }
      ],
    });
  });

  it('then it should redirect to user details', async () => {
    await postConfirmEditService(req, res);

    expect(res.redirect.mock.calls).toHaveLength(1);
    expect(res.redirect.mock.calls[0][0]).toBe(`/services/${req.params.sid}/users/${req.params.uid}/organisations`);
  });

  it('then a flash message is shown to the user', async () => {
    await postConfirmEditService(req, res);

    expect(res.flash.mock.calls).toHaveLength(1);
    expect(res.flash.mock.calls[0][0]).toBe('info');
    expect(res.flash.mock.calls[0][1]).toBe(`Service roles updated successfully`)
  });
});
