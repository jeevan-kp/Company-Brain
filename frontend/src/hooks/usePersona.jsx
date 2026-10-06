import React, { createContext, useContext, useState, useEffect } from 'react';
import { setPersonaHeader } from '../utils/api';
import { PERSONAS } from '../utils/constants';

const PersonaContext = createContext();

export const PersonaProvider = ({ children }) => {
  const [persona, setPersona] = useState(() => {
    return localStorage.getItem('company_brain_persona') || PERSONAS[0].id;
  });

  useEffect(() => {
    localStorage.setItem('company_brain_persona', persona);
    setPersonaHeader(persona);
  }, [persona]);

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => useContext(PersonaContext);
