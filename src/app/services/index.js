'use strict';

const express = require('express');
const logger = require('../../infrastructure/logger');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const { isLoggedIn, isManageUserForService } = require('../../infrastructure/utils');

const { getDashboard } = require('./getDashboard');
const { getServiceConfig, postServiceConfig } = require('./serviceConfig');
const { get: getSelectService, post: postSelectService } = require('./selectService');
const { get: getServiceBanners, post: postServiceBanners } = require('./serviceBanners');
const { get: getNewServiceBanners, post: postNewServiceBanners } = require('./newServiceBanner');

const router = express.Router({ mergeParams: true });

const services = (csrf) => {
  logger.info('Mounting services routes');
  router.use(isLoggedIn);

  router.get('/', asyncWrapper((req, res) => {
    if (!req.userServices || req.userServices.roles.length === 0) {
      return res.status(401).render('errors/views/notAuthorised');
    }
    if (req.userServices.roles.length === 1) {
      const role = req.userServices.roles[0];
      return res.redirect(`services/${role.code.substr(0, role.code.indexOf('_'))}`)
    } else {
      return res.redirect(`services/select-service`);
    }
  }));

  router.get('/select-service', csrf, asyncWrapper(getSelectService));
  router.post('/select-service', csrf, asyncWrapper(postSelectService));

  router.get('/:sid', csrf, isManageUserForService, asyncWrapper(getDashboard));

  router.get('/:sid/service-configuration', csrf, isManageUserForService, asyncWrapper(getServiceConfig));
  router.post('/:sid/service-configuration', csrf, isManageUserForService, asyncWrapper(postServiceConfig));

  router.get('/:sid/service-banners', csrf, isManageUserForService, asyncWrapper(getServiceBanners));
  router.post('/:sid/service-banners', csrf, isManageUserForService, asyncWrapper(postServiceBanners));

  router.get('/:sid/service-banners/new-banner', csrf, isManageUserForService, asyncWrapper(getNewServiceBanners));
  router.post('/:sid/service-banners/new-banner', csrf, isManageUserForService, asyncWrapper(postNewServiceBanners));

  router.get('/:sid/service-banners/:bid', csrf, isManageUserForService, asyncWrapper(getNewServiceBanners));
  router.post('/:sid/service-banners/:bid', csrf, isManageUserForService, asyncWrapper(postNewServiceBanners));

  return router;
};

module.exports = services;
