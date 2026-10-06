/**
 * Authentication Middleware
 * 
 * Simple auth middleware to extract user and resolve persona.
 */
const authMiddleware = (req, res, next) => {
  // In a real app, this would verify a JWT or session
  const userId = req.headers['x-user-id'] || 'default-user';
  const persona = req.headers['x-user-persona'] || 'developer';
  
  // Resolve persona roles
  const validPersonas = ['management', 'project_manager', 'developer', 'support', 'architect'];
  
  const userPersona = validPersonas.includes(persona.toLowerCase()) 
    ? persona.toLowerCase() 
    : 'developer';

  req.user = {
    id: userId,
    persona: userPersona,
    roles: [userPersona] // Assign the persona as a role for now
  };
  
  next();
};

module.exports = { authMiddleware };
