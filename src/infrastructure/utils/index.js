const { getSingleUserService } = require('../../infrastructure/access');
const config = require('../../infrastructure/config');

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.redirectUrl = req.originalUrl;
  return res.status(302).redirect('/auth');
};

const isManageUser = (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    return next();
  }
  return res.status(401).render('errors/views/notAuthorised');
};

const isManageUserForService = (req, res, next) => {
  if (req.userServices && req.userServices.roles.length > 0) {
    const services = [];
    for (let i = 0; i < req.userServices.roles.length; i++) {
      const role = req.userServices.roles[i];
      services.push({id: role.code.substr(0, role.code.indexOf('_'))})
    }
    if (services.find(x => x.id.toLowerCase() === req.params.sid.toLowerCase())) {
      return next();
    }
  }
  return res.status(401).render('errors/views/notAuthorised');
};

const hasRole = (role) => {
  return (req, res, next) => {
    if (req.userServices && req.userServices.roles.length > 0) {
      const services = req.userServices.roles.map((role) => ({
        role: role.code.split('_')[1],
      }));
      if (services.find(x => x.role === role)) {
        return next();
      }
    }
    return res.status(401).render('errors/views/notAuthorised');
  }
};

const getUserDisplayName = user => `${user.given_name || ''} ${user.family_name || ''}`.trim();

const setUserContext = async (req, res, next) => {
  if (req.user) {
    res.locals.user = req.user;
    res.locals.displayName = getUserDisplayName(req.user);
    req.userServices = await getSingleUserService(req.user.sub, config.access.identifiers.service, config.access.identifiers.organisation, req.id);
  }
  next();
};

const mapUserStatus = (status, changedOn = null) => {
  // TODO: use userStatusMap
  if (status === -2) {
    return { id: -2, description: 'Deactivated Invitation', changedOn };
  }
  if (status === -1) {
    return { id: -1, description: 'Invited', changedOn };
  }
  if (status === 0) {
    return { id: 0, description: 'Deactivated', changedOn };
  }
  return { id: 1, description: 'Active', changedOn };
};

module.exports = {
  isLoggedIn,
  setUserContext,
  isManageUser,
  isManageUserForService,
  hasRole,
  mapUserStatus,
};
