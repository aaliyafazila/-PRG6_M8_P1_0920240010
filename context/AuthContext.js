import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userData] = useState({
        nim_mhs: "0920240015",
        nama: "Alyza Septia Anjani"
    });

    return (
        <AuthContext.Provider value={{ userData }}>
            {children}
        </AuthContext.Provider>
    );
};