import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../services/firebase';
import { AppUser } from '../types/finance';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          const now = new Date().toISOString();
          const isAdminUser = user.email === 'dialloannoir22@gmail.com';

          if (snap.exists()) {
            const data = snap.data() as AppUser;
            setAppUser(data);
          } else {
            // Premier profil pour cet utilisateur
            const newProfile: AppUser = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Opérateur Caisse',
              photoURL: user.photoURL || undefined,
              role: isAdminUser ? 'admin' : 'cashier',
              agencyName: 'AnnoirFinance Multiservices',
              createdAt: now,
              updatedAt: now,
            };

            await setDoc(userDocRef, newProfile);
            setAppUser(newProfile);
          }
        } catch (err) {
          console.error('Erreur synchronisation profil utilisateur:', err);
          // Fallback minimal
          setAppUser({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Utilisateur',
            photoURL: user.photoURL || undefined,
            role: user.email === 'dialloannoir22@gmail.com' ? 'admin' : 'cashier',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        setAppUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Erreur connexion Google:', err);
      // Ignorer si popup fermée par l'utilisateur
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        throw err;
      }
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const isAdmin = appUser?.role === 'admin' || currentUser?.email === 'dialloannoir22@gmail.com';

  return (
    <AuthContext.Provider value={{ currentUser, appUser, isAdmin, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein de AuthProvider');
  }
  return context;
};
