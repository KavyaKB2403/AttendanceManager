import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { settingsService } from "../lib/settings"; // Import settingsService

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  companyLogoUrl?: string; // Add optional companyLogoUrl
  lastLoginAt?: string; // Add optional lastLoginAt
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  role: 'admin' | 'staff' | null;
  isAuthenticated: boolean;
  companyLogoUrl: string | null; // Add companyLogoUrl to context type
  companyName: string | null; // Add companyName to context type
  lastLoginAt: string | null; // Add lastLoginAt to context type
  signIn: (newToken: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null); // New state for company logo URL
  const [companyName, setCompanyName] = useState<string | null>(null); // New state for company name
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null); // New state for last login timestamp

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const currentUser: User = {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          role: decoded.admin ? 'admin' : 'staff', // Determine role based on 'admin' field
          companyLogoUrl: decoded.company_logo_url || null, // Get company logo URL from token
          lastLoginAt: decoded.last_login_at || null, // Get last login timestamp from token
        };
        setUser(currentUser);
        setRole(currentUser.role);
        setCompanyLogoUrl(currentUser.companyLogoUrl); // Set company logo URL
        setLastLoginAt(currentUser.lastLoginAt); // Set last login timestamp
        setIsAuthenticated(true);
        localStorage.setItem('token', token);

        // Fetch company settings to get the company name and logo URL
        const fetchCompanySettings = async () => {
          try {
            const settings = await settingsService.getSettings();
            if (settings) {
              setCompanyName(settings.company_name || null);
              setCompanyLogoUrl(settings.company_logo_url || null); // Update company logo URL from settings
            }
          } catch (error) {
            console.error("Failed to fetch company settings:", error);
          }
        };
        fetchCompanySettings();
      } catch (error) {
        console.error('Failed to decode token:', error);
        // If token is invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setRole(null);
      setCompanyLogoUrl(null); // Clear company logo URL
      setCompanyName(null); // Clear company name
      setLastLoginAt(null); // Clear last login timestamp
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    }
  }, [token]);

  const signIn = (newToken: string) => {
    setToken(newToken);
  };

  const signOut = () => {
    setToken(null);
    setUser(null);
    setRole(null);
    setCompanyLogoUrl(null); // Clear company logo URL
    setCompanyName(null); // Clear company name
    setLastLoginAt(null); // Clear last login timestamp
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, role, isAuthenticated, companyLogoUrl, companyName, lastLoginAt, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
